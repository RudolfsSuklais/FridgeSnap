import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react'
import {
  animate,
  motion,
  useMotionValue,
  useTransform,
  type PanInfo,
} from 'framer-motion'
import { Clock, Flame, ChefHat } from 'lucide-react'
import type { Recipe } from '../../types'

export interface SwipeCardHandle {
  triggerSwipe: (direction: 'left' | 'right') => void
}

interface SwipeCardProps {
  recipe: Recipe
  depth: number
  isActive: boolean
  matched: string[]
  missing: string[]
  onSwipe: (direction: 'left' | 'right') => void
  onTap: () => void
}

const SWIPE_DISTANCE = 90
const SWIPE_VELOCITY = 320
const FLY_OFF_DISTANCE = 600

const DIFFICULTY_LABEL: Record<Recipe['difficulty'], string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}

export const SwipeCard = forwardRef<SwipeCardHandle, SwipeCardProps>(
  function SwipeCard(
    { recipe, depth, isActive, matched, missing, onSwipe, onTap },
    ref,
  ) {
    const x = useMotionValue(0)
    const rotate = useTransform(x, [-260, 0, 260], [-18, 0, 18])
    const saveStampOpacity = useTransform(x, [40, 130], [0, 1])
    const skipStampOpacity = useTransform(x, [-130, -40], [1, 0])

    const onSwipeRef = useRef(onSwipe)
    useEffect(() => {
      onSwipeRef.current = onSwipe
    })

    // Locks out further drag/tap/button input once a swipe-out has begun.
    // Prevents: tap-while-flying-off navigating away, rapid Skip↔Save
    // flipping direction mid-flight, and drag interrupting a triggered swipe.
    const isExitingRef = useRef(false)

    const completeSwipe = useCallback(
      (direction: 'left' | 'right') => {
        if (isExitingRef.current) return
        isExitingRef.current = true
        const target = direction === 'left' ? -FLY_OFF_DISTANCE : FLY_OFF_DISTANCE
        animate(x, target, {
          type: 'spring',
          stiffness: 260,
          damping: 32,
          velocity: direction === 'left' ? -1400 : 1400,
          onComplete: () => onSwipeRef.current(direction),
        })
      },
      [x],
    )

    useImperativeHandle(
      ref,
      () => ({
        triggerSwipe(direction) {
          completeSwipe(direction)
        },
      }),
      [completeSwipe],
    )

    const handleDragEnd = (
      _event: MouseEvent | TouchEvent | PointerEvent,
      info: PanInfo,
    ) => {
      if (isExitingRef.current) return
      const { offset, velocity } = info
      if (offset.x > SWIPE_DISTANCE || velocity.x > SWIPE_VELOCITY) {
        completeSwipe('right')
      } else if (offset.x < -SWIPE_DISTANCE || velocity.x < -SWIPE_VELOCITY) {
        completeSwipe('left')
      } else {
        animate(x, 0, { type: 'spring', stiffness: 360, damping: 30 })
      }
    }

    const handleTap = () => {
      if (isExitingRef.current) return
      onTap()
    }

    return (
      <motion.div
        className={[
          'absolute inset-0 origin-bottom touch-pan-y select-none overflow-hidden rounded-[2rem] border border-white/30 bg-ink-100 shadow-glass-lg',
          isActive ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none',
        ].join(' ')}
        style={
          isActive
            ? { x, rotate, zIndex: 10 - depth }
            : { zIndex: 10 - depth }
        }
        animate={{
          scale: 1 - depth * 0.04,
          y: depth * 14,
          opacity: isActive ? 1 : 1 - depth * 0.18,
        }}
        initial={{ scale: 0.86, y: 32, opacity: 0 }}
        exit={{ opacity: 0, transition: { duration: 0.18 } }}
        transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        drag={isActive ? 'x' : false}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        onTap={isActive ? handleTap : undefined}
      >
        <img
          src={recipe.image}
          alt={recipe.title}
          loading="lazy"
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 top-1/3"
          style={{
            background:
              'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.15) 35%, rgba(0,0,0,0.78) 100%)',
          }}
        />

        {/* SAVE / SKIP stamps */}
        <motion.div
          className="absolute left-5 top-6 -rotate-[15deg]"
          style={{ opacity: saveStampOpacity }}
        >
          <span className="block rounded-2xl border-[3px] border-emerald-300 bg-emerald-300/15 px-3 py-1 text-[20px] font-extrabold tracking-[0.18em] text-emerald-200 shadow-[0_8px_28px_rgba(110,231,183,0.45)] backdrop-blur-md">
            SAVE
          </span>
        </motion.div>
        <motion.div
          className="absolute right-5 top-6 rotate-[15deg]"
          style={{ opacity: skipStampOpacity }}
        >
          <span className="block rounded-2xl border-[3px] border-rose-300 bg-rose-300/15 px-3 py-1 text-[20px] font-extrabold tracking-[0.18em] text-rose-200 shadow-[0_8px_28px_rgba(252,165,165,0.45)] backdrop-blur-md">
            SKIP
          </span>
        </motion.div>

        {/* Bottom info panel */}
        <div className="absolute inset-x-0 bottom-0 p-5 text-white">
          <h2 className="text-[22px] font-bold leading-tight tracking-tight">
            {recipe.title}
          </h2>

          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <MetaPill icon={<Clock className="h-3 w-3" strokeWidth={2.25} />}>
              {recipe.cookTime} min
            </MetaPill>
            <MetaPill icon={<ChefHat className="h-3 w-3" strokeWidth={2.25} />}>
              {DIFFICULTY_LABEL[recipe.difficulty]}
            </MetaPill>
            <MetaPill icon={<Flame className="h-3 w-3" strokeWidth={2.25} />}>
              {recipe.calories} cal
            </MetaPill>
          </div>

          {matched.length > 0 && (
            <div className="mt-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-200/95">
                In your fridge
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {matched.slice(0, 5).map((name) => (
                  <span
                    key={name}
                    className="rounded-full border border-emerald-300/40 bg-emerald-300/15 px-2 py-0.5 text-[11px] font-medium text-emerald-100 backdrop-blur-md"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {missing.length > 0 && (
            <div className="mt-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/65">
                You'll need
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {missing.slice(0, 4).map((name) => (
                  <span
                    key={name}
                    className="rounded-full border border-white/25 bg-white/15 px-2 py-0.5 text-[11px] font-medium text-white/90 backdrop-blur-md"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    )
  },
)

interface MetaPillProps {
  icon: React.ReactNode
  children: React.ReactNode
}

function MetaPill({ icon, children }: MetaPillProps) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/15 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-md">
      {icon}
      {children}
    </span>
  )
}
