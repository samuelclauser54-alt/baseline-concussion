import { useEffect, useRef, useState } from 'react'
import { BottomBar, Button, Card, StepHeader } from '../components/ui'
import { beep, unlockAudio } from '../lib/audio'
import { median } from '../lib/stats'
import type { ReactionResult } from '../lib/types'
import type { StepProps } from './shared'

// Go/no-go reaction test: tap on GREEN as fast as possible, never tap on RED.
// Timing is done outside React (direct DOM updates + event timestamps) so a
// re-render can't add delay. Stimulus onset is taken from the animation frame
// in which the color change is painted.

const GO = 18
const NOGO = 6
const PRACTICE: ('go' | 'nogo')[] = ['go', 'nogo', 'go']
const WINDOW_MS = 1000
/** Taps faster than this can't be a reaction to the stimulus; they're anticipations. */
const MIN_RT_MS = 100

function makeTrials(): ('go' | 'nogo')[] {
  const t: ('go' | 'nogo')[] = [...Array(GO).fill('go'), ...Array(NOGO).fill('nogo')]
  for (let i = t.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[t[i], t[j]] = [t[j], t[i]]
  }
  // start with a "go", and never two "no-go" trials in a row
  if (t[0] === 'nogo') {
    const k = t.indexOf('go')
    ;[t[0], t[k]] = [t[k], t[0]]
  }
  for (let i = 1; i < t.length; i++) {
    if (t[i] === 'nogo' && t[i - 1] === 'nogo') {
      const k = t.findIndex((x, j) => x === 'go' && j > i && t[j - 1] !== 'nogo' && t[j + 1] !== 'nogo')
      if (k > 0) [t[i], t[k]] = [t[k], t[i]]
    }
  }
  return t
}

type Mode = 'intro' | 'running' | 'done'

export function Reaction({ onDone }: StepProps<ReactionResult>) {
  const [mode, setMode] = useState<Mode>('intro')
  const [practice, setPractice] = useState(true)
  const [result, setResult] = useState<ReactionResult | null>(null)

  if (mode === 'running') {
    return (
      <ReactionArena
        trials={practice ? PRACTICE : makeTrials()}
        practice={practice}
        onFinish={(r) => {
          if (practice) {
            setPractice(false)
            setMode('intro')
          } else {
            setResult(r)
            setMode('done')
          }
        }}
        onAbort={() => setMode('intro')}
      />
    )
  }

  if (mode === 'done' && result) {
    const med = Math.round(median(result.goRTs))
    return (
      <div>
        <StepHeader kicker="Reaction time" title="Done">Results are saved and compared to baseline in the report.</StepHeader>
        <Card className="grid grid-cols-3 divide-x divide-line p-5 text-center">
          <Stat value={`${med}`} unit="ms" label="Median" />
          <Stat value={`${result.commissions}`} label="Tapped red" />
          <Stat value={`${result.misses}`} label="Missed green" />
        </Card>
        <BottomBar>
          <Button variant="secondary" onClick={() => { setResult(null); setMode('intro') }}>Redo</Button>
          <Button className="flex-1" onClick={() => onDone(result)}>Next</Button>
        </BottomBar>
      </div>
    )
  }

  return (
    <div>
      <StepHeader kicker="Athlete does this" title={practice ? 'Reaction time' : 'Ready for the real test'}>
        {practice ? (
          <>Hold the phone in one hand and tap with the index finger of your other hand.</>
        ) : (
          <>Practice done. Now {GO + NOGO} rounds, about 1 minute. Go as fast as you can.</>
        )}
      </StepHeader>
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 text-center">
          <div className="mx-auto mb-3 h-16 w-16 rounded-2xl bg-[#16c47f]" />
          <div className="font-bold">Green</div>
          <div className="text-sm text-muted">Tap as fast as you can</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="mx-auto mb-3 h-16 w-16 rounded-2xl bg-[#ff4545]" />
          <div className="font-bold">Red</div>
          <div className="text-sm text-muted">Don’t tap</div>
        </Card>
      </div>
      <p className="mt-4 px-1 text-sm text-muted">Turn off low-power mode. Tapping before the color appears counts as a false start.</p>
      <BottomBar>
        <Button className="flex-1" size="lg" onClick={() => { unlockAudio(); setMode('running') }}>
          {practice ? 'Start practice (3 rounds)' : 'Start test'}
        </Button>
      </BottomBar>
    </div>
  )
}

