import { useState, useCallback } from 'react'
import type {
  EvolutionRecord,
  Prescription,
  PrescriptionItem,
  CID10,
  HarmonizationSession,
  HarmonizationZone,
} from '../types/prontuario'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

// Lista de CID-10 comuns (dados de referência, não são dados de clínica)
export const CID10_LISTA: CID10[] = [
  { codigo: 'Z00.0', nome: 'Exame médico geral' },
  { codigo: 'I10',   nome: 'Hipertensão essencial' },
  { codigo: 'E11',   nome: 'Diabetes mellitus tipo 2' },
  { codigo: 'R51',   nome: 'Cefaléia' },
  { codigo: 'M54.5', nome: 'Dor lombar baixa' },
  { codigo: 'J01',   nome: 'Sinusite aguda' },
  { codigo: 'G43',   nome: 'Enxaqueca' },
  { codigo: 'K21',   nome: 'Doença do refluxo gastroesofágico' },
  { codigo: 'F41.1', nome: 'Ansiedade generalizada' },
  { codigo: 'N39.0', nome: 'Infecção do trato urinário' },
]
export const CID10_MOCK = CID10_LISTA

export function useProntuario(pacienteId?: string) {
  const { user } = useAuthStore()
  const clinicaId = user?.clinicaId
  const profissionalId = user?.id

  const [evolutions, setEvolutions] = useState<EvolutionRecord[]>([])
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [sessions, setSessions] = useState<HarmonizationSession[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // ── Carregar dados do prontuário ─────────────────────────────────────────────
  const loadProntuario = useCallback(async (pid?: string) => {
    const id = pid || pacienteId
    if (!id || !clinicaId) return
    setIsLoading(true)
    try {
      const [evolvRes, prescRes, harmRes] = await Promise.all([
        supabase
          .from('evolucoes')
          .select('*')
          .eq('paciente_id', id)
          .eq('clinica_id', clinicaId)
          .order('data', { ascending: false }),
        supabase
          .from('prescricoes')
          .select('*')
          .eq('paciente_id', id)
          .eq('clinica_id', clinicaId)
          .order('data', { ascending: false }),
        supabase
          .from('harmonizacoes')
          .select('*')
          .eq('paciente_id', id)
          .eq('clinica_id', clinicaId)
          .order('data', { ascending: false }),
      ])

      if (evolvRes.data) {
        setEvolutions(evolvRes.data.map((r: any) => ({
          id: r.id,
          pacienteId: r.paciente_id,
          consultaId: r.consulta_id || '',
          data: r.data,
          profissionalId: r.profissional_id,
          texto: r.texto || '',
          cid10: r.cid10 || undefined,
          resumoIA: r.resumo_ia || undefined,
        })))
      }

      if (prescRes.data) {
        setPrescriptions(prescRes.data.map((r: any) => ({
          id: r.id,
          pacienteId: r.paciente_id,
          profissionalId: r.profissional_id,
          data: r.data,
          itens: r.itens || [],
          assinada: r.assinada ?? false,
          qrCode: r.qr_code || '',
        })))
      }

      if (harmRes.data) {
        setSessions(harmRes.data.map((r: any) => ({
          id: r.id,
          pacienteId: r.paciente_id,
          data: r.data,
          profissionalId: r.profissional_id,
          zones: r.zonas || [],
        })))
      }
    } finally {
      setIsLoading(false)
    }
  }, [pacienteId, clinicaId])

  // ── Salvar Evolução ──────────────────────────────────────────────────────────
  const saveEvolution = useCallback(async (data: Partial<EvolutionRecord>) => {
    if (!clinicaId || !profissionalId) return null
    setIsLoading(true)
    try {
      const insertData = {
        clinica_id: clinicaId,
        paciente_id: data.pacienteId,
        consulta_id: data.consultaId || null,
        profissional_id: data.profissionalId || profissionalId,
        data: data.data || new Date().toISOString().split('T')[0],
        texto: data.texto || '',
        cid10: data.cid10 || null,
        resumo_ia: data.resumoIA || null,
      }

      const { data: ret, error } = await supabase
        .from('evolucoes')
        .insert(insertData)
        .select()
        .single()

      if (error) throw error

      const novo: EvolutionRecord = {
        id: ret.id,
        pacienteId: ret.paciente_id,
        consultaId: ret.consulta_id || '',
        data: ret.data,
        profissionalId: ret.profissional_id,
        texto: ret.texto,
        cid10: ret.cid10 || undefined,
        resumoIA: ret.resumo_ia || undefined,
      }
      setEvolutions(prev => [novo, ...prev])
      return novo
    } catch (e: any) {
      console.error('Erro ao salvar evolução:', e.message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [clinicaId, profissionalId])

  // ── Transcrever Áudio via Edge Function ──────────────────────────────────────
  const transcribeAudio = useCallback(async (audioBase64: string) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('ai-gateway', {
        body: { action: 'transcribe_audio', audio_base64: audioBase64, clinica_id: clinicaId },
      })
      if (error) throw error
      return (data?.transcricao as string) || ''
    } catch (e: any) {
      console.error('Erro ao transcrever áudio:', e.message)
      return ''
    } finally {
      setIsLoading(false)
    }
  }, [clinicaId])

  // ── Gerar Resumo IA via Edge Function ─────────────────────────────────────────
  const generateAISummary = useCallback(async (texto: string) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('ai-gateway', {
        body: { action: 'generate_summary', texto, clinica_id: clinicaId },
      })
      if (error) throw error
      return data?.resumo || { queixa: '', diagnostico: '', conduta: '', retorno: '' }
    } catch (e: any) {
      console.error('Erro ao gerar resumo IA:', e.message)
      return { queixa: '', diagnostico: '', conduta: '', retorno: '' }
    } finally {
      setIsLoading(false)
    }
  }, [clinicaId])

  // ── Salvar Sessão de Harmonização ──────────────────────────────────────────────
  const saveHarmonizationSession = useCallback(async (pid: string, zones: HarmonizationZone[]) => {
    if (!clinicaId || !profissionalId) return null
    setIsLoading(true)
    try {
      const { data: ret, error } = await supabase
        .from('harmonizacoes')
        .insert({
          clinica_id: clinicaId,
          paciente_id: pid,
          profissional_id: profissionalId,
          data: new Date().toISOString().split('T')[0],
          zonas: zones,
        })
        .select()
        .single()

      if (error) throw error

      const nova: HarmonizationSession = {
        id: ret.id,
        pacienteId: ret.paciente_id,
        data: ret.data,
        profissionalId: ret.profissional_id,
        zones: ret.zonas || [],
      }
      setSessions(prev => [nova, ...prev])
      return nova
    } catch (e: any) {
      console.error('Erro ao salvar harmonização:', e.message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [clinicaId, profissionalId])

  // ── Gerar Prescrição ──────────────────────────────────────────────────────────
  const generatePrescription = useCallback(async (pid: string, items: PrescriptionItem[]) => {
    if (!clinicaId || !profissionalId) return null
    setIsLoading(true)
    try {
      const qrCode = `${clinicaId}-${pid}-${Date.now()}`

      const { data: ret, error } = await supabase
        .from('prescricoes')
        .insert({
          clinica_id: clinicaId,
          paciente_id: pid,
          profissional_id: profissionalId,
          data: new Date().toISOString().split('T')[0],
          itens: items,
          assinada: true,
          qr_code: qrCode,
        })
        .select()
        .single()

      if (error) throw error

      const nova: Prescription = {
        id: ret.id,
        pacienteId: ret.paciente_id,
        profissionalId: ret.profissional_id,
        data: ret.data,
        itens: ret.itens || [],
        assinada: ret.assinada,
        qrCode: ret.qr_code,
      }
      setPrescriptions(prev => [nova, ...prev])
      return nova
    } catch (e: any) {
      console.error('Erro ao gerar prescrição:', e.message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [clinicaId, profissionalId])

  return {
    evolutions,
    prescriptions,
    sessions,
    isLoading,
    loadProntuario,
    saveEvolution,
    transcribeAudio,
    generateAISummary,
    saveHarmonizationSession,
    generatePrescription,
    CID10_MOCK: CID10_LISTA, // mantém compatibilidade com componentes existentes
  }
}
