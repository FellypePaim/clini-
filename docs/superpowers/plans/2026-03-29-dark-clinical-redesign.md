# Dark Clinical Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar o visual do Clini+ de um tema verde generico para o estilo "Dark Clinical" premium com suporte a light/dark mode.

**Architecture:** CSS custom properties como design tokens no `index.css`, classe `.dark`/`.light` no `<html>`, Zustand store para persistencia do tema, Tailwind dark variant. Todas as cores derivam dos tokens — mudar o tema muda todos os componentes de uma vez.

**Tech Stack:** React 19, Tailwind 4, Zustand 5, DM Sans (Google Fonts), Lucide React

**Spec:** `docs/superpowers/specs/2026-03-29-dark-clinical-redesign-design.md`

---

## File Map

### Create
- `src/store/themeStore.ts` — Zustand store para tema (dark/light) com persistencia localStorage

### Modify
- `src/index.css` — Design tokens CSS custom properties (dark/light), trocar Inter por DM Sans, reescrever utility classes
- `tailwind.config.js` — Nova paleta primary (cyan), remover verde, configurar darkMode
- `src/components/layout/MainLayout.tsx` — Background adaptativo via token
- `src/components/layout/Sidebar.tsx` — Redesign completo + toggle theme
- `src/components/layout/Header.tsx` — Nova paleta, backgrounds adaptativos
- `src/components/dashboard/KpiCards.tsx` — Glassmorphism, gradientes, radial glow
- `src/components/dashboard/ConsultasChart.tsx` — Cores do novo tema
- `src/components/dashboard/ProcedimentosPieChart.tsx` — Cores do novo tema
- `src/components/dashboard/AgendamentosList.tsx` — Border-left colorida, backgrounds
- `src/components/dashboard/PacientesRecentes.tsx` — Avatares novo estilo
- `src/components/dashboard/LeadsRecentes.tsx` — Badges nova paleta
- `src/components/ui/Badge.tsx` — Variantes adaptativas dark/light
- `src/components/ui/Avatar.tsx` — Cores atualizadas
- `src/components/ui/ToastProvider.tsx` — Cores adaptativas
- `src/pages/Login/LoginPage.tsx` — Redesign com gradiente brand
- `src/pages/Dashboard/DashboardPage.tsx` — Background e layout adaptativos

---

## Task 1: Design Tokens + Font (index.css + tailwind.config.js)

**Files:**
- Modify: `src/index.css` (rewrite completo)
- Modify: `tailwind.config.js` (nova paleta)

- [ ] **Step 1: Substituir import do Inter por DM Sans no index.css**

Trocar a primeira linha:
```css
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
```

- [ ] **Step 2: Reescrever @theme com tokens dark/light**

Substituir o bloco `@theme` inteiro por tokens CSS custom properties. Definir `:root` (dark por padrao) e `.light` override:

```css
@theme {
  --font-sans: 'DM Sans', sans-serif;

  /* Dark Mode Tokens (padrao) */
  --color-bg-deep: #060a14;
  --color-bg-base: #0c1220;
  --color-bg-card: rgba(255,255,255,0.03);
  --color-bg-card-hover: rgba(255,255,255,0.05);
  --color-bg-sidebar: rgba(255,255,255,0.025);
  --color-border: rgba(255,255,255,0.05);
  --color-border-hover: rgba(255,255,255,0.1);
  --color-text-primary: #f1f5f9;
  --color-text-secondary: #94a3b8;
  --color-text-muted: #64748b;
  --color-text-dim: #475569;

  /* Accent colors (mesmos em ambos os modos) */
  --color-accent-cyan: #0891b2;
  --color-accent-cyan-light: #22d3ee;
  --color-accent-indigo: #6366f1;
  --color-accent-indigo-light: #a5b4fc;
  --color-accent-emerald: #10b981;
  --color-accent-emerald-light: #34d399;
  --color-accent-amber: #f59e0b;
  --color-accent-amber-light: #fbbf24;
  --color-destructive: #ef4444;

  /* Animations */
  --animate-fade-in: fade-in 0.3s ease-out;
  --animate-slide-in: slide-in 0.25s ease-out;
  --animate-pulse-accent: pulse-accent 2s infinite;

  @keyframes fade-in {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes slide-in {
    from { transform: translateX(-100%); }
    to   { transform: translateX(0); }
  }
  @keyframes pulse-accent {
    0%, 100% { box-shadow: 0 0 0 0 rgba(8, 145, 178, 0.4); }
    50%      { box-shadow: 0 0 0 6px rgba(8, 145, 178, 0); }
  }
}
```

