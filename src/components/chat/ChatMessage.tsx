'use client';

import { cn } from "@/lib/utils";
import { 
  FileText, Image, File, Video, Music, Download, Mic, MoreVertical, Pencil, Trash2, Check, CheckCheck 
} from "lucide-react";
import { 
  Attachment, AttachmentType, ChatType, MessageStatusType, ChatMessage as IChatMessage 
} from "@/types/chat";
import { Button } from "@/components/ui/button";
import { VoiceMessagePlayer } from "./VoiceMessagePlayer";
import { parseEmoji } from "@/utils/emoji";
import { MessageStatus } from "@/types/chat";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { memo, useCallback, useMemo } from "react";
import { resolveAttachmentUrl } from "@/utils/resolveAttachmentUrl";
import Avatar from "./Avatar";
import { isFirstLetterArabic } from "@/utils/text";

// Memoized Private Message Status Component
const PrivateMessageStatus = memo(({ 
  statuses, 
  currentUserId 
}: { 
  statuses?: MessageStatus[]; 
  currentUserId: number; 
}) => {
  if (!statuses) return <Check className="h-3 w-3 text-muted-foreground" />;
  
  const otherStatus = statuses.find(s => s.userId !== currentUserId);
  if (!otherStatus) return <Check className="h-3 w-3 text-muted-foreground" />;

  return otherStatus.status === MessageStatusType.READ ? (
    <CheckCheck className="h-3 w-3 text-blue-500" />
  ) : otherStatus.status === MessageStatusType.DELIVERED ? (
    <CheckCheck className="h-3 w-3 text-muted-foreground" />
  ) : (
    <Check className="h-3 w-3 text-muted-foreground" />
  );
});

PrivateMessageStatus.displayName = 'PrivateMessageStatus';

// Memoized Group Message Status Component
const GroupMessageStatus = memo(({ 
  statuses, 
  currentUserId 
}: { 
  statuses?: MessageStatus[]; 
  currentUserId: number; 
}) => {
  const { readCount, deliveredCount, total } = useMemo(() => {
    const otherStatuses = (statuses || []).filter(s => s.userId !== currentUserId);
    return {
      readCount: otherStatuses.filter(s => s.status === MessageStatusType.READ).length,
      deliveredCount: otherStatuses.filter(s => s.status === MessageStatusType.DELIVERED).length,
      total: otherStatuses.length
    };
  }, [statuses, currentUserId]);

  if (total === 0) {
    return <Check className="h-3 w-3 text-muted-foreground" />;
  }

  return (
    <>
      {readCount === total ? (
        <CheckCheck className="h-3 w-3 text-blue-500" />
      ) : readCount > 0 ? (
        <CheckCheck className="h-3 w-3 text-muted-foreground" />
      ) : deliveredCount === total ? (
        <CheckCheck className="h-3 w-3 text-muted-foreground" />
      ) : deliveredCount > 0 ? (
        <Check className="h-3 w-3 text-muted-foreground" />
      ) : (
        <Check className="h-3 w-3 text-muted-foreground" />
      )}
      <span className="text-[10px] text-muted-foreground">
        {readCount > 0 ? readCount : deliveredCount}
      </span>
    </>
  );
});

GroupMessageStatus.displayName = 'GroupMessageStatus';


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
};

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
      return "grid-cols-2 sm:grid-cols-3";
  }
};

const getImageClass = (count: number, index: number) => {
  if (count === 1) {
    return "max-w-[280px] sm:max-w-md max-h-[280px] sm:max-h-96";
  }
  if (count === 3 && index === 0) {
    return "row-span-2";
  }
  return "";
};

const isSingleEmoji = (content: string) => {
  const trimmed = content.trim();
  const div = document.createElement('div');
  div.innerHTML = parseEmoji(trimmed);
  const emojiElements = div.getElementsByClassName('emoji');
  return emojiElements.length === 1 && div.textContent?.trim() === '';
};

interface ChatMessageProps {
  message: IChatMessage;
  isCurrentUser: boolean;
  chatType: ChatType | undefined;
  currentUserId: number;
  isEditing: boolean;
  onEditMessage: (id: number, content: string) => void;
  setMessageToDelete: (id: number) => void;
  playingAudioId: string | null;
  setPlayingAudio: (id: string | null) => void;
}

