import React, { useEffect, useState, useRef } from 'react'
import { Save, UploadCloud, MapPin, Building, Hash, Phone, Mail, Globe, Loader2, Clock, AlertCircle } from 'lucide-react'
import { useToast } from '../../hooks/useToast'
import { supabase } from '../../lib/supabase'
import { StorageHelpers } from '../../lib/storage'
import { useAuthStore } from '../../store/authStore'

interface ClinicaForm {
  nome: string
  cnpj: string
  cro: string
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  telefone: string
  whatsapp: string
  email: string
  site: string
  horario_inicio: string
  horario_fim: string
  dias_funcionamento: string[]
}

const FORM_VAZIO: ClinicaForm = {
  nome: '', cnpj: '', cro: '', cep: '', logradouro: '',
  numero: '', complemento: '', bairro: '', cidade: '',
  telefone: '', whatsapp: '', email: '', site: '',
  horario_inicio: '08:00', horario_fim: '18:00',
  dias_funcionamento: ['seg', 'ter', 'qua', 'qui', 'sex'],
}

const DIAS = [
  { key: 'seg', label: 'Seg' },
  { key: 'ter', label: 'Ter' },
  { key: 'qua', label: 'Qua' },
  { key: 'qui', label: 'Qui' },
  { key: 'sex', label: 'Sex' },
  { key: 'sab', label: 'Sáb' },
  { key: 'dom', label: 'Dom' },
]

// ── Máscaras ────────────────────────────────────────────
function maskCNPJ(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 14)
  return d.replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

function maskCEP(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 8)
  return d.replace(/^(\d{5})(\d)/, '$1-$2')
}

function maskPhone(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 10) return d.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
  return d.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2')
}

const INPUT = "w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"

