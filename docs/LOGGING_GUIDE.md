# Logging Guide

## Overview
We've implemented structured logging using Winston to replace all `console.*` calls throughout the application. This provides better error tracking, log management, and production monitoring capabilities.

## Logger Configuration

### Location
`config/logger.js`

### Log Levels
```javascript
{
  error: 0,   // Critical errors that need immediate attention
  warn: 1,    // Warning messages for potential issues
  info: 2,    // General informational messages
  http: 3,    // HTTP request/response logs
  debug: 4    // Detailed debugging information
}
```

### Environment-Based Logging
- **Development**: Logs all levels (debug and above) to console with colors
- **Production**: Logs warn and above, with file rotation

## Log Transports

### Console Transport
- Always enabled
- Colorized output in development
- JSON format in production

### File Transports (Production Only)
1. **Error Log** (`logs/error-YYYY-MM-DD.log`)
   - Only error-level logs
   - 20MB max file size
   - 14 days retention

2. **Combined Log** (`logs/combined-YYYY-MM-DD.log`)
   - All log levels
   - 20MB max file size
   - 14 days retention

3. **HTTP Log** (`logs/http-YYYY-MM-DD.log`)
   - HTTP request/response logs
   - 20MB max file size
   - 7 days retention

## Usage Examples

### Basic Logging

```javascript
const logger = require('../config/logger');

// Error logging
logger.error('Database connection failed', {
  error: err.message,
  stack: err.stack
});

// Warning
logger.warn('Rate limit approaching threshold', {
  ip: req.ip,
  requestCount: 95
});

// Info
logger.info('User registered successfully', {
  userId: user._id,
  email: user.email
});

// HTTP (handled by Morgan middleware)
logger.http('GET /api/users 200 45ms');

// Debug
logger.debug('Cache hit', {
  key: 'user:123',
  ttl: 3600
});
```

### Structured Error Logging

```javascript
// Helper method for errors
logger.logError(error, {
  method: req.method,
  url: req.url,
  userId: req.user?.id,
  ip: req.ip
});

// Example in controller
try {
  // ... operation
} catch (error) {
  logger.logError(error, {
    context: 'createResource',
    userId: req.user.id,
    resourceData: req.body
  });
  res.status(500).json({ success: false, message: 'Server error' });
}
```

### Authentication Logging

```javascript
// Helper method for auth events
logger.logAuth('login', userId, true, {
  ip: req.ip,
  userAgent: req.get('user-agent')
});

// Login success
logger.logAuth('login', user._id, true, {
  ip: req.ip,
  timestamp: new Date()
});

// Login failure
logger.logAuth('login', null, false, {
  email: req.body.email,
  ip: req.ip,
  reason: 'Invalid credentials'
});

// Password change
logger.logAuth('password_change', user._id, true, {
  ip: req.ip
});
```

### Security Event Logging

```javascript
// Helper method for security events
logger.logSecurity('suspicious_activity', 'high', {
  ip: req.ip,
  userId: req.user?.id,
  action: 'multiple_failed_logins'
});

// Examples
logger.logSecurity('rate_limit_exceeded', 'medium', {
  ip: req.ip,
  endpoint: req.url
});

logger.logSecurity('invalid_token', 'high', {
  token: token.substring(0, 10) + '...',
  ip: req.ip
});

logger.logSecurity('unauthorized_access', 'high', {
  userId: req.user?.id,
  resource: req.params.id,
  action: req.method
});
```

### HTTP Request Logging

```javascript
// Automatically handled by Morgan middleware
// Custom tokens available:
// - :user-id - Current user ID or 'anonymous'
// - :response-time-ms - Response time in milliseconds

// Example log output:
// GET /api/resources 200 45.234 ms - 1234
// POST /api/auth/login 401 12.456 ms - anonymous
```

### Database Query Logging

```javascript
// Helper method for database queries
const startTime = Date.now();
const result = await User.find(query);
const duration = Date.now() - startTime;

logger.logDatabaseQuery(query, duration, {
  collection: 'users',
  resultCount: result.length
});
```

### Request Context Logging

```javascript
// Helper method for request logging
logger.logRequest(req, {
  userId: req.user?.id,
  responseTime: Date.now() - req.startTime,
  statusCode: res.statusCode
});
```

## Migration from console.*

### Before (Insecure)
```javascript
try {
  // ... operation
} catch (error) {
  console.error('Create resource error:', error);
  res.status(500).json({ success: false, message: 'Server error' });
}
```

### After (Secure)
```javascript
try {
  // ... operation
} catch (error) {
  logger.error('Create resource error:', {
    error: error.message,
    stack: error.stack,
    context: 'createResource',
    userId: req.user?.id
  });
  res.status(500).json({ success: false, message: 'Server error' });
}
```

## Log Format

### Development Console Output
```
2024-01-15 10:30:45 [info]: Server started successfully {
  "port": 5000,
  "environment": "development",
  "nodeVersion": "v18.17.0"
}
```

