# Mobile fullscreen "app feel" — design

**Date**: 2026-05-08
**Status**: Approved, ready for implementation

## Problem

When the app is opened on a real phone (viewport ≤ 500px), the mockup phone chrome — `StatusBar` (fake clock, signal, battery icon) and `DynamicIsland` (fake notch pill) — renders on top of the device's real status bar and notch. The result is a doubled, overlapping look that breaks the illusion of a native app.

Additionally, content currently runs edge-to-edge with no respect for the device's safe areas, so on notched devices the top of each screen can sit under the real notch and the bottom can sit under the home indicator.

## Goal

On a real phone, the app should feel native: no fake chrome, no overlap with device UI, content respects safe areas.

On desktop the existing phone mockup (frame, fake status bar, fake island) is unchanged.

## Scope

In scope:
- Hide `StatusBar` and `DynamicIsland` on mobile viewports.
- Add safe-area padding (top + bottom) on mobile so content sits inside the device's safe area.
- Allow the page to draw under the notch via `viewport-fit=cover`.

Out of scope:
- Adding a PWA manifest, install prompts, or service worker.
- Adapting `StatusBar` `tone` per route (still hardcoded `"dark"` on desktop, same as today).
- Auditing every screen for safe-area-inset usage beyond the global PhoneFrame container.

## Design

The mockup chrome (`StatusBar`, `DynamicIsland`) belongs conceptually to the desktop phone mockup, not to the app itself. Today it lives in `App.tsx` as a sibling of the routed content, which leaks the mockup concern into the app shell. We move ownership into `PhoneFrame`, which already branches on mobile vs. desktop.

### Changes

**`index.html`**
- Add `viewport-fit=cover` to the viewport meta so the page can render under the notch and the safe-area-inset env vars become non-zero on iOS Safari.

  Before:
  ```html
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  ```
  After:
  ```html
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  ```

**`PhoneFrame.tsx`**
- Desktop branch: render `<StatusBar tone="dark" />` and `<DynamicIsland />` inside the rounded mockup, replacing the App.tsx siblings.
- Mobile branch: do not render mockup chrome. Apply `paddingTop: env(safe-area-inset-top)` and `paddingBottom: env(safe-area-inset-bottom)` on the fullscreen container.

**`App.tsx`**
- Remove `<StatusBar tone="dark" />` and `<DynamicIsland />` from the tree.
- Drop their imports.

### Why move ownership into PhoneFrame

PhoneFrame is the component whose job is "make this look like a phone on desktop." The fake clock and fake notch are part of that simulation. Keeping them in App.tsx forces the app shell to know which decorations are mockup-only — a leaky abstraction. Co-locating the mockup chrome with the mockup frame keeps the responsibility in one place and makes the mobile/desktop split a single decision rather than two parallel ones.

## Risks

- **Background color on mobile.** The mobile branch of PhoneFrame uses `bg-black`. With safe-area padding the safe-area gutters above/below the content will also be black. That matches the app's dark theme today; if a screen has a non-black gradient it may look like a black bar at the top. Acceptable for now — most screens are dark themed; can revisit by letting screens override the container bg if it becomes an issue.
- **Existing absolute-positioned elements.** Screens that use `top-0` or absolute positioning relative to the PhoneFrame will now be positioned inside the safe-area padding. This is the desired behavior on mobile (don't render under the notch), but worth a quick visual scan post-change. No code in screens references safe-area today, so the new padding is the single source of truth.
- **Desktop mockup unchanged.** Desktop continues to render fake chrome, so no regression there.

## Verification

Before claiming done:
- Open the app at desktop width and confirm the phone mockup, fake status bar, and fake island still render exactly as before.
- Resize to ≤500px (or open via DevTools mobile emulation with an iPhone preset that reports a notch) and confirm: no fake clock, no fake island, content has top + bottom padding equal to the device's safe areas.
- Spot-check Splash, Onboarding, Home, ScanFridge so no screen has its primary content cut off by the new padding.
