import { WS_URL, LS_TOKEN_KEY } from './constants';

export type VehicleLastStatus = 'engine_on' | 'moving' | 'stopped' | 'engine_off';

export interface WSVehicleUpdate {
  id: string;
  imei: string;
  lat: number | null;
  lng: number | null;
  speed: number | null;
  bearing: number | null;
  last_seen: string | null;
  last_status: VehicleLastStatus | null;
}

export interface WSMessage {
  type: string;
  data: any;
  timestamp: string;
}

type EventHandler = {
  'vehicle:updated': (data: WSVehicleUpdate) => void;
  'notification:new': (data: any) => void;
  'connection:established': (data: any) => void;
  'error': (data: any) => void;
};

/**
 * WebSocket client for real-time updates from the backend
 */
class WebSocketClient {
  private ws: WebSocket | null = null;
  private handlers: Map<string, Set<Function>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000; // 3 seconds
  private reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private pingIntervalId: ReturnType<typeof setInterval> | null = null;
  private isIntentionalClose = false;

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('[WS] Already connected');
      return;
    }

    const token = localStorage.getItem(LS_TOKEN_KEY);
    if (!token) {
      console.warn('[WS] No token found, cannot connect');
      return;
    }

    this.isIntentionalClose = false;
    const wsUrl = `${WS_URL}/ws?token=${encodeURIComponent(token)}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[WS] Connected');
        this.reconnectAttempts = 0;
        this.startPingInterval();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (e) {
          console.error('[WS] Error parsing message:', e);
        }
      };

      this.ws.onclose = (event) => {
        console.log('[WS] Disconnected', event.code, event.reason);
        this.stopPingInterval();

        if (!this.isIntentionalClose && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('[WS] Error:', error);
        this.trigger('error', { error });
      };
    } catch (e) {
      console.error('[WS] Failed to create WebSocket:', e);
    }
  }

  disconnect(): void {
    this.isIntentionalClose = true;
    this.stopPingInterval();

    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    console.log('[WS] Disconnected intentionally');
  }

  on<K extends keyof EventHandler>(event: K, handler: EventHandler[K]): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
  }

  off<K extends keyof EventHandler>(event: K, handler?: EventHandler[K]): void {
    if (!this.handlers.has(event)) return;

    if (handler) {
      this.handlers.get(event)!.delete(handler);
    } else {
      this.handlers.delete(event);
    }
  }

  send(data: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('[WS] Cannot send, not connected');
    }
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private handleMessage(message: WSMessage): void {
    const { type, data } = message;

    switch (type) {
      case 'connection:established':
        console.log('[WS] Connection established:', data);
        this.trigger('connection:established', data);
        break;

      case 'vehicle:updated':
        this.trigger('vehicle:updated', data as WSVehicleUpdate);
        break;

      case 'notification:new':
        this.trigger('notification:new', data);
        break;

      case 'pong':
        // Keep-alive response, no action needed
        break;

      default:
        console.log('[WS] Unknown message type:', type);
    }
  }

  private trigger<K extends keyof EventHandler>(event: K, data: Parameters<EventHandler[K]>[0]): void {
    const handlers = this.handlers.get(event);
    if (!handlers) return;

    handlers.forEach((handler) => {
      try {
        (handler as any)(data);
      } catch (e) {
        console.error(`[WS] Error in handler for ${event}:`, e);
      }
    });
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;

    console.log(`[WS] Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

    this.reconnectTimeoutId = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private startPingInterval(): void {
    // Send ping every 30 seconds to keep connection alive
    this.pingIntervalId = setInterval(() => {
      this.send({ type: 'ping' });
    }, 30000);
  }

  private stopPingInterval(): void {
    if (this.pingIntervalId) {
      clearInterval(this.pingIntervalId);
      this.pingIntervalId = null;
    }
  }
}

// Singleton instance
export const wsClient = new WebSocketClient();
