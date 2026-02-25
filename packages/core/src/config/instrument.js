// Import with `import * as Sentry from "@sentry/node"` if you are using ESM
const Sentry = require('@sentry/node');

if (process.env.SENTRY_DSN) {
  const { nodeProfilingIntegration } = require('@sentry/profiling-node');
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [nodeProfilingIntegration()],
    tracesSampleRate: 1.0,
    environment: process.env.NODE_ENV,
    profilesSampleRate: 1.0,
  });
}
