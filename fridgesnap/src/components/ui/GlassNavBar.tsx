import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

export interface NavItem {
  key: string
  label: string
  icon: ReactNode
}

interface GlassNavBarProps {
  items: NavItem[]
  active: string
  onChange: (key: string) => void
}

export function GlassNavBar({ items, active, onChange }: GlassNavBarProps) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-30 px-4 pb-3 pt-2">
      <div className="glass-light flex h-16 items-center justify-around rounded-full border border-white/40 px-3 shadow-glass-md">
        {items.map((item) => {
          const isActive = item.key === active
          return (
            <motion.button
              key={item.key}
              type="button"
              onClick={() => onChange(item.key)}
              whileTap={{ scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="relative flex min-w-[44px] flex-col items-center justify-center gap-0.5 px-3 py-2"
            >
              {isActive && (
                <motion.span
                  layoutId="navBarPill"
                  className="absolute inset-0 -z-10 rounded-full bg-white/55 shadow-glass-sm"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span className={isActive ? 'text-ink-900' : 'text-ink-300'}>
                {item.icon}
              </span>
              <span
                className={`text-[10px] font-medium tracking-tight ${
                  isActive ? 'text-ink-900' : 'text-ink-300'
                }`}
              >
                {item.label}
              </span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
