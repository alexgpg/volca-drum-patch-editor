import { Layer } from '../Layer/Layer';
import { PatchCode } from '../controls/PatchCode';
import { Slider } from '../controls/Slider';
import { Toggle } from '../controls/Toggle';
import type { LayerState } from '../../types/layer';
import type { PartChange, PartParam, PartState } from '../../types/part';
import { decodePart, encodePart } from '../../lib/patchCodec';
import './Part.css';

export interface PartProps {
  value: PartState;
  onChange: (change: PartChange) => void;
  onReplace?: (next: PartState) => void;
  label?: string;
  name?: string;
  disabled?: boolean;
}

export function Part({
  value,
  onChange,
  onReplace,
  label = 'Part',
  name = 'part',
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
    <section className="part" aria-label={label}>
      <h2 className="part__title">{label}</h2>

      {onReplace && (
        <>
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
              if (parsed) onReplace(parsed);
              return parsed !== null;
            }}
          />
        </>
      )}

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
          label="Layer 1"
          name={`${name}-l1`}
          value={value.layer1}
          onChange={onLayer(1)}
          onReplace={onLayerReplace(1)}
          disabled={disabled}
        />
        <Layer
          label="Layer 2"
          name={`${name}-l2`}
          value={value.layer2}
          onChange={onLayer(2)}
          onReplace={onLayerReplace(2)}
          disabled={disabled}
        />
      </div>

      <div className="part__header">
        <div className="part__group">
          <h3 className="part__group-label">Output</h3>
          <Slider
            label="Pan"
            value={value.pan}
            onChange={(v) => onPart('pan', v)}
            disabled={disabled}
          />
          <Slider
            label="Send"
            value={value.send}
            onChange={(v) => onPart('send', v)}
            disabled={disabled}
          />
          <Toggle
            label="Pitch Quantization"
            value={value.pitchQuant}
            onChange={(v) => onPart('pitchQuant', v)}
            disabled={disabled}
          />
        </div>

        <div className="part__group">
          <h3 className="part__group-label">Wave folder</h3>
          <Slider
            label="Drive"
            value={value.drive}
            onChange={(v) => onPart('drive', v)}
            disabled={disabled}
          />
          <Slider
            label="Bit Reduction"
            value={value.bitReduction}
            onChange={(v) => onPart('bitReduction', v)}
            disabled={disabled}
          />
          <Slider
            label="Fold"
            value={value.fold}
            onChange={(v) => onPart('fold', v)}
            disabled={disabled}
          />
          <Slider
            label="Dry Gain"
            value={value.dryGain}
            onChange={(v) => onPart('dryGain', v)}
            disabled={disabled}
          />
        </div>
      </div>
    </section>
  );
}
