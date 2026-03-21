import React, { useState, useEffect, useCallback } from 'react'
import { Bell, Mail, Smartphone, Zap, Loader2, Save } from 'lucide-react'
import { useToast } from '../../hooks/useToast'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'

interface NotifConfig {
  whatsapp_confirmacao: boolean
  whatsapp_lembrete: boolean
  whatsapp_aniversario: boolean
  whatsapp_cobranca: boolean
  sistema_novo_lead: boolean
  sistema_checkin: boolean
  sistema_estoque_baixo: boolean
  smtp_host: string
  smtp_porta: string
  smtp_usuario: string
  smtp_senha: string
}

const defaultConfig: NotifConfig = {
  whatsapp_confirmacao: true,
  whatsapp_lembrete: true,
  whatsapp_aniversario: false,
  whatsapp_cobranca: true,
  sistema_novo_lead: true,
  sistema_checkin: false,
  sistema_estoque_baixo: true,
  smtp_host: '',
  smtp_porta: '587',
  smtp_usuario: '',
  smtp_senha: '',
}

export function NotificacoesPage() {
  const { toast } = useToast()
  const { user } = useAuthStore()
  const clinicaId = user?.clinicaId

  const [config, setConfig] = useState<NotifConfig>(defaultConfig)
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingSmtp, setIsSavingSmtp] = useState(false)

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

  const saveToggle = async (key: keyof NotifConfig, value: boolean) => {
    if (!clinicaId) return
    const newConfig = { ...config, [key]: value }
    setConfig(newConfig)

    const { error } = await supabase.rpc('update_clinica_config' as any, {
      p_clinica_id: clinicaId,
      p_path: 'notificacoes',
      p_value: newConfig,
    } as any).then((res: any) => res, () => ({ error: null }))

    // Fallback: update direto no campo configuracoes
    if (error) {
      const { data: current } = await supabase
        .from('clinicas').select('configuracoes').eq('id', clinicaId).single()
      const merged = { ...((current?.configuracoes as any) || {}), notificacoes: newConfig }
      await supabase.from('clinicas').update({ configuracoes: merged }).eq('id', clinicaId)
    }

    toast({ title: 'Salvo', description: 'Configuração atualizada.', type: 'success' })
  }

  const saveSmtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clinicaId) return
    setIsSavingSmtp(true)
    const { data: current } = await supabase
      .from('clinicas').select('configuracoes').eq('id', clinicaId).single()
    const smtpData = {
      host: config.smtp_host,
      porta: config.smtp_porta,
      usuario: config.smtp_usuario,
      senha: config.smtp_senha,
    }
    const merged = { ...((current?.configuracoes as any) || {}), smtp: smtpData }
    const { error } = await supabase.from('clinicas').update({ configuracoes: merged }).eq('id', clinicaId)
    setIsSavingSmtp(false)
    if (error) {
      toast({ title: 'Erro', description: error.message, type: 'error' })
    } else {
      toast({ title: 'SMTP Salvo', description: 'Configurações de e-mail atualizadas.', type: 'success' })
    }
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
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Bell className="text-indigo-600" />
            Régua de Comunicação e Notificações
          </h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Configure quais eventos acionam alertas via WhatsApp, Push Web e e-mails na clínica.</p>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* WhatsApp Channel */}
        <div>
          <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
            <Smartphone size={18} className="text-emerald-500" /> Alertas Via WhatsApp (Pacientes)
          </h3>
          <div className="space-y-4 max-w-2xl">
            <ToggleRow label="Confirmação de Agendamento (Novo e Reagendamento)" value={config.whatsapp_confirmacao}
              onChange={v => saveToggle('whatsapp_confirmacao', v)} />
            <ToggleRow label="Lembrete Automático 24 horas antes" value={config.whatsapp_lembrete}
              onChange={v => saveToggle('whatsapp_lembrete', v)} />
            <ToggleRow label="Mensagem de Feliz Aniversário do Paciente" value={config.whatsapp_aniversario}
              onChange={v => saveToggle('whatsapp_aniversario', v)} />
            <ToggleRow label="Cobrança/Boleto perto do Vencimento" value={config.whatsapp_cobranca}
              onChange={v => saveToggle('whatsapp_cobranca', v)} />
          </div>
        </div>

        {/* Sistema (Equipe) */}
        <div className="pt-2">
          <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
            <Zap size={18} className="text-amber-500" /> Alertas de Sistema Web (Administradores/Recepção)
          </h3>
          <div className="space-y-4 max-w-2xl">
            <ToggleRow label="Aviso: Novo Lead entrou no Funil (Verdesk)" value={config.sistema_novo_lead}
              onChange={v => saveToggle('sistema_novo_lead', v)} />
            <ToggleRow label="Aviso: Paciente Chegou / Check-in na Recepção" value={config.sistema_checkin}
              onChange={v => saveToggle('sistema_checkin', v)} />
            <ToggleRow label="Aviso: Estoque de Insumos abaixo do Mínimo" value={config.sistema_estoque_baixo}
              onChange={v => saveToggle('sistema_estoque_baixo', v)} />
          </div>
        </div>

        {/* SMTP */}
        <div className="pt-2">
          <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
            <Mail size={18} className="text-slate-500" /> Servidor de E-mail Interno (SMTP / SES)
          </h3>
          <form onSubmit={saveSmtp}>
            <div className="grid grid-cols-2 gap-6 max-w-3xl bg-slate-50 p-6 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Host SMTP</label>
                <input type="text" value={config.smtp_host} placeholder="smtp.seudominio.com"
                  onChange={e => setConfig(c => ({ ...c, smtp_host: e.target.value }))}
                  className="w-full p-2.5 text-sm font-mono border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Porta (TLS/SSL)</label>
                <input type="text" value={config.smtp_porta} placeholder="587"
                  onChange={e => setConfig(c => ({ ...c, smtp_porta: e.target.value }))}
                  className="w-full p-2.5 text-sm font-mono border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Usuário / Access Key</label>
                <input type="text" value={config.smtp_usuario} placeholder="usuario@exemplo.com"
                  onChange={e => setConfig(c => ({ ...c, smtp_usuario: e.target.value }))}
                  className="w-full p-2.5 text-sm font-mono border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Senha Privada</label>
                <input type="password" value={config.smtp_senha} placeholder="••••••••"
                  onChange={e => setConfig(c => ({ ...c, smtp_senha: e.target.value }))}
                  className="w-full p-2.5 text-sm font-mono border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
            <button type="submit" disabled={isSavingSmtp}
              className="mt-4 flex items-center gap-2 px-5 py-2.5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-colors disabled:opacity-50">
              {isSavingSmtp ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Salvar Configurações SMTP
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-indigo-300 transition-colors cursor-pointer group"
      onClick={() => onChange(!value)}>
      <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-700 transition-colors">{label}</span>
      <button type="button" className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${value ? 'bg-emerald-500' : 'bg-slate-300'}`}>
        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out ${value ? 'translate-x-6' : 'translate-x-0'}`} />
      </button>
    </div>
  )
}
