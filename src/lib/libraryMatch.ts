// Derived library-selection matching for the preset/kit dropdowns.
//
// The selects don't remember what was picked — that would go stale the
// moment any knob moves. Instead the UI asks, on every sync, "which library
// entry does the current state equal right now?" and shows that (or the
// placeholder). Applying a preset makes it light up; editing anything it
// specified makes it fall back — and hand-editing your way back into an
// exact library state lights it up again.
//
// Equality goes through encodePart(): the codec's canonical serialization,
// comments included, so one string compare per candidate.

import { encodePart } from './patchCodec';
import type { PartPreset } from './partLibrary';
import type { PartState } from '../types/part';
import type { KitState, PartialKit } from '../types/patch';

/** Index of the preset the part currently equals, or -1. First match wins. */
export function matchPresetIndex(presets: readonly PartPreset[], part: PartState): number {
  const code = encodePart(part);
  return presets.findIndex((p) => encodePart(p.part) === code);
}

/**
 * Index of the library kit the current kit state matches, or -1.
 *
 * A library kit is *partial* (1..6 parts, overlaid positionally on apply),
 * so it matches when its comment and every part it actually specifies are
 * equal — parts beyond its length are not its business, and editing them
 * does not clear the match.
 */
export function matchKitIndex(kits: readonly PartialKit[], kit: KitState): number {
  return kits.findIndex(
    (candidate) =>
      candidate.comment === kit.comment &&
      candidate.parts.length <= kit.parts.length &&
      candidate.parts.every((p, i) => encodePart(p) === encodePart(kit.parts[i])),
  );
}
