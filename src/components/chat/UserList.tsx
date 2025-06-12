"use client"

import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { chatService } from "@/services/chatService"

interface User {
  id: number
  username: string
  name: string
  status: string
}

interface UserListProps {
  search: string
  onSelectUser: (user: User) => void
}

export function UserList({ search, onSelectUser }: UserListProps) {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await chatService.getUsers()
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

  const handleUserSelect = async (user: User) => {
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
          <Avatar>
            <AvatarImage src={`https://avatar.vercel.sh/${user.username}.png`} />
            <AvatarFallback>
              {user.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 text-left">
            <div className="flex items-center justify-between">
              <p className="font-medium">{user.name}</p>
              <span className="text-xs text-muted-foreground">
                {user.status}
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
