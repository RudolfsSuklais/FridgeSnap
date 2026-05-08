import { motion } from 'framer-motion'
import type { GradientVariant } from '../../types'

interface GradientBackgroundProps {
  variant?: GradientVariant
}

const PALETTES: Record<GradientVariant, { a: string; b: string; c: string; wash: string }> = {
  sunset: {
    a: '#FF8A65',
    b: '#FF6B9D',
    c: '#C56CF0',
    wash: 'linear-gradient(160deg, #FFE3D5 0%, #FFD8E6 50%, #ECDCFF 100%)',
  },
  ocean: {
    a: '#4FC3F7',
    b: '#5C7AEA',
    c: '#7B61FF',
    wash: 'linear-gradient(160deg, #DCF1FF 0%, #DCE2FF 50%, #E2D8FF 100%)',
  },
  mint: {
    a: '#6EE7B7',
    b: '#34D399',
    c: '#06B6D4',
    wash: 'linear-gradient(160deg, #DCFFEE 0%, #D6FAEA 50%, #D1F1F8 100%)',
  },
  lavender: {
    a: '#C7B4FF',
    b: '#FFB4E6',
    c: '#FFD4A3',
    wash: 'linear-gradient(160deg, #E8DFFF 0%, #FFE0F2 50%, #FFEAD3 100%)',
  },
}

export function GradientBackground({ variant = 'sunset' }: GradientBackgroundProps) {
  const p = PALETTES[variant]
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0" style={{ background: p.wash }} />

      <motion.div
        className="absolute -left-20 -top-24 h-80 w-80 rounded-full opacity-70"
        style={{ background: p.a, filter: 'blur(64px)' }}
        animate={{ x: [0, 40, -10, 0], y: [0, 30, -20, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-1/3 -right-24 h-96 w-96 rounded-full opacity-60"
        style={{ background: p.b, filter: 'blur(72px)' }}
        animate={{ x: [0, -30, 20, 0], y: [0, 40, -10, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-32 left-1/4 h-[28rem] w-[28rem] rounded-full opacity-65"
        style={{ background: p.c, filter: 'blur(80px)' }}
        animate={{ x: [0, 30, -20, 0], y: [0, -20, 30, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}
