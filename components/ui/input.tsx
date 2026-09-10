import * as React from 'react';

import { cn } from '@/lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'file:text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] selection:bg-[var(--accent-soft)] selection:text-[var(--text-primary)] h-10 w-full min-w-0 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-base text-[var(--text-primary)] shadow-[0_1px_2px_var(--shadow-soft)] transition-[color,background-color,border-color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-[var(--input-focus)] focus-visible:ring-[3px] focus-visible:ring-[var(--input-focus-ring)]',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        className
      )}
      {...props}
    />
  );
}

export { Input };
