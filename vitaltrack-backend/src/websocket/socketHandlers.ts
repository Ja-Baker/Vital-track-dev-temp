import { Server, Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt';
import { logger, auditLogger } from '../utils/logger';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  facilityId?: string;
  role?: string;
}

export const setupSocketHandlers = (io: Server) => {
  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info('WebSocket client connected', { socketId: socket.id });

    // Authentication handler
    socket.on('authenticate', async (data: { token: string }) => {
      try {
        const { token } = data;

        if (!token) {
          socket.emit('authenticated', {
            success: false,
            error: 'Token required'
          });
          socket.disconnect();
          return;
        }

        // Verify JWT token
        const decoded = verifyToken(token);

        if (decoded.type !== 'access') {
          socket.emit('authenticated', {
            success: false,
            error: 'Invalid token type'
          });
          socket.disconnect();
          return;
        }

        // Attach user data to socket
        socket.userId = decoded.userId;
        socket.facilityId = decoded.facilityId;
        socket.role = decoded.role;

        // Join facility room for broadcasting
        socket.join(`facility_${decoded.facilityId}`);

        logger.info('Socket authenticated', {
          socketId: socket.id,
          userId: decoded.userId,
          facilityId: decoded.facilityId,
          role: decoded.role,
        });

        auditLogger.info('WebSocket connection authenticated', {
          userId: decoded.userId,
          facilityId: decoded.facilityId,
          socketId: socket.id,
        });

        socket.emit('authenticated', {
          success: true,
          userId: decoded.userId,
          facilityId: decoded.facilityId,
        });
      } catch (error) {
        logger.error('Socket authentication failed', {
          error,
          socketId: socket.id
        });
        socket.emit('authenticated', {
          success: false,
          error: 'Authentication failed'
        });
        socket.disconnect();
      }
    });

    // Subscribe to specific resident updates
    socket.on('subscribe_resident', (data: { residentId: string }) => {
      if (!socket.userId) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      const { residentId } = data;
      socket.join(`resident_${residentId}`);

      logger.debug('Socket subscribed to resident', {
        socketId: socket.id,
        userId: socket.userId,
        residentId,
      });

      socket.emit('subscribed', { residentId });
    });

    // Unsubscribe from resident updates
    socket.on('unsubscribe_resident', (data: { residentId: string }) => {
      const { residentId } = data;
      socket.leave(`resident_${residentId}`);

      logger.debug('Socket unsubscribed from resident', {
        socketId: socket.id,
        residentId,
      });

      socket.emit('unsubscribed', { residentId });
    });

    // Ping/pong for connection health check
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info('WebSocket client disconnected', {
        socketId: socket.id,
        userId: socket.userId,
        facilityId: socket.facilityId,
        reason,
      });

      if (socket.userId) {
        auditLogger.info('WebSocket connection closed', {
          userId: socket.userId,
          facilityId: socket.facilityId,
          socketId: socket.id,
          reason,
        });
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error('WebSocket error', {
        error,
        socketId: socket.id,
        userId: socket.userId,
      });
    });
  });

  return io;
};

// Helper function to broadcast vital update to facility
export const broadcastVitalUpdate = (
  io: Server,
  facilityId: string,
  residentId: string,
  vitalData: any
) => {
  io.to(`facility_${facilityId}`).emit('vital_update', {
    residentId,
    data: vitalData,
    timestamp: new Date().toISOString(),
  });

  // Also send to specific resident subscribers
  io.to(`resident_${residentId}`).emit('vital_update', {
    residentId,
    data: vitalData,
    timestamp: new Date().toISOString(),
  });

  logger.debug('Vital update broadcasted', {
    facilityId,
    residentId,
  });
};

// Helper function to broadcast alert to facility
export const broadcastAlert = (
  io: Server,
  facilityId: string,
  alertData: any
) => {
  io.to(`facility_${facilityId}`).emit('alert_triggered', {
    alert: alertData,
    timestamp: new Date().toISOString(),
  });

  logger.info('Alert broadcasted', {
    facilityId,
    alertId: alertData.id,
    alertType: alertData.alertType,
    residentId: alertData.residentId,
  });
};

// Helper function to broadcast alert status update
export const broadcastAlertUpdate = (
  io: Server,
  facilityId: string,
  alertData: any
) => {
  io.to(`facility_${facilityId}`).emit('alert_updated', {
    alert: alertData,
    timestamp: new Date().toISOString(),
  });

  logger.debug('Alert update broadcasted', {
    facilityId,
    alertId: alertData.id,
    status: alertData.status,
  });
};

// Helper function to get connected clients count
export const getConnectedClientsCount = (io: Server, facilityId?: string): number => {
  if (facilityId) {
    const room = io.sockets.adapter.rooms.get(`facility_${facilityId}`);
    return room ? room.size : 0;
  }
  return io.sockets.sockets.size;
};
