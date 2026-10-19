import { useState } from 'react'
import { RTStrip, SwayCloud, swayRange } from '../components/charts'
import { Button, Card, Icon, Pill, SectionTitle, TopBar, formatDate } from '../components/ui'
import { RETURN_TO_LEARN, RETURN_TO_SPORT, STANCES, SYMPTOMS } from '../lib/content'
import { navigate } from '../lib/router'
import {
  balanceSummary, baselineWarnings, buildReport, cognitiveScore, reactionSummary, symptomTotals, vestibularProvocation,
  type Finding, type Report as Rep,
} from '../lib/scoring'
import { differentDevice } from '../lib/device'
import { parentMessage, type Lang } from '../lib/parent'
import { baselineFor, deleteSession, startSession, useData } from '../lib/store'
import type { Athlete, Session } from '../lib/types'
import { NotFound } from './AthleteDetail'
import { Footer } from './Home'

export function Report({ id }: { id: string }) {
  const data = useData()
  const session = data.sessions.find((s) => s.id === id)
  const athlete = session && data.athletes.find((a) => a.id === session.athleteId)
  if (!session || !athlete) return <NotFound />
  return session.kind === 'baseline' ? <BaselineReport s={session} athlete={athlete} /> : <CheckReport s={session} athlete={athlete} />
}

// ---------------------------------------------------------------- check

function CheckReport({ s, athlete }: { s: Session; athlete: Athlete }) {
  const base = baselineFor(athlete.id, s.startedAt)
  const rep = buildReport(s.results, base?.results, { differentDevice: differentDevice(s.device, base?.device) })
  const first = athlete.name.split(' ')[0]

  return (
    <div>
      <TopBar back={`/athlete/${athlete.id}`} title="Sideline report" />
      <VerdictHero rep={rep} athlete={athlete} s={s} />

      {rep.verdict === 'emergency' && <EmergencySteps />}
      {rep.verdict === 'remove' && <RemoveSteps first={first} />}
      {rep.verdict === 'no-change' && <NoChangeSteps first={first} athleteId={athlete.id} context={s.context} />}

      {rep.findings.length > 0 && (
        <>
          <SectionTitle className="mt-8">
            {rep.hasBaseline ? `Compared to baseline from ${formatDate(base!.startedAt)}` : 'Results (no baseline on file)'}
          </SectionTitle>
          <Card className="overflow-hidden">
            {rep.findings.map((f) => (
              <FindingRow key={f.domain} f={f} />
            ))}
          </Card>
          {s.skipped.length > 0 && <p className="mt-2 px-1 text-xs text-muted">Skipped: {s.skipped.join(', ')}.</p>}
        </>
      )}

      <Details s={s} base={base} />

      {rep.verdict !== 'incomplete' && <ParentMessage s={s} athlete={athlete} rep={rep} />}

      {(rep.verdict === 'remove' || rep.verdict === 'emergency') && <ReturnSteps />}

      <Actions s={s} athlete={athlete} rep={rep} />
      <Footer />
    </div>
  )
}

const HERO = {
  emergency: { cls: 'bg-danger text-white', title: 'Call 911 now', sub: 'A danger sign was found.' },
  remove: { cls: 'bg-[color-mix(in_srgb,var(--danger)_88%,black)] text-white', title: 'Remove from play', sub: 'Signs of a possible concussion.' },
  'no-change': { cls: 'bg-surface border border-line', title: 'No changes detected', sub: 'Matches baseline on every test that was done.' },
  incomplete: { cls: 'bg-surface border border-line', title: 'Check incomplete', sub: 'Not enough was recorded to compare.' },
} as const