export function ClinicaPage() {
  const { toast } = useToast()
  const { user } = useAuthStore()
  const clinicaId = user?.clinicaId

  const [form, setForm] = useState<ClinicaForm>(FORM_VAZIO)
  const [savedForm, setSavedForm] = useState<ClinicaForm>(FORM_VAZIO)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [cepLoading, setCepLoading] = useState(false)
  const cepRef = useRef<string>('')

  const hasChanges = JSON.stringify(form) !== JSON.stringify(savedForm)

  // ── Carregar dados reais do banco
  useEffect(() => {
    if (!clinicaId) return
    supabase
      .from('clinicas')
      .select('*')
      .eq('id', clinicaId)
      .single()
      .then(({ data, error }) => {
        if (error) {
          toast({ title: 'Erro ao carregar dados', description: error.message, type: 'error' })
          setIsLoading(false)
          return
        }
        if (data) {
          const c = data as any
          const conf = c.configuracoes ?? {}
          const ovyva = conf.ovyva ?? {}
          const horario = c.horario_funcionamento ?? {}
          const loaded: ClinicaForm = {
            nome: c.nome ?? '',
            cnpj: c.cnpj ?? '',
            cro: c.cro ?? '',
            cep: c.endereco?.cep ?? '',
            logradouro: c.endereco?.logradouro ?? '',
            numero: c.endereco?.numero ?? '',
            complemento: c.endereco?.complemento ?? '',
            bairro: c.endereco?.bairro ?? '',
            cidade: c.endereco?.cidade ?? '',
            telefone: c.telefone ?? '',
            whatsapp: c.whatsapp ?? '',
            email: c.email ?? '',
            site: c.site ?? '',
            horario_inicio: ovyva.horario_inicio ?? horario.inicio ?? '08:00',
            horario_fim: ovyva.horario_fim ?? horario.fim ?? '18:00',
            dias_funcionamento: horario.dias ?? ['seg', 'ter', 'qua', 'qui', 'sex'],
          }
          setForm(loaded)
          setSavedForm(loaded)
          if (conf.logo_url) setLogoUrl(conf.logo_url)
        }
        setIsLoading(false)
      })
  }, [clinicaId, toast])

  const update = (field: keyof ClinicaForm, val: string | string[]) =>
    setForm(prev => ({ ...prev, [field]: val }))

  // ── Busca CEP automática
  const handleCepChange = async (val: string) => {
    const masked = maskCEP(val)
    update('cep', masked)
    const digits = masked.replace(/\D/g, '')
    if (digits.length === 8 && digits !== cepRef.current) {
      cepRef.current = digits
      setCepLoading(true)
      try {
        const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
        const data = await res.json()
        if (!data.erro) {
          setForm(prev => ({
            ...prev,
            logradouro: data.logradouro || prev.logradouro,
            bairro: data.bairro || prev.bairro,
            cidade: `${data.localidade}/${data.uf}` || prev.cidade,
            complemento: data.complemento || prev.complemento,
          }))
        }
      } catch { /* silencioso */ }
      setCepLoading(false)
    }
  }

  const toggleDia = (dia: string) => {
    const dias = form.dias_funcionamento.includes(dia)
      ? form.dias_funcionamento.filter(d => d !== dia)
      : [...form.dias_funcionamento, dia]
    update('dias_funcionamento', dias)
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !clinicaId) return
    const file = e.target.files[0]
    try {
      setIsUploading(true)
      const stored = await StorageHelpers.uploadLogo(clinicaId, file)
      const { data: clinica } = await supabase.from('clinicas').select('configuracoes').eq('id', clinicaId).single()
      const confAtual = (clinica?.configuracoes as any) ?? {}
      await supabase.from('clinicas').update({
        configuracoes: { ...confAtual, logo_url: stored.url }
      }).eq('id', clinicaId)
      setLogoUrl(stored.url)
      toast({ title: 'Sucesso', description: 'Logo atualizada com sucesso.', type: 'success' })
    } catch (err: any) {
      toast({ title: 'Erro de upload', description: err.message, type: 'error' })
    } finally {
      setIsUploading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clinicaId) return
    setIsSaving(true)
    try {
      // Buscar configuracoes atuais para merge
      const { data: clinica } = await supabase.from('clinicas').select('configuracoes').eq('id', clinicaId).single()
      const confAtual = (clinica?.configuracoes as any) ?? {}

      const { error } = await supabase
        .from('clinicas')
        .update({
          nome: form.nome,
          cnpj: form.cnpj.replace(/\D/g, ''),
          cro: form.cro,
          telefone: form.telefone.replace(/\D/g, ''),
          whatsapp: form.whatsapp.replace(/\D/g, ''),
          email: form.email,
          site: form.site,
          endereco: {
            cep: form.cep.replace(/\D/g, ''),
            logradouro: form.logradouro,
            numero: form.numero,
            complemento: form.complemento,
            bairro: form.bairro,
            cidade: form.cidade,
          },
          horario_funcionamento: {
            inicio: form.horario_inicio,
            fim: form.horario_fim,
            dias: form.dias_funcionamento,
          },
          configuracoes: {
            ...confAtual,
            ovyva: {
              ...(confAtual.ovyva ?? {}),
              horario_inicio: form.horario_inicio,
              horario_fim: form.horario_fim,
            },
          },
        })
        .eq('id', clinicaId)

      if (error) throw error
      setSavedForm({ ...form })
      toast({ title: 'Dados salvos!', description: 'Informações da clínica atualizadas com sucesso.', type: 'success' })
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, type: 'error' })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Building className="text-indigo-600" />
          Dados da Clínica
        </h2>
        {hasChanges && (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
            <AlertCircle size={14} /> Alterações não salvas
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Logo + Identidade */}
        <div className="flex gap-8 items-start border-b border-slate-100 pb-8">
          <div className="shrink-0 flex flex-col items-center gap-3">
            <label className="relative w-32 h-32 rounded-full overflow-hidden bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-400 hover:text-indigo-600 transition-colors cursor-pointer group">
               <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={isUploading || !clinicaId} />
               {isUploading ? (
                 <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
               ) : logoUrl ? (
                 <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
               ) : (
                 <>
                   <UploadCloud size={32} className="mb-2 group-hover:-translate-y-1 transition-transform" />
                   <span className="text-xs font-bold text-center px-4 leading-tight">Upload Logo</span>
                 </>
               )}
            </label>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Circular (JPG/PNG)</span>
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Razão Social / Nome da Clínica <span className="text-red-400">*</span></label>
              <input type="text" value={form.nome} onChange={e => update('nome', e.target.value)}
                className={INPUT} required placeholder="Ex: Clínica Saúde & Estética" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5"><Hash size={14}/> CNPJ</label>
                <input type="text" value={maskCNPJ(form.cnpj)} onChange={e => update('cnpj', e.target.value)}
                  className={INPUT} placeholder="00.000.000/0000-00" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5"><Hash size={14}/> CRM/CRO Responsável</label>
                <input type="text" value={form.cro} onChange={e => update('cro', e.target.value)}
                  className={INPUT} placeholder="CRO-MG 12345" />
              </div>
            </div>
          </div>
        </div>

        {/* Horário de Funcionamento */}
        <div className="border-b border-slate-100 pb-8 space-y-4">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2"><Clock size={18} className="text-indigo-500"/> Horário de Funcionamento</h3>
          <div className="flex flex-wrap gap-2">
            {DIAS.map(({ key, label }) => (
              <button key={key} type="button" onClick={() => toggleDia(key)}
                className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-all ${
                  form.dias_funcionamento.includes(key)
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-slate-600'
                }`}>
                {label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4 max-w-sm">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Abertura</label>
              <input type="time" value={form.horario_inicio} onChange={e => update('horario_inicio', e.target.value)}
                className={INPUT} />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Fechamento</label>
              <input type="time" value={form.horario_fim} onChange={e => update('horario_fim', e.target.value)}
                className={INPUT} />
            </div>
          </div>
          <p className="text-xs text-slate-400">Usado pela OVYVA (IA) para sugerir horários de agendamento aos pacientes.</p>
        </div>

        {/* Endereço */}
        <div className="border-b border-slate-100 pb-8 space-y-4">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2"><MapPin size={18} className="text-indigo-500"/> Localização</h3>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">CEP</label>
              <div className="relative">
                <input type="text" value={form.cep} onChange={e => handleCepChange(e.target.value)}
                  className={INPUT} placeholder="00000-000" />
                {cepLoading && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-indigo-400" />}
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">Logradouro / Rua</label>
              <input type="text" value={form.logradouro} onChange={e => update('logradouro', e.target.value)}
                className={INPUT} placeholder="Rua das Flores" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Número</label>
              <input type="text" value={form.numero} onChange={e => update('numero', e.target.value)}
                className={INPUT} placeholder="123" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Complemento</label>
              <input type="text" value={form.complemento} onChange={e => update('complemento', e.target.value)}
                className={INPUT} placeholder="Sala 01" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Bairro</label>
              <input type="text" value={form.bairro} onChange={e => update('bairro', e.target.value)}
                className={INPUT} placeholder="Centro" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Cidade/UF</label>
              <input type="text" value={form.cidade} onChange={e => update('cidade', e.target.value)}
                className={INPUT} placeholder="Belo Horizonte/MG" />
            </div>
          </div>
        </div>

        {/* Contato */}
        <div className="border-b border-slate-100 pb-8 space-y-4">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2"><Phone size={18} className="text-indigo-500"/> Contato Oficial</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Telefone Principal</label>
              <input type="tel" value={maskPhone(form.telefone)} onChange={e => update('telefone', e.target.value)}
                className={INPUT} placeholder="(31) 3333-4444" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">WhatsApp de Atendimento</label>
              <input type="tel" value={maskPhone(form.whatsapp)} onChange={e => update('whatsapp', e.target.value)}
                className={INPUT} placeholder="(31) 99999-8888" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5"><Mail size={14} /> E-mail Público</label>
              <input type="email" value={form.email} onChange={e => update('email', e.target.value)}
                className={INPUT} placeholder="contato@clinica.com.br" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5"><Globe size={14} /> Site ou Instagram</label>
              <input type="text" value={form.site} onChange={e => update('site', e.target.value)}
                className={INPUT} placeholder="@clinica ou www.clinica.com.br" />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button type="submit" disabled={isSaving || !hasChanges}
            className="flex items-center gap-2 px-8 py-3 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0">
            {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20}/>}
            {isSaving ? 'Salvando...' : 'Salvar Dados'}
          </button>
        </div>
      </form>
    </div>
  )
}
