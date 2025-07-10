  "use client";

  import { ChatMessages } from "@/components/chat/ChatMessages"
  import { ChatInput } from "@/components/chat/ChatInput"
  import { AuthGuard } from "@/components/auth/AuthGuard"
  import { useParams } from "next/navigation";
  import { useRef, useState, useEffect } from "react";
  import { chatService } from "@/services/chatService";
  import { useAuth, useChat } from "@/hooks";
  import { userService } from "@/services/userService";
  import { UserStatus } from "@/types/user";
  import { useChatStore } from "@/lib/store/chat.store";
  import { messageService } from "@/services/messageService";
  import { toast } from "sonner";

  import { ChatType, GroupDetails, ParticipantRole } from "@/types/chat";
  import { GroupManagementSidebar } from "@/components/chat/GroupManagementSidebar";
  import {ChatHeader} from "@/components/chat/ChatHeader";
  import { useRouter } from "next/navigation";

  interface ChatPageParams {
    conversationId: string;
  }

  function ConversationPage() {
    const params = useParams();
    const router = useRouter();
    const conversationId = params?.conversationId as ChatPageParams['conversationId'];
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const cid = Number(conversationId);
    const { auth } = useAuth();
    const [otherUser, setOtherUser] = useState<{ 
      name: string; 
      status: UserStatus; 
      profilePicture?: string | null; 
      lastSeen: string 
    } | null>(null);
    
    const { editingMessage, setEditingMessage, messages } = useChatStore();
    const { chatType } = useChat(cid);
    const [groupDetails, setGroupDetails] = useState<GroupDetails | null>(null);
    const [showGroupManagement, setShowGroupManagement] = useState(false);

    // Redirect if conversation ID is invalid
    useEffect(() => {
      if (isNaN(cid)) {
        router.push('/chat');
      }
    }, [cid, router]);

    // Fetch group details when chat is a group
    useEffect(() => {
      const fetchGroupDetails = async () => {
        if (chatType === ChatType.GROUP && conversationId) {
          try {
            const details = await chatService.getGroupDetails(cid);
            setGroupDetails(details);
          } catch (error) {
            console.error('Failed to fetch group details:', error);
            router.push('/chat');
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
            chatService.getChatHistory(cid)
          ]);
          
          if (!isMounted) return;

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
          router.push('/chat');
        }
      };

      // Only fetch user details if it's an individual chat
      if (chatType === ChatType.INDIVIDUAL) {
        fetchData();
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
      } catch {
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
        await chatService.leaveGroup(cid);
        toast.success("You have left the group");
        setShowGroupManagement(false);
        router.push('/chat');
      } catch {
        toast.error("Failed to leave group");
      }
    };

    const handleDeleteGroup = async () => {
      if (!conversationId) return;
      try {
        await chatService.deleteGroup(cid);
        toast.success("Group deleted successfully");
        setShowGroupManagement(false);
        router.push('/chat');
      } catch {
        toast.error("Failed to delete group");
      }
    };

    const handleRemoveParticipant = async (userId: number) => {
      if (!conversationId) return;
      try {
        await chatService.removeParticipant(cid, userId);
        toast.success("Participant removed");
        // Refresh group details
        const details = await chatService.getGroupDetails(cid);
        setGroupDetails(details);
      } catch {
        toast.error("Failed to remove participant");
      }
    };

  const handleRoleChange = async (userId: number, newRole: ParticipantRole) => {
    if (!conversationId) return;
    try {
      await chatService.updateParticipantRole(
        cid,
        userId,
        newRole
      );
      // Refresh group details after role change
      const details = await chatService.getGroupDetails(Number(conversationId));
      setGroupDetails(details);
      toast.success("Role updated successfully");
    } catch {
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