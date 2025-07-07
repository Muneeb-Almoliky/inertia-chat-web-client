'use client'

import { ArrowLeft, Users, X, ImageIcon, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { UserList } from './UserList'
import { useState, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Backdrop } from '@/components/ui/backdrop'
import { UserProfile } from '@/types/user'
import { chatService } from '@/services/chatService'
import { toast } from 'sonner'
import { ChatType } from '@/types/chat'

interface NewChatSidebarProps {
  onBack: () => void
  onGroupCreated: (groupId: number) => void
}

export function NewChatSidebar({ 
  onBack, 
  onGroupCreated
}: NewChatSidebarProps) {
  const [search, setSearch] = useState('')
  const [isMobileOpen] = useState(true)
  const [groupMode, setGroupMode] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [groupAvatar, setGroupAvatar] = useState<File | null>(null)
  const [selectedParticipants, setSelectedParticipants] = useState<UserProfile[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB')
        return
      }
      setGroupAvatar(file)
    }
  }

  const removeAvatar = (e: React.MouseEvent) => {
    e.stopPropagation()
    setGroupAvatar(null)
  }

  const toggleParticipant = (user: UserProfile) => {
    setSelectedParticipants(prev => {
      const isSelected = prev.some(p => p.id === user.id)
      if (isSelected) {
        return prev.filter(p => p.id !== user.id)
      } else {
        return [...prev, user]
      }
    })
  }

  const createGroup = async () => {
    if (!groupName.trim()) {
      toast.error('Please enter a group name')
      return
    }
    
    if (selectedParticipants.length < 1) {
      toast.error('Please add at least one participant')
      return
    }

    try {
      const participantIds = selectedParticipants.map(p => p.id)
      const group = await chatService.createGroupChat({
        name: groupName,
        participantIds,
        avatar: groupAvatar
      })
      
      toast.success(`Group "${groupName}" created successfully`)
      onGroupCreated(group.id)
      resetGroupMode()
    } catch (error) {
      console.error('Failed to create group:', error)
      toast.error('Failed to create group')
    }
  }

  const resetGroupMode = () => {
    setGroupMode(false)
    setGroupName('')
    setGroupAvatar(null)
    setSelectedParticipants([])
  }

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
            onClick={groupMode ? resetGroupMode : onBack}
            className="hover:bg-gray-100 focus:ring-2 focus:ring-primary/20"
            aria-label={groupMode ? "Back to new chat" : "Back"}
          >
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </Button>

          <h1 className="text-lg font-semibold text-gray-800 tracking-tight ml-2">
            {groupMode ? "Create Group" : "New Chat"}
          </h1>
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

        {groupMode ? (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Group Creation Form */}
            <div className="px-4 py-3 space-y-4">
              <div className="flex flex-col items-center">
                <div 
                  className="relative cursor-pointer group"
                  onClick={handleAvatarClick}
                >
                  <div className="bg-gray-200 border-2 border-dashed rounded-full w-20 h-20 flex items-center justify-center">
                    {groupAvatar ? (
                      <>
                        <img 
                          src={URL.createObjectURL(groupAvatar)} 
                          alt="Group avatar" 
                          className="rounded-full w-full h-full object-cover"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-0 right-0 bg-white rounded-full w-6 h-6 p-1 shadow-sm"
                          onClick={removeAvatar}
                        >
                          <X className="h-4 w-4 text-gray-700" />
                        </Button>
                      </>
                    ) : (
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black bg-opacity-30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ImageIcon className="h-5 w-5 text-white" />
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">Click to add group photo</p>
              </div>

              <div>
                <label htmlFor="group-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Group Name
                </label>
                <Input
                  id="group-name"
                  placeholder="Enter group name"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Participants ({selectedParticipants.length})
                  </label>
                  {selectedParticipants.length > 0 && (
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="text-xs h-6 p-0 text-gray-500 hover:text-gray-700"
                      onClick={() => setSelectedParticipants([])}
                    >
                      Clear all
                    </Button>
                  )}
                </div>
                
                {selectedParticipants.length > 0 && (
                  <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                    {selectedParticipants.map(user => (
                      <div 
                        key={user.id} 
                        className="flex items-center bg-gray-100 rounded-full pl-2 pr-1 py-1 flex-shrink-0"
                      >
                        <span className="text-sm whitespace-nowrap">{user.name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-full ml-1"
                          onClick={() => toggleParticipant(user)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="relative">
                  <Input
                    placeholder="Search users to add..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                </div>
              </div>
            </div>

            {/* Search Results */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <ScrollArea className="h-full px-4">
                <UserList
                  search={search}
                  onSelectUser={toggleParticipant}
                  selectedUsers={selectedParticipants}
                  mode={ChatType.GROUP}
                />
              </ScrollArea>
            </div>

            {/* Create Group Button */}
            <div className="p-4 border-t bg-gray-50">
              <Button 
                className="w-full" 
                onClick={createGroup}
                disabled={!groupName.trim() || selectedParticipants.length === 0}
              >
                Create Group
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Search */}
            <div className="relative px-4 py-3">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 h-9 bg-white border-0
                  text-sm placeholder:text-gray-500
                  rounded-2xl ring-1 ring-gray-200
                  focus-visible:ring-2 focus-visible:ring-primary/20
                  transition-all duration-200"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="px-4 py-2">
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2 text-sm h-9 bg-white hover:bg-gray-50"
                onClick={() => setGroupMode(true)}
              >
                <Users className="h-4 w-4" />
                New Group
              </Button>
            </div>

            {/* Search Results */}
            <div className="flex-1 min-h-0">
              <ScrollArea className="h-full">
                <UserList
                  search={search}
                  mode={ChatType.INDIVIDUAL}
                  onSelectUser={onBack}
                />
              </ScrollArea>
            </div>
          </div>
        )}
      </div>
    </>
  )
}