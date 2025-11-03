const Redis = require('ioredis');
const logger = require('./logger');

let redisClient = null;

const initRedis = () => {
  if (!process.env.REDIS_URL && process.env.NODE_ENV === 'production') {
    logger.warn('REDIS_URL not configured in production. Caching disabled.');
    return null;
  }

  if (!process.env.REDIS_URL) {
    logger.info('REDIS_URL not configured. Caching disabled.');
    return null;
  }

  try {
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError(err) {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          return true;
        }
        return false;
      }
    });

    redisClient.on('connect', () => {
      logger.info('Redis client connected');
    });

    redisClient.on('ready', () => {
      logger.info('Redis client ready');
    });

    redisClient.on('error', (err) => {
      logger.error('Redis client error:', {
        message: err.message,
        stack: err.stack
      });
    });

    redisClient.on('close', () => {
      logger.warn('Redis client connection closed');
    });

    redisClient.on('reconnecting', () => {
      logger.info('Redis client reconnecting');
    });

    return redisClient;
  } catch (error) {
    logger.error('Failed to initialize Redis:', {
      message: error.message,
      stack: error.stack
    });
    return null;
  }
};

const getRedisClient = () => {
  return redisClient;
};

const closeRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    logger.info('Redis connection closed');
  }
};

module.exports = {
  initRedis,
  getRedisClient,
  closeRedis
};