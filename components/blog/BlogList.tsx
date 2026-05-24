'use client';

import { useMemo, useState } from 'react';
import type { BlogPost } from '@/types/blog';
import BlogCard from '@/components/blog/BlogCard';

interface BlogListProps {
  posts: BlogPost[];
}

export default function BlogList({ posts }: BlogListProps) {
  const [selectedTag, setSelectedTag] = useState('All');

  const tags = useMemo(() => {
    const uniqueTags = new Set<string>();
    posts.forEach(post => post.tags.forEach(tag => uniqueTags.add(tag)));
    return ['All', ...Array.from(uniqueTags)];
  }, [posts]);

  const filteredPosts = useMemo(() => {
    if (selectedTag === 'All') {
      return posts;
    }
    return posts.filter(post => post.tags.includes(selectedTag));
  }, [posts, selectedTag]);

  return (
    <>
      <div className="mb-10 rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-white">Filter by topic</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {tags.map(tag => {
            const isActive = tag === selectedTag;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(tag)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950'
                    : 'border border-white/10 bg-white/5 text-gray-300 hover:border-cyan-400/40 hover:bg-white/10'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {filteredPosts.length > 0 ? (
        <div className="space-y-8">
          {filteredPosts.map(post => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-gray-300">
          No posts found for this category. Try another filter or choose All.
        </div>
      )}
    </>
  );
}
