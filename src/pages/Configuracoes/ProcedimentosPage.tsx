import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Archive, Search, Filter, ClipboardList } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { TableSkeleton } from '../../components/ui/TableSkeleton'
import { useToast } from '../../hooks/useToast'

interface Procedimento {
  id: string
  nome: string
  categoria: 'Consulta' | 'Estético' | 'Odontológico' | 'Exame'
  duracao: number
  valor: number
  codigoTUSS: string
  insumos: number
}

const MOCK_PROCEDIMENTOS: Procedimento[] = [
  { id: '1', nome: 'Consulta Inicial / Avaliação', categoria: 'Consulta', duracao: 30, valor: 250, codigoTUSS: '10101012', insumos: 1 },
  { id: '2', nome: 'Aplicação de Toxina Botulínica (3 Regiões)', categoria: 'Estético', duracao: 45, valor: 1200, codigoTUSS: '30101999', insumos: 2 },
  { id: '3', nome: 'Preenchimento Labial', categoria: 'Estético', duracao: 60, valor: 1500, codigoTUSS: '30101998', insumos: 3 },
  { id: '4', nome: 'Restauração em Resina Composta', categoria: 'Odontológico', duracao: 45, valor: 350, codigoTUSS: '85100140', insumos: 4 },
  { id: '5', nome: 'Clareamento Dental a Laser', categoria: 'Odontológico', duracao: 60, valor: 850, codigoTUSS: '85200055', insumos: 2 },
  { id: '6', nome: 'Implante Dentário Titânio', categoria: 'Odontológico', duracao: 120, valor: 2500, codigoTUSS: '85400038', insumos: 8 },
  { id: '7', nome: 'Profilaxia e Limpeza Oral', categoria: 'Odontológico', duracao: 30, valor: 180, codigoTUSS: '85100204', insumos: 3 },
]

export function ProcedimentosPage() {
  const [filtroCategoria, setFiltroCategoria] = useState<string>('Todos')
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  const CATEGORIAS = ['Todos', 'Consulta', 'Estético', 'Odontológico', 'Exame']

  const filtered = MOCK_PROCEDIMENTOS.filter(p => filtroCategoria === 'Todos' || p.categoria === filtroCategoria)

  const handleCadastrar = () => {
    toast({ title: 'Adicionar Procedimento', description: 'Modal "Nova Configuração" ativado via sistema.' , type: 'info' })
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
             <ClipboardList className="text-indigo-600" />
             Catálogo de Procedimentos
          </h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Defina durações de agenda, tabelas de preço padrão e vínculo de insumos.</p>
        </div>
        <button 
          onClick={handleCadastrar}
          className="flex items-center gap-2 px-5 py-2.5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-colors"
        >
          <Plus size={18}/> Novo Procedimento
        </button>
      </div>

      <div className="p-4 border-b border-slate-100 flex items-center gap-4 bg-white">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Buscar por nome ou TUSS..." 
            className="w-full pl-9 pr-3 py-2 text-sm font-medium border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
          />
        </div>
        
        <div className="w-px h-6 bg-slate-200" />
        
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          {CATEGORIAS.map(cat => (
            <button
              key={cat}
              onClick={() => setFiltroCategoria(cat)}
              className={`whitespace-nowrap px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                filtroCategoria === cat
                 ? 'bg-slate-800 text-white border-slate-800 shadow-md'
                 : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
      
      
      <div className="overflow-x-auto">
        {isLoading ? (
          <TableSkeleton rows={7} cols={6} />
        ) : (
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-widest">
                <th className="px-6 py-4">TUSS</th>
                <th className="px-6 py-4">Procedimento e Categoria</th>
                <th className="px-6 py-4 text-center">Duração Padrão</th>
                <th className="px-6 py-4 text-center">Insumos (Regras)</th>
                <th className="px-6 py-4 text-right">Valor Padrão (R$)</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium">
              {filtered.map((proc) => (
                <tr key={proc.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 font-mono text-xs text-slate-500 font-bold">{proc.codigoTUSS}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div>
                        <h3 className="font-bold text-slate-800 text-base group-hover:text-indigo-600 transition-colors">{proc.nome}</h3>
                        <Badge className={`mt-1 border-none tracking-widest uppercase text-[10px] ${
                          proc.categoria === 'Consulta' ? 'bg-blue-100 text-blue-700' :
                          proc.categoria === 'Estético' ? 'bg-fuchsia-100 text-fuchsia-700' :
                          proc.categoria === 'Odontológico' ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {proc.categoria}
                        </Badge>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                     <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded font-bold text-xs">{proc.duracao} min</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                     <button 
                       onClick={() => toast({ title: 'Regras de Estoque', description: 'Atalho rápido para configurar Baixas Automáticas no Estoque', type: 'info'})}
                       className="text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded px-2.5 py-1 font-bold text-xs transition-colors"
                     >
                       {proc.insumos} Material(is) vinculado(s)
                     </button>
                  </td>
                  <td className="px-6 py-4 text-right font-black text-emerald-600">
                    {proc.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Editar Procedimento"><Edit2 size={18} /></button>
                      <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Arquivar / Desativar"><Archive size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
