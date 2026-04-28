import './Toggle.css';

export interface ToggleProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

export function Toggle({ label, value, onChange, disabled }: ToggleProps) {
  return (
    <label className="toggle">
      <span className="toggle__label">{label}</span>
      <input
        type="checkbox"
        className="toggle__input"
        checked={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="toggle__state">{value ? 'On' : 'Off'}</span>
    </label>
  );
}
