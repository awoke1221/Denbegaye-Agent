'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Home,
  LayoutGrid,
  Clock,
  Settings,
  Moon,
  Plus,
  Search,
  Sun,
  Cpu,
  FileText,
  Users,
  Banknote,
  TrendingUp,
  ShieldCheck,
  Database,
} from 'lucide-react';
import { AuthGuard } from '@/components/AuthGuard';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import {
  OFFICE_AGENTS,
  OFFICE_CATEGORIES,
  getCategoryById,
  getAgentById,
} from '@/lib/office-intelligence-data';

const iconMap: Record<string, any> = {
  FileText,
  Users,
  Banknote,
  Settings,
  TrendingUp,
  ShieldCheck,
  Database,
};

const categoryToneMap: Record<
  string,
  { dot: string; iconBg: string; iconColor: string; cardBg: string }
> = {
  documents: {
    dot: '#8a72f2',
    iconBg: '#f0ebff',
    iconColor: '#6a5ad8',
    cardBg: '#f8f6ff',
  },
  'hr-people': {
    dot: '#58bba1',
    iconBg: '#eafaf4',
    iconColor: '#2f9b7f',
    cardBg: '#f7fffb',
  },
  finance: {
    dot: '#e1a55a',
    iconBg: '#fff3e6',
    iconColor: '#c6802d',
    cardBg: '#fffaf5',
  },
  operations: {
    dot: '#e07a5f',
    iconBg: '#fff0ec',
    iconColor: '#c35b3d',
    cardBg: '#fffaf8',
  },
  'sales-mktg': {
    dot: '#5fa8e7',
    iconBg: '#edf6ff',
    iconColor: '#3d84c7',
    cardBg: '#f7fbff',
  },
  'it-compliance': {
    dot: '#63bb79',
    iconBg: '#edf9ef',
    iconColor: '#3a9d5d',
    cardBg: '#f8fff9',
  },
  'data-analytics': {
    dot: '#de7da7',
    iconBg: '#fdeef7',
    iconColor: '#c55b88',
    cardBg: '#fff9fc',
  },
};

export type Message = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  chart?: string | null;
  metadata?: Record<string, any> | null;
};

export type UploadedFile = {
  name: string;
  size: string;
  type: string;
  content: string;
  isDbFile?: boolean;
};

export type Session = {
  id: string;
  agentId: string;
  title: string;
  meta: string;
  time: string;
};

const seedSessions: Session[] = [];

