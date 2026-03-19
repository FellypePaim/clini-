import { useState, useCallback, useEffect } from 'react'
import type { Patient, Appointment, PatientDocument, PatientFinancial } from '../types'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { useToast } from './useToast'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export function usePatients() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const clinicaId = useAuthStore(state => state.user?.clinicaId)
  const { toast } = useToast()

  // ── INIT FETCH ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (USE_MOCK || !clinicaId) return
    getPatients()
  }, [clinicaId])

  // ── Buscar lista de pacientes ────────────────────────────────────────
  const getPatients = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      if (USE_MOCK || !clinicaId) return []

      const { data, error: pbErr } = await supabase
        .from('pacientes')
        .select('*, consultas(count)')
        .eq('clinica_id', clinicaId)
        .order('nome_completo', { ascending: true })

      if (pbErr) throw pbErr

      const mapped: Patient[] = (data || []).map((r: any) => ({
        id: r.id,
        nome: r.nome_completo,
        dataNascimento: r.data_nascimento || '',
        cpf: r.cpf || '',
        sexo: (r.genero as any) || 'outro',
        convenio: r.convenio || '',
        numeroConvenio: r.numero_convenio || '',
        endereco: (r.endereco as any) || { cep: '', logradouro: '', numero: '', bairro: '', cidade: '', estado: '' },
        contato: {
           telefone: r.whatsapp || r.telefone || '',
           email: r.email || ''
        },
        ativo: r.ativo ?? true,
        criadoEm: r.created_at || '',
        totalConsultas: r.consultas?.[0]?.count || 0,
        ultimaConsulta: r.updated_at?.split('T')[0]
      }))

      setPatients(mapped)
      return mapped
    } catch (err: any) {
      setError(err.message)
      toast({ title: 'Erro', description: 'Não foi possível carregar os pacientes', type: 'error' })
      return []
    } finally {
      setIsLoading(false)
    }
  }, [clinicaId, toast])

  // ── Buscar paciente por ID ───────────────────────────────────────────
  const getPatientById = useCallback(async (id: string) => {
    setIsLoading(true)
    try {
      if (!clinicaId || USE_MOCK) return null

      const { data, error: pbErr } = await supabase
        .from('pacientes')
        .select('*, consultas(count)')
        .eq('clinica_id', clinicaId)
        .eq('id', id)
        .single()

      if (pbErr) throw pbErr

      return {
        id: data.id,
        nome: data.nome_completo,
        dataNascimento: data.data_nascimento || '',
        cpf: data.cpf || '',
        sexo: (data.genero as any) || 'outro',
        convenio: data.convenio || '',
        numeroConvenio: data.numero_convenio || '',
        endereco: (data.endereco as any) || { cep: '', logradouro: '', numero: '', bairro: '', cidade: '', estado: '' },
        contato: {
           telefone: data.whatsapp || data.telefone || '',
           email: data.email || ''
        },
        ativo: data.ativo ?? true,
        criadoEm: data.created_at || '',
        totalConsultas: data.consultas?.[0]?.count || 0
      } as Patient
    } catch (err: any) {
      toast({ title: 'Erro', description: 'Erro ao buscar dados do paciente.', type: 'error' })
      return null
    } finally {
      setIsLoading(false)
    }
  }, [clinicaId, toast])

  // ── Buscar histórico de consultas ───────────────────────────────────────────
  const getPatientHistory = useCallback(async (id: string): Promise<Appointment[]> => {
    if (!clinicaId || USE_MOCK) return []
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('consultas')
        .select(`
          *,
          profissional:profiles!consultas_profissional_id_fkey (nome_completo),
          paciente:pacientes (nome_completo),
          procedimento:procedimentos (nome)
        `)
        .eq('paciente_id', id)
        .order('data_hora_inicio', { ascending: false })

      if (error) throw error

      return (data || []).map((row: any) => ({
        id: row.id,
        pacienteId: row.paciente_id,
        pacienteNome: row.paciente?.nome_completo || 'Sem Nome',
        profissionalId: row.profissional_id,
        profissionalNome: row.profissional?.nome_completo || 'Sem Nome',
        data: row.data_hora_inicio.split('T')[0],
        horaInicio: row.data_hora_inicio.split('T')[1].substring(0, 5),
        horaFim: row.data_hora_fim.split('T')[1].substring(0, 5),
        procedimento: row.procedimento?.nome || 'Consulta',
        status: row.status,
        observacoes: row.observacoes,
        valor: row.valor,
        criadoEm: row.created_at,
        atualizadoEm: row.updated_at
      })) as Appointment[]
    } catch (err: any) {
      console.error(err)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [clinicaId])

  // ── Buscar documentos do paciente ──────────────────────────────────────────
  const getPatientDocuments = useCallback(async (id: string): Promise<PatientDocument[]> => {
    if (!clinicaId || USE_MOCK) return []
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('documentos_paciente')
        .select('*')
        .eq('paciente_id', id)
        .order('created_at', { ascending: false })

      if (error) throw error

      return (data || []).map(row => ({
        id: row.id,
        pacienteId: row.paciente_id,
        nome: row.nome || 'Sem Nome',
        tipo: row.mime_type?.includes('image') ? 'imagem' : 'pdf',
        url: row.arquivo_url || '',
        dataUpload: row.created_at || '',
        tamanho: row.tamanho_bytes ? `${(row.tamanho_bytes / 1024).toFixed(1)} KB` : '0 KB'
      })) as PatientDocument[]
    } catch (err: any) {
      return []
    } finally {
      setIsLoading(false)
    }
  }, [clinicaId])

  // ── Buscar financeiro do paciente (PENDENTE: Módulo em construção) ──────────
  const getPatientFinancial = useCallback(async (id: string): Promise<PatientFinancial[]> => {
    return [] // Simplesmente retorna vazio até a construção do módulo financeiro
  }, [])

  // ── Criar novo paciente ─────────────────────────────────────────────
  const createPatient = useCallback(async (data: Partial<Patient>) => {
    if (!clinicaId || USE_MOCK) return null
    setIsLoading(true)
    try {
      const insertData: any = {
        clinica_id: clinicaId,
        nome_completo: data.nome || '',
        email: data.contato?.email || null,
        telefone: data.contato?.telefone || null,
        whatsapp: data.contato?.telefone || null,
        cpf: data.cpf,
        data_nascimento: data.dataNascimento,
        genero: data.sexo,
        convenio: data.convenio,
        numero_convenio: data.numeroConvenio,
        endereco: data.endereco as any,
        ativo: true
      }

      const { data: ret, error: pbErr } = await supabase
        .from('pacientes')
        .insert(insertData)
        .select()
        .single()

      if (pbErr) throw pbErr

      const mapped: Patient = {
        id: ret.id,
        nome: ret.nome_completo,
        dataNascimento: ret.data_nascimento || '',
        cpf: ret.cpf || '',
        sexo: (ret.genero as any) || 'outro',
        convenio: ret.convenio || '',
        numeroConvenio: ret.numero_convenio || '',
        endereco: (ret.endereco as any) || { cep: '', logradouro: '', numero: '', bairro: '', cidade: '', estado: '' },
        contato: {
           telefone: ret.whatsapp || ret.telefone || '',
           email: ret.email || ''
        },
        ativo: ret.ativo ?? true,
        criadoEm: ret.created_at || '',
        totalConsultas: 0
      }

      setPatients(prev => [mapped, ...prev])
      toast({ title: 'Sucesso', description: 'Paciente cadastrado.', type: 'success' })
      return mapped
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message || 'Erro ao criar paciente', type: 'error' })
      return null
    } finally {
      setIsLoading(false)
    }
  }, [clinicaId, toast])

  // ── Atualizar paciente ──────────────────────────────────────────────
  const updatePatient = useCallback(async (id: string, data: Partial<Patient>) => {
    if (!clinicaId || USE_MOCK) return
    setIsLoading(true)
    try {
      const updateData: any = {}
      if (data.nome) updateData.nome_completo = data.nome
      if (data.contato?.email !== undefined) updateData.email = data.contato.email
      if (data.contato?.telefone !== undefined) {
         updateData.telefone = data.contato.telefone
         updateData.whatsapp = data.contato.telefone
      }
      if (data.cpf !== undefined) updateData.cpf = data.cpf
      if (data.dataNascimento !== undefined) updateData.data_nascimento = data.dataNascimento
      if (data.sexo !== undefined) updateData.genero = data.sexo
      if (data.ativo !== undefined) updateData.ativo = data.ativo

      const { error: pbErr } = await supabase
        .from('pacientes')
        .update(updateData)
        .eq('id', id)
        .eq('clinica_id', clinicaId)

      if (pbErr) throw pbErr

      setPatients(prev => prev.map(p => p.id === id ? { ...p, ...data } : p))
      toast({ title: 'Sucesso', description: 'Dados atualizados no sistema.', type: 'success' })
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message || 'Falha ao atualizar.', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }, [clinicaId, toast])

  // ── STUB: Gerar link de anamnese ──────────────────────────────────────────
  const sendAnamnesisLink = useCallback(async (patientId: string) => {
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 400))
    const token = Math.random().toString(36).substring(2, 15)
    setIsLoading(false)
    // URL real simulada com o domínio base do app
    const baseUrl = window.location.origin;
    return `${baseUrl}/anamnese/${token}?pid=${patientId}`
  }, [])

  return {
    patients,
    isLoading,
    error,
    getPatients,
    getPatientById,
    getPatientHistory,
    getPatientDocuments,
    getPatientFinancial,
    createPatient,
    updatePatient,
    sendAnamnesisLink
  }
}
