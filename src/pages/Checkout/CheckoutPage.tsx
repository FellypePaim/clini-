import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  CreditCard, QrCode, FileText, Loader2, CheckCircle2, XCircle,
  Copy, ExternalLink, ArrowLeft, Shield, Clock,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'

const PLAN_PRICES: Record<string, number> = { starter: 97, professional: 197, clinic: 397, enterprise: 797 }
const PLAN_NAMES: Record<string, string> = { starter: 'Starter', professional: 'Professional', clinic: 'Clinic', enterprise: 'Enterprise' }

type Metodo = 'pix' | 'boleto' | 'cartao'
type Status = 'idle' | 'loading' | 'pix_pending' | 'boleto_pending' | 'paid' | 'refused'

export function CheckoutPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const plano = params.get('plano') || 'professional'
  const valor = PLAN_PRICES[plano] || 197

  const [metodo, setMetodo] = useState<Metodo>('pix')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  // PIX data
  const [pixQrCode, setPixQrCode] = useState('')
  const [pixPayload, setPixPayload] = useState('')
  const [pixExpire, setPixExpire] = useState('')
  const [orderUUID, setOrderUUID] = useState('')

  // Boleto data
  const [boletoUrl, setBoletoUrl] = useState('')
  const [boletoBarcode, setBoletoBarcode] = useState('')

  // Document (CPF/CNPJ)
  const [documento, setDocumento] = useState('')

  // Card form
  const [card, setCard] = useState({ number: '', holder: '', expirationDate: '', cvv: '', installments: 1 })

  // Polling for PIX confirmation
  useEffect(() => {
    if (status !== 'pix_pending' || !orderUUID) return
    const interval = setInterval(async () => {
      try {
        const { data } = await supabase.functions.invoke('payment-charge', {
          body: { action: 'check_pix', orderUUID },
        })
        if (data?.payment?.status === 'paid' || data?.status === 'paid') {
          setStatus('paid')
          clearInterval(interval)
        }
      } catch {}
    }, 5000)
    return () => clearInterval(interval)
  }, [status, orderUUID])

  async function handlePay() {
    setStatus('loading')
    setErrorMsg('')

    try {
      const body: any = { action: 'create_charge', plano, metodo, documento: documento.replace(/\D/g, '') }
      if (metodo === 'cartao') body.card = card

      const { data, error } = await supabase.functions.invoke('payment-charge', { body })

      if (error) {
        // Tentar extrair mensagem real do body da resposta de erro
        let msg = error.message || 'Erro ao processar pagamento'
        try {
          if (error.context && typeof error.context.json === 'function') {
            const errBody = await error.context.json()
            if (errBody?.error) msg = errBody.error
          }
        } catch {}
        console.error('Payment error:', msg)
        setErrorMsg(msg)
        setStatus('refused')
        return
      }
      if (data?.error) {
        setErrorMsg(data.error)
        setStatus('refused')
        return
      }

      if (metodo === 'pix') {
        setPixQrCode(data.pix?.qrcode || '')
        setPixPayload(data.pix?.payload || '')
        setPixExpire(data.pix?.expireAt || '')
        setOrderUUID(data.orderUUID)
        setStatus('pix_pending')
      } else if (metodo === 'boleto') {
        setBoletoUrl(data.boleto?.url || '')
        setBoletoBarcode(data.boleto?.barcode || '')
        setStatus('boleto_pending')
      } else if (metodo === 'cartao') {
        if (data.status === 'paid') {
          setStatus('paid')
        } else {
          setErrorMsg(data.message || 'Pagamento recusado')
          setStatus('refused')
        }
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Erro inesperado')
      setStatus('refused')
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
  }

  // ── Success screen ──
  if (status === 'paid') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--color-bg-deep)' }}>
        <div className="max-w-md w-full text-center p-8 rounded-2xl border border-emerald-500/30" style={{ background: 'var(--color-bg-card)' }}>
          <CheckCircle2 size={64} className="text-emerald-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">Pagamento Confirmado!</h1>
          <p className="text-[var(--color-text-muted)] mb-6">
            Seu plano <strong>{PLAN_NAMES[plano]}</strong> esta ativo. Aproveite todos os recursos!
          </p>
          <button onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors">
            Ir para o Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: 'var(--color-bg-deep)' }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] mb-6 transition-colors">
          <ArrowLeft size={16} /> Voltar
        </button>

        <div className="rounded-2xl border border-[var(--color-border)] overflow-hidden" style={{ background: 'var(--color-bg-card)' }}>
          {/* Plan summary */}
          <div className="p-6 border-b border-[var(--color-border)]" style={{ background: 'var(--color-bg-deep)' }}>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Assinar Plano {PLAN_NAMES[plano]}</h1>
                <p className="text-sm text-[var(--color-text-muted)] mt-1">Cobranca mensal • Cancele quando quiser</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-cyan-500">R$ {valor}</p>
                <p className="text-xs text-[var(--color-text-muted)]">/mes</p>
              </div>
            </div>
          </div>

          {/* Payment method selector */}
          <div className="p-6 space-y-6">
            {/* CPF/CNPJ */}
            <div>
              <label className="block text-sm font-semibold text-[var(--color-text-secondary)] mb-1.5">CPF ou CNPJ *</label>
              <input type="text" value={documento} onChange={(e) => setDocumento(e.target.value)}
                placeholder="000.000.000-00 ou 00.000.000/0000-00" maxLength={18}
                className="w-full px-4 py-2.5 border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 placeholder:text-[var(--color-text-muted)]"
                style={{ background: 'var(--color-bg-deep)' }} />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--color-text-secondary)] mb-3">Forma de pagamento</label>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { id: 'pix' as Metodo, icon: QrCode, label: 'PIX', desc: 'Aprovacao instantanea' },
                  { id: 'cartao' as Metodo, icon: CreditCard, label: 'Cartao', desc: 'Recorrencia automatica' },
                  { id: 'boleto' as Metodo, icon: FileText, label: 'Boleto', desc: 'Vencimento em 3 dias' },
                ]).map(({ id, icon: Icon, label, desc }) => (
                  <button key={id} onClick={() => { setMetodo(id); setStatus('idle'); setErrorMsg('') }}
                    className={cn('flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                      metodo === id ? 'border-cyan-500 bg-cyan-500/5' : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)]')}>
                    <Icon size={24} className={metodo === id ? 'text-cyan-500' : 'text-[var(--color-text-muted)]'} />
                    <span className={cn('text-sm font-semibold', metodo === id ? 'text-cyan-500' : 'text-[var(--color-text-primary)]')}>{label}</span>
                    <span className="text-[10px] text-[var(--color-text-muted)]">{desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Card form */}
            {metodo === 'cartao' && status === 'idle' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Numero do cartao</label>
                  <input type="text" value={card.number} onChange={(e) => setCard(c => ({ ...c, number: e.target.value.replace(/\D/g, '') }))}
                    placeholder="0000 0000 0000 0000" maxLength={16}
                    className="w-full px-4 py-2.5 border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 placeholder:text-[var(--color-text-muted)]"
                    style={{ background: 'var(--color-bg-deep)' }} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Nome no cartao</label>
                  <input type="text" value={card.holder} onChange={(e) => setCard(c => ({ ...c, holder: e.target.value }))}
                    placeholder="NOME COMPLETO" className="w-full px-4 py-2.5 border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 placeholder:text-[var(--color-text-muted)]"
                    style={{ background: 'var(--color-bg-deep)' }} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Validade</label>
                    <input type="text" value={card.expirationDate} onChange={(e) => setCard(c => ({ ...c, expirationDate: e.target.value }))}
                      placeholder="MM/AAAA" maxLength={7} className="w-full px-4 py-2.5 border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 placeholder:text-[var(--color-text-muted)]"
                      style={{ background: 'var(--color-bg-deep)' }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">CVV</label>
                    <input type="text" value={card.cvv} onChange={(e) => setCard(c => ({ ...c, cvv: e.target.value.replace(/\D/g, '') }))}
                      placeholder="000" maxLength={4} className="w-full px-4 py-2.5 border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 placeholder:text-[var(--color-text-muted)]"
                      style={{ background: 'var(--color-bg-deep)' }} />
                  </div>
                </div>
              </div>
            )}

            {/* PIX pending */}
            {status === 'pix_pending' && (
              <div className="text-center space-y-4 py-4">
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">Escaneie o QR Code ou copie o codigo PIX</p>
                {pixQrCode && (
                  <div className="flex justify-center">
                    <img src={`data:image/png;base64,${pixQrCode}`} alt="QR Code PIX" className="w-48 h-48 rounded-xl border border-[var(--color-border)]" />
                  </div>
                )}
                {pixPayload && (
                  <button onClick={() => copyToClipboard(pixPayload)}
                    className="flex items-center gap-2 mx-auto px-4 py-2 text-sm font-medium text-cyan-500 hover:bg-cyan-500/10 rounded-xl transition-colors">
                    <Copy size={14} /> Copiar codigo PIX
                  </button>
                )}
                <div className="flex items-center justify-center gap-2 text-[var(--color-text-muted)]">
                  <Loader2 size={14} className="animate-spin" />
                  <span className="text-xs">Aguardando confirmacao do pagamento...</span>
                </div>
                {pixExpire && <p className="text-[11px] text-[var(--color-text-dim)]">Expira em: {pixExpire}</p>}
              </div>
            )}

            {/* Boleto pending */}
            {status === 'boleto_pending' && (
              <div className="text-center space-y-4 py-4">
                <CheckCircle2 size={40} className="text-amber-500 mx-auto" />
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">Boleto gerado com sucesso!</p>
                {boletoBarcode && (
                  <div className="px-4">
                    <p className="text-xs text-[var(--color-text-muted)] mb-2">Codigo de barras:</p>
                    <div className="flex items-center gap-2 p-3 rounded-xl border border-[var(--color-border)]" style={{ background: 'var(--color-bg-deep)' }}>
                      <code className="flex-1 text-xs text-[var(--color-text-primary)] break-all">{boletoBarcode}</code>
                      <button onClick={() => copyToClipboard(boletoBarcode)} className="text-cyan-500 shrink-0"><Copy size={14} /></button>
                    </div>
                  </div>
                )}
                {boletoUrl && (
                  <a href={boletoUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-cyan-500 hover:bg-cyan-500/10 rounded-xl transition-colors">
                    <ExternalLink size={14} /> Abrir boleto
                  </a>
                )}
                <p className="text-[11px] text-[var(--color-text-dim)]">O plano sera ativado apos a confirmacao do pagamento (ate 3 dias uteis).</p>
              </div>
            )}

            {/* Error */}
            {status === 'refused' && (
              <div className="text-center space-y-3 py-4">
                <XCircle size={40} className="text-red-500 mx-auto" />
                <p className="text-sm font-semibold text-red-400">{errorMsg || 'Pagamento recusado'}</p>
                <button onClick={() => { setStatus('idle'); setErrorMsg('') }}
                  className="text-sm text-cyan-500 hover:underline">Tentar novamente</button>
              </div>
            )}

            {/* Pay button */}
            {status === 'idle' && (
              <button onClick={handlePay}
                disabled={!documento.replace(/\D/g, '') || (metodo === 'cartao' && (!card.number || !card.holder || !card.cvv))}
                className={cn('w-full flex items-center justify-center gap-2 py-3.5 text-sm font-bold rounded-xl transition-colors',
                  'bg-cyan-600 hover:bg-cyan-700 text-white disabled:bg-[var(--color-bg-card-hover)] disabled:text-[var(--color-text-dim)] disabled:cursor-not-allowed')}>
                <Shield size={16} /> Pagar R$ {valor},00
              </button>
            )}

            {status === 'loading' && (
              <div className="flex items-center justify-center py-4">
                <Loader2 size={24} className="animate-spin text-cyan-500" />
                <span className="ml-2 text-sm text-[var(--color-text-muted)]">Processando pagamento...</span>
              </div>
            )}

            {/* Security footer */}
            <div className="flex items-center justify-center gap-2 pt-2 text-[var(--color-text-dim)]">
              <Shield size={12} />
              <span className="text-[10px]">Pagamento seguro via HooPay • Dados criptografados</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
