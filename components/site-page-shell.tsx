import * as React from 'react';
import { cn } from '@/lib/utils';

interface SitePageShellProps {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export function SitePageShell({ children, className, contentClassName }: SitePageShellProps) {
  return (
    <div className={cn('min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)]', className)}>
      <main
        className={cn('mx-auto w-full max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8', contentClassName)}
      >
        {children}
      </main>
    </div>
  );
}
