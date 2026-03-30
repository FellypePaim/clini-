import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

export interface OnboardingStep {
  id: string
  title: string
  description: string
  path: string
  completed: boolean
}

export function useOnboarding() {
  const { user } = useAuthStore()
  const [steps, setSteps] = useState<OnboardingStep[]>([])
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  const checkSteps = useCallback(async () => {
    if (!user?.clinicaId || user.role !== 'administrador') {
      setSteps([])
      setLoading(false)
      return
    }

    try {
      // Fetch clinic data
      const { data: clinica } = await supabase
        .from('clinicas')
        .select('nome, telefone, endereco, horario_funcionamento, configuracoes')
        .eq('id', user.clinicaId)
        .single()

      // Count procedimentos
      const { count: procCount } = await supabase
        .from('procedimentos')
        .select('*', { count: 'exact', head: true })
        .eq('clinica_id', user.clinicaId)

      // Count profissionais (excluindo o admin)
      const { count: profCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('clinica_id', user.clinicaId)
        .neq('id', user.id)

      // Count pacientes
      const { count: pacCount } = await supabase
        .from('pacientes')
        .select('*', { count: 'exact', head: true })
        .eq('clinica_id', user.clinicaId)

      const endereco = clinica?.endereco as any
      const horario = clinica?.horario_funcionamento as any
      const config = clinica?.configuracoes as any

      const hasEndereco = !!(endereco?.logradouro && endereco?.cidade)
      const hasHorario = !!(horario?.inicio && horario?.fim && horario?.dias?.length > 0)
      const hasLogo = !!(config?.logo_url)

      const newSteps: OnboardingStep[] = [
        {
          id: 'dados_clinica',
          title: 'Preencher dados da clinica',
          description: 'Nome, telefone, endereco e horario de funcionamento',
          path: '/configuracoes/clinica',
          completed: !!(clinica?.telefone && hasEndereco && hasHorario),
        },
        {
          id: 'logo',
          title: 'Adicionar logo da clinica',
          description: 'Upload da logo para personalizar o sistema',
          path: '/configuracoes/clinica',
          completed: hasLogo,
        },
        {
          id: 'procedimento',
          title: 'Cadastrar um procedimento',
          description: 'Adicione os servicos que sua clinica oferece',
          path: '/configuracoes/procedimentos',
          completed: (procCount ?? 0) > 0,
        },
        {
          id: 'profissional',
          title: 'Adicionar um profissional',
          description: 'Cadastre os profissionais da equipe',
          path: '/configuracoes/profissionais',
          completed: (profCount ?? 0) > 0,
        },
        {
          id: 'paciente',
          title: 'Cadastrar primeiro paciente',
          description: 'Adicione seu primeiro paciente ao sistema',
          path: '/pacientes',
          completed: (pacCount ?? 0) > 0,
        },
      ]

      setSteps(newSteps)

      // Auto-dismiss if all done or was dismissed before
      const allDone = newSteps.every((s) => s.completed)
      if (allDone) {
        setDismissed(true)
      } else {
        const wasDismissed = localStorage.getItem(`onboarding-dismissed-${user.clinicaId}`)
        setDismissed(!!wasDismissed)
      }
    } catch (err) {
      console.error('Erro onboarding:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.clinicaId, user?.id, user?.role])

  useEffect(() => {
    checkSteps()
  }, [checkSteps])

  const dismiss = useCallback(() => {
    if (user?.clinicaId) {
      localStorage.setItem(`onboarding-dismissed-${user.clinicaId}`, '1')
    }
    setDismissed(true)
  }, [user?.clinicaId])

  const show = useCallback(() => {
    if (user?.clinicaId) {
      localStorage.removeItem(`onboarding-dismissed-${user.clinicaId}`)
    }
    setDismissed(false)
  }, [user?.clinicaId])

  const completedCount = steps.filter((s) => s.completed).length
  const totalCount = steps.length
  const allDone = totalCount > 0 && completedCount === totalCount
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return { steps, completedCount, totalCount, allDone, progress, loading, dismissed, dismiss, show, refresh: checkSteps }
}
