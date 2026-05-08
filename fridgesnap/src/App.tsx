import { Suspense, lazy, type ReactNode } from 'react'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { PhoneFrame } from './components/layout/PhoneFrame'
import { ScanProvider } from './contexts/ScanContext'
import { CookingProvider } from './contexts/CookingContext'
import { Splash } from './screens/Splash'

const Onboarding = lazy(() =>
  import('./screens/Onboarding').then((m) => ({ default: m.Onboarding }))
)
const OnboardingPreferences = lazy(() =>
  import('./screens/OnboardingPreferences').then((m) => ({ default: m.OnboardingPreferences }))
)
const Home = lazy(() => import('./screens/Home').then((m) => ({ default: m.Home })))
const Saved = lazy(() => import('./screens/Saved').then((m) => ({ default: m.Saved })))
const Profile = lazy(() => import('./screens/Profile').then((m) => ({ default: m.Profile })))
const ScanFridge = lazy(() =>
  import('./screens/ScanFridge').then((m) => ({ default: m.ScanFridge }))
)
const ScanPantry = lazy(() =>
  import('./screens/ScanPantry').then((m) => ({ default: m.ScanPantry }))
)
const ScanProcessing = lazy(() =>
  import('./screens/ScanProcessing').then((m) => ({ default: m.ScanProcessing }))
)
const MealTimeSelector = lazy(() =>
  import('./screens/MealTimeSelector').then((m) => ({ default: m.MealTimeSelector }))
)
const Results = lazy(() => import('./screens/Results').then((m) => ({ default: m.Results })))
const RecipeDetail = lazy(() =>
  import('./screens/RecipeDetail').then((m) => ({ default: m.RecipeDetail }))
)
const Paywall = lazy(() => import('./screens/Paywall').then((m) => ({ default: m.Paywall })))
const Settings = lazy(() => import('./screens/Settings').then((m) => ({ default: m.Settings })))
const CookingMode = lazy(() =>
  import('./screens/CookingMode').then((m) => ({ default: m.CookingMode }))
)

function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
      className="absolute inset-0"
    >
      {children}
    </motion.div>
  )
}

function ChunkFallback() {
  return (
    <div
      className="absolute inset-0"
      style={{ background: 'linear-gradient(180deg, #0F1B2D 0%, #0B0C10 100%)' }}
    />
  )
}

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<ChunkFallback />}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Splash />} />
          <Route path="/onboarding" element={<PageTransition><Onboarding /></PageTransition>} />
          <Route path="/onboarding/preferences" element={<PageTransition><OnboardingPreferences /></PageTransition>} />
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
          <Route path="/recipe/:id/cook" element={<CookingMode />} />
          <Route path="/paywall" element={<Paywall />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ScanProvider>
        <CookingProvider>
          <PhoneFrame>
            <AnimatedRoutes />
          </PhoneFrame>
        </CookingProvider>
      </ScanProvider>
    </BrowserRouter>
  )
}
