"use client";

import { ChatMessages } from "@/components/chat/ChatMessages"
import { ChatInput } from "@/components/chat/ChatInput"
import { AuthGuard } from "@/components/auth/AuthGuard"
import { useParams } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import { chatService } from "@/services/chatService";
import { useAuth } from "@/hooks";
import { cn } from "@/lib/utils";
import { userService } from "@/services/userService";
import { UserProfile, UserStatus } from "@/types/user";
import { useChatStore } from "@/lib/store/chat.store";
import { messageService } from "@/services/messageService";
import { toast } from "sonner";
import Avatar from "@/components/chat/Avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatLastSeen } from "@/utils/date";

interface ChatPageParams {
  conversationId: string;
}

const statusConfig = {
  [UserStatus.ONLINE]: { label: 'Online', color: 'bg-green-500', bgColor: 'bg-green-100/80', textColor: 'text-green-700' },
  [UserStatus.AWAY]: { label: 'Away', color: 'bg-yellow-500', bgColor: 'bg-yellow-100/80', textColor: 'text-yellow-700' },
  [UserStatus.OFFLINE]: { label: 'Offline', color: 'bg-gray-400', bgColor: 'bg-gray-100/80', textColor: 'text-gray-600' },
}

function ConversationPage() {
  const params = useParams();
  const conversationId = params?.conversationId as ChatPageParams['conversationId'];
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { auth } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([])
  const [otherUser, setOtherUser] = useState<{ name: string; status: UserStatus; profilePicture?: string | null; lastSeen: string } | null>(null)
  const { editingMessage, setEditingMessage, messages } = useChatStore();

  const handleUpdateMessage = async (messageId: number, content: string) => {
    try {
      await messageService.updateMessage(messageId, content);
      // ... update in store ...
      toast.success("Message updated successfully");
    } catch (error) {
      toast.error("Failed to update message");
    } finally {
      setEditingMessage(null);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const [usersData, chatHistory] = await Promise.all([
          userService.getUsers(),
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
              status: otherUserData.status as UserStatus,
              profilePicture: otherUserData.profilePicture,
              lastSeen: otherUserData.lastSeen
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

   // Add scroll-based read detection
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const isAtBottom = 
        container.scrollHeight - container.scrollTop - container.clientHeight < 50;
      
      if (isAtBottom) {
        // Mark messages as read when scrolled to bottom
        Object.values(messages).flat().forEach(msg => {
          if (msg.senderId !== auth.userId && 
              !msg.statuses?.some(s => s.userId === auth.userId && s.status === 'READ')) {
            messageService.markAsRead(msg.id!);
          }
        });
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [messages, auth.userId]);

  const handleMessageSent = () => {
    messagesContainerRef.current?.scrollTo({
      top: messagesContainerRef.current.scrollHeight,
      behavior: 'smooth'
    });
  };

  return (
    <>
      {otherUser && (
        <div className="border-b bg-gray-50 flex items-center justify-between h-16 sm:h-[70px] pr-4 pl-14 sm:px-6 md:px-10 sm:ml-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex-shrink-0">
              <Avatar
                path={otherUser.profilePicture}
                name={otherUser.name}
                className="h-9 w-9 sm:h-10 sm:w-10 ring-2 ring-background"
              />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className={cn(
                      "absolute bottom-0 right-0 size-2 sm:size-2.5 rounded-full ring-2 ring-background",
                      statusConfig[otherUser.status].color
                    )} />
                  </TooltipTrigger>
                  <TooltipContent side="right" align="center" className="text-xs capitalize">
                    {otherUser.status.toLowerCase()}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <h2 className="text-sm sm:text-base font-semibold truncate text-gray-900">
                {otherUser.name}
              </h2>
              <span className={cn(
                "text-xs sm:text-sm",
                otherUser.status === UserStatus.ONLINE 
                  ? statusConfig[otherUser.status].textColor
                  : "text-gray-500"
              )}>
                {otherUser.status === UserStatus.ONLINE 
                  ? "online"
                  : formatLastSeen(otherUser.lastSeen)}
              </span>
            </div>
          </div>
        </div>
      )}
      <div className="flex-1 overflow-y-auto" ref={messagesContainerRef}>
        <ChatMessages conversationId={conversationId} />
      </div>
      <div className="border-t py-2 sm:py-3 md:py-4 px-4 sm:px-6 md:px-10 bg-gray-50">
        <ChatInput
          conversationId={conversationId}
          onMessageSent={handleMessageSent}
          isEditing={!!editingMessage}
          onUpdateMessage={handleUpdateMessage}
        />
      </div>
    </>
  )
}

export default AuthGuard(ConversationPage);