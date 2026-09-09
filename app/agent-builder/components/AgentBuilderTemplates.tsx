'use client';

import type { Dispatch, SetStateAction, ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { AgentBuilderTemplates as TemplatesLibrary } from '@/lib/agentBuilderTemplates';

interface AgentBuilderTemplatesProps {
  filteredTemplates: typeof TemplatesLibrary;
  templateSearchQuery: string;
  setTemplateSearchQuery: (value: string) => void;
  selectedCategory: string;
  setSelectedCategory: (value: string) => void;
  loadTemplate: (templateId: string) => void;
  setActiveSection: (
    section: 'builder' | 'dashboard' | 'settings' | 'templates' | 'webhooks' | 'vault'
  ) => void;
  renderIcon: (icon: any, className?: string) => ReactNode;
  setLog: Dispatch<SetStateAction<string[]>>;
}

export function AgentBuilderTemplates({
  filteredTemplates,
  templateSearchQuery,
  setTemplateSearchQuery,
  selectedCategory,
  setSelectedCategory,
  loadTemplate,
  setActiveSection,
  renderIcon,
  setLog,
}: AgentBuilderTemplatesProps) {
  return (
    <div className="flex-1 p-8 overflow-y-auto bg-[var(--bg-page)] text-[var(--text-primary)]">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
            Agent Templates Library
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
            Discover expertly crafted templates designed for professional workflows. Choose from our
            curated collection to accelerate your agent development.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-tertiary)] w-4 h-4" />
            <Input
              placeholder="Search templates..."
              value={templateSearchQuery}
              onChange={e => setTemplateSearchQuery(e.target.value)}
              className="pl-10 bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-primary)]"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('all')}
              className="bg-[var(--bg-surface)] text-[var(--text-primary)] border-[var(--border-default)]"
            >
              All
            </Button>
            <Button
              variant={selectedCategory === 'Social Media' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('Social Media')}
              className="bg-[var(--bg-surface)] text-[var(--text-primary)] border-[var(--border-default)]"
            >
              Social Media
            </Button>
            <Button
              variant={selectedCategory === 'Productivity' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('Productivity')}
              className="bg-[var(--bg-surface)] text-[var(--text-primary)] border-[var(--border-default)]"
            >
              Productivity
            </Button>
            <Button
              variant={selectedCategory === 'Business' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('Business')}
              className="bg-[var(--bg-surface)] text-[var(--text-primary)] border-[var(--border-default)]"
            >
              Business
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Featured Templates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates
              .filter(t => t.featured)
              .map(template => (
                <Card
                  key={template.id}
                  className="group transition-all duration-200 bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-[0_10px_22px_var(--shadow-soft)]"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <CardTitle className="text-lg font-semibold text-[var(--text-primary)] transition-colors">
                          {template.name}
                        </CardTitle>
                        <Badge variant="secondary" className="text-xs">
                          {template.category}
                        </Badge>
                      </div>
                      <div className="p-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)]">
                        {renderIcon(template.icon, 'w-6 h-6 text-[var(--text-secondary)]')}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-[var(--text-secondary)] line-clamp-3">
                      {template.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-[var(--text-tertiary)]">
                        {template.nodes.length} nodes • {template.edges.length} connections
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          loadTemplate(template.id);
                          setActiveSection('builder');
                          setLog(prev => [...prev, `Loaded featured template: ${template.name}`]);
                        }}
                        className="border border-[var(--border-default)] bg-[var(--bg-soft)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                      >
                        Use Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-[var(--text-primary)]">All Templates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map(template => (
              <Card
                key={template.id}
                className="group hover:shadow-xl transition-all duration-300 bg-[var(--bg-surface)] border border-[var(--border-default)]"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-lg font-semibold text-[var(--text-primary)] transition-colors">
                        {template.name}
                      </CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        {template.category}
                      </Badge>
                    </div>
                    <div className="p-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)]">
                      {renderIcon(template.icon, 'w-6 h-6 text-[var(--text-secondary)]')}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-[var(--text-secondary)] line-clamp-3">
                    {template.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-[var(--text-tertiary)]">
                      {template.nodes.length} nodes • {template.edges.length} connections
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        loadTemplate(template.id);
                        setActiveSection('builder');
                        setLog(prev => [...prev, `Loaded template: ${template.name}`]);
                      }}
                      className="border border-[var(--border-default)] bg-[var(--bg-soft)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                    >
                      Use Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 inline-block mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              No templates found
            </h3>
            <p className="text-[var(--text-secondary)]">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
