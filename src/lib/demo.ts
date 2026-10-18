// Fictional demo team so anyone (including judges on a laptop) can explore a
// finished baseline and a post-hit report without running a test.

import { analyzeStance, type MotionSample } from './balance'
import { getData, replaceAll, uid } from './store'
import type { Athlete, Session, SessionResults, StanceResult } from './types'

function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
}

function stance(id: StanceResult['id'], sway: number, seed: number, jolts: number[] = []): StanceResult {
  const r = rng(seed)
  const g = () => Math.sqrt(-2 * Math.log(r() + 1e-12)) * Math.cos(2 * Math.PI * r())
  const hz = 60
  const out: MotionSample[] = []
  let wx = 0
  let wz = 0
  for (let i = 0; i < 20 * hz; i++) {
    const t = (i / hz) * 1000
    const s = t / 1000
    // random-walk + oscillation, like real postural sway
    wx = 0.96 * wx + 0.12 * g()
    wz = 0.96 * wz + 0.12 * g()
    let x = sway * (0.6 * Math.sin(2 * Math.PI * 0.6 * s + seed) + 0.6 * wx)
    const z = sway * (0.5 * Math.sin(2 * Math.PI * 0.9 * s + 2 * seed) + 0.6 * wz)
    for (const j of jolts) if (Math.abs(s - j) < 0.15) x += 3.5
    out.push({ t, x, y: 9.81, z })
  }
  return analyzeStance(id, out)
}

function rts(center: number, spread: number, n: number, seed: number) {
  const r = rng(seed)
  return Array.from({ length: n }, () => {
    const g = Math.sqrt(-2 * Math.log(r() + 1e-12)) * Math.cos(2 * Math.PI * r())
    // reaction times are right-skewed
    return Math.round(center + spread * g + Math.max(0, spread * 1.2 * g * g - spread))
  })
}

const day = 86400000

function baselineResults(seed: number, opts: { rt: number; sway: number; mem: number[]; delayed: number; symptoms?: Record<string, number>; list: number }): SessionResults {
  return {
    symptoms: opts.symptoms ?? {},
    orientation: { answers: { month: true, date: true, day: true, year: true, time: true } },
    memory: { list: opts.list, trials: opts.mem, finishedAt: 0 },
    concentration: { digits: 3, monthsCorrect: true, monthsSeconds: 14.2 },
    reaction: { goRTs: rts(opts.rt, 28, 18, seed), misses: 0, commissions: 1, falseStarts: 0, goTrials: 18, noGoTrials: 6 },
    balance: {
      supported: true,
      stances: [stance('together', opts.sway * 0.55, seed + 1), stance('tandem', opts.sway, seed + 2), stance('single', opts.sway * 1.5, seed + 3)],
    },
    vestibular: {
      pre: { headache: 0, dizziness: 0, nausea: 0, fogginess: 0 },
      items: {
        pursuit: { headache: 0, dizziness: 0, nausea: 0, fogginess: 0 },
        saccades: { headache: 0, dizziness: 0, nausea: 0, fogginess: 0 },
        vor: { headache: 0, dizziness: 1, nausea: 0, fogginess: 0 },
        vms: { headache: 0, dizziness: 1, nausea: 0, fogginess: 0 },
      },
    },
    delayed: { recalled: opts.delayed, delaySeconds: 342 },
  }
}

export function loadDemo() {
  const now = Date.now()
  const mk = (name: string, sport: string, gradYear: number, foot: 'left' | 'right'): Athlete => ({
    id: uid(), name, sport, gradYear, dominantFoot: foot, createdAt: now - 60 * day, demo: true,
  })
  const jordan = mk('Jordan Reyes', 'Football', 2028, 'right')
  const maya = mk('Maya Thompson', 'Soccer', 2027, 'left')
  const eli = mk('Eli Novak', 'Wrestling', 2029, 'right')

  const s = (athleteId: string, kind: Session['kind'], daysAgo: number, results: SessionResults, extra: Partial<Session> = {}): Session => {
    const startedAt = now - daysAgo * day
    return { id: uid(), athleteId, kind, startedAt, completedAt: startedAt + 9 * 60000, step: 99, skipped: [], results, ...extra }
  }

  const jordanBase = baselineResults(11, { rt: 292, sway: 0.42, mem: [6, 8, 9], delayed: 8, symptoms: { fatigue: 1 }, list: 0 })
  const jordanHit: SessionResults = {
    redflags: { redFlags: [], observedSigns: ['slow', 'blank'] },
    symptoms: { headache: 3, pressure: 2, dizzy: 2, fog: 3, notright: 2, fatigue: 2, light: 1 },
    orientation: { answers: { month: true, date: false, day: true, year: true, time: true } },
    memory: { list: 1, trials: [4, 6, 6], finishedAt: 0 },
    concentration: { digits: 2, monthsCorrect: false, monthsSeconds: 34.8 },
    reaction: { goRTs: rts(352, 45, 17, 99), misses: 1, commissions: 3, falseStarts: 1, goTrials: 18, noGoTrials: 6 },
    balance: {
      supported: true,
      stances: [stance('together', 0.36, 51), stance('tandem', 0.78, 52, [11]), stance('single', 1.05, 53, [4, 9, 15])],
    },
    vestibular: {
      pre: { headache: 3, dizziness: 2, nausea: 0, fogginess: 3 },
      items: {
        pursuit: { headache: 3, dizziness: 3, nausea: 0, fogginess: 3 },
        saccades: { headache: 4, dizziness: 4, nausea: 1, fogginess: 4 },
        vor: { headache: 5, dizziness: 5, nausea: 2, fogginess: 4 },
        vms: { headache: 5, dizziness: 6, nausea: 3, fogginess: 5 },
      },
    },
    delayed: { recalled: 4, delaySeconds: 318 },
  }

  const mayaBase = baselineResults(21, { rt: 276, sway: 0.36, mem: [7, 9, 10], delayed: 9, list: 2 })
  const mayaCheck = baselineResults(22, { rt: 281, sway: 0.38, mem: [7, 9, 9], delayed: 9, list: 3 })
  mayaCheck.redflags = { redFlags: [], observedSigns: [] }

  const eliBase = baselineResults(31, { rt: 305, sway: 0.47, mem: [5, 7, 9], delayed: 7, list: 1 })

  const d = getData()
  replaceAll({
    ...d,
    athletes: [...d.athletes.filter((a) => !a.demo), jordan, maya, eli],
    sessions: [
      ...d.sessions,
      s(jordan.id, 'baseline', 52, jordanBase),
      s(jordan.id, 'check', 0.08, jordanHit, { context: 'Helmet-to-helmet hit, 2nd quarter' }),
      s(maya.id, 'baseline', 47, mayaBase),
      s(maya.id, 'check', 3, mayaCheck, { context: 'Header collision at practice' }),
      s(eli.id, 'baseline', 30, eliBase),
    ],
  })
}
