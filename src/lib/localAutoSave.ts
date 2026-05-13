type DirectoryHandle = {
  name: string
  getFileHandle: (name: string, options?: { create?: boolean }) => Promise<{
    createWritable: () => Promise<{
      write: (data: Blob) => Promise<void>
      close: () => Promise<void>
    }>
  }>
}

type WindowWithDirectoryPicker = Window & {
  showDirectoryPicker?: (options?: { mode?: 'read' | 'readwrite' }) => Promise<DirectoryHandle>
}

let directoryHandle: DirectoryHandle | null = null
let missingDirectoryNotified = false

export function isAutoSaveSupported() {
  return typeof window !== 'undefined' && typeof (window as WindowWithDirectoryPicker).showDirectoryPicker === 'function'
}

export function getAutoSaveDirectoryName() {
  return directoryHandle?.name ?? null
}

export function hasAutoSaveDirectory() {
  return Boolean(directoryHandle)
}

export async function selectAutoSaveDirectory() {
  const picker = (window as WindowWithDirectoryPicker).showDirectoryPicker
  if (!picker) throw new Error('当前浏览器不支持选择本地目录，请使用 Chrome 或 Edge。')
  directoryHandle = await picker({ mode: 'readwrite' })
  missingDirectoryNotified = false
  return directoryHandle.name
}

export function clearAutoSaveDirectory() {
  directoryHandle = null
}

export function shouldNotifyMissingDirectory() {
  if (directoryHandle || missingDirectoryNotified) return false
  missingDirectoryNotified = true
  return true
}

export async function saveDataUrlToAutoSaveDirectory(dataUrl: string, filename: string) {
  if (!directoryHandle) return false

  const response = await fetch(dataUrl)
  const blob = await response.blob()
  const fileHandle = await directoryHandle.getFileHandle(filename, { create: true })
  const writable = await fileHandle.createWritable()
  await writable.write(blob)
  await writable.close()
  return true
}

export function sanitizeFilenamePart(value: string) {
  return value
    .trim()
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .slice(0, 48)
    || 'image'
}
