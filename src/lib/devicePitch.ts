// CC ↔ device-display-pitch conversion.
//
// The Volca Drum's Pitch parameter is shown on the device LCD on a
// 0–255 scale (the doubler), while the wire protocol carries a 7-bit
// CC value (0–127). The 128 CC values map onto 128 display pitches:
// CC k → 2k for k ∈ [0, 126], and CC 127 → 255 at the top end.
//
// This module is the single place that knows about the asymmetric
// top end. Other code converts in both directions through here.

export function ccToDisplayPitch(cc: number): number {
  return cc === 127 ? 255 : cc * 2;
}

/**
 * Strict inverse: returns the CC that produces this display pitch
 * exactly, or null if the input is not a reachable display value.
 * Reachable values are {0, 2, 4, …, 252, 255}.
 */
export function displayPitchToCc(displayPitch: number): number | null {
  if (displayPitch === 255) return 127;
  if (!Number.isInteger(displayPitch)) return null;
  // 254 is unreachable: CC 127 produces 255, not 254. Linear range is 0..252 even.
  if (displayPitch < 0 || displayPitch >= 254) return null;
  if (displayPitch % 2 !== 0) return null;
  return displayPitch / 2;
}

/**
 * Snapping inverse: maps any input in [0, 255] to the CC whose
 * display pitch is closest. Used by the Pitch slider, which lets the
 * user drag or type any integer 0–255 even though only 128 values
 * are reachable.
 */
export function displayPitchToCcSnap(displayPitch: number): number {
  const d = Math.max(0, Math.min(255, displayPitch));
  // CC k in [0, 126] → display 2k. Nearest k by distance.
  const kLow = Math.max(0, Math.min(126, Math.round(d / 2)));
  const distLow = Math.abs(d - 2 * kLow);
  const distHigh = 255 - d; // distance to CC 127's display (255)
  return distHigh < distLow ? 127 : kLow;
}
