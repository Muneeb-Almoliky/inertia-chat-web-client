"use client"

import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import conversations from "@/mocks/conversations.json";

interface ConversationListProps {
  search: string
}

export function ConversationList({ search }: ConversationListProps) {
  const router = useRouter()
  const filteredConversations = conversations.filter((conversation) =>
    conversation.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col">
      {filteredConversations.map((conversation) => (
        <button
          key={conversation.id}
          onClick={() => router.push(`/chat/${conversation.id}`)}
          className={cn(
            "flex items-center gap-3 p-4 hover:bg-accent transition-colors",
            "border-b last:border-b-0"
          )}
        >
          <Avatar>
            <AvatarImage src={`https://avatar.vercel.sh/${conversation.name}.png`} />
            <AvatarFallback>
              {conversation.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 text-left">
            <div className="flex items-center justify-between">
              <p className="font-medium">{conversation.name}</p>
              <span className="text-xs text-muted-foreground">
                {conversation.timestamp}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground truncate max-w-[180px]">
                {conversation.lastMessage}
              </p>
              {conversation.unread > 0 && (
                <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                  {conversation.unread}
                </span>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  )
} 