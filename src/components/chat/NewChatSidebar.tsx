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
        "fixed md:relative flex flex-col bg-gray-50 border-r",
        "h-full transition-all duration-300 ease-in-out z-50 w-[320px]",
        "shadow-[0_0_15px_rgba(0,0,0,0.05)]",
        isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        {/* Header */}
        <div className="flex items-center h-16 sm:h-[70px] px-4 border-b bg-gray-50">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="hover:bg-gray-100 focus:ring-2 focus:ring-primary/20"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </Button>

          <h1 className="text-lg font-semibold text-gray-800 tracking-tight ml-2">New Chat</h1>
          <div className="flex-grow" />
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="hover:bg-gray-100 focus:ring-2 focus:ring-primary/20 md:hidden"
            title="Close sidebar"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5 text-gray-700" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative px-4 py-3">
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-4 h-9 bg-white border-0
            text-sm placeholder:text-gray-500
            rounded-2xl ring-1 ring-gray-200
            focus-visible:ring-2 focus-visible:ring-primary/20
            transition-all duration-200"
          />
        </div>

        {/* Actions */}
        <div className="px-4 py-2">
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2 text-sm h-9 bg-white hover:bg-gray-50"
          >
            <Users className="h-4 w-4" />
            New Group
          </Button>
        </div>

        {/* Search Results */}
        <ScrollArea className="flex-1 bg-gray-50">
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
