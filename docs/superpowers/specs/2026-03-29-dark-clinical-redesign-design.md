# Dark Clinical Redesign — Design Spec

> **Data:** 29/03/2026
> **Status:** Aprovado
> **Versao alvo:** v2.0.0

## Resumo

Redesign completo do UI/UX do Clini+ (Prontuario Verde) de um visual generico com base verde para o estilo **Dark Clinical** — dark mode premium com light mode alternativo. Paleta cyan/indigo/emerald/amber. Tipografia DM Sans. Glassmorphism nos cards. Toggle light/dark na sidebar.

## Decisoes de Design

### Contexto
- Sistema SaaS multi-tenant para clinicas medicas e odontologicas
- Usuarios: medicos, dentistas, recepcionistas — usam 8h/dia
- Problemas atuais: parece template generico, sem identidade de saude, visual plano sem profundidade

### Direcao escolhida: Dark Clinical
- **Tom:** Confianca clinica + moderno + premium/sofisticado
- **Referencias:** Apple Health (cards arredondados, gradientes) + Figma/Vercel (dark mode, contrastes)
- **Diferencial:** Nao parece "mais um SaaS verde" — tem personalidade propria

### Alternativas descartadas
- **Teal Clinical Light** — clean mas sem a profundidade e impacto desejados
- **Midnight Compact** — sidebar icon-only sacrifica usabilidade para clinicas

## Design System

### Tipografia
- **Fonte:** DM Sans (Google Fonts) — substitui Inter
- **Weights:** 400 (body), 500 (labels), 600 (subtitles), 700 (headings), 800 (hero numbers)
- **Escala:** 9px labels uppercase, 11-12px body, 13-14px headings, 20-24px page titles, 28-32px KPI numbers
- **Tracking:** -1px a -1.5px em numeros grandes, +1.5px a +2px em labels uppercase
- **Numeros:** `font-variant-numeric: tabular-nums` em horarios e valores

### Paleta de Cores