- [ ] **Step 3: Adicionar classe .light com overrides**

Apos o `@theme`, adicionar:
```css
.light {
  --color-bg-deep: #f8fafc;
  --color-bg-base: #f1f5f9;
  --color-bg-card: #ffffff;
  --color-bg-card-hover: #f8fafc;
  --color-bg-sidebar: #ffffff;
  --color-border: #f1f5f9;
  --color-border-hover: #e2e8f0;
  --color-text-primary: #0f172a;
  --color-text-secondary: #475569;
  --color-text-muted: #94a3b8;
  --color-text-dim: #cbd5e1;
}
```

- [ ] **Step 4: Atualizar utility classes (btn-primary, input-base, sidebar-item)**

Trocar todas as referencias `#16A34A` por `var(--color-accent-cyan)`, trocar backgrounds e textos por tokens:

```css
body {
  background-color: var(--color-bg-deep);
  color: var(--color-text-primary);
}

.sidebar-item { color: var(--color-text-muted); }
.sidebar-item:hover { background-color: rgba(8,145,178,0.08); color: var(--color-accent-cyan); }
.sidebar-item.active { background-color: rgba(8,145,178,0.12); color: var(--color-accent-cyan); font-weight: 600; }

.btn-primary { background-color: var(--color-accent-cyan); }
.btn-primary:hover { background-color: #0e7490; }

.input-base { background: var(--color-bg-card); border-color: var(--color-border); color: var(--color-text-primary); }
.input-base:focus { border-color: var(--color-accent-cyan); box-shadow: 0 0 0 3px rgba(8,145,178,0.12); }
```

- [ ] **Step 5: Atualizar tailwind.config.js — nova paleta primary**

Trocar o bloco `primary` de verde para cyan:
```js
primary: {
  DEFAULT: "#0891b2",
  50: "#ecfeff", 100: "#cffafe", 200: "#a5f3fc",
  300: "#67e8f9", 400: "#22d3ee", 500: "#06b6d4",
  600: "#0891b2", 700: "#0e7490", 800: "#155e75", 900: "#164e63",
  foreground: "#FFFFFF",
}
```

Atualizar sidebar e font:
```js
sidebar: { DEFAULT: "var(--color-bg-sidebar)", foreground: "var(--color-text-primary)", border: "var(--color-border)", active: "rgba(8,145,178,0.12)" }
fontFamily: { sans: ['DM Sans', 'sans-serif'] }
```

- [ ] **Step 6: Verificar build**

Run: `npx tsc --noEmit && npx vite build`
Expected: Build sem erros

- [ ] **Step 7: Commit**

```
git add src/index.css tailwind.config.js
git commit -m "feat(design): tokens CSS dark/light + DM Sans + paleta cyan/indigo"
```

---

## Task 2: Theme Store (Zustand)

**Files:**
- Create: `src/store/themeStore.ts`

- [ ] **Step 1: Criar themeStore com persistencia**

```typescript
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

// Detectar preferencia do sistema como fallback
const getInitialTheme = (): Theme => {
  const saved = localStorage.getItem('cliniplus-theme')
  if (saved === 'light' || saved === 'dark') return saved
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

// Aplicar tema inicial no load
applyTheme(getInitialTheme())
```

- [ ] **Step 2: Importar themeStore no App.tsx para garantir inicializacao**

No topo de `src/App.tsx`, adicionar:
```typescript
import './store/themeStore' // Inicializa tema no load
```

- [ ] **Step 3: Commit**

```
git add src/store/themeStore.ts src/App.tsx
git commit -m "feat(design): theme store dark/light com persistencia"
```

---

## Task 3: Sidebar Redesign + Theme Toggle

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Redesign visual da Sidebar**

Trocar todas as classes de cor:
- `bg-white` → `bg-[var(--color-bg-sidebar)]`
- `border-gray-100` → `border-[var(--color-border)]`
- `bg-green-600` (logo) → Gradiente brand `bg-gradient-to-br from-cyan-600 to-indigo-500`
- `text-green-600` (active) → `text-cyan-500`
- `text-green-400` (chevron) → `text-cyan-400`
- `text-gray-400` → `text-[var(--color-text-muted)]`
- `text-gray-900` → `text-[var(--color-text-primary)]`

- [ ] **Step 2: Adicionar toggle theme no rodape da sidebar**

Antes do `<p>` de versao, adicionar:
```tsx
import { useThemeStore } from '../../store/themeStore'
import { Sun, Moon } from 'lucide-react'

// Dentro do componente:
const { theme, toggleTheme } = useThemeStore()

// No JSX, antes da versao:
<button
  onClick={toggleTheme}
  className="w-full flex items-center justify-center gap-2 p-2 rounded-lg transition-colors mb-2"
  style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
  title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
>
  {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
  {!collapsed && <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>}
</button>
```

