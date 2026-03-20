import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Edit2, Archive, Search, ClipboardList, Loader2, Save, X } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { useToast } from '../../hooks/useToast'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'

type Categoria = 'Consulta' | 'Estético' | 'Odontológico' | 'Exame' | 'Outro'

interface Procedimento {
  id: string
  nome: string
  categoria: Categoria
  duracao: number
  valor: number
  codigo_tuss: string
  ativo: boolean
}

const CATEGORIAS: string[] = ['Todos', 'Consulta', 'Estético', 'Odontológico', 'Exame', 'Outro']

function categoriaBadgeStyle(cat: string) {
  const map: Record<string, string> = {
    'Consulta': 'bg-blue-100 text-blue-700',
    'Estético': 'bg-fuchsia-100 text-fuchsia-700',
    'Odontológico': 'bg-indigo-100 text-indigo-700',
    'Exame': 'bg-orange-100 text-orange-700',
    'Outro': 'bg-slate-100 text-slate-600',
  }
  return map[cat] ?? 'bg-slate-100 text-slate-600'
}

// Modal inline para adicionar/editar procedimento
function ProcedimentoModal({
  procedimento,
  onSave,
  onClose,
}: {
  procedimento?: Procedimento | null
  onSave: (p: Omit<Procedimento, 'id' | 'ativo'>) => void
  onClose: () => void
}) {
  const [form, setForm] = useState({
    nome: procedimento?.nome ?? '',
    categoria: procedimento?.categoria ?? 'Consulta' as Categoria,
    duracao: procedimento?.duracao ?? 30,
    valor: procedimento?.valor ?? 0,
    codigo_tuss: procedimento?.codigo_tuss ?? '',
  })

  const u = (f: string, v: any) => setForm(p => ({ ...p, [f]: v }))

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900">{procedimento ? 'Editar' : 'Novo'} Procedimento</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><X size={18} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Nome do Procedimento</label>
            <input type="text" value={form.nome} onChange={e => u('nome', e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div className="grid grid-cols-1 md: gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Categoria</label>
              <select value={form.categoria} onChange={e => u('categoria', e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                {CATEGORIAS.filter(c => c !== 'Todos').map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Duração (min)</label>
              <input type="number" value={form.duracao} onChange={e => u('duracao', Number(e.target.value))}
                className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-1 md: gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Valor (R$)</label>
              <input type="number" value={form.valor} onChange={e => u('valor', Number(e.target.value))}
                className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Código TUSS</label>
              <input type="text" value={form.codigo_tuss} onChange={e => u('codigo_tuss', e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-5 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 text-sm">Cancelar</button>
          <button
            onClick={() => { if (form.nome.trim()) onSave(form) }}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 text-sm"
          >
            <Save size={16} /> Salvar
          </button>
        </div>
      </div>
    </div>
  )
}

export function ProcedimentosPage() {
  const { toast } = useToast()
  const { user } = useAuthStore()
  const clinicaId = user?.clinicaId

  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([])
  const [filtroCategoria, setFiltroCategoria] = useState<string>('Todos')
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [modal, setModal] = useState<{ open: boolean; item?: Procedimento | null }>({ open: false })

  const load = useCallback(async () => {
    if (!clinicaId) return
    setIsLoading(true)
    // Buscar na tabela procedimentos (ou tipos_procedimento)
    const { data, error } = await supabase
      .from('procedimentos')
      .select('*')
      .eq('clinica_id', clinicaId)
      .eq('ativo', true)
      .order('nome', { ascending: true })

    if (error) {
      // Se a tabela não existir, mostrar estado vazio amigável
      console.warn('Tabela procedimentos não encontrada:', error.message)
      setProcedimentos([])
    } else {
      const mapped = (data || []).map((p: any) => ({
        ...p,
        duracao: p.duracao_minutos || 0,
        valor: p.valor_particular || 0
      })) as Procedimento[]
      setProcedimentos(mapped)
    }
    setIsLoading(false)
  }, [clinicaId])

  useEffect(() => { load() }, [load])

  const handleSave = async (formData: Omit<Procedimento, 'id' | 'ativo'>) => {
    if (!clinicaId) return
    if (modal.item) {
      // Update
      const { error } = await supabase.from('procedimentos').update(formData).eq('id', modal.item.id)
      if (error) { toast({ title: 'Erro', description: error.message, type: 'error' }); return }
      setProcedimentos(prev => prev.map(p => p.id === modal.item!.id ? { ...p, ...formData } : p))
    } else {
      // Insert
      const { data, error } = await supabase.from('procedimentos').insert({ ...formData, clinica_id: clinicaId, ativo: true }).select().single()
      if (error) { toast({ title: 'Erro', description: error.message, type: 'error' }); return }
      if (data) {
        const mapped = {
          ...(data as any),
          duracao: (data as any).duracao_minutos || 0,
          valor: (data as any).valor_particular || 0
        } as Procedimento
        setProcedimentos(prev => [...prev, mapped])
      }
    }
    toast({ title: 'Salvo!', description: 'Procedimento salvo com sucesso.', type: 'success' })
    setModal({ open: false })
  }

  const handleArchive = async (id: string) => {
    const { error } = await supabase.from('procedimentos').update({ ativo: false }).eq('id', id)
    if (error) { toast({ title: 'Erro', description: error.message, type: 'error' }); return }
    setProcedimentos(prev => prev.filter(p => p.id !== id))
    toast({ title: 'Arquivado', description: 'Procedimento removido do catálogo ativo.', type: 'success' })
  }

  const filtered = procedimentos.filter(p => {
    const matchCat = filtroCategoria === 'Todos' || p.categoria === filtroCategoria
    const matchSearch = !search || p.nome.toLowerCase().includes(search.toLowerCase()) || p.codigo_tuss?.includes(search)
    return matchCat && matchSearch
  })

  return (
    <>
      {modal.open && (
        <ProcedimentoModal
          procedimento={modal.item}
          onSave={handleSave}
          onClose={() => setModal({ open: false })}
        />
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
               <ClipboardList className="text-indigo-600" />
               Catálogo de Procedimentos
            </h2>
            <p className="text-sm font-medium text-slate-500 mt-1">Defina durações de agenda, valores e tipos de serviço que a IA pode agendar.</p>
          </div>
          <button 
            onClick={() => setModal({ open: true, item: null })}
            className="flex items-center gap-2 px-5 py-2.5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-colors"
          >
            <Plus size={18}/> Novo Procedimento
          </button>
        </div>

        <div className="p-4 border-b border-slate-100 flex items-center gap-4 bg-white flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nome ou TUSS..." 
              className="w-full pl-9 pr-3 py-2 text-sm font-medium border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
            />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
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
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400">
              <ClipboardList className="w-12 h-12 mb-3 text-slate-200" />
              <p className="font-bold text-sm">
                {procedimentos.length === 0 ? 'Nenhum procedimento cadastrado' : 'Nenhum resultado encontrado'}
              </p>
              {procedimentos.length === 0 && (
                <button
                  onClick={() => setModal({ open: true, item: null })}
                  className="mt-4 px-5 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700"
                >
                  Criar primeiro procedimento
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[750px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-widest">
                  <th className="px-6 py-4">TUSS</th>
                  <th className="px-6 py-4">Procedimento e Categoria</th>
                  <th className="px-6 py-4 text-center">Duração</th>
                  <th className="px-6 py-4 text-right">Valor Padrão</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium">
                {filtered.map((proc) => (
                  <tr key={proc.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 font-mono text-xs text-slate-500 font-bold">{proc.codigo_tuss || '—'}</td>
                    <td className="px-6 py-4">
                      <div>
                        <h3 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{proc.nome}</h3>
                        <Badge className={`mt-1 border-none tracking-widest uppercase text-[10px] ${categoriaBadgeStyle(proc.categoria)}`}>
                          {proc.categoria}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded font-bold text-xs">{proc.duracao} min</span>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-emerald-600">
                      {proc.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setModal({ open: true, item: proc })}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Editar">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleArchive(proc.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Arquivar">
                          <Archive size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  )
}
