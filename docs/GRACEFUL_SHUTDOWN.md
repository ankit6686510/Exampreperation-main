# Graceful Shutdown Implementation Guide

## Overview
Graceful shutdown ensures that the application properly closes all connections and completes in-flight requests before terminating. This prevents data loss and ensures a clean shutdown process.

## Implementation Details

### Shutdown Signals Handled
1. **SIGTERM**: Termination signal (sent by process managers like PM2, Docker, Kubernetes)
2. **SIGINT**: Interrupt signal (Ctrl+C in terminal)
3. **UNHANDLED_REJECTION**: Unhandled promise rejections
4. **UNCAUGHT_EXCEPTION**: Uncaught exceptions

### Shutdown Process

#### 1. Signal Reception
When a shutdown signal is received, the application:
- Logs the signal type
- Stops accepting new connections
- Begins graceful shutdown sequence

#### 2. Connection Cleanup (in order)
1. **HTTP Server**: Stops accepting new requests, waits for existing requests to complete
2. **Sentry**: Flushes remaining error reports to Sentry (2-second timeout)
3. **Database**: MongoDB connections are automatically closed by Mongoose
4. **Process Exit**: Exits with appropriate code (0 for success, 1 for error)

#### 3. Timeout Protection
- **10-second timeout**: Forces shutdown if graceful shutdown takes too long
- Prevents hanging processes
- Logs forced shutdown for debugging

## Code Implementation

### Graceful Shutdown Function
```javascript
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  
  // Stop accepting new connections
  server.close(() => {
    logger.info('HTTP server closed');
    
    // Close Sentry client
    if (sentryInstance) {
      Sentry.close(2000).then(() => {
        logger.info('Sentry client closed');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });
  
  // Force shutdown after timeout
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};
```

### Signal Handlers
```javascript
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  Sentry.captureException(err);
  gracefulShutdown('UNHANDLED_REJECTION');
});
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  Sentry.captureException(err);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});
```

## Testing Graceful Shutdown

### Manual Testing

#### 1. Test SIGTERM
```bash
# Start the server
npm start

# In another terminal, find the process ID
ps aux | grep node

# Send SIGTERM signal
kill -SIGTERM <process_id>

# Check logs for graceful shutdown messages
```

#### 2. Test SIGINT (Ctrl+C)
```bash
# Start the server
npm start

# Press Ctrl+C
# Check logs for graceful shutdown messages
```

#### 3. Test with Active Requests
```bash
# Start the server
npm start

# In another terminal, make a long-running request
curl http://localhost:5000/api/some-endpoint &

# Immediately send shutdown signal
kill -SIGTERM <process_id>

# Verify request completes before shutdown
```

### Expected Log Output
```
[INFO] SIGTERM received. Starting graceful shutdown...
[INFO] HTTP server closed
[INFO] Sentry client closed
[INFO] Process exiting with code 0
```

## Production Deployment

### Docker
```dockerfile
# Dockerfile
FROM node:18-alpine

# ... other instructions ...

# Handle shutdown signals properly
STOPSIGNAL SIGTERM

CMD ["node", "server.js"]
```

### Kubernetes
```yaml
# deployment.yaml
spec:
  template:
    spec:
      terminationGracePeriodSeconds: 30
      containers:
      - name: app
        lifecycle:
          preStop:
            exec:
              command: ["/bin/sh", "-c", "sleep 5"]
```

### PM2
```json
{
  "apps": [{
    "name": "exam-planner",
    "script": "server.js",
    "kill_timeout": 10000,
    "wait_ready": true,
    "listen_timeout": 10000
  }]
}
```

## Best Practices

### 1. Always Use Graceful Shutdown
- Never use `process.exit()` directly in application code
- Always go through the graceful shutdown process
- Log all shutdown events for debugging

### 2. Set Appropriate Timeouts
- **HTTP Server**: Default is infinity, but we force shutdown after 10s
- **Sentry**: 2-second timeout to flush events
- **Database**: Mongoose handles this automatically

### 3. Handle Long-Running Operations
```javascript
// BAD - May be interrupted
app.post('/long-operation', async (req, res) => {
  await veryLongOperation();
  res.json({ success: true });
});

// GOOD - Track in-flight operations
let activeOperations = 0;

app.post('/long-operation', async (req, res) => {
  activeOperations++;
  try {
    await veryLongOperation();
    res.json({ success: true });
  } finally {
    activeOperations--;
  }
});

// In graceful shutdown
const gracefulShutdown = (signal) => {
  if (activeOperations > 0) {
    logger.info(`Waiting for ${activeOperations} operations to complete`);
  }
  // ... rest of shutdown logic
};
```

### 4. Database Connection Cleanup
Mongoose automatically closes connections, but you can add explicit cleanup:
```javascript
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  
  server.close(async () => {
    logger.info('HTTP server closed');
    
    // Close database connection
    await mongoose.connection.close();
    logger.info('Database connection closed');
    
    // Close Sentry
    if (sentryInstance) {
      await Sentry.close(2000);
      logger.info('Sentry client closed');
    }
    
    process.exit(0);
  });
};
```

## Monitoring Shutdown Events

### Log Analysis
Monitor logs for shutdown patterns:
```bash
# Count shutdown events by type
grep "graceful shutdown" logs/*.log | awk '{print $3}' | sort | uniq -c

# Find forced shutdowns (timeout)
grep "Forced shutdown" logs/*.log
```

### Sentry Alerts
Set up alerts for:
- Frequent unhandled rejections
- Uncaught exceptions
- Forced shutdowns (timeout exceeded)

## Troubleshooting

### Issue: Server Hangs on Shutdown
**Cause**: Active connections or operations not completing
**Solution**: 
1. Check for long-running requests
2. Verify database connections are closing
3. Review timeout settings

### Issue: Data Loss on Shutdown
**Cause**: Shutdown happening too quickly
**Solution**:
1. Increase timeout from 10s to 30s
2. Implement operation tracking
3. Use database transactions

### Issue: Forced Shutdown Always Triggered
**Cause**: Graceful shutdown taking too long
**Solution**:
1. Identify slow cleanup operations
2. Optimize database connection closing
3. Reduce Sentry flush timeout

## Health Checks

Implement health check endpoint for orchestrators:
```javascript
app.get('/health', (req, res) => {
  const health = {
    uptime: process.uptime(),
    status: 'OK',
    timestamp: Date.now(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  };
  
  res.status(200).json(health);
});
```

## References
- [Node.js Process Signals](https://nodejs.org/api/process.html#process_signal_events)
- [Express.js Graceful Shutdown](https://expressjs.com/en/advanced/healthcheck-graceful-shutdown.html)
- [Docker STOPSIGNAL](https://docs.docker.com/engine/reference/builder/#stopsignal)
- [Kubernetes Pod Lifecycle](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/)