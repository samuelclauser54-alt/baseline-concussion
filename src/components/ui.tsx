import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { navigate } from '../lib/router'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-on-accent shadow-sm shadow-accent/30 hover:brightness-110',
  secondary: 'bg-surface text-ink border border-line hover:bg-surface-2',
  ghost: 'text-muted hover:text-ink hover:bg-surface-2',
  danger: 'bg-danger text-white shadow-sm shadow-danger/30 hover:brightness-110',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'h-9 px-3 text-sm rounded-xl', md: 'h-12 px-5 text-[15px] rounded-2xl', lg: 'h-14 px-6 text-base rounded-2xl' }
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 font-semibold transition active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none ${sizes[size]} ${VARIANTS[variant]} ${className}`}
    />
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  const bg = /(^|\s)bg-/.test(className) ? '' : 'bg-surface'
  const border = /(^|\s)border-(warn|accent|danger|ok|0)\b/.test(className) ? '' : 'border-line'
  return <div className={`rounded-3xl border print-plain ${border} ${bg} ${className}`}>{children}</div>
}

export function Pill({ tone = 'neutral', children }: { tone?: 'neutral' | 'ok' | 'warn' | 'danger' | 'accent'; children: ReactNode }) {
  const tones = {
    neutral: 'bg-surface-2 text-muted',
    ok: 'bg-ok-soft text-ok',
    warn: 'bg-warn-soft text-warn',
    danger: 'bg-danger-soft text-danger',
    accent: 'bg-accent-soft text-accent',
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${tones[tone]}`}>
      {children}
    </span>
  )
}

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="9" fill="var(--accent)" />
      <path
        d="M5 18h7l2.2-6 3.6 11 2.4-5H27"
        fill="none"
        stroke="var(--on-accent)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function TopBar({ title, back, right }: { title?: ReactNode; back?: string; right?: ReactNode }) {
  return (
    <header className="no-print sticky top-0 z-20 -mx-4 mb-4 flex h-14 items-center gap-2 bg-bg/85 px-4 backdrop-blur-md">
      {back !== undefined ? (
        <button
          onClick={() => (back ? navigate(back) : history.back())}
          className="-ml-2 grid h-10 w-10 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"
          aria-label="Back"
        >
          <Icon name="back" />
        </button>
      ) : (
        <button onClick={() => navigate('/')} className="flex items-center gap-2" aria-label="Home">
          <Logo />
          <span className="text-[17px] font-bold tracking-tight">Baseline</span>
        </button>
      )}
      <div className="min-w-0 flex-1 truncate text-[15px] font-semibold">{title}</div>
      {right}
      <EmergencyButton />
    </header>
  )
}

export function EmergencyButton() {
  return (
    <button
      onClick={() => navigate('/emergency')}
      className="flex h-9 items-center gap-1.5 rounded-full bg-danger-soft px-3 text-xs font-bold text-danger"
      aria-label="Emergency: danger signs and call 911"
    >
      <Icon name="alert" size={15} />
      911
    </button>
  )
}

export function SectionTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <h2 className={`mb-2 px-1 text-xs font-bold uppercase tracking-[0.08em] text-faint ${className}`}>{children}</h2>
}

const PATHS: Record<string, string> = {
  back: 'M15 18l-6-6 6-6',
  alert: 'M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z',
  plus: 'M12 5v14M5 12h14',
  check: 'M20 6L9 17l-5-5',
  x: 'M18 6L6 18M6 6l12 12',
  chevron: 'M9 18l6-6-6-6',
  book: 'M4 19.5A2.5 2.5 0 016.5 17H20V3H6.5A2.5 2.5 0 004 5.5v14zM20 17v4H6.5',
  phone: 'M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.4 1.8.7 2.7a2 2 0 01-.5 2.1L8 9.8a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.4c.9.3 1.8.6 2.7.7a2 2 0 011.7 2z',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  play: 'M6 4l14 8-14 8V4z',
  speaker: 'M11 5L6 9H2v6h4l5 4V5zm4.5 3.5a5 5 0 010 7m2.8-9.9a9 9 0 010 12.8',
  download: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3',
  upload: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12',
  print: 'M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z',
  clock: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2',
  user: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z',
  trash: 'M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6',
  activity: 'M22 12h-4l-3 9L9 3l-3 9H2',
  database: 'M12 8c4.4 0 8-1.3 8-3s-3.6-3-8-3-8 1.3-8 3 3.6 3 8 3zM4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
}

export function Icon({ name, size = 20, className = '' }: { name: keyof typeof PATHS | string; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d={PATHS[name]} />
    </svg>
  )
}

/** Big two-choice toggle used throughout the examiner-scored tests. */
export function YesNo({ value, onChange, yes = 'Correct', no = 'Wrong' }: { value?: boolean; onChange: (v: boolean) => void; yes?: string; no?: string }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        onClick={() => onChange(true)}
        className={`h-11 rounded-xl border text-sm font-semibold transition ${value === true ? 'border-ok bg-ok-soft text-ok' : 'border-line bg-surface text-muted'}`}
      >
        {yes}
      </button>
      <button
        onClick={() => onChange(false)}
        className={`h-11 rounded-xl border text-sm font-semibold transition ${value === false ? 'border-danger bg-danger-soft text-danger' : 'border-line bg-surface text-muted'}`}
      >
        {no}
      </button>
    </div>
  )
}

export function StepHeader({ kicker, title, children }: { kicker?: string; title: string; children?: ReactNode }) {
  return (
    <div className="mb-5 rise">
      {kicker && <div className="mb-1 text-xs font-bold uppercase tracking-[0.08em] text-accent">{kicker}</div>}
      <h1 className="text-[26px] font-bold leading-tight tracking-tight">{title}</h1>
      {children && <div className="mt-2 text-[15px] leading-relaxed text-muted">{children}</div>}
    </div>
  )
}

/** Sticky bottom action area for step screens. */
export function BottomBar({ children }: { children: ReactNode }) {
  return (
    <div className="no-print sticky bottom-0 -mx-4 mt-6 border-t border-line bg-bg/90 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md">
      <div className="flex gap-2">{children}</div>
    </div>
  )
}

export function formatDate(t: number, withTime = false) {
  return new Date(t).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: new Date(t).getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
    ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
  })
}
