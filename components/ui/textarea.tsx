import * as React from 'react';

import { cn } from '@/lib/utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'placeholder:text-[var(--text-tertiary)] focus-visible:border-[var(--input-focus)] focus-visible:ring-[var(--input-focus-ring)] flex field-sizing-content min-h-24 w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2.5 text-base text-[var(--text-primary)] shadow-[0_1px_2px_var(--shadow-soft)] transition-[color,background-color,border-color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
