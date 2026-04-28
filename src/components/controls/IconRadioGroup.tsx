import './IconRadioGroup.css';

export interface IconRadioOption<T extends string> {
  value: T;
  label: string;
  iconSrc?: string;
}

export interface IconRadioGroupProps<T extends string> {
  label: string;
  name: string;
  value: T;
  options: IconRadioOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
}

export function IconRadioGroup<T extends string>({
  label,
  name,
  value,
  options,
  onChange,
  disabled,
}: IconRadioGroupProps<T>) {
  return (
    <fieldset className="icon-radio-group" disabled={disabled}>
      <legend className="icon-radio-group__label">{label}</legend>
      <div className="icon-radio-group__options">
        {options.map((opt) => {
          const id = `${name}-${opt.value}`;
          const checked = opt.value === value;
          return (
            <label
              key={opt.value}
              htmlFor={id}
              className={`icon-radio-group__option${checked ? ' is-checked' : ''}`}
              title={opt.label}
            >
              <input
                type="radio"
                id={id}
                name={name}
                value={opt.value}
                checked={checked}
                onChange={() => onChange(opt.value)}
              />
              {opt.iconSrc ? (
                <img src={opt.iconSrc} alt={opt.label} />
              ) : (
                <span className="icon-radio-group__option-text">
                  {opt.label}
                </span>
              )}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
