// Phone motion-sensor access. iOS requires an explicit permission prompt that
// can only be triggered by a tap; Android grants it automatically over HTTPS.

import type { MotionSample } from './balance'

type PermissionFn = () => Promise<'granted' | 'denied'>

export function motionAvailable(): boolean {
  return typeof window !== 'undefined' && 'DeviceMotionEvent' in window
}

export async function requestMotionPermission(): Promise<boolean> {
  if (!motionAvailable()) return false
  const req = (DeviceMotionEvent as unknown as { requestPermission?: PermissionFn }).requestPermission
  if (typeof req === 'function') {
    try {
      return (await req()) === 'granted'
    } catch {
      return false
    }
  }
  return true
}

/** Listen briefly to see whether real accelerometer data arrives (desktops expose the API but never fire). */
export function probeMotion(timeoutMs = 1200): Promise<boolean> {
  return new Promise((resolve) => {
    let got = false
    const h = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity
      if (a && a.x !== null && a.y !== null && a.z !== null) {
        got = true
        cleanup()
        resolve(true)
      }
    }
    const cleanup = () => window.removeEventListener('devicemotion', h)
    window.addEventListener('devicemotion', h)
    setTimeout(() => {
      cleanup()
      if (!got) resolve(false)
    }, timeoutMs)
  })
}

export class MotionRecorder {
  samples: MotionSample[] = []
  private handler = (e: DeviceMotionEvent) => {
    const a = e.accelerationIncludingGravity
    if (!a || a.x === null || a.y === null || a.z === null) return
    this.samples.push({ t: performance.now(), x: a.x, y: a.y, z: a.z })
    this.onSample?.(this.samples[this.samples.length - 1])
  }
  onSample?: (s: MotionSample) => void

  start() {
    this.samples = []
    window.addEventListener('devicemotion', this.handler)
  }

  stop(): MotionSample[] {
    window.removeEventListener('devicemotion', this.handler)
    return this.samples
  }
}

/** Keep the screen awake during long tests (supported on recent iOS/Android). */
export async function keepAwake(): Promise<() => void> {
  try {
    const lock = await (navigator as Navigator & { wakeLock?: { request(t: 'screen'): Promise<{ release(): Promise<void> }> } }).wakeLock?.request('screen')
    return () => void lock?.release()
  } catch {
    return () => {}
  }
}
