"use client";

import { ChatMessages } from "@/components/chat/ChatMessages"
import { ChatInput } from "@/components/chat/ChatInput"
import { AuthGuard } from "@/components/auth/AuthGuard"
import { useParams } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import { chatService } from "@/services/chatService";
import { useAuth, useChat } from "@/hooks";
import { cn } from "@/lib/utils";
import { userService } from "@/services/userService";
import { UserProfile, UserStatus } from "@/types/user";
import { useChatStore } from "@/lib/store/chat.store";
import { messageService } from "@/services/messageService";
import { toast } from "sonner";

import { ChatType, GroupDetails, ParticipantRole } from "@/types/chat";
import { GroupManagementSidebar } from "@/components/chat/GroupManagementSidebar";
import {ChatHeader} from "@/components/chat/ChatHeader";

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
  const [otherUser, setOtherUser] = useState<{ 
    name: string; 
    status: UserStatus; 
    profilePicture?: string | null; 
    lastSeen: string 
  } | null>(null);
  
  const { editingMessage, setEditingMessage, messages } = useChatStore();
  const { chatType } = useChat(Number(conversationId));
  const [groupDetails, setGroupDetails] = useState<GroupDetails | null>(null);
  const [showGroupManagement, setShowGroupManagement] = useState(false);

  // Fetch group details when chat is a group
  useEffect(() => {
    const fetchGroupDetails = async () => {
      if (chatType === ChatType.GROUP && conversationId) {
        try {
          const details = await chatService.getGroupDetails(Number(conversationId));
          setGroupDetails(details);
        } catch (error) {
          console.error('Failed to fetch group details:', error);
        }
      }
    };

    fetchGroupDetails();
  }, [conversationId, chatType]);

  // Find other user details for individual chats
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

        // Only set otherUser for individual chats
        if (chatType === ChatType.INDIVIDUAL) {
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
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    // Only fetch user details if it's an individual chat
    if (chatType === ChatType.INDIVIDUAL) {
      fetchData();
      const interval = setInterval(fetchData, 15000);
      return () => {
        isMounted = false;
        clearInterval(interval);
      };
    }
  }, [conversationId, auth.userId, chatType]);

  // Mark messages as read when scrolled to bottom
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const isAtBottom = 
        container.scrollHeight - container.scrollTop - container.clientHeight < 50;
      
      if (isAtBottom) {
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

  const handleUpdateMessage = async (messageId: number, content: string) => {
    try {
      await messageService.updateMessage(messageId, content);
      toast.success("Message updated successfully");
    } catch (error) {
      toast.error("Failed to update message");
    } finally {
      setEditingMessage(null);
    }
  };

  const handleMessageSent = () => {
    messagesContainerRef.current?.scrollTo({
      top: messagesContainerRef.current.scrollHeight,
      behavior: 'smooth'
    });
  };

  // Handle group actions
  const handleLeaveGroup = async () => {
    if (!conversationId) return;
    try {
      await chatService.leaveGroup(Number(conversationId));
      toast.success("You have left the group");
      setShowGroupManagement(false);
    } catch (error) {
      toast.error("Failed to leave group");
    }
  };

  const handleDeleteGroup = async () => {
    if (!conversationId) return;
    try {
      await chatService.deleteGroup(Number(conversationId));
      toast.success("Group deleted successfully");
      setShowGroupManagement(false);
    } catch (error) {
      toast.error("Failed to delete group");
    }
  };

  const handleRemoveParticipant = async (userId: number) => {
    if (!conversationId) return;
    try {
      await chatService.removeParticipant(Number(conversationId), userId);
      toast.success("Participant removed");
      // Refresh group details
      const details = await chatService.getGroupDetails(Number(conversationId));
      setGroupDetails(details);
    } catch (error) {
      toast.error("Failed to remove participant");
    }
  };

const handleRoleChange = async (userId: number, newRole: ParticipantRole) => {
  if (!conversationId) return;
  try {
    await chatService.updateParticipantRole(
      Number(conversationId), 
      userId, 
      newRole
    );
    // Refresh group details after role change
    const details = await chatService.getGroupDetails(Number(conversationId));
    setGroupDetails(details);
    toast.success("Role updated successfully");
  } catch (error) {
    toast.error("Failed to update role");
  }
};

const handleGroupUpdate = (update: { name?: string; avatar?: string }) => {
  // Update local state immediately for better UX
  setGroupDetails(prev => prev ? { ...prev, ...update } : prev);
};

return (
  <>
    {showGroupManagement && groupDetails && (
      <GroupManagementSidebar
        groupDetails={groupDetails}
        onClose={() => setShowGroupManagement(false)}
        currentUserId={auth.userId}
        onLeaveGroup={handleLeaveGroup}
        onDeleteGroup={handleDeleteGroup}
        onRemoveParticipant={handleRemoveParticipant}
        onRoleChange={handleRoleChange}
        onGroupUpdate={handleGroupUpdate}
      />
    )}
    
    <ChatHeader
      chatType={chatType}
      otherUser={otherUser!}             
      groupDetails={groupDetails!}       
      showSettings={showGroupManagement}
      onOpenSettings={() => setShowGroupManagement(true)}
      onLeaveGroup={handleLeaveGroup}
    />

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
);
}

export default AuthGuard(ConversationPage);