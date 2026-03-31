import React, { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Building2,
  UserPlus,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Check,
  Briefcase,
  Star,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { cn } from '../../lib/utils'
import { CliniPlusLogo } from '../../components/ui/CliniPlusLogo'

// ─── Dark Clinical input classes (same as LoginPage) ─
const darkInput = [
  'w-full rounded-xl px-4 py-2.5 text-sm transition-all duration-200 outline-none',
  'bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)]',
  'text-[#f1f5f9] placeholder-[#64748b]',
  'focus:border-[#0891b2] focus:ring-2 focus:ring-[rgba(8,145,178,0.2)]',
].join(' ')

// ─── Tipo de conta ──────────────────────────────
type AccountType = 'admin' | 'funcionario' | null

// ─── Etapa do fluxo ────────────────────────────
type RegisterStep = 'type' | 'plano' | 'form'

// ─── Planos ─────────────────────────────────────
const PLANOS = [
  {
    id: 'starter',
    nome: 'Starter',
    preco: 'R$ 97/mês',
    descricao: 'Solo iniciante',
    badge: 'Teste 7 dias grátis',
    features: ['1 profissional', 'Agendamento online', 'Prontuário básico'],
    destaque: false,
  },
  {
    id: 'professional',
    nome: 'Professional',
    preco: 'R$ 197/mês',
    descricao: 'Solo consolidado',
    badge: 'Mais completo',
    features: ['1 profissional', 'Financeiro completo', 'IA integrada', 'Relatórios avançados'],
    destaque: true,
  },
  {
    id: 'clinic',
    nome: 'Clinic',
    preco: 'R$ 397/mês',
    descricao: 'Clínica com equipe',
    badge: 'Teste 7 dias grátis',
    features: ['Até 10 profissionais', 'Multi-agenda', 'Faturamento', 'Suporte prioritário'],
    destaque: false,
  },
  {
    id: 'enterprise',
    nome: 'Enterprise',
    preco: 'R$ 797/mês',
    descricao: 'Clínica grande',
    badge: 'Falar com vendas',
    features: ['Profissionais ilimitados', 'API dedicada', 'Onboarding personalizado'],
    destaque: false,
  },
]

// ─── Schemas ────────────────────────────────────
const adminSchema = z.object({
  // Dados da Clínica
  clinica_nome: z.string().min(2, 'Nome da clínica é obrigatório'),
  clinica_cnpj: z.string().optional(),
  clinica_telefone: z.string().optional(),
  clinica_endereco: z.string().optional(),
  // Dados do Admin
  nome: z.string().min(2, 'Nome completo é obrigatório'),
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmar_senha: z.string(),
}).refine(d => d.senha === d.confirmar_senha, {
  message: 'Senhas não coincidem',
  path: ['confirmar_senha'],
})

const funcionarioSchema = z.object({
  nome: z.string().min(2, 'Nome completo é obrigatório'),
  email: z.string().email('E-mail inválido'),
  telefone: z.string().optional(),
  especialidade: z.string().optional(),
  conselho: z.string().optional(),
  senha: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmar_senha: z.string(),
}).refine(d => d.senha === d.confirmar_senha, {
  message: 'Senhas não coincidem',
  path: ['confirmar_senha'],
})

type AdminForm = z.infer<typeof adminSchema>
type FuncionarioForm = z.infer<typeof funcionarioSchema>

// ─── Componente ─────────────────────────────────
export function RegisterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const planoFromUrl = searchParams.get('plano')

  const [accountType, setAccountType] = useState<AccountType>(null)
  const [step, setStep] = useState<RegisterStep>('type')
  const [selectedPlano, setSelectedPlano] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  // Pre-select plan from URL param
  useEffect(() => {
    if (planoFromUrl && accountType === 'admin') {
      setSelectedPlano(planoFromUrl)
      setStep('form')
    }
  }, [planoFromUrl, accountType])

  // ── Escolha do tipo de conta ──────────────────
  if (step === 'type') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'linear-gradient(145deg, #060a14, #0c1220)' }}>
        <div className="w-full max-w-lg animate-fade-in">
          {/* Logo */}
          <div className="flex justify-center mb-10">
            <CliniPlusLogo size={40} textSize="lg" theme="dark" />
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[#f1f5f9]">Criar conta</h1>
            <p className="text-[#64748b] mt-1">Como você deseja se cadastrar?</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Admin / Nova Clínica */}
            <button
              onClick={() => { setAccountType('admin'); setStep('plano') }}
              className="group relative flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] hover:border-cyan-500 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-200"
            >
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 group-hover:bg-cyan-500 transition-colors flex items-center justify-center">
                <Building2 className="w-8 h-8 text-cyan-500 group-hover:text-white transition-colors" />
              </div>
              <div className="text-center">
                <h3 className="font-bold text-[#f1f5f9] text-lg">Administrador</h3>
                <p className="text-sm text-[#64748b] mt-1">Quero cadastrar uma nova clínica</p>
              </div>
              <ArrowRight className="w-5 h-5 text-[#334155] group-hover:text-cyan-500 absolute top-4 right-4 transition-colors" />
            </button>

            {/* Funcionário */}
            <button
              onClick={() => { setAccountType('funcionario'); setStep('form') }}
              className="group relative flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-200"
            >
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 group-hover:bg-blue-500 transition-colors flex items-center justify-center">
                <Briefcase className="w-8 h-8 text-blue-400 group-hover:text-white transition-colors" />
              </div>
              <div className="text-center">
                <h3 className="font-bold text-[#f1f5f9] text-lg">Funcionário</h3>
                <p className="text-sm text-[#64748b] mt-1">Já existe uma clínica cadastrada</p>
              </div>
              <ArrowRight className="w-5 h-5 text-[#334155] group-hover:text-blue-500 absolute top-4 right-4 transition-colors" />
            </button>
          </div>

          <div className="mt-8 text-center">
            <Link to="/login" className="text-sm text-[#64748b] hover:text-cyan-500 transition-colors inline-flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Já tenho uma conta
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Seleção de plano (admin) ──────────────────
  if (step === 'plano') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'linear-gradient(145deg, #060a14, #0c1220)' }}>
        <div className="w-full max-w-3xl animate-fade-in">
          {/* Back button */}
          <button
            onClick={() => { setAccountType(null); setStep('type'); setGlobalError(null) }}
            className="flex items-center gap-1.5 text-sm text-[#64748b] hover:text-cyan-500 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[#f1f5f9]">Escolha seu plano</h1>
            <p className="text-[#64748b] mt-1">Comece grátis por 7 dias, cancele quando quiser</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {PLANOS.map((plano) => (
              <button
                key={plano.id}
                onClick={() => { setSelectedPlano(plano.id); setStep('form') }}
                className={cn(
                  'group relative flex flex-col gap-3 p-5 rounded-2xl border-2 text-left transition-all duration-200',
                  'hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10',
                  plano.destaque
                    ? 'border-indigo-500/50 bg-indigo-500/5'
                    : 'border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)]'
                )}
              >
                {/* Badge */}
                <span className={cn(
                  'inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full self-start',
                  plano.destaque
                    ? 'bg-indigo-500/20 text-indigo-300'
                    : 'bg-[rgba(255,255,255,0.06)] text-[#94a3b8]'
                )}>
                  {plano.destaque && <Star className="w-3 h-3" />}
                  {plano.badge}
                </span>

                {/* Name & price */}
                <div>
                  <h3 className="font-bold text-[#f1f5f9] text-base">{plano.nome}</h3>
                  <p className="text-xs text-[#64748b]">{plano.descricao}</p>
                  <p className="text-lg font-bold text-cyan-400 mt-1">{plano.preco}</p>
                </div>

                {/* Features */}
                <ul className="space-y-1 flex-1">
                  {plano.features.map((f) => (
                    <li key={f} className="text-xs text-[#94a3b8] flex items-start gap-1.5">
                      <Check className="w-3 h-3 text-cyan-500 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* Select indicator */}
                <div className={cn(
                  'text-xs font-semibold text-center py-1.5 rounded-lg transition-colors',
                  'bg-[rgba(255,255,255,0.05)] text-[#64748b] group-hover:bg-indigo-500/20 group-hover:text-indigo-300',
                  plano.destaque && 'bg-indigo-500/10 text-indigo-300'
                )}>
                  Selecionar
                </div>
              </button>
            ))}
          </div>

          <div className="flex flex-col items-center gap-3 mt-2">
            <Link
              to="/planos"
              className="text-sm text-[#64748b] hover:text-cyan-500 transition-colors"
            >
              Ver todos os planos e comparar recursos
            </Link>
            <Link to="/login" className="text-sm text-[#475569] hover:text-cyan-500 transition-colors inline-flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Já tenho uma conta
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Form Admin ────────────────────────────────
  if (accountType === 'admin') {
    return (
      <AdminRegisterForm
        isLoading={isLoading}
        globalError={globalError}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        onBack={() => { setStep('plano'); setGlobalError(null) }}
        onSubmit={async (data) => {
          setIsLoading(true)
          setGlobalError(null)
          try {
            const { data: result, error } = await supabase.functions.invoke('register', {
              body: {
                action: 'register_admin',
                email: data.email,
                senha: data.senha,
                nome: data.nome,
                clinica_nome: data.clinica_nome,
                clinica_cnpj: data.clinica_cnpj || null,
                clinica_telefone: data.clinica_telefone || null,
                clinica_endereco: data.clinica_endereco || null,
                plano_id: selectedPlano ?? 'professional',
              },
            })
            if (error) throw new Error(error.message)
            if (result?.error) throw new Error(result.error)

            navigate('/login', { state: { success: 'Conta criada com sucesso! Faça login para continuar.' } })
          } catch (e: any) {
            setGlobalError(e.message || 'Erro ao criar conta.')
          } finally {
            setIsLoading(false)
          }
        }}
      />
    )
  }

  // ── Form Funcionário ──────────────────────────
  return (
    <FuncionarioRegisterForm
      isLoading={isLoading}
      globalError={globalError}
      showPassword={showPassword}
      setShowPassword={setShowPassword}
      onBack={() => { setAccountType(null); setStep('type'); setGlobalError(null) }}
      onSubmit={async (data) => {
        setIsLoading(true)
        setGlobalError(null)
        try {
          const { data: result, error } = await supabase.functions.invoke('register', {
            body: {
              action: 'register_funcionario',
              email: data.email,
              senha: data.senha,
              nome: data.nome,
              telefone: data.telefone || null,
              especialidade: data.especialidade || null,
              conselho: data.conselho || null,
            },
          })
          if (error) throw new Error(error.message)
          if (result?.error) throw new Error(result.error)

          navigate('/login', { state: { success: 'Conta criada! Aguarde o administrador da clínica vincular seu e-mail à equipe.' } })
        } catch (e: any) {
          setGlobalError(e.message || 'Erro ao criar conta.')
        } finally {
          setIsLoading(false)
        }
      }}
    />
  )
}

// ════════════════════════════════════════════════
// FORM: ADMIN (Nova Clínica)
// ════════════════════════════════════════════════
function AdminRegisterForm({ isLoading, globalError, showPassword, setShowPassword, onBack, onSubmit }: {
  isLoading: boolean
  globalError: string | null
  showPassword: boolean
  setShowPassword: (v: boolean) => void
  onBack: () => void
  onSubmit: (data: AdminForm) => void
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<AdminForm>({
    resolver: zodResolver(adminSchema),
  })

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'linear-gradient(145deg, #060a14, #0c1220)' }}>
      <div className="w-full max-w-lg animate-fade-in">
        {/* Header */}
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-[#64748b] hover:text-cyan-500 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-cyan-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#f1f5f9]">Cadastrar nova clínica</h2>
            <p className="text-sm text-[#64748b]">Preencha os dados da clínica e do administrador</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
          {/* ── Dados da Clínica ── */}
          <fieldset className="space-y-4">
            <legend className="text-xs font-bold text-[#64748b] uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5" /> Dados da Clínica
            </legend>

            <InputField label="Nome da clínica *" id="clinica_nome" placeholder="Ex: Clínica Bem Estar" register={register('clinica_nome')} error={errors.clinica_nome?.message} />

            <div className="grid grid-cols-2 gap-4">
              <InputField label="CNPJ" id="clinica_cnpj" placeholder="00.000.000/0000-00" register={register('clinica_cnpj')} />
              <InputField label="Telefone" id="clinica_telefone" placeholder="(11) 99999-9999" register={register('clinica_telefone')} />
            </div>

            <InputField label="Endereço" id="clinica_endereco" placeholder="Rua, número, bairro, cidade" register={register('clinica_endereco')} />
          </fieldset>

          {/* ── Dados do Administrador ── */}
          <fieldset className="space-y-4">
            <legend className="text-xs font-bold text-[#64748b] uppercase tracking-wider flex items-center gap-2">
              <UserPlus className="w-3.5 h-3.5" /> Seus dados (Administrador)
            </legend>

            <InputField label="Nome completo *" id="nome" placeholder="Seu nome" register={register('nome')} error={errors.nome?.message} />
            <InputField label="E-mail *" id="email" type="email" placeholder="admin@clinica.com.br" register={register('email')} error={errors.email?.message} />

            <div className="grid grid-cols-2 gap-4">
              <PasswordField label="Senha *" id="senha" showPassword={showPassword} toggle={() => setShowPassword(!showPassword)} register={register('senha')} error={errors.senha?.message} />
              <PasswordField label="Confirmar senha *" id="confirmar_senha" showPassword={showPassword} toggle={() => setShowPassword(!showPassword)} register={register('confirmar_senha')} error={errors.confirmar_senha?.message} />
            </div>
          </fieldset>

          {globalError && <ErrorBanner message={globalError} />}

          <button type="submit" disabled={isLoading} className="btn-primary w-full justify-center py-2.5 text-sm disabled:opacity-70">
            {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Criando...</> : <><Check className="w-4 h-4" /> Criar clínica e conta</>}
          </button>
        </form>

        <p className="text-center text-xs text-[#475569] mt-6">
          <Link to="/login" className="hover:text-cyan-500 transition-colors">Já tenho uma conta</Link>
        </p>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════
// FORM: FUNCIONÁRIO
// ════════════════════════════════════════════════
function FuncionarioRegisterForm({ isLoading, globalError, showPassword, setShowPassword, onBack, onSubmit }: {
  isLoading: boolean
  globalError: string | null
  showPassword: boolean
  setShowPassword: (v: boolean) => void
  onBack: () => void
  onSubmit: (data: FuncionarioForm) => void
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<FuncionarioForm>({
    resolver: zodResolver(funcionarioSchema),
  })

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'linear-gradient(145deg, #060a14, #0c1220)' }}>
      <div className="w-full max-w-lg animate-fade-in">
        {/* Header */}
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-[#64748b] hover:text-blue-400 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#f1f5f9]">Cadastro de funcionário</h2>
            <p className="text-sm text-[#64748b]">Após o cadastro, aguarde o admin vincular você à clínica</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <InputField label="Nome completo *" id="nome" placeholder="Seu nome completo" register={register('nome')} error={errors.nome?.message} />
          <InputField label="E-mail *" id="email" type="email" placeholder="seu@email.com.br" register={register('email')} error={errors.email?.message} />
          <InputField label="Telefone" id="telefone" placeholder="(11) 99999-9999" register={register('telefone')} />

          <div className="grid grid-cols-2 gap-4">
            <InputField label="Especialidade" id="especialidade" placeholder="Ex: Dermatologia" register={register('especialidade')} />
            <InputField label="Conselho (CRM/CRO)" id="conselho" placeholder="CRM/SP 123456" register={register('conselho')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <PasswordField label="Senha *" id="senha" showPassword={showPassword} toggle={() => setShowPassword(!showPassword)} register={register('senha')} error={errors.senha?.message} />
            <PasswordField label="Confirmar senha *" id="confirmar_senha" showPassword={showPassword} toggle={() => setShowPassword(!showPassword)} register={register('confirmar_senha')} error={errors.confirmar_senha?.message} />
          </div>

          {globalError && <ErrorBanner message={globalError} />}

          <button type="submit" disabled={isLoading} className="btn-primary w-full justify-center py-2.5 text-sm disabled:opacity-70">
            {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Cadastrando...</> : <><Check className="w-4 h-4" /> Criar minha conta</>}
          </button>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mt-2">
            <p className="text-xs text-blue-300 leading-relaxed">
              Após criar sua conta, o administrador da clínica precisará adicionar seu e-mail na equipe.
              Você receberá acesso assim que for vinculado.
            </p>
          </div>
        </form>

        <p className="text-center text-xs text-[#475569] mt-6">
          <Link to="/login" className="hover:text-blue-400 transition-colors">Já tenho uma conta</Link>
        </p>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════
// UI Helpers
// ════════════════════════════════════════════════
function InputField({ label, id, type = 'text', placeholder, register, error }: {
  label: string; id: string; type?: string; placeholder?: string; register: any; error?: string
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-[#94a3b8] mb-1">{label}</label>
      <input id={id} type={type} placeholder={placeholder} {...register}
        className={cn(darkInput, error && 'border-red-400 focus:ring-red-400')} />
      {error && <p className="mt-1 text-xs text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {error}</p>}
    </div>
  )
}

function PasswordField({ label, id, showPassword, toggle, register, error }: {
  label: string; id: string; showPassword: boolean; toggle: () => void; register: any; error?: string
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-[#94a3b8] mb-1">{label}</label>
      <div className="relative">
        <input id={id} type={showPassword ? 'text' : 'password'} placeholder="••••••" {...register}
          className={cn(darkInput, 'pr-10', error && 'border-red-400 focus:ring-red-400')} />
        <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#475569] hover:text-[#94a3b8]">
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {error}</p>}
    </div>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
      <p className="text-sm text-red-300">{message}</p>
    </div>
  )
}
