import { useState } from 'react'
import { BottomBar, Button, Card, StepHeader } from '../components/ui'
import { SYMPTOMS } from '../lib/content'
import type { SymptomResult } from '../lib/types'
import { ScaleRow, type StepProps } from './shared'

export function Symptoms({ athlete, session, onDone }: StepProps<SymptomResult>) {
  const [vals, setVals] = useState<SymptomResult>({})
  const count = Object.values(vals).filter((v) => v > 0).length
  const severity = Object.values(vals).reduce((a, b) => a + b, 0)
  const first = athlete.name.split(' ')[0]

  return (
    <div>
      <StepHeader kicker="Athlete answers" title="How do you feel right now?">
        {first}, rate each one. <b className="text-ink">0</b> = not at all, <b className="text-ink">6</b> = severe.
        {session.kind === 'baseline' && ' Answer for how you usually feel; this is your normal.'}
      </StepHeader>

      <Card className="divide-y divide-line px-4">
        {SYMPTOMS.map((s) => (
          <ScaleRow key={s.id} label={s.label} max={6} value={vals[s.id] ?? 0} onChange={(v) => setVals({ ...vals, [s.id]: v })} />
        ))}
      </Card>

      <BottomBar>
        <div className="flex flex-1 items-center justify-between gap-3">
          <div className="text-sm text-muted tabular">
            <b className="text-ink">{count}</b> symptoms · severity <b className="text-ink">{severity}</b>
          </div>
          <Button onClick={() => onDone(vals)}>Done</Button>
        </div>
      </BottomBar>
    </div>
  )
}
