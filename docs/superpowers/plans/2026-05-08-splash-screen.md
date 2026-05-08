# FridgeSnap Splash Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a branded startup splash screen with a slide-up + fade animation that auto-navigates to the existing Onboarding flow after ~1.8s.

**Architecture:** New `Splash` screen component is mounted at the root route `/`. The existing `Onboarding` screen moves from `/` to `/onboarding`. Splash uses Framer Motion for entrance/exit animation and React Router's `useNavigate` with `replace: true` so back-button does not return to splash. The splash route is rendered outside the shared `PageTransition` HOC because its self-managed animation conflicts with the horizontal slide of `PageTransition`.

**Tech Stack:** React 19, Vite, TypeScript, Tailwind CSS, Framer Motion 12, React Router 7. No test framework is configured — verification is via `npm run lint`, `npm run build`, and manual browser testing on `npm run dev`.

**Reference spec:** [docs/superpowers/specs/2026-05-08-splash-screen-design.md](../specs/2026-05-08-splash-screen-design.md)

---

## File Structure

**New files**

- `fridgesnap/src/screens/Splash.tsx` — splash screen component (entry route)

**Modified files**

- `fridgesnap/src/App.tsx` — add `/` → Splash route, move Onboarding to `/onboarding`, route Splash outside `PageTransition`
- `fridgesnap/index.html` — add PNG favicon and apple-touch-icon link tags

**Public assets (already in place)**

- `fridgesnap/public/logo.png` — uploaded by user, used for splash and favicon

---

## Task 1: Create the Splash screen component

**Files:**
- Create: `fridgesnap/src/screens/Splash.tsx`

- [ ] **Step 1: Create the Splash component file**

Create `fridgesnap/src/screens/Splash.tsx` with the following content:

```tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'

export function Splash() {
  const navigate = useNavigate()
  const [show, setShow] = useState(true)

  useEffect(() => {
    const exitTimer = setTimeout(() => setShow(false), 1400)
    const navTimer = setTimeout(() => {
      navigate('/onboarding', { replace: true })
    }, 1800)

    return () => {
      clearTimeout(exitTimer)
      clearTimeout(navTimer)
    }
  }, [navigate])

  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{ background: 'linear-gradient(180deg, #0F1B2D 0%, #0B0C10 100%)' }}
    >
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="w-32 h-32 rounded-[28px] bg-white flex items-center justify-center shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)]"
          >
            <img
              src="/logo.png"
              alt="FridgeSnap"
              className="w-24 h-24 object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

Notes:
- `absolute inset-0` so the splash fills the `PhoneFrame` viewport (the parent in App.tsx is positioned).
- The `AnimatePresence` here lets the inner `<motion.div>` exit cleanly while the splash itself unmounts at navigation. The `show` state flips false at 1.4s, exit animation runs ~0.4s, then at 1.8s navigation fires.
- Tailwind arbitrary values (`rounded-[28px]`, `shadow-[...]`) are supported by the project's Tailwind config.

- [ ] **Step 2: Verify TypeScript compiles**

Run from `fridgesnap/`:

```bash
npx tsc -b --noEmit
```

Expected: no output (success) — or only pre-existing errors unrelated to Splash.tsx.

- [ ] **Step 3: Verify ESLint passes**

Run from `fridgesnap/`:

```bash
npm run lint
```

Expected: no new errors related to `src/screens/Splash.tsx`.

- [ ] **Step 4: Commit**

```bash
git add fridgesnap/src/screens/Splash.tsx
git commit -m "feat: add Splash screen component with slide-up + fade animation"
```

---

## Task 2: Wire Splash into routing and move Onboarding

**Files:**
- Modify: `fridgesnap/src/App.tsx`

- [ ] **Step 1: Add Splash import**

In `fridgesnap/src/App.tsx`, add this import alongside the other screen imports (after `import { Onboarding } from './screens/Onboarding'`):

```tsx
import { Splash } from './screens/Splash'
```

- [ ] **Step 2: Update the Routes block**

In `fridgesnap/src/App.tsx`, replace the existing `<Routes location={location} key={location.pathname}>` block. Find this block:

```tsx
<Routes location={location} key={location.pathname}>
  <Route path="/" element={<PageTransition><Onboarding /></PageTransition>} />
  <Route path="/home" element={<PageTransition><Home /></PageTransition>} />
  <Route path="/saved" element={<PageTransition><Saved /></PageTransition>} />
  <Route path="/profile" element={<PageTransition><Profile /></PageTransition>} />
  <Route path="/settings" element={<PageTransition><Settings /></PageTransition>} />
  <Route path="/scan/fridge" element={<PageTransition><ScanFridge /></PageTransition>} />
  <Route path="/scan/pantry" element={<PageTransition><ScanPantry /></PageTransition>} />
  <Route path="/scan/processing" element={<PageTransition><ScanProcessing /></PageTransition>} />
  <Route path="/scan/meal-time" element={<PageTransition><MealTimeSelector /></PageTransition>} />
  <Route path="/results" element={<PageTransition><Results /></PageTransition>} />
  <Route path="/recipe/:id" element={<PageTransition><RecipeDetail /></PageTransition>} />
  <Route path="/paywall" element={<Paywall />} />
  <Route path="*" element={<Navigate to="/" replace />} />
