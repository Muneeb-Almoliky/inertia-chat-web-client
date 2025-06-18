"use client"

import * as React from "react"
import { Paperclip, Send, Smile, X, Mic, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import EmojiPicker, { EmojiStyle, Theme, EmojiClickData } from 'emoji-picker-react'
import { useChat } from "@/hooks/useChat"
import { parseEmoji } from "@/utils/emoji"
import { toast } from "sonner"
import { formatFileSize, getFileType, getFileIcon, isVoiceMessage } from "@/utils/file"
import { formatTime } from "@/utils/audio"
import { MAX_FILE_SIZE, MAX_FILE_SIZE_LABEL } from "@/constants/file"
import { VoiceMessagePlayer } from "./VoiceMessagePlayer"
import * as Popover from '@radix-ui/react-popover'
import twemoji from 'twemoji'
import { cn } from "@/lib/utils"

interface ChatInputProps {
  conversationId: string
  onMessageSent?: () => void
}

export function ChatInput({ conversationId, onMessageSent }: ChatInputProps) {
  const { sendMessage } = useChat(Number(conversationId))
  const [message, setMessage] = React.useState("")
  const [isSending, setIsSending] = React.useState(false)
  const inputRef = React.useRef<HTMLDivElement>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [attachments, setAttachments] = React.useState<File[]>([])
  const [imagePreviews, setImagePreviews] = React.useState<{ [key: string]: string }>({})
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false)
  
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

  const convertTextToEmojiImages = (text: string) => {
    return twemoji.parse(text, {
      folder: '72x72',
      ext: '.png',
      base: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/',
      className: 'emoji',
      attributes: (icon, variant) => {
        return {
          alt: icon
        }
      }
    });
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const content = e.currentTarget.innerHTML;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;

    // Find text nodes that are not inside emoji images
    const textNodes: Node[] = [];
    const walker = document.createTreeWalker(
      tempDiv,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // Skip text nodes that are children of emoji images
          if (node.parentElement?.classList.contains('emoji')) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }

    // Convert only text nodes to emojis
    textNodes.forEach(node => {
      if (node.textContent) {
        const converted = convertTextToEmojiImages(node.textContent);
        if (converted !== node.textContent) {
          const wrapper = document.createElement('div');
          wrapper.innerHTML = converted;
          node.parentNode?.replaceChild(wrapper.firstChild!, node);
        }
      }
    });

    e.currentTarget.innerHTML = tempDiv.innerHTML;
    setMessage(tempDiv.innerHTML);

    // Restore cursor position at the end
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(e.currentTarget);
    range.collapse(false);
    selection?.removeAllRanges();
    selection?.addRange(range);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    const selection = window.getSelection();
    const range = selection?.getRangeAt(0);
    
    if (range) {
      range.deleteContents();
      const convertedContent = convertTextToEmojiImages(text);
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = convertedContent;
      
      const fragment = document.createDocumentFragment();
      while (tempDiv.firstChild) {
        fragment.appendChild(tempDiv.firstChild);
      }
      
      range.insertNode(fragment);
      range.collapse(false);
      
      setMessage(inputRef.current?.innerHTML || '');
    }
  };

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

  const cleanMessageContent = (html: string) => {
    const div = document.createElement('div');
    div.innerHTML = html;
    
    // Replace emoji images with their alt text (native emoji)
    div.querySelectorAll('img.emoji').forEach(img => {
      if (img instanceof HTMLImageElement) {
        img.replaceWith(img.alt);
      }
    });
    
    return div.textContent || '';
  };

  const handleSend = async () => {
    if ((!message.trim() && attachments.length === 0) || isSending) return
    try {
      setIsSending(true)
      const cleanedMessage = cleanMessageContent(message);
      await sendMessage(cleanedMessage.trim(), attachments)
      setMessage("")
      if (inputRef.current) {
        inputRef.current.innerHTML = ""
      }
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

  const onEmojiSelect = (emojiData: EmojiClickData) => {
    if (inputRef.current) {
      const img = document.createElement('img')
      img.src = emojiData.imageUrl
      img.alt = emojiData.emoji  // Just use the emoji character
      img.className = 'emoji'
      img.draggable = false
      img.style.width = '1.25em'
      img.style.height = '1.25em'
      img.style.verticalAlign = '-0.25em'
      img.style.margin = '0 0.05em 0 0.1em'

      const selection = window.getSelection()
      const range = selection?.getRangeAt(0)
      
      if (range) {
        range.deleteContents()
        range.insertNode(img)
        range.collapse(false)
        
        // Update message content
        setMessage(inputRef.current.innerHTML)
        
        // Move cursor after emoji
        const newRange = document.createRange()
        newRange.setStartAfter(img)
        newRange.collapse(true)
        selection?.removeAllRanges()
        selection?.addRange(newRange)
        
        // Focus back on input
        inputRef.current.focus()
      }
    }
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

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
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/bmp,image/tiff,image/svg+xml,image/gif,video/mp4,video/quicktime,audio/mpeg,audio/ogg,audio/wav,audio/aac,audio/x-m4a,audio/flac,audio/webm,audio/mp4,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/csv,application/rtf,application/xml,text/html,application/json"
                  />
                </label>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Attach file</TooltipContent>
          </Tooltip>
          
          <Popover.Root open={showEmojiPicker}>
            <Popover.Trigger asChild>
              <Button 
                size="icon" 
                variant="ghost"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <Smile className="h-5 w-5" />
              </Button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content 
                className="z-50 bg-background border rounded-lg shadow-md"
                side="top"
                align="start"
                sideOffset={5}
              >
                <EmojiPicker
                  onEmojiClick={onEmojiSelect}
                  emojiStyle={EmojiStyle.TWITTER}
                  theme={Theme.LIGHT}
                  width={300}
                  height={400}
                  lazyLoadEmojis={true}
                />
                <Popover.Arrow className="fill-background" />
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>

          <div
            ref={inputRef}
            className={cn(
              "flex-1 min-h-16 max-h-48 overflow-y-auto overflow-x-hidden",
              "rounded-md border border-input bg-transparent dark:bg-input/30",
              "px-3 py-2 text-base md:text-sm",
              "placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "transition-[color,box-shadow]",
              "[&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-muted-foreground",
              "[&:empty]:before:pointer-events-none",
              "[&_img.emoji]:inline-block [&_img.emoji]:w-[1.375em] [&_img.emoji]:h-[1.375em]",
              "[&_img.emoji]:align-[-0.3em] [&_img.emoji]:my-0 [&_img.emoji]:mx-[0.05em]",
              "[&::-webkit-scrollbar]:w-2",
              "[&::-webkit-scrollbar-track]:bg-transparent",
              "[&::-webkit-scrollbar-thumb]:bg-muted-foreground/20",
              "[&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground/30"
            )}
            contentEditable
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            data-placeholder={isRecording ? `Recording... ${formatTime(recordingTime)}` : "Type a message..."}
            role="textbox"
            aria-multiline="true"
            aria-label="Message input"
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