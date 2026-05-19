// CC ↔ device-LCD conversion for every non-pitch numeric parameter.
//
// The Volca Drum's LCD shows ranges like 0..255 (for "doubler" params
// like Level, Drive) and -100..+100 (for bipolar "hundred" params like
// Mod Amount, Pan, Dry Gain). On the wire those map onto MIDI CC 0..127.
// The two transforms below are copied verbatim from synthmata
// (volca-drum/index.html L12-14), which has been validated against the
// physical device — Korg's manual is silent on LCD ranges.
//
// Pitch has its own home in devicePitch.ts (it adds note-name semantics
// on top of the same doubler shape).

export type ScaledParam =
  // layer
  | 'level'
  | 'egAttack'
  | 'egRelease'
  | 'modAmount'
  | 'modRate'
  // part
  | 'pan'
  | 'send'
  | 'drive'
  | 'bitReduction'
  | 'fold'
  | 'dryGain';

type Transform = 'doubler' | 'hundred';

const PARAM_TRANSFORM: Record<ScaledParam, Transform> = {
  level: 'doubler',
  egAttack: 'doubler',
  egRelease: 'doubler',
  modAmount: 'hundred',
  modRate: 'doubler',
  pan: 'hundred',
  send: 'doubler',
  drive: 'doubler',
  bitReduction: 'doubler',
  fold: 'doubler',
  dryGain: 'hundred',
};

function doubler(cc: number): number {
  return cc === 127 ? 255 : cc * 2;
}

// Bipolar transform. The double-round is deliberate — it matches the
// LCD steps synthmata derived from the device. Do not "simplify" to
// round((cc-64)*100/64); the two formulas disagree by 1 at some CCs.
function hundred(cc: number): number {
  if (cc === 127) return 100;
  return Math.round(Math.round(((cc - 64) / 64) * 200) / 2);
}

function snapInv(transform: Transform, lcd: number): number {
  const { min, max } = transform === 'doubler' ? { min: 0, max: 255 } : { min: -100, max: 100 };
  const clamped = Math.max(min, Math.min(max, lcd));
  const f = transform === 'doubler' ? doubler : hundred;
  let bestCc = 0;
  let bestDist = Infinity;
  for (let cc = 0; cc <= 127; cc++) {
    const dist = Math.abs(f(cc) - clamped);
    // `<=` so ties resolve to the higher CC — matches displayPitchToCcSnap.
    if (dist <= bestDist) {
      bestDist = dist;
      bestCc = cc;
    }
  }
  return bestCc;
}

export function ccToLcd(param: ScaledParam, cc: number): number {
  return PARAM_TRANSFORM[param] === 'doubler' ? doubler(cc) : hundred(cc);
}

export function lcdToCcSnap(param: ScaledParam, lcd: number): number {
  return snapInv(PARAM_TRANSFORM[param], lcd);
}

export interface LcdRange {
  min: number;
  max: number;
  step: number;
}

export function lcdRange(param: ScaledParam): LcdRange {
  return PARAM_TRANSFORM[param] === 'doubler'
    ? { min: 0, max: 255, step: 2 }
    : { min: -100, max: 100, step: 1 };
}

export function isValidLcd(param: ScaledParam, n: number): boolean {
  if (!Number.isInteger(n)) return false;
  const { min, max } = lcdRange(param);
  return n >= min && n <= max;
}
