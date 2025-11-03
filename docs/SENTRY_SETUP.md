# Sentry Error Tracking Setup Guide

## Overview
Sentry provides real-time error tracking and monitoring for production applications. This guide explains how to set up and use Sentry in the exam preparation platform.

## Features Implemented
- **Automatic Error Capture**: All unhandled errors are automatically sent to Sentry
- **Request Context**: Errors include HTTP request details (method, URL, body, query params)
- **User Context**: Authenticated user information is attached to error reports
- **Performance Monitoring**: Request tracing and profiling enabled
- **Environment Separation**: Different error tracking for development vs production

## Setup Instructions

### 1. Create Sentry Account
1. Go to [sentry.io](https://sentry.io/) and create a free account
2. Create a new project and select "Node.js" as the platform
3. Copy your DSN (Data Source Name) from the project settings

### 2. Configure Environment Variables
Add to your `.env` file:
```bash
SENTRY_DSN=https://your-public-key@sentry.io/your-project-id
```

### 3. Verify Installation
The application will log a warning if Sentry is not configured:
```
SENTRY_DSN not configured. Error tracking disabled.
```

## Configuration Details

### Sample Rates
- **Development**: 100% of errors and traces captured
- **Production**: 10% of traces captured (to reduce quota usage)

### Ignored Errors
The following error types are automatically filtered:
- NetworkError
- Non-Error promise rejection captured
- Timeout errors

### Error Context
Each error report includes:
- **User Info**: User ID and email (if authenticated)
- **Request Details**: HTTP method, URL, headers
- **Request Data**: Body, query parameters, route params
- **Tags**: Endpoint, HTTP method
- **Environment**: development/production

## Usage Examples

### Manual Error Capture
```javascript
const { Sentry } = require('./config/sentry');

try {
  // Your code
} catch (error) {
  Sentry.captureException(error, {
    tags: { feature: 'authentication' },
    extra: { customData: 'value' }
  });
}
```

### Capture Messages
```javascript
Sentry.captureMessage('Important event occurred', {
  level: 'info',
  tags: { feature: 'daily-goals' }
});
```

### Add Breadcrumbs
```javascript
Sentry.addBreadcrumb({
  category: 'auth',
  message: 'User login attempt',
  level: 'info'
});
```

## Monitoring Dashboard

### Key Metrics to Watch
1. **Error Rate**: Percentage of requests resulting in errors
2. **Response Time**: P50, P75, P95, P99 percentiles
3. **Most Common Errors**: Identify patterns in error types
4. **Affected Users**: Track how many users experience errors

### Setting Up Alerts
1. Go to Alerts in Sentry dashboard
2. Create alert rules for:
   - Error rate exceeds threshold
   - New error types appear
   - Performance degradation

## Best Practices

### 1. Don't Log Sensitive Data
Sentry automatically filters common sensitive fields, but be cautious:
```javascript
// BAD - Don't send passwords
Sentry.captureException(error, {
  extra: { password: user.password }
});

// GOOD - Only send safe data
Sentry.captureException(error, {
  extra: { userId: user.id, action: 'login' }
});
```

### 2. Use Appropriate Log Levels
- `error`: Actual errors that need attention
- `warning`: Potential issues
- `info`: Important events
- `debug`: Detailed debugging info

### 3. Add Context
Always add relevant context to help debug:
```javascript
Sentry.captureException(error, {
  tags: {
    feature: 'study-sessions',
    action: 'create'
  },
  extra: {
    sessionData: sanitizedData
  }
});
```

### 4. Monitor Performance
Use Sentry's performance monitoring to identify slow endpoints:
```javascript
const transaction = Sentry.startTransaction({
  op: 'http.server',
  name: 'POST /api/study-sessions'
});

// Your code here

transaction.finish();
```

## Troubleshooting

### Errors Not Appearing in Sentry
1. Verify `SENTRY_DSN` is set correctly
2. Check network connectivity to sentry.io
3. Ensure errors are actually being thrown
4. Check Sentry quota limits

### Too Many Events
1. Adjust sample rates in `config/sentry.js`
2. Add more error types to `ignoreErrors`
3. Upgrade Sentry plan if needed

### Missing Context
1. Ensure middleware is properly ordered in `server.js`
2. Verify user authentication middleware runs before Sentry
3. Check that request data is being passed correctly

## Cost Optimization

### Free Tier Limits
- 5,000 errors/month
- 10,000 performance units/month

### Reducing Usage
1. Lower `tracesSampleRate` in production
2. Add common errors to `ignoreErrors`
3. Use `beforeSend` to filter events
4. Implement client-side filtering

## Security Considerations

### Data Scrubbing
Sentry automatically scrubs:
- Passwords
- Credit card numbers
- API keys
- Session tokens

### Custom Scrubbing
Add custom scrubbing in `config/sentry.js`:
```javascript
beforeSend(event) {
  if (event.request?.data) {
    delete event.request.data.secretField;
  }
  return event;
}
```

## Integration with Logging

Sentry complements Winston logging:
- **Winston**: Detailed logs for debugging and auditing
- **Sentry**: Error aggregation and alerting

Both systems work together to provide comprehensive monitoring.

## Next Steps
1. Set up Sentry alerts for critical errors
2. Configure performance monitoring thresholds
3. Create custom dashboards for key metrics
4. Integrate with team communication tools (Slack, Discord)