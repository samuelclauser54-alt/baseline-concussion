import { useEffect, useRef, useState } from 'react'
import { BottomBar, Button, Card, Icon, StepHeader } from '../components/ui'
import { beep, unlockAudio } from '../lib/audio'
import { VESTIBULAR_ITEMS, VESTIBULAR_SYMPTOMS } from '../lib/content'
import type { VestibularRating, VestibularResult } from '../lib/types'
import { ScaleRow, type StepProps } from './shared'

// VOMS-style screen (Mucha et al., 2014): rate 4 symptoms before, then after
// each eye/head-movement task. A rise of ≥2 points is a positive finding.

type Item = (typeof VESTIBULAR_ITEMS)[number]
const ZERO: VestibularRating = { headache: 0, dizziness: 0, nausea: 0, fogginess: 0 }

export function Vestibular({ athlete, onDone, onSkip }: StepProps<VestibularResult>) {
  const [stage, setStage] = useState<'pre' | number>('pre')
  const [phase, setPhase] = useState<'intro' | 'run' | 'rate'>('intro')
  const [pre, setPre] = useState<VestibularRating>(ZERO)
  const [items, setItems] = useState<Record<string, VestibularRating>>({})
  const [rating, setRating] = useState<VestibularRating>(ZERO)

  if (stage === 'pre') {
    return (
      <div>
        <StepHeader kicker="Eyes & motion · 2 minutes" title="Before we start">
          {athlete.name.split(' ')[0]}, rate how you feel right now, 0 = none, 10 = worst. You’ll rate again after each short eye exercise.
        </StepHeader>
        <RatingCard value={pre} onChange={setPre} />
        <BottomBar>
          <Button variant="ghost" onClick={onSkip}>Skip</Button>
          <Button className="flex-1" onClick={() => { setRating(pre); setStage(0); setPhase('intro') }}>
            Start exercises
          </Button>
        </BottomBar>
      </div>
    )
  }

  const item = VESTIBULAR_ITEMS[stage]

  if (phase === 'run') return <Exercise item={item} onEnd={() => setPhase('rate')} />

  if (phase === 'rate') {
    const rise = Math.max(...VESTIBULAR_SYMPTOMS.map((s) => rating[s.id] - pre[s.id]))
    return (
      <div>
        <StepHeader kicker={`${item.title} · ${stage + 1} of ${VESTIBULAR_ITEMS.length}`} title="How do you feel now?">
          Same 0–10 scale. Starting values are from last time; only change what’s different.
        </StepHeader>
        <RatingCard value={rating} onChange={setRating} />
        {rise >= 2 && (
          <Card className="mt-3 border-warn bg-warn-soft p-4 text-sm font-medium text-warn">
            Symptoms went up {rise} points. That’s a positive finding. Take a break before the next exercise.
          </Card>
        )}
        <BottomBar>
          <Button variant="secondary" onClick={() => setPhase('run')}>Redo</Button>
          <Button
            className="flex-1"
            onClick={() => {
              const all = { ...items, [item.id]: rating }
              setItems(all)
              if (stage + 1 >= VESTIBULAR_ITEMS.length) onDone({ pre, items: all })
              else {
                setStage(stage + 1)
                setPhase('intro')
              }
            }}
          >
            {stage + 1 >= VESTIBULAR_ITEMS.length ? 'Finish' : 'Next exercise'}
          </Button>
        </BottomBar>
      </div>
    )
  }

  return (
    <div>
      <StepHeader kicker={`Eyes & motion · ${stage + 1} of ${VESTIBULAR_ITEMS.length}`} title={item.title}>
        {item.instruction}
      </StepHeader>
      <Card className="p-4 text-sm text-muted">
        {item.mode === 'vor' || item.mode === 'vms' ? 'Follow the beeps. Each beep = move to the other side.' : 'Takes about 10 seconds. Phone at arm’s length, at eye level.'}
      </Card>
      <BottomBar>
        <Button variant="ghost" onClick={() => onDone({ pre, items })}>End here</Button>
        <Button className="flex-1" size="lg" onClick={() => { unlockAudio(); setPhase('run') }}>
          <Icon name="play" size={18} /> Start
        </Button>
      </BottomBar>
    </div>
  )
}

