import axiosInstance from '@/api/axios'
import type { ChatMessage } from '@/types/chat'

interface UpdateMessageRequest {
  content: string
}

export const messageService = {
  updateMessage: async (messageId: number, content: string): Promise<ChatMessage> => {
    try {
      const response = await axiosInstance.put<{ data: ChatMessage }>(`/messages/${messageId}`, {
        content
      })
      return response.data.data
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message || 'Failed to update message')
      }
      throw error
    }
  },

  deleteMessage: async (messageId: number): Promise<void> => {
    try {
      await axiosInstance.delete(`/messages/${messageId}`)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message || 'Failed to delete message')
      }
      throw error
    }
  },

  markAsRead: async (messageId: number): Promise<void> => {
    try {
      await axiosInstance.post(`/messages/${messageId}/read`)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message || 'Failed to mark message as read')
      }
      throw error
    }
  }
}