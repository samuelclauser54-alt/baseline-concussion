// A short, human-readable description of the device a session was recorded on.
// Touchscreen latency and motion sensors differ between phones, so reaction
// time and sway are only comparable when baseline and check use the same device.
// Nothing here identifies a person; it's the kind of info any website can read.

export function deviceLabel(): string {
  if (typeof navigator === 'undefined') return 'Unknown device'
  const ua = navigator.userAgent
  const touch = navigator.maxTouchPoints > 0
  let model = 'Computer'
  if (/iPhone/.test(ua)) model = 'iPhone'
  else if (/iPad/.test(ua) || (/Macintosh/.test(ua) && touch)) model = 'iPad'
  else if (/Android/.test(ua)) model = (/Android [\d.]+; ([^;)]+?)(?: Build|\))/.exec(ua)?.[1] ?? 'Android').trim()
  else if (/Mac/.test(ua)) model = 'Mac'
  else if (/Windows/.test(ua)) model = 'Windows PC'
  else if (/CrOS/.test(ua)) model = 'Chromebook'
  // Screen size distinguishes most phone models without fingerprinting anyone.
  const w = Math.min(screen.width, screen.height)
  const h = Math.max(screen.width, screen.height)
  return `${model} · ${w}×${h}`
}

/** True only when both sessions recorded a device and it differs. */
export function differentDevice(a?: string, b?: string): boolean {
  return !!a && !!b && a !== b
}
