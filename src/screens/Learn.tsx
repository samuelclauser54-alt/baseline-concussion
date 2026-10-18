import type { ReactNode } from 'react'
import { Card, SectionTitle, TopBar } from '../components/ui'
import { Footer } from './Home'

export function Learn() {
  return (
    <div>
      <TopBar back="" title="How it works" />

      <div className="rise">
        <h1 className="text-[28px] font-bold leading-tight tracking-tight">Why Baseline exists</h1>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Stat big="63%" small="of US public high schools don’t have a full-time athletic trainer" />
          <Stat big="~1 in 2" small="concussions in high-school football go unreported" />
        </div>
        <p className="mt-4 text-[15px] leading-relaxed text-muted">
          When no trainer is there, a coach has to decide whether a kid who took a hit goes back in. Commercial
          concussion apps usually cost money and need accounts. Baseline packs the same evidence-based tests into a free
          phone app that works offline.
        </p>
      </div>

      <SectionTitle className="mt-8">The idea: compare to yourself</SectionTitle>
      <Card className="p-5 text-[15px] leading-relaxed text-muted">
        People differ a lot. Some are naturally slower or wobblier than others. So Baseline records each athlete’s{' '}
        <b className="text-ink">healthy baseline</b> before the season. After a hit, it runs the same tests and looks for
        changes <i>for that person</i>. Big concussion studies found that a same-season baseline gives the most accurate
        results.
      </Card>

      <SectionTitle className="mt-8">The six checks</SectionTitle>
      <Card className="divide-y divide-line">
        <Domain n="1" title="Danger signs" src="Concussion Recognition Tool">
          Red flags like neck pain, seizure, or worsening headache → call 911. Visible signs like a blank stare → remove from play.
        </Domain>
        <Domain n="2" title="Symptoms" src="SCAT symptom scale">
          22 symptoms rated 0–6. The single most accurate sideline measure (AUC 0.93 in a 2024 NCAA study).
        </Domain>
        <Domain n="3" title="Memory & thinking" src="Standardized Assessment of Concussion">
          Orientation, a 10-word list (3 trials + delayed recall), digits backward, and months in reverse.
        </Domain>
        <Domain n="4" title="Reaction time" src="Go/no-go task">
          24 rounds of tap-on-green, don’t-tap-on-red, timed to the millisecond. Uses a statistical test against the baseline trials.
        </Domain>
        <Domain n="5" title="Balance" src="Modified BESS + phone accelerometer">
          Three 20-second stances with eyes closed. Instead of a person counting wobbles, the phone measures sway objectively.
        </Domain>
        <Domain n="6" title="Eyes & motion" src="VOMS (Mucha et al., 2014)">
          Eye tracking, head turns, and body rotation, with symptom ratings after each. A rise of 2+ points is positive. AUC 0.89 in the original study.
        </Domain>
      </Card>

      <SectionTitle className="mt-8">How accurate is it?</SectionTitle>
      <Card className="p-5 text-[15px] leading-relaxed">
        <p className="text-muted">
          No single test is reliable alone. Each one misses some concussions, but different concussions show up on
          different tests. Research shows combining them works much better:
        </p>
        <div className="my-4 space-y-2.5">
          <Bar label="Balance alone" value={62} src="Broglio 2007" />
          <Bar label="Symptoms alone" value={68} src="Broglio 2007" />
          <Bar label="Symptoms (2-pt rise)" value={86} src="Harmon 2024" />
          <Bar label="3-test battery" value={100} src="Resch 2016" note="clinical guidelines" />
        </div>
        <p className="text-muted">
          Baseline flags an athlete if <b className="text-ink">any</b> domain changes, so it is built to miss as few
          concussions as possible. The trade-off is more false alarms. Based on these studies, we estimate it catches{' '}
          <b className="text-ink">roughly 85–95%</b> of concussions when a valid baseline exists and the check happens the
          same day.
        </p>
        <p className="mt-3 rounded-2xl bg-warn-soft p-3 text-sm text-warn">
          That is an estimate from published research on these same tests. Baseline itself has not been clinically
          validated. Our reliability study is described in the project’s GitHub repo.
        </p>
      </Card>

      <SectionTitle className="mt-8">Nebraska law</SectionTitle>
      <Card className="p-5 text-[15px] leading-relaxed text-muted">
        Under the <b className="text-ink">Concussion Awareness Act</b> (LB 260, 2011; return-to-learn added in 2014), an
        athlete reasonably suspected of a concussion must be <b className="text-ink">removed from play</b>, a parent or
        guardian must be told, and the athlete can’t return until a licensed health-care provider gives{' '}
        <b className="text-ink">written, signed clearance</b> and a parent gives written permission. Baseline helps with
        the first two steps. It never replaces the third.
      </Card>

      <SectionTitle className="mt-8">Privacy</SectionTitle>
      <Card className="p-5 text-[15px] leading-relaxed text-muted">
        No accounts, no servers, no tracking. Everything is saved only on this phone. You can export a backup or delete
        any athlete at any time. Once loaded, the app works with no internet connection.
      </Card>

      <SectionTitle className="mt-8">Sources</SectionTitle>
      <Card className="p-5 text-sm leading-relaxed text-muted">
        <ul className="space-y-1.5">
          <li>Pryor et al. Athletic training services in public secondary schools. J Athl Train, 2015.</li>
          <li>McCrea et al. Unreported concussion in high school football players. Clin J Sport Med, 2004.</li>
          <li>Harmon et al. Diagnosis of sports-related concussion using symptom report or SAC. JAMA Netw Open, 2024.</li>
          <li>Broglio et al. Sensitivity of the concussion assessment battery. Neurosurgery, 2007.</li>
          <li>Resch et al. Three tests are better than one. BMJ Open Sport Exerc Med, 2016.</li>
          <li>Mucha et al. A brief Vestibular/Ocular Motor Screening (VOMS) assessment. Am J Sports Med, 2014.</li>
          <li>McCrea. Standardized mental status testing on the sideline. J Athl Train, 2001.</li>
          <li>Patricios et al. Consensus statement on concussion in sport (Amsterdam 2022). Br J Sports Med, 2023.</li>
          <li>Nebraska Concussion Awareness Act, LB 260 (2011).</li>
        </ul>
      </Card>
      <Footer />
    </div>
  )
}

function Stat({ big, small }: { big: string; small: string }) {
  return (
    <Card className="p-4">
      <div className="text-[30px] font-extrabold leading-none tracking-tight text-accent">{big}</div>
      <div className="mt-2 text-sm leading-snug text-muted">{small}</div>
    </Card>
  )
}

function Domain({ n, title, src, children }: { n: string; title: string; src: string; children: ReactNode }) {
  return (
    <div className="flex gap-3 p-4">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent-soft text-sm font-bold text-accent">{n}</span>
      <div>
        <div className="font-semibold">{title}</div>
        <div className="text-xs font-medium text-faint">{src}</div>
        <div className="mt-1 text-sm leading-relaxed text-muted">{children}</div>
      </div>
    </div>
  )
}

function Bar({ label, value, src, note }: { label: string; value: number; src: string; note?: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="font-semibold tabular">{value}% sensitivity</span>
      </div>
      <div className="h-2.5 rounded-full bg-surface-2">
        <div className="h-full rounded-full bg-accent" style={{ width: `${value}%` }} />
      </div>
      <div className="mt-0.5 text-xs text-faint">{src}{note ? ` · ${note}` : ''}</div>
    </div>
  )
}
