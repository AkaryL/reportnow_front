import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3000';

class WebSocketClient {
  private socket: Socket | null = null;

  connect(): void {
    // WebSocket disabled to prevent auto-reload
    return;

    // if (this.socket?.connected) {
    //   return;
    // }

    // this.socket = io(SOCKET_URL, {
    //   transports: ['websocket'],
    //   autoConnect: true,
    // });

    // this.socket.on('connect', () => {
    //   console.log('✅ WebSocket connected');
    // });

    // this.socket.on('disconnect', () => {
    //   console.log('❌ WebSocket disconnected');
    // });

    // this.socket.on('connect_error', (error) => {
    //   console.error('WebSocket connection error:', error);
    // });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on<T = any>(event: string, handler: (data: T) => void): void {
    if (this.socket) {
      this.socket.on(event, handler);
    }
  }

  off(event: string): void {
    if (this.socket) {
      this.socket.off(event);
    }
  }

  emit(event: string, data?: any): void {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }
}

export const wsClient = new WebSocketClient();
