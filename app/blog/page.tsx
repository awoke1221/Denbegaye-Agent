import Link from 'next/link';
import BlogList from '@/components/blog/BlogList';
import type { BlogPost } from '@/types/blog';

const APP_BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    const response = await fetch(`${APP_BASE_URL}/api/blogs`, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(body || 'Failed to load blog posts');
    }

    return response.json();
  } catch (err) {
    // During build/prerender the backend may be unavailable. Return empty list to
    // allow the build to continue and render a fallback state.
    return [];
  }
}

export const metadata = {
  title: 'Blog | Denbegnaye',
  description:
    'Read tutorials, platform guides, and advanced workflows to get the most from Denbegnaye.',
};

export default async function BlogPage() {
  const posts = await getBlogPosts();

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <main className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-16 max-w-3xl space-y-6">
          <span className="inline-flex rounded-full bg-cyan-500/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
            Blog & tutorials
          </span>
          <h1 className="text-5xl font-black tracking-tight text-white sm:text-6xl">
            Learn Denbegnaye with clear, practical guides.
          </h1>
          <p className="text-lg leading-8 text-gray-400">
            Explore step-by-step tutorials, platform walkthroughs, and advanced examples that help
            you build real AI automation with confidence.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/blog/how-denbegnaye-works"
              className="inline-flex items-center rounded-3xl bg-cyan-500 px-6 py-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              Read the platform guide
            </Link>
            <Link
              href="/blog/build-your-first-agent"
              className="inline-flex items-center rounded-3xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-semibold text-white transition hover:border-cyan-400/40 hover:bg-white/10"
            >
              Start the first tutorial
            </Link>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="space-y-8">
            <BlogList posts={posts} />
          </section>

          <aside className="space-y-8 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-sm">
            <div>
              <h2 className="text-xl font-semibold text-white">Why follow the blog?</h2>
              <p className="mt-3 text-sm leading-7 text-gray-300">
                The blog is built to help users understand how Denbegnaye works, learn the best
                practices, and discover how to build better workflows step by step.
              </p>
            </div>
            <div>
              <h3 className="text-sm uppercase tracking-[0.24em] text-cyan-200">Topics covered</h3>
              <ul className="mt-4 space-y-3 text-gray-300">
                <li>Platform architecture and execution flow</li>
                <li>Agent builder tutorials</li>
                <li>API and integration workflows</li>
                <li>Deployment and monitoring tips</li>
              </ul>
            </div>
            <div className="rounded-3xl bg-cyan-500/10 p-4 text-sm text-cyan-100">
              <p className="font-semibold">Tip:</p>
              <p className="mt-2 text-gray-300">
                Start with the overview post, then follow the practical tutorial for your first
                agent. Use the blog for both onboarding and advanced workflows.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
