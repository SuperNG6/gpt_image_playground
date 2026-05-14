import { useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { zipSync } from 'fflate'
import { ensureImageCached, useStore } from '../store'
import { canvasToBlob, loadImage } from '../lib/canvasImage'
import { DownloadIcon, GridIcon, PlusIcon, TrashIcon } from './icons'

type LineAxis = 'vertical' | 'horizontal'
type DragState = { axis: LineAxis; index: number } | null
type SliceResult = {
  name: string
  blob: Blob
  url: string
  width: number
  height: number
}
type SelectionBox = { startX: number; startY: number; currentX: number; currentY: number } | null

const MIN_LINE_GAP = 1
const MAX_GRID_COUNT = 20

function clampCount(value: number) {
  if (!Number.isFinite(value)) return 1
  return Math.max(1, Math.min(MAX_GRID_COUNT, Math.floor(value)))
}

function clampLine(value: number) {
  return Math.max(MIN_LINE_GAP, Math.min(100 - MIN_LINE_GAP, value))
}

function clampDraggedLine(value: number, lines: number[], index: number) {
  const min = index > 0 ? lines[index - 1] + MIN_LINE_GAP : MIN_LINE_GAP
  const max = index < lines.length - 1 ? lines[index + 1] - MIN_LINE_GAP : 100 - MIN_LINE_GAP
  return Math.round(Math.max(min, Math.min(max, value)) * 10) / 10
}

function normalizeLines(lines: number[]) {
  return [...new Set(lines.map((line) => Math.round(clampLine(line) * 10) / 10))]
    .sort((a, b) => a - b)
}

function linesFromCount(count: number) {
  const safeCount = clampCount(count)
  return Array.from({ length: Math.max(0, safeCount - 1) }, (_, index) => ((index + 1) / safeCount) * 100)
}

function makeStops(lines: number[], size: number) {
  return [0, ...normalizeLines(lines), 100].map((pct) => Math.round((pct / 100) * size))
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function formatPercent(value: number) {
  return `${Math.round(value * 10) / 10}%`
}

export default function GridSplitPage() {
  const imageId = useStore((s) => s.splitImageId)
  const splitImageDataUrl = useStore((s) => s.splitImageDataUrl)
  const setSplitImageId = useStore((s) => s.setSplitImageId)
  const setSplitImageDataUrl = useStore((s) => s.setSplitImageDataUrl)
  const showToast = useStore((s) => s.showToast)
  const [src, setSrc] = useState('')
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [cols, setCols] = useState(3)
  const [rows, setRows] = useState(3)
  const [verticalLines, setVerticalLines] = useState<number[]>(linesFromCount(3))
  const [horizontalLines, setHorizontalLines] = useState<number[]>(linesFromCount(3))
  const [selectedLine, setSelectedLine] = useState<{ axis: LineAxis; index: number } | null>(null)
  const [dragging, setDragging] = useState<DragState>(null)
  const [slices, setSlices] = useState<SliceResult[]>([])
  const [selectedSliceNames, setSelectedSliceNames] = useState<string[]>([])
  const [selectionBox, setSelectionBox] = useState<SelectionBox>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const selectionStartRef = useRef<{ x: number; y: number } | null>(null)
  const selectionDraggedRef = useRef(false)

  useEffect(() => () => {
    slices.forEach((slice) => URL.revokeObjectURL(slice.url))
  }, [slices])

  useEffect(() => {
    let cancelled = false
    setSrc('')
    setImage(null)
    setSelectedLine(null)
    setSlices([])

    const load = async () => {
      const dataUrl = splitImageDataUrl ?? (imageId ? await ensureImageCached(imageId) : null)
      if (!dataUrl) return
      const loaded = await loadImage(dataUrl)
      if (cancelled) return
      setSrc(dataUrl)
      setImage(loaded)
    }

    load().catch((err) => {
      if (cancelled) return
      console.error(err)
      showToast(err instanceof Error ? err.message : '图片加载失败', 'error')
      setSplitImageId(null)
      setSplitImageDataUrl(null)
    })

    return () => {
      cancelled = true
    }
  }, [imageId, splitImageDataUrl, setSplitImageDataUrl, setSplitImageId, showToast])

  const totalPieces = useMemo(() => {
    return (verticalLines.length + 1) * (horizontalLines.length + 1)
  }, [horizontalLines.length, verticalLines.length])

  const selectedLabel = selectedLine
    ? `${selectedLine.axis === 'vertical' ? '纵线' : '横线'} ${selectedLine.index + 1}`
    : '未选择'

  const clearSlices = () => {
    setSlices([])
    setSelectedSliceNames([])
    setSelectionBox(null)
  }

  const applyGrid = (nextCols = cols, nextRows = rows) => {
    const safeCols = clampCount(nextCols)
    const safeRows = clampCount(nextRows)
    setCols(safeCols)
    setRows(safeRows)
    setVerticalLines(normalizeLines(linesFromCount(safeCols)))
    setHorizontalLines(normalizeLines(linesFromCount(safeRows)))
    setSelectedLine(null)
    clearSlices()
  }

  const clearAllLines = () => {
    setVerticalLines([])
    setHorizontalLines([])
    setSelectedLine(null)
    clearSlices()
  }

  const addLine = (axis: LineAxis) => {
    const lines = axis === 'vertical' ? verticalLines : horizontalLines
    const nextLine = lines.length === 0 ? 50 : Math.min(95, lines[lines.length - 1] + 10)
    const next = normalizeLines([...lines, nextLine])
    if (axis === 'vertical') setVerticalLines(next)
    else setHorizontalLines(next)
    setSelectedLine({ axis, index: next.findIndex((line) => Math.abs(line - nextLine) < 0.01) })
    clearSlices()
  }

  const deleteSelectedLine = () => {
    if (!selectedLine) return
    if (selectedLine.axis === 'vertical') {
      setVerticalLines((lines) => lines.filter((_, index) => index !== selectedLine.index))
    } else {
      setHorizontalLines((lines) => lines.filter((_, index) => index !== selectedLine.index))
    }
    setSelectedLine(null)
    clearSlices()
  }

  const updateDraggedLine = (clientX: number, clientY: number) => {
    if (!dragging || !stageRef.current) return
    const rect = stageRef.current.getBoundingClientRect()
    const pct =
      dragging.axis === 'vertical'
        ? ((clientX - rect.left) / rect.width) * 100
        : ((clientY - rect.top) / rect.height) * 100

    if (dragging.axis === 'vertical') {
      setVerticalLines((lines) => lines.map((line, index) =>
        index === dragging.index ? clampDraggedLine(pct, lines, index) : line,
      ))
    } else {
      setHorizontalLines((lines) => lines.map((line, index) =>
        index === dragging.index ? clampDraggedLine(pct, lines, index) : line,
      ))
    }
    clearSlices()
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging) return
    updateDraggedLine(event.clientX, event.clientY)
  }

  const handlePointerUp = () => {
    if (!dragging) return
    setDragging(null)
  }

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      showToast('请选择图片文件', 'error')
      return
    }
    try {
      const dataUrl = await readFileAsDataUrl(file)
      setSplitImageDataUrl(dataUrl)
    } catch (err) {
      showToast(`读取图片失败：${err instanceof Error ? err.message : String(err)}`, 'error')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const generateSlices = async () => {
    if (!image) {
      showToast('请先选择图片', 'error')
      return
    }
    setIsProcessing(true)
    clearSlices()

    try {
      const xStops = makeStops(verticalLines, image.naturalWidth)
      const yStops = makeStops(horizontalLines, image.naturalHeight)
      const nextSlices: SliceResult[] = []

      for (let row = 0; row < yStops.length - 1; row++) {
        for (let col = 0; col < xStops.length - 1; col++) {
          const sx = xStops[col]
          const sy = yStops[row]
          const sw = xStops[col + 1] - sx
          const sh = yStops[row + 1] - sy
          if (sw <= 0 || sh <= 0) continue

          const canvas = document.createElement('canvas')
          canvas.width = sw
          canvas.height = sh
          const ctx = canvas.getContext('2d')
          if (!ctx) throw new Error('当前浏览器不支持 Canvas')
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'
          ctx.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh)
          const blob = await canvasToBlob(canvas, 'image/png')
          nextSlices.push({
            blob,
            url: URL.createObjectURL(blob),
            name: `grid-slice-r${row + 1}-c${col + 1}.png`,
            width: sw,
            height: sh,
          })
        }
      }

      setSlices(nextSlices)
      setSelectedSliceNames([])
      showToast(`已生成 ${nextSlices.length} 张切片`, 'success')
    } catch (err) {
      console.error(err)
      showToast(err instanceof Error ? err.message : '切分失败', 'error')
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadZip = async () => {
    const selectedSlices = slices.filter((slice) => selectedSliceNames.includes(slice.name))
    if (!selectedSlices.length) {
      showToast('请先拖选要导出的切片', 'error')
      return
    }
    const entries: Record<string, Uint8Array> = {}
    for (const slice of selectedSlices) {
      entries[`slices/${slice.name}`] = new Uint8Array(await slice.blob.arrayBuffer())
    }
    const zipped = zipSync(entries, { level: 6 })
    downloadBlob(new Blob([zipped.buffer as ArrayBuffer], { type: 'application/zip' }), `grid-slices-${Date.now()}.zip`)
  }

  const selectedSliceSet = useMemo(() => new Set(selectedSliceNames), [selectedSliceNames])

  const selectAllSlices = () => setSelectedSliceNames(slices.map((slice) => slice.name))

  const clearSliceSelection = () => setSelectedSliceNames([])

  const toggleSliceSelection = (name: string) => {
    setSelectedSliceNames((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name],
    )
  }

  const updateSelectionFromBox = (box: NonNullable<SelectionBox>) => {
    if (!previewRef.current) return
    const minX = Math.min(box.startX, box.currentX)
    const maxX = Math.max(box.startX, box.currentX)
    const minY = Math.min(box.startY, box.currentY)
    const maxY = Math.max(box.startY, box.currentY)
    const next: string[] = []

    previewRef.current.querySelectorAll<HTMLElement>('[data-slice-card]').forEach((card) => {
      const name = card.dataset.sliceName
      if (!name) return
      const rect = card.getBoundingClientRect()
      const intersects = minX < rect.right && maxX > rect.left && minY < rect.bottom && maxY > rect.top
      if (intersects) next.push(name)
    })

    setSelectedSliceNames(next)
  }

  const handlePreviewPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!slices.length) return
    if (event.target instanceof Element && event.target.closest('[data-slice-download]')) return
    if (event.button !== 0) return

    selectionStartRef.current = { x: event.clientX, y: event.clientY }
    selectionDraggedRef.current = false
    setSelectionBox({
      startX: event.clientX,
      startY: event.clientY,
      currentX: event.clientX,
      currentY: event.clientY,
    })
    event.currentTarget.setPointerCapture(event.pointerId)
    event.preventDefault()
  }

  const handlePreviewPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!selectionStartRef.current) return
    const start = selectionStartRef.current
    const distance = Math.hypot(event.clientX - start.x, event.clientY - start.y)
    const box = {
      startX: start.x,
      startY: start.y,
      currentX: event.clientX,
      currentY: event.clientY,
    }

    setSelectionBox(box)
    if (distance >= 5) {
      selectionDraggedRef.current = true
      updateSelectionFromBox(box)
    }
  }

  const handlePreviewPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = selectionStartRef.current
    if (!start) return

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    if (!selectionDraggedRef.current && event.target instanceof Element) {
      const card = event.target.closest<HTMLElement>('[data-slice-card]')
      if (card?.dataset.sliceName) toggleSliceSelection(card.dataset.sliceName)
    }

    selectionStartRef.current = null
    selectionDraggedRef.current = false
    setSelectionBox(null)
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gray-50/70 pb-10 dark:bg-gray-950">
      <div className="safe-area-x mx-auto flex max-w-7xl flex-col gap-4 py-4">
        <div className="flex flex-col gap-3 border-b border-gray-200 pb-4 sm:flex-row sm:items-end sm:justify-between dark:border-white/[0.08]">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">宫格图切分工作台</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="rounded-md bg-white px-2 py-1 shadow-sm dark:bg-white/[0.06]">{image ? `${image.naturalWidth}×${image.naturalHeight}` : '未选择图片'}</span>
            <span className="rounded-md bg-white px-2 py-1 shadow-sm dark:bg-white/[0.06]">{verticalLines.length} 条纵线</span>
            <span className="rounded-md bg-white px-2 py-1 shadow-sm dark:bg-white/[0.06]">{horizontalLines.length} 条横线</span>
            <span className="rounded-md bg-white px-2 py-1 shadow-sm dark:bg-white/[0.06]">预计 {totalPieces} 张</span>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section className="min-h-[520px] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-white/[0.08] dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-white/[0.06]">
              <div>
                <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">画布与切线</h2>
                <p className="text-xs text-gray-400 dark:text-gray-500">点击线条选中，拖动改变位置</p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-950 dark:hover:bg-gray-200"
              >
                选择图片
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => void handleFile(event.target.files?.[0])}
              />
            </div>

            <div className="flex min-h-[460px] items-center justify-center bg-[linear-gradient(45deg,#f1f5f9_25%,transparent_25%,transparent_75%,#f1f5f9_75%),linear-gradient(45deg,#f1f5f9_25%,transparent_25%,transparent_75%,#f1f5f9_75%)] bg-[length:24px_24px] bg-[position:0_0,12px_12px] p-4 dark:bg-[linear-gradient(45deg,rgba(255,255,255,0.04)_25%,transparent_25%,transparent_75%,rgba(255,255,255,0.04)_75%),linear-gradient(45deg,rgba(255,255,255,0.04)_25%,transparent_25%,transparent_75%,rgba(255,255,255,0.04)_75%)]">
              {src ? (
                <div
                  ref={stageRef}
                  className="relative inline-flex max-h-[65vh] max-w-full touch-none overflow-hidden rounded-lg bg-black/90 shadow-2xl"
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                >
                  <img src={src} className="block max-h-[65vh] max-w-full object-contain" alt="" />
                  <div className="absolute inset-0">
                    {verticalLines.map((left, index) => (
                      <button
                        key={`v-${index}`}
                        type="button"
                        className={`absolute top-0 h-full w-6 -translate-x-1/2 cursor-ew-resize ${
                          selectedLine?.axis === 'vertical' && selectedLine.index === index ? 'text-blue-300' : 'text-white/85'
                        }`}
                        style={{ left: `${left}%` }}
                        onPointerDown={(event) => {
                          event.currentTarget.setPointerCapture(event.pointerId)
                          setSelectedLine({ axis: 'vertical', index })
                          setDragging({ axis: 'vertical', index })
                        }}
                        aria-label="纵向分割线"
                      >
                        <span className="mx-auto block h-full w-0.5 bg-current shadow-[0_0_0_1px_rgba(0,0,0,0.45)]" />
                      </button>
                    ))}
                    {horizontalLines.map((top, index) => (
                      <button
                        key={`h-${index}`}
                        type="button"
                        className={`absolute left-0 h-6 w-full -translate-y-1/2 cursor-ns-resize ${
                          selectedLine?.axis === 'horizontal' && selectedLine.index === index ? 'text-blue-300' : 'text-white/85'
                        }`}
                        style={{ top: `${top}%` }}
                        onPointerDown={(event) => {
                          event.currentTarget.setPointerCapture(event.pointerId)
                          setSelectedLine({ axis: 'horizontal', index })
                          setDragging({ axis: 'horizontal', index })
                        }}
                        aria-label="横向分割线"
                      >
                        <span className="my-auto block h-0.5 w-full bg-current shadow-[0_0_0_1px_rgba(0,0,0,0.45)]" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex min-h-72 w-full max-w-xl flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white/80 p-8 text-center transition hover:border-blue-300 hover:bg-blue-50/40 dark:border-white/[0.12] dark:bg-gray-900/70 dark:hover:border-blue-500/50 dark:hover:bg-blue-500/10"
                >
                  <GridIcon className="mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">选择一张图片开始切分</span>
                  <span className="mt-1 text-xs text-gray-400 dark:text-gray-500">支持从右键菜单带图进入，也支持本页上传</span>
                </button>
              )}
            </div>
          </section>

          <aside className="flex flex-col gap-4">
            <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-white/[0.08] dark:bg-gray-900">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                  <GridIcon className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">宫格规格</h2>
                  <p className="text-xs text-gray-400 dark:text-gray-500">列 × 行，禁止手输符号</p>
                </div>
              </div>

              <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
                <NumberBox label="列" value={cols} onChange={setCols} />
                <span className="pb-2 text-lg font-semibold text-gray-300 dark:text-gray-600">×</span>
                <NumberBox label="行" value={rows} onChange={setRows} />
              </div>
              <button
                onClick={() => applyGrid()}
                className="mt-3 w-full rounded-lg bg-blue-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-600"
              >
                应用宫格
              </button>
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-white/[0.08] dark:bg-gray-900">
              <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">切线管理</h2>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">当前选中：{selectedLabel}</p>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button onClick={() => addLine('vertical')} className="flex items-center justify-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50 dark:border-white/[0.08] dark:text-gray-200 dark:hover:bg-white/[0.05]">
                  <PlusIcon className="h-4 w-4" />
                  加纵线
                </button>
                <button onClick={() => addLine('horizontal')} className="flex items-center justify-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50 dark:border-white/[0.08] dark:text-gray-200 dark:hover:bg-white/[0.05]">
                  <PlusIcon className="h-4 w-4" />
                  加横线
                </button>
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  onClick={deleteSelectedLine}
                  disabled={!selectedLine}
                  className="flex items-center justify-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-500/30 dark:hover:bg-red-500/10"
                >
                  <TrashIcon className="h-4 w-4" />
                  删选中
                </button>
                <button
                  onClick={clearAllLines}
                  disabled={!verticalLines.length && !horizontalLines.length}
                  className="flex items-center justify-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-500/30 dark:hover:bg-red-500/10"
                >
                  <TrashIcon className="h-4 w-4" />
                  删除所有切线
                </button>
              </div>

              <div className="mt-3 max-h-40 overflow-y-auto rounded-lg bg-gray-50 p-2 text-xs dark:bg-white/[0.04]">
                {[...verticalLines.map((line, index) => ({ axis: 'vertical' as const, line, index })), ...horizontalLines.map((line, index) => ({ axis: 'horizontal' as const, line, index }))].length === 0 ? (
                  <div className="py-4 text-center text-gray-400">暂无切线</div>
                ) : (
                  <div className="flex flex-col gap-1">
                    {[...verticalLines.map((line, index) => ({ axis: 'vertical' as const, line, index })), ...horizontalLines.map((line, index) => ({ axis: 'horizontal' as const, line, index }))].map((item) => (
                      <button
                        key={`${item.axis}-${item.index}`}
                        onClick={() => setSelectedLine({ axis: item.axis, index: item.index })}
                        className={`flex items-center justify-between rounded px-2 py-1 text-left transition ${
                          selectedLine?.axis === item.axis && selectedLine.index === item.index
                            ? 'bg-blue-500 text-white'
                            : 'text-gray-500 hover:bg-white dark:text-gray-300 dark:hover:bg-white/[0.06]'
                        }`}
                      >
                        <span>{item.axis === 'vertical' ? '纵线' : '横线'} {item.index + 1}</span>
                        <span>{formatPercent(item.line)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-white/[0.08] dark:bg-gray-900">
              <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">导出</h2>
              <div className="mt-3 grid gap-2">
                <button
                  onClick={generateSlices}
                  disabled={!image || isProcessing}
                  className="flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-gray-950 dark:hover:bg-gray-200"
                >
                  <GridIcon className="h-4 w-4" />
                  {isProcessing ? '生成中...' : '生成切片预览'}
                </button>
                <button
                  onClick={downloadZip}
                  disabled={!selectedSliceNames.length}
                  className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <DownloadIcon className="h-4 w-4" />
                  打包下载选中 ZIP
                </button>
                <button
                  onClick={clearSlices}
                  disabled={!slices.length}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/[0.08] dark:text-gray-300 dark:hover:bg-white/[0.05]"
                >
                  清空预览结果
                </button>
              </div>
            </section>
          </aside>
        </div>

        <section className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-white/[0.08] dark:bg-gray-900">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-white/[0.06]">
            <div>
              <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">切片预览</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500">鼠标拖框选择切片；只有选中的切片会被导出</p>
            </div>
            <div className="flex items-center gap-2">
              {slices.length > 0 && (
                <>
                  <button
                    onClick={selectAllSlices}
                    className="rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600 transition hover:bg-gray-50 dark:border-white/[0.08] dark:text-gray-300 dark:hover:bg-white/[0.05]"
                  >
                    全选
                  </button>
                  <button
                    onClick={clearSliceSelection}
                    disabled={!selectedSliceNames.length}
                    className="rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/[0.08] dark:text-gray-300 dark:hover:bg-white/[0.05]"
                  >
                    清空选择
                  </button>
                </>
              )}
              <span className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-500 dark:bg-white/[0.06] dark:text-gray-400">
                已选 {selectedSliceNames.length} / {slices.length}
              </span>
            </div>
          </div>
          {slices.length ? (
            <div
              ref={previewRef}
              className="relative grid touch-none grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
              onPointerDown={handlePreviewPointerDown}
              onPointerMove={handlePreviewPointerMove}
              onPointerUp={handlePreviewPointerUp}
              onPointerCancel={handlePreviewPointerUp}
            >
              {slices.map((slice) => (
                <div
                  key={slice.name}
                  data-slice-card
                  data-slice-name={slice.name}
                  className={`group relative overflow-hidden rounded-lg border bg-white text-left transition dark:bg-gray-950 ${
                    selectedSliceSet.has(slice.name)
                      ? 'border-blue-500 ring-2 ring-blue-500/40'
                      : 'border-gray-200 hover:border-blue-200 hover:shadow-md dark:border-white/[0.08] dark:hover:border-blue-500/40'
                  }`}
                  title="点击选择，或拖框批量选择"
                >
                  <div className="aspect-square bg-gray-50 dark:bg-black/30">
                    <img src={slice.url} className="h-full w-full object-contain" alt="" />
                  </div>
                  {selectedSliceSet.has(slice.name) && (
                    <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white shadow-sm">
                      ✓
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-2 border-t border-gray-100 px-2 py-1.5 text-[11px] text-gray-500 dark:border-white/[0.06] dark:text-gray-400">
                    <span className="truncate">{slice.name}</span>
                    <span className="shrink-0">{slice.width}×{slice.height}</span>
                  </div>
                  {selectedSliceSet.has(slice.name) && (
                    <button
                      data-slice-download
                      onClick={(event) => {
                        event.stopPropagation()
                        downloadBlob(slice.blob, slice.name)
                      }}
                      className="absolute inset-x-2 bottom-8 rounded-md bg-gray-900/90 px-2 py-1 text-xs font-medium text-white shadow-sm transition hover:bg-gray-950"
                    >
                      下载此切片
                    </button>
                  )}
                </div>
              ))}
              {selectionBox && selectionDraggedRef.current && (
                <div
                  className="fixed z-[80] pointer-events-none border border-blue-500/70 bg-blue-500/15"
                  style={{
                    left: Math.min(selectionBox.startX, selectionBox.currentX),
                    top: Math.min(selectionBox.startY, selectionBox.currentY),
                    width: Math.abs(selectionBox.currentX - selectionBox.startX),
                    height: Math.abs(selectionBox.currentY - selectionBox.startY),
                  }}
                />
              )}
            </div>
          ) : (
            <div className="px-4 py-12 text-center text-sm text-gray-400 dark:text-gray-500">生成切片后会在这里预览结果</div>
          )}
        </section>
      </div>
    </div>
  )
}

function NumberBox({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label>
      <span className="mb-1 block text-xs text-gray-500 dark:text-gray-400">{label}</span>
      <input
        type="number"
        min={1}
        max={MAX_GRID_COUNT}
        value={value}
        onChange={(event) => onChange(clampCount(Number(event.target.value)))}
        className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-center text-sm font-semibold text-gray-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-gray-100 dark:focus:ring-blue-500/20"
      />
    </label>
  )
}
