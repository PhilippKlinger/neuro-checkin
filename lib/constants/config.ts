import Constants from 'expo-constants';

// Read at runtime from app.config.js extra field.
// Values are injected at build time via EAS Secrets / local .env.
const extra = Constants.expoConfig?.extra ?? {};

export const SENTRY_DSN: string = extra.sentryDsn ?? '';
export const FORMSPREE_URL: string = extra.formspreeUrl ?? '';
