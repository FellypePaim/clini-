import React, { useState, useEffect, useCallback } from 'react'
import {
  Smartphone,
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'

export function IntegracoesPage() {
  const { user } = useAuthStore()
  const clinicaId = user?.clinicaId

  const [whatsappStatus, setWhatsappStatus] = useState<'conectado' | 'desconectado' | 'carregando'>('carregando')
  const [whatsappNumero, setWhatsappNumero] = useState<string>('')

  const loadData = useCallback(async () => {
    if (!clinicaId) return

    try {
      const { data: instancias } = await supabase
        .from('whatsapp_instancias')
        .select('nome_instancia, ativo')
        .eq('clinica_id', clinicaId)
        .eq('ativo', true)
        .limit(1)

      if (instancias && instancias.length > 0) {
        setWhatsappStatus('conectado')
        setWhatsappNumero(instancias[0].nome_instancia || '')
      } else {
        setWhatsappStatus('desconectado')
      }
    } catch {
      setWhatsappStatus('desconectado')
    }
  }, [clinicaId])

  useEffect(() => { loadData() }, [loadData])

  return (
    <div className="space-y-6">
      {/* WhatsApp */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 flex items-start gap-6 group hover:border-indigo-200 hover:shadow-md transition-all">
        <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl shrink-0 group-hover:bg-emerald-100 transition-colors">
          <Smartphone size={32} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">WhatsApp & Agente OVYVA</h3>
            {whatsappStatus === 'carregando' ? (
              <Badge className="bg-slate-100 text-slate-500 font-bold border-none px-2.5 py-1">
                <Loader2 size={14} className="mr-1 inline-block animate-spin" /> Verificando...
              </Badge>
            ) : whatsappStatus === 'conectado' ? (
              <Badge className="bg-emerald-100 text-emerald-700 font-bold border-none px-2.5 py-1 tracking-widest">
                <Wifi size={14} className="mr-1 inline-block" /> Conectado
              </Badge>
            ) : (
              <Badge className="bg-red-100 text-red-600 font-bold border-none px-2.5 py-1 tracking-widest">
                <WifiOff size={14} className="mr-1 inline-block" /> Desconectado
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-500 font-medium mb-4">
            Conecte seu WhatsApp para que a assistente OVYVA atenda seus pacientes automaticamente — agende, cancele e reagende consultas via mensagens.
          </p>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Número Vinculado</span>
              <span className="text-base font-black text-slate-800">
                {whatsappStatus === 'conectado' ? (whatsappNumero || '—') : 'Não conectado'}
              </span>
            </div>
            {whatsappStatus === 'conectado' && (
              <div className="flex flex-col gap-1 items-end">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Status</span>
                <span className="text-sm font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 size={14} /> Ativo
                </span>
              </div>
            )}
            <a
              href="/ovyva"
              className="flex items-center gap-2 px-4 py-2 font-bold text-slate-600 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-colors"
            >
              <RefreshCw size={16} /> Gerenciar
            </a>
          </div>

          {whatsappStatus === 'desconectado' && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm text-amber-700">
                Seu WhatsApp não está conectado. Vá em <a href="/ovyva" className="font-bold underline">OVYVA</a> para conectar uma instância e ativar o atendimento automático.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
