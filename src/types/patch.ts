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

export interface PatchChange {
  partIndex: PartIndex;
  change: PartChange;
}

export const DEFAULT_PATCH: PatchState = [
  DEFAULT_PART,
  DEFAULT_PART,
  DEFAULT_PART,
  DEFAULT_PART,
  DEFAULT_PART,
  DEFAULT_PART,
];
