'use client'

import { useEffect, useMemo } from 'react';
import { useAuth } from './useAuth';
import { chatService } from '@/services/chatService';
import { websocketService } from '@/services/websocketService';
import { MessageType } from '@/types/chat';
import { useChatStore } from '@/lib/store/chat.store';
import { MAX_FILE_SIZE_LABEL } from '@/constants/file';

export function useChat(chatId?: number) {
  const { auth } = useAuth();
  const {
    setChats,
    setMessages,
    addMessage,
    setLoading,
    setActiveChat,
    chats,
    loading,
    removeChat
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

  const sendMessage = async (content: string, attachments?: File[]) => {
    if (!chatId) return;
    try {
      const res = await chatService.sendMessageWithAttachments(chatId, content, attachments);
      console.log('[sendMessage] REST response:', res);
      return res;
    } catch (err: any) {
      console.error('[sendMessage] Error sending message:', err);
      if (err.response?.data?.errors?.includes('Maximum upload size exceeded')) {
        throw new Error(`File size too large. Maximum file size is ${MAX_FILE_SIZE_LABEL} per file.`);
      }
      throw err;
    }
  };

  const deleteChat = async (chatId: number) => {
    try {
      await chatService.deleteChat(chatId);
      removeChat(chatId);
      return true;
    } catch (error) {
      console.error('Failed to delete chat:', error);
      throw error;
    }
  };

  return { chats, messages, loading, chatType, sendMessage, deleteChat };
}