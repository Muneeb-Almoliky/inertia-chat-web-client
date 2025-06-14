'use client'

import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { useChat } from '@/hooks/useChat'
import { formatDistanceToNow } from 'date-fns'
import { useAuth } from '@/hooks'
import { useMemo } from 'react'

interface ConversationListProps {
  search: string
}

export function ConversationList({ search }: ConversationListProps) {
  const router = useRouter()
  const { chats } = useChat()
  const { auth } = useAuth()

  // 1) Filter out chats without messages
  // 2) Filter by search term
  // 3) Sort by lastMessage time (newest first)
  const filteredAndSorted = useMemo(() => {
    return chats
      .filter(chat => chat.lastMessage) // remove chats with no messages
      .filter(chat => {
        const other = chat.participants.find(p => p.userId !== auth.userId)
        return other?.name.toLowerCase().includes(search.toLowerCase())
      })
      .sort((a, b) => {
        const aTime = new Date(a.lastMessage!.createdAt ?? 0).getTime()
        const bTime = new Date(b.lastMessage!.createdAt ?? 0).getTime()
        return bTime - aTime
      })
  }, [chats, auth.userId, search])

  return (
    <div className="flex flex-col">
      {filteredAndSorted.map(chat => {
        const other = chat.participants.find(p => p.userId !== auth.userId)
        if (!other) return null

        return (
          <button
            key={chat.id}
            onClick={() => router.push(`/chat/${chat.id}`)}
            className={cn(
              "flex items-center gap-3 p-4 hover:bg-accent transition-colors",
              "border-b last:border-b-0"
            )}
          >
            <Avatar>
              <AvatarImage src={`https://avatar.vercel.sh/${other.name}.png`} />
              <AvatarFallback>
                {other.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 text-left">
              <div className="flex items-center justify-between">
                <p className="font-medium">{other.name}</p>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(
                    new Date(chat.lastMessage!.createdAt ?? 0),
                    { addSuffix: true }
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground truncate max-w-[180px]">
                  {chat.lastMessage!.content}
                </p>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
