# Cooking Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder `Start cooking` alert in `RecipeDetail` with a fullscreen cooking experience: step-by-step swipe navigation, auto-detected timers running in the background, and a photo + rating completion flow that lands in a new `Cooked` tab inside the `Saved` screen.

**Architecture:** A new `/recipe/:id/cook` route renders `CookingMode` over the recipe's blurred hero image. A top-level `CookingProvider` (mounted alongside `ScanProvider`) holds active timers so they survive navigation. Completed cook sessions are persisted to `localStorage` under `fridgesnap.cookbook.v1` and surfaced via a tabbed `Saved` screen.

**Tech Stack:** React 19, react-router 7, framer-motion 12, Tailwind 3.4, lucide-react. No new dependencies.

**Verification:** This codebase has no test framework. Verification per task is manual: `npm run lint`, `npx tsc --noEmit`, and `npm run dev` to exercise the flow in the browser. Pure utility functions include inline self-check assertions wrapped in `if (import.meta.env.DEV)` so regressions throw at module load during dev.

**Reference spec:** `docs/superpowers/specs/2026-05-08-cooking-mode-design.md`

---

## Task 1: Types, Timer Parser, and Cookbook Storage

**Files:**
- Modify: `fridgesnap/src/types/index.ts`
- Create: `fridgesnap/src/utils/cookingTimerParser.ts`
- Create: `fridgesnap/src/utils/cookbookStorage.ts`

- [ ] **Step 1: Add cooking-related types to `src/types/index.ts`**

Append after the existing `GradientVariant` export (currently the last line):

```ts
export interface ActiveTimer {
  id: string
  recipeId: string
  stepIdx: number
  label: string
  startedAt: number
  endsAt: number
  durationMinutes: number
}

export type Rating = 1 | 2 | 3 | 4 | 5

export interface CookedEntry {
  id: string
  recipeId: string
  recipeTitle: string
  /** Base64 data URL — JPEG, max 1080 px long edge, quality 0.85. */
  photoDataURL: string
  rating: Rating
  note?: string
  /** ISO 8601 string. */
  cookedAt: string
}

export interface ParsedTimerHint {
  minutes: number
  label: string
}
```

- [ ] **Step 2: Create the timer parser**

Create `fridgesnap/src/utils/cookingTimerParser.ts`:

```ts
import type { ParsedTimerHint } from '../types'

const ACTION_VERBS = [
  'simmer',
  'bake',
  'roast',
  'fry',
  'boil',
  'steam',
  'cook',
  'rest',
  'chill',
  'marinate',
  'sauté',
  'saute',
  'broil',
  'grill',
  'reduce',
  'whisk',
  'knead',
] as const

const RANGE_RE = /(\d+)\s*(?:to|-|–|—)\s*(\d+)\s*(min(?:ute)?s?|hours?|hrs?|hr)/i
const SINGLE_RE = /(\d+)\s*(min(?:ute)?s?|hours?|hrs?|hr)/i

function unitToMinutes(value: number, unit: string): number {
  return /h/i.test(unit) ? value * 60 : value
}

function findLabel(text: string): string {
  const lower = text.toLowerCase()
  for (const verb of ACTION_VERBS) {
    if (lower.includes(verb)) {
      return verb.charAt(0).toUpperCase() + verb.slice(1)
    }
  }
  return 'Timer'
}

/**
 * Detect a duration hint inside a recipe step. Returns the worst-case
 * minutes for ranges so the timer reflects the longer end. Pure / no I/O.
 */
export function detectTimer(stepText: string): ParsedTimerHint | null {
  const range = RANGE_RE.exec(stepText)
  if (range) {
    const high = Number.parseInt(range[2], 10)
    if (Number.isFinite(high) && high > 0) {
      return { minutes: unitToMinutes(high, range[3]), label: findLabel(stepText) }
    }
  }
  const single = SINGLE_RE.exec(stepText)
  if (single) {
    const n = Number.parseInt(single[1], 10)
    if (Number.isFinite(n) && n > 0) {
      return { minutes: unitToMinutes(n, single[2]), label: findLabel(stepText) }
    }
  }
  return null
}

// Dev-only smoke checks. Throws at module load if a regression is introduced.
if (import.meta.env.DEV) {
  const cases: Array<[string, ParsedTimerHint | null]> = [
    ['Simmer the sauce for 10 minutes.', { minutes: 10, label: 'Simmer' }],
    ['Bake at 200°C for 25-30 min.', { minutes: 30, label: 'Bake' }],
    ['Cook for 1 hour.', { minutes: 60, label: 'Cook' }],
    ['Rest 5 mins.', { minutes: 5, label: 'Rest' }],
    ['Chop the onion finely.', null],
    ['Add salt to taste.', null],
  ]
  for (const [input, expected] of cases) {
    const got = detectTimer(input)
    const ok =
      (got === null && expected === null) ||
      (got !== null &&
        expected !== null &&
        got.minutes === expected.minutes &&
        got.label === expected.label)
    if (!ok) {
      throw new Error(
        `cookingTimerParser smoke check failed for "${input}": got ${JSON.stringify(got)}, expected ${JSON.stringify(expected)}`,
      )
    }
  }
}
```

- [ ] **Step 3: Create the cookbook storage helper**

Create `fridgesnap/src/utils/cookbookStorage.ts`:

```ts
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
```

- [ ] **Step 4: Verify**

Run from `fridgesnap/`:

```
npx tsc --noEmit
npm run lint
```

Expected: no errors. Then `npm run dev` and load any page — the dev-only `cookingTimerParser` smoke checks run at module import; if they fail, the page errors loudly.

- [ ] **Step 5: Commit**

```
git add fridgesnap/src/types/index.ts fridgesnap/src/utils/cookingTimerParser.ts fridgesnap/src/utils/cookbookStorage.ts
git commit -m "Add cooking types, timer parser, and cookbook storage"
```

---

## Task 2: CookingContext, Route, and RecipeDetail Wiring

Goal of this task: tapping `Start cooking` in `RecipeDetail` navigates to a fullscreen cooking screen showing the recipe's blurred hero image, a close button, and the recipe title — but no step UI yet. This proves the routing + provider plumbing before adding the step interaction.

