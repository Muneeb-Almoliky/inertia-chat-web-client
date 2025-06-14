'use client'

import { useEffect, useMemo } from 'react';
import { useAuth } from './useAuth';
import { chatService } from '@/services/chatService';
import { websocketService } from '@/services/websocketService';
import { MessageType } from '@/types/chat';
import { useChatStore } from '@/lib/store/chat.store';

export function useChat(chatId?: number) {
  const { auth } = useAuth();
  const {
    setChats,
    setMessages,
    addMessage,
    setLoading,
    setActiveChat,
    chats,
    loading
  } = useChatStore();
  
  const emptyArr = useMemo(() => [], []);
  const messages = useChatStore(state => (chatId != null ? state.messages[chatId] ?? emptyArr : emptyArr));

  const chatType = useMemo(() => {
    if (!chatId) return undefined;
    const chat = chats.find(c => c.id === chatId);
    return chat ? chat.type : undefined;
  }, [chatId, chats]);

  // Load user chats once
  useEffect(() => {
    chatService.getUserChats()
      .then(setChats)
      .catch(err => console.error('Failed to load chats:', err));
  }, [setChats]);

  // When auth flips true, connect STOMP
  useEffect(() => {
    if (!auth.isAuthenticated) return;
    
    if (!websocketService.isConnected()) {  
    websocketService.connect();
  }

  return () => {
      if(websocketService.isConnected())
        websocketService.disconnect();
    }
  }, [auth.isAuthenticated]);

  // When chatId changes, handle chat activation
  useEffect(() => {
    if (!chatId) return;
    setActiveChat(chatId);
    
    return () => {
      websocketService.leaveChat(chatId, auth.username);
      websocketService.unsubscribeFromChat(chatId);
    };
  }, [chatId, auth.username, setActiveChat]);

  // When chatId is set and STOMP is connected
  useEffect(() => {
    if (!auth.isAuthenticated || !chatId) return;

    setLoading(true);

    // Load history
    chatService.getChatHistory(chatId)
      .then(resp => setMessages(chatId, resp.data))
      .catch(console.error)
      .finally(() => setLoading(false));

    // Setup live updates
    const onConnect = () => {
      websocketService.joinChat(chatId, auth.username);
      
      websocketService.subscribeToChat(chatId, (msg) => {
        console.log('→ [useChat] got incoming message', msg);
        addMessage(chatId, msg);
      });
    };

    websocketService.onConnect(onConnect);
  }, [chatId, auth.isAuthenticated, auth.username, setMessages, addMessage, setLoading]);

  const sendMessage = (content: string) => {
    if (!chatId) return;
    
    websocketService.sendMessage({
      type: MessageType.CHAT,
      chatId,
      content,
      senderId: auth.userId,
      senderName: auth.username,
    });
  };

  return { chats, messages, loading, chatType, sendMessage };
}