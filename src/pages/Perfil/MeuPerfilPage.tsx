import { useState, useEffect } from 'react'
import { User, Mail, Building2, Shield, Briefcase, Hash, Calendar, Loader2, Save, Camera } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'

const ROLE_LABELS: Record<string, string> = {
  administrador: 'Administrador',
  profissional: 'Profissional',
  'recepção': 'Recepção',
  superadmin: 'SuperAdmin',
}

export function MeuPerfilPage() {
  const { user, setUser } = useAuthStore()
  const [form, setForm] = useState({
    nome_completo: '',
    email: '',
    especialidade: '',
    conselho: '',
    telefone: '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    loadProfile()
  }, [user?.id])

  async function loadProfile() {
    if (!user) return
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (data) {
      setForm({
        nome_completo: data.nome_completo || '',
        email: data.email || '',
        especialidade: data.especialidade || '',
        conselho: data.conselho || '',
        telefone: data.telefone || '',
      })
      setAvatarUrl(data.avatar_url || null)
    }
  }

  async function handleSave() {
    if (!user || saving) return
    setSaving(true)
    setSaved(false)
    const { error } = await supabase.from('profiles')
      .update({
        nome_completo: form.nome_completo,
        especialidade: form.especialidade || null,
        conselho: form.conselho || null,
        telefone: form.telefone || null,
      })
      .eq('id', user.id)

    if (!error) {
      setSaved(true)
      setUser({ ...user, nome: form.nome_completo, especialidade: form.especialidade || undefined })
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    if (!file.type.startsWith('image/') || file.size > 2 * 1024 * 1024) return

    setAvatarUploading(true)
    const ext = file.name.split('.').pop() || 'png'
    const path = `avatars/${user.id}.${ext}`

    const { error: upErr } = await supabase.storage
      .from('clinica-assets')
      .upload(path, file, { contentType: file.type, upsert: true })

    if (!upErr) {
      const { data } = supabase.storage.from('clinica-assets').getPublicUrl(path)
      const url = data.publicUrl + '?t=' + Date.now()
      await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id)
      setAvatarUrl(url)
      setUser({ ...user, avatar: url })
    }
    setAvatarUploading(false)
  }

  if (!user) return null

  const initials = user.nome
    ?.split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase() || '?'

  return (
    <div className="max-w-2xl mx-auto py-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-1">Meu Perfil</h1>
      <p className="text-sm text-[var(--color-text-muted)] mb-6">Gerencie suas informacoes pessoais.</p>

      {/* Avatar Section */}
      <div className="rounded-2xl border border-[var(--color-border)] p-6 mb-6" style={{ background: 'var(--color-bg-card)' }}>
        <div className="flex items-center gap-5">
          <div className="relative group">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-20 h-20 rounded-2xl object-cover" />
            ) : (
              <div className="w-20 h-20 bg-gradient-to-br from-cyan-600 to-indigo-500 rounded-2xl flex items-center justify-center">
                <span className="text-2xl font-bold text-white">{initials}</span>
              </div>
            )}
            <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
              {avatarUploading ? (
                <Loader2 size={20} className="text-white animate-spin" />
              ) : (
                <Camera size={20} className="text-white" />
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </label>
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">{user.nome}</h2>
            <p className="text-sm text-[var(--color-text-muted)]">{user.email}</p>
            <span className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-500 ring-1 ring-inset ring-cyan-500/20">
              <Shield size={11} />
              {ROLE_LABELS[user.role] || user.role}
            </span>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-2xl border border-[var(--color-border)] p-6 space-y-5" style={{ background: 'var(--color-bg-card)' }}>
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
            <User size={14} /> Nome Completo
          </label>
          <input
            type="text"
            value={form.nome_completo}
            onChange={(e) => setForm((f) => ({ ...f, nome_completo: e.target.value }))}
            className="w-full px-4 py-2.5 border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 placeholder:text-[var(--color-text-muted)] transition-all"
            style={{ background: 'var(--color-bg-deep)' }}
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
            <Mail size={14} /> E-mail
          </label>
          <input
            type="email"
            value={form.email}
            disabled
            className="w-full px-4 py-2.5 border border-[var(--color-border)] text-[var(--color-text-muted)] text-sm rounded-xl outline-none cursor-not-allowed opacity-60"
            style={{ background: 'var(--color-bg-deep)' }}
          />
          <p className="text-[11px] text-[var(--color-text-dim)] mt-1">O e-mail nao pode ser alterado.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
              <Briefcase size={14} /> Especialidade
            </label>
            <input
              type="text"
              value={form.especialidade}
              onChange={(e) => setForm((f) => ({ ...f, especialidade: e.target.value }))}
              placeholder="Ex: Dermatologia"
              className="w-full px-4 py-2.5 border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 placeholder:text-[var(--color-text-muted)] transition-all"
              style={{ background: 'var(--color-bg-deep)' }}
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
              <Hash size={14} /> Conselho (CRM/CRO)
            </label>
            <input
              type="text"
              value={form.conselho}
              onChange={(e) => setForm((f) => ({ ...f, conselho: e.target.value }))}
              placeholder="Ex: CRM/SP 123456"
              className="w-full px-4 py-2.5 border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 placeholder:text-[var(--color-text-muted)] transition-all"
              style={{ background: 'var(--color-bg-deep)' }}
            />
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
            <Mail size={14} /> Telefone
          </label>
          <input
            type="text"
            value={form.telefone}
            onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))}
            placeholder="(00) 00000-0000"
            className="w-full px-4 py-2.5 border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 placeholder:text-[var(--color-text-muted)] transition-all"
            style={{ background: 'var(--color-bg-deep)' }}
          />
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="flex items-center gap-3 p-3 rounded-xl border border-[var(--color-border)]" style={{ background: 'var(--color-bg-deep)' }}>
            <Building2 size={16} className="text-[var(--color-text-muted)] shrink-0" />
            <div>
              <p className="text-[11px] text-[var(--color-text-muted)]">Clinica</p>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">{user.clinicaNome || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl border border-[var(--color-border)]" style={{ background: 'var(--color-bg-deep)' }}>
            <Calendar size={16} className="text-[var(--color-text-muted)] shrink-0" />
            <div>
              <p className="text-[11px] text-[var(--color-text-muted)]">Membro desde</p>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">
                {user.criadoEm ? new Date(user.criadoEm).toLocaleDateString('pt-BR') : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {saved && (
            <span className="text-sm text-emerald-500 font-medium">Salvo com sucesso!</span>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !form.nome_completo.trim()}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl transition-colors',
              !saving && form.nome_completo.trim()
                ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                : 'bg-[var(--color-bg-card-hover)] text-[var(--color-text-dim)] cursor-not-allowed',
            )}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}
