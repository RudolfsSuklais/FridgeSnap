# 8-Scan Freemium Limit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce a real freemium scan quota — 8 free scans per device, then route the user to the Paywall — replacing the hardcoded constants currently shown on Home and Paywall.

**Architecture:** Quota state lives in the existing `ScanContext` provider (single source of truth, already mounted at App level). State is persisted in `localStorage`. The counter increments once per completed scan flow at `ScanProcessing` mount; "Skip pantry" is rerouted through `/scan/processing` so the increment site stays single. Home reads context and conditionally swaps the hero CTA at 0/8. Paywall consumes context for dynamic copy.

**Tech Stack:** React 19, TypeScript, react-router-dom 7, framer-motion, Tailwind, Vite. No automated test framework is configured for this project (`fridgesnap/package.json` exposes only `dev`, `build`, `lint`, `preview`), so verification uses `npm run build` + `npm run lint` for correctness and a documented manual browser walkthrough for behavior.

**Spec:** [docs/superpowers/specs/2026-05-08-scan-limit-freemium-design.md](../specs/2026-05-08-scan-limit-freemium-design.md)

**Working directory for all `npm` commands:** `fridgesnap/`

---

## File touch summary

| File | Change |
|------|--------|
| `fridgesnap/src/contexts/ScanContext.tsx` | Add quota state (`scansUsed`, `scanLimit`, `isPro`, derived `scansRemaining`), `incrementScan()`, `setPro()`, localStorage persistence. |
| `fridgesnap/src/screens/ScanProcessing.tsx` | Call `incrementScan()` once on mount via `useRef` gate. |
| `fridgesnap/src/screens/ScanPantry.tsx` | Reroute "Skip pantry" button from `/results` to `/scan/processing`. |
| `fridgesnap/src/screens/Home.tsx` | Drop hardcoded constants, consume context, conditional CTA at 0/8, replace weekly reset countdown with static "X of 8 scans used" line. |
| `fridgesnap/src/screens/Paywall.tsx` | Dynamic "X of 8 free scans used" copy + feature blurb update. |

---

## Task 1: Extend ScanContext with quota state + localStorage persistence

**Files:**
- Modify: `fridgesnap/src/contexts/ScanContext.tsx` (entire file rewrite — current file is 80 lines)

**Goal of this task:** Make the context expose `scansUsed`, `scanLimit`, `isPro`, `scansRemaining`, `incrementScan()`, and `setPro()`. Persist `scansUsed` and `isPro` in `localStorage` under keys `fridgesnap.scansUsed` and `fridgesnap.isPro`. Existing fields (`items`, `pile`, `actions`, `addItems`, `recordSwipe`, `reset`) remain unchanged in shape and behavior.

- [ ] **Step 1: Replace the contents of `fridgesnap/src/contexts/ScanContext.tsx`**

```tsx
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
```

- [ ] **Step 2: Verify type-check + build**

Run from `fridgesnap/`:
```bash
npm run build
```
Expected: build completes with no TypeScript errors. The context API change does NOT break existing callers because every existing field is preserved with identical types — the new fields are additive. Other files that destructure `useScan()` continue to compile.

- [ ] **Step 3: Verify lint**

Run from `fridgesnap/`:
```bash
npm run lint
```
Expected: no errors.

- [ ] **Step 4: Manual smoke test — provider boots and persists**

Run `npm run dev` from `fridgesnap/`. Open the app in a browser. Open DevTools → Application → Local Storage → site origin.

Expected on page load (one full mount of `ScanProvider`):
- Two keys appear: `fridgesnap.scansUsed = "0"` and `fridgesnap.isPro = "false"`.
- They appear because the two write-through `useEffect`s run after mount.

Manually edit `fridgesnap.scansUsed = "5"` in DevTools, hard reload the page. The keys should still be present and `scansUsed` is now `5`. (No UI change yet — Home still uses its hardcoded constants in this task.)

- [ ] **Step 5: Commit**

