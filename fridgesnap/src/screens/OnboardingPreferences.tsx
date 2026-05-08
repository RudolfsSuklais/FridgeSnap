import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Check, Plus, X } from 'lucide-react'
import { GradientBackground } from '../components/layout/GradientBackground'
import { GlassButton } from '../components/ui/GlassButton'

const PRESET_DISLIKES = [
  'Cilantro',
  'Mushrooms',
  'Olives',
  'Spicy food',
  'Seafood',
  'Pork',
  'Beef',
  'Lamb',
  'Eggs',
  'Dairy',
  'Gluten',
  'Peanuts',
  'Tree nuts',
  'Soy',
  'Shellfish',
  'Onions',
]

const STORAGE_KEY = 'fridgesnap:dislikes'

interface StoredDislikes {
  presets: string[]
  custom: string[]
}

function loadStored(): StoredDislikes {
  if (typeof window === 'undefined') return { presets: [], custom: [] }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { presets: [], custom: [] }
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') {
      return { presets: [], custom: [] }
    }
    const obj = parsed as { presets?: unknown; custom?: unknown }
    const presets = Array.isArray(obj.presets)
      ? obj.presets.filter((v): v is string => typeof v === 'string')
      : []
    const custom = Array.isArray(obj.custom)
      ? obj.custom.filter((v): v is string => typeof v === 'string')
      : []
    return { presets, custom }
  } catch {
    return { presets: [], custom: [] }
  }
}

function saveStored(data: StoredDislikes): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    /* localStorage may be unavailable (private mode, quota) — silent skip. */
  }
}

export function OnboardingPreferences() {
  const navigate = useNavigate()
  const initial = useMemo(() => loadStored(), [])
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(initial.presets),
  )
  const [custom, setCustom] = useState<string[]>(initial.custom)
  const [input, setInput] = useState('')

  const togglePreset = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const addCustom = () => {
    const trimmed = input.trim()
    if (!trimmed) return
    const lower = trimmed.toLowerCase()
    const presetMatch = PRESET_DISLIKES.find((p) => p.toLowerCase() === lower)
    if (presetMatch) {
      // If they typed a preset name, just toggle it on.
      setSelected((prev) => new Set(prev).add(presetMatch))
      setInput('')
      return
    }
    if (custom.some((c) => c.toLowerCase() === lower)) {
      setInput('')
      return
    }
    setCustom((prev) => [...prev, trimmed])
    setInput('')
  }

  const removeCustom = (name: string) => {
    setCustom((prev) => prev.filter((n) => n !== name))
  }

  const finish = () => {
    saveStored({ presets: Array.from(selected), custom })
    navigate('/home')
  }

  const skip = () => {
    saveStored({ presets: [], custom: [] })
    navigate('/home')
  }

  const totalCount = selected.size + custom.length

  return (
    <div className="relative h-full w-full overflow-hidden">
      <GradientBackground variant="lavender" />

      <div className="relative z-10 flex h-full w-full flex-col px-6 pb-8 pt-14">
        {/* Header — fixed top */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          className="flex-shrink-0"
        >
          <span className="inline-flex items-center gap-1 rounded-full border border-white/45 bg-white/55 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-ink-700 shadow-glass-sm backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Almost done
          </span>
          <h1 className="mt-3 text-[26px] font-bold leading-tight tracking-tight text-ink-900">
            Anything you don't like?
          </h1>
          <p className="mt-1 text-[14px] text-ink-500">
            We'll skip recipes with these. You can change this anytime.
          </p>
        </motion.div>

        {/* Scrollable middle: chips + input + custom list */}
        <div className="no-scrollbar -mx-6 mt-4 flex-1 overflow-y-auto px-6 pb-2">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28, delay: 0.06 }}
            className="flex flex-wrap gap-1.5"
          >
            {PRESET_DISLIKES.map((name) => {
              const isOn = selected.has(name)
              return (
                <Chip
                  key={name}
                  label={name}
                  selected={isOn}
                  onClick={() => togglePreset(name)}
                />
              )
            })}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28, delay: 0.12 }}
            className="mt-5"
          >
            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-ink-500">
              Add your own
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addCustom()
                  }
                }}
                placeholder="e.g. Goat cheese"
                className="flex-1 rounded-2xl border border-white/45 bg-white/65 px-3.5 py-2.5 text-[14px] font-medium tracking-tight text-ink-900 shadow-glass-sm backdrop-blur-md placeholder:text-ink-300 focus:border-indigo-400/65 focus:outline-none focus:ring-2 focus:ring-indigo-300/40"
              />
              <motion.button
                type="button"
                onClick={addCustom}
                disabled={!input.trim()}
                whileTap={{ scale: 0.92 }}
                transition={{ type: 'spring', stiffness: 500, damping: 26 }}
                aria-label="Add"
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-ink-900 text-white shadow-glass-sm disabled:opacity-40"
              >
                <Plus className="h-5 w-5" strokeWidth={2.5} />
              </motion.button>
            </div>

            <AnimatePresence initial={false}>
              {custom.length > 0 && (
                <motion.div
                  key="custom-list"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    <AnimatePresence initial={false}>
                      {custom.map((name) => (
                        <CustomChip
                          key={name}
                          label={name}
                          onRemove={() => removeCustom(name)}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Bottom actions — fixed */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28, delay: 0.2 }}
          className="flex flex-shrink-0 flex-col gap-2 pt-2"
        >
          <GlassButton
            variant="primary"
            size="lg"
            fullWidth
            onClick={finish}
            trailingIcon={<ArrowRight className="h-4 w-4" strokeWidth={2.25} />}
          >
            {totalCount > 0
              ? `Continue with ${totalCount} ${totalCount === 1 ? 'rule' : 'rules'}`
              : 'Continue'}
          </GlassButton>
          <button
            type="button"
            onClick={skip}
            className="self-center text-[13px] font-semibold text-ink-500 underline-offset-4 hover:underline"
          >
            Skip for now
          </button>
        </motion.div>
      </div>
    </div>
  )
}

interface ChipProps {
  label: string
  selected: boolean
  onClick: () => void
}

function Chip({ label, selected, onClick }: ChipProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
      className={[
        'inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[13px] font-semibold tracking-tight shadow-glass-sm backdrop-blur-md transition-colors duration-150',
        selected
          ? 'border-ink-900 bg-ink-900 text-white'
          : 'border-white/45 bg-white/55 text-ink-700 hover:bg-white/70',
      ].join(' ')}
    >
      {selected && <Check className="h-3 w-3" strokeWidth={3} />}
      {label}
    </motion.button>
  )
}

interface CustomChipProps {
  label: string
  onRemove: () => void
}

function CustomChip({ label, onRemove }: CustomChipProps) {
  return (
    <motion.span
      layout
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ type: 'spring', stiffness: 380, damping: 24 }}
      className="inline-flex items-center gap-1 rounded-full border border-indigo-300/60 bg-indigo-100/75 px-2.5 py-1 text-[13px] font-semibold tracking-tight text-indigo-800 shadow-glass-sm backdrop-blur-md"
    >
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label}`}
        className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-indigo-300/65 text-indigo-900 hover:bg-indigo-300/85"
      >
        <X className="h-2.5 w-2.5" strokeWidth={3} />
      </button>
    </motion.span>
  )
}
