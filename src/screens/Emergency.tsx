import { Card, Icon, SectionTitle, TopBar } from '../components/ui'
import { OBSERVED_SIGNS, RED_FLAGS } from '../lib/content'
import { EmergencySteps } from './Report'

/** Always one tap away from every screen. */
export function Emergency() {
  return (
    <div>
      <TopBar back="" title="Emergency" />
      <div className="rise rounded-[28px] bg-danger p-6 text-white">
        <div className="text-[30px] font-extrabold leading-tight tracking-tight">Any danger sign? Call 911.</div>
        <a href="tel:911" className="mt-5 flex h-14 items-center justify-center gap-2 rounded-2xl bg-white text-lg font-bold text-danger">
          <Icon name="phone" /> Call 911
        </a>
      </div>
      <SectionTitle className="mt-6">Danger signs</SectionTitle>
      <Card className="overflow-hidden">
        {RED_FLAGS.map((f) => (
          <div key={f.id} className="flex items-center gap-3 border-b border-line px-4 py-3 text-[15px] last:border-0">
            <span className="h-2 w-2 shrink-0 rounded-full bg-danger" />
            {f.label}
          </div>
        ))}
      </Card>
      <EmergencySteps />
      <SectionTitle className="mt-6">Remove from play if you see</SectionTitle>
      <Card className="overflow-hidden">
        {OBSERVED_SIGNS.map((f) => (
          <div key={f.id} className="flex items-center gap-3 border-b border-line px-4 py-3 text-[15px] last:border-0">
            <span className="h-2 w-2 shrink-0 rounded-full bg-warn" />
            {f.label}
          </div>
        ))}
      </Card>
      <div className="h-10" />
    </div>
  )
}
