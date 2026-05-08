import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Bookmark,
  ChevronRight,
  Crown,
  ScanLine,
  Sparkles,
} from 'lucide-react'
import { GradientBackground } from '../components/layout/GradientBackground'
import { GlassButton } from '../components/ui/GlassButton'
import { AppNav } from '../components/layout/AppNav'
import { recipes } from '../data/mockData'

const RECENT = recipes.slice(0, 5)

const SAVED_COUNT = 12
const SCANS_TOTAL = 8
const SCANS_USED = 3

function getGreeting(now: Date = new Date()): string {
  const h = now.getHours()
  if (h >= 5 && h < 12) return 'Good morning'
  if (h >= 12 && h < 18) return 'Good afternoon'
  return 'Good evening'
}

export function Home() {
  const navigate = useNavigate()

  return (
    <div className="relative h-full w-full overflow-hidden">
      <GradientBackground variant="lavender" />

      <div className="no-scrollbar relative z-10 h-full overflow-y-auto pt-12 pb-28">
        {/* Greeting */}
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28, delay: 0.05 }}
          className="px-6 pb-4"
        >
          <h1 className="text-[24px] font-bold leading-tight tracking-tight text-ink-900">
            {getGreeting()}, Alex
          </h1>
          <p className="mt-1 text-[14px] text-ink-400">
            What's in your kitchen today?
          </p>
        </motion.header>

        {/* Hero scan CTA */}
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28, delay: 0.1 }}
          className="px-6"
        >
          <motion.div
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.985 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
            className="relative h-[280px] w-full overflow-hidden rounded-[2rem] border border-white/40 shadow-glass-lg"
          >
            <GradientBackground variant="sunset" />

            {/* Centered hero scan icon with glow + pulse */}
            <div className="absolute inset-x-0 top-0 flex h-[45%] items-center justify-center">
              {/* Soft radial glow behind icon */}
              <div className="absolute h-32 w-32 rounded-full bg-white/40 blur-2xl" />

              {/* Orbit dots — subtle scanning energy */}
              <motion.div
                aria-hidden
                animate={{ rotate: 360 }}
                transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
                className="absolute h-28 w-28"
              >
                <span className="absolute left-1/2 top-0 h-1 w-1 -translate-x-1/2 rounded-full bg-white/70" />
                <span className="absolute right-0 top-1/2 h-1 w-1 -translate-y-1/2 rounded-full bg-white/50" />
                <span className="absolute bottom-0 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-white/60" />
                <span className="absolute left-0 top-1/2 h-1 w-1 -translate-y-1/2 rounded-full bg-white/40" />
              </motion.div>

              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                className="relative text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)]"
              >
                <ScanLine className="h-[72px] w-[72px]" strokeWidth={1.5} />
              </motion.div>
            </div>

            {/* Glass info panel — bottom 55%, fades into gradient above */}
            <div
              className="absolute inset-x-0 bottom-0 h-[55%] rounded-b-[2rem] bg-white/30 px-5 pb-5 pt-6 backdrop-blur-md backdrop-saturate-180"
              style={{
                WebkitMaskImage:
                  'linear-gradient(to bottom, transparent 0%, black 24px, black 100%)',
                maskImage:
                  'linear-gradient(to bottom, transparent 0%, black 24px, black 100%)',
              }}
            >
              <h2 className="text-[20px] font-bold leading-tight tracking-tight text-ink-900">
                Scan your fridge
              </h2>
              <p className="mt-1 text-[13px] text-ink-500">
                Snap a photo and discover what you can cook.
              </p>
              <div className="mt-3">
                <GlassButton
                  variant="white-glass"
                  size="md"
                  onClick={() => navigate('/scan/fridge')}
                  trailingIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Scan now
                </GlassButton>
              </div>
            </div>
          </motion.div>
        </motion.section>

        {/* Stat pills */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28, delay: 0.18 }}
          className="mt-7 grid grid-cols-3 gap-2.5 px-6"
        >
          <StatPill
            icon={<Bookmark className="h-3.5 w-3.5" strokeWidth={2.5} />}
            value={`${SAVED_COUNT}`}
            label="saved"
            tone="saved"
          />
          <StatPill
            icon={<Sparkles className="h-3.5 w-3.5" strokeWidth={2.5} />}
            value={`${SCANS_USED}/${SCANS_TOTAL}`}
            label="scans used"
            tone="scans"
            progress={SCANS_USED / SCANS_TOTAL}
          />
          <StatPill
            icon={<Crown className="h-3.5 w-3.5" strokeWidth={2.5} />}
            value="PRO"
            label="upgrade"
            tone="pro"
            onClick={() => navigate('/paywall')}
          />
        </motion.section>

        {/* Recent recipes */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28, delay: 0.25 }}
          className="mt-8"
        >
          <div className="flex items-baseline justify-between px-6">
            <h3 className="text-lg font-bold tracking-tight text-ink-900">
              Recently viewed
            </h3>
            <button
              type="button"
              className="inline-flex items-center gap-0.5 text-sm font-medium text-ink-500 hover:text-ink-900"
            >
              See all
              <ChevronRight className="h-4 w-4" strokeWidth={2.25} />
            </button>
          </div>
          <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto px-6 pb-1">
            {RECENT.map((r) => (
              <RecipeMiniCard
                key={r.id}
                title={r.title}
                image={r.image}
                cuisine={r.tags[0]}
                onClick={() => navigate(`/recipe/${r.id}`)}
              />
            ))}
          </div>
        </motion.section>
      </div>

      <AppNav active="home" />
    </div>
  )
}

