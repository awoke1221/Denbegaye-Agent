'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { extractAvatarInitials, getUserDisplayName } from '@/lib/avatar-utils';
import { Button } from '@/components/ui/button';
import {
  LogOut,
  Bot,
  Workflow,
  Settings,
  Play,
  BookOpen,
  CreditCard,
  Wrench,
  Sparkles,
  ArrowRight,
  Zap,
  ShieldCheck,
  Layers3,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

const navLinks = [
  { label: 'Platform', href: '/agent-builder' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Templates', href: '/templates' },
  { label: 'Blog', href: '/blog' },
];

export default function HomePage() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen page-shell text-white">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="orb orb-cyan" />
        <div className="orb orb-violet" />
        <div className="orb orb-blue" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/55 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-500 shadow-[0_0_30px_rgba(56,189,248,0.45)]">
              <img
                src="/denbegnaye-logo.svg"
                alt="Denbegnaye Logo"
                className="h-6 w-6"
                onError={e => {
                  e.currentTarget.src = '/placeholder-logo.png';
                }}
              />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-[0.18em] text-slate-100 uppercase">
                Denbegnaye
              </h1>
            </div>
          </div>

          <nav className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-2 shadow-lg shadow-slate-950/30 md:flex">
            {navLinks.map(link => (
              <Link
                key={link.label}
                href={link.href}
                className="nav-link rounded-full px-4 py-2 text-sm font-medium text-slate-200 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Button
                  onClick={() => router.push('/agent-builder')}
                  className="hidden bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_16px_40px_rgba(34,211,238,0.35)] sm:inline-flex"
                >
                  <Wrench className="mr-2 h-4 w-4" />
                  Builder
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1.5 transition hover:border-cyan-400/40 hover:bg-white/10">
                      <Avatar>
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
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent className="border-white/10 bg-slate-950/95 text-slate-100 backdrop-blur-xl">
                    <DropdownMenuItem onClick={() => router.push('/profile')}>
                      <Settings className="mr-2 h-4 w-4" />
                      Profile & Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/pricing')}>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Pricing & Billing
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
                  className="hidden text-sm font-medium text-slate-200 md:inline-flex"
                >
                  Login
                </Link>
                <Link href="/signup">
                  <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_16px_40px_rgba(34,211,238,0.35)]">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-4 pb-24 pt-12 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_40px_120px_rgba(15,23,42,0.9)] backdrop-blur-xl md:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(99,102,241,0.18),transparent_30%)]" />

          <div className="relative grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="text-left">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
                <Sparkles className="h-3.5 w-3.5" />
                AI automation platform
              </div>

              <h2 className="max-w-xl text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                Build AI Agents
                <span className="mt-2 block bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                  Without Limits
                </span>
              </h2>

              <p className="mt-6 max-w-xl text-base text-slate-300 sm:text-lg">
                Design, automate, and scale powerful AI workflows with a modern visual builder built
                for teams who want speed, clarity, and real business outcomes.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Button
                  size="lg"
                  onClick={() => router.push('/agent-builder')}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 px-7 py-6 text-base font-semibold text-white shadow-[0_20px_40px_rgba(59,130,246,0.35)]"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Start Building
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => router.push('/blog')}
                  className="border-white/15 bg-white/5 px-7 py-6 text-base font-semibold text-white hover:border-cyan-300/40 hover:bg-white/10"
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  Explore Blog
                </Button>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-slate-300">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  Secure workflows
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-400" />
                  Real-time execution
                </div>
                <div className="flex items-center gap-2">
                  <Layers3 className="h-4 w-4 text-violet-400" />
                  Multi-model orchestration
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="glass-panel relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-900/70 p-4 shadow-[0_25px_70px_rgba(15,23,42,0.8)]">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
                    Live
                  </span>
                </div>

                <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-950/90 to-slate-900 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                        Agent workflow
                      </p>
                      <h3 className="mt-2 text-xl font-semibold text-white">
                        AI Agent Launch Strategy
                      </h3>
                    </div>
                    <div className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1 text-xs font-medium text-cyan-200">
                      Ready
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-300">
                          <Bot className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-100">Goal Mapping</p>
                          <p className="text-xs text-slate-400">Completed</p>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-400" />
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/15 text-violet-300">
                          <Workflow className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-100">Prompt Strategy</p>
                          <p className="text-xs text-slate-400">Running</p>
                        </div>
                      </div>
                      <div className="h-2 w-16 overflow-hidden rounded-full bg-slate-800">
                        <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-300">
                          <Settings className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-100">Tool Routing</p>
                          <p className="text-xs text-slate-400">Queued</p>
                        </div>
                      </div>
                      <span className="text-xs text-slate-400">3 min</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-20">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
                Why teams choose us
              </p>
              <h3 className="mt-3 text-3xl font-bold tracking-tight text-white">
                Built for modern AI operations
              </h3>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            <div className="feature-card group rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-cyan-300">
                <Bot className="h-6 w-6" />
              </div>
              <h4 className="text-xl font-semibold text-white">AI workflows</h4>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Create intelligent multi-step workflows that combine models, prompts, and actions in
                a single orchestration flow.
              </p>
            </div>

            <div className="feature-card group rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 text-violet-300">
                <Workflow className="h-6 w-6" />
              </div>
              <h4 className="text-xl font-semibold text-white">Visual builder</h4>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Organize nodes, connect logic, and design automation with an intuitive drag-and-drop
                experience.
              </p>
            </div>

            <div className="feature-card group rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-300">
                <Settings className="h-6 w-6" />
              </div>
              <h4 className="text-xl font-semibold text-white">Service integrations</h4>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Connect APIs, triggers, webhooks, and external systems to power end-to-end automated
                operations.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-20 rounded-[2rem] border border-white/10 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-violet-500/10 p-8 md:p-12">
          <div className="flex flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
                Ready to go
              </p>
              <h3 className="mt-3 text-3xl font-bold text-white">
                Start building your AI system today
              </h3>
              <p className="mt-3 max-w-xl text-slate-300">
                Launch your next workflow with modern automation, flexible orchestration, and
                precise execution control.
              </p>
            </div>

            <Button
              size="lg"
              onClick={() => router.push('/agent-builder')}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-6 text-base font-semibold text-white shadow-[0_20px_40px_rgba(34,211,238,0.35)]"
            >
              Launch Builder
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
