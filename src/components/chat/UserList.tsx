"use client"

import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { chatService } from "@/services/chatService"
import { UserStatus } from '@/types/user'
import { userService } from "@/services/userService"
import { UserProfile } from "@/types/user"
import { getApiBaseUrl, resolveAvatar } from "@technway/rvnjs"
import Avatar from "./Avatar"

interface UserListProps {
  search: string
  onSelectUser: (user: UserProfile) => void
}

export function UserList({ search, onSelectUser }: UserListProps) {
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
      {filteredUsers.map((user) => (
        <button
          key={user.id}
          onClick={() => handleUserSelect(user)}
          className={cn(
            "flex items-center gap-3 p-4 hover:bg-accent transition-colors",
            "border-b last:border-b-0"
          )}
        >
          <div className="relative">
            <Avatar
              path={user.profilePicture}
              name={user.name}
            />
            <span
              className={cn(
                "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background",
                user.status === UserStatus.ONLINE ? "bg-green-500" : "bg-gray-400"
              )}
            />
          </div>
          <div className="flex-1 text-left">
            <div className="flex items-center justify-between">
              <p className="font-medium">{user.name}</p>
              <span className={cn(
                "text-xs",
                user.status === UserStatus.ONLINE ? "text-green-500" : "text-gray-400"
              )}>
                {user.status.toLowerCase()}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              @{user.username}
            </p>
          </div>
        </button>
      ))}
    </div>
  )
}
