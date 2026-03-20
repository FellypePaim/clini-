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
      console.error('SuperAdmin Stats Error:', err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  // 2. Clínicas
  const getClinics = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('superadmin-actions', {
        body: { action: 'get_clinics' }
      })
      if (error) throw error
      return data || []
    } catch (err: any) {
      console.error('SuperAdmin Clinics Error:', err)
      return []
    } finally {
      setIsLoading(false)
    }
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
    setIsLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('superadmin-actions', {
        body: { action: 'get_users' }
      })
      if (error) throw error
      return data?.users || []
    } catch (err) {
      console.error(err)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 4. Impersonation (Geração de Token)
  const impersonateClinic = useCallback(async (clinicId: string) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('superadmin-actions', {
        body: { action: 'impersonate_clinic', clinicId }
      })
      if (error) throw error
      
      const currentToken = localStorage.getItem('prontuario-verde-auth-token')
      localStorage.setItem('impersonation-back-token', currentToken || '')
      
      window.open(`/dashboard?impersonate_token=${data.token}&clinic=${clinicId}`, '_blank')
    } catch (err: any) {
      toast({ title: 'Erro', description: 'Não foi possível impersonar.', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  // 5. Audit Logs
  const getAuditLogs = useCallback(async (filters?: any) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('superadmin-actions', {
        body: { action: 'get_audit_logs', filters }
      })
      if (error) throw error
      return data?.logs || []
    } catch (err) {
      console.error(err)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 6. Financeiro Stats
  const getFinanceiroStats = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('superadmin-actions', {
        body: { action: 'get_financeiro_stats' }
      })
      if (error) throw error
      return data || null
    } catch (err) {
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 7. IA Stats
  const getIaStats = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('superadmin-actions', {
        body: { action: 'get_ia_stats' }
      })
      if (error) throw error
      return data || null
    } catch (err) {
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 8. WhatsApp Stats
  const getWhatsAppStats = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('superadmin-actions', {
        body: { action: 'get_whatsapp_stats' }
      })
      if (error) throw error
      return data || null
    } catch (err) {
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 9. Suporte Tickets
  const getSuporteTickets = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('superadmin-actions', {
        body: { action: 'get_suporte_tickets' }
      })
      if (error) throw error
      return data?.tickets || []
    } catch (err) {
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 10. Saude Stats
  const getSaudeStats = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('superadmin-actions', {
        body: { action: 'get_saude_stats' }
      })
      if (error) throw error
      return data || null
    } catch (err) {
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    isLoading,
    getPlatformStats,
    getClinics,
    createClinic,
    suspendClinic,
    getUsers,
    impersonateClinic,
    getAuditLogs,
    getFinanceiroStats,
    getIaStats,
    getWhatsAppStats,
    getSuporteTickets,
    getSaudeStats
  }
}
