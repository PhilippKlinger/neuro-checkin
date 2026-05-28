import { useState, useRef, useCallback, type Dispatch, type SetStateAction } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import type { SQLiteDatabase } from 'expo-sqlite';
import { insertCheckIn } from '../database/checkins';
import { getSettings, updateSettings } from '../database/settings';
import { getUserChips, countUserChipsByCategory } from '../database/userChips';
import { MAX_USER_CHIPS_PER_CATEGORY } from '../constants/userChips';
import { FEELING_CHIPS } from '../constants/chips';
import { EMPTY_BODY_SIGNALS } from '../types/checkin';
import * as Sentry from '@sentry/react-native';

const TOTAL_STEPS = 3;

export interface QuickCheckInDraft {
  energyLevel: number;
  energySkipped: boolean;
  focusLevel: number;
  focusSkipped: boolean;
  feelings: string;
  feelingsSkipped: boolean;
}

const EMPTY_QUICK_DRAFT: QuickCheckInDraft = {
  energyLevel: 0,
  energySkipped: false,
  focusLevel: 0,
  focusSkipped: false,
  feelings: '',
  feelingsSkipped: false,
};

export interface QuickDraftActions {
  setEnergy: (value: number) => void;
  skipEnergy: () => void;
  setFocus: (value: number) => void;
  skipFocus: () => void;
  setFeelings: (value: string) => void;
  skipFeelings: () => void;
}

export interface UseQuickCheckInFlowResult {
  step: number;
  draft: QuickCheckInDraft;
  actions: QuickDraftActions;
  isSaving: boolean;
  isDone: boolean;
  guidedMode: boolean;
  showToggleIntroHint: boolean;
  isLastStep: boolean;
  isStepBlocked: boolean;
  isNextDisabled: boolean;
  /** User-defined feeling chips, loaded on focus. */
  userFeelingChips: string[];
  /** True when feeling category is at MAX_USER_CHIPS_PER_CATEGORY. */
  feelingChipsAtLimit: boolean;
  /** @deprecated Use actions instead */
  setDraft: Dispatch<SetStateAction<QuickCheckInDraft>>;
  handleGuidedToggle: (value: boolean) => Promise<void>;
  handleNext: () => void;
  handleBack: () => void;
  handleReset: () => void;
}

export function useQuickCheckInFlow(
  db: SQLiteDatabase,
  onExitFlow: () => void
): UseQuickCheckInFlowResult {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<QuickCheckInDraft>({ ...EMPTY_QUICK_DRAFT });
  const [isSaving, setIsSaving] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [guidedMode, setGuidedMode] = useState(true);
  const [showToggleIntroHint, setShowToggleIntroHint] = useState(false);
  const [userFeelingChips, setUserFeelingChips] = useState<string[]>([]);
  const [feelingChipsAtLimit, setFeelingChipsAtLimit] = useState(false);

  const savingRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      async function loadState() {
        try {
          const [settings, chips, chipCount] = await Promise.all([
            getSettings(db),
            getUserChips(db, 'feelings'),
            countUserChipsByCategory(db, 'feelings'),
          ]);
          if (cancelled) return;
          setGuidedMode(settings.guidedModeEnabled);
          setShowToggleIntroHint(!settings.guidedToggleIntroduced);
          // Filter out standard chips so only user-created chips are shown
          const userOnly = chips.filter((c) => !FEELING_CHIPS.includes(c as never));
          setUserFeelingChips(userOnly);
          setFeelingChipsAtLimit(chipCount >= MAX_USER_CHIPS_PER_CATEGORY);
        } catch (error) {
          console.error('quickCheckIn loadState failed:', error);
        }
      }
      loadState();
      return () => {
        cancelled = true;
      };
    }, [db])
  );

  async function handleGuidedToggle(value: boolean) {
    setGuidedMode(value);
    try {
      if (showToggleIntroHint) {
        setShowToggleIntroHint(false);
        await updateSettings(db, { guidedModeEnabled: value, guidedToggleIntroduced: true });
      } else {
        await updateSettings(db, { guidedModeEnabled: value });
      }
    } catch (error) {
      console.error('quickCheckIn handleGuidedToggle failed:', error);
      setGuidedMode(!value);
    }
  }

  function handleNext() {
    if (step === TOTAL_STEPS - 1) {
      handleSave();
    } else {
      setStep(step + 1);
    }
  }

  function handleBack() {
    if (step > 0) {
      setStep(step - 1);
    } else {
      onExitFlow();
    }
  }

  async function handleSave() {
    if (savingRef.current) return;
    savingRef.current = true;
    setIsSaving(true);
    try {
      await insertCheckIn(db, {
        energyLevel: draft.energyLevel,
        focusLevel: draft.focusLevel,
        energySkipped: draft.energySkipped,
        focusSkipped: draft.focusSkipped,
        bodySignals: { ...EMPTY_BODY_SIGNALS },
        feelings: draft.feelings,
        feelingsSkipped: draft.feelingsSkipped,
        distressLevel: null,
        distressNote: null,
        thoughtsType: null,
        thoughtsNote: null,
        selfCareNote: null,
        innerPart: null,
        note: null,
      });
      setIsDone(true);
    } catch (error) {
      Sentry.withScope((scope) => {
        scope.setTag('screen', 'quickCheckIn');
        scope.setTag('action', 'save');
        Sentry.captureException(error);
      });
      Alert.alert('Hat nicht geklappt', 'Check-in konnte nicht gespeichert werden.');
    } finally {
      setIsSaving(false);
      savingRef.current = false;
    }
  }

  function handleReset() {
    setStep(0);
    setDraft({ ...EMPTY_QUICK_DRAFT });
    setIsDone(false);
  }

  const actions: QuickDraftActions = {
    setEnergy: (value) => setDraft((d) => ({ ...d, energyLevel: value, energySkipped: false })),
    skipEnergy: () => setDraft((d) => ({ ...d, energyLevel: 0, energySkipped: true })),
    setFocus: (value) => setDraft((d) => ({ ...d, focusLevel: value, focusSkipped: false })),
    skipFocus: () => setDraft((d) => ({ ...d, focusLevel: 0, focusSkipped: true })),
    setFeelings: (value) => setDraft((d) => ({ ...d, feelings: value, feelingsSkipped: false })),
    skipFeelings: () => setDraft((d) => ({ ...d, feelings: '', feelingsSkipped: true })),
  };

  const blocked =
    (step === 0 && draft.energyLevel === 0 && !draft.energySkipped) ||
    (step === 1 && draft.focusLevel === 0 && !draft.focusSkipped);

  return {
    step,
    draft,
    actions,
    isSaving,
    isDone,
    guidedMode,
    showToggleIntroHint,
    isLastStep: step === TOTAL_STEPS - 1,
    isStepBlocked: blocked,
    isNextDisabled: isSaving || blocked,
    userFeelingChips,
    feelingChipsAtLimit,
    setDraft,
    handleGuidedToggle,
    handleNext,
    handleBack,
    handleReset,
  };
}
