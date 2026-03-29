import React, { useState, useEffect, useCallback } from 'react'
import { Shield, Key, Download, MonitorPlay, LogOut, Loader2, RefreshCw, FileText, AlertTriangle, Lock, UserCheck } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { useToast } from '../../hooks/useToast'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { cn } from '../../lib/utils'

function fmtDate(d: string) { const p = d?.split('T')?.[0]?.split('-'); return p?.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : '—' }
function fmtTime(d: string) { return d?.split('T')?.[1]?.substring(0, 5) || '—' }

export function SegurancaPage() {
  const { toast } = useToast()
  const { user, logout } = useAuthStore()
  const clinicaId = user?.clinicaId
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [exportingLGPD, setExportingLGPD] = useState(false)

  const loadAuditLogs = useCallback(async () => {
    if (!clinicaId) return
    setLoadingLogs(true)
    try {
      // Buscar de auditoria_global se existir
      const { data: auditData } = await supabase
        .from('auditoria_global')
        .select('*')
        .eq('clinica_id', clinicaId)
        .order('created_at', { ascending: false })
        .limit(20)

      // Buscar logs de IA
      const { data: iaData } = await supabase
        .from('ai_usage_logs')
        .select('*')
        .eq('clinica_id', clinicaId)
        .order('created_at', { ascending: false })
        .limit(10)

      const logs = [
        ...(auditData || []).map((r: any) => ({
          id: r.id, tipo: 'audit', acao: r.acao || 'Ação', recurso: r.recurso || '—',
          usuario: r.usuario_id?.substring(0, 8) || '—', created_at: r.created_at,
        })),
        ...(iaData || []).map((r: any) => ({
          id: r.id, tipo: 'ia', acao: r.action || 'IA', recurso: `${r.modelo || ''} (${r.tokens_entrada || 0}+${r.tokens_saida || 0} tokens)`,
          usuario: r.usuario_id?.substring(0, 8) || 'sistema', created_at: r.created_at,
        })),
      ].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))

      setAuditLogs(logs.slice(0, 20))
    } catch { /* ignore */ } finally { setLoadingLogs(false) }
  }, [clinicaId])

  useEffect(() => { loadAuditLogs() }, [loadAuditLogs])

  // Export LGPD — todos os dados do paciente (somente admin)
  const handleExportLGPD = async () => {
    if (!clinicaId) return
    if (user?.role !== 'administrador') {
      toast({ title: 'Acesso negado', description: 'Somente administradores podem exportar dados LGPD.', type: 'error' })
      return
    }
    setExportingLGPD(true)
    try {
      const [pacientes, consultas, prescricoes, termos, evolucoes, anamneses] = await Promise.all([
        supabase.from('pacientes').select('*').eq('clinica_id', clinicaId),
        supabase.from('consultas').select('*').eq('clinica_id', clinicaId),
        supabase.from('prescricoes').select('*').eq('clinica_id', clinicaId),
        supabase.from('termos_consentimento').select('*').eq('clinica_id', clinicaId),
        supabase.from('evolucoes').select('*').eq('clinica_id', clinicaId),
        supabase.from('anamneses').select('*'),
      ])

      const exportData = {
        exportado_em: new Date().toISOString(),
        clinica_id: clinicaId,
        pacientes: pacientes.data || [],
        consultas: consultas.data || [],
        prescricoes: prescricoes.data || [],
        termos: termos.data || [],
        evolucoes: evolucoes.data || [],
        anamneses: anamneses.data || [],
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const dp = new Date().toISOString().split('T')[0]
      link.download = `export_lgpd_${dp}.json`
      link.click()
      URL.revokeObjectURL(url)

      toast({ title: 'Exportação LGPD concluída', description: 'Arquivo JSON com todos os dados da clínica.', type: 'success' })
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, type: 'error' })
    } finally { setExportingLGPD(false) }
  }

  return (
    <div className="space-y-6">
      {/* Políticas de Autenticação */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-600" /> Autenticação e Segurança
          </h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Políticas de Senha</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2"><Lock className="w-3.5 h-3.5 text-cyan-500" /><span className="text-gray-600">Mínimo 6 caracteres (Supabase Auth)</span></div>
              <div className="flex items-center gap-2"><Lock className="w-3.5 h-3.5 text-cyan-500" /><span className="text-gray-600">Hash bcrypt no banco</span></div>
              <div className="flex items-center gap-2"><Lock className="w-3.5 h-3.5 text-cyan-500" /><span className="text-gray-600">Recuperação de senha por e-mail</span></div>
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">2FA (Autenticação em 2 Fatores)</h3>
            <p className="text-sm text-gray-500">O 2FA pode ser ativado pelo painel do Supabase em Authentication → MFA.</p>
            <button onClick={() => toast({ title: '2FA', description: 'Acesse o Dashboard do Supabase → Authentication → MFA para ativar.', type: 'info' })}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors">
              <Key className="w-3.5 h-3.5" /> Instruções 2FA
            </button>
          </div>
        </div>
      </div>

      {/* Sessão Atual */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <MonitorPlay className="w-4 h-4 text-indigo-600" /> Sessão Atual
          </h2>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div>
              <h4 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                {user?.email}
                <Badge className="bg-emerald-100 text-emerald-700 px-1.5 border-none text-[10px]">ATIVA</Badge>
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">{user?.nome} · {user?.role}</p>
            </div>
            <button onClick={async () => { await supabase.auth.signOut(); logout() }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors">
              <LogOut size={14} /> Encerrar Sessão
            </button>
          </div>
        </div>
      </div>

      {/* LGPD — Export de Dados */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-cyan-500" /> Conformidade LGPD
          </h2>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-500">A Lei Geral de Proteção de Dados (13.709/2018) garante ao titular o direito de acessar, corrigir e exportar seus dados pessoais.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button onClick={handleExportLGPD} disabled={exportingLGPD}
              className="flex items-center gap-2 p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-xl hover:bg-cyan-500/10 transition-colors text-left">
              <Download className="w-5 h-5 text-cyan-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-cyan-700">
                  {exportingLGPD ? 'Exportando...' : 'Exportar Todos os Dados'}
                </p>
                <p className="text-[10px] text-cyan-500 mt-0.5">Pacientes, consultas, prescrições, termos, evoluções (JSON)</p>
              </div>
            </button>

            <div className="flex items-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-xl text-left">
              <FileText className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-blue-800">Termos de Consentimento</p>
                <p className="text-[10px] text-blue-600 mt-0.5">Termos LGPD disponíveis na aba Termos de cada paciente</p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">Retenção mínima: dados de saúde devem ser mantidos por 20 anos (Resolução CFM 1.821/2007). A exclusão completa só pode ser feita após esse período.</p>
          </div>
        </div>
      </div>

      {/* Log de Atividade */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-gray-400" /> Log de Atividade
          </h2>
          <button onClick={loadAuditLogs} disabled={loadingLogs} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400">
            <RefreshCw className={cn("w-4 h-4", loadingLogs && "animate-spin")} />
          </button>
        </div>
        <div className="overflow-x-auto">
          {loadingLogs ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
          ) : auditLogs.length > 0 ? (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="text-left py-3 px-4">Data</th>
                  <th className="text-left py-3 px-4">Hora</th>
                  <th className="text-left py-3 px-4">Tipo</th>
                  <th className="text-left py-3 px-4">Ação</th>
                  <th className="text-left py-3 px-4">Recurso</th>
                  <th className="text-left py-3 px-4">Usuário</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map(log => (
                  <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-2.5 px-4 text-gray-700 font-medium">{fmtDate(log.created_at)}</td>
                    <td className="py-2.5 px-4 text-gray-500">{fmtTime(log.created_at)}</td>
                    <td className="py-2.5 px-4">
                      <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-semibold",
                        log.tipo === 'audit' ? "bg-indigo-100 text-indigo-700" : "bg-purple-100 text-purple-700")}>
                        {log.tipo === 'audit' ? 'AUDIT' : 'IA'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-gray-700">{log.acao}</td>
                    <td className="py-2.5 px-4 text-gray-500 max-w-[200px] truncate">{log.recurso}</td>
                    <td className="py-2.5 px-4 text-gray-400 font-mono text-[10px]">{log.usuario}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-12 text-center text-gray-400 text-sm">Nenhum log de atividade registrado.</div>
          )}
        </div>
      </div>
    </div>
  )
}
