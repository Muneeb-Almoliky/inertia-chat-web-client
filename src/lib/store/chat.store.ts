import { create } from 'zustand';
import { Chat, ChatMessage } from '@/types/chat';

type ChatState = {
  chats: Chat[];
  messages: Record<number, ChatMessage[]>; // { chatId: messages[] }
  loading: boolean;
  activeChatId: number | null;
  
  setChats: (chats: Chat[]) => void;
  setMessages: (chatId: number, messages: ChatMessage[]) => void;
  addMessage: (chatId: number, message: ChatMessage) => void;
  setLoading: (loading: boolean) => void;
  setActiveChat: (chatId: number | null) => void;
};

const initialState: ChatState = {
    chats: [],
    messages: {},
    loading: true,
    activeChatId: null,
    setChats: () => {},
    setMessages: () => {},
    addMessage: () => {},
    setLoading: () => {},
    setActiveChat: () => {}
};

export const useChatStore = create<ChatState>((set) => ({
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
  setLoading: (loading) => set({ loading }),
  setActiveChat: (activeChatId) => set({ activeChatId })
}));