**Files:**
- Create: `fridgesnap/src/contexts/CookingContext.tsx`
- Create: `fridgesnap/src/screens/CookingMode.tsx`
- Modify: `fridgesnap/src/App.tsx`
- Modify: `fridgesnap/src/screens/RecipeDetail.tsx:325-335` (Start cooking button)

- [ ] **Step 1: Create `src/contexts/CookingContext.tsx`**

```tsx
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
```

- [ ] **Step 2: Create `src/screens/CookingMode.tsx` with skeleton fullscreen layout**

```tsx
import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { X } from 'lucide-react'
import { recipes } from '../data/mockData'

export function CookingMode() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const recipe = useMemo(() => recipes.find((r) => r.id === id), [id])

  if (!recipe) {
    return (
      <div className="relative flex h-full w-full items-center justify-center bg-ink-900 text-white">
        <p className="text-[14px]">Recipe not found.</p>
      </div>
    )
  }

  return (
    <motion.div
      key="cooking-mode"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="relative h-full w-full overflow-hidden text-white"
    >
      {/* Blurred recipe hero backdrop */}
      <div aria-hidden className="absolute inset-0">
        <img
          src={recipe.image}
          alt=""
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ filter: 'blur(40px) saturate(1.1)', transform: 'scale(1.15)' }}
        />
        <div className="absolute inset-0 bg-black/55" />
      </div>

      {/* Top bar: close + title */}
      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 pt-14">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Exit cooking mode"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white shadow-glass-sm backdrop-blur-md"
        >
          <X className="h-5 w-5" strokeWidth={2.25} />
        </button>
        <p className="max-w-[60%] truncate text-[13px] font-semibold opacity-80">
          {recipe.title}
        </p>
        <div className="h-10 w-10" />
      </div>

      {/* Body — placeholder for steps. Real content arrives in Task 3. */}
      <div className="relative z-10 flex h-full items-center justify-center px-6 text-center">
        <p className="text-[15px] opacity-70">Cooking flow coming online…</p>
      </div>
    </motion.div>
  )
}
```

- [ ] **Step 3: Wire `CookingProvider` and the new route in `src/App.tsx`**

Find the imports block and add (after `import { Paywall }`):

```ts
import { Settings } from './screens/Settings'
import { CookingMode } from './screens/CookingMode'
import { CookingProvider } from './contexts/CookingContext'
```

Then in the `Routes` block, after the existing `/recipe/:id` route, add:

```tsx
<Route path="/recipe/:id/cook" element={<CookingMode />} />
```

