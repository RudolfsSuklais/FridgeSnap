export type MealTime = 'breakfast' | 'brunch' | 'lunch' | 'snack' | 'dinner'

export interface MealTimeSuggestion {
  /** Single best suggestion for the current hour. */
  primary: MealTime
  /** Other plausible options for the same hour, in priority order. */
  alternatives: MealTime[]
  /** Friendly greeting line (e.g. "Time for breakfast"). */
  greeting: string
  /** Single emoji that represents the primary meal time. */
  emoji: string
}

const META: Record<MealTime, { greeting: string; emoji: string; label: string }> = {
  breakfast: { greeting: 'Time for breakfast', emoji: '☀️', label: 'Breakfast' },
  brunch: { greeting: "Brunch o'clock", emoji: '🍳', label: 'Brunch' },
  lunch: { greeting: 'Lunch break', emoji: '🥗', label: 'Lunch' },
  snack: { greeting: 'Snack time', emoji: '☕', label: 'Snack' },
  dinner: { greeting: 'Dinner time', emoji: '🍝', label: 'Dinner' },
}

export function getMealTimeLabel(meal: MealTime): string {
  return META[meal].label
}

export function getMealTimeEmoji(meal: MealTime): string {
  return META[meal].emoji
}

/**
 * Time-of-day → meal suggestion.
 *
 * Buckets:
 *   05:00–10:00 → breakfast (alt: brunch)
 *   10:00–11:30 → brunch    (alt: breakfast, lunch)
 *   11:30–14:30 → lunch     (alt: brunch)
 *   14:30–17:00 → snack     (alt: lunch)
 *   17:00–22:00 → dinner    (alt: snack)
 *   22:00–05:00 → snack     (alt: dinner)
 */
export function getMealTimeSuggestion(date: Date = new Date()): MealTimeSuggestion {
  const minutes = date.getHours() * 60 + date.getMinutes()

  let primary: MealTime
  let alternatives: MealTime[]

  if (minutes >= 5 * 60 && minutes < 10 * 60) {
    primary = 'breakfast'
    alternatives = ['brunch']
  } else if (minutes >= 10 * 60 && minutes < 11 * 60 + 30) {
    primary = 'brunch'
    alternatives = ['breakfast', 'lunch']
  } else if (minutes >= 11 * 60 + 30 && minutes < 14 * 60 + 30) {
    primary = 'lunch'
    alternatives = ['brunch']
  } else if (minutes >= 14 * 60 + 30 && minutes < 17 * 60) {
    primary = 'snack'
    alternatives = ['lunch']
  } else if (minutes >= 17 * 60 && minutes < 22 * 60) {
    primary = 'dinner'
    alternatives = ['snack']
  } else {
    // 22:00–04:59
    primary = 'snack'
    alternatives = ['dinner']
  }

  return {
    primary,
    alternatives,
    greeting: META[primary].greeting,
    emoji: META[primary].emoji,
  }
}

/** Format a Date as "HH:MM" using device local time. */
export function formatClockTime(date: Date = new Date()): string {
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

// ---------------------------------------------------------------------------
// Persistent selected-meal-time store.
//
// Lives in localStorage so the choice survives navigation without depending
// on ScanContext. Each consumer reads via getStoredMealTime() on mount and
// writes via setStoredMealTime().
// ---------------------------------------------------------------------------

const LS_SELECTED_MEAL_TIME = 'fridgesnap.selectedMealTime'

const ALL_MEAL_TIMES: readonly MealTime[] = [
  'breakfast',
  'brunch',
  'lunch',
  'snack',
  'dinner',
]

export function getStoredMealTime(): MealTime | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(LS_SELECTED_MEAL_TIME)
    if (raw && (ALL_MEAL_TIMES as readonly string[]).includes(raw)) {
      return raw as MealTime
    }
    return null
  } catch {
    return null
  }
}

export function setStoredMealTime(mealTime: MealTime): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(LS_SELECTED_MEAL_TIME, mealTime)
  } catch {
    // ignore — quota or privacy mode
  }
}

export function clearStoredMealTime(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(LS_SELECTED_MEAL_TIME)
  } catch {
    // ignore
  }
}
