import { describe, expect, it } from 'vitest';
import { applyPatchChange } from './applyPatchChange';
import { DEFAULT_PART, type PartState } from '../types/part';
import {
  DEFAULT_KIT,
  type KitState,
  type PartialKit,
  type PatchState,
} from '../types/patch';

const tagged = (n: number): PartState => ({ ...DEFAULT_PART, comment: `part-${n}` });

const fullKit = (): KitState => ({
  comment: 'base',
  parts: [tagged(1), tagged(2), tagged(3), tagged(4), tagged(5), tagged(6)] as
    unknown as PatchState,
});

describe('applyPatchChange kit-replace', () => {
  it('overlays a 3-part partial kit onto parts 1..3, keeps 4..6', () => {
    const base = fullKit();
    const partial: PartialKit = {
      comment: 'overlay',
      parts: [tagged(101), tagged(102), tagged(103)],
    };
    const next = applyPatchChange(base, { kind: 'kit-replace', value: partial });
    expect(next.comment).toBe('overlay');
    expect(next.parts.map((p) => p.comment)).toEqual([
      'part-101', 'part-102', 'part-103',
      'part-4',   'part-5',   'part-6',
    ]);
  });

  it('replaces all 6 parts when partial has 6', () => {
    const base = fullKit();
    const partial: PartialKit = {
      comment: 'full',
      parts: [tagged(11), tagged(12), tagged(13), tagged(14), tagged(15), tagged(16)],
    };
    const next = applyPatchChange(base, { kind: 'kit-replace', value: partial });
    expect(next.parts.map((p) => p.comment)).toEqual([
      'part-11', 'part-12', 'part-13', 'part-14', 'part-15', 'part-16',
    ]);
  });

  it('always overwrites the kit comment from the partial, even when empty', () => {
    const base = { ...DEFAULT_KIT, comment: 'old name' };
    const partial: PartialKit = { comment: '', parts: [DEFAULT_PART] };
    const next = applyPatchChange(base, { kind: 'kit-replace', value: partial });
    expect(next.comment).toBe('');
  });

  it('does not mutate the input kit', () => {
    const base = fullKit();
    const before = base.parts.map((p) => p.comment);
    applyPatchChange(base, {
      kind: 'kit-replace',
      value: { comment: 'x', parts: [tagged(99)] },
    });
    expect(base.parts.map((p) => p.comment)).toEqual(before);
  });
});

describe('applyPatchChange kit comment edit', () => {
  it('updates the comment without touching parts', () => {
    const base = fullKit();
    const next = applyPatchChange(base, { kind: 'kit', param: 'comment', value: 'renamed' });
    expect(next.comment).toBe('renamed');
    expect(next.parts).toEqual(base.parts);
  });
});
