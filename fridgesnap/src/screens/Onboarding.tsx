import { useEffect, useRef, useState, type ReactNode } from 'react'
import { motion, type PanInfo } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ScanLine, Sparkles, ChefHat, ArrowRight } from 'lucide-react'
import { GlassCard } from '../components/ui/GlassCard'
import { GlassButton } from '../components/ui/GlassButton'
import { GradientBackground } from '../components/layout/GradientBackground'
import type { GradientVariant } from '../types'

interface Slide {
  id: string
  variant: GradientVariant
  icon: ReactNode
  title: string
  subtitle: string
  cta?: string
}

const SLIDES: Slide[] = [
  {
    id: 's1',
    variant: 'sunset',
    icon: <ScanLine className="h-20 w-20" strokeWidth={1.5} />,
    title: 'Snap your fridge',
    subtitle:
      "Open the camera, scan what's inside, and FridgeSnap recognises every ingredient instantly.",
  },
  {
    id: 's2',
    variant: 'mint',
    icon: <Sparkles className="h-20 w-20" strokeWidth={1.5} />,
    title: 'Get smart recipes',
    subtitle:
      'Personalised ideas tuned to what you actually have. No more "what should I cook?".',
  },
  {
    id: 's3',
    variant: 'lavender',
    icon: <ChefHat className="h-20 w-20" strokeWidth={1.5} />,
    title: 'Cook what you love',
    subtitle:
      'Swipe through ideas, save favourites, and follow simple step-by-step instructions.',
    cta: 'Get Started',
  },
]

export function Onboarding() {
  const [index, setIndex] = useState(0)
  const [width, setWidth] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const update = () => {
      if (containerRef.current) setWidth(containerRef.current.clientWidth)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const last = SLIDES.length - 1

  const handleDragEnd = (
    _e: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    const dragThreshold = width * 0.18
    const velocityThreshold = 500
    if (info.offset.x < -dragThreshold || info.velocity.x < -velocityThreshold) {
      setIndex((i) => Math.min(last, i + 1))
    } else if (
      info.offset.x > dragThreshold ||
      info.velocity.x > velocityThreshold
    ) {
      setIndex((i) => Math.max(0, i - 1))
    }
  }

  const goNext = () => {
    if (index < last) setIndex(index + 1)
    else navigate('/onboarding/preferences')
  }

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full select-none overflow-hidden bg-white"
    >
      {/* Sliding strip with all slides side-by-side */}
      <motion.div
        className="flex h-full touch-pan-y"
        style={{ width: `${SLIDES.length * 100}%` }}
        animate={{ x: -index * width }}
        drag="x"
        dragElastic={0.18}
        dragConstraints={{ left: -last * width, right: 0 }}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        transition={{ type: 'spring', stiffness: 260, damping: 32 }}
      >
        {SLIDES.map((slide, i) => (
          <SlidePanel key={slide.id} slide={slide} active={i === index} width={width} />
        ))}
      </motion.div>

      {/* Bottom overlay: page dots + CTA */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-6 pb-10">
        <div className="flex items-center justify-between gap-4">
          <PageDots count={SLIDES.length} active={index} />
          <div className="pointer-events-auto">
            <GlassButton
              variant={index === last ? 'primary' : 'secondary'}
              size="md"
              onClick={goNext}
              trailingIcon={<ArrowRight className="h-4 w-4" />}
            >
              {index === last ? (SLIDES[last].cta ?? 'Get Started') : 'Next'}
            </GlassButton>
          </div>
        </div>
      </div>
    </div>
  )
}

interface SlidePanelProps {
  slide: Slide
  active: boolean
  width: number
}

function SlidePanel({ slide, active, width }: SlidePanelProps) {
  return (
    <div
      className="relative h-full flex-shrink-0 overflow-hidden"
      style={{ width: width || '100%' }}
    >
      <GradientBackground variant={slide.variant} />

      <div className="relative z-10 flex h-full w-full flex-col items-center px-6 pb-32 pt-16">
        {/* Icon medallion */}
        <div className="flex flex-1 items-center justify-center">
          <motion.div
            initial={{ scale: 0.85, rotate: -6, opacity: 0 }}
            animate={
              active
                ? { scale: 1, rotate: 0, opacity: 1 }
                : { scale: 0.92, rotate: -3, opacity: 0.85 }
            }
            transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.05 }}
            className="flex h-44 w-44 items-center justify-center rounded-[2.5rem] border border-white/45 bg-white/30 text-white shadow-glass-lg backdrop-blur-2xl backdrop-saturate-180"
          >
            {slide.icon}
          </motion.div>
        </div>

        {/* Glass text card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={active ? { opacity: 1, y: 0 } : { opacity: 0.85, y: 8 }}
          transition={{ type: 'spring', stiffness: 240, damping: 28, delay: 0.1 }}
          className="w-full"
        >
          <GlassCard tone="light" blur="lg" className="px-6 py-7">
            <h1 className="text-[28px] font-bold leading-[1.15] tracking-tight text-ink-900">
              {slide.title}
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-500">
              {slide.subtitle}
            </p>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  )
}

interface PageDotsProps {
  count: number
  active: number
}

function PageDots({ count, active }: PageDotsProps) {
  return (
    <div className="pointer-events-auto flex items-center gap-1.5">
      {Array.from({ length: count }, (_, i) => (
        <motion.span
          key={i}
          animate={{
            width: i === active ? 22 : 6,
            opacity: i === active ? 1 : 0.45,
          }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          className="block h-1.5 rounded-full bg-ink-900"
        />
      ))}
    </div>
  )
}