function Stat({ value, unit, label }: { value: string; unit?: string; label: string }) {
  return (
    <div>
      <div className="text-3xl font-bold tabular">
        {value}
        {unit && <span className="ml-0.5 text-base text-muted">{unit}</span>}
      </div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  )
}

function ReactionArena({
  trials,
  practice,
  onFinish,
  onAbort,
}: {
  trials: ('go' | 'nogo')[]
  practice: boolean
  onFinish: (r: ReactionResult) => void
  onAbort: () => void
}) {
  const box = useRef<HTMLDivElement>(null)
  const label = useRef<HTMLDivElement>(null)
  const [counter, setCounter] = useState(0)

  useEffect(() => {
    const el = box.current!
    const lab = label.current!
    const r: ReactionResult = { goRTs: [], misses: 0, commissions: 0, falseStarts: 0, goTrials: 0, noGoTrials: 0 }
    let i = 0
    let state: 'wait' | 'stim' | 'feedback' = 'wait'
    let onset = 0
    let timer = 0
    let alive = true

    const paint = (bg: string, text: string, color = '#fff') => {
      el.style.background = bg
      lab.textContent = text
      lab.style.color = color
    }

    const next = () => {
      if (!alive) return
      if (i >= trials.length) {
        alive = false
        onFinish(r)
        return
      }
      state = 'wait'
      paint('var(--surface-2)', '•', 'var(--faint)')
      setCounter(i)
      timer = window.setTimeout(show, 1200 + Math.random() * 1800)
    }

    const show = () => {
      const kind = trials[i]
      paint(kind === 'go' ? '#16c47f' : '#ff4545', kind === 'go' ? 'TAP' : "DON'T TAP")
      requestAnimationFrame((t) => {
        onset = t
        state = 'stim'
      })
      timer = window.setTimeout(() => {
        if (state !== 'stim') return
        if (kind === 'go') {
          r.misses++
          r.goTrials++
          feedback('Too slow', '#c2700a')
        } else {
          r.noGoTrials++
          feedback('Good', '#0f8a5f')
        }
      }, WINDOW_MS)
    }

    const feedback = (text: string, bg: string) => {
      state = 'feedback'
      paint(bg, text)
      i++
      timer = window.setTimeout(next, 650)
    }

    const tap = (e: PointerEvent) => {
      e.preventDefault()
      if (state === 'wait') {
        clearTimeout(timer)
        r.falseStarts++
        beep(220, 120, 0.15)
        state = 'feedback'
        paint('#55607a', 'Too soon!')
        timer = window.setTimeout(next, 900) // same trial again
      } else if (state === 'stim') {
        clearTimeout(timer)
        const kind = trials[i]
        const rt = e.timeStamp - onset
        if (kind === 'nogo') {
          r.commissions++
          r.noGoTrials++
          beep(220, 120, 0.15)
          feedback('Red: don’t tap', '#b91c1c')
        } else if (rt < MIN_RT_MS) {
          r.falseStarts++
          state = 'feedback'
          paint('#55607a', 'Too soon!')
          timer = window.setTimeout(next, 900)
        } else {
          r.goRTs.push(Math.round(rt))
          r.goTrials++
          feedback(`${Math.round(rt)} ms`, '#2f5bea')
        }
      }
    }

    el.addEventListener('pointerdown', tap)
    timer = window.setTimeout(next, 600)
    return () => {
      alive = false
      clearTimeout(timer)
      el.removeEventListener('pointerdown', tap)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg">
      <div className="flex items-center justify-between px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button onClick={onAbort} className="h-10 rounded-full px-3 text-sm font-semibold text-muted">
          Stop
        </button>
        <div className="text-sm font-semibold text-muted tabular">
          {practice ? 'Practice · ' : ''}
          {Math.min(counter + 1, trials.length)} / {trials.length}
        </div>
        <div className="w-14" />
      </div>
      <div
        ref={box}
        className="mx-3 mb-[max(0.75rem,env(safe-area-inset-bottom))] grid flex-1 select-none place-items-center rounded-[28px] touch-none"
        style={{ background: 'var(--surface-2)' }}
      >
        <div ref={label} className="pointer-events-none text-4xl font-black tracking-tight" />
      </div>
    </div>
  )
}
