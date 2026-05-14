import { storeImage, getImage } from './db'

const STORAGE_KEY = 'gpt-image-slicer-history'
const MAX_ENTRIES = 30
const THUMB_SIZE = 80

export interface SlicerHistoryEntry {
  id: string
  imageId: string
  thumb: string
  timestamp: number
  cols: number
  rows: number
  vLines: number[]
  hLines: number[]
}

export function getSlicerHistory(): SlicerHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as SlicerHistoryEntry[]) : []
  } catch {
    return []
  }
}

function saveHistory(entries: SlicerHistoryEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

export async function saveSlicerEntry(
  dataUrl: string,
  cols: number,
  rows: number,
  vLines: number[],
  hLines: number[],
): Promise<SlicerHistoryEntry> {
  const [imageId, thumb] = await Promise.all([storeImage(dataUrl, 'upload'), createThumb(dataUrl, THUMB_SIZE)])
  const entry: SlicerHistoryEntry = {
    id: crypto.randomUUID(),
    imageId,
    thumb,
    timestamp: Date.now(),
    cols,
    rows,
    vLines: [...vLines],
    hLines: [...hLines],
  }
  const history = getSlicerHistory()
  saveHistory([entry, ...history].slice(0, MAX_ENTRIES))
  return entry
}

export function deleteSlicerEntry(id: string): void {
  const history = getSlicerHistory()
  saveHistory(history.filter((e) => e.id !== id))
}

export async function loadSlicerImage(imageId: string): Promise<string | null> {
  const stored = await getImage(imageId)
  return stored?.dataUrl ?? null
}

function createThumb(src: string, maxSize: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.7))
    }
    img.onerror = () => resolve('')
    img.src = src
  })
}
