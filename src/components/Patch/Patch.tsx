import { Part } from '../Part/Part';
import type { PartPreset } from '../../lib/partLibrary';
import type { PartIndex, PatchChange, PatchState } from '../../types/patch';
import './Patch.css';

export interface PatchProps {
  value: PatchState;
  onChange: (change: PatchChange) => void;
  presets?: PartPreset[];
  disabled?: boolean;
}

export function Patch({ value, onChange, presets = [], disabled }: PatchProps) {
  return (
    <div className="patch">
      {value.map((part, i) => {
        const partIndex = (i + 1) as PartIndex;
        return (
          <Part
            key={partIndex}
            value={part}
            onChange={(c) => onChange({ partIndex, change: c })}
            label={`Part ${partIndex}`}
            name={`p${partIndex}`}
            presets={presets}
            disabled={disabled}
          />
        );
      })}
    </div>
  );
}
