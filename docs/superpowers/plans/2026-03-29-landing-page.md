# Clini+ Landing Page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an innovative landing page at route `/` with 8 animated sections, a quiz funnel that sends pre-filled WhatsApp messages, and premium dark glassmorphism design.

**Architecture:** 10 React components in `src/pages/Landing/`, 2 utility hooks, lazy-loaded route. Always dark mode (does not follow app theme toggle). CSS animations for performance. IntersectionObserver for scroll-triggered effects.

**Tech Stack:** React 19, Tailwind 4, DM Sans, Lucide React, canvas-confetti

**Spec:** `docs/superpowers/specs/2026-03-29-landing-page-design.md`

---

## File Map

### Create
- `src/hooks/useInView.ts` — IntersectionObserver hook for scroll animations
- `src/hooks/useCountUp.ts` — Animated number counter hook
- `src/pages/Landing/LandingPage.tsx` — Main container, composes all sections
- `src/pages/Landing/LandingNavbar.tsx` — Fixed glassmorphism navbar
- `src/pages/Landing/HeroSection.tsx` — Hero with blobs + 3D mockup + CTAs
- `src/pages/Landing/SocialProofSection.tsx` — Counters + marquee logos
- `src/pages/Landing/FeaturesSection.tsx` — Interactive tabs + mockup showcase
- `src/pages/Landing/OvyvaSection.tsx` — Live-typing chat simulation
- `src/pages/Landing/BenefitsSection.tsx` — Parallax benefit cards
- `src/pages/Landing/TestimonialsSection.tsx` — Glassmorphism carousel
- `src/pages/Landing/QuizSection.tsx` — Multi-step wizard + score + WhatsApp
- `src/pages/Landing/FooterSection.tsx` — Final CTA + links + badges

### Modify
- `src/router/AppRouter.tsx` — Add `/` route with lazy LandingPage
- `package.json` — Add canvas-confetti dependency

---

## Task 1: Hooks + Dependency + Route

**Files:**
- Create: `src/hooks/useInView.ts`
- Create: `src/hooks/useCountUp.ts`
- Create: `src/pages/Landing/LandingPage.tsx` (skeleton)
- Modify: `src/router/AppRouter.tsx`
- Modify: `package.json`

- [ ] **Step 1: Install canvas-confetti**

```bash
npm install canvas-confetti && npm install -D @types/canvas-confetti
```

- [ ] **Step 2: Create useInView hook**

Create `src/hooks/useInView.ts`:
```typescript
import { useEffect, useRef, useState } from 'react'

export function useInView(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement>(null)
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true)
        observer.unobserve(el) // trigger once
      }
    }, { threshold: 0.15, ...options })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return { ref, isInView }
}
```

- [ ] **Step 3: Create useCountUp hook**

Create `src/hooks/useCountUp.ts`:
```typescript
import { useEffect, useState } from 'react'

export function useCountUp(target: number, duration = 2000, start = false) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!start) return
    let startTime: number
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      setValue(Math.floor(progress * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration, start])

  return value
}
```

- [ ] **Step 4: Create LandingPage skeleton**

Create `src/pages/Landing/LandingPage.tsx`:
```typescript
export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#030608] text-white font-sans">
      <p className="text-center pt-40 text-2xl">Landing Page — em construcao</p>
    </div>
  )
}
```

- [ ] **Step 5: Add route to AppRouter**

In `src/router/AppRouter.tsx`:
- Add lazy import: `const LandingPage = lazyNamed(() => import('../pages/Landing/LandingPage'), 'LandingPage')`
- Add route BEFORE the `RequireAuth` block:
```tsx
<Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
```
- Update the existing `<Route index element={<Navigate to="/dashboard" replace />} />` inside RequireAuth to stay as-is (it handles logged-in users)

- [ ] **Step 6: Verify build**

```bash
npx tsc --noEmit && npx vite build
```

- [ ] **Step 7: Commit**

```
git add src/hooks/useInView.ts src/hooks/useCountUp.ts src/pages/Landing/LandingPage.tsx src/router/AppRouter.tsx package.json package-lock.json
git commit -m "feat(landing): scaffold — hooks, route, skeleton"
```

---

## Task 2: LandingNavbar + HeroSection

**Files:**
- Create: `src/pages/Landing/LandingNavbar.tsx`
- Create: `src/pages/Landing/HeroSection.tsx`
- Modify: `src/pages/Landing/LandingPage.tsx`

- [ ] **Step 1: Create LandingNavbar**

