import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'

interface PhoneFrameProps {
  children: ReactNode
}

export function PhoneFrame({ children }: PhoneFrameProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 500px)')
    const sync = () => setIsMobile(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  if (isMobile) {
    return (
      <div className="relative h-[100dvh] w-full overflow-hidden bg-black">
        {children}
      </div>
    )
  }

  return (
    <div
      className="flex min-h-[100dvh] items-center justify-center px-6 py-10"
      style={{
        background:
          'radial-gradient(at 20% 10%, #20243A 0%, transparent 55%),' +
          'radial-gradient(at 80% 90%, #2D1E40 0%, transparent 55%),' +
          '#0B0C10',
      }}
    >
      <div className="relative">
        <div className="pointer-events-none absolute -inset-10 rounded-[3.5rem] bg-gradient-to-br from-fuchsia-500/20 via-indigo-500/10 to-cyan-500/20 blur-3xl" />

        <div className="relative h-[812px] w-[375px] rounded-[3rem] bg-black p-2 shadow-phone">
          <div className="relative h-full w-full overflow-hidden rounded-[2.5rem] bg-neutral-50">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
