import React, { useEffect, useState } from 'react'
import { Save, UploadCloud, MapPin, Building, Hash, Phone, Mail, Globe, Loader2 } from 'lucide-react'
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
}

const FORM_VAZIO: ClinicaForm = {
  nome: '', cnpj: '', cro: '', cep: '', logradouro: '',
  numero: '', complemento: '', bairro: '', cidade: '',
  telefone: '', whatsapp: '', email: '', site: '',
}

export function ClinicaPage() {
  const { toast } = useToast()
  const { user } = useAuthStore()
  const clinicaId = user?.clinicaId

  const [form, setForm] = useState<ClinicaForm>(FORM_VAZIO)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

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
          setForm({
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
          })
          if (conf.logo_url) setLogoUrl(conf.logo_url)
        }
        setIsLoading(false)
      })
  }, [clinicaId, toast])

  const update = (field: keyof ClinicaForm, val: string) =>
    setForm(prev => ({ ...prev, [field]: val }))

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !clinicaId) return
    const file = e.target.files[0]
    try {
      setIsUploading(true)
      const stored = await StorageHelpers.uploadLogo(clinicaId, file)
      // Merge com configuracoes existentes
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
    if (!clinicaId) {
      toast({ title: 'Erro', description: 'Clínica não identificada.', type: 'error' })
      return
    }
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('clinicas')
        .update({
          nome: form.nome,
          cnpj: form.cnpj,
          cro: form.cro,
          telefone: form.telefone,
          whatsapp: form.whatsapp,
          email: form.email,
          site: form.site,
          endereco: {
            cep: form.cep,
            logradouro: form.logradouro,
            numero: form.numero,
            complemento: form.complemento,
            bairro: form.bairro,
            cidade: form.cidade,
          }
        })
        .eq('id', clinicaId)

      if (error) throw error
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
      <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
         <Building className="text-indigo-600" />
         Dados da Clínica
      </h2>
      
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
          <div className="flex-1 grid grid-cols-1 md: gap-6">
            <div className="col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">Razão Social / Nome da Clínica</label>
              <input type="text" value={form.nome} onChange={e => update('nome', e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5"><Hash size={16}/> CNPJ</label>
              <input type="text" value={form.cnpj} onChange={e => update('cnpj', e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5"><Hash size={16}/> CRM/CRO Responsável</label>
              <input type="text" value={form.cro} onChange={e => update('cro', e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>
        </div>

        {/* Endereço */}
        <div className="grid grid-cols-1 md: gap-6 border-b border-slate-100 pb-8">
           <h3 className="col-span-4 text-base font-bold text-slate-800 flex items-center gap-2"><MapPin size={18} className="text-indigo-500"/> Localização</h3>
           <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">CEP</label>
              <input type="text" value={form.cep} onChange={e => update('cep', e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 outline-none" />
           </div>
           <div className="col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">Logradouro / Rua</label>
              <input type="text" value={form.logradouro} onChange={e => update('logradouro', e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 outline-none" />
           </div>
           <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Número</label>
              <input type="text" value={form.numero} onChange={e => update('numero', e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 outline-none" />
           </div>
           <div className="col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">Complemento</label>
              <input type="text" value={form.complemento} onChange={e => update('complemento', e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 outline-none" />
           </div>
           <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Bairro</label>
              <input type="text" value={form.bairro} onChange={e => update('bairro', e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 outline-none" />
           </div>
           <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Cidade/UF</label>
              <input type="text" value={form.cidade} onChange={e => update('cidade', e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 outline-none" />
           </div>
        </div>

        {/* Contato */}
        <div className="grid grid-cols-1 md: gap-6 border-b border-slate-100 pb-8">
           <h3 className="col-span-2 text-base font-bold text-slate-800 flex items-center gap-2"><Phone size={18} className="text-indigo-500"/> Contato Oficial</h3>
           <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Telefone Principal</label>
              <input type="tel" value={form.telefone} onChange={e => update('telefone', e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 outline-none" />
           </div>
           <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">WhatsApp de Atendimento</label>
              <input type="tel" value={form.whatsapp} onChange={e => update('whatsapp', e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 outline-none" />
           </div>
           <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5"><Mail size={16} /> E-mail Público</label>
              <input type="email" value={form.email} onChange={e => update('email', e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 outline-none" />
           </div>
           <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5"><Globe size={16} /> Site ou Instagram</label>
              <input type="url" value={form.site} onChange={e => update('site', e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 outline-none" />
           </div>
        </div>
        
        <div className="flex justify-end pt-4">
           <button type="submit" disabled={isSaving}
             className="flex items-center gap-2 px-8 py-3 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5 disabled:opacity-50">
             {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20}/>}
             {isSaving ? 'Salvando...' : 'Salvar Dados'}
           </button>
        </div>
      </form>
    </div>
  )
}
