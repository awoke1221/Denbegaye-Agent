'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Compass,
  CornerDownLeft,
  FileSearch,
  LayoutTemplate,
  Search,
  Sparkles,
  Workflow,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const destinations = [
  {
    href: '/agent-builder',
    label: 'Agent Builder',
    description: 'Design your next automation workflow.',
    icon: Workflow,
  },
  {
    href: '/templates',
    label: 'Template library',
    description: 'Start with a proven growth playbook.',
    icon: LayoutTemplate,
  },
  {
    href: '/office-intelligence',
    label: 'Office Intelligence',
    description: 'Turn scattered work into clear action.',
    icon: Bot,
  },
];

export default function NotFound() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      router.push('/');
      return;
    }

    const match = destinations.find(destination =>
      `${destination.label} ${destination.description}`.toLowerCase().includes(normalizedQuery)
    );

    router.push(match?.href ?? `/blog?search=${encodeURIComponent(query.trim())}`);
  };

  return (
    <main className="page-shell relative isolate overflow-hidden text-[var(--text-primary)]">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-[#d9d1c2]/45 blur-3xl" />
        <div className="absolute -right-24 bottom-16 h-80 w-80 rounded-full bg-[#d7dfe0]/55 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-[var(--border-default)]" />
      </div>

      <div className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-7xl items-center px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="w-full">
          <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
            <section className="max-w-xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[rgba(255,255,255,0.58)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--text-secondary)] shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                <Compass className="h-3.5 w-3.5" />
                Signal lost
              </div>

              <h1 className="text-[clamp(4.75rem,14vw,10rem)] font-medium leading-[0.78] tracking-[-0.1em] text-[var(--text-primary)]">
                404
              </h1>
              <h2 className="mt-8 max-w-lg text-3xl font-medium leading-tight tracking-[-0.06em] sm:text-4xl">
                This workflow took an unexpected turn.
              </h2>
              <p className="mt-5 max-w-md text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
                The page you requested is no longer in this workspace, or it has not been wired up
                yet. Let&apos;s route you back to something useful.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  type="button"
                  onClick={() => router.push('/')}
                  className="bg-[var(--button-bg)] text-[var(--button-text)] shadow-[0_12px_28px_rgba(15,23,42,0.1)]"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Return home
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="border-[var(--border-default)] bg-[rgba(255,255,255,0.56)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                >
                  Go back
                </Button>
              </div>
            </section>

            <section aria-labelledby="recovery-heading" className="relative">
              <div className="absolute -inset-5 -z-10 rounded-[2.5rem] border border-[var(--border-default)] bg-[rgba(255,255,255,0.24)] blur-[1px]" />
              <div className="rounded-[2rem] border border-[var(--border-default)] bg-[rgba(255,255,255,0.68)] p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-7">
                <div className="flex items-start justify-between gap-4 border-b border-[var(--border-default)] pb-5">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--text-tertiary)]">
                      Recovery console
                    </p>
                    <h2
                      id="recovery-heading"
                      className="mt-2 text-xl font-medium tracking-[-0.04em]"
                    >
                      Find your next move
                    </h2>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--button-bg)] text-[var(--button-text)]">
                    <Sparkles className="h-4 w-4" />
                  </div>
                </div>

                <form onSubmit={handleSearch} className="mt-5">
                  <label htmlFor="page-search" className="sr-only">
                    Search Denbegnaye
                  </label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
                    <Input
                      id="page-search"
                      value={query}
                      onChange={event => setQuery(event.target.value)}
                      placeholder="Search a destination..."
                      className="h-12 border-[var(--border-default)] bg-[rgba(255,255,255,0.72)] pl-10 pr-24 text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
                    />
                    <button
                      type="submit"
                      aria-label="Search"
                      className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl bg-[var(--button-bg)] text-[var(--button-text)] transition hover:opacity-85"
                    >
                      <CornerDownLeft className="h-4 w-4" />
                    </button>
                  </div>
                </form>

                <div className="mt-6 space-y-2">
                  {destinations.map(destination => {
                    const Icon = destination.icon;

                    return (
                      <Link
                        key={destination.href}
                        href={destination.href}
                        className="group flex items-center gap-3 rounded-2xl border border-transparent p-3 transition hover:border-[var(--border-default)] hover:bg-[rgba(255,255,255,0.72)]"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--bg-soft)] text-[var(--text-primary)]">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium">{destination.label}</span>
                          <span className="mt-0.5 block truncate text-xs text-[var(--text-secondary)]">
                            {destination.description}
                          </span>
                        </span>
                        <ArrowRight className="h-4 w-4 text-[var(--text-tertiary)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--text-primary)]" />
                      </Link>
                    );
                  })}
                </div>

                <div className="mt-5 flex items-center gap-2 border-t border-[var(--border-default)] pt-5 text-xs text-[var(--text-tertiary)]">
                  <FileSearch className="h-3.5 w-3.5" />
                  <span>Try a destination, feature, or keyword.</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
