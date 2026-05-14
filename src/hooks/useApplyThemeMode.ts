import { useEffect } from 'react'
import type { ThemeMode } from '../types'

function getSystemPrefersDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function applyThemeMode(themeMode: ThemeMode) {
  const shouldUseDark = themeMode === 'dark' || (themeMode === 'auto' && getSystemPrefersDark())
  document.documentElement.classList.toggle('dark', shouldUseDark)
  document.documentElement.dataset.theme = themeMode
  document.documentElement.style.colorScheme = shouldUseDark ? 'dark' : 'light'
}

export function useApplyThemeMode(themeMode: ThemeMode) {
  useEffect(() => {
    applyThemeMode(themeMode)

    if (themeMode !== 'auto') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyThemeMode(themeMode)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [themeMode])
}
