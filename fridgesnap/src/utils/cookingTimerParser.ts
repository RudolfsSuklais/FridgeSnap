import type { ParsedTimerHint } from '../types'

const ACTION_VERBS = [
  'simmer',
  'bake',
  'roast',
  'fry',
  'boil',
  'steam',
  'cook',
  'rest',
  'chill',
  'marinate',
  'sauté',
  'saute',
  'broil',
  'grill',
  'reduce',
  'whisk',
  'knead',
] as const

const RANGE_RE = /(\d+)\s*(?:to|-|–|—)\s*(\d+)\s*(min(?:ute)?s?|hours?|hrs?|hr)/i
const SINGLE_RE = /(\d+)\s*(min(?:ute)?s?|hours?|hrs?|hr)/i

function unitToMinutes(value: number, unit: string): number {
  return /h/i.test(unit) ? value * 60 : value
}

function findLabel(text: string): string {
  const lower = text.toLowerCase()
  for (const verb of ACTION_VERBS) {
    if (lower.includes(verb)) {
      return verb.charAt(0).toUpperCase() + verb.slice(1)
    }
  }
  return 'Timer'
}

/**
 * Detect a duration hint inside a recipe step. Returns the worst-case
 * minutes for ranges so the timer reflects the longer end. Pure / no I/O.
 */
export function detectTimer(stepText: string): ParsedTimerHint | null {
  const range = RANGE_RE.exec(stepText)
  if (range) {
    const high = Number.parseInt(range[2], 10)
    if (Number.isFinite(high) && high > 0) {
      return { minutes: unitToMinutes(high, range[3]), label: findLabel(stepText) }
    }
  }
  const single = SINGLE_RE.exec(stepText)
  if (single) {
    const n = Number.parseInt(single[1], 10)
    if (Number.isFinite(n) && n > 0) {
      return { minutes: unitToMinutes(n, single[2]), label: findLabel(stepText) }
    }
  }
  return null
}

// Dev-only smoke checks. Throws at module load if a regression is introduced.
if (import.meta.env.DEV) {
  const cases: Array<[string, ParsedTimerHint | null]> = [
    ['Simmer the sauce for 10 minutes.', { minutes: 10, label: 'Simmer' }],
    ['Bake at 200°C for 25-30 min.', { minutes: 30, label: 'Bake' }],
    ['Cook for 1 hour.', { minutes: 60, label: 'Cook' }],
    ['Rest 5 mins.', { minutes: 5, label: 'Rest' }],
    ['Chop the onion finely.', null],
    ['Add salt to taste.', null],
  ]
  for (const [input, expected] of cases) {
    const got = detectTimer(input)
    const ok =
      (got === null && expected === null) ||
      (got !== null &&
        expected !== null &&
        got.minutes === expected.minutes &&
        got.label === expected.label)
    if (!ok) {
      throw new Error(
        `cookingTimerParser smoke check failed for "${input}": got ${JSON.stringify(got)}, expected ${JSON.stringify(expected)}`,
      )
    }
  }
}
