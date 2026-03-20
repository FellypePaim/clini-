import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Download, Users, Share2, Smartphone, Globe, Loader2, Calendar } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Badge } from '../../components/ui/Badge'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'

interface OrigemData {
  origem: string
  count: number
  percentual: number
}

function getPeriodoDates(periodo: string): { inicio: Date; fim: Date } {
  const now = new Date()
  if (periodo === 'mes_atual') {
    return {
      inicio: new Date(now.getFullYear(), now.getMonth(), 1),
      fim: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
    }
  }
  if (periodo === 'trimestre') {
    const trimestre = Math.floor(now.getMonth() / 3)
    return {
      inicio: new Date(now.getFullYear(), trimestre * 3, 1),
      fim: new Date(now.getFullYear(), trimestre * 3 + 3, 0, 23, 59, 59),
    }
  }
  return {
    inicio: new Date(now.getFullYear(), 0, 1),
    fim: new Date(now.getFullYear(), 11, 31, 23, 59, 59),
  }
}

const ORIGEM_LABEL: Record<string, string> = {
  instagram: 'Instagram',
  whatsapp: 'WhatsApp',
  indicacao: 'Indicação',
  google: 'Google',
  site: 'Site',
  outro: 'Outro',
}

const ORIGEM_COLORS: string[] = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6']

function origemLabel(origem: string): string {
  return ORIGEM_LABEL[origem?.toLowerCase()] ?? origem ?? 'Outro'
}

export function OrigemReport() {
  const { user } = useAuthStore()
  const clinicaId = user?.clinicaId
  const [periodo, setPeriodo] = useState('mes_atual')
  const [origens, setOrigens] = useState<OrigemData[]>([])
  const [totalLeads, setTotalLeads] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const loadData = useCallback(async () => {
    if (!clinicaId) return
    setIsLoading(true)

    const { inicio, fim } = getPeriodoDates(periodo)
    const inicioStr = inicio.toISOString()
    const fimStr = fim.toISOString()

    try {
      const { data, error } = await supabase
        .from('leads' as any)
        .select('id, origem')
        .eq('clinica_id', clinicaId)
        .gte('created_at', inicioStr)
        .lte('created_at', fimStr)

      if (error) throw error

      const rows = (data as any[] || [])
      const total = rows.length
      setTotalLeads(total)

      const agrupado: Record<string, number> = {}
      rows.forEach((r: any) => {
        const key = (r.origem ?? 'outro').toLowerCase()
        agrupado[key] = (agrupado[key] ?? 0) + 1
      })

      const origemList: OrigemData[] = Object.entries(agrupado)
        .sort((a, b) => b[1] - a[1])
        .map(([origem, count]) => ({
          origem,
          count,
          percentual: total > 0 ? Math.round((count / total) * 100) : 0,
        }))

      setOrigens(origemList)
    } catch {
      // silently ignore
    } finally {
      setIsLoading(false)
    }
  }, [clinicaId, periodo])

  useEffect(() => { loadData() }, [loadData])

  const indicacao = origens.find(o => o.origem === 'indicacao')
  const redesSociais = origens
    .filter(o => ['instagram', 'whatsapp'].includes(o.origem))
    .reduce((s, o) => s + o.count, 0)
  const digital = origens
    .filter(o => ['google', 'site'].includes(o.origem))
    .reduce((s, o) => s + o.count, 0)

  const pct = (n: number) => totalLeads > 0 ? `${Math.round((n / totalLeads) * 100)}%` : '0%'

  const periodoLabel =
    periodo === 'mes_atual' ? 'Mês Atual' :
    periodo === 'trimestre' ? 'Trimestre Atual' :
    `Ano ${new Date().getFullYear()}`

  const exportPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text('Relatório de Origem de Pacientes', 14, 18)
    doc.setFontSize(10)
    doc.text(`Período: ${periodoLabel}   |   Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 26)
    doc.setFontSize(11)
    doc.text(`Total de Leads: ${totalLeads}`, 14, 34)

    autoTable(doc, {
      startY: 42,
      head: [['Origem', 'Quantidade', 'Percentual']],
      body: origens.map(o => [
        origemLabel(o.origem),
        String(o.count),
        `${o.percentual}%`,
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [99, 102, 241] },
    })

    doc.save(`relatorio-origem-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const pieData = origens.map((o) => ({
    name: origemLabel(o.origem),
    value: o.count,
  }))

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
                Relatórios <ArrowLeft size={10} className="rotate-180" /> Origem
              </div>
              <h1 className="text-2xl font-black text-slate-900 uppercase">Origem de Pacientes</h1>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={exportPDF}
              disabled={isLoading || origens.length === 0}
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
                <option value="mes_atual">Mês Atual</option>
                <option value="trimestre">Trimestre Atual</option>
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
            {
              label: 'Total Leads',
              valor: String(totalLeads),
              icon: <Users size={20} />,
              color: 'indigo',
              dark: true,
              sub: periodoLabel,
            },
            {
              label: 'Indicação',
              valor: pct(indicacao?.count ?? 0),
              icon: <Share2 size={20} />,
              color: 'emerald',
              sub: `${indicacao?.count ?? 0} leads por indicação`,
            },
            {
              label: 'Redes Sociais',
              valor: pct(redesSociais),
              icon: <Smartphone size={20} />,
              color: 'blue',
              sub: `${redesSociais} leads via Instagram/WhatsApp`,
            },
            {
              label: 'Digital',
              valor: pct(digital),
              icon: <Globe size={20} />,
              color: 'amber',
              sub: `${digital} leads via Google/Site`,
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
          {/* Pie Chart */}
          <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
            <div className="mb-8">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Distribuição por Origem</h3>
              <p className="text-[11px] text-slate-400 font-bold mt-1 uppercase tracking-tight">Proporção de leads por canal de captação</p>
            </div>

            <div className="h-[300px] w-full">
              {isLoading ? (
                <div className="h-full w-full bg-slate-50 rounded-3xl animate-pulse flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-300" />
                </div>
              ) : pieData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-100 rounded-3xl">
                  <Users className="w-16 h-16 mb-4 opacity-20" />
                  <p className="font-black text-slate-400 uppercase tracking-widest text-xs text-center px-8">
                    Nenhum dado de origem encontrado.
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={120}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell key={index} fill={ORIGEM_COLORS[index % ORIGEM_COLORS.length]} />
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

          {/* Tabela de origens */}
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Canais de Captação</h3>
              <Badge className="bg-indigo-50 text-indigo-700 font-black border-none px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest">
                {origens.length} Origens
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-8 py-5">Origem</th>
                    <th className="px-8 py-5 text-center">Leads</th>
                    <th className="px-8 py-5 text-right">Percentual</th>
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
                  ) : origens.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-12 text-center text-slate-400 uppercase tracking-widest text-xs">
                        Nenhum dado de origem encontrado. Os dados são coletados através do módulo Verdesk (CRM).
                      </td>
                    </tr>
                  ) : origens.map((row, i) => (
                    <tr key={row.origem} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-4 text-slate-900 text-sm">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: ORIGEM_COLORS[i % ORIGEM_COLORS.length] }}
                          />
                          {origemLabel(row.origem)}
                        </div>
                      </td>
                      <td className="px-8 py-4 text-center text-slate-700">{row.count}</td>
                      <td className="px-8 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <div className="w-24 bg-slate-100 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full"
                              style={{
                                width: `${row.percentual}%`,
                                backgroundColor: ORIGEM_COLORS[i % ORIGEM_COLORS.length],
                              }}
                            />
                          </div>
                          <span className="text-sm font-black text-slate-700 w-10 text-right">{row.percentual}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
