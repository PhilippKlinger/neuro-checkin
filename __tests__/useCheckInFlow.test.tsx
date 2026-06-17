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
  getSettings: jest.fn().mockResolvedValue({ guidedModeEnabled: true }),
  updateSettings: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../lib/database/userChips', () => ({
  getUserChips: jest.fn().mockResolvedValue([]),
  saveUserChips: jest.fn().mockResolvedValue(undefined),
  countUserChipsByCategory: jest.fn().mockResolvedValue(0),
}));
jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
  withScope: jest.fn((cb: (scope: { setTag: jest.Mock }) => void) => cb({ setTag: jest.fn() })),
}));

import { Alert } from 'react-native';
import { insertCheckIn } from '../lib/database/checkins';
import { saveUserChips } from '../lib/database/userChips';

const mockInsertCheckIn = insertCheckIn as jest.Mock;
const mockSaveUserChips = saveUserChips as jest.Mock;
let mockAlert: jest.SpyInstance;

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
  mockAlert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

afterEach(() => {
  mockAlert.mockRestore();
});

// ---------------------------------------------------------------------------
// DraftActions — field-coupling (K-1)
// ---------------------------------------------------------------------------

describe('DraftActions — field-coupling', () => {
  it('setEnergy sets level and clears skipped flag', async () => {
    await mount();
    act(() => snapshot.actions.setEnergy(4));
    expect(snapshot.draft.energyLevel).toBe(4);
    expect(snapshot.draft.energySkipped).toBe(false);
  });

  it('skipEnergy resets level to 0 and sets skipped flag', async () => {
    await mount();
    act(() => snapshot.actions.setEnergy(3));
    act(() => snapshot.actions.skipEnergy());
    expect(snapshot.draft.energyLevel).toBe(0);
    expect(snapshot.draft.energySkipped).toBe(true);
  });

  it('setFocus sets level and clears skipped flag', async () => {
    await mount();
    act(() => snapshot.actions.setFocus(5));
    expect(snapshot.draft.focusLevel).toBe(5);
    expect(snapshot.draft.focusSkipped).toBe(false);
  });

  it('skipFocus resets level to 0 and sets skipped flag', async () => {
    await mount();
    act(() => snapshot.actions.setFocus(2));
    act(() => snapshot.actions.skipFocus());
    expect(snapshot.draft.focusLevel).toBe(0);
    expect(snapshot.draft.focusSkipped).toBe(true);
  });

  it('setFeelings sets text and clears skipped flag', async () => {
    await mount();
    act(() => snapshot.actions.setFeelings('ruhig'));
    expect(snapshot.draft.feelings).toBe('ruhig');
    expect(snapshot.draft.feelingsSkipped).toBe(false);
  });

  it('skipFeelings clears text and sets skipped flag', async () => {
    await mount();
    act(() => snapshot.actions.setFeelings('freudig'));
    act(() => snapshot.actions.skipFeelings());
    expect(snapshot.draft.feelings).toBe('');
    expect(snapshot.draft.feelingsSkipped).toBe(true);
  });

  it('setDistressLevel sets level', async () => {
    await mount();
    act(() => snapshot.actions.setDistressLevel(3));
    expect(snapshot.draft.distressLevel).toBe(3);
  });

  it('setDistressLevel(null) clears level', async () => {
    await mount();
    act(() => snapshot.actions.setDistressLevel(4));
    act(() => snapshot.actions.setDistressLevel(null));
    expect(snapshot.draft.distressLevel).toBeNull();
  });

  it('setDistressNote sets note text', async () => {
    await mount();
    act(() => snapshot.actions.setDistressNote('Stress'));
    expect(snapshot.draft.distressNote).toBe('Stress');
  });

  it('setThoughtsType sets type', async () => {
    await mount();
    act(() => snapshot.actions.setThoughtsType('burdening'));
    expect(snapshot.draft.thoughtsType).toBe('burdening');
  });

  it('setThoughtsNote sets note text', async () => {
    await mount();
    act(() => snapshot.actions.setThoughtsNote('viel los'));
    expect(snapshot.draft.thoughtsNote).toBe('viel los');
  });

  it('setSelfCare sets self care note', async () => {
    await mount();
    act(() => snapshot.actions.setSelfCare('Spaziergang'));
    expect(snapshot.draft.selfCareNote).toBe('Spaziergang');
  });

  it('setBodySignals replaces body signals', async () => {
    await mount();
    const signals = { ...EMPTY_BODY_SIGNALS, hunger: true, pain: true };
    act(() => snapshot.actions.setBodySignals(signals));
    expect(snapshot.draft.bodySignals.hunger).toBe(true);
    expect(snapshot.draft.bodySignals.pain).toBe(true);
    expect(snapshot.draft.bodySignals.thirst).toBeNull();
  });

  it('actions are independent: setEnergy does not affect focus', async () => {
    await mount();
    act(() => snapshot.actions.setFocus(2));
    act(() => snapshot.actions.setEnergy(4));
    expect(snapshot.draft.focusLevel).toBe(2);
    expect(snapshot.draft.energyLevel).toBe(4);
  });

  it('skip then set reverses the skip', async () => {
    await mount();
    act(() => snapshot.actions.skipEnergy());
    expect(snapshot.draft.energySkipped).toBe(true);
    act(() => snapshot.actions.setEnergy(1));
    expect(snapshot.draft.energySkipped).toBe(false);
    expect(snapshot.draft.energyLevel).toBe(1);
  });
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

// ---------------------------------------------------------------------------
// initial load path (S5 — all db deps mocked, no swallowed errors)
// ---------------------------------------------------------------------------

describe('initial load path', () => {
  it('mounts without logging errors', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await mount();
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('always starts fresh — never restores a draft across mount', async () => {
    // Durable-draft resume was removed: a killed/relaunched check-in starts over,
    // so a cold mount is always step 0 with an empty draft (no DB restore path).
    const r = await mount();
    expect(r.step).toBe(0);
    expect(r.draft).toEqual({ ...EMPTY_DRAFT, bodySignals: { ...EMPTY_BODY_SIGNALS } });
  });
});

// ---------------------------------------------------------------------------
// handleSave — idempotency (B3): a saved check-in must never be reported failed
// ---------------------------------------------------------------------------

describe('handleSave', () => {
  async function reachSaveAndSubmit() {
    await mount();
    for (let i = 0; i < 8; i++) {
      act(() => snapshot.handleNext()); // advance to last step (8)
    }
    await act(async () => {
      snapshot.handleNext(); // on the last step this triggers handleSave()
      await Promise.resolve();
      await Promise.resolve();
    });
  }

  it('marks the check-in done after a successful insert', async () => {
    await reachSaveAndSubmit();
    expect(mockInsertCheckIn).toHaveBeenCalledTimes(1);
    expect(snapshot.isDone).toBe(true);
    expect(mockAlert).not.toHaveBeenCalled();
  });

  it('keeps the check-in saved (done, no alert) when chip cleanup fails', async () => {
    mockSaveUserChips.mockRejectedValueOnce(new Error('chip save failed'));
    await reachSaveAndSubmit();
    expect(mockInsertCheckIn).toHaveBeenCalledTimes(1);
    expect(snapshot.isDone).toBe(true); // saved despite cleanup failure
    expect(mockAlert).not.toHaveBeenCalled(); // no misleading "failed" message
  });

  it('reports failure and does not mark done when the insert itself fails', async () => {
    mockInsertCheckIn.mockRejectedValueOnce(new Error('insert failed'));
    await reachSaveAndSubmit();
    expect(snapshot.isDone).toBe(false);
    expect(mockAlert).toHaveBeenCalledTimes(1);
  });
});
