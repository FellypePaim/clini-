import { useState, useRef, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  X, CalendarDays, Clock, Stethoscope,
  Repeat, ChevronDown, AlertCircle, Loader2, Search
} from 'lucide-react'
import { cn } from '../../lib/utils'
import type { AppointmentFormData } from '../../types/agenda'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'

interface PacienteOption { id: string; nome: string; telefone: string }
interface ProfissionalOption { id: string; nome: string; especialidade: string }

// ─── Schema de validação ──────────────────────────────
const schema = z.object({
  pacienteId:            z.string().min(1, 'Selecione um paciente'),
  pacienteNome:          z.string().min(1, 'Selecione um paciente'),
  profissionalId:        z.string().min(1, 'Selecione um profissional'),
  data:                  z.string().min(1, 'Informe a data'),
  horaInicio:            z.string().min(1, 'Informe o horário de início'),
  horaFim:               z.string().min(1, 'Informe o horário de término'),
  procedimento:          z.enum(['consulta','retorno','botox','limpeza','ortodontia','exame','cirurgia','outro']),
  status:                z.enum(['agendado','confirmado','em_atendimento','concluido','cancelado','faltou']),
  observacoes:           z.string().optional(),
  valor:                 z.preprocess(v => v === '' || v == null ? undefined : Number(v), z.number().optional()),
  repetir:               z.boolean().default(false),
  recorrenciaTipo:       z.enum(['semanal','quinzenal','mensal']).optional(),
  quantidadeRepeticoes:  z.preprocess(v => v === '' || v == null ? undefined : Number(v), z.number().min(1).max(52).optional()),
}).refine(d => d.horaFim > d.horaInicio, {
  message: 'Término deve ser após o início',
  path: ['horaFim'],
})

type FormValues = z.infer<typeof schema>

const PROCEDIMENTOS = [
  { value: 'consulta',   label: 'Consulta' },
  { value: 'retorno',    label: 'Retorno' },
  { value: 'botox',      label: 'Botox' },
  { value: 'limpeza',    label: 'Limpeza' },
  { value: 'ortodontia', label: 'Ortodontia' },
  { value: 'exame',      label: 'Exame' },
  { value: 'cirurgia',   label: 'Cirurgia' },
  { value: 'outro',      label: 'Outro' },
]

const STATUS_OPTIONS = [
  { value: 'agendado',   label: 'Pendente',   dot: 'bg-yellow-400' },
  { value: 'confirmado', label: 'Confirmado', dot: 'bg-green-500' },
  { value: 'cancelado',  label: 'Cancelado',  dot: 'bg-red-400' },
]

interface AppointmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: AppointmentFormData) => Promise<void>
  initialDate?: string
  initialHour?: string
}

