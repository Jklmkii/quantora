import React from 'react';

interface NumericInputProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  disabled?: boolean;
  prefix?: string;
  suffix?: string;
  error?: string | null;
  helperText?: string;
  className?: string;
  allowNegative?: boolean;
}

/**
 * Mobile-friendly native input using <input type="text" inputMode="decimal">
 * Ensures numeric keypad on iOS/Android, supports negative sign,
 * prevents zoom via touch-action, guarantees >= 44px touch target.
 */
/**
 * 💡 What: Wrapped NumericInput with React.memo()
 * 🎯 Why: This component is rendered multiple times in forms (like PhysicsModule).
 * 📊 Impact: Prevents unnecessary re-renders of sibling inputs when one input's value changes, provided the parent passes stable onChange handlers.
 */
export const NumericInput: React.FC<NumericInputProps> = React.memo(({
  id,
  label,
  value,
  onChange,
  placeholder = '0',
  disabled = false,
  prefix,
  suffix,
  error,
  helperText,
  className = '',
  allowNegative = true,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;

    // Normalize comma to comma or dot based on what user types
    // Allow empty, negative sign, and numbers with at most one separator (dot or comma)
    if (raw === '') {
      onChange('');
      return;
    }

    if (allowNegative && (raw === '-' || raw === '+')) {
      onChange(raw === '-' ? '-' : '');
      return;
    }

    // Replace multiple dots or commas with a single one
    // Validate character set: digits, dot, comma, and optional leading minus
    const validPattern = allowNegative ? /^-?[0-9]*[.,]?[0-9]*$/ : /^[0-9]*[.,]?[0-9]*$/;

    if (validPattern.test(raw)) {
      onChange(raw);
    }
  };

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none"
        >
          {label}
        </label>
      )}

      <div
        className={`relative flex items-center rounded-xl border transition-all duration-200 bg-white dark:bg-slate-900 ${
          error
            ? 'border-red-500 ring-2 ring-red-500/20'
            : 'border-slate-200 dark:border-slate-800 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 dark:focus-within:border-indigo-400'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        {prefix && (
          <span className="pl-3.5 pr-1 text-sm font-semibold text-slate-400 dark:text-slate-500 select-none">
            {prefix}
          </span>
        )}

        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full bg-transparent px-3.5 py-3 min-h-[44px] text-base md:text-lg font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none touch-manipulation"
        />

        {value && !disabled && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="p-2 mr-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg transition-colors"
            title="Limpar campo"
            aria-label="Limpar campo"
          >
            <span className="text-xs font-bold bg-slate-200 dark:bg-slate-800 rounded-full w-4 h-4 flex items-center justify-center">
              ✕
            </span>
          </button>
        )}

        {suffix && (
          <span className="pr-3.5 pl-1 text-sm font-semibold text-slate-400 dark:text-slate-500 select-none">
            {suffix}
          </span>
        )}
      </div>

      {error && (
        <span className="text-xs font-medium text-red-500 dark:text-red-400 animate-pulse">
          {error}
        </span>
      )}

      {helperText && !error && (
        <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
          {helperText}
        </span>
      )}
    </div>
  );
});

NumericInput.displayName = 'NumericInput';
