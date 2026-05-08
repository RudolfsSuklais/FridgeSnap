# 8-Scan Freemium Limit — Design

**Date:** 2026-05-08
**Status:** Approved (ready for implementation plan)

## Problem

Today the scan-limit UI in `fridgesnap/src/screens/Home.tsx` is driven by hardcoded
constants (`FREE_SCAN_LIMIT = 2`, `SCANS_USED = 1`, `IS_PRO = false`) that are not
wired to the actual scan flow. A user can navigate to `/scan/fridge` arbitrarily
many times — there is no enforcement. The Paywall hero text is also a hardcoded
string `"2 of 2 free scans used this week"`.

We want a real freemium limit: **a free user gets 8 scans total, then is required
to upgrade to Pro.** The count must persist across page reloads (this is a
demo/mock app, so localStorage is appropriate).

## Definitions

- **Scan** = one complete fridge → pantry flow. Reaching the `ScanProcessing`
  screen counts as 1 scan, regardless of whether the user captured pantry or
  used the "Skip pantry" button. Skipping pantry still counts as a scan because
  fridge was successfully captured and items were merged.
- **Quota** = `scanLimit = 8` (constant), `scansUsed` (persisted), and
  `scansRemaining = max(0, scanLimit - scansUsed)`.
- **Pro** = `isPro: boolean` (persisted). Pro users have no enforcement and the
  UI shows `∞` instead of `X/8`. This release does not implement an actual Pro
  upgrade flow — Paywall stays mock (alert-only).

## Architecture

### State lives in ScanContext

`fridgesnap/src/contexts/ScanContext.tsx` already owns all scan-related state
(`items`, `pile`, `actions`, `reset`) at App level. We extend it with quota
state. No new hooks or stores.

New fields exposed by `ScanContextValue`:

```ts
scansUsed: number      // persisted in localStorage
scanLimit: number      // constant 8
isPro: boolean         // persisted in localStorage
scansRemaining: number // derived: max(0, scanLimit - scansUsed)
incrementScan: () => void
setPro: (value: boolean) => void
```

Existing fields (`items`, `pile`, `actions`, `addItems`, `recordSwipe`,
`reset`) are unchanged. Importantly, `reset()` continues to mean "tear down
the current in-progress scan flow"; it does **not** touch `scansUsed` or
`isPro`. Lifetime quota and per-flow scratch state are orthogonal concerns.

### Persistence

- localStorage keys: `fridgesnap.scansUsed`, `fridgesnap.isPro`
- Lazy init: `useState` initializer reads from localStorage; on parse failure
  or missing key, fall back to `0` and `false` respectively, wrapped in
  `try/catch` so a corrupt entry never crashes the provider.
- Write-through: a `useEffect` on each value writes the new value back. We
  serialize with `String(...)` for the number and `JSON.stringify` for the
  boolean so a casual user can flip them in DevTools for demo purposes.

### When the counter increments

The counter is incremented in **`ScanProcessing.tsx` on mount**. To make this
the *single* increment site, the "Skip pantry" button on `ScanPantry.tsx` is
rerouted from `navigate('/results')` to `navigate('/scan/processing')`.
Processing already auto-navigates to `/results` after its animation, so the
user-visible difference is a brief processing screen — semantically correct
because we are still "processing" what we have, just without a pantry photo.

After this change, `/scan/processing` is reached on every successful flow and
*only* on a successful flow, making it an unambiguous increment point.

To guard against a re-mount or React StrictMode double-invoke causing a
double-increment, the call is gated by a `useRef<boolean>(false)` flag inside
the effect: increment runs once; subsequent runs are no-ops. The ref is
component-scoped, so a fresh navigation to `/scan/processing` from a new flow
gets a fresh ref and increments correctly.

### Where the limit is enforced

**Only on the Home screen "Scan now" hero CTA**, per user direction. Other
entry points (deep links into `/scan/fridge`, browser-history navigation) are
not blocked in this iteration. If a Pro-less user reaches `ScanProcessing`
with `scansUsed >= scanLimit` already, the increment still runs (count goes
to 9, 10, etc.) — that is acceptable for a demo and avoids surfacing
defensive logic where the UI guarantees never normally bring the user there.

UI changes on Home:

- Remove module-level `IS_PRO`, `FREE_SCAN_LIMIT`, `SCANS_USED` constants;
  read the equivalents from `useScan()`.
