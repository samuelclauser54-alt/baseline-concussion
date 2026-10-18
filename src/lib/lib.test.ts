import { describe, expect, it } from 'vitest'
import { analyzeStance, type MotionSample } from './balance'
import { buildReport, baselineWarnings, cognitiveScore } from './scoring'
import { mannWhitneyGreater, median, normalCdf } from './stats'
import type { SessionResults, StanceResult } from './types'

// Deterministic pseudo-random numbers so tests are repeatable.
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
}
function gaussian(r: () => number) {
  return Math.sqrt(-2 * Math.log(r() + 1e-12)) * Math.cos(2 * Math.PI * r())
}

/** Phone upright on the chest (gravity on +y), body swaying sideways. */
function synthStance(swayMs2: number, seconds = 20, hz = 60, jolts: number[] = [], seed = 1): MotionSample[] {
  const r = rng(seed)
  const out: MotionSample[] = []
  for (let i = 0; i < seconds * hz; i++) {
    const t = (i / hz) * 1000
    const s = t / 1000
    // sway is a mix of slow sines + noise, like real postural sway
    let x = swayMs2 * (Math.sin(2 * Math.PI * 0.7 * s) + 0.5 * Math.sin(2 * Math.PI * 1.9 * s + 1)) + 0.02 * gaussian(r)
    let z = swayMs2 * 0.8 * Math.sin(2 * Math.PI * 1.1 * s + 0.4) + 0.02 * gaussian(r)
    for (const j of jolts) if (Math.abs(s - j) < 0.15) x += 4
    out.push({ t, x, y: 9.81 + 0.02 * gaussian(r), z })
  }
  return out
}

describe('stats', () => {
  it('median and normal CDF', () => {
    expect(median([3, 1, 2])).toBe(2)
    expect(median([4, 1, 2, 3])).toBe(2.5)
    expect(normalCdf(0)).toBeCloseTo(0.5, 6)
    expect(normalCdf(1.96)).toBeCloseTo(0.975, 3)
  })

  it('Mann–Whitney detects a real slowdown and ignores noise', () => {
    const r = rng(7)
    const base = Array.from({ length: 18 }, () => 300 + 30 * gaussian(r))
    const same = Array.from({ length: 18 }, () => 300 + 30 * gaussian(r))
    const slow = Array.from({ length: 18 }, () => 350 + 30 * gaussian(r))
    expect(mannWhitneyGreater(base, same).p).toBeGreaterThan(0.05)
    expect(mannWhitneyGreater(base, slow).p).toBeLessThan(0.001)
  })
})

describe('balance analysis', () => {
  it('scores more sway higher and counts jolts as errors', () => {
    const steady = analyzeStance('together', synthStance(0.15))
    const wobbly = analyzeStance('together', synthStance(0.45))
    expect(steady.sampleRateHz).toBeCloseTo(60, 0)
    expect(wobbly.swayMg / steady.swayMg).toBeGreaterThan(2.3)
    expect(wobbly.swayMg / steady.swayMg).toBeLessThan(3.7)
    expect(steady.errors).toBe(0)
    const stumbles = analyzeStance('single', synthStance(0.15, 20, 60, [5, 9, 14]))
    expect(stumbles.errors).toBe(3)
  })

  it('is independent of how the phone is held (gravity direction)', () => {
    const upright = synthStance(0.3)
    // Same motion with the phone rotated so gravity is along x instead of y.
    const rotated = upright.map((s) => ({ t: s.t, x: s.y, y: -s.x, z: s.z }))
    const a = analyzeStance('tandem', upright).swayMg
    const b = analyzeStance('tandem', rotated).swayMg
    expect(Math.abs(a - b) / a).toBeLessThan(0.05)
  })

  it('handles too little data', () => {
    expect(Number.isNaN(analyzeStance('single', synthStance(0.2, 0.1)).swayMg)).toBe(true)
  })
})

// ---------- scoring ----------

const stance = (id: StanceResult['id'], swayMg: number, errors = 0): StanceResult => ({
  id, swayMg, errors, samples: 1200, sampleRateHz: 60, trace: [],
})

