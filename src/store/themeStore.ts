import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'dark' | 'light'

interface ThemeState {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const applyTheme = (theme: Theme) => {
  const root = document.documentElement
  root.classList.remove('dark', 'light')
  root.classList.add(theme)
}

const getInitialTheme = (): Theme => {
  try {
    const stored = JSON.parse(localStorage.getItem('cliniplus-theme') || '{}')
    if (stored?.state?.theme === 'light' || stored?.state?.theme === 'dark') return stored.state.theme
  } catch { /* ignore */ }
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: getInitialTheme(),
      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark'
        applyTheme(next)
        set({ theme: next })
      },
      setTheme: (theme: Theme) => {
        applyTheme(theme)
        set({ theme })
      },
    }),
    { name: 'cliniplus-theme' }
  )
)

// Apply theme on initial load
applyTheme(getInitialTheme())
