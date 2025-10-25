const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting - configurable via environment variables
const limiter = rateLimit({
  windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW) || 15) * 60 * 1000, // minutes to milliseconds
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || (process.env.NODE_ENV === 'production' ? 100 : 1000), // limit each IP to max requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// CORS - Deployment friendly configuration
const getAllowedOrigins = () => {
  if (process.env.CORS_ORIGIN) {
    // Support multiple origins separated by commas
    return process.env.CORS_ORIGIN.split(',').map(origin => origin.trim());
  }
  
  // Fallback for development if no CORS_ORIGIN is set
  return process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.com'] 
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8080', 'http://localhost:8081', 'http://localhost:8082'];
};

const corsOptions = {
  origin: getAllowedOrigins(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parser middleware - configurable via environment variables
app.use(express.json({ limit: process.env.MAX_FILE_SIZE || '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Route files
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

// Mount routers
app.use('/api/auth', auth);
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

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/dist')));
  
  // Catch all handler: send back React's index.html file for any non-API routes
  app.get('*', (req, res) => {
    if (!req.originalUrl.startsWith('/api')) {
      res.sendFile(path.join(__dirname, 'client/dist', 'index.html'));
    }
  });
}

// Health check endpoint
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

// Handle 404 errors
app.all('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handler middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Resource not found'
    });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    return res.status(400).json({
      success: false,
      message
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    return res.status(400).json({
      success: false,
      message
    });
  }

  // JWT errors
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

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log(`Error: ${err.message}`);
  console.log('Shutting down due to uncaught exception');
  process.exit(1);
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║  🚀  Exam Planner API Server Running              ║
║                                                              ║
║  📍 Port: ${PORT}                                               ║
║  🌍 Mode: ${process.env.NODE_ENV || 'development'}                                        ║
║  📅 Started: ${new Date().toLocaleString()}                    ║
║                                                              ║
║  📖 API Documentation:                                       ║
║  • Auth: http://localhost:${PORT}/api/auth                      ║
║  • Books: http://localhost:${PORT}/api/books                    ║
║  • Daily Goals: http://localhost:${PORT}/api/goals/daily        ║
║  • Monthly Plans: http://localhost:${PORT}/api/goals/monthly    ║
║  • Study Sessions: http://localhost:${PORT}/api/sessions        ║
║  • Syllabus: http://localhost:${PORT}/api/syllabus             ║
║  • UPSC Resources: http://localhost:${PORT}/api/upsc-resources  ║
║  • Newspaper Analysis: http://localhost:${PORT}/api/newspaper-analysis ║
║  • Health Check: http://localhost:${PORT}/api/health           ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
