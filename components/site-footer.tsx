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
    <footer className="border-t border-[var(--border-default)] bg-[rgba(255,255,255,0.6)] backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
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
                <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                  Denbegnaye
                </div>
                <div className="mt-0.5 text-xs text-[var(--text-tertiary)]">AI growth suite</div>
              </div>
            </Link>

            <p className="mt-5 max-w-sm text-sm leading-7 text-[var(--text-secondary)]">
              Build, automate, and scale AI growth workflows with a platform designed for creative
              teams and product operators.
            </p>
          </div>

          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                {group}
              </h3>
              <ul className="mt-4 space-y-3 text-sm text-[var(--text-secondary)]">
                {links.map(link => (
                  <li key={link.href}>
                    <Link href={link.href} className="transition hover:text-[var(--text-primary)]">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-[var(--border-default)] pt-6 text-sm text-[var(--text-secondary)] sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Denbegnaye. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="hover:text-[var(--text-primary)]">
              Pricing
            </Link>
            <Link href="/blog" className="hover:text-[var(--text-primary)]">
              Blog
            </Link>
            <Link href="/login" className="hover:text-[var(--text-primary)]">
              Login
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
