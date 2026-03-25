import React, { useState, useEffect, useCallback } from 'react'
import { Bell, Smartphone, Zap, Loader2, Clock, CheckCircle2 } from 'lucide-react'
import { useToast } from '../../hooks/useToast'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'

interface NotifConfig {
  // WhatsApp → Pacientes
  whatsapp_confirmacao: boolean
  whatsapp_lembrete: boolean
  whatsapp_lembrete_horas: number
  whatsapp_pos_consulta: boolean
  whatsapp_aniversario: boolean
  whatsapp_cobranca: boolean
  // Sistema → Equipe
  sistema_novo_lead: boolean
  sistema_checkin: boolean
  sistema_estoque_baixo: boolean
  sistema_consulta_pendente: boolean
}

const defaultConfig: NotifConfig = {
  whatsapp_confirmacao: true,
  whatsapp_lembrete: true,
  whatsapp_lembrete_horas: 24,
  whatsapp_pos_consulta: false,
  whatsapp_aniversario: false,
  whatsapp_cobranca: false,
  sistema_novo_lead: true,
  sistema_checkin: false,
  sistema_estoque_baixo: true,
  sistema_consulta_pendente: true,
}

export function NotificacoesPage() {
  const { toast } = useToast()
  const { user } = useAuthStore()
  const clinicaId = user?.clinicaId

  const [config, setConfig] = useState<NotifConfig>(defaultConfig)
  const [isLoading, setIsLoading] = useState(true)
  const [lastSaved, setLastSaved] = useState<number | null>(null)

  const loadConfig = useCallback(async () => {
    if (!clinicaId) return
    setIsLoading(true)
    const { data } = await supabase
      .from('clinicas')
      .select('configuracoes')
      .eq('id', clinicaId)
      .single()

    if ((data?.configuracoes as any)?.notificacoes) {
      setConfig(prev => ({ ...prev, ...(data!.configuracoes as any).notificacoes }))
    }
    setIsLoading(false)
  }, [clinicaId])

  useEffect(() => { loadConfig() }, [loadConfig])

  const saveConfig = async (newConfig: NotifConfig) => {
    if (!clinicaId) return
    setConfig(newConfig)

    const { data: current } = await supabase
      .from('clinicas').select('configuracoes').eq('id', clinicaId).single()
    const merged = { ...((current?.configuracoes as any) || {}), notificacoes: newConfig }
    const { error } = await supabase.from('clinicas').update({ configuracoes: merged }).eq('id', clinicaId)

    if (error) {
      toast({ title: 'Erro', description: error.message, type: 'error' })
    } else {
      setLastSaved(Date.now())
    }
  }

  const toggle = (key: keyof NotifConfig) => {
    const newConfig = { ...config, [key]: !config[key] }
    saveConfig(newConfig)
  }

  const setHoras = (value: number) => {
    const newConfig = { ...config, whatsapp_lembrete_horas: value }
    saveConfig(newConfig)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Bell className="text-indigo-600" />
          Notificações e Comunicação
        </h2>
        <div className="flex items-center gap-3 mt-1">
          <p className="text-sm font-medium text-slate-500">Configure quais mensagens automáticas a OVYVA envia e quais alertas a equipe recebe.</p>
          {lastSaved && (Date.now() - lastSaved) < 3000 && (
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 animate-fade-in">
              <CheckCircle2 size={12} /> Salvo
            </span>
          )}
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* WhatsApp → Pacientes */}
        <div>
          <h3 className="text-base font-bold text-slate-800 mb-1 flex items-center gap-2">
            <Smartphone size={18} className="text-emerald-500" /> WhatsApp Automático (Pacientes)
          </h3>
          <p className="text-xs text-slate-400 mb-4">Mensagens enviadas automaticamente pela OVYVA via WhatsApp para os pacientes.</p>

          <div className="space-y-3 max-w-2xl">
            <ToggleRow
              label="Confirmação de agendamento"
              description="Envia mensagem quando uma consulta é agendada ou reagendada"
              value={config.whatsapp_confirmacao}
              onChange={() => toggle('whatsapp_confirmacao')}
            />
            <ToggleRow
              label="Lembrete antes da consulta"
              description="Envia lembrete automático antes do horário agendado"
              value={config.whatsapp_lembrete}
              onChange={() => toggle('whatsapp_lembrete')}
            />

            {/* Timing do lembrete */}
            {config.whatsapp_lembrete && (
              <div className="ml-4 pl-4 border-l-2 border-emerald-200">
                <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl">
                  <Clock size={16} className="text-emerald-600 shrink-0" />
                  <span className="text-sm font-medium text-slate-700">Enviar</span>
                  <select
                    value={config.whatsapp_lembrete_horas}
                    onChange={e => setHoras(Number(e.target.value))}
                    className="px-3 py-1.5 text-sm font-bold border border-emerald-200 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value={2}>2 horas</option>
                    <option value={6}>6 horas</option>
                    <option value={12}>12 horas</option>
                    <option value={24}>24 horas</option>
                    <option value={48}>48 horas</option>
                  </select>
                  <span className="text-sm font-medium text-slate-700">antes da consulta</span>
                </div>
              </div>
            )}

            <ToggleRow
              label="Pós-consulta (satisfação)"
              description="Envia pesquisa de satisfação após o atendimento ser concluído"
              value={config.whatsapp_pos_consulta}
              onChange={() => toggle('whatsapp_pos_consulta')}
            />
            <ToggleRow
              label="Feliz aniversário"
              description="Envia mensagem de parabéns na data de nascimento do paciente"
              value={config.whatsapp_aniversario}
              onChange={() => toggle('whatsapp_aniversario')}
            />
            <ToggleRow
              label="Cobrança / boleto"
              description="Envia lembrete quando há valores pendentes próximos do vencimento"
              value={config.whatsapp_cobranca}
              onChange={() => toggle('whatsapp_cobranca')}
            />
          </div>
        </div>

        {/* Sistema → Equipe */}
        <div className="pt-2">
          <h3 className="text-base font-bold text-slate-800 mb-1 flex items-center gap-2">
            <Zap size={18} className="text-amber-500" /> Alertas do Sistema (Equipe)
          </h3>
          <p className="text-xs text-slate-400 mb-4">Notificações visíveis no painel para administradores e recepcionistas.</p>

          <div className="space-y-3 max-w-2xl">
            <ToggleRow
              label="Novo lead no funil"
              description="Alerta quando um novo contato entra pelo WhatsApp ou formulário"
              value={config.sistema_novo_lead}
              onChange={() => toggle('sistema_novo_lead')}
            />
            <ToggleRow
              label="Consulta pendente de aprovação"
              description="Alerta quando a OVYVA cria um pré-agendamento que precisa de confirmação"
              value={config.sistema_consulta_pendente}
              onChange={() => toggle('sistema_consulta_pendente')}
            />
            <ToggleRow
              label="Check-in do paciente"
              description="Alerta quando o paciente faz check-in na recepção"
              value={config.sistema_checkin}
              onChange={() => toggle('sistema_checkin')}
            />
            <ToggleRow
              label="Estoque abaixo do mínimo"
              description="Alerta quando um produto atinge o nível mínimo configurado"
              value={config.sistema_estoque_baixo}
              onChange={() => toggle('sistema_estoque_baixo')}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function ToggleRow({ label, description, value, onChange }: {
  label: string
  description: string
  value: boolean
  onChange: () => void
}) {
  return (
    <div
      className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-indigo-300 transition-colors cursor-pointer group"
      onClick={onChange}
    >
      <div className="flex-1 mr-4">
        <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-700 transition-colors">{label}</span>
        <p className="text-xs text-slate-400 mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out shrink-0 ${value ? 'bg-emerald-500' : 'bg-slate-300'}`}
      >
        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out ${value ? 'translate-x-6' : 'translate-x-0'}`} />
      </button>
    </div>
  )
}
