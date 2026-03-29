import { useState, useEffect } from 'react'
import {
  CalendarOff, Plus, Trash2, AlertTriangle,
  MessageCircle, X, Loader2, Check
} from 'lucide-react'
import { useAusencias, type Ausencia, type ConsultaConflito } from '../../hooks/useAusencias'

// ── Types ─────────────────────────────────────────────────────────────────────

type ViewMode = 'list' | 'create' | 'conflict'

interface AusenciasModalProps {
  profissional: { id: string; nome_completo: string }
  onClose: () => void
}

const TIPO_LABELS: Record<Ausencia['tipo'], string> = {
  folga: 'Folga',
  atestado: 'Atestado',
  ferias: 'Férias',
  outro: 'Outro',
}

const TIPO_COLORS: Record<Ausencia['tipo'], string> = {
  folga: 'bg-blue-50 text-blue-700 border-blue-200',
  atestado: 'bg-red-50 text-red-700 border-red-200',
  ferias: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  outro: 'bg-[var(--color-bg-deep)] text-[var(--color-text-secondary)] border-[var(--color-border)]',
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AusenciasModal({ profissional, onClose }: AusenciasModalProps) {
  const {
    ausencias,
    conflitos,
    isLoading,
    loadAusencias,
    checkConflitos,
    createAusencia,
    deleteAusencia,
    cancelarConsultasConflitantes,
  } = useAusencias()

  const [view, setView] = useState<ViewMode>('list')

  // ── Form state ────────────────────────────────────────────────────────────
  const [formDataInicio, setFormDataInicio] = useState('')
  const [formDataFim, setFormDataFim] = useState('')
  const [formTipo, setFormTipo] = useState<Ausencia['tipo']>('folga')
  const [formMotivo, setFormMotivo] = useState('')

  // ── Created ausencia id (for conflict resolution) ─────────────────────────
  const [createdAusenciaId, setCreatedAusenciaId] = useState<string | null>(null)

  // ── Load on mount ─────────────────────────────────────────────────────────
  useEffect(() => {
    loadAusencias(profissional.id)
  }, [profissional.id, loadAusencias])

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleVerificarECriar = async () => {
    if (!formDataInicio || !formDataFim) return

    // Check conflicts first
    const found = await checkConflitos(profissional.id, formDataInicio, formDataFim)

    // Create the absence record
    const ausencia = await createAusencia({
      profissional_id: profissional.id,
      data_inicio: formDataInicio,
      data_fim: formDataFim,
      tipo: formTipo,
      motivo: formMotivo || undefined,
    })

    if (!ausencia) return

    if (found.length > 0) {
      setCreatedAusenciaId(ausencia.id)
      setView('conflict')
    } else {
      resetForm()
      await loadAusencias(profissional.id)
      setView('list')
    }
  }

  const handleCancelarENotificar = async () => {
    if (!createdAusenciaId) return
    await cancelarConsultasConflitantes(conflitos, createdAusenciaId, true)
    resetForm()
    await loadAusencias(profissional.id)
    setView('list')
  }

  const handleCancelarSemNotificar = async () => {
    if (!createdAusenciaId) return
    await cancelarConsultasConflitantes(conflitos, createdAusenciaId, false)
    resetForm()
    await loadAusencias(profissional.id)
    setView('list')
  }

  const handleApenasMarcarFolga = async () => {
    resetForm()
    await loadAusencias(profissional.id)
    setView('list')
  }

  const handleDelete = async (id: string) => {
    const ok = await deleteAusencia(id)
    if (ok) await loadAusencias(profissional.id)
  }

  const resetForm = () => {
    setFormDataInicio('')
    setFormDataFim('')
    setFormTipo('folga')
    setFormMotivo('')
    setCreatedAusenciaId(null)
  }

  // ── Formatters ────────────────────────────────────────────────────────────

  const fmtDate = (iso: string) => {
    if (!iso) return '—'
    const [y, m, d] = iso.split('T')[0].split('-')
    return `${d}/${m}/${y}`
  }

  const fmtDateTime = (iso: string) => {
    if (!iso) return '—'
    const date = new Date(iso)
    return date.toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-[var(--color-bg-card)] rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <CalendarOff size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--color-text-primary)]">Ausências</h2>
              <p className="text-xs text-[var(--color-text-muted)]">{profissional.nome_completo}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-[var(--color-bg-card-hover)] flex items-center justify-center transition-colors"
          >
            <X size={16} className="text-[var(--color-text-muted)]" />
          </button>
        </div>

        {/* ── Body ────────────────────────────────────────────────────────── */}
        <div className="p-6">

          {/* ══════════════ VIEW: LIST ══════════════ */}
          {view === 'list' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-widest">
                  Histórico de Ausências
                </p>
                <button
                  onClick={() => setView('create')}
                  className="flex items-center gap-1.5 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Plus size={14} />
                  Nova Ausência
                </button>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={20} className="animate-spin text-[var(--color-text-muted)]" />
                </div>
              ) : ausencias.length === 0 ? (
                <div className="text-center py-12">
                  <CalendarOff size={32} className="mx-auto text-[var(--color-text-dim)] mb-3" />
                  <p className="text-sm text-[var(--color-text-muted)]">Nenhuma ausência registrada</p>
                </div>
              ) : (
                <div className="border border-[var(--color-border)] rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-[var(--color-bg-deep)]/80 text-[var(--color-text-muted)] uppercase tracking-wider">
                        <th className="text-left px-4 py-2.5 font-semibold">Início</th>
                        <th className="text-left px-4 py-2.5 font-semibold">Fim</th>
                        <th className="text-left px-4 py-2.5 font-semibold">Tipo</th>
                        <th className="text-left px-4 py-2.5 font-semibold">Motivo</th>
                        <th className="text-center px-4 py-2.5 font-semibold">Status</th>
                        <th className="text-center px-4 py-2.5 font-semibold w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {ausencias.map(a => (
                        <tr key={a.id} className="hover:bg-[var(--color-bg-card-hover)]/50 transition-colors">
                          <td className="px-4 py-3 text-[var(--color-text-secondary)]">{fmtDate(a.data_inicio)}</td>
                          <td className="px-4 py-3 text-[var(--color-text-secondary)]">{fmtDate(a.data_fim)}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold border ${TIPO_COLORS[a.tipo]}`}>
                              {TIPO_LABELS[a.tipo]}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[var(--color-text-muted)] max-w-[140px] truncate">
                            {a.motivo || '—'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {a.notificou_pacientes ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-cyan-500/5 text-cyan-600 border border-cyan-500/20">
                                <Check size={10} /> Notificado
                              </span>
                            ) : a.consultas_canceladas > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                Cancelado s/ notif.
                              </span>
                            ) : (
                              <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[var(--color-bg-deep)] text-[var(--color-text-muted)] border border-[var(--color-border)]">
                                Sem conflitos
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleDelete(a.id)}
                              disabled={isLoading}
                              className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors text-[var(--color-text-muted)] hover:text-red-500"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ══════════════ VIEW: CREATE ══════════════ */}
          {view === 'create' && (
            <div className="space-y-5">
              <button
                onClick={() => { resetForm(); setView('list') }}
                className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] font-medium transition-colors"
              >
                &larr; Voltar para lista
              </button>

              <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-widest">
                Nova Ausência
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">Data Início</label>
                  <input
                    type="date"
                    value={formDataInicio}
                    onChange={e => setFormDataInicio(e.target.value)}
                    className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">Data Fim</label>
                  <input
                    type="date"
                    value={formDataFim}
                    onChange={e => setFormDataFim(e.target.value)}
                    min={formDataInicio || undefined}
                    className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">Tipo</label>
                <select
                  value={formTipo}
                  onChange={e => setFormTipo(e.target.value as Ausencia['tipo'])}
                  className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all"
                >
                  <option value="folga">Folga</option>
                  <option value="atestado">Atestado</option>
                  <option value="ferias">Férias</option>
                  <option value="outro">Outro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">
                  Motivo <span className="text-[var(--color-text-muted)] font-normal">(opcional)</span>
                </label>
                <textarea
                  value={formMotivo}
                  onChange={e => setFormMotivo(e.target.value)}
                  rows={3}
                  placeholder="Ex: Consulta médica, viagem..."
                  className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all resize-none"
                />
              </div>

              <button
                onClick={handleVerificarECriar}
                disabled={isLoading || !formDataInicio || !formDataFim}
                className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 rounded-xl transition-colors"
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <CalendarOff size={16} />
                )}
                Verificar e Criar
              </button>
            </div>
          )}

          {/* ══════════════ VIEW: CONFLICT ══════════════ */}
          {view === 'conflict' && (
            <div className="space-y-5">
              {/* Alert */}
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <AlertTriangle size={18} className="text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-amber-800">
                    {conflitos.length} paciente(s) agendado(s) neste periodo
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    Escolha como deseja tratar as consultas conflitantes abaixo.
                  </p>
                </div>
              </div>

              {/* Conflict table */}
              <div className="border border-[var(--color-border)] rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[var(--color-bg-deep)]/80 text-[var(--color-text-muted)] uppercase tracking-wider">
                      <th className="text-left px-4 py-2.5 font-semibold">Paciente</th>
                      <th className="text-left px-4 py-2.5 font-semibold">Telefone</th>
                      <th className="text-left px-4 py-2.5 font-semibold">Data/Hora</th>
                      <th className="text-left px-4 py-2.5 font-semibold">Procedimento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {conflitos.map(c => (
                      <tr key={c.id} className="hover:bg-[var(--color-bg-card-hover)]/50 transition-colors">
                        <td className="px-4 py-3 text-[var(--color-text-secondary)] font-medium">{c.paciente_nome}</td>
                        <td className="px-4 py-3 text-[var(--color-text-muted)]">{c.paciente_telefone || '—'}</td>
                        <td className="px-4 py-3 text-[var(--color-text-muted)]">{fmtDateTime(c.data_hora_inicio)}</td>
                        <td className="px-4 py-3 text-[var(--color-text-muted)]">{c.procedimento || 'Consulta'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={handleCancelarENotificar}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 px-4 py-2.5 rounded-xl transition-colors"
                >
                  {isLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <MessageCircle size={16} />
                  )}
                  Cancelar Consultas e Notificar via WhatsApp
                </button>

                <button
                  onClick={handleCancelarSemNotificar}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 disabled:opacity-50 px-4 py-2.5 rounded-xl transition-colors"
                >
                  {isLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <AlertTriangle size={16} />
                  )}
                  Cancelar sem Notificar
                </button>

                <button
                  onClick={handleApenasMarcarFolga}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-[var(--color-text-secondary)] bg-[var(--color-bg-deep)] hover:bg-[var(--color-bg-card-hover)] border border-[var(--color-border)] disabled:opacity-50 px-4 py-2.5 rounded-xl transition-colors"
                >
                  <CalendarOff size={16} />
                  Apenas Marcar Folga
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
