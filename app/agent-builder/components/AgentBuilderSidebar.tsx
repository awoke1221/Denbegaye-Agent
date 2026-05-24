'use client';

import { useRouter } from 'next/navigation';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { extractAvatarInitials } from '@/lib/avatar-utils';
import { ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { sidebarItems } from '../constants/nodeTypes';

import { LayoutDashboard, Wrench, Sparkles, Lock, SlidersHorizontal } from 'lucide-react';

type AgentBuilderSidebarProps = {
  user: any;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (value: boolean) => void;
  activeSection: string;
  setActiveSection: (value: string) => void;
};

export function AgentBuilderSidebar({
  user,
  sidebarCollapsed,
  setSidebarCollapsed,
  activeSection,
  setActiveSection,
}: AgentBuilderSidebarProps) {
  const router = useRouter();

  return (
    <div
      className={`${sidebarCollapsed ? 'w-20' : 'w-80'} bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-700/50 flex flex-col shadow-2xl transition-all duration-300 ease-in-out`}
    >
      <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-slate-800/50 dark:to-slate-700/50">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="w-10 h-10 ring-2 ring-blue-500/20 shadow-lg">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
                  {extractAvatarInitials(user?.user_metadata?.full_name || user?.email || 'U')}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-800"></div>
            </div>
            {!sidebarCollapsed && (
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {user?.user_metadata?.full_name || 'User'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
              </div>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-10 w-10 rounded-2xl p-0 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className={sidebarCollapsed ? 'p-2 space-y-2' : 'p-4 space-y-2'}>
            {sidebarItems.map(item => (
              <button
                key={item.id}
                title={item.label}
                onClick={() => {
                  if (item.id === 'templates') {
                    setActiveSection('templates');
                  } else if (item.id === 'webhooks') {
                    setActiveSection('webhooks');
                  } else if (item.href) {
                    router.push(item.href);
                  } else {
                    setActiveSection(item.id);
                  }
                }}
                className={`group w-full flex items-center ${sidebarCollapsed ? 'justify-center px-0 py-3' : 'gap-3 px-4 py-3'} rounded-2xl transition-all duration-300 transform ${
                  activeSection === item.id
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25 border border-blue-400/50'
                    : 'hover:bg-white/60 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300 hover:shadow-md backdrop-blur-sm border border-transparent hover:border-slate-200/50 dark:hover:border-slate-600/50'
                }`}
              >
                {(() => {
                  const iconMap = {
                    dashboard: LayoutDashboard,
                    builder: Wrench,
                    templates: Sparkles,
                    vault: Lock,
                    settings: SlidersHorizontal,
                  };
                  const IconComponent = iconMap[item.id as keyof typeof iconMap] || LayoutDashboard;
                  return (
                    <IconComponent
                      className={`w-5 h-5 transition-transform duration-300 ${activeSection === item.id ? 'scale-110 text-white' : 'group-hover:scale-110 text-slate-700 dark:text-slate-300'}`}
                    />
                  );
                })()}
                {!sidebarCollapsed && (
                  <>
                    <span className="text-sm font-medium">{item.label}</span>
                    {activeSection === item.id && (
                      <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    )}
                  </>
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
