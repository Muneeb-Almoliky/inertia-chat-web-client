'use client'

import * as React from 'react'
import { Plus, MoreVertical, LogOut, Settings, Menu, X } from 'lucide-react'
import { ConversationList } from './ConversationList'
import { useAuthStore } from '@/lib/store/auth.store'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Backdrop } from '@/components/ui/backdrop'

import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { NewChatSidebar } from './NewChatSidebar'
import { ProfileSidebar } from './ProfileSidebar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export function ChatSidebar() {
  const [userSearch, setUserSearch] = useState('')
  const [showNewChatSidebar, setShowNewChatSidebar] = useState(false)
  const [showProfileSidebar, setShowProfileSidebar] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const { logout, username } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  if (showProfileSidebar) {
    return <ProfileSidebar onBack={() => setShowProfileSidebar(false)} />
  }

  if (showNewChatSidebar) {
    return (
      <NewChatSidebar
        onBack={() => setShowNewChatSidebar(false)}
        onStartChat={() => {
          setShowNewChatSidebar(false)
        }}
      />
    )
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-3 left-3 z-30 md:hidden hover:bg-gray-100 focus:ring-2 focus:ring-gray-300"
      >
        <Menu className="h-5 w-5 text-gray-700" />
      </Button>

      {/* Mobile Backdrop */}
      <Backdrop show={isMobileOpen} onClose={() => setIsMobileOpen(false)} />

      <div className={cn(
        "fixed md:relative flex flex-col bg-white border-r shadow-lg h-full transition-all duration-300 z-50 w-[300px]",
        isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="flex items-center px-4 py-3 border-b bg-gray-50/80">
          <h1 className="text-lg font-semibold text-gray-800 truncate">Inertia Chat</h1>
          <div className="flex-grow" />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowNewChatSidebar(true)}
            className="hover:bg-gray-100 focus:ring-2 focus:ring-gray-300"
            title="Start new chat"
            aria-label="Start new chat"
          >
            <Plus className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700" />
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
                <MoreVertical className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => setShowProfileSidebar(true)}>
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

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileOpen(false)}
            className="ml-1 hover:bg-gray-100 focus:ring-2 focus:ring-gray-300 md:hidden"
            title="Close sidebar"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5 text-gray-700" />
          </Button>
        </div>

        <div className="px-4 py-2 border-b bg-white">
          <Input
            placeholder="Search conversations..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="w-full text-sm sm:text-base"
            aria-label="Search conversations"
          />
        </div>

        <ScrollArea className="flex-1 bg-white">
          <ConversationList search={userSearch} />
        </ScrollArea>
      </div>
    </>
  )
}
