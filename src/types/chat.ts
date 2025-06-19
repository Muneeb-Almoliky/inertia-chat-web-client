export enum ChatType {
  INDIVIDUAL = 'INDIVIDUAL',
  GROUP = 'GROUP',
}

export enum MessageType {
  CHAT = 'CHAT',
  JOIN = 'JOIN',
  LEAVE = 'LEAVE',
  UPDATE = "UPDATE",
  DELETE = "DELETE",
}

export enum AttachmentType {
  IMAGE = 'IMAGE',
  DOCUMENT = 'DOCUMENT',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  VOICE = 'VOICE',
  GIF = 'GIF',
}

export interface Attachment {
  id: number;
  type: AttachmentType;
  url: string;
  fileName: string;
  duration?: number;
  size?: number;
}

export interface ChatMessage {
  id?: number
  content: string
  senderId: number
  senderName: string
  chatId: number
  createdAt?: string
  type: MessageType
  attachments?: Attachment[]
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