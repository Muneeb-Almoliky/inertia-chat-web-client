import { create } from 'zustand';
import { Chat, ChatMessage, MessageStatus, MessageType } from '@/types/chat';

interface ChatStore {
  chats: Chat[];
  messages: { [key: number]: ChatMessage[] };
  loadingStates: {
    chatsLoad: boolean;
    messagesLoad: boolean;
    messageUpdate: boolean;
    messageDelete: boolean;
  };
  activeChat?: number;
  editingMessage: {
    id: number;
    content: string;
    chatId: number;
  } | null;
  
  setChats: (chats: Chat[]) => void;
  setMessages: (chatId: number, messages: ChatMessage[]) => void;
  addMessage: (chatId: number, message: ChatMessage) => void;
  updateMessage: (chatId: number, messageId: number, content: string) => void;
  deleteMessage: (chatId: number, messageId: number) => void;
  setLoadingState: (state: keyof ChatStore['loadingStates'], loading: boolean) => void;
  setActiveChat: (chatId: number) => void;
  removeChat: (chatId: number) => void;
  setEditingMessage: (message: {
    id: number;
    content: string;
    chatId: number;
  } | null) => void;
  updateMessageStatus: (chatId: number, status: MessageStatus) => void;
}

const initialState: ChatStore = {
    chats: [],
    messages: {},
    loadingStates: {
      chatsLoad: true,
      messagesLoad: false,
      messageUpdate: false,
      messageDelete: false
    },
    editingMessage: null,
    setChats: () => {},
    setMessages: () => {},
    addMessage: () => {},
    updateMessage: () => {},
    deleteMessage: () => {},
    setLoadingState: () => {},
    setActiveChat: () => {},
    removeChat: () => {},
    setEditingMessage: () => {},
    updateMessageStatus: () => {}
};

export const useChatStore = create<ChatStore>((set) => ({
    ...initialState,
  setChats: (chats) => set({ chats }),
  
  setMessages: (chatId, messages) => set((state) => ({
    messages: {
      ...state.messages,
      [chatId]: messages
    }
  })),
  
  addMessage: (chatId, message) => set((state) => {
    const currentMessages = state.messages[chatId] || [];
    
    // Optimize: Avoid unnecessary updates if message exists
    if (currentMessages.some(m => m.id === message.id)) {
      return {};
    }

    const newMessages = {
      ...state.messages,
      [chatId]: [...currentMessages, message]
    }

    // Optimize: Only update chats if necessary
    if (message.type === MessageType.CHAT) {
      const chatIndex = state.chats.findIndex(chat => chat.id === chatId);
      if (chatIndex !== -1 && state.chats[chatIndex].lastMessage?.id !== message.id) {
        return {
          messages: newMessages,
          chats: state.chats.map(chat => 
            chat.id === chatId ? { ...chat, lastMessage: message } : chat
          )
        };
      }
    }

    return { messages: newMessages };
  }),
  
  updateMessage: (chatId, messageId, content) =>
    set((state) => {
      const messages = state.messages[chatId] ?? [];
      const messageIndex = messages.findIndex(m => m.id === messageId);
      
      if (messageIndex === -1) return {};
      
      const currentMessage = messages[messageIndex];
      
      // Optimize: Skip update if content is the same
      if (currentMessage.content === content) {
        return {};
      }

      const updatedMessage = { ...currentMessage, content };
      const updatedMessages = [...messages];
      updatedMessages[messageIndex] = updatedMessage;

      // Optimize: Only update chats if necessary
      const updatedChats = state.chats.map(chat => {
        if (chat.id === chatId && chat.lastMessage?.id === messageId) {
          return { ...chat, lastMessage: updatedMessage };
        }
        return chat;
      });

      return {
        messages: { ...state.messages, [chatId]: updatedMessages },
        chats: updatedChats,
        editingMessage: state.editingMessage?.id === messageId ? null : state.editingMessage
      };
    }),
  
  deleteMessage: (chatId, messageId) =>
    set(state => {
      const messages = state.messages[chatId] ?? [];
      const messageIndex = messages.findIndex(m => m.id === messageId);
      
      if (messageIndex === -1) return {};
      
      const remaining = messages.filter(m => m.id !== messageId);
      
      // Optimize: Only update chats if necessary
      let newLastMessage: ChatMessage | undefined = messages[messages.length - 1];
      if (messageIndex === messages.length - 1) {
        newLastMessage = remaining.length > 0 ? remaining[remaining.length - 1] : undefined;
      }

      const updatedChats = state.chats.map(chat => {
        if (chat.id === chatId && chat.lastMessage?.id === messageId) {
          return { ...chat, lastMessage: newLastMessage };
        }
        return chat;
      });

      return {
        messages: { ...state.messages, [chatId]: remaining },
        chats: updatedChats,
        editingMessage: state.editingMessage?.id === messageId ? null : state.editingMessage
      };
    }),

  setActiveChat: (chatId) => set({ activeChat: chatId }),
  
  removeChat: (chatId) => set((state) => ({
    chats: state.chats.filter(chat => chat.id !== chatId),
    messages: Object.fromEntries(
      Object.entries(state.messages).filter(([key]) => Number(key) !== chatId)
    ),
  })),
  
  setEditingMessage: (message) => set({ editingMessage: message }),
  
  updateMessageStatus: (chatId, status) => set(state => {
    const messages = state.messages[chatId] || [];
    const messageIndex = messages.findIndex(m => m.id === status.messageId);

    if (messageIndex === -1) return {};
    
    const message = messages[messageIndex];
    const statuses = message.statuses || [];
    const statusIndex = statuses.findIndex(s => s.userId === status.userId);
    
    // Optimize: Skip update if status is identical
    if (statusIndex >= 0) {
      const existingStatus = statuses[statusIndex];
      if (
        existingStatus.status === status.status &&
        existingStatus.readAt === status.readAt &&
        existingStatus.deliveredAt === status.deliveredAt
      ) {
        return {};
      }
    }

    const newStatuses = [...statuses];
    
    if (statusIndex >= 0) {
      newStatuses[statusIndex] = {
        ...newStatuses[statusIndex],
        status: status.status,
        readAt: status.readAt,
        deliveredAt: status.deliveredAt
      };
    } else {
      newStatuses.push(status);
    }
    
    // Optimize: Only create new objects if needed
    if (message.statuses === newStatuses) {
      return {};
    }

    const updatedMessage = { ...message, statuses: newStatuses };
    const updatedMessages = [...messages];
    updatedMessages[messageIndex] = updatedMessage;

    // Optimize: Only update chats if necessary
    const updatedChats = state.chats.map(chat => {
      if (chat.id === chatId && chat.lastMessage?.id === status.messageId) {
        return { ...chat, lastMessage: updatedMessage };
      }
      return chat;
    });
    
    return {
      messages: { ...state.messages, [chatId]: updatedMessages },
      chats: updatedChats
    };
  })
}));