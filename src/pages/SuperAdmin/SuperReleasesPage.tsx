import React from 'react'
import {
  Flag,
  Rocket,
  GitBranch,
  GitCommit,
  Tag,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowUpCircle,
  Package,
  Server,
  ExternalLink,
} from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { cn } from '../../lib/utils'
import { useToast } from '../../hooks/useToast'

interface Release {
  version: string
  date: string
  title: string
  description: string
  type: 'major' | 'feature' | 'fix' | 'patch'
  status: 'production' | 'staging' | 'rollback'
  changes: string[]
  author: string
}

const RELEASES: Release[] = [
  {
    version: 'v1.4.0',
    date: '27/03/2026',
    title: 'E2E Testing & Bug Fixes Completos',
    description: 'Correção de 15+ bugs encontrados em testes E2E completos. Todas as 47 telas validadas com 0 erros.',
    type: 'major',
    status: 'production',
    changes: [
      'Fix: Loop infinito no logout (onAuthStateChange recursivo)',
      'Fix: Harmonização query — estoque_atual/custo_unitario',
      'Fix: RetornoReport data → data_hora_inicio',
      'Fix: usePatients data_hora → data_hora_inicio',
      'Fix: 7 bugs E2E — relatórios financeiros + prontuário queries',
      'Fix: RLS policy UPDATE para clinicas',
      'Redeploy: Edge Function superadmin-actions',
    ],
    author: 'Claude + Fellype',
  },
  {
    version: 'v1.3.0',
    date: '25/03/2026',
    title: 'Gestão de Ausências & UX Improvements',
    description: 'Sistema completo de ausências de profissionais com detecção de conflitos e fila WhatsApp.',
    type: 'feature',
    status: 'production',
    changes: [
      'Feat: Sistema de ausências de profissionais (CRUD + conflitos)',
      'Feat: Code-splitting — bundle de 3.1MB → 562KB',
      'Feat: Melhorias UX em Pacientes, Estoque, Prescrições',
      'Feat: Configurações da clínica — máscaras, ViaCEP, horários',
      'Feat: Alertas do sistema (notificações internas)',
      'Migration: profissional_ausencias + clinicas UPDATE policy',
    ],
    author: 'Claude + Fellype',
  },
  {
    version: 'v1.2.0',
    date: '23/03/2026',
    title: 'SuperAdmin Panel & AI Gateway',
    description: 'Painel completo de SuperAdmin com 11 abas e integração OVYVA via Gemini 2.5 Flash.',
    type: 'major',
    status: 'production',
    changes: [
      'Feat: SuperAdmin Dashboard com 11 abas completas',
      'Feat: OVYVA AI Agent — Gemini 2.5 Flash via ai-gateway',
      'Feat: Edge Functions — register, user-manager, superadmin-actions',
      'Feat: WhatsApp Integration — Evolution API webhooks',
      'Feat: Multi-tenant RLS policies completas',
    ],
    author: 'Claude + Fellype',
  },
  {
    version: 'v1.1.0',
    date: '19/03/2026',
    title: 'Módulos Financeiro & Estoque',
    description: 'Implementação dos módulos de controle financeiro, estoque e prescrições.',
    type: 'feature',
    status: 'production',
    changes: [
      'Feat: Módulo Financeiro completo (transações, lançamentos, DRE)',
      'Feat: Controle de estoque com alertas de mínimo',
      'Feat: Prescrições com templates e impressão',
      'Feat: 5 Relatórios (Retorno, Faturamento, Convênio, Inadimplência, DRE)',
    ],
    author: 'Fellype',
  },
  {
    version: 'v1.0.0',
    date: '15/03/2026',
    title: 'Launch — Prontuário Verde',
    description: 'Versão inicial com agenda, prontuário eletrônico, cadastro de pacientes e dashboard.',
    type: 'major',
    status: 'production',
    changes: [
      'Feat: Dashboard com KPIs e gráficos',
      'Feat: Agenda de consultas com drag & drop',
      'Feat: Prontuário eletrônico completo (PEP)',
      'Feat: Cadastro de pacientes com busca',
      'Feat: Autenticação multi-tenant com RLS',
      'Infra: Supabase + Vercel + React 19 + Tailwind 4',
    ],
    author: 'Fellype',
  },
]

