import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CreditCard, Zap, Users, Brain, ArrowUpRight, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { usePlan } from '../../hooks/usePlan'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { cn } from '../../lib/utils'

// ─── Plan display metadata ─────────────────────────────────────────────────────
const PLAN_META: Record<string, { label: string; price: string; color: string; badge: string }> = {
  starter:      { label: 'Starter',      price: 'R$ 97/mês',  color: 'text-slate-600',   badge: 'bg-slate-100 text-slate-700' },
  professional: { label: 'Professional', price: 'R$ 197/mês', color: 'text-indigo-600',  badge: 'bg-indigo-100 text-indigo-700' },
  clinic:       { label: 'Clinic',       price: 'R$ 397/mês', color: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700' },
  enterprise:   { label: 'Enterprise',   price: 'R$ 797/mês', color: 'text-amber-600',   badge: 'bg-amber-100 text-amber-700' },
}

const PLAN_FEATURES: Record<string, string[]> = {
  starter: [
    'Até 500 pacientes',
    '1 usuário',
    '3 relatórios básicos',
    '0,5 GB de armazenamento',
    'Agenda e prontuário',
    'Prescrições digitais',
  ],
  professional: [
    'Pacientes ilimitados',
    'Até 2 usuários',
    '8 relatórios',
    '5 GB de armazenamento',
    '200 mensagens LYRA/mês',
    '1 número WhatsApp',
    'Módulo Harmonização',
    'Dashboard IA',
    'Ausências e férias',
    'Estoque básico',
    'Nexus CRM básico',
  ],
  clinic: [
    'Pacientes ilimitados',
    'Até 8 usuários',
    '13 relatórios',
    '20 GB de armazenamento',
    '1.000 mensagens LYRA/mês',
    '2 números WhatsApp',
    'Módulo Harmonização',
    'Dashboard IA',
    'Ausências e férias',
    'Estoque completo',
    'Nexus CRM completo',
  ],
  enterprise: [
    'Pacientes ilimitados',
    'Usuários ilimitados',
    'Todos os relatórios',
    '100 GB de armazenamento',
    'Mensagens LYRA ilimitadas',
    '5 números WhatsApp',
    'Módulo Harmonização',
    'Dashboard IA',
    'Ausências e férias',
    'Estoque completo',
    'Nexus CRM completo',
    'Suporte prioritário',
  ],
}

// ─── Progress bar sub-component ───────────────────────────────────────────────
function UsageBar({
  label,
  icon,
  current,
  max,
  loading,
}: {
  label: string
  icon: React.ReactNode
  current: number
  max: number | null
  loading: boolean
}) {
  if (max === null) {
    return (
      <div className="flex items-center justify-between p-4 bg-[var(--color-bg-deep)] rounded-xl border border-[var(--color-border)]">
        <div className="flex items-center gap-3">
          <span className="text-indigo-500">{icon}</span>
          <div>
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">{label}</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              {loading ? 'Carregando...' : `${current.toLocaleString('pt-BR')} utilizados`}
            </p>
          </div>
        </div>
        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200">
          Ilimitado
        </span>
      </div>
    )
  }

  const pct = Math.min(100, Math.round((current / max) * 100))
  const isWarning = pct >= 80 && pct < 100
  const isAtLimit = pct >= 100

  return (
    <div className="p-4 bg-[var(--color-bg-deep)] rounded-xl border border-[var(--color-border)] space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={cn(
            isAtLimit ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-indigo-500'
          )}>{icon}</span>
          <div>
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">{label}</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              {loading
                ? 'Carregando...'
                : `${current.toLocaleString('pt-BR')} de ${max.toLocaleString('pt-BR')}`}
            </p>
          </div>
        </div>
        <span className={cn(
          'text-xs font-bold px-2 py-1 rounded-full border',
          isAtLimit
            ? 'text-red-700 bg-red-50 border-red-200'
            : isWarning
              ? 'text-amber-700 bg-amber-50 border-amber-200'
              : 'text-[var(--color-text-muted)] bg-[var(--color-bg-card)] border-[var(--color-border)]'
        )}>
          {loading ? '—' : `${pct}%`}
        </span>
      </div>
      <div className="h-2 bg-[var(--color-border)] rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            isAtLimit ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-indigo-500'
          )}
          style={{ width: loading ? '0%' : `${pct}%` }}
        />
      </div>
      {isAtLimit && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 shrink-0" />
          Limite atingido — faça upgrade para continuar adicionando.
        </p>
      )}
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export function MeuPlanoPage() {
  const { user } = useAuthStore()
  const clinicaId = user?.clinicaId
  const { plano, status, isTrial, isSuspenso, daysLeftInTrial, limits } = usePlan()

  const meta = PLAN_META[plano] ?? PLAN_META['professional']
  const features = PLAN_FEATURES[plano] ?? []
  const daysLeft = daysLeftInTrial()

  // ─── Usage counts ───────────────────────────────────────
  const [pacientes, setPacientes] = useState(0)
  const [usuarios, setUsuarios] = useState(0)
  const [lyramsgs, setLyramsgs] = useState(0)
  const [loadingUsage, setLoadingUsage] = useState(true)

  useEffect(() => {
    if (!clinicaId) return

    async function fetchUsage() {
      setLoadingUsage(true)
      try {
        const startOfMonth = new Date()
        startOfMonth.setDate(1)
        startOfMonth.setHours(0, 0, 0, 0)

        const [pacRes, usrRes, lyraRes] = await Promise.all([
          supabase
            .from('pacientes')
            .select('*', { count: 'exact', head: true })
            .eq('clinica_id', clinicaId),
          supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('clinica_id', clinicaId),
          supabase
            .from('ai_usage_logs')
            .select('*', { count: 'exact', head: true })
            .eq('clinica_id', clinicaId)
            .eq('action', 'lyra_respond')
            .gte('created_at', startOfMonth.toISOString()),
        ])

        setPacientes(pacRes.count ?? 0)
        setUsuarios(usrRes.count ?? 0)
        setLyramsgs(lyraRes.count ?? 0)
      } catch {
        // silently ignore — counts stay at 0
      } finally {
        setLoadingUsage(false)
      }
    }

    fetchUsage()
  }, [clinicaId])

  // ─── Status badge ────────────────────────────────────────
  const statusBadge = isSuspenso
    ? { label: 'Suspenso', cls: 'bg-red-100 text-red-700 border-red-200' }
    : isTrial
      ? { label: 'Trial', cls: 'bg-amber-100 text-amber-700 border-amber-200' }
      : { label: 'Ativo', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' }

  return (
    <div className="space-y-6">
      {/* ── Current plan card ─────────────────────────────── */}
      <div className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-bg-deep)]/50">
          <h2 className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-indigo-600" /> Plano Atual
          </h2>
        </div>
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-center shrink-0">
                <CreditCard className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className={cn('text-xl font-bold', meta.color)}>{meta.label}</h3>
                  <span className={cn('text-[11px] font-bold px-2 py-0.5 rounded-full border', statusBadge.cls)}>
                    {statusBadge.label}
                  </span>
                </div>
                <p className="text-sm text-[var(--color-text-muted)] mt-0.5">{meta.price}</p>
                {isTrial && daysLeft !== null && (
                  <p className="text-xs text-amber-600 font-semibold mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {daysLeft === 0 ? 'Trial expira hoje!' : `${daysLeft} dia${daysLeft !== 1 ? 's' : ''} restante${daysLeft !== 1 ? 's' : ''} no trial`}
                  </p>
                )}
                {isSuspenso && (
                  <p className="text-xs text-red-600 font-semibold mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Conta suspensa — regularize para restaurar o acesso completo.
                  </p>
                )}
              </div>
            </div>
            <Link
              to="/planos"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors shrink-0"
            >
              <ArrowUpRight className="w-4 h-4" />
              Ver planos / Upgrade
            </Link>
          </div>
        </div>
      </div>

      {/* ── Usage bars ────────────────────────────────────── */}
      <div className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-bg-deep)]/50">
          <h2 className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-600" /> Uso do Plano
          </h2>
        </div>
        <div className="p-6 space-y-4">
          <UsageBar
            label="Pacientes"
            icon={<Users className="w-4 h-4" />}
            current={pacientes}
            max={limits.maxPacientes}
            loading={loadingUsage}
          />
          <UsageBar
            label="Usuários"
            icon={<Users className="w-4 h-4" />}
            current={usuarios}
            max={limits.maxUsuarios}
            loading={loadingUsage}
          />
          <UsageBar
            label="Mensagens LYRA (este mês)"
            icon={<Brain className="w-4 h-4" />}
            current={lyramsgs}
            max={limits.maxIaChamadas}
            loading={loadingUsage}
          />
        </div>
      </div>

      {/* ── Features list ─────────────────────────────────── */}
      <div className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-bg-deep)]/50">
          <h2 className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" /> Recursos Incluídos
          </h2>
        </div>
        <div className="p-6">
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {features.map((feat) => (
              <li key={feat} className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                {feat}
              </li>
            ))}
          </ul>

          {/* Show what's NOT in starter/professional */}
          {(plano === 'starter' || plano === 'professional') && (
            <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
              <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
                Disponível em planos superiores
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(plano === 'starter'
                  ? ['Pacientes ilimitados', 'Múltiplos usuários', 'LYRA IA', 'WhatsApp integrado', 'Dashboard IA', 'Relatórios avançados']
                  : ['Até 8 usuários', '1.000 mensagens LYRA/mês', '2 números WhatsApp', 'Estoque completo', 'Nexus CRM completo']
                ).map((feat) => (
                  <li key={feat} className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                    <XCircle className="w-4 h-4 text-[var(--color-text-muted)]/50 shrink-0" />
                    {feat}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* ── Upgrade CTA ───────────────────────────────────── */}
      {plano !== 'enterprise' && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="font-bold text-indigo-800 text-base">Quer mais recursos?</h3>
            <p className="text-sm text-indigo-600 mt-1">
              Faça upgrade para desbloquear mais usuários, mensagens LYRA e funcionalidades avançadas.
            </p>
          </div>
          <Link
            to="/planos"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors shrink-0"
          >
            <ArrowUpRight className="w-4 h-4" />
            Ver todos os planos
          </Link>
        </div>
      )}
    </div>
  )
}
