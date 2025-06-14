"use client"

import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useChat } from "@/hooks/useChat"
import { formatDistanceToNow } from "date-fns"
import { useAuth } from "@/hooks"

interface ConversationListProps {
  search: string
}

export function ConversationList({ search }: ConversationListProps) {
  const router = useRouter()
  const { chats } = useChat()
  const { auth } = useAuth();

  const filteredChats = chats.filter((chat) => {
    const otherParticipant = chat.participants.find(
      (p) => p.userId !== auth.userId
    )
    
    return otherParticipant?.name.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <div className="flex flex-col">
      {filteredChats.map((chat) => {
        const otherParticipant = chat.participants.find(
          (p) => p.userId !== auth.userId
        )

        if (!otherParticipant) return null

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
              <AvatarImage src={`https://avatar.vercel.sh/${otherParticipant.name}.png`} />
              <AvatarFallback>
                {otherParticipant.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-left">
              <div className="flex items-center justify-between">
                <p className="font-medium">{otherParticipant.name}</p>
                {chat.lastMessage?.createdAt && (
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(chat.lastMessage.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground truncate max-w-[180px]">
                  {chat.lastMessage?.content || "No messages yet"}
                </p>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
} 