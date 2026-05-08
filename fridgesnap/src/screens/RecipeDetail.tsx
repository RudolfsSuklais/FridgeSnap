import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowUpRight,
  ChefHat,
  Check,
  Clock,
  Flame,
  Heart,
  Minus,
  Play,
  Plus,
  ShoppingBag,
  Sparkles,
  X,
} from 'lucide-react'
import { GradientBackground } from '../components/layout/GradientBackground'
import { GlassButton } from '../components/ui/GlassButton'
import { GlassCard } from '../components/ui/GlassCard'
import { recipes } from '../data/mockData'
import { useScan } from '../contexts/ScanContext'
import type { Ingredient, Recipe, StoreName, StoreUpsell } from '../types'

const DIFFICULTY_LABEL: Record<Recipe['difficulty'], string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}

interface IngredientWithMatch extends Ingredient {
  matched: boolean
}

export function RecipeDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const recipe = useMemo(() => recipes.find((r) => r.id === id), [id])

  if (!recipe) return <NotFound onBack={() => navigate(-1)} />

  return <RecipeDetailContent recipe={recipe} />
}

interface RecipeDetailContentProps {
  recipe: Recipe
}

function RecipeDetailContent({ recipe }: RecipeDetailContentProps) {
  const navigate = useNavigate()
  const { items: scanned } = useScan()
  const scrollRef = useRef<HTMLDivElement>(null)

  const [liked, setLiked] = useState(false)
  const [particles, setParticles] = useState<Particle[]>([])
  const [servings, setServings] = useState(2)
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  const userSet = useMemo(
    () => new Set(scanned.map((s) => s.name.toLowerCase())),
    [scanned],
  )

  const ingredients: IngredientWithMatch[] = useMemo(() => {
    const matchedSet = new Set(
      recipe.matchedIngredients.map((n) => n.toLowerCase()),
    )
    return recipe.ingredients.map((ing) => ({
      ...ing,
      matched:
        userSet.size > 0
          ? userSet.has(ing.name.toLowerCase())
          : matchedSet.has(ing.name.toLowerCase()),
    }))
  }, [recipe, userSet])

  const matchedCount = ingredients.filter((i) => i.matched).length

  const { scrollY } = useScroll({ container: scrollRef })
  const heroScale = useTransform(scrollY, [-120, 0, 240], [1.12, 1, 1.06])
  const heroY = useTransform(scrollY, [0, 240], [0, -32])
  const heroOpacity = useTransform(scrollY, [0, 240], [1, 0.6])
  const titleOpacity = useTransform(scrollY, [0, 120], [1, 0])
  const titleY = useTransform(scrollY, [0, 120], [0, -16])

  const toggleLike = () => {
    setLiked((prev) => {
      const next = !prev
      if (next) spawnHearts()
      return next
    })
  }

  const spawnHearts = () => {
    const now = Date.now()
    const fresh: Particle[] = Array.from({ length: 6 }, (_, i) => ({
      id: now + i,
      dx: (Math.random() - 0.5) * 110,
      dy: -50 - Math.random() * 70,
      delay: Math.random() * 0.08,
      rotate: (Math.random() - 0.5) * 50,
    }))
    setParticles((p) => [...p, ...fresh])
  }

  const removeParticle = (id: number) =>
    setParticles((p) => p.filter((x) => x.id !== id))

  const toggleIngredient = (name: string) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const toggleStep = (i: number) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      <GradientBackground variant="lavender" />

      <div
        ref={scrollRef}
        className="no-scrollbar relative z-10 h-full overflow-y-auto"
      >
        {/* Hero */}
        <div className="relative h-[340px] overflow-hidden">
          <motion.img
            src={recipe.image}
            alt={recipe.title}
            draggable={false}
            style={{ scale: heroScale, y: heroY, opacity: heroOpacity }}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(0,0,0,0.32) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.78) 100%)',
            }}
          />

          {/* Top action row */}
          <div className="absolute inset-x-0 top-14 z-10 flex items-center justify-between px-5">
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Close"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-black/35 text-white shadow-glass-sm backdrop-blur-md"
            >
              <X className="h-5 w-5" strokeWidth={2.25} />
            </button>

            <motion.button
              type="button"
              onClick={toggleLike}
              aria-label={liked ? 'Unsave recipe' : 'Save recipe'}
              whileTap={{ scale: 0.88 }}
              animate={liked ? { scale: [1, 1.35, 1] } : { scale: 1 }}
              transition={{ type: 'spring', stiffness: 380, damping: 18 }}
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-black/35 text-white shadow-glass-sm backdrop-blur-md"
            >
              <Heart
                className={[
                  'h-5 w-5 transition-colors duration-150',
                  liked ? 'fill-rose-400 text-rose-400' : 'text-white',
                ].join(' ')}
                strokeWidth={2.25}
              />
              <AnimatePresence>
                {particles.map((p) => (
                  <motion.span
                    key={p.id}
                    initial={{ x: 0, y: 0, opacity: 1, scale: 0.5, rotate: 0 }}
                    animate={{
                      x: p.dx,
                      y: p.dy,
                      opacity: 0,
                      scale: 1,
                      rotate: p.rotate,
                    }}
                    transition={{ duration: 0.85, ease: 'easeOut', delay: p.delay }}
                    onAnimationComplete={() => removeParticle(p.id)}
                    className="pointer-events-none absolute inset-0 flex items-center justify-center"
                  >
                    <Heart className="h-3.5 w-3.5 fill-rose-400 text-rose-400" />
                  </motion.span>
                ))}
              </AnimatePresence>
            </motion.button>
          </div>

          {/* Hero title */}
          <motion.div
            style={{ opacity: titleOpacity, y: titleY }}
            className="absolute inset-x-0 bottom-0 px-5 pb-6 text-white"
          >
            {recipe.tags[0] && (
              <span className="inline-block rounded-full border border-white/25 bg-white/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider backdrop-blur-md">
                {recipe.tags[0]}
              </span>
            )}
            <h1 className="mt-2 text-[32px] font-bold leading-[1.1] tracking-tight">
              {recipe.title}
            </h1>
          </motion.div>
        </div>

        {/* Quick info bar */}
        <div className="relative -mt-7 px-5">
          <GlassCard tone="light" blur="lg" className="px-2 py-3.5">
            <div className="grid grid-cols-3 divide-x divide-ink-100">
              <InfoColumn
                icon={<Clock className="h-4 w-4" strokeWidth={2.25} />}
                value={`${recipe.cookTime} min`}
                label="cook time"
              />
              <InfoColumn
                icon={<ChefHat className="h-4 w-4" strokeWidth={2.25} />}
                value={DIFFICULTY_LABEL[recipe.difficulty]}
                label="difficulty"
              />
              <InfoColumn
                icon={<Flame className="h-4 w-4" strokeWidth={2.25} />}
                value={`${recipe.calories}`}
                label="calories"
              />
            </div>
          </GlassCard>
        </div>

        {/* Ingredients */}
        <section className="px-5 pt-7">
          <div className="flex items-baseline justify-between">
            <h3 className="text-[18px] font-bold tracking-tight text-ink-900">
              Ingredients
            </h3>
            <span className="text-[12px] font-semibold text-ink-500">
              matches {matchedCount} / {recipe.ingredients.length}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between rounded-2xl border border-white/40 bg-white/55 px-3 py-2 shadow-glass-sm backdrop-blur-md">
            <span className="text-[13px] font-semibold text-ink-700">
              Servings
            </span>
            <div className="flex items-center gap-3">
              <ServingsButton
                ariaLabel="Decrease servings"
                onClick={() => setServings((s) => Math.max(1, s - 1))}
              >
                <Minus className="h-3.5 w-3.5" strokeWidth={2.5} />
              </ServingsButton>
              <span className="min-w-[18px] text-center text-[15px] font-bold text-ink-900">
                {servings}
              </span>
              <ServingsButton
                ariaLabel="Increase servings"
                onClick={() => setServings((s) => s + 1)}
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
              </ServingsButton>
            </div>
          </div>

          <ul className="mt-3 flex flex-col gap-1.5">
            {ingredients.map((ing) => {
              const isChecked = checked.has(ing.name)
              return (
                <IngredientRow
                  key={ing.name}
                  ingredient={ing}
                  checked={isChecked}
                  onToggle={() => toggleIngredient(ing.name)}
                />
              )
            })}
          </ul>
        </section>

        {/* Steps */}
        <section className="px-5 pt-7">
          <h3 className="text-[18px] font-bold tracking-tight text-ink-900">
            Steps
          </h3>
          <div className="mt-3 flex flex-col gap-2.5">
            {recipe.steps.map((text, i) => (
              <StepCard
                key={i}
                index={i + 1}
                text={text}
                completed={completedSteps.has(i)}
                onToggle={() => toggleStep(i)}
              />
            ))}
          </div>
        </section>

        {/* Upsells — store products to upgrade the dish */}
        {recipe.upsells.length > 0 && <UpsellSection upsells={recipe.upsells} />}

        {/* Spacer for sticky bar */}
        <div className="h-32" />
      </div>

      {/* Sticky action bar */}
      <div className="absolute inset-x-0 bottom-0 z-20 px-5 pb-5 pt-3">
        <div className="glass-light flex gap-2 rounded-3xl border border-white/40 p-2 shadow-glass-md">
          <GlassButton
            variant="secondary"
            size="md"
            fullWidth
            onClick={() =>
              window.alert('Demo: missing ingredients added to shopping list.')
            }
            leadingIcon={<ShoppingBag className="h-4 w-4" strokeWidth={2.25} />}
          >
            Shopping list
          </GlassButton>
          <GlassButton
            variant="primary"
            size="md"
            fullWidth
            onClick={() => window.alert('Demo: cooking mode kicking off.')}
            leadingIcon={<Play className="h-4 w-4" strokeWidth={2.25} />}
          >
            Start cooking
          </GlassButton>
        </div>
      </div>
    </div>
  )
}

