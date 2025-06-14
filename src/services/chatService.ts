import axiosInstance from '@/api/axios'
import type { Chat, ChatMessage } from '@/types/chat'

export enum UserStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
}

export interface User {
  id: number
  username: string
  name: string
  status: UserStatus
}

interface CreateChatRequest {
  participantId: number
  type: 'INDIVIDUAL'
}

export const chatService = {
  // Find or create a one-to-one chat with another user
  findOrCreateOneToOneChat: async (userId: number): Promise<number> => {
    try {
      // Try to find existing chat
      const response = await axiosInstance.get<{ data: number }>(`/chats/with/${userId}`)
      return response.data.data
    } catch (error: any) {
      // If not found, create new chat
      if (error.response?.status === 404) {
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
      const response = await axiosInstance.get('/chats/all')
      console.log('[chatService] response:', response)
      const data = response.data as { data: any[] }
      const rawChats = data.data
      console.log('Raw chats:', rawChats)

      return rawChats.map((chat: any) => ({
        id: chat.id,
        type: chat.type,
        participants: chat.participants.map((p: any) => ({
          userId: p.id,
          name: p.name,
          profilePicture: p.profilePicture,
        })),
        lastMessage: chat.lastMessage,
      }))
    } catch (error: unknown) {
      console.error('[chatService] failed:', error);
      throw error
    }
  },

  getUsers: async (): Promise<User[]> => {
    const response = await axiosInstance.get<User[]>('/users')
    return response.data
  },

  deleteChat: async (chatId: number): Promise<void> => {
    await axiosInstance.delete(`/chats/${chatId}`)
  }
}
