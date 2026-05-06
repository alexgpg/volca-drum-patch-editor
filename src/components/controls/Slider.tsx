import type { ReactNode } from 'react';
import './Slider.css';

interface SliderBaseProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
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
  disabled,
  below,
  belowLabel,
}: SliderProps) {
  const commit = (raw: string) => {
    if (raw === '') return;
    const n = Number(raw);
    if (!Number.isFinite(n)) return;
    onChange(Math.min(max, Math.max(min, Math.round(n))));
  };
  return (
    <div className="slider">
      <label className="slider__row">
        <span className="slider__label">{label}</span>
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <input
          type="number"
          className="slider__value"
          min={min}
          max={max}
          value={value}
          disabled={disabled}
          onChange={(e) => commit(e.target.value)}
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
