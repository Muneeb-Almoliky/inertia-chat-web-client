"use client"

import { useAuthStore } from "@/lib/store/auth.store"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useChat } from "@/hooks/useChat"
import { format } from "date-fns"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/hooks"

interface ChatMessagesProps {
  conversationId: string
}

export function ChatMessages({ conversationId }: ChatMessagesProps) {
  const { auth } = useAuth();
  const { messages, loading, chatType } = useChat(Number(conversationId))

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {messages.map((message) => {
        const isCurrentUser = message.senderId === auth.userId

        // Handle system messages (join/leave)
        if (message.type !== 'CHAT') {
          return (
            <div key={message.id} className="flex justify-center">
              <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                {message.content}
              </span>
            </div>
          )
        }

        return (
          <div
            key={message.id}
            className={cn("flex gap-3", isCurrentUser && "flex-row-reverse")}
          >
            {chatType === 'GROUP' && (
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={`https://avatar.vercel.sh/${message.senderName}.png`}
                />
                <AvatarFallback>
                  {message.senderName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}

            <div
              className={cn("flex flex-col", isCurrentUser && "items-end")}
            >
              <div className="flex items-center gap-2">
                {chatType === 'GROUP' && (
                  <span className="text-sm font-medium">
                    {message.senderName}
                  </span>
                )}
                {message.createdAt && (
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(message.createdAt), 'HH:mm')}
                  </span>
                )}
              </div>

              <div
                className={cn(
                  "rounded-lg px-4 py-2 max-w-md",
                  isCurrentUser
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                {message.content}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