function RatingCard({ value, onChange }: { value: VestibularRating; onChange: (v: VestibularRating) => void }) {
  return (
    <Card className="divide-y divide-line px-4">
      {VESTIBULAR_SYMPTOMS.map((s) => (
        <ScaleRow key={s.id} label={s.label} max={10} value={value[s.id]} onChange={(v) => onChange({ ...value, [s.id]: v })} compact />
      ))}
    </Card>
  )
}

/** Full-screen animated target for one exercise. */
function Exercise({ item, onEnd }: { item: Item; onEnd: () => void }) {
  const dotRef = useRef<HTMLDivElement>(null)
  const [cue, setCue] = useState('')

  useEffect(() => {
    const dot = dotRef.current!
    let raf = 0
    let timer = 0
    let alive = true
    const W = () => Math.min(window.innerWidth, 900) * 0.38
    const H = () => window.innerHeight * 0.3

    const metronome = (bpm: number, beats: number, phases: string[]) =>
      new Promise<void>((resolve) => {
        let n = 0
        const per = 60000 / bpm
        const beatsPer = Math.ceil(beats / phases.length)
        const tick = () => {
          if (!alive) return
          if (n >= beats) return resolve()
          setCue(phases[Math.floor(n / beatsPer)])
          beep(n % 2 ? 740 : 880, 70, 0.3)
          n++
          timer = window.setTimeout(tick, per)
        }
        tick()
      })

    const run = async () => {
      if (item.mode === 'pursuit') {
        // 2 s per full cycle, 2 cycles horizontal then 2 vertical
        for (const axis of ['x', 'y'] as const) {
          setCue(axis === 'x' ? 'Follow side to side' : 'Follow up and down')
          await new Promise<void>((resolve) => {
            const t0 = performance.now()
            const frame = (t: number) => {
              if (!alive) return
              const p = (t - t0) / 2000
              if (p >= 2) return resolve()
              const s = Math.sin(p * 2 * Math.PI)
              dot.style.transform = axis === 'x' ? `translate(${s * W()}px, 0)` : `translate(0, ${s * H()}px)`
              raf = requestAnimationFrame(frame)
            }
            raf = requestAnimationFrame(frame)
          })
        }
      } else if (item.mode === 'saccades') {
        for (const axis of ['x', 'y'] as const) {
          setCue(axis === 'x' ? 'Jump left ↔ right' : 'Jump up ↕ down')
          for (let i = 0; i < 20 && alive; i++) {
            const s = i % 2 ? -1 : 1
            dot.style.transform = axis === 'x' ? `translate(${s * W()}px, 0)` : `translate(0, ${s * H()}px)`
            await new Promise((r) => (timer = window.setTimeout(r, 500)))
          }
        }
      } else if (item.mode === 'vor') {
        dot.style.transform = 'none'
        await metronome(180, 40, ['Turn head side to side', 'Nod head up and down'])
      } else {
        dot.style.transform = 'none'
        await metronome(50, 10, ['Rotate body left ↔ right'])
      }
      if (alive) {
        beep(523, 200, 0.3)
        onEnd()
      }
    }
    void run()
    return () => {
      alive = false
      cancelAnimationFrame(raf)
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const letter = item.mode === 'vor' || item.mode === 'vms'
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg">
      <div className="absolute top-[max(1.25rem,env(safe-area-inset-top))] text-sm font-bold uppercase tracking-[0.1em] text-accent">{cue}</div>
      {letter ? (
        <div ref={dotRef} className="text-[72px] font-black leading-none">E</div>
      ) : (
        <div ref={dotRef} className="h-7 w-7 rounded-full bg-accent shadow-[0_0_24px] shadow-accent/60" />
      )}
      <button onClick={onEnd} className="absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] h-11 rounded-full px-5 text-sm font-semibold text-muted">
        Stop: symptoms too strong
      </button>
    </div>
  )
}