</Routes>
```

Replace it with:

```tsx
<Routes location={location} key={location.pathname}>
  <Route path="/" element={<Splash />} />
  <Route path="/onboarding" element={<PageTransition><Onboarding /></PageTransition>} />
  <Route path="/home" element={<PageTransition><Home /></PageTransition>} />
  <Route path="/saved" element={<PageTransition><Saved /></PageTransition>} />
  <Route path="/profile" element={<PageTransition><Profile /></PageTransition>} />
  <Route path="/settings" element={<PageTransition><Settings /></PageTransition>} />
  <Route path="/scan/fridge" element={<PageTransition><ScanFridge /></PageTransition>} />
  <Route path="/scan/pantry" element={<PageTransition><ScanPantry /></PageTransition>} />
  <Route path="/scan/processing" element={<PageTransition><ScanProcessing /></PageTransition>} />
  <Route path="/scan/meal-time" element={<PageTransition><MealTimeSelector /></PageTransition>} />
  <Route path="/results" element={<PageTransition><Results /></PageTransition>} />
  <Route path="/recipe/:id" element={<PageTransition><RecipeDetail /></PageTransition>} />
  <Route path="/paywall" element={<Paywall />} />
  <Route path="*" element={<Navigate to="/" replace />} />
</Routes>
```

Two changes:
1. The `/` route now renders `<Splash />` directly (no `PageTransition` wrapper — Splash has its own animation)
2. New `/onboarding` route renders `<PageTransition><Onboarding /></PageTransition>` (the previous `/` content)

The `*` wildcard still redirects to `/`, so unknown URLs flash through Splash → Onboarding.

- [ ] **Step 2.5: Audit other code for hard-coded `/` navigation that meant Onboarding**

The Onboarding screen has moved from `/` to `/onboarding`. Any code that previously navigated to `/` expecting to land on Onboarding must now navigate to `/onboarding`. Check:

```bash
grep -rn "navigate('/')" fridgesnap/src/
grep -rn 'navigate("/")' fridgesnap/src/
grep -rn "to=['\"]/['\"]" fridgesnap/src/
```

For each match, evaluate intent:
- If the call was sending the user back to the start of the app (Onboarding), update to `/onboarding`.
- If the call was meant to land on the home screen post-onboarding, leave as-is (it now goes through Splash → Onboarding, which may be wrong intent — flag in commit message if you change behavior).
- The `<Navigate to="/" replace />` wildcard fallback in App.tsx itself stays as-is — unknown URLs going through Splash is acceptable.

If there are no matches, that's fine — proceed.

- [ ] **Step 3: Verify TypeScript compiles**

Run from `fridgesnap/`:

```bash
npx tsc -b --noEmit
```

Expected: no errors.

- [ ] **Step 4: Verify ESLint passes**

Run from `fridgesnap/`:

```bash
npm run lint
```

Expected: no new errors.

- [ ] **Step 5: Verify build succeeds**

Run from `fridgesnap/`:

```bash
npm run build
```

Expected: successful build, no errors.

- [ ] **Step 6: Commit**

```bash
git add fridgesnap/src/App.tsx
git commit -m "feat: route Splash at / and move Onboarding to /onboarding"
```

If Step 2.5 produced changes to other files, include them in this commit:

```bash
git add fridgesnap/src/App.tsx <other-files-changed-in-step-2.5>
git commit -m "feat: route Splash at / and move Onboarding to /onboarding"
```

---

## Task 3: Add PNG favicon to index.html

**Files:**
- Modify: `fridgesnap/index.html`

- [ ] **Step 1: Update the favicon link tags**

In `fridgesnap/index.html`, find this line:

```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
```

Replace it with these three lines:

```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="icon" type="image/png" href="/logo.png" />
<link rel="apple-touch-icon" href="/logo.png" />
```

The SVG stays first (browsers prefer SVG when supported); PNG is a fallback for browsers without SVG favicon support and for the iOS home-screen icon via `apple-touch-icon`.

- [ ] **Step 2: Verify build succeeds**

Run from `fridgesnap/`:

```bash
npm run build
```

Expected: successful build. The PNG link to `/logo.png` resolves at build time because the file exists in `public/`.

- [ ] **Step 3: Commit**

```bash
git add fridgesnap/index.html
git commit -m "feat: add PNG favicon and apple-touch-icon"
```

---

## Task 4: Manual browser verification

**Files:** none

This task confirms the splash visually behaves correctly. No code changes — only verification of the prior tasks. Do NOT skip this step; visual correctness is the success criterion of the feature.

- [ ] **Step 1: Start the dev server**

Run from `fridgesnap/`:

```bash
npm run dev
```

Open the URL printed by Vite (typically `http://localhost:5173`).

