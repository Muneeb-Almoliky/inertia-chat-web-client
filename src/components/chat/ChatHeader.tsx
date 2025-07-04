"use client";

import { ChatType, GroupDetails } from "@/types/chat";
import { UserStatus } from "@/types/user";
import { formatLastSeen } from "@/utils/date";
import Avatar from "./Avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Users, MoreVertical, LogOut, Settings } from "lucide-react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";
import { cn } from "@/lib/utils";

const statusConfig = {
  [UserStatus.ONLINE]: { label: "Online", color: "bg-green-500" },
  [UserStatus.AWAY]: { label: "Away", color: "bg-yellow-500" },
  [UserStatus.OFFLINE]: { label: "Offline", color: "bg-gray-400" },
};

interface ChatHeaderProps {
  chatType?: ChatType;
  otherUser?: {
    name: string;
    profilePicture?: string | null;
    status: UserStatus;
    lastSeen: string;
  };
  groupDetails?: GroupDetails;
  showSettings: boolean;
  onOpenSettings: () => void;
  onLeaveGroup: () => void;
}

export function ChatHeader({
  chatType,
  otherUser,
  groupDetails,
  showSettings,
  onOpenSettings,
  onLeaveGroup,
}: ChatHeaderProps) {
  const ready =
    (chatType === ChatType.INDIVIDUAL && otherUser) ||
    (chatType === ChatType.GROUP && groupDetails);
    
  // Only show actions menu for group chats
  const showActionsMenu = ready && chatType === ChatType.GROUP;

  return (
    <div className="border-b bg-gray-50 flex items-center justify-between h-16 sm:h-18 px-4 sm:px-6 md:px-8 lg:px-10">
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative flex-shrink-0">
          {ready ? (
            chatType === ChatType.INDIVIDUAL ? (
              <Avatar
                path={otherUser!.profilePicture}
                name={otherUser!.name}
                className="h-9 w-9 sm:h-10 sm:w-10 ring-2 ring-background"
              />
            ) : (
              <Avatar
                path={groupDetails!.avatarUrl}
                name={groupDetails!.name}
                className="h-9 w-9 sm:h-10 sm:w-10 ring-2 ring-background"
              />
            )
          ) : (
            <div className="bg-gray-200 rounded-full h-9 w-9 sm:h-10 sm:w-10 animate-pulse" />
          )}

          {ready && chatType === ChatType.INDIVIDUAL && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className={cn(
                      "absolute bottom-0 right-0 size-2 sm:size-2.5 rounded-full ring-2 ring-background",
                      statusConfig[otherUser!.status].color
                    )}
                  />
                </TooltipTrigger>
                <TooltipContent side="right" align="center" className="text-xs capitalize">
                  {statusConfig[otherUser!.status].label}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        <div className="flex flex-col justify-center min-w-0">
          {ready ? (
            <>
              <h2 className="text-sm sm:text-base font-semibold truncate text-gray-900">
                {chatType === ChatType.INDIVIDUAL
                  ? otherUser!.name
                  : groupDetails!.name}
              </h2>
              <span 
                className={cn(
                  "text-xs sm:text-sm truncate",
                  chatType === ChatType.INDIVIDUAL && 
                    otherUser!.status === UserStatus.ONLINE
                    ? "text-green-600"
                    : "text-gray-500"
                )}
              >
                {chatType === ChatType.INDIVIDUAL
                  ? otherUser!.status === UserStatus.ONLINE
                    ? "online"
                    : formatLastSeen(otherUser!.lastSeen)
                  : `${groupDetails!.participants?.length || 0} members`}
              </span>
            </>
          ) : (
            <>
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="mt-1 h-3 w-24 bg-gray-200 rounded animate-pulse" />
            </>
          )}
        </div>
      </div>

      {showActionsMenu && (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenSettings}
            aria-label="Group settings"
          >
            <Users className="h-5 w-5 text-gray-700" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-gray-100 focus:ring-2 focus:ring-primary/20"
                aria-label="More options"
              >
                <MoreVertical className="h-5 w-5 text-gray-700" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={onOpenSettings}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Group Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onLeaveGroup}
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Leave Group</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}