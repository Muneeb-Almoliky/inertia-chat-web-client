import { ChatSidebar } from "@/components/chat/ChatSidebar"

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-background">
      <ChatSidebar />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  )
} 