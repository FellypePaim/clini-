import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Download, Users, UserCheck, BarChart2, Star, Loader2, Calendar, RepeatIcon } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Badge } from '../../components/ui/Badge'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { cn } from '../../lib/utils'

interface Consulta {
  id: string
  data: string
  paciente_id: string
}

interface Paciente {
  id: string
  nome_completo: string
  total_consultas: number
  ultima_consulta: string | null
  convenio: string | null
}

interface DistribuicaoVisitas {
  faixa: string
  quantidade: number
}

function getPeriodoDates(periodo: string): { inicio: Date; fim: Date } {
  const now = new Date()
  if (periodo === 'mes_atual') {
    return {
      inicio: new Date(now.getFullYear(), now.getMonth(), 1),
      fim: new Date(now.getFullYear(), now.getMonth() + 1, 0),
    }
  }
  if (periodo === 'trimestre') {
    const trimestre = Math.floor(now.getMonth() / 3)
    return {
      inicio: new Date(now.getFullYear(), trimestre * 3, 1),
      fim: new Date(now.getFullYear(), trimestre * 3 + 3, 0),
    }
  }
  return {
    inicio: new Date(now.getFullYear(), 0, 1),
    fim: new Date(now.getFullYear(), 11, 31),
  }
}

export function RetornoReport() {
  const { user } = useAuthStore()
  const clinicaId = user?.clinicaId
  const [periodo, setPeriodo] = useState('mes_atual')
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadData = useCallback(async () => {
    if (!clinicaId) return
    setIsLoading(true)

    const { inicio, fim } = getPeriodoDates(periodo)
    const inicioStr = inicio.toISOString().split('T')[0]
    const fimStr = fim.toISOString().split('T')[0]

    try {
      // Buscar pacientes básicos
      const { data: pacientesData, error: pacError } = await supabase
        .from('pacientes' as any)
        .select('id, nome_completo, convenio')
        .eq('clinica_id', clinicaId)

      if (pacError) throw pacError

      // Buscar consultas no período para calcular total_consultas e ultima_consulta
      const { data: consultasData, error: consError } = await supabase
        .from('consultas' as any)
        .select('id, data, paciente_id')
        .eq('clinica_id', clinicaId)
        .gte('data', inicioStr)
        .lte('data', fimStr + 'T23:59:59')

      if (consError) throw consError

      const consultas = (consultasData as any[] || []) as Consulta[]

      // Agrupar consultas por paciente
      const consultasPorPaciente: Record<string, { total: number; ultima: string | null }> = {}
      consultas.forEach((c) => {
        if (!consultasPorPaciente[c.paciente_id]) {
          consultasPorPaciente[c.paciente_id] = { total: 0, ultima: null }
        }
        consultasPorPaciente[c.paciente_id].total += 1
        const dataConsulta = c.data
        if (!consultasPorPaciente[c.paciente_id].ultima || dataConsulta > consultasPorPaciente[c.paciente_id].ultima!) {
          consultasPorPaciente[c.paciente_id].ultima = dataConsulta
        }
      })

      // Montar lista de pacientes com consultas no período
      const result: Paciente[] = (pacientesData as any[] || [])
        .filter((p: any) => consultasPorPaciente[p.id])
        .map((p: any) => ({
          id: p.id,
          nome_completo: p.nome_completo || '—',
          total_consultas: consultasPorPaciente[p.id]?.total || 0,
          ultima_consulta: consultasPorPaciente[p.id]?.ultima || null,
          convenio: p.convenio || null,
        }))
        .sort((a: Paciente, b: Paciente) => b.total_consultas - a.total_consultas)

      setPacientes(result)
    } finally {
      setIsLoading(false)
    }
  }, [clinicaId, periodo])

  useEffect(() => { loadData() }, [loadData])

  const totalPacientes = pacientes.length
  const retornaram = pacientes.filter(p => p.total_consultas > 1).length
  const taxaRetorno = totalPacientes > 0 ? (retornaram / totalPacientes) * 100 : 0
  const mediaConsultas = totalPacientes > 0
    ? pacientes.reduce((s, p) => s + p.total_consultas, 0) / totalPacientes
    : 0

  const distribuicao: DistribuicaoVisitas[] = [
    { faixa: '1 visita', quantidade: pacientes.filter(p => p.total_consultas === 1).length },
    { faixa: '2–3 visitas', quantidade: pacientes.filter(p => p.total_consultas >= 2 && p.total_consultas <= 3).length },
    { faixa: '4+ visitas', quantidade: pacientes.filter(p => p.total_consultas >= 4).length },
  ]

  const top10 = pacientes.slice(0, 10)

  const periodoLabel = periodo === 'mes_atual'
    ? 'Mês Atual'
    : periodo === 'trimestre'
    ? 'Trimestre Atual'
    : `Ano ${new Date().getFullYear()}`

  const exportPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text('Relatório de Taxa de Retorno de Pacientes', 14, 18)
    doc.setFontSize(10)
    doc.text(`Período: ${periodoLabel}   |   Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 26)
    doc.setFontSize(11)
    doc.text(`Total de Pacientes: ${totalPacientes}   Retornaram: ${retornaram}   Taxa: ${taxaRetorno.toFixed(1)}%   Média: ${mediaConsultas.toFixed(1)} consultas`, 14, 34)

    autoTable(doc, {
      startY: 42,
      head: [['Paciente', 'Convênio', 'Total de Consultas', 'Última Consulta']],
      body: top10.map(p => [
        p.nome_completo,
        p.convenio || 'Particular',
        String(p.total_consultas),
        p.ultima_consulta
          ? new Date(p.ultima_consulta + 'T00:00').toLocaleDateString('pt-BR')
          : '—',
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [99, 102, 241] },
    })

    doc.save(`relatorio-retorno-${new Date().toISOString().split('T')[0]}.pdf`)
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
                Relatórios <ArrowLeft size={10} className="rotate-180" /> Pacientes
              </div>
              <h1 className="text-2xl font-black text-slate-900 uppercase">Taxa de Retorno de Pacientes</h1>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={exportPDF}
              disabled={isLoading || pacientes.length === 0}
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
                <option value="mes_atual">Este Mês ({new Date().toLocaleDateString('pt-BR', { month: 'short' })})</option>
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
            { label: 'Total Pacientes', valor: String(totalPacientes), icon: <Users size={20} />, color: 'indigo', sub: 'No período selecionado', dark: false },
            { label: 'Retornaram', valor: String(retornaram), icon: <RepeatIcon size={20} />, color: 'emerald', sub: 'Mais de 1 consulta', dark: false },
            { label: 'Taxa de Retorno', valor: `${taxaRetorno.toFixed(1)}%`, icon: <UserCheck size={20} />, color: 'indigo', sub: 'Fidelização geral', dark: true },
            { label: 'Média de Consultas', valor: mediaConsultas.toFixed(1), icon: <Star size={20} />, color: 'amber', sub: 'Por paciente', dark: false },
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

        {/* Gráfico de Distribuição */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Distribuição por Número de Visitas</h3>
              <p className="text-[11px] text-slate-400 font-bold mt-1 uppercase tracking-tight">Segmentação de pacientes por frequência de consultas</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-indigo-500" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pacientes</span>
            </div>
          </div>

          <div className="h-[360px] w-full">
            {isLoading ? (
              <div className="h-full w-full bg-slate-50 rounded-3xl animate-pulse flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-300" />
              </div>
            ) : distribuicao.every(d => d.quantidade === 0) ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-50 rounded-3xl">
                <BarChart2 className="w-16 h-16 mb-4 opacity-20" />
                <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Nenhum dado encontrado para o período selecionado.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distribuicao} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="faixa"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }}
                    dy={15}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px -10px rgb(0 0 0 / 0.1)', padding: '16px' }}
                    labelStyle={{ fontWeight: 900, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b' }}
                    formatter={(value: any) => [value, 'Pacientes']}
                  />
                  <Bar dataKey="quantidade" fill="#6366f1" radius={[12, 12, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Tabela Top 10 */}
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Pacientes com Mais Consultas</h3>
            <Badge className="bg-indigo-50 text-indigo-700 font-black border-none px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest">
              Top {Math.min(10, top10.length)}
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="px-8 py-5">#</th>
                  <th className="px-8 py-5">Paciente</th>
                  <th className="px-8 py-5">Convênio</th>
                  <th className="px-8 py-5 text-center">Total Consultas</th>
                  <th className="px-8 py-5 text-right">Última Consulta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-bold">
                {isLoading ? (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-300">Carregando...</td></tr>
                ) : top10.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Users className="w-10 h-10 text-slate-200" />
                        <p className="font-black text-slate-300 uppercase tracking-widest text-xs">Nenhum dado encontrado para o período selecionado.</p>
                      </div>
                    </td>
                  </tr>
                ) : top10.map((p, i) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-4 font-mono text-[11px] text-slate-400">{i + 1}</td>
                    <td className="px-8 py-4 text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">{p.nome_completo}</td>
                    <td className="px-8 py-4">
                      <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                        {p.convenio || 'Particular'}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-center">
                      <Badge className={cn(
                        'text-[10px] font-black border-none uppercase tracking-widest',
                        p.total_consultas >= 4
                          ? 'bg-emerald-50 text-emerald-700'
                          : p.total_consultas >= 2
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'bg-slate-100 text-slate-500'
                      )}>
                        {p.total_consultas} {p.total_consultas === 1 ? 'consulta' : 'consultas'}
                      </Badge>
                    </td>
                    <td className="px-8 py-4 text-right font-mono text-[11px] text-slate-400">
                      {p.ultima_consulta
                        ? new Date(p.ultima_consulta + 'T00:00').toLocaleDateString('pt-BR')
                        : '—'}
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
