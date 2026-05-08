import { useEffect, useState } from 'react'
import { Signal, Wifi } from 'lucide-react'

interface StatusBarProps {
  tone?: 'light' | 'dark'
  /** Battery level, 0–100. Defaults to 85. */
  batteryLevel?: number
}

function formatTime(): string {
  const d = new Date()
  const h12 = ((d.getHours() + 11) % 12) + 1
  const m = d.getMinutes().toString().padStart(2, '0')
  return `${h12}:${m}`
}

export function StatusBar({ tone = 'dark', batteryLevel = 85 }: StatusBarProps) {
  const [time, setTime] = useState(formatTime)

  useEffect(() => {
    const id = window.setInterval(() => setTime(formatTime()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  const color = tone === 'dark' ? 'text-ink-900' : 'text-white'

  return (
    <div
      className={`pointer-events-none absolute inset-x-0 top-0 z-30 flex h-11 items-end justify-between px-7 pb-1.5 text-[15px] font-semibold tracking-tight ${color}`}
    >
      <span>{time}</span>
      <div className="flex items-center gap-1.5">
        <Signal className="h-3.5 w-3.5" strokeWidth={2.5} />
        <Wifi className="h-4 w-4" strokeWidth={2.5} />
        <BatteryIcon level={batteryLevel} className="h-[11px] w-[26px]" />
      </div>
    </div>
  )
}

interface BatteryIconProps {
  level: number
  className?: string
}

function BatteryIcon({ level, className = '' }: BatteryIconProps) {
  const clamped = Math.max(0, Math.min(100, level))
  const fillWidth = (clamped / 100) * 19

  return (
    <svg
      viewBox="0 0 27 13"
      className={className}
      fill="none"
      aria-hidden
    >
      {/* Outer outline */}
      <rect
        x="0.5"
        y="0.5"
        width="23"
        height="12"
        rx="3.2"
        ry="3.2"
        stroke="currentColor"
        strokeOpacity="0.4"
        strokeWidth="1"
      />
      {/* Positive terminal tip */}
      <rect
        x="24"
        y="4"
        width="2"
        height="5"
        rx="1"
        fill="currentColor"
        fillOpacity="0.4"
      />
      {/* Level fill */}
      <rect
        x="2"
        y="2"
        width={fillWidth}
        height="9"
        rx="1.5"
        ry="1.5"
        fill="currentColor"
      />
    </svg>
  )
}
