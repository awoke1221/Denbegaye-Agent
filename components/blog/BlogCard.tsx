import Link from 'next/link';
import type { BlogPost } from '@/types/blog';

interface BlogCardProps {
  post: BlogPost;
}

export default function BlogCard({ post }: BlogCardProps) {
  return (
    <article className="group rounded-3xl border border-white/10 bg-white/5 p-6 shadow-sm transition hover:border-cyan-400/40 hover:bg-white/10">
      <div className="mb-4 flex flex-wrap gap-2">
        {post.tags.map(tag => (
          <span
            key={tag}
            className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-cyan-200"
          >
            {tag}
          </span>
        ))}
      </div>
      <h2 className="text-2xl font-semibold leading-tight text-white transition group-hover:text-cyan-200">
        {post.title}
      </h2>
      <p className="mt-4 text-sm leading-6 text-gray-300">{post.summary}</p>
      <div className="mt-6 flex items-center justify-between text-xs text-gray-400">
        <span>{post.date}</span>
        <span>{post.readingTime}</span>
      </div>
      <Link
        href={`/blog/${post.slug}`}
        className="mt-6 inline-flex items-center text-sm font-semibold text-cyan-300 transition hover:text-cyan-100"
      >
        Read tutorial →
      </Link>
    </article>
  );
}