```bash
git add fridgesnap/src/contexts/ScanContext.tsx
git commit -m "feat(scan-quota): add scansUsed/isPro state with localStorage persistence to ScanContext"
```

---

## Task 2: Increment scan counter at processing + reroute Skip pantry

**Files:**
- Modify: `fridgesnap/src/screens/ScanProcessing.tsx` (lines 18–32 — the component body and effect)
- Modify: `fridgesnap/src/screens/ScanPantry.tsx` (line 107 — the Skip button `onClick`)

**Goal of this task:** Mounting `ScanProcessing` increments `scansUsed` exactly once per mount (`useRef` gates re-invocation under StrictMode or other re-effects). The "Skip pantry" button now navigates to `/scan/processing` instead of `/results`, so the skip path also flows through the increment site.

- [ ] **Step 1: Modify `fridgesnap/src/screens/ScanProcessing.tsx`**

Replace the imports block (line 1) and the component body to add the increment effect. Specifically, change the `useEffect`/`useState`/`useRef` import line and the `useScan` destructure, and add a guarded increment effect.

The new top-of-file imports:

```tsx
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { GradientBackground } from '../components/layout/GradientBackground'
import { useScan } from '../contexts/ScanContext'
```

Replace the existing component (currently lines 18–33) with:

```tsx
export function ScanProcessing() {
  const navigate = useNavigate()
  const { items, incrementScan } = useScan()
  const [textIdx, setTextIdx] = useState(0)
  const incrementedRef = useRef(false)

  useEffect(() => {
    if (!incrementedRef.current) {
      incrementedRef.current = true
      incrementScan()
    }
  }, [incrementScan])

  useEffect(() => {
    const tick = window.setInterval(() => {
      setTextIdx((i) => Math.min(STATUS_TEXTS.length - 1, i + 1))
    }, STATUS_INTERVAL)
    const finish = window.setTimeout(() => navigate('/results'), NAVIGATE_DELAY)
    return () => {
      window.clearInterval(tick)
      window.clearTimeout(finish)
    }
  }, [navigate])
```

Leave everything below (the `visibleChips`, the JSX return, the closing brace) unchanged.

- [ ] **Step 2: Modify `fridgesnap/src/screens/ScanPantry.tsx`**

Find the Skip button (around line 105–112):

```tsx
          <button
            type="button"
            onClick={() => navigate('/results')}
            disabled={phase !== 'idle'}
            className="mt-1 self-center text-[13px] font-semibold text-ink-500 underline-offset-4 hover:underline disabled:opacity-50"
          >
            Skip pantry
          </button>
```

Change `onClick={() => navigate('/results')}` to `onClick={() => navigate('/scan/processing')}`. Final:

```tsx
          <button
            type="button"
            onClick={() => navigate('/scan/processing')}
            disabled={phase !== 'idle'}
            className="mt-1 self-center text-[13px] font-semibold text-ink-500 underline-offset-4 hover:underline disabled:opacity-50"
          >
            Skip pantry
          </button>
```

- [ ] **Step 3: Verify build + lint**

```bash
npm run build
npm run lint
```
Expected: both pass with no errors.

- [ ] **Step 4: Manual verification — full flow increments by 1**

Run `npm run dev`. In DevTools, set `localStorage.fridgesnap.scansUsed = "0"` and reload.

Walk: Home → "Scan now" → Capture (fridge) → Capture (pantry) → wait for processing animation → arrive at Results.

Open DevTools → Application → Local Storage. Expected: `fridgesnap.scansUsed = "1"`.

- [ ] **Step 5: Manual verification — skip flow also increments by 1**

Reset `fridgesnap.scansUsed = "0"`. Reload. Walk: Home → "Scan now" → Capture (fridge) → on pantry screen tap "Skip pantry" → user is briefly shown the processing animation → arrives at Results.

Expected: `fridgesnap.scansUsed = "1"`. Briefly seeing the processing screen is the intended UX (see spec).

