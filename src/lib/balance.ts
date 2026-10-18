// Turns raw phone accelerometer samples into a postural-sway score.
//
// The athlete holds the phone flat against their chest. When the body sways,
// the chest (and phone) accelerates sideways. We:
//   1. separate gravity from body motion with a slow low-pass filter,
//   2. keep only the horizontal part of the motion (perpendicular to gravity),
//   3. report its root-mean-square size in milli-g ("sway"), and
//   4. count large jolts as balance "errors" (stepping, hopping, stumbling),
//      like the error count in the Balance Error Scoring System.

import type { StanceResult } from './types'
import { mean } from './stats'

export interface MotionSample {
  /** ms timestamp */
  t: number
  /** accelerationIncludingGravity, m/s² */
  x: number
  y: number
  z: number
}

const G = 9.80665
/** Gravity estimate cutoff. Body sway is ~0.3–3 Hz; gravity direction drifts slower. */
const GRAVITY_CUTOFF_HZ = 0.2
/** Smooth out sensor noise and hand tremor above this. */
const MOTION_CUTOFF_HZ = 5
/** Ignore the settling period after the start beep and the reaction to the stop beep. */
const TRIM_START_MS = 1000
const TRIM_END_MS = 500
/** A jolt bigger than this (total body acceleration) counts as a balance error. */
export const ERROR_THRESHOLD_MS2 = 1.2
/** Two error spikes closer than this are the same stumble. */
const ERROR_REFRACTORY_MS = 1000

type Vec = [number, number, number]
const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const norm = (a: Vec) => Math.sqrt(dot(a, a))
const scale = (a: Vec, k: number): Vec => [a[0] * k, a[1] * k, a[2] * k]
const sub = (a: Vec, b: Vec): Vec => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const cross = (a: Vec, b: Vec): Vec => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
]

/** One-pole low-pass smoothing factor for a given cutoff and time step. */
function alpha(cutoffHz: number, dtSec: number): number {
  const rc = 1 / (2 * Math.PI * cutoffHz)
  return dtSec / (rc + dtSec)
}

export function analyzeStance(id: StanceResult['id'], samples: MotionSample[]): StanceResult {
  if (samples.length < 20) {
    return { id, swayMg: NaN, errors: 0, samples: samples.length, sampleRateHz: 0, trace: [] }
  }
  const duration = (samples[samples.length - 1].t - samples[0].t) / 1000
  const sampleRateHz = (samples.length - 1) / duration

  // Initialise gravity from the first half-second so the filter starts settled.
  const head = samples.filter((s) => s.t - samples[0].t < 500)
  let g: Vec = [mean(head.map((s) => s.x)), mean(head.map((s) => s.y)), mean(head.map((s) => s.z))]
  let lin: Vec = [0, 0, 0]
  const linear: { t: number; v: Vec }[] = []

  for (let i = 0; i < samples.length; i++) {
    const s = samples[i]
    const dt = i === 0 ? 1 / sampleRateHz : Math.max(1e-3, (s.t - samples[i - 1].t) / 1000)
    const raw: Vec = [s.x, s.y, s.z]
    const ag = alpha(GRAVITY_CUTOFF_HZ, dt)
    g = [g[0] + ag * (raw[0] - g[0]), g[1] + ag * (raw[1] - g[1]), g[2] + ag * (raw[2] - g[2])]
    const am = alpha(MOTION_CUTOFF_HZ, dt)
    const motion = sub(raw, g)
    lin = [lin[0] + am * (motion[0] - lin[0]), lin[1] + am * (motion[1] - lin[1]), lin[2] + am * (motion[2] - lin[2])]
    linear.push({ t: s.t, v: lin })
  }

  // A fixed horizontal basis (two axes perpendicular to average gravity).
  const gMean: Vec = [mean(samples.map((s) => s.x)), mean(samples.map((s) => s.y)), mean(samples.map((s) => s.z))]
  const gHat = scale(gMean, 1 / (norm(gMean) || 1))
  const helper: Vec = Math.abs(gHat[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0]
  const e1 = scale(cross(gHat, helper), 1 / norm(cross(gHat, helper)))
  const e2 = cross(gHat, e1)

  const t0 = samples[0].t + TRIM_START_MS
  const t1 = samples[samples.length - 1].t - TRIM_END_MS
  const window = linear.filter((p) => p.t >= t0 && p.t <= t1)

  let sumSq = 0
  let errors = 0
  let lastErrorT = -Infinity
  const pts: [number, number][] = []
  for (const p of window) {
    const hx = dot(p.v, e1)
    const hy = dot(p.v, e2)
    sumSq += hx * hx + hy * hy
    pts.push([(hx / G) * 1000, (hy / G) * 1000])
    if (norm(p.v) > ERROR_THRESHOLD_MS2 && p.t - lastErrorT > ERROR_REFRACTORY_MS) {
      errors++
      lastErrorT = p.t
    }
  }
  const swayMg = window.length ? (Math.sqrt(sumSq / window.length) / G) * 1000 : NaN

  // Keep ~200 points for the sway-cloud plot.
  const step = Math.max(1, Math.floor(pts.length / 200))
  const trace = pts.filter((_, i) => i % step === 0).map(([a, b]) => [round1(a), round1(b)] as [number, number])

  return { id, swayMg: round1(swayMg), errors, samples: samples.length, sampleRateHz: round1(sampleRateHz), trace }
}

/** Is the phone roughly upright against the chest? (gravity mostly along the phone's long axis) */
export function postureCheck(samples: MotionSample[]): 'upright' | 'flat' | 'unknown' {
  if (samples.length < 5) return 'unknown'
  const gx = mean(samples.map((s) => s.x))
  const gy = mean(samples.map((s) => s.y))
  const gz = mean(samples.map((s) => s.z))
  const n = Math.sqrt(gx * gx + gy * gy + gz * gz) || 1
  return Math.abs(gy) / n > 0.7 ? 'upright' : Math.abs(gz) / n > 0.7 ? 'flat' : 'unknown'
}

function round1(x: number): number {
  return Math.round(x * 10) / 10
}
