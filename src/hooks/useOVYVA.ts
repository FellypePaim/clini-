import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import type { OvyvaConversation, OvyvaConfig, OvyvaMessage } from '../types/ovyva'

export function useOVYVA() {
  const { user } = useAuthStore()
  const clinica_id = (user as any)?.user_metadata?.clinica_id

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
      // Map to frontend expected shape
      const mapped = data.map((c: any) => ({
        ...c,
        status: c.status || 'ia_ativa',
        mensagens: [] // Preenchido lazy
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

  // Realtime subscription (Simplificado)
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
  }, [clinica_id, activeConversation, fetchConversations])

  // Buscar mensagens detalhadas
  const loadMessages = useCallback(async (conversa_id: string) => {
    const { data } = await supabase
      .from('ovyva_mensagens')
      .select('*')
      .eq('conversa_id', conversa_id)
      .order('created_at', { ascending: true })

    if (data) {
      const mappedData = data.map((m: any) => ({ ...m, conteudo: m.conteudo || '' }))
      setConversations(prev => prev.map(c => c.id === conversa_id ? { ...c, mensagens: mappedData as OvyvaMessage[] } : c))
      // Mark as read se houver
      const unreadIds = data.filter(m => !m.lida && m.remetente === 'paciente').map(m => m.id)
      if (unreadIds.length > 0) {
        supabase.from('ovyva_mensagens').update({ lida: true }).in('id', unreadIds).then()
      }
    }
  }, [])

  // Selecionar conversa
  const selectConversation = useCallback((conv: OvyvaConversation) => {
    setActiveConversation(conv)
    loadMessages(conv.id)
  }, [loadMessages])

  // Enviar mensagem como Humano
  const sendMessage = useCallback(async (conversationId: string, texto: string) => {
    await supabase.from('ovyva_mensagens').insert({
      conversa_id: conversationId,
      remetente: 'humano',
      conteudo: texto,
      sessao_id: conversations.find(c => c.id === conversationId)?.sessao_atual_id,
      sessao_inicio: false,
      lida: true
    })
    loadMessages(conversationId)
  }, [conversations, loadMessages])

  // Controles
  const takeoverConversation = useCallback(async (conversationId: string) => {
    await supabase.from('ovyva_conversas').update({ status: 'atendido_humano' }).eq('id', conversationId)
    setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, status: 'atendido_humano' } : c))
  }, [])

  const returnToAI = useCallback(async (conversationId: string) => {
    await supabase.from('ovyva_conversas' as any).update({ status: 'ia_ativa' }).eq('id', conversationId)
    setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, status: 'ia_ativa' } : c))
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
