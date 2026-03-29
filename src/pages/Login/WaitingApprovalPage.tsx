import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, LogOut, RefreshCw, CheckCircle, Stethoscope, Mail } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'

export function WaitingApprovalPage() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [checking, setChecking] = useState(false)
  const [dots, setDots] = useState('')

  // Animação dos dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.')
    }, 600)
    return () => clearInterval(interval)
  }, [])

  // Poll a cada 15s para verificar se foi vinculado
  useEffect(() => {
    if (!user) return

    const check = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('clinica_id, ativo')
        .eq('id', user.id)
        .single()

      if (data?.clinica_id && data?.ativo) {
        // Foi aprovado! Relogar para atualizar o store
        navigate('/login', { state: { success: 'Você foi vinculado a uma clínica! Faça login novamente.' } })
        logout()
      }
    }

    check()
    const interval = setInterval(check, 15000)
    return () => clearInterval(interval)
  }, [user, navigate, logout])

  const handleManualCheck = async () => {
    if (!user) return
    setChecking(true)
    try {
      const { data } = await supabase
        .from('profiles')
        .select('clinica_id, ativo')
        .eq('id', user.id)
        .single()

      if (data?.clinica_id && data?.ativo) {
        navigate('/login', { state: { success: 'Você foi vinculado! Faça login novamente.' } })
        logout()
      }
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'linear-gradient(145deg, #060a14, #0c1220)' }}>
      <div className="w-full max-w-md text-center animate-fade-in">
        {/* Logo */}
        <div className="flex items-center gap-3 justify-center mb-10">
          <div className="w-10 h-10 bg-cyan-600 rounded-xl flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-[#f1f5f9] text-xl font-bold">Prontuário</span>
            <span className="text-cyan-500 text-xl font-light"> Verde</span>
          </div>
        </div>

        {/* Ícone animado */}
        <div className="relative mx-auto w-24 h-24 mb-8">
          <div className="absolute inset-0 rounded-full bg-amber-500/10 animate-pulse" />
          <div className="relative w-full h-full rounded-full bg-amber-500/5 border-2 border-amber-500/30 flex items-center justify-center">
            <Clock className="w-10 h-10 text-amber-500" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-[#f1f5f9] mb-2">
          Aguardando aprovação{dots}
        </h1>

        <p className="text-[#94a3b8] leading-relaxed mb-8 max-w-sm mx-auto">
          Sua conta foi criada com sucesso! Agora é preciso que o <strong className="text-[#f1f5f9]">administrador da clínica</strong> vincule seu e-mail à equipe.
        </p>

        {/* Info box */}
        <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-xl p-5 mb-6 text-left space-y-3">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-[#f1f5f9]">Seu e-mail cadastrado</p>
              <p className="text-sm text-[#64748b]">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-cyan-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-[#f1f5f9]">O que o admin precisa fazer</p>
              <p className="text-sm text-[#64748b]">Ir em Configurações → Profissionais → adicionar seu e-mail à equipe</p>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleManualCheck}
            disabled={checking}
            className="btn-primary w-full justify-center py-2.5 text-sm disabled:opacity-70"
          >
            {checking ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Verificando...</>
            ) : (
              <><RefreshCw className="w-4 h-4" /> Verificar agora</>
            )}
          </button>

          <button
            onClick={() => { logout(); navigate('/login') }}
            className="flex items-center justify-center gap-2 w-full py-2.5 text-sm text-[#64748b] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>

        <p className="text-xs text-[#475569] mt-8">
          Verificação automática a cada 15 segundos
        </p>
      </div>
    </div>
  )
}
