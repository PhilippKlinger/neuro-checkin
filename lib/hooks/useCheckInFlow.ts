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
import { CheckInDraft, BodySignals, EMPTY_DRAFT, EMPTY_BODY_SIGNALS } from '../types/checkin';
import { insertCheckIn, countCheckIns } from '../database/checkins';
import { getSettings, updateSettings } from '../database/settings';
import { saveUserChips, getUserChips } from '../database/userChips';
import { saveDraft, loadDraft, clearDraft } from '../database/checkInDraft';
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
  canGoBack: boolean;
  isLastStep: boolean;
  isStepBlocked: boolean;
  isNextDisabled: boolean;
  resumeDialogVisible: boolean;
  handleResumeDraft: () => void;
  handleDiscardDraft: () => void;
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
  const [resumeDialogVisible, setResumeDialogVisible] = useState(false);

  const stepRef = useRef(step);
  const savingRef = useRef(false);
  const pendingResumeDraftRef = useRef<{ draft: CheckInDraft; step: number } | null>(null);

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      async function loadState() {
        try {
          const [settings, count, feelingChips, selfCareChips, savedDraft] = await Promise.all([
            getSettings(db),
            countCheckIns(db),
            getUserChips(db, 'feelings'),
            getUserChips(db, 'self_care'),
            loadDraft(db),
          ]);
          if (cancelled) return;
          setIsFirstCheckin(count === 0);
          setGuidedMode(settings.guidedModeEnabled);
          setFeelingUserChips(feelingChips);
          setSelfCareUserChips(selfCareChips);

          if (savedDraft && stepRef.current === 0) {
            pendingResumeDraftRef.current = savedDraft;
            setResumeDialogVisible(true);
          }
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

  // Persist draft to SQLite whenever step advances (step > 0 and not yet done)
  useEffect(() => {
    if (step === 0 || isDone) return;
    saveDraft(db, draft, step).catch((err) => console.error('saveDraft failed:', err));
  }, [step]); // intentional: save on step change only, not on every keystroke

  function handleResumeDraft() {
    if (pendingResumeDraftRef.current) {
      setDraft(pendingResumeDraftRef.current.draft);
      setStep(pendingResumeDraftRef.current.step);
      pendingResumeDraftRef.current = null;
    }
    setResumeDialogVisible(false);
  }

  function handleDiscardDraft() {
    pendingResumeDraftRef.current = null;
    setResumeDialogVisible(false);
    clearDraft(db).catch(console.error);
  }

  async function handleGuidedToggle(value: boolean) {
    setGuidedMode(value);
    try {
      await updateSettings(db, { guidedModeEnabled: value });
    } catch (error) {
      console.error('handleGuidedToggle failed:', error);
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
        clearDraft(db),
      ]);
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
    clearDraft(db).catch(console.error);
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
    canGoBack: step > 0,
    isLastStep: step === TOTAL_STEPS - 1,
    isStepBlocked: blocked,
    isNextDisabled: isSaving || blocked,
    resumeDialogVisible,
    handleResumeDraft,
    handleDiscardDraft,
    setDraft,
    setWasReset,
    handleGuidedToggle,
    handleNext,
    handleBack,
    handleReset,
  };
}
