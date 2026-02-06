const { getRedisClient } = require('../config/redis');
const logger = require('../config/logger');

const cache = (duration = 300) => {
  return async (req, res, next) => {
    const redisClient = getRedisClient();
    
    if (!redisClient || !redisClient.status || redisClient.status !== 'ready') {
      return next();
    }

    if (req.method !== 'GET') {
      return next();
    }

    const key = `cache:${req.originalUrl || req.url}:${req.user?.id || 'anonymous'}`;

    try {
      const cachedResponse = await redisClient.get(key);
      
      if (cachedResponse) {
        logger.debug('Cache hit', { key, url: req.originalUrl });
        return res.json(JSON.parse(cachedResponse));
      }

      logger.debug('Cache miss', { key, url: req.originalUrl });

      const originalJson = res.json.bind(res);
      res.json = (data) => {
        redisClient.setex(key, duration, JSON.stringify(data)).catch(err => {
          logger.error('Cache set error:', {
            message: err.message,
            key
          });
        });
        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', {
        message: error.message,
        stack: error.stack,
        key
      });
      next();
    }
  };
};

const invalidateCache = (pattern) => {
  return async (req, res, next) => {
    const redisClient = getRedisClient();
    
    if (!redisClient || !redisClient.status || redisClient.status !== 'ready') {
      return next();
    }

    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
        logger.debug('Cache invalidated', { pattern, count: keys.length });
      }
    } catch (error) {
      logger.error('Cache invalidation error:', {
        message: error.message,
        pattern
      });
    }

    next();
  };
};

const invalidateCacheForUser = async (req, res, next) => {
  const redisClient = getRedisClient();
  
  if (!redisClient || !redisClient.status || redisClient.status !== 'ready') {
    return next();
  }

  const userId = req.user?.id;
  if (!userId) {
    return next();
  }

  try {
    const pattern = `cache:*:${userId}`;
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
      logger.debug('User cache invalidated', { userId, count: keys.length });
    }
  } catch (error) {
    logger.error('Cache invalidation error:', {
      message: error.message,
      userId
    });
  }

  next();
};

module.exports = {
  cache,
  invalidateCache,
  invalidateCacheForUser
};