// Small SVG charts. No chart library: they're simple, and they have to work offline.

/** Sway "cloud": each dot is one moment of sideways chest acceleration. A tight
 *  cloud means steady balance; a spread-out cloud means more sway. */
export function SwayCloud({
  trace,
  range,
  color = 'var(--accent)',
  size = 132,
  label,
}: {
  trace: [number, number][]
  /** Half-width of the plot in milli-g; share it between plots so they compare fairly. */
  range: number
  color?: string
  size?: number
  label?: string
}) {
  const c = size / 2
  const k = (c - 6) / range
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label ?? 'Sway plot'}>
      <rect x="0.5" y="0.5" width={size - 1} height={size - 1} rx="16" fill="var(--surface-2)" stroke="var(--line)" />
      {[0.33, 0.66, 1].map((f) => (
        <circle key={f} cx={c} cy={c} r={(c - 6) * f} fill="none" stroke="var(--line)" strokeDasharray={f === 1 ? undefined : '2 4'} />
      ))}
      <line x1={c} y1={6} x2={c} y2={size - 6} stroke="var(--line)" />
      <line x1={6} y1={c} x2={size - 6} y2={c} stroke="var(--line)" />
      {trace.map(([x, y], i) => {
        const px = c + Math.max(-range, Math.min(range, x)) * k
        const py = c - Math.max(-range, Math.min(range, y)) * k
        return <circle key={i} cx={px} cy={py} r={1.8} fill={color} opacity={0.55} />
      })}
    </svg>
  )
}

export function swayRange(...traces: [number, number][][]): number {
  let m = 10
  for (const t of traces) for (const [x, y] of t) m = Math.max(m, Math.abs(x), Math.abs(y))
  // robust scale: 99th percentile so a single stumble spike doesn't squash the cloud
  const all = traces.flat().map(([x, y]) => Math.max(Math.abs(x), Math.abs(y))).sort((a, b) => a - b)
  const p99 = all.length ? all[Math.min(all.length - 1, Math.floor(all.length * 0.99))] : m
  return Math.max(10, Math.ceil((p99 * 1.1) / 5) * 5)
}

/** Reaction times as a dot strip with the median marked, baseline vs now. */
export function RTStrip({ rows }: { rows: { label: string; rts: number[]; color: string }[] }) {
  const all = rows.flatMap((r) => r.rts)
  if (!all.length) return null
  const lo = Math.floor(Math.min(...all, 200) / 50) * 50
  const hi = Math.ceil(Math.max(...all, 500) / 50) * 50
  const W = 320
  const pad = 12
  const x = (v: number) => pad + ((v - lo) / (hi - lo)) * (W - pad * 2)
  const rowH = 34
  const H = rows.length * rowH + 22
  const ticks: number[] = []
  for (let v = lo; v <= hi; v += 100) ticks.push(v)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Reaction time comparison">
      {ticks.map((v) => (
        <g key={v}>
          <line x1={x(v)} x2={x(v)} y1={4} y2={H - 18} stroke="var(--line)" />
          <text x={x(v)} y={H - 4} fontSize="10" textAnchor="middle" fill="var(--faint)">
            {v}
          </text>
        </g>
      ))}
      {rows.map((r, i) => {
        const y = 4 + i * rowH + rowH / 2
        const sorted = [...r.rts].sort((a, b) => a - b)
        const med = sorted.length % 2 ? sorted[sorted.length >> 1] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        return (
          <g key={r.label}>
            {r.rts.map((v, j) => (
              <circle key={j} cx={x(v)} cy={y + ((j * 7) % 11) - 5} r={3.2} fill={r.color} opacity={0.5} />
            ))}
            <line x1={x(med)} x2={x(med)} y1={y - 12} y2={y + 12} stroke={r.color} strokeWidth={3} strokeLinecap="round" />
          </g>
        )
      })}
    </svg>
  )
}

/** Tiny trend line for the athlete history. */
export function Sparkline({ values, color = 'var(--accent)', w = 96, h = 28 }: { values: number[]; color?: string; w?: number; h?: number }) {
  const v = values.filter(Number.isFinite)
  if (v.length < 2) return null
  const lo = Math.min(...v)
  const hi = Math.max(...v)
  const pts = v.map((y, i) => [(i / (v.length - 1)) * (w - 4) + 2, h - 2 - ((y - lo) / (hi - lo || 1)) * (h - 4)])
  return (
    <svg width={w} height={h} aria-hidden>
      <polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={2.5} fill={color} />
    </svg>
  )
}