function healthy(seed = 1, overrides: Partial<SessionResults> = {}): SessionResults {
  const r = rng(seed)
  return {
    symptoms: { fatigue: 1 },
    orientation: { answers: { month: true, date: true, day: true, year: true, time: true } },
    memory: { list: 0, trials: [6, 8, 9], finishedAt: 0 },
    concentration: { digits: 3, monthsCorrect: true },
    reaction: {
      goRTs: Array.from({ length: 18 }, () => 290 + 25 * gaussian(r)),
      misses: 0, commissions: 1, falseStarts: 0, goTrials: 18, noGoTrials: 6,
    },
    balance: { supported: true, stances: [stance('together', 8), stance('tandem', 14, 1), stance('single', 22, 1)] },
    vestibular: {
      pre: { headache: 0, dizziness: 0, nausea: 0, fogginess: 0 },
      items: {
        pursuit: { headache: 0, dizziness: 0, nausea: 0, fogginess: 0 },
        vor: { headache: 0, dizziness: 1, nausea: 0, fogginess: 0 },
      },
    },
    delayed: { recalled: 7, delaySeconds: 330 },
    ...overrides,
  }
}

describe('scoring', () => {
  it('cognitive score adds up SAC-style parts', () => {
    const c = cognitiveScore(healthy())!
    expect(c.total).toBe(5 + 23 + 4 + 7)
    expect(c.max).toBe(50)
  })

  it('a healthy retest is "no-change"', () => {
    const rep = buildReport({ ...healthy(2), redflags: { redFlags: [], observedSigns: [] } }, healthy(1))
    expect(rep.findings.filter((f) => f.status === 'flag')).toEqual([])
    expect(rep.verdict).toBe('no-change')
  })

  it('any danger sign means emergency', () => {
    const rep = buildReport({ redflags: { redFlags: ['seizure'], observedSigns: [] } }, healthy())
    expect(rep.verdict).toBe('emergency')
  })

  it('an observable sign alone means remove from play', () => {
    const rep = buildReport({ ...healthy(2), redflags: { redFlags: [], observedSigns: ['blank'] } }, healthy(1))
    expect(rep.verdict).toBe('remove')
  })

  it('flags each impaired domain', () => {
    const r = rng(9)
    const concussed = healthy(3, {
      symptoms: { fatigue: 1, headache: 3, fog: 2 },
      memory: { list: 1, trials: [5, 6, 7], finishedAt: 0 },
      reaction: {
        goRTs: Array.from({ length: 18 }, () => 345 + 30 * gaussian(r)),
        misses: 1, commissions: 3, falseStarts: 0, goTrials: 18, noGoTrials: 6,
      },
      balance: { supported: true, stances: [stance('together', 13), stance('tandem', 25, 2), stance('single', 38, 3)] },
      vestibular: {
        pre: { headache: 2, dizziness: 0, nausea: 0, fogginess: 1 },
        items: { vor: { headache: 3, dizziness: 3, nausea: 1, fogginess: 2 } },
      },
    })
    const rep = buildReport(concussed, healthy(1))
    const flagged = rep.findings.filter((f) => f.status === 'flag').map((f) => f.domain).sort()
    expect(flagged).toEqual(['balance', 'cognitive', 'reaction', 'symptoms', 'vestibular'])
    expect(rep.verdict).toBe('remove')
  })

  it('symptoms already present at baseline are not flagged', () => {
    const rep = buildReport(healthy(2, { symptoms: { fatigue: 1 } }), healthy(1))
    expect(rep.findings.find((f) => f.domain === 'symptoms')!.status).toBe('ok')
  })

  it('without a baseline, any symptom flags and other domains are recorded only', () => {
    const rep = buildReport(healthy(2))
    expect(rep.findings.find((f) => f.domain === 'symptoms')!.status).toBe('flag')
    expect(rep.findings.find((f) => f.domain === 'reaction')!.status).toBe('na')
    expect(rep.hasBaseline).toBe(false)
  })

  it('a skipped test cannot fake a cognitive drop', () => {
    const cur = healthy(2)
    delete cur.delayed
    const rep = buildReport(cur, healthy(1))
    expect(rep.findings.find((f) => f.domain === 'cognitive')!.status).toBe('ok')
  })

  it('warns about a sandbagged baseline', () => {
    const lazy = healthy(1, {
      reaction: { goRTs: Array(18).fill(520), misses: 2, commissions: 4, falseStarts: 0, goTrials: 18, noGoTrials: 6 },
    })
    expect(baselineWarnings(lazy).length).toBeGreaterThanOrEqual(2)
    expect(baselineWarnings(healthy(1))).toEqual([])
  })
})
