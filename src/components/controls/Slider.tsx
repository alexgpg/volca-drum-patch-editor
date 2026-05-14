import type { ReactNode } from 'react';
import { useState } from 'react';
import './Slider.css';

interface SliderBaseProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}

type SliderBelow =
  | { below?: undefined; belowLabel?: undefined }
  | { below: ReactNode; belowLabel: string };

export type SliderProps = SliderBaseProps & SliderBelow;

export function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 127,
  step = 1,
  disabled,
  below,
  belowLabel,
}: SliderProps) {
  // Number input is draft-state + commit-on-blur so typing a multi-digit
  // value isn't disturbed by upstream value normalisation (e.g. the
  // Pitch slider snapping odd display values to the nearest even CC).
  const [draft, setDraft] = useState(String(value));
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    setDraft(String(value));
  }

  const commit = () => {
    const n = Number(draft);
    if (Number.isFinite(n) && draft !== '') {
      onChange(Math.min(max, Math.max(min, Math.round(n))));
    }
    // Always re-sync to canonical: if upstream changed value, the
    // render-phase sync overwrites this; if it didn't (snap to same
    // CC, invalid input, etc.) we still want draft == value.
    setDraft(String(value));
  };

  return (
    <div className="slider">
      <label className="slider__row">
        <span className="slider__label">{label}</span>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <input
          type="number"
          className="slider__value"
          min={min}
          max={max}
          step={step}
          value={draft}
          disabled={disabled}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.currentTarget.blur();
            } else if (e.key === 'Escape') {
              setDraft(String(value));
              e.currentTarget.blur();
            }
          }}
        />
      </label>
      {below && (
        <div className="slider__below">
          <span className="slider__label">{belowLabel}</span>
          {below}
        </div>
      )}
    </div>
  );
}
