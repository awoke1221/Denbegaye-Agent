'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowRight,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Sparkles,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { extractAvatarInitials, getUserDisplayName } from '@/lib/avatar-utils';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Builder', href: '/agent-builder' },
  { label: 'Office Intelligence', href: '/office-intelligence' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Blog', href: '/blog' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border-default)] bg-[rgba(248,246,244,0.8)] backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border-default)] bg-[var(--bg-soft)] shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
            <img
              src="/denbegnaye-logo.svg"
              alt="Denbegnaye Logo"
              className="h-5 w-5"
              onError={event => {
                event.currentTarget.src = '/placeholder-logo.png';
              }}
            />
          </div>
          <div className="leading-none">
            <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--text-secondary)]">
              Denbegnaye
            </div>
            <div className="mt-0.5 text-xs text-[var(--text-tertiary)]">AI growth suite</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 rounded-full border border-[var(--border-default)] bg-[rgba(255,255,255,0.42)] p-1 md:flex">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link rounded-full px-3 py-1.5 text-xs font-medium tracking-[0.04em] transition-colors ${
                isActive(link.href)
                  ? 'bg-[var(--button-bg)] text-[var(--button-text)] shadow-[0_12px_28px_rgba(15,23,42,0.08)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-subtle)] p-1.5 transition hover:border-[var(--border-strong)] hover:bg-[var(--bg-hover)]">
                    <Avatar className="h-8 w-8">
                      {(() => {
                        const src =
                          typeof user.user_metadata?.avatar_url === 'string'
                            ? user.user_metadata.avatar_url
                            : typeof user.user_metadata?.picture === 'string'
                              ? user.user_metadata.picture
                              : typeof user.photoURL === 'string'
                                ? user.photoURL
                                : undefined;

                        return (
                          <AvatarImage src={src} alt={getUserDisplayName(user) || 'User avatar'} />
                        );
                      })()}
                      <AvatarFallback>{extractAvatarInitials(user)}</AvatarFallback>
                    </Avatar>
                    <span className="hidden pr-1 text-sm font-medium text-[var(--text-primary)] xl:inline-block">
                      {getUserDisplayName(user) || 'Account'}
                    </span>
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="w-56 border-[var(--border-default)] bg-[rgba(255,255,255,0.96)] text-[var(--text-primary)] backdrop-blur-xl"
                >
                  <DropdownMenuItem onClick={() => router.push('/profile')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Profile & Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/pricing')}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pricing & Billing
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/admin')}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Admin dashboard
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={signOut} className="text-red-400">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
              >
                Login
              </Link>
              <Link href="/signup">
                <Button className="bg-[var(--button-bg)] text-[var(--button-text)] shadow-[0_12px_28px_rgba(15,23,42,0.09)]">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          {!user && (
            <Link href="/login">
              <Button size="sm" variant="outline" className="h-9 px-3 text-xs">
                Login
              </Button>
            </Link>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-default)] bg-[var(--bg-subtle)] text-[var(--text-primary)] shadow-[0_8px_20px_rgba(15,23,42,0.05)]">
                <Menu className="h-4 w-4" />
              </button>
            </SheetTrigger>

            <SheetContent
              side="right"
              className="border-l border-[var(--border-default)] bg-[rgba(248,246,244,0.98)] p-0"
            >
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-[var(--border-default)] px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--bg-soft)]">
                      <Sparkles className="h-4 w-4 text-[var(--text-primary)]" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                        Denbegnaye
                      </p>
                    </div>
                  </div>
                </div>

                <nav className="flex flex-col gap-2 p-4">
                  {navLinks.map(link => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
                        isActive(link.href)
                          ? 'bg-[var(--button-bg)] text-[var(--button-text)]'
                          : 'bg-[var(--bg-soft)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>

                {user ? (
                  <div className="mt-auto border-t border-[var(--border-default)] p-4">
                    <div className="mb-3 flex items-center gap-3 rounded-2xl bg-[var(--bg-soft)] p-3">
                      <Avatar className="h-10 w-10">
                        {(() => {
                          const src =
                            typeof user.user_metadata?.avatar_url === 'string'
                              ? user.user_metadata.avatar_url
                              : typeof user.user_metadata?.picture === 'string'
                                ? user.user_metadata.picture
                                : typeof user.photoURL === 'string'
                                  ? user.photoURL
                                  : undefined;

                          return (
                            <AvatarImage
                              src={src}
                              alt={getUserDisplayName(user) || 'User avatar'}
                            />
                          );
                        })()}
                        <AvatarFallback>{extractAvatarInitials(user)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                          {getUserDisplayName(user) || 'Account'}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)]">Workspace</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => router.push('/profile')}
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Profile
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => router.push('/admin')}
                      >
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Admin
                      </Button>
                      <Button
                        variant="destructive"
                        className="w-full justify-start"
                        onClick={signOut}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-auto space-y-2 border-t border-[var(--border-default)] p-4">
                    <Link href="/signup" className="block">
                      <Button className="w-full bg-[var(--button-bg)] text-[var(--button-text)]">
                        Get Started
                      </Button>
                    </Link>
                    <Link href="/login" className="block">
                      <Button variant="outline" className="w-full">
                        Login
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
