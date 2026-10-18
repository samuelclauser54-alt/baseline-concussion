import { useMemo, useState } from 'react'
import { Button, Card, Icon, Logo, Pill, SectionTitle, TopBar, formatDate } from '../components/ui'
import { loadDemo } from '../lib/demo'
import { navigate } from '../lib/router'
import { buildReport } from '../lib/scoring'
import { baselineFor, useData } from '../lib/store'
import type { Athlete, Session } from '../lib/types'

export function Home() {
  const data = useData()
  const [q, setQ] = useState('')

  const rows = useMemo(() => {
    return data.athletes
      .filter((a) => a.name.toLowerCase().includes(q.toLowerCase()) || a.sport.toLowerCase().includes(q.toLowerCase()))
      .map((a) => {
        const sessions = data.sessions.filter((s) => s.athleteId === a.id).sort((x, y) => y.startedAt - x.startedAt)
        const base = sessions.find((s) => s.kind === 'baseline' && s.completedAt)
        const lastCheck = sessions.find((s) => s.kind === 'check' && s.completedAt)
        return { a, base, lastCheck }
      })
      .sort((x, y) => x.a.name.localeCompare(y.a.name))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, q])

  if (!data.athletes.length) return <Welcome />

  const withBase = rows.filter((r) => r.base).length

  return (
    <div>
      <TopBar right={<LearnLink />} />
      <div className="rise">
        <h1 className="text-[28px] font-bold tracking-tight">Your team</h1>
        <p className="mt-1 text-[15px] text-muted">
          {data.athletes.length} athlete{data.athletes.length > 1 ? 's' : ''} · {withBase} with a baseline
        </p>
      </div>

      <button
        onClick={() => navigate('/pick')}
        className="mt-5 flex w-full items-center gap-4 rounded-3xl bg-accent p-5 text-left text-on-accent shadow-lg shadow-accent/25 transition hover:brightness-110 active:scale-[0.99]"
      >
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15">
          <Icon name="activity" size={26} />
        </div>
        <div className="flex-1">
          <div className="text-lg font-bold">Sideline check</div>
          <div className="text-sm opacity-85">Someone took a hit? Start here. About 8 minutes.</div>
        </div>
        <Icon name="chevron" />
      </button>

      <div className="mb-2 mt-7 flex items-center justify-between gap-3">
        <SectionTitle className="mb-0">Athletes</SectionTitle>
        <Button size="sm" variant="secondary" onClick={() => navigate('/athlete/new')}>
          <Icon name="plus" size={16} /> Add
        </Button>
      </div>
      {data.athletes.length > 6 && (
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name or sport"
          className="mb-3 h-11 w-full rounded-xl border border-line bg-surface px-4 text-[15px] outline-none focus:border-accent"
        />
      )}
      <Card className="overflow-hidden">
        {rows.map(({ a, base, lastCheck }) => (
          <AthleteRow key={a.id} a={a} base={base} lastCheck={lastCheck} />
        ))}
      </Card>

      <div className="mt-8 grid grid-cols-2 gap-3">
        <Button variant="secondary" onClick={() => navigate('/learn')}>
          <Icon name="book" size={18} /> How it works
        </Button>
        <Button variant="secondary" onClick={() => navigate('/data')}>
          <Icon name="database" size={18} /> Data
        </Button>
      </div>
      <Footer />
    </div>
  )
}

function AthleteRow({ a, base, lastCheck }: { a: Athlete; base?: Session; lastCheck?: Session }) {
  let status = <Pill tone="warn">Needs baseline</Pill>
  if (lastCheck && Date.now() - lastCheck.startedAt < 14 * 86400000) {
    const rep = buildReport(lastCheck.results, baselineFor(a.id, lastCheck.startedAt)?.results)
    status =
      rep.verdict === 'emergency' || rep.verdict === 'remove' ? (
        <Pill tone="danger">Out: {formatDate(lastCheck.startedAt)}</Pill>
      ) : (
        <Pill tone="accent">Checked {formatDate(lastCheck.startedAt)}</Pill>
      )
  } else if (base) status = <Pill tone="ok">Baseline {formatDate(base.startedAt)}</Pill>
  return (
    <button onClick={() => navigate(`/athlete/${a.id}`)} className="flex w-full items-center gap-3 border-b border-line px-4 py-3.5 text-left last:border-0 hover:bg-surface-2">
      <Avatar name={a.name} />
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold">{a.name}</div>
        <div className="truncate text-sm text-muted">{a.sport}{a.gradYear ? ` · ’${String(a.gradYear).slice(2)}` : ''}</div>
      </div>
      {status}
    </button>
  )
}

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const initials = name.split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase()
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360
  return (
    <div
      className="grid shrink-0 place-items-center rounded-full font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.36, background: `hsl(${h} 55% 48%)` }}
    >
      {initials}
    </div>
  )
}

function LearnLink() {
  return (
    <button onClick={() => navigate('/learn')} className="grid h-10 w-10 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink" aria-label="How it works">
      <Icon name="book" />
    </button>
  )
}

function Welcome() {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <TopBar right={<LearnLink />} />
      <div className="rise flex flex-1 flex-col justify-center pb-10">
        <div className="mb-6">
          <Logo size={56} />
        </div>
        <h1 className="text-[34px] font-extrabold leading-[1.1] tracking-tight">
          Catch concussions on the sideline, with just a phone.
        </h1>
        <p className="mt-4 text-[17px] leading-relaxed text-muted">
          Most U.S. high schools don’t have a full-time athletic trainer. Baseline gives coaches a free, 8-minute check
          built from the same tests trainers use: symptoms, memory, reaction time, and phone-measured balance. It compares
          each athlete to <b className="text-ink">their own</b> healthy baseline.
        </p>
        <div className="mt-8 grid gap-3">
          <Button size="lg" onClick={() => navigate('/athlete/new')}>
            <Icon name="plus" /> Add your first athlete
          </Button>
          <Button size="lg" variant="secondary" onClick={() => { loadDemo(); navigate('/') }}>
            Explore with a demo team
          </Button>
        </div>
        <div className="mt-8 grid grid-cols-3 gap-3 text-center">
          {[
            ['Free', 'no accounts'],
            ['Offline', 'works without signal'],
            ['Private', 'data stays on phone'],
          ].map(([a, b]) => (
            <div key={a} className="rounded-2xl bg-surface-2 px-2 py-3">
              <div className="text-[15px] font-bold">{a}</div>
              <div className="text-xs text-muted">{b}</div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  )
}

export function Footer() {
  return (
    <p className="mt-8 pb-6 text-center text-xs leading-relaxed text-faint">
      Baseline is a screening aid, not a diagnosis. It never clears an athlete to play.
      <br />
      When in doubt, sit them out.
    </p>
  )
}