- [ ] **Step 3: Commit**

```
git add src/components/layout/Sidebar.tsx
git commit -m "feat(design): sidebar redesign dark clinical + toggle theme"
```

---

## Task 4: Header + MainLayout Redesign

**Files:**
- Modify: `src/components/layout/Header.tsx`
- Modify: `src/components/layout/MainLayout.tsx`

- [ ] **Step 1: MainLayout — background adaptativo**

Trocar `bg-gray-50` por token:
```tsx
<div className="min-h-screen flex" style={{ background: 'var(--color-bg-deep)' }}>
```

- [ ] **Step 2: Header — nova paleta**

Substituicoes globais no Header.tsx:
- `bg-white` → `bg-[var(--color-bg-sidebar)]`
- `border-gray-100` → `border-[var(--color-border)]`
- `text-gray-500/400/300` → `text-[var(--color-text-muted)]` ou `text-[var(--color-text-dim)]`
- `text-gray-800/900` → `text-[var(--color-text-primary)]`
- `text-green-600` (route icon) → `text-cyan-500`
- `bg-green-600` (avatar) → `bg-gradient-to-br from-cyan-600 to-indigo-500`
- `hover:bg-gray-100` → `hover:bg-[var(--color-bg-card-hover)]`
- `bg-gray-50` em dropdowns → `bg-[var(--color-bg-card)]`

- [ ] **Step 3: Commit**

```
git add src/components/layout/Header.tsx src/components/layout/MainLayout.tsx
git commit -m "feat(design): header + mainlayout dark clinical"
```

---

## Task 5: Dashboard Components Redesign

**Files:**
- Modify: `src/components/dashboard/KpiCards.tsx`
- Modify: `src/components/dashboard/ConsultasChart.tsx`
- Modify: `src/components/dashboard/ProcedimentosPieChart.tsx`
- Modify: `src/components/dashboard/AgendamentosList.tsx`
- Modify: `src/components/dashboard/PacientesRecentes.tsx`
- Modify: `src/components/dashboard/LeadsRecentes.tsx`
- Modify: `src/pages/Dashboard/DashboardPage.tsx`

- [ ] **Step 1: KpiCards — glassmorphism + gradientes**

Substituir todos os card styles por tokens. Cada card:
```
background: var(--color-bg-card)
backdrop-filter: blur(20px)
border: 1px solid var(--color-border)
border-radius: 16px
```

Progresso bars: gradientes cyan, indigo, emerald, amber.
Ultimo card (presenca): `background: linear-gradient(135deg, rgba(8,145,178,0.15), rgba(99,102,241,0.08))`.

Trocar: `bg-green-50` → removido, `text-green-600` → `text-cyan-500`, etc.

- [ ] **Step 2: ConsultasChart — cores do tema**

Trocar `#16A34A` por `#0891b2` na `<Line>` e tooltip. Barras/area com cyan gradient.

- [ ] **Step 3: ProcedimentosPieChart — nova paleta**

Trocar array CORES:
```typescript
const CORES = ['#0891b2', '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#14b8a6']
```

- [ ] **Step 4: AgendamentosList — cards com border-left**

Cards de agendamentos com `border-left: 3px solid accent-color`, background do card via token.

- [ ] **Step 5: PacientesRecentes e LeadsRecentes — tokens**

Substituir backgrounds e textos por tokens. Trocar `bg-green-100 text-green-700` por `bg-cyan-100/10 text-cyan-500`.

- [ ] **Step 6: DashboardPage — background + gradiente Insights**

Botao Insights IA: `from-cyan-600 to-indigo-500` ao inves de `from-green-600 to-emerald-500`.
Modal: backgrounds via tokens.

- [ ] **Step 7: Verificar build**

Run: `npx tsc --noEmit && npx vite build`

- [ ] **Step 8: Commit**

```
git add src/components/dashboard/ src/pages/Dashboard/
git commit -m "feat(design): dashboard dark clinical — KPIs, charts, listas"
```

---

## Task 6: UI Components (Badge, Avatar, Toast)

**Files:**
- Modify: `src/components/ui/Badge.tsx`
- Modify: `src/components/ui/Avatar.tsx`
- Modify: `src/components/ui/ToastProvider.tsx`

- [ ] **Step 1: Badge — variantes adaptativas**

Trocar as cores hardcoded por variantes que funcionam em ambos os modos. O verde vira cyan:
```typescript
green: 'bg-cyan-500/10 text-cyan-500 ring-cyan-500/20'
```

