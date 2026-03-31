import { useAuthStore } from '../store/authStore'

// ─── Definição dos limites por plano ──────────────────────────────────────────
export interface PlanLimits {
  maxPacientes: number | null        // null = ilimitado
  maxUsuarios: number | null
  maxIaChamadas: number | null
  maxStorageGb: number
  temHarmonizacao: boolean
  temNexus: false | 'basico' | 'completo'
  numRelatorios: number
  numWhatsApp: number
  temAusencias: boolean
  temEstoque: false | 'basico' | 'completo'
  temDashboardIA: boolean
}

const PLAN_LIMITS: Record<string, PlanLimits> = {
  starter: {
    maxPacientes: 500,
    maxUsuarios: 1,
    maxIaChamadas: 0,
    maxStorageGb: 0.5,
    temHarmonizacao: false,
    temNexus: false,
    numRelatorios: 3,
    numWhatsApp: 0,
    temAusencias: false,
    temEstoque: false,
    temDashboardIA: false,
  },
  professional: {
    maxPacientes: null,
    maxUsuarios: 2,
    maxIaChamadas: 200,
    maxStorageGb: 5,
    temHarmonizacao: true,
    temNexus: 'basico',
    numRelatorios: 8,
    numWhatsApp: 1,
    temAusencias: true,
    temEstoque: 'basico',
    temDashboardIA: true,
  },
  clinic: {
    maxPacientes: null,
    maxUsuarios: 8,
    maxIaChamadas: 1000,
    maxStorageGb: 20,
    temHarmonizacao: true,
    temNexus: 'completo',
    numRelatorios: 13,
    numWhatsApp: 2,
    temAusencias: true,
    temEstoque: 'completo',
    temDashboardIA: true,
  },
  enterprise: {
    maxPacientes: null,
    maxUsuarios: null,
    maxIaChamadas: null,
    maxStorageGb: 100,
    temHarmonizacao: true,
    temNexus: 'completo',
    numRelatorios: 13,
    numWhatsApp: 5,
    temAusencias: true,
    temEstoque: 'completo',
    temDashboardIA: true,
  },
}

// IDs dos relatórios disponíveis por plano (em ordem)
const RELATORIOS_STARTER = ['pac-atend', 'fat-per', 'inadimp']
const RELATORIOS_PROFESSIONAL = ['prod-prof', 'proc-real', 'pac-atend', 'taxa-ret', 'fat-per', 'rec-conv', 'inadimp', 'fun-conv']
// Clinic e Enterprise: todos os 13+

// ─── Hook principal ───────────────────────────────────────────────────────────
export function usePlan() {
  const { user } = useAuthStore()
  const isSuperAdmin = user?.role === 'superadmin'

  // SuperAdmin tem acesso total como se fosse Enterprise
  const plano = isSuperAdmin ? 'enterprise' : (user?.clinicaPlano ?? 'professional')
  const status = user?.clinicaStatusPlano ?? 'ativo'
  const trialAte = user?.clinicaTrialAte

  const isTrialExpired = trialAte
    ? new Date(trialAte) < new Date()
    : false

  const isActive = isSuperAdmin || status === 'ativo' || (status === 'trial' && !isTrialExpired)
  const isTrial = !isSuperAdmin && status === 'trial' && !isTrialExpired
  const isSuspenso = !isSuperAdmin && (status === 'suspenso' || status === 'cancelado' || (status === 'trial' && isTrialExpired))

  const limits = PLAN_LIMITS[plano] ?? PLAN_LIMITS['professional']

  /** Verifica se o recurso (contagem) está no limite do plano */
  function isAtLimit(resource: 'pacientes' | 'usuarios', currentCount: number): boolean {
    if (isSuperAdmin) return false
    if (resource === 'pacientes') {
      return limits.maxPacientes !== null && currentCount >= limits.maxPacientes
    }
    if (resource === 'usuarios') {
      return limits.maxUsuarios !== null && currentCount >= limits.maxUsuarios
    }
    return false
  }

  /** Percentual de uso (0-100), null se ilimitado */
  function usagePercent(resource: 'pacientes' | 'usuarios', currentCount: number): number | null {
    if (resource === 'pacientes' && limits.maxPacientes !== null) {
      return Math.min(100, Math.round((currentCount / limits.maxPacientes) * 100))
    }
    if (resource === 'usuarios' && limits.maxUsuarios !== null) {
      return Math.min(100, Math.round((currentCount / limits.maxUsuarios) * 100))
    }
    return null
  }

  /** Dias restantes no trial */
  function daysLeftInTrial(): number | null {
    if (!isTrial || !trialAte) return null
    const diff = new Date(trialAte).getTime() - Date.now()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  /** Verifica se um relatório está disponível no plano atual */
  function hasRelatorio(id: string): boolean {
    if (isSuperAdmin || plano === 'enterprise' || plano === 'clinic') return true
    if (plano === 'professional') return RELATORIOS_PROFESSIONAL.includes(id)
    return RELATORIOS_STARTER.includes(id)
  }

  return {
    plano,
    status,
    isActive,
    isTrial,
    isSuspenso,
    isTrialExpired,
    isSuperAdmin,
    limits,
    isAtLimit,
    usagePercent,
    daysLeftInTrial,
    hasRelatorio,
    PLAN_LIMITS,
  }
}
