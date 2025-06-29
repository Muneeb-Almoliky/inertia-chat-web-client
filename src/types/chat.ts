import { UserStatus } from "./user";

export enum ChatType {
  INDIVIDUAL = "INDIVIDUAL",
  GROUP      = "GROUP",
}

export enum MessageType {
  CHAT   = "CHAT",
  JOIN   = "JOIN",
  LEAVE  = "LEAVE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  STATUS = "STATUS",
}

export enum MessageStatusType {
  SENT      = "SENT",
  DELIVERED = "DELIVERED",
  READ      = "READ",
}

export enum AttachmentType {
  IMAGE    = "IMAGE",
  DOCUMENT = "DOCUMENT",
  VIDEO    = "VIDEO",
  AUDIO    = "AUDIO",
  VOICE    = "VOICE",
  GIF      = "GIF",
}

export interface Attachment {
  id:       number;
  type:     AttachmentType;
  url:      string;
  fileName: string;
  duration?: number;
  size?:     number;
}

export interface MessageStatus {
  messageId: number;
  userId:    number;
  status:    MessageStatusType;
  deliveredAt?: string;
  readAt?:      string;
}

export interface ChatMessage {
  id:                   number;
  content:              string;
  senderId:             number;
  senderName:           string;
  senderProfilePicture?: string | null;
  chatId:               number;
  createdAt:            string;
  editedAt?:            string | null;
  type:                 MessageType;
  attachments?:         Attachment[];
  statuses:             MessageStatus[];
}


// Roles a user can have in a group.
export enum ParticipantRole {
  OWNER = "OWNER", 
  ADMIN = "ADMIN", 
  MEMBER = "MEMBER",
}

export interface ChatParticipant {
  id:             number;
  username:       string;
  name:           string;
  role?:          ParticipantRole;   // only present in group context
  profilePicture?: string | null;
  joinedAt?:      string;            // only in group context
  lastSeen?:      string | null;     // only in group context
}

export interface Chat {
  id:           number;
  type:         ChatType;
  name?:        string | null; // Only for groups
  avatarUrl?:   string | null; // Only for groups
  participants: ChatParticipant[];
  lastMessage?: ChatMessage | null;
}

export interface GroupParticipant {
  id:             number;
  username:       string;
  name:           string;
  profilePicture?: string | null;
  role:           ParticipantRole;
  joinedAt:       string;            
  lastSeen?:      string | null;     
  status:         UserStatus;
}

export interface GroupDetails {
  id:           number;
  name:         string;
  avatarUrl?:   string | null;
  createdAt:    string;
  participants: GroupParticipant[];
}
