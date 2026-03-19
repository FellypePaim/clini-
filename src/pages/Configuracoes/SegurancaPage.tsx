import React from 'react'
import { Shield, Key, Download, MonitorPlay, XCircle } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { useToast } from '../../hooks/useToast'

export function SegurancaPage() {
  const { toast } = useToast()

  const handleBackup = () => {
    toast({ title: 'Geração Inciada', description: 'O dump do banco de dados (SQL) está sendo preparado.', type: 'info' })
  }

  const handleDeslogar = () => {
    toast({ title: 'Sessão Encerrada', description: 'O dispositivo foi desconectado à força.', type: 'warning' })
  }

  return (
    <div className="space-y-6">

      {/* Toggles de Politica */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
               <Shield className="text-indigo-600" />
               Políticas de Autenticação e 2FA
            </h2>
            <p className="text-sm font-medium text-slate-500 mt-1">Regras de senha e dupla checagem.</p>
          </div>
        </div>
        <div className="p-8 grid grid-cols-1 md: gap-8">
           <div className="space-y-4 border-r border-slate-100 pr-8">
              <h3 className="font-bold text-slate-800">Força da Senha Institucional</h3>
              <div className="flex items-center gap-2">
                 <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-indigo-600 border-slate-300" />
                 <span className="text-sm font-medium text-slate-600">Exigir tamanho mínimo de 12 caracteres</span>
              </div>
              <div className="flex items-center gap-2">
                 <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-indigo-600 border-slate-300" />
                 <span className="text-sm font-medium text-slate-600">Ter pelo menos um símbolo (!@#)</span>
              </div>
              <div className="flex items-center gap-2">
                 <input type="checkbox" className="w-4 h-4 rounded text-indigo-600 border-slate-300" />
                 <span className="text-sm font-medium text-slate-600">Trocar a senha a cada 90 dias úteis</span>
              </div>
           </div>
           
           <div className="flex flex-col items-center justify-center">
              <Key size={32} className="text-indigo-600 mb-2" />
              <h3 className="font-bold text-slate-800 mb-2">Autenticação 2 Fatores</h3>
              <p className="text-sm text-center text-slate-500 mb-4 max-w-xs">Exija o uso do <strong>Google Authenticator</strong> no próximo login de todos os Administradores.</p>
              <button 
                 onClick={() => toast({ title: '2FA Forçado', description: 'Usuários deverão escanear o QR Code no próximo login.', type: 'success' })}
                 className="px-5 py-2 font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-xl transition-colors"
              >
                 Forçar Configuração Global
              </button>
           </div>
        </div>
      </div>

      {/* Sessões Abertas */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50 text-slate-900 font-bold">
           <MonitorPlay size={20} className="text-indigo-600" /> Dispositivos e Sessões Ativas
        </div>
        <div className="divide-y divide-slate-100 p-6">
           <div className="flex items-center justify-between pb-4">
              <div>
                 <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">MacBook Pro - Chrome <Badge className="bg-emerald-100 text-emerald-700 px-1 border-none tracking-widest text-[10px]">AGORA</Badge></h4>
                 <p className="text-xs text-slate-500 font-medium">IP: 192.168.1.100 (São Paulo) • Última ação: Instantes atrás</p>
              </div>
              <button className="text-xs font-bold text-slate-400 cursor-not-allowed">Sessão Atual</button>
           </div>
           <div className="flex items-center justify-between pt-4">
              <div>
                 <h4 className="font-bold text-slate-800 text-sm">iPhone 14 - Safari</h4>
                 <p className="text-xs text-slate-500 font-medium">IP: 177.100.22.4 (Campinas) • Última ação: Hoje às 14:30</p>
              </div>
              <button onClick={handleDeslogar} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors">
                <XCircle size={14} /> Revogar Acesso
              </button>
           </div>
        </div>
      </div>

      {/* Log e Backup */}
      <div className="grid grid-cols-1 md: gap-6">
         <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-hidden">
           <div className="border-b border-slate-100 pb-4 mb-4">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">Log de Acesso Geral</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">Monitora quem entrou no sistema (LGPD).</p>
           </div>
           <div className="space-y-3 h-[200px] overflow-y-auto custom-scrollbar pr-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="text-xs flex items-center justify-between p-2 hover:bg-slate-50 rounded">
                   <div>
                     <span className="font-bold text-slate-700">admin@prontuario.com</span>
                     <span className="block text-slate-400 font-mono text-[10px]">IP: 200.199.1.{i+10}</span>
                   </div>
                   <div className="text-right">
                     <span className="text-emerald-600 font-bold block">Login Success</span>
                     <span className="text-slate-400 text-[10px] uppercase font-bold">Hoje {10 - i}:00</span>
                   </div>
                </div>
              ))}
           </div>
         </div>

         <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-center text-center">
             <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <Download size={32} />
             </div>
             <h3 className="font-bold text-slate-800 text-lg">Solicitar Backup Rotina</h3>
             <p className="text-sm font-medium text-slate-500 mt-2 mb-6 max-w-[250px]">
               Atende à portaria do CFM sobre guarda e custódia segura do Prontuário Eletrônico.
             </p>
             <button onClick={handleBackup} className="px-6 py-2.5 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-colors w-full max-w-xs">
                Gerar Backup (Arquivos + SQL)
             </button>
             <span className="text-xs font-bold text-slate-400 mt-4">Último backup: Mês passado (Automático da Nuvem)</span>
         </div>
      </div>

    </div>
  )
}
