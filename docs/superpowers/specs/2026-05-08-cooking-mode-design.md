# Cooking Mode — Design Spec

**Date:** 2026-05-08
**Status:** Approved (brainstorm phase complete)
**Owner:** Rudolfs

## Overview

Add an immersive, fullscreen cooking experience that activates when the user taps **Start cooking** on a `RecipeDetail` screen. Today the button shows a placeholder alert. The new flow takes the user through the recipe step-by-step with auto-detected timers, swipe navigation, and finishes with a photo + rating capture that lands in a new **Cooked** tab inside the existing `Saved` screen.

The aesthetic continues the app's premium glass-morphism look, but each cooking session is themed by the recipe's own hero image (heavily blurred + dark overlay) so every dish feels distinct.

## User Flow

1. User opens `RecipeDetail` and taps **Start cooking**.
2. App navigates to `/recipe/:id/cook`. The route mounts `CookingMode`, which animates the recipe hero image into a fullscreen blurred background.
3. `CookingStep` shows step 1 of N: large step number, text, optional timer button (when the parser detects a duration in the text).
4. User taps the timer button → `TimerSheet` opens to confirm/adjust minutes → tap **Start** → timer becomes a `TimerChip` floating top-right. Multiple timers can run in parallel.
5. User swipes (or taps a "Next" arrow) to step 2. Active timers persist across step changes and across leaving the cooking screen.
6. When a timer ends, the user gets a vibration + an in-app toast and an optional system notification (if permission previously granted).
7. After completing the last step (swipe forward past N), `CompletionFlow` takes over: short confetti + "You did it" message → camera capture → 1–5 star rating + optional note → **Save** button.
8. Save persists a `CookedEntry` to `localStorage`, then navigates back to `RecipeDetail` with an achievement toast.
9. Cooked entries appear in the `Saved` screen under a new **Cooked** tab.

## Architecture

The cooking session is a separate route, not a modal, because:
- Browser back button should work intuitively (`/cook` → back → `RecipeDetail`).
- Active timers need to survive navigation. They live in a top-level `CookingProvider` mounted in `App.tsx` so timers continue running even if the user navigates back to the recipe or to home.
- Future: a "minimised cooking" indicator on other screens (out of scope for v1) becomes trivial when timers live above the route boundary.

```
App
├── CookingProvider              (timers + completion handler at top level)
└── Routes
    ├── /recipe/:id              RecipeDetail
    ├── /recipe/:id/cook         CookingMode
    └── /saved                   Saved (now with Saved | Cooked tabs)
```

### State boundaries

| State                         | Owner                  | Lifetime                                     |
|-------------------------------|------------------------|----------------------------------------------|
| Active timers (id, end, label, recipeId, stepIdx) | `CookingContext` | App session — clears on page reload          |
| Current step index            | `CookingMode` local    | Cooking screen mount only                    |
| Captured photo + rating draft | `CompletionFlow` local | Until saved or discarded                     |
| Cooked entries                | `localStorage`         | Persistent until cleared                     |

## Components

| Component                          | Responsibility                                                                        |
|------------------------------------|---------------------------------------------------------------------------------------|
| `CookingMode.tsx`                  | Fullscreen route. Loads recipe, manages step index, renders `CookingStep` + `TimerChip`. |
| `CookingStep.tsx`                  | Single-step view: step number, text, parsed timer affordance. Receives swipe gestures. |
| `TimerChip.tsx`                    | Floating chip showing active timer count + countdown. Click → opens `TimersDrawer`.   |
| `TimersDrawer.tsx`                 | Bottom sheet listing all active timers with cancel buttons.                           |
| `TimerSheet.tsx`                   | Modal to confirm/adjust minutes before starting a timer.                              |
| `CompletionFlow.tsx`               | Multi-step modal: confetti → camera → rating → save.                                  |
| `CookingContext.tsx`               | Provider exposing `{ timers, startTimer, cancelTimer, saveCookedEntry }`.             |
| `cookingTimerParser.ts`            | Pure function: `(stepText: string) => { minutes: number; label: string } \| null`.    |
| `cookbookStorage.ts`               | `localStorage` CRUD: `getCookedEntries()`, `addCookedEntry(entry)`, `removeCookedEntry(id)`. |
| `CookedRecipeCard.tsx`             | Card used in the Cooked tab showing photo, recipe title, rating stars, date.          |
| `Saved.tsx` (rewritten)            | Two-tab layout: Saved | Cooked.                                                       |

## Data Model

```ts
// types/index.ts additions

export interface ActiveTimer {
  id: string                  // crypto.randomUUID()
  recipeId: string
  stepIdx: number
  label: string               // e.g. "Simmer onions"
  startedAt: number           // Date.now()
  endsAt: number              // Date.now() + minutes*60_000
  durationMinutes: number
}

export type Rating = 1 | 2 | 3 | 4 | 5

export interface CookedEntry {
  id: string                  // crypto.randomUUID()
  recipeId: string
  recipeTitle: string         // denormalized so the card renders if recipe later removed
  photoDataURL: string        // base64 PNG/JPEG from canvas
  rating: Rating
  note?: string
  cookedAt: string            // new Date().toISOString()
}
```

