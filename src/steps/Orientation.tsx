import { useMemo, useState } from 'react'
import { BottomBar, Button, Card, StepHeader, YesNo } from '../components/ui'
import type { OrientationResult } from '../lib/types'
import type { StepProps } from './shared'

export function Orientation({ onDone }: StepProps<OrientationResult>) {
  // The correct answers come from the phone's clock, so the examiner doesn't have to think.
  const qs = useMemo(() => {
    const now = new Date()
    const hour = now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    return [
      { id: 'month', q: 'What month is it?', a: now.toLocaleString(undefined, { month: 'long' }) },
      { id: 'date', q: 'What is the date today?', a: String(now.getDate()) },
      { id: 'day', q: 'What day of the week is it?', a: now.toLocaleString(undefined, { weekday: 'long' }) },
      { id: 'year', q: 'What year is it?', a: String(now.getFullYear()) },
      { id: 'time', q: 'What time is it right now?', a: `${hour} (within 1 hour)` },
    ]
  }, [])
  const [answers, setAnswers] = useState<Record<string, boolean>>({})
  const done = qs.every((q) => answers[q.id] !== undefined)

  return (
    <div>
      <StepHeader kicker="Examiner asks" title="Orientation">
        Ask each question out loud. The correct answer is shown for you; don’t let the athlete see the screen.
      </StepHeader>
      <div className="space-y-3">
        {qs.map((q) => (
          <Card key={q.id} className="p-4">
            <div className="text-[17px] font-semibold">“{q.q}”</div>
            <div className="mb-3 mt-1 text-sm text-muted">
              Answer: <b className="text-ink">{q.a}</b>
            </div>
            <YesNo value={answers[q.id]} onChange={(v) => setAnswers({ ...answers, [q.id]: v })} />
          </Card>
        ))}
      </div>
      <BottomBar>
        <Button className="flex-1" size="lg" disabled={!done} onClick={() => onDone({ answers })}>
          Next
        </Button>
      </BottomBar>
    </div>
  )
}
