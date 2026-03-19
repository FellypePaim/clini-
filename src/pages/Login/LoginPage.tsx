import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useLocation } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, LogIn, Stethoscope, AlertCircle, Loader2 } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
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

// ─── Credenciais de demonstração ─────────────────────
const DEMO_CREDENTIALS = [
  { label: 'Administrador', email: 'admin@clinicaverde.com.br', senha: 'admin123' },
  { label: 'Profissional',  email: 'profissional@clinicaverde.com.br', senha: 'prof123' },
  { label: 'Recepção',      email: 'recepcao@clinicaverde.com.br', senha: 'rec123' },
  { label: 'SuperAdmin',     email: 'superadmin@cliniplus.com',      senha: 'superpassword' },
]

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const { login, isLoading, error: authError } = useAuthStore()
  const location = useLocation()
  const error = authError || (location.state as any)?.error

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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex">
      {/* ── Painel esquerdo (branding) ────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-600 to-emerald-700 relative overflow-hidden flex-col justify-between p-12">
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
              <span className="text-green-200 text-2xl font-light"> Verde</span>
            </div>
          </div>

          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Gestão clínica<br />
            inteligente e<br />
            humanizada.
          </h1>
          <p className="text-green-100 text-lg leading-relaxed">
            Agende consultas, gerencie prontuários, 
            acompanhe pacientes e monitore seu 
            financeiro — tudo em um só lugar.
          </p>
        </div>

        <div className="relative z-10">
          <div className="grid grid-cols-1 md: gap-4">
            {[
              { label: 'Pacientes', value: '2.400+' },
              { label: 'Consultas/mês', value: '180+' },
              { label: 'Satisfação', value: '98%' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-green-200 text-xs mt-1">{stat.label}</div>
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
            <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-gray-900 text-xl font-bold">Prontuário</span>
              <span className="text-green-600 text-xl font-light"> Verde</span>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Bem-vindo de volta</h2>
            <p className="text-gray-500 mt-1">Acesse sua conta para continuar</p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* E-mail */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="seu@email.com.br"
                {...register('email')}
                className={cn(
                  'input-base',
                  errors.email && 'border-red-400 focus:ring-red-400'
                )}
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.email.message}
                </p>
              )}
            </div>

            {/* Senha */}
            <div>
              <label htmlFor="senha" className="block text-sm font-medium text-gray-700 mb-1.5">
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
                    'input-base pr-10',
                    errors.senha && 'border-red-400 focus:ring-red-400'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.senha && (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.senha.message}
                </p>
              )}
            </div>

            {/* Erro global */}
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Botão entrar */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full justify-center py-2.5 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Entrando...</>
              ) : (
                <><LogIn className="w-4 h-4" /> Entrar</>
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-gray-400 font-medium">Acesso rápido (demonstração)</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md: gap-2">
              {DEMO_CREDENTIALS.map((demo) => (
                <button
                  key={demo.email}
                  type="button"
                  onClick={() => fillDemo(demo.email, demo.senha)}
                  className="flex flex-col items-center gap-1 p-3 rounded-lg border border-gray-200 
                             hover:border-green-300 hover:bg-green-50 transition-all duration-150 group"
                >
                  <span className="text-xs font-semibold text-gray-700 group-hover:text-green-700">
                    {demo.label}
                  </span>
                  <span className="text-[10px] text-gray-400 group-hover:text-green-500 truncate w-full text-center">
                    {demo.email.split('@')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-8">
            Prontuário Verde © {new Date().getFullYear()} · Todos os direitos reservados
          </p>
        </div>
      </div>
    </div>
  )
}
