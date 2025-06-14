"use client"

import * as React from "react"
import { Paperclip, Send, Smile } from "lucide-react"
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

interface ChatInputProps {
  conversationId: string
  onMessageSent?: () => void
}

export function ChatInput({ conversationId, onMessageSent }: ChatInputProps) {
  const { sendMessage } = useChat(Number(conversationId))
  const [message, setMessage] = React.useState("")
  const [isSending, setIsSending] = React.useState(false)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSend = async () => {
    if (!message.trim() || isSending) return
    
    try {
      setIsSending(true)
      await sendMessage(message.trim())
      setMessage("")
      onMessageSent?.()
    } catch (error) {
      console.error("Failed to send message:", error)
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
    
    // Set cursor position after the inserted emoji
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPosition = cursorPosition + emoji.native.length
        textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition)
        textareaRef.current.focus()
      }
    }, 0)
  }

  return (
    <div className="flex items-end gap-2">
      <div className="flex-1 flex items-end gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" variant="ghost">
              <Paperclip className="h-5 w-5" />
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
          placeholder="Type a message..."
          className="min-h-[50px] max-h-[200px] flex-1"
          rows={1}
          disabled={isSending}
        />
      </div>
      <Button
        size="icon"
        onClick={handleSend}
        disabled={!message.trim() || isSending}
      >
        <Send className="h-5 w-5" />
      </Button>
    </div>
  )
} 