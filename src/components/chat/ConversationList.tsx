'use client'

import { useRouter, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useChat } from '@/hooks/useChat'
import { useAuth } from '@/hooks'
import { useMemo, useState, useEffect } from 'react'
import { MoreVertical, Trash2, Image, Video, Music, File, Mic } from 'lucide-react'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserStatus } from '@/types/user'
import { formatMessageDate } from '@/utils/date'
import { parseEmoji } from '@/utils/emoji'
import { userService } from '@/services/userService'
import { UserProfile } from '@/types/user'
import Avatar from './Avatar'
import { ChatMessage, AttachmentType } from '@/types/chat'

interface ConversationListProps {
  search: string
}

export function ConversationList({ search }: ConversationListProps) {
  const router = useRouter()
  const pathname = usePathname()
  const activeChatId = Number(pathname.split('/').pop())
  const { chats, deleteChat } = useChat()
  const { auth } = useAuth()
  const [chatToDelete, setChatToDelete] = useState<number | null>(null)
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await userService.getUsers()
        setUsers(data)
      } catch (error) {
        console.error("Failed to fetch users:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
    const interval = setInterval(fetchUsers, 15000)
    return () => clearInterval(interval)
  }, [])

  const filteredAndSorted = useMemo(() => {
    return chats
      .filter(chat => {
        const hasMsg = !!chat.lastMessage
        const isActive = chat.id === activeChatId
        if (!(hasMsg || isActive)) return false

        const other = chat.participants.find(p => p.userId !== auth.userId)
        return other?.name.toLowerCase().includes(search.toLowerCase())
      })
      .sort((a, b) => {
        const aTime = new Date(a.lastMessage?.createdAt ?? 0).getTime()
        const bTime = new Date(b.lastMessage?.createdAt ?? 0).getTime()
        return bTime - aTime
      })
  }, [chats, auth.userId, search, activeChatId])

  const handleDeleteChat = async () => {
    if (!chatToDelete) return

    try {
      await deleteChat(chatToDelete)
      if (chatToDelete === activeChatId) {
        router.push('/chat')
      }
    } catch (error) {
      console.error('Failed to delete chat:', error)
    } finally {
      setChatToDelete(null)
    }
  }

  // Helper to get just the attachment icon
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
      case AttachmentType.GIF:
        return <Image className="h-4 w-4 text-teal-500" />;
      case AttachmentType.DOCUMENT:
      default:
        return <File className="h-4 w-4 text-gray-500" />;
    }
  };

  const getAttachmentPreview = (msg: ChatMessage): React.ReactNode => {
    const attachment = msg.attachments?.[0];
    if (!attachment) return null;
    
    const getLabel = () => {
      switch (attachment.type) {
        case AttachmentType.IMAGE:
          return "Image";
        case AttachmentType.VIDEO:
          return "Video";
        case AttachmentType.AUDIO:
          return "Audio";
        case AttachmentType.VOICE:
          return "Voice message";
        case AttachmentType.GIF:
          return "GIF";
        case AttachmentType.DOCUMENT:
          return "Document";
        default:
          return "Attachment";
      }
    };

    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <div className="flex items-center justify-center">
          {getAttachmentIcon(attachment.type)}
        </div>
        <span className="text-xs font-medium">{getLabel()}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {filteredAndSorted.map(chat => {
        const other = chat.participants.find(p => p.userId !== auth.userId)
        if (!other) return null

        const lastMsg = chat.lastMessage
        const userStatus = users.find(u => u.id === other.userId)?.status || 'OFFLINE'
        const isActive = chat.id === activeChatId

        return (
          <div
            key={chat.id}
            className={cn(
              "flex items-center gap-3 p-4 transition-colors group",
              "border-b last:border-b-0",
              isActive 
                ? "bg-primary/10 dark:bg-primary/20" 
                : "hover:bg-accent"
            )}
          >
            <button
              onClick={() => router.push(`/chat/${chat.id}`)}
              className="flex items-center gap-3 flex-1"
            >
              <div className="relative">
                <Avatar
                  path={other.profilePicture}
                  name={other.name}
                />
                <span
                  className={cn(
                    "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background",
                    userStatus === UserStatus.ONLINE ? "bg-green-500" : "bg-gray-400"
                  )}
                />
              </div>

              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="font-medium truncate">{other.name}</p>
                  {lastMsg?.createdAt && (
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatMessageDate(new Date(lastMsg.createdAt))}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-xs whitespace-nowrap",
                    userStatus === UserStatus.ONLINE 
                      ? "text-green-500" 
                      : "text-gray-400"
                  )}>
                    {userStatus.toLowerCase()}
                  </span>
                  
                  <div className="flex-1 truncate min-h-[20px]">
                    {lastMsg?.content?.trim() ? (
                      <div className="flex items-center gap-1">
                        <span
                          className="text-sm text-muted-foreground truncate inline-flex items-center [&_img.emoji]:inline-block [&_img.emoji]:size-[1.15em] [&_img.emoji]:align-[-0.3em] [&_img.emoji]:my-0 [&_img.emoji]:mx-[0.075em]"
                          dangerouslySetInnerHTML={{
                            __html: parseEmoji(lastMsg.content),
                          }}
                        />
                        {(lastMsg?.attachments?.length ?? 0) > 0 && (
                          <span className="flex-shrink-0 text-muted-foreground">
                            {getAttachmentIcon(lastMsg.attachments?.[0]?.type ?? AttachmentType.DOCUMENT)}
                          </span>
                        )}
                      </div>
                    ) : lastMsg?.attachments?.length ? (
                      getAttachmentPreview(lastMsg)
                    ) : (
                      <span className="italic text-xs text-muted-foreground">
                        No messages yet
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={cn(
                  "opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 transition-opacity p-2 rounded-full",
                  isActive ? "opacity-100" : "",
                  "hover:bg-accent/50 data-[state=open]:bg-accent"
                )}>
                  <MoreVertical className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation()
                    setChatToDelete(chat.id)
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete chat</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      })}

      <AlertDialog open={!!chatToDelete} onOpenChange={() => setChatToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this chat? This will only remove it from your view.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteChat}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}