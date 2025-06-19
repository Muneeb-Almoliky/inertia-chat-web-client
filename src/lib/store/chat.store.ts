import { create } from 'zustand';
import { Chat, ChatMessage, MessageType } from '@/types/chat';

interface ChatStore {
  chats: Chat[];
  messages: { [key: number]: ChatMessage[] }; // { chatId: messages[] }
  loadingStates: {
    initialLoad: boolean;
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
}

const initialState: ChatStore = {
    chats: [],
    messages: {},
    loadingStates: {
      initialLoad: true,
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
    setEditingMessage: () => {}
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

    const newMessages = {
      ...state.messages,
      [chatId]: [...currentMessages, message]
    }

    let updatedChats = state.chats;
    if (message.type === MessageType.CHAT) {
      updatedChats = state.chats
        .map(chat =>
          chat.id === chatId
            ? { ...chat, lastMessage: message }
            : chat
        )}
    return {
      messages: newMessages,
      chats: updatedChats
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

      const newEditingMessage = 
        state.editingMessage?.id === messageId ? null : state.editingMessage;


      return {
        messages: {
          ...state.messages,
          [chatId]: updatedMessages
        },
        editingMessage: newEditingMessage
      };
    }),
  deleteMessage: (chatId, messageId) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: state.messages[chatId]?.filter(msg => msg.id !== messageId) || [],
      },
      editingMessage: state.editingMessage?.id === messageId ? null : state.editingMessage
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
  setEditingMessage: (message) => set({ editingMessage: message })
}));