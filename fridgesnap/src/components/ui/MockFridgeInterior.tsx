import { motion, useTransform, type MotionValue } from 'framer-motion'
import type { ReactNode } from 'react'
import type { ViewfinderState, ViewfinderTone } from './Viewfinder'

export type MockFridgeVariant = ViewfinderTone

interface MockFridgeInteriorProps {
  variant: MockFridgeVariant
  scanning: boolean
  scanProgress: MotionValue<number>
  state: ViewfinderState
  className?: string
}

const VB_W = 280
const VB_H = 360

interface ItemDef {
  id: string
  centerX: number
  centerY: number
  render: () => ReactNode
}

const FRIDGE_ITEMS: ItemDef[] = [
  // ── Top shelf (y 30–88) ─────────────────────────────────────────
  {
    id: 'milk',
    centerX: 68,
    centerY: 60,
    render: () => (
      <>
        <polygon points="50,48 68,32 86,48" fill="#E8DCC0" />
        <rect x={50} y={46} width={36} height={44} rx={2.5} fill="#F5EDD8" />
        <rect x={54} y={62} width={28} height={9} rx={1.5} fill="#FFE9A8" />
        <rect x={56} y={66} width={20} height={2} rx={1} fill="#D8B85A" opacity={0.6} />
      </>
    ),
  },
  {
    id: 'eggs',
    centerX: 130,
    centerY: 75,
    render: () => (
      <>
        <rect x={100} y={62} width={60} height={26} rx={3} fill="#D8CDB6" />
        <rect x={100} y={62} width={60} height={3} rx={1.5} fill="#B8AB91" opacity={0.5} />
        {[0, 1, 2].flatMap((c) =>
          [0, 1].map((r) => (
            <circle
              key={`egg-${c}-${r}`}
              cx={110 + c * 20}
              cy={70 + r * 10}
              r={3.5}
              fill="#F4ECDA"
            />
          )),
        )}
      </>
    ),
  },
  {
    id: 'butter',
    centerX: 189,
    centerY: 73,
    render: () => (
      <>
        <rect x={170} y={62} width={38} height={22} rx={3} fill="#FFE48E" />
        <rect x={172} y={68} width={34} height={5} rx={1} fill="#F5C84B" opacity={0.7} />
      </>
    ),
  },
  {
    id: 'cheese',
    centerX: 232,
    centerY: 70,
    render: () => (
      <>
        <polygon points="218,86 246,82 246,52 218,55" fill="#F5C84B" />
        <polygon points="218,86 246,82 246,52" fill="#E8B53A" opacity={0.45} />
        <circle cx={228} cy={70} r={2} fill="#C99A1F" />
        <circle cx={236} cy={66} r={1.5} fill="#C99A1F" />
        <circle cx={232} cy={78} r={1.2} fill="#C99A1F" />
      </>
    ),
  },
  // ── Middle shelf (y 110–188) ─────────────────────────────────────
  {
    id: 'tomatoes',
    centerX: 73,
    centerY: 170,
    render: () => (
      <>
        <circle cx={66} cy={170} r={11} fill="#E26B6B" />
        <circle cx={80} cy={165} r={11} fill="#D85858" />
        <circle cx={75} cy={178} r={11} fill="#C84A4A" />
        <circle cx={62} cy={167} r={3} fill="#F08C8C" opacity={0.7} />
        <circle cx={76} cy={162} r={2.5} fill="#F08C8C" opacity={0.7} />
        <path
          d="M 73 158 Q 75 154 78 156"
          stroke="#5DA053"
          strokeWidth={1.5}
          fill="none"
          strokeLinecap="round"
        />
      </>
    ),
  },
  {
    id: 'pepper',
    centerX: 135,
    centerY: 168,
    render: () => (
      <>
        <path
          d="M 122 168 Q 119 158 130 158 Q 142 156 148 164 Q 152 173 144 180 Q 134 186 128 180 Q 120 176 122 168 Z"
          fill="#F5C84B"
        />
        <path
          d="M 130 162 Q 135 159 142 162"
          stroke="#FFE48E"
          strokeWidth={1.5}
          fill="none"
          opacity={0.7}
          strokeLinecap="round"
        />
        <rect x={134} y={154} width={3} height={6} rx={1} fill="#5DA053" />
      </>
    ),
  },
  {
    id: 'cucumber',
    centerX: 195,
    centerY: 173,
    render: () => (
      <>
        <rect x={165} y={166} width={60} height={14} rx={7} fill="#4F8F4A" />
        <rect x={167} y={168} width={56} height={3} rx={1.5} fill="#6FB266" opacity={0.55} />
        <circle cx={175} cy={176} r={0.8} fill="#3A6B36" />
        <circle cx={195} cy={177} r={0.8} fill="#3A6B36" />
        <circle cx={215} cy={175} r={0.8} fill="#3A6B36" />
      </>
    ),
  },
  {
    id: 'lettuce',
    centerX: 246,
    centerY: 168,
    render: () => (
      <>
        <circle cx={235} cy={168} r={10} fill="#6FB266" />
        <circle cx={245} cy={160} r={10} fill="#88C77E" />
        <circle cx={255} cy={170} r={9} fill="#5DA053" />
        <circle cx={246} cy={175} r={10} fill="#7EBE74" />
        <circle cx={240} cy={170} r={7} fill="#9DD493" />
        <circle cx={252} cy={161} r={3} fill="#B5E0A8" opacity={0.7} />
      </>
    ),
  },
  // ── Bottom shelf (y 210–272) ─────────────────────────────────────
  {
    id: 'bottle',
    centerX: 58,
    centerY: 245,
    render: () => (
      <>
        <rect x={56} y={213} width={4} height={6} fill="#3A2A18" />
        <rect x={54} y={219} width={8} height={5} fill="#5C4528" />
        <rect x={50} y={224} width={16} height={48} rx={3} fill="#C2853B" />
        <rect x={52} y={234} width={12} height={20} rx={1} fill="#F5E8C8" opacity={0.85} />
        <rect x={54} y={240} width={8} height={2} rx={0.5} fill="#5C4528" opacity={0.6} />
      </>
    ),
  },
  {
    id: 'yogurt',
    centerX: 138,
    centerY: 246,
    render: () => (
      <>
        {[0, 1, 2].map((i) => {
          const x = 105 + i * 22
          const lid = ['#FFB5B5', '#B5DBFF', '#FFE9A8'][i]
          return (
            <g key={`yog-${i}`}>
              <polygon
                points={`${x},230 ${x + 18},230 ${x + 16},258 ${x + 2},258`}
                fill="#FFFFFF"
              />
              <rect x={x} y={228} width={18} height={4} rx={1} fill={lid} />
              <rect
                x={x + 3}
                y={240}
                width={12}
                height={1.5}
                fill={lid}
                opacity={0.4}
              />
            </g>
          )
        })}
      </>
    ),
  },
  {
    id: 'jar1',
    centerX: 212,
    centerY: 252,
    render: () => (
      <>
        <rect x={200} y={240} width={24} height={6} rx={1.5} fill="#3A2A18" />
        <rect x={200} y={246} width={24} height={20} rx={2} fill="#C8842A" />
        <rect x={202} y={252} width={20} height={6} fill="#F5E8C8" opacity={0.75} />
      </>
    ),
  },
  {
    id: 'jar2',
    centerX: 246,
    centerY: 252,
    render: () => (
      <>
        <rect x={235} y={240} width={22} height={6} rx={1.5} fill="#FFFFFF" />
        <rect x={235} y={246} width={22} height={20} rx={2} fill="#A8DDD4" />
        <rect x={237} y={252} width={18} height={6} fill="#FFFFFF" opacity={0.65} />
      </>
    ),
  },
]

