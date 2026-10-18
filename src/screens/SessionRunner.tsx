import { useEffect, useState, type ComponentType } from 'react'
import { BottomBar, Button, Card, Icon, StepHeader, formatDate } from '../components/ui'
import { BASELINE_STEPS, CHECK_STEPS, STEP_LABELS } from '../lib/content'
import { navigate } from '../lib/router'
import { buildReport } from '../lib/scoring'
import { baselineFor, saveResult, updateSession, useData } from '../lib/store'
import type { SessionResults, StepId } from '../lib/types'
import { Balance } from '../steps/Balance'
import { Concentration } from '../steps/Concentration'
import { Delayed } from '../steps/Delayed'
import { Memory } from '../steps/Memory'
import { Orientation } from '../steps/Orientation'
import { Reaction } from '../steps/Reaction'
import { RedFlags } from '../steps/RedFlags'
import type { StepProps } from '../steps/shared'
import { Symptoms } from '../steps/Symptoms'
import { Vestibular } from '../steps/Vestibular'
import { NotFound } from './AthleteDetail'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const COMPONENTS: Record<StepId, ComponentType<StepProps<any>>> = {
  redflags: RedFlags,
  symptoms: Symptoms,
  orientation: Orientation,
  memory: Memory,
  concentration: Concentration,
  reaction: Reaction,
  balance: Balance,
  vestibular: Vestibular,
  delayed: Delayed,
}

export function SessionRunner({ id }: { id: string }) {
  const data = useData()
  const session = data.sessions.find((s) => s.id === id)
  const athlete = session && data.athletes.find((a) => a.id === session.athleteId)
  const [earlyStopSeen, setEarlyStopSeen] = useState(false)
  if (!session || !athlete) return <NotFound />

  const steps = session.kind === 'baseline' ? BASELINE_STEPS : CHECK_STEPS
  const baseline = session.kind === 'check' ? baselineFor(athlete.id, session.startedAt) : undefined

  if (session.completedAt) return <Redirect to={`/report/${session.id}`} />

  const finish = (extra: Partial<typeof session> = {}) => {
    updateSession(session.id, { completedAt: Date.now(), ...extra })
    navigate(`/report/${session.id}`, true)
  }

  const stepIdx = Math.min(session.step, steps.length)
  if (stepIdx >= steps.length) return <Redirect to={`/report/${session.id}`} onBefore={() => updateSession(session.id, { completedAt: Date.now() })} />
  const stepId = steps[stepIdx]

  // After symptoms in a sideline check: if we already know the athlete is out,
  // let the coach stop here instead of making a hurt kid do 6 more minutes of tests.
  if (session.kind === 'check' && stepIdx === steps.indexOf('orientation') && !earlyStopSeen) {
    const rep = buildReport({ redflags: session.results.redflags, symptoms: session.results.symptoms }, baseline?.results)
    if (rep.verdict === 'remove') {
      return (
        <Shell athleteName={athlete.name} kind={session.kind} steps={steps} idx={stepIdx}>
          <StepHeader kicker="Result so far" title={`${athlete.name.split(' ')[0]} should not return to play today`}>
            {rep.findings.filter((f) => f.status === 'flag').map((f) => f.summary).join('. ')}.
          </StepHeader>
          <Card className="p-4 text-[15px] leading-relaxed text-muted">
            You can stop here. Or, if the athlete feels up to it, finish the full check (about 6 minutes) to give their
            doctor a detailed comparison with baseline.
          </Card>
          <BottomBar>
            <Button variant="secondary" onClick={() => finish()}>Stop &amp; see report</Button>
            <Button className="flex-1" onClick={() => setEarlyStopSeen(true)}>Continue full check</Button>
          </BottomBar>
        </Shell>
      )
    }
  }

  const Step = COMPONENTS[stepId]
  return (
    <Shell athleteName={athlete.name} kind={session.kind} steps={steps} idx={stepIdx}>
      <Step
        key={stepId}
        athlete={athlete}
        session={session}
        baseline={baseline}
        onDone={(result: SessionResults[StepId]) => {
          saveResult(session.id, stepId, result, stepIdx + 1)
          window.scrollTo(0, 0)
          if (stepId === 'redflags' && (result as SessionResults['redflags'])!.redFlags.length) {
            finish({ stoppedForEmergency: true })
          } else if (stepIdx + 1 >= steps.length) finish()
        }}
        onSkip={() => {
          updateSession(session.id, { step: stepIdx + 1, skipped: [...session.skipped, stepId] })
          window.scrollTo(0, 0)
          if (stepIdx + 1 >= steps.length) finish()
        }}
      />
    </Shell>
  )
}

function Shell({
  athleteName,
  kind,
  steps,
  idx,
  children,
}: {
  athleteName: string
  kind: 'baseline' | 'check'
  steps: StepId[]
  idx: number
  children: React.ReactNode
}) {
  return (
    <div>
      <header className="sticky top-0 z-20 -mx-4 mb-5 bg-bg/90 px-4 pb-3 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur-md">
        <div className="flex h-11 items-center gap-2">
          <button onClick={() => history.back()} className="-ml-2 grid h-10 w-10 place-items-center rounded-full text-muted hover:bg-surface-2" aria-label="Pause and exit">
            <Icon name="x" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px] font-semibold">{athleteName}</div>
            <div className="text-xs text-muted">
              {kind === 'check' ? 'Sideline check' : 'Baseline'} · {STEP_LABELS[steps[idx]]} · {formatDate(Date.now(), true)}
            </div>
          </div>
          <span className="text-xs font-semibold text-muted tabular">
            {idx + 1}/{steps.length}
          </span>
        </div>
        <div className="mt-2 flex gap-1">
          {steps.map((s, i) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${i < idx ? 'bg-accent' : i === idx ? 'bg-accent/50' : 'bg-line'}`} />
          ))}
        </div>
      </header>
      {children}
    </div>
  )
}

function Redirect({ to, onBefore }: { to: string; onBefore?: () => void }) {
  useEffect(() => {
    onBefore?.()
    navigate(to, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to])
  return null
}
