import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { calculateImageSize, normalizeImageSize, type SizeTier } from '../lib/size'

const TIERS: SizeTier[] = ['1K', '2K', '4K']
const SIZE_LIMIT_TEXT =
  '由于模型限制，最终输出会自动规整到合法尺寸：宽高均为 16 的倍数，最大边长 3840px，宽高比不超过 3:1，总像素限制为 655360-8294400。'
const RATIOS = [
  { label: 'Auto', value: 'auto' },
  { label: '21:9', value: '21:9' },
  { label: '16:9', value: '16:9' },
  { label: '3:2', value: '3:2' },
  { label: '4:3', value: '4:3' },
  { label: '5:4', value: '5:4' },
  { label: '1:1', value: '1:1' },
  { label: '4:5', value: '4:5' },
  { label: '3:4', value: '3:4' },
  { label: '2:3', value: '2:3' },
  { label: '9:16', value: '9:16' },
] as const

interface Props {
  currentSize: string
  onSelect: (size: string) => void
  onClose: () => void
  allowAuto?: boolean
  anchorElement?: HTMLElement | null
}

type SelectionMode = 'ratio' | 'resolution'

function parseSize(size: string) {
  const match = size.match(/^\s*(\d+)\s*[xX×]\s*(\d+)\s*$/)
  if (!match) return null
  return { width: match[1], height: match[2] }
}

function findPresetForSize(size: string) {
  const normalized = normalizeImageSize(size)
  for (const tier of TIERS) {
    for (const ratio of RATIOS) {
      if (ratio.value === 'auto') continue
      if (calculateImageSize(tier, ratio.value) === normalized) {
        return { tier, ratio: ratio.value }
      }
    }
  }
  return null
}

function parseRatioValue(value: string) {
  const [width, height] = value.split(':').map((part) => Number(part))
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null
  return { width, height }
}

function getRatioPreviewSize(value: string) {
  const parsed = parseRatioValue(value)
  if (!parsed) return { width: 20, height: 20 }

  const maxWidth = 26
  const maxHeight = 18
  const ratio = parsed.width / parsed.height
  if (ratio >= maxWidth / maxHeight) {
    return { width: maxWidth, height: Math.max(4, maxWidth / ratio) }
  }
  return { width: Math.max(4, maxHeight * ratio), height: maxHeight }
}

function RatioGlyph({ value, active }: { value: string; active: boolean }) {
  const baseClass = active ? 'border-blue-500' : 'border-gray-400 dark:border-gray-500'
  if (value === 'auto') {
    return <span className={`h-5 w-5 rounded-md border-2 border-dashed ${baseClass}`} />
  }

  const size = getRatioPreviewSize(value)
  return (
    <span
      className={`box-border rounded-sm border-2 ${baseClass}`}
      style={{ width: `${size.width}px`, height: `${size.height}px` }}
    />
  )
}

