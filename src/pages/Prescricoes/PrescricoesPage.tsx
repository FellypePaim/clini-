import React, { useState, useCallback } from 'react'
import {
  ClipboardList, Plus, X, Loader2, Search,
  CheckCircle2, XCircle, Shield, Printer, Download, Eye, ChevronDown, ChevronLeft, ChevronRight,
  Pencil, Trash2
} from 'lucide-react'
import jsPDF from 'jspdf'
import { usePrescricoes } from '../../hooks/usePrescricoes'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'
import { Badge } from '../../components/ui/Badge'
import { cn } from '../../lib/utils'

interface PacienteOpt { id: string; nome: string; cpf?: string }

const TEMPLATE = `Rx

1. Medicamento:
   Dose:
   Frequência:
   Duração:

Observações:`

function fmtDate(d: string) { const p = d?.split('T')?.[0]?.split('-'); return p?.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : '—' }

export function PrescricoesPage() {
  const { prescricoes, isLoading, createPrescricao, cancelarPrescricao, updatePrescricao, deletePrescricao } = usePrescricoes()
  const { user } = useAuthStore()
  const clinicaId = user?.clinicaId

  const [showModal, setShowModal] = useState(false)
  const [viewingPresc, setViewingPresc] = useState<typeof prescricoes[0] | null>(null)
  const [pacienteSearch, setPacienteSearch] = useState('')
  const [pacienteSelecionado, setPacienteSelecionado] = useState<PacienteOpt | null>(null)
  const [pacienteOpts, setPacienteOpts] = useState<PacienteOpt[]>([])
  const [conteudo, setConteudo] = useState(TEMPLATE)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'todos' | 'ativa' | 'cancelada'>('todos')
  const [filterPeriod, setFilterPeriod] = useState<'todos' | '7d' | '30d' | '90d'>('todos')
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingPresc, setEditingPresc] = useState<typeof prescricoes[0] | null>(null)
  const [editConteudo, setEditConteudo] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const PAGE_SIZE = 8

  const buscarPacientes = useCallback(async (q: string) => {
    if (!clinicaId || q.length < 2) { setPacienteOpts([]); return }
    const { data } = await supabase.from('pacientes').select('id, nome_completo, cpf')
      .eq('clinica_id', clinicaId).ilike('nome_completo', `%${q}%`).limit(6)
    setPacienteOpts((data || []).map((p: any) => ({ id: p.id, nome: p.nome_completo, cpf: p.cpf })))
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

  // ── PDF Profissional ──
  const generatePDF = (p: typeof prescricoes[0]) => {
    const pdf = new jsPDF('p', 'mm', 'a4')
    const w = pdf.internal.pageSize.getWidth()
    const m = 18
    let y = 15

    // Header
    pdf.setFillColor(22, 163, 74)
    pdf.rect(0, 0, w, 2, 'F')
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(16)
    pdf.setTextColor(17, 24, 39)
    pdf.text(user?.clinicaNome || 'Prontuário Verde', m, y + 7)
    pdf.setFontSize(8)
    pdf.setTextColor(156, 163, 175)
    pdf.text('Prescrição Médica Digital', w - m, y + 7, { align: 'right' })
    y += 16
    pdf.setDrawColor(22, 163, 74)
    pdf.line(m, y, w - m, y)
    y += 10

    // Título
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(14)
    pdf.setTextColor(17, 24, 39)
    pdf.text('PRESCRIÇÃO MÉDICA', w / 2, y, { align: 'center' })
    y += 4
    pdf.setFillColor(22, 163, 74)
    pdf.rect(w / 2 - 10, y, 20, 0.7, 'F')
    y += 10

    // Info paciente
    pdf.setFillColor(249, 250, 251)
    pdf.roundedRect(m, y, w - m * 2, 20, 2, 2, 'F')
    pdf.setFontSize(7)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(156, 163, 175)
    pdf.text('PACIENTE', m + 4, y + 5)
    pdf.text('DATA', m + 80, y + 5)
    pdf.text('PROFISSIONAL', m + 120, y + 5)
    pdf.setFontSize(9)
    pdf.setTextColor(55, 65, 81)
    pdf.text(p.paciente_nome, m + 4, y + 12)
    pdf.text(fmtDate(p.created_at), m + 80, y + 12)
    pdf.text(p.profissional_nome, m + 120, y + 12)
    y += 28

    // Conteúdo
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(11)
    pdf.setTextColor(55, 65, 81)
    const lines = pdf.splitTextToSize(p.conteudo, w - m * 2)
    for (const line of lines) {
      if (y > 260) { pdf.addPage(); y = 20 }
      pdf.text(line, m, y)
      y += 6
    }

    // Assinatura
    y += 15
    if (y > 250) { pdf.addPage(); y = 20 }
    pdf.setDrawColor(229, 231, 235)
    pdf.setLineDashPattern([2, 2], 0)
    pdf.line(m, y, w - m, y)
    pdf.setLineDashPattern([], 0)
    y += 8
    pdf.setFontSize(7)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(156, 163, 175)
    pdf.text('ASSINATURA DIGITAL', w / 2, y, { align: 'center' })
    y += 5
    pdf.setFontSize(8)
    pdf.setTextColor(22, 163, 74)
    pdf.text(`Hash: ${p.assinatura_hash.substring(0, 32)}`, w / 2, y, { align: 'center' })
    y += 4
    pdf.text('Documento assinado digitalmente — válido por 180 dias', w / 2, y, { align: 'center' })

    // Validade
    const validade = new Date(p.created_at)
    validade.setDate(validade.getDate() + 180)
    y += 5
    pdf.setTextColor(156, 163, 175)
    pdf.text(`Válida até: ${fmtDate(validade.toISOString())}`, w / 2, y, { align: 'center' })

    // Footer
    pdf.setFontSize(6)
    pdf.setTextColor(180, 180, 180)
    pdf.text('Gerado pelo sistema Prontuário Verde. Possui validade jurídica conforme Lei 14.063/2020.', w / 2, 288, { align: 'center' })

    return pdf
  }

  const handleDownloadPDF = (p: typeof prescricoes[0]) => {
    const pdf = generatePDF(p)
    pdf.save(`prescricao_${p.paciente_nome.replace(/\s/g, '_')}.pdf`)
  }

  const handlePrint = (p: typeof prescricoes[0]) => {
    const validade = new Date(p.created_at)
    validade.setDate(validade.getDate() + 180)
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<!DOCTYPE html><html><head><title>Prescrição — ${p.paciente_nome}</title><style>
      @page { margin: 25mm 20mm; }
      body { font-family: Georgia, serif; margin: 0; color: #111; font-size: 13px; line-height: 1.8; }
      .header { border-bottom: 2px solid #16a34a; padding-bottom: 12px; margin-bottom: 20px; }
      .header h1 { font-size: 18px; margin: 0; }
      .header small { color: #999; font-size: 9px; text-transform: uppercase; letter-spacing: 2px; }
      .titulo { text-align: center; font-size: 16px; text-transform: uppercase; letter-spacing: 3px; font-weight: bold; margin: 30px 0 8px; }
      .barra { width: 40px; height: 2px; background: #16a34a; margin: 0 auto 30px; }
      .info { display: flex; gap: 40px; background: #f9fafb; padding: 12px 16px; border-radius: 8px; margin-bottom: 30px; font-size: 12px; }
      .info label { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #999; display: block; }
      .conteudo { white-space: pre-line; font-size: 14px; line-height: 2; }
      .assinatura { text-align: center; margin-top: 50px; border-top: 2px dashed #e5e7eb; padding-top: 20px; }
      .assinatura .hash { color: #16a34a; font-size: 10px; font-family: monospace; }
      .assinatura .selo { color: #16a34a; font-size: 9px; text-transform: uppercase; letter-spacing: 2px; font-weight: bold; margin-top: 8px; }
      .footer { text-align: center; font-size: 8px; color: #bbb; margin-top: 40px; border-top: 1px solid #eee; padding-top: 12px; }
    </style></head><body>
      <div class="header"><h1>${user?.clinicaNome || 'Prontuário Verde'}</h1><small>Prescrição Médica Digital</small></div>
      <div class="titulo">Prescrição Médica</div>
      <div class="barra"></div>
      <div class="info">
        <div><label>Paciente</label>${p.paciente_nome}</div>
        <div><label>Data</label>${fmtDate(p.created_at)}</div>
        <div><label>Profissional</label>${p.profissional_nome}</div>
        <div><label>Validade</label>${fmtDate(validade.toISOString())}</div>
      </div>
      <div class="conteudo">${p.conteudo}</div>
      <div class="assinatura">
        <div class="hash">Hash: ${p.assinatura_hash.substring(0, 32)}</div>
        <div class="selo">Documento assinado digitalmente — válido por 180 dias</div>
        <div style="margin-top:30px;border-bottom:1px solid #333;width:200px;margin-left:auto;margin-right:auto;"></div>
        <div style="font-size:11px;margin-top:4px;">${p.profissional_nome}</div>
        <div style="font-size:10px;color:#999;">${user?.crm || ''}</div>
      </div>
      <div class="footer">Gerado pelo sistema Prontuário Verde. Válido conforme Lei 14.063/2020.</div>
    </body></html>`)
    win.document.close()
    setTimeout(() => win.print(), 600)
  }

  const filtered = prescricoes.filter(p => {
    const matchSearch = !search || p.paciente_nome.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'todos' || p.status === filterStatus
    const matchPeriod = filterPeriod === 'todos' || (() => {
      const days = { '7d': 7, '30d': 30, '90d': 90 }[filterPeriod] || 0
      return (Date.now() - new Date(p.created_at).getTime()) < days * 86400000
    })()
    return matchSearch && matchStatus && matchPeriod
  })
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      <header className="px-6 py-5 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <ClipboardList className="text-green-600" size={26} /> Prescrições Digitais
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">Prescrições com assinatura eletrônica e exportação PDF</p>
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 font-semibold text-white bg-green-600 hover:bg-green-700 rounded-xl shadow-md transition-colors">
            <Plus size={18} /> Nova Prescrição
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="text" placeholder="Buscar por paciente..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500/20" />
          </div>
          <div className="flex items-center bg-slate-50 rounded-lg p-1 border border-slate-100">
            {(['todos', 'ativa', 'cancelada'] as const).map(s => (
              <button key={s} onClick={() => { setFilterStatus(s); setPage(1) }}
                className={cn('px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize',
                  filterStatus === s ? 'bg-white text-green-700 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-700')}>
                {s === 'todos' ? 'Todas' : s === 'ativa' ? 'Ativas' : 'Canceladas'}
              </button>
            ))}
          </div>
          <select value={filterPeriod} onChange={e => { setFilterPeriod(e.target.value as any); setPage(1) }}
            className="px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500/20">
            <option value="todos">Qualquer data</option>
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
          </select>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-green-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <ClipboardList className="w-16 h-16 mb-4 text-slate-200" />
            <p className="font-bold text-lg">Nenhuma prescrição encontrada</p>
            <button onClick={() => setShowModal(true)} className="mt-3 text-green-600 text-sm font-medium hover:underline">Criar primeira prescrição</button>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Contagem */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">{filtered.length} prescrição(ões){search ? ' encontrada(s)' : ''}</p>
            </div>

            {/* Lista paginada */}
            <div className="space-y-3">
              {paginated.map(p => {
                const isExpanded = expandedId === p.id
                // Extrair preview: primeira linha que não seja "Rx" e não seja vazia
                const previewLine = p.conteudo
                  ?.split('\n')
                  .map((l: string) => l.trim())
                  .find((l: string) => l && l !== 'Rx' && !l.startsWith('Observações')) || ''
                const previewText = previewLine.length > 60 ? previewLine.slice(0, 60) + '...' : previewLine

                return (
                  <div key={p.id} className="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                    {/* Header do card — sempre visível */}
                    <div className="p-4 flex items-center gap-4 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : p.id)}>
                      <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0 font-bold text-sm">
                        Rx
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-800 text-sm">{p.paciente_nome}</h3>
                          <Badge className={cn("border-none text-[9px] uppercase font-bold",
                            p.status === 'ativa' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600')}>
                            {p.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">Dr(a). {p.profissional_nome} · {fmtDate(p.created_at)}</p>
                        {previewText && !isExpanded && (
                          <p className="text-[11px] text-slate-500 mt-1 truncate">{previewText}</p>
                        )}
                      </div>
                      <ChevronDown className={cn("w-4 h-4 text-slate-300 transition-transform shrink-0", isExpanded && "rotate-180")} />
                    </div>

                    {/* Detalhes — expandido */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 animate-fade-in">
                        <div className="p-4 bg-slate-50/50">
                          <pre className="text-xs text-slate-600 font-mono whitespace-pre-wrap leading-relaxed">{p.conteudo}</pre>
                        </div>
                        <div className="px-4 py-3 flex items-center justify-between border-t border-slate-100">
                          <span className="flex items-center gap-1.5 text-[10px] text-green-600 font-medium">
                            <CheckCircle2 size={12} /> Assinada digitalmente
                          </span>
                          <div className="flex items-center gap-1">
                            <button onClick={() => setViewingPresc(p)} className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                              <Eye className="w-3 h-3" /> Ver Documento
                            </button>
                            <button onClick={() => handlePrint(p)} className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-semibold text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                              <Printer className="w-3 h-3" /> Imprimir
                            </button>
                            <button onClick={() => handleDownloadPDF(p)} className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-semibold text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                              <Download className="w-3 h-3" /> PDF
                            </button>
                            {p.status === 'ativa' && (
                              <>
                                <button onClick={() => { setEditingPresc(p); setEditConteudo(p.conteudo) }} className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-semibold text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                                  <Pencil className="w-3 h-3" /> Editar
                                </button>
                                <button onClick={() => cancelarPrescricao(p.id)} className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-semibold text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                  <XCircle className="w-3 h-3" /> Cancelar
                                </button>
                              </>
                            )}
                            <button onClick={() => setDeleteConfirm(p.id)} className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-semibold text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors">
                              <Trash2 className="w-3 h-3" /> Excluir
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-400">
                  {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length}
                </p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 transition-colors text-slate-500">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                    <button key={n} onClick={() => setPage(n)}
                      className={cn("w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors",
                        page === n ? "bg-green-600 text-white" : "border border-slate-200 text-slate-500 hover:bg-slate-50")}>
                      {n}
                    </button>
                  ))}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 transition-colors text-slate-500">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal Editar Prescrição */}
      {editingPresc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Pencil className="w-5 h-5 text-amber-500" /> Editar Prescrição
              </h2>
              <button onClick={() => setEditingPresc(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-lg p-3 text-sm">
                <span className="text-xs font-bold text-slate-400 uppercase">Paciente:</span>
                <span className="ml-2 font-semibold text-slate-700">{editingPresc.paciente_nome}</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Conteúdo da Prescrição</label>
                <textarea rows={12} className="w-full p-3 text-sm font-mono border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500/20 resize-none"
                  value={editConteudo} onChange={e => setEditConteudo(e.target.value)} />
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                <Shield size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 font-medium">Ao salvar, a prescrição será reassinada digitalmente com novo hash.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setEditingPresc(null)} className="flex-1 px-4 py-2.5 font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Cancelar</button>
                <button disabled={editSaving || !editConteudo.trim()}
                  onClick={async () => {
                    setEditSaving(true)
                    await updatePrescricao(editingPresc.id, editConteudo)
                    setEditSaving(false)
                    setEditingPresc(null)
                    setExpandedId(null)
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition-colors disabled:opacity-50">
                  {editSaving ? <Loader2 size={16} className="animate-spin" /> : <Pencil size={16} />}
                  {editSaving ? 'Salvando...' : 'Salvar e Reassinar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Exclusão */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm animate-fade-in">
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trash2 size={28} className="text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Excluir prescrição?</h3>
              <p className="text-sm text-gray-500">Esta ação é irreversível. A prescrição será removida permanentemente do sistema.</p>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                Cancelar
              </button>
              <button onClick={async () => {
                  await deletePrescricao(deleteConfirm)
                  setDeleteConfirm(null)
                  setExpandedId(null)
                }}
                className="flex-1 px-4 py-2.5 font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors">
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Visualizar Prescrição */}
      {viewingPresc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setViewingPresc(null)} />
          <div className="relative bg-gray-100 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-fade-in">
            <div className="bg-gray-800 px-6 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 text-white">
                <ClipboardList className="w-5 h-5 text-green-400" />
                <span className="text-sm font-bold">Prescrição — {viewingPresc.paciente_nome}</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => handlePrint(viewingPresc)} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Imprimir"><Printer className="w-4 h-4" /></button>
                <button onClick={() => handleDownloadPDF(viewingPresc)} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="PDF"><Download className="w-4 h-4" /></button>
                <button onClick={() => setViewingPresc(null)} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-8 flex justify-center">
              <div className="bg-white w-full max-w-xl shadow-xl rounded-sm border border-gray-200" style={{ minHeight: '500px' }}>
                <div className="border-b-2 border-green-600 p-8 pb-6">
                  <h2 className="text-xl font-black text-gray-900">{user?.clinicaNome || 'Prontuário Verde'}</h2>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Prescrição Médica Digital</p>
                </div>
                <div className="px-8 pt-8 pb-4 text-center">
                  <h3 className="text-base font-black text-gray-900 uppercase tracking-wider">Prescrição Médica</h3>
                  <div className="w-16 h-0.5 bg-green-500 mx-auto mt-3" />
                </div>
                <div className="px-8 py-3">
                  <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg text-xs">
                    <div><p className="text-[9px] font-bold text-gray-400 uppercase">Paciente</p><p className="text-gray-700 font-bold mt-1">{viewingPresc.paciente_nome}</p></div>
                    <div><p className="text-[9px] font-bold text-gray-400 uppercase">Data</p><p className="text-gray-700 font-bold mt-1">{fmtDate(viewingPresc.created_at)}</p></div>
                    <div><p className="text-[9px] font-bold text-gray-400 uppercase">Profissional</p><p className="text-gray-700 font-bold mt-1">{viewingPresc.profissional_nome}</p></div>
                  </div>
                </div>
                <div className="px-8 py-4">
                  <pre className="text-sm text-gray-700 leading-relaxed whitespace-pre-line font-serif">{viewingPresc.conteudo}</pre>
                </div>
                <div className="px-8 py-6 mt-4 border-t-2 border-dashed border-gray-200 text-center">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Assinatura Digital</p>
                  <p className="text-[10px] font-mono text-green-600">{viewingPresc.assinatura_hash.substring(0, 40)}</p>
                  <p className="text-[9px] font-bold text-green-600 uppercase tracking-widest mt-3">Documento Assinado Digitalmente</p>
                  <div className="w-32 h-px bg-gray-300 mx-auto mt-6 mb-2" />
                  <p className="text-xs text-gray-700 font-semibold">{viewingPresc.profissional_nome}</p>
                  <p className="text-[10px] text-gray-400">{user?.crm || ''}</p>
                </div>
                <div className="px-8 py-3 bg-gray-50 border-t border-gray-100 text-center">
                  <p className="text-[8px] text-gray-400">Válido por 180 dias. Gerado pelo sistema Prontuário Verde. Lei 14.063/2020.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nova Prescrição */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-green-600" /> Nova Prescrição Digital
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleCriar} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Paciente *</label>
                <div className="relative">
                  <input type="text" placeholder="Buscar paciente..." value={pacienteSearch}
                    onChange={e => { setPacienteSearch(e.target.value); buscarPacientes(e.target.value); if (!e.target.value) setPacienteSelecionado(null) }}
                    className="input-base" />
                  {pacienteOpts.length > 0 && !pacienteSelecionado && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-10 overflow-hidden">
                      {pacienteOpts.map(p => (
                        <button key={p.id} type="button" onClick={() => { setPacienteSelecionado(p); setPacienteSearch(p.nome); setPacienteOpts([]) }}
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-green-50 transition-colors"><span className="font-medium">{p.nome}</span>{p.cpf && <span className="text-gray-400 ml-2 text-xs">CPF: {p.cpf}</span>}</button>
                      ))}
                    </div>
                  )}
                </div>
                {pacienteSelecionado && <p className="text-xs text-green-600 font-semibold mt-1 flex items-center gap-1"><CheckCircle2 size={12} /> {pacienteSelecionado.nome}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Conteúdo da Prescrição *</label>
                <textarea rows={12} required className="w-full p-3 text-sm font-mono border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500/20 resize-none"
                  value={conteudo} onChange={e => setConteudo(e.target.value)} />
              </div>
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-start gap-2">
                <Shield size={16} className="text-green-600 shrink-0 mt-0.5" />
                <p className="text-xs text-green-700 font-medium">Ao salvar, a prescrição será assinada digitalmente. Válida por 180 dias.</p>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Cancelar</button>
                <button type="submit" disabled={saving || !pacienteSelecionado}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 font-semibold text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors disabled:opacity-50">
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
