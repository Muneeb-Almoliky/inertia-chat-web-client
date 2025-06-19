'use client'

import { ArrowLeft, Users, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { UserList } from './UserList'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Backdrop } from '@/components/ui/backdrop'

interface NewChatSidebarProps {
  onBack: () => void
  onStartChat: (userId: string) => void
}

export function NewChatSidebar({ onBack, onStartChat }: NewChatSidebarProps) {
  const [search, setSearch] = useState('')
  const [isMobileOpen, setIsMobileOpen] = useState(true)

  return (
    <>
      <Backdrop show={isMobileOpen} onClose={onBack} />
      <div className={cn(
        "fixed md:relative flex flex-col bg-white border-r shadow-lg h-full transition-all duration-300 z-50 w-[300px]",
        isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b bg-gray-50/80">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="hover:bg-gray-100 focus:ring-2 focus:ring-gray-300"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700" />
          </Button>

          <h2 className="text-lg font-semibold truncate">New Chat</h2>
          <div className="flex-grow" />
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="ml-1 hover:bg-gray-100 focus:ring-2 focus:ring-gray-300 md:hidden"
            title="Close sidebar"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5 text-gray-700" />
          </Button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b bg-white">
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm sm:text-base"
            aria-label="Search users"
          />
        </div>

        {/* Actions */}
        <div className="px-4 py-3 space-y-2 border-b bg-white">
          <Button variant="outline" className="w-full justify-start gap-2 text-sm sm:text-base">
            <Users className="h-4 w-4 sm:h-5 sm:w-5" />
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
    </>
  )
}
