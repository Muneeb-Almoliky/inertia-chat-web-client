import { create } from 'zustand';
import { Chat, ChatMessage } from '@/types/chat';

interface ChatStore {
  chats: Chat[];
  messages: { [key: number]: ChatMessage[] }; // { chatId: messages[] }
  loadingStates: {
    initialLoad: boolean;
    messageUpdate: boolean;
    messageDelete: boolean;
  };
  activeChat?: number;
  
  setChats: (chats: Chat[]) => void;
  setMessages: (chatId: number, messages: ChatMessage[]) => void;
  addMessage: (chatId: number, message: ChatMessage) => void;
  updateMessage: (chatId: number, messageId: number, content: string) => void;
  deleteMessage: (chatId: number, messageId: number) => void;
  setLoadingState: (state: keyof ChatStore['loadingStates'], loading: boolean) => void;
  setActiveChat: (chatId: number) => void;
  removeChat: (chatId: number) => void;
}

const initialState: ChatStore = {
    chats: [],
    messages: {},
    loadingStates: {
      initialLoad: true,
      messageUpdate: false,
      messageDelete: false
    },
    setChats: () => {},
    setMessages: () => {},
    addMessage: () => {},
    updateMessage: () => {},
    deleteMessage: () => {},
    setLoadingState: () => {},
    setActiveChat: () => {},
    removeChat: () => {}
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
    return {
      messages: {
        ...state.messages,
        [chatId]: [...currentMessages, message]
      }
    };
  }),
  updateMessage: (chatId, messageId, content) =>
    set((state) => {
      const currentMessages = state.messages[chatId] || [];
      const messageIndex = currentMessages.findIndex(msg => msg.id === messageId);
      
      if (messageIndex === -1) return state;

      const updatedMessages = [...currentMessages];
      updatedMessages[messageIndex] = {
        ...updatedMessages[messageIndex],
        content
      };

      return {
        messages: {
          ...state.messages,
          [chatId]: updatedMessages
        }
      };
    }),
  deleteMessage: (chatId, messageId) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: state.messages[chatId]?.filter(msg => msg.id !== messageId) || [],
      },
    })),
  setLoadingState: (state, loading) => set((prev) => ({
    loadingStates: {
      ...prev.loadingStates,
      [state]: loading
    }
  })),
  setActiveChat: (chatId) => set({ activeChat: chatId }),
  removeChat: (chatId) => set((state) => ({
    chats: state.chats.filter(chat => chat.id !== chatId),
    messages: Object.fromEntries(
      Object.entries(state.messages).filter(([key]) => Number(key) !== chatId)
    ),
  })),
}));

