# FridgeSnap Splash Screen — Design Spec

**Date:** 2026-05-08
**Status:** Approved for implementation

## Goal

Add a branded startup loading screen that appears when the FridgeSnap app first opens, before the Onboarding flow. The splash screen should feel premium, modern, and reinforce brand identity with the FridgeSnap logo and a subtle entrance animation.

## User-Visible Behavior

1. User opens the app — splash screen appears immediately at `/`
2. Logo card slides up and fades in over ~0.7s
3. Logo holds visible for ~0.7s
4. Logo fades out (~0.4s)
5. App auto-navigates to `/onboarding` (replace, not push — splash is not in history)

**Total visible time:** ~1.8s, every time the app loads.

## Visual Design

**Background**

Dark vertical gradient: `linear-gradient(180deg, #0F1B2D 0%, #0B0C10 100%)` — blue (top) fading to near-black (bottom). Matches existing app `theme-color` (#0B0C10).

**Logo container**

iOS app icon style — a white rounded square card with the logo inside:

- Size: 128×128px
- Background: `#FFFFFF`
- Border radius: 28px (matches iOS app icon corner radius proportion)
- Subtle shadow: `0 20px 50px -10px rgba(0, 0, 0, 0.5)` for floating effect
- Logo image (`/logo.png`) inside, ~96×96px (so there's padding around the logo edges)
- Centered horizontally and vertically in the viewport

**Animation (Framer Motion)**

```
initial:    { opacity: 0, y: 24 }
animate:    { opacity: 1, y: 0 }
exit:       { opacity: 0, scale: 0.96 }
transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] }  // ease-out cubic
exit transition: { duration: 0.4, ease: 'easeIn' }
```

After ~1.4s of being mounted, the splash triggers exit and navigates away.

## Architecture

### Routing change

Onboarding moves from `/` to `/onboarding`. New `Splash` screen takes `/`.

```
/             → Splash (new)         — auto-navigates to /onboarding after 1.8s
/onboarding   → Onboarding (moved)
/home         → Home  (unchanged)
/saved, /profile, /settings, /scan/*, /results, /recipe/:id, /paywall (unchanged)
```

The wildcard `*` redirect target stays `/` so unknown URLs go through splash → onboarding.

### New files

- `fridgesnap/src/screens/Splash.tsx` — splash screen component

### Modified files

- `fridgesnap/src/App.tsx` — add Splash route, move Onboarding to `/onboarding`
- `fridgesnap/index.html` — add PNG favicon link tags

### Public assets (already in place)

- `fridgesnap/public/logo.png` — uploaded by user, used for both splash and favicon

## Splash Component Structure

```tsx
// src/screens/Splash.tsx
export function Splash() {
  const navigate = useNavigate()
  const [show, setShow] = useState(true)

  useEffect(() => {
    const exitTimer = setTimeout(() => setShow(false), 1400)
    const navTimer  = setTimeout(() => navigate('/onboarding', { replace: true }), 1800)
    return () => { clearTimeout(exitTimer); clearTimeout(navTimer) }
  }, [navigate])

  return (
    <div className="absolute inset-0 flex items-center justify-center"
         style={{ background: 'linear-gradient(180deg, #0F1B2D 0%, #0B0C10 100%)' }}>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="w-32 h-32 rounded-[28px] bg-white flex items-center justify-center shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)]"
          >
            <img src="/logo.png" alt="FridgeSnap" className="w-24 h-24 object-contain" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

Note: The Splash component does NOT use the existing `PageTransition` wrapper — it manages its own enter/exit animation. We render the Splash route outside the shared `PageTransition` wrapping, OR we wrap with `PageTransition` at zero motion (preferred: render bare since splash has its own animation logic).

### Decision: route the Splash outside `PageTransition`

The `PageTransition` HOC adds a horizontal slide that would conflict with the splash's own slide-up. Render Splash directly:

```tsx
<Route path="/" element={<Splash />} />
```

## Favicon Update

In `fridgesnap/index.html`, add PNG favicon links alongside the existing SVG favicon:

```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="icon" type="image/png" href="/logo.png" />
<link rel="apple-touch-icon" href="/logo.png" />
```

Keep the existing SVG favicon as the primary icon (browsers prefer SVG when supported); PNG is fallback. The user can later replace `logo.png` with a dedicated favicon-sized variant if needed.

## Edge Cases

- **Back button after navigation**: `replace: true` ensures Splash is NOT in history. User on `/onboarding` pressing back goes to browser history, not Splash.
- **Unknown routes**: Existing `*` → `/` redirect means deep-linking to a bad URL still flashes splash before onboarding. Acceptable.
- **Component unmount mid-animation**: cleanup function clears both timers.
- **Reduced-motion preference**: Out of scope for v1. Could be added later via `useReducedMotion()` hook from Framer Motion.

## Out of Scope

- Skipping splash on subsequent loads (sessionStorage gating) — user chose "show every time"
- Tap-to-skip
- Loading any actual data during splash (the app has no startup data fetching to wait on)
- Reduced-motion accessibility variant
- Different splash for first-launch vs returning users
- Audio/haptics

## Testing Plan

Manual testing in browser:

1. Open `/` — splash appears immediately, no flash of empty screen
2. Wait — auto-navigates to `/onboarding` at ~1.8s
3. Verify the slide-up + fade animation runs smoothly (no jank)
4. Verify white card with logo is visible and centered on the dark gradient
5. Verify back button on `/onboarding` does NOT return to splash
6. Visit a bogus URL like `/xyz` — should redirect through splash → onboarding
7. Open browser tab — favicon shows the FridgeSnap logo (PNG fallback for non-SVG browsers)
