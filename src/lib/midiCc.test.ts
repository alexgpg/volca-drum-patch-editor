import { describe, expect, it } from 'vitest';
import { DEFAULT_LAYER } from '../types/layer';
import {
  PART_CC,
  PITCH_QUANT_CC,
  layerSliderCC,
  selectorsCC,
  selectorsSum,
} from './midiCc';

describe('selectorsCC', () => {
  it('is CC 14 for layer 1 and CC 15 for layer 2', () => {
    expect(selectorsCC(1)).toBe(14);
    expect(selectorsCC(2)).toBe(15);
  });

  it('is CC 16 for both layers', () => {
    expect(selectorsCC('both')).toBe(16);
  });
});

describe('layerSliderCC', () => {
  it('returns the layer-1 CCs from the chart', () => {
    expect(layerSliderCC(1, 'level')).toBe(17);
    expect(layerSliderCC(1, 'egAttack')).toBe(20);
    expect(layerSliderCC(1, 'egRelease')).toBe(23);
    expect(layerSliderCC(1, 'pitch')).toBe(26);
    expect(layerSliderCC(1, 'modAmount')).toBe(29);
    expect(layerSliderCC(1, 'modRate')).toBe(46);
  });

  it('returns the layer-2 CCs from the chart', () => {
    expect(layerSliderCC(2, 'level')).toBe(18);
    expect(layerSliderCC(2, 'egAttack')).toBe(21);
    expect(layerSliderCC(2, 'egRelease')).toBe(24);
    expect(layerSliderCC(2, 'pitch')).toBe(27);
    expect(layerSliderCC(2, 'modAmount')).toBe(30);
    expect(layerSliderCC(2, 'modRate')).toBe(47);
  });

  it('returns the "both layers" CCs from the chart', () => {
    expect(layerSliderCC('both', 'level')).toBe(19);
    expect(layerSliderCC('both', 'egAttack')).toBe(22);
    expect(layerSliderCC('both', 'egRelease')).toBe(25);
    expect(layerSliderCC('both', 'pitch')).toBe(28);
    expect(layerSliderCC('both', 'modAmount')).toBe(31);
    expect(layerSliderCC('both', 'modRate')).toBe(48);
  });
});

describe('PART_CC', () => {
  it('matches the chart', () => {
    expect(PART_CC.pan).toBe(10);
    expect(PART_CC.bitReduction).toBe(49);
    expect(PART_CC.fold).toBe(50);
    expect(PART_CC.drive).toBe(51);
    expect(PART_CC.dryGain).toBe(52);
    expect(PART_CC.send).toBe(103);
  });

  it('uses CC 53 for pitch quantization (synthmata-derived)', () => {
    expect(PITCH_QUANT_CC).toBe(53);
  });
});

describe('selectorsSum', () => {
  it('is 0 for the all-zero combination (sine + envelope + ad)', () => {
    expect(selectorsSum(DEFAULT_LAYER)).toBe(0);
  });

  it('encodes a sound source change in isolation', () => {
    expect(selectorsSum({ ...DEFAULT_LAYER, soundSource: 'saw' })).toBe(26);
    expect(selectorsSum({ ...DEFAULT_LAYER, soundSource: 'noiseBP' })).toBe(103);
  });

  it('encodes mod and envelope choices independently', () => {
    expect(selectorsSum({ ...DEFAULT_LAYER, modType: 'lfo' })).toBe(9);
    expect(selectorsSum({ ...DEFAULT_LAYER, ampEG: 'multi' })).toBe(6);
  });

  it('caps at 127 for the maximum combination', () => {
    expect(
      selectorsSum({
        ...DEFAULT_LAYER,
        soundSource: 'noiseBP',
        modType: 'random',
        ampEG: 'multi',
      }),
    ).toBe(127);
  });

  it('produces a unique value for every combination', () => {
    const sources = ['sine', 'saw', 'noiseHP', 'noiseLP', 'noiseBP'] as const;
    const mods = ['envelope', 'lfo', 'random'] as const;
    const envs = ['ad', 'exp', 'multi'] as const;
    const seen = new Set<number>();
    for (const soundSource of sources) {
      for (const modType of mods) {
        for (const ampEG of envs) {
          seen.add(selectorsSum({ ...DEFAULT_LAYER, soundSource, modType, ampEG }));
        }
      }
    }
    expect(seen.size).toBe(sources.length * mods.length * envs.length);
  });
});
