import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Download, Megaphone, CheckCircle, Play, FileText, Loader2, Calendar } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Badge } from '../../components/ui/Badge'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'

interface Campanha {
  id: string
  nome: string
  mensagem?: string
  status: 'rascunho' | 'enviando' | 'concluida' | 'pausada'
  created_at: string
}

interface MesData {
  mes: string
  total: number
}

function getPeriodoDates(periodo: string): { inicio: Date; fim: Date } {
  const now = new Date()
  if (periodo === 'ultimos_7d') {
    const inicio = new Date(now)
    inicio.setDate(now.getDate() - 7)
    return { inicio, fim: now }
  }
  if (periodo === 'ultimos_30d') {
    const inicio = new Date(now)
    inicio.setDate(now.getDate() - 30)
    return { inicio, fim: now }
  }
  return {
    inicio: new Date(now.getFullYear(), 0, 1),
    fim: new Date(now.getFullYear(), 11, 31),
  }
}

const STATUS_LABEL: Record<string, string> = {
  rascunho: 'Rascunho',
  enviando: 'Enviando',
  concluida: 'Concluída',
  pausada: 'Pausada',
}

const STATUS_COLORS: Record<string, string> = {
  rascunho: 'bg-[var(--color-bg-card)] text-[var(--color-text-secondary)]',
  enviando: 'bg-blue-50 text-blue-700',
  concluida: 'bg-emerald-50 text-emerald-700',
  pausada: 'bg-amber-50 text-amber-700',
}