- [ ] **Step 2: Avatar — trocar verde por cyan**

No array de cores, trocar `bg-green-100 text-green-600` por `bg-cyan-500/10 text-cyan-500`.

- [ ] **Step 3: ToastProvider — adaptar fundo**

Os toasts usam cores semanticas (emerald, red, amber, blue). Manter, mas adaptar o fundo base para funcionar em dark:
```
bg-emerald-500/10 border-emerald-500/20 text-emerald-400 (dark)
bg-emerald-50 border-emerald-200 text-emerald-800 (light)
```

Usar `useThemeStore` para condicionar ou usar opacity-based colors que funcionam em ambos.

- [ ] **Step 4: Commit**

```
git add src/components/ui/
git commit -m "feat(design): badge, avatar, toast dark/light"
```

---

## Task 7: Login Page Redesign

**Files:**
- Modify: `src/pages/Login/LoginPage.tsx`

- [ ] **Step 1: Redesign do LoginPage**

Background: gradiente `from-[#060a14] to-[#0c1220]` (sempre dark, nao segue toggle).
Card de login: glassmorphism.
Logo: gradiente brand cyan-to-indigo.
Botao login: gradiente brand.
Trocar todos os `green-*` por `cyan-*`.

- [ ] **Step 2: Commit**

```
git add src/pages/Login/LoginPage.tsx
git commit -m "feat(design): login page dark clinical"
```

---

## Task 8: Varredura Global — Substituir Verde Residual

**Files:**
- Todas as paginas em `src/pages/`
- Todos os componentes em `src/components/`

- [ ] **Step 1: Grep por classes verdes remanescentes**

Run: `grep -rn "green-" src/ --include="*.tsx" --include="*.ts" | grep -v node_modules | grep -v ".superpowers"`

Para cada ocorrencia:
- `bg-green-600` → `bg-gradient-to-br from-cyan-600 to-indigo-500` (logos/CTAs)
- `bg-green-500` → `bg-cyan-500`
- `bg-green-50` → `bg-cyan-500/5` ou `var(--color-bg-card)`
- `text-green-600/700` → `text-cyan-500`
- `text-green-500` → `text-cyan-400`
- `border-green-*` → `border-cyan-*` equivalente
- `hover:bg-green-*` → equivalente cyan
- `shadow-green-*` → `shadow-cyan-*`
- `from-green-* to-emerald-*` → `from-cyan-600 to-indigo-500`
- `ring-green-*` → `ring-cyan-*`

Manter `text-emerald-*` e `bg-emerald-*` onde forem status de sucesso (nao accent).

- [ ] **Step 2: Grep por bg-gray-50 e bg-white remanescentes**

Run: `grep -rn "bg-gray-50\|bg-white" src/ --include="*.tsx" | grep -v node_modules`

Substituir por tokens onde for background de pagina/card. Manter onde for componente interno semantico.

- [ ] **Step 3: Verificar build final**

Run: `npx tsc --noEmit && npx vite build`

- [ ] **Step 4: Testar visualmente dark + light mode**

Run: `npx vite dev`
- Abrir no browser
- Verificar dark mode (padrao)
- Clicar toggle na sidebar para light mode
- Navegar por Dashboard, Agenda, Pacientes, LYRA, Financeiro
- Verificar contraste de texto em ambos os modos

- [ ] **Step 5: Commit final**

```
git add -A
git commit -m "feat(design): varredura global — substituir verde residual por cyan/indigo"
```

---

## Task 9: Documentacao + Push

**Files:**
- Modify: `CONTEXTO_PROJETO.md`
- Modify: `src/components/layout/Sidebar.tsx` (versao)

- [ ] **Step 1: Atualizar CONTEXTO_PROJETO com fase de redesign**

- [ ] **Step 2: Atualizar versao para v2.0.0 na Sidebar**

- [ ] **Step 3: Push**

```
git push
```

---

## Resumo de Commits (9 tasks)

1. `feat(design): tokens CSS dark/light + DM Sans + paleta cyan/indigo`
2. `feat(design): theme store dark/light com persistencia`
3. `feat(design): sidebar redesign dark clinical + toggle theme`
4. `feat(design): header + mainlayout dark clinical`
5. `feat(design): dashboard dark clinical — KPIs, charts, listas`
6. `feat(design): badge, avatar, toast dark/light`
7. `feat(design): login page dark clinical`
8. `feat(design): varredura global — substituir verde residual`
9. `docs: v2.0.0 — Dark Clinical redesign`

**Tempo estimado:** 9 tasks, cada uma com build check, total ~45 minutos de execucao automatizada.
