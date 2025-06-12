'use client'

import * as React from 'react'
import { Plus, MoreVertical } from 'lucide-react'
import { ConversationList } from './ConversationList'

import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { NewChatSidebar } from './NewChatSidebar'

export function ChatSidebar() {
  const [userSearch, setUserSearch] = React.useState('')
  const [showNewChatSidebar, setShowNewChatSidebar] = React.useState(false)
  const [activeConversationId, setActiveConversationId] = React.useState<string | null>(null)


 return showNewChatSidebar ? (
  <NewChatSidebar
    onBack={() => setShowNewChatSidebar(false)}
    onStartChat={(userId) => {
      setActiveConversationId(userId)
      setShowNewChatSidebar(false)
    }}
  />
) :
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
          onClick={() => setShowNewChatDialog(true)}
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
        <ConversationList
          search={userSearch}
          activeId={activeConversationId}
          onSelect={(cid) => setActiveConversationId(cid)}
        />
               
      </ScrollArea>

      {/* Footer: User Profile + Logout: to be implemented later */}
      
    </div>
  
}
