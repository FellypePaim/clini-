import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from './useToast'

export function useSuperAdmin() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  // 1. Dashboards & Stats
  const getPlatformStats = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('superadmin-actions', {
        body: { action: 'get_platform_stats' }
      })
      if (error) throw error
      return data
    } catch (err: any) {
      toast({ title: 'Erro', description: 'Erro ao buscar estatísticas globais.', type: 'error' })
      return null
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  // 2. Clínicas
  const getClinics = useCallback(async () => {
    const { data, error } = await supabase
      .from('clinicas' as any)
      .select('*, planos(nome)')
      .order('nome', { ascending: true })
    
    if (error) {
      toast({ title: 'Erro', description: 'Erro ao listar clínicas.', type: 'error' })
      return []
    }
    return data || []
  }, [toast])

  const createClinic = useCallback(async (formData: any) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('superadmin-actions', {
        body: { action: 'create_clinic', data: formData }
      })
      if (error) throw error
      toast({ title: 'Sucesso', description: 'Clínica criada com sucesso!', type: 'success' })
      return data
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, type: 'error' })
      return null
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  const suspendClinic = useCallback(async (id: string, reason: string) => {
    const { error } = await supabase
      .from('clinicas' as any)
      .update({ status_plano: 'suspensa', observacoes_superadmin: reason } as any)
      .eq('id', id)
    
    if (error) {
       toast({ title: 'Erro', description: 'Erro ao suspender clínica.', type: 'error' })
    } else {
       toast({ title: 'Clínica Suspensa', description: 'Acesso bloqueado com sucesso.', type: 'success' })
    }
  }, [toast])

  // 3. Usuários Globais
  const getUsers = useCallback(async () => {
    const { data, error } = await supabase
      .from('profiles' as any)
      .select('*, clinicas(nome)')
      .order('created_at', { ascending: false })
    
    if (error) return []
    return data || []
  }, [])

  // 4. Impersonation (Geração de Token)
  const impersonateClinic = useCallback(async (clinicId: string) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('superadmin-actions', {
        body: { action: 'impersonate_clinic', clinicId }
      })
      if (error) throw error
      
      // Armazena o token original antes de trocar
      const currentToken = localStorage.getItem('prontuario-verde-auth-token')
      localStorage.setItem('impersonation-back-token', currentToken || '')
      
      // Simula a troca abrindo em nova aba com o token
      window.open(`/dashboard?impersonate_token=${data.token}&clinic=${clinicId}`, '_blank')
    } catch (err: any) {
      toast({ title: 'Erro', description: 'Não foi possível impersonar.', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  // 5. Audit Logs
  const getAuditLogs = useCallback(async (filters?: any) => {
    let query = supabase.from('auditoria_global' as any).select('*, clinicas(nome), profiles(nome_completo)').order('created_at', { ascending: false }).limit(100)
    
    if (filters?.clinicaId) query = query.eq('clinica_id', filters.clinicaId)
    if (filters?.usuarioId) query = query.eq('usuario_id', filters.usuarioId)
    
    const { data, error } = await query
    return data || []
  }, [])

  return {
    isLoading,
    getPlatformStats,
    getClinics,
    createClinic,
    suspendClinic,
    getUsers,
    impersonateClinic,
    getAuditLogs
  }
}
