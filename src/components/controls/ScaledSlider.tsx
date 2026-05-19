import { ccToLcd, lcdRange, lcdToCcSnap, type ScaledParam } from '../../lib/deviceScale';
import { Slider } from './Slider';

const PARAM_LABEL: Record<ScaledParam, string> = {
  level: 'Level',
  egAttack: 'EG Attack',
  egRelease: 'EG Release',
  modAmount: 'Mod Amount',
  modRate: 'Mod Rate',
  pan: 'Pan',
  send: 'Send',
  drive: 'Drive',
  bitReduction: 'Bit Reduction',
  fold: 'Fold',
  dryGain: 'Dry Gain',
};

export interface ScaledSliderProps {
  param: ScaledParam;
  cc: number;
  onCc: (cc: number) => void;
  disabled?: boolean;
}

export function ScaledSlider({ param, cc, onCc, disabled }: ScaledSliderProps) {
  return (
    <Slider
      label={PARAM_LABEL[param]}
      {...lcdRange(param)}
      value={ccToLcd(param, cc)}
      onChange={(lcd) => onCc(lcdToCcSnap(param, lcd))}
      disabled={disabled}
    />
  );
}
