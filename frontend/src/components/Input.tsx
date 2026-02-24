import { InputHTMLAttributes, useState } from 'react';
import { Eye, EyeOff, Search } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[0.875rem] font-medium text-[var(--text-primary)]">
          {label}
        </label>
      )}
      <input
        className={`
          h-10 px-3
          bg-[var(--surface-1)]
          border border-[var(--border-default)]
          rounded-[var(--radius-md)]
          text-[var(--text-primary)]
          placeholder:text-[var(--text-muted)]
          focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-150
          ${error ? 'border-[var(--state-error)] focus:ring-[var(--state-error)]' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-caption text-[var(--state-error)]">{error}</p>
      )}
    </div>
  );
}

export function PasswordInput({ label, error, className = '', ...props }: InputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[0.875rem] font-medium text-[var(--text-primary)]">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          className={`
            h-10 px-3 pr-10
            w-full
            bg-[var(--surface-1)]
            border border-[var(--border-default)]
            rounded-[var(--radius-md)]
            text-[var(--text-primary)]
            placeholder:text-[var(--text-muted)]
            focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-150
            ${error ? 'border-[var(--state-error)] focus:ring-[var(--state-error)]' : ''}
            ${className}
          `}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && (
        <p className="text-caption text-[var(--state-error)]">{error}</p>
      )}
    </div>
  );
}

export function SearchInput({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
      <input
        type="search"
        className={`
          h-10 pl-10 pr-3
          w-full
          bg-[var(--surface-1)]
          border border-[var(--border-default)]
          rounded-[var(--radius-md)]
          text-[var(--text-primary)]
          placeholder:text-[var(--text-muted)]
          focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent
          transition-all duration-150
          ${className}
        `}
        {...props}
      />
    </div>
  );
}

interface SelectProps extends InputHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, options, className = '', ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[0.875rem] font-medium text-[var(--text-primary)]">
          {label}
        </label>
      )}
      <select
        className={`
          h-10 px-3
          bg-[var(--surface-1)]
          border border-[var(--border-default)]
          rounded-[var(--radius-md)]
          text-[var(--text-primary)]
          focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-150
          ${className}
        `}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
