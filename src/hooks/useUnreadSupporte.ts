import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

const STORAGE_KEY = 'cliniplus-suporte-last-read'

function getLastRead(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || '1970-01-01T00:00:00Z'
  } catch {
    return '1970-01-01T00:00:00Z'
  }
}

export function markSuporteAsRead() {
  localStorage.setItem(STORAGE_KEY, new Date().toISOString())
}

export function useUnreadSupporte(pollInterval = 60000) {
  const [unreadCount, setUnreadCount] = useState(0)
  const { user } = useAuthStore()

  const fetchUnread = useCallback(async () => {
    if (!user) return

    const lastRead = getLastRead()
    const isSuperAdmin = user.role === 'superadmin'

    try {
      if (isSuperAdmin) {
        // SuperAdmin: conta mensagens de clínicas (e_superadmin = false) após lastRead
        const { count, error } = await supabase
          .from('tickets_mensagens')
          .select('*', { count: 'exact', head: true })
          .eq('e_superadmin', false)
          .gt('created_at', lastRead)

        if (!error) setUnreadCount(count ?? 0)
      } else {
        // Clínica: conta mensagens do superadmin (e_superadmin = true) nos tickets da clínica, após lastRead
        const { data: tickets } = await supabase
          .from('tickets_suporte')
          .select('id')

        if (tickets && tickets.length > 0) {
          const ticketIds = tickets.map((t) => t.id)
          const { count, error } = await supabase
            .from('tickets_mensagens')
            .select('*', { count: 'exact', head: true })
            .eq('e_superadmin', true)
            .gt('created_at', lastRead)
            .in('ticket_id', ticketIds)

          if (!error) setUnreadCount(count ?? 0)
        }
      }
    } catch (err) {
      console.error('Erro ao buscar não lidas:', err)
    }
  }, [user])

  useEffect(() => {
    fetchUnread()
    const interval = setInterval(fetchUnread, pollInterval)
    return () => clearInterval(interval)
  }, [fetchUnread, pollInterval])

  return { unreadCount, refresh: fetchUnread }
}