const PANTRY_ITEMS: ItemDef[] = [
  // ── Top shelf — boxes (y 35–95) ──────────────────────────────────
  {
    id: 'pasta1',
    centerX: 60,
    centerY: 65,
    render: () => (
      <>
        <rect x={40} y={35} width={40} height={60} rx={2} fill="#6FA0D5" />
        <rect x={43} y={50} width={34} height={28} rx={1} fill="#FFFFFF" opacity={0.45} />
        <rect x={46} y={56} width={28} height={3} fill="#3D6FA8" opacity={0.7} />
        <rect x={46} y={62} width={20} height={2} fill="#3D6FA8" opacity={0.5} />
        <rect x={43} y={84} width={34} height={3} fill="#3D6FA8" opacity={0.5} />
      </>
    ),
  },
  {
    id: 'pasta2',
    centerX: 108,
    centerY: 67,
    render: () => (
      <>
        <rect x={90} y={40} width={36} height={55} rx={2} fill="#D26A6A" />
        <rect x={93} y={54} width={30} height={26} rx={1} fill="#FFFFFF" opacity={0.45} />
        <rect x={96} y={60} width={24} height={3} fill="#A03E3E" opacity={0.7} />
        <rect x={96} y={66} width={18} height={2} fill="#A03E3E" opacity={0.5} />
      </>
    ),
  },
  {
    id: 'pasta3',
    centerX: 154,
    centerY: 65,
    render: () => (
      <>
        <rect x={135} y={35} width={38} height={60} rx={2} fill="#ECCC58" />
        <rect x={138} y={50} width={32} height={28} rx={1} fill="#FFFFFF" opacity={0.45} />
        <rect x={141} y={56} width={26} height={3} fill="#B5921A" opacity={0.7} />
        <rect x={141} y={62} width={18} height={2} fill="#B5921A" opacity={0.5} />
      </>
    ),
  },
  {
    id: 'cereal',
    centerX: 210,
    centerY: 65,
    render: () => (
      <>
        <rect x={185} y={35} width={50} height={60} rx={2} fill="#E8954F" />
        <rect x={188} y={50} width={44} height={28} rx={2} fill="#FFFFFF" opacity={0.5} />
        <circle cx={210} cy={64} r={6} fill="#C24D3A" />
        <rect x={188} y={82} width={44} height={3} fill="#A0691E" opacity={0.55} />
      </>
    ),
  },
  // ── Middle shelf — bottles + spices (y 110–185) ─────────────────
  {
    id: 'oliveOil',
    centerX: 61,
    centerY: 150,
    render: () => (
      <>
        <rect x={59} y={111} width={4} height={5} fill="#4A3520" />
        <rect x={57} y={116} width={8} height={6} fill="#7B5C2D" />
        <rect x={50} y={120} width={22} height={64} rx={4} fill="#4F7A3F" />
        <rect x={53} y={140} width={16} height={20} rx={1} fill="#F5E8C8" />
        <rect x={55} y={146} width={12} height={2} fill="#4F7A3F" opacity={0.7} />
        <rect x={55} y={152} width={10} height={1.5} fill="#4F7A3F" opacity={0.5} />
      </>
    ),
  },
  {
    id: 'soySauce',
    centerX: 96,
    centerY: 158,
    render: () => (
      <>
        <rect x={94} y={128} width={4} height={4} fill="#2A2018" />
        <rect x={91} y={132} width={10} height={5} fill="#3A2E25" />
        <rect x={89} y={137} width={14} height={48} rx={2} fill="#1F1812" />
        <rect x={91} y={150} width={10} height={10} rx={1} fill="#C24D3A" />
      </>
    ),
  },
  {
    id: 'salt-pepper',
    centerX: 145,
    centerY: 158,
    render: () => (
      <>
        {/* salt */}
        <rect x={123} y={130} width={18} height={8} rx={1} fill="#E8DCC0" />
        <rect x={123} y={138} width={18} height={45} rx={2} fill="#F5EDD8" />
        <circle cx={128} cy={134} r={1} fill="#A8957C" />
        <circle cx={132} cy={134} r={1} fill="#A8957C" />
        <circle cx={136} cy={134} r={1} fill="#A8957C" />
        {/* pepper */}
        <rect x={150} y={130} width={18} height={8} rx={1} fill="#3A2E25" />
        <rect x={150} y={138} width={18} height={45} rx={2} fill="#5C4528" />
        <circle cx={155} cy={134} r={1} fill="#1F1812" />
        <circle cx={159} cy={134} r={1} fill="#1F1812" />
        <circle cx={163} cy={134} r={1} fill="#1F1812" />
      </>
    ),
  },
  {
    id: 'spices',
    centerX: 210,
    centerY: 162,
    render: () => (
      <>
        {[0, 1].flatMap((c) =>
          [0, 1].map((r) => {
            const x = 188 + c * 22
            const y = 148 + r * 22
            const colors = ['#E26B6B', '#F5C84B', '#88C77E', '#D9A862']
            return (
              <g key={`spice-${c}-${r}`}>
                <rect x={x} y={y} width={20} height={4} rx={1} fill="#3A2E25" />
                <rect x={x} y={y + 4} width={20} height={16} rx={2} fill={colors[c * 2 + r]} />
                <rect x={x + 2} y={y + 8} width={16} height={2} fill="#FFFFFF" opacity={0.5} />
              </g>
            )
          }),
        )}
      </>
    ),
  },
  // ── Bottom shelf — cans + jars (y 215–262) ──────────────────────
  {
    id: 'cans',
    centerX: 90,
    centerY: 240,
    render: () => (
      <>
        {[0, 1, 2].map((i) => {
          const x = 50 + i * 32
          const labelColor = ['#C24D3A', '#3D6FA8', '#4F8F4A'][i]
          return (
            <g key={`can-${i}`}>
              <rect x={x} y={220} width={26} height={4} rx={1} fill="#A8AEB6" />
              <rect x={x} y={224} width={26} height={32} fill="#C8CCD2" />
              <rect x={x + 1} y={236} width={24} height={10} fill={labelColor} />
              <rect x={x} y={224} width={26} height={2} fill="#9098A2" opacity={0.6} />
            </g>
          )
        })}
      </>
    ),
  },
  {
    id: 'jam',
    centerX: 179,
    centerY: 240,
    render: () => (
      <>
        <rect x={163} y={216} width={32} height={8} rx={2} fill="#C24D3A" />
        <rect x={165} y={224} width={28} height={36} rx={3} fill="#F2E8D5" />
        <rect x={167} y={230} width={24} height={20} rx={2} fill="#A83E2B" opacity={0.85} />
        <rect x={170} y={234} width={18} height={3} fill="#FFFFFF" opacity={0.6} />
      </>
    ),
  },
  {
    id: 'honey',
    centerX: 222,
    centerY: 240,
    render: () => (
      <>
        <rect x={208} y={218} width={28} height={6} rx={2} fill="#5C4528" />
        <path
          d="M 210 224 Q 208 232 210 240 Q 210 256 222 258 Q 234 256 234 240 Q 236 232 234 224 Z"
          fill="#C8842A"
        />
        <rect x={213} y={234} width={18} height={10} rx={1} fill="#F5E8C8" opacity={0.7} />
      </>
    ),
  },
  {
    id: 'tin',
    centerX: 259,
    centerY: 245,
    render: () => (
      <>
        <rect x={248} y={228} width={22} height={4} rx={1} fill="#3A2E25" />
        <rect x={248} y={232} width={22} height={28} rx={2} fill="#A8AEB6" />
        <rect x={249} y={240} width={20} height={8} fill="#D9A862" />
      </>
    ),
  },
]

