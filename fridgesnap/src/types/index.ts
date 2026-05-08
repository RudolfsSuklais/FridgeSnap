import type { MealTime } from '../utils/timeOfDay'

export type Difficulty = 'easy' | 'medium' | 'hard'

export type IngredientCategory =
  | 'produce'
  | 'dairy'
  | 'protein'
  | 'pantry'
  | 'condiment'
  | 'spice'
  | 'other'

export interface Ingredient {
  name: string
  amount: string
  unit?: string
  category?: IngredientCategory
  /** True for items always assumed to be on hand (salt, pepper, water, neutral oil). */
  isBasic?: boolean
}

export type StoreName = 'rimi' | 'maxima' | 'lidl'

export type UpsellType = 'generic' | 'specific'

export interface StoreUpsell {
  id: string
  name: string
  description: string
  /** Why a cook should add this — shown as the upsell pitch. */
  reason: string
  price: number
  currency: 'EUR'
  store: StoreName
  imageUrl: string
  /** Real search/category URL on the store's site. Falls back to the homepage when no public catalog search exists. */
  searchUrl: string
  type: UpsellType
}

export type MatchType = 'perfect' | 'almost'

export interface Recipe {
  id: string
  title: string
  image: string
  cookTime: number
  difficulty: Difficulty
  calories: number
  ingredients: Ingredient[]
  steps: string[]
  tags: string[]
  cuisine: string
  matchType: MatchType
  upsells: StoreUpsell[]
  /** Meal-time slots this recipe fits into (1+ of breakfast/brunch/lunch/snack/dinner). */
  mealTimes: MealTime[]
  /** Backwards-compat: populated at module load via the matching util. UI can keep reading these. */
  matchedIngredients: string[]
  missingIngredients: string[]
}

export interface ScannedItem {
  name: string
  category: IngredientCategory
  confidence: number
}

export type GradientVariant = 'sunset' | 'ocean' | 'mint' | 'lavender'

export interface ActiveTimer {
  id: string
  recipeId: string
  stepIdx: number
  label: string
  startedAt: number
  endsAt: number
  durationMinutes: number
}

export type Rating = 1 | 2 | 3 | 4 | 5

export interface CookedEntry {
  id: string
  recipeId: string
  recipeTitle: string
  /** Base64 data URL — JPEG, max 1080 px long edge, quality 0.85. */
  photoDataURL: string
  rating: Rating
  note?: string
  /** ISO 8601 string. */
  cookedAt: string
}

export interface ParsedTimerHint {
  minutes: number
  label: string
}
