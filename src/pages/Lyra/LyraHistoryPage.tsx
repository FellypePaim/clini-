import { useState, useEffect, useCallback } from 'react'
import { 
  ArrowLeft, Search, CheckCircle, Clock, UserPlus,
  MessageSquare, Bot, User, Zap
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/utils'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'

interface Conversa {
  id: string
  created_at: string
  contato_nome: string | null
  contato_telefone: string
  status: string
  total_mensagens: number
  ultimo_contato: string | null
  leads: boolean
}

export function LyraHistoryPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const clinicaId = user?.clinicaId

  const [activeFilter, setActiveFilter] = useState<'all' | 'resolvido' | 'transferido'>('all')
  const [search, setSearch] = useState('')
  const [conversas, setConversas] = useState<Conversa[]>([])
  const [loading, setLoading] = useState(true)

  const [kpis, setKpis] = useState({
    total: 0,
    resolvidosIA: 0,
    tempoMedio: '—',
    leadsGerados: 0,
  })

  const loadData = useCallback(async () => {
    if (!clinicaId) return
    setLoading(true)

    // Buscar conversas
    const { data } = await supabase
      .from('lyra_conversas')
      .select('id, created_at, contato_nome, contato_telefone, status, total_mensagens, ultimo_contato')
      .eq('clinica_id', clinicaId)
      .order('ultimo_contato', { ascending: false })
      .limit(100)

    if (data) {
      const mapped: Conversa[] = data.map((c: any) => ({
        ...c,
        leads: false, // Será melhorado com join leads quando disponível
      }))
      setConversas(mapped)

      // Calcular KPIs reais
      const total = mapped.length
      const resolvidosIA = mapped.filter(c => c.status === 'ia_ativa' || c.status === 'concluido').length
      const pct = total > 0 ? Math.round((resolvidosIA / total) * 100) : 0

      // Buscar leads gerados a partir do LYRA
      const { count: leadsCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('clinica_id', clinicaId)
        .eq('origem', 'WhatsApp LYRA')

      // Calcular tempo médio entre mensagens
      const totalMsgs = mapped.reduce((acc, c) => acc + (c.total_mensagens || 0), 0)
      const avgMsgsPerConv = total > 0 ? Math.round(totalMsgs / total) : 0

      setKpis({
        total,
        resolvidosIA: pct,
        tempoMedio: avgMsgsPerConv > 0 ? `~${avgMsgsPerConv} msgs/conv` : '—',
        leadsGerados: leadsCount ?? 0,
      })
    }
    setLoading(false)
  }, [clinicaId])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Filtros locais
  const conversasFiltradas = conversas.filter(c => {
    const matchFilter =
      activeFilter === 'all' ||
      (activeFilter === 'resolvido' && (c.status === 'ia_ativa' || c.status === 'concluido')) ||
      (activeFilter === 'transferido' && c.status === 'aguardando_humano')

    const matchSearch = !search ||
      (c.contato_nome?.toLowerCase().includes(search.toLowerCase()) ||
       c.contato_telefone?.includes(search))

    return matchFilter && matchSearch
  })

  const kpiCards = [
    { label: 'Total Atendimentos', value: String(kpis.total), icon: <MessageSquare className="w-5 h-5" />, color: 'blue' },
    { label: '% Resolvidos IA', value: `${kpis.resolvidosIA}%`, icon: <Bot className="w-5 h-5" />, color: 'green' },
    { label: 'Tempo Médio Resposta', value: kpis.tempoMedio, icon: <Zap className="w-5 h-5" />, color: 'orange' },
    { label: 'Leads Gerados', value: String(kpis.leadsGerados), icon: <UserPlus className="w-5 h-5" />, color: 'purple' },
  ]

  function formatData(isoString: string | null) {
    if (!isoString) return '—'
    return new Date(isoString).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  function getStatusLabel(status: string) {
    const map: Record<string, { label: string; icon: any; style: string }> = {
      'ia_ativa':         { label: 'Ativo-IA',        icon: Bot,  style: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
      'aguardando_humano': { label: 'Transf. Humano',  icon: User, style: 'bg-orange-50 text-orange-700 border-orange-100' },
      'atendido_humano':  { label: 'Atendido',        icon: CheckCircle, style: 'bg-blue-50 text-blue-700 border-blue-100' },
      'concluido':        { label: 'Concluído',       icon: CheckCircle, style: 'bg-[var(--color-bg-deep)] text-[var(--color-text-muted)] border-[var(--color-border)]' },
    }
    return map[status] ?? { label: status, icon: Clock, style: 'bg-[var(--color-bg-deep)] text-[var(--color-text-muted)] border-[var(--color-border)]' }
  }

  return (
    <div className="flex flex-col gap-8 animate-fade-in pb-10">
       {/* Header */}
       <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
             <button 
              onClick={() => navigate('/lyra')}
              className="p-3 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl hover:bg-[var(--color-bg-card-hover)] transition-all text-[var(--color-text-muted)] hover:text-cyan-500"
             >
                <ArrowLeft className="w-5 h-5" />
             </button>
             <div>
                <h1 className="text-2xl font-black text-[var(--color-text-primary)] border-none uppercase tracking-widest">Histórico LYRA</h1>
                <p className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase tracking-[0.2em]">
                   Conversas reais com seus pacientes via WhatsApp
                </p>
             </div>
          </div>
       </div>

       {/* KPI Grid */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpiCards.map((kpi, idx) => (
            <div key={idx} className="bg-[var(--color-bg-card)] rounded-[40px] p-8 border border-[var(--color-border)] shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all group overflow-hidden relative">
               <div className={cn(
                "absolute -top-10 -right-10 w-32 h-32 blur-3xl rounded-full opacity-10 group-hover:scale-150 transition-transform",
                kpi.color === 'blue' ? "bg-blue-500" : 
                kpi.color === 'green' ? "bg-emerald-500" :
                kpi.color === 'orange' ? "bg-orange-500" : "bg-purple-500"
               )} />
               <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-all group-hover:scale-110",
                kpi.color === 'blue' ? "bg-blue-50 text-blue-600" : 
                kpi.color === 'green' ? "bg-emerald-50 text-emerald-600" :
                kpi.color === 'orange' ? "bg-orange-50 text-orange-600" : "bg-purple-50 text-purple-600"
               )}>
                  {kpi.icon}
               </div>
               <p className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest mb-1">{kpi.label}</p>
               {loading ? (
                 <div className="h-8 w-16 bg-[var(--color-bg-card)] rounded animate-pulse" />
               ) : (
                 <h3 className="text-3xl font-black text-[var(--color-text-primary)] border-none">{kpi.value}</h3>
               )}
            </div>
          ))}
       </div>

       {/* Tabela */}
       <div className="bg-[var(--color-bg-card)] rounded-[40px] border border-[var(--color-border)] shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          <div className="p-8 border-b border-gray-50 flex items-center justify-between flex-wrap gap-4">
             <div className="flex items-center gap-6">
                <div className="relative group min-w-[280px]">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-[var(--color-text-muted)] group-hover:text-cyan-500 transition-colors" />
                  <input 
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Nome ou telefone..." 
                    className="w-full bg-[var(--color-bg-deep)] border-none rounded-2xl py-2.5 pl-10 pr-4 text-sm font-medium placeholder:text-[var(--color-text-dim)] outline-none focus:ring-2 focus:ring-cyan-500/10"
                  />
                </div>
                <div className="flex items-center bg-[var(--color-bg-deep)] p-1 rounded-xl">
                  {(['Todas', 'Resolvidas', 'Transferidas'] as const).map((f) => (
                    <button 
                      key={f}
                      onClick={() => setActiveFilter(f === 'Todas' ? 'all' : f === 'Resolvidas' ? 'resolvido' : 'transferido')}
                      className={cn(
                        "px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                        ((f === 'Todas' && activeFilter === 'all') || 
                        (f === 'Resolvidas' && activeFilter === 'resolvido') || 
                        (f === 'Transferidas' && activeFilter === 'transferido'))
                           ? "bg-[var(--color-bg-card)] text-[var(--color-text-primary)] shadow-sm" : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>
             </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center flex-1 p-12">
              <Clock className="w-6 h-6 animate-spin text-cyan-500" />
            </div>
          ) : conversasFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 p-12 text-[var(--color-text-muted)]">
              <MessageSquare className="w-12 h-12 mb-4 text-[var(--color-text-dim)]" />
              <p className="text-sm font-bold uppercase tracking-widest">Nenhuma conversa encontrada</p>
              <p className="text-xs mt-1">Configure o Webhook da Evolution API para começar a receber mensagens</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead className="sticky top-0 bg-[var(--color-bg-card)]/80 backdrop-blur-md z-10 border-b border-gray-50">
                    <tr>
                       {['Data/Hora', 'Contato', 'Telefone', 'Status', 'Mensagens', 'Último Contato'].map(h => (
                         <th key={h} className="px-8 py-6 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-[0.2em]">{h}</th>
                       ))}
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50/50">
                    {conversasFiltradas.map((row) => {
                      const statusInfo = getStatusLabel(row.status)
                      const StatusIcon = statusInfo.icon
                      return (
                        <tr key={row.id} className="hover:bg-[var(--color-bg-card-hover)]/50 transition-colors group">
                           <td className="px-8 py-5 text-xs font-black text-[var(--color-text-primary)] uppercase tracking-widest">
                             {formatData(row.created_at)}
                           </td>
                           <td className="px-8 py-5 text-xs font-black text-[var(--color-text-primary)]">
                             {row.contato_nome ?? <span className="text-[var(--color-text-muted)] italic">Sem nome</span>}
                           </td>
                           <td className="px-8 py-5 text-[11px] text-[var(--color-text-muted)] font-mono">
                             {row.contato_telefone}
                           </td>
                           <td className="px-8 py-5">
                              <span className={cn(
                                "inline-flex items-center gap-1.5 font-black text-[9px] uppercase tracking-widest px-2.5 py-1.5 rounded-lg border",
                                statusInfo.style
                              )}>
                                 <StatusIcon className="w-3.5 h-3.5" />
                                 {statusInfo.label}
                              </span>
                           </td>
                           <td className="px-8 py-5 text-xs text-[var(--color-text-muted)]">
                             {row.total_mensagens ?? 0}
                           </td>
                           <td className="px-8 py-5 text-[11px] text-[var(--color-text-muted)]">
                             {formatData(row.ultimo_contato)}
                           </td>
                        </tr>
                      )
                    })}
                 </tbody>
              </table>
            </div>
          )}
       </div>
    </div>
  )
}