(Note: do NOT wrap in `PageTransition` — `CookingMode` runs its own opacity animation and `PageTransition`'s x-slide would feel wrong for a fullscreen takeover.)

Then wrap the existing `<ScanProvider>` children with `<CookingProvider>`:

```tsx
return (
  <BrowserRouter>
    <ScanProvider>
      <CookingProvider>
        <PhoneFrame>
          <AnimatedRoutes />
          <StatusBar tone="dark" />
          <DynamicIsland />
        </PhoneFrame>
      </CookingProvider>
    </ScanProvider>
  </BrowserRouter>
)
```

- [ ] **Step 4: Replace the `Start cooking` placeholder in `RecipeDetail.tsx`**

Locate the sticky action bar (around lines 325-333) and change the `Start cooking` button:

```tsx
<GlassButton
  variant="primary"
  size="md"
  fullWidth
  onClick={() => navigate(`/recipe/${recipe.id}/cook`)}
  leadingIcon={<Play className="h-4 w-4" strokeWidth={2.25} />}
>
  Start cooking
</GlassButton>
```

- [ ] **Step 5: Verify**

```
npx tsc --noEmit
npm run dev
```

In the browser: navigate to a recipe detail, tap **Start cooking**, confirm the cooking screen opens with the blurred backdrop, recipe title at top, and the placeholder text. Tap the X button — the back navigation returns to the recipe.

- [ ] **Step 6: Commit**

```
git add fridgesnap/src/contexts/CookingContext.tsx fridgesnap/src/screens/CookingMode.tsx fridgesnap/src/App.tsx fridgesnap/src/screens/RecipeDetail.tsx
git commit -m "Wire cooking-mode route and active-timer context"
```

---

## Task 3: Step-by-Step Navigation

Goal: replace the placeholder body with real step content — large step number, step text, and forward/back navigation via swipe and tap arrows. Last step swipe-forward triggers a placeholder `onComplete` callback (real completion flow lands in Task 5).

**Files:**
- Create: `fridgesnap/src/components/cooking/CookingStep.tsx`
- Modify: `fridgesnap/src/screens/CookingMode.tsx`

- [ ] **Step 1: Create `src/components/cooking/CookingStep.tsx`**

```tsx
import { motion } from 'framer-motion'
import type { ParsedTimerHint } from '../../types'

interface CookingStepProps {
  index: number       // 0-based
  total: number
  text: string
  hint: ParsedTimerHint | null
  onStartTimer: (hint: ParsedTimerHint) => void
}

export function CookingStep({ index, total, text, hint, onStartTimer }: CookingStepProps) {
  return (
    <motion.div
      key={index}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      className="flex h-full flex-col items-center justify-center px-6 text-center"
    >
      <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-white/55">
        Step {index + 1} of {total}
      </p>
      <p className="mt-4 text-[28px] font-bold leading-[1.2] tracking-tight text-white">
        {text}
      </p>

      {hint && (
        <button
          type="button"
          onClick={() => onStartTimer(hint)}
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-5 py-2.5 text-[14px] font-bold text-white shadow-glass-sm backdrop-blur-md transition-colors hover:bg-white/25"
        >
          <span aria-hidden>⏱</span>
          Start {hint.minutes} min — {hint.label}
        </button>
      )}
    </motion.div>
  )
}
```

- [ ] **Step 2: Replace the body of `CookingMode.tsx` to render steps with swipe + arrow navigation**

Replace the existing placeholder body (the `<div>` with "Cooking flow coming online…") and add the necessary imports and state. The full updated file:

```tsx
import { useMemo, useState } from 'react'
import { AnimatePresence, motion, useMotionValue } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { recipes } from '../data/mockData'
import { detectTimer } from '../utils/cookingTimerParser'
import { CookingStep } from '../components/cooking/CookingStep'
import { useCooking } from '../contexts/CookingContext'
import type { ParsedTimerHint } from '../types'

export function CookingMode() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const recipe = useMemo(() => recipes.find((r) => r.id === id), [id])
  const { startTimer } = useCooking()
  const [stepIdx, setStepIdx] = useState(0)
  const dragX = useMotionValue(0)

  if (!recipe) {
    return (
      <div className="relative flex h-full w-full items-center justify-center bg-ink-900 text-white">
        <p className="text-[14px]">Recipe not found.</p>
      </div>
    )
  }

  const total = recipe.steps.length
  const text = recipe.steps[stepIdx]
  const hint = detectTimer(text)

  const goNext = () => {
    if (stepIdx < total - 1) setStepIdx((i) => i + 1)
    else handleComplete()
  }
  const goPrev = () => {
    if (stepIdx > 0) setStepIdx((i) => i - 1)
  }

  const handleComplete = () => {
    // Task 5 will replace this with the real CompletionFlow.
    window.alert('Demo: completion flow lands in Task 5.')
  }

  const handleStartTimer = (h: ParsedTimerHint) => {
    startTimer({
      recipeId: recipe.id,
      stepIdx,
      label: h.label,
      durationMinutes: h.minutes,
    })
  }

  return (
    <motion.div
      key="cooking-mode"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="relative h-full w-full overflow-hidden text-white"
    >
      {/* Blurred recipe hero backdrop */}
      <div aria-hidden className="absolute inset-0">
        <img
          src={recipe.image}
          alt=""
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ filter: 'blur(40px) saturate(1.1)', transform: 'scale(1.15)' }}
        />
        <div className="absolute inset-0 bg-black/55" />
      </div>

      {/* Top bar */}
      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 pt-14">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Exit cooking mode"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white shadow-glass-sm backdrop-blur-md"
        >
          <X className="h-5 w-5" strokeWidth={2.25} />
        </button>
        <p className="max-w-[60%] truncate text-[13px] font-semibold opacity-80">
          {recipe.title}
        </p>
        <div className="h-10 w-10" />
      </div>

      {/* Progress bar */}
      <div className="absolute inset-x-5 top-[112px] z-20 h-1 overflow-hidden rounded-full bg-white/15">
        <motion.div
          className="h-full bg-white"
          initial={false}
          animate={{ width: `${((stepIdx + 1) / total) * 100}%` }}
          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        />
      </div>

      {/* Step body — drag-to-swipe */}
      <motion.div
        className="absolute inset-0 z-10 pt-32 pb-32"
        drag="x"
        style={{ x: dragX }}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={(_, info) => {
          if (info.offset.x < -80) goNext()
          else if (info.offset.x > 80) goPrev()
        }}
      >
        <AnimatePresence mode="wait">
          <CookingStep
            key={stepIdx}
            index={stepIdx}
            total={total}
            text={text}
            hint={hint}
            onStartTimer={handleStartTimer}
          />
        </AnimatePresence>
      </motion.div>

      {/* Bottom nav arrows */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between px-5 pb-10">
        <button
          type="button"
          onClick={goPrev}
          disabled={stepIdx === 0}
          aria-label="Previous step"
          className="flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white shadow-glass-sm backdrop-blur-md transition-opacity disabled:opacity-30"
        >
          <ChevronLeft className="h-6 w-6" strokeWidth={2.25} />
        </button>
        <button
          type="button"
          onClick={goNext}
          aria-label={stepIdx === total - 1 ? 'Finish cooking' : 'Next step'}
          className="flex items-center gap-2 rounded-full border border-white/40 bg-white/85 px-5 py-3 text-[14px] font-bold text-ink-900 shadow-glass-md"
        >
          {stepIdx === total - 1 ? 'Finish' : 'Next'}
          <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
        </button>
      </div>
    </motion.div>
  )
}
```

- [ ] **Step 3: Verify**

```
npx tsc --noEmit
npm run dev
```

In the browser: open a recipe → Start cooking. Confirm:
- Step 1 of N shows
- Tap **Next** → step 2; arrow disabled when on step 1, enabled otherwise
- Drag step body left → advances; right → goes back
- A step containing "10 minutes" shows a timer button labelled "Start 10 min — Simmer" (or similar)
- Tap timer button — nothing visible yet (Task 4 surfaces the chip), but no errors in console
- On the last step, the right button reads **Finish** and tapping it shows the demo alert

- [ ] **Step 4: Commit**

```
git add fridgesnap/src/components/cooking/CookingStep.tsx fridgesnap/src/screens/CookingMode.tsx
git commit -m "Add step-by-step cooking navigation with swipe and timer hints"
```

---

## Task 4: Active Timer UI (Chip, Drawer, Notifications)

Goal: starting a timer surfaces a floating chip top-right of `CookingMode`. Tapping it opens a drawer listing all active timers with cancel buttons. When a timer fires, an in-app toast appears, the device vibrates, and (if permission granted) a system notification fires.

**Files:**
- Create: `fridgesnap/src/components/cooking/TimerChip.tsx`
- Create: `fridgesnap/src/components/cooking/TimersDrawer.tsx`
- Create: `fridgesnap/src/components/cooking/TimerToast.tsx`
- Modify: `fridgesnap/src/screens/CookingMode.tsx`

- [ ] **Step 1: Create `TimerChip.tsx`**

```tsx
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
```

- [ ] **Step 2: Create `TimersDrawer.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, X } from 'lucide-react'
import type { ActiveTimer } from '../../types'

interface TimersDrawerProps {
  open: boolean
  timers: ActiveTimer[]
  onClose: () => void
  onCancel: (id: string) => void
}

function formatRemaining(ms: number): string {
  if (ms <= 0) return '0:00'
  const total = Math.ceil(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function TimersDrawer({ open, timers, onClose, onCancel }: TimersDrawerProps) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!open || timers.length === 0) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [open, timers.length])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 z-30 bg-black/55"
          />
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="absolute inset-x-0 bottom-0 z-40 rounded-t-3xl border-t border-white/30 bg-ink-900/85 px-5 pb-8 pt-4 backdrop-blur-xl"
          >
            <div className="mx-auto h-1.5 w-10 rounded-full bg-white/30" />
            <div className="mt-3 flex items-center justify-between">
              <h3 className="text-[16px] font-bold tracking-tight text-white">
                Active timers
              </h3>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close timers"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white"
              >
                <X className="h-4 w-4" strokeWidth={2.25} />
              </button>
            </div>

            {timers.length === 0 ? (
              <p className="mt-4 text-center text-[13px] text-white/60">
                No active timers.
              </p>
            ) : (
              <ul className="mt-4 flex flex-col gap-2">
                {timers.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between rounded-2xl border border-white/15 bg-white/10 px-3.5 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-semibold text-white">
                        {t.label}
                      </p>
                      <p className="text-[11px] uppercase tracking-wider text-white/50">
                        Step {t.stepIdx + 1} · {t.durationMinutes} min
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="tabular-nums text-[15px] font-bold text-white">
                        {formatRemaining(t.endsAt - now)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onCancel(t.id)}
                        aria-label={`Cancel ${t.label} timer`}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white/80"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={2.25} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 3: Create `TimerToast.tsx`**

```tsx
import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell } from 'lucide-react'
import type { ActiveTimer } from '../../types'