export default function SizePickerModal({ currentSize, onSelect, onClose, allowAuto = true, anchorElement }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({
    left: 16,
    top: 16,
    width: 380,
    maxHeight: 460,
    transformOrigin: 'bottom center',
  })
  const currentPreset = findPresetForSize(currentSize)
  const currentParsedSize = parseSize(currentSize)
  const initialRatio =
    currentSize === 'auto' && allowAuto ? 'auto' : (currentPreset?.ratio ?? (allowAuto ? 'auto' : '4:3'))
  const [tier, setTier] = useState<SizeTier>(currentPreset?.tier ?? '2K')
  const [selectedRatio, setSelectedRatio] = useState(initialRatio)
  const [selectionMode, setSelectionMode] = useState<SelectionMode>(() =>
    currentPreset || currentSize === 'auto' ? 'ratio' : 'resolution',
  )
  const [customW, setCustomW] = useState(currentParsedSize?.width ?? '1024')
  const [customH, setCustomH] = useState(currentParsedSize?.height ?? '1024')

  const updatePosition = useCallback(() => {
    if (typeof window === 'undefined') return

    const margin = 12
    const gap = 10
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const width = Math.min(380, Math.max(320, viewportWidth - margin * 2))
    const rect = anchorElement?.getBoundingClientRect()
    const anchorLeft = rect ? rect.left + rect.width / 2 : viewportWidth / 2
    const left = Math.min(Math.max(margin, anchorLeft - width / 2), Math.max(margin, viewportWidth - width - margin))

    const spaceAbove = rect ? rect.top - margin : viewportHeight / 2
    const spaceBelow = rect ? viewportHeight - rect.bottom - margin : viewportHeight / 2
    const placeAbove = rect ? spaceAbove >= Math.min(390, spaceBelow) : true
    const maxHeight = Math.min(460, Math.max(300, (placeAbove ? spaceAbove : spaceBelow) - gap))
    const panelHeight = Math.min(panelRef.current?.offsetHeight || maxHeight, maxHeight)
    const rawTop = rect
      ? placeAbove
        ? rect.top - gap - panelHeight
        : rect.bottom + gap
      : (viewportHeight - panelHeight) / 2
    const top = Math.min(Math.max(margin, rawTop), Math.max(margin, viewportHeight - panelHeight - margin))

    setPosition({
      left,
      top,
      width,
      maxHeight,
      transformOrigin: placeAbove ? 'bottom center' : 'top center',
    })
  }, [anchorElement])

  useLayoutEffect(() => {
    updatePosition()
  }, [updatePosition, tier, selectedRatio, selectionMode, customW, customH])

  useEffect(() => {
    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [updatePosition])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const ratioOptions = allowAuto ? RATIOS : RATIOS.filter((ratio) => ratio.value !== 'auto')

  const previewSize = useMemo(() => {
    if (selectionMode === 'ratio') {
      if (selectedRatio === 'auto') return allowAuto ? 'auto' : ''
      return calculateImageSize(tier, selectedRatio) ?? ''
    }

    const w = parseInt(customW, 10)
    const h = parseInt(customH, 10)
    if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) {
      return normalizeImageSize(`${w}x${h}`)
    }
    return ''
  }, [allowAuto, customH, customW, selectedRatio, selectionMode, tier])

  const isClamped = useMemo(() => {
    if (selectionMode !== 'resolution' || !previewSize) return false
    const w = parseInt(customW, 10)
    const h = parseInt(customH, 10)
    return Number.isFinite(w) && Number.isFinite(h) && `${w}x${h}` !== previewSize
  }, [customH, customW, previewSize, selectionMode])

  const applySize = () => {
    if (!previewSize) return
    onSelect(previewSize)
    onClose()
  }

  const tierButtonClass = (active: boolean) =>
    `h-9 rounded-lg border text-sm font-semibold transition ${
      active
        ? 'border-blue-500 bg-blue-50 text-blue-600 shadow-[0_0_0_1px_rgba(59,130,246,0.12)] dark:bg-blue-500/15 dark:text-blue-300'
        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-gray-300 dark:hover:bg-white/[0.08]'
    }`

  const ratioButtonClass = (active: boolean) =>
    `flex h-[46px] flex-col items-center justify-center gap-0.5 rounded-lg border text-[11px] font-semibold transition ${
      active
        ? 'border-blue-500 bg-blue-50 text-blue-600 shadow-[0_0_0_1px_rgba(59,130,246,0.12)] dark:bg-blue-500/15 dark:text-blue-300'
        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-gray-300 dark:hover:bg-white/[0.08]'
    }`

  return (
    <div data-no-drag-select data-size-picker-root className="fixed inset-0 z-[70]" onPointerDown={onClose}>
      <div
        ref={panelRef}
        className="fixed z-10 overflow-hidden rounded-2xl border border-gray-200/80 bg-white/[0.98] shadow-[0_20px_70px_rgba(15,23,42,0.22)] ring-1 ring-black/5 backdrop-blur-xl animate-modal-in dark:border-white/[0.08] dark:bg-gray-900/[0.98] dark:ring-white/10"
        style={{
          left: position.left,
          top: position.top,
          width: position.width,
          maxHeight: position.maxHeight,
          transformOrigin: position.transformOrigin,
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="max-h-[inherit] overflow-y-auto p-3.5">
          <div className="mb-2.5 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">分辨率</h3>
              <p className="mt-1 font-mono text-xs text-gray-400 dark:text-gray-500">当前：{currentSize || 'auto'}</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/[0.06] dark:hover:text-gray-200"
              aria-label="关闭"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {TIERS.map((item) => (
              <button
                key={item}
                type="button"
                className={tierButtonClass(selectionMode === 'ratio' && tier === item)}
                onClick={() => {
                  setTier(item)
                  setSelectionMode('ratio')
                }}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="mt-3">
            <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300">
              长宽比 {allowAuto ? <span className="text-gray-500 dark:text-gray-400">（默认 Auto）</span> : null}
            </h4>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {ratioOptions.map((item) => {
                const active = selectionMode === 'ratio' && selectedRatio === item.value
                return (
                  <button
                    key={item.value}
                    type="button"
                    className={ratioButtonClass(active)}
                    onClick={() => {
                      setSelectedRatio(item.value)
                      setSelectionMode('ratio')
                    }}
                  >
                    <RatioGlyph value={item.value} active={active} />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50/80 p-2.5 dark:border-white/[0.08] dark:bg-white/[0.03]">
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">自定义分辨率</h4>
              {isClamped && (
                <span className="rounded-full bg-yellow-100 px-2 py-1 text-[11px] font-medium text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-300">
                  已自动规整
                </span>
              )}
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
              <label>
                <span className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">宽</span>
                <input
                  type="number"
                  min={1}
                  value={customW}
                  onFocus={() => setSelectionMode('resolution')}
                  onChange={(e) => {
                    setCustomW(e.target.value)
                    setSelectionMode('resolution')
                  }}
                  className="h-8 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-sm font-medium text-gray-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-gray-200 dark:focus:border-blue-500/60 dark:focus:ring-blue-500/15"
                  placeholder="1024"
                />
              </label>
              <span className="mb-1.5 text-base font-semibold text-gray-400 dark:text-gray-500">×</span>
              <label>
                <span className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">高</span>
                <input
                  type="number"
                  min={1}
                  value={customH}
                  onFocus={() => setSelectionMode('resolution')}
                  onChange={(e) => {
                    setCustomH(e.target.value)
                    setSelectionMode('resolution')
                  }}
                  className="h-8 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-sm font-medium text-gray-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-gray-200 dark:focus:border-blue-500/60 dark:focus:ring-blue-500/15"
                  placeholder="1024"
                />
              </label>
            </div>
            <p
              className="mt-1 line-clamp-1 text-[10px] leading-relaxed text-gray-500 dark:text-gray-400"
              title={`提示：${SIZE_LIMIT_TEXT}`}
            >
              提示：{SIZE_LIMIT_TEXT}
            </p>
          </div>

          <div className="mt-3 grid grid-cols-[1fr_auto_auto] items-center gap-2">
            <div className="min-w-0 rounded-xl bg-gray-50 px-3 py-2 dark:bg-white/[0.03]">
              <div className="text-[10px] leading-none text-gray-400 dark:text-gray-500">将使用</div>
              <div className="mt-1 truncate font-mono text-sm font-semibold text-gray-800 dark:text-gray-100">
                {previewSize || '尺寸无效'}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-gray-100 px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-200 dark:bg-white/[0.06] dark:text-gray-300 dark:hover:bg-white/[0.1]"
            >
              取消
            </button>
            <button
              type="button"
              onClick={applySize}
              disabled={!previewSize}
              className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              确定
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
