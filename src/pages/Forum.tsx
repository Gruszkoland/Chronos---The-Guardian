/**
 * Forum.tsx
 * Simple forum to share and read AI responses published by users.
 */

import React, { useEffect, useMemo, useState } from 'react'
import Header from '../components/Header'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'

/** Storage key shared with Chat. */
const FORUM_KEY = 'chronos.forum.posts'

/** One forum post. */
interface ForumPost {
  id: string
  title: string
  content: string
  authorEmail: string
  createdAt: number
}

/** Forum page listing posts and showing details. */
const ForumPage: React.FC = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [active, setActive] = useState<ForumPost | null>(null)

  useEffect(() => {
    const raw = localStorage.getItem(FORUM_KEY)
    const list = raw ? (JSON.parse(raw) as ForumPost[]) : []
    setPosts(list)
    setActive(list[0] ?? null)
  }, [])

  const list = useMemo(() => posts.sort((a, b) => b.createdAt - a.createdAt), [posts])

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8 grid md:grid-cols-3 gap-6">
        <aside className="md:col-span-1">
          <div className="bg-white dark:bg-neutral-950 border rounded-lg overflow-hidden">
            <div className="p-3 border-b text-sm font-medium">Posts</div>
            <ul className="divide-y">
              {list.length === 0 ? (
                <li className="p-3 text-sm text-neutral-500">{t('forumEmpty')}</li>
              ) : (
                list.map((p) => (
                  <li key={p.id}>
                    <button
                      onClick={() => setActive(p)}
                      className={`w-full text-left p-3 hover:bg-neutral-50 dark:hover:bg-neutral-900 ${
                        active?.id === p.id ? 'bg-neutral-50 dark:bg-neutral-900' : ''
                      }`}
                    >
                      <div className="text-sm font-medium line-clamp-1">{p.title}</div>
                      <div className="text-[11px] text-neutral-500">
                        {new Date(p.createdAt).toLocaleString()} • {p.authorEmail}
                      </div>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </aside>
        <section className="md:col-span-2">
          {active ? (
            <article className="bg-white dark:bg-neutral-950 border rounded-lg p-5">
              <h2 className="text-lg font-semibold">{active.title}</h2>
              <div className="mt-3 whitespace-pre-wrap text-sm leading-7">{active.content}</div>
              <div className="mt-6 text-xs text-neutral-500">
                {new Date(active.createdAt).toLocaleString()} • {active.authorEmail}
              </div>
            </article>
          ) : (
            <div className="text-sm text-neutral-500">{t('forumEmpty')}</div>
          )}
        </section>
      </main>
    </div>
  )
}

export default ForumPage
