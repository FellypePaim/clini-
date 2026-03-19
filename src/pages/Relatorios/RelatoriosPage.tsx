import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText,
  TrendingUp,
  Users,
  BarChart,
  DollarSign,
  PieChart,
  Stethoscope,
  Target,
  Megaphone,
  Briefcase,
  AlertCircle,
  CreditCard,
  PhoneCall,
  Activity,
  ChevronRight
} from 'lucide-react'
import { Badge } from '../../components/ui/Badge'

type ReportCategory = 'Clínico' | 'Financeiro' | 'Marketing / CRM'

interface ReportConfig {
  id: string
  title: string
  description: string
  category: ReportCategory
  icon: React.ReactNode
  path: string
  isImplemented?: boolean
}

const REPORTS: ReportConfig[] = [
  // Clínico
  { id: 'prod-prof', title: 'Produção por Profissional', description: 'Volume de atendimentos, procedimentos e receita gerada por especialista.', category: 'Clínico', icon: <Stethoscope size={24} className="text-indigo-500" />, path: '/relatorios/producao-profissional', isImplemented: true },
  { id: 'proc-real', title: 'Procedimentos Realizados', description: 'Ranking dos tratamentos mais executados e análise de consumo de tempo.', category: 'Clínico', icon: <Activity size={24} className="text-indigo-500" />, path: '/relatorios/procedimentos' },
  { id: 'pac-atend', title: 'Pacientes Atendidos', description: 'Demografia, faixa etária e perfil do público-alvo da clínica.', category: 'Clínico', icon: <Users size={24} className="text-indigo-500" />, path: '/relatorios/pacientes' },
  { id: 'taxa-ret', title: 'Taxa de Retorno de Pacientes', description: 'Métrica de fidelização: pacientes que voltaram após 6, 12 e 18 meses.', category: 'Clínico', icon: <TrendingUp size={24} className="text-indigo-500" />, path: '/relatorios/retorno' },

  // Financeiro
  { id: 'fat-per', title: 'Faturamento por Período', description: 'Receita Bruta, Deduções e Receita Líquida com evolução analítica.', category: 'Financeiro', icon: <DollarSign size={24} className="text-emerald-500" />, path: '/relatorios/faturamento', isImplemented: true },
  { id: 'rec-conv', title: 'Receita por Convênio', description: 'Distribuição financeira entre atendimentos Particulares e Convênios médicos.', category: 'Financeiro', icon: <Briefcase size={24} className="text-emerald-500" />, path: '/relatorios/convenios' },
  { id: 'inadimp', title: 'Inadimplência', description: 'Boletos vencidos, glosas e contas a receber não liquidadas.', category: 'Financeiro', icon: <AlertCircle size={24} className="text-emerald-500" />, path: '/relatorios/inadimplencia' },
  { id: 'dre-simp', title: 'DRE Simplificado', description: 'Demonstrativo de Resultado do Exercício adaptado para clínicas.', category: 'Financeiro', icon: <BarChart size={24} className="text-emerald-500" />, path: '/relatorios/dre' },

  // Marketing / CRM
  { id: 'des-camp', title: 'Desempenho de Campanhas', description: 'Métricas de WhatsApp Marketing: taxa de entrega, abertura e agendamentos.', category: 'Marketing / CRM', icon: <Megaphone size={24} className="text-amber-500" />, path: '/relatorios/campanhas' },
  { id: 'fun-conv', title: 'Funil de Conversão (Verdesk)', description: 'Análise de perda de leads em cada estágio (Orçamento → Agendado).', category: 'Marketing / CRM', icon: <Target size={24} className="text-amber-500" />, path: '/relatorios/funil-leads', isImplemented: true },
  { id: 'ori-pac', title: 'Origem de Pacientes', description: 'Distribuição dos canais de captação (Indicação, Instagram, Google, etc).', category: 'Marketing / CRM', icon: <PieChart size={24} className="text-amber-500" />, path: '/relatorios/origem' },
  { id: 'des-ovyva', title: 'Desempenho da OVYVA', description: 'Taxa de resolução por IA sem necessidade de intervenção humana.', category: 'Marketing / CRM', icon: <PhoneCall size={24} className="text-amber-500" />, path: '/relatorios/ovyva' },
]

export function RelatoriosPage() {
  const [activeTab, setActiveTab] = useState<ReportCategory | 'Todos'>('Todos')

  const filteredReports = REPORTS.filter(r => activeTab === 'Todos' || r.category === activeTab)

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      <header className="px-6 py-6 bg-white border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-1">
            <FileText className="text-indigo-600" />
            Central de Relatórios
          </h1>
          <p className="text-slate-500">Métricas analíticas, operacionais e financeiras da clínica</p>
        </div>

        {/* Categoria Filtro */}
        <div className="flex gap-2 mt-6">
          {(['Todos', 'Clínico', 'Financeiro', 'Marketing / CRM'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                activeTab === cat 
                  ? 'bg-slate-800 text-white shadow-md' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full">
        {['Clínico', 'Financeiro', 'Marketing / CRM'].map((category) => {
           if (activeTab !== 'Todos' && activeTab !== category) return null;
           
           const catReports = filteredReports.filter(r => r.category === category);
           if (catReports.length === 0) return null;

           return (
             <section key={category} className="mb-10 last:mb-0">
               <h2 className="text-lg font-bold text-slate-800 mb-4 px-1">{category}</h2>
               <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                 {catReports.map((report) => (
                   <Link 
                     key={report.id}
                     to={report.isImplemented ? report.path : '#'}
                     onClick={(e) => !report.isImplemented && e.preventDefault()}
                     className={`
                       group bg-white p-5 rounded-2xl border transition-all h-full flex flex-col items-start
                       ${report.isImplemented 
                         ? 'border-indigo-100 hover:border-indigo-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer' 
                         : 'border-slate-200 opacity-60 hover:opacity-100 cursor-not-allowed'}
                     `}
                     title={!report.isImplemented ? "Relatório em desenvolvimento" : undefined}
                   >
                     <div className="flex items-start justify-between w-full mb-4">
                       <div className={`p-3 rounded-xl border ${
                          report.category === 'Clínico' ? 'bg-indigo-50 border-indigo-100' :
                          report.category === 'Financeiro' ? 'bg-emerald-50 border-emerald-100' :
                          'bg-amber-50 border-amber-100'
                       }`}>
                         {report.icon}
                       </div>
                       {report.isImplemented && (
                         <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:bg-indigo-50 transition-all text-indigo-500">
                           <ChevronRight size={18} />
                         </div>
                       )}
                     </div>
                     
                     <h3 className={`font-bold text-base mb-2 ${report.isImplemented ? 'text-slate-900 group-hover:text-indigo-700' : 'text-slate-700'}`}>
                       {report.title}
                     </h3>
                     <p className="text-sm text-slate-500 font-medium leading-relaxed mb-4 flex-1">
                       {report.description}
                     </p>
                     
                     {!report.isImplemented && (
                       <Badge className="bg-slate-100 text-slate-500 border-none font-bold text-[10px] uppercase tracking-widest mt-auto">
                         Em Breve
                       </Badge>
                     )}
                   </Link>
                 ))}
               </div>
             </section>
           )
        })}
      </main>
    </div>
  )
}
