import type { Athlete, Session } from '../lib/types'

export interface StepProps<T> {
  athlete: Athlete
  session: Session
  baseline?: Session
  onDone: (result: T) => void
  onSkip: () => void
}

/** A row of numbered buttons (0…max) for symptom-style ratings. */
export function ScaleRow({
  label,
  value,
  max,
  onChange,
  compact = false,
}: {
  label: string
  value: number
  max: number
  onChange: (v: number) => void
  compact?: boolean
}) {
  const tone = (n: number) => {
    const f = n / max
    if (n === 0) return 'bg-ok-soft text-ok border-ok'
    if (f <= 0.34) return 'bg-accent-soft text-accent border-accent'
    if (f <= 0.67) return 'bg-warn-soft text-warn border-warn'
    return 'bg-danger-soft text-danger border-danger'
  }
  return (
    <div className={compact ? 'py-2' : 'py-3'}>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-[15px] font-medium">{label}</span>
        {value > 0 && <span className="text-xs font-semibold text-muted tabular">{value}/{max}</span>}
      </div>
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${max + 1}, minmax(0, 1fr))` }}>
        {Array.from({ length: max + 1 }, (_, n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            aria-label={`${label}: ${n}`}
            aria-pressed={value === n}
            className={`h-10 rounded-lg border text-sm font-semibold tabular transition ${
              value === n ? tone(n) : 'border-line bg-surface text-faint hover:text-ink'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}

/** Tap-to-toggle word chips for recall scoring. */
export function WordChecklist({ words, recalled, onToggle }: { words: string[]; recalled: Set<number>; onToggle: (i: number) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {words.map((w, i) => {
        const on = recalled.has(i)
        return (
          <button
            key={w}
            onClick={() => onToggle(i)}
            aria-pressed={on}
            className={`flex h-12 items-center justify-between rounded-xl border px-4 text-[15px] font-semibold capitalize transition ${
              on ? 'border-ok bg-ok-soft text-ok' : 'border-line bg-surface text-ink'
            }`}
          >
            {w}
            <span className={`grid h-5 w-5 place-items-center rounded-full border text-[11px] ${on ? 'border-ok bg-ok text-white' : 'border-line'}`}>
              {on ? '✓' : ''}
            </span>
          </button>
        )
      })}
    </div>
  )
}
