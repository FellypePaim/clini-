# Clini+ Landing Page — Design Spec

> **Data:** 29/03/2026
> **Status:** Aprovado

## Resumo

Landing page inovadora para o Clini+ na rota `/` do app React. Dark mode fixo (sempre escuro). 8 secoes + navbar fixa. Feature principal: quiz interativo que diagnostica a clinica e envia mensagem pre-preenchida no WhatsApp para a equipe de vendas.

## Decisoes

- **Rota:** `/` no mesmo app React (React Router)
- **Layout:** Sempre dark (nao segue toggle light/dark do app)
- **CTA:** Quiz interativo → WhatsApp
- **WhatsApp:** 5537998195029, contato "Equipe Clini+"
- **Efeitos:** Mix de scroll-driven, 3D/parallax, mockups animados, glassmorphism cinematico
- **Design system:** Mesma paleta do app (cyan/indigo/emerald/amber, DM Sans)

## Estrutura (8 secoes + navbar)

### Navbar Fixa
- Glassmorphism: `backdrop-filter: blur(12px)`, `bg-[rgba(6,10,20,0.8)]`
- Logo Clini+ (gradiente cyan→indigo) a esquerda
- Links: Funcionalidades, OVYVA, Quiz (scroll-to anchors)
- Botoes: "Entrar" (link `/login`, outline) + "Diagnostico Gratis" (CTA gradient, link pro quiz)
- Scroll-aware: opacidade do fundo aumenta ao scrollar

### Secao 1: Hero
- Fundo: `#030608` com 2-3 blobs animados (radial-gradient cyan/indigo, movendo lento via CSS animation)
- Titulo: "A clinica do futuro comeca aqui." — `text-4xl md:text-6xl font-black`, gradiente texto (branco→cinza)
- Subtitulo: "Prontuario eletronico, IA, WhatsApp e CRM em um unico sistema."
- Mockup do dashboard flutuando em perspectiva 3D (`transform: perspective(1000px) rotateX(5deg)`)
- Parallax sutil no mouse (CSS `transform` via onMouseMove)
- 2 CTAs: "Iniciar Diagnostico Gratuito" (gradient) + "Ver Funcionalidades" (outline, scroll-to)
- Fade-in sequencial nos elementos (stagger 100ms)

### Secao 2: Social Proof
- 4 metricas com contadores animados (IntersectionObserver trigger):
  - "+500 clinicas", "+50.000 pacientes gerenciados", "99.9% uptime", "4.9/5 avaliacao"
- Marquee infinito de logos de clinicas parceiras (CSS animation, duplicar lista)
- Fundo: sutil diferente do hero (`rgba(255,255,255,0.02)`)

### Secao 3: Features Showcase
- Layout: tabs verticais a esquerda (6 modulos) + area de mockup a direita
- Modulos: Dashboard, Agenda, Pacientes/PEP, OVYVA (IA), Verdesk CRM, Financeiro
- Cada tab: icone Lucide + titulo + 1 linha de descricao
- Tab ativa: `border-left: 3px solid cyan`, background highlight
- Mockup area: screenshot/ilustracao do modulo com borda glow (`box-shadow: 0 0 30px rgba(cyan,0.1)`)
- Transicao entre mockups: fade + slide (200ms)
- Scroll-triggered: secao inteira faz fade-in ao entrar na viewport

### Secao 4: OVYVA IA em Acao
- Layout: texto explicativo a esquerda + mockup de chat a direita
- Chat animado: simulacao de conversa WhatsApp
  - Mensagem paciente: "Ola, gostaria de agendar uma limpeza"
  - Typing dots (3 dots pulsando, 1.5s)
  - Resposta OVYVA: "Ola! Temos horarios disponiveis amanha as 9h, 14h e 16h. Qual prefere?"
  - Paciente: "14h por favor"
  - OVYVA: "Agendado! Limpeza amanha as 14h com Dr. Ana. Enviaremos um lembrete."
- Mensagens aparecem sequencialmente (delay 2s entre cada)
- Inicia ao entrar na viewport (IntersectionObserver)
- Fundo do chat: glassmorphism card

### Secao 5: Beneficios
- 4 cards com efeito parallax no scroll (cada card em velocidade diferente)
- Cards:
  1. "Reduza no-shows em 60%" — icone Calendar
  2. "Aumente faturamento em 40%" — icone TrendingUp
  3. "Atenda 24/7 com IA" — icone Bot
  4. "Tudo em um so lugar" — icone Layers
- Numeros grandes (font-size 48px, font-weight 900)
- Stagger entrance animation

### Secao 6: Depoimentos
- Carousel horizontal (3 cards visiveis, autoplay 5s, pausavel)
- Cada card: foto (placeholder avatar), nome, especialidade, texto, 5 estrelas
- Cards: glassmorphism (blur + rgba background + border sutil)
- Estrelas com fill animation ao entrar viewport
- Dados placeholder (4-6 depoimentos mockados)

