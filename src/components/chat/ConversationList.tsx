'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { useChat } from '@/hooks/useChat'
import { formatDistanceToNow } from 'date-fns'
import { useAuth } from '@/hooks'
import { useMemo, useState, useEffect } from 'react'
import { MoreVertical, Trash2 } from 'lucide-react'
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
import twemoji from 'twemoji'
import { UserStatus } from '@/types/user'
import { formatMessageDate } from '@/utils/date'
import { parseEmoji } from '@/utils/emoji'
import { userService } from '@/services/userService'
import { UserProfile } from '@/types/user'

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
        // keep chats that either have messages...
        const hasMsg = !!chat.lastMessage
        // ...or are the active chat
        const isActive = chat.id === activeChatId
        if (!(hasMsg || isActive)) return false

        const other = chat.participants.find(p => p.userId !== auth.userId)
        return other?.name.toLowerCase().includes(search.toLowerCase())
      })
      .sort((a, b) => {
        // treat missing dates as 0, so empties (unless active) end up at bottom
        const aTime = new Date(a.lastMessage?.createdAt ?? 0).getTime()
        const bTime = new Date(b.lastMessage?.createdAt ?? 0).getTime()
        return bTime - aTime
      })
  }, [chats, auth.userId, search, activeChatId])

  const handleDeleteChat = async () => {
    if (!chatToDelete) return

    try {
      await deleteChat(chatToDelete)
      // If the deleted chat was active, redirect to chat list
      if (chatToDelete === activeChatId) {
        router.push('/chat')
      }
    } catch (error) {
      console.error('Failed to delete chat:', error)
    } finally {
      setChatToDelete(null)
    }
  }

  return (
    <div className="flex flex-col">
      {filteredAndSorted.map(chat => {
        const other = chat.participants.find(p => p.userId !== auth.userId)
        if (!other) return null

        const lastMsg = chat.lastMessage
        const userStatus = users.find(u => u.id === other.userId)?.status || 'OFFLINE'

        return (
          <div
            key={chat.id}
            className={cn(
              "flex items-center gap-3 p-4 hover:bg-accent transition-colors group",
              "border-b last:border-b-0"
            )}
          >
            <button
              onClick={() => router.push(`/chat/${chat.id}`)}
              className="flex items-center gap-3 flex-1"
            >
              <div className="relative">
                <Avatar>
                  <AvatarImage src={`https://avatar.vercel.sh/${other.name}.png`} />
                  <AvatarFallback>
                    {other.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span
                  className={cn(
                    "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background",
                    userStatus === UserStatus.ONLINE ? "bg-green-500" : "bg-gray-400"
                  )}
                />
              </div>

              <div className="flex-1 text-left">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{other.name}</p>
                    <span className={cn(
                      "text-xs",
                      userStatus === UserStatus.ONLINE ? "text-green-500" : "text-gray-400"
                    )}>
                      {userStatus.toLowerCase()}
                    </span>
                  </div>
                  {lastMsg?.createdAt && (
                    <span className="text-xs text-muted-foreground">
                      {formatMessageDate(new Date(lastMsg.createdAt))}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground truncate max-w-[180px]">
                    {lastMsg?.content ? (
                      <span
                        className="inline-flex items-center [&_img.emoji]:inline-block [&_img.emoji]:size-[1.15em] [&_img.emoji]:align-[-0.3em] [&_img.emoji]:my-0 [&_img.emoji]:mx-[0.075em]"
                        dangerouslySetInnerHTML={{
                          __html: parseEmoji(lastMsg.content),
                        }}
                      />
                    ) : (
                      "No messages yet"
                    )}
                  </p>
                </div>
              </div>
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 transition-opacity p-2 hover:bg-accent data-[state=open]:bg-accent rounded-full">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                {/* <DropdownMenuItem className="cursor-pointer">
                  <Bell className="mr-2 h-4 w-4" />
                  <span>Mute notifications</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Archive className="mr-2 h-4 w-4" />
                  <span>Archive chat</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator /> */}
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
