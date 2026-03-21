import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Edit2, Check, X, UserCog, BriefcaseMedical, Loader2 } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { useToast } from '../../hooks/useToast'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'

interface Profissional {
  id: string
  nome_completo: string
  especialidade: string | null
  conselho: string | null
  ativo: boolean
  role: string
  cor: string
}

interface NovoColaboradorForm {
  nome: string
  email: string
  role: 'profissional' | 'recepcao' | 'admin'
  especialidade: string
  conselho: string
  senha: string
}

const formVazio: NovoColaboradorForm = {
  nome: '',
  email: '',
  role: 'profissional',
  especialidade: '',
  conselho: '',
  senha: '',
}

const COR_ROLE: Record<string, string> = {
  admin: 'bg-indigo-500',
  administrador: 'bg-indigo-500',
  profissional: 'bg-emerald-500',
  recepcao: 'bg-slate-500',
}

function roleBadgeStyle(role: string) {
  if (role === 'admin' || role === 'administrador') return 'bg-indigo-100 text-indigo-700'
  if (role === 'recepcao') return 'bg-slate-100 text-slate-600'
  return 'bg-emerald-100 text-emerald-700'
}

function roleLabel(role: string) {
  const map: Record<string, string> = {
    admin: 'Administrador',
    administrador: 'Administrador',
    profissional: 'Profissional',
    recepcao: 'Recepção',
  }
  return map[role] ?? role
}

export function ProfissionaisPage() {
  const { toast } = useToast()
  const { user } = useAuthStore()
  const clinicaId = user?.clinicaId

  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<NovoColaboradorForm>(formVazio)
  const [saving, setSaving] = useState(false)

  const loadProfissionais = useCallback(async () => {
    if (!clinicaId) return
    setIsLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nome_completo, especialidade, conselho, ativo, role')
      .eq('clinica_id', clinicaId)
      .order('nome_completo', { ascending: true })

    if (error) {
      toast({ title: 'Erro ao carregar', description: error.message, type: 'error' })
    } else {
      setProfissionais((data ?? []).map((p: any) => ({
        ...p,
        cor: COR_ROLE[p.role] ?? 'bg-slate-400',
      })))
    }
    setIsLoading(false)
  }, [clinicaId, toast])

  useEffect(() => { loadProfissionais() }, [loadProfissionais])

  const toggleStatus = async (id: string, current: boolean) => {
    setToggling(id)
    const { error } = await supabase
      .from('profiles')
      .update({ ativo: !current })
      .eq('id', id)

    if (error) {
      toast({ title: 'Erro', description: error.message, type: 'error' })
    } else {
      setProfissionais(prev => prev.map(p => p.id === id ? { ...p, ativo: !current } : p))
      toast({ title: 'Status atualizado', description: `Acesso ${!current ? 'ativado' : 'desativado'} com sucesso.`, type: 'success' })
    }
    setToggling(null)
  }

  const handleCadastrar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clinicaId || !form.nome || !form.email || !form.senha) return
    setSaving(true)
    try {
      // Chama a Edge Function user-manager para criar o usuário com service role
      const { data, error } = await supabase.functions.invoke('user-manager', {
        body: {
          action: 'create_user',
          email: form.email,
          senha: form.senha,
          nome: form.nome,
          role: form.role,
          especialidade: form.especialidade || null,
          conselho: form.conselho || null,
          clinica_id: clinicaId,
        },
      })

      if (error) throw error
      if (data?.error) throw new Error(data.error)

      toast({ title: 'Colaborador criado!', description: `${form.nome} adicionado com sucesso.`, type: 'success' })
      setShowModal(false)
      setForm(formVazio)
      await loadProfissionais()
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message || 'Falha ao criar colaborador.', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BriefcaseMedical className="text-indigo-600" />
            Quadro Médico e Equipe
          </h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Gerencie os profissionais e seus níveis de acesso.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-colors"
        >
          <Plus size={18} /> Cadastrar Colaborador
        </button>
      </div>

      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          </div>
        ) : profissionais.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400">
            <BriefcaseMedical className="w-12 h-12 mb-3 text-slate-200" />
            <p className="font-bold text-sm">Nenhum profissional cadastrado</p>
            <button onClick={() => setShowModal(true)} className="mt-3 text-indigo-600 text-sm font-medium hover:underline">
              Cadastrar o primeiro colaborador
            </button>
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-white border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-4">Profissional</th>
                <th className="px-6 py-4">Conselho</th>
                <th className="px-6 py-4">Nível de Acesso</th>
                <th className="px-6 py-4 text-center">Cor</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium">
              {profissionais.map((prof) => (
                <tr key={prof.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0 border-2 border-white shadow-sm font-bold text-slate-600">
                        {prof.nome_completo.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800">{prof.nome_completo}</h3>
                        <span className="text-xs text-slate-500">{prof.especialidade ?? '—'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-xs">{prof.conselho ?? '—'}</td>
                  <td className="px-6 py-4">
                    <Badge className={`border-none tracking-widest uppercase text-[10px] ${roleBadgeStyle(prof.role)}`}>
                      {roleLabel(prof.role)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className={`w-6 h-6 rounded-md mx-auto shadow-sm ${prof.cor}`} />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => toggleStatus(prof.id, prof.ativo)}
                      disabled={toggling === prof.id}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-widest border transition-colors disabled:opacity-50 ${
                        prof.ativo
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                          : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200'
                      }`}
                    >
                      {toggling === prof.id ? <Loader2 size={13} className="animate-spin" /> : prof.ativo ? <Check size={14} /> : <X size={14} />}
                      {prof.ativo ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Editar Perfil">
                        <Edit2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Modal Cadastrar Colaborador ──────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <UserCog className="w-5 h-5 text-indigo-600" /> Novo Colaborador
              </h2>
              <button onClick={() => { setShowModal(false); setForm(formVazio); }} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleCadastrar} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo *</label>
                <input type="text" required className="input-base" placeholder="Dr. João Silva"
                  value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail *</label>
                <input type="email" required className="input-base" placeholder="colaborador@clinica.com"
                  value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha inicial *</label>
                <input type="password" required minLength={8} className="input-base" placeholder="Mínimo 8 caracteres"
                  value={form.senha} onChange={e => setForm(f => ({ ...f, senha: e.target.value }))} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nível de acesso *</label>
                <select className="input-base" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as any }))}>
                  <option value="profissional">Profissional de Saúde</option>
                  <option value="recepcao">Recepção</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Especialidade</label>
                  <input type="text" className="input-base" placeholder="Ex: Dermatologia"
                    value={form.especialidade} onChange={e => setForm(f => ({ ...f, especialidade: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Conselho (CRM/CRO)</label>
                  <input type="text" className="input-base" placeholder="CRM-SP 12345"
                    value={form.conselho} onChange={e => setForm(f => ({ ...f, conselho: e.target.value }))} />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setForm(formVazio); }} className="btn-secondary flex-1">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors disabled:opacity-50">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  {saving ? 'Criando...' : 'Criar Colaborador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
