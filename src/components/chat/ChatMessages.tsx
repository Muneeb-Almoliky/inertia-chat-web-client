"use client";

import * as React from "react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useChat } from "@/hooks/useChat"
import { format } from "date-fns"
import { Loader2, FileText, Image, File, Video, Music, Download, Mic, MoreVertical, Pencil, Trash2 } from "lucide-react"
import { useAuth } from "@/hooks"
import { useEffect, useRef, useState } from "react";
import { Attachment, AttachmentType } from "@/types/chat"
import { getApiBaseUrl } from "@/utils/api"
import { Button } from "@/components/ui/button"
import { VoiceMessagePlayer } from "./VoiceMessagePlayer"
import { useScrollActivity } from "@/hooks"
import { isSameDay } from "@/utils/date"
import { parseEmoji } from "@/utils/emoji";
import { ChatInput } from "./ChatInput"
import { messageService } from "@/services/messageService"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useChatStore } from "@/lib/store/chat.store"

interface ChatMessagesProps {
  conversationId: string
}

const getAttachmentIcon = (type: AttachmentType) => {
  switch (type) {
    case AttachmentType.IMAGE:
      return <Image className="h-4 w-4 text-blue-500" />;
    case AttachmentType.VIDEO:
      return <Video className="h-4 w-4 text-purple-500" />;
    case AttachmentType.AUDIO:
      return <Music className="h-4 w-4 text-green-500" />;
    case AttachmentType.VOICE:
      return <Mic className="h-4 w-4 text-green-500" />;
    case AttachmentType.DOCUMENT:
      return <FileText className="h-4 w-4 text-red-500" />;
    default:
      return <File className="h-4 w-4 text-gray-500" />;
  }
}

const getGridClass = (count: number) => {
  switch (count) {
    case 1:
      return "grid-cols-1";
    case 2:
      return "grid-cols-2";
    case 3:
      return "grid-cols-2";
    case 4:
      return "grid-cols-2";
    default:
      return "grid-cols-3";
  }
}

const getImageClass = (count: number, index: number) => {
  if (count === 1) {
    return "max-w-md max-h-96";
  }
  if (count === 3 && index === 0) {
    return "row-span-2";
  }
  return "";
}

const getImageFit = (count: number) => {
  return count === 1 ? "contain" : "cover";
}