- [ ] **Step 6: Manual verification — no double-increment under StrictMode**

In a Vite dev build, React StrictMode double-invokes effects in dev. Verify by repeating Step 4 from a clean `scansUsed = "0"` state and confirming the final value is `"1"`, not `"2"`. The `incrementedRef` gate prevents the second StrictMode invocation from incrementing.

- [ ] **Step 7: Commit**

```bash
git add fridgesnap/src/screens/ScanProcessing.tsx fridgesnap/src/screens/ScanPantry.tsx
git commit -m "feat(scan-quota): increment scansUsed on processing mount; route Skip pantry through processing"
```

---

## Task 3: Wire Home.tsx to context — drop hardcoded constants, conditional CTA, remove weekly reset countdown

**Files:**
- Modify: `fridgesnap/src/screens/Home.tsx` (top-of-file constants + helper function + component body + StatPill props are unchanged)

**Goal of this task:** Home no longer defines `IS_PRO`, `FREE_SCAN_LIMIT`, `SCANS_USED` constants or the `formatResetCountdown` helper. Quota values come from `useScan()`. Hero CTA flips to "Get Pro to keep scanning" with a Crown icon when `!isPro && scansRemaining === 0`. The weekly reset countdown row is replaced with a single static line: `{scansUsed} of {scanLimit} scans used` (only rendered when `!isPro`).

- [ ] **Step 1: Update imports in `fridgesnap/src/screens/Home.tsx`**

Replace the top imports (lines 1–15) with:

```tsx
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Bookmark,
  ChevronRight,
  Crown,
  ScanLine,
  Sparkles,
} from 'lucide-react'
import { GradientBackground } from '../components/layout/GradientBackground'
import { GlassButton } from '../components/ui/GlassButton'
import { AppNav } from '../components/layout/AppNav'
import { useScan } from '../contexts/ScanContext'
import { recipes } from '../data/mockData'
```

Note: `RotateCcw` is removed because the reset countdown row is removed.

- [ ] **Step 2: Remove the hardcoded constants and the countdown helper**

Delete the block currently spanning lines 19–46:

```tsx
// Freemium model — demo state. Pro users hide the limit and countdown.
const IS_PRO = false
const FREE_SCAN_LIMIT = 2
const SCANS_USED = 1

function getGreeting(now: Date = new Date()): string {
  ...
}

function formatResetCountdown(now: Date = new Date()): string {
  ...
}
```

Keep the `getGreeting` function — it is still needed. So the deletion is targeted: remove the three `IS_PRO`/`FREE_SCAN_LIMIT`/`SCANS_USED` lines (and the comment above them) and remove the entire `formatResetCountdown` function. Resulting top-level block above the component:

```tsx
const RECENT = recipes.slice(0, 5)

function getGreeting(now: Date = new Date()): string {
  const h = now.getHours()
  if (h >= 5 && h < 12) return 'Good morning'
  if (h >= 12 && h < 18) return 'Good afternoon'
  return 'Good evening'
}
```

- [ ] **Step 3: Replace the `Home` component body**

The current component (line 48 onward) starts with:

```tsx
export function Home() {
  const navigate = useNavigate()

  const scansRemaining = Math.max(0, FREE_SCAN_LIMIT - SCANS_USED)
  const resetLabel = formatResetCountdown()
  const scansPillValue = IS_PRO ? '∞' : `${scansRemaining}/${FREE_SCAN_LIMIT}`
  const scansPillLabel = IS_PRO ? 'pro plan' : 'scans'
```

Replace those derivations with context reads:

```tsx
export function Home() {
  const navigate = useNavigate()
  const { isPro, scansRemaining, scanLimit, scansUsed } = useScan()

  const isLocked = !isPro && scansRemaining === 0
  const scansPillValue = isPro ? '∞' : `${scansRemaining}/${scanLimit}`
  const scansPillLabel = isPro ? 'pro plan' : 'scans'
```

