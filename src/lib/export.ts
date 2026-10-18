// CSV export for the reliability study. One row per completed session.
// Athletes are exported as anonymous codes (A01, A02, ...) unless names are requested.
// For every baseline after an athlete's first, `retest_flags` lists which
// domains the decision rules would have flagged against the previous baseline.
// Those athletes are healthy, so any flag there is a false positive.

import { buildReport, balanceSummary, cognitiveScore, reactionSummary, symptomTotals, vestibularProvocation } from './scoring'
import type { Data, Session } from './types'

export function sessionsCSV(d: Data, includeNames = false): string {
  const code = new Map(d.athletes.map((a, i) => [a.id, includeNames ? a.name : `A${String(i + 1).padStart(2, '0')}`]))
  const done = d.sessions.filter((s) => s.completedAt).sort((a, b) => a.startedAt - b.startedAt)
  const rows: (string | number)[][] = []
  const header = [
    'athlete', 'session_id', 'kind', 'started_at', 'symptom_count', 'symptom_severity',
    'orientation', 'immediate_memory', 'concentration', 'delayed_recall', 'cognitive_total',
    'rt_median_ms', 'rt_trials', 'commissions', 'misses', 'false_starts',
    'sway_together_mg', 'sway_tandem_mg', 'sway_single_mg', 'sway_composite_mg', 'balance_errors',
    'vestibular_max_provocation', 'compared_to', 'verdict', 'flags', 'retest_flags', 'rt_trials_ms',
  ]
  const prevBaseline = new Map<string, Session>()
  for (const s of done) {
    const r = s.results
    const sym = symptomTotals(r.symptoms)
    const cog = cognitiveScore(r)
    const rt = reactionSummary(r.reaction)
    const bal = balanceSummary(r.balance)
    const vp = vestibularProvocation(r.vestibular)
    const prev = prevBaseline.get(s.athleteId)
    let compared = ''
    let verdict = ''
    let flags = ''
    let retest = ''
    if (prev) {
      const rep = buildReport(r, prev.results)
      const f = rep.findings.filter((x) => x.status === 'flag').map((x) => x.domain).join('|')
      compared = prev.id
      if (s.kind === 'check') {
        verdict = rep.verdict
        flags = f
      } else retest = f || 'none'
    }
    rows.push([
      code.get(s.athleteId) ?? s.athleteId, s.id, s.kind, new Date(s.startedAt).toISOString(),
      num(sym.count), num(sym.severity),
      num(cog?.orientation), num(cog?.immediate), num(cog?.concentration), num(cog?.delayed), num(cog?.total),
      num(rt?.median), num(rt?.n), num(r.reaction?.commissions), num(r.reaction?.misses), num(r.reaction?.falseStarts),
      num(bal?.byStance.together), num(bal?.byStance.tandem), num(bal?.byStance.single), num(bal?.composite), num(bal?.errors),
      num(vp?.max), compared, verdict, flags, retest, (r.reaction?.goRTs ?? []).map(Math.round).join(';'),
    ])
    if (s.kind === 'baseline') prevBaseline.set(s.athleteId, s)
  }
  return [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n')
}

function num(x: number | undefined): string | number {
  return x === undefined || !Number.isFinite(x) ? '' : x
}

function csvCell(v: string | number): string {
  const s = String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function download(filename: string, text: string, type = 'text/plain') {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
