/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { ActiveTimer } from '../types'

interface CookingContextValue {
  timers: ActiveTimer[]
  /** Returns the new timer's id. */
  startTimer: (input: Omit<ActiveTimer, 'id' | 'startedAt' | 'endsAt'> & { durationMinutes: number }) => string
  cancelTimer: (id: string) => void
  /** Subscribe to timer-fired events. Returns an unsubscribe fn. */
  onTimerFired: (cb: (t: ActiveTimer) => void) => () => void
}

const CookingContext = createContext<CookingContextValue | null>(null)

export function CookingProvider({ children }: { children: ReactNode }) {
  const [timers, setTimers] = useState<ActiveTimer[]>([])
  const listeners = useRef<Set<(t: ActiveTimer) => void>>(new Set())
  const fireHandles = useRef<Map<string, number>>(new Map())

  const fire = useCallback((id: string) => {
    setTimers((prev) => {
      const found = prev.find((t) => t.id === id)
      if (!found) return prev
      for (const cb of listeners.current) cb(found)
      fireHandles.current.delete(id)
      return prev.filter((t) => t.id !== id)
    })
  }, [])

  const startTimer = useCallback<CookingContextValue['startTimer']>((input) => {
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `t-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const now = Date.now()
    const timer: ActiveTimer = {
      id,
      recipeId: input.recipeId,
      stepIdx: input.stepIdx,
      label: input.label,
      durationMinutes: input.durationMinutes,
      startedAt: now,
      endsAt: now + input.durationMinutes * 60_000,
    }
    setTimers((prev) => [...prev, timer])
    const handle = window.setTimeout(() => fire(id), input.durationMinutes * 60_000)
    fireHandles.current.set(id, handle)
    return id
  }, [fire])

  const cancelTimer = useCallback((id: string) => {
    const handle = fireHandles.current.get(id)
    if (handle !== undefined) {
      window.clearTimeout(handle)
      fireHandles.current.delete(id)
    }
    setTimers((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const onTimerFired = useCallback((cb: (t: ActiveTimer) => void) => {
    listeners.current.add(cb)
    return () => {
      listeners.current.delete(cb)
    }
  }, [])

  // Cleanup on unmount: clear pending setTimeout handles.
  useEffect(() => {
    const handles = fireHandles.current
    return () => {
      for (const h of handles.values()) window.clearTimeout(h)
      handles.clear()
    }
  }, [])

  const value = useMemo<CookingContextValue>(
    () => ({ timers, startTimer, cancelTimer, onTimerFired }),
    [timers, startTimer, cancelTimer, onTimerFired],
  )

  return <CookingContext.Provider value={value}>{children}</CookingContext.Provider>
}

export function useCooking(): CookingContextValue {
  const ctx = useContext(CookingContext)
  if (!ctx) throw new Error('useCooking must be used inside <CookingProvider>')
  return ctx
}
