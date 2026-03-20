import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Download, Bot, UserCheck, PhoneCall, TrendingUp, Loader2, Calendar, MessageSquare } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { Badge } from '../../components/ui/Badge'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'

interface Conversa {
  id: string
  status: 'ia_ativa' | 'atendido_humano' | 'encerrado'
  created_at: string
  mensagens?: number
}

interface DiaData {
  dia: string
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
  // mes_atual
  return {
    inicio: new Date(now.getFullYear(), now.getMonth(), 1),
    fim: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
  }
}

const STATUS_LABEL: Record<string, string> = {
  ia_ativa: 'IA Ativa',
  atendido_humano: 'Humano',
  encerrado: 'Encerrado',
}

const STATUS_COLORS: Record<string, string> = {
  ia_ativa: 'bg-indigo-50 text-indigo-700',
  atendido_humano: 'bg-amber-50 text-amber-700',
  encerrado: 'bg-emerald-50 text-emerald-700',
}

const PIE_COLORS = ['#6366f1', '#f59e0b']

export function OVYVAReport() {
  const { user } = useAuthStore()
  const clinicaId = user?.clinicaId
  const [periodo, setPeriodo] = useState('ultimos_30d')
  const [conversas, setConversas] = useState<Conversa[]>([])
  const [porDia, setPorDia] = useState<DiaData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadData = useCallback(async () => {
    if (!clinicaId) return
    setIsLoading(true)

    const { inicio, fim } = getPeriodoDates(periodo)
    const inicioStr = inicio.toISOString()
    const fimStr = fim.toISOString()

    try {
      const { data: conversasData, error: conversasError } = await supabase
        .from('ovyva_conversas' as any)
        .select('id, status, created_at')
        .eq('clinica_id', clinicaId)
        .gte('created_at', inicioStr)
        .lte('created_at', fimStr)
        .order('created_at', { ascending: false })

      if (conversasError) throw conversasError

      const ids: string[] = (conversasData as any[] || []).map((c: any) => c.id)

      let mensagensPorConversa: Record<string, number> = {}

      if (ids.length > 0) {
        const { data: mensagensData } = await supabase
          .from('ovyva_mensagens' as any)
          .select('conversa_id')
          .in('conversa_id', ids)

        ;(mensagensData as any[] || []).forEach((m: any) => {
          const cid = m.conversa_id
          mensagensPorConversa[cid] = (mensagensPorConversa[cid] ?? 0) + 1
        })
      }

      const mapped: Conversa[] = (conversasData as any[] || []).map((c: any) => ({
        id: c.id,
        status: c.status,
        created_at: c.created_at,
        mensagens: mensagensPorConversa[c.id] ?? 0,
      }))

      setConversas(mapped)

      const agrupado: Record<string, number> = {}
      mapped.forEach((c) => {
        const dia = new Date(c.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
        agrupado[dia] = (agrupado[dia] ?? 0) + 1
      })

      const evo: DiaData[] = Object.entries(agrupado)
        .map(([dia, total]) => ({ dia, total }))

      setPorDia(evo)
    } catch {
      // silently ignore
    } finally {
      setIsLoading(false)
    }
  }, [clinicaId, periodo])

  useEffect(() => { loadData() }, [loadData])

  const totalConversas = conversas.length
  const resolvidasIA = conversas.filter(c => c.status === 'ia_ativa' || c.status === 'encerrado').length
  const transferidasHumano = conversas.filter(c => c.status === 'atendido_humano').length
  const taxaResolucaoIA = totalConversas > 0 ? Math.round((resolvidasIA / totalConversas) * 100) : 0

  const periodoLabel =
    periodo === 'ultimos_7d' ? 'Últimos 7 dias' :
    periodo === 'ultimos_30d' ? 'Últimos 30 dias' :
    'Mês Atual'

  const pieData = [
    { name: 'Resolvidas por IA', value: resolvidasIA },
    { name: 'Transferidas Humano', value: transferidasHumano },
  ].filter(d => d.value > 0)

  const exportPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text('Relatório de Desempenho OVYVA', 14, 18)
    doc.setFontSize(10)
    doc.text(`Período: ${periodoLabel}   |   Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 26)
    doc.setFontSize(11)
    doc.text(
      `Total: ${totalConversas}   Resolvidas IA: ${resolvidasIA}   Transferidas: ${transferidasHumano}   Taxa IA: ${taxaResolucaoIA}%`,
      14,
      34,
    )

    autoTable(doc, {
      startY: 42,
      head: [['Data', 'Status', 'Mensagens']],
      body: conversas.map(c => [
        new Date(c.created_at).toLocaleDateString('pt-BR'),
        STATUS_LABEL[c.status] ?? c.status,
        String(c.mensagens ?? 0),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [99, 102, 241] },
    })

    doc.save(`relatorio-ovyva-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      <header className="px-6 py-6 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to="/relatorios" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <div className="flex gap-2 items-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                Relatórios <ArrowLeft size={10} className="rotate-180" /> OVYVA
              </div>
              <h1 className="text-2xl font-black text-slate-900 uppercase">Desempenho da OVYVA</h1>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={exportPDF}
              disabled={isLoading || conversas.length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-slate-100 font-black text-[11px] uppercase tracking-widest text-slate-600 rounded-2xl hover:bg-slate-200 transition-all border border-slate-200 disabled:opacity-50"
            >
              <Download size={16} /> Exportar PDF
            </button>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex flex-col gap-1.5 min-w-[300px]">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Período de Análise</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <select
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                className="w-full pl-11 pr-4 py-3 text-xs font-black text-slate-800 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all uppercase tracking-widest appearance-none"
              >
                <option value="ultimos_7d">Últimos 7 dias</option>
                <option value="ultimos_30d">Últimos 30 dias</option>
                <option value="mes_atual">Mês Atual</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <main className="p-6 max-w-[1400px] mx-auto w-full space-y-6">

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            {
              label: 'Total Conversas',
              valor: String(totalConversas),
              icon: <MessageSquare size={20} />,
              color: 'indigo',
              dark: true,
              sub: periodoLabel,
            },
            {
              label: 'Resolvidas por IA',
              valor: String(resolvidasIA),
              icon: <Bot size={20} />,
              color: 'emerald',
              sub: 'IA ativa ou encerradas',
            },
            {
              label: 'Transferidas Humano',
              valor: String(transferidasHumano),
              icon: <UserCheck size={20} />,
              color: 'amber',
              sub: 'Atendidas por humano',
            },
            {
              label: 'Taxa Resolução IA',
              valor: `${taxaResolucaoIA}%`,
              icon: <TrendingUp size={20} />,
              color: 'blue',
              sub: 'Resolvidas sem humano',
            },
          ].map((kpi, i) => (
            <div key={i} className={`p-6 rounded-3xl border shadow-sm relative overflow-hidden flex flex-col justify-between h-[160px] ${kpi.dark ? 'bg-indigo-900 border-indigo-900 text-white' : 'bg-white border-slate-100'}`}>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${kpi.dark ? 'text-indigo-200' : 'text-slate-400'}`}>{kpi.label}</span>
                <div className={`p-2.5 rounded-xl ${kpi.dark ? 'bg-white/10 text-white' : `bg-${kpi.color}-50 text-${kpi.color}-600`}`}>{kpi.icon}</div>
              </div>
              <div>
                <span className="text-3xl font-black block leading-none">{kpi.valor}</span>
                <p className="text-[10px] font-bold mt-2 uppercase tracking-wide opacity-60">{kpi.sub}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* BarChart por dia */}
          <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
            <div className="mb-8">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Conversas por Dia</h3>
              <p className="text-[11px] text-slate-400 font-bold mt-1 uppercase tracking-tight">Volume diário de atendimentos OVYVA</p>
            </div>

            <div className="h-[280px] w-full">
              {isLoading ? (
                <div className="h-full w-full bg-slate-50 rounded-3xl animate-pulse flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-300" />
                </div>
              ) : porDia.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-100 rounded-3xl">
                  <Bot className="w-16 h-16 mb-4 opacity-20" />
                  <p className="font-black text-slate-400 uppercase tracking-widest text-xs text-center px-8">
                    Nenhuma conversa encontrada.
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={porDia} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="dia"
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
                      formatter={(value: any) => [value, 'Conversas']}
                    />
                    <Bar dataKey="total" fill="#6366f1" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Pie IA vs Humano */}
          <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
            <div className="mb-8">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">IA vs Humano</h3>
              <p className="text-[11px] text-slate-400 font-bold mt-1 uppercase tracking-tight">Distribuição de resolução por tipo de atendimento</p>
            </div>

            <div className="h-[280px] w-full">
              {isLoading ? (
                <div className="h-full w-full bg-slate-50 rounded-3xl animate-pulse flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-300" />
                </div>
              ) : pieData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-100 rounded-3xl">
                  <PhoneCall className="w-16 h-16 mb-4 opacity-20" />
                  <p className="font-black text-slate-400 uppercase tracking-widest text-xs text-center px-8">
                    Sem dados suficientes para exibir distribuição.
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={110}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px -10px rgb(0 0 0 / 0.1)', padding: '16px' }}
                      formatter={(value: any, name: any) => [value, name]}
                    />
                    <Legend
                      formatter={(value) => <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b' }}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Tabela de conversas recentes */}
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Conversas Recentes</h3>
            <Badge className="bg-indigo-50 text-indigo-700 font-black border-none px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest">
              {conversas.length} Conversas
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="px-8 py-5">Data</th>
                  <th className="px-8 py-5 text-center">Status</th>
                  <th className="px-8 py-5 text-right">Mensagens</th>
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
                ) : conversas.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-12 text-center text-slate-400 uppercase tracking-widest text-xs">
                      Nenhuma conversa encontrada. Configure o agente OVYVA para começar a atender seus pacientes automaticamente.
                    </td>
                  </tr>
                ) : conversas.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-4 font-mono text-[11px] text-slate-400">
                      {new Date(row.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-8 py-4 text-center">
                      <Badge className={`text-[9px] font-black border-none uppercase tracking-widest ${STATUS_COLORS[row.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {STATUS_LABEL[row.status] ?? row.status}
                      </Badge>
                    </td>
                    <td className="px-8 py-4 text-right text-slate-700 text-sm">
                      {row.mensagens ?? 0}
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
