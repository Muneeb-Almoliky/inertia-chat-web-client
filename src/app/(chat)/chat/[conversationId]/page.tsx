"use client";

import { ChatMessages } from "@/components/chat/ChatMessages"
import { ChatInput } from "@/components/chat/ChatInput"
import { AuthGuard } from "@/components/auth/AuthGuard"

interface ChatPageProps {
  params: {
    conversationId: string
  }
}

function ChatPage({ params }: ChatPageProps) {
  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <ChatMessages conversationId={params.conversationId} />
      </div>
      <div className="border-t p-4">
        <ChatInput conversationId={params.conversationId} />
      </div>
    </>
  )
}

export default AuthGuard(ChatPage);