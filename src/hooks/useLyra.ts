import React, { useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import type { LyraConversation, LyraConfig, LyraMessage } from '../types/lyra'

export function useLyra() {
  const { user } = useAuthStore()
  const clinica_id = user?.clinicaId  // corrigido: usar clinicaId do store, não user_metadata

  const [conversations, setConversations] = useState<LyraConversation[]>([])
  const [activeConversation, setActiveConversation] = useState<LyraConversation | null>(null)
  const [config, setConfig] = useState<LyraConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Buscar todas as conversas da view
  const fetchConversations = useCallback(async () => {
    if (!clinica_id) return
    setIsLoading(true)
    const { data, error } = await supabase
      .from('lyra_conversas_com_preview' as any)
      .select('*')
      .eq('clinica_id', clinica_id)
      .order('ultimo_contato', { ascending: false })

    if (!error && data) {
      const mapped = data.map((c: any) => ({
        ...c,
        status: c.status || 'ia_ativa',
        mensagens: []
      }))
      setConversations(mapped)
      // Sincronizar activeConversation com metadata atualizada (preservando mensagens)
      setActiveConversation(prev => {
        if (!prev) return null
        const updated = mapped.find((c: any) => c.id === prev.id)
        if (!updated) return prev
        return { ...updated, mensagens: prev.mensagens }
      })
    }
    setIsLoading(false)
  }, [clinica_id])

  // Buscar configuração LYRA
  const fetchConfig = useCallback(async () => {
    if (!clinica_id) return
    const { data: clinica } = await supabase
      .from('clinicas')
      .select('configuracoes')
      .eq('id', clinica_id)
      .single()

    const lyraConf = (clinica?.configuracoes as any)?.lyra
    if (lyraConf) {
      setConfig({
        aiName: lyraConf.nome_assistente || 'Sofia',
        toneOfVoice: lyraConf.tom_voz || 'cordial',
        workingHours: { start: '08:00', end: '18:00' },
        offHoursAction: 'padrao',
        availableProfessionalsIds: [],
        enabledAppointmentTypes: [],
        minLeadTimeHours: 2,
        clinicInfo: lyraConf.base_conhecimento || '',
        faqs: [],
        templates: []
      })
    }
  }, [clinica_id])

  useEffect(() => {
    fetchConversations()
    fetchConfig()
  }, [fetchConversations, fetchConfig])

  // Buscar mensagens — corrigido: filtra por clinica_id via JOIN com lyra_conversas
  const loadMessages = useCallback(async (conversa_id: string) => {
    if (!clinica_id) return

    // Verifica que a conversa pertence à clínica antes de buscar mensagens
    const { data: conv } = await supabase
      .from('lyra_conversas')
      .select('id')
      .eq('id', conversa_id)
      .eq('clinica_id', clinica_id)
      .single()

    if (!conv) return // conversa não pertence a esta clínica

    const { data } = await supabase
      .from('lyra_mensagens')
      .select('*')
      .eq('conversa_id', conversa_id)
      .order('created_at', { ascending: true })

    if (data) {
      const mappedData = data.map((m: any) => ({ ...m, conteudo: m.conteudo || '' }))
      setConversations(prev => prev.map(c => c.id === conversa_id ? { ...c, mensagens: mappedData as LyraMessage[] } : c))
      const unreadIds = data.filter(m => !m.lida && m.remetente === 'paciente').map(m => m.id)
      if (unreadIds.length > 0) {
        supabase.from('lyra_mensagens').update({ lida: true }).in('id', unreadIds).then(() => { }).catch(() => { })
      }
    }
  }, [clinica_id])

  // Realtime subscription — estável (não depende de activeConversation para evitar recriação)
  const activeConvIdRef = React.useRef<string | null>(null)
  useEffect(() => { activeConvIdRef.current = activeConversation?.id ?? null }, [activeConversation])

  useEffect(() => {
    if (!clinica_id) return
    const sub = supabase
      .channel('lyra_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lyra_mensagens' }, () => {
        fetchConversations()
        if (activeConvIdRef.current) {
          loadMessages(activeConvIdRef.current)
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lyra_conversas' }, () => {
        fetchConversations()
      })
      .subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [clinica_id, fetchConversations, loadMessages])

  // Selecionar conversa
  const selectConversation = useCallback((conv: LyraConversation) => {
    setActiveConversation(conv)
    loadMessages(conv.id)
  }, [loadMessages])

  // Enviar mensagem como Humano — envia via WhatsApp real + salva no banco
  const sendMessage = useCallback(async (conversationId: string, texto: string) => {
    const conv = conversations.find(c => c.id === conversationId)
    if (!conv) return

    // Adicionar assinatura do atendente
    const nomeAtendente = user?.nome?.split(' ')[0] || 'Atendente'
    const textoComAssinatura = `*${nomeAtendente}:*\n${texto}`

    // 1. Salvar no banco com metadata do atendente
    await supabase.from('lyra_mensagens').insert({
      conversa_id: conversationId,
      remetente: 'humano',
      conteudo: textoComAssinatura,
      lida: true,
      metadata: {
        atendente_id: user?.id,
        atendente_nome: user?.nome,
        atendente_role: user?.role,
      },
    })

    // 2. Enviar via WhatsApp real (usando supabase.functions.invoke)
    try {
      const { data: sendResult, error: sendErr } = await supabase.functions.invoke('whatsapp-send', {
        body: {
          numero: conv.contato_telefone,
          texto: textoComAssinatura,
          tipo: 'texto',
          clinica_id,
        },
      })
      if (sendErr) console.error('WhatsApp send error:', sendErr)
      else console.log('WhatsApp enviado:', sendResult)
    } catch (e) {
      console.error('Erro ao enviar WhatsApp:', e)
    }

    loadMessages(conversationId)
  }, [conversations, loadMessages, clinica_id, user])

  const takeoverConversation = useCallback(async (conversationId: string) => {
    if (!clinica_id) return
    await supabase.from('lyra_conversas').update({
      status: 'atendido_humano',
      atendente_id: user?.id || null,
    }).eq('id', conversationId).eq('clinica_id', clinica_id)
    setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, status: 'atendido_humano' } : c))
    setActiveConversation(prev => prev?.id === conversationId ? { ...prev, status: 'atendido_humano' } : prev)
  }, [user, clinica_id])

  const returnToAI = useCallback(async (conversationId: string) => {
    if (!clinica_id) return
    await supabase.from('lyra_conversas').update({
      status: 'ia_ativa',
      atendente_id: null,
    }).eq('id', conversationId).eq('clinica_id', clinica_id)
    setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, status: 'ia_ativa' } : c))
    setActiveConversation(prev => prev?.id === conversationId ? { ...prev, status: 'ia_ativa' } : prev)
  }, [clinica_id])

  const updateAIConfig = useCallback(async (newConfig: Partial<LyraConfig>) => {
    setConfig(prev => prev ? { ...prev, ...newConfig } : null)
  }, [])

  return {
    conversations,
    activeConversation,
    selectConversation,
    config,
    isLoading,
    sendMessage,
    takeoverConversation,
    returnToAI,
    updateAIConfig,
    refreshConversations: fetchConversations
  }
}
