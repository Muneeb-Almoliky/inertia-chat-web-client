'use client'

import * as React from 'react'
import { Plus, MoreVertical, LogOut, Settings, Menu, X, Search } from 'lucide-react'
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

interface ChatSidebarProps {
  fullWidthOnMobile?: boolean
}

export function ChatSidebar({ fullWidthOnMobile = false }: ChatSidebarProps) {
  const [userSearch, setUserSearch] = useState('')
  const [showNewChatSidebar, setShowNewChatSidebar] = useState(false)
  const [showProfileSidebar, setShowProfileSidebar] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(!fullWidthOnMobile)
  const { logout } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

  // Close mobile sidebar on route change (only if not fullWidthOnMobile)
  useEffect(() => {
    if (!fullWidthOnMobile) {
      setIsMobileOpen(false)
    }
  }, [pathname, fullWidthOnMobile])

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const handleGroupCreated = (groupId: number) => {
    setShowNewChatSidebar(false)
    router.push(`/chat/${groupId}`)
  }

  if (showProfileSidebar) {
    return <ProfileSidebar onBack={() => setShowProfileSidebar(false)} isOpen={showProfileSidebar} />
  }

  if (showNewChatSidebar) {
    return (
      <NewChatSidebar
        onBack={() => setShowNewChatSidebar(false)}
        isOpen={showNewChatSidebar}
        onGroupCreated={handleGroupCreated}
      />
    )
  }

  return (
    <>
      {/* Mobile Menu Button - only show if not fullWidthOnMobile */}
      {!fullWidthOnMobile && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileOpen(true)}
          className="fixed top-4 left-4 z-30 md:hidden hover:bg-gray-100 focus:ring-2 focus:ring-primary/20"
        >
          <Menu className="h-5 w-5 text-gray-700" />
        </Button>
      )}

      {/* Mobile Backdrop - only show if not fullWidthOnMobile */}
      {!fullWidthOnMobile && (
        <Backdrop show={isMobileOpen} onClose={() => setIsMobileOpen(false)} />
      )}

      <div className={cn(
        "flex flex-col bg-gray-50 border-r",
        "h-full transition-all duration-300 ease-in-out z-50 w-[320px]",
        "shadow-[0_0_15px_rgba(0,0,0,0.05)]",
        fullWidthOnMobile 
          ? "fixed md:relative w-full md:w-[320px] translate-x-0" 
          : isMobileOpen 
            ? "fixed translate-x-0" 
            : "fixed md:relative -translate-x-full md:translate-x-0"
      )}>
        <div className="flex items-center h-16 sm:h-[70px] px-4 border-b bg-gray-50">
          <h1 className="text-lg font-semibold text-gray-800 tracking-tight">
            Inertia Chat
          </h1>
          <div className="flex-grow" />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowNewChatSidebar(true)}
            className="hover:bg-gray-100 focus:ring-2 focus:ring-primary/20"
            title="Start new chat"
            aria-label="Start new chat"
          >
            <Plus className="h-5 w-5 text-gray-700" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-gray-100 focus:ring-2 focus:ring-primary/20"
                title="More options"
                aria-label="More options"
              >
                <MoreVertical className="h-5 w-5 text-gray-700" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => setShowProfileSidebar(true)} className="text-gray-700">
                <Settings className="mr-2 h-4 w-4 text-current" />
                <span>Profile Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout} 
                className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4 text-current" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Close button - only show if not fullWidthOnMobile */}
          {!fullWidthOnMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileOpen(false)}
              className="ml-1 hover:bg-gray-100 focus:ring-2 focus:ring-primary/20 md:hidden"
              title="Close sidebar"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5 text-gray-700" />
            </Button>
          )}
        </div>

        <div className="relative px-4 py-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-[15px] w-[15px] text-gray-500 
              group-focus-within:text-gray-900 transition-colors" />
            <Input
              placeholder="Search conversations..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full pl-9 h-9 bg-white border-0
              text-sm placeholder:text-gray-500
              rounded-2xl ring-1 ring-gray-200
              focus-visible:ring-2 focus-visible:ring-primary/20
              transition-all duration-200"
            />
          </div>
        </div>

        <ScrollArea className="flex-1 overflow-y-auto bg-gray-50">
          <ConversationList search={userSearch} />
        </ScrollArea>
      </div>
    </>
  )
}