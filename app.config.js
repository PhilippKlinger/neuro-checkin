// Dynamic config — reads secrets from environment variables at build time.
// Secrets are injected via EAS Secrets (eas secret:create) or a local .env file.
// The static parts of the config live in app.json and are merged here.

/** @type {import('@expo/config').ConfigContext} */
const withAdiRegistration = require('./plugins/withAdiRegistration');

module.exports = ({ config }) => {
  const updatedConfig = {
    ...config,
    extra: {
      ...config.extra,
      sentryDsn: process.env.SENTRY_DSN ?? '',
      formspreeUrl: process.env.FORMSPREE_URL ?? '',
    },
  };
  return withAdiRegistration(updatedConfig);
};
