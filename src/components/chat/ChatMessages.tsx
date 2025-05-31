"use client"

import { useAuthStore } from "@/lib/store/auth.store"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { use, useEffect, useState } from "react"
import messagesData from "@/mocks/messages.json";

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  timestamp: string;
  content: string;
}


interface ChatMessagesProps {
  conversationId: string
}

export function ChatMessages({ conversationId }: ChatMessagesProps) {
  const user = useAuthStore((state) => state.user);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {

    const filtered: Message[] = (messagesData as Message[]).filter(
      (msg) => msg.conversationId === conversationId
    );
    setMessages(filtered);
  }, [conversationId]);


  return (
    <div className="flex flex-col gap-4 p-4">
      {messages.map((message) => {
        const isCurrentUser = message.senderId === "current-user"

        return (
          <div
            key={message.id}
            className={cn("flex gap-3", isCurrentUser && "flex-row-reverse")}
          >
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={`https://avatar.vercel.sh/${message.senderName}.png`}
              />
              <AvatarFallback>
                {message.senderName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div
              className={cn(
                "flex flex-col",
                isCurrentUser && "items-end"
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {message.senderName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {message.timestamp}
                </span>
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