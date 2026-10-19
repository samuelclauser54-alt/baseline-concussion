// Compares a sideline check against the athlete's own baseline and decides
// what to tell the coach. The app NEVER clears an athlete to play: the best
// outcome is "no changes detected", and a suspected concussion always means
// sit out until a licensed health-care provider says otherwise.

import { SYMPTOMS, STANCES, VESTIBULAR_ITEMS, VESTIBULAR_SYMPTOMS } from './content'
import { THRESHOLDS as T } from './thresholds'
import { geometricMean, mannWhitneyGreater, median } from './stats'
import type { SessionResults, VestibularRating, VestibularResult } from './types'

export type Verdict = 'emergency' | 'remove' | 'no-change' | 'incomplete'
export type Status = 'flag' | 'ok' | 'na'

export interface Finding {
  domain: 'signs' | 'symptoms' | 'cognitive' | 'reaction' | 'balance' | 'vestibular'
  title: string
  status: Status
  /** One-line, plain-English result. */
  summary: string
  baseline?: string
  current?: string
  /** Caveat shown under the result, e.g. a device change since baseline. */
  note?: string
}

export interface Report {
  verdict: Verdict
  findings: Finding[]
  hasBaseline: boolean
}

// ---------- domain scores ----------

export function symptomTotals(s?: Record<string, number>) {
  if (!s) return { count: NaN, severity: NaN }
  const vals = SYMPTOMS.map((x) => s[x.id] ?? 0)
  return { count: vals.filter((v) => v > 0).length, severity: vals.reduce((a, b) => a + b, 0) }
}

export interface CognitiveScore {
  orientation: number
  immediate: number
  concentration: number
  delayed: number
  total: number
  max: number
}

/** SAC-style cognitive score. Missing parts are left out of both total and max. */
export function cognitiveScore(r: SessionResults): CognitiveScore | undefined {
  const parts = {
    orientation: r.orientation ? Object.values(r.orientation.answers).filter(Boolean).length : undefined,
    immediate: r.memory ? r.memory.trials.reduce((a, b) => a + b, 0) : undefined,
    concentration: r.concentration ? r.concentration.digits + (r.concentration.monthsCorrect ? 1 : 0) : undefined,
    delayed: r.delayed?.recalled,
  }
  const maxes = { orientation: 5, immediate: 30, concentration: 5, delayed: 10 }
  if (Object.values(parts).every((v) => v === undefined)) return undefined
  let total = 0
  let max = 0
  for (const k of Object.keys(parts) as (keyof typeof parts)[]) {
    if (parts[k] !== undefined) {
      total += parts[k]!
      max += maxes[k]
    }
  }
  return {
    orientation: parts.orientation ?? NaN,
    immediate: parts.immediate ?? NaN,
    concentration: parts.concentration ?? NaN,
    delayed: parts.delayed ?? NaN,
    total,
    max,
  }
}

export function reactionSummary(r?: SessionResults['reaction']) {
  if (!r || r.goRTs.length < 3) return undefined
  return { median: Math.round(median(r.goRTs)), commissions: r.commissions, misses: r.misses, n: r.goRTs.length }
}

export function balanceSummary(r?: SessionResults['balance']) {
  if (!r || !r.supported || !r.stances.length) return undefined
  const valid = r.stances.filter((s) => Number.isFinite(s.swayMg) && s.swayMg > 0)
  if (!valid.length) return undefined
  return {
    composite: Math.round(geometricMean(valid.map((s) => s.swayMg)) * 10) / 10,
    errors: r.stances.reduce((a, s) => a + s.errors, 0),
    byStance: Object.fromEntries(valid.map((s) => [s.id, s.swayMg])) as Record<string, number>,
  }
}

/** Largest symptom increase over the pre-test rating, across all eye/motion items. */
export function vestibularProvocation(v?: VestibularResult) {
  if (!v) return undefined
  let max = 0
  let worst = ''
  for (const [item, rating] of Object.entries(v.items)) {
    for (const s of VESTIBULAR_SYMPTOMS) {
      const k = s.id as keyof VestibularRating
      const d = rating[k] - v.pre[k]
      if (d > max) {
        max = d
        worst = `${s.label.toLowerCase()} during ${(VESTIBULAR_ITEMS.find((i) => i.id === item)?.title ?? item).toLowerCase()}`
      }
    }
  }
  return { max, worst }
}

// ---------- comparison ----------

export interface ReportOptions {
  /** Baseline and check were recorded on different devices. */
  differentDevice?: boolean
}

const DEVICE_NOTE =
  'Baseline was recorded on a different device. Touchscreens and motion sensors vary between phones, so read this result with caution.'

