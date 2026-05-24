import type { BlogPost } from '@/types/blog';

interface BlogPostContentProps {
  post: BlogPost;
}

export default function BlogPostContent({ post }: BlogPostContentProps) {
  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-sm">
        <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-cyan-200">
          {post.tags.map(tag => (
            <span
              key={tag}
              className="rounded-full bg-cyan-500/10 px-3 py-1 font-semibold uppercase tracking-[0.2em] text-cyan-100"
            >
              {tag}
            </span>
          ))}
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">{post.title}</h1>
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-400">
          <span>{post.author}</span>
          <span>{post.date}</span>
          <span>{post.readingTime}</span>
        </div>
      </section>

      <section className="space-y-8">
        {post.sections.map((section, index) => {
          if (section.type === 'heading') {
            return (
              <h2 key={index} className="text-2xl font-semibold text-white">
                {section.title}
              </h2>
            );
          }

          if (section.type === 'paragraph') {
            return (
              <p key={index} className="max-w-3xl text-base leading-8 text-gray-300">
                {section.text}
              </p>
            );
          }

          if (section.type === 'list' && section.items) {
            return (
              <ul key={index} className="ml-5 list-disc space-y-3 text-gray-300">
                {section.items.map((item, itemIndex) => (
                  <li key={itemIndex}>{item}</li>
                ))}
              </ul>
            );
          }

          if (section.type === 'code' && section.code) {
            return (
              <pre
                key={index}
                className="overflow-x-auto rounded-3xl bg-slate-950/80 p-5 text-sm text-slate-100"
              >
                <code>{section.code}</code>
              </pre>
            );
          }

          return null;
        })}
      </section>
    </div>
  );
}
