// Sound cues. The balance test is done with eyes closed, so start/stop must be audible.

let ctx: AudioContext | null = null

/** Must be called from a tap at least once (iOS only allows audio after a user gesture). */
export function unlockAudio() {
  try {
    // iPhone: by default, web sound is muted by the silent switch. "playback"
    // makes the balance-test beeps audible anyway (Safari 17+; ignored elsewhere).
    const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession
    if (session && session.type !== 'playback') session.type = 'playback'
  } catch {
    /* not supported */
  }
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
  } catch {
    /* no audio available */
  }
}

export function beep(freq = 880, ms = 180, volume = 0.25) {
  try {
    unlockAudio()
    if (!ctx) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = freq
    osc.type = 'sine'
    const t = ctx.currentTime
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(volume, t + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000)
    osc.connect(gain).connect(ctx.destination)
    osc.start(t)
    osc.stop(t + ms / 1000 + 0.02)
  } catch {
    /* ignore */
  }
}

export function speak(text: string, rate = 0.95): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) return resolve()
    const u = new SpeechSynthesisUtterance(text)
    u.rate = rate
    u.lang = 'en-US'
    let done = false
    const finish = () => {
      if (!done) {
        done = true
        resolve()
      }
    }
    u.onend = finish
    u.onerror = finish
    // Some browsers never fire onend; don't hang the test.
    setTimeout(finish, 1500 + text.length * 90)
    window.speechSynthesis.speak(u)
  })
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel()
}

export function vibrate(ms: number | number[]) {
  try {
    navigator.vibrate?.(ms)
  } catch {
    /* ignore */
  }
}
