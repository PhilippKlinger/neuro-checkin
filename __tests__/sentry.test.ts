jest.mock('@sentry/react-native', () => ({ init: jest.fn() }));

import type { Event } from '@sentry/core';
import { SENSITIVE_KEYS, scrubObject, scrubEvent } from '../lib/observability/sentry';

describe('scrubObject', () => {
  it('replaces a sensitive top-level key with [scrubbed]', () => {
    const obj = { feelings: 'anxious', name: 'test' };
    const result = scrubObject(obj) as Record<string, unknown>;
    expect(result.feelings).toBe('[scrubbed]');
    expect(result.name).toBe('test');
  });

  it('recursively scrubs sensitive keys in nested objects', () => {
    const obj = { a: { b: { feelings: 'sad', safe: true } } };
    const result = scrubObject(obj) as { a: { b: { feelings: string; safe: boolean } } };
    expect(result.a.b.feelings).toBe('[scrubbed]');
    expect(result.a.b.safe).toBe(true);
  });

  it('scrubs sensitive keys in arrays of objects', () => {
    const obj = { items: [{ feelings: 'happy' }, { safe: 'ok' }] };
    const result = scrubObject(obj) as { items: Array<Record<string, unknown>> };
    expect(result.items[0].feelings).toBe('[scrubbed]');
    expect(result.items[1].safe).toBe('ok');
  });

  it('does not stack overflow with circular references', () => {
    const obj: Record<string, unknown> = { safe: 'value' };
    obj.self = obj;
    expect(() => scrubObject(obj)).not.toThrow();
  });

  it('leaves non-sensitive keys untouched', () => {
    const obj = { screen: 'HomeScreen', count: 42 };
    const result = scrubObject(obj) as Record<string, unknown>;
    expect(result.screen).toBe('HomeScreen');
    expect(result.count).toBe(42);
  });

  it('returns primitive string value unchanged', () => {
    expect(scrubObject('hello')).toBe('hello');
  });

  it('returns primitive number value unchanged', () => {
    expect(scrubObject(42)).toBe(42);
  });

  it('returns null unchanged', () => {
    expect(scrubObject(null)).toBe(null);
  });

  it('returns undefined unchanged', () => {
    expect(scrubObject(undefined)).toBe(undefined);
  });
});

describe('scrubEvent', () => {
  it('scrubs sensitive keys in event.extra', () => {
    const event: Event = {
      extra: { feelings: 'scared', componentName: 'StepFeelings' },
    };
    const result = scrubEvent(event);
    expect(result.extra!.feelings).toBe('[scrubbed]');
    expect(result.extra!.componentName).toBe('StepFeelings');
  });

  it('scrubs sensitive keys in event.contexts values', () => {
    const event: Event = {
      contexts: { app: { feelings: 'tense', version: '1.5.0' } },
    };
    const result = scrubEvent(event);
    expect((result.contexts!.app as Record<string, unknown>).feelings).toBe('[scrubbed]');
    expect((result.contexts!.app as Record<string, unknown>).version).toBe('1.5.0');
  });

  it('scrubs sensitive keys in breadcrumb data', () => {
    const event: Event = {
      breadcrumbs: [
        { data: { feelings: 'overwhelmed', action: 'press' } },
        { data: { safe: 'log' } },
      ],
    };
    const result = scrubEvent(event);
    expect((result.breadcrumbs as typeof event.breadcrumbs)![0].data!.feelings).toBe('[scrubbed]');
    expect((result.breadcrumbs as typeof event.breadcrumbs)![0].data!.action).toBe('press');
    expect((result.breadcrumbs as typeof event.breadcrumbs)![1].data!.safe).toBe('log');
  });

  it('removes user ip_address and email', () => {
    const event: Event = {
      user: { id: 'device-123', ip_address: '192.168.1.1', email: 'user@example.com' },
    };
    const result = scrubEvent(event);
    expect(result.user!.ip_address).toBeUndefined();
    expect(result.user!.email).toBeUndefined();
    expect(result.user!.id).toBe('device-123');
  });

  it('DSE-Vertrag: no sensitive values survive in a realistic crash event', () => {
    const event: Event = {
      extra: {
        componentState: {
          draft: {
            feelings: ['anxious', 'overwhelmed'],
            thoughtsNote: 'private thought',
            selfCareNote: 'some care note',
            innerPart: 'inner manager',
            distressNote: 'high distress level',
          },
        },
      },
      contexts: {
        checkinContext: {
          energyLevel: 2,
          focusLevel: 3,
          bodySignals: ['headache', 'tight chest'],
        },
      },
      breadcrumbs: [{ data: { distressLevel: 9, feelings: 'terrified' } }],
      user: { ip_address: '10.0.0.1' },
    };

    const scrubbed = scrubEvent(event);
    const json = JSON.stringify(scrubbed);

    const sensitiveValues = [
      'anxious',
      'overwhelmed',
      'private thought',
      'some care note',
      'inner manager',
      'high distress level',
      'terrified',
      '10.0.0.1',
    ];
    for (const value of sensitiveValues) {
      expect(json).not.toContain(value);
    }

    for (const key of SENSITIVE_KEYS) {
      // Numeric values (energyLevel: 2, focusLevel: 3, distressLevel: 9)
      // get scrubbed to '[scrubbed]' — confirm no raw numeric value for those keys survives
      expect(json).not.toMatch(new RegExp(`"${key}":\\s*[^"\\[\\{]`));
    }
  });
});

// ---------------------------------------------------------------------------
// scrubObject — depth and size limits (M-04)
// ---------------------------------------------------------------------------

describe('scrubObject — depth/size limits', () => {
  it('truncates objects deeper than MAX_SCRUB_DEPTH', () => {
    let deep: Record<string, unknown> = { value: 'leaf' };
    for (let i = 0; i < 10; i++) {
      deep = { nested: deep };
    }
    const result = scrubObject(deep) as Record<string, unknown>;
    // Walk down — at some point we should hit the marker
    let current: unknown = result;
    let depth = 0;
    while (current && typeof current === 'object' && !Array.isArray(current)) {
      const obj = current as Record<string, unknown>;
      if (obj['nested'] === '[max depth]') break;
      current = obj['nested'];
      depth++;
    }
    expect(depth).toBeLessThanOrEqual(7);
  });

  it('truncates arrays longer than MAX_ARRAY_ITEMS', () => {
    const bigArray = Array.from({ length: 100 }, (_, i) => ({ idx: i }));
    const result = scrubObject(bigArray) as unknown[];
    expect(result.length).toBeLessThanOrEqual(51);
    expect(result[result.length - 1]).toBe('[truncated]');
  });

  it('truncates objects with more than MAX_OBJECT_KEYS keys', () => {
    const bigObj: Record<string, unknown> = {};
    for (let i = 0; i < 100; i++) {
      bigObj[`key${i}`] = `value${i}`;
    }
    const result = scrubObject(bigObj) as Record<string, unknown>;
    const keys = Object.keys(result);
    expect(keys.length).toBeLessThanOrEqual(51);
    expect(result['[truncated]']).toBe(true);
  });
});