- [ ] **Step 2: Verify splash appears at `/`**

- Splash should appear immediately on page load.
- Background is a dark gradient — slightly blue at the top, near-black at the bottom.
- A white rounded square (~128px) is centered, containing the FridgeSnap logo (black fridge with viewfinder corners).
- The white card slides up slightly and fades in over ~0.7s.

- [ ] **Step 3: Verify auto-navigation to Onboarding**

- After ~1.8s, the splash exits (fades out + slight scale-down) and the Onboarding screen appears.
- The browser URL changes to `/onboarding`.

- [ ] **Step 4: Verify back button**

- After landing on `/onboarding`, press the browser back button.
- It should NOT return to the splash (because `replace: true` was used). Instead, it goes to whatever page was before `/` in browser history (or no-op if splash was the first page).

- [ ] **Step 5: Verify favicon**

- Look at the browser tab — the favicon should display the FridgeSnap logo (browsers supporting SVG show `/favicon.svg`, others show `/logo.png`).

- [ ] **Step 6: Verify wildcard redirect**

- Visit `http://localhost:5173/some-bogus-url`.
- It should redirect through `/` (splash flashes briefly), then auto-navigate to `/onboarding`.

- [ ] **Step 7: Stop the dev server**

Press `Ctrl+C` in the terminal running `npm run dev`.

---

## Self-review checklist (run before declaring done)

- All four tasks committed individually
- `npm run build` succeeds
- `npm run lint` passes
- Manual verification (Task 4) all six steps confirmed
- No remaining references to `/` that were intended to mean Onboarding (Task 2 Step 2.5)
