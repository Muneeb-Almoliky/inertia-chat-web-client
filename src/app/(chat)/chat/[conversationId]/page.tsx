"use client";

import { ChatMessages } from "@/components/chat/ChatMessages"
import { ChatInput } from "@/components/chat/ChatInput"
import { AuthGuard } from "@/components/auth/AuthGuard"
import { useParams } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import { chatService, User, UserStatus } from "@/services/chatService";
import { useAuth } from "@/hooks";
import { cn } from "@/lib/utils";

interface ChatPageParams {
  conversationId: string;
}

function ChatPage() {
  const params = useParams();
  const conversationId = params?.conversationId as ChatPageParams['conversationId'];
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { auth } = useAuth();
  const [users, setUsers] = useState<User[]>([])
  const [otherUser, setOtherUser] = useState<{ name: string; status: string } | null>(null)
  
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const [usersData, chatHistory] = await Promise.all([
          chatService.getUsers(),
          chatService.getChatHistory(Number(conversationId))
        ]);
        if (!isMounted) return;

        setUsers(usersData);

        const otherParticipant = chatHistory.data[0]?.senderId !== auth.userId
          ? chatHistory.data[0]?.senderName
          : chatHistory.data[1]?.senderName;

        if (otherParticipant) {
          const otherUserData = usersData.find(u => u.name === otherParticipant);
          if (otherUserData) {
            setOtherUser({
              name: otherUserData.name,
              status: otherUserData.status
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [conversationId, auth.userId]);
  
  const handleMessageSent = () => {
    messagesContainerRef.current?.scrollTo({
      top: messagesContainerRef.current.scrollHeight,
      behavior: 'smooth'
    });
  };
  
  return (
    <>
      {otherUser && (
        <div className="border-b p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{otherUser.name}</h2>
            <span className={cn(
              "text-xs px-2 py-1 rounded-full",
              otherUser.status === UserStatus.ONLINE 
                ? "bg-green-100 text-green-700" 
                : "bg-gray-100 text-gray-700"
            )}>
              {otherUser.status.toLowerCase()}
            </span>
          </div>
        </div>
      )}
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