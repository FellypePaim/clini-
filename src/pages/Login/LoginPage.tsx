import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useLocation } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, LogIn, AlertCircle, Loader2, UserPlus, KeyRound, CheckCircle } from 'lucide-react'
import { CliniPlusLogo } from '../../components/ui/CliniPlusLogo'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'
import { cn } from '../../lib/utils'

// ─── Schema de validação ──────────────────────────────
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'E-mail é obrigatório')
    .email('Digite um e-mail válido'),
  senha: z
    .string()
    .min(1, 'Senha é obrigatória')
    .min(4, 'Senha deve ter ao menos 4 caracteres'),
})

type LoginForm = z.infer<typeof loginSchema>

// ─── Credenciais de demonstração (apenas em dev) ─────
const DEMO_CREDENTIALS = import.meta.env.DEV ? [
  { label: 'Administrador', email: 'admin@clinicaverde.com.br', senha: 'admin123' },
  { label: 'Profissional',  email: 'profissional@clinicaverde.com.br', senha: 'prof123' },
  { label: 'Recepção',      email: 'recepcao@clinicaverde.com.br', senha: 'rec123' },
  { label: 'SuperAdmin',     email: 'superadmin@cliniplus.com',      senha: 'superpassword' },
] : []

// ─── Dark Clinical input classes ─────────────────────
const darkInput = [
  'w-full rounded-xl px-4 py-2.5 text-sm transition-all duration-200 outline-none',
  'bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)]',
  'text-[#f1f5f9] placeholder-[#64748b]',
  'focus:border-[#0891b2] focus:ring-2 focus:ring-[rgba(8,145,178,0.2)]',
].join(' ')

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const { login, isLoading, error: authError } = useAuthStore()
  const [showReset, setShowReset] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const location = useLocation()
  const error = authError || (location.state as any)?.error
  const successMessage = (location.state as any)?.success

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    await login(data.email, data.senha)
  }

  const fillDemo = (email: string, senha: string) => {
    setValue('email', email)
    setValue('senha', senha)
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(145deg, #060a14, #0c1220)' }}>
      {/* ── Painel esquerdo (branding) ────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-cyan-600 to-indigo-500 relative overflow-hidden flex-col justify-between p-12">
        {/* Círculos decorativos */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-white text-2xl font-bold tracking-tight">Prontuário</span>
              <span className="text-cyan-200 text-2xl font-light"> Verde</span>
            </div>
          </div>

          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Gestão clínica<br />
            inteligente e<br />
            humanizada.
          </h1>
          <p className="text-cyan-100 text-lg leading-relaxed">
            Agende consultas, gerencie prontuários,
            acompanhe pacientes e monitore seu
            financeiro — tudo em um só lugar.
          </p>
        </div>

        <div className="relative z-10">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Pacientes', value: '2.400+' },
              { label: 'Consultas/mês', value: '180+' },
              { label: 'Satisfação', value: '98%' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-cyan-200 text-xs mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Painel direito (formulário) ───────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md animate-fade-in">
          {/* Logo mobile */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <CliniPlusLogo size={40} textSize="lg" theme="dark" />
          </div>

          {/* Login card with glassmorphism */}
          <div
            className="rounded-[20px] p-8"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.05)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
          >
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-[#f1f5f9]">Bem-vindo de volta</h2>
              <p className="text-[#94a3b8] mt-1">Acesse sua conta para continuar</p>
            </div>

            {/* Mensagem de sucesso */}
            {successMessage && (
              <div className="flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-lg px-3 py-2.5 mb-2">
                <Stethoscope className="w-4 h-4 text-cyan-400 shrink-0" />
                <p className="text-sm text-cyan-300">{successMessage}</p>
              </div>
            )}

            {/* Formulário */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              {/* E-mail */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#94a3b8] mb-1.5">
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="seu@email.com.br"
                  {...register('email')}
                  className={cn(
                    darkInput,
                    errors.email && 'border-red-400 focus:ring-red-400/20'
                  )}
                />
                {errors.email && (
                  <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.email.message}
                  </p>
                )}
              </div>

              {/* Senha */}
              <div>
                <label htmlFor="senha" className="block text-sm font-medium text-[#94a3b8] mb-1.5">
                  Senha
                </label>
                <div className="relative">
                  <input
                    id="senha"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    {...register('senha')}
                    className={cn(
                      darkInput,
                      'pr-10',
                      errors.senha && 'border-red-400 focus:ring-red-400/20'
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#94a3b8] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.senha && (
                  <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.senha.message}
                  </p>
                )}
              </div>

              {/* Esqueci minha senha */}
              <div className="flex justify-end">
                <button type="button" onClick={() => setShowReset(true)} className="text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
                  Esqueci minha senha
                </button>
              </div>

              {/* Erro global */}
              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {/* Botão entrar */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white rounded-xl transition-all duration-200 bg-gradient-to-r from-cyan-600 to-indigo-500 hover:from-cyan-700 hover:to-indigo-600 shadow-lg shadow-cyan-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Entrando...</>
                ) : (
                  <><LogIn className="w-4 h-4" /> Entrar</>
                )}
              </button>
            </form>

            {/* Botão criar conta */}
            <div className="mt-6">
              <Link
                to="/register"
                className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-medium text-cyan-400 hover:text-cyan-300 rounded-xl transition-colors"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <UserPlus className="w-4 h-4" /> Criar uma conta
              </Link>
            </div>
          </div>

          {/* Demo credentials (apenas em dev) */}
          {DEMO_CREDENTIALS.length > 0 && (
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[rgba(255,255,255,0.06)]" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 text-[#64748b] font-medium" style={{ background: '#090e1a' }}>Acesso rápido (demonstração)</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {DEMO_CREDENTIALS.map((demo) => (
                <button
                  key={demo.email}
                  type="button"
                  onClick={() => fillDemo(demo.email, demo.senha)}
                  className="flex flex-col items-center gap-1 p-3 rounded-lg transition-all duration-150 group"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                    e.currentTarget.style.borderColor = 'rgba(8,145,178,0.3)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
                  }}
                >
                  <span className="text-xs font-semibold text-[#94a3b8] group-hover:text-cyan-400">
                    {demo.label}
                  </span>
                  <span className="text-[10px] text-[#64748b] group-hover:text-cyan-500 truncate w-full text-center">
                    {demo.email.split('@')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>
          )}

          <p className="text-center text-xs text-[#64748b] mt-8">
            CliniPlus &copy; {new Date().getFullYear()} &middot; Todos os direitos reservados
          </p>
        </div>
      </div>
      {/* Modal Reset de Senha */}
      {showReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowReset(false); setResetSent(false) }} />
          <div
            className="relative rounded-2xl shadow-2xl w-full max-w-sm animate-fade-in"
            style={{
              background: 'rgba(12, 18, 32, 0.95)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
          >
            <div className="p-6">
              {resetSent ? (
                <div className="text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-cyan-500/10 flex items-center justify-center mx-auto">
                    <CheckCircle className="w-7 h-7 text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-bold text-[#f1f5f9]">E-mail enviado!</h3>
                  <p className="text-sm text-[#94a3b8]">Verifique sua caixa de entrada em <b className="text-[#f1f5f9]">{resetEmail}</b> e siga as instruções para redefinir sua senha.</p>
                  <button
                    onClick={() => { setShowReset(false); setResetSent(false) }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-500 hover:from-cyan-700 hover:to-indigo-600 shadow-lg shadow-cyan-500/20 transition-all duration-200"
                  >
                    Voltar ao login
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                      <KeyRound className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#f1f5f9]">Recuperar senha</h3>
                      <p className="text-xs text-[#64748b]">Enviaremos um link de redefinição</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#94a3b8] mb-1">E-mail da conta</label>
                      <input type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} placeholder="seu@email.com.br"
                        className={darkInput} autoFocus />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowReset(false)}
                        className="flex-1 px-4 py-2.5 text-sm font-medium text-[#94a3b8] rounded-xl transition-colors"
                        style={{ background: 'rgba(255,255,255,0.06)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                      >
                        Cancelar
                      </button>
                      <button
                        disabled={resetLoading || !resetEmail.includes('@')}
                        onClick={async () => {
                          setResetLoading(true)
                          try {
                            const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
                              redirectTo: `${window.location.origin}/login`,
                            })
                            if (error) throw error
                            setResetSent(true)
                          } catch (e: any) {
                            alert(e.message || 'Erro ao enviar e-mail.')
                          } finally { setResetLoading(false) }
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 to-indigo-500 hover:from-cyan-700 hover:to-indigo-600 rounded-xl transition-colors disabled:opacity-50"
                      >
                        {resetLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />} Enviar
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
