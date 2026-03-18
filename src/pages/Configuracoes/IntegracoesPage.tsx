import React, { useState } from 'react'
import {
  Smartphone,
  Database,
  Bot,
  Percent,
  CreditCard,
  Wifi,
  WifiOff,
  RefreshCw,
  Eye,
  EyeOff,
  CheckCircle2
} from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { useToast } from '../../hooks/useToast'

export function IntegracoesPage() {
  const { toast } = useToast()
  const [showKey, setShowKey] = useState<Record<string, boolean>>({})

  const toggleKey = (id: string) => setShowKey(prev => ({ ...prev, [id]: !prev[id] }))

  const handleTest = (provider: string) => {
    toast({ title: `Conexão: ${provider}`, description: 'Teste de mock realizado retornou 200 OK.', type: 'success' })
  }

  return (
    <div className="space-y-6">
      
      {/* OVYVA & WhatsApp */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 flex items-start gap-6 group hover:border-indigo-200 hover:shadow-md transition-all">
        <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl shrink-0 group-hover:bg-emerald-100 transition-colors">
          <Smartphone size={32} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">WhatsApp & Agente OVYVA</h3>
            <Badge className="bg-emerald-100 text-emerald-700 font-bold border-none px-2.5 py-1 tracking-widest"><Wifi size={14} className="mr-1 inline-block" /> Conectado</Badge>
          </div>
          <p className="text-sm text-slate-500 font-medium mb-4">Extensão do n8n vinculada à API Oficial do WhatsApp Cloud.</p>
          
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
            <div className="flex flex-col gap-1">
               <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Número Vinculado</span>
               <span className="text-base font-black text-slate-800 hidden sm:block">+55 (11) 99999-0000</span>
            </div>
            <div className="flex flex-col gap-1 items-end">
               <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Última Sincronização</span>
               <span className="text-sm font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 size={14}/> Há 2 minutos</span>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 font-bold text-slate-600 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-colors" onClick={() => handleTest('WhatsApp API')}>
               <RefreshCw size={16} /> Ressincronizar
            </button>
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
            <Badge className="bg-amber-100 text-amber-700 font-bold border-none px-2.5 py-1 tracking-widest"><WifiOff size={14} className="mr-1 inline-block" /> Requer Setup</Badge>
          </div>
          <p className="text-sm text-slate-500 font-medium mb-6">Credenciais de RLS e JWT Auth para o PostgREST.</p>
          
          <div className="space-y-4">
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Project URL</label>
                <input type="url" placeholder="https://xxxxxx.supabase.co" className="w-full p-2.5 text-sm font-mono border border-slate-200 rounded-lg bg-slate-50 text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500" />
             </div>
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Anon Public Key</label>
                <div className="relative">
                  <input type={showKey['supa_anon'] ? "text" : "password"} placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." className="w-full p-2.5 pr-10 text-sm font-mono border border-slate-200 rounded-lg bg-slate-50 text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500" />
                  <button onClick={() => toggleKey('supa_anon')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showKey['supa_anon'] ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
             </div>
             
             <button onClick={() => handleTest('Supabase PostgREST')} className="ml-auto flex items-center gap-2 px-5 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-colors">
                <RefreshCw size={16} /> Testar Conexão RLS
             </button>
          </div>
        </div>
      </div>

      {/* IA Externa */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 flex items-start gap-6 group hover:border-indigo-200 hover:shadow-md transition-all">
        <div className="p-4 bg-fuchsia-50 text-fuchsia-600 rounded-2xl shrink-0 group-hover:bg-fuchsia-100 transition-colors">
          <Bot size={32} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">Provedor de IA (LLMs)</h3>
            <Badge className="bg-emerald-100 text-emerald-700 font-bold border-none px-2.5 py-1 tracking-widest"><Wifi size={14} className="mr-1 inline-block" /> Conectado</Badge>
          </div>
          <p className="text-sm text-slate-500 font-medium mb-6">Motor utilizado pela OVYVA e para geração de resumos de prescrições.</p>
          
          <div className="grid grid-cols-2 gap-6">
             <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Provedor Homologado</label>
               <select className="w-full p-2.5 text-sm font-bold border border-slate-200 rounded-lg bg-white text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500">
                 <option>OpenAI (GPTs)</option>
                 <option>Anthropic (Claude)</option>
                 <option>Groq (Llama / Mixtral)</option>
               </select>
             </div>
             <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Modelo Preferido</label>
               <select className="w-full p-2.5 text-sm font-bold border border-slate-200 rounded-lg bg-white text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500">
                 <option>gpt-4o</option>
                 <option>gpt-4o-mini</option>
                 <option>o1-preview</option>
               </select>
             </div>
             <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">API Key</label>
                <div className="relative">
                  <input type={showKey['llm'] ? "text" : "password"} defaultValue="sk-proj-xxxxxxxxxxxxxxxxxxxx" className="w-full p-2.5 pr-10 text-sm font-mono border border-slate-200 rounded-lg bg-slate-50 text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500" />
                  <button onClick={() => toggleKey('llm')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showKey['llm'] ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
             </div>
          </div>
          
          <div className="mt-6 flex flex-wrap gap-4 pt-6 border-t border-slate-100">
             <label className="flex items-center gap-2 cursor-pointer group/chk">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500" />
                <span className="text-sm font-bold text-slate-600 group-hover/chk:text-indigo-600 transition-colors">Habilitar no Atendimento OVYVA</span>
             </label>
             <label className="flex items-center gap-2 cursor-pointer group/chk">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500" />
                <span className="text-sm font-bold text-slate-600 group-hover/chk:text-indigo-600 transition-colors">Copilot Médico (Prontuário/Resumos)</span>
             </label>
          </div>
        </div>
      </div>

    </div>
  )
}
