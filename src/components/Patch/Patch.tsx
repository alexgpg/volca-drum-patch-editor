import { Part } from '../Part/Part';
import type { PartState } from '../../types/part';
import type { PartIndex, PatchChange, PatchState } from '../../types/patch';
import './Patch.css';

export interface PatchProps {
  value: PatchState;
  onChange: (change: PatchChange) => void;
  onPartReplace?: (partIndex: PartIndex, next: PartState) => void;
  disabled?: boolean;
}

export function Patch({
  value,
  onChange,
  onPartReplace,
  disabled,
}: PatchProps) {
  return (
    <div className="patch">
      {value.map((part, i) => {
        const partIndex = (i + 1) as PartIndex;
        return (
          <Part
            key={partIndex}
            value={part}
            onChange={(c) => onChange({ partIndex, change: c })}
            onReplace={
              onPartReplace
                ? (next) => onPartReplace(partIndex, next)
                : undefined
            }
            label={`Part ${partIndex}`}
            name={`p${partIndex}`}
            disabled={disabled}
          />
        );
      })}
    </div>
  );
}
