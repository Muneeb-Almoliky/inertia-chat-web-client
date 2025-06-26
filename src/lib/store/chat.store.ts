import { create } from 'zustand';
import { Chat, ChatMessage, MessageStatus, MessageType } from '@/types/chat';

interface ChatStore {
  chats: Chat[];
  messages: { [key: number]: ChatMessage[] }; // { chatId: messages[] }
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
      const msgs = state.messages[chatId] ?? []
      const idx = msgs.findIndex((m) => m.id === messageId)
      if (idx === -1) return {}  

      // update the in‑chat copy
      const updatedMsg = { ...msgs[idx], content }
      const updatedMsgs = [...msgs]
      updatedMsgs[idx] = updatedMsg

      // if that was the lastMessage in the sidebar, patch it there too
      const updatedChats = state.chats.map((c) => {
        if (c.id === chatId && c.lastMessage?.id === messageId) {
          return { ...c, lastMessage: updatedMsg }
        }
        return c
      })

      // clear out editingMessage if you just saved it
      const currentEdit = state.editingMessage
      const nextEdit =
        currentEdit?.chatId === chatId && currentEdit.id === messageId
          ? null
          : currentEdit

      return {
        messages: { ...state.messages, [chatId]: updatedMsgs },
        chats: updatedChats,
        editingMessage: nextEdit,
      }
    }),
  deleteMessage: (chatId, messageId) =>
    set(state => {
      // filter out the deleted message
      const remaining = (state.messages[chatId] ?? []).filter(m => m.id !== messageId)

      // pick the new preview: the last item in `remaining`, or undefined
      const newLastMessage = remaining.length > 0
        ? remaining[remaining.length - 1]
        : undefined

      // update the chat list, swapping out lastMessage only for this chat
      const newChats = state.chats.map(c => {
        if (c.id !== chatId) return c
        return { ...c, lastMessage: newLastMessage }
      })

      // if we were editing that exact message, cancel it
      const newEdit =
        state.editingMessage?.chatId === chatId &&
        state.editingMessage.id === messageId
          ? null
          : state.editingMessage

      return {
        messages: {
          ...state.messages,
          [chatId]: remaining
        },
        chats: newChats,
        editingMessage: newEdit
      }
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
    
    const updatedMessages = [...messages];
    const message = { ...updatedMessages[messageIndex] };
    
    // Initialize statuses array if it doesn't exist
    message.statuses = message.statuses || [];
    
    // Find existing status for this user
    const statusIndex = message.statuses.findIndex(s => 
      s.userId === status.userId
    );
    
    // Create new statuses array
    const newStatuses = [...message.statuses];
    
    if (statusIndex >= 0) {
      // Update existing status
      newStatuses[statusIndex] = {
        ...newStatuses[statusIndex],
        status: status.status,
        readAt: status.readAt,
        deliveredAt: status.deliveredAt
      };
    } else {
      // Add new status
      newStatuses.push(status);
    }
    
    // Update the message with new statuses
    updatedMessages[messageIndex] = { 
      ...message, 
      statuses: newStatuses 
    };
  
  // Update last message if needed
  const updatedChats = state.chats.map(chat => {
    if (chat.id === chatId && chat.lastMessage?.id === status.messageId) {
      return { 
        ...chat, 
        lastMessage: updatedMessages[messageIndex] 
      };
    }
    return chat;
  });
  
  return {
    messages: { 
      ...state.messages, 
      [chatId]: updatedMessages 
    },
    chats: updatedChats
  };
})
}));