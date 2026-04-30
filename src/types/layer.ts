export type SoundSource = 'sine' | 'saw' | 'noiseHP' | 'noiseLP' | 'noiseBP';
export type ModType = 'envelope' | 'lfo' | 'random';
export type AmpEG = 'ad' | 'exp' | 'multi';

export interface LayerState {
  soundSource: SoundSource;
  modType: ModType;
  ampEG: AmpEG;
  level: number;
  pitch: number;
  egAttack: number;
  egRelease: number;
  modAmount: number;
  modRate: number;
  comment: string;
}

export type LayerParam = keyof LayerState;

export const DEFAULT_LAYER: LayerState = {
  soundSource: 'sine',
  modType: 'envelope',
  ampEG: 'ad',
  level: 100,
  pitch: 64,
  egAttack: 0,
  egRelease: 64,
  modAmount: 0,
  modRate: 64,
  comment: '',
};
