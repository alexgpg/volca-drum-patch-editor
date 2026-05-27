import { PatchCode } from '../controls/PatchCode';
import { decodeKit, encodeKit } from '../../lib/patchCodec';
import type { KitState, PatchChange } from '../../types/patch';
import './Kit.css';

export interface KitProps {
  value: KitState;
  onChange: (change: PatchChange) => void;
  disabled?: boolean;
}

export function Kit({ value, onChange, disabled }: KitProps) {
  return (
    <details className="kit" open>
      <summary className="kit__title">
        Kit
        {value.comment && ` — ${value.comment}`}
      </summary>
      <div className="kit__body">
        <input
          type="text"
          className="kit__comment"
          value={value.comment}
          placeholder="kit name"
          disabled={disabled}
          onChange={(e) =>
            onChange({ kind: 'kit', param: 'comment', value: e.target.value })
          }
        />
        <PatchCode
          value={encodeKit(value)}
          placeholder={'# kit name\nvP1:...'}
          disabled={disabled}
          onApply={(raw) => {
            const parsed = decodeKit(raw);
            if (parsed) onChange({ kind: 'kit-replace', value: parsed });
            return parsed !== null;
          }}
        />
      </div>
    </details>
  );
}
