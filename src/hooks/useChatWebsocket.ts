"use client"

import { useEffect, useCallback } from 'react'
import { websocketService } from '@/services/websocketService'
import { MessageType } from '@/types/chat'
import { messageService } from '@/services/messageService'
import { useChatStore } from '@/lib/store/chat.store'

export function useChatWebsocket(
  chats: { id: number }[],
  activeChatId: number | undefined,
  auth: { isAuthenticated: boolean; username: string; userId: number }
) {
  const {
    addMessage,
    updateMessage,
    deleteMessage,
    updateMessageStatus,
  } = useChatStore()

  // helper to subscribe one chat
  const subscribeOne = useCallback(
    (chatId: number) => {
      websocketService.joinChat(chatId, auth.username)
      websocketService.subscribeToChat(
        chatId,
        msg => {
          if (msg.type === MessageType.CHAT) {
            addMessage(chatId, msg)
            if (msg.senderId !== auth.userId) {
              messageService.markAsDelivered(msg.id!)
            }
          }
        },
        update => {
          if ('content' in update) {
            updateMessage(chatId, update.id!, update.content!)
          } else {
            updateMessageStatus(chatId, update)
          }
        },
        id => deleteMessage(chatId, id)
      )
    },
    [addMessage, updateMessage, deleteMessage, updateMessageStatus, auth.username, auth.userId]
  )

  const subscribeAll = useCallback(() => {
    chats
      .filter(c => c.id !== activeChatId)
      .forEach(c => subscribeOne(c.id))
  }, [chats, activeChatId, subscribeOne])

  useEffect(() => {
    if (!auth.isAuthenticated) return
    // connect socket
    if (!websocketService.isConnected()) websocketService.connect()

    // when socket connects, join & subscribe
    websocketService.onConnect(subscriptionHandler)
    function subscriptionHandler() {
      if (activeChatId) subscribeOne(activeChatId)
      subscribeAll()
    }

    return () => {
      // unsubscribe everything
      chats.forEach(c => {
        websocketService.leaveChat(c.id, auth.username)
        websocketService.unsubscribeFromChat(c.id)
      })
      if (websocketService.isConnected()) websocketService.disconnect()
    }
  }, [auth.isAuthenticated, auth.username, activeChatId, subscribeOne, subscribeAll, chats])
}
