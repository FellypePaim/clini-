import React, { useEffect, useState } from 'react'
import {
  Search,
  Download,
  Clock,
  Building2,
  ShieldAlert,
  CheckCircle,
  XCircle,
  Eye,
} from 'lucide-react'
import { useSuperAdmin } from '../../hooks/useSuperAdmin'
import { useToast } from '../../hooks/useToast'
import { Badge } from '../../components/ui/Badge'
import { cn } from '../../lib/utils'

export function SuperLogsPage() {
  const { getAuditLogs, isLoading: _isLoading } = useSuperAdmin()
  const { toast } = useToast()
  const [logs, setLogs] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [periodoFilter, setPeriodoFilter] = useState<string>('todos')
  const [tipoFilter, setTipoFilter] = useState<string>('todos')

  const filteredLogs = logs.filter(log => {
    const q = searchTerm.toLowerCase()
    const matchSearch = !searchTerm || (
      log.acao?.toLowerCase().includes(q) ||
      log.recurso?.toLowerCase().includes(q) ||
      log.clinicas?.nome?.toLowerCase().includes(q) ||
      log.profiles?.nome_completo?.toLowerCase().includes(q)
    )
    const now = new Date()
    let matchPeriodo = true
    if (periodoFilter === 'hoje') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      matchPeriodo = new Date(log.created_at) >= start
    } else if (periodoFilter === '7d') {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      matchPeriodo = new Date(log.created_at) >= start
    } else if (periodoFilter === '30d') {
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      matchPeriodo = new Date(log.created_at) >= start
    }
    const matchTipo = tipoFilter === 'todos' || (() => {
      const acao = log.acao?.toUpperCase() || ''
      if (tipoFilter === 'create') return ['CREATE', 'ADD', 'INSERT'].some(kw => acao.includes(kw))
      if (tipoFilter === 'delete') return ['DELETE', 'SUSPEND', 'REMOVE', 'BLOCK'].some(kw => acao.includes(kw))
      if (tipoFilter === 'update') return ['UPDATE', 'EDIT', 'MODIFY'].some(kw => acao.includes(kw))
      return true
    })()
    return matchSearch && matchPeriodo && matchTipo
  })

  const handleExportLogs = () => {
    if (logs.length === 0) return
    const headers = ['Timestamp', 'Clínica', 'Usuário', 'Ação', 'Recurso', 'Resultado']
    const csv = [
      headers.join(','),
      ...logs.map(l => [
        new Date(l.created_at).toISOString(),
        `"${l.clinicas?.nome || 'Platform Global'}"`,
        `"${l.profiles?.nome_completo || 'Sistema'}"`,
        l.acao || '',
        l.recurso || '',
        l.resultado || ''
      ].join(','))
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', `auditoria-${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  useEffect(() => {
    async function load() {
      const data = await getAuditLogs()
      setLogs(data)
    }
    load()
  }, [getAuditLogs])

  const getActionBadge = (acao: string) => {
    const isDestructive = ['DELETE', 'SUSPEND', 'REMOVE', 'BLOCK'].some(kw => acao.toUpperCase().includes(kw))
    const isCreate = ['CREATE', 'ADD', 'INSERT'].some(kw => acao.toUpperCase().includes(kw))
    
    return (
      <Badge className={cn(
        "text-[9px] font-black border-none px-2 py-0.5",
        isDestructive ? "bg-red-500/10 text-red-500" : isCreate ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500"
      )}>
        {acao.toUpperCase()}
      </Badge>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">Auditoria Global</h1>
          <p className="text-slate-400 font-medium">Timeline completa de todas as ações importantes realizadas em toda a plataforma.</p>
        </div>
        <button
          onClick={handleExportLogs}
          disabled={logs.length === 0}
          className="flex items-center gap-2 px-5 py-3 bg-slate-800/40 border border-slate-700/50 text-slate-300 font-bold rounded-2xl hover:bg-slate-800/60 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
           <Download size={18} /> Exportar Logs (CSV)
        </button>
      </div>

      {/* Busca e Filtros */}
      <div className="flex flex-col md:flex-row gap-4">
         <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors" size={20} />
            <input
              type="text"
              placeholder="Buscar por usuário, clínica ou ação..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800/40 border border-slate-700/50 rounded-2xl py-3 pl-12 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-medium"
            />
         </div>
         <div className="flex items-center gap-2">
            <select
              value={periodoFilter}
              onChange={(e) => setPeriodoFilter(e.target.value)}
              className="flex items-center gap-2 px-5 py-3 bg-slate-800/40 border border-slate-700/50 text-slate-300 font-bold rounded-2xl hover:bg-slate-800/60 transition-all cursor-pointer">
               <option value="todos">Todo Período</option>
               <option value="hoje">Hoje</option>
               <option value="7d">Últimos 7 dias</option>
               <option value="30d">Últimos 30 dias</option>
            </select>
            <select
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value)}
              className="flex items-center gap-2 px-5 py-3 bg-slate-800/40 border border-slate-700/50 text-slate-300 font-bold rounded-2xl hover:bg-slate-800/60 transition-all cursor-pointer">
               <option value="todos">Todos os Tipos</option>
               <option value="create">Criação (CREATE)</option>
               <option value="update">Atualização (UPDATE)</option>
               <option value="delete">Exclusão (DELETE)</option>
            </select>
         </div>
      </div>

      {/* Timeline de Logs */}
      <div className="bg-slate-800/20 border border-slate-700/30 rounded-[40px] overflow-hidden shadow-2xl">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-900/50 border-b border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                     <th className="px-8 py-6">Timestamp / Horário</th>
                     <th className="px-8 py-6">Clínica</th>
                     <th className="px-8 py-6">Usuário Responsável</th>
                     <th className="px-8 py-6">Ação / Recurso</th>
                     <th className="px-8 py-6 text-right">Resultado</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-800/30">
                  {filteredLogs.length > 0 ? filteredLogs.map((log) => (
                     <tr key={log.id} className="hover:bg-slate-800/40 transition-all group cursor-pointer">
                        <td className="px-8 py-5">
                           <div className="flex items-center gap-3">
                              <Clock className="text-slate-600" size={14} />
                              <div className="flex flex-col">
                                 <span className="text-xs font-black text-slate-200">{new Date(log.created_at).toLocaleTimeString()}</span>
                                 <span className="text-[10px] font-bold text-slate-500">{new Date(log.created_at).toLocaleDateString()}</span>
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-5">
                           <div className="flex items-center gap-2 text-slate-400">
                              <Building2 size={14} className="text-slate-600" />
                              <span className="text-xs font-bold truncate max-w-[150px]">{log.clinicas?.nome || 'Platform Global'}</span>
                           </div>
                        </td>
                        <td className="px-8 py-5">
                           <div className="flex items-center gap-2 text-slate-300">
                              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-[10px] font-black border border-slate-800">
                                 {log.profiles?.nome_completo?.charAt(0) || 'S'}
                              </div>
                              <span className="text-xs font-bold">{log.profiles?.nome_completo || 'Sistema / SuperAdmin'}</span>
                           </div>
                        </td>
                        <td className="px-8 py-5">
                           <div className="flex flex-col gap-1">
                              {getActionBadge(log.acao)}
                              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{log.recurso || 'N/A'}</span>
                           </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                           <div className="flex items-center justify-end gap-3">
                              {log.resultado === 'sucesso' ? (
                                 <CheckCircle size={16} className="text-emerald-500" />
                              ) : (
                                 <XCircle size={16} className="text-red-500" />
                              )}
                              <button
                                onClick={() => toast({ title: 'Detalhe do Log', description: `Ação: ${log.acao} em ${log.recurso || 'N/A'} — ${log.resultado}`, type: 'info' })}
                                className="p-2 bg-slate-900 rounded-lg text-slate-600 hover:bg-purple-600 hover:text-white transition-all">
                                 <Eye size={14} />
                              </button>
                           </div>
                        </td>
                     </tr>
                  )) : (
                     <tr>
                        <td colSpan={5} className="px-8 py-10 text-center">
                           <ShieldAlert size={48} className="text-slate-800 mx-auto mb-4" />
                           <p className="text-slate-500 font-bold">Nenhum registro de auditoria encontrado.</p>
                        </td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  )
}
