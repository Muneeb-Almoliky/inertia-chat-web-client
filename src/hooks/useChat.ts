'use client'

import { useEffect, useMemo, useCallback } from 'react'
import { useAuth } from './useAuth'
import { chatService } from '@/services/chatService'
import { websocketService } from '@/services/websocketService'
import { MessageType, ChatMessage, MessageStatusType, ChatType } from '@/types/chat'
import { useChatStore } from '@/lib/store/chat.store'
import { MAX_FILE_SIZE_LABEL } from '@/constants/file'
import { messageService } from '@/services/messageService'

export function useChat(chatId?: number) {
  const { auth } = useAuth()
  const {
    setChats,
    setMessages,
    addMessage,
    updateMessage,
    deleteMessage,
    setLoadingState,
    setActiveChat,
    chats,
    loadingStates,
    removeChat,
    updateMessageStatus
  } = useChatStore()

  const emptyArr: ChatMessage[] = useMemo(() => [], [])
  const messages = useChatStore(state =>
    chatId != null ? state.messages[chatId] ?? emptyArr : emptyArr
  )

  const chatType = useMemo(() => {
    if (!chatId) return undefined
    return chats.find(c => c.id === chatId)?.type
  }, [chatId, chats])

  const refetch = useCallback(async () => {
    if (!chatId) return
    setLoadingState('messagesLoad', true)
    try {
      const resp = await chatService.getChatHistory(chatId)
      setMessages(chatId, resp.data)
    } catch (err) {
      console.error('Failed to refetch messages:', err)
    } finally {
      setLoadingState('messagesLoad', false)
    }
  }, [chatId, setLoadingState, setMessages])

  // load chats once
  useEffect(() => {
    setLoadingState('chatsLoad', true)
    chatService.getUserChats()
      .then(setChats)
      .catch(err => console.error('Failed to load chats:', err))
      .finally(() => setLoadingState('chatsLoad', false))
  }, [setChats, setLoadingState])

  // connect when authenticated
  useEffect(() => {
    if (!auth.isAuthenticated) return
    if (!websocketService.isConnected()) websocketService.connect()
    return () => {
      if (websocketService.isConnected()) websocketService.disconnect()
    }
  }, [auth.isAuthenticated])

  // enter/leave chat on chatId change
  useEffect(() => {
    if (!chatId) return
    setActiveChat(chatId)
    return () => {
      websocketService.leaveChat(chatId, auth.username)
      websocketService.unsubscribeFromChat(chatId)
    }
  }, [chatId, auth.username, setActiveChat])

    const fetchGroupDetails = useCallback(async () => {
    if (!chatId) return;
  }, [chatId]);

  useEffect(() => {
    if (chatType === ChatType.GROUP) {
      fetchGroupDetails();
    }
  }, [chatType, fetchGroupDetails]);

  // initial load + live WS events
  useEffect(() => {
    if (!auth.isAuthenticated || !chatId) return

    setLoadingState('messagesLoad', true)
    chatService
      .getChatHistory(chatId)
      .then(resp => setMessages(chatId, resp.data))
      .catch(console.error)
      .finally(() => setLoadingState('messagesLoad', false))

    const onConnect = () => {
      websocketService.joinChat(chatId, auth.username)
      websocketService.subscribeToChat(
        chatId,
        // new message
        msg => { 
          if (msg.type === MessageType.CHAT) {
            addMessage(chatId, msg);
            // Mark as delivered if not our own message
            if (msg.senderId !== auth.userId) {
              messageService.markAsDelivered(msg.id!);
            }
          }
        },
        // updated message
        update => {
          if ('content' in update) {
            // Message update
            if (update.type === MessageType.UPDATE) {
              updateMessage(chatId, update.id!, update.content!);
            }
          } else {
            // Status update
            updateMessageStatus(chatId, update);
          }
        },
        // deleted message
        id  => deleteMessage(chatId, id)
      )
    }

    websocketService.onConnect(onConnect)
  }, [
    chatId,
    auth.isAuthenticated,
    auth.username,
    setMessages,
    addMessage,
    updateMessage,
    deleteMessage,
    setLoadingState,
    updateMessageStatus
  ])

  // Add useEffect to mark messages as read
  useEffect(() => {
    if (!chatId || !messages.length) return;
    
    const unreadMessages = messages.filter(
      m => m.senderId !== auth.userId && 
            !m.statuses?.some(s => s.userId === auth.userId && s.status === MessageStatusType.READ)
    );
    
    unreadMessages.forEach(msg => {
      messageService.markAsRead(msg.id!);
    });
  }, [messages, chatId, auth.userId]);

  const sendMessage = async (content: string, attachments?: File[]) => {
    if (!chatId) return
    try {
      const res = await chatService.sendMessageWithAttachments(chatId, content, attachments)
      return res
    } catch (err: any) {
      console.error('[sendMessage] Error sending message:', err)
      if (err.response?.data?.errors?.includes('Maximum upload size exceeded')) {
        throw new Error(`File size too large. Maximum file size is ${MAX_FILE_SIZE_LABEL} per file.`)
      }
      throw err
    }
  }

  const deleteChat = async (toDeleteId: number) => {
    try {
      await chatService.deleteChat(toDeleteId)
      removeChat(toDeleteId)
      return true
    } catch (err) {
      console.error('Failed to delete chat:', err)
      throw err
    }
  }

  return { 
    chats, 
    messages, 
    loading: loadingStates.messagesLoad, 
    chatType, 
    sendMessage, 
    deleteChat, 
    refetch 
  };
}
