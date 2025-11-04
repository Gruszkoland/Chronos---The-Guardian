/**
 * MessageBubble.tsx
 * Displays a chat message in a styled bubble.
 */

import React from 'react'
import { ChatMessage } from '../../lib/gemini'

/** Props for MessageBubble. */
interface Props {
  message: ChatMessage
}

/** Renders a single chat message bubble with role-specific styling. */
const MessageBubble: React.FC<Props> = ({ message }) => {
  const isUser = message.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} my-2`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2 shadow ${
          isUser ? 'bg-neutral-900 text-white' : 'bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-50'
        }`}
      >
        <div className="whitespace-pre-wrap text-sm leading-6">{message.content}</div>
        <div className="mt-1 text-[10px] opacity-60">{new Date(message.createdAt).toLocaleString()}</div>
      </div>
    </div>
  )
}

export default MessageBubble
