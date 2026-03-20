import React, { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { cn } from '../../lib/utils'
import { useVerdesk } from '../../hooks/useVerdesk'
import type { LeadStage, LeadOrigin } from '../../types/verdesk'

const leadSchema = z.object({
  name: z.string().min(3, 'Nome muito curto'),
  phone: z.string().min(10, 'Telefone inválido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  origin: z.enum(['Instagram', 'Facebook', 'WhatsApp', 'Site', 'Indicação', 'Manual']),
  procedure: z.string().min(2, 'Informe o procedimento de interesse'),
  estimatedValue: z.number().min(0).optional(),
  stage: z.enum(['Perguntou Valor', 'Demonstrou Interesse', 'Quase Fechando', 'Agendado', 'Perdido'])
})

type FormValues = z.infer<typeof leadSchema>

interface NovoLeadModalProps {
  isOpen: boolean
  onClose: () => void
}

export function NovoLeadModal({ isOpen, onClose }: NovoLeadModalProps) {
  const { createLead } = useVerdesk()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      origin: 'WhatsApp',
      stage: 'Perguntou Valor',
      estimatedValue: 0,
      procedure: ''
    }
  })

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    try {
      await createLead({
        name: data.name,
        phone: data.phone,
        email: data.email || undefined,
        origin: data.origin,
        procedure: data.procedure,
        estimatedValue: data.estimatedValue || 0,
        stage: data.stage
      })
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Novo Lead</h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <div className="space-y-4">
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Nome / Lead</label>
              <input 
                {...register('name')}
                className={cn('input-base', errors.name && 'border-red-400')}
                placeholder="Ex: Carlos Santos"
              />
              {errors.name && <span className="text-xs text-red-500 font-medium">{errors.name.message}</span>}
            </div>

            <div className="grid grid-cols-1 md: gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Telefone / WhatsApp</label>
                <input 
                  {...register('phone')}
                  className={cn('input-base', errors.phone && 'border-red-400')}
                  placeholder="11999999999"
                />
                 {errors.phone && <span className="text-xs text-red-500 font-medium">{errors.phone.message}</span>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Origem</label>
                <select 
                  {...register('origin')}
                  className="input-base"
                >
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Facebook">Facebook</option>
                  <option value="Site">Site</option>
                  <option value="Indicação">Indicação</option>
                  <option value="Manual">Outro (Manual)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">E-mail (opcional)</label>
              <input 
                {...register('email')}
                className={cn('input-base', errors.email && 'border-red-400')}
                placeholder="email@exemplo.com"
                type="email"
              />
            </div>
            
            <div className="grid grid-cols-1 md: gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Em que ele tem interesse?</label>
                <input 
                  {...register('procedure')}
                  className={cn('input-base', errors.procedure && 'border-red-400')}
                  placeholder="Ex: Implante"
                />
                 {errors.procedure && <span className="text-xs text-red-500 font-medium">{errors.procedure.message}</span>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Valor Estimado (R$)</label>
                <input 
                  type="number"
                  step="0.01"
                  {...register('estimatedValue', { valueAsNumber: true })}
                  className={cn('input-base', errors.estimatedValue && 'border-red-400')}
                  placeholder="0.00"
                />
              </div>
            </div>

             <div className="space-y-1 hidden">
                <input type="hidden" {...register('stage')} value="Perguntou Valor" />
             </div>

          </div>

          <div className="mt-8 flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex-1 btn-primary"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Criar Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
