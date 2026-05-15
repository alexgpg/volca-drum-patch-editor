import type { AmpEG, LayerState, ModType, SoundSource } from '../types/layer';

export type LayerSliderParam =
  | 'level'
  | 'pitch'
  | 'egAttack'
  | 'egRelease'
  | 'modAmount'
  | 'modRate';

export type PartSliderParam =
  | 'pan'
  | 'send'
  | 'drive'
  | 'bitReduction'
  | 'fold'
  | 'dryGain';

const LAYER_CC_L1: Record<LayerSliderParam, number> = {
  level: 17,
  egAttack: 20,
  egRelease: 23,
  pitch: 26,
  modAmount: 29,
  modRate: 46,
};

const LAYER_CC_L2: Record<LayerSliderParam, number> = {
  level: 18,
  egAttack: 21,
  egRelease: 24,
  pitch: 27,
  modAmount: 30,
  modRate: 47,
};

const LAYER_CC_BOTH: Record<LayerSliderParam, number> = {
  level: 19,
  egAttack: 22,
  egRelease: 25,
  pitch: 28,
  modAmount: 31,
  modRate: 48,
};

export type LayerSlot = 1 | 2 | 'both';

export function layerSliderCC(slot: LayerSlot, param: LayerSliderParam): number {
  if (slot === 'both') return LAYER_CC_BOTH[param];
  return slot === 1 ? LAYER_CC_L1[param] : LAYER_CC_L2[param];
}

export function selectorsCC(slot: LayerSlot): number {
  if (slot === 'both') return 16;
  return slot === 1 ? 14 : 15;
}

export const PART_CC: Record<PartSliderParam, number> = {
  pan: 10,
  send: 103,
  drive: 51,
  bitReduction: 49,
  fold: 50,
  dryGain: 52,
};

export const PITCH_QUANT_CC = 53;

const SOURCE_VALUE: Record<SoundSource, number> = {
  sine: 0,
  saw: 26,
  noiseHP: 52,
  noiseLP: 77,
  noiseBP: 103,
};

const MOD_VALUE: Record<ModType, number> = {
  envelope: 0,
  lfo: 9,
  random: 18,
};

const ENV_VALUE: Record<AmpEG, number> = {
  ad: 0,
  exp: 3,
  multi: 6,
};

export function selectorsSum(layer: LayerState): number {
  return SOURCE_VALUE[layer.soundSource] + MOD_VALUE[layer.modType] + ENV_VALUE[layer.ampEG];
}
