import { Bot, Calendar, TrendingUp, Layers } from 'lucide-react'
import { useInView } from '../../hooks/useInView'

const BENEFITS = [
  { number: '60%', label: 'Reducao de no-shows', desc: 'Lembretes automaticos via WhatsApp', icon: Calendar, color: '#0891b2' },
  { number: '40%', label: 'Aumento no faturamento', desc: 'CRM e captacao inteligente de leads', icon: TrendingUp, color: '#6366f1' },
  { number: '24/7', label: 'Atendimento com IA', desc: 'OVYVA responde enquanto voce descansa', icon: Bot, color: '#10b981' },
  { number: '1', label: 'Unico sistema', desc: 'Agenda, prontuario, financeiro, CRM, WhatsApp', icon: Layers, color: '#f59e0b' },
]

export function BenefitsSection() {
  const { ref, isInView } = useInView({ threshold: 0.15 })

  return (
    <section id="benefits" ref={ref} className="py-24 px-6" style={{ backgroundColor: '#030608' }}>
      <style>{`
        @keyframes benefitFadeIn {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div className="max-w-6xl mx-auto text-center mb-14">
        <h2 className="text-3xl font-bold" style={{ color: '#ffffff' }}>
          Resultados reais para sua clinica
        </h2>
        <p className="mt-3" style={{ color: '#6b7280' }}>
          Numeros que falam por si
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {BENEFITS.map((b, i) => (
          <div
            key={b.label}
            className="p-8 rounded-2xl transition-all duration-300"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              opacity: isInView ? 1 : 0,
              transform: isInView ? 'translateY(0)' : 'translateY(24px)',
              animation: isInView ? `benefitFadeIn 0.5s ease-out ${i * 100}ms both` : 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
              e.currentTarget.style.transform = 'translateY(-4px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-5"
              style={{ backgroundColor: `${b.color}1a` }}
            >
              <b.icon className="w-6 h-6" style={{ color: b.color }} />
            </div>
            <div className="text-5xl font-black" style={{ color: '#ffffff' }}>{b.number}</div>
            <div className="text-lg font-bold mt-2" style={{ color: '#ffffff' }}>{b.label}</div>
            <div className="text-sm mt-1" style={{ color: '#6b7280' }}>{b.desc}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
