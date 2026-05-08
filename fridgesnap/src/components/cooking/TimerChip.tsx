import { useEffect, useState } from 'react'
import { Timer } from 'lucide-react'
import type { ActiveTimer } from '../../types'

interface TimerChipProps {
  timers: ActiveTimer[]
  onClick: () => void
}

function formatRemaining(ms: number): string {
  if (ms <= 0) return '0:00'
  const total = Math.ceil(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function TimerChip({ timers, onClick }: TimerChipProps) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (timers.length === 0) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [timers.length])

  if (timers.length === 0) return null

  const soonest = timers.reduce((a, b) => (a.endsAt < b.endsAt ? a : b))
  const remaining = formatRemaining(soonest.endsAt - now)

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Open timers (${timers.length} active)`}
      className="flex items-center gap-2 rounded-full border border-white/35 bg-white/15 px-3 py-1.5 text-[13px] font-bold text-white shadow-glass-sm backdrop-blur-md"
    >
      <Timer className="h-4 w-4" strokeWidth={2.25} />
      <span className="tabular-nums">{remaining}</span>
      {timers.length > 1 && (
        <span className="rounded-full bg-white/25 px-1.5 py-0.5 text-[10px] font-bold">
          +{timers.length - 1}
        </span>
      )}
    </button>
  )
}
