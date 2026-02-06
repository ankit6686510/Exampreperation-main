const Sentry = require('@sentry/node');
const { nodeProfilingIntegration } = require('@sentry/profiling-node');

const initSentry = (app) => {
  if (!process.env.SENTRY_DSN) {
    console.warn('SENTRY_DSN not configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app }),
      nodeProfilingIntegration(),
    ],
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    beforeSend(event, hint) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Sentry Event:', event);
        console.error('Original Error:', hint.originalException);
      }
      return event;
    },
    ignoreErrors: [
      'NetworkError',
      'Non-Error promise rejection captured',
      /^Timeout/,
    ],
  });

  return Sentry;
};

module.exports = { initSentry, Sentry };