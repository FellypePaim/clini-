import React from 'react'
import { 
  Settings2, 
  Database, 
  Mail, 
  Key, 
  ShieldCheck, 
  Globe, 
  Bell, 
  Cloud, 
  Zap, 
  Lock,
  ChevronRight,
  Save,
  Palette,
  Layout,
  Cpu
} from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { cn } from '../../lib/utils'
import { useToast } from '../../hooks/useToast'

export function SuperConfiguracoesPage() {
  const { toast } = useToast()
  const [activeSettingItem, setActiveSettingItem] = React.useState<string>('Domínio Principal')
  const [flags, setFlags] = React.useState([
    { id: 'ovyva_audio', name: 'Processamento de Áudio OVYVA', active: true, info: 'Ativa transcrição automática em todas as clínicas' },
    { id: 'super_admin_panel', name: 'Beta: Novo Painel SuperAdmin', active: true, info: 'Acesso às novas rotas administrativas globais' },
    { id: 'telemed_v3', name: 'Telemedicina v3 (WebRTC)', active: false, info: 'Nova stack de vídeo em ambiente de testes' },
  ])

  const toggleFlag = (id: string) => {
    setFlags(prev => prev.map(f => f.id === id ? { ...f, active: !f.active } : f))
  }

  const settingsGroups = [
    { title: 'Plataforma Core', icon: Globe, items: ['Domínio Principal', 'Certificados SSL', 'CDN Cloudflare'] },
    { title: 'Database & Storage', icon: Database, items: ['Retenção de Arquivos', 'Backup Automático', 'Limites de Quota'] },
    { title: 'Autenticação & Segurança', icon: Lock, items: ['Políticas de Senha', 'MFA Obrigatório', 'Sessões Ativas'] },
    { title: 'Email & Notificações', icon: Mail, items: ['SMTP Service', 'Templates de Email', 'Webhooks Globais'] },
    { title: 'IA & Integrações', icon: BrainCircuit, items: ['API Keys (OpenAI/Google)', 'Modelos Ativos', 'Thresholds de Custo'] },
  ]

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">Configurações da Plataforma</h1>
          <p className="text-slate-400 font-medium">Gestão global de parâmetros, chaves de API e políticas do sistema.</p>
        </div>
        <button
          onClick={() => toast({ title: 'Configurações Salvas', description: 'Alterações de configuração persistidas com sucesso.', type: 'success' })}
          className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl shadow-xl shadow-purple-600/20 transition-all active:scale-95 group">
           <Save size={18} /> SALVAR ALTERAÇÕES
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar de Navegação de Configurações */}
        <div className="space-y-2 lg:col-span-1">
           {settingsGroups.map((group, idx) => (
             <div key={group.title} className="mb-6 last:mb-0">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-4 mb-3 flex items-center gap-2">
                   <group.icon size={14} className="text-purple-400" /> {group.title}
                </h3>
                <div className="space-y-1">
                   {group.items.map((item, itemIdx) => (
                     <button
                       key={item}
                       onClick={() => setActiveSettingItem(item)}
                       className={cn(
                        "w-full text-left px-4 py-3 text-xs font-bold rounded-xl transition-all flex items-center justify-between group",
                        activeSettingItem === item ? "bg-purple-600/10 text-purple-400 border border-purple-500/20" : "text-slate-400 hover:bg-slate-800/40 hover:text-white"
                     )}>
                        {item}
                        <ChevronRight size={14} className={cn(
                          "transition-transform",
                          activeSettingItem === item ? "translate-x-0" : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                        )} />
                     </button>
                   ))}
                </div>
             </div>
           ))}
        </div>

        {/* Editor de Configurações Principal */}
        <div className="lg:col-span-3 space-y-8">
           {/* Section 1: Dashboard e Identidade Visual */}
           <div className="bg-slate-800/30 border border-slate-700/50 p-8 rounded-[40px] space-y-8 animate-fade-in shadow-2xl overflow-hidden relative group">
              <div className="flex items-center gap-4 relative z-10">
                 <div className="p-4 bg-purple-500/10 text-purple-400 rounded-2xl border border-purple-500/20">
                    <Globe size={28} />
                 </div>
                 <div>
                    <h3 className="text-xl font-black text-white">Domínio & Identidade</h3>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Configurações principais de branding e acesso</p>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome da Plataforma</label>
                    <input type="text" defaultValue="Prontuário Verde" className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500 transition-all font-bold" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">URL de Produção</label>
                    <input type="text" defaultValue="https://app.prontuarioverde.com.br" className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500 transition-all font-bold" />
                 </div>
              </div>

              <div className="space-y-2 relative z-10">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logo Principal (SVG/PNG)</label>
                 <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-slate-900 rounded-2xl border border-dashed border-slate-700 flex items-center justify-center text-slate-600 hover:border-purple-500/50 transition-all cursor-pointer">
                       <Cloud size={24} />
                    </div>
                    <div className="flex flex-col gap-1">
                       <span className="text-xs font-bold text-slate-300">prontuario-verde-logo.svg</span>
                       <span className="text-[10px] font-bold text-slate-500">Formato SVG recomendado, máx 2MB.</span>
                    </div>
                 </div>
              </div>

              {/* Decor visual background */}
              <div className="absolute top-0 right-0 p-8 text-purple-600/5 group-hover:scale-125 transition-transform duration-1000 -mr-10 -mt-10">
                 <Palette size={200} />
              </div>
           </div>

           {/* Section 2: Chaves de API de Infraestrutura */}
           <div className="bg-slate-800/30 border border-slate-700/50 p-8 rounded-[40px] space-y-8 animate-fade-in shadow-2xl">
              <div className="flex items-center gap-4">
                 <div className="p-4 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20">
                    <Key size={28} />
                 </div>
                 <div>
                    <h3 className="text-xl font-black text-white">Segredos de Infraestrutura</h3>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Chaves de integração e webhooks protegidos</p>
                 </div>
              </div>

              <div className="space-y-6">
                 <div className="p-6 bg-slate-900/50 rounded-[32px] border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          <Cpu size={18} className="text-purple-400" />
                          <span className="text-xs font-black text-white uppercase tracking-widest">Google Gemini Pro (Vertex AI)</span>
                       </div>
                       <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[9px] font-black px-3 py-1">CONECTADO</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                       <input type="password" value="****************************************" disabled className="flex-1 bg-slate-800/50 border border-slate-700/30 rounded-lg px-4 py-2.5 text-xs text-slate-500 font-mono" />
                       <button
                         onClick={() => toast({ title: 'Alterar API Key', description: 'Para alterar a chave do Gemini, acesse o Supabase Dashboard → Edge Functions → Secrets.', type: 'info' })}
                         className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-black text-[10px] uppercase tracking-widest rounded-lg transition-all">Alterar Key</button>
                    </div>
                 </div>

                 <div className="p-6 bg-slate-900/50 rounded-[32px] border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          <Zap size={18} className="text-emerald-400" />
                          <span className="text-xs font-black text-white uppercase tracking-widest">Evolution API Cluster (WA)</span>
                       </div>
                       <button
                         onClick={() => toast({ title: 'Rotate Credentials', description: 'Para rotacionar as credenciais da Evolution API, acesse o servidor Evolution e atualize o secret no Supabase.', type: 'info' })}
                         className="text-[10px] font-black text-indigo-400 hover:text-white transition-colors uppercase tracking-widest">Rotate Credentials</button>
                    </div>
                    <div className="flex items-center gap-2">
                       <input type="password" value="****************************************" disabled className="flex-1 bg-slate-800/50 border border-slate-700/30 rounded-lg px-4 py-2.5 text-xs text-slate-500 font-mono" />
                       <button
                         onClick={() => toast({ title: 'Acesso Restrito', description: 'A visualização de secrets é bloqueada por segurança. Acesse o Supabase Dashboard.', type: 'info' })}
                         className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-black text-[10px] uppercase tracking-widest rounded-lg transition-all">Visualizar</button>
                    </div>
                 </div>
              </div>
           </div>

           {/* Section 3: Feature Flags e Controle de Rollout */}
           <div className="bg-slate-800/30 border border-slate-700/50 p-8 rounded-[40px] space-y-8 animate-fade-in shadow-2xl relative overflow-hidden group">
              <div className="flex items-center gap-4 relative z-10">
                 <div className="p-4 bg-amber-500/10 text-amber-500 rounded-2xl border border-amber-500/20">
                    <ShieldCheck size={28} />
                 </div>
                 <div>
                    <h3 className="text-xl font-black text-white">Rollout e Feature Flags</h3>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Controle de ativação de novas funcionalidades</p>
                 </div>
              </div>

              <div className="space-y-4 relative z-10">
                 {flags.map(flag => (
                   <div key={flag.id} className={cn(
                     "flex items-center justify-between p-5 rounded-3xl border transition-all",
                     flag.active ? "bg-slate-900/50 border-slate-800 shadow-lg" : "bg-slate-900/20 border-slate-800/50 grayscale opacity-70"
                   )}>
                      <div className="flex flex-col gap-0.5">
                         <span className="text-xs font-black text-white tracking-widest uppercase">{flag.name}</span>
                         <span className="text-[10px] font-bold text-slate-500 leading-tight">{flag.info}</span>
                      </div>
                      <div className="flex items-center gap-4">
                         <span className={cn("text-[9px] font-black uppercase tracking-[0.2em]", flag.active ? 'text-emerald-500' : 'text-red-500')}>
                            {flag.active ? 'ATIVADO' : 'DESATIVADO'}
                         </span>
                         <button
                           onClick={() => toggleFlag(flag.id)}
                           className={cn(
                             "w-12 h-6 rounded-full p-1 relative transition-all cursor-pointer",
                             flag.active ? "bg-emerald-600" : "bg-slate-700"
                           )}>
                            <div className={cn("w-4 h-4 bg-white rounded-full transition-all", flag.active ? "translate-x-6" : "translate-x-0")} />
                         </button>
                      </div>
                   </div>
                 ))}
              </div>
              
              {/* Background decoraion */}
              <div className="absolute top-0 right-0 p-8 text-amber-600/5 group-hover:-rotate-12 transition-transform duration-1000 -mr-10 -mt-10">
                 <Settings2 size={200} />
              </div>
           </div>
        </div>

      </div>
    </div>
  )
}

function BrainCircuit(props: any) {
  return (
    <svg 
      {...props} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .52 8.13 3 3 0 1 0 5.277-2.027 4 4 0 0 0 5.313.111 3 3 0 1 0 5.277 2.027 4 4 0 0 0 .52-8.13 4 4 0 0 0-2.526-5.77A3 3 0 1 0 12 5" />
      <path d="M12 11V5" />
      <path d="M10.5 13.5 12 11l1.5 2.5" />
      <path d="M12 22v-4" />
      <path d="M15 13h4" />
      <path d="M5 13h4" />
    </svg>
  )
}
