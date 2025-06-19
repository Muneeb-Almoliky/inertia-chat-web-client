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
          "fixed md:relative flex flex-col bg-gray-50 border-r",
          "h-full transition-all duration-300 ease-in-out z-50 w-[320px]",
          "shadow-[0_0_15px_rgba(0,0,0,0.05)]",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}>
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
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
          <h1 className="text-lg font-semibold text-gray-800 tracking-tight ml-2">Profile Settings</h1>
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

        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-6">
            {/* Avatar Section */}
            <Card className="pt-6 pb-4 px-4 flex flex-col items-center gap-4 relative border-none shadow-none bg-gray-50/50">
              <div className="relative">
                <Avatar
                  className="h-20 w-20 ring-4 ring-background"
                  path={photoPreview || profile.profilePicture}
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
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-center">
                <h3 className="font-medium text-base">{profile.name}</h3>
                <p className="text-sm text-muted-foreground">@{profile.username}</p>
              </div>
            </Card>

            {/* Profile Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm">Display Name</Label>
                  <div className="relative">
                    <Input
                      id="name"
                      placeholder="Enter your name"
                      value={formData.name}
                      onChange={(e) => {
                        setIsEditing(true)
                        setFormData(prev => ({ ...prev, name: e.target.value }))
                      }}
                      className="pl-9 h-9 bg-white border-0
                      text-sm placeholder:text-gray-500
                      rounded-2xl ring-1 ring-gray-200
                      focus-visible:ring-2 focus-visible:ring-primary/20
                      transition-all duration-200"
                    />
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm">Username</Label>
                  <div className="relative">
                    <Input
                      id="username"
                      placeholder="Enter your username"
                      value={formData.username}
                      onChange={(e) => {
                        setIsEditing(true)
                        setFormData(prev => ({ ...prev, username: e.target.value }))
                      }}
                      className="pl-9 h-9 bg-white border-0
                      text-sm placeholder:text-gray-500
                      rounded-2xl ring-1 ring-gray-200
                      focus-visible:ring-2 focus-visible:ring-primary/20
                      transition-all duration-200"
                    />
                    <AtSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  </div>
                </div>
              </div>

              {showSaveButton && (
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1 h-9" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
                    className="h-9"
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
                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 h-9"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Account
              </Button>
            </div>
          </div>
        </div>

        {/* Delete Account Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent className="sm:max-w-[425px]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-base">Delete Account</AlertDialogTitle>
              <AlertDialogDescription className="pt-2 text-sm">
                This action cannot be undone. This will permanently delete your account and remove your data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Label htmlFor="password" className="text-sm font-medium">
                Please enter your password to confirm
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="mt-2 text-sm h-9 bg-white border-0
                placeholder:text-gray-500
                rounded-2xl ring-1 ring-gray-200
                focus-visible:ring-2 focus-visible:ring-primary/20
                transition-all duration-200"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel className="text-sm h-9">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive hover:bg-destructive/90 text-sm h-9"
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