import { useState, useCallback, useEffect } from 'react'
import type { 
  EvolutionRecord, 
  Prescription, 
  PrescriptionItem,
  CID10, 
  HarmonizationSession, 
  HarmonizationZone
} from '../types/prontuario'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { useToast } from './useToast'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

// ── CID-10 MOCK ─────────────────────────────────────────────────────────────
export const CID10_MOCK: CID10[] = [
  { codigo: 'Z00.0', nome: 'Exame médico geral' },
  { codigo: 'I10',    nome: 'Hipertensão essencial' },
  { codigo: 'E11',    nome: 'Diabetes mellitus tipo 2' },
  { codigo: 'R51',    nome: 'Cefaléia' },
  { codigo: 'M54.5',  nome: 'Dor lombar baixa' },
  { codigo: 'J01',    nome: 'Sinusite aguda' },
  { codigo: 'G43',    nome: 'Enxaqueca' },
  { codigo: 'K21',    nome: 'Doença do refluxo gastroesofágico' },
  { codigo: 'F41.1',  nome: 'Ansiedade generalizada' },
  { codigo: 'N39.0',  nome: 'Infecção do trato urinário' },
]

export function useProntuario(pacienteId?: string) {
  const [evolutions, setEvolutions] = useState<EvolutionRecord[]>([])
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [sessions, setSessions] = useState<HarmonizationSession[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAiProcessing, setIsAiProcessing] = useState(false)

  const clinicaId = useAuthStore(state => state.user?.clinicaId)
  const profesionalId = useAuthStore(state => state.user?.id)
  const { toast } = useToast()

  // ── CARREGAMENTO INICIAL ───────────────────────────────────────────────────
  const fetchProntuario = useCallback(async () => {
    if (!pacienteId || !clinicaId || USE_MOCK) return
    setIsLoading(true)
    try {
      // Evoluções
      const { data: evos, error: evoErr } = await supabase
        .from('evolucoes')
        .select('*')
        .eq('paciente_id', pacienteId)
        .order('created_at', { ascending: false })

      if (evoErr) throw evoErr
      setEvolutions((evos || []).map(row => ({
        id: row.id,
        pacienteId: row.paciente_id,
        consultaId: row.consulta_id || '',
        data: (row.created_at || '').split('T')[0],
        profissionalId: row.profissional_id,
        texto: row.texto_clinico || '',
        cid10: row.cid10_codigo || undefined,
        resumoIA: typeof row.resumo_ia === 'string' ? JSON.parse(row.resumo_ia) : row.resumo_ia as any,
        assinaturaUrl: (row as any).assinatura_url || undefined,
        hashAuditoria: (row as any).hash_auditoria || undefined
      })))

      // Prescrições
      const { data: rxs, error: rxErr } = await supabase
        .from('prescricoes')
        .select('*')
        .eq('paciente_id', pacienteId)
        .order('created_at', { ascending: false })

      if (rxErr) throw rxErr
      setPrescriptions((rxs || []).map(row => ({
        id: row.id,
        pacienteId: row.paciente_id,
        profissionalId: row.profissional_id,
        data: (row.created_at || '').split('T')[0],
        itens: row.itens as any,
        assinada: !!row.assinado_em,
        qrCode: row.qr_code_token || ''
      })))

      // Harmonizações
      const { data: hss, error: hsErr } = await supabase
        .from('harmonizacoes')
        .select('*')
        .eq('paciente_id', pacienteId)
        .order('created_at', { ascending: false })

      if (hsErr) throw hsErr
      setSessions((hss || []).map(row => ({
        id: row.id,
        pacienteId: row.paciente_id,
        data: (row.created_at || '').split('T')[0],
        profissionalId: row.profissional_id || '',
        zones: row.mapeamento as any
      })))

    } catch (err: any) {
      toast({ title: 'Erro', description: 'Erro ao carregar prontuário.', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }, [pacienteId, clinicaId, toast])

  useEffect(() => {
    fetchProntuario()
    // Realtime listener simplificado (refetch on change)
    if (!pacienteId || !clinicaId || USE_MOCK) return
    const channel = supabase.channel(`prontuario_${pacienteId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'evolucoes', filter: `paciente_id=eq.${pacienteId}` }, () => fetchProntuario())
      .subscribe()
    
    return () => { supabase.removeChannel(channel) }
  }, [pacienteId, clinicaId, fetchProntuario])

  // ── Salvar Evolução ──────────────────────────────────────────────────────────
  const saveEvolution = useCallback(async (data: Partial<EvolutionRecord>) => {
    if (!pacienteId || !clinicaId || USE_MOCK) return null
    setIsLoading(true)
    try {
      const insertData: any = {
        paciente_id: pacienteId,
        consulta_id: data.consultaId || undefined,
        profissional_id: profesionalId,
        texto_clinico: data.texto || '',
        cid10_codigo: data.cid10,
        resumo_ia: data.resumoIA,
        assinatura_url: data.assinaturaUrl,
        hash_auditoria: data.hashAuditoria
      }

      const { data: ret, error } = await supabase
        .from('evolucoes')
        .insert(insertData)
        .select()
        .single()

      if (error) throw error
      toast({ title: 'Sucesso', description: 'Prontuário salvo.', type: 'success' })
      await fetchProntuario()
      return ret
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, type: 'error' })
      return null
    } finally {
      setIsLoading(false)
    }
  }, [pacienteId, clinicaId, profesionalId, fetchProntuario, toast])

  // ── Gerar Resumo Automático via IA REAL ────────────────────────────────────
  const generateAISummary = useCallback(async (texto: string) => {
    setIsAiProcessing(true)
    try {
      const { data, error } = await supabase.functions.invoke('ai-gateway', {
        body: { 
          action: 'generate-summary',
          content: texto
        }
      })

      if (error) throw error
      return data // Espera { queixa, diagnostico, conduta, retorno }
    } catch (err: any) {
      console.error('Erro IA:', err)
      toast({ title: 'IA Temporariamente Indisponível', description: 'Usando resumo padrão.', type: 'error' })
      return {
        queixa: 'Informação extraída do texto',
        diagnostico: 'Pendente avaliação',
        conduta: 'Pendente',
        retorno: 'A desejar'
      }
    } finally {
      setIsAiProcessing(false)
    }
  }, [toast])

  // ── Transcrever Áudio (Mock por enquanto, aguardando integração total de stream)
  const transcribeAudio = useCallback(async () => {
    setIsAiProcessing(true)
    await new Promise(r => setTimeout(r, 2000))
    setIsAiProcessing(false)
    return "Transcrição de áudio via Whisper/Gemini habilitada na Edge Function."
  }, [])

  // ── Salvar Mapeamento de Harmonização ──────────────────────────────────────────
  const saveHarmonizationSession = useCallback(async (pid: string, zones: HarmonizationZone[]) => {
    if (!clinicaId || USE_MOCK) return null
    setIsLoading(true)
    try {
      const insertData: any = {
        paciente_id: pid,
        profissional_id: profesionalId,
        mapeamento: zones
      }

      const { data, error } = await supabase
        .from('harmonizacoes')
        .insert(insertData)
        .select()
        .single()

      if (error) throw error
      await fetchProntuario()
      return data
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, type: 'error' })
      return null
    } finally {
      setIsLoading(false)
    }
  }, [clinicaId, profesionalId, fetchProntuario, toast])

  // ── Gerar Prescrição ──────────────────────────────────────────────────────────
  const generatePrescription = useCallback(async (pid: string, items: PrescriptionItem[]) => {
    if (!clinicaId || USE_MOCK) return null
    setIsLoading(true)
    try {
      const insertData: any = {
        paciente_id: pid,
        profissional_id: profesionalId,
        itens: items,
        assinado_em: new Date().toISOString(),
        qr_code_token: `qr-${Date.now()}`
      }

      const { data, error } = await supabase
        .from('prescricoes')
        .insert(insertData)
        .select()
        .single()

      if (error) throw error
      await fetchProntuario()
      return data
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, type: 'error' })
      return null
    } finally {
      setIsLoading(false)
    }
  }, [clinicaId, profesionalId, fetchProntuario, toast])

  return {
    evolutions,
    prescriptions,
    sessions,
    isLoading,
    isAiProcessing,
    saveEvolution,
    transcribeAudio,
    generateAISummary,
    saveHarmonizationSession,
    generatePrescription,
    CID10_MOCK
  }
}
