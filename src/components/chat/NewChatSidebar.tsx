'use client'

import { ArrowLeft, Users } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { UserList } from './UserList'
import { useState } from 'react'

interface NewChatSidebarProps {
  onBack: () => void
  onStartChat: (userId: string) => void
}

export function NewChatSidebar({ onBack, onStartChat }: NewChatSidebarProps) {
  const [search, setSearch] = useState('')

  return (
    <div className="flex flex-col w-80 bg-white border-r shadow-lg">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-gray-50">
        <button
          onClick={onBack}
          className="p-2 rounded hover:bg-gray-100 focus:outline-none"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-semibold">New Chat</h2>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b bg-white">
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search users"
        />
      </div>

      {/* Actions */}
      <div className="px-4 py-3 space-y-2 border-b bg-white">
        <Button variant="outline" className="w-full justify-start gap-2">
          <Users className="h-5 w-5" />
          New Group
        </Button>
      </div>

      {/* Search Results */}
      <ScrollArea className="flex-1 px-2 py-2 bg-white">
        <UserList
          search={search}
          onSelectUser={(user) => {
            onStartChat(user.id.toString())
          }}
        />
      </ScrollArea>
    </div>
  )
}