export function CampanhasReport() {
  const { user } = useAuthStore()
  const clinicaId = user?.clinicaId
  const [periodo, setPeriodo] = useState('ultimos_30d')
  const [campanhas, setCampanhas] = useState<Campanha[]>([])
  const [porMes, setPorMes] = useState<MesData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadData = useCallback(async () => {
    if (!clinicaId) return
    setIsLoading(true)

    const { inicio, fim } = getPeriodoDates(periodo)
    const inicioStr = inicio.toISOString()
    const fimStr = fim.toISOString()

    try {
      const { data, error } = await supabase
        .from('campanhas' as any)
        .select('id, nome, mensagem, status, created_at')
        .eq('clinica_id', clinicaId)
        .gte('created_at', inicioStr)
        .lte('created_at', fimStr)
        .order('created_at', { ascending: false })

      if (error) throw error

      const mapped: Campanha[] = (data as any[] || []).map((c: any) => ({
        id: c.id,
        nome: c.nome || '—',
        mensagem: c.mensagem,
        status: c.status,
        created_at: c.created_at,
      }))

      setCampanhas(mapped)

      const agrupado: Record<string, number> = {}
      mapped.forEach((c) => {
        const mes = new Date(c.created_at).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
        agrupado[mes] = (agrupado[mes] ?? 0) + 1
      })

      const evo = Object.entries(agrupado)
        .sort((a, b) => {
          const parse = (s: string) => {
            const [m, y] = s.split('/')
            return new Date(parseInt(`20${y}`), ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'].indexOf(m.toLowerCase()), 1)
          }
          return parse(a[0]).getTime() - parse(b[0]).getTime()
        })
        .map(([mes, total]) => ({ mes, total }))

      setPorMes(evo)
    } catch {
      // silently ignore
    } finally {
      setIsLoading(false)
    }
  }, [clinicaId, periodo])

  useEffect(() => { loadData() }, [loadData])

  const total = campanhas.length
  const concluidas = campanhas.filter(c => c.status === 'concluida').length
  const ativas = campanhas.filter(c => c.status === 'enviando').length
  const rascunhos = campanhas.filter(c => c.status === 'rascunho').length

  const periodoLabel =
    periodo === 'ultimos_7d' ? 'Últimos 7 dias' :
    periodo === 'ultimos_30d' ? 'Últimos 30 dias' :
    `Ano ${new Date().getFullYear()}`

  const exportPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text('Relatório de Desempenho de Campanhas', 14, 18)
    doc.setFontSize(10)
    doc.text(`Período: ${periodoLabel}   |   Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 26)
    doc.setFontSize(11)
    doc.text(`Total: ${total}   Concluídas: ${concluidas}   Ativas: ${ativas}   Rascunhos: ${rascunhos}`, 14, 34)

    autoTable(doc, {
      startY: 42,
      head: [['Nome da Campanha', 'Status', 'Data de Criação']],
      body: campanhas.map(c => [
        c.nome,
        STATUS_LABEL[c.status] ?? c.status,
        new Date(c.created_at).toLocaleDateString('pt-BR'),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [99, 102, 241] },
    })

    doc.save(`relatorio-campanhas-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg-card)]">
      <header className="px-6 py-6 bg-[var(--color-bg-card)] border-b border-[var(--color-border)]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to="/relatorios" className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-card)] rounded-lg transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <div className="flex gap-2 items-center text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-[0.2em] mb-1">
                Relatórios <ArrowLeft size={10} className="rotate-180" /> Campanhas
              </div>
              <h1 className="text-2xl font-black text-[var(--color-text-primary)] uppercase">Desempenho de Campanhas</h1>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={exportPDF}
              disabled={isLoading || campanhas.length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-[var(--color-bg-card)] font-black text-[11px] uppercase tracking-widest text-[var(--color-text-secondary)] rounded-2xl hover:bg-[var(--color-border)] transition-all border border-[var(--color-border)] disabled:opacity-50"
            >
              <Download size={16} /> Exportar PDF
            </button>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex flex-col gap-1.5 min-w-[300px]">
            <label className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest ml-1">Período de Análise</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] w-4 h-4" />
              <select
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                className="w-full pl-11 pr-4 py-3 text-xs font-black text-[var(--color-text-primary)] bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all uppercase tracking-widest appearance-none"
              >
                <option value="ultimos_7d">Últimos 7 dias</option>
                <option value="ultimos_30d">Últimos 30 dias</option>
                <option value="ano_atual">Todo o Ano {new Date().getFullYear()}</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <main className="p-6 max-w-[1400px] mx-auto w-full space-y-6">

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Campanhas', valor: total, icon: <Megaphone size={20} />, color: 'indigo', dark: true, sub: periodoLabel },
            { label: 'Concluídas', valor: concluidas, icon: <CheckCircle size={20} />, color: 'emerald', sub: 'Envios finalizados' },
            { label: 'Ativas / Enviando', valor: ativas, icon: <Play size={20} />, color: 'blue', sub: 'Em andamento agora' },
            { label: 'Rascunhos', valor: rascunhos, icon: <FileText size={20} />, color: 'amber', sub: 'Aguardando envio' },
          ].map((kpi, i) => (
            <div key={i} className={`p-6 rounded-3xl border shadow-sm relative overflow-hidden flex flex-col justify-between h-[160px] ${kpi.dark ? 'bg-indigo-900 border-indigo-900 text-white' : 'bg-[var(--color-bg-card)] border-[var(--color-border)]'}`}>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${kpi.dark ? 'text-indigo-200' : 'text-[var(--color-text-muted)]'}`}>{kpi.label}</span>
                <div className={`p-2.5 rounded-xl ${kpi.dark ? 'bg-[var(--color-bg-card)]/10 text-white' : `bg-${kpi.color}-50 text-${kpi.color}-600`}`}>{kpi.icon}</div>
              </div>
              <div>
                <span className="text-3xl font-black block leading-none">{kpi.valor}</span>
                <p className="text-[10px] font-bold mt-2 uppercase tracking-wide opacity-60">{kpi.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Gráfico por mês */}
        <div className="bg-[var(--color-bg-card)] p-8 rounded-[32px] border border-[var(--color-border)] shadow-sm">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-black text-[var(--color-text-primary)] uppercase tracking-widest">Campanhas por Mês</h3>
              <p className="text-[11px] text-[var(--color-text-muted)] font-bold mt-1 uppercase tracking-tight">Distribuição temporal das campanhas criadas</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-indigo-500" />
              <span className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">Campanhas</span>
            </div>
          </div>

          <div className="h-[320px] w-full">
            {isLoading ? (
              <div className="h-full w-full bg-[var(--color-bg-deep)] rounded-3xl animate-pulse flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-300" />
              </div>
            ) : porMes.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-[var(--color-text-dim)] border-2 border-dashed border-[var(--color-border)] rounded-3xl">
                <Megaphone className="w-16 h-16 mb-4 opacity-20" />
                <p className="font-black text-[var(--color-text-muted)] uppercase tracking-widest text-xs text-center px-8">
                  Nenhuma campanha encontrada. Crie sua primeira campanha no módulo Nexus.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={porMes} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="mes"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px -10px rgb(0 0 0 / 0.1)', padding: '16px' }}
                    formatter={(value: any) => [value, 'Campanhas']}
                  />
                  <Bar dataKey="total" fill="#6366f1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Tabela de campanhas */}
        <div className="bg-[var(--color-bg-card)] rounded-[32px] border border-[var(--color-border)] shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
            <h3 className="text-sm font-black text-[var(--color-text-primary)] uppercase tracking-widest">Listagem de Campanhas</h3>
            <Badge className="bg-indigo-50 text-indigo-700 font-black border-none px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest">
              {campanhas.length} Campanhas
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[var(--color-bg-card)] border-b border-slate-50 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">
                  <th className="px-8 py-5">Nome da Campanha</th>
                  <th className="px-8 py-5 text-center">Status</th>
                  <th className="px-8 py-5">Data de Criação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-bold">
                {isLoading ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center">
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                      </div>
                    </td>
                  </tr>
                ) : campanhas.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-12 text-center text-[var(--color-text-muted)] uppercase tracking-widest text-xs">
                      Nenhuma campanha encontrada. Crie sua primeira campanha no módulo Nexus.
                    </td>
                  </tr>
                ) : campanhas.map((row) => (
                  <tr key={row.id} className="hover:bg-[var(--color-bg-card-hover)]/50 transition-colors group">
                    <td className="px-8 py-4 text-[var(--color-text-primary)] text-sm group-hover:text-indigo-600 transition-colors">
                      {row.nome}
                    </td>
                    <td className="px-8 py-4 text-center">
                      <Badge className={`text-[9px] font-black border-none uppercase tracking-widest ${STATUS_COLORS[row.status] ?? 'bg-[var(--color-bg-card)] text-[var(--color-text-secondary)]'}`}>
                        {STATUS_LABEL[row.status] ?? row.status}
                      </Badge>
                    </td>
                    <td className="px-8 py-4 font-mono text-[11px] text-[var(--color-text-muted)]">
                      {new Date(row.created_at).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