export function buildReport(current: SessionResults, baseline?: SessionResults, opts: ReportOptions = {}): Report {
  const findings: Finding[] = []
  const hasBaseline = !!baseline

  // Danger signs & observable signs
  const rf = current.redflags
  if (rf) {
    const n = rf.redFlags.length + rf.observedSigns.length
    findings.push({
      domain: 'signs',
      title: 'Danger & observable signs',
      status: n ? 'flag' : 'ok',
      summary: rf.redFlags.length
        ? `${rf.redFlags.length} danger sign${rf.redFlags.length > 1 ? 's' : ''}: emergency care needed`
        : rf.observedSigns.length
          ? `${rf.observedSigns.length} observable sign${rf.observedSigns.length > 1 ? 's' : ''} of concussion`
          : 'None seen',
    })
  }

  // Symptoms
  if (current.symptoms) {
    const cur = symptomTotals(current.symptoms)
    let flagged: string[]
    if (baseline?.symptoms) {
      flagged = SYMPTOMS.filter(
        (s) => (current.symptoms![s.id] ?? 0) - (baseline.symptoms![s.id] ?? 0) >= T.symptomIncrease,
      ).map((s) => s.label)
    } else {
      flagged = SYMPTOMS.filter((s) => (current.symptoms![s.id] ?? 0) > 0).map((s) => s.label)
    }
    const base = baseline?.symptoms ? symptomTotals(baseline.symptoms) : undefined
    findings.push({
      domain: 'symptoms',
      title: 'Symptoms',
      status: flagged.length ? 'flag' : 'ok',
      summary: flagged.length
        ? `${baseline?.symptoms ? 'Worse than baseline' : 'Reported'}: ${listify(flagged)}`
        : baseline?.symptoms
          ? 'No symptom is worse than baseline'
          : 'No symptoms reported',
      baseline: base ? `${base.count} symptoms · severity ${base.severity}` : undefined,
      current: `${cur.count} symptoms · severity ${cur.severity}`,
    })
  }

  // Cognitive (orientation, memory, concentration, delayed recall)
  const cog = cognitiveScore(current)
  if (cog) {
    const baseCog = baseline ? cognitiveScore(baseline) : undefined
    if (baseCog) {
      // Compare only the parts both sessions have, so a skipped test can't fake a drop.
      const keys = (['orientation', 'immediate', 'concentration', 'delayed'] as const).filter(
        (k) => Number.isFinite(cog[k]) && Number.isFinite(baseCog[k]),
      )
      const cur = keys.reduce((a, k) => a + cog[k], 0)
      const bas = keys.reduce((a, k) => a + baseCog[k], 0)
      const drop = bas - cur
      const worse = keys.filter((k) => baseCog[k] > cog[k]).map((k) => COG_LABEL[k])
      findings.push({
        domain: 'cognitive',
        title: 'Memory & thinking',
        status: drop >= T.cognitiveDrop ? 'flag' : 'ok',
        summary:
          drop >= T.cognitiveDrop
            ? `${drop} points below baseline (${listify(worse)})`
            : drop > 0
              ? `${drop} point${drop > 1 ? 's' : ''} below baseline, within normal variation`
              : 'At or above baseline',
        baseline: `${bas} pts`,
        current: `${cur} pts`,
      })
    } else {
      // Without a baseline, only clear-cut failures can be called.
      const disoriented = Number.isFinite(cog.orientation) && cog.orientation < 5
      findings.push({
        domain: 'cognitive',
        title: 'Memory & thinking',
        status: disoriented ? 'flag' : 'na',
        summary: disoriented
          ? `Missed ${5 - cog.orientation} orientation question${5 - cog.orientation > 1 ? 's' : ''}`
          : 'No baseline to compare; scores recorded for the doctor',
        current: `${cog.total}/${cog.max} pts`,
      })
    }
  }

  // Reaction time
  const rt = reactionSummary(current.reaction)
  if (rt) {
    const brt = baseline ? reactionSummary(baseline.reaction) : undefined
    if (brt && baseline?.reaction) {
      const slowPct = ((rt.median - brt.median) / brt.median) * 100
      const { p } = mannWhitneyGreater(baseline.reaction.goRTs, current.reaction!.goRTs)
      const slow = slowPct >= T.reactionSlowdownPct && p < T.reactionP
      const impulsive = rt.commissions - brt.commissions >= T.commissionIncrease
      findings.push({
        domain: 'reaction',
        title: 'Reaction time',
        status: slow || impulsive ? 'flag' : 'ok',
        summary: slow
          ? `${Math.round(slowPct)}% slower than baseline (p ${p < 0.001 ? '< 0.001' : '= ' + p.toFixed(3)})`
          : impulsive
            ? `${rt.commissions - brt.commissions} more impulse errors than baseline`
            : slowPct > 0
              ? `${Math.round(slowPct)}% slower, within normal variation`
              : 'As fast as baseline or faster',
        baseline: `${brt.median} ms`,
        current: `${rt.median} ms`,
        note: opts.differentDevice ? DEVICE_NOTE : undefined,
      })
    } else {
      findings.push({
        domain: 'reaction',
        title: 'Reaction time',
        status: 'na',
        summary: 'No baseline to compare; recorded for the doctor',
        current: `${rt.median} ms`,
      })
    }
  }

  // Balance
  const bal = balanceSummary(current.balance)
  if (bal) {
    const bb = baseline ? balanceSummary(baseline.balance) : undefined
    if (bb) {
      // Composite over stances both sessions completed.
      const ids = STANCES.map((s) => s.id).filter((id) => bal.byStance[id] && bb.byStance[id])
      const ratio = ids.length
        ? geometricMean(ids.map((id) => bal.byStance[id] / bb.byStance[id]))
        : bal.composite / bb.composite
      const moreErrors = bal.errors - bb.errors
      const flag = ratio >= T.swayRatio || moreErrors >= T.balanceErrorIncrease
      findings.push({
        domain: 'balance',
        title: 'Balance',
        status: flag ? 'flag' : 'ok',
        summary:
          ratio >= T.swayRatio
            ? `${ratio.toFixed(1)}× more sway than baseline`
            : moreErrors >= T.balanceErrorIncrease
              ? `${moreErrors} more balance errors than baseline`
              : `${ratio.toFixed(2)}× baseline sway, within normal variation`,
        baseline: `${bb.composite} mg · ${bb.errors} err`,
        current: `${bal.composite} mg · ${bal.errors} err`,
        note: opts.differentDevice ? DEVICE_NOTE : undefined,
      })
    } else {
      findings.push({
        domain: 'balance',
        title: 'Balance',
        status: 'na',
        summary: 'No baseline to compare; recorded for the doctor',
        current: `${bal.composite} mg · ${bal.errors} err`,
      })
    }
  }

  // Eyes & motion
  const vp = vestibularProvocation(current.vestibular)
  if (vp) {
    const bvp = baseline ? vestibularProvocation(baseline.vestibular) : undefined
    const flag = vp.max >= T.vestibularProvocation && vp.max > (bvp?.max ?? 0)
    findings.push({
      domain: 'vestibular',
      title: 'Eyes & motion',
      status: flag ? 'flag' : 'ok',
      summary: flag
        ? `Symptoms rose ${vp.max} points (${vp.worst})`
        : vp.max > 0
          ? `Mild change (+${vp.max}), below the 2-point cutoff`
          : 'No symptoms provoked',
      baseline: bvp ? `+${bvp.max} max` : undefined,
      current: `+${vp.max} max`,
    })
  }

  let verdict: Verdict
  if (rf?.redFlags.length) verdict = 'emergency'
  else if (findings.some((f) => f.status === 'flag')) verdict = 'remove'
  else if (!current.symptoms) verdict = 'incomplete'
  else verdict = 'no-change'

  return { verdict, findings, hasBaseline }
}

