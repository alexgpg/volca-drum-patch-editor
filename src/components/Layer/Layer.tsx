import type { ChangeEvent } from 'react';
import { IconRadioGroup } from '../controls/IconRadioGroup';
import { PatchCode } from '../controls/PatchCode';
import { PitchPicker } from '../controls/PitchPicker';
import { Slider } from '../controls/Slider';
import type {
  AmpEG,
  LayerState,
  ModType,
  SoundSource,
} from '../../types/layer';
import { ccToDisplayPitch, displayPitchToCcSnap } from '../../lib/devicePitch';
import { decodeLayer, encodeLayer } from '../../lib/patchCodec';
import './Layer.css';

export interface LayerProps {
  value: LayerState;
  onChange: <K extends keyof LayerState>(param: K, value: LayerState[K]) => void;
  onReplace?: (next: LayerState) => void;
  label?: string;
  name?: string;
  disabled?: boolean;
  pitchQuant?: boolean;
}

const SOUND_OPTIONS: { value: SoundSource; label: string }[] = [
  { value: 'sine', label: 'Sine' },
  { value: 'saw', label: 'Saw' },
  { value: 'noiseHP', label: 'HP' },
  { value: 'noiseLP', label: 'LP' },
  { value: 'noiseBP', label: 'BP' },
];

const MOD_OPTIONS: { value: ModType; label: string }[] = [
  { value: 'envelope', label: 'Env' },
  { value: 'lfo', label: 'LFO' },
  { value: 'random', label: 'Rnd' },
];

const ENV_OPTIONS: { value: AmpEG; label: string }[] = [
  { value: 'ad', label: 'AD' },
  { value: 'exp', label: 'Exp' },
  { value: 'multi', label: 'Multi' },
];

export function Layer({
  value,
  onChange,
  onReplace,
  label = 'Layer',
  name = 'layer',
  disabled,
  pitchQuant,
}: LayerProps) {
  const onCommentInput = (e: ChangeEvent<HTMLInputElement>) =>
    onChange('comment', e.target.value);

  return (
    <section className="layer" aria-label={label}>
      <h3 className="layer__title">
        {label}
        {value.comment && ` — ${value.comment}`}
      </h3>

      {onReplace && (
        <>
          <input
            type="text"
            className="layer__comment"
            value={value.comment}
            placeholder="comment"
            disabled={disabled}
            onChange={onCommentInput}
          />
          <PatchCode
            value={encodeLayer(value)}
            placeholder="vL1:..."
            disabled={disabled}
            onApply={(raw) => {
              const parsed = decodeLayer(raw);
              if (parsed) onReplace(parsed);
              return parsed !== null;
            }}
          />
        </>
      )}

      <div className="layer__radios">
        <IconRadioGroup
          label="Sound Source"
          name={`${name}-source`}
          value={value.soundSource}
          options={SOUND_OPTIONS}
          onChange={(v) => onChange('soundSource', v)}
          disabled={disabled}
        />
        <IconRadioGroup
          label="Mod Type"
          name={`${name}-mod`}
          value={value.modType}
          options={MOD_OPTIONS}
          onChange={(v) => onChange('modType', v)}
          disabled={disabled}
        />
        <IconRadioGroup
          label="Amp EG"
          name={`${name}-env`}
          value={value.ampEG}
          options={ENV_OPTIONS}
          onChange={(v) => onChange('ampEG', v)}
          disabled={disabled}
        />
      </div>

      <div className="layer__sliders">
        <Slider
          label="Level"
          value={value.level}
          onChange={(v) => onChange('level', v)}
          disabled={disabled}
        />
        <Slider
          label="Pitch"
          min={0}
          max={255}
          step={2}
          value={ccToDisplayPitch(value.pitch)}
          onChange={(d) => onChange('pitch', displayPitchToCcSnap(d))}
          disabled={disabled}
          belowLabel="Note"
          below={
            <PitchPicker
              value={value.pitch}
              onChange={(v) => onChange('pitch', v)}
              disabled={disabled || !pitchQuant}
            />
          }
        />
        <Slider
          label="EG Attack"
          value={value.egAttack}
          onChange={(v) => onChange('egAttack', v)}
          disabled={disabled}
        />
        <Slider
          label="EG Release"
          value={value.egRelease}
          onChange={(v) => onChange('egRelease', v)}
          disabled={disabled}
        />
        <Slider
          label="Mod Amount"
          value={value.modAmount}
          onChange={(v) => onChange('modAmount', v)}
          disabled={disabled}
        />
        <Slider
          label="Mod Rate"
          value={value.modRate}
          onChange={(v) => onChange('modRate', v)}
          disabled={disabled}
        />
      </div>
    </section>
  );
}
