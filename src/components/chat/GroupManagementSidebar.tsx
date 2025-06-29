'use client'

import { X, UserPlus, Trash2, LogOut, Search, UserX, MoreVertical, Crown, User, ImageIcon, Pencil, UserMinus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import Avatar from '@/components/chat/Avatar';
import { cn } from '@/lib/utils';
import { GroupParticipant, GroupDetails, ParticipantRole } from '@/types/chat';
import { useState, useEffect, useRef } from 'react';
import { userService } from '@/services/userService';
import { UserProfile, UserStatus } from '@/types/user';
import { chatService } from '@/services/chatService';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatLastSeen } from '@/utils/date';
import { Badge } from '@/components/ui/badge';

interface GroupManagementSidebarProps {
  groupDetails: GroupDetails;
  onClose: () => void;
  currentUserId: number;
  onLeaveGroup: () => void;
  onDeleteGroup: () => void;
  onRemoveParticipant: (userId: number) => void;
  onRoleChange: (userId: number, newRole: ParticipantRole) => void;
  onGroupUpdate: (update: { name?: string; avatar?: string }) => void;
}

export function GroupManagementSidebar({
  groupDetails,
  onClose,
  currentUserId,
  onLeaveGroup,
  onDeleteGroup,
  onRemoveParticipant,
  onRoleChange,
  onGroupUpdate
}: GroupManagementSidebarProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showConfirmLeave, setShowConfirmLeave] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newGroupName, setNewGroupName] = useState(groupDetails.name);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const currentUserRole = groupDetails.participants?.find(
    p => p.id === currentUserId
  )?.role;
  
  const isAdmin = currentUserRole === ParticipantRole.ADMIN || currentUserRole === ParticipantRole.OWNER;
  const isOwner = currentUserRole === ParticipantRole.OWNER;

  const filteredUsers = users.filter(user => 
    !groupDetails.participants?.some(p => p.id === user.id) &&
    user.id !== currentUserId
  );

  const searchResults = searchTerm
    ? filteredUsers.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : filteredUsers;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersData = await userService.getUsers();
        setUsers(usersData);
      } catch (error) {
        console.error('Failed to fetch users:', error);
        toast.error('Failed to load users');
      }
    };

    fetchUsers();
  }, []);

  const handleAddParticipant = async () => {
    if (!selectedUserId || !groupDetails.id) return;
    
    try {
      await chatService.addParticipant(groupDetails.id, selectedUserId);
      const updatedDetails = await chatService.getGroupDetails(groupDetails.id);
      groupDetails.participants = updatedDetails.participants;
      toast.success('Participant added successfully');
      setShowAddMemberDialog(false);
      setSelectedUserId(null);
    } catch (error) {
      console.error('Failed to add participant:', error);
      toast.error('Failed to add participant');
    }
  };

  const handleRemove = (userId: number) => {
    onRemoveParticipant(userId);
  };

  const handleRoleChange = async (userId: number, newRole: ParticipantRole) => {
    try {
      await chatService.updateParticipantRole(groupDetails.id, userId, newRole);
      onRoleChange(userId, newRole);
      toast.success('Role updated successfully');
    } catch (error) {
      console.error('Failed to update role:', error);
      toast.error('Failed to update role');
    }
  };

  const getStatusText = (participant: GroupParticipant) => {
    if (participant.status === UserStatus.ONLINE) {
      return "Online";
    }
    return formatLastSeen(participant.lastSeen);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      
      try {
        const updatedGroup = await chatService.updateGroupAvatar(groupDetails.id, file);
        onGroupUpdate({ avatar: updatedGroup.avatarUrl });
        toast.success('Group avatar updated');
      } catch (error) {
        console.error('Failed to update avatar:', error);
        toast.error('Failed to update group avatar');
      }
    }
  };

  const saveGroupName = async () => {
    if (!newGroupName.trim()) {
      toast.error('Group name cannot be empty');
      return;
    }
    
    try {
      await chatService.updateGroupName(groupDetails.id, newGroupName);
      onGroupUpdate({ name: newGroupName });
      setIsEditingName(false);
      toast.success('Group name updated');
    } catch (error) {
      console.error('Failed to update group name:', error);
      toast.error('Failed to update group name');
    }
  };

  const renderRoleBadge = (role: ParticipantRole) => {
    const roleConfig = {
      OWNER: { text: "Owner", color: 'bg-amber-500', icon: <Crown className="h-3 w-3" /> },
      ADMIN: { text: "Admin", color: 'bg-blue-500', icon: <User className="h-3 w-3" /> },
      MEMBER: { text: "Member", color: 'bg-gray-500', icon: null }
    };
    
    const config = roleConfig[role];
    
    return (
      <Badge className={cn("text-white text-xs", config.color)}>
        <div className="flex items-center gap-1">
          {config.icon}
          {config.text}
        </div>
      </Badge>
    );
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white z-50 shadow-lg">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Group Management</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="p-4">
        <div className="flex flex-col items-center mb-6">
          <div className="relative group">
            <Avatar
              path={groupDetails.avatarUrl}
              name={groupDetails.name}
              className="h-20 w-20"
            />
            {isAdmin && (
              <>
                <div 
                  className="absolute inset-0 bg-black bg-opacity-30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="h-6 w-6 text-white" />
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  accept="image/*"
                  className="hidden"
                />
              </>
            )}
          </div>
          
          <div className="mt-3 text-center">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="text-center"
                />
                <Button size="sm" onClick={saveGroupName}>Save</Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setIsEditingName(false);
                    setNewGroupName(groupDetails.name);
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <h3 className="text-xl font-bold">{groupDetails.name}</h3>
                {isAdmin && (
                  <Button 
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setIsEditingName(true)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )}
            <p className="text-gray-500">
              {groupDetails.participants?.length || 0} members
            </p>
          </div>
        </div>

        {/* Optimized Action Buttons Section */}
        <div className="space-y-2 mb-6">
          <div className="grid grid-cols-2 gap-2">
            {isAdmin && (
              <Button 
                variant="outline" 
                onClick={() => setShowAddMemberDialog(true)}
                className="flex items-center justify-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                <span>Add Member</span>
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmLeave(true)}
              className="flex items-center justify-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Leave Group</span>
            </Button>
          </div>
          {isOwner && (
            <Button 
              variant="destructive" 
              onClick={() => setShowConfirmDelete(true)}
              className="w-full flex items-center justify-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete Group</span>
            </Button>
          )}
        </div>

        <h4 className="font-medium mb-2">Participants</h4>
        <ScrollArea className="h-[calc(100vh-400px)] pr-2">
          {groupDetails.participants?.map((participant) => (
            <div 
              key={participant.id} 
              className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar
                    path={participant.profilePicture}
                    name={participant.name}
                    className="h-10 w-10"
                  />
                  <div className={cn(
                    "absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white",
                    participant.status === UserStatus.ONLINE && "bg-green-500",
                    participant.status === UserStatus.AWAY && "bg-yellow-500",
                    participant.status === UserStatus.OFFLINE && "bg-gray-400"
                  )} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">
                      {participant.name}
                      {participant.id === currentUserId && " (You)"}
                    </p>
                    {renderRoleBadge(participant.role)}
                  </div>
                  <p className="text-xs text-gray-500">
                    {getStatusText(participant)}
                  </p>
                </div>
              </div>
              {isAdmin && participant.id !== currentUserId && participant.role !== ParticipantRole.OWNER && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                    >
                      <MoreVertical className="h-4 w-4 text-gray-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {participant.role === ParticipantRole.MEMBER && isOwner && (
                      <DropdownMenuItem
                        onClick={() => handleRoleChange(participant.id, ParticipantRole.ADMIN)}
                        className="flex items-center gap-2"
                      >
                        <User className="h-4 w-4" />
                        <span>Promote to Admin</span>
                      </DropdownMenuItem>
                    )}
                    {participant.role === ParticipantRole.ADMIN && (
                      <DropdownMenuItem
                        onClick={() => handleRoleChange(participant.id, ParticipantRole.MEMBER)}
                        className="flex items-center gap-2"
                      >
                        <UserMinus className="h-4 w-4" />
                        <span>Demote to Member</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                      className="flex items-center gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
                      onClick={() => handleRemove(participant.id)}
                    >
                      <UserX className="h-4 w-4" />
                      <span>Remove from group</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          ))}
        </ScrollArea>
      </div>

      {/* Add Member Dialog */}
      <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Member to Group</DialogTitle>
            <DialogDescription>
              Search for users to add to this group
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <ScrollArea className="h-64 border rounded-md">
              {searchResults.length > 0 ? (
                searchResults.map(user => (
                  <div
                    key={user.id}
                    className={cn(
                      "flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer",
                      selectedUserId === user.id && "bg-blue-50"
                    )}
                    onClick={() => setSelectedUserId(user.id)}
                  >
                    <div className="relative">
                      <Avatar
                        path={user.profilePicture}
                        name={user.name}
                        className="h-10 w-10"
                      />
                      <div className={cn(
                        "absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white",
                        user.status === UserStatus.ONLINE && "bg-green-500",
                        user.status === UserStatus.AWAY && "bg-yellow-500",
                        user.status === UserStatus.OFFLINE && "bg-gray-400"
                      )} />
                    </div>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-500">@{user.username}</p>
                    </div>
                    {selectedUserId === user.id && (
                      <div className="ml-auto bg-blue-500 rounded-full p-1">
                        <div className="bg-white rounded-full p-0.5" />
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500">
                  {searchTerm ? "No users found" : "Start typing to search for users"}
                </div>
              )}
            </ScrollArea>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMemberDialog(false)}>
              Cancel
            </Button>
            <Button 
              disabled={!selectedUserId}
              onClick={handleAddParticipant}
            >
              Add to Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <Dialog open={showConfirmDelete} onOpenChange={setShowConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Group</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete this group? 
              This action cannot be undone and will remove the group for all participants.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDelete(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={onDeleteGroup}>
              Delete Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Leave Dialog */}
      <Dialog open={showConfirmLeave} onOpenChange={setShowConfirmLeave}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Group</DialogTitle>
            <DialogDescription>
              {isOwner ? (
                <div>
                  <p className="text-destructive font-medium mb-2">
                    You are the owner of this group. If you leave:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>The group will be deleted for all participants</li>
                    <li>All group history will be permanently lost</li>
                    <li>Consider transferring ownership first</li>
                  </ul>
                </div>
              ) : (
                "Are you sure you want to leave this group? You won't be able to rejoin unless you're re-invited."
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmLeave(false)}>
              Cancel
            </Button>
            <Button 
              variant={isOwner ? "destructive" : "default"} 
              onClick={onLeaveGroup}
            >
              {isOwner ? "Delete Group" : "Leave Group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}