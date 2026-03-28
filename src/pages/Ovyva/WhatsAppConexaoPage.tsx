import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Smartphone, Wifi, WifiOff, RefreshCw, Plus, Trash2,
  CheckCircle, Clock, AlertCircle, Loader2, QrCode, Phone
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { useToast } from '../../hooks/useToast'
import { cn } from '../../lib/utils'

type InstanciaStatus = 'disconnected' | 'qr_pending' | 'connecting' | 'connected' | 'error'

interface Instancia {
  id: string
  nome_instancia: string
  status: InstanciaStatus
  numero_conectado: string | null
  qr_code_base64: string | null
  webhook_configurado: boolean
  created_at: string
}

const STATUS_INFO: Record<InstanciaStatus, { label: string; color: string; icon: any }> = {
  connected:    { label: 'Conectado',       color: 'text-green-600 bg-green-50 border-green-200',  icon: CheckCircle },
  qr_pending:   { label: 'Aguardando Scan', color: 'text-amber-600 bg-amber-50 border-amber-200',  icon: QrCode },
  connecting:   { label: 'Conectando...',   color: 'text-blue-600 bg-blue-50 border-blue-200',    icon: Loader2 },
  disconnected: { label: 'Desconectado',    color: 'text-slate-500 bg-slate-50 border-slate-200', icon: WifiOff },
  error:        { label: 'Erro',            color: 'text-red-600 bg-red-50 border-red-200',       icon: AlertCircle },
}