interface TimerToastProps {
  timer: ActiveTimer | null
  onDismiss: () => void
}

export function TimerToast({ timer, onDismiss }: TimerToastProps) {
  useEffect(() => {
    if (!timer) return
    const id = window.setTimeout(onDismiss, 5000)
    return () => window.clearTimeout(id)
  }, [timer, onDismiss])

  return (
    <AnimatePresence>
      {timer && (
        <motion.button
          type="button"
          onClick={onDismiss}
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ type: 'spring', stiffness: 360, damping: 28 }}
          className="absolute left-1/2 top-24 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-emerald-300/55 bg-emerald-500/90 px-4 py-2.5 text-[13px] font-bold text-white shadow-glass-md"
        >
          <Bell className="h-4 w-4" strokeWidth={2.25} />
          {timer.label} timer done
        </motion.button>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 4: Wire chip, drawer, toast, vibration, and notification permission into `CookingMode.tsx`**

Add new state and effects. The complete updated `CookingMode.tsx`:

```tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValue } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { recipes } from '../data/mockData'
import { detectTimer } from '../utils/cookingTimerParser'
import { CookingStep } from '../components/cooking/CookingStep'
import { TimerChip } from '../components/cooking/TimerChip'
import { TimersDrawer } from '../components/cooking/TimersDrawer'
import { TimerToast } from '../components/cooking/TimerToast'
import { useCooking } from '../contexts/CookingContext'
import type { ActiveTimer, ParsedTimerHint } from '../types'

function maybeRequestNotificationPermission() {
  if (typeof Notification === 'undefined') return
  if (Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {
      // ignore — user dismissed
    })
  }
}

export function CookingMode() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const recipe = useMemo(() => recipes.find((r) => r.id === id), [id])
  const { timers, startTimer, cancelTimer, onTimerFired } = useCooking()
  const [stepIdx, setStepIdx] = useState(0)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [firedToast, setFiredToast] = useState<ActiveTimer | null>(null)
  const dragX = useMotionValue(0)
  const requestedPermission = useRef(false)

  // Subscribe to timer fired events: vibrate, system notification, toast.
  useEffect(() => {
    const unsub = onTimerFired((t) => {
      if ('vibrate' in navigator) navigator.vibrate?.([200, 100, 200])
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try {
          new Notification(`${t.label} timer done`, {
            body: recipe?.title ?? 'Cooking timer',
            silent: false,
          })
        } catch {
          // ignore — some browsers throw if instantiated in non-document contexts
        }
      }
      setFiredToast(t)
    })
    return unsub
  }, [onTimerFired, recipe?.title])

  if (!recipe) {
    return (
      <div className="relative flex h-full w-full items-center justify-center bg-ink-900 text-white">
        <p className="text-[14px]">Recipe not found.</p>
      </div>
    )
  }

  const total = recipe.steps.length
  const text = recipe.steps[stepIdx]
  const hint = detectTimer(text)
  const myTimers = timers.filter((t) => t.recipeId === recipe.id)

  const goNext = () => {
    if (stepIdx < total - 1) setStepIdx((i) => i + 1)
    else handleComplete()
  }
  const goPrev = () => {
    if (stepIdx > 0) setStepIdx((i) => i - 1)
  }

  const handleComplete = () => {
    // Task 5 will replace this with the real CompletionFlow.
    window.alert('Demo: completion flow lands in Task 5.')
  }

  const handleStartTimer = (h: ParsedTimerHint) => {
    if (!requestedPermission.current) {
      requestedPermission.current = true
      maybeRequestNotificationPermission()
    }
    startTimer({
      recipeId: recipe.id,
      stepIdx,
      label: h.label,
      durationMinutes: h.minutes,
    })
  }

  return (
    <motion.div
      key="cooking-mode"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="relative h-full w-full overflow-hidden text-white"
    >
      {/* Blurred recipe hero backdrop */}
      <div aria-hidden className="absolute inset-0">
        <img
          src={recipe.image}
          alt=""
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ filter: 'blur(40px) saturate(1.1)', transform: 'scale(1.15)' }}
        />
        <div className="absolute inset-0 bg-black/55" />
      </div>

      {/* Top bar with chip on the right */}
      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-3 px-5 pt-14">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Exit cooking mode"
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white shadow-glass-sm backdrop-blur-md"
        >
          <X className="h-5 w-5" strokeWidth={2.25} />
        </button>
        <p className="min-w-0 flex-1 truncate text-center text-[13px] font-semibold opacity-80">
          {recipe.title}
        </p>
        <div className="flex-shrink-0">
          <TimerChip timers={myTimers} onClick={() => setDrawerOpen(true)} />
        </div>
      </div>

      {/* Progress bar */}
      <div className="absolute inset-x-5 top-[112px] z-20 h-1 overflow-hidden rounded-full bg-white/15">
        <motion.div
          className="h-full bg-white"
          initial={false}
          animate={{ width: `${((stepIdx + 1) / total) * 100}%` }}
          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        />
      </div>

      {/* Step body */}
      <motion.div
        className="absolute inset-0 z-10 pt-32 pb-32"
        drag="x"
        style={{ x: dragX }}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={(_, info) => {
          if (info.offset.x < -80) goNext()
          else if (info.offset.x > 80) goPrev()
        }}
      >
        <AnimatePresence mode="wait">
          <CookingStep
            key={stepIdx}
            index={stepIdx}
            total={total}
            text={text}
            hint={hint}
            onStartTimer={handleStartTimer}
          />
        </AnimatePresence>
      </motion.div>

      {/* Bottom nav arrows */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between px-5 pb-10">
        <button
          type="button"
          onClick={goPrev}
          disabled={stepIdx === 0}
          aria-label="Previous step"
          className="flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white shadow-glass-sm backdrop-blur-md transition-opacity disabled:opacity-30"
        >
          <ChevronLeft className="h-6 w-6" strokeWidth={2.25} />
        </button>
        <button
          type="button"
          onClick={goNext}
          aria-label={stepIdx === total - 1 ? 'Finish cooking' : 'Next step'}
          className="flex items-center gap-2 rounded-full border border-white/40 bg-white/85 px-5 py-3 text-[14px] font-bold text-ink-900 shadow-glass-md"
        >
          {stepIdx === total - 1 ? 'Finish' : 'Next'}
          <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
        </button>
      </div>

      {/* Timer drawer + fired toast */}
      <TimersDrawer
        open={drawerOpen}
        timers={myTimers}
        onClose={() => setDrawerOpen(false)}
        onCancel={(id) => cancelTimer(id)}
      />
      <TimerToast timer={firedToast} onDismiss={() => setFiredToast(null)} />
    </motion.div>
  )
}
```

- [ ] **Step 5: Verify**

```
npx tsc --noEmit
npm run dev
```

In the browser:
- Open a recipe with a step containing a duration (e.g. carbonara), tap **Start cooking**, navigate to a step with a timer button.
- Tap the timer button — a chip appears top-right with `m:ss` countdown, decreasing each second. (To test the fired toast quickly without waiting, temporarily tweak `durationMinutes` to a low fraction in the parser, then revert.)
- Tap the chip — drawer slides up from the bottom, listing the active timer. Tap the trash button — timer cancelled, chip disappears.
- Start a 1-minute timer, wait. When it fires: toast appears top-center reading `<Label> timer done` and disappears after 5 s. If notification permission granted, a system notification also fires.
- The first `Start timer` triggers a permission prompt (in browsers that surface it).

- [ ] **Step 6: Commit**

```
git add fridgesnap/src/components/cooking/TimerChip.tsx fridgesnap/src/components/cooking/TimersDrawer.tsx fridgesnap/src/components/cooking/TimerToast.tsx fridgesnap/src/screens/CookingMode.tsx
git commit -m "Add active-timer chip, drawer, and fired notifications"
```

---

## Task 5: Completion Flow Scaffolding (Confetti → Photo Stub)

Goal: tapping **Finish** on the last step opens an in-screen completion flow that walks through three sub-screens — celebration, photo capture, rating + save. This task wires the scaffold and the celebration step. Photo capture and save logic land in Task 6.

**Files:**
- Create: `fridgesnap/src/components/cooking/CompletionFlow.tsx`
- Modify: `fridgesnap/src/screens/CookingMode.tsx`

- [ ] **Step 1: Create `CompletionFlow.tsx` with three internal stages**

```tsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PartyPopper } from 'lucide-react'
import type { Recipe } from '../../types'

type Stage = 'celebrate' | 'capture' | 'rate'

interface CompletionFlowProps {
  recipe: Recipe
  onClose: () => void
  onSaved: () => void
}

export function CompletionFlow({ recipe, onClose }: CompletionFlowProps) {
  const [stage, setStage] = useState<Stage>('celebrate')
  // onSaved is wired in Task 6 once the rate stage exists.
  void onClose // currently unused at celebrate stage

  return (
    <AnimatePresence mode="wait">
      {stage === 'celebrate' && (
        <Celebrate key="celebrate" recipeTitle={recipe.title} onContinue={() => setStage('capture')} />
      )}
      {stage === 'capture' && (
        <Capture key="capture" onSkipToRate={() => setStage('rate')} />
      )}
      {stage === 'rate' && (
        <Rate key="rate" />
      )}
    </AnimatePresence>
  )
}

function Celebrate({ recipeTitle, onContinue }: { recipeTitle: string; onContinue: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/70 px-6 text-center backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.6, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.05 }}
        className="flex h-24 w-24 items-center justify-center rounded-3xl border border-white/35 bg-white/15 shadow-glass-lg backdrop-blur-xl"
      >
        <PartyPopper className="h-12 w-12 text-amber-200" strokeWidth={1.75} />
      </motion.div>
      <h2 className="mt-6 text-[24px] font-extrabold tracking-tight text-white">
        You did it!
      </h2>
      <p className="mt-1 text-[13.5px] text-white/70">
        {recipeTitle} is plated and ready.
      </p>
      <button
        type="button"
        onClick={onContinue}
        className="mt-7 rounded-full border border-white/40 bg-white/85 px-6 py-3 text-[14px] font-bold text-ink-900 shadow-glass-md"
      >
        Show off your dish
      </button>
    </motion.div>
  )
}

function Capture({ onSkipToRate }: { onSkipToRate: () => void }) {
  // Photo capture lands in Task 6. For now just a placeholder + advance button.
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/85 px-6 text-center"
    >
      <p className="text-[14px] text-white/70">Photo capture coming in Task 6.</p>
      <button
        type="button"
        onClick={onSkipToRate}
        className="mt-4 rounded-full bg-white/20 px-4 py-2 text-[13px] font-semibold text-white"
      >
        Skip (dev)
      </button>
    </motion.div>
  )
}

function Rate() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 text-white"
    >
      <p className="text-[14px] text-white/70">Rating + save lands in Task 6.</p>
    </motion.div>
  )
}
```

- [ ] **Step 2: Update `CookingMode.tsx` to mount `CompletionFlow` instead of the alert**

Add an import:

```ts
import { CompletionFlow } from '../components/cooking/CompletionFlow'
```

Add a state flag:

```tsx
const [completing, setCompleting] = useState(false)
```

Replace `handleComplete`:

```tsx
const handleComplete = () => {
  setCompleting(true)
}
```

Render the completion flow above the existing `TimerToast`:

```tsx
{completing && (
  <CompletionFlow
    recipe={recipe}
    onClose={() => setCompleting(false)}
    onSaved={() => {
      setCompleting(false)
      navigate(`/recipe/${recipe.id}`)
    }}
  />
)}
```

- [ ] **Step 3: Verify**

```
npx tsc --noEmit
npm run dev
```

In the browser: walk through all steps of a recipe → tap **Finish** → confetti-style celebration card with `<recipe title> is plated and ready` appears → tap **Show off your dish** → placeholder capture screen → tap **Skip (dev)** → placeholder rate screen.

- [ ] **Step 4: Commit**

```
git add fridgesnap/src/components/cooking/CompletionFlow.tsx fridgesnap/src/screens/CookingMode.tsx
git commit -m "Add completion flow scaffold with celebration screen"
```

---

## Task 6: Photo Capture, Rating, and Save

Goal: replace the Capture and Rate stage placeholders with the real flow — pick a photo via native file input, downscale to 1080 px max edge / quality 0.85, then 1–5 star rating + optional note, then save to `localStorage` and exit.

**Files:**
- Modify: `fridgesnap/src/components/cooking/CompletionFlow.tsx`

- [ ] **Step 1: Add image-resize helper and the real Capture + Rate stages**

Replace the entire body of `CompletionFlow.tsx` with:

```tsx
import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, PartyPopper, Star, X } from 'lucide-react'
import { addCookedEntry } from '../../utils/cookbookStorage'
import type { CookedEntry, Rating, Recipe } from '../../types'

type Stage = 'celebrate' | 'capture' | 'rate'

interface CompletionFlowProps {
  recipe: Recipe
  onClose: () => void
  onSaved: () => void
}

const MAX_EDGE = 1080
const JPEG_QUALITY = 0.85

async function resizeToDataURL(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const longEdge = Math.max(bitmap.width, bitmap.height)
  const scale = longEdge > MAX_EDGE ? MAX_EDGE / longEdge : 1
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')
  ctx.drawImage(bitmap, 0, 0, w, h)
  return canvas.toDataURL('image/jpeg', JPEG_QUALITY)
}

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `c-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function CompletionFlow({ recipe, onClose, onSaved }: CompletionFlowProps) {
  const [stage, setStage] = useState<Stage>('celebrate')
  const [photoDataURL, setPhotoDataURL] = useState<string | null>(null)
  const [rating, setRating] = useState<Rating>(5)
  const [note, setNote] = useState('')
  const [saveError, setSaveError] = useState<string | null>(null)

  const handleSave = () => {
    if (!photoDataURL) return
    const entry: CookedEntry = {
      id: newId(),
      recipeId: recipe.id,
      recipeTitle: recipe.title,
      photoDataURL,
      rating,
      note: note.trim() ? note.trim() : undefined,
      cookedAt: new Date().toISOString(),
    }
    const result = addCookedEntry(entry)
    if (!result.ok) {
      setSaveError(
        result.reason === 'quota'
          ? 'Cookbook full — free up space and try again.'
          : "Couldn't save — please try again.",
      )
      return
    }
    onSaved()
  }

  return (
    <AnimatePresence mode="wait">
      {stage === 'celebrate' && (
        <Celebrate
          key="celebrate"
          recipeTitle={recipe.title}
          onContinue={() => setStage('capture')}
          onExit={onClose}
        />
      )}
      {stage === 'capture' && (
        <Capture
          key="capture"
          photoDataURL={photoDataURL}
          onPicked={setPhotoDataURL}
          onContinue={() => setStage('rate')}
          onBack={() => setStage('celebrate')}
        />
      )}
      {stage === 'rate' && (
        <Rate
          key="rate"
          rating={rating}
          note={note}
          saveError={saveError}
          onRatingChange={setRating}
          onNoteChange={setNote}
          onSave={handleSave}
          onBack={() => setStage('capture')}
        />
      )}
    </AnimatePresence>
  )
}

function Celebrate({ recipeTitle, onContinue, onExit }: { recipeTitle: string; onContinue: () => void; onExit: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/70 px-6 text-center backdrop-blur-md"
    >
      <button
        type="button"
        onClick={onExit}
        aria-label="Close"
        className="absolute right-5 top-14 flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white"
      >
        <X className="h-5 w-5" strokeWidth={2.25} />
      </button>

      <motion.div
        initial={{ scale: 0.6, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.05 }}
        className="flex h-24 w-24 items-center justify-center rounded-3xl border border-white/35 bg-white/15 shadow-glass-lg backdrop-blur-xl"
      >
        <PartyPopper className="h-12 w-12 text-amber-200" strokeWidth={1.75} />
      </motion.div>
      <h2 className="mt-6 text-[24px] font-extrabold tracking-tight text-white">
        You did it!
      </h2>
      <p className="mt-1 text-[13.5px] text-white/70">
        {recipeTitle} is plated and ready.
      </p>
      <button
        type="button"
        onClick={onContinue}
        className="mt-7 rounded-full border border-white/40 bg-white/85 px-6 py-3 text-[14px] font-bold text-ink-900 shadow-glass-md"
      >
        Show off your dish
      </button>
    </motion.div>
  )
}

interface CaptureProps {
  photoDataURL: string | null
  onPicked: (dataURL: string) => void
  onContinue: () => void
  onBack: () => void
}

function Capture({ photoDataURL, onPicked, onContinue, onBack }: CaptureProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      const dataURL = await resizeToDataURL(file)
      onPicked(dataURL)
    } catch {
      setError("Couldn't read that image. Try a different one.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-between bg-black/85 px-6 pb-10 pt-20 text-white"
    >
      <button
        type="button"
        onClick={onBack}
        aria-label="Back"
        className="absolute left-5 top-14 flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/10"
      >
        <X className="h-5 w-5" strokeWidth={2.25} />
      </button>

      <div className="text-center">
        <h2 className="text-[20px] font-bold tracking-tight">Snap your dish</h2>
        <p className="mt-1 text-[13px] text-white/65">
          One photo for your cookbook.
        </p>
      </div>

      <div className="relative flex w-full max-w-sm flex-1 items-center justify-center py-6">
        <div className="relative aspect-square w-full overflow-hidden rounded-3xl border border-white/20 bg-white/5">
          {photoDataURL ? (
            <img src={photoDataURL} alt="Your dish" className="h-full w-full object-cover" />
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex h-full w-full flex-col items-center justify-center gap-2 text-white/60"
            >
              <Camera className="h-12 w-12" strokeWidth={1.5} />
              <span className="text-[13px] font-semibold">Tap to capture</span>
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleChange}
          className="hidden"
        />
      </div>

      {error && <p className="mb-2 text-[12px] text-rose-300">{error}</p>}

      <div className="flex w-full max-w-sm gap-3">
        {photoDataURL && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="flex-1 rounded-full border border-white/30 bg-white/10 py-3 text-[14px] font-semibold disabled:opacity-50"
          >
            Retake
          </button>
        )}
        <button
          type="button"
          onClick={onContinue}
          disabled={!photoDataURL || busy}
          className="flex-1 rounded-full border border-white/40 bg-white/90 py-3 text-[14px] font-bold text-ink-900 disabled:opacity-50"
        >
          {busy ? 'Processing…' : 'Continue'}
        </button>
      </div>
    </motion.div>
  )
}

interface RateProps {
  rating: Rating
  note: string
  saveError: string | null
  onRatingChange: (r: Rating) => void
  onNoteChange: (s: string) => void
  onSave: () => void
  onBack: () => void
}

function Rate({ rating, note, saveError, onRatingChange, onNoteChange, onSave, onBack }: RateProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-between bg-black/85 px-6 pb-10 pt-20 text-white"
    >
      <button
        type="button"
        onClick={onBack}
        aria-label="Back"
        className="absolute left-5 top-14 flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/10"
      >
        <X className="h-5 w-5" strokeWidth={2.25} />
      </button>

      <div className="w-full max-w-sm text-center">
        <h2 className="text-[20px] font-bold tracking-tight">How was it?</h2>
        <p className="mt-1 text-[13px] text-white/65">
          Rate it for your cookbook. Notes optional.
        </p>

        <div className="mt-6 flex justify-center gap-1.5">
          {([1, 2, 3, 4, 5] as Rating[]).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onRatingChange(n)}
              aria-label={`Rate ${n} star${n === 1 ? '' : 's'}`}
              className="p-1"
            >
              <Star
                className={`h-9 w-9 ${n <= rating ? 'fill-amber-300 text-amber-300' : 'text-white/30'}`}
                strokeWidth={1.5}
              />
            </button>
          ))}
        </div>

        <textarea
          value={note}
          onChange={(e) => onNoteChange(e.target.value.slice(0, 240))}
          rows={3}
          placeholder="Notes for next time (optional)"
          className="mt-6 w-full resize-none rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-[14px] text-white placeholder:text-white/40 focus:border-white/45 focus:outline-none"
        />
      </div>

      <div className="w-full max-w-sm">
        {saveError && <p className="mb-2 text-center text-[12px] text-rose-300">{saveError}</p>}
        <button
          type="button"
          onClick={onSave}
          className="w-full rounded-full border border-white/40 bg-white/90 py-3 text-[14px] font-bold text-ink-900"
        >
          Save to cookbook
        </button>
      </div>
    </motion.div>
  )
}
```

- [ ] **Step 2: Verify**

```
npx tsc --noEmit
npm run dev
```

In the browser:
- Finish a recipe → celebration → tap **Show off your dish** → camera capture screen.
- Tap the dashed area → native file picker (or camera on mobile). Pick any image. The image previews inside the rounded square.
- Tap **Retake** to confirm the picker reopens.
- Tap **Continue** → rating screen with 5 stars selected by default.
- Tap stars to change rating (1–5 toggle). Type into the notes textarea (capped at 240 chars).
- Tap **Save to cookbook**. The screen closes and you land back on `RecipeDetail`. Open dev tools → Application → Local Storage → confirm `fridgesnap.cookbook.v1` contains a single entry with the right `recipeId`, `rating`, `photoDataURL` starting with `data:image/jpeg;base64,`.

- [ ] **Step 3: Commit**

```
git add fridgesnap/src/components/cooking/CompletionFlow.tsx
git commit -m "Add photo capture, rating, and cookbook save flow"
```

---

## Task 7: Saved Screen Tabs and Cooked Recipe Card

Goal: rewrite `Saved.tsx` with two tabs — **Saved** (existing placeholder copy) and **Cooked** (list of `CookedEntry` rendered as `CookedRecipeCard`s, newest first). Empty state when no entries exist.

**Files:**
- Create: `fridgesnap/src/components/cooking/CookedRecipeCard.tsx`
- Modify: `fridgesnap/src/screens/Saved.tsx`

- [ ] **Step 1: Create `CookedRecipeCard.tsx`**

```tsx
import { Star } from 'lucide-react'
import type { CookedEntry } from '../../types'

