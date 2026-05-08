import { useCallback, useEffect, useRef, useState } from 'react'

export type ScanPhase = 'idle' | 'flash' | 'scanning' | 'success'

interface UseScanCaptureOptions {
  statusTexts: string[]
  /** Called once the success phase completes — typically navigate + addItems. */
  onComplete: () => void
}

interface UseScanCaptureResult {
  phase: ScanPhase
  statusText: string
  start: () => void
}

/**
 * Drives the timed scan animation: flash → scanning → success → onComplete.
 * Total duration ~2s; status text rotates every 600ms during scanning.
 */
export function useScanCapture({
  statusTexts,
  onComplete,
}: UseScanCaptureOptions): UseScanCaptureResult {
  const [phase, setPhase] = useState<ScanPhase>('idle')
  const [statusText, setStatusText] = useState<string>('')
  const timersRef = useRef<number[]>([])
  const onCompleteRef = useRef(onComplete)
  const textsRef = useRef(statusTexts)

  onCompleteRef.current = onComplete
  textsRef.current = statusTexts

  useEffect(() => {
    return () => {
      for (const id of timersRef.current) window.clearTimeout(id)
      timersRef.current = []
    }
  }, [])

  const start = useCallback(() => {
    if (phase !== 'idle') return
    for (const id of timersRef.current) window.clearTimeout(id)

    const t: number[] = []
    const texts = textsRef.current

    setPhase('flash')

    t.push(
      window.setTimeout(() => {
        setPhase('scanning')
        setStatusText(texts[0] ?? '')
      }, 200),
    )

    for (let i = 1; i < texts.length; i++) {
      t.push(
        window.setTimeout(() => setStatusText(texts[i]), 200 + i * 600),
      )
    }

    t.push(window.setTimeout(() => setPhase('success'), 1700))
    t.push(window.setTimeout(() => onCompleteRef.current(), 2000))

    timersRef.current = t
  }, [phase])

  return { phase, statusText, start }
}
