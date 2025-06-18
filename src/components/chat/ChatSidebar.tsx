'use client'

import * as React from 'react'
import { Plus, MoreVertical, LogOut, Settings } from 'lucide-react'
import { ConversationList } from './ConversationList'
import { useAuthStore } from '@/lib/store/auth.store'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { NewChatSidebar } from './NewChatSidebar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function ChatSidebar() {
  const [userSearch, setUserSearch] = useState('')
  const [showNewChatSidebar, setShowNewChatSidebar] = useState(false)
  const { logout, username } = useAuthStore()
  const router = useRouter()
  console.log('[ChatSidebar] store:', useAuthStore.getState())
  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const handleProfileSettings = () => {
    router.push('/profile')
  }

  return showNewChatSidebar ? (
    <NewChatSidebar
      onBack={() => setShowNewChatSidebar(false)}
      onStartChat={() => {
        setShowNewChatSidebar(false)
      }}
    />
  ) : (
    <div className="flex flex-col w-80 bg-white border-r shadow-lg">
      <div className="flex items-center px-4 py-3 border-b bg-gray-50">
        <h1 className="text-lg font-semibold text-gray-800">Inertia Chat</h1>
        <div className="flex-grow" />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowNewChatSidebar(true)}
          className="hover:bg-gray-100 focus:ring-2 focus:ring-gray-300"
          title="Start new chat"
          aria-label="Start new chat"
        >
          <Plus className="h-6 w-6 text-gray-700" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-gray-100 focus:ring-2 focus:ring-gray-300"
              title="More options"
              aria-label="More options"
            >
              <MoreVertical className="h-6 w-6 text-gray-700" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={handleProfileSettings}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Profile Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} variant="destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Search bar above conversations */}
      <div className="px-4 py-2 border-b bg-white">
        <Input
          placeholder="Search conversations..."
          value={userSearch}
          onChange={(e) => setUserSearch(e.target.value)}
          className="w-full"
          aria-label="Search conversations"
        />
      </div>

      {/* Conversation List (always visible by default) */}
      <ScrollArea className="flex-1 bg-white">
        <ConversationList search={userSearch} />
      </ScrollArea>
    </div>
  )
}