### Production JSON Output
```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "error",
  "message": "Database connection failed",
  "error": "Connection timeout",
  "stack": "Error: Connection timeout\n    at ...",
  "context": "connectDB"
}
```

## Best Practices

### 1. Use Appropriate Log Levels
```javascript
// ❌ Wrong
logger.info('Critical database error!');

// ✅ Correct
logger.error('Database connection failed', { error: err.message });
```

### 2. Include Context
```javascript
// ❌ Wrong
logger.error('Error occurred');

// ✅ Correct
logger.error('Failed to create resource', {
  userId: req.user.id,
  resourceType: req.body.type,
  error: err.message
});
```

### 3. Don't Log Sensitive Data
```javascript
// ❌ Wrong - Logs password
logger.info('User login attempt', {
  email: req.body.email,
  password: req.body.password
});

// ✅ Correct
logger.info('User login attempt', {
  email: req.body.email,
  ip: req.ip
});
```

### 4. Use Helper Methods
```javascript
// ❌ Verbose
logger.error({
  message: error.message,
  stack: error.stack,
  method: req.method,
  url: req.url
});

// ✅ Concise
logger.logError(error, {
  method: req.method,
  url: req.url
});
```

### 5. Log Performance Metrics
```javascript
const startTime = Date.now();
const result = await expensiveOperation();
const duration = Date.now() - startTime;

logger.info('Operation completed', {
  operation: 'expensiveOperation',
  duration: `${duration}ms`,
  resultCount: result.length
});
```

## Environment Variables

```bash
# Log level (error, warn, info, http, debug)
LOG_LEVEL=info

# Enable file logging in development
ENABLE_FILE_LOGGING=true

# Node environment
NODE_ENV=production
```

## Log Analysis

### View Recent Errors
```bash
tail -f logs/error-$(date +%Y-%m-%d).log | jq
```

### Search for Specific User
```bash
grep "userId.*123" logs/combined-$(date +%Y-%m-%d).log | jq
```

### Count Errors by Type
```bash
cat logs/error-*.log | jq -r '.message' | sort | uniq -c | sort -rn
```

### Monitor HTTP Requests
```bash
tail -f logs/http-$(date +%Y-%m-%d).log
```

## Integration with Monitoring Tools

### Sentry Integration (Future)
```javascript
const Sentry = require('@sentry/node');

logger.error('Critical error', {
  error: err.message,
  stack: err.stack
});

// Also send to Sentry
Sentry.captureException(err);
```

### CloudWatch Integration (Future)
```javascript
const CloudWatchTransport = require('winston-cloudwatch');

logger.add(new CloudWatchTransport({
  logGroupName: 'exam-planner-api',
  logStreamName: 'production-errors'
}));
```

## Troubleshooting

### Issue: Logs not appearing in files
**Solution:** Check `NODE_ENV` or set `ENABLE_FILE_LOGGING=true`

### Issue: Too many log files
**Solution:** Adjust retention in `config/logger.js`:
```javascript
maxFiles: '7d'  // Keep only 7 days
```

### Issue: Large log files
**Solution:** Reduce max file size:
```javascript
maxSize: '10m'  // 10MB instead of 20MB
```

### Issue: Missing context in logs
**Solution:** Always include relevant context:
```javascript
logger.error('Operation failed', {
  userId: req.user?.id,
  operation: 'createResource',
  error: err.message
});
```

## Security Considerations

### ✅ DO
- Log authentication attempts (success and failure)
- Log authorization failures
- Log rate limit violations
- Log suspicious activities
- Include IP addresses and user agents
- Log security-relevant configuration changes

### ❌ DON'T
- Log passwords or tokens
- Log credit card numbers
- Log personal identification numbers
- Log API keys or secrets
- Log full request bodies (may contain sensitive data)
- Log session IDs or cookies

## Performance Impact

- **Development**: Minimal impact (console only)
- **Production**: ~1-2ms per log entry with file rotation
- **Recommendation**: Use appropriate log levels to reduce volume

## Migration Checklist

- [x] Install Winston and dependencies
- [x] Create logger configuration
- [x] Create request logger middleware
- [x] Replace all console.* calls in controllers
- [x] Add logger to server.js
- [x] Update error handlers
- [x] Add helper methods for structured logging
- [x] Create logs directory in .gitignore
- [x] Document logging practices
- [ ] Set up log rotation monitoring
- [ ] Integrate with error tracking service (Sentry)
- [ ] Set up log aggregation (CloudWatch/ELK)

## Files Modified

1. `config/logger.js` - Logger configuration
2. `middleware/requestLogger.js` - HTTP request logging
3. `server.js` - Server startup and error handling
4. `controllers/*.js` - All 14 controller files
5. `scripts/replace-console-logs.js` - Migration script

## Next Steps

1. **Monitor logs** in production for patterns
2. **Set up alerts** for error spikes
3. **Integrate Sentry** for error tracking
4. **Add log aggregation** for centralized monitoring
5. **Create dashboards** for key metrics