import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from './useToast'

async function invoke(action: string, extra?: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('superadmin-actions', {
    body: { action, ...extra },
  })
  if (error) {
    // Tentar extrair mensagem real do body da resposta
    let msg = error.message || 'Erro na Edge Function'
    try {
      if (error.context && typeof error.context.json === 'function') {
        const body = await error.context.json()
        if (body?.error) msg = body.error
      }
    } catch { /* ignore */ }
    throw new Error(msg)
  }
  if (data?.error) throw new Error(data.error)
  return data
}

export function useSuperAdmin() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const wrap = useCallback(<T,>(fn: () => Promise<T>, fallback: T) => {
    return async () => {
      setIsLoading(true)
      try { return await fn() }
      catch (e: any) { console.error(e); return fallback }
      finally { setIsLoading(false) }
    }
  }, [])

  // Dashboard
  const getDashboard = useCallback(async () => {
    setIsLoading(true)
    try { return await invoke('get_dashboard') }
    catch (e: any) { console.error('Dashboard Error:', e); return null }
    finally { setIsLoading(false) }
  }, [])

  // Clínicas
  const getClinics = useCallback(async () => {
    setIsLoading(true)
    try { return await invoke('get_clinics') ?? [] }
    catch (e: any) { console.error('Clinics Error:', e); return [] }
    finally { setIsLoading(false) }
  }, [])

  const createClinic = useCallback(async (formData: any) => {
    setIsLoading(true)
    try {
      const data = await invoke('create_clinic', { payload: formData })
      toast({ title: 'Sucesso', description: 'Clínica criada!', type: 'success' })
      return data
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, type: 'error' })
      return null
    } finally { setIsLoading(false) }
  }, [toast])

  const suspendClinic = useCallback(async (id: string, reason: string) => {
    try {
      const result = await invoke('suspend_clinic', { clinicId: id, payload: { suspender: true, motivo: reason } })
      if (result?.error) throw new Error(result.error)
      toast({ title: 'Clínica Suspensa', description: 'Acesso bloqueado.', type: 'success' })
    } catch (e: any) {
      console.error('Suspend error:', e)
      toast({ title: 'Erro', description: e.message || 'Falha ao suspender.', type: 'error' })
    }
  }, [toast])

  const reactivateClinic = useCallback(async (id: string) => {
    try {
      await invoke('suspend_clinic', { clinicId: id, payload: { suspender: false } })
      toast({ title: 'Clínica Reativada', description: 'Acesso restaurado.', type: 'success' })
    } catch {
      toast({ title: 'Erro', description: 'Falha ao reativar.', type: 'error' })
    }
  }, [toast])

  const deleteClinic = useCallback(async (id: string) => {
    try {
      await invoke('delete_clinic', { clinicId: id })
      toast({ title: 'Clínica Deletada', description: 'Dados removidos.', type: 'success' })
    } catch {
      toast({ title: 'Erro', description: 'Falha ao deletar.', type: 'error' })
    }
  }, [toast])

  const impersonateClinic = useCallback(async (clinicId: string) => {
    setIsLoading(true)
    try {
      await invoke('impersonate_clinic', { clinicId })
      toast({ title: 'Impersonação', description: 'Token gerado.', type: 'info' })
    } catch {
      toast({ title: 'Erro', description: 'Falha na impersonação.', type: 'error' })
    } finally { setIsLoading(false) }
  }, [toast])

  // Usuários
  const getUsers = useCallback(async () => {
    setIsLoading(true)
    try { const d = await invoke('get_users'); return d?.users ?? [] }
    catch (e: any) { console.error('Users Error:', e); return [] }
    finally { setIsLoading(false) }
  }, [])

  const createUser = useCallback(async (formData: any) => {
    setIsLoading(true)
    try {
      const data = await invoke('create_user', { payload: formData })
      if (data?.error) throw new Error(data.error)
      toast({ title: 'Sucesso', description: 'Usuário criado!', type: 'success' })
      return data
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, type: 'error' })
      return null
    } finally { setIsLoading(false) }
  }, [toast])

  // Financeiro
  const getFinanceiro = useCallback(async () => {
    setIsLoading(true)
    try { return await invoke('get_financeiro') }
    catch (e: any) { console.error('Financeiro Error:', e); return null }
    finally { setIsLoading(false) }
  }, [])

  // Logs
  const getAuditLogs = useCallback(async (filters?: any) => {
    setIsLoading(true)
    try { const d = await invoke('get_audit_logs', { payload: filters }); return d?.logs ?? [] }
    catch (e: any) { console.error('Logs Error:', e); return [] }
    finally { setIsLoading(false) }
  }, [])

  // Suporte
  const getSuporte = useCallback(async () => {
    setIsLoading(true)
    try { const d = await invoke('get_suporte'); return d?.tickets ?? [] }
    catch (e: any) { console.error('Suporte Error:', e); return [] }
    finally { setIsLoading(false) }
  }, [])

  return {
    isLoading,
    getDashboard,
    getClinics, createClinic, suspendClinic, reactivateClinic, deleteClinic, impersonateClinic,
    getUsers, createUser,
    getFinanceiro,
    getAuditLogs,
    getSuporte,
  }
}
