const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/database');
const logger = require('./config/logger');
const requestLogger = require('./middleware/requestLogger');
const { initSentry, Sentry } = require('./config/sentry');
const { initRedis, closeRedis } = require('./config/redis');
const { initializeSocketHandlers } = require('./config/socket');
const { scheduleStudyRoomReminders, stopScheduler } = require('./utils/notificationScheduler');

dotenv.config();

logger.info('Starting application...');

connectDB();
initRedis();
scheduleStudyRoomReminders();

const app = express();
const server = http.createServer(app);

const getAllowedOrigins = () => {
  if (process.env.CORS_ORIGIN) {
    return process.env.CORS_ORIGIN.split(',').map(origin => origin.trim());
  }
  
  return process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.com'] 
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8080', 'http://localhost:8081', 'http://localhost:8082'];
};

const io = socketIo(server, {
  cors: {
    origin: getAllowedOrigins(),
    credentials: true,
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling']
});

global.io = io;

initializeSocketHandlers(io);

const sentryInstance = initSentry(app);

if (sentryInstance) {
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
}

app.use(helmet());

const limiter = rateLimit({
  windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW) || 15) * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || (process.env.NODE_ENV === 'production' ? 100 : 1000),
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

const corsOptions = {
  origin: getAllowedOrigins(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(requestLogger);

app.use(express.json({ limit: process.env.MAX_FILE_SIZE || '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const auth = require('./routes/auth');
const books = require('./routes/books');
const dailyGoals = require('./routes/dailyGoals');
const simpleDailyGoals = require('./routes/simpleDailyGoals');
const monthlyPlans = require('./routes/monthlyPlans');
const studySessions = require('./routes/studySessions');
const syllabus = require('./routes/syllabus');
const upscResources = require('./routes/upscResources');
const newspaperAnalysis = require('./routes/newspaperAnalysis');
const studyGroups = require('./routes/studyGroups');
const groupProgress = require('./routes/groupProgress');
const studyRooms = require('./routes/studyRooms');
const sharedResources = require('./routes/sharedResources');
const resources = require('./routes/resources');
const notifications = require('./routes/notifications');

app.use('/api/auth', authLimiter, auth);
app.use('/api/books', books);
app.use('/api/goals/daily', dailyGoals);
app.use('/api/daily-goals', simpleDailyGoals);
app.use('/api/goals/monthly', monthlyPlans);
app.use('/api/sessions', studySessions);
app.use('/api/syllabus', syllabus);
app.use('/api/upsc-resources', upscResources);
app.use('/api/newspaper-analysis', newspaperAnalysis);
app.use('/api/groups', studyGroups);
app.use('/api/group-progress', groupProgress);
app.use('/api/study-rooms', studyRooms);
app.use('/api/shared-resources', sharedResources);
app.use('/api/resources', resources);
app.use('/api/notifications', notifications);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/dist')));
  
  app.get('*', (req, res) => {
    if (!req.originalUrl.startsWith('/api')) {
      res.sendFile(path.join(__dirname, 'client/dist', 'index.html'));
    }
  });
}

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: `${process.env.APP_NAME || 'Exam Planner'} API is running`,
    version: process.env.APP_VERSION || '1.0.0',
    description: process.env.APP_DESCRIPTION || 'Exam Study Planner API',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT
  });
});

app.all('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

if (sentryInstance) {
  app.use(Sentry.Handlers.errorHandler());
}

app.use((err, req, res, next) => {
  logger.logError(err, {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userId: req.user?.id
  });

  if (sentryInstance) {
    Sentry.captureException(err, {
      user: req.user ? { id: req.user.id, email: req.user.email } : undefined,
      tags: {
        endpoint: req.originalUrl,
        method: req.method,
      },
      extra: {
        body: req.body,
        query: req.query,
        params: req.params,
      },
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Resource not found'
    });
  }

  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    return res.status(400).json({
      success: false,
      message
    });
  }

  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    return res.status(400).json({
      success: false,
      message
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server Error'
  });
});

process.on('unhandledRejection', (err, promise) => {
  logger.error('Unhandled Promise Rejection:', {
    message: err.message,
    stack: err.stack,
    promise
  });
  
  if (sentryInstance) {
    Sentry.captureException(err, {
      tags: { type: 'unhandledRejection' }
    });
  }
  
  gracefulShutdown('UNHANDLED_REJECTION');
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', {
    message: err.message,
    stack: err.stack
  });
  
  if (sentryInstance) {
    Sentry.captureException(err, {
      tags: { type: 'uncaughtException' }
    });
  }
  
  logger.error('Shutting down due to uncaught exception');
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  logger.info('Server started successfully', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version
  });
});

const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  
  stopScheduler();
  
  io.close(() => {
    logger.info('Socket.IO server closed');
  });
  
  server.close(async () => {
    logger.info('HTTP server closed');
    
    try {
      await closeRedis();
    } catch (err) {
      logger.error('Error closing Redis:', err);
    }
    
    if (sentryInstance) {
      Sentry.close(2000).then(() => {
        logger.info('Sentry client closed');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });
  
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = app;