import type { AgendaAppointment, AppointmentStatus } from '../../types/agenda'
import { Clock, User, MoreVertical, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { cn } from '../../lib/utils'

// ─── Configuração visual por status ──────────────────
export const STATUS_CONFIG: Record<AppointmentStatus, {
  label: string
  dot: string
  bg: string
  border: string
  text: string
  badgeBg: string
  badgeText: string
}> = {
  confirmado:     { label: 'Confirmado',     dot: 'bg-green-500',  bg: 'bg-green-50',  border: 'border-green-200', text: 'text-green-800',  badgeBg: 'bg-green-100',  badgeText: 'text-green-800' },
  agendado:       { label: 'Pendente',       dot: 'bg-yellow-400', bg: 'bg-yellow-50', border: 'border-yellow-200',text: 'text-yellow-800', badgeBg: 'bg-yellow-100', badgeText: 'text-yellow-800' },
  em_atendimento: { label: 'Em atendimento', dot: 'bg-blue-500',   bg: 'bg-blue-50',   border: 'border-blue-200',  text: 'text-blue-800',   badgeBg: 'bg-blue-100',   badgeText: 'text-blue-800' },
  concluido:      { label: 'Concluído',      dot: 'bg-gray-400',   bg: 'bg-gray-50',   border: 'border-gray-200',  text: 'text-gray-600',   badgeBg: 'bg-gray-100',   badgeText: 'text-gray-600' },
  cancelado:      { label: 'Cancelado',      dot: 'bg-red-400',    bg: 'bg-red-50',    border: 'border-red-200',   text: 'text-red-700',    badgeBg: 'bg-red-100',    badgeText: 'text-red-700' },
  faltou:         { label: 'Faltou',         dot: 'bg-orange-400', bg: 'bg-orange-50', border: 'border-orange-200',text: 'text-orange-700', badgeBg: 'bg-orange-100', badgeText: 'text-orange-700' },
}

export const PROCEDIMENTO_LABEL: Record<string, string> = {
  consulta:   'Consulta',
  retorno:    'Retorno',
  botox:      'Botox',
  limpeza:    'Limpeza',
  ortodontia: 'Ortodontia',
  exame:      'Exame',
  cirurgia:   'Cirurgia',
  outro:      'Outro',
}

interface AppointmentCardProps {
  appointment: AgendaAppointment
  compact?: boolean
  onClick?: (apt: AgendaAppointment) => void
  onStatusChange?: (id: string, status: AppointmentStatus) => void
}

export function AppointmentCard({ appointment: apt, compact = false, onClick, onStatusChange }: AppointmentCardProps) {
  const cfg = STATUS_CONFIG[apt.status]

  return (
    <div
      onClick={() => onClick?.(apt)}
      className={cn(
        'rounded-lg border cursor-pointer transition-all duration-150 group relative overflow-hidden',
        cfg.bg, cfg.border,
        compact ? 'px-2 py-1.5' : 'px-3 py-2.5',
        'hover:shadow-sm hover:brightness-95'
      )}
    >
      {/* Barra lateral colorida pelo profissional */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
        style={{ background: apt.profissionalCor }}
      />

      <div className={cn('pl-2', compact ? 'space-y-0.5' : 'space-y-1')}>
        {/* Nome do paciente + status */}
        <div className="flex items-center justify-between gap-1">
          <span className={cn('font-semibold truncate', compact ? 'text-xs' : 'text-sm', cfg.text)}>
            {apt.pacienteNome}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            <span className={cn(
              'inline-flex items-center gap-1 rounded-full font-medium shrink-0',
              compact ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5',
              cfg.badgeBg, cfg.badgeText
            )}>
              <span className={cn('rounded-full', compact ? 'w-1 h-1' : 'w-1.5 h-1.5', cfg.dot)} />
              {cfg.label}
            </span>
          </div>
        </div>

        {!compact && (
          <>
            {/* Horário + procedimento */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {apt.horaInicio} – {apt.horaFim}
              </span>
              <span className="text-gray-300">·</span>
              <span>{PROCEDIMENTO_LABEL[apt.procedimento] || apt.procedimento}</span>
            </div>

            {/* Profissional */}
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <User className="w-3 h-3" />
              <span
                className="font-medium"
                style={{ color: apt.profissionalCor }}
              >
                {apt.profissionalNome.replace('Dr. ', '').replace('Dra. ', '')}
              </span>
              <span className="text-gray-300">·</span>
              <span>{apt.profissionalEspecialidade}</span>
            </div>
          </>
        )}

        {compact && (
          <div className="text-[10px] text-gray-500 truncate">
            {apt.horaInicio} · {PROCEDIMENTO_LABEL[apt.procedimento] || apt.procedimento}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Card expandido (para detalhes em modal/painel) ──
interface AppointmentDetailCardProps {
  appointment: AgendaAppointment
  onClose?: () => void
  onStatusChange?: (status: AppointmentStatus) => void
  onEdit?: () => void
  onDelete?: () => void
}

export function AppointmentDetailCard({ appointment: apt, onClose, onStatusChange, onEdit, onDelete }: AppointmentDetailCardProps) {
  const cfg = STATUS_CONFIG[apt.status]

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden w-80 shadow-xl shadow-gray-100/50">
      {/* Header colorido */}
      <div className="px-5 pt-5 pb-4" style={{ background: `${apt.profissionalCor}12` }}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-gray-400 mb-0.5">{PROCEDIMENTO_LABEL[apt.procedimento] || apt.procedimento}</p>
            <h3 className="text-base font-bold text-gray-900">{apt.pacienteNome}</h3>
          </div>
          <span className={cn('px-2 py-1 rounded-full text-xs font-semibold', cfg.badgeBg, cfg.badgeText)}>
            {cfg.label}
          </span>
        </div>
      </div>

      <div className="px-5 py-4 space-y-3 text-sm">
        <InfoRow icon={<Clock className="w-3.5 h-3.5" />} label="Horário">
          {apt.horaInicio} – {apt.horaFim} · {new Date(`${apt.data}T00:00:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
        </InfoRow>
        <InfoRow icon={<User className="w-3.5 h-3.5" />} label="Profissional">
          <span style={{ color: apt.profissionalCor }}>{apt.profissionalNome}</span>
          <span className="text-gray-400 ml-1">· {apt.profissionalEspecialidade}</span>
        </InfoRow>
        {apt.valor && (
          <InfoRow icon={<span className="text-xs font-bold">R$</span>} label="Valor">
            R$ {apt.valor.toLocaleString('pt-BR')}
          </InfoRow>
        )}
        {apt.observacoes && (
          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 leading-relaxed">
            {apt.observacoes}
          </div>
        )}
      </div>

      {/* Ações rápidas de status */}
      {onStatusChange && apt.status !== 'concluido' && apt.status !== 'cancelado' && (
        <div className="px-5 pb-3 flex gap-2">
          <button
            onClick={() => onStatusChange('confirmado')}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-green-50 text-green-700 text-xs font-medium hover:bg-green-100 transition-colors"
          >
            <CheckCircle className="w-3.5 h-3.5" /> Confirmar
          </button>
          <button
            onClick={() => onStatusChange('cancelado')}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 transition-colors"
          >
            <XCircle className="w-3.5 h-3.5" /> Cancelar
          </button>
        </div>
      )}

      {/* Botão excluir */}
      {onDelete && (
        <div className="px-5 pb-5">
          <button
            onClick={onDelete}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 transition-colors border border-red-100"
          >
            <XCircle className="w-3.5 h-3.5" /> Excluir Consulta
          </button>
        </div>
      )}
    </div>
  )
}

function InfoRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="text-gray-300 mt-0.5">{icon}</span>
      <div>
        <p className="text-[10px] text-gray-400 leading-none mb-0.5">{label}</p>
        <div className="text-gray-700 text-xs leading-snug">{children}</div>
      </div>
    </div>
  )
}
