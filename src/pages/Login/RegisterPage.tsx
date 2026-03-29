import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Stethoscope,
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
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { cn } from '../../lib/utils'

// ─── Tipo de conta ──────────────────────────────
type AccountType = 'admin' | 'funcionario' | null

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
  const [accountType, setAccountType] = useState<AccountType>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  // ── Escolha do tipo de conta ──────────────────
  if (!accountType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-indigo-50 flex items-center justify-center p-6">
        <div className="w-full max-w-lg animate-fade-in">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10 justify-center">
            <div className="w-12 h-12 bg-cyan-600 rounded-xl flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-gray-900 text-2xl font-bold">Prontuário</span>
              <span className="text-cyan-500 text-2xl font-light"> Verde</span>
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Criar conta</h1>
            <p className="text-gray-500 mt-1">Como você deseja se cadastrar?</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Admin / Nova Clínica */}
            <button
              onClick={() => setAccountType('admin')}
              className="group relative flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-gray-200 bg-white hover:border-cyan-500 hover:shadow-lg transition-all duration-200"
            >
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 group-hover:bg-cyan-500 transition-colors flex items-center justify-center">
                <Building2 className="w-8 h-8 text-cyan-500 group-hover:text-white transition-colors" />
              </div>
              <div className="text-center">
                <h3 className="font-bold text-gray-900 text-lg">Administrador</h3>
                <p className="text-sm text-gray-500 mt-1">Quero cadastrar uma nova clínica</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-cyan-500 absolute top-4 right-4 transition-colors" />
            </button>

            {/* Funcionário */}
            <button
              onClick={() => setAccountType('funcionario')}
              className="group relative flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-gray-200 bg-white hover:border-blue-500 hover:shadow-lg transition-all duration-200"
            >
              <div className="w-16 h-16 rounded-2xl bg-blue-100 group-hover:bg-blue-500 transition-colors flex items-center justify-center">
                <Briefcase className="w-8 h-8 text-blue-600 group-hover:text-white transition-colors" />
              </div>
              <div className="text-center">
                <h3 className="font-bold text-gray-900 text-lg">Funcionário</h3>
                <p className="text-sm text-gray-500 mt-1">Já existe uma clínica cadastrada</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 absolute top-4 right-4 transition-colors" />
            </button>
          </div>

          <div className="mt-8 text-center">
            <Link to="/login" className="text-sm text-gray-500 hover:text-cyan-500 transition-colors inline-flex items-center gap-1">
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
        onBack={() => { setAccountType(null); setGlobalError(null) }}
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
      onBack={() => { setAccountType(null); setGlobalError(null) }}
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
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-indigo-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg animate-fade-in">
        {/* Header */}
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-cyan-500 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-cyan-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Cadastrar nova clínica</h2>
            <p className="text-sm text-gray-500">Preencha os dados da clínica e do administrador</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
          {/* ── Dados da Clínica ── */}
          <fieldset className="space-y-4">
            <legend className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
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
            <legend className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
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

        <p className="text-center text-xs text-gray-400 mt-6">
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
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-indigo-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg animate-fade-in">
        {/* Header */}
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Cadastro de funcionário</h2>
            <p className="text-sm text-gray-500">Após o cadastro, aguarde o admin vincular você à clínica</p>
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

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
            <p className="text-xs text-blue-700 leading-relaxed">
              Após criar sua conta, o administrador da clínica precisará adicionar seu e-mail na equipe.
              Você receberá acesso assim que for vinculado.
            </p>
          </div>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          <Link to="/login" className="hover:text-blue-600 transition-colors">Já tenho uma conta</Link>
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
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input id={id} type={type} placeholder={placeholder} {...register}
        className={cn('input-base', error && 'border-red-400 focus:ring-red-400')} />
      {error && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {error}</p>}
    </div>
  )
}

function PasswordField({ label, id, showPassword, toggle, register, error }: {
  label: string; id: string; showPassword: boolean; toggle: () => void; register: any; error?: string
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <input id={id} type={showPassword ? 'text' : 'password'} placeholder="••••••" {...register}
          className={cn('input-base pr-10', error && 'border-red-400 focus:ring-red-400')} />
        <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {error}</p>}
    </div>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
      <p className="text-sm text-red-600">{message}</p>
    </div>
  )
}
