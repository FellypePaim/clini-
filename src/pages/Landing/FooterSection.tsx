import { Shield, Lock, Activity, MessageCircle } from 'lucide-react'

export function FooterSection() {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <footer id="footer" className="relative bg-[#030608] text-white">
      {/* Final CTA */}
      <div className="relative overflow-hidden py-24 px-4 sm:px-6 lg:px-8">
        {/* Blobs */}
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Pronto para transformar sua clinica?
          </h2>
          <p className="text-gray-400 text-lg mb-8">
            Comece com um diagnostico gratuito e descubra o potencial da sua clinica.
          </p>
          <button
            onClick={() => scrollTo('quiz')}
            className="relative inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold text-white bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 transition-all duration-300 shadow-[0_0_30px_rgba(6,182,212,0.3)] animate-pulse-accent"
          >
            Iniciar Diagnostico Gratuito
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/5" />

      {/* Links grid + contact */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mb-12">
          {/* Produto */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Produto</h3>
            <ul className="space-y-3">
              <li>
                <button onClick={() => scrollTo('features')} className="text-gray-500 hover:text-white text-sm transition-colors">
                  Funcionalidades
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('ovyva')} className="text-gray-500 hover:text-white text-sm transition-colors">
                  OVYVA
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('quiz')} className="text-gray-500 hover:text-white text-sm transition-colors">
                  Diagnostico
                </button>
              </li>
            </ul>
          </div>

          {/* Empresa */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Empresa</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-gray-500 hover:text-white text-sm transition-colors">
                  Sobre nos
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/5537998195029"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-white text-sm transition-colors"
                >
                  Contato
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-500 hover:text-white text-sm transition-colors">
                  Suporte
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Legal</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-gray-500 hover:text-white text-sm transition-colors">
                  Politica LGPD
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-500 hover:text-white text-sm transition-colors">
                  Termos de Uso
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Contact bar */}
        <div className="flex flex-wrap items-center justify-center gap-6 mb-12">
          <a
            href="https://wa.me/5537998195029"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
          >
            <MessageCircle size={16} />
            WhatsApp
          </a>
          <a
            href="mailto:contato@cliniplus.com.br"
            className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
          >
            contato@cliniplus.com.br
          </a>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          <span className="flex items-center gap-2 bg-[rgba(255,255,255,0.03)] border border-white/10 rounded-full px-4 py-2 text-xs text-gray-500">
            <Shield size={14} />
            LGPD Compliant
          </span>
          <span className="flex items-center gap-2 bg-[rgba(255,255,255,0.03)] border border-white/10 rounded-full px-4 py-2 text-xs text-gray-500">
            <Lock size={14} />
            Criptografia E2E
          </span>
          <span className="flex items-center gap-2 bg-[rgba(255,255,255,0.03)] border border-white/10 rounded-full px-4 py-2 text-xs text-gray-500">
            <Activity size={14} />
            99.9% Uptime
          </span>
        </div>

        {/* Copyright */}
        <p className="text-center text-gray-600 text-sm">
          &copy; 2026 Clini+ — Prontuario Verde. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  )
}
