import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

export interface TicketClinica {
  id: string
  assunto: string
  descricao: string | null
  clinica_id: string | null
  status: string
  prioridade: string
  created_at: string
  updated_at: string
  total_mensagens: number
}

export interface TicketMensagem {
  id: string
  ticket_id: string
  autor_id: string | null
  conteudo: string
  imagem_url: string | null
  e_superadmin: boolean | null
  created_at: string
  profiles: {
    nome_completo: string
    role: string
    avatar_url: string | null
  } | null
}

export function useSuporteClinica() {
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuthStore()

  const getTickets = useCallback(async (): Promise<TicketClinica[]> => {
    try {
      setIsLoading(true)
      const { data: tickets, error } = await supabase
        .from('tickets_suporte')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const { data: mensagens } = await supabase
        .from('tickets_mensagens')
        .select('ticket_id')

      const countMap: Record<string, number> = {}
      if (mensagens) {
        for (const m of mensagens) {
          countMap[m.ticket_id] = (countMap[m.ticket_id] || 0) + 1
        }
      }

      return (tickets || []).map((t) => ({
        ...t,
        status: t.status || 'aberto',
        prioridade: t.prioridade || 'media',
        total_mensagens: countMap[t.id] || 0,
      }))
    } catch (err) {
      console.error('Erro ao buscar tickets:', err)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createTicket = useCallback(
    async (data: { assunto: string; descricao?: string; prioridade?: string }): Promise<TicketClinica | null> => {
      if (!user?.clinicaId) return null
      try {
        setIsLoading(true)
        const { data: ticket, error } = await supabase
          .from('tickets_suporte')
          .insert({
            assunto: data.assunto,
            descricao: data.descricao || null,
            prioridade: data.prioridade || 'media',
            status: 'aberto',
            clinica_id: user.clinicaId,
          })
          .select()
          .single()

        if (error) throw error
        return { ...ticket, status: ticket.status || 'aberto', prioridade: ticket.prioridade || 'media', total_mensagens: 0 }
      } catch (err) {
        console.error('Erro ao criar ticket:', err)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [user?.clinicaId],
  )

  const getMessages = useCallback(async (ticketId: string): Promise<TicketMensagem[]> => {
    try {
      const { data, error } = await supabase
        .from('tickets_mensagens')
        .select('*, profiles:autor_id(nome_completo, role, avatar_url)')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return (data || []) as unknown as TicketMensagem[]
    } catch (err) {
      console.error('Erro ao buscar mensagens:', err)
      return []
    }
  }, [])

  const sendMessage = useCallback(
    async (ticketId: string, conteudo: string, imagemUrl?: string): Promise<TicketMensagem | null> => {
      if (!user) return null
      try {
        const { data, error } = await supabase
          .from('tickets_mensagens')
          .insert({
            ticket_id: ticketId,
            conteudo: conteudo || '',
            autor_id: user.id,
            e_superadmin: false,
            imagem_url: imagemUrl || null,
          })
          .select('*, profiles:autor_id(nome_completo, role, avatar_url)')
          .single()

        if (error) throw error
        return data as unknown as TicketMensagem
      } catch (err) {
        console.error('Erro ao enviar mensagem:', err)
        return null
      }
    },
    [user],
  )

  const uploadImage = useCallback(async (file: File): Promise<string | null> => {
    if (!user?.clinicaId) return null
    try {
      const ext = file.name.split('.').pop() || 'png'
      const path = `suporte/${user.clinicaId}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('clinica-assets')
        .upload(path, file, { contentType: file.type })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('clinica-assets')
        .getPublicUrl(path)

      return urlData.publicUrl
    } catch (err) {
      console.error('Erro ao fazer upload:', err)
      return null
    }
  }, [user?.clinicaId])

  const reopenTicket = useCallback(async (ticketId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('tickets_suporte')
        .update({ status: 'aberto', updated_at: new Date().toISOString() })
        .eq('id', ticketId)
      if (error) throw error
      return true
    } catch (err) {
      console.error('Erro ao reabrir ticket:', err)
      return false
    }
  }, [])

  const rateTicket = useCallback(async (ticketId: string, avaliacao: number, comentario?: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('tickets_suporte')
        .update({ avaliacao, avaliacao_comentario: comentario || null })
        .eq('id', ticketId)
      if (error) throw error
      return true
    } catch (err) {
      console.error('Erro ao avaliar ticket:', err)
      return false
    }
  }, [])

  return { getTickets, createTicket, getMessages, sendMessage, uploadImage, reopenTicket, rateTicket, isLoading }
}