### Secao 7: Quiz Interativo
- Wizard multi-step com 8 perguntas
- Progress bar animada no topo (gradiente cyan→indigo)
- Cada step: fade-in + slide da direita (200ms)
- Perguntas:
  1. "Qual a especialidade da sua clinica?" — opcoes: Odontologia, Medicina, Estetica, Outra
  2. "Quantos profissionais atuam?" — 1-3, 4-10, 11-20, 20+
  3. "Quantos pacientes atendem por mes?" — Ate 100, 100-500, 500-1000, 1000+
  4. "Usam agenda digital?" — Sim, Nao, Parcialmente
  5. "Usam prontuario eletronico?" — Sim, Nao, Planilhas
  6. "Tem presenca no WhatsApp?" — Sim com bot, Sim manual, Nao
  7. "Fazem gestao financeira digital?" — Sim, Nao, Planilhas
  8. "Qual o maior desafio?" — No-shows, Gestao financeira, Captacao pacientes, Organizacao
- Opcoes como botoes clicaveis (selecao visual com borda cyan)
- Tela final: score visual (gauge/circulo animado) + mensagem personalizada
  - Score = % de respostas "digitalizadas"
  - "Sua clinica esta X% digitalizada"
  - Se <50%: "Voce esta perdendo pacientes e receita. O Clini+ resolve isso."
  - Se >=50%: "Boa base! O Clini+ leva sua clinica ao proximo nivel."
- Botao CTA: "Falar com Equipe Clini+" → abre WhatsApp
- URL WhatsApp: `https://wa.me/5537998195029?text=<mensagem>`
- Mensagem template:
  ```
  Ola Equipe Clini+! Fiz o diagnostico e minha clinica esta X% digitalizada.

  Especialidade: [resp1]
  Profissionais: [resp2]
  Pacientes/mes: [resp3]
  Agenda digital: [resp4]
  Prontuario: [resp5]
  WhatsApp: [resp6]
  Financeiro: [resp7]
  Maior desafio: [resp8]

  Gostaria de saber mais sobre o sistema!
  ```
- Confetti animation no resultado (biblioteca: canvas-confetti)

### Secao 8: Footer
- CTA final: "Pronto para transformar sua clinica?" + botao gradient para quiz
- Blobs de fundo (mesmo estilo hero)
- Grid de links: Produto (Funcionalidades, OVYVA, Quiz), Empresa (Sobre, Contato, Suporte), Legal (LGPD, Termos)
- Contato: WhatsApp, email
- Badges: LGPD Compliant, Criptografia, 99.9% Uptime
- Copyright: "2026 Clini+ — Prontuario Verde"

## Implementacao Tecnica

### Rota
- Adicionar rota `/` no AppRouter com componente `LandingPage`
- `PublicRoute` wrapper (se logado, redireciona para `/dashboard`)
- Lazy load: `React.lazy(() => import('../pages/Landing/LandingPage'))`

### Componentes (pasta `src/pages/Landing/`)
- `LandingPage.tsx` — container principal, scroll management
- `LandingNavbar.tsx` — navbar fixa glassmorphism
- `HeroSection.tsx` — hero com blobs + mockup 3D
- `SocialProofSection.tsx` — contadores + marquee
- `FeaturesSection.tsx` — tabs + mockups
- `OvyvaSection.tsx` — chat animado
- `BenefitsSection.tsx` — cards parallax
- `TestimonialsSection.tsx` — carousel
- `QuizSection.tsx` — wizard multi-step + score + WhatsApp
- `FooterSection.tsx` — CTA final + links

### Hooks/Utils
- `useInView.ts` — hook IntersectionObserver para scroll animations
- `useCountUp.ts` — hook para animar contadores numericos

### Dependencias
- `canvas-confetti` — confetti no resultado do quiz (npm install)
- Sem outras dependencias novas (tudo CSS + React)

### Animacoes (CSS-only onde possivel)
- Blobs: `@keyframes blob-float` (translateX/Y lento, 20s)
- Fade-in: reutilizar `animate-fade-in` existente
- Stagger: `animation-delay` calculado por indice
- Marquee: `@keyframes marquee` (translateX -50%, linear infinite)
- Typing dots: `@keyframes typing-dot` (opacity pulse)
- Counter: requestAnimationFrame no hook
- Parallax: CSS `transform` via scroll listener ou onMouseMove

### Performance
- Imagens: nenhuma (mockups sao divs estilizadas ou screenshots otimizadas)
- Animacoes: CSS transform/opacity only (no layout thrashing)
- IntersectionObserver: ativa animacoes so quando visivel
- Lazy sections: considerar Suspense por secao se bundle ficar grande

## Fora de Escopo
- Pagina de precos (futuro)
- Blog (futuro)
- SEO avancado (meta tags basicas sim)
- Analytics/tracking (futuro)
- Internacionalizacao (so PT-BR)
