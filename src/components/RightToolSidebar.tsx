import { useState } from 'react'
import { useStore } from '../store'
import {
  clearAutoSaveDirectory,
  getAutoSaveDirectoryName,
  hasAutoSaveDirectory,
  isAutoSaveSupported,
  selectAutoSaveDirectory,
} from '../lib/localAutoSave'
import { DownloadIcon, GridIcon } from './icons'

export default function RightToolSidebar() {
  const settings = useStore((s) => s.settings)
  const setSettings = useStore((s) => s.setSettings)
  const showToast = useStore((s) => s.showToast)
  const [directoryName, setDirectoryName] = useState(getAutoSaveDirectoryName())

  const openSlicerPage = () => {
    window.location.hash = '#/slicer'
  }

  const chooseDirectory = async () => {
    try {
      const name = await selectAutoSaveDirectory()
      setDirectoryName(name)
      setSettings({ autoSaveToDirectory: true })
      showToast('自动保存目录已选择', 'success')
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      showToast(err instanceof Error ? err.message : '选择目录失败', 'error')
    }
  }

  const toggleAutoSave = async (checked: boolean) => {
    if (!checked) {
      setSettings({ autoSaveToDirectory: false })
      return
    }
    if (!isAutoSaveSupported()) {
      showToast('当前浏览器不支持自动保存到本地目录', 'error')
      return
    }
    if (!hasAutoSaveDirectory()) {
      await chooseDirectory()
      return
    }
    setSettings({ autoSaveToDirectory: true })
  }

  const resetDirectory = () => {
    clearAutoSaveDirectory()
    setDirectoryName(null)
    setSettings({ autoSaveToDirectory: false })
  }

  return (
    <aside
      data-no-drag-select
      className="safe-area-x lg:safe-area-top lg:fixed lg:right-0 lg:top-14 lg:bottom-0 lg:z-30 lg:w-80 lg:border-l lg:border-gray-200 lg:bg-white/90 lg:px-3 lg:py-4 lg:backdrop-blur dark:lg:border-white/[0.08] dark:lg:bg-gray-950/90"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-3 lg:h-full lg:max-w-none lg:overflow-y-auto">
        <section className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-white/[0.08] dark:bg-gray-900">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
              <GridIcon className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">宫格图切分</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500">独立切分木块</p>
            </div>
          </div>
          <button
            onClick={openSlicerPage}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-3 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-gray-800 dark:bg-blue-500 dark:text-white dark:hover:bg-blue-400"
          >
            <GridIcon className="h-4 w-4" />
            进入切分页
          </button>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-white/[0.08] dark:bg-gray-900">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">对话上下文</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500">把最近任务摘要加入下一次请求</p>
          </div>
          <label className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2 dark:bg-white/[0.04]">
            <span className="text-sm text-gray-700 dark:text-gray-200">启用上下文</span>
            <input
              type="checkbox"
              checked={settings.useConversationContext}
              onChange={(event) => setSettings({ useConversationContext: event.target.checked })}
              className="h-4 w-4"
            />
          </label>
          <div className="mt-3">
            <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">保留条数</label>
            <select
              value={settings.conversationContextCount}
              onChange={(event) => setSettings({ conversationContextCount: Number(event.target.value) })}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-gray-100"
            >
              <option value={3}>最近 3 条</option>
              <option value={5}>最近 5 条</option>
              <option value={10}>最近 10 条</option>
              <option value={20}>最近 20 条</option>
            </select>
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-white/[0.08] dark:bg-gray-900">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
              <DownloadIcon className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">自动保存到本地</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500">生成完成后写入授权目录</p>
            </div>
          </div>
          <label className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2 dark:bg-white/[0.04]">
            <span className="text-sm text-gray-700 dark:text-gray-200">启用自动保存</span>
            <input
              type="checkbox"
              checked={settings.autoSaveToDirectory}
              onChange={(event) => void toggleAutoSave(event.target.checked)}
              className="h-4 w-4"
            />
          </label>
          <button
            onClick={() => void chooseDirectory()}
            className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50 dark:border-white/[0.08] dark:text-gray-200 dark:hover:bg-white/[0.05]"
          >
            {directoryName ? `目录：${directoryName}` : '选择保存目录'}
          </button>
          {directoryName && (
            <button
              onClick={resetDirectory}
              className="mt-2 w-full rounded-lg px-3 py-2 text-sm text-red-500 transition hover:bg-red-50 dark:hover:bg-red-500/10"
            >
              重置目录
            </button>
          )}
          <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">
            目录授权只在当前浏览器会话中保留；刷新后如需自动保存，请重新选择目录。
          </p>
        </section>
      </div>
    </aside>
  )
}
