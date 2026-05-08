/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Recipe, ScannedItem } from '../types'
import { recipes } from '../data/mockData'

const INITIAL_PILE: Recipe[] = recipes.slice(0, 5)

const SCAN_LIMIT = 8
const LS_SCANS_USED = 'fridgesnap.scansUsed'
const LS_IS_PRO = 'fridgesnap.isPro'

function readScansUsed(): number {
  if (typeof window === 'undefined') return 0
  try {
    const raw = window.localStorage.getItem(LS_SCANS_USED)
    if (raw === null) return 0
    const n = Number.parseInt(raw, 10)
    return Number.isFinite(n) && n >= 0 ? n : 0
  } catch {
    return 0
  }
}

function readIsPro(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const raw = window.localStorage.getItem(LS_IS_PRO)
    return raw === 'true'
  } catch {
    return false
  }
}

export type SwipeAction = 'saved' | 'skipped'

interface ScanContextValue {
  items: ScannedItem[]
  pile: Recipe[]
  actions: Record<string, SwipeAction>
  initialPileSize: number
  scansUsed: number
  scanLimit: number
  scansRemaining: number
  isPro: boolean
  addItems: (items: ScannedItem[]) => void
  recordSwipe: (recipeId: string, action: SwipeAction) => void
  reset: () => void
  incrementScan: () => void
  setPro: (value: boolean) => void
}

const ScanContext = createContext<ScanContextValue | null>(null)

export function ScanProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ScannedItem[]>([])
  const [pile, setPile] = useState<Recipe[]>(INITIAL_PILE)
  const [actions, setActions] = useState<Record<string, SwipeAction>>({})
  const [scansUsed, setScansUsed] = useState<number>(() => readScansUsed())
  const [isPro, setIsProState] = useState<boolean>(() => readIsPro())

  useEffect(() => {
    try {
      window.localStorage.setItem(LS_SCANS_USED, String(scansUsed))
    } catch {
      // localStorage unavailable / quota — ignore
    }
  }, [scansUsed])

  useEffect(() => {
    try {
      window.localStorage.setItem(LS_IS_PRO, isPro ? 'true' : 'false')
    } catch {
      // ignore
    }
  }, [isPro])

  const addItems = useCallback((next: ScannedItem[]) => {
    setItems((prev) => {
      const seen = new Set(prev.map((i) => i.name.toLowerCase()))
      const merged = [...prev]
      for (const item of next) {
        if (!seen.has(item.name.toLowerCase())) {
          merged.push(item)
          seen.add(item.name.toLowerCase())
        }
      }
      return merged
    })
  }, [])

  const recordSwipe = useCallback((recipeId: string, action: SwipeAction) => {
    setActions((a) => (a[recipeId] === action ? a : { ...a, [recipeId]: action }))
    setPile((p) => p.filter((r) => r.id !== recipeId))
  }, [])

  const reset = useCallback(() => {
    setItems([])
    setPile(INITIAL_PILE)
    setActions({})
  }, [])

  const incrementScan = useCallback(() => {
    setScansUsed((n) => n + 1)
  }, [])

  const setPro = useCallback((value: boolean) => {
    setIsProState(value)
  }, [])

  const value = useMemo<ScanContextValue>(
    () => ({
      items,
      pile,
      actions,
      initialPileSize: INITIAL_PILE.length,
      scansUsed,
      scanLimit: SCAN_LIMIT,
      scansRemaining: Math.max(0, SCAN_LIMIT - scansUsed),
      isPro,
      addItems,
      recordSwipe,
      reset,
      incrementScan,
      setPro,
    }),
    [items, pile, actions, scansUsed, isPro, addItems, recordSwipe, reset, incrementScan, setPro],
  )

  return <ScanContext.Provider value={value}>{children}</ScanContext.Provider>
}

export function useScan(): ScanContextValue {
  const ctx = useContext(ScanContext)
  if (!ctx) {
    throw new Error('useScan must be used inside <ScanProvider>')
  }
  return ctx
}