export function ChatMessages({ conversationId }: ChatMessagesProps) {
  const { auth } = useAuth()
  const { messages, loading, chatType } = useChat(Number(conversationId))
  const { updateMessage: updateStoreMessage, deleteMessage: deleteStoreMessage } = useChatStore()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [isScrolling, setIsScrolling] = useState(true);
  const [editingMessage, setEditingMessage] = useState<{ id: number; content: string } | null>(null);
  const [messageToDelete, setMessageToDelete] = useState<number | null>(null);

  useScrollActivity(containerRef, () => {
    setIsScrolling(false);
  }, 500);

  const handleScroll = () => {
    setIsScrolling(true);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleDownload = async (url: string, fileName: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const renderAttachments = (attachments: Attachment[], isCurrentUser: boolean) => {
    const images = attachments.filter(att => att.type === AttachmentType.IMAGE);
    const voiceMessages = attachments.filter(att => att.type === AttachmentType.VOICE);
    const otherFiles = attachments.filter(att => 
      att.type !== AttachmentType.IMAGE && att.type !== AttachmentType.VOICE
    );

    return (
      <div className="flex flex-col gap-2">
        {images.length > 0 && (
          <div className={cn(
            "grid gap-1",
            getGridClass(images.length)
          )}>
            {images.map((att, idx) => {
              const fullUrl = att.url.startsWith('http') ? att.url : `${getApiBaseUrl()}${att.url}`;
              return (
                <div 
                  key={att.id}
                  className={cn(
                    "relative overflow-hidden rounded-sm border transition-colors duration-200 group cursor-pointer",
                    isCurrentUser ? "border-white/10" : "border-border",
                    images.length === 1 ? "flex justify-center" : "aspect-square",
                    getImageClass(images.length, idx)
                  )}
                  onClick={() => window.open(`${getApiBaseUrl()}${att.url}`, '_blank')}
                >
                  <div className="block h-full w-full">
                    <img
                      src={fullUrl}
                      alt={att.fileName}
                      className={cn(
                        "h-full w-full transition-transform duration-300 group-hover:scale-105",
                        images.length === 1 ? "object-contain" : "object-cover"
                      )}
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="size-8 rounded-full cursor-pointer hover:bg-background/80"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(fullUrl, att.fileName);
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {voiceMessages.length > 0 && (
          <div className="flex flex-col gap-2">
            {voiceMessages.map((att) => {
              const fullUrl = att.url.startsWith('http') ? att.url : `${getApiBaseUrl()}${att.url}`;
              const audioId = `audio-${att.id}`;
              return (
                <div 
                  key={att.id}
                  className={cn(
                    "rounded-sm overflow-hidden border transition-colors duration-200",
                    isCurrentUser ? "border-white/10" : "border-border"
                  )}
                >
                  <div className="p-2">
                    <VoiceMessagePlayer
                      url={fullUrl}
                      duration={att.duration || 0}
                      onPlay={() => setPlayingAudio(audioId)}
                      onPause={() => setPlayingAudio(null)}
                      isCurrentUser={isCurrentUser}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {otherFiles.length > 0 && (
          <div className="flex flex-col gap-1">
            {otherFiles.map((att) => {
              const fullUrl = att.url.startsWith('http') ? att.url : `${getApiBaseUrl()}${att.url}`;
              return (
                <div 
                  key={att.id}
                  className={cn(
                    "rounded-sm overflow-hidden border transition-colors duration-200 group cursor-pointer",
                    isCurrentUser ? "border-white/10" : "border-border"
                  )}
                  onClick={() => window.open(`${getApiBaseUrl()}${att.url}`, '_blank')}
                >
                  <div className="flex items-center gap-2 p-2">
                    <div className="flex-1 flex items-center gap-2 transition-colors rounded-md p-1.5">
                      <div className="flex-shrink-0">
                        {getAttachmentIcon(att.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {att.fileName}
                        </div>
                        <div className="text-xs opacity-70">
                          {att.type.toLowerCase()}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className={cn(
                        "size-8 rounded-full cursor-pointer",
                        isCurrentUser ? "hover:bg-white/10 hover:text-white" : "hover:bg-border"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(fullUrl, att.fileName);
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const isSingleEmoji = (content: string) => {
    const trimmed = content.trim();
    const div = document.createElement('div');
    div.innerHTML = parseEmoji(trimmed);
    const emojiElements = div.getElementsByClassName('emoji');
    return emojiElements.length === 1 && div.textContent?.trim() === '';
  };

  const handleEditMessage = (messageId: number, content: string) => {
    setEditingMessage({ id: messageId, content });
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
  };

  const handleUpdateMessage = async (messageId: number, content: string) => {
    try {
      await messageService.updateMessage(messageId, content);
      updateStoreMessage(Number(conversationId), messageId, content);
      setEditingMessage(null);
      toast.success("Message updated successfully");
    } catch (error) {
      toast.error("Failed to update message");
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    try {
      await messageService.deleteMessage(messageId);
      deleteStoreMessage(Number(conversationId), messageId);
      toast.success("Message deleted successfully");
    } catch (error) {
      toast.error("Failed to delete message");
    } finally {
      setMessageToDelete(null);
    }
  };

  if (loading && !editingMessage && messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No messages yet.
      </div>
    )
  }

  // Sort messages by date to ensure proper date header grouping
  const sortedMessages = [...messages].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateA - dateB;
  });

  return (
    <div 
      ref={containerRef} 
      className="flex flex-col gap-4 p-4 relative chat-messages-container overflow-y-auto h-full"
      onScroll={handleScroll}
    >
      {sortedMessages
        .filter(message => {
          const content = message.content?.toLowerCase() || "";
          return message.type === "CHAT" || (
            !content.includes("joined the chat") &&
            !content.includes("disconnected")
          );
        })
        .map((message, i, filteredMessages) => {
          const isCurrentUser = message.senderId === auth.userId
          const hasAttachments = Array.isArray(message.attachments) && message.attachments.length > 0;
          const hasContent = message?.content && message?.content.trim().length > 0;
          const isSingleEmojiMessage = hasContent && isSingleEmoji(message.content);
          const isEditing = editingMessage?.id === message.id;

          // Only show date header for the first message of each day
          const showDateHeader = i === 0 || (
            message.createdAt && 
            filteredMessages[i - 1].createdAt &&
            !isSameDay(
              new Date(message.createdAt || ''),
              new Date(filteredMessages[i - 1].createdAt || '')
            )
          );

          const getDateHeader = (date: Date) => {
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            if (date.toDateString() === today.toDateString()) {
              return 'Today';
            } else if (date.toDateString() === yesterday.toDateString()) {
              return 'Yesterday';
            } else {
              return format(date, 'MMMM d, yyyy');
            }
          };

          if (message.type !== "CHAT") {
            return (
              <div key={`${message.id ?? 'msg'}-${i}`} className="flex justify-center">
                <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                  {message.content}
                </span>
              </div>
            )
          }

          return (
            <React.Fragment key={`${message.id ?? 'msg'}-${i}`}>
              {showDateHeader && message.createdAt && (
                <div 
                  className={cn(
                    "flex justify-center transition-all duration-300",
                    isScrolling ? "sticky top-2 z-10" : "relative"
                  )}
                >
                  <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                    {getDateHeader(new Date(message.createdAt))}
                  </span>
                </div>
              )}
              <div className={cn(
                "flex gap-3 group/message",
                isCurrentUser && "flex-row-reverse"
              )}>
                {chatType === "GROUP" && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={`https://avatar.vercel.sh/${message.senderName}.png`} />
                    <AvatarFallback>
                      {message.senderName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className={cn("flex flex-col gap-1 relative", isCurrentUser && "items-end")}>
                  <div className="flex items-center gap-2">
                    {chatType === "GROUP" && <span className="text-sm font-medium">{message.senderName}</span>}
                    <div className="flex items-center gap-1">
                      {message.createdAt && (
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(message.createdAt), "h:mm a")}
                        </span>
                      )}
                      {isCurrentUser && message.id && !isEditing && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover/message:opacity-100 transition-opacity"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align={isCurrentUser ? "end" : "start"}>
                            <DropdownMenuItem
                              onClick={() => handleEditMessage(message.id!, message.content)}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setMessageToDelete(message.id!)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                  {isEditing ? (
                    <div className="min-w-[200px]">
                      <ChatInput
                        conversationId={conversationId}
                        onMessageSent={() => handleUpdateMessage(message.id!, message.content)}
                      />
                    </div>
                  ) : (
                    <>
                      {hasAttachments && (
                        <div
                          className={cn(
                            "rounded-lg p-2 max-w-md",
                            isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted"
                          )}
                        >
                          {renderAttachments(message.attachments!, isCurrentUser)}
                        </div>
                      )}
                      {hasContent && (
                        <div
                          className={cn(
                            "rounded-lg p-2 max-w-md",
                            isSingleEmojiMessage 
                              ? "!p-0"
                              : isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted"
                          )}
                        >
                          <span
                            className={cn(
                              "[&_img.emoji]:inline-block [&_img.emoji]:align-[-0.3em] [&_img.emoji]:my-0 [&_img.emoji]:mx-[0.1em]",
                              isSingleEmojiMessage 
                                ? "[&_img.emoji]:size-[6.5em] [&_img.emoji]:align-middle [&_img.emoji]:m-0"
                                : "[&_img.emoji]:size-[1.3em]"
                            )}
                            dangerouslySetInnerHTML={{
                              __html: parseEmoji(message.content),
                            }}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </React.Fragment>
          )
        })}
      <div ref={messagesEndRef} />
      <AlertDialog open={messageToDelete !== null} onOpenChange={() => setMessageToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this message? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => messageToDelete && handleDeleteMessage(messageToDelete)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
