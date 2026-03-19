import React, { useState } from 'react'
import { X, Loader2, Hospital } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSuperAdmin } from '../../hooks/useSuperAdmin'

const schema = z.object({
  nome: z.string().min(3, 'Nome muito curto'),
  cnpj: z.string().optional(),
  email: z.string().email('E-mail inválido'),
  plano: z.enum(['Básico', 'Pro', 'Premium', 'Trial'])
})

type FormValues = z.infer<typeof schema>

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function NovaClinicaModal({ isOpen, onClose, onSuccess }: Props) {
  const { createClinic } = useSuperAdmin()
  const [submitting, setSubmitting] = useState(false)
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { plano: 'Trial' }
  })

  if (!isOpen) return null

  const onSubmit = async (data: FormValues) => {
    setSubmitting(true)
    const res = await createClinic(data)
    setSubmitting(false)
    if (res) {
      reset()
      onSuccess()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0F172A]/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#1E293B] border border-slate-800 rounded-3xl shadow-2xl p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
              <Hospital size={20} />
            </div>
            <h2 className="text-xl font-black text-white uppercase tracking-wider">Nova Clínica</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white bg-slate-800/50 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-2">Nome Oficial</label>
            <input 
              {...register('nome')} 
              className="w-full bg-[#0F172A] border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              placeholder="Ex: Clínica Sorriso"
            />
            {errors.nome && <p className="text-red-400 text-xs mt-1">{errors.nome.message}</p>}
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-2">CNPJ (Opcional)</label>
            <input 
              {...register('cnpj')} 
              className="w-full bg-[#0F172A] border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              placeholder="00.000.000/0000-00"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-2">E-mail do Responsável</label>
            <input 
              {...register('email')} 
              className="w-full bg-[#0F172A] border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              placeholder="admin@clinica.com"
            />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-2">Plano Atual</label>
            <select 
              {...register('plano')} 
              className="w-full bg-[#0F172A] border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
            >
              <option value="Trial">Trial (Grátis)</option>
              <option value="Básico">Básico</option>
              <option value="Pro">Pro</option>
              <option value="Premium">Premium</option>
            </select>
          </div>

          <button 
            type="submit" 
            disabled={submitting}
            className="w-full py-4 mt-6 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? <Loader2 size={20} className="animate-spin" /> : 'CRIAR E ABRIR AMBIENTE'}
          </button>
        </form>
      </div>
    </div>
  )
}
