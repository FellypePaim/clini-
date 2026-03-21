import React, { useState, useEffect, useCallback } from 'react'
import { Shield, Key, Download, MonitorPlay, LogOut, Loader2, RefreshCw } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { useToast } from '../../hooks/useToast'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'

interface AuditLog {
  id: string
  email: string
  ip: string
  created_at: string
  event: string
}

export function SegurancaPage() {
  const { toast } = useToast()
  const { user, logout } = useAuthStore()
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [loadingBackup, setLoadingBackup] = useState(false)

  const loadAuditLogs = useCallback(async () => {
    setLoadingLogs(true)
    try {
      // Busca logs de acesso da tabela de audit (se existir) ou auth.audit_log_entries via RPC
      const { data } = await supabase
        .from('ai_usage_logs' as any)
        .select('id, clinica_id, created_at, action, tokens_used')
        .eq('clinica_id', user?.clinicaId || '')
        .order('created_at', { ascending: false })
        .limit(10)

      if (data) {
        setAuditLogs(data.map((r: any) => ({
          id: r.id,
          email: user?.email || '',
          ip: '—',
          created_at: r.created_at,
          event: r.action || 'Ação IA',
        })))
      }
    } catch {
      // Se não houver tabela de audit, mantém vazio
    } finally {
      setLoadingLogs(false)
    }
  }, [user?.clinicaId, user?.email])

  useEffect(() => { loadAuditLogs() }, [loadAuditLogs])

  const handleBackup = async () => {
    setLoadingBackup(true)
    toast({ title: 'Backup Solicitado', description: 'O Supabase realiza backups automáticos diários. Entre em contato com o suporte para exportação manual.', type: 'info' })
    setLoadingBackup(false)
  }

  const handleLogoutCurrentSession = async () => {
    await supabase.auth.signOut()
    logout()
    toast({ title: 'Sessão Encerrada', description: 'Você foi desconectado.', type: 'info' })
  }

  return (
    <div className="space-y-6">

      {/* Políticas de Autenticação */}
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
        <div className="p-8 grid grid-cols-2 gap-8">
          <div className="space-y-4 border-r border-slate-100 pr-8">
            <h3 className="font-bold text-slate-800">Força da Senha Institucional</h3>
            <div className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-indigo-600 border-slate-300" readOnly />
              <span className="text-sm font-medium text-slate-600">Exigir tamanho mínimo de 12 caracteres</span>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-indigo-600 border-slate-300" readOnly />
              <span className="text-sm font-medium text-slate-600">Ter pelo menos um símbolo (!@#)</span>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" className="w-4 h-4 rounded text-indigo-600 border-slate-300" readOnly />
              <span className="text-sm font-medium text-slate-600">Trocar a senha a cada 90 dias</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">As políticas de senha são gerenciadas pelo Supabase Auth.</p>
          </div>

          <div className="flex flex-col items-center justify-center">
            <Key size={32} className="text-indigo-600 mb-2" />
            <h3 className="font-bold text-slate-800 mb-2">Autenticação 2 Fatores</h3>
            <p className="text-sm text-center text-slate-500 mb-4 max-w-xs">
              O 2FA pode ser ativado pelo painel do Supabase em <strong>Authentication → Settings → MFA</strong>.
            </p>
            <button
              onClick={() => toast({ title: '2FA', description: 'Configure o MFA no painel do Supabase Authentication.', type: 'info' })}
              className="px-5 py-2 font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-xl transition-colors"
            >
              Ver Instruções 2FA
            </button>
          </div>
        </div>
      </div>

      {/* Sessão Atual */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50 text-slate-900 font-bold">
          <MonitorPlay size={20} className="text-indigo-600" /> Sessão Atual
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                {user?.email}
                <Badge className="bg-emerald-100 text-emerald-700 px-1 border-none tracking-widest text-[10px]">ATIVA</Badge>
              </h4>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Perfil: {user?.nome} · Acesso: {user?.role}
              </p>
            </div>
            <button
              onClick={handleLogoutCurrentSession}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
            >
              <LogOut size={14} /> Encerrar Sessão
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            O gerenciamento de todas as sessões ativas pode ser feito pelo painel do Supabase em Authentication → Users.
          </p>
        </div>
      </div>

      {/* Log e Backup */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-hidden">
          <div className="border-b border-slate-100 pb-4 mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800">Log de Atividade IA</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">Últimas ações de IA da clínica.</p>
            </div>
            <button onClick={loadAuditLogs} className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="Atualizar">
              <RefreshCw size={16} className={`text-slate-400 ${loadingLogs ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="space-y-3 h-[200px] overflow-y-auto pr-2">
            {loadingLogs ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <p className="text-sm font-medium">Nenhuma atividade registrada</p>
              </div>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="text-xs flex items-center justify-between p-2 hover:bg-slate-50 rounded">
                  <div>
                    <span className="font-bold text-slate-700">{log.email || 'Sistema'}</span>
                    <span className="block text-slate-400 font-mono text-[10px]">{log.event}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-600 font-bold block">OK</span>
                    <span className="text-slate-400 text-[10px] uppercase font-bold">
                      {new Date(log.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <Download size={32} />
          </div>
          <h3 className="font-bold text-slate-800 text-lg">Solicitar Backup</h3>
          <p className="text-sm font-medium text-slate-500 mt-2 mb-6 max-w-[250px]">
            O Supabase realiza backups automáticos diários. Para exportação manual, utilize o painel do Supabase ou entre em contato com o suporte.
          </p>
          <button
            onClick={handleBackup}
            disabled={loadingBackup}
            className="px-6 py-2.5 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-colors w-full max-w-xs disabled:opacity-50"
          >
            {loadingBackup ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Solicitar Backup Manual'}
          </button>
          <span className="text-xs font-bold text-slate-400 mt-4">Backups automáticos: diários (Supabase Cloud)</span>
        </div>
      </div>

    </div>
  )
}
