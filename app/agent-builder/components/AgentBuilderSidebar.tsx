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
      className={`${sidebarCollapsed ? 'w-20' : 'w-80'} bg-[var(--bg-surface)] border-r border-[var(--border-default)] flex flex-col shadow-[0_12px_28px_var(--shadow-soft)] transition-all duration-300 ease-in-out`}
    >
      <div className="p-4 border-b border-[var(--border-default)] bg-[var(--bg-subtle)]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="w-10 h-10 ring-2 ring-[var(--border-default)] shadow-sm">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-[var(--bg-subtle)] text-[var(--text-primary)] font-semibold border border-[var(--border-default)]">
                  {extractAvatarInitials(user?.user_metadata?.full_name || user?.email || 'U')}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-[var(--text-primary)] rounded-full border-2 border-[var(--bg-surface)] opacity-80"></div>
            </div>
            {!sidebarCollapsed && (
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {user?.user_metadata?.full_name || 'User'}
                </p>
                <p className="text-xs text-[var(--text-tertiary)]">{user?.email}</p>
              </div>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-10 w-10 rounded-xl p-0 text-[var(--text-secondary)] border-[var(--border-default)] hover:bg-[var(--bg-hover)] transition-all duration-200"
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
                className={`group w-full flex items-center ${sidebarCollapsed ? 'justify-center px-0 py-3' : 'gap-3 px-4 py-3'} rounded-xl transition-all duration-200 ${
                  activeSection === item.id
                    ? 'bg-[var(--bg-subtle)] text-[var(--text-primary)] border border-[var(--border-default)] shadow-[0_8px_18px_var(--shadow-soft)]'
                    : 'hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent'
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
                      className={`w-5 h-5 transition-transform duration-200 ${activeSection === item.id ? 'scale-110 text-[var(--text-primary)]' : 'group-hover:scale-110 text-[var(--text-secondary)]'}`}
                    />
                  );
                })()}
                {!sidebarCollapsed && (
                  <>
                    <span className="text-sm font-medium">{item.label}</span>
                    {activeSection === item.id && (
                      <div className="ml-auto w-2 h-2 bg-[var(--text-primary)] rounded-full opacity-70"></div>
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
