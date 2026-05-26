import { Layer } from '../Layer/Layer';
import { PatchCode } from '../controls/PatchCode';
import { ScaledSlider } from '../controls/ScaledSlider';
import { Toggle } from '../controls/Toggle';
import type { LayerState } from '../../types/layer';
import type { PartChange, PartParam, PartState } from '../../types/part';
import { decodePart, encodePart } from '../../lib/patchCodec';
import type { PartPreset } from '../../lib/partLibrary';
import './Part.css';

export interface PartProps {
  value: PartState;
  onChange: (change: PartChange) => void;
  label?: string;
  name?: string;
  presets?: PartPreset[];
  disabled?: boolean;
}

export function Part({
  value,
  onChange,
  label = 'Part',
  name = 'part',
  presets = [],
  disabled,
}: PartProps) {
  const onPart = (param: PartParam, v: number | boolean | string) =>
    onChange({ kind: 'part', param, value: v });

  const onLayer =
    (slot: 1 | 2) =>
    <K extends keyof LayerState>(param: K, v: LayerState[K]) =>
      onChange({ kind: 'layer', slot, param, value: v });

  const onLayerReplace = (slot: 1 | 2) => (next: LayerState) =>
    onChange({ kind: 'layer-replace', slot, value: next });

  return (
    <details className="part" open>
      <summary className="part__title">
        {label}
        {value.comment && ` — ${value.comment}`}
      </summary>

      <div className="part__body">
        {presets.length > 0 && (
          <label className="part__preset">
            <span className="part__preset-label">Preset</span>
            <select
              className="part__preset-select"
              value=""
              disabled={disabled}
              onChange={(e) => {
                if (e.target.value === '') return;
                const preset = presets[Number(e.target.value)];
                if (preset) onChange({ kind: 'part-replace', value: preset.part });
              }}
            >
              <option value="" disabled>
                Choose a preset…
              </option>
              {presets.map((preset, i) => (
                <option key={i} value={i}>
                  {preset.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <input
          type="text"
          className="part__comment"
          value={value.comment}
          placeholder="comment"
          disabled={disabled}
          onChange={(e) => onPart('comment', e.target.value)}
        />
        <PatchCode
          value={encodePart(value)}
          placeholder="vP1:..."
          disabled={disabled}
          onApply={(raw) => {
            const parsed = decodePart(raw);
            if (parsed) onChange({ kind: 'part-replace', value: parsed });
            return parsed !== null;
          }}
        />

        <div className="part__link">
          <Toggle
            label="Link Layers"
            value={value.linked}
            onChange={(v) => onPart('linked', v)}
            disabled={disabled}
          />
        </div>

        <div className="part__layers">
          <Layer
            label={value.linked ? 'Layer 1-2' : 'Layer 1'}
            name={`${name}-l1`}
            value={value.layer1}
            onChange={onLayer(1)}
            onReplace={onLayerReplace(1)}
            disabled={disabled}
            pitchQuant={value.pitchQuant}
          />
          <Layer
            label="Layer 2"
            name={`${name}-l2`}
            value={value.layer2}
            onChange={onLayer(2)}
            onReplace={onLayerReplace(2)}
            disabled={disabled || value.linked}
            pitchQuant={value.pitchQuant}
          />
        </div>

        <div className="part__header">
          <div className="part__group">
            <h3 className="part__group-label">Output</h3>
            <ScaledSlider param="pan" cc={value.pan} onCc={(v) => onPart('pan', v)} disabled={disabled} />
            <ScaledSlider param="send" cc={value.send} onCc={(v) => onPart('send', v)} disabled={disabled} />
            <Toggle
              label="Pitch Quantization"
              value={value.pitchQuant}
              onChange={(v) => onPart('pitchQuant', v)}
              disabled={disabled}
            />
          </div>

          <div className="part__group">
            <h3 className="part__group-label">Wave folder</h3>
            <ScaledSlider param="drive" cc={value.drive} onCc={(v) => onPart('drive', v)} disabled={disabled} />
            <ScaledSlider param="bitReduction" cc={value.bitReduction} onCc={(v) => onPart('bitReduction', v)} disabled={disabled} />
            <ScaledSlider param="fold" cc={value.fold} onCc={(v) => onPart('fold', v)} disabled={disabled} />
            <ScaledSlider param="dryGain" cc={value.dryGain} onCc={(v) => onPart('dryGain', v)} disabled={disabled} />
          </div>
        </div>
      </div>
    </details>
  );
}
