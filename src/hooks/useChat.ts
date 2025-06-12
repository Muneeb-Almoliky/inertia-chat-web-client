'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from './useAuth'
import { chatService } from '@/services/chatService'
import { websocketService } from '@/services/websocketService'
import { MessageType, type Chat, type ChatMessage } from '@/types/chat'

export function useChat(chatId?: number) {
  const { auth } = useAuth()
  const [chats, setChats] = useState<Chat[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)

  const chatType = useMemo(() => {
  return chats.find(chat => chat.id === chatId)?.type
}, [chats, chatId])

  useEffect(() => {
    chatService.getUserChats()
      .then(setChats)
      .catch(err => console.error('Failed to load chats:', err))
  }, [])

  useEffect(() => {
    if (auth.isAuthenticated) {
      websocketService.connect()
      return () => {
        websocketService.disconnect()
      }
    }
  }, [auth.isAuthenticated])

  useEffect(() => {
    if (!auth.isAuthenticated || chatId == null) {
      return
    }

    let isActive = true

    const setupChat = async () => {
      try {
        setLoading(true)
        // load history
        const history = await chatService.getChatHistory(chatId)
        if (!isActive) return
        setMessages(history.data)

        // join room (so server stores your session attrs)
        websocketService.joinChat(chatId, auth.username)

        // subscribe to incoming messages
        websocketService.subscribeToChat(chatId, (msg) => {
          setMessages(prev => [...prev, msg])
        })
      } catch (err) {
        console.error('Chat setup failed:', err)
      } finally {
        if (isActive) setLoading(false)
      }
    }

    setupChat()

    // cleanup on chatId change or unmount
    return () => {
      isActive = false
      websocketService.leaveChat(chatId, auth.username)
      websocketService.unsubscribeFromChat(chatId.toString())
      setMessages([])
    }
  }, [chatId, auth.isAuthenticated, auth.username])

  const sendMessage = (content: string) => {
    if (!chatId) return

    const payload: Omit<ChatMessage, 'id' | 'createdAt'> = {
      content,
      chatId,
      senderId: Number(1), // will be replaced later by the actual user ID
      senderName: auth.username,
      type: MessageType.CHAT,
    }

    websocketService.sendMessage(payload)
  }

  const startChat = async (userId: number) => {
    try {
      return await chatService.findOrCreateOneToOneChat(userId)
    } catch (error) {
      console.error('Failed to start chat:', error)
      throw error
    }
  }

  return {
    chats,
    messages,
    loading,
    chatType,
    sendMessage,
    startChat,
  }
}
