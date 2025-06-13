"use client";

import { ChatMessages } from "@/components/chat/ChatMessages"
import { ChatInput } from "@/components/chat/ChatInput"
import { AuthGuard } from "@/components/auth/AuthGuard"
import { useParams } from "next/navigation";

interface ChatPageParams {
  conversationId: string;
}

function ChatPage() {
  const params = useParams();
  const conversationId = params?.conversationId as ChatPageParams['conversationId'];
  
  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <ChatMessages conversationId={conversationId} />
      </div>
      <div className="border-t p-4">
        <ChatInput conversationId={conversationId} />
      </div>
    </>
  )
}

export default AuthGuard(ChatPage);