const COG_LABEL = {
  orientation: 'orientation',
  immediate: 'word recall',
  concentration: 'concentration',
  delayed: 'delayed recall',
} as const

function listify(xs: string[]): string {
  const low = xs.map((x, i) => (i === 0 ? x : x.charAt(0).toLowerCase() + x.slice(1)))
  if (low.length <= 3) return low.join(', ')
  return `${low.slice(0, 3).join(', ')} +${low.length - 3} more`
}

// ---------- baseline quality ----------

/** Warnings that a baseline may not reflect the athlete's real best effort. */
export function baselineWarnings(r: SessionResults): string[] {
  const w: string[] = []
  const rt = reactionSummary(r.reaction)
  if (rt && rt.median > T.baselineMaxMedianRT)
    w.push(`Reaction time (${rt.median} ms) is slower than typical. Was the athlete distracted?`)
  if (rt && rt.commissions >= T.baselineMaxCommissions) w.push('Many taps on red. The athlete may have rushed the reaction test.')
  if (r.memory && r.memory.trials.reduce((a, b) => a + b, 0) < T.baselineMinImmediateMemory)
    w.push('Word recall is unusually low. Consider redoing it in a quieter place.')
  if (r.balance?.stances.some((s) => s.errors >= 4)) w.push('Several balance errors. Make sure the athlete understood each stance.')
  if (symptomTotals(r.symptoms).severity >= 10)
    w.push('Many symptoms at baseline. If the athlete is sick or recently injured, retest when healthy.')
  return w
}
