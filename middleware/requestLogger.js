const morgan = require('morgan');
const logger = require('../config/logger');

// Custom Morgan token for response time in milliseconds
morgan.token('response-time-ms', (req, res) => {
  if (!req._startAt || !res._startAt) {
    return '0';
  }
  const ms = (res._startAt[0] - req._startAt[0]) * 1e3 +
    (res._startAt[1] - req._startAt[1]) * 1e-6;
  return ms.toFixed(3);
});

// Custom Morgan token for user ID
morgan.token('user-id', (req) => {
  return req.user?.id || 'anonymous';
});

// Define Morgan format
const morganFormat = process.env.NODE_ENV === 'production'
  ? ':remote-addr - :user-id [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time-ms ms'
  : ':method :url :status :response-time-ms ms - :res[content-length]';

// Create Morgan middleware
const requestLogger = morgan(morganFormat, {
  stream: logger.stream,
  skip: (req, res) => {
    // Skip logging for health check endpoint in production
    if (process.env.NODE_ENV === 'production' && req.url === '/api/health') {
      return true;
    }
    return false;
  },
});

module.exports = requestLogger;