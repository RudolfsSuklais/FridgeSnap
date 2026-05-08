import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, ChevronLeft, ImageIcon } from 'lucide-react'
import { GlassButton } from '../components/ui/GlassButton'
import { GradientBackground } from '../components/layout/GradientBackground'
import { Viewfinder } from '../components/ui/Viewfinder'
import { useScan } from '../contexts/ScanContext'
import { useScanCapture } from '../hooks/useScanCapture'
import { scannedItems } from '../data/mockData'

const FRIDGE_ITEMS = scannedItems.filter((i) =>
  ['produce', 'dairy', 'protein'].includes(i.category),
)

const STATUS_TEXTS = [
  'Analysing your fridge…',
  'Found tomatoes, cucumber…',
  'Found eggs, milk, cheese…',
]

export function ScanFridge() {
  const navigate = useNavigate()
  const { reset, addItems } = useScan()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset any prior scan state when entering the flow
  useEffect(() => {
    reset()
  }, [reset])

  const { phase, statusText, start } = useScanCapture({
    statusTexts: STATUS_TEXTS,
    onComplete: () => {
      addItems(FRIDGE_ITEMS)
      navigate('/scan/pantry')
    },
  })

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) start()
    e.target.value = ''
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      <GradientBackground variant="ocean" />

      <div className="relative z-10 flex h-full w-full flex-col px-6 pb-10 pt-14">
        {/* Top row: back + step */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Back"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/55 text-ink-900 shadow-glass-sm backdrop-blur-md backdrop-saturate-180"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2.25} />
          </button>
          <span className="rounded-full border border-white/40 bg-white/55 px-3 py-1 text-[11px] font-semibold tracking-wide text-ink-700 shadow-glass-sm backdrop-blur-md">
            Step 1 of 2
          </span>
        </div>

        {/* Title block */}
        <div className="mt-5">
          <h1 className="text-[26px] font-bold leading-tight tracking-tight text-ink-900">
            Scan your fridge
          </h1>
          <p className="mt-1 text-[14px] text-ink-500">
            Open your fridge and capture the inside.
          </p>
        </div>

        {/* Viewfinder */}
        <div className="mt-5 flex-1">
          <Viewfinder
            state={phase}
            statusText={statusText}
            tone="fridge"
            onCaptureTap={start}
          />
        </div>

        {/* Action buttons */}
        <div className="mt-5 flex flex-col items-stretch gap-2.5">
          <GlassButton
            variant="primary"
            size="lg"
            fullWidth
            onClick={start}
            disabled={phase !== 'idle'}
            leadingIcon={<Camera className="h-4 w-4" strokeWidth={2.25} />}
          >
            {phase === 'idle' ? 'Capture' : 'Scanning…'}
          </GlassButton>
          <GlassButton
            variant="secondary"
            size="md"
            fullWidth
            onClick={() => fileInputRef.current?.click()}
            disabled={phase !== 'idle'}
            leadingIcon={<ImageIcon className="h-4 w-4" strokeWidth={2.25} />}
          >
            Upload from gallery
          </GlassButton>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
          />
        </div>
      </div>
    </div>
  )
}