- [ ] **Step 4: Make the hero "Scan now" CTA flip to "Get Pro" at 0/8**

Find the hero `GlassButton` (around line 134–143):

```tsx
              <div className="mt-3">
                <GlassButton
                  variant="white-glass"
                  size="md"
                  onClick={() => navigate('/scan/fridge')}
                  trailingIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Scan now
                </GlassButton>
              </div>
```

Replace with:

```tsx
              <div className="mt-3">
                <GlassButton
                  variant="white-glass"
                  size="md"
                  onClick={() => navigate(isLocked ? '/paywall' : '/scan/fridge')}
                  trailingIcon={
                    isLocked ? (
                      <Crown className="h-4 w-4" />
                    ) : (
                      <ArrowRight className="h-4 w-4" />
                    )
                  }
                >
                  {isLocked ? 'Get Pro to keep scanning' : 'Scan now'}
                </GlassButton>
              </div>
```

- [ ] **Step 5: Update the "scans" StatPill onClick guard**

Find this line in the StatPill row (around line 164):

```tsx
            onClick={!IS_PRO && scansRemaining === 0 ? () => navigate('/paywall') : undefined}
```

Replace with:

```tsx
            onClick={isLocked ? () => navigate('/paywall') : undefined}
```

- [ ] **Step 6: Replace the weekly reset countdown with a static "X of 8 scans used" line**

Find the existing block (around line 175–189):

```tsx
        {/* Freemium reset countdown — only visible for non-Pro users */}
        {!IS_PRO && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28, delay: 0.28 }}
            className="mt-2.5 flex items-center justify-center gap-1.5 px-6 text-[11.5px] text-ink-400"
          >
            <RotateCcw className="h-3 w-3" strokeWidth={2.5} />
            <span>
              Free scans reset in{' '}
              <span className="font-semibold text-ink-700">{resetLabel}</span>
            </span>
          </motion.div>
        )}
```

Replace with:

```tsx
        {/* Quota usage indicator — only visible for non-Pro users */}
        {!isPro && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28, delay: 0.28 }}
            className="mt-2.5 flex items-center justify-center px-6 text-[11.5px] text-ink-400"
          >
            <span>
              <span className="font-semibold text-ink-700">{scansUsed}</span>
              {' of '}
              <span className="font-semibold text-ink-700">{scanLimit}</span>
              {' scans used'}
            </span>
          </motion.div>
        )}
```

- [ ] **Step 7: Verify build + lint**

```bash
npm run build
npm run lint
```
Expected: both pass. Lint should not flag unused imports — `ArrowRight`, `Crown`, `Sparkles` are all used; `RotateCcw` was removed; `useScan` is the only added import.

- [ ] **Step 8: Manual verification — fresh state shows 8/8 and "Scan now"**

DevTools: clear `fridgesnap.scansUsed` and `fridgesnap.isPro` (or set them to `"0"` and `"false"`). Reload Home.

Expected:
- Stats pill "scans" shows `8/8`.
- Hero CTA reads "Scan now", arrow icon trailing.
- Below the stat pills: `0 of 8 scans used`.
- Tap CTA → navigates to `/scan/fridge`. Tap stat pill — does nothing (`onClick` is `undefined`).

- [ ] **Step 9: Manual verification — locked state at 8/8**

DevTools: set `fridgesnap.scansUsed = "8"`. Reload Home.

Expected:
- Stats pill "scans" shows `0/8`.
- Hero CTA reads "Get Pro to keep scanning" with Crown icon trailing.
- Below stat pills: `8 of 8 scans used`.
- Tap CTA → navigates to `/paywall`.
- Tap "scans" stat pill → also navigates to `/paywall`.

- [ ] **Step 10: Manual verification — Pro state hides limit UI**

DevTools: set `fridgesnap.isPro = "true"`. Reload Home.

Expected:
- Stats pill "scans" shows `∞`, label is `pro plan`.
- Hero CTA reads "Scan now" (not locked because `isPro`).
- The "X of 8 scans used" line is **not rendered**.
- Tap CTA → navigates to `/scan/fridge`.

