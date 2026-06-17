import { useState, useRef, useCallback, type Dispatch, type SetStateAction } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import type { SQLiteDatabase } from 'expo-sqlite';
import { CheckInDraft, BodySignals, EMPTY_DRAFT, EMPTY_BODY_SIGNALS } from '../types/checkin';
import { insertCheckIn, countCheckIns } from '../database/checkins';
import { getSettings, updateSettings } from '../database/settings';
import { saveUserChips, getUserChips, countUserChipsByCategory } from '../database/userChips';
import { MAX_USER_CHIPS_PER_CATEGORY } from '../constants/userChips';
import { FEELING_CHIPS, SELF_CARE_CHIPS } from '../constants/chips';
import { isStepBlocked as checkStepBlocked } from '../utils/checkInFlow';
import * as Sentry from '@sentry/react-native';

export const TOTAL_STEPS = 9;

export interface DraftActions {
  setEnergy: (value: number) => void;
  skipEnergy: () => void;
  setFocus: (value: number) => void;
  skipFocus: () => void;
  setBodySignals: (value: BodySignals) => void;
  setFeelings: (value: string) => void;
  skipFeelings: () => void;
  setDistressLevel: (value: number | null) => void;
  setDistressNote: (value: string) => void;
  setThoughtsType: (value: 'supportive' | 'burdening' | 'mixed' | null) => void;
  setThoughtsNote: (value: string) => void;
  setSelfCare: (value: string) => void;
}

export interface UseCheckInFlowResult {
  step: number;
  draft: CheckInDraft;
  actions: DraftActions;
  isSaving: boolean;
  isDone: boolean;
  wasReset: boolean;
  isFirstCheckin: boolean;
  guidedMode: boolean;
  feelingUserChips: string[];
  selfCareUserChips: string[];
  feelingsAtLimit: boolean;
  selfCareAtLimit: boolean;
  canGoBack: boolean;
  isLastStep: boolean;
  isStepBlocked: boolean;
  isNextDisabled: boolean;
  /** @deprecated Use actions instead */
  setDraft: Dispatch<SetStateAction<CheckInDraft>>;
  setWasReset: Dispatch<SetStateAction<boolean>>;
  handleGuidedToggle: (value: boolean) => Promise<void>;
  handleNext: () => void;
  handleBack: () => void;
  handleReset: () => void;
}

function freshDraft(): CheckInDraft {
  return { ...EMPTY_DRAFT, bodySignals: { ...EMPTY_BODY_SIGNALS } };
}

