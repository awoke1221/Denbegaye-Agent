'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/AuthGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  FileText,
  Play,
  Search,
  Filter,
  SlidersHorizontal,
  ArrowUpDown,
  Grid,
  List,
  ArrowLeft,
  Sparkles,
  Plus,
  Zap,
  Layers,
  Star,
  Clock,
  Users,
  CheckCircle,
  X,
  Eye,
  Bookmark,
  RotateCcw,
  Info,
  GitBranch,
  UserRound,
  Tag,
  Database,
} from 'lucide-react';
import { AgentBuilderTemplates } from '@/lib/agentBuilderTemplates';
import { useAuth } from '@/contexts/AuthContext';
import { getNodeIcon } from '@/components/agent-nodes/NodeRegistry';
import { supabase } from '@/lib/supabaseClient';

export default function TemplatesPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loadingTemplate, setLoadingTemplate] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [newWorkflowDescription, setNewWorkflowDescription] = useState('');
  const [dbTemplates, setDbTemplates] = useState<any[]>([]);
  const [loadingDbTemplates, setLoadingDbTemplates] = useState(true);
  const [sortBy, setSortBy] = useState<'recommended' | 'name' | 'nodes'>('recommended');
  const [previewTemplate, setPreviewTemplate] = useState<any | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  // Normalize templates from built-in and database sources into a consistent shape
  const normalizeTemplate = (t: any) => ({
    id: t.id,
    name: t.name,
    description: t.description || t.summary || '',
    category: t.category || 'Uncategorized',
    tags: t.tags || [],
    author: t.author || { name: t.authorName || 'Unknown' },
    rating: t.rating || 0,
    downloads: t.downloads || 0,
    createdAt: t.createdAt || t.created_at || new Date().toISOString(),
    updatedAt: t.updatedAt || t.updated_at || new Date().toISOString(),
    version: t.version || t.config?.version || '1.0.0',
    nodes: t.nodes || t.config?.nodes || [],
    edges: t.edges || t.config?.edges || [],
    preview: t.preview || null,
    featured: !!t.featured,
    price: t.price || 0,
    source: t.source || (t.config ? 'database' : 'built-in'),
  });

  const allTemplates = [
    ...AgentBuilderTemplates.map(t => normalizeTemplate({ ...t, source: 'built-in' })),
    ...dbTemplates.map(t => normalizeTemplate({ ...t, source: 'database' })),
  ];
  const categories = ['All', ...Array.from(new Set(allTemplates.map(t => t.category)))];

  // Filter templates based on search and category
  const filteredTemplates = allTemplates.filter(template => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      searchQuery === '' ||
      (template.name || '').toLowerCase().includes(q) ||
      (template.description || '').toLowerCase().includes(q) ||
      (template.tags || []).some((tag: string) => (tag || '').toLowerCase().includes(q));

    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const sortedTemplates = [...filteredTemplates].sort((first, second) => {
    if (sortBy === 'name') return first.name.localeCompare(second.name);
    if (sortBy === 'nodes') return second.nodes.length - first.nodes.length;
    return (
      Number(second.featured) - Number(first.featured) || second.nodes.length - first.nodes.length
    );
  });

  const featuredTemplates = sortedTemplates.filter(template => template.featured);
  const categoryCounts = allTemplates.reduce<Record<string, number>>((counts, template) => {
    counts[template.category] = (counts[template.category] || 0) + 1;
    return counts;
  }, {});

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSortBy('recommended');
  };

  const toggleFavorite = (templateId: string) => {
    setFavoriteIds(current =>
      current.includes(templateId)
        ? current.filter(id => id !== templateId)
        : [...current, templateId]
    );
  };

  const loadTemplate = (template: any) => {
    setLoadingTemplate(template.id);
    // Store the template data in localStorage to load it in the builder
    try {
      const templateData = {
        id: template.id,
        name: template.name,
        description: template.description,
        nodes: template.nodes || [],
        edges: template.edges || [],
        source: template.source,
      };
      localStorage.setItem('load-template-data', JSON.stringify(templateData));
      // Small delay to show loading state before navigation
      setTimeout(() => {
        router.push('/agent-builder');
      }, 500);
    } catch (err) {
      console.error('Failed to store template in localStorage:', err);
      setLoadingTemplate(null);
    }
  };

  const fetchDbTemplates = async () => {
    try {
      setLoadingDbTemplates(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/admin/templates?is_public=true', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDbTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Error fetching database templates:', error);
    } finally {
      setLoadingDbTemplates(false);
    }
  };

  const createEmptyWorkflow = () => {
    if (!newWorkflowName.trim()) return;

    setLoadingTemplate('empty');
    // Store empty workflow data
    localStorage.setItem(
      'new-workflow',
      JSON.stringify({
        name: newWorkflowName.trim(),
        description: newWorkflowDescription.trim(),
        nodes: [],
        edges: [],
      })
    );
    setTimeout(() => {
      router.push('/agent-builder');
    }, 500);
  };

  // Function to extract unique node types from template
  const getTemplateIcons = (template: any) => {
    const nodeTypes = Array.from(new Set(template.nodes.map((node: any) => node.type))) as string[];
    return nodeTypes.slice(0, 4).map(type => {
      const IconComponent = getNodeIcon(type);
      return { type, IconComponent };
    });
  };

  // Function to get template difficulty/complexity
  const getTemplateComplexity = (template: any) => {
    const nodeCount = template.nodes.length;
    if (nodeCount <= 3)
      return {
        level: 'Beginner',
        color: 'bg-[var(--bg-soft)] text-[var(--text-secondary)]',
        icon: CheckCircle,
      };
    if (nodeCount <= 6)
      return {
        level: 'Intermediate',
        color: 'bg-[var(--bg-soft)] text-[var(--text-secondary)]',
        icon: Clock,
      };
    return {
      level: 'Advanced',
      color: 'bg-[var(--bg-soft)] text-[var(--text-secondary)]',
      icon: Zap,
    };
  };

  const getTemplateNodeTypes = (template: any) =>
    Array.from(new Set(template.nodes.map((node: any) => node.type).filter(Boolean))) as string[];

  useEffect(() => {
    if (user) {
      fetchDbTemplates();
    }
  }, [user]);

  useEffect(() => {
    try {
      const storedFavorites = localStorage.getItem('favorite-template-ids');
      if (storedFavorites) setFavoriteIds(JSON.parse(storedFavorites));
    } catch {
      setFavoriteIds([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('favorite-template-ids', JSON.stringify(favoriteIds));
  }, [favoriteIds]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="page-shell min-h-screen text-[var(--text-primary)]">
        {/* Header */}
        <div className="glass-panel border-b border-[var(--border-default)] bg-[rgba(248,246,244,0.8)] shadow-sm">
          <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/agent-builder')}
                  className="flex items-center gap-2 text-[var(--text-secondary)] transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Builder
                </Button>
                <div className="w-px h-8 bg-[var(--border-default)]" />
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border-default)] bg-[var(--bg-soft)] shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
                    <Sparkles className="w-5 h-5 text-[var(--text-primary)]" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-medium tracking-[-0.05em] text-[var(--text-primary)]">
                      Agent Templates
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Choose from pre-built workflows or start fresh
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge
                  variant="outline"
                  className="flex items-center gap-2 border-[var(--border-default)] bg-[var(--bg-subtle)] text-[var(--text-secondary)]"
                >
                  <Layers className="w-3 h-3" />
                  {loadingDbTemplates
                    ? 'Syncing library...'
                    : `${filteredTemplates.length} template${filteredTemplates.length !== 1 ? 's' : ''}`}
                </Badge>
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-[var(--button-bg)] text-[var(--button-text)] shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Empty
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-[var(--text-primary)]" />
                        Create New Workflow
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Workflow Name</Label>
                        <Input
                          id="name"
                          placeholder="Enter workflow name..."
                          value={newWorkflowName}
                          onChange={e => setNewWorkflowName(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Input
                          id="description"
                          placeholder="Brief description of your workflow..."
                          value={newWorkflowDescription}
                          onChange={e => setNewWorkflowDescription(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button
                          variant="outline"
                          onClick={() => setShowCreateDialog(false)}
                          className="flex-1"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                        <Button
                          onClick={createEmptyWorkflow}
                          disabled={!newWorkflowName.trim() || loadingTemplate === 'empty'}
                          className="flex-1 bg-[var(--button-bg)] text-[var(--button-text)]"
                        >
                          {loadingTemplate === 'empty' ? 'Creating...' : 'Create Workflow'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="glass-panel border-b border-[var(--border-default)] bg-[rgba(255,255,255,0.42)]">
          <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1 w-full">
                <div className="relative flex-1 max-w-lg">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[var(--text-tertiary)] w-5 h-5" />
                  <Input
                    placeholder="Search templates by name or description..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="h-12 rounded-xl border-[var(--input-border)] bg-[var(--input-bg)] pl-12 text-[var(--text-primary)] shadow-sm focus:border-[var(--input-focus)] focus:ring-2 focus:ring-[var(--input-focus-ring)] transition-all"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <SlidersHorizontal className="w-5 h-5 text-[var(--text-tertiary)]" />
                  <select
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                    className="rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--text-primary)] shadow-sm focus:border-[var(--input-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--input-focus-ring)] transition-all"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-[var(--text-tertiary)]" />
                  <select
                    aria-label="Sort templates"
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as typeof sortBy)}
                    className="rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-3 text-sm text-[var(--text-primary)] shadow-sm focus:border-[var(--input-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--input-focus-ring)] transition-all"
                  >
                    <option value="recommended">Recommended</option>
                    <option value="name">Name</option>
                    <option value="nodes">Most nodes</option>
                  </select>
                </div>
                {(searchQuery || selectedCategory !== 'All' || sortBy !== 'recommended') && (
                  <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-2">
                    <RotateCcw className="w-4 h-4" />
                    Reset
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex rounded-xl border border-[var(--border-default)] bg-[var(--bg-soft)] p-1 shadow-sm">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className={`rounded-lg ${viewMode === 'grid' ? 'bg-[var(--bg-elevated)] shadow-sm' : ''}`}
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className={`rounded-lg ${viewMode === 'list' ? 'bg-[var(--bg-elevated)] shadow-sm' : ''}`}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 pt-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Filter className="w-4 h-4 shrink-0 text-[var(--text-tertiary)]" />
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="shrink-0 rounded-full"
              >
                {category}
                <span className="ml-1.5 text-xs opacity-60">
                  {category === 'All' ? allTemplates.length : categoryCounts[category] || 0}
                </span>
              </Button>
            ))}
          </div>
        </div>

        {/* Templates Grid/List */}
        <div className="container mx-auto px-6 py-8">
          <div className="h-[calc(100vh-280px)] overflow-auto">
            {featuredTemplates.length > 0 && !searchQuery && selectedCategory === 'All' && (
              <section className="mb-10" aria-labelledby="featured-heading">
                <div className="flex items-end justify-between gap-4 mb-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--text-tertiary)]">
                      Curated starting points
                    </p>
                    <h2
                      id="featured-heading"
                      className="text-2xl font-medium tracking-[-0.04em] text-[var(--text-primary)]"
                    >
                      Popular workflows
                    </h2>
                  </div>
                  <span className="text-sm text-[var(--text-tertiary)]">
                    {featuredTemplates.length} featured
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {featuredTemplates.slice(0, 2).map(template => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => setPreviewTemplate(template)}
                      className="group rounded-2xl border border-[var(--border-default)] bg-[rgba(255,255,255,0.7)] p-5 text-left shadow-[0_10px_22px_var(--shadow-soft)] transition"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)]">
                            <Star className="h-3.5 w-3.5" />
                            Featured · {template.category}
                          </div>
                          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                            {template.name}
                          </h3>
                          <p className="mt-1 line-clamp-2 text-sm text-[var(--text-secondary)]">
                            {template.description}
                          </p>
                        </div>
                        <Eye className="mt-1 h-5 w-5 shrink-0 text-[var(--text-tertiary)] transition" />
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {viewMode === 'grid' ? (
              <div className="space-y-8">
                {/* Empty Template Section */}
                <div className="space-y-4">
                  <h2 className="flex items-center gap-2 text-xl font-medium tracking-[-0.03em] text-[var(--text-primary)]">
                    <Star className="w-5 h-5 text-[var(--text-secondary)]" />
                    Start from Scratch
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <Card className="group cursor-pointer border-2 border-dashed border-[var(--border-strong)] bg-[var(--bg-panel)] transition-all duration-300">
                      <CardContent className="p-8 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--button-bg)] shadow-lg transition-transform">
                          <Plus className="w-8 h-8 text-[var(--button-text)]" />
                        </div>
                        <h3 className="mb-2 text-lg font-semibold text-[var(--text-primary)]">
                          Blank Workflow
                        </h3>
                        <p className="mb-6 text-sm text-[var(--text-secondary)]">
                          Start with a clean canvas and build your custom workflow from scratch
                        </p>
                        <Button
                          onClick={() => setShowCreateDialog(true)}
                          className="bg-[var(--button-bg)] text-[var(--button-text)] shadow-lg"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Create New
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Templates Section */}
                <div className="space-y-4">
                  <h2 className="flex items-center gap-2 text-xl font-medium tracking-[-0.03em] text-[var(--text-primary)]">
                    <Layers className="w-5 h-5 text-[var(--text-secondary)]" />
                    Pre-built Templates
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {sortedTemplates.map(template => {
                      const templateIcons = getTemplateIcons(template);
                      const complexity = getTemplateComplexity(template);

                      return (
                        <Card
                          key={template.id}
                          className="group cursor-pointer overflow-hidden border border-[var(--border-default)] bg-[var(--bg-panel)] transition-all duration-300"
                        >
                          <div className="h-1 bg-[var(--button-bg)]" />
                          <CardHeader className="pb-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-default)] bg-[var(--bg-soft)] shadow-sm">
                                  <FileText className="w-5 h-5 text-[var(--text-secondary)]" />
                                </div>
                                <div className="flex-1">
                                  <CardTitle className="line-clamp-1 text-base font-semibold text-[var(--text-primary)]">
                                    {template.name}
                                  </CardTitle>
                                  <Badge
                                    variant="outline"
                                    className={`text-xs mt-1 ${complexity.color} flex items-center gap-1`}
                                  >
                                    <complexity.icon className="w-3 h-3" />
                                    {complexity.level}
                                  </Badge>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={
                                  favoriteIds.includes(template.id)
                                    ? `Remove ${template.name} from favorites`
                                    : `Save ${template.name} to favorites`
                                }
                                onClick={() => toggleFavorite(template.id)}
                                className="shrink-0"
                              >
                                <Bookmark
                                  className={`w-4 h-4 ${favoriteIds.includes(template.id) ? 'fill-current text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`}
                                />
                              </Button>
                            </div>

                            {/* Node Icons */}
                            <div className="flex items-center gap-2 mb-3">
                              {templateIcons.map(({ type, IconComponent }) => (
                                <div
                                  key={type}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-default)] bg-[var(--bg-soft)] shadow-sm"
                                  title={type}
                                >
                                  <IconComponent className="w-4 h-4 text-[var(--text-secondary)]" />
                                </div>
                              ))}
                            </div>
                          </CardHeader>

                          <CardContent className="pt-0">
                            <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                              {template.description}
                            </p>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="secondary"
                                  className="bg-[var(--bg-soft)] text-xs text-[var(--text-secondary)]"
                                >
                                  {template.category}
                                </Badge>
                                <div className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
                                  <Users className="w-3 h-3" />
                                  {template.nodes.length} nodes
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-2 mt-4">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => setPreviewTemplate(template)}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Preview
                              </Button>
                              <Button
                                size="sm"
                                className="flex-1 bg-[var(--button-bg)] text-[var(--button-text)] shadow-lg transition-all duration-200"
                                onClick={() => loadTemplate(template)}
                                disabled={loadingTemplate === template.id}
                              >
                                <Play className="w-4 h-4 mr-2" />
                                {loadingTemplate === template.id ? 'Loading...' : 'Use'}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* List view - simplified for now */}
                <div className="space-y-4">
                  <h2 className="flex items-center gap-2 text-xl font-medium tracking-[-0.03em] text-[var(--text-primary)]">
                    <List className="w-5 h-5 text-[var(--text-secondary)]" />
                    Templates List View
                  </h2>
                  <div className="space-y-3">
                    {sortedTemplates.map(template => (
                      <Card
                        key={template.id}
                        className="border-[var(--border-default)] bg-[var(--bg-panel)] p-4 transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-[var(--text-tertiary)]" />
                            <div>
                              <h3 className="font-semibold">{template.name}</h3>
                              <p className="text-sm text-[var(--text-secondary)]">
                                {template.description}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPreviewTemplate(template)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Preview
                            </Button>
                            <Button size="sm" onClick={() => loadTemplate(template)}>
                              <Play className="w-4 h-4 mr-2" />
                              Use
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {filteredTemplates.length === 0 && (
              <div className="text-center py-16">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-[var(--border-default)] bg-[var(--bg-soft)] shadow-lg">
                  <FileText className="w-10 h-10 text-[var(--text-tertiary)]" />
                </div>
                <h3 className="mb-3 text-xl font-semibold text-[var(--text-primary)]">
                  No templates found
                </h3>
                <p className="mx-auto mb-6 max-w-md text-[var(--text-secondary)]">
                  {searchQuery || selectedCategory !== 'All'
                    ? "Try adjusting your search or filter criteria to find what you're looking for."
                    : 'No templates are available at the moment. Start by creating your own workflow!'}
                </p>
                {searchQuery || selectedCategory !== 'All' ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('All');
                    }}
                    className="border-[var(--border-default)]"
                  >
                    Clear Filters
                  </Button>
                ) : (
                  <Button
                    onClick={() => setShowCreateDialog(true)}
                    className="bg-[var(--button-bg)] text-[var(--button-text)] shadow-lg"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Workflow
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        <Dialog
          open={Boolean(previewTemplate)}
          onOpenChange={open => !open && setPreviewTemplate(null)}
        >
          <DialogContent className="sm:max-w-lg">
            {previewTemplate && (
              <>
                <DialogHeader>
                  <div className="flex items-start justify-between gap-4 pr-6">
                    <div>
                      <DialogTitle className="text-xl">{previewTemplate.name}</DialogTitle>
                      <p className="mt-2 text-sm text-[var(--text-secondary)]">
                        {previewTemplate.description}
                      </p>
                    </div>
                    <Badge variant="outline">{previewTemplate.category}</Badge>
                  </div>
                </DialogHeader>
                <div className="grid grid-cols-3 gap-3 py-2">
                  <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-soft)] p-3">
                    <p className="text-xs text-[var(--text-tertiary)]">Nodes</p>
                    <p className="mt-1 text-lg font-semibold">{previewTemplate.nodes.length}</p>
                  </div>
                  <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-soft)] p-3">
                    <p className="text-xs text-[var(--text-tertiary)]">Connections</p>
                    <p className="mt-1 text-lg font-semibold">{previewTemplate.edges.length}</p>
                  </div>
                  <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-soft)] p-3">
                    <p className="text-xs text-[var(--text-tertiary)]">Level</p>
                    <p className="mt-1 text-lg font-semibold">
                      {getTemplateComplexity(previewTemplate).level}
                    </p>
                  </div>
                </div>
                <div className="grid gap-3 border-y border-[var(--border-default)] py-4 sm:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <Database className="mt-0.5 h-4 w-4 text-[var(--text-tertiary)]" />
                    <div>
                      <p className="text-xs text-[var(--text-tertiary)]">Source</p>
                      <p className="mt-1 text-sm font-medium capitalize">
                        {previewTemplate.source}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Info className="mt-0.5 h-4 w-4 text-[var(--text-tertiary)]" />
                    <div>
                      <p className="text-xs text-[var(--text-tertiary)]">Version</p>
                      <p className="mt-1 text-sm font-medium">v{previewTemplate.version}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <UserRound className="mt-0.5 h-4 w-4 text-[var(--text-tertiary)]" />
                    <div>
                      <p className="text-xs text-[var(--text-tertiary)]">Created by</p>
                      <p className="mt-1 text-sm font-medium">
                        {previewTemplate.author?.name || 'Denbegnaye team'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <GitBranch className="mt-0.5 h-4 w-4 text-[var(--text-tertiary)]" />
                    <div>
                      <p className="text-xs text-[var(--text-tertiary)]">Last updated</p>
                      <p className="mt-1 text-sm font-medium">
                        {new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(
                          new Date(previewTemplate.updatedAt)
                        )}
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Tag className="h-4 w-4 text-[var(--text-tertiary)]" />
                    <p className="text-sm font-medium">Capabilities</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(previewTemplate.tags.length > 0
                      ? previewTemplate.tags
                      : getTemplateNodeTypes(previewTemplate)
                    ).map((tag: string) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="border-[var(--border-default)] bg-[var(--bg-soft)] font-normal"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium">Workflow steps and connections</p>
                  <div className="max-h-48 space-y-2 overflow-y-auto">
                    {previewTemplate.nodes.map((node: any, index: number) => (
                      <div
                        key={node.id || index}
                        className="flex items-center gap-3 rounded-lg border border-[var(--border-default)] px-3 py-2 text-sm"
                      >
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--bg-soft)] text-xs font-semibold">
                          {index + 1}
                        </span>
                        <span className="truncate">
                          {node.data?.label || node.type || 'Workflow step'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <Button
                  className="w-full bg-[var(--button-bg)] text-[var(--button-text)]"
                  onClick={() => {
                    loadTemplate(previewTemplate);
                    setPreviewTemplate(null);
                  }}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Use this template
                </Button>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>
  );
}
