'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps
  extends Omit<React.ComponentProps<'input'>, 'type'> {
  iconLeft?: React.ReactNode;
}

function PasswordInput({ className, iconLeft, ...props }: PasswordInputProps) {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <div className="relative">
      {iconLeft && (
        <span className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
          {iconLeft}
        </span>
      )}
      <input
        type={showPassword ? 'text' : 'password'}
        data-slot="input"
        className={cn(
          'h-12 w-full rounded-(--input-radius) px-4 py-3 text-base',
          'bg-(--input-bg)',
          'border border-[rgb(var(--color-border))]',
          'text-[rgb(var(--color-foreground))]',
          'placeholder:text-[rgb(var(--color-foreground-subtle))]',
          'transition-all duration-(--transition-normal)',
          'focus:outline-none focus:border-[rgb(var(--color-border-focus))]',
          'focus:ring-[3px] focus:ring-[rgb(var(--color-ring)/0.5)]',
          'disabled:pointer-events-none disabled:opacity-(--state-disabled-opacity) disabled:bg-[rgb(var(--color-background-muted))]',
          'aria-invalid:border-[rgb(var(--color-border-error))] aria-invalid:ring-[rgb(var(--color-destructive)/0.2)]',
          'pr-12',
          iconLeft && 'pl-12',
          className
        )}
        {...props}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShowPassword(prev => !prev)}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
      >
        {showPassword ? (
          <EyeOff className="w-5 h-5" />
        ) : (
          <Eye className="w-5 h-5" />
        )}
      </button>
    </div>
  );
}

export { PasswordInput };
