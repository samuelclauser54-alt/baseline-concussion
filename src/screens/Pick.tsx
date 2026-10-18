import { useState } from 'react'
import { Button, Card, Icon, Pill, SectionTitle, StepHeader, TopBar } from '../components/ui'
import { navigate } from '../lib/router'
import { addAthlete, baselineFor, startSession, useData } from '../lib/store'
import { Avatar } from './Home'

/** "Who got hit?" Fast athlete picker for a sideline check. */
export function Pick() {
  const data = useData()
  const [q, setQ] = useState('')
  const [quickName, setQuickName] = useState('')
  const list = data.athletes
    .filter((a) => a.name.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name))

  const go = (athleteId: string) => {
    const s = startSession(athleteId, 'check')
    navigate(`/session/${s.id}`, true)
  }

  return (
    <div>
      <TopBar back="/" />
      <StepHeader title="Who are you checking?" />
      {data.athletes.length > 5 && (
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search"
          className="mb-3 h-12 w-full rounded-xl border border-line bg-surface px-4 text-[16px] outline-none focus:border-accent"
        />
      )}
      {list.length > 0 && (
        <Card className="overflow-hidden">
          {list.map((a) => (
            <button key={a.id} onClick={() => go(a.id)} className="flex w-full items-center gap-3 border-b border-line px-4 py-3.5 text-left last:border-0 hover:bg-surface-2">
              <Avatar name={a.name} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{a.name}</div>
                <div className="text-sm text-muted">{a.sport}</div>
              </div>
              {baselineFor(a.id) ? <Pill tone="ok">Has baseline</Pill> : <Pill tone="warn">No baseline</Pill>}
            </button>
          ))}
        </Card>
      )}

      <SectionTitle className="mt-8">Not on the list?</SectionTitle>
      <Card className="p-4">
        <p className="mb-3 text-sm text-muted">Check them anyway. Without a baseline, Baseline relies on danger signs and symptoms.</p>
        <div className="flex gap-2">
          <input
            value={quickName}
            onChange={(e) => setQuickName(e.target.value)}
            placeholder="Athlete name"
            className="h-12 min-w-0 flex-1 rounded-xl border border-line bg-surface px-4 text-[16px] outline-none focus:border-accent"
          />
          <Button
            disabled={quickName.trim().length < 2}
            onClick={() => go(addAthlete({ name: quickName.trim(), sport: 'Other', dominantFoot: 'right' }).id)}
          >
            Start <Icon name="chevron" size={16} />
          </Button>
        </div>
      </Card>
    </div>
  )
}
