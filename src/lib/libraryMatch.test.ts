import { describe, expect, it } from 'vitest';
import { matchKitIndex, matchPresetIndex } from './libraryMatch';
import type { PartPreset } from './partLibrary';
import { DEFAULT_LAYER } from '../types/layer';
import { DEFAULT_PART, type PartState } from '../types/part';
import {
  DEFAULT_KIT,
  type KitState,
  type PartialKit,
  type PatchState,
} from '../types/patch';

const kick: PartState = {
  ...DEFAULT_PART,
  comment: 'kick',
  drive: 24,
  layer1: { ...DEFAULT_LAYER, level: 127 },
};

const snare: PartState = {
  ...DEFAULT_PART,
  comment: 'snare',
  layer2: { ...DEFAULT_LAYER, soundSource: 'noiseHP' },
};

const PRESETS: PartPreset[] = [
  { name: 'kick', part: kick },
  { name: 'snare', part: snare },
];

const sixParts = (...overrides: [number, PartState][]): PatchState => {
  const parts = [...DEFAULT_KIT.parts] as PartState[];
  for (const [i, p] of overrides) parts[i] = p;
  return parts as unknown as PatchState;
};

describe('matchPresetIndex', () => {
  it('finds the preset the part currently equals', () => {
    expect(matchPresetIndex(PRESETS, { ...kick })).toBe(0);
    expect(matchPresetIndex(PRESETS, { ...snare })).toBe(1);
  });

  it('returns -1 once any parameter diverges', () => {
    expect(matchPresetIndex(PRESETS, { ...kick, fold: 1 })).toBe(-1);
    expect(
      matchPresetIndex(PRESETS, {
        ...kick,
        layer1: { ...kick.layer1, pitch: kick.layer1.pitch + 1 },
      }),
    ).toBe(-1);
  });

  it('treats the comment as part of the identity', () => {
    expect(matchPresetIndex(PRESETS, { ...kick, comment: 'kick!' })).toBe(-1);
  });

  it('returns -1 for an empty library', () => {
    expect(matchPresetIndex([], kick)).toBe(-1);
  });

  it('prefers the first of duplicate entries', () => {
    const dup: PartPreset[] = [...PRESETS, { name: 'kick again', part: { ...kick } }];
    expect(matchPresetIndex(dup, { ...kick })).toBe(0);
  });
});

describe('matchKitIndex', () => {
  const threePartKit: PartialKit = {
    comment: 'Trio',
    parts: [kick, snare, DEFAULT_PART],
  };
  const KITS: PartialKit[] = [threePartKit];

  const applied: KitState = {
    comment: 'Trio',
    parts: sixParts([0, kick], [1, snare]),
  };

  it('matches a freshly applied partial kit', () => {
    expect(matchKitIndex(KITS, applied)).toBe(0);
  });

  it('keeps matching when a part the kit never specified is edited', () => {
    const editedOutside: KitState = {
      ...applied,
      parts: sixParts([0, kick], [1, snare], [4, { ...DEFAULT_PART, fold: 9 }]),
    };
    expect(matchKitIndex(KITS, editedOutside)).toBe(0);
  });

  it('stops matching when one of its own parts is edited', () => {
    const editedInside: KitState = {
      ...applied,
      parts: sixParts([0, kick], [1, { ...snare, send: 5 }]),
    };
    expect(matchKitIndex(KITS, editedInside)).toBe(-1);
  });

  it('treats the kit comment as part of the identity', () => {
    expect(matchKitIndex(KITS, { ...applied, comment: 'Trio 2' })).toBe(-1);
  });

  it('handles an oversized candidate without reading past the parts', () => {
    const oversized: PartialKit = {
      comment: 'Trio',
      parts: Array.from({ length: 7 }, () => DEFAULT_PART),
    };
    expect(matchKitIndex([oversized], applied)).toBe(-1);
  });

  it('returns -1 for an empty library', () => {
    expect(matchKitIndex([], applied)).toBe(-1);
  });
});
