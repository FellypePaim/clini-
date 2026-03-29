import { useState, useEffect, useRef } from 'react'
import { useInView } from '../../hooks/useInView'

const QUESTIONS = [
  {
    question: 'Qual a especialidade da sua clinica?',
    options: ['Odontologia', 'Medicina', 'Estetica', 'Outra'],
    scored: false,
  },
  {
    question: 'Quantos profissionais atuam na sua clinica?',
    options: ['1-3', '4-10', '11-20', '20+'],
    scored: false,
  },
  {
    question: 'Quantos pacientes atendem por mes?',
    options: ['Ate 100', '100-500', '500-1.000', '1.000+'],
    scored: false,
  },
  {
    question: 'Sua clinica usa agenda digital?',
    options: ['Sim', 'Parcialmente', 'Nao'],
    scored: true,
    scores: { 'Sim': 100, 'Parcialmente': 50, 'Nao': 0 } as Record<string, number>,
  },
  {
    question: 'Usam prontuario eletronico?',
    options: ['Sim', 'Planilhas', 'Nao'],
    scored: true,
    scores: { 'Sim': 100, 'Planilhas': 50, 'Nao': 0 } as Record<string, number>,
  },
  {
    question: 'Tem presenca no WhatsApp para pacientes?',
    options: ['Sim, com bot/IA', 'Sim, manual', 'Nao'],
    scored: true,
    scores: { 'Sim, com bot/IA': 100, 'Sim, manual': 50, 'Nao': 0 } as Record<string, number>,
  },
  {
    question: 'Fazem gestao financeira digital?',
    options: ['Sim', 'Planilhas', 'Nao'],
    scored: true,
    scores: { 'Sim': 100, 'Planilhas': 50, 'Nao': 0 } as Record<string, number>,
  },
  {
    question: 'Qual o maior desafio da sua clinica hoje?',
    options: ['No-shows / faltas', 'Gestao financeira', 'Captacao de pacientes', 'Organizacao geral'],
    scored: false,
  },
]

const LABELS = [
  'Especialidade', 'Profissionais', 'Pacientes/mes',
  'Agenda digital', 'Prontuario', 'WhatsApp',
  'Financeiro', 'Maior desafio',
]

