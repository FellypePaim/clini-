import { useState, useEffect, useCallback } from 'react'
import {
  Plus, X, Trash2, DollarSign, CheckCircle, ClipboardList, Wallet,
  Send, Printer, AlertTriangle, CreditCard, Loader2
} from 'lucide-react'
import jsPDF from 'jspdf'
import { cn } from '../../lib/utils'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { useToast } from '../../hooks/useToast'
import { usePatients } from '../../hooks/usePatients'

interface OrcItem { descricao: string; valor: number }
interface Orcamento {
  id: string
  itens: OrcItem[]
  total: number
  desconto: number
  status: string
  forma_pagamento?: string
  parcelas?: number
  valor_pago?: number
  created_at: string
  vencimento?: string
}

const FORMAS = [
  { id: 'pix', label: 'PIX', icon: '⚡' },
  { id: 'dinheiro', label: 'Dinheiro', icon: '💵' },
  { id: 'credito', label: 'Cartão Crédito', icon: '💳' },
  { id: 'debito', label: 'Cartão Débito', icon: '💳' },
  { id: 'convenio', label: 'Convênio', icon: '🏥' },
]

function fmtMoney(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }
function fmtDate(d: string) { const p = d?.split('T')?.[0]?.split('-'); return p?.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : d || '—' }

