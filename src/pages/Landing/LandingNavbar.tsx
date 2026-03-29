import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Stethoscope } from 'lucide-react'

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(3,6,8,0.95)' : 'rgba(3,6,8,0.6)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-cyan-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Stethoscope className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="text-lg font-bold text-white">Clini<span className="text-cyan-400">+</span></span>
        </div>

        {/* Links */}
        <div className="hidden md:flex items-center gap-8">
          <button onClick={() => scrollTo('features')} className="text-sm text-gray-400 hover:text-white transition-colors">Funcionalidades</button>
          <button onClick={() => scrollTo('lyra')} className="text-sm text-gray-400 hover:text-white transition-colors">LYRA</button>
          <button onClick={() => scrollTo('quiz')} className="text-sm text-gray-400 hover:text-white transition-colors">Quiz</button>
        </div>

        {/* CTAs */}
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="hidden sm:flex px-4 py-2 text-sm font-medium text-gray-300 border border-white/10 rounded-xl hover:bg-white/5 hover:border-white/20 transition-all"
          >
            Entrar
          </Link>
          <button
            onClick={() => scrollTo('quiz')}
            className="px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-cyan-600 to-indigo-500 rounded-xl hover:from-cyan-500 hover:to-indigo-400 transition-all shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30"
          >
            Diagnostico Gratis
          </button>
        </div>
      </div>
    </nav>
  )
}
