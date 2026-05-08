import { useMemo, useState } from 'react'
import { AnimatePresence, motion, useMotionValue } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { recipes } from '../data/mockData'
import { detectTimer } from '../utils/cookingTimerParser'
import { CookingStep } from '../components/cooking/CookingStep'
import { useCooking } from '../contexts/CookingContext'
import type { ParsedTimerHint } from '../types'

export function CookingMode() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const recipe = useMemo(() => recipes.find((r) => r.id === id), [id])
  const { startTimer } = useCooking()
  const [stepIdx, setStepIdx] = useState(0)
  const dragX = useMotionValue(0)

  if (!recipe) {
    return (
      <div className="relative flex h-full w-full items-center justify-center bg-ink-900 text-white">
        <p className="text-[14px]">Recipe not found.</p>
      </div>
    )
  }

  const total = recipe.steps.length
  const text = recipe.steps[stepIdx]
  const hint = detectTimer(text)

  const goNext = () => {
    if (stepIdx < total - 1) setStepIdx((i) => i + 1)
    else handleComplete()
  }
  const goPrev = () => {
    if (stepIdx > 0) setStepIdx((i) => i - 1)
  }

  const handleComplete = () => {
    window.alert('Demo: completion flow lands in Task 5.')
  }

  const handleStartTimer = (h: ParsedTimerHint) => {
    startTimer({
      recipeId: recipe.id,
      stepIdx,
      label: h.label,
      durationMinutes: h.minutes,
    })
  }

  return (
    <motion.div
      key="cooking-mode"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="relative h-full w-full overflow-hidden text-white"
    >
      <div aria-hidden className="absolute inset-0">
        <img
          src={recipe.image}
          alt=""
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ filter: 'blur(40px) saturate(1.1)', transform: 'scale(1.15)' }}
        />
        <div className="absolute inset-0 bg-black/55" />
      </div>

      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 pt-14">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Exit cooking mode"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white shadow-glass-sm backdrop-blur-md"
        >
          <X className="h-5 w-5" strokeWidth={2.25} />
        </button>
        <p className="max-w-[60%] truncate text-[13px] font-semibold opacity-80">
          {recipe.title}
        </p>
        <div className="h-10 w-10" />
      </div>

      <div className="absolute inset-x-5 top-[112px] z-20 h-1 overflow-hidden rounded-full bg-white/15">
        <motion.div
          className="h-full bg-white"
          initial={false}
          animate={{ width: `${((stepIdx + 1) / total) * 100}%` }}
          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        />
      </div>

      <motion.div
        className="absolute inset-0 z-10 pt-32 pb-32"
        drag="x"
        style={{ x: dragX }}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={(_, info) => {
          if (info.offset.x < -80) goNext()
          else if (info.offset.x > 80) goPrev()
        }}
      >
        <AnimatePresence mode="wait">
          <CookingStep
            key={stepIdx}
            index={stepIdx}
            total={total}
            text={text}
            hint={hint}
            onStartTimer={handleStartTimer}
          />
        </AnimatePresence>
      </motion.div>

      <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between px-5 pb-10">
        <button
          type="button"
          onClick={goPrev}
          disabled={stepIdx === 0}
          aria-label="Previous step"
          className="flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white shadow-glass-sm backdrop-blur-md transition-opacity disabled:opacity-30"
        >
          <ChevronLeft className="h-6 w-6" strokeWidth={2.25} />
        </button>
        <button
          type="button"
          onClick={goNext}
          aria-label={stepIdx === total - 1 ? 'Finish cooking' : 'Next step'}
          className="flex items-center gap-2 rounded-full border border-white/40 bg-white/85 px-5 py-3 text-[14px] font-bold text-ink-900 shadow-glass-md"
        >
          {stepIdx === total - 1 ? 'Finish' : 'Next'}
          <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
        </button>
      </div>
    </motion.div>
  )
}