export function PatientFinancialTab({ pacienteId }: { pacienteId: string }) {
  const { user } = useAuthStore()
  const clinicaId = user?.clinicaId
  const { toast } = useToast()
  const { getPatientById } = usePatients()

  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showNewModal, setShowNewModal] = useState(false)
  const [showPayModal, setShowPayModal] = useState<string | null>(null)

  // Form novo orçamento
  const [newItens, setNewItens] = useState<OrcItem[]>([{ descricao: '', valor: 0 }])
  const [newDesconto, setNewDesconto] = useState(0)
  const [newVencimento, setNewVencimento] = useState('')
  const [saving, setSaving] = useState(false)

  // Form pagamento
  const [payForma, setPayForma] = useState('pix')
  const [payParcelas, setPayParcelas] = useState(1)
  const [payValor, setPayValor] = useState('')
  const [payingId, setPayingId] = useState<string | null>(null)

  // Carregar orçamentos
  const load = useCallback(async () => {
    if (!clinicaId) return
    setIsLoading(true)
    const { data } = await supabase
      .from('orcamentos')
      .select('*')
      .eq('paciente_id', pacienteId)
      .eq('clinica_id', clinicaId)
      .order('created_at', { ascending: false })

    setOrcamentos((data || []).map((r: any) => ({
      id: r.id,
      itens: Array.isArray(r.itens) ? r.itens : [],
      total: r.total || 0,
      desconto: r.desconto_geral || 0,
      status: r.status || 'pendente',
      forma_pagamento: r.condicoes_pagamento?.forma || null,
      parcelas: r.condicoes_pagamento?.parcelas || null,
      valor_pago: r.condicoes_pagamento?.valor_pago || null,
      created_at: r.created_at,
      vencimento: r.validade,
    })))
    setIsLoading(false)
  }, [clinicaId, pacienteId])

  useEffect(() => { load() }, [load])

  const subtotal = newItens.reduce((s, i) => s + (i.valor || 0), 0)
  const totalComDesconto = Math.max(0, subtotal - newDesconto)

  // Criar orçamento
  const handleCreate = async () => {
    if (!clinicaId || newItens.every(i => !i.descricao.trim())) return
    setSaving(true)
    try {
      const itensLimpos = newItens.filter(i => i.descricao.trim())
      const pad = (n: number) => String(n).padStart(2, '0')
      const venc = newVencimento || (() => {
        const d = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
      })()

      const { data: orc, error } = await supabase.from('orcamentos').insert({
        clinica_id: clinicaId,
        paciente_id: pacienteId,
        itens: itensLimpos,
        subtotal,
        desconto_geral: newDesconto,
        total: totalComDesconto,
        status: 'pendente',
        validade: venc,
      } as any).select('id').single()
      if (error) throw error

      await supabase.from('lancamentos').insert({
        clinica_id: clinicaId, paciente_id: pacienteId, orcamento_id: orc.id,
        tipo: 'receita', descricao: itensLimpos.map(i => i.descricao).join(', '),
        valor: totalComDesconto, status: 'pendente', categoria: 'procedimento', vencimento: venc,
      } as any)

      toast({ title: 'Orçamento criado!', type: 'success' })
      setShowNewModal(false)
      setNewItens([{ descricao: '', valor: 0 }])
      setNewDesconto(0)
      setNewVencimento('')
      await load()
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, type: 'error' })
    } finally { setSaving(false) }
  }

  // Pagar (total ou parcial)
  const handlePay = async () => {
    if (!showPayModal || !clinicaId) return
    setPayingId(showPayModal)
    try {
      const orc = orcamentos.find(o => o.id === showPayModal)
      if (!orc) return
      const valorPagar = payValor ? parseFloat(payValor) : orc.total
      const isParcial = valorPagar < orc.total
      const totalPago = (orc.valor_pago || 0) + valorPagar
      const quitado = totalPago >= orc.total

      const agora = new Date().toISOString()
      await supabase.from('orcamentos').update({
        status: quitado ? 'aprovado' : 'pendente',
        aprovado_em: quitado ? agora : null,
        condicoes_pagamento: {
          forma: payForma,
          parcelas: payParcelas,
          valor_pago: totalPago,
          ultimo_pagamento: agora,
        },
      } as any).eq('id', showPayModal)

      await supabase.from('lancamentos').update({
        status: quitado ? 'pago' : 'pendente',
        pago_em: quitado ? agora : null,
        forma_pagamento: payForma,
      } as any).eq('orcamento_id', showPayModal)

      toast({ title: quitado ? 'Pago!' : 'Pagamento parcial registrado', description: `${fmtMoney(valorPagar)} via ${FORMAS.find(f => f.id === payForma)?.label}`, type: 'success' })
      setShowPayModal(null)
      setPayValor('')
      setPayParcelas(1)
      await load()
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, type: 'error' })
    } finally { setPayingId(null) }
  }

  // Enviar WhatsApp
  const handleSendWhatsApp = async (orc: Orcamento) => {
    try {
      const paciente = await getPatientById(pacienteId)
      if (!paciente?.contato?.telefone) { toast({ title: 'Sem telefone', type: 'warning' }); return }
      const itensText = orc.itens.map((i, idx) => `${idx + 1}. ${i.descricao} — ${fmtMoney(i.valor)}`).join('\n')
      const msg = `Olá ${paciente.nome.split(' ')[0]}, segue seu orçamento da ${user?.clinicaNome || 'clínica'}:\n\n${itensText}\n${orc.desconto > 0 ? `\nDesconto: -${fmtMoney(orc.desconto)}` : ''}\n*Total: ${fmtMoney(orc.total)}*\n\nValidade: ${fmtDate(orc.vencimento || '')}\nQualquer dúvida, responda esta mensagem.`
      await supabase.functions.invoke('whatsapp-send', {
        body: { numero: paciente.contato.telefone, texto: msg, tipo: 'texto', clinica_id: clinicaId },
      })
      toast({ title: 'Orçamento enviado!', type: 'success' })
    } catch (err: any) { toast({ title: 'Erro', description: err.message, type: 'error' }) }
  }

  // Gerar recibo PDF
  const handleReciboPDF = async (orc: Orcamento) => {
    const paciente = await getPatientById(pacienteId)
    const pdf = new jsPDF('p', 'mm', 'a4')
    const w = pdf.internal.pageSize.getWidth()
    const m = 18
    let y = 15

    pdf.setFillColor(22, 163, 74)
    pdf.rect(0, 0, w, 2, 'F')
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(16)
    pdf.setTextColor(17, 24, 39)
    pdf.text(user?.clinicaNome || 'Prontuário Verde', m, y + 7)
    pdf.setFontSize(8)
    pdf.setTextColor(156, 163, 175)
    pdf.text(orc.status === 'aprovado' ? 'RECIBO DE PAGAMENTO' : 'ORÇAMENTO', w - m, y + 7, { align: 'right' })
    y += 16
    pdf.setDrawColor(22, 163, 74)
    pdf.line(m, y, w - m, y)
    y += 8

    // Dados paciente
    pdf.setFontSize(9)
    pdf.setTextColor(75, 85, 99)
    pdf.text(`Paciente: ${paciente?.nome || '—'}`, m, y)
    pdf.text(`CPF: ${paciente?.cpf || '—'}`, m + 90, y)
    y += 5
    pdf.text(`Data: ${fmtDate(orc.created_at)}`, m, y)
    if (orc.vencimento) pdf.text(`Vencimento: ${fmtDate(orc.vencimento)}`, m + 90, y)
    y += 10

    // Tabela itens
    pdf.setFillColor(249, 250, 251)
    pdf.rect(m, y, w - m * 2, 7, 'F')
    pdf.setFontSize(7)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(120, 120, 120)
    pdf.text('ITEM', m + 2, y + 5)
    pdf.text('VALOR', w - m - 2, y + 5, { align: 'right' })
    y += 10

    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(55, 65, 81)
    pdf.setFontSize(9)
    orc.itens.forEach((item, i) => {
      pdf.text(`${i + 1}. ${item.descricao}`, m + 2, y)
      pdf.text(fmtMoney(item.valor), w - m - 2, y, { align: 'right' })
      y += 6
    })

    y += 4
    pdf.setDrawColor(229, 231, 235)
    pdf.line(m, y, w - m, y)
    y += 6

    if (orc.desconto > 0) {
      pdf.text('Subtotal:', m + 80, y)
      pdf.text(fmtMoney(orc.total + orc.desconto), w - m - 2, y, { align: 'right' })
      y += 5
      pdf.setTextColor(239, 68, 68)
      pdf.text(`Desconto:`, m + 80, y)
      pdf.text(`-${fmtMoney(orc.desconto)}`, w - m - 2, y, { align: 'right' })
      y += 5
      pdf.setTextColor(55, 65, 81)
    }

    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(11)
    pdf.text('TOTAL:', m + 80, y)
    pdf.text(fmtMoney(orc.total), w - m - 2, y, { align: 'right' })
    y += 10

    if (orc.forma_pagamento) {
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(100, 100, 100)
      pdf.text(`Forma: ${FORMAS.find(f => f.id === orc.forma_pagamento)?.label || orc.forma_pagamento}${orc.parcelas && orc.parcelas > 1 ? ` (${orc.parcelas}x)` : ''}`, m, y)
    }

    // Footer
    pdf.setFontSize(6)
    pdf.setTextColor(180, 180, 180)
    pdf.text('Gerado pelo sistema Prontuário Verde', w / 2, 285, { align: 'center' })

    pdf.save(`${orc.status === 'aprovado' ? 'recibo' : 'orcamento'}_${pacienteId.substring(0, 8)}.pdf`)
    toast({ title: 'PDF gerado', type: 'success' })
  }

  // KPIs
  const totalPendente = orcamentos.filter(o => o.status === 'pendente').reduce((s, o) => s + o.total, 0)
  const totalPago = orcamentos.filter(o => o.status === 'aprovado').reduce((s, o) => s + o.total, 0)
  const hoje = new Date().toISOString().split('T')[0]
  const atrasados = orcamentos.filter(o => o.status === 'pendente' && o.vencimento && o.vencimento < hoje)

  return (
    <div className="space-y-5">
      {/* Alerta de atraso */}
      {atrasados.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-800">{atrasados.length} orçamento{atrasados.length > 1 ? 's' : ''} vencido{atrasados.length > 1 ? 's' : ''}</p>
            <p className="text-xs text-red-600 mt-0.5">Total em atraso: {fmtMoney(atrasados.reduce((s, o) => s + o.total, 0))}</p>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)] p-4">
          <p className="text-xs text-[var(--color-text-muted)]">Total</p>
          <p className="text-lg font-bold text-[var(--color-text-primary)] mt-1">{fmtMoney(totalPendente + totalPago)}</p>
        </div>
        <div className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)] p-4">
          <p className="text-xs text-[var(--color-text-muted)]">Pendente</p>
          <p className="text-lg font-bold text-yellow-600 mt-1">{fmtMoney(totalPendente)}</p>
        </div>
        <div className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)] p-4">
          <p className="text-xs text-[var(--color-text-muted)]">Pago</p>
          <p className="text-lg font-bold text-cyan-500 mt-1">{fmtMoney(totalPago)}</p>
        </div>
        <div className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)] p-4">
          <p className="text-xs text-[var(--color-text-muted)]">Em atraso</p>
          <p className={cn("text-lg font-bold mt-1", atrasados.length > 0 ? "text-red-600" : "text-[var(--color-text-dim)]")}>{fmtMoney(atrasados.reduce((s, o) => s + o.total, 0))}</p>
        </div>
      </div>

      {/* Lista */}
      <div className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-bg-deep)]/50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-2"><Wallet className="w-4 h-4 text-cyan-500" /> Orçamentos</h3>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{orcamentos.length} registro{orcamentos.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={() => setShowNewModal(true)} className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> Novo Orçamento
          </button>
        </div>

        <div className="p-5">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-7 h-7 animate-spin text-cyan-500" /></div>
          ) : orcamentos.length > 0 ? (
            <div className="space-y-3">
              {orcamentos.map(orc => {
                const isPago = orc.status === 'aprovado'
                const isAtrasado = !isPago && orc.vencimento && orc.vencimento < hoje
                const diasAtraso = isAtrasado ? Math.floor((new Date(hoje).getTime() - new Date(orc.vencimento!).getTime()) / (1000 * 60 * 60 * 24)) : 0
                const parcial = orc.valor_pago && orc.valor_pago > 0 && orc.valor_pago < orc.total

                return (
                  <div key={orc.id} className={cn("p-4 rounded-xl border transition-all group", isAtrasado ? "border-red-200 bg-red-50/30" : "border-[var(--color-border)] hover:border-[var(--color-border)] hover:shadow-sm")}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                          isPago ? "bg-emerald-50 text-emerald-600" : isAtrasado ? "bg-red-50 text-red-500" : "bg-yellow-50 text-yellow-600")}>
                          {isPago ? <CheckCircle className="w-5 h-5" /> : isAtrasado ? <AlertTriangle className="w-5 h-5" /> : <ClipboardList className="w-5 h-5" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {orc.itens.slice(0, 2).map((item, i) => (
                              <span key={i} className="text-xs font-medium text-[var(--color-text-secondary)]">{item.descricao}</span>
                            ))}
                            {orc.itens.length > 2 && <span className="text-[10px] text-[var(--color-text-muted)]">+{orc.itens.length - 2} itens</span>}
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-[10px] text-[var(--color-text-muted)]">{fmtDate(orc.created_at)}</span>
                            {orc.forma_pagamento && <span className="text-[10px] text-[var(--color-text-muted)]">{FORMAS.find(f => f.id === orc.forma_pagamento)?.label}</span>}
                            {orc.parcelas && orc.parcelas > 1 && <span className="text-[10px] text-[var(--color-text-muted)]">{orc.parcelas}x</span>}
                            {isAtrasado && <span className="text-[10px] font-bold text-red-600">{diasAtraso}d atraso</span>}
                            {parcial && <span className="text-[10px] font-bold text-blue-600">Parcial: {fmtMoney(orc.valor_pago!)}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <div className="text-right">
                          <p className={cn("text-sm font-bold", isPago ? "text-emerald-700" : isAtrasado ? "text-red-700" : "text-[var(--color-text-primary)]")}>{fmtMoney(orc.total)}</p>
                          <span className={cn("inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full",
                            isPago ? "bg-emerald-50 text-emerald-700" : isAtrasado ? "bg-red-50 text-red-700" : "bg-yellow-50 text-yellow-700")}>
                            {isPago ? 'Pago' : isAtrasado ? 'Vencido' : 'Pendente'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-[var(--color-border)] opacity-0 group-hover:opacity-100 transition-opacity">
                      {!isPago && (
                        <button onClick={() => { setShowPayModal(orc.id); setPayValor('') }}
                          className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold text-cyan-600 hover:bg-cyan-500/5 rounded-lg transition-colors">
                          <DollarSign className="w-3 h-3" /> Registrar Pagamento
                        </button>
                      )}
                      <button onClick={() => handleReciboPDF(orc)}
                        className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-card-hover)] rounded-lg transition-colors">
                        <Printer className="w-3 h-3" /> {isPago ? 'Recibo' : 'PDF'}
                      </button>
                      <button onClick={() => handleSendWhatsApp(orc)}
                        className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold text-cyan-500 hover:bg-cyan-500/5 rounded-lg transition-colors">
                        <Send className="w-3 h-3" /> WhatsApp
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="py-16 text-center flex flex-col items-center gap-3">
              <Wallet className="w-12 h-12 text-gray-100" />
              <p className="text-sm text-[var(--color-text-muted)] font-medium">Nenhum orçamento registrado</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Novo Orçamento */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowNewModal(false)} />
          <div className="relative bg-[var(--color-bg-card)] rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col animate-fade-in">
            <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-bg-deep)]/50 shrink-0">
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Novo Orçamento</h3>
              <button onClick={() => setShowNewModal(false)} className="p-2 hover:bg-[var(--color-bg-card-hover)] rounded-lg text-[var(--color-text-muted)]"><X className="w-4 h-4" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Itens */}
              <div>
                <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2 block">Itens do orçamento</label>
                <div className="space-y-2">
                  {newItens.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input value={item.descricao} onChange={e => { const n = [...newItens]; n[i].descricao = e.target.value; setNewItens(n) }}
                        placeholder="Ex: Limpeza, Restauração..." className="flex-1 bg-[var(--color-bg-deep)] border border-[var(--color-border)] rounded-lg py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-cyan-500/20" />
                      <input type="number" value={item.valor || ''} onChange={e => { const n = [...newItens]; n[i].valor = parseFloat(e.target.value) || 0; setNewItens(n) }}
                        placeholder="R$" className="w-24 bg-[var(--color-bg-deep)] border border-[var(--color-border)] rounded-lg py-2 px-3 text-sm text-right outline-none focus:ring-2 focus:ring-cyan-500/20" />
                      {newItens.length > 1 && (
                        <button onClick={() => setNewItens(prev => prev.filter((_, idx) => idx !== i))} className="p-1.5 text-[var(--color-text-muted)] hover:text-red-500 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                      )}
                    </div>
                  ))}
                </div>
                <button onClick={() => setNewItens(prev => [...prev, { descricao: '', valor: 0 }])}
                  className="flex items-center gap-1 mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700"><Plus className="w-3 h-3" /> Adicionar item</button>
              </div>

              {/* Desconto + Vencimento */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1 block">Desconto (R$)</label>
                  <input type="number" value={newDesconto || ''} onChange={e => setNewDesconto(parseFloat(e.target.value) || 0)}
                    placeholder="0,00" className="w-full bg-[var(--color-bg-deep)] border border-[var(--color-border)] rounded-lg py-2 px-3 text-sm outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1 block">Vencimento</label>
                  <input type="date" value={newVencimento} onChange={e => setNewVencimento(e.target.value)}
                    className="w-full bg-[var(--color-bg-deep)] border border-[var(--color-border)] rounded-lg py-2 px-3 text-sm outline-none" />
                </div>
              </div>

              {/* Resumo */}
              <div className="bg-[var(--color-bg-deep)] rounded-xl p-4 space-y-1 text-sm">
                <div className="flex justify-between text-[var(--color-text-muted)]"><span>Subtotal</span><span>{fmtMoney(subtotal)}</span></div>
                {newDesconto > 0 && <div className="flex justify-between text-red-500"><span>Desconto</span><span>-{fmtMoney(newDesconto)}</span></div>}
                <div className="flex justify-between font-bold text-[var(--color-text-primary)] text-base pt-1 border-t border-[var(--color-border)]"><span>Total</span><span>{fmtMoney(totalComDesconto)}</span></div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[var(--color-border)] flex justify-between shrink-0">
              <button onClick={() => setShowNewModal(false)} className="px-4 py-2 text-sm text-[var(--color-text-muted)]">Cancelar</button>
              <button onClick={handleCreate} disabled={saving}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Criar Orçamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pagamento */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowPayModal(null)} />
          <div className="relative bg-[var(--color-bg-card)] rounded-2xl shadow-2xl w-full max-w-sm animate-fade-in">
            <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
              <h3 className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-2"><CreditCard className="w-4 h-4 text-cyan-500" /> Registrar Pagamento</h3>
              <button onClick={() => setShowPayModal(null)} className="p-2 hover:bg-[var(--color-bg-card-hover)] rounded-lg text-[var(--color-text-muted)]"><X className="w-4 h-4" /></button>
            </div>

            <div className="p-6 space-y-4">
              {/* Forma */}
              <div>
                <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2 block">Forma de pagamento</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {FORMAS.map(f => (
                    <button key={f.id} onClick={() => setPayForma(f.id)}
                      className={cn("py-2 px-2 rounded-lg text-[10px] font-semibold border transition-all text-center",
                        payForma === f.id ? "bg-cyan-500/5 text-cyan-600 border-cyan-500/20" : "bg-[var(--color-bg-card)] text-[var(--color-text-muted)] border-[var(--color-border)]")}>
                      {f.icon} {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Parcelas */}
              {(payForma === 'credito') && (
                <div>
                  <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1 block">Parcelas</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 6, 10, 12].map(n => (
                      <button key={n} onClick={() => setPayParcelas(n)}
                        className={cn("flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-all",
                          payParcelas === n ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-[var(--color-bg-card)] text-[var(--color-text-muted)] border-[var(--color-border)]")}>
                        {n}x
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Valor (parcial) */}
              <div>
                <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1 block">
                  Valor do pagamento <span className="text-[var(--color-text-dim)]">(deixe vazio para pagar total)</span>
                </label>
                <input type="number" step="0.01" value={payValor} onChange={e => setPayValor(e.target.value)}
                  placeholder={`Total: ${fmtMoney(orcamentos.find(o => o.id === showPayModal)?.total || 0)}`}
                  className="w-full bg-[var(--color-bg-deep)] border border-[var(--color-border)] rounded-lg py-2 px-3 text-sm outline-none" />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[var(--color-border)] flex justify-between">
              <button onClick={() => setShowPayModal(null)} className="px-4 py-2 text-sm text-[var(--color-text-muted)]">Cancelar</button>
              <button onClick={handlePay} disabled={!!payingId}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50">
                {payingId ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />} Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
