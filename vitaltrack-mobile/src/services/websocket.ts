import { io, Socket } from 'socket.io-client';
import { apiService } from './api';
import { Vital, Alert } from '../types';

// WebSocket Configuration
const WEBSOCKET_URL = __DEV__
  ? 'http://localhost:3000'
  : 'https://api.vitaltrack.com';

// Event types
export interface WebSocketEvents {
  // Incoming events
  authenticated: (data: { success: boolean; message?: string }) => void;
  vital_update: (data: { residentId: string; data: Vital }) => void;
  alert_created: (data: { alert: Alert }) => void;
  alert_updated: (data: { alert: Alert }) => void;
  resident_status_changed: (data: { residentId: string; status: string }) => void;
  connection_health: (data: { connected: boolean; latency: number }) => void;
  error: (data: { message: string }) => void;

  // Outgoing events
  authenticate: (data: { token: string }) => void;
  subscribe_resident: (data: { residentId: string }) => void;
  unsubscribe_resident: (data: { residentId: string }) => void;
  ping: () => void;
}

class WebSocketService {
  private socket: Socket | null = null;
  private isConnecting: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private subscribedResidents: Set<string> = new Set();

  // Event handlers storage
  private eventHandlers: Map<string, Function[]> = new Map();

  constructor() {
    this.socket = null;
  }

  // Connect to WebSocket server
  async connect(): Promise<boolean> {
    if (this.socket?.connected) {
      console.log('[WebSocket] Already connected');
      return true;
    }

    if (this.isConnecting) {
      console.log('[WebSocket] Connection already in progress');
      return false;
    }

    this.isConnecting = true;

    try {
      const token = await apiService.storage.getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }

      console.log('[WebSocket] Connecting to', WEBSOCKET_URL);

      this.socket = io(WEBSOCKET_URL, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        timeout: 10000,
        autoConnect: false,
      });

      this.setupSocketListeners();
      this.socket.connect();

      // Wait for connection
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 10000);

        this.socket!.once('connect', () => {
          clearTimeout(timeout);
          console.log('[WebSocket] Connected, authenticating...');
          this.authenticate(token);
        });

        this.socket!.once('authenticated', (data: { success: boolean }) => {
          clearTimeout(timeout);
          this.isConnecting = false;
          this.reconnectAttempts = 0;

          if (data.success) {
            console.log('[WebSocket] Authenticated successfully');
            this.resubscribeToResidents();
            resolve(true);
          } else {
            console.error('[WebSocket] Authentication failed');
            this.disconnect();
            reject(new Error('Authentication failed'));
          }
        });

        this.socket!.once('connect_error', (error) => {
          clearTimeout(timeout);
          this.isConnecting = false;
          console.error('[WebSocket] Connection error:', error);
          reject(error);
        });
      });
    } catch (error) {
      this.isConnecting = false;
      console.error('[WebSocket] Failed to connect:', error);
      return false;
    }
  }

  // Disconnect from WebSocket server
  disconnect(): void {
    if (this.socket) {
      console.log('[WebSocket] Disconnecting...');
      this.socket.disconnect();
      this.socket = null;
      this.subscribedResidents.clear();
    }
  }

  // Check if connected
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  // Setup socket event listeners
  private setupSocketListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[WebSocket] Connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('[WebSocket] Max reconnection attempts reached');
        this.disconnect();
      }
    });

    this.socket.on('error', (error) => {
      console.error('[WebSocket] Error:', error);
      this.emit('error', error);
    });

    // Forward events to registered handlers
    const events = [
      'authenticated',
      'vital_update',
      'alert_created',
      'alert_updated',
      'resident_status_changed',
      'connection_health',
    ];

    events.forEach((event) => {
      this.socket!.on(event, (data) => {
        this.emit(event, data);
      });
    });
  }

  // Authenticate with server
  private authenticate(token: string): void {
    if (!this.socket?.connected) {
      console.error('[WebSocket] Cannot authenticate - not connected');
      return;
    }

    this.socket.emit('authenticate', { token });
  }

  // Subscribe to resident updates
  subscribeToResident(residentId: string): void {
    if (!this.socket?.connected) {
      console.error('[WebSocket] Cannot subscribe - not connected');
      return;
    }

    console.log('[WebSocket] Subscribing to resident:', residentId);
    this.socket.emit('subscribe_resident', { residentId });
    this.subscribedResidents.add(residentId);
  }

  // Unsubscribe from resident updates
  unsubscribeFromResident(residentId: string): void {
    if (!this.socket?.connected) {
      console.error('[WebSocket] Cannot unsubscribe - not connected');
      return;
    }

    console.log('[WebSocket] Unsubscribing from resident:', residentId);
    this.socket.emit('unsubscribe_resident', { residentId });
    this.subscribedResidents.delete(residentId);
  }

  // Resubscribe to all residents (after reconnection)
  private resubscribeToResidents(): void {
    if (!this.socket?.connected) return;

    console.log('[WebSocket] Resubscribing to', this.subscribedResidents.size, 'residents');
    this.subscribedResidents.forEach((residentId) => {
      this.socket!.emit('subscribe_resident', { residentId });
    });
  }

  // Register event handler
  on<K extends keyof WebSocketEvents>(event: K, handler: WebSocketEvents[K]): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler as Function);
  }

  // Unregister event handler
  off<K extends keyof WebSocketEvents>(event: K, handler: WebSocketEvents[K]): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler as Function);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  // Emit event to registered handlers
  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          console.error(`[WebSocket] Error in ${event} handler:`, error);
        }
      });
    }
  }

  // Send ping to measure latency
  ping(): void {
    if (!this.socket?.connected) return;
    this.socket.emit('ping');
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
export default websocketService;
