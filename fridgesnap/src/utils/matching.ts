import type { Ingredient, MatchType, Recipe, ScannedItem } from '../types'

/**
 * Normalize an ingredient/scanned-item name for fuzzy comparison.
 *
 * - lowercase + trim
 * - strip common pluralisation (`tomatoes` → `tomato`, `eggs` → `egg`, `berries` → `berry`)
 * - collapse whitespace
 *
 * Intentionally NOT trying to handle synonyms (no scallion↔green-onion mapping).
 */
export function normalizeName(raw: string): string {
  let s = raw.toLowerCase().trim().replace(/\s+/g, ' ')
  if (s.endsWith('ies') && s.length > 4) {
    s = s.slice(0, -3) + 'y'
  } else if (s.endsWith('es') && s.length > 3) {
    // tomatoes → tomato, but also boxes → box; both fine for our matching.
    s = s.slice(0, -2)
  } else if (s.endsWith('s') && s.length > 2 && !s.endsWith('ss')) {
    s = s.slice(0, -1)
  }
  return s
}

function buildScannedSet(scanned: ScannedItem[]): string[] {
  return scanned.map((s) => normalizeName(s.name))
}

function isIngredientScanned(
  ingredient: Ingredient,
  scannedNormalized: string[],
): boolean {
  const ingNorm = normalizeName(ingredient.name)
  return scannedNormalized.some(
    (s) => s === ingNorm || s.includes(ingNorm) || ingNorm.includes(s),
  )
}

/** Recipe ingredients that are present (or derivable) in the scanned fridge. Excludes basics. */
export function getMatchedIngredients(
  recipe: Recipe,
  scanned: ScannedItem[],
): Ingredient[] {
  const set = buildScannedSet(scanned)
  return recipe.ingredients.filter(
    (i) => !i.isBasic && isIngredientScanned(i, set),
  )
}

/** Non-basic ingredients NOT in the scanned fridge — what the cook would still need to buy. */
export function getMissingIngredients(
  recipe: Recipe,
  scanned: ScannedItem[],
): Ingredient[] {
  const set = buildScannedSet(scanned)
  return recipe.ingredients.filter(
    (i) => !i.isBasic && !isIngredientScanned(i, set),
  )
}

/**
 * `perfect`     — every non-basic ingredient is matched
 * `almost`      — 1–2 non-basic ingredients missing
 * `incomplete`  — 3+ missing
 */
export function computeMatchType(
  recipe: Recipe,
  scanned: ScannedItem[],
): MatchType | 'incomplete' {
  const missing = getMissingIngredients(recipe, scanned).length
  if (missing === 0) return 'perfect'
  if (missing <= 2) return 'almost'
  return 'incomplete'
}

/**
 * Sort recipes for display: perfect → almost → incomplete.
 * Within each tier, preserves source order, then breaks ties by ascending cookTime.
 */
export function rankRecipesByMatch(
  recipes: Recipe[],
  scanned: ScannedItem[],
): Recipe[] {
  const tier = (r: Recipe): number => {
    const t = computeMatchType(r, scanned)
    if (t === 'perfect') return 0
    if (t === 'almost') return 1
    return 2
  }

  return recipes
    .map((r, idx) => ({ r, idx, tierVal: tier(r) }))
    .sort((a, b) => {
      if (a.tierVal !== b.tierVal) return a.tierVal - b.tierVal
      if (a.r.cookTime !== b.r.cookTime) return a.r.cookTime - b.r.cookTime
      return a.idx - b.idx
    })
    .map(({ r }) => r)
}
