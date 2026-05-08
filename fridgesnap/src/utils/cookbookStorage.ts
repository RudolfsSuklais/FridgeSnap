import type { CookedEntry } from '../types'

const KEY = 'fridgesnap.cookbook.v1'

function safeRead(): CookedEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as CookedEntry[]) : []
  } catch {
    return []
  }
}

function safeWrite(entries: CookedEntry[]): { ok: true } | { ok: false; reason: 'quota' | 'unknown' } {
  if (typeof window === 'undefined') return { ok: false, reason: 'unknown' }
  try {
    window.localStorage.setItem(KEY, JSON.stringify(entries))
    return { ok: true }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'QuotaExceededError') {
      return { ok: false, reason: 'quota' }
    }
    return { ok: false, reason: 'unknown' }
  }
}

export function getCookedEntries(): CookedEntry[] {
  return safeRead()
}

export function addCookedEntry(entry: CookedEntry): { ok: true } | { ok: false; reason: 'quota' | 'unknown' } {
  const next = [entry, ...safeRead()]
  return safeWrite(next)
}

export function removeCookedEntry(id: string): void {
  safeWrite(safeRead().filter((e) => e.id !== id))
}
