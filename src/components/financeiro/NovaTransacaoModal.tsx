import React, { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useFinanceiro } from '../../hooks/useFinanceiro'
import { cn } from '../../lib/utils'

const transactionSchema = z.object({
  descricao: z.string().min(3, 'Descrição muito curta'),
  valor: z.number().min(0.01, 'Valor inválido'),
  tipo: z.enum(['receita', 'despesa']),
  status: z.enum(['pago', 'pendente', 'cancelado']),
  dataConsolidacao: z.string(),
  formaPagamento: z.string().optional(),
  categoriaId: z.string().optional()
})

type FormValues = z.infer<typeof transactionSchema>

interface NovaTransacaoModalProps {
  isOpen: boolean
  onClose: () => void
}

export function NovaTransacaoModal({ isOpen, onClose }: NovaTransacaoModalProps) {
  const { createLancamento } = useFinanceiro()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      tipo: 'receita',
      status: 'pago',
      dataConsolidacao: new Date().toISOString().split('T')[0]
    }
  })

  const tipo = watch('tipo')

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    try {
      await createLancamento({
        descricao: data.descricao,
        valor: data.valor,
        tipo: data.tipo,
        status: data.status,
        categoria: data.categoriaId || 'Geral',
        data_competencia: data.dataConsolidacao,
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
      
      <div className="relative bg-[var(--color-bg-card)] rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Nova Transação</h2>
          <button 
            onClick={onClose}
            className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-card)] rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <div className="space-y-4">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase">Tipo</label>
                <select 
                  {...register('tipo')}
                  className="input-base"
                >
                  <option value="receita">Receita</option>
                  <option value="despesa">Despesa</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase">Status</label>
                <select 
                  {...register('status')}
                  className="input-base"
                >
                  <option value="pago">Pago / Recebido</option>
                  <option value="pendente">Pendente</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase">Descrição</label>
              <input 
                {...register('descricao')}
                className={cn('input-base', errors.descricao && 'border-red-400')}
                placeholder="Ex: Consulta Particular, Compra de Materiais..."
              />
              {errors.descricao && <span className="text-xs text-red-500 font-medium">{errors.descricao.message}</span>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase">Valor Máximo (R$)</label>
                <input 
                  type="number"
                  step="0.01"
                  {...register('valor', { valueAsNumber: true })}
                  className={cn('input-base', errors.valor && 'border-red-400')}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase">Data</label>
                <input 
                  type="date"
                  {...register('dataConsolidacao')}
                  className="input-base"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase">Categoria</label>
              <select
                {...register('categoriaId')}
                className="input-base"
              >
                <option value="">Selecione uma categoria...</option>
                {tipo === 'receita' ? (
                  <>
                    <option value="Consulta">Consulta</option>
                    <option value="Procedimento">Procedimento</option>
                    <option value="Retorno">Retorno</option>
                    <option value="Convênio">Convênio</option>
                    <option value="Outros">Outros</option>
                  </>
                ) : (
                  <>
                    <option value="Fornecedor">Fornecedor</option>
                    <option value="Aluguel">Aluguel</option>
                    <option value="Salários">Salários</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Equipamentos">Equipamentos</option>
                    <option value="Outros">Outros</option>
                  </>
                )}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase">Forma de Pagamento</label>
              <select 
                {...register('formaPagamento')}
                className="input-base"
              >
                <option value="">Selecione a forma...</option>
                <option value="pix">PIX</option>
                <option value="cartao_credito">Cartão de Crédito</option>
                <option value="cartao_debito">Cartão de Débito</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="boleto">Boleto</option>
                <option value="transferencia">Transferência</option>
              </select>
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
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Salvar Transação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
