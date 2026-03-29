interface CliniPlusLogoProps {
  size?: number
  showText?: boolean
  collapsed?: boolean
  textSize?: 'sm' | 'md' | 'lg'
  theme?: 'dark' | 'light'
}

export function CliniPlusLogo({
  size = 36,
  showText = true,
  collapsed = false,
  textSize = 'md',
  theme = 'dark',
}: CliniPlusLogoProps) {
  const textColor = theme === 'dark' ? '#f1f5f9' : '#0f172a'

  const textSizes = {
    sm: { main: '13px', sub: '11px' },
    md: { main: '15px', sub: '13px' },
    lg: { main: '22px', sub: '18px' },
  }
  const ts = textSizes[textSize]

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.3 }}>
      {/* ── Icon mark ─────────────────────────────────── */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <defs>
          <linearGradient id="cp-grad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0891b2" />
            <stop offset="60%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
          <linearGradient id="cp-inner" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>

        {/* Background */}
        <rect width="36" height="36" rx="10" fill="url(#cp-grad)" />
        {/* Inner shine */}
        <rect width="36" height="18" rx="10" fill="url(#cp-inner)" />

        {/* C — arc via quadratic bezier, opening to the right */}
        <path
          d="M 21 11.5 Q 9.5 11.5 9.5 18 Q 9.5 24.5 21 24.5"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />

        {/* + vertical */}
        <line x1="26.5" y1="13" x2="26.5" y2="23" stroke="white" strokeWidth="2.6" strokeLinecap="round" />
        {/* + horizontal */}
        <line x1="23" y1="18" x2="30" y2="18" stroke="white" strokeWidth="2.6" strokeLinecap="round" />
      </svg>

      {/* ── Wordmark ───────────────────────────────────── */}
      {showText && !collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '1px' }}>
            <span
              style={{
                fontSize: ts.main,
                fontWeight: 700,
                color: textColor,
                letterSpacing: '-0.3px',
              }}
            >
              Clini
            </span>
            <span
              style={{
                fontSize: ts.main,
                fontWeight: 300,
                color: '#06b6d4',
                letterSpacing: '-0.3px',
              }}
            >
              Plus
            </span>
          </div>
          <span
            style={{
              fontSize: ts.sub,
              fontWeight: 400,
              color: '#64748b',
              letterSpacing: '0.2px',
              marginTop: '1px',
            }}
          >
            Gestão Inteligente
          </span>
        </div>
      )}
    </div>
  )
}