Glassmorphism fixed navbar with:
- Logo (gradient cyan→indigo square + "Clini+" text)
- Links: Funcionalidades, OVYVA, Quiz — use `onClick` with smooth scroll to `#id`
- "Entrar" button (outline, links to `/login`)
- "Diagnostico Gratis" button (gradient CTA, scrolls to `#quiz`)
- Scroll-aware: track `window.scrollY > 50` to increase bg opacity
- Always dark (hardcoded dark colors, NOT tokens)

- [ ] **Step 2: Create HeroSection**

Hero with:
- 2-3 animated blobs (absolute positioned divs with radial-gradient, CSS `@keyframes blob-float` moving translateX/Y over 20s)
- Title: "A clinica do futuro comeca aqui." with gradient text (white→gray)
- Subtitle text
- 3D mockup: div styled as a mini dashboard (KPI cards, chart placeholder) with `transform: perspective(1000px) rotateX(5deg) rotateY(-2deg)`, `onMouseMove` handler for subtle parallax
- 2 CTAs: "Iniciar Diagnostico Gratuito" (scroll to #quiz) + "Ver Funcionalidades" (scroll to #features)
- Stagger fade-in: each element has increasing `animation-delay`
- Add CSS keyframes for blobs in the component (inline style or Tailwind arbitrary)

- [ ] **Step 3: Wire into LandingPage**

Update `LandingPage.tsx` to import and render `LandingNavbar` + `HeroSection`.

- [ ] **Step 4: Build check + commit**

```bash
npx tsc --noEmit && npx vite build
git add src/pages/Landing/
git commit -m "feat(landing): navbar glassmorphism + hero com blobs e parallax 3D"
```

---

## Task 3: SocialProofSection + FeaturesSection

**Files:**
- Create: `src/pages/Landing/SocialProofSection.tsx`
- Create: `src/pages/Landing/FeaturesSection.tsx`
- Modify: `src/pages/Landing/LandingPage.tsx`

- [ ] **Step 1: Create SocialProofSection**

- 4 metric cards using `useCountUp` + `useInView`:
  - { label: "Clinicas", value: 500, prefix: "+" }
  - { label: "Pacientes Gerenciados", value: 50000, prefix: "+" }
  - { label: "Uptime", value: 99.9, suffix: "%", decimals: 1 }
  - { label: "Avaliacao", value: 4.9, suffix: "/5", decimals: 1 }
- Marquee: CSS `@keyframes marquee { from{translateX(0)} to{translateX(-50%)} }`, duplicate items for seamless loop. Use 8-10 placeholder clinic names styled as subtle text.
- Section background: `bg-[rgba(255,255,255,0.02)]`
- `id="social-proof"`

- [ ] **Step 2: Create FeaturesSection**

- State: `activeFeature` index (0-5)
- Left side: 6 vertical tabs (one per module), each with Lucide icon + title + description
- Modules data array:
  ```
  Dashboard — Visao completa da clinica em tempo real
  Agenda — Drag-and-drop com recorrencia e conflitos
  Pacientes / PEP — Prontuario eletronico completo
  OVYVA (IA) — Secretaria virtual 24/7 via WhatsApp
  Verdesk CRM — Kanban de leads e campanhas
  Financeiro — Receitas, despesas e DRE
  ```
- Right side: mockup area — styled div representing each module (different layout per module, simple mock UI with colored blocks/bars)
- Active tab: `border-l-3 border-cyan-500 bg-[rgba(8,145,178,0.08)]`
- Mockup transitions: CSS transition on opacity/transform
- Section wrapper uses `useInView` for entrance animation
- `id="features"`

- [ ] **Step 3: Wire into LandingPage + commit**

```bash
git add src/pages/Landing/ src/hooks/
git commit -m "feat(landing): social proof contadores + features showcase tabs"
```

---

## Task 4: OvyvaSection + BenefitsSection

**Files:**
- Create: `src/pages/Landing/OvyvaSection.tsx`
- Create: `src/pages/Landing/BenefitsSection.tsx`
- Modify: `src/pages/Landing/LandingPage.tsx`

- [ ] **Step 1: Create OvyvaSection**

- Left side: text explaining OVYVA capabilities (3-4 bullet points with Lucide icons)
- Right side: chat mockup with sequential messages
- Messages array:
  ```
  { sender: 'patient', text: 'Ola, gostaria de agendar uma limpeza', delay: 0 }
  { sender: 'typing', delay: 2000 }
  { sender: 'ai', text: 'Ola! Temos horarios disponiveis amanha as 9h, 14h e 16h. Qual prefere?', delay: 3500 }
  { sender: 'patient', text: '14h por favor', delay: 5500 }
  { sender: 'typing', delay: 7000 }
  { sender: 'ai', text: 'Agendado! Limpeza amanha as 14h com Dr. Ana. Enviaremos um lembrete.', delay: 8500 }
  ```
- Use `useInView` to trigger the animation sequence
- `useState` for `visibleCount` that increments via `setTimeout`
- Typing dots: 3 animated circles with staggered opacity
- Chat card: glassmorphism background
- `id="ovyva"`

- [ ] **Step 2: Create BenefitsSection**

- 4 cards in a grid
- Each card:
  - Large number (48px, font-weight 900): "60%", "40%", "24/7", "1"
  - Title: "Reduza no-shows", "Aumente faturamento", "Atenda com IA", "Tudo em um lugar"
  - Lucide icon
  - Glassmorphism card styling
- Stagger entrance with `useInView` + `animation-delay`
- Subtle parallax: use CSS `transform: translateY(calc(var(--scroll-offset) * speed))` or simpler approach with fixed stagger entrance
- `id="benefits"`

- [ ] **Step 3: Wire into LandingPage + commit**

```bash
git add src/pages/Landing/
git commit -m "feat(landing): OVYVA chat ao vivo + beneficios parallax"
```

---

## Task 5: TestimonialsSection + FooterSection

**Files:**
- Create: `src/pages/Landing/TestimonialsSection.tsx`
- Create: `src/pages/Landing/FooterSection.tsx`
- Modify: `src/pages/Landing/LandingPage.tsx`

- [ ] **Step 1: Create TestimonialsSection**

- Carousel with 6 testimonial cards
- Mock data:
  ```
  { name: 'Dr. Marina Costa', role: 'Ortodontista', text: 'O Clini+ transformou a gestao da minha clinica. A OVYVA sozinha ja reduziu 70% das ligacoes.', stars: 5 }
  { name: 'Dr. Rafael Santos', role: 'Dentista', text: 'Prontuario eletronico completo, agenda inteligente e tudo integrado. Melhor investimento.', stars: 5 }
  { name: 'Dra. Julia Mendes', role: 'Dermatologista', text: 'A integracao com WhatsApp e o diferencial. Meus pacientes adoram a praticidade.', stars: 5 }
  { name: 'Dr. Carlos Lima', role: 'Clinico Geral', text: 'Em 3 meses, reduzi no-shows em 60% e aumentei o faturamento em 35%.', stars: 5 }
  { name: 'Dra. Ana Oliveira', role: 'Pediatra', text: 'Interface linda e intuitiva. Minha equipe aprendeu a usar em 1 dia.', stars: 4 }
  { name: 'Dr. Pedro Almeida', role: 'Cirurgiao', text: 'O CRM Verdesk me deu visibilidade total dos leads. Converto muito mais agora.', stars: 5 }
  ```
- Auto-scroll: `setInterval` every 5s moves to next card
- Show 1 card on mobile, 3 on desktop
- Glassmorphism cards
- Star rating with fill animation on entrance
- `id="testimonials"`

- [ ] **Step 2: Create FooterSection**

- Final CTA: "Pronto para transformar sua clinica?" with gradient button scrolling to #quiz
- 2-3 animated blobs (same style as hero)
- Grid: 3 columns — Produto, Empresa, Legal
- Contact: WhatsApp link, email
- Badges: LGPD, Criptografia, 99.9% Uptime (styled as small pill badges)
- Copyright: "2026 Clini+ — Prontuario Verde"
- `id="footer"`

- [ ] **Step 3: Wire into LandingPage + commit**

```bash
git add src/pages/Landing/
git commit -m "feat(landing): depoimentos carousel + footer com CTA"
```

---

## Task 6: QuizSection (Feature Principal)

**Files:**
- Create: `src/pages/Landing/QuizSection.tsx`
- Modify: `src/pages/Landing/LandingPage.tsx`

- [ ] **Step 1: Create QuizSection — quiz data + state machine**

Quiz questions array with options. State:
- `currentStep` (0-8, where 8 = result screen)
- `answers: Record<number, string>` — stores selected option per step
- `direction` — animation direction for transitions

Questions per spec (8 total, each with 3-4 options).

Score calculation:
- Questions 4-7 contribute to digitalization score
- "Sim" = 100%, "Parcialmente"/"Sim manual"/"Planilhas" = 50%, "Nao" = 0%
- Final score = average of questions 4-7

- [ ] **Step 2: Create QuizSection — UI**

- Container with `id="quiz"`, dark glassmorphism card
- Progress bar: gradient cyan→indigo, width based on `(currentStep / 8) * 100%`
- Step counter: "Pergunta X de 8"
- Question text: large, bold
- Options: grid of buttons, selected = cyan border + bg
- Next button: gradient, disabled until option selected
- Back button: subtle, only after step 1
- Transitions: `translateX` + `opacity` animation (slide-in from right, slide-out to left)

- [ ] **Step 3: Create QuizSection — result screen**

- Animated circular gauge (SVG circle with `stroke-dashoffset` animation)
- Score percentage in center: large number
- Personalized message based on score (<50% or >=50%)
- Summary of answers in a subtle list
- CTA button: "Falar com Equipe Clini+" — gradient, pulsing shadow
- onClick: build WhatsApp URL with pre-filled message containing all answers + score
- Fire `confetti()` from canvas-confetti on mount of result screen

WhatsApp URL builder:
```typescript
const msg = encodeURIComponent(`Ola Equipe Clini+! Fiz o diagnostico e minha clinica esta ${score}% digitalizada.

Especialidade: ${answers[0]}
Profissionais: ${answers[1]}
Pacientes/mes: ${answers[2]}
Agenda digital: ${answers[3]}
Prontuario: ${answers[4]}
WhatsApp: ${answers[5]}
Financeiro: ${answers[6]}
Maior desafio: ${answers[7]}

Gostaria de saber mais sobre o sistema!`)

window.open(`https://wa.me/5537998195029?text=${msg}`, '_blank')
```

- [ ] **Step 4: Wire into LandingPage + build check + commit**

```bash
npx tsc --noEmit && npx vite build
git add src/pages/Landing/
git commit -m "feat(landing): quiz interativo multi-step + score + WhatsApp CTA"
```

---

## Task 7: Polish + Final Build

**Files:**
- Modify: `src/pages/Landing/LandingPage.tsx` (final assembly)
- Modify: various landing components (CSS tweaks)

- [ ] **Step 1: Finalize LandingPage composition**

Ensure all sections are imported and ordered correctly:
```tsx
<div className="min-h-screen bg-[#030608] text-white overflow-x-hidden">
  <LandingNavbar />
  <HeroSection />
  <SocialProofSection />
  <FeaturesSection />
  <OvyvaSection />
  <BenefitsSection />
  <TestimonialsSection />
  <QuizSection />
  <FooterSection />
</div>
```

- [ ] **Step 2: Add smooth scroll CSS**

In `LandingPage.tsx` or via a `useEffect`:
```css
html { scroll-behavior: smooth; }
```

- [ ] **Step 3: Add meta tags**

In `LandingPage.tsx` useEffect or via react-helmet-like approach:
```typescript
useEffect(() => {
  document.title = 'Clini+ | Prontuario Verde — Sistema para Clinicas'
}, [])
```

- [ ] **Step 4: Final build verification**

```bash
npx tsc --noEmit && npx vite build
```

- [ ] **Step 5: Visual test**

```bash
npx vite dev
```
Open browser, verify:
- Navbar glassmorphism + scroll behavior
- Hero blobs + 3D mockup + parallax
- Counters animate on scroll
- Features tabs switch correctly
- OVYVA chat types on scroll
- Benefits cards enter with stagger
- Testimonials carousel auto-plays
- Quiz all 8 steps + score + WhatsApp link works
- Footer links correct

- [ ] **Step 6: Final commit + push**

```bash
git add -A
git commit -m "feat(landing): polish final — meta tags, smooth scroll, assembly"
git push
```

---

## Summary

| Task | What | Components | Commit |
|------|------|-----------|--------|
| 1 | Scaffold | Hooks, route, skeleton | `feat(landing): scaffold` |
| 2 | Hero | Navbar + Hero | `feat(landing): navbar + hero` |
| 3 | Middle | SocialProof + Features | `feat(landing): social proof + features` |
| 4 | Middle | OVYVA + Benefits | `feat(landing): OVYVA + benefits` |
| 5 | Bottom | Testimonials + Footer | `feat(landing): testimonials + footer` |
| 6 | Quiz | Quiz wizard + WhatsApp | `feat(landing): quiz + WhatsApp` |
| 7 | Polish | Assembly + meta + test | `feat(landing): polish` |

**7 tasks, 12 new files, 1 dependency.**
