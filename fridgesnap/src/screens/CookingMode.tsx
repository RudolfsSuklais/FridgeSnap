import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { X } from 'lucide-react'
import { recipes } from '../data/mockData'

export function CookingMode() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const recipe = useMemo(() => recipes.find((r) => r.id === id), [id])

  if (!recipe) {
    return (
      <div className="relative flex h-full w-full items-center justify-center bg-ink-900 text-white">
        <p className="text-[14px]">Recipe not found.</p>
      </div>
    )
  }

  return (
    <motion.div
      key="cooking-mode"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="relative h-full w-full overflow-hidden text-white"
    >
      {/* Blurred recipe hero backdrop */}
      <div aria-hidden className="absolute inset-0">
        <img
          src={recipe.image}
          alt=""
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ filter: 'blur(40px) saturate(1.1)', transform: 'scale(1.15)' }}
        />
        <div className="absolute inset-0 bg-black/55" />
      </div>

      {/* Top bar: close + title */}
      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 pt-14">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Exit cooking mode"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white shadow-glass-sm backdrop-blur-md"
        >
          <X className="h-5 w-5" strokeWidth={2.25} />
        </button>
        <p className="max-w-[60%] truncate text-[13px] font-semibold opacity-80">
          {recipe.title}
        </p>
        <div className="h-10 w-10" />
      </div>

      {/* Body — placeholder for steps. Real content arrives in Task 3. */}
      <div className="relative z-10 flex h-full items-center justify-center px-6 text-center">
        <p className="text-[15px] opacity-70">Cooking flow coming online…</p>
      </div>
    </motion.div>
  )
}
