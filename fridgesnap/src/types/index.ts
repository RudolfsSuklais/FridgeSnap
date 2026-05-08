export type Difficulty = 'easy' | 'medium' | 'hard'

export type IngredientCategory =
  | 'produce'
  | 'dairy'
  | 'protein'
  | 'pantry'
  | 'condiment'
  | 'other'

export interface Ingredient {
  name: string
  amount: string
  unit?: string
}

export interface Recipe {
  id: string
  title: string
  image: string
  cookTime: number
  difficulty: Difficulty
  calories: number
  ingredients: Ingredient[]
  steps: string[]
  matchedIngredients: string[]
  missingIngredients: string[]
  tags: string[]
}

export interface ScannedItem {
  name: string
  category: IngredientCategory
  confidence: number
}

export type GradientVariant = 'sunset' | 'ocean' | 'mint' | 'lavender'
