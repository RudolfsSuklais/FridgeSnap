import { forwardRef } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'

type Blur = 'sm' | 'md' | 'lg'
type Tone = 'light' | 'dark'

interface GlassCardProps extends HTMLMotionProps<'div'> {
  blur?: Blur
  tone?: Tone
}

const BLUR: Record<Blur, string> = {
  sm: 'backdrop-blur-md',
  md: 'backdrop-blur-xl',
  lg: 'backdrop-blur-2xl',
}

const TONE: Record<Tone, string> = {
  light: 'bg-glass-light text-ink-900 border-white/30',
  dark: 'bg-glass-dark text-white border-white/10',
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(function GlassCard(
  { className = '', blur = 'md', tone = 'light', children, ...rest },
  ref,
) {
  return (
    <motion.div
      ref={ref}
      className={[
        'relative rounded-3xl border shadow-glass-md backdrop-saturate-180',
        BLUR[blur],
        TONE[tone],
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </motion.div>
  )
})
