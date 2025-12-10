const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const residentRoutes = require('./routes/residents');
const alertRoutes = require('./routes/alerts');
const facilityRoutes = require('./routes/facilities');
const { startVitalSimulator } = require('./services/vitalSimulator');

const app = express();
const server = http.createServer(app);

app.set('trust proxy', 1);

// Configure allowed origins based on environment
const getAllowedOrigins = () => {
  if (process.env.ALLOWED_ORIGINS) {
    return process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
  }
  // In production, restrict to same-origin; in development, allow localhost
  if (process.env.NODE_ENV === 'production') {
    return false; // Same-origin only
  }
  return ['http://localhost:5173', 'http://localhost:3001'];
};

const corsOptions = {
  origin: getAllowedOrigins(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

const io = new Server(server, {
  cors: corsOptions
});

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(cors(corsOptions));

app.use(express.json());
app.use(cookieParser());

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many requests' } }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many login attempts' } }
});

app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/residents', residentRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/facilities', facilityRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(express.static(path.join(__dirname, '../client/dist')));

app.get('/{*splat}', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-facility', (facilityId) => {
    socket.join(`facility:${facilityId}`);
    console.log(`Socket ${socket.id} joined facility:${facilityId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const emitVitalUpdate = (facilityId, residentId, vitals) => {
  io.to(`facility:${facilityId}`).emit('vital-update', { residentId, vitals });
};

const emitNewAlert = (facilityId, alert) => {
  io.to(`facility:${facilityId}`).emit('new-alert', alert);
};

app.set('io', io);
app.set('emitVitalUpdate', emitVitalUpdate);
app.set('emitNewAlert', emitNewAlert);

const PORT = process.env.PORT || 3001;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`VitalTrack API Server running on port ${PORT}`);
  
  startVitalSimulator(io, emitVitalUpdate, emitNewAlert);
});

module.exports = { app, server, io };
