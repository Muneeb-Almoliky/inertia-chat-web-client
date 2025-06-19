'use client'

import { ArrowLeft, Trash2, Camera, User, AtSign, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '@/lib/store/auth.store'
import { userService } from '@/services/userService'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useRouter } from 'next/navigation'
import type { UserProfile } from '@/types/user'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import Avatar from './Avatar'
import { cn } from '@/lib/utils'
import { Backdrop } from '@/components/ui/backdrop'

interface ProfileSidebarProps {
  onBack: () => void
}

export function ProfileSidebar({ onBack }: ProfileSidebarProps) {
  const router = useRouter()
  const { logout } = useAuthStore()
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isMobileOpen, setIsMobileOpen] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: ''
  })

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await userService.getProfile()
        setProfile(data)
        setFormData(prev => ({
          ...prev,
          name: data.name,
          username: data.username
        }))
      } catch (error) {
        toast.error('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 1 * 1024 * 1024) {
        toast.error('Photo size should be less than 1MB')
        return
      }
      setSelectedPhoto(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      // Update profile data if changed
      if (profile && (formData.name !== profile.name || formData.username !== profile.username)) {
        await userService.updateProfile({
          name: formData.name,
          username: formData.username
        })
      }

      // Update avatar if selected
      if (selectedPhoto) {
        await userService.updateAvatar({
          profilePicture: selectedPhoto
        })
      }

      const updatedProfile = await userService.getProfile()
      setProfile(updatedProfile)
      setIsEditing(false)
      setSelectedPhoto(null)
      setPhotoPreview(null)
      toast.success('Profile updated successfully')
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await userService.deleteProfile({ password: formData.password })
      await logout()
      router.push('/login')
      toast.success('Profile deleted successfully')
    } catch (error) {
      toast.error('Failed to delete profile')
    }
  }

  if (loading || !profile) {
    return (
      <>
        <Backdrop show={isMobileOpen} onClose={onBack} />
        <div className={cn(
          "fixed md:relative flex flex-col bg-white border-r shadow-lg items-center justify-center h-screen transition-all duration-300 z-50 w-[300px]",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}>
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </>
    )
  }

  const showSaveButton = selectedPhoto || (isEditing && profile && (
    formData.name !== profile.name || 
    formData.username !== profile.username
  ))
  
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
          <h2 className="text-lg font-semibold truncate">Profile Settings</h2>
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

        <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 overflow-y-auto">
          {/* Avatar Section */}
          <Card className="pt-6 sm:pt-8 pb-4 sm:pb-6 px-4 flex flex-col items-center gap-4 relative border-none shadow-none bg-gray-50/50">
            <div className="relative">
              <Avatar
                className="h-20 w-20 sm:h-24 sm:w-24 ring-4 ring-background"
                path={profile.profilePicture}
                name={profile.name}
              />
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handlePhotoSelect}
              />
              <Button
                size="icon"
                variant="secondary"
                className="absolute bottom-0 right-0 rounded-full shadow-md hover:shadow-lg transition-shadow"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
            <div className="text-center">
              <h3 className="font-medium text-base sm:text-lg">{profile.name}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">@{profile.username}</p>
            </div>
          </Card>

          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm sm:text-base">Display Name</Label>
                <div className="relative">
                  <Input
                    id="name"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={(e) => {
                      setIsEditing(true)
                      setFormData(prev => ({ ...prev, name: e.target.value }))
                    }}
                    className="pl-9 text-sm sm:text-base"
                  />
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm sm:text-base">Username</Label>
                <div className="relative">
                  <Input
                    id="username"
                    placeholder="Enter your username"
                    value={formData.username}
                    onChange={(e) => {
                      setIsEditing(true)
                      setFormData(prev => ({ ...prev, username: e.target.value }))
                    }}
                    className="pl-9 text-sm sm:text-base"
                  />
                  <AtSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>

            {showSaveButton && (
              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1 text-sm sm:text-base h-9 sm:h-10" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsEditing(false)
                    setSelectedPhoto(null)
                    setPhotoPreview(null)
                    setFormData({
                      ...formData,
                      name: profile.name,
                      username: profile.username
                    })
                  }}
                  disabled={saving}
                  className="text-sm sm:text-base h-9 sm:h-10"
                >
                  Cancel
                </Button>
              </div>
            )}
          </form>

          {/* Delete Account Section */}
          <div className="pt-4 border-t">
            <Button
              variant="ghost"
              className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 text-sm sm:text-base h-9 sm:h-10"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Delete Account
            </Button>
          </div>
        </div>

        {/* Delete Account Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent className="sm:max-w-[425px]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-base sm:text-lg">Delete Account</AlertDialogTitle>
              <AlertDialogDescription className="pt-2 text-sm sm:text-base">
                This action cannot be undone. This will permanently delete your account and remove your data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Label htmlFor="password" className="text-sm sm:text-base font-medium">
                Please enter your password to confirm
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="mt-2 text-sm sm:text-base"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel className="text-sm sm:text-base h-9 sm:h-10">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive hover:bg-destructive/90 text-sm sm:text-base h-9 sm:h-10"
              >
                Delete Account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  )
}