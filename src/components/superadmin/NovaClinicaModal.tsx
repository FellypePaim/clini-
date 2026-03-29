import React, { useState } from 'react'
import { X, Loader2, Hospital } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSuperAdmin } from '../../hooks/useSuperAdmin'

const schema = z.object({
  nome: z.string().min(3, 'Nome muito curto'),
  cnpj: z.string().optional(),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
  plano: z.enum(['Básico', 'Pro', 'Premium', 'Trial']),
  nome_admin: z.string().min(2, 'Nome do admin é obrigatório'),
  email_admin: z.string().email('E-mail inválido'),
  senha_admin: z.string().min(6, 'Mínimo 6 caracteres'),
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
      <div className="relative w-full max-w-lg bg-[#1E293B] border border-slate-800 rounded-3xl shadow-2xl p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
              <Hospital size={20} />
            </div>
            <h2 className="text-xl font-black text-white uppercase tracking-wider">Nova Clínica</h2>
          </div>
          <button onClick={onClose} className="p-2 text-[var(--color-text-muted)] hover:text-white bg-slate-800/50 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Dados da Clínica */}
          <p className="text-[10px] font-black uppercase text-[var(--color-text-secondary)] tracking-widest flex items-center gap-2">
            <Hospital size={12} /> Dados da Clínica
          </p>

          <div>
            <label className="text-[10px] font-black uppercase text-[var(--color-text-muted)] tracking-widest block mb-1.5">Nome Oficial *</label>
            <input
              {...register('nome')}
              className="w-full bg-[#0F172A] border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
              placeholder="Ex: Clínica Sorriso"
            />
            {errors.nome && <p className="text-red-400 text-xs mt-1">{errors.nome.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase text-[var(--color-text-muted)] tracking-widest block mb-1.5">CNPJ</label>
              <input
                {...register('cnpj')}
                className="w-full bg-[#0F172A] border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
                placeholder="00.000.000/0000-00"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-[var(--color-text-muted)] tracking-widest block mb-1.5">Telefone</label>
              <input
                {...register('telefone')}
                className="w-full bg-[#0F172A] border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-[var(--color-text-muted)] tracking-widest block mb-1.5">Endereço</label>
            <input
              {...register('endereco')}
              className="w-full bg-[#0F172A] border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
              placeholder="Rua, número, bairro, cidade"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-[var(--color-text-muted)] tracking-widest block mb-1.5">Plano</label>
            <select
              {...register('plano')}
              className="w-full bg-[#0F172A] border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
            >
              <option value="Trial">Trial (Grátis)</option>
              <option value="Básico">Básico</option>
              <option value="Pro">Pro</option>
              <option value="Premium">Premium</option>
            </select>
          </div>

          {/* Dados do Admin */}
          <div className="pt-2 border-t border-slate-800">
            <p className="text-[10px] font-black uppercase text-[var(--color-text-secondary)] tracking-widest flex items-center gap-2 mb-3">
              <Hospital size={12} /> Administrador da Clínica
            </p>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-[var(--color-text-muted)] tracking-widest block mb-1.5">Nome do Admin *</label>
            <input
              {...register('nome_admin')}
              className="w-full bg-[#0F172A] border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
              placeholder="Nome completo do administrador"
            />
            {errors.nome_admin && <p className="text-red-400 text-xs mt-1">{errors.nome_admin.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase text-[var(--color-text-muted)] tracking-widest block mb-1.5">E-mail do Admin *</label>
              <input
                {...register('email_admin')}
                className="w-full bg-[#0F172A] border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
                placeholder="admin@clinica.com"
              />
              {errors.email_admin && <p className="text-red-400 text-xs mt-1">{errors.email_admin.message}</p>}
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-[var(--color-text-muted)] tracking-widest block mb-1.5">Senha *</label>
              <input
                type="password"
                {...register('senha_admin')}
                className="w-full bg-[#0F172A] border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
                placeholder="Min. 6 caracteres"
              />
              {errors.senha_admin && <p className="text-red-400 text-xs mt-1">{errors.senha_admin.message}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 mt-4 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : 'CRIAR CLÍNICA + ADMIN'}
          </button>
        </form>
      </div>
    </div>
  )
}
