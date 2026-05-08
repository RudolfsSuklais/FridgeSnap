import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  ChefHat,
  ChevronLeft,
  Crown,
  Heart,
  Pencil,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react'
import { GradientBackground } from '../components/layout/GradientBackground'
import { GlassButton } from '../components/ui/GlassButton'
import { GlassCard } from '../components/ui/GlassCard'
import {
  SwipeCard,
  type SwipeCardHandle,
} from '../components/swipe/SwipeCard'
import { useScan } from '../contexts/ScanContext'
import { recipes } from '../data/mockData'
import type { Recipe } from '../types'
import {
  getMealTimeEmoji,
  getMealTimeLabel,
  getStoredMealTime,
  type MealTime,
} from '../utils/timeOfDay'
import { rankRecipesByMatch } from '../utils/matching'


interface MatchInfo {
  matched: string[]
  missing: string[]
}

function computeMatches(recipe: Recipe, userSet: Set<string>): MatchInfo {
  if (userSet.size === 0) {
    return {
      matched: recipe.matchedIngredients,
      missing: recipe.missingIngredients,
    }
  }
  const matched: string[] = []
  const missing: string[] = []
  for (const ing of recipe.ingredients) {
    if (userSet.has(ing.name.toLowerCase())) matched.push(ing.name)
    else missing.push(ing.name)
  }
  return { matched, missing }
}

