import React, { useState } from 'react'
import { ArrowLeft, Download, Activity, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface ProcedimentoStat {
  nome: string
  total: number
  receita: number
  duracao_media: number
}

const PERIODOS = [
  { value: 'mes_atual', label: 'Este Mês' },
  { value: 'mes_anterior', label: 'Mês Passado' },
  { value: 'ano', label: `Ano ${new Date().getFullYear()}` },
]

export function ProcedimentosReport() {
  const { user } = useAuthStore()
  const [periodo, setPeriodo] = useState('mes_atual')
  const [dados, setDados] = useState<ProcedimentoStat[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const getRange = () => {
    const now = new Date()
    if (periodo === 'mes_atual') {
      return { inicio: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`, fim: now.toISOString().split('T')[0] }
    }
    if (periodo === 'mes_anterior') {
      const m = now.getMonth() === 0 ? 12 : now.getMonth()
      const y = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
      const ultimo = new Date(y, m, 0).getDate()
      return { inicio: `${y}-${String(m).padStart(2, '0')}-01`, fim: `${y}-${String(m).padStart(2, '0')}-${ultimo}` }
    }
    return { inicio: `${now.getFullYear()}-01-01`, fim: now.toISOString().split('T')[0] }
  }

  const gerar = async () => {
    if (!user?.clinicaId) return
    setIsLoading(true)
    try {
      const { inicio, fim } = getRange()
      const { data } = await supabase
        .from('consultas')
        .select('procedimento_id, procedimentos(nome, preco_base, duracao_minutos), status')
        .eq('clinica_id', user.clinicaId)
        .gte('data_consulta', inicio)
        .lte('data_consulta', fim)
        .neq('status', 'cancelado')

      const map = new Map<string, ProcedimentoStat>()
      for (const c of (data ?? []) as any[]) {
        const proc = c.procedimentos
        if (!proc) continue
        const key = proc.nome
        const cur = map.get(key) ?? { nome: proc.nome, total: 0, receita: 0, duracao_media: proc.duracao_minutos ?? 0 }
        cur.total++
        cur.receita += proc.preco_base ?? 0
        map.set(key, cur)
      }
      setDados(Array.from(map.values()).sort((a, b) => b.total - a.total))
    } finally {
      setIsLoading(false)
    }
  }

  const exportPDF = () => {
    const doc = new jsPDF()
    const periodoLabel = PERIODOS.find(p => p.value === periodo)?.label ?? periodo
    doc.setFontSize(16)
    doc.text('Relatório de Procedimentos Realizados', 14, 18)
    doc.setFontSize(10)
    doc.text(`Período: ${periodoLabel}   |   Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 26)
    autoTable(doc, {
      startY: 32,
      head: [['Procedimento', 'Realizados', 'Receita (R$)', 'Duração Média']],
      body: dados.map(d => [
        d.nome,
        d.total,
        d.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
        `${d.duracao_media} min`,
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [99, 102, 241] },
    })
    doc.save(`procedimentos-${periodo}.pdf`)
  }

  const totalProcedimentos = dados.reduce((s, d) => s + d.total, 0)
  const totalReceita = dados.reduce((s, d) => s + d.receita, 0)

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      <header className="px-6 py-5 bg-white border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/relatorios" className="text-slate-400 hover:text-slate-600">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Relatórios › Clínico</p>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Activity size={20} className="text-indigo-500" />
              Procedimentos Realizados
            </h1>
          </div>
        </div>
        <button
          onClick={exportPDF}
          disabled={isLoading || dados.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Download size={16} />
          Exportar PDF
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full space-y-6">
        {/* Filtros */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Período</label>
            <div className="flex gap-2">
              {PERIODOS.map(p => (
                <button
                  key={p.value}
                  onClick={() => setPeriodo(p.value)}
                  className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
                    periodo === p.value ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={gerar}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2 bg-slate-800 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? <RefreshCw size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            Gerar Relatório
          </button>
        </div>

        {dados.length === 0 && !isLoading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <Activity size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">Nenhum dado no período</p>
            <p className="text-slate-400 text-sm mt-1">Clique em "Gerar Relatório" para buscar os dados.</p>
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-indigo-100 p-5">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Realizados</p>
                <p className="text-3xl font-black text-indigo-700 mt-1">{totalProcedimentos}</p>
              </div>
              <div className="bg-white rounded-2xl border border-emerald-100 p-5">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Receita Gerada</p>
                <p className="text-3xl font-black text-emerald-700 mt-1">
                  {totalReceita.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
            </div>

            {/* Tabela */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase">Procedimento</th>
                    <th className="px-5 py-3 text-center text-xs font-bold text-slate-500 uppercase">Realizados</th>
                    <th className="px-5 py-3 text-right text-xs font-bold text-slate-500 uppercase">Receita</th>
                    <th className="px-5 py-3 text-center text-xs font-bold text-slate-500 uppercase">Duração Média</th>
                    <th className="px-5 py-3 text-right text-xs font-bold text-slate-500 uppercase">% do Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dados.map((d, i) => (
                    <tr key={d.nome} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-semibold text-slate-800">
                        <span className="text-slate-400 font-bold mr-2">#{i + 1}</span>
                        {d.nome}
                      </td>
                      <td className="px-5 py-3 text-center font-bold text-indigo-600">{d.total}</td>
                      <td className="px-5 py-3 text-right text-emerald-700 font-semibold">
                        {d.receita.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                      <td className="px-5 py-3 text-center text-slate-600">{d.duracao_media} min</td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 bg-slate-100 rounded-full h-1.5">
                            <div
                              className="bg-indigo-500 h-1.5 rounded-full"
                              style={{ width: `${Math.round((d.total / totalProcedimentos) * 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500 w-8 text-right">
                            {Math.round((d.total / totalProcedimentos) * 100)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
