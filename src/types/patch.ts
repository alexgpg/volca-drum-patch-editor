import { DEFAULT_PART, type PartChange, type PartState } from './part';

export type PartIndex = 1 | 2 | 3 | 4 | 5 | 6;

export type PatchState = readonly [
  PartState,
  PartState,
  PartState,
  PartState,
  PartState,
  PartState,
];

export interface KitState {
  parts: PatchState;
  comment: string;
}

// A partial kit holds 1..6 parts and overlays positionally over the
// canonical 6-part KitState on apply. Used as the transport shape for
// pasted codes — a 3-part paste replaces parts 1..3, leaving 4..6
// untouched. The encoder always emits a full 6-part kit; partial kits
// only arise from hand-written or library-sourced text.
export interface PartialKit {
  parts: PartState[];
  comment: string;
}

export interface PartScopedChange {
  partIndex: PartIndex;
  change: PartChange;
}

export type PatchChange =
  | PartScopedChange
  | { kind: 'kit-replace'; value: PartialKit }
  | { kind: 'kit'; param: 'comment'; value: string };

export const DEFAULT_PATCH: PatchState = [
  DEFAULT_PART,
  DEFAULT_PART,
  DEFAULT_PART,
  DEFAULT_PART,
  DEFAULT_PART,
  DEFAULT_PART,
];

export const DEFAULT_KIT: KitState = {
  parts: DEFAULT_PATCH,
  comment: '',
};
