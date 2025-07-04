import axiosInstance from '@/api/axios'
import type { 
  Chat, 
  ChatMessage, 
  GroupDetails, 
  ParticipantRole 
} from '@/types/chat'

export const chatService = {
  // Find or create a one-to-one chat with another user
  findOrCreateOneToOneChat: async (userId: number): Promise<number> => {
    try {
      // Try to find existing chat
      const response = await axiosInstance.get<{ data: number }>(`/chats/with/${userId}`)
      return response.data.data
    } catch (error: unknown) {
      // If not found, create new chat
      if (
        typeof error === 'object' && 
        error !== null && 
        'response' in error && 
        typeof (error as { response?: { status?: number } }).response?.status === 'number' && 
        (error as { response: { status: number } }).response.status === 404
      ) {
        const response = await axiosInstance.post<{ data: number }>(`/chats/with/${userId}`)
        return response.data.data
      }
      throw error
    }
  },

  // Get chat history
  getChatHistory: async (chatId: number): Promise<{ data: ChatMessage[] }> => {
    const response = await axiosInstance.get<{ data: ChatMessage[] }>(`/chats/${chatId}/messages`)
    return response.data
  },

  // Get user's chats 
  getUserChats: async (): Promise<Chat[]> => {
    console.log('[chatService] getting user chats')

    try {
      console.log('[chatService] calling axiosInstance.get')
      const response = await axiosInstance.get('/chats')
      console.log('[chatService] response:', response)
      const data = response.data as { data: Chat[] }
      const chats = data.data
      console.log('Raw chats:', chats)

      return chats
    } catch (error: unknown) {
      console.error('[chatService] failed:', error);
      throw error
    }
  },

  deleteChat: async (chatId: number): Promise<void> => {
    await axiosInstance.delete(`/chats/${chatId}`)
  },

  sendMessageWithAttachments: async (
    chatId: number,
    content: string,
    attachments?: File[]
  ): Promise<{ data: ChatMessage }> => {
    const formData = new FormData();
    if (content) formData.append('content', content);
    if (attachments && attachments.length > 0) {
      attachments.forEach((file) => {
        formData.append('attachments', file);
      });
    }
    try {
      const response = await axiosInstance.post<{ data: ChatMessage }>(`/chats/${chatId}/messages`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      console.error('[chatService] sendMessageWithAttachments error:', error);
      throw error;
    }
  },

  // Get group details
  getGroupDetails: async (chatId: number): Promise<GroupDetails> => {
    const response = await axiosInstance.get<{ data: GroupDetails }>(`/chats/${chatId}`);
    return response.data.data; 
  },

  // Create new group chat
  createGroupChat: async (data: {
    name: string;
    participantIds: number[];
    avatar?: File | null;
  }): Promise<GroupDetails> => {
    const formData = new FormData();
    
    // Create DTO structure
    const dto = {
      name: data.name,
      participantIds: data.participantIds
    };
    
    formData.append(
      'dto', 
      new Blob([JSON.stringify(dto)], { type: 'application/json' })
    );
    
    if (data.avatar) {
      formData.append('avatar', data.avatar);
    }

    const response = await axiosInstance.post<{ data: GroupDetails}>('/chats/group', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    
    return response.data.data;
  },
  
  // Add participant to group
  addParticipant: async (chatId: number, userId: number): Promise<void> => {
    await axiosInstance.post(`/chats/${chatId}/participants/${userId}`);
  },
  
  // Remove participant from group
  removeParticipant: async (chatId: number, userId: number): Promise<void> => {
    await axiosInstance.delete(`/chats/${chatId}/participants/${userId}`);
  },

  // Update participant role (MISSING IN ORIGINAL)
  updateParticipantRole: async (
    chatId: number,
    userId: number,
    newRole: ParticipantRole
  ): Promise<void> => {
    await axiosInstance.patch(
      `/chats/${chatId}/participants/${userId}/role?newRole=${encodeURIComponent(newRole)}`);
  },

  // Update group details (name and avatar)
  updateGroup: async (
    chatId: number, 
    updates: { name?: string; avatar?: File }
  ): Promise<GroupDetails> => {
    const formData = new FormData();
    
    if (updates.name) {
      formData.append('name', updates.name);
    }
    
    if (updates.avatar) {
      formData.append('avatar', updates.avatar);
    }
    
    const response = await axiosInstance.patch<{ data: GroupDetails }>(
      `/chats/${chatId}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    
    return response.data.data;
  },

  // Update group name only (MISSING IN ORIGINAL)
  updateGroupName: async (
    chatId: number,
    newName: string
  ): Promise<void> => {
    await axiosInstance.patch(
      `/chats/${chatId}/name?name=${encodeURIComponent(newName)}`);
  },

  // Update group avatar only (MISSING IN ORIGINAL)
  updateGroupAvatar: async (
    chatId: number,
    avatarFile: File
  ): Promise<{ avatarUrl: string }> => {
    const formData = new FormData();
    formData.append('avatar', avatarFile);
    
    const response = await axiosInstance.patch<{ data: { avatarUrl: string } }>(
      `/chats/${chatId}/avatar`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    
    return response.data.data;
  },

  // Transfer group ownership (MISSING IN ORIGINAL)
  transferOwnership: async (
    chatId: number,
    newOwnerId: number
  ): Promise<void> => {
    await axiosInstance.post(
      `/chats/${chatId}/transfer-ownership`,
      { newOwnerId }
    );
  },
  
  // Leave group
  leaveGroup: async (chatId: number): Promise<void> => {
    await axiosInstance.delete(`/chats/${chatId}/leave`);
  },
  
  // Delete group
  deleteGroup: async (chatId: number): Promise<void> => {
    await axiosInstance.delete(`/chats/${chatId}`);
  },
}