export function MockFridgeInterior({
  variant,
  scanning,
  scanProgress,
  state,
  className = '',
}: MockFridgeInteriorProps) {
  const items = variant === 'fridge' ? FRIDGE_ITEMS : PANTRY_ITEMS
  const isFridge = variant === 'fridge'

  return (
    <motion.div
      className={className}
      initial={{ scale: 0.96, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="xMidYMid meet"
        className="h-full w-full"
        aria-hidden
      >
        <defs>
          <linearGradient id="fridge-light" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F4F6F9" />
            <stop offset="55%" stopColor="#D8DFE8" />
            <stop offset="100%" stopColor="#B8C2D0" />
          </linearGradient>
          <linearGradient id="pantry-light" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F2E8D5" />
            <stop offset="100%" stopColor="#D8C39E" />
          </linearGradient>
          <radialGradient id="bloom" cx="50%" cy="0%" r="70%">
            <stop offset="0%" stopColor="white" stopOpacity="0.55" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="side-shade" cx="50%" cy="50%" r="60%">
            <stop offset="60%" stopColor="black" stopOpacity="0" />
            <stop offset="100%" stopColor="black" stopOpacity="0.25" />
          </radialGradient>
          <filter id="scan-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" />
          </filter>
        </defs>

        {/* interior backdrop */}
        <rect
          x={0}
          y={0}
          width={VB_W}
          height={VB_H}
          fill={`url(#${isFridge ? 'fridge-light' : 'pantry-light'})`}
        />

        {/* top light bloom — pulses brighter on capture flash */}
        <motion.rect
          x={0}
          y={0}
          width={VB_W}
          height={VB_H * 0.5}
          fill="url(#bloom)"
          animate={{ opacity: state === 'flash' ? 1.6 : 1 }}
          transition={{ duration: 0.1, ease: 'easeOut' }}
        />

        {/* camera-shake group: shelves, decor, items */}
        <motion.g
          animate={{ x: [0, 1, -1, 0], y: [0, 0.5, -0.5, 0] }}
          transition={{
            x: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
            y: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' },
          }}
        >
          {/* shelves */}
          {[95, 195, 280].map((y) =>
            isFridge ? (
              <g key={`shelf-${y}`}>
                <line
                  x1={20}
                  y1={y}
                  x2={260}
                  y2={y}
                  stroke="white"
                  strokeOpacity={0.5}
                  strokeWidth={2}
                />
                <line
                  x1={20}
                  y1={y + 1.8}
                  x2={260}
                  y2={y + 1.8}
                  stroke="white"
                  strokeOpacity={0.18}
                  strokeWidth={1}
                />
              </g>
            ) : (
              <g key={`shelf-${y}`}>
                <rect x={14} y={y - 3} width={252} height={6} rx={1} fill="#BC9A6F" />
                <rect x={14} y={y - 3} width={252} height={1.5} fill="#A07E55" />
                <rect
                  x={14}
                  y={y + 1.5}
                  width={252}
                  height={1.5}
                  fill="#8C6B43"
                  opacity={0.5}
                />
              </g>
            ),
          )}

          {/* fridge door bays (decorative, not scannable) */}
          {isFridge &&
            [80, 160, 240].flatMap((y) => [
              <g key={`bay-l-${y}`}>
                <rect x={6} y={y - 12} width={10} height={4} fill="#3A2E25" />
                <rect x={4} y={y - 8} width={14} height={20} rx={2} fill="#7B5C2D" />
                <rect
                  x={5}
                  y={y - 6}
                  width={12}
                  height={3}
                  fill="#F5E8C8"
                  opacity={0.4}
                />
              </g>,
              <g key={`bay-r-${y}`}>
                <rect x={264} y={y - 12} width={10} height={4} fill="#3A2E25" />
                <rect x={262} y={y - 8} width={14} height={20} rx={2} fill="#5C4528" />
                <rect
                  x={263}
                  y={y - 6}
                  width={12}
                  height={3}
                  fill="#F5E8C8"
                  opacity={0.35}
                />
              </g>,
            ])}

          {/* scannable items */}
          {items.map((item) => (
            <ScannableItem
              key={item.id}
              centerX={item.centerX}
              centerY={item.centerY}
              scanning={scanning}
              scanProgress={scanProgress}
            >
              {item.render()}
            </ScannableItem>
          ))}
        </motion.g>

        {/* edge shading on top of everything for depth */}
        <rect
          x={0}
          y={0}
          width={VB_W}
          height={VB_H}
          fill="url(#side-shade)"
          pointerEvents="none"
        />
      </svg>
    </motion.div>
  )
}

interface ScannableItemProps {
  centerX: number
  centerY: number
  scanning: boolean
  scanProgress: MotionValue<number>
  children: ReactNode
}

function ScannableItem({
  centerX,
  centerY,
  scanning,
  scanProgress,
  children,
}: ScannableItemProps) {
  // Items higher in the frame (smaller centerY) light up first.
  const threshold = 0.05 + (centerY / VB_H) * 0.85

  const ringOpacity = useTransform(
    scanProgress,
    [threshold - 0.06, threshold, threshold + 0.05, threshold + 0.12],
    [0, 0.95, 0.55, 0],
  )
  const ringR = useTransform(
    scanProgress,
    [threshold - 0.06, threshold, threshold + 0.12],
    [16, 24, 34],
  )
  const itemScale = useTransform(
    scanProgress,
    [threshold - 0.02, threshold, threshold + 0.06],
    [1, 1.08, 1],
  )
  const checkOpacity = useTransform(
    scanProgress,
    [threshold + 0.005, threshold + 0.04],
    [0, 1],
  )

  return (
    <g>
      {scanning ? (
        <motion.circle
          cx={centerX}
          cy={centerY}
          r={ringR}
          fill="none"
          stroke="#6EE7B7"
          strokeWidth={1.6}
          filter="url(#scan-glow)"
          style={{ opacity: ringOpacity }}
        />
      ) : null}
      <motion.g
        style={{
          scale: itemScale,
          transformBox: 'fill-box',
          transformOrigin: 'center',
        }}
      >
        {children}
      </motion.g>
      {scanning ? (
        <motion.g style={{ opacity: checkOpacity }}>
          <circle cx={centerX + 14} cy={centerY - 14} r={5.5} fill="#34D399" />
          <path
            d={`M ${centerX + 11.5} ${centerY - 14} L ${centerX + 13.4} ${
              centerY - 12.2
            } L ${centerX + 16.5} ${centerY - 16}`}
            stroke="white"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </motion.g>
      ) : null}
    </g>
  )
}
