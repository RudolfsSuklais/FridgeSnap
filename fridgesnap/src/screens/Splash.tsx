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
