"use client"

import * as React from "react"
import { useState, useRef, useEffect, FormEvent, ChangeEvent, ClipboardEvent, KeyboardEvent } from "react"
import { Paperclip, Send, Smile, X, Mic, Square, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import EmojiPicker, { EmojiStyle, Theme, EmojiClickData } from 'emoji-picker-react'
import { useChat } from "@/hooks/useChat"
import { toast } from "sonner"
import { formatFileSize, getFileType, getFileIcon, isVoiceMessage } from "@/utils/file"
import { formatTime } from "@/utils/audio"
import { MAX_FILE_SIZE, MAX_FILE_SIZE_LABEL } from "@/constants/file"
import { VoiceMessagePlayer } from "./VoiceMessagePlayer"
import * as Popover from '@radix-ui/react-popover'
import twemoji from 'twemoji'
import { cn } from "@/lib/utils"
import { useChatStore } from "@/lib/store/chat.store"

interface ChatInputProps {
  conversationId: string
  onMessageSent?: () => void
  isEditing?: boolean
  onUpdateMessage?: (messageId: number, content: string) => void
  isMainInput?: boolean
}
export function ChatInput({ conversationId, onMessageSent, isEditing = false, onUpdateMessage }: ChatInputProps) {
  const { sendMessage } = useChat(Number(conversationId))
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const inputRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [attachments, setAttachments] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<{ [key: string]: string }>({})
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingTimerRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const audioChunksRef = useRef<Blob[]>([])
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  const { editingMessage, setEditingMessage } = useChatStore();

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioUrl])

  useEffect(() => {
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

  useEffect(() => {
    if (editingMessage && inputRef.current) {
      setMessage(editingMessage.content);
      inputRef.current.innerHTML = editingMessage.content;
    }
  }, [editingMessage]);

  const convertTextToEmojiImages = (text: string) => {
    return twemoji.parse(text, {
      folder: '72x72',
      ext: '.png',
      base: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/',
      className: 'emoji',
      attributes: (icon) => {
        return {
          alt: icon
        }
      }
    });
  };

  const getCaretPosition = (element: HTMLElement) => {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return 0;

    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(element);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    
    // Count emoji elements as single characters
    let length = 0;
    const nodes = Array.from(preCaretRange.cloneContents().childNodes);
    nodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        length += node.textContent?.length || 0;
      } else if (node.nodeType === Node.ELEMENT_NODE && (node as Element).classList.contains('emoji')) {
        length += 1;
      }
    });
    
    return length;
  };

  const setCaretPosition = (element: HTMLElement, position: number) => {
    const selection = window.getSelection();
    if (!selection) return;

    let currentPos = 0;
    const range = document.createRange();

    const traverse = (node: Node): boolean => {
      if (currentPos >= position) {
        return true;
      }

      if (node.nodeType === Node.TEXT_NODE) {
        const length = node.textContent?.length || 0;
        if (currentPos + length >= position) {
          range.setStart(node, position - currentPos);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
          return true;
        }
        currentPos += length;
      } else if (node.nodeType === Node.ELEMENT_NODE && (node as Element).classList.contains('emoji')) {
        currentPos += 1;
        if (currentPos === position) {
          range.setStartAfter(node);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
          return true;
        }
      } else {
        for (const child of Array.from(node.childNodes)) {
          if (traverse(child)) {
            return true;
          }
        }
      }
      return false;
    };

    traverse(element);
  };

  const handleInput = (e: FormEvent<HTMLDivElement>) => {
    const content = e.currentTarget.innerHTML;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;

    // Store current caret position
    const caretPos = getCaretPosition(e.currentTarget);

    // Find text nodes that are not inside emoji images
    const textNodes: Node[] = [];
    const walker = document.createTreeWalker(
      tempDiv,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
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
    let contentChanged = false;
    textNodes.forEach(node => {
      if (node.textContent) {
        const converted = convertTextToEmojiImages(node.textContent);
        if (converted !== node.textContent) {
          contentChanged = true;
          const wrapper = document.createElement('div');
          wrapper.innerHTML = converted;
          node.parentNode?.replaceChild(wrapper.firstChild!, node);
        }
      }
    });

    e.currentTarget.innerHTML = tempDiv.innerHTML;
    setMessage(tempDiv.innerHTML);

    // Restore caret position if no emoji conversion happened
    if (!contentChanged) {
      setCaretPosition(e.currentTarget, caretPos);
    }
  };

  const handlePaste = (e: ClipboardEvent) => {
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

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
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
    if ((!message.trim() && attachments.length === 0) || isSending || isRecording) return
    try {

      if (isEditing && editingMessage && onUpdateMessage) {
        const cleanedMessage = cleanMessageContent(message);
        onUpdateMessage(editingMessage.id, cleanedMessage.trim());
        setMessage("");
      if (inputRef.current) {
        inputRef.current.innerHTML = "";
      }
      setAttachments([]);
      setImagePreviews({});
      return;
      }
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
    } catch (error: unknown) {
      console.error("Failed to send message:", error)
      const err = error as Error;
      if (err.message?.includes('File size too large')) {
        toast.error(err.message);
      } else {
        toast.error("Failed to send message. Please try again.");
      }
    } finally {
      setIsSending(false)
    }
  }

  const onEmojiSelect = (emojiData: EmojiClickData) => {
    if (inputRef.current) {
      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) return;

      const range = selection.getRangeAt(0);
      const container = range.startContainer;
      const offset = range.startOffset;
      
      // Create emoji image element
      const img = document.createElement('img');
      img.src = emojiData.imageUrl;
      img.alt = emojiData.emoji;
      img.className = 'emoji';
      img.draggable = false;
      img.style.width = '1.25em';
      img.style.height = '1.25em';
      img.style.verticalAlign = '-0.25em';
      img.style.margin = '0 0.05em 0 0.1em';

      if (container.nodeType === Node.TEXT_NODE) {
        // Split text node at cursor position
        const textContent = container.textContent || '';
        const beforeText = textContent.substring(0, offset);
        const afterText = textContent.substring(offset);

        // Create text nodes for before and after content
        const beforeNode = document.createTextNode(beforeText);
        const afterNode = document.createTextNode(afterText);

        // Replace the original text node with: beforeText + emoji + afterText
        const fragment = document.createDocumentFragment();
        fragment.appendChild(beforeNode);
        fragment.appendChild(img);
        fragment.appendChild(afterNode);
        container.parentNode?.replaceChild(fragment, container);

        // Set cursor after emoji
        const newRange = document.createRange();
        newRange.setStartAfter(img);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
      } else if (container.nodeType === Node.ELEMENT_NODE) {
        // If we're in the contenteditable div itself
        const childNodes = Array.from(container.childNodes);
        
        if (childNodes.length === 0 || offset >= childNodes.length) {
          // If empty or cursor at end, just append
          container.appendChild(img);
        } else {
          // Insert before the node at current position
          container.insertBefore(img, childNodes[offset]);
        }

        // Set cursor after emoji
        const newRange = document.createRange();
        newRange.setStartAfter(img);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
      }

      // Update message content and focus
      setMessage(inputRef.current.innerHTML);
      inputRef.current.focus();
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

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
      return
    }

    // Handle delete and backspace
    if (e.key === "Delete" || e.key === "Backspace") {
      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) return;

      const range = selection.getRangeAt(0);
      if (range.collapsed) {
        const currentPosition = getCaretPosition(inputRef.current!);
        
        // Get the actual node where the cursor is
        const container = range.startContainer;
        const offset = range.startOffset;

        let elementToCheck: Node | null = null;

        if (container.nodeType === Node.TEXT_NODE) {
          // If we're in a text node, check if we're at its boundaries
          if (e.key === "Delete") {
            // For Delete key, if we're at the end of text node, look at next sibling
            if (offset === container.textContent?.length) {
              elementToCheck = container.nextSibling;
            }
          } else { // Backspace
            // For Backspace, if we're at the start of text node, look at previous sibling
            if (offset === 0) {
              elementToCheck = container.previousSibling;
            }
          }
        } else if (container.nodeType === Node.ELEMENT_NODE) {
          // If we're in an element node (like the contenteditable div)
          const childNodes = Array.from(container.childNodes);
          if (e.key === "Delete") {
            elementToCheck = childNodes[offset];
          } else { // Backspace
            elementToCheck = childNodes[offset - 1];
          }
        }

        // If we're about to delete an emoji
        if (elementToCheck && 
            elementToCheck.nodeType === Node.ELEMENT_NODE && 
            (elementToCheck as Element).classList.contains('emoji')) {
          e.preventDefault();
          (elementToCheck as Element).remove();
          
          // Update message content
          setMessage(inputRef.current!.innerHTML);
          
          // Restore cursor position
          requestAnimationFrame(() => {
            // For backspace, move cursor back one position
            const newPosition = e.key === "Backspace" ? currentPosition - 1 : currentPosition;
            setCaretPosition(inputRef.current!, newPosition);
          });
        }
      }
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-2xl">
          {attachments.map((file, idx) => (
            <div 
              key={idx} 
              className={cn(
                "group relative flex items-center gap-2",
                "bg-white px-3 py-2 rounded-xl",
                "border border-gray-200 shadow-sm",
                "transition duration-200"
              )}
            >
              {file.type.startsWith('image/') && imagePreviews[file.name] ? (
                <div className="flex items-center gap-2">
                  <img 
                    src={imagePreviews[file.name]} 
                    alt={file.name}
                    className="h-8 w-8 object-cover rounded-lg"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-700 break-all max-w-[120px]">{file.name}</span>
                    <span className="text-xs text-gray-500">
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
                    <span className="text-sm font-medium text-gray-700 break-all max-w-[120px]">{file.name}</span>
                    <span className="text-xs text-gray-500">
                      {getFileType(file)} • {formatFileSize(file.size)}
                    </span>
                  </div>
                </div>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className={cn(
                      "size-5 p-0 ml-1",
                      "hover:bg-gray-100 hover:text-gray-700",
                      "rounded-full cursor-pointer",
                      "transition duration-200"
                    )}
                    onClick={() => removeAttachment(idx)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Remove attachment</TooltipContent>
              </Tooltip>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-end gap-2">
        <div className="flex-1 flex items-end gap-2">
          <div className="flex items-center gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className={cn(
                    "h-10 w-10",
                    "hover:bg-gray-100 hover:text-gray-700",
                    "transition duration-200"
                  )}
                  asChild
                >
                  <label>
                    <Paperclip className="h-5 w-5 text-gray-600" />
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
              <Tooltip>
                <TooltipTrigger asChild>
                  <Popover.Trigger asChild>
                    <Button 
                      size="icon" 
                      variant="ghost"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className={cn(
                        "h-10 w-10",
                        "hover:bg-gray-100 hover:text-gray-700",
                        "transition duration-200"
                      )}
                    >
                      <Smile className="h-5 w-5 text-gray-600" />
                    </Button>
                  </Popover.Trigger>
                </TooltipTrigger>
                <TooltipContent>Add emoji</TooltipContent>
              </Tooltip>
              <Popover.Portal>
                <Popover.Content 
                  className="z-50 bg-white border rounded-2xl shadow-lg"
                  side="top"
                  align="start"
                  sideOffset={8}
                >
                  <EmojiPicker
                    onEmojiClick={onEmojiSelect}
                    emojiStyle={EmojiStyle.TWITTER}
                    theme={Theme.LIGHT}
                    width={280}
                    height={350}
                    lazyLoadEmojis={true}
                  />
                  <Popover.Arrow className="fill-white" />
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
          </div>

          <div
            ref={inputRef}
            className={cn(
              "flex-1 min-h-[52px] max-h-52 overflow-y-auto overflow-x-hidden",
              "rounded-2xl bg-white",
              "px-4 py-3 text-[15px] leading-relaxed",
              "placeholder:text-gray-500",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "transition-[color,box-shadow] duration-200",
              "[&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-gray-500",
              "[&:empty]:before:pointer-events-none",
              "[&_img.emoji]:inline-block [&_img.emoji]:w-[1.25em] [&_img.emoji]:h-[1.25em]",
              "[&_img.emoji]:align-[-0.3em] [&_img.emoji]:my-0 [&_img.emoji]:mx-[0.05em]",
              "[&::-webkit-scrollbar]:w-1.5",
              "[&::-webkit-scrollbar-track]:bg-transparent",
              "[&::-webkit-scrollbar-thumb]:bg-gray-300/80",
              "[&::-webkit-scrollbar-thumb:hover]:bg-gray-300",
              "break-all whitespace-pre-wrap overflow-hidden",
              "border border-gray-200",
              isEditing ? "bg-primary/5 border-primary/20 ring-2 ring-primary/20" : ""
            )}
            contentEditable
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            data-placeholder={
              isRecording 
                ? `Recording... ${formatTime(recordingTime)}` 
                : isEditing 
                  ? "Edit your message..." 
                  : "Type a message..."
            }
            role="textbox"
            aria-multiline="true"
            aria-label="Message input"
          />
        </div>
        {isEditing ? (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setMessage("");
                    if (inputRef.current) inputRef.current.innerHTML = "";
                    setEditingMessage(null);
                  }}
                  disabled={isSending}
                  className={cn(
                    "h-10 w-10",
                    "hover:bg-gray-100 hover:text-gray-700",
                    "transition duration-200"
                  )}
                >
                  <X className="h-5 w-5 text-gray-600" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Cancel edit</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={isSending || (message.trim().length === 0 && attachments.length === 0)}
                  className={cn(
                    "h-10 w-10",
                    "bg-primary/10 hover:bg-primary/20",
                    "text-primary hover:text-primary",
                    "transition duration-200"
                  )}
                >
                  <Check className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Save changes</TooltipContent>
            </Tooltip>
          </>
        ) : (
          <>
            {isRecording ? (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">
                  {formatTime(recordingTime)}
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={stopRecording}
                      className={cn(
                        "animate-pulse h-10 w-10",
                        "bg-red-100 hover:bg-red-200",
                        "text-red-600 hover:text-red-700",
                        "transition duration-200"
                      )}
                    >
                      <Square className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Stop recording</TooltipContent>
                </Tooltip>
              </div>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={startRecording}
                    disabled={isSending}
                    className={cn(
                      "h-10 w-10",
                      "hover:bg-gray-100 hover:text-gray-700",
                      "transition duration-200"
                    )}
                  >
                    <Mic className="h-5 w-5 text-gray-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Record voice message</TooltipContent>
              </Tooltip>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={isSending || isRecording || (message.trim().length === 0 && attachments.length === 0)}
                  className={cn(
                    "h-10 w-10",
                    "bg-primary hover:bg-primary/90",
                    "text-white hover:text-white",
                    "shadow-sm",
                    "transition duration-200",
                    "disabled:bg-gray-100 disabled:text-gray-400"
                  )}
                >
                  <Send className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Send message</TooltipContent>
            </Tooltip>
          </>
        )}
      </div>
    </div>
  )
} 