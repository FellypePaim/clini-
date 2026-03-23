import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Role } from '../types'
import { supabase } from '../lib/supabase'

// ─── Interface do Store ────────────────────────────────
interface AuthState {
  user: User | null
  isAuthenticated: boolean
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
            set({ user: userParsed, isAuthenticated: true, isLoading: false, error: null })
            return true
          }
        } catch (e: any) {
          set({ isLoading: false, error: e.message || 'Erro ao realizar login.', isAuthenticated: false, user: null })
          return false
        }

        return false
      },

      logout: async () => {
        await supabase.auth.signOut()
        set({ user: null, isAuthenticated: false, error: null })
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'prontuario-verde-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

// ─── Hook de permissões ────────────────────────────────
export const usePermissions = () => {
  const { user } = useAuthStore()
  const role: Role | null = user?.role ?? null

  return {
    isAdmin: role === 'administrador',
    isProfissional: role === 'profissional',
    isRecepcao: role === 'recepção',
    role,
  }
}

// ─── Setup Auth Listener ────────────────────────────────
export function initAuth() {
  supabase.auth.onAuthStateChange(async (event) => {
    if (event === 'SIGNED_OUT') {
      useAuthStore.getState().logout()
    }
  })
}
