import { useEffect, useState } from 'react'
import { ensureImageCached, useStore } from '../store'
import { loadImage } from '../lib/canvasImage'

export function useSlicerImage() {
  const imageId = useStore((s) => s.splitImageId)
  const splitImageDataUrl = useStore((s) => s.splitImageDataUrl)
  const setSplitImageId = useStore((s) => s.setSplitImageId)
  const setSplitImageDataUrl = useStore((s) => s.setSplitImageDataUrl)
  const showToast = useStore((s) => s.showToast)

  const [src, setSrc] = useState('')
  const [image, setImage] = useState<HTMLImageElement | null>(null)

  useEffect(() => {
    let cancelled = false
    setSrc('')
    setImage(null)

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

  return { src, image, setSplitImageDataUrl, showToast }
}