interface Particle {
  id: number
  dx: number
  dy: number
  delay: number
  rotate: number
}

interface InfoColumnProps {
  icon: React.ReactNode
  value: string
  label: string
}

function InfoColumn({ icon, value, label }: InfoColumnProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-0.5 px-2">
      <div className="flex items-center gap-1.5 text-ink-700">
        {icon}
        <span className="text-[15px] font-bold tracking-tight">{value}</span>
      </div>
      <span className="text-[10px] font-medium uppercase tracking-wider text-ink-400">
        {label}
      </span>
    </div>
  )
}

interface ServingsButtonProps {
  ariaLabel: string
  onClick: () => void
  children: React.ReactNode
}

function ServingsButton({ ariaLabel, onClick, children }: ServingsButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      whileTap={{ scale: 0.85 }}
      transition={{ type: 'spring', stiffness: 500, damping: 26 }}
      className="flex h-7 w-7 items-center justify-center rounded-full border border-ink-100 bg-white/80 text-ink-700 shadow-glass-sm"
    >
      {children}
    </motion.button>
  )
}

interface IngredientRowProps {
  ingredient: IngredientWithMatch
  checked: boolean
  onToggle: () => void
}

function IngredientRow({ ingredient, checked, onToggle }: IngredientRowProps) {
  const isMatched = ingredient.matched
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
      className={[
        'flex w-full items-center justify-between rounded-2xl border px-3 py-2.5 text-left shadow-glass-sm backdrop-blur-md',
        isMatched
          ? 'border-emerald-300/55 bg-emerald-100/50'
          : 'border-white/40 bg-white/55',
      ].join(' ')}
    >
      <div className="flex min-w-0 items-center gap-3">
        <CheckBubble checked={checked} matched={isMatched} />
        <div className="min-w-0">
          <p
            className={[
              'truncate text-[14px] font-semibold tracking-tight text-ink-900',
              checked ? 'line-through opacity-50' : '',
            ].join(' ')}
          >
            {ingredient.name}
          </p>
          {isMatched && (
            <p className="text-[10px] font-medium uppercase tracking-wider text-emerald-600">
              In your fridge
            </p>
          )}
        </div>
      </div>
      <span className="ml-3 flex-shrink-0 text-[13px] font-semibold text-ink-500">
        {ingredient.amount}
        {ingredient.unit ? ` ${ingredient.unit}` : ''}
      </span>
    </motion.button>
  )
}

