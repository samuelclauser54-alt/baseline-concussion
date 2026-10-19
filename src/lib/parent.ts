// Message to a parent or guardian after a sideline check. Nebraska's
// Concussion Awareness Act (LB 260) requires the coach to notify a parent when
// an athlete is removed for a suspected concussion. Written at a plain-language
// level, in English and Spanish (many Omaha families speak Spanish at home).
// Results are described by area, not test scores, so both languages say the same thing.

import type { Verdict } from './scoring'

export type Lang = 'en' | 'es'

interface Args {
  athlete: string
  /** Session start time (ms); formatted in the message's language. */
  when: number
  context?: string
  verdict: Verdict
  /** Domains (Finding.domain) that were flagged. Listed in plain words, not test scores. */
  flaggedDomains: string[]
  coach?: string
}

const T = {
  en: {
    hello: 'Hello,',
    intro: (a: Args) => `This is a message about ${a.athlete} from practice/game on ${day(a.when, 'en')}.`,
    what: (c: string) => `What happened: ${c}`,
    removed: (a: Args) =>
      `${a.athlete} was removed from play because of signs of a possible concussion. A sideline screening found changes from their healthy baseline in:`,
    emergency: (a: Args) => `${a.athlete} showed a danger sign after a hit, and emergency services were called.`,
    noChange: (a: Args) =>
      `${a.athlete} had a hit during practice/game. A sideline screening found no changes from their healthy baseline. This does NOT rule out a concussion, because symptoms can appear hours later.`,
    law: 'Nebraska law: an athlete removed for a suspected concussion cannot return to practice or games until a licensed health-care provider gives written, signed clearance AND a parent or guardian gives written permission.',
    nextTitle: 'Next steps',
    next: [
      'Have them seen by a doctor or other licensed health-care provider.',
      'Rest today. Light activity that does not make symptoms worse is OK after 24 to 48 hours.',
      'Short periods of reading or screens are OK if they do not make symptoms worse. Let teachers know; schoolwork may need to be reduced for a while.',
      'No driving until a provider says it is safe.',
    ],
    watchTitle: 'Go to the emergency room or call 911 if any of these appear tonight or in the next few days:',
    watch: [
      'Headache that gets worse or is severe',
      'Vomiting more than once',
      'Very drowsy or hard to wake up',
      'Confusion, slurred speech, or acting strange',
      'Weakness, numbness, or tingling in arms or legs',
      'Seizure',
      'Double vision',
    ],
    noChangeWatch: 'Please watch for headache, dizziness, nausea, trouble concentrating, or feeling "foggy" over the next 24 hours. If any appear, keep them out of sports and see a doctor.',
    footer: 'This message was made with Baseline, a free screening tool for coaches. It is not a diagnosis.',
    sign: (c?: string) => (c ? `- ${c}` : '- Coach'),
  },
  es: {
    hello: 'Hola,',
    intro: (a: Args) => `Este es un mensaje sobre ${a.athlete} de la práctica o el partido del ${day(a.when, 'es')}.`,
    what: (c: string) => `Lo que pasó: ${c}`,
    removed: (a: Args) =>
      `Sacamos a ${a.athlete} del juego porque mostró señales de una posible conmoción cerebral. Una prueba al lado de la cancha mostró cambios en:`,
    emergency: (a: Args) => `${a.athlete} mostró una señal de peligro después de un golpe y llamamos a los servicios de emergencia.`,
    noChange: (a: Args) =>
      `${a.athlete} recibió un golpe durante la práctica o el partido. Una prueba al lado de la cancha no encontró cambios comparado con su prueba de base (cuando estaba sano/a). Esto NO descarta una conmoción cerebral, porque los síntomas pueden aparecer horas después.`,
    law: 'Ley de Nebraska: un atleta retirado por una posible conmoción cerebral no puede volver a practicar ni jugar hasta que un proveedor de salud con licencia lo autorice por escrito y con su firma, Y un padre, madre o tutor dé su permiso por escrito.',
    nextTitle: 'Próximos pasos',
    next: [
      'Llévelo/a a un médico u otro proveedor de salud con licencia.',
      'Hoy debe descansar. Después de 24 a 48 horas, puede hacer actividad ligera si no empeora los síntomas.',
      'Puede leer o usar pantallas por ratos cortos si no empeoran los síntomas. Avise a sus maestros; es posible que necesite menos tareas por un tiempo.',
      'No debe manejar hasta que un proveedor de salud diga que es seguro.',
    ],
    watchTitle: 'Vaya a la sala de emergencias o llame al 911 si aparece cualquiera de estas señales esta noche o en los próximos días:',
    watch: [
      'Dolor de cabeza fuerte o que empeora',
      'Vomita más de una vez',
      'Mucho sueño o es difícil despertarlo/a',
      'Confusión, habla arrastrada o comportamiento extraño',
      'Debilidad, entumecimiento u hormigueo en brazos o piernas',
      'Convulsiones',
      'Visión doble',
    ],
    noChangeWatch: 'Por favor, esté atento/a a dolor de cabeza, mareo, náuseas, dificultad para concentrarse o sentirse "nublado/a" durante las próximas 24 horas. Si aparece alguno, no debe hacer deporte y debe ver a un médico.',
    footer: 'Este mensaje fue creado con Baseline, una herramienta gratuita de evaluación para entrenadores. No es un diagnóstico.',
    sign: (c?: string) => (c ? `- ${c}` : '- Entrenador/a'),
  },
} as const

const AREAS: Record<Lang, Record<string, string>> = {
  en: {
    signs: 'signs seen by the coach',
    symptoms: 'symptoms',
    cognitive: 'memory and concentration',
    reaction: 'reaction time',
    balance: 'balance',
    vestibular: 'eyes and motion',
  },
  es: {
    signs: 'señales que vio el entrenador',
    symptoms: 'síntomas',
    cognitive: 'memoria y concentración',
    reaction: 'tiempo de reacción',
    balance: 'equilibrio',
    vestibular: 'ojos y movimiento',
  },
}

function day(t: number, lang: Lang) {
  return new Date(t).toLocaleDateString(lang === 'es' ? 'es-US' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

export function parentMessage(lang: Lang, a: Args): string {
  const t = T[lang]
  const out: string[] = [t.hello, '', t.intro(a)]
  if (a.context && lang === 'en') out.push(t.what(a.context))
  out.push('')
  if (a.verdict === 'emergency') {
    out.push(t.emergency(a))
  } else if (a.verdict === 'remove') {
    out.push(t.removed(a))
    for (const d of a.flaggedDomains) out.push(`• ${AREAS[lang][d] ?? d}`)
  } else {
    out.push(t.noChange(a), '', t.noChangeWatch)
  }
  if (a.verdict === 'remove' || a.verdict === 'emergency') {
    out.push('', t.law, '', `${t.nextTitle}:`)
    t.next.forEach((n, i) => out.push(`${i + 1}. ${n}`))
  }
  out.push('', t.watchTitle)
  for (const w of t.watch) out.push(`• ${w}`)
  out.push('', t.sign(a.coach), '', t.footer)
  return out.join('\n')
}
