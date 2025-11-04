/**
 * ConversationList.tsx
 * Sidebar list of user conversations with actions: select, create, share, delete.
 */

import React from 'react'
import { MessageSquareText, Plus, Share2, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

/** Metadata for one conversation entry in the sidebar. */
export interface ConversationMeta {
  id: string
  title: string
  updatedAt: number
}

/** Props for ConversationList component. */
interface ConversationListProps {
  items: ConversationMeta[]
  activeId: string | null
  onSelect: (id: string) => void
  onCreate: () => void
  onShare?: (id: string) => void
  onDelete?: (id: string) => void
}

/**
 * ConversationList
 * Renders a vertical sidebar with conversations and small action icons.
 */
const ConversationList: React.FC<ConversationListProps> = ({
  items,
  activeId,
  onSelect,
  onCreate,
  onShare,
  onDelete,
}) => {
  const { t } = useTranslation()
  return (
    <aside className="w-72 shrink-0 border-r bg-white/70 dark:bg-neutral-950/70 backdrop-blur supports-[backdrop-filter]:bg-white/50 flex flex-col min-h-0">
      <div className="p-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <MessageSquareText className="w-4 h-4" />
          <span>{t('conversation')}</span>
        </div>
        <button
          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-neutral-900 text-white hover:bg-neutral-800"
          onClick={onCreate}
          aria-label={t('newChat') ?? 'New chat'}
          title={t('newChat') ?? 'New chat'}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t('newChat') ?? 'New'}</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="p-3 text-xs text-neutral-500">No conversations yet.</div>
        ) : (
          <ul className="divide-y">
            {items
              .slice()
              .sort((a, b) => b.updatedAt - a.updatedAt)
              .map((c) => (
                <li key={c.id} className={`group ${activeId === c.id ? 'bg-neutral-50 dark:bg-neutral-900' : ''}`}>
                  <div className="flex items-center gap-2 px-2">
                    <button
                      onClick={() => onSelect(c.id)}
                      className="flex-1 text-left py-3"
                      title={c.title}
                    >
                      <div className="text-sm font-medium line-clamp-1">{c.title}</div>
                      <div className="text-[11px] text-neutral-500">
                        {new Date(c.updatedAt).toLocaleString()}
                      </div>
                    </button>

                    {onShare && (
                      <button
                        onClick={() => onShare(c.id)}
                        className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 opacity-70 group-hover:opacity-100"
                        aria-label={t('shareToForum') ?? 'Share to forum'}
                        title={t('shareToForum') ?? 'Share to forum'}
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(c.id)}
                        className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-rose-600 opacity-70 group-hover:opacity-100"
                        aria-label="Delete chat"
                        title="Delete chat"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </li>
              ))}
          </ul>
        )}
      </div>
    </aside>
  )
}

export default ConversationList
