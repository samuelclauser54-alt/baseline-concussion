import { useRoute } from './lib/router'
import { AthleteDetail } from './screens/AthleteDetail'
import { AthleteForm } from './screens/AthleteForm'
import { DataScreen } from './screens/DataScreen'
import { Emergency } from './screens/Emergency'
import { Home } from './screens/Home'
import { Learn } from './screens/Learn'
import { Pick } from './screens/Pick'
import { Report } from './screens/Report'
import { SessionRunner } from './screens/SessionRunner'

export default function App() {
  const [a, b, c] = useRoute()
  let screen
  if (a === 'athlete' && b === 'new') screen = <AthleteForm />
  else if (a === 'athlete' && b && c === 'edit') screen = <AthleteForm key={b} id={b} />
  else if (a === 'athlete' && b) screen = <AthleteDetail key={b} id={b} />
  else if (a === 'session' && b) screen = <SessionRunner key={b} id={b} />
  else if (a === 'report' && b) screen = <Report key={b} id={b} />
  else if (a === 'pick') screen = <Pick />
  else if (a === 'learn') screen = <Learn />
  else if (a === 'emergency') screen = <Emergency />
  else if (a === 'data') screen = <DataScreen />
  else screen = <Home />

  return <main className="mx-auto min-h-[100dvh] max-w-[560px] px-4">{screen}</main>
}
