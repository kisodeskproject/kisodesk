// components/ui/Input.tsx
'use client';

import { InputHTMLAttributes, forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-(--text-primary) transition-colors"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={cn(
            'w-full rounded-lg border border-(--border-card) bg-(--bg-secondary) px-3 py-2.5 text-sm text-(--text-primary) shadow-sm transition-[border-color,box-shadow] duration-200',
            'focus:outline-none focus:ring-2 focus:ring-(--accent-blue-border) focus:border-(--accent-blue)',
            'disabled:bg-(--bg-card-hover) disabled:text-(--text-tertiary) disabled:cursor-not-allowed',
            error
              ? 'border-(--accent-red-border) focus:border-(--accent-red) focus:ring-(--accent-red-border)'
              : '',
            className,
          )}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-sm text-(--accent-red)" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

export default Input;
