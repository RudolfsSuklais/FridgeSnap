import { useState, type ReactNode } from 'react'
import { motion, LayoutGroup, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  Heart,
  Infinity as InfinityIcon,
  Sparkles,
  X,
  Zap,
} from 'lucide-react'
import { GlassCard } from '../components/ui/GlassCard'
import { useScan } from '../contexts/ScanContext'

type Plan = 'monthly' | 'yearly'

interface Feature {
  id: string
  icon: ReactNode
  title: string
  desc: string
  iconBg: string
  iconColor: string
}

function buildFeatures(scanLimit: number): Feature[] {
  return [
    {
      id: 'scans',
      icon: <InfinityIcon className="h-5 w-5" strokeWidth={2.25} />,
      title: 'Unlimited scans & recipes',
      desc: `Free includes ${scanLimit} scans — Pro is unlimited`,
      iconBg: 'bg-indigo-400/30 border-indigo-200/50',
      iconColor: 'text-indigo-50',
    },
    {
      id: 'planning',
      icon: <Sparkles className="h-5 w-5" strokeWidth={2.25} />,
      title: 'AI meal planning',
      desc: 'Personalized weekly menus',
      iconBg: 'bg-pink-400/30 border-pink-200/50',
      iconColor: 'text-pink-50',
    },
    {
      id: 'recipes',
      icon: <Heart className="h-5 w-5" strokeWidth={2.25} />,
      title: 'Save unlimited recipes',
      desc: 'Build your dream cookbook',
      iconBg: 'bg-rose-400/30 border-rose-200/50',
      iconColor: 'text-rose-50',
    },
    {
      id: 'lists',
      icon: <Zap className="h-5 w-5" strokeWidth={2.25} />,
      title: 'Smart shopping lists',
      desc: 'Auto-generate from missing ingredients',
      iconBg: 'bg-amber-400/30 border-amber-200/50',
      iconColor: 'text-amber-50',
    },
  ]
}

export function Paywall() {
  const navigate = useNavigate()
  const [plan, setPlan] = useState<Plan>('yearly')
  const { scanLimit } = useScan()
  const features = buildFeatures(scanLimit)

  const handleStartTrial = () => {
    window.alert('Demo: subscription flow')
  }

  const handleRestore = () => {
    window.alert('Demo: restore purchases')
  }

  return (
    <motion.div
      key="paywall-page"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 280, damping: 32 }}
      className="absolute inset-0 overflow-hidden"
    >
      <PremiumBackground />

      {/* Top-of-screen radial halo to make the crown pop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[55%]"
        style={{
          background:
            'radial-gradient(60% 80% at 50% 20%, rgba(255,224,170,0.32) 0%, rgba(255,160,210,0.10) 40%, transparent 75%)',
        }}
      />

      {/* Close button */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        aria-label="Close"
        className="absolute left-4 top-12 z-30 flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white shadow-glass-sm backdrop-blur-xl backdrop-saturate-180 transition-colors hover:bg-white/25"
      >
        <X className="h-4 w-4" strokeWidth={2.5} />
      </button>

      {/* Scrollable content */}
      <div className="no-scrollbar relative z-10 h-full overflow-y-auto pb-44 pt-16">
        <HeroSection />
        <FeaturesSection features={features} />
        <PricingSection plan={plan} onSelect={setPlan} />
      </div>

      {/* Sticky bottom CTA */}
      <StickyCTA plan={plan} onStart={handleStartTrial} onRestore={handleRestore} />
    </motion.div>
  )
}

function PremiumBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Base wash: deep purple → magenta → gold */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(165deg, #2A0F4A 0%, #4B1668 28%, #872A8A 55%, #C5469B 78%, #E8A463 100%)',
        }}
      />

      {/* Saturated blobs */}
      <motion.div
        className="absolute -left-24 -top-32 h-[22rem] w-[22rem] rounded-full"
        style={{ background: '#7B1FA2', filter: 'blur(80px)', opacity: 0.7 }}
        animate={{ x: [0, 30, -10, 0], y: [0, 20, -15, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute right-[-6rem] top-1/4 h-[24rem] w-[24rem] rounded-full"
        style={{ background: '#E91E63', filter: 'blur(90px)', opacity: 0.55 }}
        animate={{ x: [0, -25, 20, 0], y: [0, 30, -10, 0] }}
        transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-32 left-1/4 h-[26rem] w-[26rem] rounded-full"
        style={{ background: '#FFB74D', filter: 'blur(90px)', opacity: 0.5 }}
        animate={{ x: [0, 20, -25, 0], y: [0, -20, 15, 0] }}
        transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-1/3 -left-20 h-72 w-72 rounded-full"
        style={{ background: '#9C27B0', filter: 'blur(70px)', opacity: 0.45 }}
        animate={{ x: [0, 30, 0, 0], y: [0, -15, 20, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Subtle vignette to deepen edges */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 80% at 50% 60%, transparent 50%, rgba(20,5,40,0.35) 100%)',
        }}
      />
    </div>
  )
}

function HeroSection() {
  const { scansUsed, scanLimit } = useScan()
  const usedClamped = Math.min(scansUsed, scanLimit)
  const isCapped = usedClamped >= scanLimit
  return (
    <section className="relative px-6 pt-12">
      {/* Headline + subtext */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26, delay: 0.25 }}
        className="flex flex-col items-center text-center"
      >
        {/* Free-tier limit indicator — wired to real scan count */}
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-amber-200/40 bg-amber-400/15 px-3 py-1 text-[11px] font-semibold text-amber-100 shadow-glass-sm backdrop-blur-md">
          <AlertCircle className="h-3 w-3" strokeWidth={2.5} />
          <span>
            {isCapped
              ? `All ${scanLimit} free scans used`
              : `${usedClamped} of ${scanLimit} free scans used`}
          </span>
        </div>

        <h1
          className="bg-clip-text text-[28px] font-extrabold leading-[1.1] tracking-tight text-transparent"
          style={{
            backgroundImage:
              'linear-gradient(135deg, #FFFFFF 0%, #FFE3B0 50%, #FFB1D8 100%)',
          }}
        >
          Unlock FridgeSnap Pro
        </h1>
        <p className="mt-1.5 text-[14px] font-medium text-white/70">
          {scanLimit} free scans, then go unlimited.
        </p>
      </motion.div>
    </section>
  )
}

interface FeaturesSectionProps {
  features: Feature[]
}

function FeaturesSection({ features }: FeaturesSectionProps) {
  const containerVariants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.1, delayChildren: 0.35 },
    },
  }

  const rowVariants = {
    hidden: { opacity: 0, x: 32 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { type: 'spring', stiffness: 320, damping: 28 } as const,
    },
  }

  return (
    <motion.section
      className="mt-6 space-y-2.5 px-5"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {features.map((f) => (
        <motion.div key={f.id} variants={rowVariants}>
          <GlassCard
            tone="dark"
            blur="md"
            className="flex items-center gap-3 border-white/15 bg-white/10 px-3.5 py-3"
          >
            <div
              className={[
                'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border backdrop-blur-md',
                f.iconBg,
                f.iconColor,
              ].join(' ')}
            >
              {f.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-semibold leading-tight tracking-tight text-white">
                {f.title}
              </div>
              <div className="mt-0.5 text-[12.5px] leading-snug text-white/60">
                {f.desc}
              </div>
            </div>
          </GlassCard>
        </motion.div>
      ))}
    </motion.section>
  )
}

interface PricingSectionProps {
  plan: Plan
  onSelect: (p: Plan) => void
}

function PricingSection({ plan, onSelect }: PricingSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 28, delay: 0.85 }}
      className="mt-5 px-5"
    >
      <LayoutGroup id="plan-ring">
        <div className="grid grid-cols-2 gap-3 pt-4">
          <PlanCard
            type="monthly"
            selected={plan === 'monthly'}
            onSelect={() => onSelect('monthly')}
            label="Monthly"
            price="€4.99"
            unit="month"
          />
          <PlanCard
            type="yearly"
            selected={plan === 'yearly'}
            onSelect={() => onSelect('yearly')}
            label="Yearly"
            price="€39.99"
            unit="year"
            strike="€59.88"
            badge="Save 33%"
            popular
          />
        </div>
      </LayoutGroup>
    </motion.section>
  )
}

