import React, { useState } from 'react'
import { ArrowLeft, Download, Users, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface PacienteStat {
  total: number
  novosNoMes: number
  porConvenio: { convenio: string; count: number }[]
  porSexo: { sexo: string; count: number }[]
  faixaEtaria: { faixa: string; count: number }[]
}

export function PacientesReport() {
  const { user } = useAuthStore()
  const [dados, setDados] = useState<PacienteStat | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const gerar = async () => {
    if (!user?.clinicaId) return
    setIsLoading(true)
    try {
      const inicioMes = new Date()
      inicioMes.setDate(1)
      const inicioMesStr = inicioMes.toISOString().split('T')[0]

      const { data: pacientes } = await supabase
        .from('pacientes')
        .select('id, sexo, data_nascimento, convenio, created_at')
        .eq('clinica_id', user.clinicaId)

      if (!pacientes) { setDados(null); return }

      const total = pacientes.length
      const novosNoMes = pacientes.filter(p => p.created_at >= inicioMesStr).length

      // Por convênio
      const convenioMap = new Map<string, number>()
      for (const p of pacientes) {
        const conv = p.convenio || 'Particular'
        convenioMap.set(conv, (convenioMap.get(conv) ?? 0) + 1)
      }
      const porConvenio = Array.from(convenioMap.entries())
        .map(([convenio, count]) => ({ convenio, count }))
        .sort((a, b) => b.count - a.count)

      // Por sexo
      const sexoMap = new Map<string, number>()
      for (const p of pacientes) {
        const s = p.sexo === 'M' ? 'Masculino' : p.sexo === 'F' ? 'Feminino' : 'Não informado'
        sexoMap.set(s, (sexoMap.get(s) ?? 0) + 1)
      }
      const porSexo = Array.from(sexoMap.entries()).map(([sexo, count]) => ({ sexo, count }))

      // Por faixa etária
      const hoje = new Date()
      const faixas: Record<string, number> = { '0–17': 0, '18–29': 0, '30–44': 0, '45–59': 0, '60+': 0, 'N/A': 0 }
      for (const p of pacientes) {
        if (!p.data_nascimento) { faixas['N/A']++; continue }
        const idade = Math.floor((hoje.getTime() - new Date(p.data_nascimento).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        if (idade < 18) faixas['0–17']++
        else if (idade < 30) faixas['18–29']++
        else if (idade < 45) faixas['30–44']++
        else if (idade < 60) faixas['45–59']++
        else faixas['60+']++
      }
      const faixaEtaria = Object.entries(faixas)
        .filter(([, c]) => c > 0)
        .map(([faixa, count]) => ({ faixa, count }))

      setDados({ total, novosNoMes, porConvenio, porSexo, faixaEtaria })
    } finally {
      setIsLoading(false)
    }
  }

  const exportPDF = () => {
    if (!dados) return
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text('Relatório de Pacientes Atendidos', 14, 18)
    doc.setFontSize(10)
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 26)

    let y = 34
    doc.setFontSize(12)
    doc.text('Resumo Geral', 14, y); y += 6
    doc.setFontSize(9)
    doc.text(`Total de Pacientes: ${dados.total}`, 14, y); y += 5
    doc.text(`Novos este Mês: ${dados.novosNoMes}`, 14, y); y += 10

    autoTable(doc, {
      startY: y,
      head: [['Convênio', 'Pacientes', '%']],
      body: dados.porConvenio.map(d => [d.convenio, d.count, `${Math.round((d.count / dados.total) * 100)}%`]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [99, 102, 241] },
    })

    doc.save('pacientes-atendidos.pdf')
  }

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
              <Users size={20} className="text-indigo-500" />
              Pacientes Atendidos
            </h1>
          </div>
        </div>
        <button
          onClick={exportPDF}
          disabled={!dados}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Download size={16} />
          Exportar PDF
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-end gap-4">
          <button
            onClick={gerar}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2 bg-slate-800 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? <RefreshCw size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            Gerar Relatório
          </button>
        </div>

        {!dados && !isLoading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <Users size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">Nenhum dado carregado</p>
            <p className="text-slate-400 text-sm mt-1">Clique em "Gerar Relatório" para buscar os dados.</p>
          </div>
        ) : dados && (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-indigo-100 p-5">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total de Pacientes</p>
                <p className="text-3xl font-black text-indigo-700 mt-1">{dados.total}</p>
              </div>
              <div className="bg-white rounded-2xl border border-emerald-100 p-5">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Novos Este Mês</p>
                <p className="text-3xl font-black text-emerald-700 mt-1">{dados.novosNoMes}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Por Convênio */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <h3 className="text-sm font-bold text-slate-700 mb-4">Por Convênio</h3>
                <div className="space-y-3">
                  {dados.porConvenio.map(d => (
                    <div key={d.convenio}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-600 truncate">{d.convenio}</span>
                        <span className="font-bold text-slate-800 ml-2">{d.count}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${Math.round((d.count / dados.total) * 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Por Sexo */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <h3 className="text-sm font-bold text-slate-700 mb-4">Por Sexo</h3>
                <div className="space-y-3">
                  {dados.porSexo.map(d => (
                    <div key={d.sexo}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-600">{d.sexo}</span>
                        <span className="font-bold text-slate-800">{d.count}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.round((d.count / dados.total) * 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Faixa Etária */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <h3 className="text-sm font-bold text-slate-700 mb-4">Faixa Etária</h3>
                <div className="space-y-3">
                  {dados.faixaEtaria.map(d => (
                    <div key={d.faixa}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-600">{d.faixa} anos</span>
                        <span className="font-bold text-slate-800">{d.count}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${Math.round((d.count / dados.total) * 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
