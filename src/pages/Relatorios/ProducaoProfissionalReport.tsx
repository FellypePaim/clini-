import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Download, Stethoscope, TrendingUp, Award, DollarSign, Loader2, Users } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Badge } from '../../components/ui/Badge'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'

interface ProfissionalStats {
  id: string
  nome: string
  especialidade: string
  atendimentos: number
  receita: number
  taxaRetorno: string
}

export function ProducaoProfissionalReport() {
  const { user } = useAuthStore()
  const clinicaId = user?.clinicaId
  const [periodo, setPeriodo] = useState('mes_atual')
  const [stats, setStats] = useState<ProfissionalStats[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadData = useCallback(async () => {
    if (!clinicaId) return
    setIsLoading(true)

    try {
      // 1. Buscar todos os profissionais da clínica
      const { data: profs, error: pErr } = await supabase
        .from('profiles')
        .select('id, nome_completo, especialidade')
        .eq('clinica_id', clinicaId)
        .in('role', ['profissional', 'admin'])

      if (pErr) throw pErr

      // 2. Buscar consultas e transações em paralelo
      const [consultasRes, transacoesRes] = await Promise.all([
        supabase
          .from('consultas')
          .select('id, profissional_id')
          .eq('clinica_id', clinicaId)
          .not('status', 'eq', 'cancelado'),
        supabase
          .from('transacoes' as any)
          .select('id, valor, profissional_id, status, tipo_transacao')
          .eq('clinica_id', clinicaId)
          .eq('status', 'pago')
          .eq('tipo_transacao', 'receita')
      ])

      const consultas = consultasRes.data || []
      const transacoes = transacoesRes.data as any[] || []

      // 3. Agrupar dados por profissional
      const mapped = profs.map(p => {
        const profConsultas = consultas.filter(c => c.profissional_id === p.id).length
        const profReceita = transacoes
          .filter(t => t.profissional_id === p.id)
          .reduce((s, t) => s + Number(t.valor), 0)

        return {
          id: p.id,
          nome: p.nome_completo,
          especialidade: p.especialidade || 'Clínico Geral',
          atendimentos: profConsultas,
          receita: profReceita,
          taxaRetorno: '—' // Futura implementação baseada em histórico
        }
      })

      setStats(mapped.sort((a, b) => b.receita - a.receita))
    } catch (err) {
      console.error('Erro ao processar produção profissional:', err)
    } finally {
      setIsLoading(false)
    }
  }, [clinicaId])

  useEffect(() => { loadData() }, [loadData])

  const totalAtendimentos = stats.reduce((s, p) => s + p.atendimentos, 0)
  const totalReceita = stats.reduce((s, p) => s + p.receita, 0)
  const ticketMedio = totalAtendimentos > 0 ? totalReceita / totalAtendimentos : 0

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
                Relatórios <ArrowLeft size={10} className="rotate-180" /> Clínico
              </div>
              <h1 className="text-2xl font-black text-slate-900 uppercase">Produção por Profissional</h1>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-6 py-3 bg-slate-100 font-black text-[11px] uppercase tracking-widest text-slate-600 rounded-2xl hover:bg-slate-200 transition-all border border-slate-200">
               <Download size={16} /> Exportar Excel
            </button>
          </div>
        </div>

        <div className="flex gap-4">
           <div className="flex flex-col gap-1.5 min-w-[260px]">
             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 text-xs">Período Selecionado</label>
             <select 
               value={periodo} 
               onChange={(e) => setPeriodo(e.target.value)}
               className="w-full px-4 py-3 text-xs font-black text-slate-800 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all uppercase tracking-widest appearance-none cursor-pointer"
             >
               <option value="mes_atual">Mês Vigente</option>
               <option value="trimestre">Último Trimestre</option>
               <option value="ano">Ano Fiscal</option>
             </select>
           </div>
        </div>
      </header>

      <main className="p-6 max-w-[1400px] mx-auto w-full space-y-6">
        
        {/* Sumário Executivo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Atendimentos Totais', valor: totalAtendimentos, icon: <Users size={20} />, color: 'indigo' },
            { label: 'Receita Operacional', valor: totalReceita, icon: <DollarSign size={20} />, isCurrency: true, color: 'emerald' },
            { label: 'Ticket Médio (Geral)', valor: ticketMedio, icon: <Award size={20} />, isCurrency: true, color: 'blue' },
            { label: 'Desempenho Profissionais', valor: stats.length, icon: <Stethoscope size={20} />, color: 'amber' },
          ].map((kpi, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between h-[150px]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</span>
                <div className={`p-2.5 rounded-xl bg-${kpi.color}-50 text-${kpi.color}-600`}>{kpi.icon}</div>
              </div>
              <span className="text-3xl font-black text-slate-900 block">
                {kpi.isCurrency 
                  ? kpi.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
                  : kpi.valor}
              </span>
            </div>
          ))}
        </div>

        {/* Gráfico de Ranking Reais */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <div className="mb-8">
             <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Ranking de Produção Financeira (Bruta)</h3>
             <p className="text-[11px] text-slate-400 font-bold mt-1 uppercase tracking-tight">Comparativo de receita gerada por especialista no período</p>
          </div>
          
          <div className="h-[320px] w-full">
            {isLoading ? (
               <div className="h-full w-full bg-slate-50 rounded-2xl animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats} layout="vertical" margin={{ top: 0, right: 30, left: 100, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="5 5" horizontal={true} vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis 
                    type="category" 
                    dataKey="nome" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#1e293b', fontSize: 11, fontWeight: 800 }} 
                    width={120} 
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px -10px rgb(0 0 0 / 0.1)', padding: '16px' }}
                    formatter={(val: any) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  />
                  <Bar dataKey="receita" fill="#6366f1" radius={[0, 10, 10, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Detalhamento Tabela Reais */}
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-50">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Eficiência por Profissional</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                  <th className="px-8 py-5">Profissional</th>
                  <th className="px-8 py-5">Especialidade</th>
                  <th className="px-8 py-5 text-center">Atendimentos</th>
                  <th className="px-8 py-5 text-center">T. Retorno Est.</th>
                  <th className="px-8 py-5 text-right">Receita Acumulada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-bold">
                {isLoading ? (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-300">Processando métricas...</td></tr>
                ) : stats.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5 text-sm font-black text-slate-900 uppercase">{row.nome}</td>
                    <td className="px-8 py-5 text-xs text-slate-500 uppercase tracking-tight">{row.especialidade}</td>
                    <td className="px-8 py-5 text-center">
                       <span className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full text-xs font-black">
                         {row.atendimentos}
                       </span>
                    </td>
                    <td className="px-8 py-5 text-center text-slate-400 font-mono text-xs">{row.taxaRetorno}</td>
                    <td className="px-8 py-5 text-right font-black text-emerald-600 text-base">
                      {row.receita.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
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
