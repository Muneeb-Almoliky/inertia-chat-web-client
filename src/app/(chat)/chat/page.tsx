"use client";

import { Users } from "lucide-react"
import { AuthGuard } from "@/components/auth/AuthGuard"
import { ChatSidebar } from "@/components/chat/ChatSidebar";

function ChatPage() {
  return (
    <>
    <ChatSidebar fullWidthOnMobile={true} />
    <main className="flex-1 flex-col md:flex hidden">
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-muted-foreground">
        <Users className="h-12 w-12 mb-4" />
        <h2 className="text-xl font-medium mb-2">Welcome to Inertia Chat</h2>
        <p className="text-center max-w-md">
          Select a user from the list to start a new conversation or continue an existing one.
        </p>
      </div>
    </main>
    </>
  )
}

export default AuthGuard(ChatPage);