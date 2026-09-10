'use client';

import Link from 'next/link';

const footerLinks = {
  Platform: [
    { label: 'Agent Builder', href: '/agent-builder' },
    { label: 'Office Intelligence', href: '/office-intelligence' },
    { label: 'Templates', href: '/templates' },
  ],
  Company: [
    { label: 'Home', href: '/' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Blog', href: '/blog' },
  ],
  Resources: [
    { label: 'Login', href: '/login' },
    { label: 'Sign up', href: '/signup' },
    { label: 'Admin', href: '/admin' },
  ],
};

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-[var(--border-default)] bg-[linear-gradient(135deg,rgba(255,255,255,0.8),rgba(244,241,235,0.9))] backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-14 lg:px-10 lg:py-16">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 sm:gap-x-8 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:gap-10">
          <div className="col-span-2 min-w-0 lg:col-span-1">
            <Link
              href="/"
              className="group inline-flex items-center gap-3 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-4"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border-default)] bg-[var(--bg-soft)]">
                <img
                  src="/denbegnaye-logo.svg"
                  alt="Denbegnaye Logo"
                  className="h-5 w-5"
                  onError={event => {
                    event.currentTarget.src = '/placeholder-logo.png';
                  }}
                />
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)] transition-colors group-hover:text-[var(--text-primary)]">
                  Denbegnaye
                </div>
                <div className="mt-0.5 text-xs text-[var(--text-tertiary)]">AI growth suite</div>
              </div>
            </Link>

            <p className="mt-5 max-w-sm text-sm leading-6 text-[var(--text-secondary)] sm:leading-7">
              Build, automate, and scale AI growth workflows with a platform designed for creative
              teams and product operators.
            </p>
          </div>

          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)] sm:text-xs">
                {group}
              </h3>
              <ul className="mt-4 space-y-2.5 text-sm text-[var(--text-secondary)] sm:space-y-3">
                {links.map(link => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-flex min-h-8 items-center rounded-md transition-colors hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-[var(--border-default)] pt-6 text-xs text-[var(--text-secondary)] sm:mt-14 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:text-sm">
          <p>© 2026 Denbegnaye. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:justify-end sm:gap-x-5">
            <Link
              href="/pricing"
              className="rounded-md transition-colors hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2"
            >
              Pricing
            </Link>
            <Link
              href="/blog"
              className="rounded-md transition-colors hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2"
            >
              Blog
            </Link>
            <Link
              href="/login"
              className="rounded-md transition-colors hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
