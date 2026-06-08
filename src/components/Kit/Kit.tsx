import { PatchCode } from '../controls/PatchCode';
import { decodeKit, encodeKit } from '../../lib/patchCodec';
import type { KitState, PartialKit, PatchChange } from '../../types/patch';
import './Kit.css';

export interface KitProps {
  value: KitState;
  onChange: (change: PatchChange) => void;
  kits?: PartialKit[];
  disabled?: boolean;
}

export function Kit({ value, onChange, kits = [], disabled }: KitProps) {
  return (
    <details className="kit" open>
      <summary className="kit__title">
        Kit
        {value.comment && ` — ${value.comment}`}
      </summary>
      <div className="kit__body">
        {kits.length > 0 && (
          <label className="kit__preset">
            <span className="kit__preset-label">Kit</span>
            <select
              className="kit__preset-select"
              value=""
              disabled={disabled}
              onChange={(e) => {
                if (e.target.value === '') return;
                const kit = kits[Number(e.target.value)];
                if (kit) onChange({ kind: 'kit-replace', value: kit });
              }}
            >
              <option value="" disabled>
                Choose a kit…
              </option>
              {kits.map((kit, i) => (
                <option key={i} value={i}>
                  {kit.comment.trim() === '' ? '(unnamed)' : kit.comment}
                </option>
              ))}
            </select>
          </label>
        )}
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
