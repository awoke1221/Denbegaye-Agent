'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Home,
  LayoutDashboard,
  LayoutGrid,
  Clock,
  Settings,
  Moon,
  Plus,
  Search,
  Sun,
  Star,
  CircleStop,
  LoaderCircle,
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
  getAgentCountByCategoryId,
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
  docs: {
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
  hr: {
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
  ops: {
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
  sales: {
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
  it: {
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
  data: {
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

type ExecutionMode = 'auto' | 'plan' | 'execute' | 'report' | 'graph';

type OfficeExecution = {
  id: string;
  agentId: string;
  prompt: string;
  mode: ExecutionMode;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  error?: string;
  requestId?: string;
};

const seedSessions: Session[] = [];

export default function OfficeIntelligencePage() {
  const { user } = useAuth();
  const [selectedCategoryId, setSelectedCategory] = useState<string | null>(null);
  const [activeAgentId, setActiveAgent] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sessions, setSessions] = useState<Session[]>(seedSessions);
  const [sessionsReady, setSessionsReady] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'recent' | 'favorites'>('all');
  const [activePanel, setActivePanel] = useState<'chat' | 'data' | 'chart'>('chat');
  const [favoriteAgentIds, setFavoriteAgentIds] = useState<string[]>([]);
  const [favoritesReady, setFavoritesReady] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [chatMessages, setChatMessages] = useState<Record<string, Message[]>>(
    () =>
      Object.fromEntries(OFFICE_AGENTS.map(agent => [agent.id, []])) as Record<string, Message[]>
  );
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, UploadedFile | null>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [executionMode, setExecutionMode] = useState<ExecutionMode>('auto');
  const [confirmIrreversible, setConfirmIrreversible] = useState(false);
  const [executions, setExecutions] = useState<OfficeExecution[]>([]);
  const [executionPhase, setExecutionPhase] = useState('Ready to run');
  const activeRequestRef = useRef<AbortController | null>(null);
  const activeExecutionIdRef = useRef<string | null>(null);

  const filteredAgents = useMemo(() => {
    if (!searchQuery) return [];
    return OFFICE_AGENTS.filter(agent =>
      agent.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const hubAgents = useMemo(() => {
    const categoryAgents = selectedCategoryId
      ? OFFICE_AGENTS.filter(agent => agent.categoryId === selectedCategoryId)
      : OFFICE_AGENTS;

    if (activeTab === 'favorites') {
      return categoryAgents.filter(agent => favoriteAgentIds.includes(agent.id));
    }

    if (activeTab === 'recent') {
      return categoryAgents.filter(agent => sessions.some(session => session.agentId === agent.id));
    }

    return categoryAgents;
  }, [activeTab, favoriteAgentIds, selectedCategoryId, sessions]);

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
  const sessionsStorageKey = user ? `office-intelligence-sessions:${user.id}` : null;
  const favoritesStorageKey = user ? `office-intelligence-favorites:${user.id}` : null;
  const executionsStorageKey = user ? `office-intelligence-executions:${user.id}` : null;
  const hydratedSessionsKey = useRef<string | null>(null);
  const hydratedFavoritesKey = useRef<string | null>(null);
  const hydratedExecutionsKey = useRef<string | null>(null);
  const appliedQueryCategory = useRef<string | null>(null);

  const openAgentHub = () => {
    setSearchQuery('');
    setActiveAgent(null);
    setSelectedCategory(null);
    setActiveTab('all');
  };

  const openCategory = (categoryId: string) => {
    setSearchQuery('');
    setActiveAgent(null);
    setSelectedCategory(categoryId);
    setActiveTab('all');
  };

  const openAgentCollection = (tab: 'all' | 'recent' | 'favorites') => {
    setSearchQuery('');
    setActiveAgent(null);
    setSelectedCategory(null);
    setActiveTab(tab);
  };

  const openAgent = (agentId: string) => {
    const agent = getAgentById(agentId);
    setSearchQuery('');
    setActiveAgent(agentId);
    setSelectedCategory(agent?.categoryId ?? null);
    setActiveTab('all');
    setSessions(current => {
      const existing = current.find(session => session.agentId === agentId);
      const nextSession: Session = {
        id: existing?.id ?? `${Date.now()}-${agentId}`,
        agentId,
        title: agent?.name || 'Office Intelligence session',
        meta: 'Active session',
        time: 'Just now',
      };
      return [nextSession, ...current.filter(session => session.agentId !== agentId)];
    });
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const categoryId = params.get('category');
    const agentId = params.get('agent');
    if (agentId && getAgentById(agentId) && appliedQueryCategory.current !== `agent:${agentId}`) {
      appliedQueryCategory.current = `agent:${agentId}`;
      openAgent(agentId);
      return;
    }
    if (
      !categoryId ||
      appliedQueryCategory.current === categoryId ||
      !OFFICE_CATEGORIES.some(category => category.id === categoryId)
    ) {
      return;
    }

    appliedQueryCategory.current = categoryId;
    openCategory(categoryId);
  }, []);

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

  useEffect(() => {
    if (!sessionsStorageKey || hydratedSessionsKey.current === sessionsStorageKey) return;

    setSessionsReady(false);

    try {
      const savedSessions = window.localStorage.getItem(sessionsStorageKey);
      if (savedSessions) {
        const parsedSessions = JSON.parse(savedSessions) as Session[];
        setSessions(Array.isArray(parsedSessions) ? parsedSessions : []);
      }
    } catch {
      setSessions([]);
    } finally {
      hydratedSessionsKey.current = sessionsStorageKey;
      setSessionsReady(true);
    }
  }, [sessionsStorageKey]);

  useEffect(() => {
    if (!sessionsStorageKey || !sessionsReady) return;

    try {
      window.localStorage.setItem(sessionsStorageKey, JSON.stringify(sessions));
    } catch {
      // Recent sessions remain available for the current page when storage is unavailable.
    }
  }, [sessions, sessionsReady, sessionsStorageKey]);

  useEffect(() => {
    if (!favoritesStorageKey || hydratedFavoritesKey.current === favoritesStorageKey) return;

    setFavoritesReady(false);

    try {
      const savedFavorites = window.localStorage.getItem(favoritesStorageKey);
      if (savedFavorites) {
        const parsedFavorites = JSON.parse(savedFavorites) as string[];
        setFavoriteAgentIds(Array.isArray(parsedFavorites) ? parsedFavorites : []);
      } else {
        setFavoriteAgentIds([]);
      }
    } catch {
      setFavoriteAgentIds([]);
    } finally {
      hydratedFavoritesKey.current = favoritesStorageKey;
      setFavoritesReady(true);
    }
  }, [favoritesStorageKey]);

  useEffect(() => {
    if (!favoritesStorageKey || !favoritesReady) return;

    try {
      window.localStorage.setItem(favoritesStorageKey, JSON.stringify(favoriteAgentIds));
    } catch {
      // Favorites remain available for the current page when storage is unavailable.
    }
  }, [favoriteAgentIds, favoritesReady, favoritesStorageKey]);

  useEffect(() => {
    if (!executionsStorageKey || hydratedExecutionsKey.current === executionsStorageKey) return;

    try {
      const savedExecutions = window.localStorage.getItem(executionsStorageKey);
      const parsedExecutions = savedExecutions ? JSON.parse(savedExecutions) : [];
      setExecutions(Array.isArray(parsedExecutions) ? parsedExecutions : []);
    } catch {
      setExecutions([]);
    } finally {
      hydratedExecutionsKey.current = executionsStorageKey;
    }
  }, [executionsStorageKey]);

  useEffect(() => {
    if (!executionsStorageKey || hydratedExecutionsKey.current !== executionsStorageKey) return;

    try {
      window.localStorage.setItem(executionsStorageKey, JSON.stringify(executions.slice(0, 50)));
    } catch {
      // Execution history remains available for this page when storage is unavailable.
    }
  }, [executions, executionsStorageKey]);

  const toggleTheme = () => {
    setTheme(current => {
      const next = current === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      return next;
    });
  };

  const handleSendMessage = async (agentId: string, content: string) => {
    if (isLoading) return;

    const executionId = `${Date.now()}-${agentId}`;
    const startedAt = Date.now();
    const execution: OfficeExecution = {
      id: executionId,
      agentId,
      prompt: content,
      mode: executionMode,
      status: 'running',
      startedAt: new Date(startedAt).toISOString(),
    };
    setExecutions(current => [execution, ...current].slice(0, 50));
    activeExecutionIdRef.current = executionId;

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
    openAgent(agentId);

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

    if (agent?.acceptedFiles.length && !uploadedFile) {
      setChatMessages(current => ({
        ...current,
        [agentId]: [
          ...(current[agentId] || []),
          {
            id: `${Date.now()}-assistant-file-required`,
            role: 'assistant',
            content: `Please upload one of the supported files first: ${agent.acceptedFiles.join(', ')}.`,
            timestamp: new Date(),
          },
        ],
      }));
      return;
    }

    setIsLoading(true);
    setExecutionPhase(
      executionMode === 'plan'
        ? 'Building execution plan'
        : executionMode === 'report'
          ? 'Generating report'
          : executionMode === 'graph'
            ? 'Running LangGraph workflow'
            : 'Analyzing your request'
    );
    const abortController = new AbortController();
    activeRequestRef.current = abortController;

    try {
      const requestBody: Record<string, any> = {
        agent_id: agentId,
        prompt: content,
        mode: executionMode,
        top_k: 5,
        use_langchain: true,
        confirm: confirmIrreversible,
      };

      if (agentId === 'sql-analyst' && uploadedFile && uploadedFile.isDbFile) {
        requestBody.db_file = uploadedFile.content;
      } else if (uploadedFile) {
        requestBody.file_path = uploadedFile?.content;
      }

      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
        body: JSON.stringify(requestBody),
        signal: abortController.signal,
      });

      const payload = await response.json();
      const completedAt = Date.now();
      const assistantContent = response.ok
        ? (payload.answer ?? 'No answer returned from backend.')
        : `Error: ${typeof payload.error === 'string' ? payload.error : (payload.detail?.message ?? payload.detail ?? 'Agent request failed.')}`;

      setExecutions(current =>
        current.map(item =>
          item.id === executionId
            ? {
                ...item,
                status: response.ok ? 'completed' : 'failed',
                completedAt: new Date(completedAt).toISOString(),
                durationMs: completedAt - startedAt,
                error: response.ok ? undefined : assistantContent,
                requestId: response.headers.get('x-request-id') || undefined,
              }
            : item
        )
      );

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
      const completedAt = Date.now();
      const wasCancelled = error instanceof DOMException && error.name === 'AbortError';
      const message = error instanceof Error ? error.message : String(error);
      setExecutions(current =>
        current.map(item =>
          item.id === executionId
            ? {
                ...item,
                status: wasCancelled ? 'cancelled' : 'failed',
                completedAt: new Date(completedAt).toISOString(),
                durationMs: completedAt - startedAt,
                error: wasCancelled ? 'Execution cancelled by the user.' : message,
              }
            : item
        )
      );
      setChatMessages(current => ({
        ...current,
        [agentId]: [
          ...(current[agentId] || []),
          {
            id: `${Date.now()}-assistant-error`,
            role: 'assistant',
            content: wasCancelled
              ? 'Execution cancelled. The worker request was closed from this browser.'
              : `Unable to connect to backend: ${message}`,
            timestamp: new Date(),
          },
        ],
      }));
    } finally {
      setIsLoading(false);
      setExecutionPhase('Ready to run');
      activeRequestRef.current = null;
      activeExecutionIdRef.current = null;
    }
  };

  const cancelActiveExecution = () => {
    if (!activeRequestRef.current || !activeExecutionIdRef.current) return;
    activeRequestRef.current.abort();
  };

  const handleFileUpload = async (agentId: string, file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    const isDbFile = ext === 'db' || ext === 'sqlite' || ext === 'sqlite3' || ext === 'sql';
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

    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/upload-file', {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || data.error || 'Failed to upload file.');
      }

      setUploadedFiles(current => ({
        ...current,
        [agentId]: {
          name: file.name,
          size: `${Math.round(file.size / 1024)} KB`,
          type: file.type || 'application/octet-stream',
          content: data.file_path,
        },
      }));
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
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setChatMessages(current => ({
        ...current,
        [agentId]: [
          ...(current[agentId] || []),
          {
            id: `${Date.now()}-assistant-upload-error`,
            role: 'assistant',
            content: `Failed to upload file: ${message}`,
            timestamp: new Date(),
          },
        ],
      }));
    }
  };

  return (
    <AuthGuard>
      <div className="office-intelligence-shell flex h-screen overflow-hidden bg-[#f4f1ed] text-[var(--text-primary)]">
        <aside className="hidden w-[240px] min-w-[240px] bg-[#e9e4dd] border-r border-[#d7d0c8] md:flex md:flex-col h-full overflow-hidden">
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
            {searchQuery ? (
              <div className="p-2">
                {filteredAgents.length > 0 ? (
                  filteredAgents.map(agent => (
                    <button
                      key={agent.id}
                      onClick={() => openAgent(agent.id)}
                      className="w-full text-left text-xs px-3.5 py-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors duration-150 rounded-sm flex items-center gap-2"
                    >
                      <span className="truncate">{agent.name}</span>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-xs text-[var(--text-tertiary)]">
                    No agents found.
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="px-3.5 pt-3 pb-1">
                  <div className="text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--text-tertiary)] mb-2">
                    Workspace
                  </div>
                  <button
                    type="button"
                    onClick={openAgentHub}
                    className={`flex items-center gap-2 px-3.5 py-2 text-[12px] rounded-[8px] transition-colors duration-100 w-full text-left ${!selectedCategoryId && !activeAgentId ? 'bg-[#f3efe9] text-[#1e1e1e] font-medium' : 'text-[#5b5852] hover:bg-[#f3efe9] hover:text-[#1e1e1e]'}`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Agent hub</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openAgentCollection('recent')}
                    className={`flex items-center gap-2 px-3.5 py-2 text-[12px] rounded-[8px] transition-colors duration-100 relative w-full text-left ${activeTab === 'recent' && !activeAgentId ? 'bg-[#f3efe9] text-[#1e1e1e] font-medium' : 'text-[#5b5852] hover:bg-[#f3efe9] hover:text-[#1e1e1e]'}`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span className="flex-1">Recent sessions</span>
                    <div className="rounded-full text-[10px] px-1.5 py-0.5 flex-shrink-0 bg-[#f7f4f1] text-[#5b5852] border border-[#d7d0c8]">
                      {sessions.length}
                    </div>
                  </button>
                </div>

                <div className="px-3.5 pt-3 pb-1">
                  <div className="text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--text-tertiary)] mb-2">
                    Categories
                  </div>
                  {OFFICE_CATEGORIES.map(category => {
                    const tone = categoryToneMap[category.id] ?? categoryToneMap.documents;
                    return (
                      <button
                        key={category.id}
                        onClick={() => openCategory(category.id)}
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
                          onClick={() => openAgent(session.agentId)}
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
            </div>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-[64px] flex items-center gap-3 px-5 border-b border-[#d7d0c8] bg-[#f6f4f1] flex-shrink-0">
            <div className="text-[24px] font-semibold tracking-[-0.04em] text-[#1d1d1d] flex-1">
              {activeAgent ? activeAgent.name : (selectedCategoryName ?? 'AgentSuite')}
            </div>
            <button
              onClick={() => {
                setActiveAgent(null);
                setSelectedCategory(null);
                setActiveTab('all');
              }}
              className="text-[12px] px-3 py-2 rounded-[8px] border border-[var(--border-default)] bg-[var(--bg-soft)] hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2 text-[var(--text-primary)]"
            >
              <Plus className="w-3.5 h-3.5" /> New session
            </button>
            <Link
              href="/office-intelligence/dashboard"
              aria-label="Open Office Intelligence dashboard"
              title="Office Intelligence dashboard"
              className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[#4a4945] transition-colors hover:bg-[#efebe6]"
            >
              <LayoutDashboard className="h-4 w-4" />
            </Link>
            <button
              type="button"
              aria-label="Return to Agent hub"
              title="Return to Agent hub"
              onClick={openAgentHub}
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
                      onClick={() => openAgentCollection(currentTab)}
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
                  {OFFICE_CATEGORIES.map(category => {
                    const tone = categoryToneMap[category.id] ?? categoryToneMap.documents;
                    return (
                      <div key={category.id} className="transition-all duration-150">
                        <button
                          onClick={() => openCategory(category.id)}
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
                              {getAgentCountByCategoryId(category.id)} tools
                            </span>
                          </div>
                          <div className="text-[15px] font-medium text-[#1d1d1d] mb-0.5">
                            {category.name}
                          </div>
                          <div className="text-[11px] text-[#6f6c67]">
                            {getAgentCountByCategoryId(category.id)} agents
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
                  {hubAgents.map(agent => {
                    const category = getCategoryById(agent.categoryId);
                    const tone = category
                      ? (categoryToneMap[category.id] ?? categoryToneMap.documents)
                      : categoryToneMap.documents;
                    return (
                      <div
                        key={agent.id}
                        className="w-full rounded-[12px] p-3 flex items-start gap-3 transition-all duration-150 text-left bg-[var(--bg-subtle)] border border-[var(--border-default)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-hover)]"
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
                        <button
                          onClick={() => {
                            openAgent(agent.id);
                          }}
                          className="min-w-0 flex-1 text-left"
                        >
                          <div
                            className="w-8 h-8 rounded-[7px] flex-shrink-0 flex items-center justify-center border border-[#e5dfd7]"
                            style={{ backgroundColor: tone.iconBg, color: tone.iconColor }}
                          >
                            <Cpu className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-[13px] font-medium text-[#1d1d1d] leading-tight mb-1">
                              {agent.name}
                            </div>
                            <div className="text-[10px] text-[#6f6c67] font-mono">
                              {agent.libs.join(' · ')}
                            </div>
                          </div>
                        </button>
                        <button
                          type="button"
                          aria-label={
                            favoriteAgentIds.includes(agent.id)
                              ? `Remove ${agent.name} from favorites`
                              : `Add ${agent.name} to favorites`
                          }
                          onClick={event => {
                            event.stopPropagation();
                            setFavoriteAgentIds(current =>
                              current.includes(agent.id)
                                ? current.filter(id => id !== agent.id)
                                : [...current, agent.id]
                            );
                          }}
                          className="shrink-0 p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                        >
                          <Star
                            className="h-3.5 w-3.5"
                            fill={favoriteAgentIds.includes(agent.id) ? 'currentColor' : 'none'}
                          />
                        </button>
                      </div>
                    );
                  })}
                  {hubAgents.length === 0 && (
                    <div className="col-span-full rounded-[12px] border border-dashed border-[var(--border-default)] bg-[var(--bg-subtle)] px-5 py-8 text-center">
                      <div className="text-[13px] font-medium text-[var(--text-primary)]">
                        {activeTab === 'recent'
                          ? 'No recent sessions yet'
                          : 'No favorite agents yet'}
                      </div>
                      <div className="mt-1 text-[11px] text-[var(--text-tertiary)]">
                        {activeTab === 'recent'
                          ? 'Open an agent and send a question to see it here.'
                          : 'Use the star on an agent to add it to Favorites.'}
                      </div>
                      {activeTab === 'recent' && (
                        <button
                          type="button"
                          onClick={openAgentHub}
                          className="mt-3 rounded-md border border-[var(--border-default)] bg-[var(--bg-page)] px-3 py-1.5 text-[11px] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                        >
                          Browse all agents
                        </button>
                      )}
                    </div>
                  )}
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
                  <div
                    className={`flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full border leading-none ${isLoading ? 'border-amber-300 bg-amber-50 text-amber-700' : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border-default)]'}`}
                  >
                    {isLoading && <LoaderCircle className="h-3 w-3 animate-spin" />}
                    {isLoading ? executionPhase : 'ready'}
                  </div>
                </div>

                <div className="px-4 py-2 border-b border-[var(--border-default)] flex flex-wrap items-center gap-2 bg-[var(--bg-surface)]">
                  <label className="flex items-center gap-2 text-[11px] text-[var(--text-secondary)]">
                    <span>Run mode</span>
                    <select
                      value={executionMode}
                      onChange={event => setExecutionMode(event.target.value as ExecutionMode)}
                      className="rounded-md border border-[var(--border-default)] bg-[var(--bg-page)] px-2 py-1 text-[11px] text-[var(--text-primary)]"
                    >
                      <option value="auto">Auto chat</option>
                      <option value="plan">Plan preview</option>
                      <option value="execute">Execute workflow</option>
                      <option value="report">Generate report</option>
                      <option value="graph">LangGraph</option>
                    </select>
                  </label>
                  {(executionMode === 'execute' || executionMode === 'graph') && (
                    <label className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)]">
                      <input
                        type="checkbox"
                        checked={confirmIrreversible}
                        onChange={event => setConfirmIrreversible(event.target.checked)}
                      />
                      Confirm actions
                    </label>
                  )}
                  <button
                    onClick={() => setActivePanel('data')}
                    className={`text-sm px-3 py-1 rounded-full transition-colors duration-150 ${activePanel === 'data' ? 'border border-[var(--border-default)] bg-[var(--bg-page)] text-[var(--text-primary)]' : 'text-[var(--text-tertiary)] hover:bg-[var(--bg-subtle)]'}`}
                  >
                    🔍 Data Preview
                  </button>
                  <button
                    onClick={() => setActivePanel('chat')}
                    className={`text-sm px-3 py-1 rounded-full transition-all duration-150 ${activePanel === 'chat' ? 'border border-[var(--border-default)] bg-[var(--bg-page)] text-[var(--text-primary)]' : 'text-[var(--text-tertiary)] hover:bg-[var(--bg-subtle)]'}`}
                  >
                    💬 Chat with Data
                  </button>
                  <button
                    onClick={() => setActivePanel('chart')}
                    className={`relative text-sm px-3 py-1 rounded-full transition-colors duration-150 leading-none ${activePanel === 'chart' ? 'border border-[var(--border-default)] bg-[var(--bg-page)] text-[var(--text-primary)]' : 'text-[var(--text-tertiary)] hover:bg-[var(--bg-subtle)]'}`}
                  >
                    📈 Chart Preview
                    {chartMessages.length > 0 ? (
                      <span className="absolute top-0 right-0 -mt-1 -mr-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[10px] font-semibold text-[var(--text-primary)] bg-[var(--bg-subtle)] border border-[var(--border-default)]">
                        {chartMessages.length}
                      </span>
                    ) : null}
                  </button>
                </div>

                {activePanel === 'data' ? (
                  <div className="flex-1 overflow-y-auto p-4 bg-[var(--bg-page)]">
                    <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 text-sm text-[var(--text-secondary)]">
                      {uploadedFiles[activeAgentId!] ? (
                        <>
                          <div className="font-medium text-[var(--text-primary)]">
                            {uploadedFiles[activeAgentId!]?.name}
                          </div>
                          <div className="mt-1">{uploadedFiles[activeAgentId!]?.size}</div>
                          <div className="mt-3 text-xs text-[var(--text-tertiary)]">
                            This file is ready to use with {activeAgent?.name}.
                          </div>
                        </>
                      ) : (
                        'Upload a file to preview its data source here.'
                      )}
                    </div>
                  </div>
                ) : activePanel === 'chart' ? (
                  <div className="flex-1 overflow-y-auto p-4 bg-[var(--bg-page)]">
                    {chartMessages.length > 0 ? (
                      chartMessages.map(message => (
                        <img
                          key={message.id}
                          src={message.chart!}
                          alt="Chart preview"
                          className="mb-3 max-w-full rounded-lg border border-[var(--border-default)]"
                        />
                      ))
                    ) : (
                      <div className="text-sm text-[var(--text-tertiary)]">
                        Charts returned by the agent will appear here.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2.5 bg-[var(--bg-page)]">
                    {activeMessages.length === 0 ? (
                      <div className="max-w-[88%] self-start flex flex-col">
                        <div className="text-[10px] text-[var(--text-tertiary)] mb-1 pl-1">
                          agent
                        </div>
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
                        <div className="text-[10px] text-[var(--text-tertiary)] mb-1 pl-1">
                          agent
                        </div>
                        <div className="text-[13px] leading-relaxed rounded-[10px] px-3 py-2 border-l-2 bg-[var(--bg-page)] border-[var(--border-strong)]">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-[var(--text-tertiary)] animate-pulse" />
                            <div className="text-[13px] text-[var(--text-primary)]">
                              {executionPhase}…
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activePanel === 'chat' && (
                  <div className="border-t border-[var(--border-default)] p-3 bg-[var(--bg-surface)]">
                    <div className="flex gap-2">
                      <input
                        id="office-input"
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
                      {isLoading ? (
                        <button
                          type="button"
                          onClick={cancelActiveExecution}
                          className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
                        >
                          <CircleStop className="h-4 w-4" /> Stop
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.querySelector<HTMLInputElement>('#office-input');
                            const value = input?.value.trim();
                            if (value && activeAgentId && input) {
                              handleSendMessage(activeAgentId, value);
                              input.value = '';
                            }
                          }}
                          className="rounded-md bg-[var(--button-bg)] px-3 py-2 text-sm font-medium text-[var(--button-text)] hover:opacity-90"
                        >
                          Run analysis
                        </button>
                      )}
                    </div>
                  </div>
                )}
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