interface PlanCardProps {
  type: Plan
  selected: boolean
  onSelect: () => void
  label: string
  price: string
  unit: string
  strike?: string
  badge?: string
  popular?: boolean
}

function PlanCard({
  selected,
  onSelect,
  label,
  price,
  unit,
  strike,
  badge,
  popular,
}: PlanCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileTap={{ scale: 0.97 }}
      animate={{ scale: popular ? 1.04 : 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
      className="relative text-left"
    >
      {/* Popular badge */}
      {popular && (
        <div className="absolute -top-3 left-1/2 z-20 -translate-x-1/2">
          <div
            className="rounded-full border border-white/30 px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-wider text-white shadow-glass-sm backdrop-blur-md"
            style={{
              background:
                'linear-gradient(135deg, #FF8FB1 0%, #C56CF0 60%, #FFC371 100%)',
            }}
          >
            Most Popular
          </div>
        </div>
      )}

      {/* Animated selection ring */}
      <AnimatePresence>
        {selected && (
          <motion.div
            layoutId="plan-selection-ring"
            className="pointer-events-none absolute inset-0 rounded-3xl"
            style={{
              boxShadow:
                '0 0 0 2px rgba(255,255,255,0.85), 0 0 24px rgba(255,200,140,0.55)',
            }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          />
        )}
      </AnimatePresence>

      <GlassCard
        tone="dark"
        blur="md"
        className={[
          'flex h-full flex-col items-center justify-center px-3 text-center',
          popular
            ? 'border-white/25 bg-white/15 pb-4 pt-6'
            : 'border-white/15 bg-white/8 py-4',
        ].join(' ')}
      >
        <div className="text-[11px] font-semibold uppercase tracking-wider text-white/55">
          {label}
        </div>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="text-[24px] font-extrabold leading-none tracking-tight text-white">
            {price}
          </span>
          <span className="text-[11px] font-medium text-white/55">/ {unit}</span>
        </div>
        {strike && (
          <div className="mt-1 text-[11px] text-white/40 line-through">{strike}</div>
        )}
        {badge && (
          <div className="mt-1.5 rounded-full border border-emerald-300/40 bg-emerald-400/20 px-2 py-0.5 text-[10px] font-bold text-emerald-100">
            {badge}
          </div>
        )}
      </GlassCard>
    </motion.button>
  )
}

interface StickyCTAProps {
  plan: Plan
  onStart: () => void
  onRestore: () => void
}

function StickyCTA({ plan, onStart, onRestore }: StickyCTAProps) {
  const subtext =
    plan === 'yearly'
      ? '€39.99/year · Cancel anytime'
      : '€4.99/month · Cancel anytime'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 28, delay: 1.0 }}
      className="absolute inset-x-0 bottom-0 z-20 px-5 pb-6 pt-4"
      style={{
        background:
          'linear-gradient(to top, rgba(20,5,40,0.7) 0%, rgba(20,5,40,0.45) 60%, transparent 100%)',
      }}
    >
      <motion.button
        type="button"
        onClick={onStart}
        whileTap={{ scale: 0.97 }}
        whileHover={{ y: -1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        className="relative w-full overflow-hidden rounded-full border border-white/40 px-6 py-4 text-[15px] font-bold tracking-tight text-ink-900 shadow-glass-lg"
        style={{
          background:
            'linear-gradient(135deg, #FFFFFF 0%, #FFE7C2 55%, #FFD0A1 100%)',
          boxShadow:
            '0 10px 30px rgba(255,180,120,0.45), 0 0 0 1px rgba(255,255,255,0.4) inset, 0 1px 0 rgba(255,255,255,0.7) inset',
        }}
      >
        Upgrade to Pro
      </motion.button>

      <p className="mt-2 text-center text-[11.5px] font-medium text-white/60">
        {subtext}
      </p>

      <button
        type="button"
        onClick={onRestore}
        className="mt-2 block w-full text-center text-[12px] font-semibold text-white/70 transition-colors hover:text-white"
      >
        Already a member? <span className="underline underline-offset-2">Restore</span>
      </button>
    </motion.div>
  )
}
