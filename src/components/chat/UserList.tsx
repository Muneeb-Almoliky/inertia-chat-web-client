'use client'

import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { Loader2, MoreVertical, Check } from "lucide-react"
import { toast } from "sonner"
import { chatService } from "@/services/chatService"
import { UserStatus } from '@/types/user'
import { userService } from "@/services/userService"
import { UserProfile } from "@/types/user"
import Avatar from "./Avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ChatType } from "@/types/chat"

interface UserListProps {
  search: string
  mode: ChatType.INDIVIDUAL | ChatType.GROUP
  onSelectUser: (user: UserProfile) => void
  selectedUsers?: UserProfile[]
}

const statusConfig = {
  [UserStatus.ONLINE]: { label: 'Online', color: 'bg-green-500' },
  [UserStatus.AWAY]: { label: 'Away', color: 'bg-yellow-500' },
  [UserStatus.OFFLINE]: { label: 'Offline', color: 'bg-gray-400' },
}

export function UserList({ 
  search, 
  mode,
  onSelectUser,
  selectedUsers = []
}: UserListProps) {
  const router = useRouter()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await userService.getUsers()
        setUsers(data)
      } catch (error) {
        console.error("Failed to fetch users:", error)
        toast.error("Failed to load users")
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])

  const handleUserSelect = async (user: UserProfile) => {
    // In group mode, just toggle participant selection
    if (mode === ChatType.GROUP) {
      onSelectUser(user)
      return
    }
    
    // In individual mode, start a chat
    try {
      const chatId = await chatService.findOrCreateOneToOneChat(user.id)
      router.push(`/chat/${chatId}`)
      onSelectUser(user)
    } catch (error) {
      console.error("Failed to start chat:", error)
      toast.error("Failed to start chat")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(search.toLowerCase()) ||
      user.name.toLowerCase().includes(search.toLowerCase())
  )

  if (filteredUsers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
        <p>No users found</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {filteredUsers.map((user) => {
        const isSelected = selectedUsers.some(u => u.id === user.id)
        
        return (
          <button
            key={user.id}
            onClick={() => handleUserSelect(user)}
            className={cn(
              "flex items-center gap-3 px-4 py-3 transition-all duration-200 group relative",
              "border-b last:border-b-0 border-gray-300",
              "hover:bg-gray-100",
              isSelected && "bg-blue-50"
            )}
          >
            <div className="relative flex-shrink-0">
              <Avatar
                path={user.profilePicture}
                name={user.name}
              />
              {mode === ChatType.INDIVIDUAL && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        className={cn(
                          "absolute bottom-0 right-0 w-[10px] h-[10px] rounded-full",
                          "border-[1.5px] border-white shadow-sm",
                          statusConfig[user.status].color
                        )}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="right" align="center" className="text-xs">
                      {statusConfig[user.status].label}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>

            <div className="flex-1 text-left min-w-0">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <p className="font-medium truncate text-gray-900">{user.name}</p>
                {mode === ChatType.INDIVIDUAL ? (
                  <span className={cn(
                    "text-[11px] text-gray-500 whitespace-nowrap",
                    user.status === UserStatus.ONLINE ? "text-green-500" : "text-gray-500"
                  )}>
                    {user.status.toLowerCase()}
                  </span>
                ) : (
                  isSelected && (
                    <div className="bg-blue-500 rounded-full p-1">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )
                )}
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex-1 min-h-[20px] min-w-0">
                  <span className="text-[13px] text-gray-600 truncate block">
                    @{user.username}
                  </span>
                </div>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}