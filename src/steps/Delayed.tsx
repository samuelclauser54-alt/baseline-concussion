import { useEffect, useState } from 'react'
import { BottomBar, Button, Card, StepHeader } from '../components/ui'
import { WORD_LISTS } from '../lib/content'
import type { DelayedResult } from '../lib/types'
import { WordChecklist, type StepProps } from './shared'

/** Standard delayed recall happens ≥5 minutes after the word list. */
const MIN_DELAY_S = 300

export function Delayed({ session, onDone, onSkip }: StepProps<DelayedResult>) {
  const mem = session.results.memory
  const [now, setNow] = useState(() => Date.now())
  const [recalled, setRecalled] = useState<Set<number>>(new Set())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  if (!mem) {
    return (
      <div>
        <StepHeader title="Delayed recall">The word-list test was skipped, so there’s nothing to recall.</StepHeader>
        <BottomBar>
          <Button className="flex-1" onClick={onSkip}>Continue</Button>
        </BottomBar>
      </div>
    )
  }

  const words = WORD_LISTS[mem.list]
  const delay = Math.floor((now - mem.finishedAt) / 1000)
  const wait = Math.max(0, MIN_DELAY_S - delay)

  return (
    <div>
      <StepHeader kicker="Last step" title="Delayed recall">
        Say: <b className="text-ink">“Earlier I read you a list of words. Tell me as many as you can remember, in any order.”</b> Don’t read the list again.
      </StepHeader>
      {wait > 0 && (
        <Card className="mb-4 flex items-center justify-between gap-3 border-warn bg-warn-soft p-4 text-sm text-warn">
          <span>
            Best after 5 minutes. <b className="tabular">{Math.floor(wait / 60)}:{String(wait % 60).padStart(2, '0')}</b> to go. Recheck symptoms while you wait.
          </span>
        </Card>
      )}
      <WordChecklist
        words={words}
        recalled={recalled}
        onToggle={(i) => {
          const n = new Set(recalled)
          if (n.has(i)) n.delete(i)
          else n.add(i)
          setRecalled(n)
        }}
      />
      <BottomBar>
        <Button className="flex-1" size="lg" onClick={() => onDone({ recalled: recalled.size, delaySeconds: delay })}>
          {recalled.size} of 10 recalled · Finish
        </Button>
      </BottomBar>
    </div>
  )
}
