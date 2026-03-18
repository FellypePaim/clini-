import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Role } from '../types'

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

        set({
          isLoading: false,
          error: 'E-mail ou senha incorretos.',
          isAuthenticated: false,
          user: null,
        })
        return false
      },

      logout: () => {
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
