import { useRef, useState } from 'react'
import { BottomBar, Button, Card, Icon, StepHeader } from '../components/ui'
import { speak, stopSpeaking, unlockAudio } from '../lib/audio'
import { WORD_LISTS } from '../lib/content'
import { nextWordList } from '../lib/store'
import type { MemoryResult } from '../lib/types'
import { WordChecklist, type StepProps } from './shared'

const TRIALS = 3

export function Memory({ athlete, onDone }: StepProps<MemoryResult>) {
  const [list] = useState(() => nextWordList(athlete.id))
  const words = WORD_LISTS[list]
  const [trial, setTrial] = useState(0)
  const [scores, setScores] = useState<number[]>([])
  const [phase, setPhase] = useState<'present' | 'recall' | 'final'>('present')
  const [playing, setPlaying] = useState(-1)
  const [show, setShow] = useState(false)
  const [recalled, setRecalled] = useState<Set<number>>(new Set())
  const cancelled = useRef(false)

  async function play() {
    unlockAudio()
    cancelled.current = false
    for (let i = 0; i < words.length; i++) {
      if (cancelled.current) return
      setPlaying(i)
      const t = performance.now()
      await speak(words[i], 0.9)
      // one word per second, like a standard examiner-read list
      const wait = 1000 - (performance.now() - t)
      if (wait > 0) await new Promise((r) => setTimeout(r, wait))
    }
    setPlaying(-1)
    setPhase('recall')
  }

  function nextTrial() {
    const s = [...scores, recalled.size]
    setScores(s)
    setRecalled(new Set())
    if (s.length >= TRIALS) setPhase('final')
    else {
      setTrial(trial + 1)
      setPhase('present')
    }
  }

  if (phase === 'final') {
    return (
      <div>
        <StepHeader kicker="Memory" title="Remember these words">
          Tell {athlete.name.split(' ')[0]}: <b className="text-ink">“I’ll ask you for these words again in a few minutes.”</b>
        </StepHeader>
        <Card className="p-5">
          <div className="grid grid-cols-3 gap-3 text-center">
            {scores.map((s, i) => (
              <div key={i}>
                <div className="text-3xl font-bold tabular">{s}</div>
                <div className="text-xs text-muted">Trial {i + 1}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t border-line pt-3 text-center text-sm text-muted">
            Total <b className="text-ink tabular">{scores.reduce((a, b) => a + b, 0)}</b> / 30
          </div>
        </Card>
        <BottomBar>
          <Button className="flex-1" size="lg" onClick={() => onDone({ list, trials: scores, finishedAt: Date.now() })}>
            Next
          </Button>
        </BottomBar>
      </div>
    )
  }

  return (
    <div>
      <StepHeader kicker={`Memory · trial ${trial + 1} of ${TRIALS}`} title={phase === 'present' ? 'Read the word list' : 'What words do you remember?'}>
        {phase === 'present' ? (
          trial === 0 ? (
            <>Say: <b className="text-ink">“I’m going to test your memory. I’ll read a list of words, and when I’m done, repeat back as many as you can, in any order.”</b></>
          ) : (
            <>Say: <b className="text-ink">“I’ll read the same list again. Repeat back as many words as you can, including ones you said before.”</b></>
          )
        ) : (
          <>Tap every word the athlete says. Order doesn’t matter.</>
        )}
      </StepHeader>

      {phase === 'present' ? (
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-muted">10 words · 1 per second</span>
            <button onClick={() => setShow(!show)} className="text-sm font-semibold text-accent">
              {show ? 'Hide words' : 'Show words to read aloud'}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {words.map((w, i) => (
              <div
                key={w}
                className={`rounded-xl px-3 py-2.5 text-center text-[15px] font-semibold capitalize transition ${
                  playing === i ? 'bg-accent text-on-accent scale-105' : playing > i ? 'bg-surface-2 text-faint' : 'bg-surface-2'
                }`}
              >
                {show || playing === i ? w : '•••'}
              </div>
            ))}
          </div>
        </Card>
      ) : (
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
      )}

      <BottomBar>
        {phase === 'present' ? (
          <>
            <Button variant="secondary" onClick={() => { cancelled.current = true; stopSpeaking(); setPlaying(-1); setPhase('recall') }}>
              I read them
            </Button>
            <Button className="flex-1" onClick={play} disabled={playing >= 0}>
              <Icon name="speaker" size={18} /> {playing >= 0 ? 'Reading…' : 'Phone reads words'}
            </Button>
          </>
        ) : (
          <Button className="flex-1" size="lg" onClick={nextTrial}>
            {recalled.size} recalled · {trial + 1 < TRIALS ? 'Next trial' : 'Finish'}
          </Button>
        )}
      </BottomBar>
    </div>
  )
}