async function callManager(action: string, payload: any = {}, token: string) {
  const resp = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-manager`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ action, payload }),
    }
  )
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: resp.statusText }))
    throw new Error(err.error ?? 'Erro desconhecido')
  }
  return resp.json()
}

export function WhatsAppConexaoPage() {
  const { user: _user } = useAuthStore()
  const { toast } = useToast()
  const [instancias, setInstancias] = useState<Instancia[]>([])
  const [loading, setLoading] = useState(true)
  const [criando, setCriando] = useState(false)
  const [pollingId, setPollingId] = useState<string | null>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const getToken = async () => {
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token ?? ''
  }

  const loadInstancias = useCallback(async () => {
    const token = await getToken()
    try {
      const { instancias: data } = await callManager('listar', {}, token)
      setInstancias(data ?? [])
    } catch (err: any) {
      console.error('Erro ao listar instâncias:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadInstancias() }, [loadInstancias])

  // Polling de status para instâncias aguardando conexão
  useEffect(() => {
    if (!pollingId) {
      if (pollingRef.current) clearInterval(pollingRef.current)
      return
    }
    pollingRef.current = setInterval(async () => {
      const token = await getToken()
      try {
        const { status, numero_conectado } = await callManager('verificar_status', { instancia_id: pollingId }, token)
        setInstancias(prev => prev.map(i =>
          i.id === pollingId ? { ...i, status, numero_conectado } : i
        ))
        if (status === 'connected') {
          setPollingId(null)
          toast({ title: '✅ WhatsApp Conectado!', description: `Número ${numero_conectado} vinculado com sucesso.`, type: 'success' })
        }
      } catch { /* ignored */ }
    }, 4000)
    return () => { if (pollingRef.current) clearInterval(pollingRef.current) }
  }, [pollingId, toast])

  const handleCriar = async () => {
    setCriando(true)
    try {
      const token = await getToken()
      const { instancia, qr_code } = await callManager('criar_instancia', {}, token)
      if (instancia) {
        setInstancias(prev => [{ ...instancia, qr_code_base64: qr_code }, ...prev])
        if (instancia.status === 'qr_pending') {
          setPollingId(instancia.id)
          toast({ title: 'QR Code gerado!', description: 'Abra o WhatsApp e escaneie o código para conectar.', type: 'success' })
        }
      }
    } catch (err: any) {
      toast({ title: 'Erro ao criar instância', description: err.message, type: 'error' })
    } finally {
      setCriando(false)
    }
  }

  const handleRefreshQR = async (instancia: Instancia) => {
    const token = await getToken()
    try {
      const { qr_code } = await callManager('obter_qrcode', { instancia_id: instancia.id }, token)
      setInstancias(prev => prev.map(i => i.id === instancia.id ? { ...i, qr_code_base64: qr_code } : i))
      setPollingId(instancia.id)
    } catch (err: any) {
      toast({ title: 'Erro ao atualizar QR', description: err.message, type: 'error' })
    }
  }

  const handleDesconectar = async (instancia: Instancia) => {
    if (!confirm(`Desconectar a instância "${instancia.nome_instancia}"?`)) return
    const token = await getToken()
    try {
      await callManager('desconectar', { instancia_id: instancia.id }, token)
      setInstancias(prev => prev.map(i => i.id === instancia.id ? { ...i, status: 'disconnected', numero_conectado: null } : i))
      toast({ title: 'Desconectado', description: 'Instância desconectada com sucesso.', type: 'success' })
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, type: 'error' })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-[0.2em]">Conexões WhatsApp</h2>
          <p className="text-[11px] text-gray-400 mt-0.5 font-bold tracking-wide">
            Cada clínica pode ter uma instância WhatsApp dedicada para a IA OVYVA
          </p>
        </div>
        <button
          onClick={handleCriar}
          disabled={criando}
          className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-green-500/20 transition-all active:scale-95 disabled:opacity-50"
        >
          {criando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {criando ? 'Criando...' : 'Nova Conexão'}
        </button>
      </div>

      {/* Info Box */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-5 flex gap-4">
        <Smartphone className="w-10 h-10 text-green-600 shrink-0 mt-1" />
        <div>
          <p className="text-xs font-black text-green-800 uppercase tracking-widest">Como funciona</p>
          <ol className="text-[11px] text-green-700 mt-2 space-y-1 list-decimal list-inside leading-relaxed">
            <li>Clique em <strong>Nova Conexão</strong> para criar uma instância WhatsApp dedicada</li>
            <li>Escaneie o <strong>QR Code</strong> com o WhatsApp do número da clínica</li>
            <li>Pronto! A IA OVYVA começa a responder automaticamente usando as configurações desta clínica</li>
          </ol>
        </div>
      </div>

      {/* Lista de Instâncias */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-6 h-6 animate-spin text-green-500" />
        </div>
      ) : instancias.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
          <Smartphone className="w-12 h-12 mb-4 text-gray-200" />
          <p className="text-sm font-bold">Nenhuma conexão configurada</p>
          <p className="text-xs text-gray-300 mt-1">Clique em "Nova Conexão" para começar</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {instancias.map(inst => {
            const statusInfo = STATUS_INFO[inst.status] ?? STATUS_INFO.disconnected
            const StatusIcon = statusInfo.icon
            const isPending = inst.status === 'qr_pending' || inst.status === 'connecting'
            const isConnected = inst.status === 'connected'
            const isPolling = pollingId === inst.id

            return (
              <div key={inst.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Header da instância */}
                <div className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', isConnected ? 'bg-green-50' : 'bg-gray-50')}>
                      <Smartphone className={cn('w-6 h-6', isConnected ? 'text-green-600' : 'text-gray-400')} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-gray-900 uppercase tracking-widest">{inst.nome_instancia}</p>
                      {inst.numero_conectado && (
                        <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1">
                          <Phone className="w-3 h-3" /> +{inst.numero_conectado}
                        </p>
                      )}
                      <p className="text-[10px] text-gray-300 mt-0.5">
                        Criado em {new Date(inst.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={cn('inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border', statusInfo.color)}>
                      <StatusIcon className={cn('w-3.5 h-3.5', inst.status === 'connecting' && 'animate-spin')} />
                      {statusInfo.label}
                      {isPolling && inst.status !== 'connected' && (
                        <span className="text-[8px] animate-pulse">verificando...</span>
                      )}
                    </span>

                    {isPending && (
                      <button
                        onClick={() => handleRefreshQR(inst)}
                        className="p-2.5 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-amber-500 transition-all"
                        title="Atualizar QR Code"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    )}

                    {(isConnected || inst.status === 'disconnected') && (
                      <button
                        onClick={() => handleDesconectar(inst)}
                        className="p-2.5 hover:bg-red-50 rounded-xl text-gray-300 hover:text-red-500 transition-all"
                        title="Desconectar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* QR Code */}
                {isPending && inst.qr_code_base64 && (
                  <div className="border-t border-dashed border-gray-100 p-6 flex flex-col items-center gap-4 bg-amber-50/40">
                    <p className="text-xs font-black text-amber-700 uppercase tracking-widest">
                      📱 Abra o WhatsApp → Dispositivos Conectados → Escanear QR Code
                    </p>
                    <div className="p-4 bg-white rounded-2xl shadow-lg shadow-amber-100/50 border border-amber-100">
                      <img
                        src={`data:image/png;base64,${inst.qr_code_base64.replace(/^data:image\/\w+;base64,/, '')}`}
                        alt="QR Code WhatsApp"
                        className="w-56 h-56 object-contain"
                        onError={(e) => {
                          // Tentar com URL pura se base64 falhar
                          const target = e.target as HTMLImageElement
                          if (!inst.qr_code_base64?.startsWith('data:')) {
                            target.src = inst.qr_code_base64!
                          }
                        }}
                      />
                    </div>
                    <p className="text-[10px] text-amber-600 animate-pulse flex items-center gap-1.5">
                      <Clock className="w-3 h-3" /> Aguardando escaneamento...
                    </p>
                  </div>
                )}

                {/* Conectado - Info */}
                {isConnected && (
                  <div className="border-t border-green-100 px-6 py-4 bg-green-50/30 flex items-center gap-3">
                    <Wifi className="w-4 h-4 text-green-600" />
                    <p className="text-xs text-green-700 font-bold">
                      IA OVYVA ativa neste número · Webhook configurado ✓
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
