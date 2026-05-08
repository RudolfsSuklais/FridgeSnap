import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

export interface NavItem {
  key: string
  label?: string
  icon: ReactNode
  prominent?: boolean
}

interface GlassNavBarProps {
  items: NavItem[]
  active: string
  onChange: (key: string) => void
}

export function GlassNavBar({ items, active, onChange }: GlassNavBarProps) {
  const regular = items.filter((i) => !i.prominent)
  const prominent = items.find((i) => i.prominent)

  // Split regular items in half so the prominent FAB sits visually between them.
  const half = Math.ceil(regular.length / 2)
  const left = regular.slice(0, half)
  const right = regular.slice(half)

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 px-4 pb-3 pt-7">
      <div className="pointer-events-auto relative">
        <div className="glass-light flex h-16 items-stretch rounded-full border border-white/40 shadow-glass-md">
          <div className="flex flex-1 items-center justify-around">
            {left.map((item) => (
              <RegularTab
                key={item.key}
                item={item}
                active={item.key === active}
                onClick={() => onChange(item.key)}
              />
            ))}
          </div>

          {/* Center spacer reserved for the prominent FAB. */}
          {prominent && <div aria-hidden className="w-16 shrink-0" />}

          <div className="flex flex-1 items-center justify-around">
            {right.map((item) => (
              <RegularTab
                key={item.key}
                item={item}
                active={item.key === active}
                onClick={() => onChange(item.key)}
              />
            ))}
          </div>
        </div>

        {prominent && (
          <ProminentTab
            item={prominent}
            onClick={() => onChange(prominent.key)}
          />
        )}
      </div>
    </div>
  )
}

interface RegularTabProps {
  item: NavItem
  active: boolean
  onClick: () => void
}

function RegularTab({ item, active, onClick }: RegularTabProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={item.label ?? item.key}
      whileTap={{ scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className="relative flex h-11 w-11 items-center justify-center rounded-full"
    >
      {active && (
        <motion.span
          layoutId="navBarPill"
          className="absolute inset-0 -z-10 rounded-full bg-white/65 shadow-glass-sm"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
      <span className={active ? 'text-ink-900' : 'text-ink-400'}>{item.icon}</span>
    </motion.button>
  )
}

interface ProminentTabProps {
  item: NavItem
  onClick: () => void
}

function ProminentTab({ item, onClick }: ProminentTabProps) {
  // Positioning (translate) lives on a static wrapper so framer-motion's
  // whileTap transform doesn't overwrite it and "drop" the FAB on press.
  return (
    <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-[38%]">
      <motion.button
        type="button"
        onClick={onClick}
        aria-label={item.label ?? item.key}
        whileTap={{ scale: 0.92 }}
        transition={{ type: 'spring', stiffness: 500, damping: 28 }}
        className="pointer-events-auto flex h-[60px] w-[60px] items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-glass-lg ring-[3px] ring-white/70"
      >
        <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]">{item.icon}</span>
      </motion.button>
    </div>
  )
}
