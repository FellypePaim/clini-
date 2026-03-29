import { useEffect, useState } from 'react'
import { Bot, Calendar, MessageSquare, Users } from 'lucide-react'
import { useInView } from '../../hooks/useInView'

const MESSAGES = [
  { sender: 'patient', text: 'Ola, gostaria de agendar uma limpeza' },
  { sender: 'typing' },
  { sender: 'ai', text: 'Ola! Temos horarios disponiveis amanha as 9h, 14h e 16h. Qual prefere?' },
  { sender: 'patient', text: '14h por favor' },
  { sender: 'typing' },
  { sender: 'ai', text: 'Perfeito! Limpeza agendada para amanha as 14h com Dra. Ana. Enviaremos um lembrete!' },
]

const BULLETS = [
  { icon: Bot, text: 'Agendamento automatico 24/7' },
  { icon: Calendar, text: 'Respostas inteligentes via WhatsApp' },
  { icon: MessageSquare, text: 'CRM automatico — leads captados na conversa' },
  { icon: Users, text: 'Notifica profissionais em tempo real' },
]

function TypingDots() {
  return (
    <>
      <style>{`
        .typing-dot { animation: typingPulse 1.4s infinite; }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typingPulse { 0%,60%,100%{opacity:0.3} 30%{opacity:1} }
      `}</style>
      <div className="flex items-center gap-1 px-4 py-3">
        <span className="typing-dot w-2 h-2 rounded-full" style={{ backgroundColor: '#06b6d4' }} />
        <span className="typing-dot w-2 h-2 rounded-full" style={{ backgroundColor: '#06b6d4' }} />
        <span className="typing-dot w-2 h-2 rounded-full" style={{ backgroundColor: '#06b6d4' }} />
      </div>
    </>
  )
}

export function OvyvaSection() {
  const { ref, isInView } = useInView({ threshold: 0.2 })
  const [visibleCount, setVisibleCount] = useState(0)

  useEffect(() => {
    if (!isInView) return

    // Schedule: patient(0s) -> typing(1s) -> ai(2.5s) -> patient(4s) -> typing(5s) -> ai(6.5s)
    const delays = [0, 1000, 2500, 4000, 5000, 6500]
    const timers: ReturnType<typeof setTimeout>[] = []

    delays.forEach((delay, i) => {
      timers.push(setTimeout(() => setVisibleCount(i + 1), delay))
    })

    return () => timers.forEach(clearTimeout)
  }, [isInView])

  // Build rendered messages: replace typing with actual AI message when next one is visible
  const renderedMessages: typeof MESSAGES = []
  for (let i = 0; i < visibleCount && i < MESSAGES.length; i++) {
    const msg = MESSAGES[i]
    if (msg.sender === 'typing') {
      // Show typing only if the next AI message isn't visible yet
      const nextIndex = i + 1
      if (nextIndex >= visibleCount) {
        renderedMessages.push(msg)
      }
      // If next is visible, skip typing (AI message replaces it)
    } else {
      renderedMessages.push(msg)
    }
  }

  return (
    <section id="ovyva" ref={ref} className="py-24 px-6" style={{ backgroundColor: '#030608' }}>
      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-16">
        {/* Left side */}
        <div className="flex-1">
          <span className="text-sm font-semibold uppercase tracking-widest" style={{ color: '#06b6d4' }}>
            OVYVA
          </span>
          <h2 className="text-3xl font-bold mt-3" style={{ color: '#ffffff' }}>
            Sua secretaria virtual com IA
          </h2>
          <ul className="mt-8 space-y-5">
            {BULLETS.map((b) => (
              <li key={b.text} className="flex items-center gap-3">
                <b.icon className="w-5 h-5 flex-shrink-0" style={{ color: '#06b6d4' }} />
                <span style={{ color: '#9ca3af' }}>{b.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right side — Chat mockup */}
        <div className="flex-1 w-full max-w-md">
          <div
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '20px',
            }}
            className="overflow-hidden"
          >
            {/* Header */}
            <div
              className="flex items-center gap-2 px-5 py-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#22c55e' }} />
              <span className="text-sm font-semibold" style={{ color: '#ffffff' }}>
                OVYVA • IA Ativa
              </span>
            </div>

            {/* Messages */}
            <div className="p-5 space-y-4 min-h-[320px]">
              {renderedMessages.map((msg, i) => {
                if (msg.sender === 'typing') {
                  return (
                    <div key={`typing-${i}`} className="flex justify-end" style={{ animation: 'fade-in 0.4s ease-out' }}>
                      <div
                        className="rounded-2xl rounded-br-none"
                        style={{ background: 'linear-gradient(to right, rgba(8,145,178,0.2), rgba(99,102,241,0.1))' }}
                      >
                        <TypingDots />
                      </div>
                    </div>
                  )
                }

                const isPatient = msg.sender === 'patient'
                return (
                  <div
                    key={`msg-${i}`}
                    className={`flex ${isPatient ? 'justify-start' : 'justify-end'}`}
                    style={{ animation: 'fade-in 0.4s ease-out' }}
                  >
                    <div
                      className={`px-4 py-3 max-w-[85%] text-sm ${
                        isPatient
                          ? 'rounded-2xl rounded-bl-none'
                          : 'rounded-2xl rounded-br-none'
                      }`}
                      style={
                        isPatient
                          ? { background: 'rgba(255,255,255,0.06)', color: '#d1d5db' }
                          : { background: 'linear-gradient(to right, rgba(8,145,178,0.2), rgba(99,102,241,0.1))', color: '#d1d5db' }
                      }
                    >
                      {msg.text}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