export function SuperReleasesPage() {
  const { toast } = useToast()
  const [selectedRelease, setSelectedRelease] = React.useState<Release>(RELEASES[0])

  const getTypeBadge = (type: Release['type']) => {
    const map = {
      major: { label: 'MAJOR', cls: 'bg-indigo-500/10 text-indigo-400' },
      feature: { label: 'FEATURE', cls: 'bg-blue-500/10 text-blue-400' },
      fix: { label: 'HOTFIX', cls: 'bg-red-500/10 text-red-400' },
      patch: { label: 'PATCH', cls: 'bg-[var(--color-bg-deep)]0/10 text-[var(--color-text-muted)]' },
    }
    const { label, cls } = map[type]
    return <Badge className={cn(cls, 'text-[8px] font-black border-none')}>{label}</Badge>
  }

  const getStatusIcon = (status: Release['status']) => {
    if (status === 'production') return <CheckCircle2 size={14} className="text-emerald-500" />
    if (status === 'staging') return <AlertCircle size={14} className="text-purple-400" />
    return <ArrowUpCircle size={14} className="text-amber-500" />
  }

  const getTypeIcon = (type: Release['type']) => {
    if (type === 'major') return <Rocket size={16} />
    if (type === 'feature') return <Package size={16} />
    return <GitCommit size={16} />
  }

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">Release Management</h1>
          <p className="text-[var(--color-text-muted)] font-medium">Histórico de versões, changelog e controle de deploy.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
            <Server size={14} className="text-emerald-500" />
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
              Produção: {RELEASES[0].version}
            </span>
          </div>
          <button
            onClick={() => toast({ title: 'Deploy via CI/CD', description: 'Push para main → Vercel auto-deploy. Edge Functions: npx supabase functions deploy.', type: 'info' })}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl transition-all"
          >
            <Rocket size={18} /> NOVO DEPLOY
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Releases', value: RELEASES.length.toString(), icon: Tag, color: 'text-indigo-400' },
          { label: 'Em Produção', value: RELEASES.filter(r => r.status === 'production').length.toString(), icon: CheckCircle2, color: 'text-emerald-400' },
          { label: 'Major Releases', value: RELEASES.filter(r => r.type === 'major').length.toString(), icon: Rocket, color: 'text-purple-400' },
          { label: 'Última Release', value: RELEASES[0].date, icon: Clock, color: 'text-amber-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-slate-800/30 border border-slate-700/50 p-5 rounded-[24px]">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon size={14} className={stat.color} />
              <span className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">{stat.label}</span>
            </div>
            <span className="text-xl font-black text-white">{stat.value}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Timeline (Col-Span-1) */}
        <div className="space-y-4">
          <h3 className="text-xs font-black text-[var(--color-text-muted)] uppercase tracking-[0.2em] flex items-center gap-2">
            <GitBranch size={16} /> TIMELINE
          </h3>
          <div className="space-y-2">
            {RELEASES.map(rel => (
              <button
                key={rel.version}
                onClick={() => setSelectedRelease(rel)}
                className={cn(
                  'w-full text-left p-4 rounded-[20px] border transition-all group',
                  selectedRelease.version === rel.version
                    ? 'bg-slate-800/60 border-indigo-500/30 shadow-lg shadow-indigo-500/5'
                    : 'bg-slate-800/20 border-slate-700/30 hover:bg-slate-800/40'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'text-xs font-black tracking-wider',
                      selectedRelease.version === rel.version ? 'text-indigo-400' : 'text-[var(--color-text-dim)]'
                    )}>
                      {rel.version}
                    </span>
                    {getTypeBadge(rel.type)}
                  </div>
                  {getStatusIcon(rel.status)}
                </div>
                <p className="text-[11px] font-bold text-[var(--color-text-muted)] line-clamp-1">{rel.title}</p>
                <span className="text-[10px] font-bold text-[var(--color-text-secondary)]">{rel.date}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Release Detail (Col-Span-2) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-800/30 border border-slate-700/50 p-8 rounded-[40px] space-y-6">
            {/* Release Header */}
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'p-3 rounded-2xl',
                    selectedRelease.type === 'major' ? 'bg-indigo-500/10 text-indigo-400'
                      : selectedRelease.type === 'feature' ? 'bg-blue-500/10 text-blue-400'
                      : 'bg-red-500/10 text-red-400'
                  )}>
                    {getTypeIcon(selectedRelease.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-black text-white">{selectedRelease.version}</h2>
                      {getTypeBadge(selectedRelease.type)}
                    </div>
                    <p className="text-xs font-bold text-[var(--color-text-muted)]">{selectedRelease.date} &middot; por {selectedRelease.author}</p>
                  </div>
                </div>
              </div>
              <div className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest',
                selectedRelease.status === 'production'
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                  : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
              )}>
                {getStatusIcon(selectedRelease.status)}
                {selectedRelease.status}
              </div>
            </div>

            {/* Title & Description */}
            <div>
              <h3 className="text-lg font-black text-white mb-2">{selectedRelease.title}</h3>
              <p className="text-sm font-medium text-[var(--color-text-muted)] leading-relaxed">{selectedRelease.description}</p>
            </div>

            {/* Changelog */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-[0.2em]">Changelog</h4>
              <div className="space-y-2">
                {selectedRelease.changes.map((change, i) => {
                  const isFeat = change.toLowerCase().startsWith('feat')
                  const isFix = change.toLowerCase().startsWith('fix')
                  const isInfra = change.toLowerCase().startsWith('infra') || change.toLowerCase().startsWith('migration') || change.toLowerCase().startsWith('redeploy')
                  return (
                    <div key={i} className="flex items-start gap-3 p-3 bg-slate-900/40 rounded-xl border border-slate-800/50">
                      <Badge className={cn(
                        'text-[7px] font-black border-none mt-0.5 shrink-0',
                        isFeat ? 'bg-blue-500/10 text-blue-400'
                          : isFix ? 'bg-red-500/10 text-red-400'
                          : isInfra ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-[var(--color-bg-deep)]0/10 text-[var(--color-text-muted)]'
                      )}>
                        {isFeat ? 'FEAT' : isFix ? 'FIX' : isInfra ? 'INFRA' : 'MISC'}
                      </Badge>
                      <span className="text-xs font-bold text-[var(--color-text-dim)] leading-relaxed">
                        {change.replace(/^(Feat|Fix|Infra|Migration|Redeploy):\s*/i, '')}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4 border-t border-slate-700/30">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${selectedRelease.version} — ${selectedRelease.title}`)
                  toast({ title: 'Copiado!', description: `${selectedRelease.version} copiado para a área de transferência.`, type: 'success' })
                }}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-[var(--color-text-dim)] text-[10px] font-black uppercase rounded-xl hover:bg-slate-700 transition-all"
              >
                <Tag size={12} /> Copiar Versão
              </button>
              <button
                onClick={() => window.open('https://github.com/FellypePaim/clini-/commits/main', '_blank')}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-[var(--color-text-dim)] text-[10px] font-black uppercase rounded-xl hover:bg-slate-700 transition-all"
              >
                <ExternalLink size={12} /> Ver no GitHub
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
