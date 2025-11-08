import express, { Application } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { connectDatabase } from './config/database';
import { config } from './config/environment';
import { logger } from './utils/logger';
import routes from './routes';
import { errorHandler, notFound } from './middleware/errorHandler';

// Create Express app
const app: Application = express();
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: config.cors.origin,
    credentials: true,
  },
  pingInterval: config.websocket.pingInterval,
  pingTimeout: config.websocket.pingTimeout,
});

// Trust proxy (for deployment behind load balancers)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all routes
app.use('/api/', limiter);

// Request logging (development only)
if (config.nodeEnv === 'development') {
  app.use((req, res, next) => {
    logger.debug(`${req.method} ${req.path}`, {
      query: req.query,
      body: req.body,
    });
    next();
  });
}

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'VitalTrack API Server',
    version: '1.0.0',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api', routes);

// Setup WebSocket handlers
import { setupSocketHandlers } from './websocket/socketHandlers';
import AlertingEngine from './websocket/alertingEngine';

setupSocketHandlers(io);

// Initialize alerting engine
const alertingEngine = new AlertingEngine(io);

// Make io and alerting engine available globally
app.set('io', io);
app.set('alertingEngine', alertingEngine);

// 404 handler
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received, starting graceful shutdown...`);

  // Close HTTP server
  httpServer.close(() => {
    logger.info('HTTP server closed');
  });

  // Close Socket.IO server
  io.close(() => {
    logger.info('WebSocket server closed');
  });

  // Close database connections
  // await sequelize.close();

  logger.info('Graceful shutdown completed');
  process.exit(0);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
  process.exit(1);
});

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();

    // Sync database models (development only)
    if (config.nodeEnv === 'development') {
      // await syncDatabase(false);
      logger.info('Database models synced (dev mode)');
    }

    // Start HTTP server
    const PORT = config.port;
    httpServer.listen(PORT, () => {
      logger.info(`🚀 VitalTrack API Server running on port ${PORT}`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info(`API URL: http://localhost:${PORT}/api`);
      logger.info(`Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

// Start the server
startServer();

export { app, io };
