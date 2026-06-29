import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { BlogPost } from '@/types/blog';
import BlogPostContent from '@/components/blog/BlogPostContent';

const APP_BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

async function getBlogPost(slug: string): Promise<BlogPost | null> {
  const response = await fetch(`${APP_BASE_URL}/api/blogs/${encodeURIComponent(slug)}`, {
    next: { revalidate: 60 },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || 'Failed to load blog post');
  }

  return response.json();
}

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) {
    return {
      title: 'Blog post not found | Denbegnaye',
      description: 'The requested blog post could not be found.',
    };
  }

  return {
    title: `${post.title} | Denbegnaye Blog`,
    description: post.summary,
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <main className="mx-auto max-w-5xl px-6 py-20">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Blog post</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
              {post.title}
            </h1>
          </div>
          <Link
            href="/blog"
            className="inline-flex items-center rounded-3xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-400/40 hover:bg-white/10"
          >
            ← Back to blog
          </Link>
        </div>

        <BlogPostContent post={post} />
      </main>
    </div>
  );
}
