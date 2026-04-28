import './Slider.css';

export interface SliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  compact?: boolean;
}

export function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 127,
  disabled,
  compact,
}: SliderProps) {
  const commit = (raw: string) => {
    if (raw === '') return;
    const n = Number(raw);
    if (!Number.isFinite(n)) return;
    onChange(Math.min(max, Math.max(min, Math.round(n))));
  };
  return (
    <label className={`slider${compact ? ' slider--compact' : ''}`}>
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
  );
}
