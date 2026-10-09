import { useId } from 'react';
import type { ReactNode } from 'react';

interface ChoiceProps<T extends string> {
  label: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
  hint?: string;
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  hint,
}: ChoiceProps<T>) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        value={value}
        aria-describedby={hint ? `${id}-hint` : undefined}
        onChange={(event) => onChange(event.target.value as T)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint ? (
        <p id={`${id}-hint`} className="hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function CheckField({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: string;
}) {
  const id = useId();
  return (
    <div className="field field-check">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        aria-describedby={hint ? `${id}-hint` : undefined}
        onChange={(event) => onChange(event.target.checked)}
      />
      <label htmlFor={id}>{label}</label>
      {hint ? (
        <p id={`${id}-hint`} className="hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  min = 0,
  step = 100,
  hint,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  step?: number;
  hint?: string;
}) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        step={step}
        value={value}
        aria-describedby={hint ? `${id}-hint` : undefined}
        onChange={(event) => {
          const next = event.target.valueAsNumber;
          if (Number.isFinite(next) && next >= min) onChange(next);
        }}
      />
      {hint ? (
        <p id={`${id}-hint`} className="hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  multiline = false,
  hint,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  hint?: string;
  placeholder?: string;
}) {
  const id = useId();
  const common = {
    id,
    value,
    placeholder,
    'aria-describedby': hint ? `${id}-hint` : undefined,
  };
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {multiline ? (
        <textarea
          {...common}
          rows={3}
          spellCheck={false}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          {...common}
          type="text"
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {hint ? (
        <p id={`${id}-hint`} className="hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function RadioGroup<T extends string>({
  legend,
  name,
  value,
  options,
  onChange,
  hint,
}: {
  legend: string;
  name: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
  hint?: ReactNode;
}) {
  const id = useId();
  return (
    <fieldset className="radios" aria-describedby={hint ? `${id}-hint` : undefined}>
      <legend>{legend}</legend>
      {options.map((option) => (
        <label key={option.value} className="radio">
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
          />
          {option.label}
        </label>
      ))}
      {hint ? (
        <p id={`${id}-hint`} className="hint">
          {hint}
        </p>
      ) : null}
    </fieldset>
  );
}
