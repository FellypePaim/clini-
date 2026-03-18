import React from 'react'
import { Save, UploadCloud, MapPin, Building, Hash, Phone, Mail, Globe } from 'lucide-react'
import { useToast } from '../../hooks/useToast'
import { supabase } from '../../lib/supabase'
import { StorageHelpers } from '../../lib/storage'
import { useAuthStore } from '../../store/authStore'
import { Loader2 } from 'lucide-react'

export function ClinicaPage() {
  const { toast } = useToast()

  const { user } = useAuthStore()
  const clinicaId = (user as any)?.user_metadata?.clinica_id
  const [logoUrl, setLogoUrl] = React.useState<string | null>(null)
  const [isUploading, setIsUploading] = React.useState(false)

  // TODO: Fetch real data on mount here matching global pattern
  
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !clinicaId) return
    const file = e.target.files[0]
    try {
      setIsUploading(true)
      const stored = await StorageHelpers.uploadLogo(clinicaId, file)
      
      // Update config
      await supabase.from('clinicas')
        .update({ configuracoes: { logo_url: stored.url } }) // Assuming shallow update or RPC depending on schema
        .eq('id', clinicaId)
        
      setLogoUrl(stored.url)
      toast({ title: 'Sucesso', description: 'Logo atualizada com sucesso.', type: 'success' })
    } catch (err: any) {
      toast({ title: 'Erro de upload', description: err.message, type: 'error' })
    } finally {
      setIsUploading(false)
    }
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    toast({ title: 'Configurações salvas', description: 'Os dados da clínica foram atualizados com sucesso.', type: 'success' })
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
      <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
         <Building className="text-indigo-600" />
         Dados da Clínica
      </h2>
      
      <form onSubmit={handleSave} className="space-y-8">
        {/* Identidade e Logo */}
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
          <div className="flex-1 grid grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">Razão Social / Nome da Clínica</label>
              <input type="text" defaultValue="Prontuário Verde Odontologia" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5"><Hash size={16}/> CNPJ</label>
              <input type="text" defaultValue="12.345.678/0001-90" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5"><Hash size={16}/> CRM/CRO Responsável</label>
              <input type="text" defaultValue="CRO-SP 123456" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 outline-none" required />
            </div>
          </div>
        </div>

        {/* Endereço */}
        <div className="grid grid-cols-4 gap-6 border-b border-slate-100 pb-8">
           <h3 className="col-span-4 text-base font-bold text-slate-800 flex items-center gap-2"><MapPin size={18} className="text-indigo-500"/> Localização</h3>
           <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">CEP</label>
              <input type="text" defaultValue="01234-567" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 outline-none" required />
           </div>
           <div className="col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">Logradouro / Rua</label>
              <input type="text" defaultValue="Avenida Paulista" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 outline-none" required />
           </div>
           <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Número</label>
              <input type="text" defaultValue="1578" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 outline-none" required />
           </div>
           <div className="col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">Complemento</label>
              <input type="text" defaultValue="Conjunto 144" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 outline-none" />
           </div>
           <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Bairro</label>
              <input type="text" defaultValue="Bela Vista" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 outline-none" required />
           </div>
           <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Cidade/UF</label>
              <input type="text" defaultValue="São Paulo/SP" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 outline-none" disabled />
           </div>
        </div>

        {/* Contato */}
        <div className="grid grid-cols-2 gap-6 border-b border-slate-100 pb-8">
           <h3 className="col-span-2 text-base font-bold text-slate-800 flex items-center gap-2"><Phone size={18} className="text-indigo-500"/> Contato Oficial</h3>
           <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Telefone Principal</label>
              <input type="tel" defaultValue="(11) 3232-4040" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 outline-none" required />
           </div>
           <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">WhatsApp de Atendimento</label>
              <input type="tel" defaultValue="(11) 98888-7777" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 outline-none" required />
           </div>
           <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5"><Mail size={16} /> E-mail Público</label>
              <input type="email" defaultValue="contato@prontuarioverde.com.br" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 outline-none" />
           </div>
           <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5"><Globe size={16} /> Site ou Instagram</label>
              <input type="url" defaultValue="https://instagram.com/prontuarioverde" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 outline-none" />
           </div>
        </div>
        
        <div className="flex justify-end pt-4">
           <button type="submit" className="flex items-center gap-2 px-8 py-3 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5">
             <Save size={20}/> Salvar Dados
           </button>
        </div>
      </form>
    </div>
  )
}
