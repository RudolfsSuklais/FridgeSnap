import { motion } from 'framer-motion'

export function DynamicIsland() {
  return (
    <div className="pointer-events-none absolute left-1/2 top-2.5 z-40 -translate-x-1/2">
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: -4 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28, delay: 0.15 }}
        className="h-[34px] w-[120px] rounded-full bg-black shadow-[0_4px_14px_rgba(0,0,0,0.35)]"
        aria-hidden
      />
    </div>
  )
}
