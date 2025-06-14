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
import { useChat } from "@/hooks/useChat"

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
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" variant="ghost">
              <Smile className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Add emoji</TooltipContent>
        </Tooltip>
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