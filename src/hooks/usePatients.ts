import { useState, useCallback } from 'react'
import { PATIENTS_MOCK, PATIENT_APPOINTMENTS_MOCK, PATIENT_DOCUMENTS_MOCK, PATIENT_FINANCIAL_MOCK } from '../data/patientMockData'
import type { Patient, Appointment, PatientDocument, PatientFinancial } from '../types'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { useToast } from './useToast'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

// ─────────────────────────────────────────────────────────────────────────────
// usePatients — Hook principal para gestão de pacientes
// ─────────────────────────────────────────────────────────────────────────────

export function usePatients() {
  const [patients, setPatients] = useState<Patient[]>(PATIENTS_MOCK)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const clinicaId = useAuthStore(state => state.user?.clinicaId)
  const { toast } = useToast()

  // ── Buscar lista de pacientes ────────────────────────────────────────
  const getPatients = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      if (USE_MOCK || !clinicaId) {
        await new Promise((r) => setTimeout(r, 400))
        setPatients(PATIENTS_MOCK)
        return PATIENTS_MOCK
      }

      const { data, error: pbErr } = await supabase
        .from('pacientes')
        .select('*')
        .eq('clinica_id', clinicaId)
        .order('nome_completo', { ascending: true })

      if (pbErr) throw pbErr

      const mapped: Patient[] = (data || []).map(r => ({
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
        totalConsultas: 0 // Mock de calculo extra
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
      if (USE_MOCK || !clinicaId) {
        await new Promise((r) => setTimeout(r, 400))
        return PATIENTS_MOCK.find(p => p.id === id) || null
      }

      const { data, error: pbErr } = await supabase
        .from('pacientes')
        .select('*')
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
        totalConsultas: 0
      } as Patient
    } catch (err: any) {
      toast({ title: 'Erro', description: 'Erro ao buscar dados do paciente.', type: 'error' })
      return null
    } finally {
      setIsLoading(false)
    }
  }, [clinicaId, toast])

  // ── STUB: Buscar histórico de consultas ───────────────────────────────────
  const getPatientHistory = useCallback(async (id: string): Promise<Appointment[]> => {
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 300))
    setIsLoading(false)
    return PATIENT_APPOINTMENTS_MOCK[id] || []
  }, [])

  // ── STUB: Buscar documentos do paciente ──────────────────────────────────
  const getPatientDocuments = useCallback(async (id: string): Promise<PatientDocument[]> => {
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 300))
    setIsLoading(false)
    return PATIENT_DOCUMENTS_MOCK[id] || []
  }, [])

  // ── STUB: Buscar financeiro do paciente ──────────────────────────────────
  const getPatientFinancial = useCallback(async (id: string): Promise<PatientFinancial[]> => {
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 300))
    setIsLoading(false)
    return PATIENT_FINANCIAL_MOCK[id] || []
  }, [])

  // ── Criar novo paciente ─────────────────────────────────────────────
  const createPatient = useCallback(async (data: Partial<Patient>) => {
    setIsLoading(true)
    try {
      if (USE_MOCK || !clinicaId) {
        await new Promise((r) => setTimeout(r, 600))
        const novo: Patient = {
          ...(data as Patient),
          id: `pac-${Date.now()}`,
          ativo: true,
          criadoEm: new Date().toISOString().split('T')[0],
          totalConsultas: 0
        }
        setPatients(prev => [novo, ...prev])
        return novo
      }

      const insertData = {
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
    setIsLoading(true)
    try {
      if (USE_MOCK || !clinicaId) {
        await new Promise((r) => setTimeout(r, 500))
        setPatients(prev => prev.map(p => p.id === id ? { ...p, ...data } : p))
        toast({ title: 'Sucesso', description: 'Paciente atualizado.', type: 'success' })
        return
      }

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
    return `http://localhost:5173/anamnese/${token}?pid=${patientId}`
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