export function Results() {
  const navigate = useNavigate()
  const {
    items: scanned,
    actions,
    recordSwipe,
    reset,
  } = useScan()
  // Read selected meal-time once on mount; the screen remounts (per the
  // app-level AnimatePresence keyed on pathname) when the user revises.
  const [selectedMealTime] = useState<MealTime | null>(() =>
    getStoredMealTime(),
  )
  // Per-id callback refs. Avoids the bug where a single shared topCardRef gets
  // nulled out when the just-swiped card unmounts (~180ms after exit), wiping
  // the new top card's handle that was registered during the prior commit.
  const cardHandles = useRef(new Map<string, SwipeCardHandle>())
  const cardRefCbs = useRef(new Map<string, (h: SwipeCardHandle | null) => void>())
  const refFor = (id: string) => {
    let cb = cardRefCbs.current.get(id)
    if (!cb) {
      cb = (handle) => {
        if (handle) cardHandles.current.set(id, handle)
        else cardHandles.current.delete(id)
      }
      cardRefCbs.current.set(id, cb)
    }
    return cb
  }

  const userSet = useMemo(
    () => new Set(scanned.map((s) => s.name.toLowerCase())),
    [scanned],
  )

  // Source pile: ranked by match quality, narrowed by selected meal-time,
  // capped at the 5-recipe free-tier limit. May yield <5 for narrow tags.
  const sourcePile = useMemo<Recipe[]>(() => {
    let pool = rankRecipesByMatch(recipes, scanned)
    if (selectedMealTime) {
      pool = pool.filter((r) => r.mealTimes.includes(selectedMealTime))
    }
    return pool.slice(0, 5)
  }, [scanned, selectedMealTime])

  const pile = useMemo<Recipe[]>(
    () => sourcePile.filter((r) => !actions[r.id]),
    [sourcePile, actions],
  )
  const initialPileSize = sourcePile.length
  const swipedCount = initialPileSize - pile.length
  const visible = pile.slice(0, 3)
  const top = pile[0]

  const handleSwipe = (recipe: Recipe, direction: 'left' | 'right') => {
    recordSwipe(recipe.id, direction === 'right' ? 'saved' : 'skipped')
  }

  const handleSkipButton = () => {
    const t = pile[0]
    if (t) cardHandles.current.get(t.id)?.triggerSwipe('left')
  }
  const handleSaveButton = () => {
    const t = pile[0]
    if (t) cardHandles.current.get(t.id)?.triggerSwipe('right')
  }
  const handleInfoButton = () => {
    if (top) navigate(`/recipe/${top.id}`)
  }
  const handleCardTap = (recipe: Recipe) => navigate(`/recipe/${recipe.id}`)

  const handleScanAgain = () => {
    reset()
    navigate('/scan/fridge')
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      <GradientBackground variant="lavender" />

      <div className="relative z-10 flex h-full w-full flex-col px-5 pb-8 pt-14">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/home')}
            aria-label="Back home"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/55 text-ink-900 shadow-glass-sm backdrop-blur-md backdrop-saturate-180"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2.25} />
          </button>

          <ProgressDots total={initialPileSize} swiped={swipedCount} />

          <span className="inline-flex items-center gap-1 rounded-full border border-white/40 bg-white/55 px-2.5 py-1 text-[11px] font-semibold text-ink-700 shadow-glass-sm backdrop-blur-md">
            <Sparkles className="h-3 w-3 text-ink-500" strokeWidth={2.25} />
            {Math.max(0, initialPileSize - swipedCount)} free
          </span>
        </div>

        {/* Selected meal-time chip — tap to revise */}
        {selectedMealTime && (
          <motion.button
            type="button"
            onClick={() => navigate('/scan/meal-time')}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28, delay: 0.05 }}
            whileTap={{ scale: 0.97 }}
            className="mt-3 inline-flex w-fit items-center gap-1.5 self-start rounded-full border border-white/45 bg-white/55 px-2.5 py-1 text-[11.5px] font-semibold text-ink-700 shadow-glass-sm backdrop-blur-md backdrop-saturate-180"
          >
            <span className="text-[14px] leading-none">
              {getMealTimeEmoji(selectedMealTime)}
            </span>
            <span>
              Showing {getMealTimeLabel(selectedMealTime).toLowerCase()} recipes
            </span>
            <Pencil className="h-3 w-3 text-ink-500" strokeWidth={2.25} />
          </motion.button>
        )}

        {/* Card stack area */}
        <div className="relative flex flex-1 items-center justify-center">
          <div className="relative h-[460px] w-full max-w-[300px]">
            {pile.length > 0 ? (
              <AnimatePresence mode="popLayout">
                {visible.map((recipe, i) => {
                  const { matched, missing } = computeMatches(recipe, userSet)
                  return (
                    <SwipeCard
                      key={recipe.id}
                      ref={refFor(recipe.id)}
                      recipe={recipe}
                      depth={i}
                      isActive={i === 0}
                      matched={matched}
                      missing={missing}
                      onSwipe={(dir) => handleSwipe(recipe, dir)}
                      onTap={() => handleCardTap(recipe)}
                    />
                  )
                })}
              </AnimatePresence>
            ) : (
              <EmptyState
                savedRecipes={recipes.filter((r) => actions[r.id] === 'saved')}
                onGetPro={() => navigate('/paywall')}
                onScanAgain={handleScanAgain}
                onPickRecipe={(id) => navigate(`/recipe/${id}`)}
              />
            )}
          </div>
        </div>

        {/* Action buttons */}
        <AnimatePresence>
          {pile.length > 0 ? (
            <motion.div
              key="actions"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="mt-4 flex items-center justify-center gap-3"
            >
              <ActionButton
                tone="skip"
                ariaLabel="Skip recipe"
                onClick={handleSkipButton}
              >
                <X className="h-7 w-7" strokeWidth={2.5} />
              </ActionButton>
              <CookCTA onClick={handleInfoButton} />
              <ActionButton
                tone="save"
                ariaLabel="Save recipe"
                onClick={handleSaveButton}
              >
                <Heart className="h-6 w-6" strokeWidth={2.5} />
              </ActionButton>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  )
}

interface ProgressDotsProps {
  total: number
  swiped: number
}

function ProgressDots({ total, swiped }: ProgressDotsProps) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => {
        const isSwiped = i < swiped
        return (
          <motion.span
            key={i}
            animate={{
              opacity: isSwiped ? 0.3 : 1,
              scale: isSwiped ? 0.85 : 1,
            }}
            transition={{ type: 'spring', stiffness: 360, damping: 26 }}
            className="block h-1.5 w-5 rounded-full bg-ink-900"
          />
        )
      })}
    </div>
  )
}

type ActionTone = 'skip' | 'save'

interface ActionButtonProps {
  tone: ActionTone
  ariaLabel: string
  onClick: () => void
  children: React.ReactNode
}

const ACTION_TONE: Record<ActionTone, string> = {
  skip: 'border-rose-200/80 bg-white/85 text-rose-500 hover:bg-rose-50',
  save: 'border-emerald-200/80 bg-white/85 text-emerald-500 hover:bg-emerald-50',
}

function ActionButton({ tone, ariaLabel, onClick, children }: ActionButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      whileTap={{ scale: 0.9 }}
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 500, damping: 26 }}
      className={[
        'flex h-14 w-14 items-center justify-center rounded-full border shadow-glass-md backdrop-blur-xl backdrop-saturate-180',
        ACTION_TONE[tone],
      ].join(' ')}
    >
      {children}
    </motion.button>
  )
}

