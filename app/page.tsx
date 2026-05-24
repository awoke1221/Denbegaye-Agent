'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { extractAvatarInitials, getUserDisplayName } from '@/lib/avatar-utils';
import { Button } from '@/components/ui/button';
import {
  Cpu,
  LogOut,
  Bot,
  Workflow,
  Settings,
  Play,
  BookOpen,
  CreditCard,
  Wrench,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export default function HomePage() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/5 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img
              src="/denbegnaye-logo.svg"
              alt="Denbegnaye Logo"
              className="w-10 h-10"
              onError={e => {
                e.currentTarget.src = '/placeholder-logo.png';
              }}
            />
            <h1 className="text-xl font-bold tracking-tight">Denbegnaye</h1>
          </div>

          {/* Right */}
          <div className="flex items-center gap-4">
            <Link href="/blog">
              <Button variant="ghost">Blog</Button>
            </Link>
            {user ? (
              <>
                <Button
                  onClick={() => router.push('/agent-builder')}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 transition"
                >
                  <Wrench className="mr-2 h-4 w-4" />
                  Builder
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="flex items-center gap-2 cursor-pointer">
                      <Avatar>
                        <AvatarImage
                          src={
                            user.user_metadata?.avatar_url ||
                            user.user_metadata?.picture ||
                            user.photoURL ||
                            undefined
                          }
                          alt={getUserDisplayName(user) || 'User avatar'}
                        />
                        <AvatarFallback>{extractAvatarInitials(user)}</AvatarFallback>
                      </Avatar>
                    </div>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent className="bg-[#0f172a] border-white/10">
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
                <Link href="/login">
                  <Button variant="ghost">Login</Button>
                </Link>

                <Link href="/signup">
                  <Button className="bg-gradient-to-r from-cyan-500 to-blue-600">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-6xl font-black leading-tight mb-6 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Build AI Agents <br /> Without Limits
          </h2>

          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10">
            Design, automate, and scale powerful AI workflows using a modern visual builder.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Button
              size="lg"
              onClick={() => router.push('/agent-builder')}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-6 text-lg"
            >
              <Play className="mr-2" />
              Start Building
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push('/blog')}
              className="px-8 py-6 text-lg"
            >
              <BookOpen className="mr-2" />
              Explore Blog
            </Button>

            {!user && (
              <Button size="lg" variant="outline" asChild>
                <Link href="/signup">Create Account</Link>
              </Button>
            )}
          </div>
        </div>

        {/* ================= FEATURES ================= */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {/* Card */}
          <div className="group bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 hover:border-cyan-400/40 transition">
            <Bot className="mb-4 text-cyan-400 w-8 h-8" />
            <h3 className="text-xl font-semibold mb-2">AI Workflows</h3>
            <p className="text-gray-400 text-sm">
              Create intelligent multi-step workflows powered by AI models.
            </p>
          </div>

          <div className="group bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 hover:border-blue-400/40 transition">
            <Workflow className="mb-4 text-blue-400 w-8 h-8" />
            <h3 className="text-xl font-semibold mb-2">Drag & Drop Builder</h3>
            <p className="text-gray-400 text-sm">
              Visually design flows with an intuitive node-based interface.
            </p>
          </div>

          <div className="group bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 hover:border-green-400/40 transition">
            <Settings className="mb-4 text-green-400 w-8 h-8" />
            <h3 className="text-xl font-semibold mb-2">API Integrations</h3>
            <p className="text-gray-400 text-sm">
              Seamlessly connect APIs, tools, and external services.
            </p>
          </div>
        </div>

        {/* ================= CTA ================= */}
        <div className="text-center bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-white/10 rounded-3xl py-16 px-6">
          <h3 className="text-3xl font-bold mb-4">Start building your AI system today</h3>

          <p className="text-gray-400 mb-8">Join the next generation of automation platforms.</p>

          <Button
            size="lg"
            onClick={() => router.push('/agent-builder')}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 px-10 py-6 text-lg"
          >
            Launch Builder
          </Button>
        </div>
      </main>
    </div>
  );
}
