import { describe, expect, it } from 'vitest';
import {
  ccToDisplayPitch,
  displayPitchToCc,
  displayPitchToCcSnap,
} from './devicePitch';

describe('ccToDisplayPitch', () => {
  it('doubles CC for the linear range', () => {
    expect(ccToDisplayPitch(0)).toBe(0);
    expect(ccToDisplayPitch(1)).toBe(2);
    expect(ccToDisplayPitch(50)).toBe(100);
    expect(ccToDisplayPitch(126)).toBe(252);
  });

  it('maps the top CC to 255, not 254', () => {
    expect(ccToDisplayPitch(127)).toBe(255);
  });

  it('round-trips with the strict inverse for every CC', () => {
    for (let cc = 0; cc <= 127; cc++) {
      expect(displayPitchToCc(ccToDisplayPitch(cc))).toBe(cc);
    }
  });
});

describe('displayPitchToCc (strict)', () => {
  it('returns null for odd values in the linear range', () => {
    expect(displayPitchToCc(1)).toBeNull();
    expect(displayPitchToCc(101)).toBeNull();
    expect(displayPitchToCc(253)).toBeNull();
  });

  it('returns null for 254 (unreachable: CC 127 produces 255)', () => {
    expect(displayPitchToCc(254)).toBeNull();
  });

  it('returns null outside [0, 255]', () => {
    expect(displayPitchToCc(-1)).toBeNull();
    expect(displayPitchToCc(256)).toBeNull();
  });

  it('returns null for non-integers', () => {
    expect(displayPitchToCc(1.5)).toBeNull();
  });
});

describe('displayPitchToCcSnap', () => {
  it('returns the exact CC for reachable display pitches', () => {
    expect(displayPitchToCcSnap(0)).toBe(0);
    expect(displayPitchToCcSnap(100)).toBe(50);
    expect(displayPitchToCcSnap(252)).toBe(126);
    expect(displayPitchToCcSnap(255)).toBe(127);
  });

  it('snaps odd display pitches to the nearer even CC', () => {
    // 101 is between 100 (CC 50) and 102 (CC 51) — equidistant; snap up.
    expect(displayPitchToCcSnap(101)).toBe(51);
    expect(displayPitchToCcSnap(99)).toBe(50);
  });

  it('snaps near the 252/255 boundary correctly', () => {
    expect(displayPitchToCcSnap(253)).toBe(126); // closer to 252 (delta 1) than 255 (delta 2)
    expect(displayPitchToCcSnap(254)).toBe(127); // closer to 255 (delta 1) than 252 (delta 2)
  });

  it('clamps out-of-range inputs', () => {
    expect(displayPitchToCcSnap(-10)).toBe(0);
    expect(displayPitchToCcSnap(300)).toBe(127);
  });
});
