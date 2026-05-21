import { DEFAULT_LAYER, type LayerState } from './layer';

export interface PartState {
  layer1: LayerState;
  layer2: LayerState;

  pan: number;
  send: number;
  pitchQuant: boolean;

  drive: number;
  bitReduction: number;
  fold: number;
  dryGain: number;

  linked: boolean;
  comment: string;
}

export type PartParam = Exclude<keyof PartState, 'layer1' | 'layer2'>;

export type PartChange =
  | { kind: 'part'; param: PartParam; value: number | boolean | string }
  | {
      kind: 'layer';
      slot: 1 | 2;
      param: keyof LayerState;
      value: LayerState[keyof LayerState];
    }
  | { kind: 'layer-replace'; slot: 1 | 2; value: LayerState }
  | { kind: 'part-replace'; value: PartState };

export const DEFAULT_PART: PartState = {
  layer1: DEFAULT_LAYER,
  layer2: DEFAULT_LAYER,
  pan: 64,
  send: 0,
  pitchQuant: false,
  drive: 0,
  bitReduction: 0,
  fold: 0,
  dryGain: 64,
  linked: false,
  comment: '',
};
