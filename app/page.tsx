'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Bot,
  Workflow,
  Settings,
  Play,
  BookOpen,
  Sparkles,
  ArrowRight,
  Zap,
  ShieldCheck,
  Layers3,
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="page-shell min-h-screen text-[var(--text-primary)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="orb orb-cyan" />
        <div className="orb orb-violet" />
        <div className="orb orb-blue" />
      </div>

      <main className="relative mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[2rem] border border-[var(--border-default)] bg-[rgba(255,255,255,0.52)] p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)] backdrop-blur-xl md:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(17,24,39,0.04),transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(17,24,39,0.03),transparent_30%)]" />

          <div className="relative grid items-center gap-8 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="text-left">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-subtle)] px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--text-secondary)]">
                <Sparkles className="h-3 w-3" />
                AI automation platform
              </div>

              <h2 className="max-w-xl text-3xl font-medium leading-[0.96] tracking-[-0.05em] text-[var(--text-primary)] sm:text-4xl lg:text-5xl">
                Build AI Agents
                <span className="mt-2 block text-[var(--text-primary)]">Without Limits</span>
              </h2>

              <p className="mt-5 max-w-xl text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
                Design, automate, and scale powerful AI workflows with a modern visual builder built
                for teams who want speed, clarity, and real business outcomes.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Button
                  size="lg"
                  onClick={() => router.push('/agent-builder')}
                  className="bg-[var(--button-bg)] px-6 py-5 text-sm font-medium text-[var(--button-text)] shadow-[0_12px_28px_rgba(15,23,42,0.08)]"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Start Building
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => router.push('/blog')}
                  className="border-[var(--border-default)] bg-[rgba(255,255,255,0.7)] px-6 py-5 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  Explore Blog
                </Button>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-[var(--text-secondary)]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[var(--text-primary)]" />
                  Secure workflows
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-[var(--text-primary)]" />
                  Real-time execution
                </div>
                <div className="flex items-center gap-2">
                  <Layers3 className="h-4 w-4 text-[var(--text-primary)]" />
                  Multi-model orchestration
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="glass-panel relative overflow-hidden rounded-[1.75rem] border border-[var(--border-default)] bg-[rgba(255,255,255,0.8)] p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#d4d4d8]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#d4d4d8]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#d4d4d8]" />
                  </div>
                  <span className="rounded-full border border-[var(--border-default)] bg-[var(--bg-subtle)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                    Live
                  </span>
                </div>

                <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-subtle)] p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-tertiary)]">
                        Agent workflow
                      </p>
                      <h3 className="mt-2 text-xl font-semibold text-[var(--text-primary)]">
                        AI Agent Launch Strategy
                      </h3>
                    </div>
                    <div className="rounded-full border border-[var(--border-default)] bg-[rgba(255,255,255,0.8)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)]">
                      Ready
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-xl border border-[var(--border-default)] bg-[rgba(255,255,255,0.7)] p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--bg-soft)] text-[var(--text-primary)]">
                          <Bot className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">
                            Goal Mapping
                          </p>
                          <p className="text-xs text-[var(--text-secondary)]">Completed</p>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-[var(--text-tertiary)]" />
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-[var(--border-default)] bg-[rgba(255,255,255,0.7)] p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--bg-soft)] text-[var(--text-primary)]">
                          <Workflow className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">
                            Prompt Strategy
                          </p>
                          <p className="text-xs text-[var(--text-secondary)]">Running</p>
                        </div>
                      </div>
                      <div className="h-2 w-16 overflow-hidden rounded-full bg-[rgba(17,24,39,0.08)]">
                        <div className="h-full w-2/3 rounded-full bg-[var(--button-bg)]" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-[var(--border-default)] bg-[rgba(255,255,255,0.7)] p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--bg-soft)] text-[var(--text-primary)]">
                          <Settings className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">
                            Tool Routing
                          </p>
                          <p className="text-xs text-[var(--text-secondary)]">Queued</p>
                        </div>
                      </div>
                      <span className="text-xs text-[var(--text-secondary)]">3 min</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-16">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
                Why teams choose us
              </p>
              <h3 className="mt-2 text-2xl font-medium tracking-[-0.05em] text-[var(--text-primary)] sm:text-3xl">
                Built for modern AI operations
              </h3>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="feature-card group rounded-3xl border border-[var(--border-default)] bg-[rgba(255,255,255,0.6)] p-5">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--bg-soft)] text-[var(--text-primary)]">
                <Bot className="h-5 w-5" />
              </div>
              <h4 className="text-lg font-medium text-[var(--text-primary)]">AI workflows</h4>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                Create intelligent multi-step workflows that combine models, prompts, and actions in
                a single orchestration flow.
              </p>
            </div>

            <div className="feature-card group rounded-3xl border border-[var(--border-default)] bg-[rgba(255,255,255,0.6)] p-5">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--bg-soft)] text-[var(--text-primary)]">
                <Workflow className="h-5 w-5" />
              </div>
              <h4 className="text-lg font-medium text-[var(--text-primary)]">Visual builder</h4>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                Organize nodes, connect logic, and design automation with an intuitive drag-and-drop
                experience.
              </p>
            </div>

            <div className="feature-card group rounded-3xl border border-[var(--border-default)] bg-[rgba(255,255,255,0.6)] p-5">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--bg-soft)] text-[var(--text-primary)]">
                <Settings className="h-5 w-5" />
              </div>
              <h4 className="text-lg font-medium text-[var(--text-primary)]">
                Service integrations
              </h4>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                Connect APIs, triggers, webhooks, and external systems to power end-to-end automated
                operations.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-16 rounded-[2rem] border border-[var(--border-default)] bg-[rgba(255,255,255,0.66)] p-6 md:p-8">
          <div className="flex flex-col items-center justify-between gap-5 text-center md:flex-row md:text-left">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
                Ready to go
              </p>
              <h3 className="mt-2 text-2xl font-medium tracking-[-0.05em] text-[var(--text-primary)] sm:text-3xl">
                Start building your AI system today
              </h3>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">
                Launch your next workflow with modern automation, flexible orchestration, and
                precise execution control.
              </p>
            </div>

            <Button
              size="lg"
              onClick={() => router.push('/agent-builder')}
              className="bg-[var(--button-bg)] px-7 py-5 text-sm font-medium text-[var(--button-text)] shadow-[0_12px_28px_rgba(15,23,42,0.08)]"
            >
              Launch Builder
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
