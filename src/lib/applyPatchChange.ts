import type { KitState, PatchChange, PatchState } from '../types/patch';
import { applyPartChange } from './applyPartChange';

type MutablePatch = [
  PatchState[0],
  PatchState[1],
  PatchState[2],
  PatchState[3],
  PatchState[4],
  PatchState[5],
];

export function applyPatchChange(kit: KitState, change: PatchChange): KitState {
  if ('kind' in change) {
    if (change.kind === 'kit-replace') {
      const partial = change.value;
      const nextParts = [...kit.parts] as unknown as MutablePatch;
      for (let i = 0; i < partial.parts.length; i++) {
        nextParts[i] = partial.parts[i];
      }
      return { parts: nextParts, comment: partial.comment };
    }
    return { ...kit, comment: change.value };
  }
  const i = change.partIndex - 1;
  const nextParts = [...kit.parts] as unknown as MutablePatch;
  nextParts[i] = applyPartChange(kit.parts[i], change.change);
  return { ...kit, parts: nextParts };
}