function VerdictHero({ rep, athlete, s }: { rep: Rep; athlete: Athlete; s: Session }) {
  const h = HERO[rep.verdict]
  const flags = rep.findings.filter((f) => f.status === 'flag').length
  return (
    <div className={`rise rounded-[28px] p-6 print-plain ${h.cls} ${rep.verdict === 'emergency' ? 'pulse-ring' : ''}`}>
      <div className="flex items-center justify-between text-sm font-semibold opacity-80">
        <span>{athlete.name}</span>
        <span>{formatDate(s.startedAt, true)}</span>
      </div>
      <div className="mt-5 text-[34px] font-extrabold leading-none tracking-tight">{h.title}</div>
      <div className="mt-2 text-[15px] opacity-90">
        {h.sub}
        {rep.verdict === 'remove' && ` ${flags} of ${rep.findings.length} areas flagged.`}
      </div>
      {s.context && <div className="mt-3 text-sm opacity-75">“{s.context}”</div>}
      {rep.verdict === 'emergency' && (
        <a href="tel:911" className="mt-5 flex h-14 items-center justify-center gap-2 rounded-2xl bg-white text-lg font-bold text-danger">
          <Icon name="phone" /> Call 911
        </a>
      )}
      {rep.verdict === 'no-change' && (
        <div className="mt-4 rounded-2xl bg-warn-soft p-3 text-sm font-medium text-warn">
          This does <b>not</b> rule out a concussion or clear {athlete.name.split(' ')[0]} to play. Symptoms can appear hours later.
        </div>
      )}
      {!rep.hasBaseline && rep.verdict !== 'emergency' && (
        <div className="mt-4 text-sm opacity-80">No baseline on file, so only signs, symptoms, and orientation were judged.</div>
      )}
    </div>
  )
}

