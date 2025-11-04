/**
 * Chat.tsx
 * Chat interface with conversation history (per user), message list, composer,
 * share-to-forum modal, delete conversation action, and model selection toolbar.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react'
import Header from '../components/Header'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { generateGeminiResponse, ChatMessage, UserContext } from '../lib/gemini'
import { fetchForumPosts, ForumPost as LibForumPost } from '../lib/forum' // Importujemy z nowego pliku
import ConversationList, { ConversationMeta } from '../components/Chat/ConversationList'
import MessageBubble from '../components/Chat/MessageBubble'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { useSettings } from '../context/SettingsContext'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { useToast } from '../hooks/use-toast' // Importujemy useToast

/** Storage keys for chat and forum. */
const CHATS_KEY_PREFIX = 'chronos.chats.'
const FORUM_KEY = 'chronos.forum.posts'

/** One forum post representation stored in localStorage. */
interface ForumPost { // Zmieniamy nazwę, aby uniknąć konfliktu z LibForumPost
  id: string
  title: string
  content: string
  authorEmail: string
  createdAt: number
}

/**
 * ChatPage
 * Left: conversation sidebar with create/share/delete.
 * Right: chat messages and composer with share-to-forum.
 * Top-right toolbar: Gemini model selector affecting API calls immediately.
 */
