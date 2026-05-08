import type { ReactNode } from 'react'
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
import { Onboarding } from './screens/Onboarding'
import { OnboardingPreferences } from './screens/OnboardingPreferences'
import { Splash } from './screens/Splash'
import { Home } from './screens/Home'
import { Saved } from './screens/Saved'
import { Profile } from './screens/Profile'
import { ScanFridge } from './screens/ScanFridge'
import { ScanPantry } from './screens/ScanPantry'
import { ScanProcessing } from './screens/ScanProcessing'
import { MealTimeSelector } from './screens/MealTimeSelector'
import { Results } from './screens/Results'
import { RecipeDetail } from './screens/RecipeDetail'
import { Paywall } from './screens/Paywall'
import { Settings } from './screens/Settings'

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

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
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
        <Route path="/paywall" element={<Paywall />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ScanProvider>
        <PhoneFrame>
          <AnimatedRoutes />
        </PhoneFrame>
      </ScanProvider>
    </BrowserRouter>
  )
}
