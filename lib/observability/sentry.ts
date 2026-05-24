import * as Sentry from '@sentry/react-native';
import type { Event } from '@sentry/core';
import { SENTRY_DSN } from '../constants/config';

export const SENSITIVE_KEYS: readonly string[] = [
  'feelings',
  'thoughtsNote',
  'selfCareNote',
  'innerPart',
  'note',
  'draft',
  'bodySignals',
  'distressLevel',
  'distressNote',
  'energyLevel',
  'focusLevel',
];

export function scrubObject(value: unknown, visited: WeakSet<object> = new WeakSet()): unknown {
  if (value === null || value === undefined || typeof value !== 'object') {
    return value;
  }

  if (visited.has(value)) {
    return value;
  }
  visited.add(value);

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      value[i] = scrubObject(value[i], visited);
    }
    return value;
  }

  const obj = value as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    if ((SENSITIVE_KEYS as string[]).includes(key)) {
      obj[key] = '[scrubbed]';
    } else {
      obj[key] = scrubObject(obj[key], visited);
    }
  }
  return obj;
}

export function scrubEvent<T extends Event>(event: T): T {
  if (event.extra) {
    scrubObject(event.extra);
  }

  if (event.contexts) {
    for (const ctx of Object.values(event.contexts)) {
      if (ctx && typeof ctx === 'object') {
        scrubObject(ctx);
      }
    }
  }

  // Handle both Breadcrumb[] (v8 type) and legacy { values?: Breadcrumb[] } object shape
  const bcs = Array.isArray(event.breadcrumbs)
    ? event.breadcrumbs
    : (event.breadcrumbs as unknown as { values?: Array<{ data?: Record<string, unknown> }> })
        ?.values ?? [];
  for (const breadcrumb of bcs) {
    if (breadcrumb.data && typeof breadcrumb.data === 'object') {
      scrubObject(breadcrumb.data);
    }
  }

  if (event.user) {
    event.user.ip_address = undefined;
    event.user.email = undefined;
  }

  return event;
}

export function initSentry(dsn: string = SENTRY_DSN): void {
  Sentry.init({
    dsn,
    environment: __DEV__ ? 'development' : 'production',
    enabled: !__DEV__,
    tracesSampleRate: 0,
    beforeSend(event) {
      return scrubEvent(event);
    },
    beforeBreadcrumb(breadcrumb) {
      // Skip console + http breadcrumbs — console could contain user-entered content,
      // http breadcrumbs could expose Formspree payloads
      if (breadcrumb.category === 'console' || breadcrumb.category === 'http') return null;
      return breadcrumb;
    },
  });
}