- Hero "Scan now" CTA:
  - When `isPro || scansRemaining > 0`: label is `"Scan now"`, navigates to
    `/scan/fridge`. Same as today.
  - When `!isPro && scansRemaining === 0`: label changes to
    `"Get Pro to keep scanning"`, the trailing arrow icon is replaced with
    `Crown`, and `onClick` navigates to `/paywall`.
- The "scans" stat pill keeps its existing behavior: shows `scansRemaining/scanLimit`
  (or `∞` for Pro), tappable to `/paywall` only when remaining is 0.
- The weekly reset countdown ("Free scans reset in Xd Xh") is **removed**.
  The new model is a lifetime quota (until upgrade), not a weekly refill, so
  a countdown is misleading. Replace it with a small static line:
  `{scansUsed} of {scanLimit} scans used` — only shown when `!isPro`.

UI changes on Paywall:

- Replace the literal `"2 of 2 free scans used this week"` text with a
  dynamic value: `{scansUsed} of {scanLimit} free scans used`. The "this
  week" wording is dropped to match the lifetime model.
- The `FEATURES[0].desc` string `"No more 2-per-week limit"` becomes
  `"No more 8-scan limit"`.
- The Paywall stays a mock — `handleStartTrial` continues to `window.alert`.
  We do **not** wire `setPro(true)` to the alert in this release; that is a
  separate decision (real Pro flow). If desired later, it's a one-line hook.

## File touch list

- `fridgesnap/src/contexts/ScanContext.tsx` — add quota state, persistence,
  `incrementScan`, `setPro`, expose new fields.
- `fridgesnap/src/screens/Home.tsx` — drop hardcoded constants, consume
  context, conditional CTA label/icon/destination, swap reset countdown for
  static "X of 8" line.
- `fridgesnap/src/screens/ScanProcessing.tsx` — call `incrementScan()` once
  on mount.
- `fridgesnap/src/screens/ScanPantry.tsx` — reroute "Skip pantry" button from
  `/results` to `/scan/processing` so the increment path stays single.
- `fridgesnap/src/screens/Paywall.tsx` — dynamic "X of 8" copy, update
  feature blurb.

No other files need changes. `ScanFridge.tsx`, `Results.tsx`, `useScanCapture.ts`,
and the data layer are untouched.

## Edge cases & decisions

- **Corrupt localStorage**: `try/catch` around the lazy-init parse; fall back
  to defaults. Don't try to "repair" — just overwrite on next write.
- **Refresh with `scansUsed >= scanLimit`**: Home renders the Pro-locked CTA
  immediately on first paint because the initial state is read synchronously
  from localStorage in the `useState` initializer (no flash of "Scan now"
  followed by "Get Pro").
- **Double increment from React StrictMode**: guarded by per-mount `useRef`
  inside `ScanProcessing`'s effect.
- **Multiple tabs**: not addressed. localStorage `storage` events would
  reconcile but we deliberately skip cross-tab sync — out of scope for a
  demo.
- **Dev/QA reset**: not in this release. Manually clearing `fridgesnap.scansUsed`
  in DevTools is the demo-time reset path. (Trivial to add a Settings dev
  toggle later if needed.)

## Out of scope

- Real Pro purchase / restore flow.
- Backend or auth.
- Cross-tab sync of quota state.
- Blocking deep-linked navigation into `/scan/fridge` once the quota is
  exhausted.
- Weekly quota refills (the prior UI hinted at this — explicitly removed).
- Settings screen "Restore Pro" or "Reset scans" buttons.

## Acceptance criteria

1. Fresh load (empty localStorage) on Home shows `8/8 scans` in the stat pill
   (or whatever the project's UI scaling decides — value matches
   `scansRemaining`) and "Scan now" CTA navigates to `/scan/fridge`.
2. Completing one full scan flow (Home → fridge → pantry → processing →
   results) increments `scansUsed` to 1 and persists across reload.
3. Skipping pantry also increments. With the rerouted Skip button (now goes
   through `/scan/processing`), the increment fires from `ScanProcessing`'s
   mount effect just as it does for the full flow.
4. After 8 successful flows, Home hero CTA reads "Get Pro to keep scanning"
   with a `Crown` icon and navigates to `/paywall` instead of `/scan/fridge`.
5. Paywall shows "8 of 8 free scans used" dynamically.
6. Setting `fridgesnap.isPro = "true"` in localStorage and reloading: stat
   pill shows `∞`, CTA always navigates to `/scan/fridge`, no static "X of 8"
   line, no enforcement.
