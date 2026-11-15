import React, { forwardRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  isPassword?: boolean;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', containerClassName = 'mb-4', label, error, isPassword, type, id, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);

    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className={`w-full ${containerClassName}`}>
        {label && (
          <label htmlFor={id} className="block font-bold text-base text-ink mb-2 text-left">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={id}
            type={inputType}
            className={`w-full px-4 py-3 bg-surface border border-[var(--color-line)] rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-ink-muted text-ink ${className}`}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink cursor-pointer"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          )}
        </div>
        {error && <p className="text-red-500 text-sm mt-1 text-left">{error}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', containerClassName = '', label, error, id, ...props }, ref) => (
    <div className={`w-full ${containerClassName}`}>
      {label && (
        <label htmlFor={id} className="block font-bold text-base text-ink mb-2 text-left">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={id}
        className={`w-full px-4 py-3 bg-surface border border-[var(--color-line)] rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-ink-muted text-ink ${className}`}
        {...props}
      />
      {error && <p className="text-red-500 text-sm mt-1 text-left">{error}</p>}
    </div>
  ),
);

Textarea.displayName = 'Textarea';