- [ ] **Step 11: Commit**

```bash
git add fridgesnap/src/screens/Home.tsx
git commit -m "feat(scan-quota): wire Home to ScanContext, lock CTA at 0/8, replace weekly reset with quota line"
```

---

## Task 4: Paywall dynamic copy

**Files:**
- Modify: `fridgesnap/src/screens/Paywall.tsx` (FEATURES array entry + HeroSection's "scans used" pill)

**Goal of this task:** Paywall reads `scansUsed` and `scanLimit` from context for its hero pill text. The "No more 2-per-week limit" feature description is updated to "No more 8-scan limit".

- [ ] **Step 1: Update imports in `fridgesnap/src/screens/Paywall.tsx`**

The file currently does not import `useScan`. Add it. The first import block (lines 1–13) becomes:

```tsx
import { useState, type ReactNode } from 'react'
import { motion, LayoutGroup, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  Crown,
  Heart,
  Infinity as InfinityIcon,
  Sparkles,
  X,
  Zap,
} from 'lucide-react'
import { GlassCard } from '../components/ui/GlassCard'
import { useScan } from '../contexts/ScanContext'
```

- [ ] **Step 2: Update the FEATURES blurb**

Find the entry with `id: 'scans'` (around line 27–34):

```tsx
  {
    id: 'scans',
    icon: <InfinityIcon className="h-5 w-5" strokeWidth={2.25} />,
    title: 'Unlimited scans & recipes',
    desc: 'No more 2-per-week limit',
    iconBg: 'bg-indigo-400/30 border-indigo-200/50',
    iconColor: 'text-indigo-50',
  },
```

Change `desc: 'No more 2-per-week limit'` to `desc: 'No more 8-scan limit'`.

- [ ] **Step 3: Pass quota into HeroSection**

`HeroSection` is currently defined as `function HeroSection()` (around line 178) and called as `<HeroSection />` from inside `Paywall`. Update both.

Change the `Paywall` component's call from:

```tsx
        <HeroSection />
```

to:

```tsx
        <HeroSection scansUsed={scansUsed} scanLimit={scanLimit} />
```

And inside the `Paywall` component body, near the top, add the context destructure. The current top of the component is:

```tsx
export function Paywall() {
  const navigate = useNavigate()
  const [plan, setPlan] = useState<Plan>('yearly')
```

Replace with:

```tsx
export function Paywall() {
  const navigate = useNavigate()
  const [plan, setPlan] = useState<Plan>('yearly')
  const { scansUsed, scanLimit } = useScan()
```

- [ ] **Step 4: Update HeroSection to accept props and render dynamic copy**

The current signature and pill markup (around lines 178 and 256–260):

```tsx
function HeroSection() {
  ...
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-amber-200/40 bg-amber-400/15 px-3 py-1 text-[11px] font-semibold text-amber-100 shadow-glass-sm backdrop-blur-md">
          <AlertCircle className="h-3 w-3" strokeWidth={2.5} />
          <span>2 of 2 free scans used this week</span>
        </div>
```

Replace the function signature with:

```tsx
interface HeroSectionProps {
  scansUsed: number
  scanLimit: number
}

function HeroSection({ scansUsed, scanLimit }: HeroSectionProps) {
```

And replace the pill text:

```tsx
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-amber-200/40 bg-amber-400/15 px-3 py-1 text-[11px] font-semibold text-amber-100 shadow-glass-sm backdrop-blur-md">
          <AlertCircle className="h-3 w-3" strokeWidth={2.5} />
          <span>{scansUsed} of {scanLimit} free scans used</span>
        </div>
```

(The "this week" wording is dropped — the new model is a lifetime quota, not a weekly refill.)

- [ ] **Step 5: Verify build + lint**

```bash
npm run build
npm run lint
```
Expected: both pass.

- [ ] **Step 6: Manual verification — Paywall shows current usage**

Run `npm run dev`. DevTools: set `fridgesnap.scansUsed = "3"`. Reload Home, tap the "PRO upgrade" stat pill (or set `scansUsed = "8"` and tap the locked hero CTA — both routes land on Paywall).

Expected on Paywall:
- Hero pill: `3 of 8 free scans used` (or `8 of 8 free scans used` for the second case).
- Features list: first row reads "Unlimited scans & recipes" / "No more 8-scan limit".

- [ ] **Step 7: Commit**

```bash
git add fridgesnap/src/screens/Paywall.tsx
git commit -m "feat(scan-quota): wire Paywall hero pill and feature blurb to live quota"
```

---

## Task 5: End-to-end manual smoke test

**Goal of this task:** Walk a clean user through the full quota lifecycle and verify behavior matches the spec's acceptance criteria. No code changes — verification only.

- [ ] **Step 1: Reset to clean state**

DevTools: delete `fridgesnap.scansUsed` and `fridgesnap.isPro` keys (or set both to defaults). Hard reload.

- [ ] **Step 2: Spec acceptance #1 — fresh load**

On Home: stats pill shows `8/8`, line below shows `0 of 8 scans used`, CTA reads "Scan now". Tap CTA → arrives on `/scan/fridge`. Step back to Home.

- [ ] **Step 3: Spec acceptance #2 — full flow increments**

Walk Home → Scan now → fridge Capture → pantry Capture → processing → Results. Return to Home. Stats pill shows `7/8`. DevTools: `fridgesnap.scansUsed = "1"`. Hard reload Home → still `7/8` (persistence works).

- [ ] **Step 4: Spec acceptance #3 — skip flow increments**

Walk Home → Scan now → fridge Capture → "Skip pantry" → (brief processing) → Results. Return to Home. Stats pill shows `6/8`.

- [ ] **Step 5: Spec acceptance #4 — locked state**

DevTools: set `fridgesnap.scansUsed = "8"`. Reload Home. CTA reads "Get Pro to keep scanning" with Crown icon. Stats pill shows `0/8`. Tap CTA → arrives at `/paywall`.

- [ ] **Step 6: Spec acceptance #5 — Paywall dynamic copy**

On Paywall (from Step 5): hero pill reads `8 of 8 free scans used`. First feature row reads "No more 8-scan limit". Tap the X close button → returns to Home.

- [ ] **Step 7: Spec acceptance #6 — Pro override**

DevTools: set `fridgesnap.isPro = "true"`, leave `scansUsed = "8"`. Reload Home. Stats pill shows `∞` with label `pro plan`. CTA reads "Scan now", tapping it goes to `/scan/fridge` (no enforcement). The "X of 8 scans used" line is not rendered.

- [ ] **Step 8: Final commit (only if anything was tweaked during smoke testing)**

If no changes were made, skip. Otherwise:

```bash
git add <files>
git commit -m "fix(scan-quota): <what was tweaked>"
```

---

## Notes for the implementing engineer

- **No test framework**: this project does not have Jest/Vitest/Playwright wired up. Do not introduce one for this feature — manual verification is the agreed-upon bar. If the reviewer disagrees, that is a separate change.
- **Context hot-reload caveat**: Vite HMR sometimes preserves `useState` across edits to `ScanContext.tsx`, which can mask persistence bugs. When verifying localStorage behavior, do a hard reload (Ctrl+Shift+R), not HMR.
- **StrictMode**: `main.tsx` likely wraps `<App />` in `<React.StrictMode>` (default Vite scaffold). Effects double-invoke in dev. The `useRef` gate in Task 2 is the defense against double-increment; do not remove it.
- **DevTools localStorage edits**: changing localStorage in DevTools does NOT trigger a re-render of an open tab. You must reload the page after editing values, or interact with the app to trigger a write-back.
- **Skip pantry UX**: the user briefly sees the processing screen now even when skipping pantry. This is intentional (single increment site) and acceptable per the spec.
