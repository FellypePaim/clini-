import { useInView } from '../../hooks/useInView'
import { useCountUp } from '../../hooks/useCountUp'

const METRICS = [
  { label: 'Clinicas', value: 500, prefix: '+', suffix: '', decimals: 0 },
  { label: 'Pacientes Gerenciados', value: 50000, prefix: '+', suffix: '', decimals: 0 },
  { label: 'Uptime', value: 99.9, prefix: '', suffix: '%', decimals: 1 },
  { label: 'Avaliacao', value: 4.9, prefix: '', suffix: '/5', decimals: 1 },
] as const

const CLINICS = [
  'Clinica Sorriso',
  'OdontoVida',
  'Medica Premium',
  'Saude & Bem-Estar',
  'DentalCare',
  'Clinica Esperanca',
  'Ortho Plus',
  'Clinica Harmonia',
]

function MetricCounter({
  label,
  value,
  prefix,
  suffix,
  decimals,
  started,
}: {
  label: string
  value: number
  prefix: string
  suffix: string
  decimals: number
  started: boolean
}) {
  const count = useCountUp(value, 2000, started, decimals)
  const formatted =
    decimals > 0
      ? count.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
      : count.toLocaleString('pt-BR')

  return (
    <div className="text-center">
      <div className="text-4xl font-black text-white">
        {prefix}
        {formatted}
        {suffix}
      </div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </div>
  )
}

export function SocialProofSection() {
  const { ref, isInView } = useInView({ threshold: 0.2 })

  return (
    <section
      id="social-proof"
      ref={ref}
      className="py-20 px-6"
      style={{ background: 'rgba(255,255,255,0.02)' }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {METRICS.map((m) => (
            <MetricCounter
              key={m.label}
              label={m.label}
              value={m.value}
              prefix={m.prefix}
              suffix={m.suffix}
              decimals={m.decimals}
              started={isInView}
            />
          ))}
        </div>

        {/* Marquee */}
        <div className="mt-16 overflow-hidden" style={{ maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}>
          <div
            className="flex whitespace-nowrap"
            style={{ animation: 'marquee 30s linear infinite' }}
          >
            {[...CLINICS, ...CLINICS].map((name, i) => (
              <span key={i} className="text-sm text-gray-600 mx-4 flex-shrink-0">
                {name}
                <span className="ml-8 text-gray-700">•</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  )
}
