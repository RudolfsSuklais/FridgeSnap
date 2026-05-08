import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { GlassCard } from '../components/ui/GlassCard'
import { GradientBackground } from '../components/layout/GradientBackground'

export function Home() {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <GradientBackground variant="ocean" />

      <div className="relative z-10 flex h-full w-full items-center justify-center px-6">
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          className="w-full"
        >
          <GlassCard tone="light" blur="lg" className="px-6 py-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/55 text-ink-900 shadow-glass-sm">
              <Sparkles className="h-6 w-6" strokeWidth={1.75} />
            </div>
            <h1 className="mt-4 text-[22px] font-bold tracking-tight text-ink-900">
              Home
            </h1>
            <p className="mt-1.5 text-[14px] leading-relaxed text-ink-500">
              Coming next session.
            </p>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  )
}
