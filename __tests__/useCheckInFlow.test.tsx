import React from 'react';
import { act, create } from 'react-test-renderer';
import { useCheckInFlow } from '../lib/hooks/useCheckInFlow';
import { EMPTY_BODY_SIGNALS, EMPTY_DRAFT } from '../lib/types/checkin';

// useFocusEffect → run like useEffect once on mount
jest.mock('expo-router', () => {
  const R = require('react');
  return {
    useFocusEffect: (cb: () => (() => void) | void) => {
      R.useEffect(cb, []);
    },
  };
});

jest.mock('../lib/database/checkins', () => ({
  insertCheckIn: jest.fn().mockResolvedValue(undefined),
  countCheckIns: jest.fn().mockResolvedValue(0),
}));
jest.mock('../lib/database/settings', () => ({
  getSettings: jest
    .fn()
    .mockResolvedValue({ guidedModeEnabled: true, guidedToggleIntroduced: false }),
  updateSettings: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../lib/database/userChips', () => ({
  getUserChips: jest.fn().mockResolvedValue([]),
  saveUserChips: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@sentry/react-native', () => ({ captureException: jest.fn() }));

// Patch Alert without wiping react-native (only override what we need)
jest.mock('react-native/Libraries/Alert/Alert', () => ({ alert: jest.fn() }));

// ---------------------------------------------------------------------------
// Test harness
// ---------------------------------------------------------------------------

const mockDb = {} as Parameters<typeof useCheckInFlow>[0];

let snapshot: ReturnType<typeof useCheckInFlow>;

function TestHook() {
  snapshot = useCheckInFlow(mockDb);
  return null;
}

async function mount() {
  await act(async () => {
    create(<TestHook />);
    // flush microtasks so async useFocusEffect callbacks settle
    await Promise.resolve();
    await Promise.resolve();
  });
  return snapshot;
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe('initial state', () => {
  it('starts at step 0 with empty draft', async () => {
    const r = await mount();
    expect(r.step).toBe(0);
    expect(r.draft).toEqual({ ...EMPTY_DRAFT, bodySignals: { ...EMPTY_BODY_SIGNALS } });
  });

  it('isDone and isSaving and wasReset are false', async () => {
    const r = await mount();
    expect(r.isDone).toBe(false);
    expect(r.isSaving).toBe(false);
    expect(r.wasReset).toBe(false);
  });

  it('canGoBack is false on step 0', async () => {
    const r = await mount();
    expect(r.canGoBack).toBe(false);
  });

  it('isLastStep is false on step 0', async () => {
    const r = await mount();
    expect(r.isLastStep).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// handleNext / handleBack navigation
// ---------------------------------------------------------------------------

describe('handleNext', () => {
  it('advances from step 0 to step 1', async () => {
    const r = await mount();
    act(() => r.handleNext());
    expect(snapshot.step).toBe(1);
  });

  it('canGoBack becomes true after first advance', async () => {
    const r = await mount();
    act(() => r.handleNext());
    expect(snapshot.canGoBack).toBe(true);
  });

  it('advances through all steps to the last', async () => {
    await mount();
    for (let i = 0; i < 8; i++) {
      act(() => snapshot.handleNext());
    }
    expect(snapshot.step).toBe(8);
    expect(snapshot.isLastStep).toBe(true);
  });

  it('clears wasReset on first handleNext', async () => {
    await mount();
    // Manually set wasReset via setDraft trick — use handleReset then simulate it
    act(() => {
      snapshot.setWasReset(true);
    });
    expect(snapshot.wasReset).toBe(true);
    act(() => snapshot.handleNext());
    expect(snapshot.wasReset).toBe(false);
  });
});

describe('handleBack', () => {
  it('decrements step when canGoBack', async () => {
    await mount();
    act(() => snapshot.handleNext()); // step → 1
    act(() => snapshot.handleBack()); // step → 0
    expect(snapshot.step).toBe(0);
  });

  it('does not go below step 0', async () => {
    await mount();
    act(() => snapshot.handleBack());
    expect(snapshot.step).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// handleReset
// ---------------------------------------------------------------------------

describe('handleReset', () => {
  it('resets step, draft and isDone to initial values', async () => {
    await mount();
    act(() => snapshot.handleNext()); // step → 1
    act(() => {
      snapshot.setDraft({ ...snapshot.draft, energyLevel: 4 });
    });
    act(() => snapshot.handleReset());
    expect(snapshot.step).toBe(0);
    expect(snapshot.draft.energyLevel).toBe(0);
    expect(snapshot.isDone).toBe(false);
    expect(snapshot.wasReset).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isStepBlocked (derived)
// ---------------------------------------------------------------------------

describe('isStepBlocked', () => {
  it('is false on step 0', async () => {
    await mount();
    expect(snapshot.isStepBlocked).toBe(false);
  });

  it('is true on step 1 when energy is unset and not skipped', async () => {
    await mount();
    act(() => snapshot.handleNext()); // step → 1, energyLevel=0, skipped=false
    expect(snapshot.isStepBlocked).toBe(true);
  });

  it('is false on step 1 when energy is set', async () => {
    await mount();
    act(() => {
      snapshot.setDraft({ ...snapshot.draft, energyLevel: 3, energySkipped: false });
    });
    act(() => snapshot.handleNext()); // step → 1
    expect(snapshot.isStepBlocked).toBe(false);
  });

  it('is false on step 1 when skipped', async () => {
    await mount();
    act(() => {
      snapshot.setDraft({ ...snapshot.draft, energyLevel: 0, energySkipped: true });
    });
    act(() => snapshot.handleNext()); // step → 1
    expect(snapshot.isStepBlocked).toBe(false);
  });

  it('is true on step 2 when focus unset and not skipped', async () => {
    await mount();
    act(() => snapshot.handleNext()); // step 0→1
    act(() => {
      snapshot.setDraft({ ...snapshot.draft, energyLevel: 3 }); // unblock step 1
    });
    act(() => snapshot.handleNext()); // step 1→2, focusLevel=0, skipped=false
    expect(snapshot.isStepBlocked).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// isNextDisabled
// ---------------------------------------------------------------------------

describe('isNextDisabled', () => {
  it('is false on step 0', async () => {
    const r = await mount();
    expect(r.isNextDisabled).toBe(false);
  });

  it('is true on step 1 when step is blocked', async () => {
    await mount();
    act(() => snapshot.handleNext()); // step → 1, blocked
    expect(snapshot.isNextDisabled).toBe(true);
  });
});
