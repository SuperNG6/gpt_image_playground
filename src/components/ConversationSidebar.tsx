import { useMemo } from 'react'
import { useStore } from '../store'
import { PlusIcon } from './icons'

function formatTime(ts: number) {
  const date = new Date(ts)
  const now = new Date()
  const sameDay = date.toDateString() === now.toDateString()
  if (sameDay) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
}

function getStatusLabel(status: string) {
  if (status === 'running') return '生成中'
  if (status === 'error') return '失败'
  return '完成'
}

export default function ConversationSidebar() {
  const tasks = useStore((s) => s.tasks)
  const conversations = useStore((s) => s.conversations)
  const activeConversationId = useStore((s) => s.activeConversationId)
  const createConversation = useStore((s) => s.createConversation)
  const selectConversation = useStore((s) => s.selectConversation)
  const setPrompt = useStore((s) => s.setPrompt)
  const clearInputImages = useStore((s) => s.clearInputImages)
  const clearMaskDraft = useStore((s) => s.clearMaskDraft)
  const clearSelection = useStore((s) => s.clearSelection)
  const setSearchQuery = useStore((s) => s.setSearchQuery)
  const setFilterStatus = useStore((s) => s.setFilterStatus)
  const setFilterFavorite = useStore((s) => s.setFilterFavorite)
  const setDetailTaskId = useStore((s) => s.setDetailTaskId)
  const showToast = useStore((s) => s.showToast)

  const recentConversations = useMemo(
    () => [...conversations].sort((a, b) => b.updatedAt - a.updatedAt),
    [conversations],
  )
  const conversationMeta = useMemo(() => {
    const meta = new Map<string, { count: number; latestTaskStatus: string | null; latestTaskTime: number | null; imageCount: number }>()
    for (const task of tasks) {
      if (!task.conversationId) continue
      const current = meta.get(task.conversationId)
      if (!current || task.createdAt > (current.latestTaskTime ?? 0)) {
        meta.set(task.conversationId, {
          count: (current?.count ?? 0) + 1,
          latestTaskStatus: task.status,
          latestTaskTime: task.createdAt,
          imageCount: (current?.imageCount ?? 0) + task.outputImages.length,
        })
      } else {
        meta.set(task.conversationId, {
          ...current,
          count: current.count + 1,
          imageCount: current.imageCount + task.outputImages.length,
        })
      }
    }
    return meta
  }, [tasks])

  const startNewConversation = () => {
    createConversation()
    setPrompt('')
    clearInputImages()
    clearMaskDraft()
    clearSelection()
    setSearchQuery('')
    setFilterStatus('all')
    setFilterFavorite(false)
    setDetailTaskId(null)
    showToast('已新建对话', 'success')
  }

  const openConversation = (id: string) => {
    selectConversation(id)
    setPrompt('')
    clearInputImages()
    clearMaskDraft()
    clearSelection()
    setSearchQuery('')
    setFilterStatus('all')
    setFilterFavorite(false)
    setDetailTaskId(null)
  }

  return (
    <aside
      data-no-drag-select
      className="safe-area-x md:safe-area-top md:fixed md:left-0 md:top-14 md:bottom-0 md:z-30 md:w-72 md:border-r md:border-gray-200 md:bg-gray-50/90 md:px-3 md:py-4 md:backdrop-blur dark:md:border-white/[0.08] dark:md:bg-gray-950/90"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-3 md:h-full md:max-w-none">
        <button
          onClick={startNewConversation}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-3 text-sm font-medium text-white shadow-sm transition hover:bg-gray-800 dark:bg-white dark:text-gray-950 dark:hover:bg-gray-200"
        >
          <PlusIcon className="h-4 w-4" />
          新建对话
        </button>

        <div className="rounded-lg border border-gray-200 bg-white shadow-sm md:flex md:min-h-0 md:flex-1 md:flex-col dark:border-white/[0.08] dark:bg-gray-900">
          <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2 dark:border-white/[0.06]">
            <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400">最近对话</h2>
            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-500 dark:bg-white/[0.06] dark:text-gray-400">
              {recentConversations.length}
            </span>
          </div>

          <div className="max-h-64 overflow-y-auto p-2 md:max-h-none md:min-h-0 md:flex-1">
            {recentConversations.length === 0 ? (
              <p className="px-2 py-8 text-center text-xs text-gray-400 dark:text-gray-500">暂无最近对话</p>
            ) : (
              <div className="flex flex-col gap-1">
                {recentConversations.map((conversation) => {
                  const meta = conversationMeta.get(conversation.id)
                  const isActive = conversation.id === activeConversationId
                  return (
                    <button
                      key={conversation.id}
                      onClick={() => openConversation(conversation.id)}
                      className={`group rounded-md px-2 py-2 text-left transition ${
                        isActive
                          ? 'bg-blue-50 ring-1 ring-blue-200 dark:bg-blue-500/10 dark:ring-blue-400/30'
                          : 'hover:bg-gray-100 dark:hover:bg-white/[0.05]'
                      }`}
                      title={conversation.title}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            meta?.latestTaskStatus === 'running'
                              ? 'bg-blue-500'
                              : meta?.latestTaskStatus === 'error'
                              ? 'bg-red-500'
                              : meta?.latestTaskStatus === 'done'
                              ? 'bg-emerald-500'
                              : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        />
                        <span className={`min-w-0 flex-1 truncate text-sm ${
                          isActive
                            ? 'font-semibold text-gray-950 dark:text-white'
                            : 'text-gray-700 group-hover:text-gray-950 dark:text-gray-200 dark:group-hover:text-white'
                        }`}>
                          {conversation.title || '新对话'}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between pl-3.5 text-[11px] text-gray-400 dark:text-gray-500">
                        <span>{formatTime(conversation.updatedAt)}</span>
                        <span>
                          {meta
                            ? `${getStatusLabel(meta.latestTaskStatus || 'done')} · ${meta.count} 条 · ${meta.imageCount} 图`
                            : '空对话'}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}
