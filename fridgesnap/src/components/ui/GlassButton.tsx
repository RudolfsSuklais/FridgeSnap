import type { ReactNode } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'

type Variant = 'primary' | 'secondary' | 'ghost' | 'white-glass'
type Size = 'sm' | 'md' | 'lg'

interface GlassButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: Variant
  size?: Size
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
  fullWidth?: boolean
  children?: ReactNode
}

const VARIANT: Record<Variant, string> = {
  primary:
    'bg-ink-900 text-white border-white/10 shadow-glass-md hover:shadow-glass-lg',
  secondary:
    'bg-white/65 text-ink-900 border-white/40 backdrop-blur-xl backdrop-saturate-180 shadow-glass-sm',
  ghost:
    'bg-white/15 text-white border-white/20 backdrop-blur-xl backdrop-saturate-180',
  'white-glass':
    'bg-white/90 text-ink-900 border-white/60 backdrop-blur-xl backdrop-saturate-180 shadow-glass-sm hover:bg-white',
}

const SIZE: Record<Size, string> = {
  sm: 'h-10 px-5 text-sm',
  md: 'h-12 px-6 text-[15px]',
  lg: 'h-14 px-7 text-base',
}

export function GlassButton({
  variant = 'primary',
  size = 'md',
  className = '',
  leadingIcon,
  trailingIcon,
  fullWidth = false,
  children,
  ...rest
}: GlassButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={[
        'inline-flex select-none items-center justify-center gap-2 rounded-full border font-semibold tracking-tight outline-none transition-shadow duration-200',
        'focus-visible:ring-2 focus-visible:ring-white/60',
        VARIANT[variant],
        SIZE[size],
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {leadingIcon}
      <span>{children}</span>
      {trailingIcon}
    </motion.button>
  )
}
