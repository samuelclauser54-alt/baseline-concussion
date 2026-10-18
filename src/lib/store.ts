// Tiny on-device store (localStorage) with a React hook.

import { useSyncExternalStore } from 'react'
import type { Athlete, Data, Session, SessionKind, SessionResults } from './types'

const KEY = 'baseline.data.v1'
const empty: Data = { version: 1, athletes: [], sessions: [] }

function load(): Data {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const d = JSON.parse(raw) as Data
      if (d.version === 1) return d
    }
  } catch {
    /* storage blocked or corrupt — start empty */
  }
  return empty
}

let data: Data = load()
const listeners = new Set<() => void>()

function commit(next: Data) {
  data = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* private mode or quota — keep working in memory */
  }
  listeners.forEach((l) => l())
}

export function useData(): Data {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => data,
  )
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

// ---------- athletes ----------

export function addAthlete(a: Omit<Athlete, 'id' | 'createdAt'>): Athlete {
  const athlete: Athlete = { ...a, id: uid(), createdAt: Date.now() }
  commit({ ...data, athletes: [...data.athletes, athlete] })
  return athlete
}

export function updateAthlete(id: string, patch: Partial<Athlete>) {
  commit({ ...data, athletes: data.athletes.map((a) => (a.id === id ? { ...a, ...patch } : a)) })
}

export function deleteAthlete(id: string) {
  commit({
    ...data,
    athletes: data.athletes.filter((a) => a.id !== id),
    sessions: data.sessions.filter((s) => s.athleteId !== id),
  })
}

// ---------- sessions ----------

export function startSession(athleteId: string, kind: SessionKind, context?: string): Session {
  const s: Session = { id: uid(), athleteId, kind, startedAt: Date.now(), step: 0, skipped: [], results: {}, context }
  commit({ ...data, sessions: [...data.sessions, s] })
  return s
}

export function updateSession(id: string, patch: Partial<Session>) {
  commit({ ...data, sessions: data.sessions.map((s) => (s.id === id ? { ...s, ...patch } : s)) })
}

export function saveResult<K extends keyof SessionResults>(id: string, key: K, value: SessionResults[K], nextStep: number) {
  commit({
    ...data,
    sessions: data.sessions.map((s) =>
      s.id === id ? { ...s, step: nextStep, results: { ...s.results, [key]: value } } : s,
    ),
  })
}

export function deleteSession(id: string) {
  commit({ ...data, sessions: data.sessions.filter((s) => s.id !== id) })
}

export function getSession(id: string) {
  return data.sessions.find((s) => s.id === id)
}

/** The baseline a check should be compared against: the latest completed one
 *  that was taken before the check started. */
export function baselineFor(athleteId: string, before = Infinity): Session | undefined {
  return data.sessions
    .filter((s) => s.athleteId === athleteId && s.kind === 'baseline' && s.completedAt && s.startedAt < before)
    .sort((a, b) => b.startedAt - a.startedAt)[0]
}

/** Rotate word lists so an athlete never gets the same list twice in a row. */
export function nextWordList(athleteId: string): number {
  const used = data.sessions
    .filter((s) => s.athleteId === athleteId && s.results.memory)
    .sort((a, b) => b.startedAt - a.startedAt)
  return used.length ? (used[0].results.memory!.list + 1) % 4 : Math.floor(Math.random() * 4)
}

// ---------- import / export ----------

export function exportJSON(): string {
  return JSON.stringify(data, null, 2)
}

export function importJSON(text: string) {
  const d = JSON.parse(text) as Data
  if (d.version !== 1 || !Array.isArray(d.athletes) || !Array.isArray(d.sessions)) throw new Error('Not a Baseline backup file')
  const ids = new Set(data.athletes.map((a) => a.id))
  const sids = new Set(data.sessions.map((s) => s.id))
  commit({
    ...data,
    athletes: [...data.athletes, ...d.athletes.filter((a) => !ids.has(a.id))],
    sessions: [...data.sessions, ...d.sessions.filter((s) => !sids.has(s.id))],
  })
}

export function replaceAll(next: Data) {
  commit(next)
}

export function clearDemo() {
  const demoIds = new Set(data.athletes.filter((a) => a.demo).map((a) => a.id))
  commit({
    ...data,
    athletes: data.athletes.filter((a) => !a.demo),
    sessions: data.sessions.filter((s) => !demoIds.has(s.athleteId)),
  })
}

export function getData(): Data {
  return data
}
