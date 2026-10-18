import { useEffect, useState } from 'react'
import { BottomBar, Button, Card, Icon, StepHeader, YesNo } from '../components/ui'
import { speak, unlockAudio } from '../lib/audio'
import { DIGIT_STRINGS, MONTHS } from '../lib/content'
import type { ConcentrationResult } from '../lib/types'
import type { StepProps } from './shared'

/** Digits backward (lengths 3–6, two tries each) then months in reverse. */
export function Concentration({ onDone }: StepProps<ConcentrationResult>) {
  const [level, setLevel] = useState(0) // index into DIGIT_STRINGS
  const [attempt, setAttempt] = useState(0) // 0 or 1
  const [digits, setDigits] = useState<number | null>(null)
  const [monthsStart, setMonthsStart] = useState<number | null>(null)
  const [now, setNow] = useState(0)
  const [months, setMonths] = useState<boolean | undefined>()
  const [monthsSec, setMonthsSec] = useState<number>()

  useEffect(() => {
    if (monthsStart === null || months !== undefined) return
    const id = setInterval(() => setNow(Date.now()), 200)
    return () => clearInterval(id)
  }, [monthsStart, months])

  const str = DIGIT_STRINGS[level]?.[attempt]

  function mark(correct: boolean) {
    if (correct) {
      if (level + 1 >= DIGIT_STRINGS.length) setDigits(DIGIT_STRINGS.length)
      else {
        setLevel(level + 1)
        setAttempt(0)
      }
    } else if (attempt === 0) setAttempt(1)
    else setDigits(level) // passed `level` lengths before failing both tries
  }

  if (digits === null) {
    return (
      <div>
        <StepHeader kicker="Concentration · part 1" title="Digits backward">
          Say: <b className="text-ink">“I’ll read some numbers. When I’m done, say them back to me backwards.”</b> Read at one digit per second.
        </StepHeader>
        <Card className="p-5 text-center">
          <div className="text-xs font-semibold uppercase tracking-wider text-faint">
            {level + 3} digits · try {attempt + 1} of 2
          </div>
          <div className="my-4 text-[44px] font-bold tracking-[0.15em] tabular">{str.replace(/-/g, ' ')}</div>
          <div className="mb-4 text-sm text-muted">
            Correct answer: <b className="text-ink tabular">{str.split('-').reverse().join(' ')}</b>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              unlockAudio()
              void speak(str.split('-').join(', '), 0.7)
            }}
          >
            <Icon name="speaker" size={16} /> Phone reads digits
          </Button>
        </Card>
        <div className="mt-4">
          <YesNo key={`${level}-${attempt}`} onChange={mark} yes="Correct" no="Wrong" />
        </div>
      </div>
    )
  }

  const elapsed = monthsStart ? Math.min(99, Math.floor(((monthsSec !== undefined ? monthsStart + monthsSec * 1000 : now) - monthsStart) / 1000)) : 0

  return (
    <div>
      <StepHeader kicker="Concentration · part 2" title="Months in reverse">
        Say: <b className="text-ink">“Tell me the months of the year in reverse order, starting with the last month and going backward.”</b> Correct = no mistakes within 30 seconds.
      </StepHeader>
      <Card className="p-5">
        <div className="mb-4 text-center text-sm leading-relaxed text-muted">{[...MONTHS].reverse().join(' · ')}</div>
        <div className={`text-center text-5xl font-bold tabular ${elapsed > 30 ? 'text-danger' : ''}`}>{elapsed}s</div>
        {monthsStart === null && (
          <div className="mt-4 text-center">
            <Button onClick={() => { setMonthsStart(Date.now()); setNow(Date.now()) }}>Start timer</Button>
          </div>
        )}
      </Card>
      {monthsStart !== null && (
        <div className="mt-4">
          <YesNo
            value={months}
            onChange={(v) => {
              const sec = Math.round((Date.now() - monthsStart) / 100) / 10
              setMonthsSec(sec)
              setMonths(v && sec <= 30)
            }}
            yes="All correct"
            no="Made a mistake"
          />
        </div>
      )}
      <BottomBar>
        <Button className="flex-1" size="lg" disabled={months === undefined} onClick={() => onDone({ digits, monthsCorrect: !!months, monthsSeconds: monthsSec })}>
          Next
        </Button>
      </BottomBar>
    </div>
  )
}
