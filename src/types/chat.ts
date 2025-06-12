export enum ChatType {
  INDIVIDUAL = 'INDIVIDUAL',
  GROUP = 'GROUP',
}

export enum MessageType {
  CHAT = 'CHAT',
  JOIN = 'JOIN',
  LEAVE = 'LEAVE',
}

export interface ChatMessage {
  id?: number
  content: string
  senderId: number
  senderName: string
  chatId: number
  createdAt?: string
  type: MessageType
}

export interface Chat {
  id: number
  type: ChatType
  participants: ChatParticipant[]
  lastMessage?: ChatMessage
}

export interface ChatParticipant {
  userId: number
  name: string
  username?: string
  profilePicture?: string
} 