`localStorage` key: `fridgesnap.cookbook.v1`. Value is a JSON array of `CookedEntry`. New entries are prepended so the Cooked tab is reverse-chronological without re-sorting.

## Timer Parser

Pure, side-effect-free function in `src/utils/cookingTimerParser.ts`. Heuristics, ordered by specificity:

1. **Range pickup** (use higher end so timer reflects worst case): `/(\d+)\s*(?:to|-|–)\s*(\d+)\s*(min|minutes|hr|hours?)/i`.
2. **Explicit duration**: `/(\d+)\s*(min|minutes|hr|hours?)/i`.
3. **Hour conversion**: `hr|hour|hours` → `n * 60`.
4. **Label** is the first verb-phrase in the step (`simmer`, `bake`, `roast`, `fry`, `boil`, `steam`, `cook`, `rest`, `chill`); fall back to the literal duration ("10 min").

Returns `null` when no number-duration is found. The component renders no timer button in that case. There is no NLP or LLM call in v1 — pure regex.

Examples:
- `"Simmer the sauce for 10 minutes."` → `{ minutes: 10, label: "Simmer" }`
- `"Bake at 200°C for 25–30 min."` → `{ minutes: 30, label: "Bake" }`
- `"Chop the onion finely."` → `null`

## Photo Capture

Use a hidden `<input type="file" accept="image/*" capture="environment">` triggered by a styled button. This is the most reliable cross-browser path on iOS Safari and Android Chrome and avoids permissions complexity of `getUserMedia`. The selected file is read with `FileReader.readAsDataURL` and stored as base64.

Image resizing: before saving, draw to an offscreen `<canvas>` at max 1080px on the long edge, JPEG quality 0.85, to keep `localStorage` payload under ~200 KB per entry.

If the user declines / cancels camera, the **Save** button is disabled until they pick a photo. There is no "skip photo" path in v1 — the photo is the journal's anchor.

## Routing

`src/App.tsx` already uses React Router. Add:

```tsx
<Route path="/recipe/:id/cook" element={<CookingMode />} />
```

The `Start cooking` button in `RecipeDetail.tsx:329` changes from `window.alert(...)` to `navigate(\`/recipe/\${recipe.id}/cook\`)`.

## Saved Screen Rewrite

`Saved.tsx` is currently a placeholder. Rewrite as:

- Tab strip at top with two tabs: **Saved**, **Cooked** (animated underline using `LayoutGroup`/`layoutId` like the Paywall pricing ring).
- **Saved** tab keeps the existing empty-state copy but pluralised — bookmarked recipes still aren't implemented (out of scope for this spec).
- **Cooked** tab reads `getCookedEntries()` and renders a vertical list of `CookedRecipeCard`s. Empty state: "No cooked recipes yet — finish your first dish to see it here."

## Notifications

When a timer fires:
1. Always: in-app toast + `navigator.vibrate?.([200, 100, 200])` if available.
2. If `Notification.permission === 'granted'`: fire a system notification.
3. Permission is requested lazily — the **first** time a user starts a timer, show an inline prompt: "Allow notifications so timers reach you outside the app?" Yes → call `Notification.requestPermission()`. No → never re-ask in v1.

Browsers without notification support degrade silently to the in-app toast.

## Error Handling & Edge Cases

| Scenario                                   | Behaviour                                                                                  |
|--------------------------------------------|--------------------------------------------------------------------------------------------|
| User reloads page while timers running     | Timers are lost (in-memory only). Acceptable for v1.                                       |
| User navigates back from `/cook` mid-flow  | Timers continue (live in `CookingProvider`). Step progress is lost on remount — acceptable.|
| `localStorage` quota exceeded              | Catch the `QuotaExceededError` on save → show error toast "Cookbook full, free up space." |
| Recipe id in URL doesn't exist             | Reuse `RecipeDetail`'s `NotFound` component on `CookingMode`.                              |
| User cancels timer permission prompt       | Continue without notifications. Timers still vibrate + toast.                              |
| User backgrounds the tab while timer runs  | `setTimeout` may be throttled; the on-fire toast still appears when tab regains focus.     |

## Out of Scope (v1)

- Voice commands ("next step", "set timer") — Web Speech API support is patchy.
- AI photo verification at each step.
- Share-to-social from completion screen.
- Streak / achievement system beyond a single completion toast.
- Auto-update shopping list from used ingredients.
- Persisting timers across page reloads.
- Bookmark functionality for the Saved tab itself.

## Acceptance Criteria

1. Tapping **Start cooking** in `RecipeDetail` navigates to a fullscreen cooking screen with the recipe hero as a blurred backdrop.
2. Each step is shown one at a time. The user can swipe or tap arrows to move forward/backward.
3. Steps containing detectable durations show a timer button preset to the parsed minutes; tapping it opens a sheet to confirm/adjust, then starts a background timer.
4. Multiple timers can run simultaneously; a chip shows count and the soonest ending one. Tapping the chip opens a list with cancel buttons.
5. After the last step, the completion flow runs: confetti → photo capture → 1–5 star rating + optional note → save.
6. Saved entries appear in the new **Cooked** tab inside the `Saved` screen, newest first, each card showing photo, title, rating, and relative date.
7. The flow works on mobile Safari and Chrome at viewport widths 360–430 px without horizontal scroll or clipping.