export default function OfficeIntelligencePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedCategoryId, setSelectedCategory] = useState<string | null>(null);
  const [activeAgentId, setActiveAgent] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sessions] = useState<Session[]>(seedSessions);
  const [activeTab, setActiveTab] = useState<'all' | 'recent' | 'favorites'>('all');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [chatMessages, setChatMessages] = useState<Record<string, Message[]>>(
    () =>
      Object.fromEntries(OFFICE_AGENTS.map(agent => [agent.id, []])) as Record<string, Message[]>
  );
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, UploadedFile | null>>({});
  const [isLoading, setIsLoading] = useState(false);

  const filteredAgents = useMemo(() => {
    if (!searchQuery) return [];
    return OFFICE_AGENTS.filter(agent =>
      agent.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const hubAgents = useMemo(() => {
    if (selectedCategoryId) {
      return OFFICE_AGENTS.filter(agent => agent.categoryId === selectedCategoryId);
    }
    return OFFICE_AGENTS;
  }, [selectedCategoryId]);

  const activeAgent = activeAgentId ? getAgentById(activeAgentId) : undefined;
  const activeCategory = activeAgent ? getCategoryById(activeAgent.categoryId) : undefined;
  const selectedCategoryName = selectedCategoryId
    ? OFFICE_CATEGORIES.find(category => category.id === selectedCategoryId)?.name
    : null;

  const activeMessages = activeAgentId ? chatMessages[activeAgentId] || [] : [];
  const chartMessages = activeMessages.filter(message => Boolean(message.chart));
  const displayName =
    user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || 'Account';
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('');
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const { data } = await supabase.auth.getSession();
    const headers: Record<string, string> = {};
    if (data.session?.access_token) {
      headers.Authorization = `Bearer ${data.session.access_token}`;
    }
    return headers;
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(current => {
      const next = current === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      return next;
    });
  };

  const handleSendMessage = async (agentId: string, content: string) => {
    const userMessage: Message = {
      id: `${Date.now()}-user`,
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setChatMessages(current => ({
      ...current,
      [agentId]: [...(current[agentId] || []), userMessage],
    }));

    const uploadedFile = uploadedFiles[agentId];
    const agent = getAgentById(agentId);

    if ((agentId === 'csv-analyst' || agentId === 'financial-data') && !uploadedFile) {
      setChatMessages(current => ({
        ...current,
        [agentId]: [
          ...(current[agentId] || []),
          {
            id: `${Date.now()}-assistant`,
            role: 'assistant',
            content:
              agentId === 'csv-analyst'
                ? 'Please upload a CSV file before asking the CSV Data Analyst.'
                : 'Please upload a CSV file before asking the Financial Data Analyst.',
            timestamp: new Date(),
          },
        ],
      }));
      return;
    }

    if (agentId === 'sql-analyst' && !uploadedFile) {
      setChatMessages(current => ({
        ...current,
        [agentId]: [
          ...(current[agentId] || []),
          {
            id: `${Date.now()}-assistant`,
            role: 'assistant',
            content: 'Please upload a database file (.db, .sqlite) before asking the SQL Analyst.',
            timestamp: new Date(),
          },
        ],
      }));
      return;
    }

    if (agentId === 'word-analyst' && !uploadedFile) {
      setChatMessages(current => ({
        ...current,
        [agentId]: [
          ...(current[agentId] || []),
          {
            id: `${Date.now()}-assistant`,
            role: 'assistant',
            content:
              'Please upload a Word document (.docx) before asking the Word Document Analyst.',
            timestamp: new Date(),
          },
        ],
      }));
      return;
    }

    setIsLoading(true);

    try {
      const requestBody: Record<string, any> = {
        agent_id: agentId,
        prompt: content,
        mode: 'auto',
        top_k: 5,
        use_langchain: true,
      };

      if (agentId === 'sql-analyst' && uploadedFile && uploadedFile.isDbFile) {
        requestBody.db_file = uploadedFile.content;
      } else if (agentId === 'word-analyst') {
        requestBody.file_path = uploadedFile?.content;
      } else {
        requestBody.table_csv = uploadedFile?.content;
      }

      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
        body: JSON.stringify(requestBody),
      });

      const payload = await response.json();
      const assistantContent = response.ok
        ? (payload.answer ?? 'No answer returned from backend.')
        : `Error: ${payload.error ?? payload.detail ?? 'Agent request failed.'}`;

      setChatMessages(current => ({
        ...current,
        [agentId]: [
          ...(current[agentId] || []),
          {
            id: `${Date.now()}-assistant-response`,
            role: 'assistant',
            content: assistantContent,
            timestamp: new Date(),
            metadata: response.ok && payload.metadata ? payload.metadata : null,
            chart:
              response.ok && payload.metadata?.chart_png_base64
                ? `data:image/png;base64,${payload.metadata.chart_png_base64}`
                : null,
          },
        ],
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setChatMessages(current => ({
        ...current,
        [agentId]: [
          ...(current[agentId] || []),
          {
            id: `${Date.now()}-assistant-error`,
            role: 'assistant',
            content: `Unable to connect to backend: ${message}`,
            timestamp: new Date(),
          },
        ],
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (agentId: string, file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    const isDbFile = ext === 'db' || ext === 'sqlite' || ext === 'sqlite3';
    const isWordDocument = ext === 'docx';

    if (isDbFile) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch('/api/upload-file', {
          method: 'POST',
          headers: await getAuthHeaders(),
          body: formData,
        });
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.detail || data.error || 'Failed to upload database file.');

        const uploaded: UploadedFile = {
          name: file.name,
          size: `${Math.round(file.size / 1024)} KB`,
          type: 'application/x-sqlite3',
          content: data.file_path,
          isDbFile: true,
        };

        setUploadedFiles(current => ({ ...current, [agentId]: uploaded }));
        setChatMessages(current => ({
          ...current,
          [agentId]: [
            ...(current[agentId] || []),
            {
              id: `${Date.now()}-user-upload`,
              role: 'user',
              content: `Uploaded database file: ${file.name}`,
              timestamp: new Date(),
            },
          ],
        }));
        return;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setChatMessages(current => ({
          ...current,
          [agentId]: [
            ...(current[agentId] || []),
            {
              id: `${Date.now()}-assistant-upload-error`,
              role: 'assistant',
              content: `Failed to upload database file: ${message}`,
              timestamp: new Date(),
            },
          ],
        }));
        return;
      }
    }

    if (isWordDocument) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch('/api/upload-file', {
          method: 'POST',
          headers: await getAuthHeaders(),
          body: formData,
        });
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.detail || data.error || 'Failed to upload Word document.');

        const uploaded: UploadedFile = {
          name: file.name,
          size: `${Math.round(file.size / 1024)} KB`,
          type:
            file.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          content: data.file_path,
        };

        setUploadedFiles(current => ({ ...current, [agentId]: uploaded }));
        setChatMessages(current => ({
          ...current,
          [agentId]: [
            ...(current[agentId] || []),
            {
              id: `${Date.now()}-user-upload`,
              role: 'user',
              content: `Uploaded document: ${file.name}`,
              timestamp: new Date(),
            },
          ],
        }));
        return;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setChatMessages(current => ({
          ...current,
          [agentId]: [
            ...(current[agentId] || []),
            {
              id: `${Date.now()}-assistant-upload-error`,
              role: 'assistant',
              content: `Failed to upload document: ${message}`,
              timestamp: new Date(),
            },
          ],
        }));
        return;
      }
    }

    const uploaded: UploadedFile = {
      name: file.name,
      size: `${Math.round(file.size / 1024)} KB`,
      type: file.type || 'application/octet-stream',
      content: 'file-uploaded',
    };

    setUploadedFiles(current => ({ ...current, [agentId]: uploaded }));
    setChatMessages(current => ({
      ...current,
      [agentId]: [
        ...(current[agentId] || []),
        {
          id: `${Date.now()}-user-upload`,
          role: 'user',
          content: `Uploaded file: ${file.name}`,
          timestamp: new Date(),
        },
      ],
    }));
  };

  return (
    <AuthGuard>
      <div className="office-intelligence-shell flex h-screen overflow-hidden bg-[#f4f1ed] text-[var(--text-primary)]">
        <aside className="w-[240px] min-w-[240px] bg-[#e9e4dd] border-r border-[#d7d0c8] flex flex-col h-full overflow-hidden">
          <div className="h-[72px] border-b border-[#d7d0c8] px-3.5 py-2.5 flex items-center gap-3 bg-[#e9e4dd]">
            <div className="w-8 h-8 rounded-[8px] flex items-center justify-center flex-shrink-0 bg-[#f3efe9] text-[#1d1d1d] border border-[#d7d0c8] shadow-[0_1px_0_rgba(17,24,39,0.04)]">
              <Cpu className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[14px] font-semibold text-[#1e1e1e] leading-tight">
                AgentSuite
              </div>
              <div className="text-[11px] text-[#6c6b67] leading-tight">Office Intelligence</div>
            </div>
          </div>

          <div className="px-3 py-2.5 border-b border-[#d7d0c8] bg-[#efebe6]">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-[#7d7a74]" />
              <input
                type="text"
                placeholder="Search agents..."
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
                className="w-full text-[12px] pl-8 pr-2 py-2 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[8px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--border-strong)]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {searchQuery && filteredAgents.length > 0 ? (
              <div className="p-2">
                {filteredAgents.map(agent => (
                  <button
                    key={agent.id}
                    onClick={() => {
                      setSearchQuery('');
                      setActiveAgent(agent.id);
                      setSelectedCategory(agent.categoryId);
                    }}
                    className="w-full text-left text-xs px-3.5 py-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors duration-150 rounded-sm flex items-center gap-2"
                  >
                    <span className="truncate">{agent.name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <>
                <div className="px-3.5 pt-3 pb-1">
                  <div className="text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--text-tertiary)] mb-2">
                    Workspace
                  </div>
                  <Link
                    href="/"
                    onClick={() => {
                      setSelectedCategory(null);
                      setActiveAgent(null);
                    }}
                    className={`flex items-center gap-2 px-3.5 py-2 text-[12px] rounded-[8px] transition-colors duration-100 w-full text-left ${!selectedCategoryId && !activeAgentId ? 'bg-[#f3efe9] text-[#1e1e1e] font-medium' : 'text-[#5b5852] hover:bg-[#f3efe9] hover:text-[#1e1e1e]'}`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Agent hub</span>
                  </Link>
                  <Link
                    href="/recent"
                    className="flex items-center gap-2 px-3.5 py-2 text-[12px] rounded-[8px] transition-colors duration-100 relative w-full text-left text-[#5b5852] hover:bg-[#f3efe9] hover:text-[#1e1e1e]"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span className="flex-1">Recent sessions</span>
                    <div className="rounded-full text-[10px] px-1.5 py-0.5 flex-shrink-0 bg-[#f7f4f1] text-[#5b5852] border border-[#d7d0c8]">
                      {sessions.length}
                    </div>
                  </Link>
                </div>

                <div className="px-3.5 pt-3 pb-1">
                  <div className="text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--text-tertiary)] mb-2">
                    Categories
                  </div>
                  {OFFICE_CATEGORIES.map(category => {
                    const IconComponent = iconMap[category.lucideIcon];
                    const tone = categoryToneMap[category.id] ?? categoryToneMap.documents;
                    return (
                      <button
                        key={category.id}
                        onClick={() =>
                          setSelectedCategory(
                            selectedCategoryId === category.id ? null : category.id
                          )
                        }
                        className={`w-full flex items-center gap-2 px-3.5 py-2 text-[12px] rounded-[8px] transition-colors duration-100 border ${selectedCategoryId === category.id ? 'border-[var(--border-default)] bg-[var(--bg-subtle)] text-[var(--text-primary)]' : 'border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'}`}
                      >
                        <div
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: tone.dot }}
                        />
                        <span className="truncate">{category.name}</span>
                      </button>
                    );
                  })}
                </div>

                {sessions.length > 0 && (
                  <div className="px-3.5 pt-3 pb-1">
                    <div className="text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--text-tertiary)] mb-2">
                      History
                    </div>
                    {sessions.slice(0, 3).map(session => {
                      const agent = getAgentById(session.agentId);
                      const category = agent ? getCategoryById(agent.categoryId) : null;
                      const IconComponent = category ? iconMap[category.lucideIcon] : null;

                      return (
                        <button
                          key={session.id}
                          onClick={() => {
                            setActiveAgent(session.agentId);
                            setSelectedCategory(agent?.categoryId ?? null);
                          }}
                          className="w-full flex items-center gap-2 px-3.5 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors duration-150 rounded-none"
                        >
                          {IconComponent && (
                            <IconComponent className="w-3.5 h-3.5 flex-shrink-0 text-[var(--text-tertiary)]" />
                          )}
                          <span className="truncate flex-1">{session.title}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="p-3 border-t border-[var(--border-default)] flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-6.5 h-6.5 rounded-full overflow-hidden flex items-center justify-center text-[10px] font-medium flex-shrink-0 bg-[var(--bg-subtle)] text-[var(--text-primary)] border border-[var(--border-default)]">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-medium text-[var(--text-primary)] leading-tight">
                  {displayName}
                </div>
                <div className="text-[10px] text-[var(--text-tertiary)] leading-tight">
                  {user?.email || 'Signed in'}
                </div>
              </div>
              <button className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex-shrink-0">
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-[64px] flex items-center gap-3 px-5 border-b border-[#d7d0c8] bg-[#f6f4f1] flex-shrink-0">
            <div className="text-[24px] font-semibold tracking-[-0.04em] text-[#1d1d1d] flex-1">
              {activeAgent ? activeAgent.name : (selectedCategoryName ?? 'AgentSuite')}
            </div>
            <button className="text-[12px] px-3 py-2 rounded-[8px] border border-[var(--border-default)] bg-[var(--bg-soft)] hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2 text-[var(--text-primary)]">
              <Plus className="w-3.5 h-3.5" /> New session
            </button>
            <button className="w-8 h-8 rounded-[8px] hover:bg-[#efebe6] transition-colors flex items-center justify-center text-[#4a4945] border border-transparent">
              <Bell className="w-4 h-4" />
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-8 h-8 rounded-[8px] hover:bg-[#efebe6] transition-colors flex items-center justify-center text-[#4a4945]"
            >
              <Home className="w-4 h-4" />
            </button>
            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-[8px] hover:bg-[#efebe6] transition-colors flex items-center justify-center text-[#4a4945]"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
          </header>

          {!activeAgent ? (
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              <div className="flex border-b border-[#d7d0c8] bg-[#f7f4f1] -mx-5 px-5">
                {(['All agents', 'Recently used', 'Favorites'] as const).map((label, index) => {
                  const currentTab = ['all', 'recent', 'favorites'][index] as
                    | 'all'
                    | 'recent'
                    | 'favorites';
                  const isActive = activeTab === currentTab;
                  return (
                    <button
                      key={label}
                      onClick={() => setActiveTab(currentTab)}
                      className={`text-[13px] px-3.5 py-3 border-b-[2px] transition-colors duration-100 ${isActive ? 'font-medium text-[#1e1e1e] border-[#6ab4a3] bg-[#f7f4f1]' : 'text-[#5b5852] border-transparent hover:text-[#1e1e1e]'}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <section>
                <h2 className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#7a7671] mb-3">
                  Categories
                </h2>
                <div
                  className="grid gap-2.5"
                  style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}
                >
                  {OFFICE_CATEGORIES.map((category, idx) => {
                    const tone = categoryToneMap[category.id] ?? categoryToneMap.documents;
                    return (
                      <div key={category.id} className="transition-all duration-150">
                        <button
                          onClick={() =>
                            setSelectedCategory(
                              selectedCategoryId === category.id ? null : category.id
                            )
                          }
                          className="w-full rounded-[12px] border border-[var(--border-default)] bg-[var(--bg-subtle)] p-3.5 text-left transition-all duration-150 hover:border-[var(--border-strong)] hover:bg-[var(--bg-hover)]"
                          style={
                            selectedCategoryId === category.id
                              ? {
                                  backgroundColor: '#f5f2ee',
                                  borderColor: '#d0c7bf',
                                  boxShadow: 'inset 0 0 0 1px rgba(17,24,39,0.02)',
                                }
                              : undefined
                          }
                        >
                          <div className="flex items-center justify-between">
                            <div
                              className="w-9 h-9 rounded-[8px] mb-2.5 flex items-center justify-center border border-[#e5dfd7]"
                              style={{ backgroundColor: tone.iconBg, color: tone.iconColor }}
                            >
                              {(() => {
                                const IconComponent = iconMap[category.lucideIcon];
                                return IconComponent ? <IconComponent className="w-4 h-4" /> : null;
                              })()}
                            </div>
                            <span className="text-[10px] font-medium uppercase tracking-[0.06em] text-[#7a7671]">
                              {category.agentCount} tools
                            </span>
                          </div>
                          <div className="text-[15px] font-medium text-[#1d1d1d] mb-0.5">
                            {category.name}
                          </div>
                          <div className="text-[11px] text-[#6f6c67]">
                            {category.agentCount} agents
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section>
                <h2 className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#7a7671] mb-3">
                  {selectedCategoryName
                    ? `${selectedCategoryName} agents`
                    : activeTab === 'all'
                      ? 'All agents'
                      : activeTab === 'recent'
                        ? 'Recently used'
                        : 'Favorites'}
                </h2>
                <div
                  className="grid gap-3"
                  style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}
                >
                  {hubAgents.map((agent, idx) => {
                    const category = getCategoryById(agent.categoryId);
                    const tone = category
                      ? (categoryToneMap[category.id] ?? categoryToneMap.documents)
                      : categoryToneMap.documents;
                    return (
                      <div key={agent.id} className="transition-all duration-150">
                        <button
                          onClick={() => {
                            setActiveAgent(agent.id);
                            setSelectedCategory(agent.categoryId);
                          }}
                          className="w-full rounded-[12px] p-3 flex items-start gap-3 cursor-pointer transition-all duration-150 text-left bg-[var(--bg-subtle)] border border-[var(--border-default)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-hover)]"
                          style={
                            activeAgentId === agent.id
                              ? {
                                  backgroundColor: '#f5f2ee',
                                  borderColor: '#d0c7bf',
                                  boxShadow: 'inset 0 0 0 1px rgba(17,24,39,0.02)',
                                }
                              : undefined
                          }
                        >
                          <div
                            className="w-8 h-8 rounded-[7px] flex-shrink-0 flex items-center justify-center border border-[#e5dfd7]"
                            style={{ backgroundColor: tone.iconBg, color: tone.iconColor }}
                          >
                            <Cpu className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[13px] font-medium text-[#1d1d1d] leading-tight mb-1">
                              {agent.name}
                            </div>
                            <div className="text-[10px] text-[#6f6c67] font-mono">
                              {agent.libs.join(' · ')}
                            </div>
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          ) : (
            <div className="flex-1 flex min-h-0">
              <div className="flex-1 border-r border-[var(--border-default)] flex flex-col overflow-hidden">
                <div className="h-11 border-b border-[var(--border-default)] px-4 flex items-center gap-2 bg-[var(--bg-surface)]">
                  <div className="w-3.5 h-3.5 rounded-full border border-[var(--border-default)] bg-[var(--bg-subtle)]" />
                  <div className="text-sm font-medium text-[var(--text-primary)] flex-1">
                    {activeCategory?.name}
                  </div>
                  <div className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-default)] leading-none">
                    ready
                  </div>
                </div>

                <div className="px-4 py-2 border-b border-[var(--border-default)] flex items-center gap-2 bg-[var(--bg-surface)]">
                  <button className="text-sm px-3 py-1 rounded-full text-[var(--text-tertiary)] hover:bg-[var(--bg-subtle)] transition-colors duration-150">
                    🔍 Data Preview
                  </button>
                  <button className="text-sm px-3 py-1 rounded-full border border-[var(--border-default)] bg-[var(--bg-page)] text-[var(--text-primary)] transition-all duration-150">
                    💬 Chat with Data
                  </button>
                  <button className="relative text-sm px-3 py-1 rounded-full text-[var(--text-tertiary)] hover:bg-[var(--bg-subtle)] transition-colors duration-150 leading-none">
                    📈 Chart Preview
                    {chartMessages.length > 0 ? (
                      <span className="absolute top-0 right-0 -mt-1 -mr-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[10px] font-semibold text-[var(--text-primary)] bg-[var(--bg-subtle)] border border-[var(--border-default)]">
                        {chartMessages.length}
                      </span>
                    ) : null}
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2.5 bg-[var(--bg-page)]">
                  {activeMessages.length === 0 ? (
                    <div className="max-w-[88%] self-start flex flex-col">
                      <div className="text-[10px] text-[var(--text-tertiary)] mb-1 pl-1">agent</div>
                      <div className="text-[13px] text-[var(--text-primary)] leading-relaxed rounded-[10px] px-3 py-2 border-l-2 border-[var(--border-strong)] bg-[var(--bg-subtle)]">
                        Hi! I'm your {activeCategory?.name}. Upload a file in the panel on the
                        right, then ask me anything — I'll write and execute Python to answer.
                      </div>
                    </div>
                  ) : (
                    activeMessages.map(message => (
                      <div
                        key={message.id}
                        className={`max-w-[88%] ${message.role === 'user' ? 'self-end' : 'self-start'}`}
                      >
                        <div className="text-[10px] text-[var(--text-tertiary)] mb-1 pl-1">
                          {message.role === 'user' ? 'you' : 'agent'}
                        </div>
                        <div
                          className="text-[13px] text-[var(--text-primary)] leading-relaxed rounded-[10px] px-3 py-2 border-l-2 border-[var(--border-strong)]"
                          style={{
                            backgroundColor:
                              message.role === 'user' ? 'var(--bg-page)' : 'var(--bg-page)',
                          }}
                        >
                          {message.content}
                          {message.chart ? (
                            <img
                              src={message.chart}
                              alt="Chart preview"
                              className="mt-3 max-w-full rounded-lg border border-[var(--border-default)]"
                            />
                          ) : null}
                        </div>
                      </div>
                    ))
                  )}

                  {isLoading && (
                    <div className="max-w-[60%] self-start flex flex-col">
                      <div className="text-[10px] text-[var(--text-tertiary)] mb-1 pl-1">agent</div>
                      <div className="text-[13px] leading-relaxed rounded-[10px] px-3 py-2 border-l-2 bg-[var(--bg-page)] border-[var(--border-strong)]">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-[var(--text-tertiary)] animate-pulse" />
                          <div className="text-[13px] text-[var(--text-primary)]">Analyzing…</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-[var(--border-default)] p-3 bg-[var(--bg-surface)]">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ask a question..."
                      onKeyDown={event => {
                        if (event.key === 'Enter' && event.currentTarget.value.trim()) {
                          handleSendMessage(activeAgentId!, event.currentTarget.value.trim());
                          event.currentTarget.value = '';
                        }
                      }}
                      className="flex-1 rounded-md border border-[var(--border-default)] bg-[var(--bg-subtle)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--border-strong)]"
                    />
                    <button
                      onClick={() => {
                        const input = document.querySelector<HTMLInputElement>('#office-input');
                        const value = input?.value.trim();
                        if (value && activeAgentId && input) {
                          handleSendMessage(activeAgentId, value);
                          input.value = '';
                        }
                      }}
                      className="rounded-md px-3 py-2 text-sm font-medium bg-[var(--bg-subtle)] text-[var(--text-primary)] border border-[var(--border-default)]"
                    >
                      Send
                    </button>
                  </div>
                  <input id="office-input" className="hidden" />
                </div>
              </div>

              <aside className="w-[260px] min-w-[260px] flex flex-col overflow-hidden">
                <div className="p-3.5 border-b border-[var(--border-default)]">
                  <h3 className="text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--text-tertiary)] mb-2.5">
                    Data source
                  </h3>
                  {uploadedFiles[activeAgentId!] ? (
                    <>
                      <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-[11px] text-[var(--text-secondary)]">
                        <div className="font-medium text-[var(--text-primary)]">
                          {uploadedFiles[activeAgentId!]?.name}
                        </div>
                        <div>{uploadedFiles[activeAgentId!]?.size}</div>
                      </div>
                      <button
                        onClick={() =>
                          setUploadedFiles(current => ({ ...current, [activeAgentId!]: null }))
                        }
                        className="mt-3 text-[11px] text-red-500"
                      >
                        Remove file
                      </button>
                    </>
                  ) : (
                    <label className="w-full border border-dashed border-[var(--border-strong)] rounded-lg p-4 text-center cursor-pointer hover:bg-[var(--bg-subtle)] transition-colors flex flex-col items-center bg-[var(--bg-surface)]">
                      <FileText className="w-5 h-5 text-[var(--text-tertiary)] mx-auto mb-1" />
                      <div className="text-[11px] text-[var(--text-secondary)] mb-0.5">
                        Drop file or click to upload
                      </div>
                      <div className="text-[10px] text-[var(--text-tertiary)] mb-2">
                        {activeAgent?.acceptedFiles.join(', ')}
                      </div>
                      <input
                        type="file"
                        accept={activeAgent?.acceptedFiles.join(',') || ''}
                        className="hidden"
                        onChange={async event => {
                          const file = event.target.files?.[0];
                          if (file && activeAgentId) {
                            await handleFileUpload(activeAgentId, file);
                            event.target.value = '';
                          }
                        }}
                      />
                    </label>
                  )}
                </div>

                <div className="p-3.5 flex-1 overflow-y-auto">
                  <h3 className="text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--text-tertiary)] mb-2.5">
                    Suggested questions
                  </h3>
                  <div className="space-y-2">
                    {activeAgent?.suggestedQuestions.map(question => (
                      <button
                        key={question}
                        onClick={() => {
                          if (activeAgentId) handleSendMessage(activeAgentId, question);
                        }}
                        className="w-full text-left rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
