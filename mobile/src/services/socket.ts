import { io, Socket } from 'socket.io-client';
import { api } from './api';
import { useNotificationsStore } from '../store/notifications.store';

const WS_URL = process.env.EXPO_PUBLIC_WS_URL || 'http://localhost:3000';

class SocketService {
  private socket: Socket | null = null;
  private messageHandlers = new Map<string, Set<(data: any) => void>>();

  async connect() {
    if (this.socket?.connected) return;

    const token = await api.getAccessToken();
    if (!token) return;

    this.socket = io(`${WS_URL}/ws`, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });

    this.socket.on('new_message', (data) => {
      this.emit('new_message', data);
      useNotificationsStore.getState().incrementUnread();
    });

    this.socket.on('notification', (data) => {
      this.emit('notification', data);
      useNotificationsStore.getState().incrementUnread();
    });

    this.socket.on('user_typing', (data) => {
      this.emit('user_typing', data);
    });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  joinConversation(conversationId: string) {
    this.socket?.emit('join_conversation', { conversationId });
  }

  leaveConversation(conversationId: string) {
    this.socket?.emit('leave_conversation', { conversationId });
  }

  sendMessage(conversationId: string, body: string) {
    return new Promise((resolve, reject) => {
      if (!this.socket) return reject(new Error('Not connected'));
      this.socket.emit('send_message', { conversationId, body }, (response: any) => {
        if (response?.success) resolve(response);
        else reject(new Error(response?.message || 'Failed to send'));
      });
    });
  }

  sendTyping(conversationId: string) {
    this.socket?.emit('typing', { conversationId });
  }

  on(event: string, handler: (data: any) => void) {
    if (!this.messageHandlers.has(event)) {
      this.messageHandlers.set(event, new Set());
    }
    this.messageHandlers.get(event)!.add(handler);
    return () => this.messageHandlers.get(event)?.delete(handler);
  }

  private emit(event: string, data: any) {
    this.messageHandlers.get(event)?.forEach((h) => h(data));
  }

  isConnected() {
    return this.socket?.connected ?? false;
  }
}

export const socketService = new SocketService();