function Steps({ title, items, tone = 'accent' }: { title: string; items: React.ReactNode[]; tone?: 'accent' | 'danger' }) {
  return (
    <Card className="mt-4 p-5">
      <div className={`mb-3 text-sm font-bold uppercase tracking-[0.08em] ${tone === 'danger' ? 'text-danger' : 'text-accent'}`}>{title}</div>
      <ol className="space-y-3">
        {items.map((it, i) => (
          <li key={i} className="flex gap-3 text-[15px] leading-snug">
            <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${tone === 'danger' ? 'bg-danger-soft text-danger' : 'bg-accent-soft text-accent'}`}>{i + 1}</span>
            <span>{it}</span>
          </li>
        ))}
      </ol>
    </Card>
  )
}

export function EmergencySteps() {
  return (
    <Steps
      tone="danger"
      title="While you wait for help"
      items={[
        <><b>Neck pain? Don’t move them.</b> Keep the head and neck still. Only trained medical staff should remove a helmet.</>,
        <><b>Stay with them.</b> Watch their breathing and how alert they are.</>,
        <>If they are unconscious and breathing, and there’s <b>no</b> neck injury, roll them onto their side.</>,
        <>No food, drink, or medication.</>,
        <>Tell paramedics what happened and show them this report.</>,
      ]}
    />
  )
}

function RemoveSteps({ first }: { first: string }) {
  return (
    <Steps
      tone="danger"
      title="What to do now"
      items={[
        <><b>{first} is done for today.</b> No return to practice or the game, even if they feel better.</>,
        <><b>Don’t leave them alone</b> for the next few hours. Call 911 if any danger sign appears.</>,
        <><b>Tell a parent or guardian.</b> Nebraska law requires it when an athlete is removed for a suspected concussion.</>,
        <><b>See a licensed health-care provider.</b> Nebraska requires written, signed clearance plus parent permission before returning.</>,
        <>No driving today. Rest, but light activity that doesn’t worsen symptoms is OK after 24–48 hours.</>,
      ]}
    />
  )
}

function NoChangeSteps({ first, athleteId, context }: { first: string; athleteId: string; context?: string }) {
  return (
    <>
      <Steps
        title="What to do now"
        items={[
          <>If you saw anything that worried you, <b>keep {first} out anyway</b>. When in doubt, sit them out.</>,
          <>Re-check symptoms in 15 minutes and after the game. Concussion symptoms can show up late.</>,
          <>Tell {first}: report any headache, dizziness, or fogginess right away, today or tomorrow.</>,
        ]}
      />
      <Button
        variant="secondary"
        className="no-print mt-3 w-full"
        onClick={() => navigate(`/session/${startSession(athleteId, 'check', { quick: true, context: context ? `Re-check after: ${context}` : 'Re-check' }).id}`)}
      >
        <Icon name="refresh" size={18} /> Re-check symptoms (1 min)
      </Button>
    </>
  )
}

function ParentMessage({ s, athlete, rep }: { s: Session; athlete: Athlete; rep: Rep }) {
  const [lang, setLang] = useState<Lang>(() => {
    try {
      return (localStorage.getItem('baseline.parentLang') as Lang) || 'en'
    } catch {
      return 'en'
    }
  })
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const text = parentMessage(lang, {
    athlete: athlete.name.split(' ')[0],
    when: s.startedAt,
    context: s.context,
    verdict: rep.verdict,
    flaggedDomains: rep.findings.filter((f) => f.status === 'flag').map((f) => f.domain),
  })
  const pick = (l: Lang) => {
    setLang(l)
    try {
      localStorage.setItem('baseline.parentLang', l)
    } catch {
      /* ignore */
    }
  }
  const send = async () => {
    try {
      if (navigator.share) await navigator.share({ text })
      else {
        await navigator.clipboard.writeText(text)
        setCopied(true)
      }
    } catch {
      /* cancelled */
    }
  }
  return (
    <div className="no-print">
      <SectionTitle className="mt-8">Tell a parent</SectionTitle>
      <Card className="p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted">
            {rep.verdict === 'no-change'
              ? 'A ready-to-send note with what to watch for tonight.'
              : 'Nebraska law requires notifying a parent. A ready-to-send note with next steps and warning signs.'}
          </p>
          <div role="radiogroup" aria-label="Language" className="flex shrink-0 rounded-full bg-surface-2 p-1 text-sm font-semibold">
            {(['en', 'es'] as const).map((l) => (
              <button
                key={l}
                role="radio"
                aria-checked={lang === l}
                onClick={() => pick(l)}
                className={`h-8 rounded-full px-3 ${lang === l ? 'bg-surface text-ink shadow-sm' : 'text-muted'}`}
              >
                {l === 'en' ? 'English' : 'Español'}
              </button>
            ))}
          </div>
        </div>
        {open && (
          <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-xl bg-surface-2 p-3 font-sans text-[13px] leading-relaxed">{text}</pre>
        )}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button variant="secondary" size="sm" onClick={() => setOpen(!open)}>{open ? 'Hide' : 'Preview'}</Button>
          <Button size="sm" onClick={send}><Icon name="upload" size={16} /> {copied ? 'Copied' : 'Send'}</Button>
        </div>
      </Card>
    </div>
  )
}

function FindingRow({ f }: { f: Finding }) {
  const icon =
    f.status === 'flag' ? (
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-danger-soft text-danger"><Icon name="alert" size={16} /></span>
    ) : f.status === 'ok' ? (
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ok-soft text-ok"><Icon name="check" size={16} /></span>
    ) : (
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-2 text-faint">–</span>
    )
  return (
    <div className="flex gap-3 border-b border-line px-4 py-3.5 last:border-0">
      {icon}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-semibold">{f.title}</span>
          {f.status === 'flag' && <Pill tone="danger">Flag</Pill>}
        </div>
        <div className="mt-0.5 text-sm text-muted">{f.summary}</div>
        {f.note && <div className="mt-1 text-xs font-medium text-warn">{f.note}</div>}
        {(f.baseline || f.current) && (
          <div className="mt-1.5 flex flex-wrap gap-x-4 text-xs text-faint tabular">
            {f.baseline && <span>Baseline: <b className="text-muted">{f.baseline}</b></span>}
            {f.current && <span>Now: <b className="text-ink">{f.current}</b></span>}
          </div>
        )}
      </div>
    </div>
  )
}

function Details({ s, base }: { s: Session; base?: Session }) {
  const bal = s.results.balance
  const bbal = base?.results.balance
  const rt = s.results.reaction
  const brt = base?.results.reaction
  const sym = s.results.symptoms
  const bsym = base?.results.symptoms
  const changed = sym ? SYMPTOMS.filter((x) => (sym[x.id] ?? 0) > 0) : []

  return (
    <>
      {changed.length > 0 && (
        <>
          <SectionTitle className="mt-8">Symptoms reported</SectionTitle>
          <Card className="p-4">
            <div className="space-y-2">
              {changed
                .sort((a, b) => (sym![b.id] ?? 0) - (sym![a.id] ?? 0))
                .map((x) => {
                  const v = sym![x.id] ?? 0
                  const b = bsym?.[x.id] ?? 0
                  return (
                    <div key={x.id} className="flex items-center gap-3">
                      <span className="w-40 shrink-0 truncate text-sm">{x.label}</span>
                      <div className="relative h-2.5 flex-1 rounded-full bg-surface-2">
                        {bsym && <div className="absolute inset-y-0 left-0 rounded-full bg-faint/40" style={{ width: `${(b / 6) * 100}%` }} />}
                        <div className="absolute inset-y-0 left-0 rounded-full bg-danger" style={{ width: `${(v / 6) * 100}%`, opacity: v > b ? 1 : 0.35 }} />
                      </div>
                      <span className="w-8 text-right text-sm font-semibold tabular">{v}/6</span>
                    </div>
                  )
                })}
            </div>
            {bsym && <div className="mt-3 text-xs text-faint">Grey = baseline level. Red = now.</div>}
          </Card>
        </>
      )}

      {bal?.supported && bal.stances.length > 0 && (
        <>
          <SectionTitle className="mt-8">Balance: sway clouds</SectionTitle>
          <Card className="p-4">
            <p className="mb-4 text-sm text-muted">Each dot is one moment of chest movement measured by the phone. A bigger cloud means more sway.</p>
            <div className="space-y-4">
              {STANCES.map((st) => {
                const cur = bal.stances.find((x) => x.id === st.id)
                const b = bbal?.stances.find((x) => x.id === st.id)
                if (!cur) return null
                const range = swayRange(cur.trace, b?.trace ?? [])
                return (
                  <div key={st.id}>
                    <div className="mb-2 text-sm font-semibold">{st.title}</div>
                    <div className="flex items-center gap-4">
                      {b && (
                        <div className="text-center">
                          <SwayCloud trace={b.trace} range={range} color="var(--faint)" size={112} label={`${st.title} baseline`} />
                          <div className="mt-1 text-xs text-muted tabular">Baseline {b.swayMg} mg</div>
                        </div>
                      )}
                      <div className="text-center">
                        <SwayCloud trace={cur.trace} range={range} color={b && cur.swayMg / b.swayMg >= 1.5 ? 'var(--danger)' : 'var(--accent)'} size={112} label={`${st.title} now`} />
                        <div className="mt-1 text-xs text-muted tabular">{s.kind === 'baseline' ? 'Sway' : 'Now'} {cur.swayMg} mg · {cur.errors} err</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </>
      )}

      {rt && rt.goRTs.length > 2 && (
        <>
          <SectionTitle className="mt-8">Reaction times</SectionTitle>
          <Card className="p-4">
            <div className="mb-1 flex gap-4 text-xs font-semibold">
              {brt && <span className="text-faint">● Baseline</span>}
              <span className="text-accent">● Now</span>
              <span className="text-muted">| = median (ms)</span>
            </div>
            <RTStrip
              rows={[
                ...(brt ? [{ label: 'Baseline', rts: brt.goRTs, color: 'var(--faint)' }] : []),
                { label: 'Now', rts: rt.goRTs, color: 'var(--accent)' },
              ]}
            />
            <div className="mt-2 text-xs text-muted">
              Tapped red {rt.commissions}× · missed green {rt.misses}× · false starts {rt.falseStarts}
            </div>
          </Card>
        </>
      )}
    </>
  )
}

function ReturnSteps() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <SectionTitle className="mt-8">Getting back</SectionTitle>
      <Card className="overflow-hidden">
        <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between px-4 py-4 text-left">
          <span className="font-semibold">Return-to-learn and return-to-sport steps</span>
          <Icon name="chevron" className={`text-faint transition ${open ? 'rotate-90' : ''}`} />
        </button>
        {open && (
          <div className="border-t border-line px-4 pb-4 pt-3 text-sm">
            <p className="mb-3 text-muted">Each step takes at least 24 hours. Go back a step if symptoms get worse. School comes before sport.</p>
            <div className="mb-2 font-bold">School</div>
            <ol className="mb-4 space-y-1.5">
              {RETURN_TO_LEARN.map((r, i) => (
                <li key={r.title}><b>{i + 1}. {r.title}.</b> <span className="text-muted">{r.detail}</span></li>
              ))}
            </ol>
            <div className="mb-2 font-bold">Sport</div>
            <ol className="space-y-1.5">
              {RETURN_TO_SPORT.map((r, i) => (
                <li key={r.title}><b>{i + 1}. {r.title}.</b> <span className="text-muted">{r.detail}</span></li>
              ))}
            </ol>
            <p className="mt-3 text-xs text-faint">Based on the 2022 Amsterdam international consensus on concussion in sport.</p>
          </div>
        )}
      </Card>
    </>
  )
}

function summaryText(s: Session, athlete: Athlete, rep?: Rep): string {
  const lines = [`Baseline concussion screen: ${athlete.name}`, formatDate(s.startedAt, true)]
  if (s.context) lines.push(`What happened: ${s.context}`)
  if (rep) {
    lines.push('', `Result: ${HERO[rep.verdict].title.toUpperCase()}`)
    for (const f of rep.findings) lines.push(`${f.status === 'flag' ? '⚠' : f.status === 'ok' ? '✓' : '–'} ${f.title}: ${f.summary}`)
    lines.push('', 'This is a screening tool, not a diagnosis. A licensed health-care provider must clear the athlete before they return.')
  }
  return lines.join('\n')
}

function Actions({ s, athlete, rep }: { s: Session; athlete: Athlete; rep?: Rep }) {
  const [copied, setCopied] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const share = async () => {
    const text = summaryText(s, athlete, rep)
    try {
      if (navigator.share) await navigator.share({ title: `Concussion screen: ${athlete.name}`, text })
      else {
        await navigator.clipboard.writeText(text)
        setCopied(true)
      }
    } catch {
      /* cancelled */
    }
  }
  return (
    <div className="no-print mt-8 grid gap-3">
      <div className="grid grid-cols-2 gap-3">
        <Button variant="secondary" onClick={share}>
          <Icon name="upload" size={18} /> {copied ? 'Copied' : 'Share'}
        </Button>
        <Button variant="secondary" onClick={() => window.print()}>
          <Icon name="print" size={18} /> Print / PDF
        </Button>
      </div>
      {confirm ? (
        <div className="flex justify-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => setConfirm(false)}>Cancel</Button>
          <Button size="sm" variant="danger" onClick={() => { deleteSession(s.id); navigate(`/athlete/${athlete.id}`, true) }}>Delete this session</Button>
        </div>
      ) : (
        <Button variant="ghost" size="sm" onClick={() => setConfirm(true)}>
          <Icon name="trash" size={16} /> Delete
        </Button>
      )}
    </div>
  )
}

// ---------------------------------------------------------------- baseline

function BaselineReport({ s, athlete }: { s: Session; athlete: Athlete }) {
  const r = s.results
  const sym = symptomTotals(r.symptoms)
  const cog = cognitiveScore(r)
  const rt = reactionSummary(r.reaction)
  const bal = balanceSummary(r.balance)
  const vp = vestibularProvocation(r.vestibular)
  const warnings = baselineWarnings(r)
  const tiles = [
    { label: 'Symptoms', value: Number.isFinite(sym.count) ? `${sym.count}` : '–', sub: Number.isFinite(sym.severity) ? `severity ${sym.severity}` : 'skipped' },
    { label: 'Memory & thinking', value: cog ? `${cog.total}` : '–', sub: cog ? `of ${cog.max} points` : 'skipped' },
    { label: 'Reaction time', value: rt ? `${rt.median}` : '–', sub: rt ? 'ms median' : 'skipped' },
    { label: 'Balance sway', value: bal ? `${bal.composite}` : '–', sub: bal ? `mg · ${bal.errors} errors` : 'skipped' },
    { label: 'Eyes & motion', value: vp ? `+${vp.max}` : '–', sub: vp ? 'max symptom change' : 'skipped' },
    { label: 'Word list', value: r.memory ? `#${r.memory.list + 1}` : '–', sub: r.memory ? `delayed ${r.delayed?.recalled ?? '–'}/10` : 'skipped' },
  ]
  const isCurrent = baselineFor(athlete.id)?.id === s.id
  return (
    <div>
      <TopBar back={`/athlete/${athlete.id}`} title="Baseline" />
      <div className="rise rounded-[28px] bg-ok-soft p-6 text-ok">
        <div className="flex items-center justify-between text-sm font-semibold">
          <span>{athlete.name}</span>
          <span>{formatDate(s.startedAt, true)}</span>
        </div>
        <div className="mt-5 text-[30px] font-extrabold leading-none tracking-tight">Baseline saved</div>
        <div className="mt-2 text-[15px]">
          {isCurrent ? 'Future sideline checks will be compared against this.' : 'An older baseline. Checks use the most recent one.'}
        </div>
      </div>

      {warnings.length > 0 && (
        <Card className="mt-4 border-warn bg-warn-soft p-4 text-sm text-warn">
          <b>Check this baseline:</b>
          <ul className="mt-1 list-disc pl-5">{warnings.map((w) => <li key={w}>{w}</li>)}</ul>
        </Card>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3">
        {tiles.map((t) => (
          <Card key={t.label} className="p-4">
            <div className="text-xs font-semibold text-muted">{t.label}</div>
            <div className="mt-1 text-[28px] font-bold leading-tight tabular">{t.value}</div>
            <div className="text-xs text-faint">{t.sub}</div>
          </Card>
        ))}
      </div>

      <Details s={s} />
      <Actions s={s} athlete={athlete} />
      <Footer />
    </div>
  )
}
