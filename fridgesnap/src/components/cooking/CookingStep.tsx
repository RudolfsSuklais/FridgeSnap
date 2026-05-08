import { motion } from 'framer-motion'
import type { ParsedTimerHint } from '../../types'

interface CookingStepProps {
  index: number
  total: number
  text: string
  hint: ParsedTimerHint | null
  onStartTimer: (hint: ParsedTimerHint) => void
}

export function CookingStep({ index, total, text, hint, onStartTimer }: CookingStepProps) {
  return (
    <motion.div
      key={index}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      className="flex h-full flex-col items-center justify-center px-6 text-center"
    >
      <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-white/55">
        Step {index + 1} of {total}
      </p>
      <p className="mt-4 text-[28px] font-bold leading-[1.2] tracking-tight text-white">
        {text}
      </p>

      {hint && (
        <button
          type="button"
          onClick={() => onStartTimer(hint)}
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-5 py-2.5 text-[14px] font-bold text-white shadow-glass-sm backdrop-blur-md transition-colors hover:bg-white/25"
        >
          <span aria-hidden>⏱</span>
          Start {hint.minutes} min — {hint.label}
        </button>
      )}
    </motion.div>
  )
}
