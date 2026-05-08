import { motion } from 'framer-motion'
import { User } from 'lucide-react'
import { GradientBackground } from '../components/layout/GradientBackground'
import { GlassCard } from '../components/ui/GlassCard'
import { AppNav } from '../components/layout/AppNav'

export function Profile() {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <GradientBackground variant="lavender" />
      <div className="relative z-10 flex h-full w-full items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="w-full"
        >
          <GlassCard tone="light" blur="lg" className="px-6 py-7 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/55 text-ink-900 shadow-glass-sm">
              <User className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <h1 className="mt-3 text-[20px] font-bold tracking-tight text-ink-900">
              Profile
            </h1>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-500">
              Account, preferences, and Pro upgrade. Coming soon.
            </p>
          </GlassCard>
        </motion.div>
      </div>
      <AppNav active="profile" />
    </div>
  )
}
