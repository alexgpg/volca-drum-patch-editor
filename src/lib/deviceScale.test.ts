import { describe, expect, it } from 'vitest';
import {
  ccToLcd,
  isValidLcd,
  lcdRange,
  lcdToCcSnap,
  type ScaledParam,
} from './deviceScale';

const DOUBLER_PARAMS: ScaledParam[] = [
  'level',
  'egAttack',
  'egRelease',
  'modRate',
  'send',
  'drive',
  'bitReduction',
  'fold',
];

const HUNDRED_PARAMS: ScaledParam[] = ['modAmount', 'pan', 'dryGain'];

describe('ccToLcd — doubler params', () => {
  it.each(DOUBLER_PARAMS)('doubles CC for %s', (param) => {
    expect(ccToLcd(param, 0)).toBe(0);
    expect(ccToLcd(param, 1)).toBe(2);
    expect(ccToLcd(param, 50)).toBe(100);
    expect(ccToLcd(param, 64)).toBe(128);
    expect(ccToLcd(param, 126)).toBe(252);
  });

  it.each(DOUBLER_PARAMS)('maps CC 127 to 255 (not 254) for %s', (param) => {
    expect(ccToLcd(param, 127)).toBe(255);
  });
});

describe('ccToLcd — hundred params', () => {
  it.each(HUNDRED_PARAMS)('maps CC 0 to -100 for %s', (param) => {
    expect(ccToLcd(param, 0)).toBe(-100);
  });

  it.each(HUNDRED_PARAMS)('maps CC 64 to 0 for %s', (param) => {
    expect(ccToLcd(param, 64)).toBe(0);
  });

  it.each(HUNDRED_PARAMS)('maps CC 127 to 100 (special case) for %s', (param) => {
    expect(ccToLcd(param, 127)).toBe(100);
  });

  it.each(HUNDRED_PARAMS)('matches synthmata-derived sample points for %s', (param) => {
    // Spot-checks against the double-round formula.
    expect(ccToLcd(param, 32)).toBe(-50);
    expect(ccToLcd(param, 96)).toBe(50);
    expect(ccToLcd(param, 126)).toBe(97);
  });
});

describe('lcdToCcSnap — round-trip', () => {
  it.each<ScaledParam>([...DOUBLER_PARAMS, ...HUNDRED_PARAMS])(
    'ccToLcd → lcdToCcSnap returns original CC for every CC in 0..127 (%s)',
    (param) => {
      for (let cc = 0; cc <= 127; cc++) {
        expect(lcdToCcSnap(param, ccToLcd(param, cc))).toBe(cc);
      }
    },
  );
});

describe('lcdToCcSnap — snapping behavior', () => {
  it('snaps an unreachable doubler LCD to the closest reachable CC', () => {
    // CC 50 → 100, CC 51 → 102. LCD 101 is equidistant; snap up.
    expect(lcdToCcSnap('level', 101)).toBe(51);
    expect(lcdToCcSnap('level', 99)).toBe(50);
  });

  it('snaps near the doubler 252/255 boundary', () => {
    expect(lcdToCcSnap('level', 253)).toBe(126);
    expect(lcdToCcSnap('level', 254)).toBe(127);
  });

  it('clamps doubler inputs outside [0, 255]', () => {
    expect(lcdToCcSnap('level', -10)).toBe(0);
    expect(lcdToCcSnap('level', 300)).toBe(127);
  });

  it('clamps hundred inputs outside [-100, 100]', () => {
    expect(lcdToCcSnap('modAmount', -200)).toBe(0);
    expect(lcdToCcSnap('modAmount', 200)).toBe(127);
  });
});

describe('lcdRange', () => {
  it.each(DOUBLER_PARAMS)('reports 0..255 step 2 for %s', (param) => {
    expect(lcdRange(param)).toEqual({ min: 0, max: 255, step: 2 });
  });

  it.each(HUNDRED_PARAMS)('reports -100..100 step 1 for %s', (param) => {
    expect(lcdRange(param)).toEqual({ min: -100, max: 100, step: 1 });
  });
});

describe('isValidLcd', () => {
  it('accepts integers within range', () => {
    expect(isValidLcd('level', 0)).toBe(true);
    expect(isValidLcd('level', 255)).toBe(true);
    expect(isValidLcd('modAmount', -100)).toBe(true);
    expect(isValidLcd('modAmount', 100)).toBe(true);
    expect(isValidLcd('modAmount', 0)).toBe(true);
  });

  it('rejects integers outside range', () => {
    expect(isValidLcd('level', -1)).toBe(false);
    expect(isValidLcd('level', 256)).toBe(false);
    expect(isValidLcd('modAmount', -101)).toBe(false);
    expect(isValidLcd('modAmount', 101)).toBe(false);
  });

  it('rejects non-integers', () => {
    expect(isValidLcd('level', 1.5)).toBe(false);
    expect(isValidLcd('modAmount', 0.5)).toBe(false);
  });
});
