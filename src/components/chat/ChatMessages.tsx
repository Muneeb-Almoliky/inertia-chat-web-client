'use client';

import * as React from "react";
import { cn } from "@/lib/utils";
import { useChat } from "@/hooks/useChat";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks";
import { Fragment, useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useScrollActivity } from "@/hooks";
import { isSameDay } from "@/utils/date";
import { messageService } from "@/services/messageService";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useChatStore } from "@/lib/store/chat.store";
import { ChatMessage } from "./ChatMessage";

type ChatMessagesProps = {
  conversationId: string;
};

export function ChatMessages({ conversationId }: ChatMessagesProps) {
  const { auth } = useAuth();
  const { messages, chatType } = useChat(Number(conversationId));
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [isScrolling, setIsScrolling] = useState(true);
  const { 
    editingMessage, 
    setEditingMessage,
    updateMessage: updateStoreMessage,
    deleteMessage: deleteStoreMessage,
    loadingStates
  } = useChatStore();
  const [messageToDelete, setMessageToDelete] = useState<number | null>(null);

  // Track scroll activity to determine if user is actively scrolling
  useScrollActivity(containerRef, () => {
    setIsScrolling(false);
  }, 500);

  const handleScroll = useCallback(() => {
    setIsScrolling(true);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleEditMessage = useCallback((messageId: number, content: string) => {
    setEditingMessage({
      id: messageId,
      content,
      chatId: Number(conversationId)
    });
  }, [conversationId, setEditingMessage]);

  const handleDeleteMessage = useCallback(async (messageId: number) => {
    try {
      await messageService.deleteMessage(messageId);
      deleteStoreMessage(Number(conversationId), messageId);
      toast.success("Message deleted successfully");
    } catch {
      toast.error("Failed to delete message");
    } finally {
      setMessageToDelete(null);
    }
  }, [conversationId, deleteStoreMessage]);

  // Sort messages by date
  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateA - dateB;
    });
  }, [messages]);

  const getDateHeader = useCallback((date: Date) => {
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
  }, []);

  if (loadingStates.messagesLoad && !editingMessage) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No messages yet.
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className="flex flex-col gap-1.5 sm:gap-3 md:gap-4 px-4 sm:px-6 md:px-10 relative chat-messages-container overflow-y-auto h-full"
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
          const isCurrentUser = message.senderId === auth.userId;
          const isEditing = editingMessage?.id === message.id && 
            editingMessage?.chatId === Number(conversationId);
          const showDateHeader = i === 0 || (
            message.createdAt && 
            filteredMessages[i - 1].createdAt &&
            !isSameDay(
              new Date(message.createdAt || ''),
              new Date(filteredMessages[i - 1].createdAt || '')
            )
          );

          return (
            <Fragment key={`${message.id ?? 'msg'}-${i}`}>
              {showDateHeader && message.createdAt && (
                <div 
                  className={cn(
                    "flex justify-center transition-all duration-300",
                    isScrolling ? "sticky top-2 z-10" : "relative"
                  )}
                >
                  <span className="text-xs sm:text-xs md:text-sm text-muted-foreground bg-muted px-2 sm:px-2.5 md:px-3 py-0.5 sm:py-1 rounded-full">
                    {getDateHeader(new Date(message.createdAt))}
                  </span>
                </div>
              )}
              <ChatMessage
                message={message}
                isCurrentUser={isCurrentUser}
                chatType={chatType}
                currentUserId={auth.userId}
                isEditing={isEditing}
                onEditMessage={handleEditMessage}
                setMessageToDelete={setMessageToDelete}
                playingAudioId={playingAudio}
                setPlayingAudio={setPlayingAudio}
              />
            </Fragment>
          );
        })}
      <div ref={messagesEndRef} />
      <AlertDialog open={messageToDelete !== null} onOpenChange={() => setMessageToDelete(null)}>
        <AlertDialogContent className="max-w-[280px] sm:max-w-[350px] md:max-w-[425px] p-3 sm:p-4 md:p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-base md:text-lg">Delete Message</AlertDialogTitle>
            <AlertDialogDescription className="text-sm sm:text-sm">
              Are you sure you want to delete this message? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs sm:text-xs md:text-sm h-7 sm:h-8 md:h-9">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs sm:text-xs md:text-sm h-7 sm:h-8 md:h-9"
              onClick={() => messageToDelete && handleDeleteMessage(messageToDelete)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}