"use client";

import { ChatMessages } from "@/components/chat/ChatMessages"
import { ChatInput } from "@/components/chat/ChatInput"
import { AuthGuard } from "@/components/auth/AuthGuard"
import { useParams } from "next/navigation";
import { useRef } from "react";

interface ChatPageParams {
  conversationId: string;
}

function ChatPage() {
  const params = useParams();
  const conversationId = params?.conversationId as ChatPageParams['conversationId'];
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  const handleMessageSent = () => {
    messagesContainerRef.current?.scrollTo({
      top: messagesContainerRef.current.scrollHeight,
      behavior: 'smooth'
    });
  };
  
  return (
    <>
      <div className="flex-1 overflow-y-auto" ref={messagesContainerRef}>
        <ChatMessages conversationId={conversationId} />
      </div>
      <div className="border-t p-4">
        <ChatInput 
          conversationId={conversationId} 
          onMessageSent={handleMessageSent}
        />
      </div>
    </>
  )
}

export default AuthGuard(ChatPage);