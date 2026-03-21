import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Download,
  Stethoscope,
  Award,
  DollarSign,
  Loader2,
  RefreshCw
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { useToast } from '../../hooks/useToast'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

interface ProfissionalStat {
  id: string
  profissional: string
  especialidade: string
  atendimentos: number
  receita: number
}

function getPeriodoDates(periodo: string): { inicio: string; fim: string } {
  const now = new Date()
  const fmt = (d: Date) => d.toISOString().split('T')[0]
  if (periodo === 'Hoje') {
    return { inicio: fmt(now), fim: fmt(now) }
  }
  if (periodo === 'Esta semana') {
    const start = new Date(now)
    start.setDate(now.getDate() - now.getDay())
    return { inicio: fmt(start), fim: fmt(now) }
  }
  if (periodo === 'Este mês') {
    return { inicio: fmt(new Date(now.getFullYear(), now.getMonth(), 1)), fim: fmt(now) }
  }
  if (periodo === 'Mês passado') {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const end = new Date(now.getFullYear(), now.getMonth(), 0)
    return { inicio: fmt(start), fim: fmt(end) }
  }
  // Últimos 30 dias (default)
  const start = new Date(now)
  start.setDate(now.getDate() - 30)
  return { inicio: fmt(start), fim: fmt(now) }
}