const ChatPage: React.FC = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { settings: geminiSettings, update: updateSettings } = useSettings()
  const { toast } = useToast() // Inicjalizacja useToast

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null) // Nowy stan błędu
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [conversations, setConversations] = useState<ConversationMeta[]>([])

  // Share-to-forum modal state
  const [shareOpen, setShareOpen] = useState(false)
  const [shareTitle, setShareTitle] = useState('')
  const [shareContent, setShareContent] = useState('')

  const bottomRef = useRef<HTMLDivElement>(null)

  // Guard for non-logged users
  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50">
        <Header />
        <main className="mx-auto max-w-3xl px-4 py-10">
          <p className="text-sm">{t('loginToContinue')}</p>
        </main>
      </div>
    )
  }

  /** Key for current user's conversations in localStorage. */
  const chatsKey = useMemo(() => CHATS_KEY_PREFIX + user.email, [user.email])

  // Load conversations on mount / user change
  useEffect(() => {
    const raw = localStorage.getItem(chatsKey)
    const store = raw ? (JSON.parse(raw) as Record<string, ChatMessage[]>) : {}
    const convs = buildConversations(store)
    setConversations(convs)
    if (convs.length > 0) {
      setActiveId(convs.sort((a, b) => b.updatedAt - a.updatedAt)[0].id)
    } else {
      const id = createConversation(store, chatsKey)
      setActiveId(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatsKey])

  // Load messages for active conversation
  useEffect(() => {
    if (!activeId) return
    const raw = localStorage.getItem(chatsKey)
    const store = raw ? (JSON.parse(raw) as Record<string, ChatMessage[]>) : {}
    setMessages(store[activeId] ?? [])
  }, [activeId, chatsKey])

  // Scroll to bottom when messages or loading change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  /**
   * saveMessages
   * Persist given messages under conversation id, and update the sidebar list.
   */
  const saveMessages = (id: string, msgs: ChatMessage[]) => {
    const raw = localStorage.getItem(chatsKey)
    const store = raw ? (JSON.parse(raw) as Record<string, ChatMessage[]>) : {}
    store[id] = msgs
    localStorage.setItem(chatsKey, JSON.stringify(store))
    setConversations(buildConversations(store))
  }

  /** Create new empty conversation and switch to it. */
  const onCreate = () => {
    const raw = localStorage.getItem(chatsKey)
    const store = raw ? (JSON.parse(raw) as Record<string, ChatMessage[]>) : {}
    const id = createConversation(store, chatsKey)
    setActiveId(id)
  }

  /**
   * Delete conversation and pick a new active if needed.
   * Shows a simple confirm prompt.
   */
  const onDeleteConversation = (id: string) => {
    const ok = window.confirm('Delete this chat?')
    if (!ok) return
    const raw = localStorage.getItem(chatsKey)
    const store = raw ? (JSON.parse(raw) as Record<string, ChatMessage[]>) : {}
    if (!store[id]) return
    delete store[id]
    localStorage.setItem(chatsKey, JSON.stringify(store))
    const convs = buildConversations(store)
    setConversations(convs)

    if (activeId === id) {
      if (convs.length > 0) {
        const nextId = convs.sort((a, b) => b.updatedAt - a.updatedAt)[0].id
        setActiveId(nextId)
      } else {
        const newId = createConversation(store, chatsKey)
        setActiveId(newId)
      }
    }
  }

  /**
   * onSend
   * Sends user prompt to Gemini and appends model reply. Saves to localStorage.
   */
  const onSend = async () => {
    if (!input.trim() || !activeId) return

    setLoading(true);
    setError(null); // Resetuj błąd przed nowym zapytaniem

    try {
      // 1. Zbierz kontekst użytkownika i jego postów
      const userContext = await getUserContext(); // Teraz getUserContext jest async

      const userMsg: ChatMessage = { role: 'user', content: input.trim(), createdAt: Date.now() };
      const next = [...messages, userMsg];
      setMessages(next);
      saveMessages(activeId, next);
      setInput('');

      // 2. Przekaż kontekst do API Gemini
      const replyText = await generateGeminiResponse(next, geminiSettings, userContext);
      const modelMsg: ChatMessage = { role: 'model', content: replyText, createdAt: Date.now() };
      const finalMsgs = [...next, modelMsg];
      setMessages(finalMsgs);
      saveMessages(activeId, finalMsgs);
    } catch (e: any) {
      const errorMessage = e.message || t('unknownError');
      toast({
        title: t('error'),
        description: t('failedToGetGeminiResponse') + `: ${errorMessage}`,
        variant: 'destructive',
      });
      setError(errorMessage);
      const errMsg: ChatMessage = {
        role: 'model',
        content: `Error: ${errorMessage}`,
        createdAt: Date.now(),
      };
      const finalMsgs = [...messages, errMsg]; // Dodaj błąd do istniejących wiadomości
      setMessages(finalMsgs);
      saveMessages(activeId, finalMsgs);
    } finally {
      setLoading(false);
    }
  };

  /**
   * getUserContext
   * Gathers user data and their forum posts to create a context object.
   */
  const getUserContext = async (): Promise<UserContext | null> => {
    if (!user) return null

    try {
      const forumPosts = await fetchForumPosts(user.id); // Używamy user.id do pobierania postów
      const userPosts = forumPosts.map(p => ({ content: p.content }));

      return {
        user: {
          id: user.id,
          name: user.email,
        },
        forumPosts: userPosts,
      };
    } catch (err: any) {
      toast({
        title: t('error'),
        description: t('failedToLoadForumPosts') + `: ${err.message}`,
        variant: 'destructive',
      });
      setError(err.message);
      return null;
    }
  };

  /**
   * onShare
   * Opens a modal pre-filled with the last model answer from the chosen conversation (or active).
   */
  const onShare = (conversationId?: string) => {
    let msgs = messages
    if (conversationId && conversationId !== activeId) {
      const raw = localStorage.getItem(chatsKey)
      const store = raw ? (JSON.parse(raw) as Record<string, ChatMessage[]>) : {}
      msgs = store[conversationId] ?? []
    }
    const lastModel = [...msgs].reverse().find((m) => m.role === 'model')
    if (!lastModel) return
    setShareTitle(titleFromMessages(msgs) || 'Chronos insight')
    setShareContent(lastModel.content)
    setShareOpen(true)
  }

  /** submitShare: Persist a new post in the forum store. */
  const submitShare = () => {
    if (!shareTitle.trim() || !shareContent.trim()) return
    const raw = localStorage.getItem(FORUM_KEY)
    const posts = raw ? (JSON.parse(raw) as ForumPost[]) : []
    const post: ForumPost = {
      id: Math.random().toString(36).slice(2),
      title: shareTitle.trim(),
      content: shareContent,
      authorEmail: user!.email,
      createdAt: Date.now(),
    }
    localStorage.setItem(FORUM_KEY, JSON.stringify([post, ...posts]))
    setShareOpen(false)
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50 flex flex-col">
      <Header />
      <div className="flex flex-1 min-h-0">
        <ConversationList
          items={conversations}
          activeId={activeId}
          onSelect={setActiveId}
          onCreate={onCreate}
          onDelete={onDeleteConversation}
          onShare={onShare}
        />
        <main className="flex-1 flex flex-col">
          {/* Top toolbar: model selector */}
          <div className="border-b px-4 py-2">
            <div className="mx-auto max-w-3xl flex items-center justify-end gap-3">
              <span className="text-xs opacity-70">Model</span>
              <Select
                value={geminiSettings.model || 'gemini-1.5-flash'}
                onValueChange={(v) => updateSettings({ model: v })}
              >
                <SelectTrigger className="h-8 w-[220px]">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini-1.5-flash">gemini-1.5-flash</SelectItem>
                  <SelectItem value="gemini-1.5-flash-8b">gemini-1.5-flash-8b</SelectItem>
                  <SelectItem value="gemini-1.5-pro">gemini-1.5-pro</SelectItem>
                  <SelectItem value="gemini-2.0-flash-exp">gemini-2.0-flash-exp</SelectItem>
                  <SelectItem value="gemini-2.0-flash-thinking-exp">gemini-2.0-flash-thinking-exp</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <div className="mx-auto max-w-2xl text-center mt-12">
                <img src="https://pub-cdn.sider.ai/u/U09GHJWRWE/web-coder/6901d0e561d18d6576f5ff8a/resource/99d794a3-8f38-4e2c-bf67-4cc0f3be1679.jpg" className="object-cover w-full rounded-xl" />
                <p className="mt-6 text-sm opacity-70"> {t('placeholderPrompt')} </p>
              </div>
            ) : (
              <div className="mx-auto max-w-3xl">
                {messages.map((m, idx) => (
                  <MessageBubble key={idx} message={m} />
                ))}
                <div ref={bottomRef} />
              </div>
            )}
          </div>
          <div className="border-t p-3">
            <div className="mx-auto max-w-3xl flex items-center gap-2">
              <Input
                placeholder={t('placeholderPrompt')!}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    onSend()
                  }
                }}
              />
              <Button onClick={onSend} disabled={loading}>
                {loading ? '...' : 'Send'}
              </Button>
              <Dialog open={shareOpen} onOpenChange={setShareOpen}>
                <DialogTrigger asChild>
                  <Button variant="secondary" onClick={() => onShare()} disabled={messages.length === 0}>
                    {t('shareToForum')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('shareToForum')}</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-3">
                    <label className="text-sm">{t('postTitle')}</label>
                    <Input value={shareTitle} onChange={(e) => setShareTitle(e.target.value)} />
                    <div className="text-xs text-neutral-500">
                      The last AI reply from this conversation will be shared.
                    </div>
                    <Button onClick={submitShare}>{t('send')}</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

/**
 * createConversation
 * Adds a new empty conversation to store and returns its id.
 */
function createConversation(
  store: Record<string, ChatMessage[]>,
  key: string
) {
  const id = Math.random().toString(36).slice(2)
  store[id] = []
  localStorage.setItem(key, JSON.stringify(store))
  return id
}

/** titleFromMessages: Create a short title from first user message. */
function titleFromMessages(msgs: ChatMessage[]) {
  const firstUser = msgs.find((m) => m.role === 'user')
  if (!firstUser) return 'New chat'
  const raw = firstUser.content.trim().replace(/\s+/g, ' ')
  return raw.length > 40 ? raw.slice(0, 40) + '…' : raw
}

/**
 * buildConversations
 * Build sidebar metadata list from the store.
 */
function buildConversations(store: Record<string, ChatMessage[]>): ConversationMeta[] {
  return Object.keys(store).map((id) => ({
    id,
    title: titleFromMessages(store[id]),
    updatedAt: store[id][store[id].length - 1]?.createdAt ?? Date.now(),
  }))
}

export default ChatPage
