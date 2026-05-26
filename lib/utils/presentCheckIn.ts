import type { CheckIn, CheckInDraft, BodySignals } from '../types/checkin';
import {
  getLevelLabel,
  getThoughtsLabel,
  ENERGY_LABELS,
  FOCUS_LABELS,
  DISTRESS_LABELS,
  SIGNAL_LABELS,
} from '../types/checkin';

export interface PresentedSignal {
  label: string;
  active: boolean;
}

export interface PresentedCheckIn {
  energy: string | null;
  focus: string | null;
  bodySignals: PresentedSignal[];
  activeSignals: string[];
  feelings: string | null;
  distress: string | null;
  distressWithNote: string | null;
  thoughtsType: string | null;
  thoughtsNote: string | null;
  selfCare: string | null;
  innerPart: string | null;
  note: string | null;
}

type CheckInSource = CheckIn | CheckInDraft;

export function presentCheckIn(source: CheckInSource): PresentedCheckIn {
  const c = source;

  const energy =
    !c.energySkipped && c.energyLevel > 0
      ? `${c.energyLevel}/5 — ${getLevelLabel(c.energyLevel, ENERGY_LABELS)}`
      : null;

  const focus =
    !c.focusSkipped && c.focusLevel > 0
      ? `${c.focusLevel}/5 — ${getLevelLabel(c.focusLevel, FOCUS_LABELS)}`
      : null;

  const bodySignals: PresentedSignal[] = (Object.keys(SIGNAL_LABELS) as (keyof BodySignals)[]).map(
    (key) => ({
      label: SIGNAL_LABELS[key],
      active: c.bodySignals[key] === true,
    })
  );

  const activeSignals = bodySignals.filter((s) => s.active).map((s) => s.label);

  const feelings = c.feelings || null;

  const distress =
    c.distressLevel !== null
      ? `${c.distressLevel}/5 — ${getLevelLabel(c.distressLevel, DISTRESS_LABELS)}`
      : null;

  const distressWithNote =
    c.distressLevel !== null
      ? `${c.distressLevel}/5 — ${getLevelLabel(c.distressLevel, DISTRESS_LABELS)}${c.distressNote ? ` — ${c.distressNote}` : ''}`
      : null;

  const thoughtsType = c.thoughtsType ? getThoughtsLabel(c.thoughtsType) : null;
  const thoughtsNote = c.thoughtsNote || null;
  const selfCare = c.selfCareNote || null;
  const innerPart = c.innerPart || null;
  const note = c.note || null;

  return {
    energy,
    focus,
    bodySignals,
    activeSignals,
    feelings,
    distress,
    distressWithNote,
    thoughtsType,
    thoughtsNote,
    selfCare,
    innerPart,
    note,
  };
}
