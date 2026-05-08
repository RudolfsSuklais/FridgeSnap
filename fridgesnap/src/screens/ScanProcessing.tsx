import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { GradientBackground } from '../components/layout/GradientBackground'
import { useScan } from '../contexts/ScanContext'

const STATUS_TEXTS = [
  'Identifying ingredients…',
  'Matching with 10,000+ recipes…',
  'Personalising for your taste…',
  'Almost ready…',
]

const STATUS_INTERVAL = 800
const NAVIGATE_DELAY = STATUS_TEXTS.length * STATUS_INTERVAL + 400

export function ScanProcessing() {
  const navigate = useNavigate()
  const { items, incrementScan } = useScan()
  const [textIdx, setTextIdx] = useState(0)
  const incrementedRef = useRef(false)

  useEffect(() => {
    if (!incrementedRef.current) {
      incrementedRef.current = true
      incrementScan()
    }
  }, [incrementScan])

  useEffect(() => {
    const tick = window.setInterval(() => {
      setTextIdx((i) => Math.min(STATUS_TEXTS.length - 1, i + 1))
    }, STATUS_INTERVAL)
    const finish = window.setTimeout(
      () => navigate('/scan/meal-time'),
      NAVIGATE_DELAY,
    )
    return () => {
      window.clearInterval(tick)
      window.clearTimeout(finish)
    }
  }, [navigate])

  const visibleChips = items.slice(0, 8)

  return (
    <div className="relative h-full w-full overflow-hidden">
      <GradientBackground variant="mint" />

      <div className="relative z-10 flex h-full w-full flex-col items-center px-6 pb-12 pt-20">
        {/* Spinning gradient ring */}
        <div className="relative mt-6 h-44 w-44">
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                'conic-gradient(from 0deg, #FF8A65, #FF6B9D, #C56CF0, #7B61FF, #4FC3F7, #6EE7B7, #FFD4A3, #FF8A65)',
              filter: 'blur(2px)',
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'linear' }}
          />
          <div className="absolute inset-[6px] rounded-full bg-white/85 backdrop-blur-2xl backdrop-saturate-180" />
          <div className="absolute inset-[14px] flex items-center justify-center rounded-full border border-white/45 bg-white/70 shadow-glass-md backdrop-blur-2xl backdrop-saturate-180">
            <motion.div
              animate={{ scale: [1, 1.08, 1], rotate: [0, 8, -4, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              className="text-ink-700"
            >
              <Sparkles className="h-10 w-10" strokeWidth={1.5} />
            </motion.div>
          </div>
        </div>

        {/* Status text */}
        <div className="mt-8 h-7 w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={STATUS_TEXTS[textIdx]}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="text-center text-[16px] font-semibold tracking-tight text-ink-900"
            >
              {STATUS_TEXTS[textIdx]}
            </motion.div>
          </AnimatePresence>
        </div>

        <p className="mt-2 text-center text-[13px] text-ink-500">
          Hang tight — your recipe ideas are warming up.
        </p>

        {/* Ingredient chips (staggered) */}
        <motion.div
          className="mt-auto flex flex-wrap items-center justify-center gap-1.5 px-2"
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: { staggerChildren: 0.08, delayChildren: 1.2 },
            },
          }}
        >
          {visibleChips.map((item) => (
            <motion.span
              key={item.name}
              variants={{
                hidden: { opacity: 0, y: 12, scale: 0.9 },
                visible: {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: { type: 'spring', stiffness: 380, damping: 24 },
                },
              }}
              className="rounded-full border border-white/45 bg-white/65 px-3 py-1.5 text-[12px] font-medium tracking-tight text-ink-700 shadow-glass-sm backdrop-blur-md"
            >
              {item.name}
            </motion.span>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
