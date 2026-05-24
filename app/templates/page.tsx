'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/AuthGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Grid,
  List,
  ArrowLeft,
  Cpu,
  Sparkles,
  Plus,
  Zap,
  Layers,
  Star,
  Clock,
  Users,
  TrendingUp,
  CheckCircle,
  X,
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
      return { level: 'Beginner', color: 'bg-green-100 text-green-800', icon: CheckCircle };
    if (nodeCount <= 6)
      return { level: 'Intermediate', color: 'bg-yellow-100 text-yellow-800', icon: Clock };
    return { level: 'Advanced', color: 'bg-red-100 text-red-800', icon: Zap };
  };

  useEffect(() => {
    if (user) {
      fetchDbTemplates();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        {/* Header */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 shadow-sm">
          <div className="container mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/agent-builder')}
                  className="flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Builder
                </Button>
                <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                      Agent Templates
                    </h1>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Choose from pre-built workflows or start fresh
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge
                  variant="outline"
                  className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                >
                  <Layers className="w-3 h-3" />
                  {filteredTemplates.length} Template{filteredTemplates.length !== 1 ? 's' : ''}
                </Badge>
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Empty
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-blue-500" />
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
                          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
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
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="container mx-auto px-6 py-6">
            <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
                <div className="relative flex-1 max-w-lg">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <Input
                    placeholder="Search templates by name or description..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Filter className="w-5 h-5 text-slate-400" />
                  <select
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                    className="px-4 py-3 bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 shadow-sm">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className={`rounded-lg ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm' : ''}`}
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className={`rounded-lg ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm' : ''}`}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Templates Grid/List */}
        <div className="container mx-auto px-6 py-8">
          <div className="h-[calc(100vh-280px)] overflow-auto">
            {viewMode === 'grid' ? (
              <div className="space-y-8">
                {/* Empty Template Section */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    Start from Scratch
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-2 border-dashed border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 cursor-pointer group">
                      <CardContent className="p-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <Plus className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                          Blank Workflow
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                          Start with a clean canvas and build your custom workflow from scratch
                        </p>
                        <Button
                          onClick={() => setShowCreateDialog(true)}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
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
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-blue-500" />
                    Pre-built Templates
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredTemplates.map(template => {
                      const templateIcons = getTemplateIcons(template);
                      const complexity = getTemplateComplexity(template);

                      return (
                        <Card
                          key={template.id}
                          className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden"
                        >
                          <div className="h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
                          <CardHeader className="pb-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center shadow-sm">
                                  <FileText className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                                </div>
                                <div className="flex-1">
                                  <CardTitle className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">
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
                            </div>

                            {/* Node Icons */}
                            <div className="flex items-center gap-2 mb-3">
                              {templateIcons.map(({ type, IconComponent }) => (
                                <div
                                  key={type}
                                  className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 flex items-center justify-center shadow-sm"
                                  title={type}
                                >
                                  <IconComponent className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                </div>
                              ))}
                            </div>
                          </CardHeader>

                          <CardContent className="pt-0">
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2 leading-relaxed">
                              {template.description}
                            </p>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="secondary"
                                  className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                                >
                                  {template.category}
                                </Badge>
                                <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-500">
                                  <Users className="w-3 h-3" />
                                  {template.nodes.length} nodes
                                </div>
                              </div>
                            </div>

                            <Button
                              size="sm"
                              className="w-full mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg group-hover:shadow-xl transition-all duration-200"
                              onClick={() => loadTemplate(template)}
                              disabled={loadingTemplate === template.id}
                            >
                              <Play className="w-4 h-4 mr-2" />
                              {loadingTemplate === template.id ? 'Loading...' : 'Use Template'}
                            </Button>
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
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <List className="w-5 h-5 text-blue-500" />
                    Templates List View
                  </h2>
                  <div className="space-y-3">
                    {filteredTemplates.map(template => (
                      <Card key={template.id} className="p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-slate-400" />
                            <div>
                              <h3 className="font-semibold">{template.name}</h3>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                {template.description}
                              </p>
                            </div>
                          </div>
                          <Button size="sm" onClick={() => loadTemplate(template)}>
                            Use
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {filteredTemplates.length === 0 && (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center shadow-lg">
                  <FileText className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                  No templates found
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
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
                    className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Clear Filters
                  </Button>
                ) : (
                  <Button
                    onClick={() => setShowCreateDialog(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Workflow
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
