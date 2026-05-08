import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { PhoneFrame } from './components/layout/PhoneFrame'
import { StatusBar } from './components/layout/StatusBar'
import { DynamicIsland } from './components/layout/DynamicIsland'
import { Onboarding } from './screens/Onboarding'
import { Home } from './screens/Home'

export default function App() {
  return (
    <BrowserRouter>
      <PhoneFrame>
        <Routes>
          <Route path="/" element={<Onboarding />} />
          <Route path="/home" element={<Home />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <StatusBar tone="dark" />
        <DynamicIsland />
      </PhoneFrame>
    </BrowserRouter>
  )
}
