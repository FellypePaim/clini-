import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import type { OvyvaConversation, OvyvaConfig, OvyvaMessage } from '../types/ovyva'

export function useOVYVA() {
  const { user } = useAuthStore()
  const clinica_id = user?.clinicaId  // corrigido: usar clinicaId do store, não user_metadata

  const [conversations, setConversations] = useState<OvyvaConversation[]>([])
  const [activeConversation, setActiveConversation] = useState<OvyvaConversation | null>(null)
  const [config, setConfig] = useState<OvyvaConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Buscar todas as conversas da view
  const fetchConversations = useCallback(async () => {
    if (!clinica_id) return
    setIsLoading(true)
    const { data, error } = await supabase
      .from('ovyva_conversas_com_preview' as any)
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
    }
    setIsLoading(false)
  }, [clinica_id])

  // Buscar configuração OVYVA
  const fetchConfig = useCallback(async () => {
    if (!clinica_id) return
    const { data: clinica } = await supabase
      .from('clinicas')
      .select('configuracoes')
      .eq('id', clinica_id)
      .single()

    const ovyvaConf = (clinica?.configuracoes as any)?.ovyva
    if (ovyvaConf) {
      setConfig({
        aiName: ovyvaConf.nome_assistente || 'Sofia',
        toneOfVoice: ovyvaConf.tom_voz || 'cordial',
        workingHours: { start: '08:00', end: '18:00' },
        offHoursAction: 'padrao',
        availableProfessionalsIds: [],
        enabledAppointmentTypes: [],
        minLeadTimeHours: 2,
        clinicInfo: ovyvaConf.base_conhecimento || '',
        faqs: [],
        templates: []
      })
    }
  }, [clinica_id])

  useEffect(() => {
    fetchConversations()
    fetchConfig()
  }, [fetchConversations, fetchConfig])

  // Buscar mensagens — corrigido: filtra por clinica_id via JOIN com ovyva_conversas
  const loadMessages = useCallback(async (conversa_id: string) => {
    if (!clinica_id) return

    // Verifica que a conversa pertence à clínica antes de buscar mensagens
    const { data: conv } = await supabase
      .from('ovyva_conversas')
      .select('id')
      .eq('id', conversa_id)
      .eq('clinica_id', clinica_id)
      .single()

    if (!conv) return // conversa não pertence a esta clínica

    const { data } = await supabase
      .from('ovyva_mensagens')
      .select('*')
      .eq('conversa_id', conversa_id)
      .order('created_at', { ascending: true })

    if (data) {
      const mappedData = data.map((m: any) => ({ ...m, conteudo: m.conteudo || '' }))
      setConversations(prev => prev.map(c => c.id === conversa_id ? { ...c, mensagens: mappedData as OvyvaMessage[] } : c))
      const unreadIds = data.filter(m => !m.lida && m.remetente === 'paciente').map(m => m.id)
      if (unreadIds.length > 0) {
        supabase.from('ovyva_mensagens').update({ lida: true }).in('id', unreadIds).then(() => { }).catch(() => { })
      }
    }
  }, [clinica_id])

  // Realtime subscription
  useEffect(() => {
    if (!clinica_id) return
    const sub = supabase
      .channel('ovyva_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ovyva_mensagens' }, () => {
        fetchConversations()
        if (activeConversation) {
          loadMessages(activeConversation.id)
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ovyva_conversas' }, () => {
        fetchConversations()
      })
      .subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [clinica_id, activeConversation, fetchConversations, loadMessages])

  // Selecionar conversa
  const selectConversation = useCallback((conv: OvyvaConversation) => {
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

    // 1. Salvar no banco
    await supabase.from('ovyva_mensagens').insert({
      conversa_id: conversationId,
      remetente: 'humano',
      conteudo: textoComAssinatura,
      lida: true,
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
    await supabase.from('ovyva_conversas').update({
      status: 'atendido_humano',
      atendente_id: user?.id || null,
    }).eq('id', conversationId)
    setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, status: 'atendido_humano' } : c))
    setActiveConversation(prev => prev?.id === conversationId ? { ...prev, status: 'atendido_humano' } : prev)
  }, [user])

  const returnToAI = useCallback(async (conversationId: string) => {
    await supabase.from('ovyva_conversas').update({
      status: 'ia_ativa',
      atendente_id: null,
    }).eq('id', conversationId)
    setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, status: 'ia_ativa' } : c))
    setActiveConversation(prev => prev?.id === conversationId ? { ...prev, status: 'ia_ativa' } : prev)
  }, [])

  const updateAIConfig = useCallback(async (newConfig: Partial<OvyvaConfig>) => {
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
