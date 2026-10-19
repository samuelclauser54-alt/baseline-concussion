import { useEffect, useRef, useState } from 'react'
import { SwayCloud, swayRange } from '../components/charts'
import { BottomBar, Button, Card, Icon, StepHeader } from '../components/ui'
import { analyzeStance, postureCheck } from '../lib/balance'
import { beep, speak, unlockAudio } from '../lib/audio'
import { STANCES } from '../lib/content'
import { keepAwake, motionAvailable, MotionRecorder, probeMotion, requestMotionPermission } from '../lib/sensors'
import type { BalanceResult, StanceResult } from '../lib/types'
import type { StepProps } from './shared'

const DURATION_S = 20

type Phase = 'setup' | 'nosensor' | 'ready' | 'countdown' | 'recording' | 'result'

export function Balance({ athlete, baseline, onDone, onSkip }: StepProps<BalanceResult>) {
  const [phase, setPhase] = useState<Phase>(motionAvailable() ? 'setup' : 'nosensor')
  const [idx, setIdx] = useState(0)
  const [results, setResults] = useState<StanceResult[]>([])
  const [last, setLast] = useState<StanceResult | null>(null)
  const [warning, setWarning] = useState<string>('')
  const [count, setCount] = useState(0)
  const [checking, setChecking] = useState(false)
  const dot = useRef<HTMLDivElement>(null)
  const cancel = useRef(false)

  const stance = STANCES[idx]
  const standFoot = athlete.dominantFoot === 'right' ? 'LEFT' : 'RIGHT'
  const baseStance = baseline?.results.balance?.stances.find((s) => s.id === stance?.id)

  useEffect(() => () => void (cancel.current = true), [])

  async function enable() {
    unlockAudio()
    setChecking(true)
    const ok = (await requestMotionPermission()) && (await probeMotion())
    setChecking(false)
    setPhase(ok ? 'ready' : 'nosensor')
  }

  async function run() {
    unlockAudio()
    cancel.current = false
    setWarning('')
    const release = await keepAwake()
    setPhase('countdown')
    await speak(`${stance.title}. Hold the phone flat against your chest. Get in position.`)
    for (let n = 3; n >= 1; n--) {
      if (cancel.current) return release()
      setCount(n)
      beep(660, 120)
      await sleep(1000)
    }
    if (cancel.current) return release()
    await speak('Close your eyes.', 1.05)
    const rec = new MotionRecorder()
    // live dot for the examiner: horizontal motion relative to a running average
    let gx = NaN
    let gz = NaN
    rec.onSample = (s) => {
      if (Number.isNaN(gx)) {
        gx = s.x
        gz = s.z
      }
      gx += 0.03 * (s.x - gx)
      gz += 0.03 * (s.z - gz)
      if (dot.current) {
        const k = 60 // px per m/s²
        const dx = Math.max(-70, Math.min(70, (s.x - gx) * k))
        const dy = Math.max(-70, Math.min(70, (s.z - gz) * k))
        dot.current.style.transform = `translate(${dx}px, ${dy}px)`
      }
    }
    rec.start()
    beep(1046, 250, 0.35)
    setPhase('recording')
    const t0 = performance.now()
    while (performance.now() - t0 < DURATION_S * 1000) {
      if (cancel.current) {
        rec.stop()
        return release()
      }
      setCount(Math.ceil(DURATION_S - (performance.now() - t0) / 1000))
      await sleep(200)
    }
    const samples = rec.stop()
    beep(1046, 150, 0.35)
    await sleep(180)
    beep(1046, 150, 0.35)
    release()
    void speak('Done. Open your eyes.')

    const r = analyzeStance(stance.id, samples)
    if (r.samples < 100) setWarning('Too few sensor readings. Make sure the screen stays on and try again.')
    else if (postureCheck(samples) === 'flat') setWarning('The phone looked flat, not upright against the chest. Consider redoing it.')
    else if (r.errors >= 5) setWarning('Lots of big movements. Did the athlete step out of the stance or drop the phone?')
    setLast(r)
    setPhase('result')
  }

  function accept() {
    const all = [...results.filter((r) => r.id !== last!.id), last!]
    setResults(all)
    setLast(null)
    if (idx + 1 >= STANCES.length) onDone({ supported: true, stances: all })
    else {
      setIdx(idx + 1)
      setPhase('ready')
    }
  }

  if (phase === 'nosensor') {
    return (
      <div>
        <StepHeader kicker="Balance" title="This device has no motion sensor">
          The balance test uses a phone’s accelerometer. Open Baseline on a phone to include it, or skip it for now.
        </StepHeader>
        <Card className="p-4 text-sm text-muted">
          On iPhone, tap <b className="text-ink">Allow</b> when asked about motion access. If you said no earlier, close and reopen the tab.
        </Card>
        <BottomBar>
          <Button variant="secondary" onClick={() => setPhase('setup')}>Try again</Button>
          <Button className="flex-1" onClick={onSkip}>Skip balance</Button>
        </BottomBar>
      </div>
    )
  }

  if (phase === 'setup') {
    return (
      <div>
        <StepHeader kicker="Balance · 1 minute" title="Three 20-second stances">
          Eyes closed, phone held flat against the chest with both hands. The phone measures sway. Have someone stand close by to catch the athlete.
        </StepHeader>
        <HoldDiagram />
        <p className="mt-4 flex items-center gap-2 px-1 text-sm text-muted">
          <Icon name="speaker" size={16} /> Turn the volume up. The phone says when to start and stop.
        </p>
        <BottomBar>
          <Button variant="ghost" onClick={onSkip}>Skip</Button>
          <Button className="flex-1" size="lg" onClick={enable} disabled={checking}>
            {checking ? 'Checking sensor…' : 'Turn on motion sensor'}
          </Button>
        </BottomBar>
      </div>
    )
  }

  if (phase === 'countdown' || phase === 'recording') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-bg px-6 text-center">
        <div className="text-sm font-bold uppercase tracking-[0.1em] text-accent">{stance.title}</div>
        <div className="text-[96px] font-black leading-none tabular">{count}</div>
        <div className="text-lg font-semibold text-muted">{phase === 'countdown' ? 'Get in position…' : 'Eyes closed. Stay still.'}</div>
        <div className="relative grid h-40 w-40 place-items-center rounded-full border border-line bg-surface-2">
          <div className="absolute h-20 w-20 rounded-full border border-dashed border-line" />
          <div ref={dot} className="h-5 w-5 rounded-full bg-accent shadow-lg shadow-accent/40 transition-transform duration-75" />
        </div>
        <button
          className="h-11 rounded-full px-5 text-sm font-semibold text-muted"
          onClick={() => {
            cancel.current = true
            setPhase('ready')
          }}
        >
          Cancel
        </button>
      </div>
    )
  }

  if (phase === 'result' && last) {
    const range = swayRange(last.trace, baseStance?.trace ?? [])
    return (
      <div>
        <StepHeader kicker={`Balance · ${idx + 1} of 3`} title={stance.title} />
        <Card className="p-5">
          <div className="flex items-center justify-around gap-4">
            {baseStance && (
              <div className="text-center">
                <SwayCloud trace={baseStance.trace} range={range} color="var(--faint)" size={120} label="Baseline sway" />
                <div className="mt-2 text-xs text-muted">Baseline · {baseStance.swayMg} mg</div>
              </div>
            )}
            <div className="text-center">
              <SwayCloud trace={last.trace} range={range} size={baseStance ? 120 : 160} label="Today's sway" />
              <div className="mt-2 text-xs text-muted">{baseStance ? 'Now' : 'Sway'} · {last.swayMg} mg</div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 divide-x divide-line border-t border-line pt-4 text-center">
            <div>
              <div className="text-2xl font-bold tabular">{last.swayMg}<span className="text-sm text-muted"> mg</span></div>
              <div className="text-xs text-muted">Sway (lower is steadier)</div>
            </div>
            <div>
              <div className="text-2xl font-bold tabular">{last.errors}</div>
              <div className="text-xs text-muted">Balance breaks</div>
            </div>
          </div>
        </Card>
        {warning && <Card className="mt-3 border-warn bg-warn-soft p-4 text-sm font-medium text-warn">{warning}</Card>}
        <BottomBar>
          <Button variant="secondary" onClick={() => setPhase('ready')}>Redo</Button>
          <Button className="flex-1" onClick={accept}>{idx + 1 >= STANCES.length ? 'Finish balance' : 'Next stance'}</Button>
        </BottomBar>
      </div>
    )
  }

  // ready
  return (
    <div>
      <StepHeader kicker={`Balance · ${idx + 1} of 3`} title={stance.title}>
        {stance.id === 'single' ? `Stand on your ${standFoot} foot. Lift the other foot off the ground.` : stance.detail}
      </StepHeader>
      <StanceFigure id={stance.id} standLeft={standFoot === 'LEFT'} />
      <Card className="mt-4 space-y-2 p-4 text-sm text-muted">
        <Row>Hold the phone upright, flat against your chest, with both hands.</Row>
        <Row>Close your eyes when told, and stay as still as you can for 20 seconds.</Row>
        <Row>If you lose balance, open your eyes, get back into position, and keep going.</Row>
      </Card>
      <BottomBar>
        <Button className="flex-1" size="lg" onClick={run}>
          <Icon name="play" size={18} /> Start (voice guided)
        </Button>
      </BottomBar>
    </div>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
      <span>{children}</span>
    </div>
  )
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function HoldDiagram() {
  return (
    <Card className="grid place-items-center p-6">
      <svg width="180" height="170" viewBox="0 0 180 170" aria-label="Hold the phone flat against your chest">
        <circle cx="90" cy="32" r="20" fill="var(--surface-2)" stroke="var(--muted)" strokeWidth="2" />
        <path d="M50 165 C50 100 55 70 90 62 C125 70 130 100 130 165" fill="var(--surface-2)" stroke="var(--muted)" strokeWidth="2" />
        <rect x="74" y="78" width="32" height="56" rx="6" fill="var(--accent)" />
        <rect x="78" y="84" width="24" height="42" rx="3" fill="var(--on-accent)" opacity="0.25" />
        <path d="M56 120 C66 112 72 108 76 104 M124 120 C114 112 108 108 104 104" stroke="var(--muted)" strokeWidth="6" strokeLinecap="round" fill="none" />
        <path d="M80 30 h6 M94 30 h6" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <div className="text-sm font-semibold text-muted">Phone upright on the chest, eyes closed</div>
    </Card>
  )
}

function StanceFigure({ id, standLeft }: { id: 'together' | 'tandem' | 'single'; standLeft: boolean }) {
  // top-down footprints
  const foot = (x: number, y: number, lifted = false) => (
    <g transform={`translate(${x} ${y})`} opacity={lifted ? 0.25 : 1}>
      <ellipse cx="0" cy="0" rx="13" ry="30" fill={lifted ? 'none' : 'var(--accent)'} stroke="var(--accent)" strokeWidth="2" strokeDasharray={lifted ? '4 4' : undefined} />
    </g>
  )
  return (
    <Card className="grid place-items-center p-6">
      <svg width="160" height="150" viewBox="0 0 160 150" aria-label={`${id} stance footprints`}>
        {id === 'together' && (
          <>
            {foot(66, 75)}
            {foot(94, 75)}
          </>
        )}
        {id === 'tandem' && (
          <>
            {foot(80, 42)}
            {foot(80, 108)}
          </>
        )}
        {id === 'single' && (
          <>
            {foot(66, 75, !standLeft)}
            {foot(94, 75, standLeft)}
          </>
        )}
      </svg>
      <div className="text-xs font-semibold uppercase tracking-wider text-faint">Top view of feet</div>
    </Card>
  )
}
