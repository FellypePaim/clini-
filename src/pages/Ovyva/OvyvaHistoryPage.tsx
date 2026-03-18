import { useState } from 'react'
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  UserPlus, 
  MoreHorizontal,
  ChevronDown,
  Calendar,
  MessageSquare,
  Bot,
  User,
  Zap
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/utils'

export function OvyvaHistoryPage() {
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState<'all' | 'resolvido' | 'transferido'>('all')

  const kpis = [
    { label: 'Total Atendimentos', value: '1.248', icon: <MessageSquare className="w-5 h-5" />, color: 'blue' },
    { label: '% Resolvidos IA', value: '76%', icon: <Bot className="w-5 h-5" />, color: 'green' },
    { label: 'Tempo Médio Resposta', value: '3s', icon: <Zap className="w-5 h-5" />, color: 'orange' },
    { label: 'Leads Gerados', value: '84', icon: <UserPlus className="w-5 h-5" />, color: 'purple' },
  ]

  const historyData = [
    { id: '1', data: '18/03/2026', hora: '10:45', contato: 'Lucas Silva', canal: 'WhatsApp', status: 'resolvido_ia', duracao: '15 min', leads: false },
    { id: '2', data: '18/03/2026', hora: '09:30', contato: 'Ricardo Mendes', canal: 'Instagram', status: 'transferido_humano', duracao: '45 min', leads: false },
    { id: '3', data: '17/03/2026', hora: '16:15', contato: 'Beatriz Oliveira', canal: 'WhatsApp', status: 'resolvido_ia', duracao: '12 min', leads: true },
    { id: '4', data: '17/03/2026', hora: '14:20', contato: 'Marina Santos', canal: 'WebChat', status: 'resolvido_ia', duracao: '08 min', leads: true },
    { id: '5', data: '16/03/2026', hora: '11:00', contato: 'Felipe Dias', canal: 'WhatsApp', status: 'transferido_humano', duracao: '1h 05 min', leads: false },
    { id: '6', data: '16/03/2026', hora: '08:45', contato: 'Clara Nunes', canal: 'WhatsApp', status: 'resolvido_ia', duracao: '05 min', leads: true },
  ]

  return (
    <div className="flex flex-col gap-8 animate-fade-in pb-10">
       {/* History Header */}
       <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
             <button 
              onClick={() => navigate('/ovyva')}
              className="p-3 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all text-gray-400 hover:text-green-600"
             >
                <ArrowLeft className="w-5 h-5" />
             </button>
             <div>
                <h1 className="text-2xl font-black text-gray-900 border-none uppercase tracking-widest">Histórico OVYVA</h1>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                   Logs de auditoria e analytics da secretária virtual
                </p>
             </div>
          </div>

          <div className="flex items-center gap-3 bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
             <button className="px-4 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Este Mês</button>
             <button className="px-4 py-2 hover:bg-gray-50 text-gray-400 rounded-xl text-[10px] font-black uppercase tracking-widest">Trimestre</button>
             <button className="px-4 py-2 hover:bg-gray-50 text-gray-400 rounded-xl text-[10px] font-black uppercase tracking-widest">Ano</button>
          </div>
       </div>

       {/* KPI Grid */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpis.map((kpi, idx) => (
            <div key={idx} className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-200/50 transition-all group overflow-hidden relative">
               <div className={cn(
                "absolute -top-10 -right-10 w-32 h-32 blur-3xl rounded-full opacity-10 group-hover:scale-150 transition-transform",
                kpi.color === 'blue' ? "bg-blue-500" : 
                kpi.color === 'green' ? "bg-green-500" : 
                kpi.color === 'orange' ? "bg-orange-500" : "bg-purple-500"
               )} />
               
               <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-all group-hover:scale-110",
                kpi.color === 'blue' ? "bg-blue-50 text-blue-600" : 
                kpi.color === 'green' ? "bg-green-50 text-green-600" : 
                kpi.color === 'orange' ? "bg-orange-50 text-orange-600" : "bg-purple-50 text-purple-600"
               )}>
                  {kpi.icon}
               </div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{kpi.label}</p>
               <h3 className="text-3xl font-black text-gray-900 border-none">{kpi.value}</h3>
            </div>
          ))}
       </div>

       {/* History Table Container */}
       <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          <div className="p-8 border-b border-gray-50 flex items-center justify-between">
             <div className="flex items-center gap-6">
                <div className="relative group min-w-[300px]">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400 group-hover:text-green-500 transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Filtrar por contato, canal ou status..." 
                    className="w-full bg-gray-50 border-none rounded-2xl py-2.5 pl-10 pr-4 text-sm font-medium placeholder:text-gray-300 outline-none focus:ring-2 focus:ring-green-500/10 transition-all"
                  />
                </div>
                
                <div className="flex items-center bg-gray-50 p-1 rounded-xl">
                  {['Todas', 'Resolvidas', 'Transferidas'].map((f) => (
                    <button 
                      key={f}
                      onClick={() => setActiveFilter(f.toLowerCase().includes('resolv') ? 'resolvido' : f.toLowerCase().includes('transf') ? 'transferido' : 'all')}
                      className={cn(
                        "px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                        (f === 'Todas' && activeFilter === 'all') || 
                        (f === 'Resolvidas' && activeFilter === 'resolvido') || 
                        (f === 'Transferidas' && activeFilter === 'transferido') 
                           ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>
             </div>

             <button className="btn-secondary py-2.5 flex items-center gap-2">
                <Filter className="w-4 h-4" /> Exportar CSV
             </button>
          </div>

          <div className="overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar">
             <table className="w-full text-left">
                <thead className="sticky top-0 bg-white/80 backdrop-blur-md z-10 border-b border-gray-50">
                   <tr>
                      <TableTh>Data/Hora</TableTh>
                      <TableTh>Contato</TableTh>
                      <TableTh>Canal</TableTh>
                      <TableTh>Status Resolução</TableTh>
                      <TableTh>Duração Total</TableTh>
                      <TableTh>Tags</TableTh>
                      <TableTh className="text-right">Ações</TableTh>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-50/50">
                   {historyData.map((row) => (
                     <tr key={row.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-8 py-6">
                           <div className="flex flex-col">
                              <span className="text-xs font-black text-gray-900 uppercase tracking-widest leading-none mb-1">{row.data}</span>
                              <span className="text-[10px] text-gray-400 font-bold">{row.hora}</span>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <span className="text-xs font-black text-gray-900 uppercase tracking-widest">{row.contato}</span>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-2">
                              <div className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                row.canal === 'WhatsApp' ? "bg-green-500" : row.canal === 'Instagram' ? "bg-purple-500" : "bg-blue-500"
                              )} />
                              <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{row.canal}</span>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           {row.status === 'resolvido_ia' ? (
                             <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 font-black text-[9px] uppercase tracking-widest px-2.5 py-1.5 rounded-lg border border-green-100">
                                <CheckCircle className="w-3.5 h-3.5" /> Resolvido por IA
                             </span>
                           ) : (
                             <span className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-700 font-black text-[9px] uppercase tracking-widest px-2.5 py-1.5 rounded-lg border border-orange-100">
                                <User className="w-3.5 h-3.5" /> Transf. Humano
                             </span>
                           )}
                        </td>
                        <td className="px-8 py-6">
                           <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{row.duracao}</span>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex gap-2">
                              {row.leads && (
                                <span className="bg-blue-50 text-blue-600 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border border-blue-100">Lead Gerado</span>
                              )}
                              <span className="bg-gray-50 text-gray-400 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border border-gray-100 italic">Conversional</span>
                           </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                           <button className="p-2.5 hover:bg-white rounded-xl text-gray-300 hover:text-green-500 hover:shadow-lg hover:shadow-green-100 transition-all">
                              <MoreHorizontal className="w-5 h-5" />
                           </button>
                        </td>
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>
       </div>
    </div>
  )
}

function TableTh({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <th className={cn("px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]", className)}>
       {children}
    </th>
  )
}
