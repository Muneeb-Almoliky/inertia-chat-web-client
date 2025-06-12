import { Client, IMessage } from '@stomp/stompjs'
import { ChatMessage, MessageType } from '@/types/chat'
import { useAuthStore } from '@/lib/store/auth.store'
import SockJS from 'sockjs-client'

type PendingSub = {
  chatId: number
  onMessage: (m: ChatMessage) => void
}

class WebSocketService {
  private client: Client | null = null
  private subscriptions: Record<string, any> = {}
  private pendingSubs: PendingSub[] = []

  connect() {
    const { accessToken } = useAuthStore.getState()

    this.client = new Client({
      webSocketFactory: () =>
        new SockJS(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:9090/ws'),
      connectHeaders: { Authorization: `Bearer ${accessToken}` },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    })

    this.client.onConnect = () => {
      console.log(' STOMP connected')

      // Drain any subscriptions that were requested early
      this.pendingSubs.forEach(({ chatId, onMessage }) =>
        this._doSubscribe(chatId, onMessage)
      )
      this.pendingSubs = []
    }

    this.client.activate()
  }

  disconnect() {
    if (!this.client) return

    Object.values(this.subscriptions).forEach(sub => sub.unsubscribe())
    this.subscriptions = {}
    this.pendingSubs = []

    this.client.deactivate()
    this.client = null
    console.log(' STOMP disconnected')
  }

  subscribeToChat(chatId: number, onMessage: (m: ChatMessage) => void) {
    // If not connected yet, buffer this request
    if (!this.client || !this.client.connected) {
      console.log(`🔄 Buffering subscribe for chat ${chatId} until connected`)
      this.pendingSubs.push({ chatId, onMessage })
      return
    }
    this._doSubscribe(chatId, onMessage)
  }

  private _doSubscribe(chatId: number, onMessage: (m: ChatMessage) => void) {
    const key = chatId.toString()
    // Unsubscribe any existing
    if (this.subscriptions[key]) {
      this.subscriptions[key].unsubscribe()
    }
    // Subscribe for real
    this.subscriptions[key] = this.client!.subscribe(
      `/topic/chat.${chatId}`,
      (msg: IMessage) => onMessage(JSON.parse(msg.body) as ChatMessage)
    )
    console.log(` Subscribed to chat ${chatId}`)
  }

  unsubscribeFromChat(chatId: string) {
    const sub = this.subscriptions[chatId]
    if (sub) {
      sub.unsubscribe()
      delete this.subscriptions[chatId]
      console.log(` Unsubscribed from chat ${chatId}`)
    }
    // Also clear any pending for this chat
    this.pendingSubs = this.pendingSubs.filter(ps => ps.chatId.toString() !== chatId)
  }

  sendMessage(payload: Omit<ChatMessage, 'id' | 'createdAt'>) {
    if (!this.client?.connected) {
      console.error(' STOMP not connected — cannot send message')
      return
    }
    this.client.publish({
      destination: '/app/chat.send',
      body: JSON.stringify(payload),
    })
  }

  joinChat(chatId: number, username: string) {
    if (!this.client?.connected) return
    this.client.publish({
      destination: '/app/chat.join',
      body: JSON.stringify({
        type: MessageType.JOIN,
        chatId,
        content: `${username} joined the chat`,
        senderId: 0,
        senderName: username,
      }),
    })
  }

  leaveChat(chatId: number, username: string) {
    if (!this.client?.connected) return
    this.client.publish({
      destination: '/app/chat.leave',
      body: JSON.stringify({
        type: MessageType.LEAVE,
        chatId,
        content: `${username} left the chat`,
        senderId: 0,
        senderName: username,
      }),
    })
  }
}

export const websocketService = new WebSocketService()
