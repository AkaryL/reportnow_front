import { mockVehicles } from './mocks';
import type { WSPositionUpdate, WSNotificationEvent } from './types';

type EventHandler = {
  'position:update': (data: WSPositionUpdate) => void;
  'notification:new': (data: WSNotificationEvent) => void;
};

/**
 * Mock WebSocket client for development
 * Simulates real-time position updates and notifications
 */
class MockWebSocket {
  private handlers: Map<string, Set<Function>> = new Map();
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private notificationIntervalId: ReturnType<typeof setInterval> | null = null;
  private vehiclePositions: Map<string, { lat: number; lng: number }> = new Map();

  constructor() {
    // Initialize vehicle positions
    mockVehicles.forEach(vehicle => {
      this.vehiclePositions.set(vehicle.id, {
        lat: vehicle.lat,
        lng: vehicle.lng,
      });
    });
  }

  connect(): void {
    console.log('[Mock WS] Connected');
    this.startPositionUpdates();
    this.startNotificationUpdates();
  }

  disconnect(): void {
    console.log('[Mock WS] Disconnected');
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.notificationIntervalId) {
      clearInterval(this.notificationIntervalId);
      this.notificationIntervalId = null;
    }
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

  emit(event: string, data: any): void {
    // Mock emit (no-op for now)
    console.log('[Mock WS] Emit:', event, data);
  }

  get isConnected(): boolean {
    return this.intervalId !== null;
  }

  private startPositionUpdates(): void {
    // Update positions every 1 second for moving vehicles
    this.intervalId = setInterval(() => {
      mockVehicles.forEach((vehicle) => {
        if (vehicle.status !== 'moving') return;

        const currentPos = this.vehiclePositions.get(vehicle.id);
        if (!currentPos) return;

        // Simulate movement (small random changes)
        const newLat = currentPos.lat + (Math.random() - 0.5) * 0.002;
        const newLng = currentPos.lng + (Math.random() - 0.5) * 0.002;

        this.vehiclePositions.set(vehicle.id, { lat: newLat, lng: newLng });

        const update: WSPositionUpdate = {
          vehicleId: vehicle.id,
          lat: newLat,
          lng: newLng,
          speed: vehicle.speed + (Math.random() - 0.5) * 5,
          status: vehicle.status,
          timestamp: new Date().toISOString(),
        };

        this.trigger('position:update', update);
      });
    }, 1000);
  }

  private startNotificationUpdates(): void {
    // Send a random notification every 30 seconds
    this.notificationIntervalId = setInterval(() => {
      const notifications = [
        {
          type: 'info' as const,
          text: 'Vehículo entró en geocerca',
        },
        {
          type: 'warn' as const,
          text: 'Velocidad excedida',
        },
      ];

      const randomVehicle = mockVehicles[Math.floor(Math.random() * mockVehicles.length)];
      const randomNotif = notifications[Math.floor(Math.random() * notifications.length)];

      const notification: WSNotificationEvent = {
        notification: {
          id: `n-${Date.now()}`,
          ts: new Date().toISOString(),
          type: randomNotif.type,
          vehicleId: randomVehicle.id,
          vehiclePlate: randomVehicle.plate,
          text: randomNotif.text,
          read: false,
        },
      };

      this.trigger('notification:new', notification);
    }, 30000); // Every 30 seconds
  }

  private trigger<K extends keyof EventHandler>(event: K, data: Parameters<EventHandler[K]>[0]): void {
    const handlers = this.handlers.get(event);
    if (!handlers) return;

    handlers.forEach((handler) => {
      (handler as any)(data);
    });
  }
}

export const mockWsClient = new MockWebSocket();
