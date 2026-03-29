import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Role } from '../types'
import { ROLE_PERMISSIONS } from '../types'
import { supabase } from '../lib/supabase'

// ─── Interface do Store ────────────────────────────────
interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isPendingApproval: boolean
  isLoading: boolean
  error: string | null
  login: (email: string, senha: string) => Promise<boolean>
  logout: () => void
  clearError: () => void
}

// ─── Store de Autenticação ─────────────────────────────
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isPendingApproval: false,
      isLoading: false,
      error: null,

      login: async (email: string, senha: string) => {
        set({ isLoading: true, error: null })

        try {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha })

          if (error) throw error

          if (data.user) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*, clinicas(nome)')
              .eq('id', data.user.id)
              .single()

            const dbRole = (profileData?.role || 'recepcao') as string
            const mappedRole: Role = dbRole === 'superadmin' ? 'superadmin'
                                   : dbRole === 'admin' ? 'administrador'
                                   : dbRole === 'recepcao' ? 'recepção'
                                   : 'profissional'

            const userParsed: User = {
              id: data.user.id,
              nome: profileData?.nome_completo || data.user.email?.split('@')[0] || 'Usuário',
              email: data.user.email || '',
              role: mappedRole,
              especialidade: profileData?.especialidade || undefined,
              crm: (profileData as any)?.crm || undefined,
              clinicaId: profileData?.clinica_id || '',
              clinicaNome: (profileData as any)?.clinicas?.nome || undefined,
              ativo: true,
              criadoEm: data.user.created_at || new Date().toISOString(),
              avatar: profileData?.avatar_url || undefined,
            }
            const pendingApproval = dbRole !== 'superadmin' && (!profileData?.clinica_id || profileData?.ativo === false)
            set({
              user: userParsed,
              isAuthenticated: true,
              isPendingApproval: pendingApproval,
              isLoading: false,
              error: null,
            })
            return true
          }
        } catch (e: any) {
          set({ isLoading: false, error: e.message || 'Erro ao realizar login.', isAuthenticated: false, isPendingApproval: false, user: null })
          return false
        }

        return false
      },

      logout: async () => {
        set({ user: null, isAuthenticated: false, isPendingApproval: false, error: null })
        try { await supabase.auth.signOut() } catch { /* always clear state */ }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'prontuario-verde-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isPendingApproval: state.isPendingApproval,
      }),
    }
  )
)

// ─── Hook de permissões ────────────────────────────────
export const usePermissions = () => {
  const { user } = useAuthStore()
  const role: Role | null = user?.role ?? null
  const perms = role ? ROLE_PERMISSIONS[role] : null

  return {
    isAdmin: role === 'administrador',
    isProfissional: role === 'profissional',
    isRecepcao: role === 'recepção',
    isSuperAdmin: role === 'superadmin',
    role,
    // Permissões granulares
    canViewAllSchedules: perms?.canViewAllSchedules ?? false,
    canManagePatients: perms?.canManagePatients ?? false,
    canViewFinancial: perms?.canViewFinancial ?? false,
    canManageStock: perms?.canManageStock ?? false,
    canManageUsers: perms?.canManageUsers ?? false,
    canViewReports: perms?.canViewReports ?? false,
    canWritePrescriptions: perms?.canWritePrescriptions ?? false,
    hasRole: (...roles: Role[]) => role !== null && roles.includes(role),
  }
}

// ─── Setup Auth Listener ────────────────────────────────
let authListenerSetup = false

export function initAuth() {
  if (authListenerSetup) return          // evita listeners duplicados (React StrictMode)
  authListenerSetup = true

  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') {
      // Limpa o state diretamente — NÃO chama logout() para evitar loop infinito
      // (logout → signOut → SIGNED_OUT → logout → signOut → ...)
      useAuthStore.setState({ user: null, isAuthenticated: false, isPendingApproval: false, error: null })
    }
  })
}
