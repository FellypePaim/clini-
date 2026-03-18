import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Role } from '../types'
import { supabase } from '../lib/supabase'

// ─── Mock de usuários para autenticação ───────────────
const MOCK_USERS: (User & { senha: string })[] = [
  {
    id: 'usr-001',
    nome: 'Dr. Rafael Mendes',
    email: 'admin@clinicaverde.com.br',
    senha: 'admin123',
    role: 'administrador',
    especialidade: 'Clínica Geral',
    crm: 'CRM-SP 98765',
    clinicaId: 'clinica-001',
    ativo: true,
    criadoEm: '2024-01-15T08:00:00Z',
    avatar: undefined,
  },
  {
    id: 'usr-002',
    nome: 'Dra. Camila Souza',
    email: 'profissional@clinicaverde.com.br',
    senha: 'prof123',
    role: 'profissional',
    especialidade: 'Dermatologia',
    crm: 'CRM-SP 54321',
    clinicaId: 'clinica-001',
    ativo: true,
    criadoEm: '2024-02-01T08:00:00Z',
  },
  {
    id: 'usr-003',
    nome: 'Ana Clara Ribeiro',
    email: 'recepcao@clinicaverde.com.br',
    senha: 'rec123',
    role: 'recepção',
    clinicaId: 'clinica-001',
    ativo: true,
    criadoEm: '2024-03-01T08:00:00Z',
  },
]

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

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

        if (USE_MOCK) {
          // Simula latência de rede
          await new Promise((resolve) => setTimeout(resolve, 800))

          const found = MOCK_USERS.find(
            (u) => u.email === email && u.senha === senha && u.ativo
          )

          if (found) {
            const { senha: _senha, ...user } = found
            set({ user, isAuthenticated: true, isLoading: false, error: null })
            return true
          }

          set({ isLoading: false, error: 'E-mail ou senha incorretos (Mock).', isAuthenticated: false, user: null })
          return false
        }

        // Supabase Real
        try {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha })
          
          if (error) throw error
          
          if (data.user) {
            // Busca o role/profile do usuario na tablea `profiles` (exemplo)
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.user.id)
              .single()

            // Mapeia role do banco para role do frontend
            const dbRole = profileData?.role || 'recepcao'
            const mappedRole: Role = dbRole === 'admin' ? 'administrador' 
                                   : dbRole === 'recepcao' ? 'recepção' 
                                   : 'profissional'

            const userParsed: User = {
                id: data.user.id,
                nome: profileData?.nome_completo || data.user.email?.split('@')[0] || 'Usuário',
                email: data.user.email || '',
                role: mappedRole,
                clinicaId: profileData?.clinica_id || 'clinica-001',
                ativo: true,
                criadoEm: data.user.created_at || new Date().toISOString()
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
        if (!USE_MOCK) {
          await supabase.auth.signOut()
        }
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
  if (USE_MOCK) return

  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_OUT') {
      useAuthStore.getState().logout()
    }
  })
}
