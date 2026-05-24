'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Edit, RefreshCw, BookOpen } from 'lucide-react';
import type { BlogPost } from '@/types/blog';

const ADMIN_BLOG_ENDPOINT = '/api/admin/blogs';

interface AdminBlogPost extends BlogPost {
  reading_time?: string;
  created_at?: string;
  updated_at?: string;
}

const emptyFormState = {
  slug: '',
  title: '',
  summary: '',
  author: 'Denbegnaye Team',
  date: new Date().toISOString().slice(0, 10),
  readingTime: '5 min',
  tags: 'Platform Guide, Tutorial',
  sections: JSON.stringify(
    [
      { type: 'heading', title: 'Introduction' },
      { type: 'paragraph', text: 'Write your post content here.' },
    ],
    null,
    2
  ),
};

export default function AdminBlogEditorPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<AdminBlogPost[]>([]);
  const [form, setForm] = useState({ ...emptyFormState });
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      router.push('/');
      return;
    }

    fetchPosts();
  }, [authLoading, user, router]);

  const getAuthToken = async () => {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;

    if (!token) {
      throw new Error('Missing authentication token. Please sign in again.');
    }

    return token;
  };

  const fetchPosts = async () => {
    setPageLoading(true);
    setErrorMessage(null);

    try {
      const token = await getAuthToken();
      const response = await fetch(ADMIN_BLOG_ENDPOINT, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to load blog posts');
      }

      const data = await response.json();
      setPosts(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load posts';
      setErrorMessage(message);
      console.error('Admin blog fetch error:', error);
    } finally {
      setPageLoading(false);
    }
  };

  const loadPostForEdit = (post: AdminBlogPost) => {
    setEditingSlug(post.slug);
    setForm({
      slug: post.slug,
      title: post.title,
      summary: post.summary,
      author: post.author,
      date: post.date,
      readingTime: post.readingTime ?? post.reading_time ?? '5 min',
      tags: Array.isArray(post.tags) ? post.tags.join(', ') : String(post.tags),
      sections: JSON.stringify(post.sections, null, 2),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingSlug(null);
    setForm({ ...emptyFormState });
    setErrorMessage(null);
  };

  const handleSavePost = async () => {
    setSaving(true);
    setErrorMessage(null);

    try {
      const token = await getAuthToken();

      if (!form.slug.trim()) {
        throw new Error('Slug is required.');
      }

      const parsedSections = JSON.parse(form.sections);
      if (!Array.isArray(parsedSections)) {
        throw new Error('Sections must be a JSON array.');
      }

      const tags = form.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean);

      const payload = {
        slug: form.slug.trim(),
        title: form.title.trim(),
        summary: form.summary.trim(),
        author: form.author.trim(),
        date: form.date.trim(),
        readingTime: form.readingTime.trim(),
        tags,
        sections: parsedSections,
      };

      const method = editingSlug ? 'PUT' : 'POST';
      const endpoint = editingSlug
        ? `${ADMIN_BLOG_ENDPOINT}/${encodeURIComponent(editingSlug)}`
        : ADMIN_BLOG_ENDPOINT;

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to save blog post.');
      }

      const result = await response.json();
      setPosts(current => {
        const existingIndex = current.findIndex(item => item.slug === result.slug);
        if (existingIndex >= 0) {
          const updated = [...current];
          updated[existingIndex] = result;
          return updated;
        }
        return [result, ...current];
      });
      setEditingSlug(result.slug);
      toast.success(editingSlug ? 'Blog post updated.' : 'Blog post created.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save post';
      setErrorMessage(message);
      console.error('Admin blog save error:', error);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePost = async (slug: string) => {
    const confirmed = window.confirm('Delete this blog post? This action cannot be undone.');
    if (!confirmed) {
      return;
    }

    setDeletingSlug(slug);
    setErrorMessage(null);

    try {
      const token = await getAuthToken();
      const response = await fetch(`${ADMIN_BLOG_ENDPOINT}/${encodeURIComponent(slug)}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to delete blog post.');
      }

      setPosts(current => current.filter(post => post.slug !== slug));
      if (editingSlug === slug) {
        resetForm();
      }
      toast.success('Blog post deleted.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to delete post';
      setErrorMessage(message);
      console.error('Admin blog delete error:', error);
      toast.error(message);
    } finally {
      setDeletingSlug(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Admin blog editor</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
              Manage blog posts
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-gray-400">
              Create and update blog content that is served from the backend Workers service. Use
              this page to keep tutorials and guides in sync with your platform.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={() => router.push('/admin')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to admin
            </Button>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              New post
            </Button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[360px_minmax(0,1fr)]">
          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle>Published posts</CardTitle>
              <CardDescription>Click a post to edit it in the form.</CardDescription>
            </CardHeader>
            <CardContent>
              {pageLoading ? (
                <div className="text-gray-300">Loading posts...</div>
              ) : errorMessage ? (
                <div className="space-y-3 text-sm text-red-300">
                  <p>{errorMessage}</p>
                  <Button variant="ghost" onClick={fetchPosts}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry
                  </Button>
                </div>
              ) : posts.length === 0 ? (
                <div className="text-gray-300">No blog posts available yet.</div>
              ) : (
                <div className="space-y-3">
                  {posts.map(post => (
                    <div
                      key={post.slug}
                      className={`w-full rounded-3xl border px-4 py-4 transition ${
                        editingSlug === post.slug
                          ? 'border-cyan-500 bg-cyan-500/10'
                          : 'border-white/10 bg-white/5 hover:border-cyan-400/40 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => loadPostForEdit(post)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-white">{post.title}</p>
                              <p className="mt-1 text-xs text-gray-400">{post.slug}</p>
                            </div>
                            <Edit className="h-4 w-4 text-cyan-300" />
                          </div>
                          <p className="mt-3 text-sm leading-6 text-gray-300">{post.summary}</p>
                        </button>
                        <div className="flex flex-col items-end gap-2">
                          <Link
                            href={`/blog/${encodeURIComponent(post.slug)}`}
                            target="_blank"
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-cyan-200 transition hover:border-cyan-400/40 hover:bg-white/10"
                          >
                            Preview
                          </Link>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => handleDeletePost(post.slug)}
                            disabled={deletingSlug === post.slug}
                          >
                            {deletingSlug === post.slug ? 'Deleting…' : 'Delete'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle>{editingSlug ? 'Edit blog post' : 'Create new post'}</CardTitle>
              <CardDescription>
                Save posts to the backend so the blog pages display fresh tutorial content.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    type="text"
                    value={form.title}
                    onChange={event => setForm({ ...form, title: event.target.value })}
                    placeholder="Blog post title"
                  />
                </div>

                <div>
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    type="text"
                    value={form.slug}
                    onChange={event => setForm({ ...form, slug: event.target.value })}
                    placeholder="how-denbegnaye-works"
                  />
                </div>

                <div>
                  <Label htmlFor="summary">Summary</Label>
                  <Textarea
                    id="summary"
                    value={form.summary}
                    onChange={event => setForm({ ...form, summary: event.target.value })}
                    placeholder="Short summary for the blog card"
                    rows={3}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="author">Author</Label>
                    <Input
                      id="author"
                      type="text"
                      value={form.author}
                      onChange={event => setForm({ ...form, author: event.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={form.date}
                      onChange={event => setForm({ ...form, date: event.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="readingTime">Reading time</Label>
                    <Input
                      id="readingTime"
                      type="text"
                      value={form.readingTime}
                      onChange={event => setForm({ ...form, readingTime: event.target.value })}
                      placeholder="5 min"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tags">Tags</Label>
                    <Input
                      id="tags"
                      type="text"
                      value={form.tags}
                      onChange={event => setForm({ ...form, tags: event.target.value })}
                      placeholder="Platform Guide, Tutorial"
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <Label htmlFor="sections">Sections JSON</Label>
                    <span className="text-xs text-gray-400">JSON array of sections</span>
                  </div>
                  <Textarea
                    id="sections"
                    value={form.sections}
                    onChange={event => setForm({ ...form, sections: event.target.value })}
                    rows={10}
                    className="font-mono text-sm"
                  />
                </div>

                {errorMessage ? (
                  <div className="rounded-3xl border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-200">
                    {errorMessage}
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={handleSavePost} disabled={saving}>
                  {saving ? 'Saving…' : editingSlug ? 'Save changes' : 'Create post'}
                </Button>
                <Button variant="outline" onClick={resetForm} disabled={saving}>
                  Reset form
                </Button>
                <span className="text-sm text-gray-400">
                  Posts are saved directly to the Workers backend and served on the public blog.
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
