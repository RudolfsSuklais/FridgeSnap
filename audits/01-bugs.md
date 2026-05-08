# Bug Audit — 2026-05-08

**Scope:** Read-only review of `fridgesnap/src/**` (App, screens, contexts, hooks, components). No fixes applied.

## Summary
- P0 bugs: 4
- P1 bugs: 8
- P2 bugs: 7

## P0 — Demo blockers

### Bug #1: Browser back from RecipeDetail wipes swipe progress on Results
**File:** [src/screens/Results.tsx:51](fridgesnap/src/screens/Results.tsx#L51)
**Trigger:** On `/results`, swipe a few cards, tap the info button (or tap the card) to open `/recipe/:id`, then press the browser/system back button.
**Symptom:** Results re-mounts. Because `pile` is local `useState(INITIAL_PILE)` and `INITIAL_PILE = recipes.slice(0, 5)` is module-level, the stack resets to all 5 cards as if the user never swiped. Saved/skipped actions in `actions` are also wiped.
**Root cause:** Swipe state isn't lifted into ScanContext or persisted across re-mounts. React Router unmounts Results when navigating to RecipeDetail and re-mounts it on back.
**Suggested fix scope:** Single file. Either lift `pile`/`actions` into ScanContext, or persist them via session storage. Simplest hackathon fix: hoist into context.

### Bug #2: Image loading has no fallback — every recipe card breaks if Unsplash 404s or CDN is slow
**File:** [src/data/mockData.ts:3-4](fridgesnap/src/data/mockData.ts#L3-L4), used by [Home.tsx:329](fridgesnap/src/screens/Home.tsx#L329), [RecipeDetail.tsx:137](fridgesnap/src/screens/RecipeDetail.tsx#L137), [SwipeCard.tsx:126](fridgesnap/src/components/swipe/SwipeCard.tsx#L126)
**Trigger:** Demo wifi flakiness, an Unsplash photo deletion, or a CDN region issue.
**Symptom:** Broken-image icons across Home recently-viewed strip, every swipe card hero, and the parallax recipe-detail hero. Nothing visually recovers — the broken icon stays for the whole demo.
**Root cause:** `<img src={...}>` with no `onError` handler, no skeleton, no local fallback. URLs depend entirely on `images.unsplash.com` being reachable.
**Suggested fix scope:** Multi-file. Add a shared `<RecipeImage>` wrapper with `onError` that falls back to a tinted gradient placeholder (or local data URI), or pre-bundle a few images for the demo.

### Bug #3: Heart-spam in RecipeDetail produces duplicate React keys
**File:** [src/screens/RecipeDetail.tsx:93-103](fridgesnap/src/screens/RecipeDetail.tsx#L93-L103)
**Trigger:** Tap the heart icon twice within the same millisecond, or any two clicks tight enough that `Date.now()` returns the same value.
**Symptom:** `now + i` for `i ∈ [0..5]` collides with the previous batch's IDs → duplicate `key` on `<motion.span key={p.id}>` inside `<AnimatePresence>`. React logs a key warning; particles can fail to mount/unmount cleanly; some hearts may not render at all.
**Root cause:** ID generation uses millisecond resolution + small index, plus `liked` toggles spawn fresh arrays without coordinating IDs.
**Suggested fix scope:** Single file. Replace ID with a monotonic counter (`useRef(0)`) or `crypto.randomUUID()`.

### Bug #4: Paywall close button can land on top of/under the iOS Dynamic Island
**File:** [src/screens/Paywall.tsx:106-113](fridgesnap/src/screens/Paywall.tsx#L106-L113), interacts with [src/components/layout/DynamicIsland.tsx:5](fridgesnap/src/components/layout/DynamicIsland.tsx#L5)
**Trigger:** Open Paywall on any device. The close X is at `top-12` (48px) and the simulated Dynamic Island is at `top-2.5` extending to ~44px, with `z-40`. The close button is `z-30`.
**Symptom:** Close X sits flush against the Dynamic Island, partially obscured by it on smaller phone-frame breakpoints. Worse: every other screen routes its close/back at top-14 px and uses the same z-stack — but Paywall is the only one that could be tapped at the top-left where the Island has visual weight. Judges may notice the visual collision and a tap that misses the X has no other escape because Paywall is a non-routed full-screen overlay.
**Root cause:** Paywall's z-30 close button sits below `DynamicIsland`'s z-40 black pill. On the desktop phone-frame the Island is purely cosmetic, but the X is visually hugging it.
**Suggested fix scope:** Single file. Bump the Paywall close button to `z-50`, or move it to `top-14` to sit clearly below the Island.

## P1 — Visible glitches

### Bug #5: GlassNavBar `layoutId="navBarPill"` animation never fires across screens
**File:** [src/components/ui/GlassNavBar.tsx:55](fridgesnap/src/components/ui/GlassNavBar.tsx#L55)
**Trigger:** Tap any bottom-nav item (Home → Saved, Saved → Profile, etc.).
**Symptom:** The active "pill" indicator appears to jump rather than slide. The `layoutId` is intended for shared-element animation but each screen mounts its own `GlassNavBar` instance and they're inside different `PageTransition` wrappers (see [App.tsx:42-56](fridgesnap/src/App.tsx#L42-L56)) that re-key on `location.pathname`. Framer Motion can't connect the two pills.
**Root cause:** GlassNavBar lives inside each route component. The layoutId only animates within a single `<LayoutGroup>` / sibling tree — but the old pill's parent unmounts before the new pill renders.
**Suggested fix scope:** Multi-file. Either hoist `GlassNavBar` into App (outside `AnimatedRoutes`) so a single instance persists across nav, or accept the snap and remove the `layoutId`.

### Bug #6: Swipe stack — Save/Skip buttons can double-fire on the same card during fly-off
**File:** [src/screens/Results.tsx:72-73](fridgesnap/src/screens/Results.tsx#L72-L73), [src/components/swipe/SwipeCard.tsx:54-69](fridgesnap/src/components/swipe/SwipeCard.tsx#L54-L69)
**Trigger:** Tap the Save (or Skip) action button rapidly, twice within ~600ms. The first tap kicks `animate(x, FLY_OFF_DISTANCE).onComplete → onSwipe('right')`. The second tap arrives before `onComplete` fires.
**Symptom:** Two animations on the same `x` motion value; both register `onComplete` callbacks; `onSwipe` fires twice for the same recipe; first fires removes it from `pile`, second is a no-op (filter idempotent), but progress dots can jump and `actions[recipe.id]` is set twice.
**Root cause:** No "in-flight" guard inside `triggerSwipe`. The imperative API doesn't track whether an animation is already running.
**Suggested fix scope:** Single file. Add a `isAnimatingRef` inside `SwipeCard` and bail out of `triggerSwipe` if already animating.

### Bug #7: ScanPantry doesn't reset scan state on entry
**File:** [src/screens/ScanPantry.tsx:21-32](fridgesnap/src/screens/ScanPantry.tsx#L21-L32)
**Trigger:** Refresh the page on `/scan/pantry`, or navigate to `/scan/pantry` directly.
**Symptom:** ScanFridge calls `reset()` on mount; ScanPantry does not. If user refreshes mid-pantry-scan, ScanContext is empty (because state is in-memory) but the UX assumes fridge already scanned. After pantry scan completes, Results gets only pantry items. ScanFridge → ScanPantry → browser-back → ScanFridge resets, dumping pantry items the user already captured.
**Root cause:** Asymmetric reset behavior — fridge resets on mount, pantry assumes fridge has already populated context. Browser back makes ScanFridge reset everything.
**Suggested fix scope:** Single file. Either add a sentinel in context (e.g. `fridgeScanned: boolean`) and gate the reset, or only reset when entering from outside the scan flow (check `location.state`).

### Bug #8: ScanProcessing never resets `textIdx` if effect re-runs
**File:** [src/screens/ScanProcessing.tsx:21-32](fridgesnap/src/screens/ScanProcessing.tsx#L21-L32)
**Trigger:** In dev `<StrictMode>` (see [main.tsx:7](fridgesnap/src/main.tsx#L7)), the mount → cleanup → mount cycle runs the effect twice. First mount kicks the interval & timer; cleanup clears them; second mount starts fresh. State `textIdx` is preserved across StrictMode unmount-remount in dev only — but the timeline starts over, so the navigate call eventually fires correctly.
**Symptom (prod):** None in production builds. **Symptom (dev demo):** The status text might flicker once on first render. If the demo is shown from `npm run dev` the judges may briefly see a doubled animation.
**Root cause:** Acceptable React 18 StrictMode behavior, but worth flagging because `setTimeout(navigate, NAVIGATE_DELAY)` in dev is invoked, then cleared, then re-armed — total time to reach Results might be slightly off.
**Suggested fix scope:** None needed for prod build. If demoing from dev, ensure StrictMode is disabled or that `npm run build && npm run preview` is used.

### Bug #9: Home `pt-12` puts greeting almost flush with Dynamic Island
**File:** [src/screens/Home.tsx:82](fridgesnap/src/screens/Home.tsx#L82)
**Trigger:** Render Home on the standard 375×812 phone frame.
**Symptom:** Status bar is `h-11` (44px); Dynamic Island bottom edge is at ~44px; Home content starts at `pt-12` (48px). The greeting H1 sits 4px below the Island. Tight, but visually crowded — looks unfinished compared to ScanFridge / Results which use `pt-14`.
**Root cause:** Inconsistent top spacing across screens (Home uses `pt-12`, others use `pt-14`/`pt-16`).
**Suggested fix scope:** Single file. Change Home's wrapper to `pt-14`.

### Bug #10: Onboarding drag panel ignores first-frame width
**File:** [src/screens/Onboarding.tsx:48-60, 91-105](fridgesnap/src/screens/Onboarding.tsx#L48-L60)
**Trigger:** User starts dragging the very first slide before the layout effect has run (rare, but possible on a slow device).
**Symptom:** `width = 0` on first paint until the resize effect synchronously syncs it. `dragConstraints={{ left: -last * width, right: 0 }}` becomes `{ left: 0, right: 0 }`, so the first drag does nothing. `animate={{ x: -index * width }}` is 0, so slides stack at `x=0`. Side-by-side strip shows only first slide until JS measures.
**Root cause:** Width is initialized to 0 and updated in `useEffect` (post-paint). On first paint there's a 1-frame visual mismatch between `style={{ width: width || '100%' }}` (fallback) and the math that depends on `width=0`.
**Suggested fix scope:** Single file. Use `useLayoutEffect` instead of `useEffect`, or measure synchronously via `useRef` callback.

### Bug #11: useScanCapture's `start` rotates status texts even after completing
**File:** [src/hooks/useScanCapture.ts:57-64](fridgesnap/src/hooks/useScanCapture.ts#L57-L64)
**Trigger:** Inspect the timer schedule. `STATUS_TEXTS` arrays in ScanFridge/ScanPantry have 3 entries. The hook spawns timers at 200ms (text 0), 800ms (text 1), 1400ms (text 2), success at 1700ms, complete at 2000ms.
**Symptom:** Text 2 fires at 1400ms but the success state (which hides the status text via `isScanning` flag in Viewfinder line 147) takes over at 1700ms. So text 2 is visible for ~300ms only — judges may not finish reading it.
**Root cause:** Timing budget is too tight: 600ms per status text but the success state is at 1700ms and there are 3 texts at 200/800/1400ms. The third text gets only 300ms before being hidden.
**Suggested fix scope:** Single file. Either reduce STATUS_TEXTS to 2 entries, lengthen the scan window to 2300–2500ms, or shorten interval.

### Bug #12: Paywall uses `bg-white/8` which is non-standard Tailwind opacity
**File:** [src/screens/Paywall.tsx:441](fridgesnap/src/screens/Paywall.tsx#L441)
**Trigger:** Render the non-popular monthly card.
**Symptom:** Tailwind 3 JIT supports arbitrary opacities, so `bg-white/8` works — but it's nonstandard (Tailwind ships 0/5/10/20/...). Risk only if the build pipeline disables JIT or strips arbitrary values; in that case the monthly card would render with no background. **Verify in prod build** before assuming it's OK.
**Root cause:** Inconsistent opacity step (8 vs 15) — likely a typo for `/10`.
**Suggested fix scope:** Single file. Change to `bg-white/10` to be safe.

## P2 — Edge cases

### Bug #13: Status bar updates only every 30s (worst case 30s stale)
**File:** [src/components/layout/StatusBar.tsx:20-23](fridgesnap/src/components/layout/StatusBar.tsx#L20-L23)
**Trigger:** Any minute boundary during a 5-min demo.
**Symptom:** Time displayed could be up to 30s behind. On a 5-min demo a judge probably won't notice, but it's nondeterministic — at minute change there's a brief lag.
**Suggested fix scope:** Acceptable. Lower the interval to 1s if you care.

### Bug #14: `topCardRef` can fire on a stale handle during card exit animation
**File:** [src/screens/Results.tsx:53, 116-118](fridgesnap/src/screens/Results.tsx#L53)
**Trigger:** `mode="popLayout"` keeps the exiting card mounted while the next card mounts. During the brief overlap, `topCardRef` is still pointing at the exiting card (it's no longer in `visible.map` so the ref reattaches to the new top, but the previous card may still be in DOM via AnimatePresence).
**Symptom:** Edge cases only — primarily if a user fires the action button at the exact moment a card is exiting. See also Bug #6.
**Suggested fix scope:** Same as #6.

### Bug #15: `Results.tsx` empty-state has 200ms delay → blank stack flash
**File:** [src/screens/Results.tsx:255-256](fridgesnap/src/screens/Results.tsx#L255-L256)
**Trigger:** Swipe the last card.
**Symptom:** The empty `<EmptyState>` `motion.div` has `delay: 0.2` on its initial spring. Between the card flying off-screen and the empty state animating in, the stack area shows for ~200ms with nothing in it. Subtle but visible.
**Suggested fix scope:** Single file. Drop the delay or reduce to ~50ms.

### Bug #16: Refresh on `/recipe/:id` works but has no header offset / breadcrumb
**File:** [src/screens/RecipeDetail.tsx:33-41](fridgesnap/src/screens/RecipeDetail.tsx#L33-L41)
**Trigger:** Refresh on a recipe detail page.
**Symptom:** Renders fine — recipe is found from URL. `useScan()` returns empty items, so the "matched" badge shows the precomputed `matchedIngredients` fallback. Works, but the user has no way to navigate "back" except `navigate(-1)` which takes them out of the SPA history (probably to `/` since there's no in-app history). For a hackathon demo this is fine but worth knowing.
**Suggested fix scope:** Acceptable for hackathon.

### Bug #17: ScanContext deduplication is case-insensitive but not whitespace-trimming
**File:** [src/contexts/ScanContext.tsx:22-34](fridgesnap/src/contexts/ScanContext.tsx#L22-L34)
**Trigger:** N/A in current code path because mockData has clean names. Future-proofing concern only.
**Symptom:** Items differing only in trailing whitespace would dedupe incorrectly.
**Suggested fix scope:** Acceptable.

### Bug #18: `RECENT = recipes.slice(0, 5)` overlaps with `INITIAL_PILE = recipes.slice(0, 5)`
**File:** [src/screens/Home.tsx:32](fridgesnap/src/screens/Home.tsx#L32) vs [src/screens/Results.tsx:24](fridgesnap/src/screens/Results.tsx#L24)
**Trigger:** Visit Home, see "Recently viewed" cards r1–r5; then scan; on Results, the same r1–r5 appear as the swipe stack.
**Symptom:** Aesthetically odd — the "recently viewed" cards on Home are exactly the recipes the user is about to be shown to swipe. Judges may notice "wait, those are the same."
**Suggested fix scope:** Single file. Use `recipes.slice(5, 10)` for `RECENT` so the swipe stack feels novel.

### Bug #19: Tailwind `divide-ink-100` requires custom-color divide variant
**File:** [src/screens/RecipeDetail.tsx:220](fridgesnap/src/screens/RecipeDetail.tsx#L220)
**Trigger:** Render the cook-time / difficulty / calories info bar.
**Symptom:** `divide-ink-100` should work because `ink.100` is in the Tailwind config. Tailwind 3 generates divide-color utilities for custom colors. Verify on first run in case the JIT misses it; would render without dividers if so.
**Suggested fix scope:** None — verify visually.

### Bug #20: `Particle` ID type collides at very long sessions (impractical, P3)
**File:** [src/screens/RecipeDetail.tsx:94](fridgesnap/src/screens/RecipeDetail.tsx#L94)
**Trigger:** Won't happen in 5-min demo.
**Symptom:** N/A.
**Suggested fix scope:** Skip.

## Notes / things checked but found OK

- **Routing:** Catch-all `*` redirects to `/` — no 404. Paywall's lack of `<PageTransition>` wrapper is intentional (it has its own slide-up).
- **`vercel.json`:** Single-rewrite SPA fallback is correctly configured for refresh-on-subroute.
- **`useScanCapture` cleanup:** Timers are correctly cleared on unmount and re-clear on re-entry. `start()` is guarded by `if (phase !== 'idle') return` so double-tap during scanning is safe.
- **`ScanProcessing` cleanup:** `clearInterval`/`clearTimeout` correctly returned from effect.
- **`Viewfinder` `animate(scanProgress, ...)` cleanup:** `controls.stop()` is correctly returned from the effect.
- **`Onboarding` resize listener:** Cleaned up in effect return.
- **`StatusBar` interval:** Cleaned up in effect return.
- **`PhoneFrame` matchMedia:** Listener correctly removed on unmount.
- **`useScan()` outside provider:** Throws explicit error message, won't crash silently.
- **No `console.log` / `console.warn` left in code.**
- **No `: any` / `as any` casts.**
- **No `useState(props.x)` antipatterns.**
- **All `.map()` list renders have `key` props.**
- **`<input type="file">` cancel handled correctly** — `e.target.files.length > 0` gate, `e.target.value = ''` resets.
- **`useScanCapture` early return on phase !== 'idle'** correctly prevents re-entry from rapid double-taps; `disabled={phase !== 'idle'}` on the button is a belt-and-suspenders.
- **`useScroll({ container: scrollRef })` in RecipeDetail:** Correct usage; works after first paint.
- **`<LayoutGroup>` in Paywall pricing:** Correctly wraps both PlanCards so the layoutId ring transitions.

## Needs device testing (not findable from code review)

- iOS Safari `backdrop-filter: blur(...)` rendering — used heavily across `glass-light`/`glass-dark` and `backdrop-blur-*` utilities. Older iOS may fall back to no blur (still readable since `bg-white/55` etc. provide opacity).
- Touch-target sizes — `RegularTab` is `min-w-[44px]` plus padding. Small icon buttons (`h-7 w-7` servings, `h-10 w-10` back) should be ≥44px tap area; servings buttons at 28px are below the 44px iOS HIG minimum.
- Swipe velocity feel on real touchscreens (`SWIPE_VELOCITY = 500`).
- Spring-stiffness perception of card stack scale-up at depth transitions.
- Whether the 30s `setInterval` in StatusBar drifts noticeably during long demos.
