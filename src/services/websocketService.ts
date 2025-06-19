// src/lib/services/websocketService.ts
import { Client, IMessage, StompSubscription } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { ChatMessage, MessageType } from '@/types/chat'
import { useAuthStore } from '@/lib/store/auth.store'

type PendingSub = {
  chatId: number
  onMessage: (m: ChatMessage) => void
  onUpdate: (m: ChatMessage) => void
  onDelete: (messageId: number) => void
}

class WebSocketService {
  private client: Client | null = null
  private subscriptions: Record<number, StompSubscription> = {}
  private onConnectCbs: Array<() => void> = []
  private pendingSubs: PendingSub[] = []
  private connected = false

  onConnect(cb: () => void) {
    this.onConnectCbs.push(cb)
  }

  isConnected() {
    return this.connected
  }

  connect() {
    const { accessToken } = useAuthStore.getState()
    if (this.connected) return

    this.client = new Client({
      webSocketFactory: () =>
        new SockJS(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:9090/ws'),
      connectHeaders: { Authorization: `Bearer ${accessToken}` },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    })

    this.client.onConnect = () => {
      this.connected = true
      // Drain buffered subs
      this.pendingSubs.forEach(ps =>
        this._doSubscribe(ps.chatId, ps.onMessage, ps.onUpdate, ps.onDelete)
      )
      this.pendingSubs = []
      this.onConnectCbs.forEach(cb => cb())
    }

    this.client.onStompError = frame => {
      console.error('STOMP error:', frame)
      this.connected = false
    }
    this.client.onWebSocketError = err => {
      console.error('WebSocket error:', err)
      this.connected = false
    }
    this.client.onWebSocketClose = () => {
      console.warn('WebSocket closed')
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
  }

  subscribeToChat(
    chatId: number,
    onMessage: (m: ChatMessage) => void,
    onUpdate: (m: ChatMessage) => void,
    onDelete: (messageId: number) => void
  ) {
    if (!this.client || !this.client.connected) {
      this.pendingSubs.push({ chatId, onMessage, onUpdate, onDelete })
      return
    }
    this._doSubscribe(chatId, onMessage, onUpdate, onDelete)
  }

  private _doSubscribe(
    chatId: number,
    onMessage: (m: ChatMessage) => void,
    onUpdate: (m: ChatMessage) => void,
    onDelete: (messageId: number) => void
  ) {
    // Unsubscribe any existing one
    this.subscriptions[chatId]?.unsubscribe()

    this.subscriptions[chatId] = this.client!.subscribe(
      `/topic/chat.${chatId}`,
      (frame: IMessage) => {
        const msg = JSON.parse(frame.body) as ChatMessage
        switch (msg.type) {
          case MessageType.CHAT:
            onMessage(msg)
            break
          case MessageType.UPDATE:
            onUpdate(msg)
            break
          case MessageType.DELETE:
            // server sends just { type: 'DELETE', id: <messageId> }
            onDelete(msg.id!)
            break
        }
      }
    )
  }

  unsubscribeFromChat(chatId: number) {
    this.subscriptions[chatId]?.unsubscribe()
    delete this.subscriptions[chatId]
    this.pendingSubs = this.pendingSubs.filter(ps => ps.chatId !== chatId)
  }

  sendMessage(payload: Omit<ChatMessage, 'id' | 'createdAt'>) {
    if (!this.client?.connected) {
      console.error('Cannot send — STOMP not connected')
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