export function QuizSection() {
  const { ref, isInView } = useInView({ threshold: 0.15 })
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [animating, setAnimating] = useState(false)
  const [slideDir, setSlideDir] = useState<'left' | 'right'>('left')
  const confettiFired = useRef(false)

  // Calculate score
  const scoredQuestions = QUESTIONS.filter(q => q.scored)
  const totalScore = scoredQuestions.reduce((sum, q) => {
    const qIdx = QUESTIONS.indexOf(q)
    const answer = answers[qIdx]
    return sum + (q.scores?.[answer] ?? 0)
  }, 0)
  const score = Math.round(totalScore / scoredQuestions.length)

  // Confetti on result screen
  useEffect(() => {
    if (currentStep === 8 && !confettiFired.current) {
      confettiFired.current = true
      import('canvas-confetti').then(({ default: confetti }) => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#0891b2', '#6366f1', '#10b981', '#f59e0b'],
        })
      })
    }
  }, [currentStep])

  const handleNext = () => {
    if (!selectedOption) return
    setAnswers(prev => ({ ...prev, [currentStep]: selectedOption }))
    setSlideDir('left')
    setAnimating(true)
    setTimeout(() => {
      setCurrentStep(prev => prev + 1)
      setSelectedOption(null)
      setSlideDir('right')
      setTimeout(() => setAnimating(false), 20)
    }, 200)
  }

  const handleBack = () => {
    setSlideDir('right')
    setAnimating(true)
    setTimeout(() => {
      const prevStep = currentStep - 1
      setCurrentStep(prevStep)
      setSelectedOption(answers[prevStep] || null)
      setSlideDir('left')
      setTimeout(() => setAnimating(false), 20)
    }, 200)
  }

  const handleReset = () => {
    setCurrentStep(0)
    setAnswers({})
    setSelectedOption(null)
    setAnimating(false)
    confettiFired.current = false
  }

  const handleWhatsApp = () => {
    const lines = LABELS.map((l, i) => `${l}: ${answers[i] || '\u2014'}`).join('\n')
    const msg = encodeURIComponent(
      `Ola Equipe Clini+! Fiz o diagnostico e minha clinica esta ${score}% digitalizada.\n\n${lines}\n\nGostaria de saber mais sobre o sistema!`
    )
    window.open(`https://wa.me/5537998195029?text=${msg}`, '_blank')
  }

  const getMessage = () => {
    if (score < 50) return 'Sua clinica esta perdendo pacientes e receita. O Clini+ pode resolver isso.'
    if (score < 80) return 'Boa base! O Clini+ leva sua clinica ao proximo nivel.'
    return 'Excelente! O Clini+ otimiza o que voce ja tem de melhor.'
  }

  const progressWidth = `${((Math.min(currentStep, 7) + 1) / 8) * 100}%`

  // SVG gauge calculations
  const radius = 80
  const circumference = 2 * Math.PI * radius
  const gaugeOffset = circumference - (score / 100) * circumference

  return (
    <section id="quiz" ref={ref} className="py-24 px-6" style={{ backgroundColor: '#030608' }}>
      <style>{`
        @keyframes quizFadeIn {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseShadow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(8, 145, 178, 0.4); }
          50% { box-shadow: 0 0 20px 8px rgba(8, 145, 178, 0.2); }
        }
      `}</style>

      <div className="max-w-6xl mx-auto text-center mb-14">
        <h2
          className="text-3xl font-bold"
          style={{
            color: '#ffffff',
            opacity: isInView ? 1 : 0,
            transform: isInView ? 'translateY(0)' : 'translateY(24px)',
            transition: 'all 0.6s ease',
          }}
        >
          Diagnostico Digital Gratuito
        </h2>
        <p
          className="mt-3"
          style={{
            color: '#6b7280',
            opacity: isInView ? 1 : 0,
            transform: isInView ? 'translateY(0)' : 'translateY(24px)',
            transition: 'all 0.6s ease 0.1s',
          }}
        >
          Descubra o nivel de digitalizacao da sua clinica em 2 minutos
        </p>
      </div>

      <div
        className="max-w-2xl mx-auto rounded-2xl p-8 overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)',
          opacity: isInView ? 1 : 0,
          transform: isInView ? 'translateY(0)' : 'translateY(24px)',
          transition: 'all 0.6s ease 0.2s',
        }}
      >
        {currentStep < 8 ? (
          <>
            {/* Progress bar */}
            <div className="w-full rounded-full overflow-hidden" style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.06)' }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: progressWidth,
                  background: 'linear-gradient(to right, #0891b2, #6366f1)',
                  transition: 'width 0.5s ease',
                }}
              />
            </div>

            {/* Step counter */}
            <p className="text-sm mt-4" style={{ color: '#6b7280' }}>
              Pergunta {currentStep + 1} de 8
            </p>

            {/* Question area with slide animation */}
            <div
              style={{
                opacity: animating ? 0 : 1,
                transform: animating
                  ? (slideDir === 'left' ? 'translateX(-30px)' : 'translateX(30px)')
                  : 'translateX(0)',
                transition: 'all 0.2s ease',
              }}
            >
              {/* Question text */}
              <h3 className="text-xl font-bold text-center mt-6" style={{ color: '#ffffff' }}>
                {QUESTIONS[currentStep].question}
              </h3>

              {/* Options grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8">
                {QUESTIONS[currentStep].options.map(option => {
                  const isSelected = selectedOption === option
                  return (
                    <button
                      key={option}
                      onClick={() => setSelectedOption(option)}
                      className="rounded-xl py-4 px-6 text-left cursor-pointer"
                      style={{
                        backgroundColor: isSelected ? 'rgba(8,145,178,0.12)' : 'rgba(255,255,255,0.04)',
                        border: isSelected ? '1px solid rgba(8,145,178,0.4)' : '1px solid rgba(255,255,255,0.08)',
                        color: isSelected ? '#22d3ee' : '#d1d5db',
                        fontWeight: isSelected ? 600 : 400,
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={e => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'
                        }
                      }}
                    >
                      {option}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between mt-8">
              {currentStep > 0 ? (
                <button
                  onClick={handleBack}
                  className="px-4 py-2 cursor-pointer"
                  style={{ color: '#6b7280', background: 'none', border: 'none' }}
                >
                  Voltar
                </button>
              ) : (
                <div />
              )}
              <button
                onClick={handleNext}
                disabled={!selectedOption}
                className="px-6 py-2 rounded-lg font-semibold cursor-pointer"
                style={{
                  background: selectedOption ? 'linear-gradient(to right, #0891b2, #6366f1)' : 'rgba(255,255,255,0.1)',
                  color: '#ffffff',
                  opacity: selectedOption ? 1 : 0.5,
                  border: 'none',
                  cursor: selectedOption ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease',
                }}
              >
                {currentStep === 7 ? 'Ver resultado' : 'Proxima'}
              </button>
            </div>
          </>
        ) : (
          /* Result screen */
          <div className="text-center">
            {/* SVG Circular Gauge */}
            <div className="flex justify-center mb-6">
              <svg width="200" height="200" viewBox="0 0 200 200">
                <defs>
                  <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0891b2" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
                {/* Background circle */}
                <circle
                  cx="100"
                  cy="100"
                  r={radius}
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="8"
                />
                {/* Score circle */}
                <circle
                  cx="100"
                  cy="100"
                  r={radius}
                  fill="none"
                  stroke="url(#gaugeGrad)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={gaugeOffset}
                  transform="rotate(-90 100 100)"
                  style={{ transition: 'stroke-dashoffset 1s ease' }}
                />
                {/* Score text */}
                <text x="100" y="92" textAnchor="middle" dominantBaseline="middle"
                  style={{ fontSize: '48px', fontWeight: 900, fill: '#ffffff' }}
                >
                  {score}
                </text>
                <text x="100" y="120" textAnchor="middle"
                  style={{ fontSize: '14px', fill: '#6b7280' }}
                >
                  % digitalizada
                </text>
              </svg>
            </div>

            {/* Personalized message */}
            <p className="text-lg font-semibold mb-8" style={{ color: '#d1d5db' }}>
              {getMessage()}
            </p>

            {/* Answer summary */}
            <div className="mb-8 text-left rounded-xl p-4" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
              {LABELS.map((label, i) => (
                <div key={label} className="flex justify-between py-1" style={{ borderBottom: i < LABELS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <span className="text-xs" style={{ color: '#6b7280' }}>{label}</span>
                  <span className="text-xs" style={{ color: '#9ca3af' }}>{answers[i] || '\u2014'}</span>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <button
              onClick={handleWhatsApp}
              className="w-full py-4 rounded-xl font-bold text-lg cursor-pointer"
              style={{
                background: 'linear-gradient(to right, #0891b2, #6366f1)',
                color: '#ffffff',
                border: 'none',
                animation: 'pulseShadow 2s ease-in-out infinite',
              }}
            >
              Falar com Equipe Clini+
            </button>

            {/* Reset link */}
            <button
              onClick={handleReset}
              className="mt-4 cursor-pointer"
              style={{ color: '#6b7280', background: 'none', border: 'none', fontSize: '14px' }}
            >
              Refazer diagnostico
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
