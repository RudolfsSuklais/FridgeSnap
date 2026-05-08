import { AnimatePresence, animate, motion, useMotionValue } from 'framer-motion'
import { Camera } from 'lucide-react'
import { useEffect } from 'react'
import { MockFridgeInterior } from './MockFridgeInterior'

export type ViewfinderState = 'idle' | 'flash' | 'scanning' | 'success'
export type ViewfinderTone = 'fridge' | 'pantry'

interface ViewfinderProps {
  state: ViewfinderState
  statusText?: string
  hint?: string
  onCaptureTap?: () => void
  tone?: ViewfinderTone
  className?: string
}

const TONE_BG: Record<ViewfinderTone, string> = {
  fridge: 'linear-gradient(155deg, #131828 0%, #1B2236 50%, #1A2332 100%)',
  pantry: 'linear-gradient(155deg, #281E14 0%, #2F2010 50%, #1F140B 100%)',
}

export function Viewfinder({
  state,
  statusText,
  hint = 'Tap to capture or upload a photo',
  onCaptureTap,
  tone = 'fridge',
  className = '',
}: ViewfinderProps) {
  const isIdle = state === 'idle'
  const isScanning = state === 'scanning'
  const isSuccess = state === 'success'

  // 0 → 1 over the 1.5s scan window. Drives item highlight sequencing
  // inside MockFridgeInterior. Held at 1 during success so checkmarks stay.
  const scanProgress = useMotionValue(0)
  useEffect(() => {
    if (state === 'scanning') {
      scanProgress.set(0)
      const controls = animate(scanProgress, 1, { duration: 1.5, ease: 'linear' })
      return () => controls.stop()
    }
    if (state === 'success') {
      scanProgress.set(1)
      return
    }
    if (state === 'idle') {
      scanProgress.set(0)
    }
  }, [state, scanProgress])

  return (
    <div
      className={[
        'relative aspect-[7/9] w-full overflow-hidden rounded-[2rem] border border-white/10 shadow-glass-lg',
        className,
      ].join(' ')}
      style={{ background: TONE_BG[tone] }}
    >
      {/* subtle vignette so brackets pop */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 80% at 50% 50%, transparent 50%, rgba(0,0,0,0.45) 100%)',
        }}
      />

      {/* Mock fridge / pantry interior — visible in all states. */}
      <div className="pointer-events-none absolute inset-[3%]" aria-hidden>
        <MockFridgeInterior
          variant={tone}
          scanning={isScanning || isSuccess}
          scanProgress={scanProgress}
          state={state}
          className="h-full w-full"
        />
      </div>

      {/* Centered camera tap target */}
      <button
        type="button"
        onClick={onCaptureTap}
        disabled={!isIdle || !onCaptureTap}
        aria-label="Capture photo"
        className="absolute inset-0 flex items-center justify-center disabled:cursor-default"
      >
        <motion.div
          animate={
            isIdle
              ? { scale: [1, 1.05, 1], opacity: [0.85, 1, 0.85] }
              : { scale: 0.85, opacity: 0 }
          }
          transition={
            isIdle
              ? { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 0.25 }
          }
          className="flex h-20 w-20 items-center justify-center rounded-full border border-white/20 bg-white/12 text-white shadow-glass-md backdrop-blur-md backdrop-saturate-180"
        >
          <Camera className="h-9 w-9" strokeWidth={1.4} />
        </motion.div>
      </button>

      {/* Corner brackets */}
      <Bracket position="tl" glow={isSuccess} />
      <Bracket position="tr" glow={isSuccess} />
      <Bracket position="br" glow={isSuccess} />
      <Bracket position="bl" glow={isSuccess} />

      {/* Scan line (ping-pong: top → bottom → top, 1.5s) */}
      <motion.div
        className="pointer-events-none absolute inset-x-6 h-[3px] rounded-full"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(110,231,183,0.95) 50%, transparent 100%)',
          filter: 'drop-shadow(0 0 14px rgba(110,231,183,0.85))',
        }}
        initial={{ top: '0%', opacity: 0 }}
        animate={
          isScanning
            ? { top: ['0%', '100%', '0%'], opacity: 1 }
            : { opacity: 0 }
        }
        transition={
          isScanning
            ? {
                top: { duration: 1.5, ease: 'linear', times: [0, 0.5, 1] },
                opacity: { duration: 0.18 },
              }
            : { duration: 0.2 }
        }
      />

      {/* Capture flash overlay */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-white"
        animate={{ opacity: state === 'flash' ? 1 : 0 }}
        transition={{ duration: 0.1, ease: 'easeOut' }}
      />

      {/* Status text overlay (visible while scanning) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-7 flex justify-center px-6">
        <AnimatePresence mode="wait">
          {isScanning && statusText ? (
            <motion.div
              key={statusText}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="rounded-full border border-white/15 bg-black/55 px-3.5 py-1.5 text-[12px] font-medium text-white backdrop-blur-md"
            >
              {statusText}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Idle hint */}
      <AnimatePresence>
        {isIdle && hint ? (
          <motion.div
            key="hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-x-0 bottom-5 text-center text-[12px] font-medium text-white/65"
          >
            {hint}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

interface BracketProps {
  position: 'tl' | 'tr' | 'br' | 'bl'
  glow: boolean
}

const POSITION: Record<BracketProps['position'], string> = {
  tl: 'top-4 left-4',
  tr: 'top-4 right-4',
  br: 'bottom-4 right-4',
  bl: 'bottom-4 left-4',
}

const ROTATE: Record<BracketProps['position'], number> = {
  tl: 0,
  tr: 90,
  br: 180,
  bl: 270,
}

function Bracket({ position, glow }: BracketProps) {
  return (
    <motion.div
      initial={{ rotate: ROTATE[position] }}
      animate={{
        rotate: ROTATE[position],
        color: glow ? 'rgb(52, 211, 153)' : 'rgba(255, 255, 255, 0.55)',
        filter: glow ? 'drop-shadow(0 0 8px rgba(52,211,153,0.85))' : 'none',
      }}
      transition={{ duration: 0.3 }}
      className={`pointer-events-none absolute ${POSITION[position]}`}
    >
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden>
        <path
          d="M2 14 L2 6 Q2 2 6 2 L14 2"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </motion.div>
  )
}
