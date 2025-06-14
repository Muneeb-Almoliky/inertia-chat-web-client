'use client'

import * as React from 'react'
import { Plus, MoreVertical, LogOut } from 'lucide-react'
import { ConversationList } from './ConversationList'
import { useAuthStore } from '@/lib/store/auth.store'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { NewChatSidebar } from './NewChatSidebar'
import { Button } from '@/components/ui/button'

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
        <button
          className="p-2 rounded hover:bg-gray-100 focus:outline-none focus:ring"
          onClick={() => setShowNewChatSidebar(true)}
        >
          <Plus className="h-6 w-6" />
        </button>
        <button
          className="p-2 rounded hover:bg-gray-100 focus:outline-none focus:ring"
        >
          <MoreVertical className="h-6 w-6" />
        </button>
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

      {/* Footer: User Profile + Logout */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600">
                {username?.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-sm font-medium text-gray-700">{username}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="hover:bg-gray-100"
            title="Logout"
          >
            <LogOut className="h-5 w-5 text-gray-600" />
          </Button>
        </div>
      </div>
    </div>
  )
}
