import React from 'react';
import { act, create } from 'react-test-renderer';
import { useQuickCheckInFlow } from '../lib/hooks/useQuickCheckInFlow';

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
}));
jest.mock('../lib/database/settings', () => ({
  getSettings: jest
    .fn()
    .mockResolvedValue({ guidedModeEnabled: true, guidedToggleIntroduced: false }),
  updateSettings: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@sentry/react-native', () => ({ captureException: jest.fn() }));
jest.mock('react-native/Libraries/Alert/Alert', () => ({ alert: jest.fn() }));

// ---------------------------------------------------------------------------
// Test harness
// ---------------------------------------------------------------------------

const mockDb = {} as Parameters<typeof useQuickCheckInFlow>[0];
const onExitFlow = jest.fn();

let snapshot: ReturnType<typeof useQuickCheckInFlow>;

function TestHook() {
  snapshot = useQuickCheckInFlow(mockDb, onExitFlow);
  return null;
}

async function mount() {
  await act(async () => {
    create(<TestHook />);
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
  it('starts at step 0', async () => {
    const r = await mount();
    expect(r.step).toBe(0);
  });

  it('draft starts with all zero/false/empty values', async () => {
    const r = await mount();
    expect(r.draft.energyLevel).toBe(0);
    expect(r.draft.energySkipped).toBe(false);
    expect(r.draft.focusLevel).toBe(0);
    expect(r.draft.focusSkipped).toBe(false);
    expect(r.draft.feelings).toBe('');
    expect(r.draft.feelingsSkipped).toBe(false);
  });

  it('isDone and isSaving are false', async () => {
    const r = await mount();
    expect(r.isDone).toBe(false);
    expect(r.isSaving).toBe(false);
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
  it('advances from step 0 to 1', async () => {
    await mount();
    act(() => {
      snapshot.setDraft({ ...snapshot.draft, energyLevel: 3 }); // unblock step 0
    });
    act(() => snapshot.handleNext());
    expect(snapshot.step).toBe(1);
  });

  it('reaches last step (2) after two advances', async () => {
    await mount();
    act(() => snapshot.handleNext()); // 0→1 (ignoring block for direct call)
    act(() => snapshot.handleNext()); // 1→2
    expect(snapshot.step).toBe(2);
    expect(snapshot.isLastStep).toBe(true);
  });
});

describe('handleBack', () => {
  it('decrements step from 1 to 0', async () => {
    await mount();
    act(() => snapshot.handleNext()); // 0→1
    act(() => snapshot.handleBack()); // 1→0
    expect(snapshot.step).toBe(0);
  });

  it('calls onExitFlow when back is pressed on step 0', async () => {
    await mount();
    expect(snapshot.step).toBe(0);
    act(() => snapshot.handleBack());
    expect(onExitFlow).toHaveBeenCalledTimes(1);
    expect(snapshot.step).toBe(0); // step unchanged
  });

  it('does not call onExitFlow when back from step 1', async () => {
    await mount();
    act(() => snapshot.handleNext()); // 0→1
    act(() => snapshot.handleBack()); // 1→0
    expect(onExitFlow).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// handleReset
// ---------------------------------------------------------------------------

describe('handleReset', () => {
  it('resets step, draft and isDone', async () => {
    await mount();
    act(() => snapshot.handleNext()); // step → 1
    act(() => {
      snapshot.setDraft({ ...snapshot.draft, energyLevel: 4 });
    });
    act(() => snapshot.handleReset());
    expect(snapshot.step).toBe(0);
    expect(snapshot.draft.energyLevel).toBe(0);
    expect(snapshot.isDone).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isStepBlocked (derived) — note: step offsets differ from full flow
// ---------------------------------------------------------------------------

describe('isStepBlocked', () => {
  it('is true on step 0 when energy unset and not skipped', async () => {
    const r = await mount();
    expect(r.isStepBlocked).toBe(true); // step 0, energyLevel=0
  });

  it('is false on step 0 when energy is set', async () => {
    await mount();
    act(() => {
      snapshot.setDraft({ ...snapshot.draft, energyLevel: 2 });
    });
    expect(snapshot.isStepBlocked).toBe(false);
  });

  it('is false on step 0 when energy is skipped', async () => {
    await mount();
    act(() => {
      snapshot.setDraft({ ...snapshot.draft, energySkipped: true });
    });
    expect(snapshot.isStepBlocked).toBe(false);
  });

  it('is true on step 1 when focus unset and not skipped', async () => {
    await mount();
    act(() => snapshot.handleNext()); // step → 1
    expect(snapshot.isStepBlocked).toBe(true); // focusLevel=0
  });

  it('is false on step 1 when focus is set', async () => {
    await mount();
    act(() => snapshot.handleNext()); // step → 1
    act(() => {
      snapshot.setDraft({ ...snapshot.draft, focusLevel: 5 });
    });
    expect(snapshot.isStepBlocked).toBe(false);
  });

  it('is never blocked on step 2 (feelings are optional)', async () => {
    await mount();
    act(() => snapshot.handleNext()); // 0→1
    act(() => snapshot.handleNext()); // 1→2
    expect(snapshot.isStepBlocked).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isNextDisabled
// ---------------------------------------------------------------------------

describe('isNextDisabled', () => {
  it('is true on step 0 (energy unset)', async () => {
    const r = await mount();
    expect(r.isNextDisabled).toBe(true);
  });

  it('is false on step 2 (no blocking)', async () => {
    await mount();
    act(() => snapshot.handleNext());
    act(() => snapshot.handleNext());
    expect(snapshot.isNextDisabled).toBe(false);
  });
});
