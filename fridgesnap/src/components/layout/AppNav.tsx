import { useNavigate } from 'react-router-dom'
import {
  Bookmark,
  Camera,
  Home as HomeIcon,
  Settings as SettingsIcon,
  User,
} from 'lucide-react'
import { GlassNavBar, type NavItem } from '../ui/GlassNavBar'

export type AppNavKey = 'home' | 'saved' | 'scan' | 'profile' | 'settings'

const NAV_ITEMS: NavItem[] = [
  { key: 'home', label: 'Home', icon: <HomeIcon className="h-[22px] w-[22px]" strokeWidth={2} /> },
  { key: 'saved', label: 'Saved', icon: <Bookmark className="h-[22px] w-[22px]" strokeWidth={2} /> },
  {
    key: 'scan',
    label: 'Scan',
    icon: <Camera className="h-6 w-6" strokeWidth={2.25} />,
    prominent: true,
  },
  { key: 'profile', label: 'Profile', icon: <User className="h-[22px] w-[22px]" strokeWidth={2} /> },
  { key: 'settings', label: 'Settings', icon: <SettingsIcon className="h-[22px] w-[22px]" strokeWidth={2} /> },
]

const ROUTE_FOR: Record<AppNavKey, string> = {
  home: '/home',
  saved: '/saved',
  scan: '/scan/fridge',
  profile: '/profile',
  settings: '/settings',
}

interface AppNavProps {
  active: AppNavKey
}

export function AppNav({ active }: AppNavProps) {
  const navigate = useNavigate()
  const handleChange = (key: string) => {
    if (key === active) return
    const route = ROUTE_FOR[key as AppNavKey]
    if (route) navigate(route)
  }
  return <GlassNavBar items={NAV_ITEMS} active={active} onChange={handleChange} />
}
