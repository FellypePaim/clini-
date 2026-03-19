import React, { useState } from 'react'
import { Bell, Mail, Smartphone, Zap } from 'lucide-react'
import { useToast } from '../../hooks/useToast'

export function NotificacoesPage() {
  const { toast } = useToast()

  const handleToggle = (setting: string) => {
    toast({ title: 'Configuração alterada', description: `Sino de eventos atualizado para "${setting}".`, type: 'info' })
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div>
           <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
             <Bell className="text-indigo-600" />
             Régua de Comunicação e Notificações
           </h2>
           <p className="text-sm font-medium text-slate-500 mt-1">Configure quais eventos acionam Webhooks nativos, alertas Push Web e e-mails na clínica.</p>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* Pacientes Channel */}
        <div>
          <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
             <Smartphone size={18} className="text-emerald-500" /> Alertas Via WhatsApp (Pacientes) 
          </h3>
          <div className="space-y-4 max-w-2xl">
            <ToggleRow label="Confirmação de Agendamento (Novo e Reagendamento)" defaultOn onChange={() => handleToggle('Conf. Agenda')} />
            <ToggleRow label="Lembrete Automático 24 horas antes" defaultOn onChange={() => handleToggle('Lembrete Automático')} />
            <ToggleRow label="Mensagem de Feliz Aniversário do Paciente" defaultOn={false} onChange={() => handleToggle('Aniversário')} />
            <ToggleRow label="Cobrança/Boleto perto do Vencimento" defaultOn onChange={() => handleToggle('Régua Cobrança')} />
          </div>
        </div>

        {/* Sistema (Equipe) */}
        <div className="pt-2">
          <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
             <Zap size={18} className="text-amber-500" /> Alertas de Sistema Web (Administradores/Recepção) 
          </h3>
          <div className="space-y-4 max-w-2xl">
            <ToggleRow label="Aviso: Novo Lead entrou no Funil (Verdesk)" defaultOn onChange={() => handleToggle('Novo Lead CRM')} />
            <ToggleRow label="Aviso: Paciente Chegou / Check-in na Recepção" defaultOn={false} onChange={() => handleToggle('Prontidão Doutor')} />
            <ToggleRow label="Aviso: Estoque de Insumos abaixo do Mínimo" defaultOn onChange={() => handleToggle('Comprar Insumos')} />
          </div>
        </div>

        {/* SMTP */}
        <div className="pt-2">
          <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
             <Mail size={18} className="text-slate-500" /> Servidor de E-mail Interno (SMTP / SES)
          </h3>
          <div className="grid grid-cols-1 md: gap-6 max-w-3xl bg-slate-50 p-6 rounded-xl border border-slate-200">
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Host SMTP</label>
                <input type="text" defaultValue="email-smtp.us-east-1.amazonaws.com" className="w-full p-2.5 text-sm font-mono border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500" />
             </div>
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Porta (TLS/SSL)</label>
                <input type="text" defaultValue="587" className="w-full p-2.5 text-sm font-mono border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500" />
             </div>
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Usuário / Access Key</label>
                <input type="text" defaultValue="AKIAIOSFODNN7EXAMPLE" className="w-full p-2.5 text-sm font-mono border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500" />
             </div>
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Senha Privada</label>
                <input type="password" defaultValue="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY" className="w-full p-2.5 text-sm font-mono border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500" />
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ToggleRow({ label, defaultOn, onChange }: { label: string, defaultOn: boolean, onChange: () => void }) {
  const [isOn, setIsOn] = useState(defaultOn)
  const toggle = () => {
    setIsOn(!isOn)
    onChange()
  }

  return (
    <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-indigo-300 transition-colors cursor-pointer group" onClick={toggle}>
       <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-700 transition-colors">{label}</span>
       <button className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${isOn ? 'bg-emerald-500' : 'bg-slate-300'}`}>
         <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out ${isOn ? 'translate-x-6' : 'translate-x-0'}`} />
       </button>
    </div>
  )
}
