import { useEffect, useRef, useState, useCallback } from 'react'
import { Star } from 'lucide-react'

const TESTIMONIALS = [
  { name: 'Dr. Marina Costa', role: 'Ortodontista', text: 'O Clini+ transformou a gestao da minha clinica. A OVYVA sozinha ja reduziu 70% das ligacoes.', stars: 5 },
  { name: 'Dr. Rafael Santos', role: 'Dentista', text: 'Prontuario eletronico completo, agenda inteligente e tudo integrado. Melhor investimento que fiz.', stars: 5 },
  { name: 'Dra. Julia Mendes', role: 'Dermatologista', text: 'A integracao com WhatsApp e o diferencial. Meus pacientes adoram a praticidade.', stars: 5 },
  { name: 'Dr. Carlos Lima', role: 'Clinico Geral', text: 'Em 3 meses, reduzi no-shows em 60% e aumentei o faturamento em 35%.', stars: 5 },
  { name: 'Dra. Ana Oliveira', role: 'Pediatra', text: 'Interface linda e intuitiva. Minha equipe aprendeu a usar em 1 dia.', stars: 4 },
  { name: 'Dr. Pedro Almeida', role: 'Cirurgiao', text: 'O CRM Verdesk me deu visibilidade total dos leads. Converto muito mais agora.', stars: 5 },
]

const AVATAR_COLORS = [
  'bg-cyan-500', 'bg-emerald-500', 'bg-violet-500',
  'bg-amber-500', 'bg-rose-500', 'bg-blue-500',
]

export function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const maxIndex = TESTIMONIALS.length - 1

  const startAutoPlay = useCallback(() => {
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1))
    }, 5000)
  }, [maxIndex])

  const stopAutoPlay = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => {
    startAutoPlay()
    return () => stopAutoPlay()
  }, [startAutoPlay, stopAutoPlay])

  // On mobile show 1 card (100%), on lg show 3 cards (33.333%)
  // We use a CSS variable approach via responsive classes
  const cardWidthMobile = 100
  const cardWidthDesktop = 100 / 3

  return (
    <section id="testimonials" className="relative py-24 px-4 sm:px-6 lg:px-8 bg-[#030608]">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-white mb-16">
          O que dizem nossos clientes
        </h2>

        <div
          className="relative overflow-hidden"
          onMouseEnter={stopAutoPlay}
          onMouseLeave={startAutoPlay}
        >
          {/* Mobile: 1 card */}
          <div
            className="flex lg:hidden transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * cardWidthMobile}%)` }}
          >
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="w-full flex-shrink-0 px-3">
                <TestimonialCard testimonial={t} colorClass={AVATAR_COLORS[i % AVATAR_COLORS.length]} />
              </div>
            ))}
          </div>

          {/* Desktop: 3 cards */}
          <div
            className="hidden lg:flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * cardWidthDesktop}%)` }}
          >
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="flex-shrink-0 px-3" style={{ width: `${cardWidthDesktop}%` }}>
                <TestimonialCard testimonial={t} colorClass={AVATAR_COLORS[i % AVATAR_COLORS.length]} />
              </div>
            ))}
          </div>
        </div>

        {/* Navigation dots */}
        <div className="flex justify-center gap-2 mt-8">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                i === currentIndex ? 'bg-cyan-500' : 'bg-gray-700'
              }`}
              aria-label={`Ir para depoimento ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function TestimonialCard({
  testimonial,
  colorClass,
}: {
  testimonial: (typeof TESTIMONIALS)[number]
  colorClass: string
}) {
  const initial = testimonial.name.charAt(0).toUpperCase()

  return (
    <div className="bg-[rgba(255,255,255,0.03)] border border-white/10 rounded-2xl p-6 backdrop-blur-sm h-full">
      <div className="flex items-center gap-4 mb-4">
        <div
          className={`w-12 h-12 rounded-full ${colorClass} flex items-center justify-center text-white font-bold text-lg`}
        >
          {initial}
        </div>
        <div>
          <p className="text-white font-bold">{testimonial.name}</p>
          <p className="text-cyan-500 text-sm">{testimonial.role}</p>
        </div>
      </div>
      <p className="text-gray-400 italic mb-4">"{testimonial.text}"</p>
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={16}
            className={i < testimonial.stars ? 'text-amber-400 fill-amber-400' : 'text-gray-700'}
          />
        ))}
      </div>
    </div>
  )
}
