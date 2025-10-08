import { io, Socket } from 'socket.io-client';
import { WS_URL } from './constants';
import type { WSPositionUpdate, WSNotificationEvent } from './types';

type WSEventHandler = {
  'position:update': (data: WSPositionUpdate) => void;
  'notification:new': (data: WSNotificationEvent) => void;
};

class WebSocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(WS_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.disconnect();
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on<K extends keyof WSEventHandler>(event: K, handler: WSEventHandler[K]): void {
    if (!this.socket) {
      console.warn('WebSocket not connected');
      return;
    }

    this.socket.on(event as string, handler as any);
  }

  off<K extends keyof WSEventHandler>(event: K, handler?: WSEventHandler[K]): void {
    if (!this.socket) {
      return;
    }

    if (handler) {
      this.socket.off(event as string, handler as any);
    } else {
      this.socket.off(event as string);
    }
  }

  emit(event: string, data: any): void {
    if (!this.socket) {
      console.warn('WebSocket not connected');
      return;
    }

    this.socket.emit(event, data);
  }

  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const wsClient = new WebSocketClient();