type StatTone = 'saved' | 'scans' | 'pro'

interface StatPillProps {
  icon: React.ReactNode
  value: string
  label: string
  tone: StatTone
  onClick?: () => void
  /** Optional 0–1 fraction. Renders a thin progress bar along the bottom edge. */
  progress?: number
}

interface ToneStyle {
  surface: string
  iconBg: string
  iconColor: string
  labelColor: string
  valueColor: string
  glow?: string
  progressTrack: string
  progressFill: string
}

const TONE_STYLES: Record<StatTone, ToneStyle> = {
  saved: {
    surface:
      'border-rose-200/55 bg-gradient-to-br from-white/80 via-rose-50/75 to-rose-100/65',
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-500',
    labelColor: 'text-rose-700/85',
    valueColor: 'text-ink-900',
    progressTrack: 'bg-rose-200/45',
    progressFill: 'bg-gradient-to-r from-rose-400 to-rose-500',
  },
  scans: {
    surface:
      'border-indigo-200/55 bg-gradient-to-br from-white/80 via-indigo-50/75 to-violet-100/65',
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-500',
    labelColor: 'text-indigo-700/85',
    valueColor: 'text-ink-900',
    progressTrack: 'bg-indigo-200/45',
    progressFill: 'bg-gradient-to-r from-indigo-400 to-violet-500',
  },
  pro: {
    surface:
      'border-amber-300/65 bg-gradient-to-br from-amber-200/85 via-yellow-100/85 to-orange-200/80',
    iconBg: 'bg-white/70',
    iconColor: 'text-amber-700',
    labelColor: 'text-amber-800',
    valueColor: 'text-amber-900',
    glow: 'shadow-[0_10px_28px_-12px_rgba(245,158,11,0.55)]',
    progressTrack: 'bg-amber-300/40',
    progressFill: 'bg-gradient-to-r from-amber-400 to-orange-500',
  },
}

function StatPill({ icon, value, label, tone, onClick, progress }: StatPillProps) {
  const t = TONE_STYLES[tone]
  const clampedProgress =
    progress === undefined ? undefined : Math.max(0, Math.min(1, progress))
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      whileHover={{ y: -1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={[
        'relative flex h-[92px] flex-col items-start justify-between overflow-hidden rounded-2xl border px-3 py-2.5 text-left shadow-glass-sm backdrop-blur-xl backdrop-saturate-180',
        t.surface,
        t.glow ?? '',
      ].join(' ')}
    >
      {/* subtle glossy highlight on top edge */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/55"
      />

      <span
        className={[
          'flex h-7 w-7 items-center justify-center rounded-full shadow-glass-sm ring-1 ring-white/55',
          t.iconBg,
          t.iconColor,
        ].join(' ')}
      >
        {icon}
      </span>

      <div>
        <p
          className={[
            'text-[22px] font-extrabold leading-none tracking-tight',
            t.valueColor,
          ].join(' ')}
        >
          {value}
        </p>
        <p
          className={[
            'mt-1 text-[10px] font-semibold uppercase tracking-wider',
            t.labelColor,
          ].join(' ')}
        >
          {label}
        </p>
      </div>

      {clampedProgress !== undefined && (
        <span
          aria-hidden
          className={[
            'pointer-events-none absolute inset-x-0 bottom-0 h-1 overflow-hidden',
            t.progressTrack,
          ].join(' ')}
        >
          <motion.span
            initial={{ width: 0 }}
            animate={{ width: `${clampedProgress * 100}%` }}
            transition={{ type: 'spring', stiffness: 180, damping: 28, delay: 0.35 }}
            className={['block h-full', t.progressFill].join(' ')}
          />
        </span>
      )}
    </motion.button>
  )
}

interface RecipeMiniCardProps {
  title: string
  image: string
  cuisine?: string
  onClick?: () => void
}

function RecipeMiniCard({ title, image, cuisine, onClick }: RecipeMiniCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className="relative h-[150px] w-[120px] flex-shrink-0 overflow-hidden rounded-2xl border border-white/30 bg-ink-100 shadow-glass-sm"
    >
      <img
        src={image}
        alt={title}
        loading="lazy"
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover"
      />

      {cuisine && (
        <span className="absolute left-2 top-2 rounded-full border border-white/50 bg-white/65 px-2 py-0.5 text-[10px] font-semibold tracking-tight text-ink-900 backdrop-blur-md backdrop-saturate-180">
          {cuisine}
        </span>
      )}

      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-2">
        <span className="line-clamp-2 text-left text-[12px] font-semibold leading-tight tracking-tight text-white">
          {title}
        </span>
      </div>
    </motion.button>
  )
}
