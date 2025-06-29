'use client'

import { useRouter, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useChat } from '@/hooks/useChat'
import { useAuth } from '@/hooks'
import { useMemo, useState, useEffect } from 'react'
import { MoreVertical, Trash2, Image, Video, Music, File, Mic, Users } from 'lucide-react'
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { UserStatus } from '@/types/user'
import { formatMessageDate } from '@/utils/date'
import { parseEmoji } from '@/utils/emoji'
import { userService } from '@/services/userService'
import { UserProfile } from '@/types/user'
import Avatar from './Avatar'
import { ChatMessage, AttachmentType, ChatType } from '@/types/chat'

interface ConversationListProps {
  search: string
}

const statusConfig = {
  [UserStatus.ONLINE]: { label: 'Online', color: 'bg-green-500' },
  [UserStatus.AWAY]: { label: 'Away', color: 'bg-yellow-500' },
  [UserStatus.OFFLINE]: { label: 'Offline', color: 'bg-gray-400' },
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
        const isGroup = chat.type === ChatType.GROUP

        if (isActive) return true

        if (isGroup) {
          return chat.name?.toLowerCase().includes(search.toLowerCase())
        }

        if (!hasMsg) return false

        const other = chat.participants.find(p => p.id !== auth.userId)
        return other?.name?.toLowerCase().includes(search.toLowerCase())
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
      if (chatToDelete === activeChatId) router.push('/chat')
    } catch (error) {
      console.error('Failed to delete chat:', error)
    } finally {
      setChatToDelete(null)
    }
  }

  const getAttachmentIcon = (type: AttachmentType) => {
    switch (type) {
      case AttachmentType.IMAGE: return <Image className="h-4 w-4 text-blue-500" />
      case AttachmentType.VIDEO: return <Video className="h-4 w-4 text-purple-500" />
      case AttachmentType.AUDIO: return <Music className="h-4 w-4 text-green-500" />
      case AttachmentType.VOICE: return <Mic className="h-4 w-4 text-green-500" />
      case AttachmentType.GIF: return <Image className="h-4 w-4 text-teal-500" />
      default: return <File className="h-4 w-4 text-gray-500" />
    }
  }

  const truncateText = (text: string, maxLength: number = 30) => {
    if (!text) return ''
    if (text.length <= maxLength) return text
    if (!text.includes(' ')) return text.substring(0, maxLength - 3) + '...'
    const words = text.split(' ')
    let result = ''
    for (const word of words) {
      const nextWord = word.length > maxLength - 3 ? word.substring(0, maxLength - 3) + '...' : word
      if ((result + ' ' + nextWord).length > maxLength) return result.trim() + '...'
      result += (result ? ' ' : '') + nextWord
    }
    return result
  }

  const getAttachmentPreview = (msg: ChatMessage): React.ReactNode => {
    const attachment = msg.attachments?.[0]
    if (!attachment) return null
    const label = attachment.fileName || truncateText({
      [AttachmentType.IMAGE]: "Image",
      [AttachmentType.VIDEO]: "Video",
      [AttachmentType.AUDIO]: "Audio",
      [AttachmentType.VOICE]: "Voice message",
      [AttachmentType.GIF]: "GIF",
      [AttachmentType.DOCUMENT]: "Document",
    }[attachment.type] || "Attachment", 25)

    return (
      <div className="flex items-center gap-2 text-muted-foreground min-w-0">
        <div className="flex-shrink-0 flex items-center justify-center">
          {getAttachmentIcon(attachment.type)}
        </div>
        <div className="max-w-[140px] sm:max-w-[160px] min-w-0">
          <span className="text-xs font-medium truncate block">{label}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="overflow-y-auto flex-1">
        {filteredAndSorted.map(chat => {
          const isGroup = chat.type === ChatType.GROUP
          const other = isGroup ? null : chat.participants.find(p => p.id !== auth.userId)
          const lastMsg = chat.lastMessage
          const isActive = chat.id === activeChatId
          const userStatus = !isGroup && other ? users.find(u => u.id === other.id)?.status || UserStatus.OFFLINE : null

          let senderPrefix = ''
          if (lastMsg) {
            if (lastMsg.senderId === auth.userId) senderPrefix = 'You: '
            else if (isGroup) {
              const sender = chat.participants.find(p => p.id === lastMsg.senderId)
              senderPrefix = sender ? `${sender.name}: ` : ''
            }
          }

          return (
            <div
              key={chat.id}
              className={cn(
                "flex items-center gap-3 px-4 py-3 transition-all duration-200 group relative",
                "border-b last:border-b-0 border-gray-300",
                isActive
                  ? "bg-gray-200/60 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5 before:bg-primary"
                  : "hover:bg-gray-100"
              )}
            >
              <div
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/chat/${chat.id}`)}
                className="flex items-center gap-3 flex-1 min-w-0"
              >
                <div className="relative flex-shrink-0">
                  <Avatar
                    path={isGroup ? chat.avatarUrl : other?.profilePicture}
                    name={isGroup ? chat.name! : other?.name!}
                  />
                  {!isGroup && userStatus && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className={cn(
                            "absolute bottom-0 right-0 w-[10px] h-[10px] rounded-full",
                            "border-[1.5px] border-white shadow-sm",
                            statusConfig[userStatus].color
                          )} />
                        </TooltipTrigger>
                        <TooltipContent side="right" align="center" className="text-xs">
                          {statusConfig[userStatus].label}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  {isGroup && (
                    <span className="absolute bottom-0 right-0 bg-gray-200 rounded-full p-1 flex items-center justify-center">
                      <Users className="h-3 w-3 text-gray-700" />
                    </span>
                  )}
                </div>

                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className="font-medium truncate text-gray-900">
                      {isGroup ? chat.name : other?.name}
                    </p>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {lastMsg?.createdAt && (
                        <span className="text-[11px] text-gray-500 whitespace-nowrap">
                          {formatMessageDate(new Date(lastMsg.createdAt))}
                        </span>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1.5 rounded-full hover:bg-gray-100 data-[state=open]:bg-gray-100 transition-colors">
                            <MoreVertical className="h-4 w-4 text-gray-500" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                            onClick={e => {
                              e.stopPropagation()
                              setChatToDelete(chat.id)
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4 text-current" />
                            <span>Delete chat</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex-1 min-h-[20px] min-w-0">
                      {lastMsg?.content?.trim() ? (
                        <div className="flex items-center gap-1 min-w-0 flex-1">
                          {(lastMsg?.attachments?.length ?? 0) > 0 && (
                            <span className="flex-shrink-0 text-gray-500">
                              {getAttachmentIcon(lastMsg.attachments?.[0]?.type ?? AttachmentType.DOCUMENT)}
                            </span>
                          )}
                          <div className="max-w-[230px] min-w-0 flex-1">
                            <span
                              className="text-[13px] text-gray-600 block truncate
                              [&_img.emoji]:inline-block [&_img.emoji]:size-[1.15em] [&_img.emoji]:align-[-0.3em]
                              [&_img.emoji]:my-0 [&_img.emoji]:mx-[0.075em]"
                              title={lastMsg.content}
                              dangerouslySetInnerHTML={{
                                __html: parseEmoji(`${senderPrefix}${lastMsg.content}`),
                              }}
                            />
                          </div>
                        </div>
                      ) : lastMsg?.attachments?.length ? (
                        <div className="flex items-center gap-1 min-w-0 flex-1">
                          <span className="text-[13px] text-gray-600 truncate block flex-shrink-0">
                            {senderPrefix}
                          </span>
                          <div className="max-w-[230px] min-w-0 truncate">
                            {getAttachmentPreview(lastMsg)}
                          </div>
                        </div>
                      ) : (
                        <span className="italic text-xs text-gray-500/75 truncate block">
                          {isGroup ? "Group created" : "No messages yet"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

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
            <AlertDialogAction onClick={handleDeleteChat} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
