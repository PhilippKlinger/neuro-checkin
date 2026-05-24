import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import type { SQLiteDatabase } from 'expo-sqlite';
import { CheckInDraft, EMPTY_DRAFT, EMPTY_BODY_SIGNALS } from '../types/checkin';
import { insertCheckIn, countCheckIns } from '../database/checkins';
import { getSettings, updateSettings } from '../database/settings';
import { saveUserChips, getUserChips } from '../database/userChips';
import { FEELING_CHIPS, SELF_CARE_CHIPS } from '../constants/chips';
import { INACTIVITY_TIMEOUT_MS } from '../constants/timing';
import { isStepBlocked as checkStepBlocked, isInactivityExpired } from '../utils/checkInFlow';
import * as Sentry from '@sentry/react-native';

export const TOTAL_STEPS = 9;

export interface UseCheckInFlowResult {
  step: number;
  draft: CheckInDraft;
  isSaving: boolean;
  isDone: boolean;
  wasReset: boolean;
  isFirstCheckin: boolean;
  guidedMode: boolean;
  showToggleIntroHint: boolean;
  feelingUserChips: string[];
  selfCareUserChips: string[];
  canGoBack: boolean;
  isLastStep: boolean;
  isStepBlocked: boolean;
  isNextDisabled: boolean;
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
  const [showToggleIntroHint, setShowToggleIntroHint] = useState(false);
  const [feelingUserChips, setFeelingUserChips] = useState<string[]>([]);
  const [selfCareUserChips, setSelfCareUserChips] = useState<string[]>([]);

  const stepRef = useRef(step);
  const leftAtRef = useRef<number | null>(null);
  const savingRef = useRef(false);

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      async function loadState() {
        try {
          const [settings, count, feelingChips, selfCareChips] = await Promise.all([
            getSettings(db),
            countCheckIns(db),
            getUserChips(db, 'feelings'),
            getUserChips(db, 'self_care'),
          ]);
          if (cancelled) return;
          setIsFirstCheckin(count === 0);
          setGuidedMode(settings.guidedModeEnabled);
          setShowToggleIntroHint(!settings.guidedToggleIntroduced);
          setFeelingUserChips(feelingChips);
          setSelfCareUserChips(selfCareChips);
        } catch {
          // Non-critical — defaults are safe fallbacks
        }
      }
      loadState();
      return () => {
        cancelled = true;
      };
    }, [db])
  );

  useFocusEffect(
    useCallback(() => {
      if (leftAtRef.current !== null && stepRef.current > 0) {
        if (isInactivityExpired(leftAtRef.current, Date.now(), INACTIVITY_TIMEOUT_MS)) {
          Alert.alert(
            'Du warst eine Weile weg',
            'Möchtest du bei deinem Check-in weitermachen oder neu beginnen?',
            [
              {
                text: 'Weitermachen',
                style: 'default',
              },
              {
                text: 'Neu beginnen',
                style: 'destructive',
                onPress: () => {
                  setStep(0);
                  setDraft(freshDraft);
                  setIsDone(false);
                  setWasReset(true);
                },
              },
            ]
          );
        }
      }
      leftAtRef.current = null;

      return () => {
        if (stepRef.current > 0) {
          leftAtRef.current = Date.now();
        }
      };
    }, [])
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
    } catch {
      setGuidedMode(!value);
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
      await Promise.all([
        saveUserChips(db, 'feelings', draft.feelings, [...FEELING_CHIPS]),
        saveUserChips(db, 'self_care', draft.selfCareNote, [...SELF_CARE_CHIPS]),
      ]);
      setIsDone(true);
    } catch (error) {
      Sentry.captureException(error);
      Alert.alert(
        'Fehler beim Speichern',
        'Check-in konnte nicht gespeichert werden. Bitte versuche es erneut.'
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

  const blocked = checkStepBlocked(step, draft);

  return {
    step,
    draft,
    isSaving,
    isDone,
    wasReset,
    isFirstCheckin,
    guidedMode,
    showToggleIntroHint,
    feelingUserChips,
    selfCareUserChips,
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