export function useCheckInFlow(db: SQLiteDatabase): UseCheckInFlowResult {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<CheckInDraft>(freshDraft);
  const [isSaving, setIsSaving] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [wasReset, setWasReset] = useState(false);
  const [isFirstCheckin, setIsFirstCheckin] = useState(false);
  const [guidedMode, setGuidedMode] = useState(true);
  const [feelingUserChips, setFeelingUserChips] = useState<string[]>([]);
  const [selfCareUserChips, setSelfCareUserChips] = useState<string[]>([]);
  const [feelingsAtLimit, setFeelingsAtLimit] = useState(false);
  const [selfCareAtLimit, setSelfCareAtLimit] = useState(false);

  const savingRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      async function loadState() {
        try {
          const [settings, count, feelingChips, selfCareChips, feelingCount, selfCareCount] =
            await Promise.all([
              getSettings(db),
              countCheckIns(db),
              getUserChips(db, 'feelings'),
              getUserChips(db, 'self_care'),
              countUserChipsByCategory(db, 'feelings'),
              countUserChipsByCategory(db, 'self_care'),
            ]);
          if (cancelled) return;
          setIsFirstCheckin(count === 0);
          setGuidedMode(settings.guidedModeEnabled);
          setFeelingUserChips(feelingChips);
          setSelfCareUserChips(selfCareChips);
          setFeelingsAtLimit(feelingCount >= MAX_USER_CHIPS_PER_CATEGORY);
          setSelfCareAtLimit(selfCareCount >= MAX_USER_CHIPS_PER_CATEGORY);
        } catch (error) {
          console.error('useCheckInFlow loadState failed:', error);
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
      await updateSettings(db, { guidedModeEnabled: value });
    } catch (error) {
      // Guided mode is low-stakes display state. Keep the optimistic value rather
      // than rolling back (which caused a confusing "flicker" when the write hit a
      // transient prepareAsync error); the next getSettings reconciles it.
      Sentry.withScope((scope) => {
        scope.setTag('screen', 'checkIn');
        scope.setTag('action', 'guidedModeToggle');
        Sentry.captureException(error);
      });
    }
  }

  function handleNext() {
    if (wasReset) setWasReset(false);
    if (step === TOTAL_STEPS - 1) {
      handleSave();
    } else {
      setStep(step + 1);
    }
  }

  function handleBack() {
    if (step > 0) {
      setStep(step - 1);
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
        bodySignals: draft.bodySignals,
        feelings: draft.feelings,
        feelingsSkipped: draft.feelingsSkipped,
        distressLevel: draft.distressLevel,
        distressNote: draft.distressNote || null,
        thoughtsType: draft.thoughtsType,
        thoughtsNote: draft.thoughtsNote || null,
        selfCareNote: draft.selfCareNote || null,
        innerPart: draft.innerPart || null,
        note: draft.note || null,
      });
      // Insert is committed — the check-in is saved. Chip persistence is
      // best-effort: a failure here must NOT report the saved check-in as
      // failed, which would invite a duplicate save on retry.
      await Promise.all([
        saveUserChips(db, 'feelings', draft.feelings, [...FEELING_CHIPS]),
        saveUserChips(db, 'self_care', draft.selfCareNote, [...SELF_CARE_CHIPS]),
      ]).catch((error) => {
        Sentry.withScope((scope) => {
          scope.setTag('screen', 'checkIn');
          scope.setTag('action', 'save-cleanup');
          Sentry.captureException(error);
        });
      });
      setIsDone(true);
    } catch (error) {
      Sentry.withScope((scope) => {
        scope.setTag('screen', 'checkIn');
        scope.setTag('action', 'save');
        Sentry.captureException(error);
      });
      Alert.alert(
        'Hat nicht geklappt',
        'Check-in konnte nicht gespeichert werden. Versuch es nochmal.'
      );
    } finally {
      setIsSaving(false);
      savingRef.current = false;
    }
  }

  function handleReset() {
    setStep(0);
    setDraft(freshDraft);
    setIsDone(false);
    setWasReset(false);
  }

  const actions: DraftActions = {
    setEnergy: (value) => setDraft((d) => ({ ...d, energyLevel: value, energySkipped: false })),
    skipEnergy: () => setDraft((d) => ({ ...d, energyLevel: 0, energySkipped: true })),
    setFocus: (value) => setDraft((d) => ({ ...d, focusLevel: value, focusSkipped: false })),
    skipFocus: () => setDraft((d) => ({ ...d, focusLevel: 0, focusSkipped: true })),
    setBodySignals: (value) => setDraft((d) => ({ ...d, bodySignals: value })),
    setFeelings: (value) => setDraft((d) => ({ ...d, feelings: value, feelingsSkipped: false })),
    skipFeelings: () => setDraft((d) => ({ ...d, feelings: '', feelingsSkipped: true })),
    setDistressLevel: (value) => setDraft((d) => ({ ...d, distressLevel: value })),
    setDistressNote: (value) => setDraft((d) => ({ ...d, distressNote: value })),
    setThoughtsType: (value) => setDraft((d) => ({ ...d, thoughtsType: value })),
    setThoughtsNote: (value) => setDraft((d) => ({ ...d, thoughtsNote: value })),
    setSelfCare: (value) => setDraft((d) => ({ ...d, selfCareNote: value })),
  };

  const blocked = checkStepBlocked(step, draft);

  return {
    step,
    draft,
    actions,
    isSaving,
    isDone,
    wasReset,
    isFirstCheckin,
    guidedMode,
    feelingUserChips,
    selfCareUserChips,
    feelingsAtLimit,
    selfCareAtLimit,
    canGoBack: step > 0,
    isLastStep: step === TOTAL_STEPS - 1,
    isStepBlocked: blocked,
    isNextDisabled: isSaving || blocked,
    setDraft,
    setWasReset,
    handleGuidedToggle,
    handleNext,
    handleBack,
    handleReset,
  };
}
