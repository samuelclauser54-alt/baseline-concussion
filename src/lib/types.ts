// Core data model. Everything is stored on the device (localStorage) —
// no accounts, no server, no health data ever leaves the phone.

export interface Athlete {
  id: string
  name: string
  sport: string
  gradYear?: number
  /** Non-dominant foot is the one the athlete stands on for the single-leg balance stance. */
  dominantFoot: 'left' | 'right'
  createdAt: number
  demo?: boolean
}

export type SessionKind = 'baseline' | 'check'

export type StepId =
  | 'redflags'
  | 'symptoms'
  | 'orientation'
  | 'memory'
  | 'concentration'
  | 'reaction'
  | 'balance'
  | 'vestibular'
  | 'delayed'

export interface RedFlagResult {
  /** Danger signs → call 911. */
  redFlags: string[]
  /** Observable signs → remove from play even if every test looks normal. */
  observedSigns: string[]
}

/** Symptom id → severity 0 (none) … 6 (severe). */
export type SymptomResult = Record<string, number>

export interface OrientationResult {
  answers: Record<string, boolean>
}

export interface MemoryResult {
  list: number
  /** Words recalled on each of the 3 trials (0–10 each). */
  trials: number[]
  /** Time the last trial finished, so delayed recall can report the delay. */
  finishedAt: number
}

export interface ConcentrationResult {
  /** Longest digit-span length passed backwards, scored 0–4 (lengths 3–6). */
  digits: number
  monthsCorrect: boolean
  monthsSeconds?: number
}

export interface ReactionResult {
  /** Reaction times (ms) on correct "go" trials. */
  goRTs: number[]
  misses: number
  /** Taps on a red "don't tap" trial — an impulse-control error. */
  commissions: number
  /** Taps before anything appeared. */
  falseStarts: number
  goTrials: number
  noGoTrials: number
}

export interface StanceResult {
  id: 'together' | 'tandem' | 'single'
  /** RMS horizontal acceleration, in milli-g. Lower = steadier. */
  swayMg: number
  /** Number of balance breaks (jolts from stepping, hopping, opening eyes and grabbing). */
  errors: number
  samples: number
  sampleRateHz: number
  /** Downsampled horizontal acceleration trace (x, y in milli-g) for the sway plot. */
  trace: [number, number][]
}

export interface BalanceResult {
  supported: boolean
  stances: StanceResult[]
}

export interface VestibularRating {
  headache: number
  dizziness: number
  nausea: number
  fogginess: number
}

export interface VestibularResult {
  pre: VestibularRating
  items: Record<string, VestibularRating>
}

export interface DelayedResult {
  recalled: number
  delaySeconds: number
}

export interface SessionResults {
  redflags?: RedFlagResult
  symptoms?: SymptomResult
  orientation?: OrientationResult
  memory?: MemoryResult
  concentration?: ConcentrationResult
  reaction?: ReactionResult
  balance?: BalanceResult
  vestibular?: VestibularResult
  delayed?: DelayedResult
}

export interface Session {
  id: string
  athleteId: string
  kind: SessionKind
  startedAt: number
  completedAt?: number
  /** Index into the step list; lets an interrupted check resume. */
  step: number
  /** Steps the examiner chose to skip (e.g. no phone sensor, or athlete already removed). */
  skipped: StepId[]
  results: SessionResults
  /** Optional context for a sideline check. */
  context?: string
  /** Set when a check was stopped early because a red flag was found. */
  stoppedForEmergency?: boolean
}

export interface Data {
  version: 1
  athletes: Athlete[]
  sessions: Session[]
}
