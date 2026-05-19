import type { PartChange, PartState } from '../types/part';

export function applyPartChange(part: PartState, change: PartChange): PartState {
  if (change.kind === 'part') {
    if (change.param === 'linked' && change.value === true) {
      return { ...part, linked: true, layer2: part.layer1 };
    }
    return { ...part, [change.param]: change.value };
  }

  if (change.kind === 'layer-replace') {
    if (part.linked) {
      return { ...part, layer1: change.value, layer2: change.value };
    }
    const slotKey = change.slot === 1 ? 'layer1' : 'layer2';
    return { ...part, [slotKey]: change.value };
  }

  if (part.linked) {
    return {
      ...part,
      layer1: { ...part.layer1, [change.param]: change.value },
      layer2: { ...part.layer2, [change.param]: change.value },
    };
  }

  const slotKey = change.slot === 1 ? 'layer1' : 'layer2';
  return {
    ...part,
    [slotKey]: { ...part[slotKey], [change.param]: change.value },
  };
}