export function ProducaoProfissionalReport() {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const clinicaId = user?.clinicaId

  const [periodo, setPeriodo] = useState('Últimos 30 dias')
  const [filterProfId, setFilterProfId] = useState('')
  const [stats, setStats] = useState<ProfissionalStat[]>([])
  const [profissionais, setProfissionais] = useState<{ id: string; nome: string }[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const loadProfissionais = useCallback(async () => {
    if (!clinicaId) return
    const { data } = await supabase
      .from('profiles')
      .select('id, nome_completo')
      .eq('clinica_id', clinicaId)
      .eq('role', 'profissional')
      .eq('ativo', true)
    setProfissionais((data || []).map((p: any) => ({ id: p.id, nome: p.nome_completo })))
  }, [clinicaId])

  const loadStats = useCallback(async () => {
    if (!clinicaId) return
    setIsLoading(true)
    try {
      const { inicio, fim } = getPeriodoDates(periodo)

      // Busca consultas no período, filtradas por profissional se selecionado
      let query = supabase
        .from('consultas')
        .select('id, profissional_id, valor, profiles!consultas_profissional_id_fkey(nome_completo, especialidade)')
        .eq('clinica_id', clinicaId)
        .gte('data_consulta', inicio)
        .lte('data_consulta', fim)

      if (filterProfId) {
        query = query.eq('profissional_id', filterProfId)
      }

      const { data, error } = await query
      if (error) throw error

      // Agrupa por profissional
      const map = new Map<string, ProfissionalStat>()
      for (const c of data || []) {
        const prof = (c as any).profiles
        const pid = c.profissional_id as string
        if (!map.has(pid)) {
          map.set(pid, {
            id: pid,
            profissional: prof?.nome_completo || 'Desconhecido',
            especialidade: prof?.especialidade || '—',
            atendimentos: 0,
            receita: 0,
          })
        }
        const s = map.get(pid)!
        s.atendimentos += 1
        s.receita += Number(c.valor) || 0
      }

      setStats(Array.from(map.values()).sort((a, b) => b.receita - a.receita))
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }, [clinicaId, periodo, filterProfId, toast])

  useEffect(() => { loadProfissionais() }, [loadProfissionais])

  const totals = {
    atendimentos: stats.reduce((s, r) => s + r.atendimentos, 0),
    receita: stats.reduce((s, r) => s + r.receita, 0),
    ticketMedio: stats.length > 0
      ? stats.reduce((s, r) => s + r.receita, 0) / stats.reduce((s, r) => s + r.atendimentos, 0) || 0
      : 0,
  }

  const exportPDF = () => {
    const doc = new jsPDF() as any
    doc.setFontSize(16)
    doc.text('Relatório: Produção por Profissional', 14, 20)
    doc.setFontSize(10)
    doc.text(`Período: ${periodo}`, 14, 28)
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 34)

    doc.autoTable({
      startY: 42,
      head: [['Profissional', 'Especialidade', 'Atendimentos', 'Receita Gerada']],
      body: [
        ...stats.map(r => [
          r.profissional,
          r.especialidade,
          r.atendimentos,
          r.receita.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        ]),
        ['TOTAL', '', totals.atendimentos, totals.receita.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })],
      ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [99, 102, 241] },
      footStyles: { fillColor: [241, 245, 249], fontStyle: 'bold' },
    })

    doc.save(`producao-profissional-${periodo.replace(/\s/g, '-').toLowerCase()}.pdf`)
  }

  const chartData = stats.map(s => ({ nome: s.profissional.split(' ').slice(0, 2).join(' '), atendimentos: s.atendimentos }))

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      <header className="px-6 py-6 bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to="/relatorios" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <div className="flex gap-2 items-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                Relatórios › Clínico
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Produção por Profissional</h1>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={exportPDF}
              disabled={isLoading || stats.length === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm transition-all disabled:opacity-50"
            >
              <Download size={18} /> Exportar PDF
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Período</label>
            <select
              value={periodo}
              onChange={e => setPeriodo(e.target.value)}
              className="p-2.5 text-sm font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl min-w-[200px] outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option>Hoje</option>
              <option>Esta semana</option>
              <option>Este mês</option>
              <option>Últimos 30 dias</option>
              <option>Mês passado</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Profissional</label>
            <select
              value={filterProfId}
              onChange={e => setFilterProfId(e.target.value)}
              className="p-2.5 text-sm font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl min-w-[200px] outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Todos os profissionais</option>
              {profissionais.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>

          <button
            onClick={loadStats}
            disabled={isLoading}
            className="flex items-center gap-2 p-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-md px-6 h-[46px] disabled:opacity-50"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            Gerar Relatório
          </button>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto w-full space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
          </div>
        ) : stats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <Stethoscope className="w-16 h-16 mb-4 text-slate-200" />
            <p className="font-bold text-lg">Nenhum dado no período</p>
            <p className="text-sm mt-1">Clique em "Gerar Relatório" para buscar os dados.</p>
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <Stethoscope size={20} className="text-indigo-600 mb-3" />
                <span className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Atendimentos</span>
                <span className="text-3xl font-black text-slate-900">{totals.atendimentos}</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <DollarSign size={20} className="text-emerald-600 mb-3" />
                <span className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Receita Gerada</span>
                <span className="text-3xl font-black text-slate-900">
                  {totals.receita.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <Award size={20} className="text-amber-600 mb-3" />
                <span className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Ticket Médio</span>
                <span className="text-3xl font-black text-slate-900">
                  {totals.ticketMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </div>

            {/* Gráfico */}
            {chartData.length > 0 && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-base font-bold text-slate-800 mb-6">Atendimentos por Profissional</h3>
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="nome" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} dy={8} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <Tooltip
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="atendimentos" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Tabela */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-200 bg-slate-50">
                <h3 className="text-base font-bold text-slate-800">Detalhamento Analítico</h3>
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-4">Profissional</th>
                    <th className="px-6 py-4">Especialidade</th>
                    <th className="px-6 py-4 text-center">Atendimentos</th>
                    <th className="px-6 py-4 text-right">Receita Gerada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium">
                  {stats.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800">{row.profissional}</td>
                      <td className="px-6 py-4 text-slate-500">{row.especialidade}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-slate-100 px-2.5 py-1 rounded text-slate-700 font-bold">{row.atendimentos}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-emerald-600">
                        {row.receita.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 border-t-2 border-slate-200 font-black text-slate-900">
                    <td className="px-6 py-4 uppercase text-xs tracking-widest" colSpan={2}>Total Geral</td>
                    <td className="px-6 py-4 text-center">{totals.atendimentos}</td>
                    <td className="px-6 py-4 text-right text-emerald-700">
                      {totals.receita.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
