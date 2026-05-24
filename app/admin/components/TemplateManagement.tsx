'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Download,
  Upload,
  BarChart3,
  Users,
  Calendar,
  Star,
  AlertCircle,
  CheckCircle,
  Clock,
  Globe,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  config: any;
  ui_schema?: any;
  is_public: boolean;
  created_by: string;
  usage_count: number;
  version: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

interface TemplateStats {
  totalTemplates: number;
  publicTemplates: number;
  privateTemplates: number;
  categoryDistribution: Record<string, number>;
  recentActivity: Array<{
    date: string;
    count: number;
  }>;
}

const categories = [
  'Agentic Workflow',
  'Business Automation',
  'Content Creation',
  'Data Analysis',
  'Customer Service',
  'Marketing',
  'Social Media',
  'E-commerce',
  'Education',
  'Healthcare',
  'Finance',
  'Productivity',
  'Other',
];

export function TemplateManagement() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [stats, setStats] = useState<TemplateStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    config: '',
    ui_schema: '',
    is_public: false,
    version: '1.0.0',
  });

  useEffect(() => {
    fetchTemplates();
    fetchStats();
  }, [currentPage, searchQuery, selectedCategory]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) {
        throw new Error('Authentication token is missing. Please sign in again.');
      }
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        sort_by: 'created_at',
        sort_order: 'desc',
      });

      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);

      const response = await fetch(`/api/admin/templates?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Failed to fetch templates');
        throw new Error(errorText || 'Failed to fetch templates');
      }

      const data = await response.json();
      setTemplates(data.templates);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) {
        throw new Error('Authentication token is missing. Please sign in again.');
      }

      const response = await fetch('/api/admin/templates/stats', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Failed to fetch stats');
        throw new Error(errorText || 'Failed to fetch stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch stats';
      setStatsError(message);
      console.error('Error fetching stats:', message, error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    try {
      let config, uiSchema;
      try {
        config = JSON.parse(formData.config);
        uiSchema = formData.ui_schema ? JSON.parse(formData.ui_schema) : null;
      } catch (e) {
        toast.error('Invalid JSON in config or UI schema');
        return;
      }

      const response = await fetch('/api/admin/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          config,
          ui_schema: uiSchema,
          is_public: formData.is_public,
          version: formData.version,
        }),
      });

      if (!response.ok) throw new Error('Failed to create template');

      toast.success('Template created successfully');
      setShowCreateDialog(false);
      resetForm();
      fetchTemplates();
      fetchStats();
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
    }
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate) return;

    try {
      let config, uiSchema;
      try {
        config = JSON.parse(formData.config);
        uiSchema = formData.ui_schema ? JSON.parse(formData.ui_schema) : null;
      } catch (e) {
        toast.error('Invalid JSON in config or UI schema');
        return;
      }

      const response = await fetch(`/api/admin/templates/${editingTemplate.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          config,
          ui_schema: uiSchema,
          is_public: formData.is_public,
          version: formData.version,
        }),
      });

      if (!response.ok) throw new Error('Failed to update template');

      toast.success('Template updated successfully');
      setShowEditDialog(false);
      setEditingTemplate(null);
      resetForm();
      fetchTemplates();
    } catch (error) {
      console.error('Error updating template:', error);
      toast.error('Failed to update template');
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await fetch(`/api/admin/templates/${templateId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete template');

      toast.success('Template deleted successfully');
      fetchTemplates();
      fetchStats();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const handleDuplicateTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`/api/admin/templates/${templateId}/duplicate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to duplicate template');

      toast.success('Template duplicated successfully');
      fetchTemplates();
      fetchStats();
    } catch (error) {
      console.error('Error duplicating template:', error);
      toast.error('Failed to duplicate template');
    }
  };

  const handleBulkUpdate = async (updates: Partial<Template>) => {
    if (selectedTemplates.length === 0) return;

    try {
      const response = await fetch('/api/admin/templates/bulk-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          templateIds: selectedTemplates,
          updates,
        }),
      });

      if (!response.ok) throw new Error('Failed to update templates');

      toast.success(`Updated ${selectedTemplates.length} templates`);
      setSelectedTemplates([]);
      fetchTemplates();
    } catch (error) {
      console.error('Error bulk updating templates:', error);
      toast.error('Failed to update templates');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      config: '',
      ui_schema: '',
      is_public: false,
      version: '1.0.0',
    });
  };

  const openEditDialog = (template: Template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      category: template.category,
      config: JSON.stringify(template.config, null, 2),
      ui_schema: template.ui_schema ? JSON.stringify(template.ui_schema, null, 2) : '',
      is_public: template.is_public,
      version: template.version,
    });
    setShowEditDialog(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Loading...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-6 w-2/3 rounded bg-slate-200" />
                <div className="mt-2 h-4 w-1/2 rounded bg-slate-200" />
              </CardContent>
            </Card>
          ))
        ) : statsError ? (
          <Card className="lg:col-span-4 border-red-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-600">Stats Unavailable</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-red-700">{statsError}</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={fetchStats}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : stats ? (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTemplates}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.publicTemplates} public, {stats.privateTemplates} private
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Categories</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Object.keys(stats.categoryDistribution).length}
                </div>
                <p className="text-xs text-muted-foreground">Active categories</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Usage</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {templates.reduce((sum, t) => sum + (t.usage_count || 0), 0)}
                </div>
                <p className="text-xs text-muted-foreground">Total downloads</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {
                    stats.recentActivity.filter(
                      item => new Date(item.date).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000
                    ).length
                  }
                </div>
                <p className="text-xs text-muted-foreground">New templates</p>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>Stats currently unavailable</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                No template statistics are available. Refresh to retry.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Template Management</CardTitle>
              <CardDescription>Create, edit, and manage agent templates for users</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {selectedTemplates.length > 0 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkUpdate({ is_public: true })}
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    Make Public
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkUpdate({ is_public: false })}
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Make Private
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Delete ${selectedTemplates.length} templates?`)) {
                        selectedTemplates.forEach(id => handleDeleteTemplate(id));
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Selected
                  </Button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={fetchStats}>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Refresh Stats
                </Button>
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Template
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create New Template</DialogTitle>
                      <DialogDescription>
                        Create a new agent template that users can use as a starting point.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Name</Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Template name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="category">Category</Label>
                          <Select
                            value={formData.category}
                            onValueChange={value =>
                              setFormData(prev => ({ ...prev, category: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map(category => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={e =>
                            setFormData(prev => ({ ...prev, description: e.target.value }))
                          }
                          placeholder="Template description"
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="config">Configuration (JSON)</Label>
                        <Textarea
                          id="config"
                          value={formData.config}
                          onChange={e => setFormData(prev => ({ ...prev, config: e.target.value }))}
                          placeholder='{"nodes": [], "edges": []}'
                          rows={10}
                          className="font-mono text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="ui_schema">UI Schema (JSON, optional)</Label>
                        <Textarea
                          id="ui_schema"
                          value={formData.ui_schema}
                          onChange={e =>
                            setFormData(prev => ({ ...prev, ui_schema: e.target.value }))
                          }
                          placeholder="UI configuration schema"
                          rows={5}
                          className="font-mono text-sm"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="is_public"
                          checked={formData.is_public}
                          onCheckedChange={checked =>
                            setFormData(prev => ({ ...prev, is_public: checked as boolean }))
                          }
                        />
                        <Label htmlFor="is_public">Make template public</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateTemplate}>Create Template</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchTemplates}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          {/* Templates Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        selectedTemplates.length === templates.length && templates.length > 0
                      }
                      onCheckedChange={checked => {
                        if (checked) {
                          setSelectedTemplates(templates.map(t => t.id));
                        } else {
                          setSelectedTemplates([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto" />
                      <p className="mt-2 text-muted-foreground">Loading templates...</p>
                    </TableCell>
                  </TableRow>
                ) : templates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-muted-foreground">No templates found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  templates.map(template => (
                    <TableRow key={template.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedTemplates.includes(template.id)}
                          onCheckedChange={checked => {
                            if (checked) {
                              setSelectedTemplates(prev => [...prev, template.id]);
                            } else {
                              setSelectedTemplates(prev => prev.filter(id => id !== template.id));
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{template.name}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {template.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{template.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={template.is_public ? 'default' : 'secondary'}>
                          {template.is_public ? (
                            <>
                              <Globe className="w-3 h-3 mr-1" />
                              Public
                            </>
                          ) : (
                            <>
                              <Lock className="w-3 h-3 mr-1" />
                              Private
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {template.usage_count}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{formatDate(template.created_at)}</div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => openEditDialog(template)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicateTemplate(template.id)}>
                              <Copy className="w-4 h-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                handleBulkUpdate({
                                  is_public: !template.is_public,
                                })
                              }
                            >
                              {template.is_public ? (
                                <>
                                  <EyeOff className="w-4 h-4 mr-2" />
                                  Make Private
                                </>
                              ) : (
                                <>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Make Public
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteTemplate(template.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>Update the template configuration and settings.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Template name"
                />
              </div>
              <div>
                <Label htmlFor="edit-category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={value => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Template description"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-config">Configuration (JSON)</Label>
              <Textarea
                id="edit-config"
                value={formData.config}
                onChange={e => setFormData(prev => ({ ...prev, config: e.target.value }))}
                placeholder='{"nodes": [], "edges": []}'
                rows={10}
                className="font-mono text-sm"
              />
            </div>
            <div>
              <Label htmlFor="edit-ui_schema">UI Schema (JSON, optional)</Label>
              <Textarea
                id="edit-ui_schema"
                value={formData.ui_schema}
                onChange={e => setFormData(prev => ({ ...prev, ui_schema: e.target.value }))}
                placeholder="UI configuration schema"
                rows={5}
                className="font-mono text-sm"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-is_public"
                checked={formData.is_public}
                onCheckedChange={checked =>
                  setFormData(prev => ({ ...prev, is_public: checked as boolean }))
                }
              />
              <Label htmlFor="edit-is_public">Make template public</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTemplate}>Update Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