#### Dark Mode (padrao)
| Token | Valor | Uso |
|-------|-------|-----|
| `--bg-deep` | #060a14 | Fundo principal |
| `--bg-base` | #0c1220 | Fundo da area de conteudo |
| `--bg-card` | rgba(255,255,255,0.03) | Cards com glassmorphism |
| `--bg-card-hover` | rgba(255,255,255,0.05) | Card hover |
| `--bg-sidebar` | rgba(255,255,255,0.025) | Sidebar background |
| `--border` | rgba(255,255,255,0.05) | Bordas sutis |
| `--text-primary` | #f1f5f9 | Texto principal |
| `--text-secondary` | #94a3b8 | Texto secundario |
| `--text-muted` | #64748b | Labels, metadata |
| `--text-dim` | #475569 | Texto mais sutil |
| `--accent-cyan` | #0891b2 | Accent primario |
| `--accent-cyan-light` | #22d3ee | Accent primario claro |
| `--accent-indigo` | #6366f1 | Accent secundario |
| `--accent-indigo-light` | #a5b4fc | Accent secundario claro |
| `--accent-emerald` | #10b981 | Sucesso/positivo |
| `--accent-emerald-light` | #34d399 | Sucesso claro |
| `--accent-amber` | #f59e0b | Warning/atencao |
| `--accent-amber-light` | #fbbf24 | Warning claro |
| `--destructive` | #ef4444 | Erro/perigo |
| `--gradient-brand` | linear-gradient(135deg, #0891b2, #6366f1) | Logo, CTAs, destaque |

#### Light Mode (alternativo)
| Token | Valor (override) |
|-------|-----------------|
| `--bg-deep` | #f8fafc |
| `--bg-base` | #f1f5f9 |
| `--bg-card` | #ffffff |
| `--bg-card-hover` | #f8fafc |
| `--bg-sidebar` | #ffffff |
| `--border` | #f1f5f9 |
| `--text-primary` | #0f172a |
| `--text-secondary` | #475569 |
| `--text-muted` | #94a3b8 |
| `--text-dim` | #cbd5e1 |
| Accent colors | Mesmos valores (nao mudam) |
| Card shadow | 0 1px 3px rgba(0,0,0,0.04) |

### Efeitos
- **Glassmorphism (dark):** `backdrop-filter: blur(20px)` nos cards
- **Radial glow:** `radial-gradient(circle, rgba(accent, 0.1), transparent)` no canto dos KPIs
- **Progress bars:** Gradiente do accent color, 3-4px de altura, border-radius 99px
- **Activity dots:** `box-shadow: 0 0 6px rgba(color, 0.5)` para glow sutil
- **Sidebar active:** `border-left: 3px solid accent` + `background: linear-gradient(90deg, rgba(accent, 0.12), transparent)`
- **KPI destaque:** Um card com `background: gradient-brand` (o de presenca/comparecimento)

### Border Radius
- Cards: 14-16px
- Sidebar: 16-20px (cantos internos)
- Buttons: 10-12px
- Inputs: 10px
- Badges: 6-8px
- Progress bars: 99px
- Avatar: 8-10px (quadrado arredondado)
- Logo: 10-11px

### Icones
- **Set:** Lucide React (ja em uso)
- **Tamanho padrao:** 16px na sidebar, 14px em KPIs/badges, 12px inline
- **Stroke width:** 2px (padrao Lucide)
- **Cor:** Herda do contexto (text-muted em sidebar, accent no ativo)

### Animacoes
- **Fade-in:** 0.3s ease-out (translateY 8px) — entrada de paginas
- **Transitions:** 150-300ms em hover/focus (backgrounds, borders, shadows)
- **Progress bars:** `transition: width 700ms ease-out`
- **Respeitar `prefers-reduced-motion`**

### Sombras
- **Dark mode:** Sem sombras (usa bordas e glassmorphism)
- **Light mode:** `0 1px 3px rgba(0,0,0,0.04)` padrao, `0 4px 16px rgba(accent, 0.2)` no KPI destaque

## Componentes Afetados

### Globais (todos os modulos)
1. `index.css` — Novo design system com tokens CSS custom properties
2. `Sidebar.tsx` — Novo visual + toggle light/dark
3. `Header.tsx` — Redesign com nova paleta
4. `MainLayout.tsx` — Background adaptativo

### Dashboard
5. `DashboardPage.tsx` — Layout com nova paleta
6. `KpiCards.tsx` — Glassmorphism + radial glow + progress gradients
7. `ConsultasChart.tsx` — Barras com gradiente cyan
8. `ProcedimentosPieChart.tsx` — Donut com cores do novo sistema
9. `AgendamentosList.tsx` — Cards com border-left colorida
10. `PacientesRecentes.tsx` — Avatares com bordas do novo sistema
11. `LeadsRecentes.tsx` — Badges com nova paleta

### Componentes UI
12. `Badge.tsx` — Adaptar para dark/light
13. `Avatar.tsx` — Quadrado arredondado com gradient
14. `ToastProvider.tsx` — Toasts com nova paleta
15. `TableSkeleton.tsx` — Skeleton com cores do tema

### Login
16. `LoginPage.tsx` — Redesign com gradiente brand

### Todas as paginas
- Substituir verde (#16A34A) por cyan (#0891b2) como accent primario
- Substituir bg-green-50 por bg equivalente do tema
- Trocar Inter por DM Sans

## Theme Toggle

### Implementacao
- **Store:** Novo estado `theme: 'dark' | 'light'` no Zustand (persistido em localStorage)
- **CSS:** Classe `.dark` / `.light` no `<html>` tag
- **Tailwind:** Usar `dark:` variant nativo do Tailwind 4
- **Toggle:** Botao sol/lua no rodape da sidebar
- **Default:** Dark mode

### Persistencia
- `localStorage.getItem('cliniplus-theme')` → 'dark' | 'light'
- Respeitar `prefers-color-scheme` do sistema se nao houver preferencia salva

## Fora de Escopo
- Redesign de logos/branding externo
- Mudancas em edge functions ou backend
- Novos componentes/features — apenas visual das existentes
- Dark mode no SuperAdmin (manter separado)

## Metricas de Sucesso
- Contraste WCAG AA 4.5:1 em ambos os modos
- Build sem aumento significativo de bundle (DM Sans vs Inter similar)
- Todas as paginas funcionais em ambos os modos
- Toggle persiste entre sessoes