interface CheckBubbleProps {
  checked: boolean
  matched: boolean
}

function CheckBubble({ checked, matched }: CheckBubbleProps) {
  return (
    <motion.span
      animate={{
        backgroundColor: checked
          ? matched
            ? 'rgb(16,185,129)'
            : 'rgb(31,32,40)'
          : 'rgba(255,255,255,0.7)',
        borderColor: checked
          ? matched
            ? 'rgb(16,185,129)'
            : 'rgb(31,32,40)'
          : 'rgba(0,0,0,0.12)',
      }}
      transition={{ duration: 0.18 }}
      className="relative flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border shadow-glass-sm"
    >
      <svg viewBox="0 0 20 20" className="h-3 w-3" fill="none" aria-hidden>
        <motion.path
          d="M4 10 L8.5 14 L16 6"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={{ pathLength: checked ? 1 : 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        />
      </svg>
    </motion.span>
  )
}

interface StepCardProps {
  index: number
  text: string
  completed: boolean
  onToggle: () => void
}

function StepCard({ index, text, completed, onToggle }: StepCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      whileTap={{ scale: 0.99 }}
      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
      className={[
        'flex w-full items-start gap-3 rounded-2xl border px-3 py-3 text-left shadow-glass-sm backdrop-blur-md',
        completed
          ? 'border-emerald-300/40 bg-white/40'
          : 'border-white/40 bg-white/65',
      ].join(' ')}
    >
      <motion.span
        animate={{
          backgroundColor: completed
            ? 'rgb(16,185,129)'
            : 'rgba(255,255,255,0.85)',
          color: completed ? 'rgb(255,255,255)' : 'rgb(31,32,40)',
          scale: completed ? [1, 1.18, 1] : 1,
        }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-white/55 text-[13px] font-bold shadow-glass-sm"
      >
        {completed ? (
          <Check className="h-4 w-4" strokeWidth={3} />
        ) : (
          <span>{index}</span>
        )}
      </motion.span>
      <p
        className={[
          'pt-0.5 text-[13px] leading-relaxed tracking-tight text-ink-900',
          completed ? 'text-ink-400 line-through' : '',
        ].join(' ')}
      >
        {text}
      </p>
    </motion.button>
  )
}

const STORE_BRAND: Record<
  StoreName,
  { label: string; bg: string; text: string }
> = {
  rimi: { label: 'Rimi', bg: 'bg-rose-500', text: 'text-white' },
  maxima: { label: 'Maxima', bg: 'bg-blue-700', text: 'text-white' },
  lidl: { label: 'Lidl', bg: 'bg-yellow-400', text: 'text-blue-800' },
}

interface UpsellSectionProps {
  upsells: StoreUpsell[]
}

function UpsellSection({ upsells }: UpsellSectionProps) {
  return (
    <section className="pt-7">
      <div className="flex items-baseline justify-between px-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" strokeWidth={2.5} />
          <h3 className="text-[18px] font-bold tracking-tight text-ink-900">
            Make it better
          </h3>
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">
          {upsells.length} picks
        </span>
      </div>
      <p className="mt-1 px-5 text-[12.5px] text-ink-500">
        Curated upgrades from your local stores.
      </p>

      <div className="no-scrollbar mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2">
        {upsells.map((u) => (
          <UpsellCard key={u.id} upsell={u} />
        ))}
      </div>
    </section>
  )
}

interface UpsellCardProps {
  upsell: StoreUpsell
}

function UpsellCard({ upsell }: UpsellCardProps) {
  const brand = STORE_BRAND[upsell.store]
  const priceText = `€${upsell.price.toFixed(2)}`

  const open = () => {
    window.open(upsell.searchUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <motion.button
      type="button"
      onClick={open}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
      className="flex w-[170px] flex-shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-white/40 bg-white/55 text-left shadow-glass-sm backdrop-blur-md"
    >
      <div className="relative aspect-[5/4] w-full overflow-hidden">
        <img
          src={upsell.imageUrl}
          alt={upsell.name}
          draggable={false}
          className="h-full w-full object-cover"
        />
        <span
          className={[
            'absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-glass-sm',
            brand.bg,
            brand.text,
          ].join(' ')}
        >
          {brand.label}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1 px-3 py-2.5">
        <p className="line-clamp-2 text-[13px] font-bold leading-tight tracking-tight text-ink-900">
          {upsell.name}
        </p>
        <p className="line-clamp-2 text-[11px] italic leading-snug text-ink-500">
          {upsell.reason}
        </p>
        <div className="mt-auto flex items-center justify-between pt-1.5">
          <span className="text-[14px] font-extrabold tracking-tight text-ink-900">
            {priceText}
          </span>
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink-900 text-white">
            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.5} />
          </span>
        </div>
      </div>
    </motion.button>
  )
}

interface NotFoundProps {
  onBack: () => void
}

function NotFound({ onBack }: NotFoundProps) {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <GradientBackground variant="ocean" />
      <div className="relative z-10 flex h-full w-full items-center justify-center px-6">
        <GlassCard tone="light" blur="lg" className="w-full px-6 py-7 text-center">
          <h1 className="text-[20px] font-bold tracking-tight text-ink-900">
            Recipe not found
          </h1>
          <p className="mt-1 text-[13px] text-ink-500">
            We couldn't find that recipe. Try scanning again.
          </p>
          <div className="mt-4">
            <GlassButton variant="primary" size="md" fullWidth onClick={onBack}>
              Go back
            </GlassButton>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
