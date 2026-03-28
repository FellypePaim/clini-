import { useState, useCallback, useEffect } from 'react'
import type { Lead, Campaign, LeadStage, LeadOrigin, LeadInteraction } from '../types/verdesk'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { useToast } from './useToast'

export function useVerdesk() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clinicaId = useAuthStore(state => state.user?.clinicaId)
  const { toast } = useToast()

  // ── Leads ─────────────────────────────────────────────────────────────
  const getLeads = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      if (!clinicaId) return

      const { data, error: pbErr } = await supabase
        .from('leads')
        .select('*')
        .eq('clinica_id', clinicaId)
        .order('updated_at', { ascending: false })

      if (pbErr) throw pbErr

      // Mapear estágio do banco (snake_case) para o frontend (Display Name)
      const stageMap: Record<string, LeadStage> = {
        'perguntou_valor': 'Perguntou Valor',
        'demonstrou_interesse': 'Demonstrou Interesse',
        'quase_fechando': 'Quase Fechando',
        'agendado': 'Agendado',
        'perdido': 'Perdido',
      }

      const mapped: Lead[] = (data || []).map((r: any) => ({
        id: r.id,
        name: r.nome,
        origin: (r.origem as LeadOrigin) || 'Manual',
        procedure: r.procedimento_interesse || 'Consulta',
        estimatedValue: r.valor_estimado || 0,
        stage: stageMap[r.estagio] || 'Perguntou Valor',
        phone: r.telefone || '',
        email: r.email || undefined,
        lastContactAt: r.ultimo_contato || r.updated_at,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        interactions: []
      }))
      setLeads(mapped)
    } catch (err: any) {
      setError(err.message)
      toast({ title: 'Erro', description: 'Não foi possível carregar leads.', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }, [clinicaId, toast])

  // ── Campaigns ─────────────────────────────────────────────────────────
  const getCampaigns = useCallback(async () => {
    if (!clinicaId) return
    try {
      const { data, error: pbErr } = await supabase.from('campanhas').select('*').eq('clinica_id', clinicaId)
      if (pbErr) throw pbErr

      const mapped: Campaign[] = (data || []).map((r: any) => ({
        id: r.id,
        title: r.nome,
        status: r.status || 'Rascunho',
        targetAudience: r.publico_alvo || 'Todos os leads',
        message: r.mensagem,
        metrics: { sent: r.total_enviados || 0, delivered: r.total_destinatarios || 0, responded: r.total_respondidos || 0 }
      }))
      setCampaigns(mapped)
    } catch (err: any) {
      console.error(err)
    }
  }, [clinicaId])

  // ── INIT REALTIME E FETCH INICIAL ───────────────────────────────────────────
  useEffect(() => {
    if (!clinicaId) return

    getLeads()
    getCampaigns()

    const channel = supabase.channel('leads_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads', filter: `clinica_id=eq.${clinicaId}` },
        async () => { await getLeads() }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [clinicaId, getLeads, getCampaigns])

  // Mapear estágio do frontend (Display Name) para o banco (snake_case)
  const stageToDb: Record<string, string> = {
    'Perguntou Valor': 'perguntou_valor',
    'Demonstrou Interesse': 'demonstrou_interesse',
    'Quase Fechando': 'quase_fechando',
    'Agendado': 'agendado',
    'Perdido': 'perdido',
  }

  const moveLead = useCallback(async (leadId: string, toStage: LeadStage) => {
    if (!clinicaId) {
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, stage: toStage } : l))
      return
    }
    try {
      const previous = leads
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, stage: toStage } : l))

      const dbStage = stageToDb[toStage] || toStage
      const { error: pbErr } = await supabase
        .from('leads')
        .update({ estagio: dbStage as any })
        .eq('id', leadId)
        .eq('clinica_id', clinicaId)

      if (pbErr) {
        setLeads(previous)
        throw pbErr
      }

      await supabase.from('leads_historico').insert({
        lead_id: leadId,
        estagio_novo: toStage as any,
        anotacao: `Movido para ${toStage}`
      })

      toast({ title: 'Sucesso', description: 'Lead movido.', type: 'success' })
    } catch {
      toast({ title: 'Erro', description: 'Erro ao mover lead.', type: 'error' })
    }
  }, [clinicaId, toast, leads])

  const createLead = useCallback(async (data: Omit<Lead, 'id' | 'interactions' | 'createdAt' | 'updatedAt' | 'lastContactAt'>) => {
    if (!clinicaId) return
    try {
      const { error: pbErr } = await supabase
        .from('leads')
        .insert({
          clinica_id: clinicaId,
          nome: data.name,
          origem: data.origin,
          procedimento_interesse: data.procedure,
          valor_estimado: data.estimatedValue,
          estagio: stageToDb[data.stage] || data.stage,
          telefone: data.phone,
          email: data.email
        } as any)
        .select()
        .single()

      if (pbErr) throw pbErr

      await getLeads()
      toast({ title: 'Sucesso', description: 'Lead criado.', type: 'success' })
    } catch {
      toast({ title: 'Erro', description: 'Erro ao criar lead.', type: 'error' })
    }
  }, [clinicaId, getLeads, toast])

  const updateLead = useCallback(async (leadId: string, data: Partial<Lead>) => {
    if (!clinicaId) return
    try {
      const updateData: any = {}
      if (data.name) updateData.nome = data.name
      if (data.stage) updateData.estagio = data.stage
      if (data.phone) updateData.telefone = data.phone
      if (data.email) updateData.email = data.email
      if (data.procedure) updateData.procedimento_interesse = data.procedure
      if (data.estimatedValue) updateData.valor_estimado = data.estimatedValue

      const { error: pbErr } = await supabase.from('leads').update(updateData).eq('id', leadId).eq('clinica_id', clinicaId)
      if (pbErr) throw pbErr

      await getLeads()
      toast({ title: 'Sucesso', description: 'Lead atualizado.', type: 'success' })
    } catch {
      toast({ title: 'Erro', description: 'Erro ao atualizar lead.', type: 'error' })
    }
  }, [clinicaId, getLeads, toast])

  const addLeadInteraction = useCallback(async (leadId: string, interaction: Omit<LeadInteraction, 'id' | 'date'>) => {
    if (!clinicaId) return
    try {
      const { error: pbErr } = await supabase.from('leads_historico').insert({
        lead_id: leadId,
        anotacao: interaction.content
      })
      if (pbErr) throw pbErr

      toast({ title: 'Sucesso', description: 'Interação adicionada.', type: 'success' })
    } catch {
      toast({ title: 'Erro', description: 'Erro ao adicionar interação.', type: 'error' })
    }
  }, [clinicaId, toast])

  const deleteLead = useCallback(async (leadId: string) => {
    if (!clinicaId) return
    try {
      const { error: pbErr } = await supabase.from('leads').delete().eq('id', leadId).eq('clinica_id', clinicaId)
      if (pbErr) throw pbErr

      setLeads(prev => prev.filter(l => l.id !== leadId))
      toast({ title: 'Sucesso', description: 'Lead removido.', type: 'success' })
    } catch {
      toast({ title: 'Erro', description: 'Erro ao remover lead.', type: 'error' })
    }
  }, [clinicaId, toast])

  const createCampaign = useCallback(async (campaign: Omit<Campaign, 'id' | 'sentAt'>) => {
    if (!clinicaId) return
    try {
      const { error: pbErr } = await supabase.from('campanhas').insert({
        clinica_id: clinicaId,
        nome: campaign.title,
        mensagem: campaign.message,
        status: campaign.status
      })
      if (pbErr) throw pbErr
      await getCampaigns()
      toast({ title: 'Sucesso', description: 'Campanha criada.', type: 'success' })
    } catch {
      toast({ title: 'Erro', description: 'Erro ao criar campanha.', type: 'error' })
    }
  }, [clinicaId, getCampaigns, toast])

  const sendCampaign = useCallback(async (campaignId: string) => {
    if (!clinicaId) return
    try {
      const { error: pbErr } = await supabase
        .from('campanhas')
        .update({ status: 'Enviada', data_envio: new Date().toISOString() })
        .eq('id', campaignId)
        .eq('clinica_id', clinicaId)
      if (pbErr) throw pbErr
      await getCampaigns()
      toast({ title: 'Sucesso', description: 'Campanha enviada com sucesso.', type: 'success' })
    } catch {
      toast({ title: 'Erro', description: 'Erro ao enviar campanha.', type: 'error' })
    }
  }, [clinicaId, getCampaigns, toast])

  const deleteCampaign = useCallback(async (campaignId: string) => {
    if (!clinicaId) return
    try {
      await supabase.from('campanhas').delete().eq('id', campaignId)
      await getCampaigns()
    } catch { }
  }, [clinicaId, getCampaigns])

  return {
    leads,
    campaigns,
    isLoading,
    error,
    getLeads,
    moveLead,
    createLead,
    updateLead,
    addLeadInteraction,
    deleteLead,
    getCampaigns,
    createCampaign,
    sendCampaign,
    deleteCampaign
  }
}
