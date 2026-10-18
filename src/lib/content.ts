// Test content. Items follow the domains used by standard sideline tools
// (Concussion Recognition Tool, SCAT symptom scale, Standardized Assessment of
// Concussion, mBESS, VOMS). Word lists and digit strings are original to this app.

import type { StepId } from './types'

/** Danger signs: any one means call 911 (Concussion Recognition Tool "red flags"). */
export const RED_FLAGS = [
  { id: 'neck', label: 'Neck pain or tenderness', note: 'Do not move them. Keep the head and neck still.' },
  { id: 'vision', label: 'Double vision' },
  { id: 'weakness', label: 'Weakness, tingling, or burning in arms or legs' },
  { id: 'headache', label: 'Severe or increasing headache' },
  { id: 'seizure', label: 'Seizure or convulsion' },
  { id: 'loc', label: 'Lost consciousness (knocked out)' },
  { id: 'consciousness', label: 'Getting more drowsy or harder to wake up' },
  { id: 'vomiting', label: 'Vomiting' },
  { id: 'agitated', label: 'Increasingly restless, agitated, or combative' },
] as const

/** Observable signs: any one means remove from play, no matter what the tests say. */
export const OBSERVED_SIGNS = [
  { id: 'motionless', label: 'Lying motionless on the ground' },
  { id: 'slow', label: 'Slow to get up after a hit to the head' },
  { id: 'gait', label: 'Stumbling, poor coordination, or trouble walking' },
  { id: 'disoriented', label: 'Confused or can’t answer questions properly' },
  { id: 'blank', label: 'Blank or vacant look' },
  { id: 'face', label: 'Facial injury after head trauma' },
] as const

/** The 22 standard post-concussion symptoms, rated 0–6. */
export const SYMPTOMS = [
  { id: 'headache', label: 'Headache' },
  { id: 'pressure', label: 'Pressure in head' },
  { id: 'neck', label: 'Neck pain' },
  { id: 'nausea', label: 'Nausea or vomiting' },
  { id: 'dizzy', label: 'Dizziness' },
  { id: 'blurred', label: 'Blurred vision' },
  { id: 'balance', label: 'Balance problems' },
  { id: 'light', label: 'Sensitive to light' },
  { id: 'noise', label: 'Sensitive to noise' },
  { id: 'slowed', label: 'Feeling slowed down' },
  { id: 'fog', label: 'Feeling “in a fog”' },
  { id: 'notright', label: '“Don’t feel right”' },
  { id: 'concentrating', label: 'Difficulty concentrating' },
  { id: 'remembering', label: 'Difficulty remembering' },
  { id: 'fatigue', label: 'Fatigue or low energy' },
  { id: 'confusion', label: 'Confusion' },
  { id: 'drowsy', label: 'Drowsiness' },
  { id: 'emotional', label: 'More emotional' },
  { id: 'irritable', label: 'Irritability' },
  { id: 'sad', label: 'Sadness' },
  { id: 'anxious', label: 'Nervous or anxious' },
  { id: 'sleep', label: 'Trouble falling asleep' },
] as const

/** Four interchangeable 10-word lists. Baselines and checks rotate lists so the
 *  athlete can't just remember last time's words. */
export const WORD_LISTS: string[][] = [
  ['candle', 'river', 'pocket', 'tiger', 'button', 'garden', 'ladder', 'rocket', 'pillow', 'orange'],
  ['window', 'basket', 'thunder', 'mitten', 'carrot', 'engine', 'forest', 'needle', 'bubble', 'castle'],
  ['blanket', 'camera', 'dragon', 'finger', 'hammer', 'lemon', 'magnet', 'puzzle', 'turtle', 'wagon'],
  ['bottle', 'cactus', 'feather', 'guitar', 'island', 'kitten', 'marble', 'pencil', 'spider', 'trumpet'],
]

