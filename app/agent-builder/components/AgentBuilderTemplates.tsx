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
    <div className="flex-1 p-8 overflow-y-auto bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Agent Templates Library
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Discover expertly crafted templates designed for professional workflows. Choose from our
            curated collection to accelerate your agent development.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search templates..."
              value={templateSearchQuery}
              onChange={e => setTemplateSearchQuery(e.target.value)}
              className="pl-10 bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('all')}
              className="bg-white/80 dark:bg-slate-800/80"
            >
              All
            </Button>
            <Button
              variant={selectedCategory === 'Social Media' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('Social Media')}
              className="bg-white/80 dark:bg-slate-800/80"
            >
              Social Media
            </Button>
            <Button
              variant={selectedCategory === 'Productivity' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('Productivity')}
              className="bg-white/80 dark:bg-slate-800/80"
            >
              Productivity
            </Button>
            <Button
              variant={selectedCategory === 'Business' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('Business')}
              className="bg-white/80 dark:bg-slate-800/80"
            >
              Business
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Featured Templates
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates
              .filter(t => t.featured)
              .map(template => (
                <Card
                  key={template.id}
                  className="group hover:shadow-xl transition-all duration-300 bg-white/90 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {template.name}
                        </CardTitle>
                        <Badge variant="secondary" className="text-xs">
                          {template.category}
                        </Badge>
                      </div>
                      <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50">
                        {renderIcon(template.icon, 'w-6 h-6 text-indigo-600 dark:text-indigo-400')}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">
                      {template.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {template.nodes.length} nodes • {template.edges.length} connections
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          loadTemplate(template.id);
                          setActiveSection('builder');
                          setLog(prev => [...prev, `Loaded featured template: ${template.name}`]);
                        }}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
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
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            All Templates
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map(template => (
              <Card
                key={template.id}
                className="group hover:shadow-xl transition-all duration-300 bg-white/90 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {template.name}
                      </CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        {template.category}
                      </Badge>
                    </div>
                    <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50">
                      {renderIcon(template.icon, 'w-6 h-6 text-indigo-600 dark:text-indigo-400')}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">
                    {template.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {template.nodes.length} nodes • {template.edges.length} connections
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        loadTemplate(template.id);
                        setActiveSection('builder');
                        setLog(prev => [...prev, `Loaded template: ${template.name}`]);
                      }}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
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
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              No templates found
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
