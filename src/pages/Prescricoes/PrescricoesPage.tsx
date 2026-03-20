import React, { useState, useEffect, useCallback } from 'react'
import {
  ClipboardList, Plus, X, Loader2, Search,
  CheckCircle2, XCircle, Shield, Printer
} from 'lucide-react'
import { usePrescricoes } from '../../hooks/usePrescricoes'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'
import { Badge } from '../../components/ui/Badge'
import jsPDF from 'jspdf'

interface PacienteOpt { id: string; nome: string }

const TEMPLATE = `Rx

Medicamento:
Dose:
Frequência:
Duração:

Observações:
`

export function PrescricoesPage() {
  const { prescricoes, isLoading, createPrescricao, cancelarPrescricao } = usePrescricoes()
  const { user } = useAuthStore()
  const clinicaId = user?.clinicaId

  const [showModal, setShowModal] = useState(false)
  const [pacienteSearch, setPacienteSearch] = useState('')
  const [pacienteSelecionado, setPacienteSelecionado] = useState<PacienteOpt | null>(null)
  const [pacienteOpts, setPacienteOpts] = useState<PacienteOpt[]>([])
  const [conteudo, setConteudo] = useState(TEMPLATE)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const buscarPacientes = useCallback(async (q: string) => {
    if (!clinicaId || q.length < 2) { setPacienteOpts([]); return }
    const { data } = await supabase.from('pacientes').select('id, nome_completo')
      .eq('clinica_id', clinicaId).ilike('nome_completo', `%${q}%`).limit(6)
    setPacienteOpts((data || []).map((p: any) => ({ id: p.id, nome: p.nome_completo })))
  }, [clinicaId])

  const handleCriar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pacienteSelecionado) return
    setSaving(true)
    await createPrescricao({ paciente_id: pacienteSelecionado.id, conteudo })
    setSaving(false)
    setShowModal(false)
    setPacienteSelecionado(null)
    setPacienteSearch('')
    setConteudo(TEMPLATE)
  }

  const exportPDF = (p: typeof prescricoes[0]) => {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text('Prescrição Médica', 14, 20)
    doc.setFontSize(10)
    doc.text(`Paciente: ${p.paciente_nome}`, 14, 32)
    doc.text(`Profissional: ${p.profissional_nome}`, 14, 38)
    doc.text(`Data: ${new Date(p.created_at).toLocaleDateString('pt-BR')}`, 14, 44)
    doc.text(`Assinatura Digital: ${p.assinatura_hash.substring(0, 24)}...`, 14, 50)
    doc.line(14, 56, 196, 56)
    const lines = doc.splitTextToSize(p.conteudo, 180)
    doc.text(lines, 14, 64)
    doc.save(`prescricao-${p.paciente_nome.replace(/\s/g, '-')}-${p.id.substring(0, 8)}.pdf`)
  }

  const filtered = prescricoes.filter(p =>
    !search || p.paciente_nome.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      <header className="px-6 py-5 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <ClipboardList className="text-indigo-600" size={26} /> Prescrições Digitais
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">Prescrições com assinatura eletrônica e exportação PDF</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-colors"
          >
            <Plus size={18} /> Nova Prescrição
          </button>
        </div>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input type="text" placeholder="Buscar por paciente..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <ClipboardList className="w-16 h-16 mb-4 text-slate-200" />
            <p className="font-bold text-lg">Nenhuma prescrição encontrada</p>
            <button onClick={() => setShowModal(true)} className="mt-3 text-indigo-600 text-sm font-medium hover:underline">
              Criar primeira prescrição
            </button>
          </div>
        ) : (
          <div className="space-y-3 max-w-4xl mx-auto">
            {filtered.map(p => (
              <div key={p.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 font-black text-lg">
                  {p.paciente_nome.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-slate-800">{p.paciente_nome}</h3>
                    <span className="text-xs text-slate-400 font-mono">
                      {new Date(p.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">Por: {p.profissional_nome}</p>
                  <pre className="text-xs text-slate-600 bg-slate-50 rounded-lg p-3 font-mono whitespace-pre-wrap line-clamp-3 border border-slate-100">
                    {p.conteudo}
                  </pre>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <Shield size={12} className="text-indigo-400" />
                      {p.assinatura_hash.substring(0, 16)}...
                    </span>
                    <Badge className={`border-none text-[10px] uppercase font-bold tracking-widest ${p.status === 'ativa' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                      {p.status === 'ativa' ? <CheckCircle2 size={10} className="inline mr-1" /> : <XCircle size={10} className="inline mr-1" />}
                      {p.status}
                    </Badge>
                    <button onClick={() => exportPDF(p)}
                      className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 ml-auto">
                      <Printer size={14} /> Exportar PDF
                    </button>
                    {p.status === 'ativa' && (
                      <button onClick={() => cancelarPrescricao(p.id)}
                        className="text-xs font-bold text-red-400 hover:text-red-600">
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal Nova Prescrição */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-indigo-600" /> Nova Prescrição Digital
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleCriar} className="p-6 space-y-4">
              {/* Busca paciente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Paciente *</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input type="text" placeholder="Buscar paciente..."
                    value={pacienteSearch}
                    onChange={e => { setPacienteSearch(e.target.value); buscarPacientes(e.target.value); if (!e.target.value) setPacienteSelecionado(null) }}
                    className="w-full pl-9 p-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                  {pacienteOpts.length > 0 && !pacienteSelecionado && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-10 overflow-hidden">
                      {pacienteOpts.map(p => (
                        <button key={p.id} type="button" onClick={() => { setPacienteSelecionado(p); setPacienteSearch(p.nome); setPacienteOpts([]) }}
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-indigo-50 transition-colors font-medium text-slate-800">
                          {p.nome}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {pacienteSelecionado && (
                  <p className="text-xs text-emerald-600 font-bold mt-1 flex items-center gap-1">
                    <CheckCircle2 size={12} /> {pacienteSelecionado.nome} selecionado
                  </p>
                )}
              </div>

              {/* Editor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Conteúdo da Prescrição *</label>
                <textarea
                  rows={12}
                  required
                  className="w-full p-3 text-sm font-mono border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  value={conteudo}
                  onChange={e => setConteudo(e.target.value)}
                />
              </div>

              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex items-start gap-2">
                <Shield size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                <p className="text-xs text-indigo-700 font-medium">
                  Ao salvar, a prescrição será assinada digitalmente com seu ID de usuário e timestamp. A assinatura é única e imutável.
                </p>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={saving || !pacienteSelecionado}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors disabled:opacity-50">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
                  {saving ? 'Assinando...' : 'Assinar e Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
