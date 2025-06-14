import { Client, IMessage, StompSubscription } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { ChatMessage, MessageType } from '@/types/chat'
import { useAuthStore } from '@/lib/store/auth.store'

type PendingSub = {
  chatId: number
  onMessage: (m: ChatMessage) => void
}

class WebSocketService {
  private client: Client | null = null
  private subscriptions: Record<number, StompSubscription> = {}
  private onConnectCbs: Array<() => void> = []
  private pendingSubs: PendingSub[] = []
  private connected = false  // <-- track connection state

  onConnect(cb: () => void) {
    this.onConnectCbs.push(cb)
  }

  isConnected() {
    return this.connected
  }

  connect() {
    const { accessToken } = useAuthStore.getState()
    console.log('STOMP connecting with token:', accessToken)

    if (this.connected) {
      console.log('Already connected, skipping connect')
      return
    }

    this.client = new Client({
      webSocketFactory: () =>
        new SockJS(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:9090/ws'),
      connectHeaders: { Authorization: `Bearer ${accessToken}` },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    })

    this.client.onConnect = () => {
      console.log('STOMP connected')
      this.connected = true

      // Drain buffered subs
      this.pendingSubs.forEach(({ chatId, onMessage }) =>
        this._doSubscribe(chatId, onMessage)
      )
      this.pendingSubs = []

      // Fire onConnect callbacks
      this.onConnectCbs.forEach(cb => cb())
    }

    this.client.onStompError = frame => {
      console.error('STOMP error frame:', frame)
      this.connected = false
    }
    this.client.onWebSocketError = err => {
      console.error('WebSocket error:', err)
      this.connected = false
    }
    this.client.onWebSocketClose = evt => {
      console.warn('WebSocket closed:', evt)
      this.connected = false
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
    this.connected = false
    console.log('STOMP disconnected')
  }

  subscribeToChat(chatId: number, onMessage: (m: ChatMessage) => void) {
    if (!this.client || !this.client.connected) {
      console.log(`Buffering subscribe for chat ${chatId}`)
      this.pendingSubs.push({ chatId, onMessage })
      return
    }
    this._doSubscribe(chatId, onMessage)
  }

  private _doSubscribe(chatId: number, onMessage: (m: ChatMessage) => void) {
    this.subscriptions[chatId]?.unsubscribe()

    this.subscriptions[chatId] = this.client!.subscribe(
      `/topic/chat.${chatId}`,
      (msg: IMessage) => {
        console.log(`Received STOMP message on chat.${chatId}:`, msg.body)
        onMessage(JSON.parse(msg.body) as ChatMessage)
      }
    )
    console.log(`Subscribed to /topic/chat.${chatId}`)
  }

  unsubscribeFromChat(chatId: number) {
    this.subscriptions[chatId]?.unsubscribe()
    delete this.subscriptions[chatId]
    console.log(`Unsubscribed from chat ${chatId}`)
    this.pendingSubs = this.pendingSubs.filter(ps => ps.chatId !== chatId)
  }

  sendMessage(payload: Omit<ChatMessage, 'id' | 'createdAt'>) {
    if (!this.client?.connected) {
      console.error('STOMP not connected — cannot send message')
      return
    }
    console.log('Sending message payload:', payload)
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
