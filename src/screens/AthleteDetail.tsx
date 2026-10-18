import { useState } from 'react'
import { Sparkline } from '../components/charts'
import { Button, Card, Icon, Pill, SectionTitle, TopBar, formatDate } from '../components/ui'
import { navigate } from '../lib/router'
import { balanceSummary, baselineWarnings, buildReport, cognitiveScore, reactionSummary } from '../lib/scoring'
import { baselineFor, deleteAthlete, deleteSession, startSession, useData } from '../lib/store'
import type { Athlete, Session } from '../lib/types'
import { Avatar, Footer } from './Home'

export function AthleteDetail({ id }: { id: string }) {
  const data = useData()
  const athlete = data.athletes.find((a) => a.id === id)
  const [confirmDelete, setConfirmDelete] = useState(false)
  if (!athlete) return <NotFound />

  const sessions = data.sessions.filter((s) => s.athleteId === id).sort((a, b) => b.startedAt - a.startedAt)
  const base = sessions.find((s) => s.kind === 'baseline' && s.completedAt)
  const unfinished = sessions.find((s) => !s.completedAt)
  const done = sessions.filter((s) => s.completedAt)
  const chrono = [...done].reverse()
  const warnings = base ? baselineWarnings(base.results) : []
  const baseAgeDays = base ? (Date.now() - base.startedAt) / 86400000 : 0

  const start = (kind: Session['kind']) => {
    const s = startSession(id, kind)
    navigate(`/session/${s.id}`)
  }

  return (
    <div>
      <TopBar back="/" right={<button onClick={() => navigate(`/athlete/${id}/edit`)} className="h-10 rounded-full px-3 text-sm font-semibold text-accent">Edit</button>} />
      <div className="rise flex items-center gap-4">
        <Avatar name={athlete.name} size={60} />
        <div className="min-w-0">
          <h1 className="truncate text-[26px] font-bold tracking-tight">{athlete.name}</h1>
          <div className="text-[15px] text-muted">
            {athlete.sport}
            {athlete.gradYear ? ` · Class of ${athlete.gradYear}` : ''}
            {athlete.demo && ' · Demo'}
          </div>
        </div>
      </div>

      {unfinished && (
        <Card className="mt-5 flex items-center gap-3 border-accent p-4">
          <Icon name="clock" className="text-accent" />
          <div className="flex-1 text-sm">
            <b>Unfinished {unfinished.kind === 'check' ? 'sideline check' : 'baseline'}</b>
            <div className="text-muted">Started {formatDate(unfinished.startedAt, true)}</div>
          </div>
          <Button size="sm" onClick={() => navigate(`/session/${unfinished.id}`)}>Resume</Button>
        </Card>
      )}

      <div className="mt-5 grid gap-3">
        <Button size="lg" onClick={() => start('check')}>
          <Icon name="activity" /> Sideline check
        </Button>
        <Button size="lg" variant="secondary" onClick={() => start('baseline')}>
          {base ? 'Retake baseline' : 'Record baseline'}
        </Button>
      </div>

      <SectionTitle className="mt-8">Baseline</SectionTitle>
      {base ? (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">Recorded {formatDate(base.startedAt)}</div>
              <div className="text-sm text-muted">
                {baseAgeDays > 365 ? 'Over a year old. Retake it this season.' : 'Checks are compared against this.'}
              </div>
            </div>
            <Button size="sm" variant="secondary" onClick={() => navigate(`/report/${base.id}`)}>View</Button>
          </div>
          {warnings.length > 0 && (
            <div className="mt-3 rounded-2xl bg-warn-soft p-3 text-sm text-warn">
              <b>Baseline may not be accurate:</b>
              <ul className="mt-1 list-disc pl-5">
                {warnings.map((w) => <li key={w}>{w}</li>)}
              </ul>
            </div>
          )}
        </Card>
      ) : (
        <Card className="p-4 text-[15px] text-muted">
          <b className="text-ink">No baseline yet.</b> Record one before the season while {athlete.name.split(' ')[0]} is healthy.
          Without it, a sideline check can only use symptoms and obvious signs.
        </Card>
      )}

      {chrono.length >= 2 && <Trends sessions={chrono} />}

      <SectionTitle className="mt-8">History</SectionTitle>
      {done.length ? (
        <Card className="overflow-hidden">
          {done.map((s) => (
            <HistoryRow key={s.id} s={s} athlete={athlete} />
          ))}
        </Card>
      ) : (
        <p className="px-1 text-sm text-muted">No sessions yet.</p>
      )}

      <div className="mt-10 text-center">
        {confirmDelete ? (
          <div className="flex justify-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            <Button variant="danger" size="sm" onClick={() => { deleteAthlete(id); navigate('/', true) }}>
              Delete {athlete.name.split(' ')[0]} and all their data
            </Button>
          </div>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(true)}>
            <Icon name="trash" size={16} /> Delete athlete
          </Button>
        )}
        {unfinished && (
          <div className="mt-2">
            <Button variant="ghost" size="sm" onClick={() => deleteSession(unfinished.id)}>Discard unfinished session</Button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}

function Trends({ sessions }: { sessions: Session[] }) {
  const rt = sessions.map((s) => reactionSummary(s.results.reaction)?.median ?? NaN)
  const sway = sessions.map((s) => balanceSummary(s.results.balance)?.composite ?? NaN)
  const cog = sessions.map((s) => cognitiveScore(s.results)?.total ?? NaN)
  const items = [
    { label: 'Reaction', unit: 'ms', v: rt },
    { label: 'Sway', unit: 'mg', v: sway },
    { label: 'Memory & thinking', unit: 'pts', v: cog },
  ].filter((x) => x.v.filter(Number.isFinite).length >= 2)
  if (!items.length) return null
  return (
    <>
      <SectionTitle className="mt-8">Trends</SectionTitle>
      <Card className="grid divide-y divide-line">
        {items.map((it) => {
          const last = it.v.filter(Number.isFinite).at(-1)!
          return (
            <div key={it.label} className="flex items-center justify-between px-4 py-3">
              <div>
                <div className="text-sm text-muted">{it.label}</div>
                <div className="font-semibold tabular">
                  {Math.round(last)} <span className="text-sm text-muted">{it.unit}</span>
                </div>
              </div>
              <Sparkline values={it.v} />
            </div>
          )
        })}
      </Card>
    </>
  )
}

function HistoryRow({ s, athlete }: { s: Session; athlete: Athlete }) {
  let pill = <Pill tone="neutral">Baseline</Pill>
  if (s.kind === 'check') {
    const rep = buildReport(s.results, baselineFor(athlete.id, s.startedAt)?.results)
    pill =
      rep.verdict === 'emergency' ? (
        <Pill tone="danger">Emergency</Pill>
      ) : rep.verdict === 'remove' ? (
        <Pill tone="danger">Remove from play</Pill>
      ) : (
        <Pill tone="accent">No change</Pill>
      )
  }
  return (
    <button onClick={() => navigate(`/report/${s.id}`)} className="flex w-full items-center gap-3 border-b border-line px-4 py-3.5 text-left last:border-0 hover:bg-surface-2">
      <div className="min-w-0 flex-1">
        <div className="font-semibold">{s.kind === 'check' ? 'Sideline check' : 'Baseline'}</div>
        <div className="truncate text-sm text-muted">
          {formatDate(s.startedAt, true)}
          {s.context ? ` · ${s.context}` : ''}
        </div>
      </div>
      {pill}
      <Icon name="chevron" size={18} className="text-faint" />
    </button>
  )
}

export function NotFound() {
  return (
    <div>
      <TopBar back="/" />
      <p className="mt-10 text-center text-muted">Not found. It may have been deleted.</p>
    </div>
  )
}