/** Digits-backward strings: two tries at each length (3 → 6). */
export const DIGIT_STRINGS: [string, string][] = [
  ['4-9-3', '6-2-9'],
  ['3-8-1-4', '3-2-7-9'],
  ['6-2-9-7-1', '1-5-2-8-6'],
  ['7-1-8-4-6-2', '5-3-9-1-4-8'],
]

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** VOMS-style items (Mucha et al., 2014). Near-point convergence needs a ruler,
 *  so it is not included. */
export const VESTIBULAR_ITEMS = [
  {
    id: 'pursuit',
    title: 'Smooth pursuit',
    instruction: 'Hold the phone at arm’s length. Keep your head still and follow the dot with only your eyes.',
    mode: 'pursuit',
  },
  {
    id: 'saccades',
    title: 'Saccades',
    instruction: 'Keep your head still. Jump your eyes to each dot as fast as you can as it appears.',
    mode: 'saccades',
  },
  {
    id: 'vor',
    title: 'Head-turn focus (VOR)',
    instruction: 'Stare at the letter. Turn your head side to side with each beep while keeping the letter in focus.',
    mode: 'vor',
  },
  {
    id: 'vms',
    title: 'Visual motion sensitivity',
    instruction: 'Stand, hold the phone at arm’s length, and rotate your whole upper body left and right with each beep, eyes on the letter.',
    mode: 'vms',
  },
] as const

export const VESTIBULAR_SYMPTOMS = [
  { id: 'headache', label: 'Headache' },
  { id: 'dizziness', label: 'Dizziness' },
  { id: 'nausea', label: 'Nausea' },
  { id: 'fogginess', label: 'Fogginess' },
] as const

export const STANCES = [
  { id: 'together', title: 'Feet together', detail: 'Stand with feet side by side, touching.' },
  { id: 'tandem', title: 'Heel-to-toe', detail: 'Put your non-dominant foot directly behind the other, heel touching toe.' },
  { id: 'single', title: 'One leg', detail: 'Stand on your non-dominant foot. Lift the other foot off the ground.' },
] as const

export const STEP_LABELS: Record<StepId, string> = {
  redflags: 'Danger signs',
  symptoms: 'Symptoms',
  orientation: 'Orientation',
  memory: 'Memory',
  concentration: 'Concentration',
  reaction: 'Reaction time',
  balance: 'Balance',
  vestibular: 'Eyes & motion',
  delayed: 'Delayed recall',
}

/** Baseline skips the danger-sign check; everything else is identical so the
 *  two sessions are directly comparable. Delayed recall comes last so at least
 *  ~5 minutes pass after the word list. */
export const BASELINE_STEPS: StepId[] = [
  'symptoms', 'orientation', 'memory', 'concentration', 'reaction', 'balance', 'vestibular', 'delayed',
]
export const CHECK_STEPS: StepId[] = ['redflags', ...BASELINE_STEPS]

/** Graduated return-to-sport strategy (Amsterdam 2022 consensus). Each step
 *  takes at least 24 hours; step 4+ only after symptoms have resolved and a
 *  licensed health-care provider clears contact. */
export const RETURN_TO_SPORT = [
  { title: 'Symptom-limited activity', detail: 'Daily activities that don’t make symptoms worse, like walking.' },
  { title: 'Light aerobic exercise', detail: 'Walking or stationary bike at slow to medium pace. No resistance training.' },
  { title: 'Sport-specific exercise', detail: 'Running or skating drills. No head-impact activities.' },
  { title: 'Non-contact training drills', detail: 'Harder drills like passing. Can start progressive resistance training.' },
  { title: 'Full-contact practice', detail: 'Only after written medical clearance. Normal training activities.' },
  { title: 'Return to sport', detail: 'Normal game play.' },
]

export const RETURN_TO_LEARN = [
  { title: 'Daily activities at home', detail: 'Reading, texting, and screens in short bursts that don’t worsen symptoms.' },
  { title: 'School activities at home', detail: 'Homework, reading, or other cognitive activities outside the classroom.' },
  { title: 'Return to school part-time', detail: 'Gradual return with accommodations like breaks and reduced workload.' },
  { title: 'Return to school full-time', detail: 'Full days, then catch up on missed work as symptoms allow.' },
]
