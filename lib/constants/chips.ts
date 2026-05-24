export interface ChipGroup {
  label: string;
  chips: readonly string[];
}

export const FEELING_CHIPS = [
  'neutral',
  'leer',
  'erschöpft',
  'angespannt',
  'überwältigt',
  'gereizt',
  'abgestumpft',
  'traurig',
  'ängstlich',
  'leicht',
  'frustriert',
  'zufrieden',
  'freudig',
  'dankbar',
  'motiviert',
  'verwirrt',
  'aufgedreht',
] as const;

export const SELF_CARE_GROUPS: ChipGroup[] = [
  {
    label: '0 Energie',
    chips: ['Augen schließen', 'Licht dimmen', 'Nichts entscheiden', 'Einfach bleiben'],
  },
  {
    label: 'Klein',
    chips: ['Wasser trinken', 'Kurz raus', 'Tief atmen', 'Dehnen'],
  },
  {
    label: 'Mehr Aufwand',
    chips: ['Spazieren', 'Essen', 'Dusche', 'Musik hören'],
  },
];

export const SELF_CARE_CHIPS: readonly string[] = SELF_CARE_GROUPS.flatMap((g) => [...g.chips]);
