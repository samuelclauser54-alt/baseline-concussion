// Small, dependency-free statistics helpers.

export function mean(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN
}

export function median(xs: number[]): number {
  if (!xs.length) return NaN
  const s = [...xs].sort((a, b) => a - b)
  const m = s.length >> 1
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

export function sd(xs: number[]): number {
  if (xs.length < 2) return NaN
  const m = mean(xs)
  return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1))
}

/** Standard normal CDF (Abramowitz–Stegun 7.1.26, error < 1.5e-7). */
export function normalCdf(z: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2)
  const y =
    1 -
    (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t) *
      Math.exp(-(z * z) / 2)
  return z >= 0 ? (1 + y) / 2 : (1 - y) / 2
}

/**
 * One-sided Mann–Whitney U test: is `b` stochastically larger than `a`?
 * Used to ask "are today's reaction times really slower than baseline, or is
 * this just trial-to-trial noise?" Normal approximation with tie correction.
 */
export function mannWhitneyGreater(a: number[], b: number[]): { u: number; z: number; p: number } {
  const n1 = a.length
  const n2 = b.length
  if (n1 < 3 || n2 < 3) return { u: NaN, z: NaN, p: NaN }
  const all = [...a.map((v) => ({ v, g: 0 })), ...b.map((v) => ({ v, g: 1 }))].sort((x, y) => x.v - y.v)
  const ranks = new Array<number>(all.length)
  let tieTerm = 0
  for (let i = 0; i < all.length; ) {
    let j = i
    while (j + 1 < all.length && all[j + 1].v === all[i].v) j++
    const r = (i + j) / 2 + 1
    for (let k = i; k <= j; k++) ranks[k] = r
    const t = j - i + 1
    tieTerm += t ** 3 - t
    i = j + 1
  }
  let r2 = 0
  all.forEach((x, i) => {
    if (x.g === 1) r2 += ranks[i]
  })
  const u2 = r2 - (n2 * (n2 + 1)) / 2
  const n = n1 + n2
  const mu = (n1 * n2) / 2
  const sigma = Math.sqrt(((n1 * n2) / 12) * (n + 1 - tieTerm / (n * (n - 1))))
  // continuity correction
  const z = sigma > 0 ? (u2 - mu - 0.5) / sigma : 0
  return { u: u2, z, p: 1 - normalCdf(z) }
}

export function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x))
}

export function geometricMean(xs: number[]): number {
  if (!xs.length) return NaN
  return Math.exp(mean(xs.map((x) => Math.log(x))))
}
