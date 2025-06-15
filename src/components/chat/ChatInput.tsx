"use client"

import * as React from "react"
import { Paperclip, Send, Smile, X, Mic, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import Picker from '@emoji-mart/react'
import data from '@emoji-mart/data'
import { useChat } from "@/hooks/useChat"
import { emojiUrl, EmojiRenderProps } from "@/utils/emoji"
import { toast } from "sonner"
import { formatFileSize, getFileType, getFileIcon, isVoiceMessage } from "@/utils/file"
import { formatTime } from "@/utils/audio"
import { MAX_FILE_SIZE, MAX_FILE_SIZE_LABEL } from "@/constants/file"
import { VoiceMessagePlayer } from "./VoiceMessagePlayer"

interface ChatInputProps {
  conversationId: string
  onMessageSent?: () => void
}

export function ChatInput({ conversationId, onMessageSent }: ChatInputProps) {
  const { sendMessage } = useChat(Number(conversationId))
  const [message, setMessage] = React.useState("")
  const [isSending, setIsSending] = React.useState(false)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const [attachments, setAttachments] = React.useState<File[]>([])
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [imagePreviews, setImagePreviews] = React.useState<{ [key: string]: string }>({})
  
  const [isRecording, setIsRecording] = React.useState(false)
  const [recordingTime, setRecordingTime] = React.useState(0)
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null)
  const recordingTimerRef = React.useRef<NodeJS.Timeout | undefined>(undefined)
  const audioChunksRef = React.useRef<Blob[]>([])
  const [audioUrl, setAudioUrl] = React.useState<string | null>(null)

  React.useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioUrl])

  React.useEffect(() => {
    attachments.forEach(file => {
      if (file.type.startsWith('image/') && !imagePreviews[file.name]) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews(prev => ({
            ...prev,
            [file.name]: reader.result as string
          }));
        };
        reader.readAsDataURL(file);
      }
    });
  }, [attachments]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const oversizedFiles = newFiles.filter(file => file.size > MAX_FILE_SIZE);
      if (oversizedFiles.length > 0) {
        toast.error(`File size too large: ${oversizedFiles.map(f => f.name).join(', ')}. Maximum file size is ${MAX_FILE_SIZE_LABEL}.`);
        return;
      }
      setAttachments(prev => [...prev, ...newFiles]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  const removeAttachment = (index: number) => {
    const fileToRemove = attachments[index];
    setAttachments(prev => prev.filter((_, i) => i !== index));
    if (fileToRemove.type.startsWith('image/')) {
      setImagePreviews(prev => {
        const newPreviews = { ...prev };
        delete newPreviews[fileToRemove.name];
        return newPreviews;
      });
    }
  }

  const handleSend = async () => {
    if ((!message.trim() && attachments.length === 0) || isSending) return
    try {
      setIsSending(true)
      await sendMessage(message.trim(), attachments)
      setMessage("")
      setAttachments([])
      setImagePreviews({})
      onMessageSent?.()
    } catch (error: any) {
      console.error("Failed to send message:", error)
      if (error.message?.includes('File size too large')) {
        toast.error(error.message);
      } else {
        toast.error("Failed to send message. Please try again.");
      }
    } finally {
      setIsSending(false)
    }
  }

  const onEmojiSelect = (emoji: any) => {
    const cursorPosition = textareaRef.current?.selectionStart || 0
    const textBeforeCursor = message.substring(0, cursorPosition)
    const textAfterCursor = message.substring(cursorPosition)
    const newMessage = textBeforeCursor + emoji.native + textAfterCursor
    setMessage(newMessage)
    
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPosition = cursorPosition + emoji.native.length
        textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition)
        textareaRef.current.focus()
      }
    }, 0)
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        const audioFile = new File([audioBlob], `voice-message-${Date.now()}.webm`, { type: 'audio/webm' });
        setAttachments(prev => [...prev, audioFile]);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start voice recording. Please check your microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 bg-muted/50 rounded-lg">
          {attachments.map((file, idx) => (
            <div 
              key={idx} 
              className="group relative flex items-center gap-2 bg-background px-2 py-1 rounded-md border"
            >
              {file.type.startsWith('image/') && imagePreviews[file.name] ? (
                <div className="flex items-center gap-2">
                  <img 
                    src={imagePreviews[file.name]} 
                    alt={file.name}
                    className="h-8 w-8 object-cover rounded"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm truncate max-w-[120px]">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {getFileType(file)} • {formatFileSize(file.size)}
                    </span>
                  </div>
                </div>
              ) : isVoiceMessage(file) ? (
                <div className="flex items-center gap-2">
                  {getFileIcon(file)}
                  <VoiceMessagePlayer
                    url={audioUrl || ''}
                    duration={recordingTime}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {getFileIcon(file)}
                  <div className="flex flex-col">
                    <span className="text-sm truncate max-w-[120px]">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {getFileType(file)} • {formatFileSize(file.size)}
                    </span>
                  </div>
                </div>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="size-4.5 p-0 hover:bg-destructive hover:text-white rounded-circle cursor-pointer"
                onClick={() => removeAttachment(idx)}
              >
                <X className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-end gap-2">
        <div className="flex-1 flex items-end gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" asChild>
                <label>
                  <Paperclip className="h-5 w-5" />
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                    disabled={isSending || isRecording}
                  />
                </label>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Attach file</TooltipContent>
          </Tooltip>
          <Popover>
            <PopoverTrigger asChild>
              <Button size="icon" variant="ghost">
                <Smile className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Picker
                data={data}
                onEmojiSelect={onEmojiSelect}
                previewPosition="none"
                emojiSize={24}
                theme="light"
                icons="twemoji"
                emojiButtonSize={32}
                renderEmoji={({ emoji, size }: EmojiRenderProps) => (
                  <img
                    src={emojiUrl(emoji.native)}
                    width={size}
                    height={size}
                    alt={emoji.native}
                  />
                )}
              />
            </PopoverContent>
          </Popover>
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isRecording ? `Recording... ${formatTime(recordingTime)}` : "Type a message..."}
            className="min-h-[50px] max-h-[200px] flex-1"
            rows={1}
            disabled={isSending || isRecording}
          />
        </div>
        {isRecording ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {formatTime(recordingTime)}
            </span>
            <Button
              size="icon"
              variant="destructive"
              onClick={stopRecording}
              className="animate-pulse"
            >
              <Square className="h-5 w-5" />
            </Button>
          </div>
        ) : (
          <Button
            size="icon"
            variant="ghost"
            onClick={startRecording}
            disabled={isSending}
          >
            <Mic className="h-5 w-5" />
          </Button>
        )}
        <Button
          size="icon"
          onClick={handleSend}
          disabled={isSending || isRecording || (message.trim().length === 0 && attachments.length === 0)}
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
} 