import { useState, useCallback } from 'react'
import type { Patient, Appointment, PatientDocument, PatientFinancial } from '../types'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { useToast } from './useToast'

export function usePatients() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clinicaId = useAuthStore(state => state.user?.clinicaId)
  const { toast } = useToast()

  // ── Buscar lista de pacientes ────────────────────────────────────────
  const getPatients = useCallback(async () => {
    if (!clinicaId) return []
    setIsLoading(true)
    setError(null)
    try {
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
        ultimaConsulta: (r as any).ultima_consulta || undefined,
        totalConsultas: (r as any).total_consultas || 0,
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
    if (!clinicaId) return null
    setIsLoading(true)
    try {
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
        ultimaConsulta: (data as any).ultima_consulta || undefined,
        totalConsultas: (data as any).total_consultas || 0,
        alergias: (data as any).alergias || [],
        historicoMedico: (data as any).historico_medico || '',
        medicamentosEmUso: (data as any).medicamentos_uso || '',
        antecedentesFamiliares: (data as any).antecedentes_familiares || '',
        habitos: (data as any).habitos || { fumante: false, etilista: false, atividadeFisica: 'Nenhuma' },
        observacoes: data.observacoes || '',
        condicoes_medicas: (data as any).condicoes_medicas || [],
      } as Patient & { condicoes_medicas: string[] }
    } catch (_err: any) {
      toast({ title: 'Erro', description: 'Erro ao buscar dados do paciente.', type: 'error' })
      return null
    } finally {
      setIsLoading(false)
    }
  }, [clinicaId, toast])

  // ── Buscar histórico de consultas ─────────────────────────────────────
  const getPatientHistory = useCallback(async (id: string): Promise<Appointment[]> => {
    if (!clinicaId) return []
    setIsLoading(true)
    try {
      const { data, error: pbErr } = await supabase
        .from('consultas')
        .select('*, profiles(nome_completo)')
        .eq('paciente_id', id)
        .eq('clinica_id', clinicaId)
        .order('data_hora', { ascending: false })

      if (pbErr) throw pbErr

      return (data || []).map((r: any) => ({
        id: r.id,
        pacienteId: r.paciente_id,
        pacienteNome: '',
        profissionalId: r.profissional_id,
        profissionalNome: r.profiles?.nome_completo || '',
        data: r.data_hora?.split('T')[0] || '',
        horaInicio: r.data_hora ? (r.data_hora as string).split('T')[1]?.substring(0, 5) ?? '' : '',
        horaFim: '',
        procedimento: r.procedimento || 'consulta',
        status: r.status || 'concluido',
        observacoes: r.observacoes || '',
        valor: r.valor || 0,
        criadoEm: r.created_at || '',
        atualizadoEm: r.updated_at || '',
      }))
    } catch (err: any) {
      console.error('Erro ao buscar histórico:', err.message)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [clinicaId])

  // ── Buscar documentos do paciente ──────────────────────────────────────
  const getPatientDocuments = useCallback(async (id: string): Promise<PatientDocument[]> => {
    if (!clinicaId) return []
    setIsLoading(true)
    try {
      const { data, error: pbErr } = await supabase
        .from('documentos_paciente')
        .select('*')
        .eq('paciente_id', id)
        .eq('clinica_id', clinicaId)
        .order('created_at', { ascending: false })

      if (pbErr) throw pbErr

      return (data || []).map((r: any) => ({
        id: r.id,
        pacienteId: r.paciente_id,
        nome: r.nome || '',
        tipo: r.tipo || 'pdf',
        url: r.url || '',
        dataUpload: r.created_at?.split('T')[0] || '',
        tamanho: r.tamanho || '',
      }))
    } catch (err: any) {
      console.error('Erro ao buscar documentos:', err.message)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [clinicaId])

  // ── Buscar financeiro do paciente ──────────────────────────────────────
  const getPatientFinancial = useCallback(async (id: string): Promise<PatientFinancial[]> => {
    if (!clinicaId) return []
    setIsLoading(true)
    try {
      const { data, error: pbErr } = await supabase
        .from('orcamentos')
        .select('*')
        .eq('paciente_id', id)
        .eq('clinica_id', clinicaId)
        .order('created_at', { ascending: false })

      if (pbErr) throw pbErr

      return (data || []).map((r: any) => {
        const itens = Array.isArray(r.itens) ? r.itens : []
        const descricao = itens.map((i: any) => i.descricao || i.nome || '').filter(Boolean).join(', ') || 'Orçamento'
        return {
          id: r.id,
          pacienteId: r.paciente_id,
          tipo: 'orcamento' as const,
          valor: r.total || r.subtotal || 0,
          data: r.created_at?.split('T')[0] || '',
          descricao,
          status: r.status || 'pendente',
        }
      })
    } catch (err: any) {
      console.error('Erro ao buscar financeiro:', err.message)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [clinicaId])

  // ── Criar novo paciente ─────────────────────────────────────────────
  const createPatient = useCallback(async (data: Partial<Patient>) => {
    if (!clinicaId) return null
    setIsLoading(true)
    try {
      const insertData = {
        clinica_id: clinicaId,
        nome_completo: data.nome || '',
        email: data.contato?.email || null,
        telefone: data.contato?.telefone || null,
        whatsapp: data.contato?.telefone || null,
        cpf: data.cpf || null,
        data_nascimento: data.dataNascimento || null,
        genero: data.sexo || null,
        convenio: data.convenio || null,
        numero_convenio: data.numeroConvenio || null,
        endereco: data.endereco as any || null,
        observacoes: data.observacoes || null,
        alergias: data.alergias || null,
        ativo: true,
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
        totalConsultas: 0,
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
    if (!clinicaId) return
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
      if (data.convenio !== undefined) updateData.convenio = data.convenio
      if (data.observacoes !== undefined) updateData.observacoes = data.observacoes
      if ((data as any).condicoes_medicas !== undefined) updateData.condicoes_medicas = (data as any).condicoes_medicas
      if ((data as any).historico_medico !== undefined) updateData.historico_medico = (data as any).historico_medico
      if ((data as any).medicamentos_uso !== undefined) updateData.medicamentos_uso = (data as any).medicamentos_uso

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

  // ── Deletar consulta da timeline ──────────────────────────────────────
  const deleteConsulta = useCallback(async (consultaId: string) => {
    if (!clinicaId) return
    try {
      const { error: pbErr } = await supabase
        .from('consultas')
        .delete()
        .eq('id', consultaId)
        .eq('clinica_id', clinicaId)
      if (pbErr) throw pbErr
      toast({ title: 'Sucesso', description: 'Atendimento removido.', type: 'success' })
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message || 'Falha ao excluir.', type: 'error' })
    }
  }, [clinicaId, toast])

  // ── Deletar anamnese ────────────────────────────────────────────────
  const deleteAnamnese = useCallback(async (anamneseId: string) => {
    if (!clinicaId) return
    try {
      const { error: pbErr } = await supabase
        .from('anamneses')
        .delete()
        .eq('id', anamneseId)
      if (pbErr) throw pbErr
      toast({ title: 'Sucesso', description: 'Anamnese removida.', type: 'success' })
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message || 'Falha ao excluir.', type: 'error' })
    }
  }, [clinicaId, toast])

  // ── Criar orçamento para paciente ───────────────────────────────────
  const createOrcamento = useCallback(async (pacienteId: string, data: { descricao: string; valor: number }) => {
    if (!clinicaId) return
    try {
      // 1. Criar orçamento
      const { data: orc, error: pbErr } = await supabase
        .from('orcamentos')
        .insert({
          clinica_id: clinicaId,
          paciente_id: pacienteId,
          profissional_id: null,
          itens: [{ descricao: data.descricao, valor: data.valor, quantidade: 1 }],
          subtotal: data.valor,
          total: data.valor,
          status: 'pendente',
        } as any)
        .select('id')
        .single()
      if (pbErr) throw pbErr

      // 2. Criar lançamento vinculado no financeiro da clínica
      await supabase.from('lancamentos').insert({
        clinica_id: clinicaId,
        paciente_id: pacienteId,
        orcamento_id: orc.id,
        tipo: 'receita',
        descricao: data.descricao,
        valor: data.valor,
        status: 'pendente',
        categoria: 'procedimento',
        vencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      } as any)

      toast({ title: 'Sucesso', description: 'Orçamento criado e vinculado ao financeiro.', type: 'success' })
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message || 'Falha ao criar orçamento.', type: 'error' })
    }
  }, [clinicaId, toast])

  const marcarOrcamentoPago = useCallback(async (orcamentoId: string, formaPagamento?: string) => {
    if (!clinicaId) return
    try {
      const agora = new Date().toISOString()

      // 1. Atualizar orçamento
      const { error: orcErr } = await supabase
        .from('orcamentos')
        .update({ status: 'aprovado', aprovado_em: agora } as any)
        .eq('id', orcamentoId)
      if (orcErr) throw orcErr

      // 2. Atualizar lançamento vinculado
      await supabase.from('lancamentos')
        .update({
          status: 'pago',
          pago_em: agora,
          forma_pagamento: formaPagamento || 'dinheiro',
        } as any)
        .eq('orcamento_id', orcamentoId)

      toast({ title: 'Pago!', description: 'Orçamento marcado como pago e financeiro atualizado.', type: 'success' })
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message || 'Falha ao marcar como pago.', type: 'error' })
    }
  }, [clinicaId, toast])

  // ── Gerar link de anamnese ────────────────────────────────────────────
  const sendAnamnesisLink = useCallback(async (patientId: string) => {
    if (!clinicaId) return ''
    setIsLoading(true)
    try {
      // Gera token base64 com dados do paciente e clínica
      const tokenData = { pid: patientId, cid: clinicaId }
      const token = btoa(JSON.stringify(tokenData))

      // Salva referência no banco
      await (supabase.from('anamneses').insert({
        paciente_id: patientId,
        token_link: token,
      } as any) as any)

      const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin
      return `${baseUrl}/anamnese/${token}`
    } catch (_e: any) {
      // Se o insert falhar (ex: policy), o link ainda funciona pois o token é stateless
      const tokenData = { pid: patientId, cid: clinicaId }
      const token = btoa(JSON.stringify(tokenData))
      const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin
      return `${baseUrl}/anamnese/${token}`
    } finally {
      setIsLoading(false)
    }
  }, [clinicaId])

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
    sendAnamnesisLink,
    deleteConsulta,
    deleteAnamnese,
    createOrcamento,
    marcarOrcamentoPago,
  }
}
