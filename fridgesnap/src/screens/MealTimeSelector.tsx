import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, ChevronLeft } from 'lucide-react'
import { GradientBackground } from '../components/layout/GradientBackground'
import { GlassCard } from '../components/ui/GlassCard'
import { GlassButton } from '../components/ui/GlassButton'
import { recipes } from '../data/mockData'
import {
  formatClockTime,
  getMealTimeEmoji,
  getMealTimeLabel,
  getMealTimeSuggestion,
  getStoredMealTime,
  setStoredMealTime,
  type MealTime,
} from '../utils/timeOfDay'

const ALL_MEAL_TIMES: MealTime[] = [
  'breakfast',
  'brunch',
  'lunch',
  'snack',
  'dinner',
]

export function MealTimeSelector() {
  const navigate = useNavigate()
  // Read once on mount — this screen is the only place that writes the value,
  // so a snapshot is enough to show "previously selected" highlights.
  const [selectedMealTime] = useState<MealTime | null>(() => getStoredMealTime())

  // Refresh the wall-clock display once per minute so the time never goes stale.
  const [now, setNow] = useState<Date>(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  const suggestion = useMemo(() => getMealTimeSuggestion(now), [now])
  const clockLabel = useMemo(() => formatClockTime(now), [now])

  const recipeCounts = useMemo(() => {
    const counts: Record<MealTime, number> = {
      breakfast: 0,
      brunch: 0,
      lunch: 0,
      snack: 0,
      dinner: 0,
    }
    for (const r of recipes) {
      for (const mt of r.mealTimes) counts[mt] += 1
    }
    return counts
  }, [])

  const alternatives = ALL_MEAL_TIMES.filter((mt) => mt !== suggestion.primary)

  const choose = (mealTime: MealTime) => {
    setStoredMealTime(mealTime)
    navigate('/results')
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      <GradientBackground variant="mint" />

      <motion.div
        key="meal-time-page"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 30 }}
        className="no-scrollbar relative z-10 flex h-full w-full flex-col overflow-y-auto px-5 pb-10 pt-14"
      >
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Back"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/55 text-ink-900 shadow-glass-sm backdrop-blur-md backdrop-saturate-180"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2.25} />
          </button>
          <span className="text-[13px] font-semibold tracking-tight text-ink-700">
            What are you cooking?
          </span>
          <span className="h-10 w-10" aria-hidden />
        </div>

        {/* Hero — emoji + clock + greeting */}
        <section className="mt-6 flex flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.2, 1], opacity: 1 }}
            transition={{ duration: 0.55, times: [0, 0.6, 1], ease: 'easeOut' }}
            className="text-[72px] leading-none drop-shadow-[0_4px_16px_rgba(0,0,0,0.12)]"
          >
            {suggestion.emoji}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 280, damping: 26 }}
            className="mt-3 text-[34px] font-bold leading-none tracking-tight text-ink-900"
          >
            It's {clockLabel}
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 280, damping: 26 }}
            className="mt-1.5 text-[14px] font-medium tracking-tight text-ink-500"
          >
            {suggestion.greeting}
          </motion.p>
        </section>

        {/* Suggested option — the centerpiece */}
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1.02 }}
          transition={{ delay: 0.6, type: 'spring', stiffness: 260, damping: 24 }}
          className="mt-7"
        >
          <SuggestedCard
            mealTime={suggestion.primary}
            recipeCount={recipeCounts[suggestion.primary]}
            isSelected={selectedMealTime === suggestion.primary}
            onChoose={() => choose(suggestion.primary)}
          />
        </motion.div>

        {/* Alternatives */}
        <section className="mt-6">
          <h3 className="px-1 text-[12px] font-semibold uppercase tracking-wide text-ink-500">
            Or pick another
          </h3>

          <motion.div
            className="mt-2 grid grid-cols-2 gap-2"
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: { staggerChildren: 0.06, delayChildren: 0.85 },
              },
            }}
          >
            {alternatives.map((mt) => (
              <motion.div
                key={mt}
                variants={{
                  hidden: { opacity: 0, x: -16 },
                  visible: {
                    opacity: 1,
                    x: 0,
                    transition: { type: 'spring', stiffness: 320, damping: 28 },
                  },
                }}
              >
                <AlternativePill
                  mealTime={mt}
                  recipeCount={recipeCounts[mt]}
                  isSelected={selectedMealTime === mt}
                  onChoose={() => choose(mt)}
                />
              </motion.div>
            ))}
          </motion.div>
        </section>
      </motion.div>
    </div>
  )
}

interface SuggestedCardProps {
  mealTime: MealTime
  recipeCount: number
  isSelected: boolean
  onChoose: () => void
}

function SuggestedCard({
  mealTime,
  recipeCount,
  isSelected,
  onChoose,
}: SuggestedCardProps) {
  const label = getMealTimeLabel(mealTime)
  const emoji = getMealTimeEmoji(mealTime)

  return (
    <motion.button
      type="button"
      onClick={onChoose}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className="block w-full text-left"
    >
      <GlassCard
        tone="light"
        blur="lg"
        className={[
          'relative overflow-hidden border-2 px-5 py-5',
          isSelected
            ? 'border-emerald-300/90 bg-white/75'
            : 'border-white/55 bg-white/65',
        ].join(' ')}
      >
        {/* Subtle gradient flourish on the suggested card */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            background:
              'radial-gradient(120% 80% at 100% 0%, rgba(110,231,183,0.35) 0%, transparent 55%)',
          }}
        />

        <div className="relative flex items-center gap-4">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border border-white/55 bg-white/70 text-[34px] leading-none shadow-glass-sm backdrop-blur-md backdrop-saturate-180">
            {emoji}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Suggested
            </div>
            <div className="mt-0.5 text-[22px] font-bold leading-tight tracking-tight text-ink-900">
              {label}
            </div>
            <div className="mt-0.5 text-[12.5px] text-ink-500">
              Based on the time of day
            </div>
          </div>
        </div>

        <div className="relative mt-4 flex items-center justify-between gap-3">
          <span className="text-[13px] font-semibold text-ink-700">
            {recipeCount} {recipeCount === 1 ? 'recipe' : 'recipes'} you can cook
          </span>
          <GlassButton
            variant="primary"
            size="sm"
            trailingIcon={<ArrowRight className="h-4 w-4" />}
            onClick={(e) => {
              e.stopPropagation()
              onChoose()
            }}
          >
            Cook now
          </GlassButton>
        </div>
      </GlassCard>
    </motion.button>
  )
}

interface AlternativePillProps {
  mealTime: MealTime
  recipeCount: number
  isSelected: boolean
  onChoose: () => void
}

function AlternativePill({
  mealTime,
  recipeCount,
  isSelected,
  onChoose,
}: AlternativePillProps) {
  const label = getMealTimeLabel(mealTime)
  const emoji = getMealTimeEmoji(mealTime)

  return (
    <motion.button
      type="button"
      onClick={onChoose}
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className={[
        'flex w-full items-center gap-3 rounded-2xl border bg-white/55 px-3 py-2.5 text-left shadow-glass-sm backdrop-blur-md backdrop-saturate-180',
        isSelected
          ? 'border-emerald-300/80 bg-white/75'
          : 'border-white/40',
      ].join(' ')}
    >
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-white/50 bg-white/70 text-[22px] leading-none">
        {emoji}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-bold leading-tight tracking-tight text-ink-900">
          {label}
        </div>
        <div className="text-[11.5px] leading-tight text-ink-500">
          {recipeCount} {recipeCount === 1 ? 'recipe' : 'recipes'}
        </div>
      </div>
    </motion.button>
  )
}
