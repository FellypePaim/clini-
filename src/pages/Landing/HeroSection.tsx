import { useRef, useState } from 'react'
import { ArrowRight, Sparkles } from 'lucide-react'

export function HeroSection() {
  const heroRef = useRef<HTMLElement>(null)
  const [rotate, setRotate] = useState({ x: 5, y: -2 })

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!heroRef.current) return
    const rect = heroRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const offsetX = ((e.clientX - centerX) / (rect.width / 2)) * 3
    const offsetY = ((e.clientY - centerY) / (rect.height / 2)) * -3
    setRotate({ x: 5 + offsetY, y: -2 + offsetX })
  }

  const handleMouseLeave = () => {
    setRotate({ x: 5, y: -2 })
  }

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <style>{`
        @keyframes blob1 {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(30px, -50px); }
          66% { transform: translate(-20px, 20px); }
        }
        @keyframes blob2 {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(-40px, 30px); }
          66% { transform: translate(20px, -40px); }
        }
        @keyframes blob3 {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(25px, 40px); }
          66% { transform: translate(-30px, -25px); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <section
        id="hero"
        ref={heroRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        {/* Animated blobs */}
        <div
          className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)',
            animation: 'blob1 20s ease-in-out infinite',
          }}
        />
        <div
          className="absolute top-1/3 right-1/4 w-[350px] h-[350px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%)',
            animation: 'blob2 25s ease-in-out infinite',
          }}
        />
        <div
          className="absolute bottom-1/4 left-1/3 w-[450px] h-[450px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)',
            animation: 'blob3 22s ease-in-out infinite',
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: text content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/5 mb-8 opacity-0"
              style={{ animation: 'fade-in 0.6s ease-out forwards', animationDelay: '0.1s' }}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs font-medium text-cyan-300 tracking-wide">Plataforma inteligente para clinicas</span>
            </div>

            {/* Title */}
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6 opacity-0"
              style={{ animation: 'fade-in 0.6s ease-out forwards', animationDelay: '0.25s' }}
            >
              <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                A clinica do futuro
              </span>
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                comeca aqui.
              </span>
            </h1>

            {/* Subtitle */}
            <p
              className="text-base sm:text-lg text-gray-400 max-w-lg mx-auto lg:mx-0 mb-10 leading-relaxed opacity-0"
              style={{ animation: 'fade-in 0.6s ease-out forwards', animationDelay: '0.4s' }}
            >
              Prontuario eletronico, IA, WhatsApp e CRM em um unico sistema.
            </p>

            {/* CTAs */}
            <div
              className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start opacity-0"
              style={{ animation: 'fade-in 0.6s ease-out forwards', animationDelay: '0.55s' }}
            >
              <button
                onClick={() => scrollTo('quiz')}
                className="group flex items-center gap-2 px-7 py-3.5 text-sm font-bold text-white bg-gradient-to-r from-cyan-600 to-indigo-500 rounded-xl hover:from-cyan-500 hover:to-indigo-400 transition-all shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30"
              >
                Iniciar Diagnostico Gratuito
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={() => scrollTo('features')}
                className="px-7 py-3.5 text-sm font-medium text-gray-300 border border-white/10 rounded-xl hover:bg-white/5 hover:border-white/20 transition-all"
              >
                Ver Funcionalidades
              </button>
            </div>
          </div>

          {/* Right: 3D mockup */}
          <div
            className="flex justify-center lg:justify-end opacity-0"
            style={{ animation: 'fade-in 0.6s ease-out forwards', animationDelay: '0.7s' }}
          >
            <div
              className="w-full max-w-md transition-transform duration-200 ease-out"
              style={{
                transform: `perspective(1000px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
              }}
            >
              <div
                className="rounded-2xl p-6 border border-white/[0.06]"
                style={{
                  background: 'linear-gradient(135deg, rgba(15,20,30,0.9) 0%, rgba(8,12,20,0.95) 100%)',
                  boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 40px rgba(6,182,212,0.05)',
                }}
              >
                {/* Fake window bar */}
                <div className="flex items-center gap-1.5 mb-5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                  <div className="ml-3 h-5 flex-1 rounded-md bg-white/[0.04]" />
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-4 gap-3 mb-5">
                  {[
                    { color: 'from-cyan-500/20 to-cyan-600/10', border: 'border-cyan-500/10', label: 'Pacientes', value: '1.248' },
                    { color: 'from-indigo-500/20 to-indigo-600/10', border: 'border-indigo-500/10', label: 'Consultas', value: '86' },
                    { color: 'from-emerald-500/20 to-emerald-600/10', border: 'border-emerald-500/10', label: 'Receita', value: 'R$42k' },
                    { color: 'from-amber-500/20 to-amber-600/10', border: 'border-amber-500/10', label: 'NPS', value: '94' },
                  ].map((kpi) => (
                    <div
                      key={kpi.label}
                      className={`rounded-xl p-3 bg-gradient-to-br ${kpi.color} border ${kpi.border}`}
                    >
                      <div className="text-[10px] text-gray-500 mb-1">{kpi.label}</div>
                      <div className="text-sm font-bold text-white">{kpi.value}</div>
                    </div>
                  ))}
                </div>

                {/* Fake chart area */}
                <div className="rounded-xl border border-white/[0.04] p-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs text-gray-500">Atendimentos / semana</div>
                    <div className="flex gap-1">
                      <div className="w-8 h-1.5 rounded-full bg-cyan-500/30" />
                      <div className="w-8 h-1.5 rounded-full bg-indigo-500/30" />
                    </div>
                  </div>
                  <div className="flex items-end gap-1.5 h-24">
                    {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t-sm"
                        style={{
                          height: `${h}%`,
                          background: i % 2 === 0
                            ? 'linear-gradient(to top, rgba(6,182,212,0.3), rgba(6,182,212,0.1))'
                            : 'linear-gradient(to top, rgba(99,102,241,0.3), rgba(99,102,241,0.1))',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