interface CookedRecipeCardProps {
  entry: CookedEntry
}

function relativeDate(iso: string): string {
  const then = new Date(iso).getTime()
  const diffMs = Date.now() - then
  const day = 24 * 60 * 60 * 1000
  if (diffMs < day) return 'Today'
  if (diffMs < 2 * day) return 'Yesterday'
  const days = Math.floor(diffMs / day)
  if (days < 7) return `${days} days ago`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function CookedRecipeCard({ entry }: CookedRecipeCardProps) {
  return (
    <div className="flex gap-3 rounded-2xl border border-white/40 bg-white/55 p-2.5 shadow-glass-sm backdrop-blur-md">
      <img
        src={entry.photoDataURL}
        alt={entry.recipeTitle}
        className="h-20 w-20 flex-shrink-0 rounded-xl object-cover"
      />
      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
        <div className="min-w-0">
          <p className="truncate text-[14.5px] font-bold tracking-tight text-ink-900">
            {entry.recipeTitle}
          </p>
          <p className="text-[11px] font-medium uppercase tracking-wider text-ink-400">
            {relativeDate(entry.cookedAt)}
          </p>
        </div>
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              className={`h-3.5 w-3.5 ${n <= entry.rating ? 'fill-amber-400 text-amber-400' : 'text-ink-200'}`}
              strokeWidth={1.5}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Replace `src/screens/Saved.tsx` with the tabbed layout**

```tsx
import { useState } from 'react'
import { motion, LayoutGroup } from 'framer-motion'
import { Bookmark, ChefHat } from 'lucide-react'
import { GradientBackground } from '../components/layout/GradientBackground'
import { GlassCard } from '../components/ui/GlassCard'
import { AppNav } from '../components/layout/AppNav'
import { CookedRecipeCard } from '../components/cooking/CookedRecipeCard'
import { getCookedEntries } from '../utils/cookbookStorage'

type Tab = 'saved' | 'cooked'

export function Saved() {
  const [tab, setTab] = useState<Tab>('saved')
  const cooked = tab === 'cooked' ? getCookedEntries() : []

  return (
    <div className="relative h-full w-full overflow-hidden">
      <GradientBackground variant="ocean" />
      <div className="relative z-10 flex h-full w-full flex-col px-5 pb-24 pt-14">
        <h1 className="text-[24px] font-extrabold tracking-tight text-ink-900">
          Your recipes
        </h1>

        {/* Tabs */}
        <LayoutGroup id="saved-tabs">
          <div className="mt-4 flex gap-2 rounded-full border border-white/40 bg-white/45 p-1 shadow-glass-sm backdrop-blur-md">
            <TabButton active={tab === 'saved'} onClick={() => setTab('saved')} label="Saved" />
            <TabButton active={tab === 'cooked'} onClick={() => setTab('cooked')} label="Cooked" />
          </div>
        </LayoutGroup>

        <div className="no-scrollbar mt-4 flex-1 overflow-y-auto">
          {tab === 'saved' ? <SavedEmpty /> : <CookedTab entries={cooked} />}
        </div>
      </div>
      <AppNav active="saved" />
    </div>
  )
}

interface TabButtonProps {
  active: boolean
  onClick: () => void
  label: string
}

function TabButton({ active, onClick, label }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex-1 rounded-full px-4 py-2 text-[13px] font-bold tracking-tight"
    >
      {active && (
        <motion.span
          layoutId="saved-tab-pill"
          className="absolute inset-0 rounded-full bg-white shadow-glass-sm"
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        />
      )}
      <span className={['relative z-10', active ? 'text-ink-900' : 'text-ink-500'].join(' ')}>
        {label}
      </span>
    </button>
  )
}

function SavedEmpty() {
  return (
    <GlassCard tone="light" blur="lg" className="px-6 py-7 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/55 text-ink-900 shadow-glass-sm">
        <Bookmark className="h-5 w-5" strokeWidth={1.75} />
      </div>
      <h2 className="mt-3 text-[18px] font-bold tracking-tight text-ink-900">
        Saved recipes
      </h2>
      <p className="mt-1 text-[13px] leading-relaxed text-ink-500">
        Bookmarked recipes will live here. Coming soon.
      </p>
    </GlassCard>
  )
}

function CookedTab({ entries }: { entries: ReturnType<typeof getCookedEntries> }) {
  if (entries.length === 0) {
    return (
      <GlassCard tone="light" blur="lg" className="px-6 py-7 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/55 text-ink-900 shadow-glass-sm">
          <ChefHat className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <h2 className="mt-3 text-[18px] font-bold tracking-tight text-ink-900">
          No cooked recipes yet
        </h2>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-500">
          Finish your first dish to see it here.
        </p>
      </GlassCard>
    )
  }
  return (
    <ul className="flex flex-col gap-2.5">
      {entries.map((e) => (
        <li key={e.id}>
          <CookedRecipeCard entry={e} />
        </li>
      ))}
    </ul>
  )
}
```

- [ ] **Step 3: Verify**

```
npx tsc --noEmit
npm run lint
npm run dev
```

In the browser:
- Open the Saved tab in the bottom nav. Confirm two pill tabs: **Saved** | **Cooked**, with the white pill animating between them.
- Tap **Cooked** with no entries → empty state with chef-hat icon and "No cooked recipes yet" copy.
- Cook a recipe end-to-end (Tasks 1–6 must be complete): walk through steps → Finish → photo + rating → Save. Navigate back to Saved → Cooked tab. The newly-cooked entry appears at the top with the photo, title, relative date "Today", and the rating you gave.
- Cook a second recipe — confirm the new entry is prepended (newest first).
- Reload the page, return to Saved → Cooked. Entries persist (sourced from localStorage).

- [ ] **Step 4: Commit**

```
git add fridgesnap/src/components/cooking/CookedRecipeCard.tsx fridgesnap/src/screens/Saved.tsx
git commit -m "Add Cooked tab and recipe card to Saved screen"
```

---

## Spec Coverage Check

| Spec requirement                                              | Task |
|---------------------------------------------------------------|------|
| Auto-detect timer hints from step text                         | 1    |
| Recipe hero blurred fullscreen background                      | 2, 3 |
| Step-by-step swipe + arrow navigation                          | 3    |
| Multiple parallel background timers                            | 2, 4 |
| Floating timer chip + drawer with cancels                      | 4    |
| Vibration + system notifications on timer fire                 | 4    |
| Lazy notification permission prompt on first timer             | 4    |
| Confetti / celebration on last step                            | 5, 6 |
| Photo capture (file input with `capture=environment`)          | 6    |
| Image downscale to 1080 px / JPEG 0.85                         | 6    |
| 1–5 star rating + optional note (240 char cap)                 | 6    |
| `localStorage` persistence under `fridgesnap.cookbook.v1`      | 1, 6 |
| `QuotaExceededError` surfaces a user-visible error             | 1, 6 |
| Saved screen with `Saved` / `Cooked` tabs                      | 7    |
| Cooked tab empty state                                         | 7    |
| `CookedRecipeCard` (photo, title, rating, relative date)       | 7    |
| Cooking-mode `NotFound` fallback for missing recipe            | 2    |