export function AppointmentModal({ isOpen, onClose, onSubmit, initialDate, initialHour }: AppointmentModalProps) {
  const clinicaId = useAuthStore(state => state.user?.clinicaId)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pacienteSearch, setPacienteSearch] = useState('')
  const [showPacienteDropdown, setShowPacienteDropdown] = useState(false)
  const [pacientesFiltrados, setPacientesFiltrados] = useState<PacienteOption[]>([])
  const [profissionais, setProfissionais] = useState<ProfissionalOption[]>([])
  const searchRef = useRef<HTMLDivElement>(null)

  // Carrega profissionais ao montar
  useEffect(() => {
    if (!clinicaId) return
    supabase.from('profiles').select('id, nome_completo, especialidade')
      .eq('clinica_id', clinicaId).eq('role', 'profissional').eq('ativo', true)
      .then(({ data, error }) => {
        if (error) { console.error('Erro ao carregar profissionais:', error.message); return }
        setProfissionais((data || []).map((p: any) => ({ id: p.id, nome: p.nome_completo, especialidade: p.especialidade || '' })))
      })
  }, [clinicaId])

  // Busca pacientes ao digitar
  const searchPacientes = useCallback(async (q: string) => {
    if (!clinicaId || q.length < 2) { setPacientesFiltrados([]); return }
    const { data } = await supabase.from('pacientes').select('id, nome_completo, telefone')
      .eq('clinica_id', clinicaId).ilike('nome_completo', `%${q}%`).limit(6)
    setPacientesFiltrados((data || []).map((p: any) => ({ id: p.id, nome: p.nome_completo, telefone: p.telefone || '' })))
  }, [clinicaId])

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      status: 'agendado',
      procedimento: 'consulta',
      repetir: false,
      recorrenciaTipo: 'semanal',
      quantidadeRepeticoes: 4,
      data: initialDate ?? (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` })(),
      horaInicio: initialHour ?? '08:00',
      horaFim: initialHour ? `${String(parseInt(initialHour.split(':')[0]) + 1).padStart(2,'0')}:00` : '09:00',
    },
  })

  const repetir = watch('repetir')
  const pacienteNomeValue = watch('pacienteNome')

  // Reset ao abrir
  useEffect(() => {
    if (isOpen) {
      reset({
        status: 'agendado',
        procedimento: 'consulta',
        repetir: false,
        recorrenciaTipo: 'semanal',
        quantidadeRepeticoes: 4,
        data: initialDate ?? (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` })(),
        horaInicio: initialHour ?? '08:00',
        horaFim: initialHour ? `${String(parseInt(initialHour.split(':')[0]) + 1).padStart(2,'0')}:00` : '09:00',
      })
      setPacienteSearch('')
    }
  }, [isOpen, reset, initialDate, initialHour])

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowPacienteDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectPaciente = (pac: PacienteOption) => {
    setValue('pacienteId', pac.id, { shouldValidate: true })
    setValue('pacienteNome', pac.nome, { shouldValidate: true })
    setPacienteSearch(pac.nome)
    setShowPacienteDropdown(false)
  }

  const handleFormSubmit = async (values: FormValues) => {
    setIsSubmitting(true)
    await onSubmit(values as unknown as AppointmentFormData)
    setIsSubmitting(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Nova Consulta</h2>
            <p className="text-xs text-gray-400 mt-0.5">Preencha os dados do agendamento</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="px-6 py-5 space-y-5">
          {/* ── Paciente (autocomplete) ─────────────────── */}
          <div>
            <label className="modal-label">Paciente *</label>
            <div ref={searchRef} className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <input
                  type="text"
                  placeholder="Buscar paciente pelo nome..."
                  value={pacienteSearch || pacienteNomeValue || ''}
                  onChange={(e) => {
                    setPacienteSearch(e.target.value)
                    setShowPacienteDropdown(true)
                    if (!e.target.value) {
                      setValue('pacienteId', '')
                      setValue('pacienteNome', '')
                    }
                    searchPacientes(e.target.value)
                  }}
                  onFocus={() => setShowPacienteDropdown(true)}
                  className={cn('input-base pl-9', errors.pacienteId && 'border-red-400')}
                />
              </div>

              {showPacienteDropdown && pacientesFiltrados.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-10 overflow-hidden">
                  {pacientesFiltrados.map(pac => (
                    <button
                      key={pac.id}
                      type="button"
                      onClick={() => handleSelectPaciente(pac)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-green-50 transition-colors text-left"
                    >
                      <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                        {pac.nome[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{pac.nome}</p>
                        <p className="text-xs text-gray-400">{pac.telefone}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {errors.pacienteId && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.pacienteId.message}</p>}
          </div>

          {/* ── Profissional ──────────────────────────── */}
          <div>
            <label className="modal-label">Profissional *</label>
            <div className="relative">
              <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <select
                {...register('profissionalId')}
                className={cn('input-base pl-9 pr-8 appearance-none cursor-pointer', errors.profissionalId && 'border-red-400')}
              >
                <option value="">Selecione o profissional</option>
                {profissionais.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nome} — {p.especialidade}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
            </div>
            {errors.profissionalId && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.profissionalId.message}</p>}
          </div>

          {/* ── Data + Horários ───────────────────────── */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="modal-label">Data *</label>
              <input type="date" {...register('data')} className={cn('input-base', errors.data && 'border-red-400')} />
              {errors.data && <p className="mt-1 text-xs text-red-500">{errors.data.message}</p>}
            </div>
            <div>
              <label className="modal-label">Início *</label>
              <input type="time" {...register('horaInicio')} className={cn('input-base', errors.horaInicio && 'border-red-400')} />
            </div>
            <div>
              <label className="modal-label">Término *</label>
              <input type="time" {...register('horaFim')} className={cn('input-base', errors.horaFim && 'border-red-400')} />
              {errors.horaFim && <p className="mt-1 text-xs text-red-500">{errors.horaFim.message}</p>}
            </div>
          </div>

          {/* ── Procedimento + Status ─────────────────── */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="modal-label">Procedimento *</label>
              <div className="relative">
                <select {...register('procedimento')} className="input-base pr-8 appearance-none cursor-pointer">
                  {PROCEDIMENTOS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="modal-label">Status *</label>
              <div className="relative">
                <select {...register('status')} className="input-base pr-8 appearance-none cursor-pointer">
                  {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* ── Valor ────────────────────────────────── */}
          <div>
            <label className="modal-label">Valor (R$)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">R$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                {...register('valor')}
                className="input-base pl-9"
              />
            </div>
          </div>

          {/* ── Observações ──────────────────────────── */}
          <div>
            <label className="modal-label">Observações</label>
            <textarea
              rows={3}
              placeholder="Informações adicionais sobre a consulta..."
              {...register('observacoes')}
              className="input-base resize-none"
            />
          </div>

          {/* ── Recorrência ──────────────────────────── */}
          <div className="border border-dashed border-gray-200 rounded-xl p-4 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setValue('repetir', !repetir)}
                className={cn(
                  'w-9 h-5 rounded-full transition-all duration-200 flex items-center shrink-0',
                  repetir ? 'bg-green-500' : 'bg-gray-200'
                )}
              >
                <div className={cn(
                  'w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200',
                  repetir ? 'translate-x-4' : 'translate-x-0.5'
                )} />
              </div>
              <div className="flex items-center gap-1.5">
                <Repeat className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Repetir agendamento</span>
              </div>
            </label>

            {repetir && (
              <div className="grid grid-cols-2 gap-3 animate-fade-in">
                <div>
                  <label className="modal-label">Frequência</label>
                  <div className="relative">
                    <select {...register('recorrenciaTipo')} className="input-base pr-8 appearance-none cursor-pointer">
                      <option value="semanal">Semanal</option>
                      <option value="quinzenal">Quinzenal</option>
                      <option value="mensal">Mensal</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="modal-label">Repetições</label>
                  <input
                    type="number"
                    min="1"
                    max="52"
                    {...register('quantidadeRepeticoes')}
                    className="input-base"
                    placeholder="Ex: 4"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── Botões ───────────────────────────────── */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
              {isSubmitting
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
                : 'Confirmar Agendamento'
              }
            </button>
          </div>
        </form>
      </div>

      <style>{`.modal-label { display: block; font-size: 0.75rem; font-weight: 600; color: #374151; margin-bottom: 0.375rem; }`}</style>
    </div>
  )
}
