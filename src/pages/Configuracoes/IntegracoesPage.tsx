import React, { useState, useEffect, useCallback } from 'react'
import {
  Smartphone,
  Database,
  Bot,
  Wifi,
  WifiOff,
  RefreshCw,
  Eye,
  EyeOff,
  CheckCircle2,
  Loader2,
  Save
} from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { useToast } from '../../hooks/useToast'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'

interface IAConfig {
  provedor: string
  modelo: string
  api_key: string
  habilitar_ovyva: boolean
  habilitar_prontuario: boolean
}

const defaultIAConfig: IAConfig = {
  provedor: 'Google Gemini',
  modelo: 'gemini-2.5-flash',
  api_key: '',
  habilitar_ovyva: true,
  habilitar_prontuario: true,
}

export function IntegracoesPage() {
  const { toast } = useToast()
  const { user } = useAuthStore()
  const clinicaId = user?.clinicaId

  const [showKey, setShowKey] = useState<Record<string, boolean>>({})
  const [iaConfig, setIAConfig] = useState<IAConfig>(defaultIAConfig)
  const [whatsappStatus, setWhatsappStatus] = useState<'conectado' | 'desconectado' | 'carregando'>('carregando')
  const [whatsappNumero, setWhatsappNumero] = useState<string>('')
  const [savingIA, setSavingIA] = useState(false)

  const toggleKey = (id: string) => setShowKey(prev => ({ ...prev, [id]: !prev[id] }))

  const loadData = useCallback(async () => {
    if (!clinicaId) return

    // Carregar status WhatsApp
    const { data: instancias } = await supabase
      .from('whatsapp_instancias')
      .select('status, numero')
      .eq('clinica_id', clinicaId)
      .eq('status', 'conectado')
      .limit(1)

    if (instancias && instancias.length > 0) {
      setWhatsappStatus('conectado')
      setWhatsappNumero(instancias[0].numero || '')
    } else {
      setWhatsappStatus('desconectado')
    }

    // Carregar config IA
    const { data: clinica } = await supabase
      .from('clinicas')
      .select('configuracoes')
      .eq('id', clinicaId)
      .single()

    if (clinica?.configuracoes?.ia) {
      setIAConfig(prev => ({ ...prev, ...clinica.configuracoes.ia }))
    }
  }, [clinicaId])

  useEffect(() => { loadData() }, [loadData])

  const saveIAConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clinicaId) return
    setSavingIA(true)
    const { data: current } = await supabase
      .from('clinicas').select('configuracoes').eq('id', clinicaId).single()
    const merged = { ...(current?.configuracoes || {}), ia: iaConfig }
    const { error } = await supabase.from('clinicas').update({ configuracoes: merged }).eq('id', clinicaId)
    setSavingIA(false)
    if (error) {
      toast({ title: 'Erro', description: error.message, type: 'error' })
    } else {
      toast({ title: 'Config IA Salva', description: 'Configurações de IA atualizadas.', type: 'success' })
    }
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''

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
          <p className="text-sm text-slate-500 font-medium mb-4">Instâncias WhatsApp gerenciadas via Evolution API.</p>

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
              href="/ovyva/whatsapp"
              className="flex items-center gap-2 px-4 py-2 font-bold text-slate-600 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-colors"
            >
              <RefreshCw size={16} /> Gerenciar Instâncias
            </a>
          </div>
        </div>
      </div>

      {/* Supabase */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 flex items-start gap-6 group hover:border-indigo-200 hover:shadow-md transition-all">
        <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl shrink-0 group-hover:bg-indigo-100 transition-colors">
          <Database size={32} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">Supabase (Banco de Dados)</h3>
            <Badge className="bg-emerald-100 text-emerald-700 font-bold border-none px-2.5 py-1 tracking-widest">
              <Wifi size={14} className="mr-1 inline-block" /> Conectado
            </Badge>
          </div>
          <p className="text-sm text-slate-500 font-medium mb-4">Banco PostgreSQL gerenciado com RLS e Auth multi-tenant.</p>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Project URL</span>
              <p className="text-sm font-mono text-slate-700 mt-1 break-all">{supabaseUrl || '(configurado via variável de ambiente)'}</p>
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Chave configurada via</span>
              <p className="text-sm font-mono text-slate-700 mt-1">VITE_SUPABASE_ANON_KEY (.env)</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Para alterar as credenciais, edite o arquivo <code className="font-mono bg-slate-100 px-1 rounded">.env</code> e reinicie o servidor de desenvolvimento.
          </p>
        </div>
      </div>

      {/* IA Externa */}
      <form onSubmit={saveIAConfig}>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 flex items-start gap-6 group hover:border-indigo-200 hover:shadow-md transition-all">
          <div className="p-4 bg-fuchsia-50 text-fuchsia-600 rounded-2xl shrink-0 group-hover:bg-fuchsia-100 transition-colors">
            <Bot size={32} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">Provedor de IA (LLMs)</h3>
              <Badge className="bg-emerald-100 text-emerald-700 font-bold border-none px-2.5 py-1 tracking-widest">
                <Wifi size={14} className="mr-1 inline-block" /> Conectado
              </Badge>
            </div>
            <p className="text-sm text-slate-500 font-medium mb-6">Motor utilizado pela OVYVA e para geração de resumos de prontuários.</p>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Provedor</label>
                <select className="w-full p-2.5 text-sm font-bold border border-slate-200 rounded-lg bg-white text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                  value={iaConfig.provedor} onChange={e => setIAConfig(c => ({ ...c, provedor: e.target.value }))}>
                  <option value="Google Gemini">Google Gemini</option>
                  <option value="OpenAI">OpenAI (GPTs)</option>
                  <option value="Anthropic">Anthropic (Claude)</option>
                  <option value="Groq">Groq (Llama / Mixtral)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Modelo Preferido</label>
                <input type="text" className="w-full p-2.5 text-sm font-bold border border-slate-200 rounded-lg bg-white text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="gemini-2.5-flash"
                  value={iaConfig.modelo} onChange={e => setIAConfig(c => ({ ...c, modelo: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">API Key</label>
                <div className="relative">
                  <input type={showKey['llm'] ? 'text' : 'password'} placeholder="sk-... ou AIza..."
                    value={iaConfig.api_key} onChange={e => setIAConfig(c => ({ ...c, api_key: e.target.value }))}
                    className="w-full p-2.5 pr-10 text-sm font-mono border border-slate-200 rounded-lg bg-slate-50 text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500" />
                  <button type="button" onClick={() => toggleKey('llm')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showKey['llm'] ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-4 pt-6 border-t border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer group/chk">
                <input type="checkbox" checked={iaConfig.habilitar_ovyva}
                  onChange={e => setIAConfig(c => ({ ...c, habilitar_ovyva: e.target.checked }))}
                  className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500" />
                <span className="text-sm font-bold text-slate-600 group-hover/chk:text-indigo-600 transition-colors">Habilitar no Atendimento OVYVA</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group/chk">
                <input type="checkbox" checked={iaConfig.habilitar_prontuario}
                  onChange={e => setIAConfig(c => ({ ...c, habilitar_prontuario: e.target.checked }))}
                  className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500" />
                <span className="text-sm font-bold text-slate-600 group-hover/chk:text-indigo-600 transition-colors">Copilot Médico (Prontuário/Resumos)</span>
              </label>
            </div>

            <button type="submit" disabled={savingIA}
              className="mt-6 flex items-center gap-2 px-5 py-2.5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-colors disabled:opacity-50">
              {savingIA ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Salvar Configurações IA
            </button>
          </div>
        </div>
      </form>

    </div>
  )
}
