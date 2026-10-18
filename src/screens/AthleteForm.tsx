import { useState } from 'react'
import { BottomBar, Button, Card, StepHeader, TopBar } from '../components/ui'
import { navigate } from '../lib/router'
import { addAthlete, updateAthlete, useData } from '../lib/store'

const SPORTS = ['Football', 'Soccer', 'Basketball', 'Volleyball', 'Wrestling', 'Hockey', 'Baseball', 'Softball', 'Lacrosse', 'Cheer', 'Other']

export function AthleteForm({ id }: { id?: string }) {
  const data = useData()
  const existing = id ? data.athletes.find((a) => a.id === id) : undefined
  const [name, setName] = useState(existing?.name ?? '')
  const [sport, setSport] = useState(existing?.sport ?? 'Football')
  const [grad, setGrad] = useState(existing?.gradYear ? String(existing.gradYear) : '')
  const [foot, setFoot] = useState<'left' | 'right'>(existing?.dominantFoot ?? 'right')

  const valid = name.trim().length > 1

  function save() {
    const gradYear = grad ? Number(grad) : undefined
    if (existing) {
      updateAthlete(existing.id, { name: name.trim(), sport, gradYear, dominantFoot: foot })
      navigate(`/athlete/${existing.id}`, true)
    } else {
      const a = addAthlete({ name: name.trim(), sport, gradYear, dominantFoot: foot })
      navigate(`/athlete/${a.id}`, true)
    }
  }

  const label = 'mb-1.5 block text-sm font-semibold text-muted'
  const input = 'h-12 w-full rounded-xl border border-line bg-surface px-4 text-[16px] outline-none focus:border-accent'

  return (
    <div>
      <TopBar back="" />
      <StepHeader title={existing ? 'Edit athlete' : 'Add athlete'}>
        Only you see this. It’s stored on this phone, nowhere else.
      </StepHeader>
      <Card className="space-y-5 p-5">
        <div>
          <label className={label} htmlFor="name">Name</label>
          <input id="name" autoFocus={!existing} value={name} onChange={(e) => setName(e.target.value)} placeholder="First and last name" className={input} autoComplete="off" />
        </div>
        <div>
          <span className={label}>Sport</span>
          <div className="flex flex-wrap gap-2">
            {SPORTS.map((s) => (
              <button
                key={s}
                onClick={() => setSport(s)}
                className={`h-9 rounded-full border px-3.5 text-sm font-semibold transition ${sport === s ? 'border-accent bg-accent-soft text-accent' : 'border-line text-muted'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className={label} htmlFor="grad">Graduation year (optional)</label>
          <input id="grad" inputMode="numeric" value={grad} onChange={(e) => setGrad(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="2028" className={input} />
        </div>
        <div>
          <span className={label}>Dominant foot (the one you kick with)</span>
          <div className="grid grid-cols-2 gap-2">
            {(['left', 'right'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFoot(f)}
                className={`h-11 rounded-xl border text-sm font-semibold capitalize transition ${foot === f ? 'border-accent bg-accent-soft text-accent' : 'border-line text-muted'}`}
              >
                {f}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-faint">Balance tests use the other (non-dominant) foot.</p>
        </div>
      </Card>
      <BottomBar>
        <Button className="flex-1" size="lg" disabled={!valid} onClick={save}>
          {existing ? 'Save' : 'Add athlete'}
        </Button>
      </BottomBar>
    </div>
  )
}
