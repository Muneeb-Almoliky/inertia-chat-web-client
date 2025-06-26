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
  STATUS = 'STATUS',
}

export enum MessageStatusType {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
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
  statuses: MessageStatus[]
}

export interface MessageStatus {
  messageId: number
  userId: number
  status: MessageStatusType
  deliveredAt?: string
  readAt?: string
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