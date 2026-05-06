import type { KeyboardEvent } from 'react';
import { useEffect, useId, useRef, useState } from 'react';
import { labelToPitch, pitchToLabel } from '../../lib/devicePitchLabels';
import './PitchPicker.css';

export interface PitchPickerProps {
  value: number; // CC 0..127
  onChange: (cc: number) => void;
  disabled?: boolean;
}

const MIN = 0;
const MAX = 127;

function ccToDisplayPitch(cc: number): number {
  return cc === 127 ? 255 : cc * 2;
}

function displayPitchToCc(displayPitch: number): number | null {
  if (displayPitch === 255) return 127;
  if (displayPitch < 0 || displayPitch > 254) return null;
  if (displayPitch % 2 !== 0) return null;
  return displayPitch / 2;
}

const ALL_LABELS: string[] = Array.from(
  { length: 128 },
  (_, cc) => pitchToLabel(ccToDisplayPitch(cc)),
);

export function PitchPicker({ value, onChange, disabled }: PitchPickerProps) {
  const canonicalLabel = pitchToLabel(ccToDisplayPitch(value));
  const [draft, setDraft] = useState(canonicalLabel);
  const [invalid, setInvalid] = useState(false);
  const [lastValue, setLastValue] = useState(value);
  const [lastDisabled, setLastDisabled] = useState(!!disabled);
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const listboxId = `pitch-picker-${useId()}`;

  if (value !== lastValue || !!disabled !== lastDisabled) {
    setLastValue(value);
    setLastDisabled(!!disabled);
    setDraft(canonicalLabel);
    setInvalid(false);
  }

  useEffect(() => {
    if (open) {
      popoverRef.current?.children[value]?.scrollIntoView({ block: 'nearest' });
    }
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!popoverRef.current?.parentElement?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const commit = () => {
    if (draft === canonicalLabel) {
      setInvalid(false);
      return;
    }
    const parsedDisplayPitch = labelToPitch(draft);
    if (parsedDisplayPitch === null) {
      setInvalid(true);
      return;
    }
    const cc = displayPitchToCc(parsedDisplayPitch);
    if (cc === null) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    onChange(cc);
  };

  const step = (delta: number) => {
    const next = Math.min(MAX, Math.max(MIN, value + delta));
    if (next !== value) onChange(next);
  };

  const pick = (cc: number) => {
    setOpen(false);
    onChange(cc);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      step(1);
      if (!open) setOpen(true);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      step(-1);
      if (!open) setOpen(true);
    } else if (e.key === 'Enter') {
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      if (open) {
        e.preventDefault();
        setOpen(false);
      } else {
        setDraft(canonicalLabel);
        setInvalid(false);
        e.currentTarget.blur();
      }
    }
  };

  return (
    <div className="pitch-picker">
      <button
        type="button"
        className="pitch-picker__btn pitch-picker__step"
        onClick={() => step(-1)}
        disabled={disabled || value <= MIN}
        aria-label="One semitone down"
      >
        −
      </button>

      <div className="pitch-picker__field">
        <input
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          className={`pitch-picker__input${invalid ? ' pitch-picker__input--invalid' : ''}`}
          value={disabled ? '' : draft}
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          disabled={disabled}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={onKeyDown}
        />
        <button
          type="button"
          className="pitch-picker__btn pitch-picker__open"
          disabled={disabled}
          aria-label="Open note picker"
          aria-haspopup="listbox"
          tabIndex={-1}
          onClick={() => setOpen((o) => !o)}
        >
          ▾
        </button>
        {open && (
          <div
            ref={popoverRef}
            id={listboxId}
            className="pitch-picker__popover"
            role="listbox"
            aria-label="Notes"
          >
            {ALL_LABELS.map((label, cc) => (
              <button
                key={cc}
                type="button"
                role="option"
                tabIndex={-1}
                aria-selected={cc === value}
                className={`pitch-picker__option${cc === value ? ' is-selected' : ''}`}
                onClick={() => pick(cc)}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        className="pitch-picker__btn pitch-picker__step"
        onClick={() => step(1)}
        disabled={disabled || value >= MAX}
        aria-label="One semitone up"
      >
        +
      </button>
    </div>
  );
}