export const ChatMessage = memo(({
  message,
  isCurrentUser,
  chatType,
  currentUserId,
  isEditing,
  onEditMessage,
  setMessageToDelete,
  setPlayingAudio
}: ChatMessageProps) => {
  const handleDownload = useCallback(async (url: string, fileName: string) => {
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
  }, []);

  const renderAttachments = useCallback((attachments: Attachment[] | undefined, isCurrentUser: boolean) => {
    if (!attachments) return null;
    
    const images = attachments.filter(att => att.type === AttachmentType.IMAGE);
    const voiceMessages = attachments.filter(att => att.type === AttachmentType.VOICE);
    const otherFiles = attachments.filter(att => 
      att.type !== AttachmentType.IMAGE && att.type !== AttachmentType.VOICE
    );

    return (
      <div className="flex flex-col gap-1.5 sm:gap-2">
        {images.length > 0 && (
          <div className={cn(
            "grid gap-1 sm:gap-1.5",
            getGridClass(images.length)
          )}>
            {images.map((att, idx) => {
              const fullUrl = resolveAttachmentUrl(att.url);
              return (
                <div 
                  key={att.id}
                  className={cn(
                    "relative overflow-hidden rounded-md border transition-colors duration-200 group cursor-pointer",
                    isCurrentUser ? "border-white/10" : "border-border",
                    images.length === 1 ? "flex justify-center" : "aspect-square",
                    getImageClass(images.length, idx)
                  )}
                  onClick={() => window.open(fullUrl, '_blank')}
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
                      className="size-7 sm:size-8 rounded-full cursor-pointer hover:bg-background/80"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(fullUrl, att.fileName);
                      }}
                    >
                      <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {voiceMessages.length > 0 && (
          <div className="flex flex-col gap-1.5 sm:gap-2">
            {voiceMessages.map((att) => {
              const fullUrl = resolveAttachmentUrl(att.url);
              const audioId = `audio-${att.id}`;
              return (
                <div 
                  key={att.id}
                  className={cn(
                    "rounded-md overflow-hidden border transition-colors duration-200",
                    isCurrentUser ? "border-white/10" : "border-border"
                  )}
                >
                  <div className="p-1.5 sm:p-2">
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
              const fullUrl = resolveAttachmentUrl(att.url);
              return (
                <div 
                  key={att.id}
                  className={cn(
                    "rounded-md overflow-hidden border transition-colors duration-200 group cursor-pointer",
                    isCurrentUser ? "border-white/10" : "border-border"
                  )}
                  onClick={() => window.open(fullUrl, '_blank')}
                >
                  <div className="flex items-center gap-2 p-1.5 sm:p-2">
                    <div className="flex-1 flex items-center gap-2 transition-colors rounded-md p-1 sm:p-1.5">
                      <div className="flex-shrink-0">
                        {getAttachmentIcon(att.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs sm:text-sm font-medium break-all">
                          {att.fileName}
                        </div>
                        <div className="text-[10px] sm:text-xs opacity-70">
                          {att.type.toLowerCase()}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className={cn(
                        "size-7 sm:size-8 rounded-full cursor-pointer",
                        isCurrentUser ? "hover:bg-white/10 hover:text-white" : "hover:bg-border"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(fullUrl, att.fileName);
                      }}
                    >
                      <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }, [handleDownload, setPlayingAudio]);

  const hasAttachments = Array.isArray(message.attachments) && message.attachments.length > 0;
  const hasContent = message?.content?.trim().length > 0;
  const isSingleEmojiMessage = hasContent && isSingleEmoji(message.content);

  const messageDirection = message.content ? isFirstLetterArabic(message.content) : false;

  return (
    <div className={cn(
      "flex gap-1.5 sm:gap-2 md:gap-3 group/message",
      isCurrentUser && "flex-row-reverse"
    )}>
      {chatType === ChatType.GROUP && !isCurrentUser && (
        <Avatar 
          path={message.senderProfilePicture} 
          name={message.senderName}
          className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 flex-shrink-0"
        />
      )}
      <div className={cn(
        "flex flex-col gap-0.5 sm:gap-1 relative", 
        isCurrentUser ? "items-end" : "items-start",
        "max-w-[75%] sm:max-w-[70%] md:max-w-[65%]"
      )}>
        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2">
          {chatType === ChatType.GROUP && !isCurrentUser && (
            <span className="text-xs sm:text-xs md:text-sm font-medium">
              {message.senderName}
            </span>
          )}
          <div className="flex items-center gap-0.5 sm:gap-1">
            {message.createdAt && (
              <span className="text-xs sm:text-[10px] md:text-xs text-muted-foreground">
                {format(new Date(message.createdAt), "h:mm a")}
              </span>
            )}
            {isCurrentUser && message.statuses && (
              <div className="ml-1 flex items-center gap-0.5">
                {chatType === ChatType.INDIVIDUAL ? (
                  <PrivateMessageStatus 
                    statuses={message.statuses} 
                    currentUserId={currentUserId} 
                  />
                ) : (
                  <GroupMessageStatus 
                    statuses={message.statuses} 
                    currentUserId={currentUserId} 
                  />
                )}
              </div>
            )}

            {isCurrentUser && message.id && !isEditing && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 opacity-0 group-hover/message:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isCurrentUser ? "end" : "start"} className="min-w-[100px]">
                  <DropdownMenuItem
                    onClick={() => onEditMessage(message.id, message.content)}
                    className="text-xs sm:text-xs md:text-sm"
                  >
                    <Pencil className="mr-1.5 h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => setMessageToDelete(message.id)}
                    className="text-xs sm:text-xs md:text-sm"
                  >
                    <Trash2 className="mr-1.5 h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      
        {hasAttachments && (
          <div
            className={cn(
              "rounded-lg p-1 sm:p-1.5 md:p-2 w-full",
              isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted"
            )}
          >
            {renderAttachments(message.attachments, isCurrentUser)}
          </div>
        )}
        
        {hasContent && (
          <div
            className={cn(
              "rounded-lg p-1.5 sm:p-2 md:p-2.5 text-sm sm:text-sm md:text-base",
              "whitespace-pre-wrap break-word overflow-wrap-anywhere hyphens-auto",
              messageDirection ? "text-right" : "text-left",
              isSingleEmojiMessage 
                ? "!p-0"
                : isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted"
            )}
            dir={messageDirection ? "rtl" : "ltr"}
          >
            <span
              className={cn(
                "[&_img.emoji]:inline-block [&_img.emoji]:align-[-0.3em] [&_img.emoji]:my-0 [&_img.emoji]:mx-[0.1em]",
                isSingleEmojiMessage 
                  ? "[&_img.emoji]:size-[3em] sm:[&_img.emoji]:size-[4em] md:[&_img.emoji]:size-[5em] [&_img.emoji]:align-middle [&_img.emoji]:m-0"
                  : "[&_img.emoji]:size-[1em] sm:[&_img.emoji]:size-[1.1em] md:[&_img.emoji]:size-[1.2em]"
              )}
              dir={messageDirection ? "rtl" : "ltr"}
              dangerouslySetInnerHTML={{
                __html: parseEmoji(message.content),
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
});

ChatMessage.displayName = 'ChatMessage';