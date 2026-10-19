import { useState } from 'react'
import { BottomBar, Button, Card, Icon, StepHeader } from '../components/ui'
import { OBSERVED_SIGNS, RED_FLAGS } from '../lib/content'
import { updateSession } from '../lib/store'
import type { RedFlagResult } from '../lib/types'
import type { StepProps } from './shared'

export function RedFlags({ athlete, session, onDone }: StepProps<RedFlagResult>) {
  const [flags, setFlags] = useState<Set<string>>(new Set())
  const [context, setContext] = useState(session.context ?? '')
  const [signs, setSigns] = useState<Set<string>>(new Set())

  const toggle = (set: Set<string>, setter: (s: Set<string>) => void, id: string) => {
    const next = new Set(set)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setter(next)
  }

  const emergency = flags.size > 0
  const done = (r: RedFlagResult) => {
    const c = context.trim()
    if (c !== (session.context ?? '')) updateSession(session.id, { context: c || undefined })
    onDone(r)
  }

  return (
    <div>
      <StepHeader kicker="Step 1 · Examiner" title="Check for danger signs first">
        Look at {athlete.name.split(' ')[0]} and ask. Tap anything you see.
      </StepHeader>

      <Card className={`overflow-hidden ${emergency ? 'border-danger' : ''}`}>
        <div className="flex items-center gap-2 border-b border-line bg-danger-soft px-4 py-3 text-sm font-bold text-danger">
          <Icon name="alert" size={18} /> Any of these → call 911
        </div>
        {RED_FLAGS.map((f) => (
          <CheckRow key={f.id} label={f.label} note={'note' in f ? f.note : undefined} on={flags.has(f.id)} tone="danger" onClick={() => toggle(flags, setFlags, f.id)} />
        ))}
      </Card>

      <Card className="mt-4 overflow-hidden">
        <div className="border-b border-line bg-warn-soft px-4 py-3 text-sm font-bold text-warn">Any of these → remove from play</div>
        {OBSERVED_SIGNS.map((f) => (
          <CheckRow key={f.id} label={f.label} on={signs.has(f.id)} tone="warn" onClick={() => toggle(signs, setSigns, f.id)} />
        ))}
      </Card>

      {!session.quick && (
        <label className="mt-4 block">
          <span className="mb-1.5 block px-1 text-sm font-semibold">What happened? <span className="font-normal text-muted">(optional, for the doctor)</span></span>
          <input
            value={context}
            onChange={(e) => setContext(e.target.value)}
            maxLength={120}
            placeholder="e.g. helmet-to-helmet hit, 2nd quarter"
            className="h-12 w-full rounded-xl border border-line bg-surface px-4 text-[16px] outline-none focus:border-accent"
          />
        </label>
      )}

      <BottomBar>
        {emergency ? (
          <Button variant="danger" size="lg" className="flex-1 pulse-ring" onClick={() => done({ redFlags: [...flags], observedSigns: [...signs] })}>
            <Icon name="phone" /> Emergency: what to do
          </Button>
        ) : (
          <Button size="lg" className="flex-1" onClick={() => done({ redFlags: [], observedSigns: [...signs] })}>
            {signs.size ? 'Continue' : 'None of these: continue'}
          </Button>
        )}
      </BottomBar>
    </div>
  )
}

function CheckRow({ label, note, on, tone, onClick }: { label: string; note?: string; on: boolean; tone: 'danger' | 'warn'; onClick: () => void }) {
  const onCls = tone === 'danger' ? 'bg-danger text-white border-danger' : 'bg-warn text-white border-warn'
  return (
    <button onClick={onClick} aria-pressed={on} className="flex w-full items-center gap-3 border-b border-line px-4 py-3.5 text-left last:border-0 hover:bg-surface-2">
      <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border-2 transition ${on ? onCls : 'border-line'}`}>
        {on && <Icon name="check" size={14} />}
      </span>
      <span>
        <span className="block text-[15px] font-medium">{label}</span>
        {note && on && <span className="mt-0.5 block text-sm font-semibold text-danger">{note}</span>}
      </span>
    </button>
  )
}