interface CookCTAProps {
  onClick: () => void
}

function CookCTA({ onClick }: CookCTAProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label="View recipe and cook"
      whileTap={{ scale: 0.92 }}
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 500, damping: 26 }}
      className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-glass-lg ring-[3px] ring-white/65"
    >
      <ChefHat
        className="h-6 w-6 drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
        strokeWidth={2.25}
      />
    </motion.button>
  )
}

interface EmptyStateProps {
  savedRecipes: Recipe[]
  onGetPro: () => void
  onScanAgain: () => void
  onPickRecipe: (id: string) => void
}

function EmptyState({
  savedRecipes,
  onGetPro,
  onScanAgain,
  onPickRecipe,
}: EmptyStateProps) {
  const savedCount = savedRecipes.length
  return (
    <motion.div
      key="empty"
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 280, damping: 26, delay: 0.2 }}
      className="absolute inset-0 flex items-center justify-center"
    >
      <GlassCard
        tone="light"
        blur="lg"
        className="no-scrollbar max-h-full w-full overflow-y-auto px-5 py-6 text-center"
      >
        <motion.div
          initial={{ scale: 0.85, rotate: -8 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 240, damping: 18, delay: 0.35 }}
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-sunset text-white shadow-glass-md"
        >
          <Sparkles className="h-6 w-6" strokeWidth={1.5} />
        </motion.div>

        <h2 className="mt-3 text-[20px] font-bold leading-tight tracking-tight text-ink-900">
          That's your 5 for today
        </h2>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-500">
          {savedCount > 0
            ? `You saved ${savedCount} ${savedCount === 1 ? 'recipe' : 'recipes'}. Upgrade to Pro for unlimited matches.`
            : 'Upgrade to Pro for unlimited recipe matches and personalised meal plans.'}
        </p>

        <div className="mt-4 flex flex-col gap-2">
          <GlassButton
            variant="primary"
            size="md"
            fullWidth
            onClick={onGetPro}
            leadingIcon={<Crown className="h-4 w-4" strokeWidth={2.25} />}
          >
            Get Pro
          </GlassButton>
          <button
            type="button"
            onClick={onScanAgain}
            className="inline-flex items-center justify-center gap-1.5 self-center text-[13px] font-semibold text-ink-500 underline-offset-4 hover:underline"
          >
            <RotateCcw className="h-3.5 w-3.5" strokeWidth={2.25} />
            Scan again
          </button>
        </div>

        {savedCount > 0 && (
          <div className="mt-5 border-t border-ink-100 pt-4 text-left">
            <div className="flex items-baseline justify-between">
              <p className="text-[13px] font-bold tracking-tight text-ink-900">
                Pick one to cook
              </p>
              <span className="text-[11px] font-medium text-ink-400">
                {savedCount} saved
              </span>
            </div>
            <div className="no-scrollbar -mx-1 mt-2.5 flex gap-2 overflow-x-auto px-1 pb-1">
              {savedRecipes.map((r) => (
                <SavedPickCard
                  key={r.id}
                  recipe={r}
                  onClick={() => onPickRecipe(r.id)}
                />
              ))}
            </div>
          </div>
        )}
      </GlassCard>
    </motion.div>
  )
}

interface SavedPickCardProps {
  recipe: Recipe
  onClick: () => void
}

function SavedPickCard({ recipe, onClick }: SavedPickCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className="relative h-[112px] w-[88px] flex-shrink-0 overflow-hidden rounded-2xl border border-white/40 bg-ink-100 shadow-glass-sm"
    >
      <img
        src={recipe.image}
        alt={recipe.title}
        loading="lazy"
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
      <div className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/95 text-white shadow-[0_2px_8px_rgba(110,231,183,0.55)]">
        <Heart className="h-2.5 w-2.5 fill-white" strokeWidth={2.5} />
      </div>
      <div className="absolute inset-x-0 bottom-0 p-1.5 text-left">
        <p className="line-clamp-2 text-[10px] font-semibold leading-tight tracking-tight text-white">
          {recipe.title}
        </p>
        <p className="mt-0.5 text-[9px] font-medium text-white/75">
          {recipe.cookTime} min
        </p>
      </div>
    </motion.button>
  )
}
