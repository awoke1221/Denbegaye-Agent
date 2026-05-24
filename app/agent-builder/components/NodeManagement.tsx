'use client';

import { useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileText, Zap, Eye, EyeOff, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Node, Edge } from 'reactflow';
import { availableNodeTypes, AgentNodeTypeField } from '../constants/nodeTypes';
import { useVariablePicker } from '../hooks/useVariablePicker';
import { VariableInput } from './VariableInput';
import { VariableTextarea } from './VariableTextarea';
import { AgentNodeData } from '@/stores/agentBuilderStore';
import { AgentWorkflow, UserAgent } from '@/types/agent';

type NodeManagementProps = {
  activeSection: string;
  showNodePalette: boolean;
  setShowNodePalette: (value: boolean) => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  nodePalettePosition: { x: number; y: number };
  settingsPosition: { x: number; y: number };
  nodeConfigPosition: { x: number; y: number };
  draggingPane: null | 'palette' | 'settings' | 'nodeConfig';
  setDraggingPane: (value: null | 'palette' | 'settings' | 'nodeConfig') => void;
  dragOffset: { x: number; y: number };
  setDragOffset: (value: { x: number; y: number }) => void;
  selectedNode: Node<any> | undefined;
  selectedNodeId: string | null;
  nodes: Node[];
  edges: Edge[];
  credentials: any[];
  credentialForm: { provider: string; label: string; apiKey: string };
  setCredentialForm: (value: { provider: string; label: string; apiKey: string }) => void;
  loadCredentials: () => Promise<void>;
  loadCredentialIntoNode: (provider: string, nodeId?: string) => void;
  updateNodeConfig: (nodeId: string, configUpdates: Record<string, any>) => void;
  apiKeys: {
    openai: string;
    gemini: string;
    deepseek: string;
    gmail: string;
  };
  setApiKeys: (value: { openai: string; gemini: string; deepseek: string; gmail: string }) => void;
  saveApiKeys: () => void;
  renderIcon: (icon: any, className?: string) => React.ReactNode;
  selectNode: (id?: string) => void;
  copyConfig: (config: any) => void;
  duplicateNode: (nodeId: string) => void;
  duplicateEdge: (edgeId: string) => void;
  undo: () => void;
  redo: () => void;
  setContextMenu: (value: {
    type: 'node' | 'edge' | 'canvas' | null;
    id?: string;
    x: number;
    y: number;
    data?: any;
  }) => void;
  contextMenu: {
    type: 'node' | 'edge' | 'canvas' | null;
    id?: string;
    x: number;
    y: number;
    data?: any;
  };
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  setActiveSection: (section: string) => void;
  setLog: (updater: (prev: string[]) => string[]) => void;
  nodeTypeCategory: (nodeType: string) => string;
  isNodeConfigured: (node: Node<any>) => boolean;
  executionResults?: Record<string, any> | null;
};

export function NodeManagement({
  activeSection,
  showNodePalette,
  setShowNodePalette,
  searchQuery,
  setSearchQuery,
  nodePalettePosition,
  settingsPosition,
  nodeConfigPosition,
  draggingPane,
  setDraggingPane,
  dragOffset,
  setDragOffset,
  selectedNode,
  selectedNodeId,
  nodes,
  edges,
  credentials,
  credentialForm,
  setCredentialForm,
  loadCredentials,
  loadCredentialIntoNode,
  updateNodeConfig,
  apiKeys,
  setApiKeys,
  saveApiKeys,
  renderIcon,
  selectNode,
  copyConfig,
  duplicateNode,
  duplicateEdge,
  undo,
  redo,
  setContextMenu,
  contextMenu,
  setNodes,
  setEdges,
  setActiveSection,
  setLog,
  nodeTypeCategory,
  isNodeConfigured,
  executionResults,
}: NodeManagementProps) {
  const { user, signInWithGoogleForService } = useAuth();
  const [availableSpreadsheets, setAvailableSpreadsheets] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [availableSheetNames, setAvailableSheetNames] = useState<string[]>([]);
  const [googleMetadataLoading, setGoogleMetadataLoading] = useState(false);
  const [googleMetadataError, setGoogleMetadataError] = useState<string | null>(null);

  const getStoredServiceToken = (service: string) => {
    if (typeof window === 'undefined') return null;
    const stored = window.localStorage.getItem(`serviceToken:${service}`);
    if (!stored) return null;

    try {
      const parsed = JSON.parse(stored) as {
        access_token: string;
        refresh_token?: string;
        timestamp: number;
      };
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;
      if (parsed.access_token && now - parsed.timestamp < oneHour) {
        return parsed.access_token;
      }
      window.localStorage.removeItem(`serviceToken:${service}`);
    } catch (error) {
      console.error('Failed to parse stored service token', error);
      window.localStorage.removeItem(`serviceToken:${service}`);
    }
    return null;
  };

  const getServiceToken = async (service: string) => {
    const config = (selectedNode?.data?.config || {}) as Record<string, any>;
    const serviceTokens = config.serviceTokens || {};

    if (serviceTokens[service]?.access_token) {
      const tokenTimestamp = serviceTokens[service].timestamp;
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;

      if (now - tokenTimestamp < oneHour) {
        return serviceTokens[service].access_token;
      }
    }

    return getStoredServiceToken(service);
  };

  const authenticateService = async (service: string) => {
    if (!selectedNode) {
      throw new Error('No node selected for service authentication.');
    }

    try {
      const result = await signInWithGoogleForService(service, selectedNode.id);
      if (result) {
        const serviceTokens = (selectedNode.data?.config?.serviceTokens || {}) as Record<
          string,
          any
        >;
        serviceTokens[service] = {
          ...result,
          timestamp: Date.now(),
        };

        updateNodeConfig(selectedNode.id, { serviceTokens });
        return result.access_token;
      }
    } catch (error) {
      console.error(`Failed to authenticate ${service}:`, error);
      throw error;
    }
    return null;
  };

  const getGoogleProviderToken = async () => {
    const sessionResponse = await supabase.auth.getSession();
    const session = sessionResponse.data?.session as any;
    if (session?.provider_token) {
      return session.provider_token;
    }

    return await getServiceToken('sheets');
  };

  const updateGoogleAuthConfig = async () => {
    if (!selectedNode || selectedNode.type !== 'data-google-sheets') return;
    const config = (selectedNode.data?.config || {}) as Record<string, any>;
    if (config.authMethod === 'google-oauth') {
      try {
        let token = await getServiceToken('sheets');
        if (!token) {
          token = await authenticateService('sheets');
        }
        if (token) {
          updateNodeConfig(selectedNode.id, { providerToken: token });
        }
      } catch (error) {
        console.error('Failed to get provider token', error);
      }
    }
  };

  const fetchGoogleSpreadsheets = async () => {
    setGoogleMetadataError(null);
    setGoogleMetadataLoading(true);
    try {
      let token = await getServiceToken('sheets');
      if (!token) {
        token = await authenticateService('sheets');
      }

      if (!token) {
        setGoogleMetadataError(
          'No Google access token available. Please connect your Google account with Drive and Sheets permissions using the "Connect Google" button above.'
        );
        return;
      }

      const query = "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false";
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?fields=files(id,name)&q=${encodeURIComponent(query)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Unable to load Google Sheets files.');
      }
      setAvailableSpreadsheets(data.files || []);
    } catch (error) {
      console.error('Error loading Google spreadsheets', error);
      setGoogleMetadataError(
        error instanceof Error ? error.message : 'Unable to fetch Google spreadsheets.'
      );
    } finally {
      setGoogleMetadataLoading(false);
    }
  };

  const fetchGoogleSheetNames = async (spreadsheetId: string) => {
    if (!spreadsheetId) {
      setAvailableSheetNames([]);
      return;
    }
    setGoogleMetadataError(null);
    setGoogleMetadataLoading(true);
    try {
      let token = await getServiceToken('sheets');
      if (!token) {
        token = await authenticateService('sheets');
      }

      if (!token) {
        setGoogleMetadataError(
          'No Google access token available. Please connect your Google account with Drive and Sheets permissions using the "Connect Google" button above.'
        );
        setAvailableSheetNames([]);
        return;
      }
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
          spreadsheetId
        )}?fields=sheets(properties(title))`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Unable to load sheet tabs.');
      }
      const sheets = (data.sheets || [])
        .map((sheet: any) => sheet.properties?.title || '')
        .filter(Boolean);
      setAvailableSheetNames(sheets);
    } catch (error) {
      console.error('Failed to load sheet names', error);
      setGoogleMetadataError(
        error instanceof Error ? error.message : 'Unable to fetch sheet names.'
      );
      setAvailableSheetNames([]);
    } finally {
      setGoogleMetadataLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedNode) return;
    const config = (selectedNode.data?.config || {}) as Record<string, any>;
    if (config.authMethod !== 'google-oauth') {
      setAvailableSpreadsheets([]);
      setAvailableSheetNames([]);
      setGoogleMetadataError(null);
      return;
    }
    updateGoogleAuthConfig();
    fetchGoogleSpreadsheets();
    if (config.spreadsheetId) {
      fetchGoogleSheetNames(config.spreadsheetId);
    } else {
      setAvailableSheetNames([]);
    }
  }, [
    selectedNode?.id,
    selectedNode?.data?.config?.authMethod,
    selectedNode?.data?.config?.spreadsheetId,
    user?.id,
  ]);

  const { availableVariables } = useVariablePicker(
    selectedNodeId ?? '',
    nodes,
    edges,
    executionResults ?? undefined
  );

  const renderVariableInput = ({
    label,
    value,
    onChange,
    placeholder,
    required,
    description,
    disabled,
    fieldKey,
    type = 'text',
    className,
  }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
    description?: string;
    disabled?: boolean;
    fieldKey: string;
    type?: 'text' | 'password' | 'email';
    className?: string;
  }) => (
    <VariableInput
      label={label}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      description={description}
      disabled={disabled}
      fieldKey={fieldKey}
      availableVariables={availableVariables}
      type={type}
      className={className}
      executionResults={executionResults}
    />
  );

  const renderVariableTextarea = ({
    label,
    value,
    onChange,
    placeholder,
    required,
    description,
    disabled,
    fieldKey,
    rows,
    className,
  }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
    description?: string;
    disabled?: boolean;
    fieldKey: string;
    rows?: number;
    className?: string;
  }) => (
    <VariableTextarea
      label={label}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      description={description}
      disabled={disabled}
      fieldKey={fieldKey}
      availableVariables={availableVariables}
      rows={rows}
      className={className}
      executionResults={executionResults}
    />
  );

  const groupedNodeTypes = useMemo(() => {
    return availableNodeTypes.reduce((acc: Record<string, typeof availableNodeTypes>, node) => {
      if (!acc[node.category]) acc[node.category] = [];
      if (!acc[node.category].some(existing => existing.id === node.id)) {
        acc[node.category].push(node);
      }
      return acc;
    }, {});
  }, []);

  const renderNodeConfigForm = (node: Node<any>) => {
    const config = (node.data.config || {}) as Record<string, any>;
    const credentialOptions = credentials.map(cred => ({
      value: cred.provider,
      label: cred.label || cred.provider,
    }));

    const normalizeConfigKey = (label: string) =>
      label
        .replace(/[^a-zA-Z0-9]+/g, ' ')
        .trim()
        .split(' ')
        .map((part, index) =>
          index === 0 ? part.toLowerCase() : part.charAt(0).toUpperCase() + part.slice(1)
        )
        .join('');

    const getNodeTypeMetadata = (type?: string) =>
      type ? availableNodeTypes.find(nodeType => nodeType.id === type) : undefined;

    const getModelOptionsForProvider = (provider?: string) => {
      switch ((provider || '').toString().toLowerCase()) {
        case 'openai':
          return ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'];
        case 'gemini':
          return [
            'gemini-2.5-flash',
            'gemini-2.0-pro',
            'gemini-2.0-flash',
            'gemini-1.5-pro',
            'gemini-1.5-flash',
            'gemini-1.0-pro',
            'gemini-1.0-flash',
          ];
        case 'anthropic':
          return [
            'claude-3.5-sonnet-20241022',
            'claude-3.5-haiku-20241022',
            'claude-3-opus-20240229',
          ];
        case 'deepseek':
          return ['deepseek-v4-flash', 'deepseek-v4-pro', 'deepseek-chat', 'deepseek-reasoner'];
        case 'groq':
          return ['groq-1.0', 'groq-1.5'];
        default:
          return [];
      }
    };

    const getReactAgentToolOptions = () =>
      availableNodeTypes
        .filter(
          item =>
            item.id !== node.type &&
            item.id !== 'group' &&
            item.category.toLowerCase() !== 'ai' &&
            item.category.toLowerCase() !== 'agent orchestration'
        )
        .map(item => ({ value: item.id, label: item.label }));

    const renderConfigField = (node: Node<any>, field: AgentNodeTypeField) => {
      const key = normalizeConfigKey(field.l);
      const rawValue = node.data?.config?.[key];
      const value =
        rawValue === undefined
          ? field.t === 'checkbox' || field.t === 'boolean'
            ? false
            : field.t === 'multiselect'
              ? []
              : field.d !== undefined
                ? field.d
                : ''
          : rawValue;

      // Check if field should be displayed based on condition
      if (field.condition) {
        const shouldShow = field.condition(node.data?.config || {});
        if (!shouldShow) return null;
      }

      const updateValue = (newValue: any) => {
        if (node.type === 'react-agent' && field.l === 'LLM Provider') {
          updateNodeConfig(node.id, { [key]: newValue, model: '' });
        } else {
          updateNodeConfig(node.id, { [key]: newValue });
        }
      };

      return (
        <div
          key={`${node.id}-${key}`}
          className="rounded-[12px] border border-[var(--color-border)] bg-slate-50/90 p-4 transition-all duration-200 dark:bg-slate-900/80 dark:border-slate-700/70"
          style={{
            padding: '16px',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.borderColor = '#667eea';
            (e.currentTarget as HTMLElement).style.boxShadow =
              '0 0 0 2px rgba(102, 126, 234, 0.05)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)';
            (e.currentTarget as HTMLElement).style.boxShadow = 'none';
          }}
        >
          {field.t === 'checkbox' || field.t === 'boolean' ? (
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={Boolean(value)}
                onChange={e => updateValue(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div style={{ flex: 1 }}>
                <div
                  style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-foreground)' }}
                >
                  {field.l}
                </div>
                {field.h && (
                  <div
                    style={{
                      fontSize: '12px',
                      color: 'var(--color-muted-foreground)',
                      marginTop: '4px',
                    }}
                  >
                    {field.h}
                  </div>
                )}
              </div>
            </label>
          ) : field.t === 'select' ? (
            <>
              <Label
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--color-foreground)',
                  marginBottom: '8px',
                }}
              >
                {field.l}
                {field.required !== false && (
                  <span style={{ color: '#ef4444', marginLeft: '4px' }}>•</span>
                )}
              </Label>
              {(() => {
                const provider =
                  node.data?.config?.llmProvider || node.data?.config?.provider || '';
                const dynamicOptions =
                  node.type === 'react-agent' && field.l === 'Model'
                    ? getModelOptionsForProvider(provider.toString().toLowerCase())
                    : field.o || [];
                const isModelFieldWithoutProvider =
                  node.type === 'react-agent' && field.l === 'Model' && !provider;
                return (
                  <>
                    <Select
                      value={String(value)}
                      onValueChange={updateValue}
                      disabled={isModelFieldWithoutProvider || dynamicOptions.length === 0}
                    >
                      <SelectTrigger className="mt-1 w-full">
                        <SelectValue
                          placeholder={
                            isModelFieldWithoutProvider
                              ? 'Select provider first'
                              : field.d
                                ? `${field.d}`
                                : `Select ${field.l}`
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {dynamicOptions.map(option => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isModelFieldWithoutProvider && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Choose an LLM provider first to see available model options.
                      </p>
                    )}
                  </>
                );
              })()}
            </>
          ) : field.t === 'textarea' ? (
            <VariableTextarea
              label={field.l}
              fieldKey={`${node.id}-${key}`}
              value={String(value)}
              onChange={value => updateValue(value)}
              placeholder={field.h}
              required={field.required !== false}
              availableVariables={availableVariables}
              description={field.h}
              className="mt-1 h-40"
            />
          ) : field.t === 'multiselect' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Label
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--color-foreground)',
                }}
              >
                {field.l}
                {field.required !== false && (
                  <span style={{ color: '#ef4444', marginLeft: '4px' }}>•</span>
                )}
              </Label>
              {(field.o?.length
                ? field.o
                : getReactAgentToolOptions().map(option => option.value)
              ).map(option => {
                const selectedValues = Array.isArray(value) ? value : [];
                const isChecked = selectedValues.includes(option);
                return (
                  <label
                    key={option}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: 'pointer',
                      padding: '8px 10px',
                      borderRadius: '10px',
                      transition: 'all 0.2s ease',
                      background: isChecked ? 'rgba(102, 126, 234, 0.05)' : 'transparent',
                      border: isChecked
                        ? '1px solid rgba(102, 126, 234, 0.2)'
                        : '1px solid transparent',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background =
                        'rgba(102, 126, 234, 0.03)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = isChecked
                        ? 'rgba(102, 126, 234, 0.05)'
                        : 'transparent';
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={e => {
                        const nextValues = e.target.checked
                          ? [...selectedValues, option]
                          : selectedValues.filter((item: string) => item !== option);
                        updateValue(nextValues);
                      }}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span style={{ fontSize: '13px', color: 'var(--color-foreground)' }}>
                      {option}
                    </span>
                  </label>
                );
              })}
            </div>
          ) : field.t === 'password' ? (
            <VariableInput
              label={field.l}
              fieldKey={`${node.id}-${key}`}
              value={String(value)}
              onChange={value => updateValue(value)}
              placeholder={field.h}
              required={field.required !== false}
              availableVariables={availableVariables}
              type="password"
              description={field.h}
              className="mt-1"
            />
          ) : field.t === 'number' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--color-foreground)',
                }}
              >
                {field.l}
                {field.required !== false && (
                  <span style={{ color: '#ef4444', marginLeft: '4px' }}>•</span>
                )}
              </label>
              <Input
                type="number"
                value={value === false ? '' : String(value)}
                onChange={e => updateValue(Number(e.target.value))}
                placeholder={field.h}
                className="mt-1"
              />
              {field.h && (
                <p style={{ fontSize: '12px', color: 'var(--color-muted-foreground)', margin: 0 }}>
                  {field.h}
                </p>
              )}
            </div>
          ) : (
            <VariableInput
              label={field.l}
              fieldKey={`${node.id}-${key}`}
              value={String(value)}
              onChange={value => updateValue(value)}
              placeholder={field.h}
              required={field.required !== false}
              availableVariables={availableVariables}
              description={field.h}
              className="mt-1"
            />
          )}
        </div>
      );
    };

    const renderGenericNodeConfig = (node: Node<any>) => {
      const metadata = getNodeTypeMetadata(node.type);
      if (!metadata?.configs?.length) return null;
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {metadata.configs.map(field => renderConfigField(node, field)).filter(Boolean)}
        </div>
      );
    };

    const commonInputs = (
      <>
        <div>
          <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Credential
          </Label>
          <Select
            value={config.credentialProvider || 'manual'}
            onValueChange={value =>
              updateNodeConfig(node.id, {
                credentialProvider: value === 'manual' ? null : value,
              })
            }
          >
            <SelectTrigger className="mt-1 w-full">
              <SelectValue placeholder="Select credential" />
            </SelectTrigger>
            <SelectContent>
              {credentialOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
            API Key / Credential
          </Label>
          <Input
            type="password"
            value={config.apiKey || ''}
            onChange={e => updateNodeConfig(node.id, { apiKey: e.target.value })}
            placeholder="Use a saved credential or paste a key"
            className="mt-1"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gemini nodes require either a saved credential or a direct API key.
          </p>
        </div>
      </>
    );

    switch (node.type) {
      // HARDCODED GEMINI CONFIG DISABLED - Using generic renderer instead
      // See nodeTypes.tsx for Gemini AI node configuration metadata

      case 'data-google-sheets':
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Authentication Method
              </Label>
              <Select
                value={config.authMethod || 'manual'}
                onValueChange={value =>
                  updateNodeConfig(node.id, {
                    authMethod: value,
                    credentialProvider: value === 'google-oauth' ? null : config.credentialProvider,
                  })
                }
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="Select authentication method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="google-oauth">Google OAuth</SelectItem>
                  <SelectItem value="manual">Manual or Saved Credential</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {config.authMethod === 'google-oauth' ? (
              <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4 text-sm dark:border-slate-700/80 dark:bg-slate-900/80">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      Google Sheets Account
                    </Label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {config.serviceTokens?.sheets?.access_token
                        ? `Connected to Google Sheets`
                        : 'Connect a separate Google account for Sheets access.'}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={async () => {
                      try {
                        await authenticateService('sheets');
                        setLog(prev => [...prev, 'Google Sheets account connected successfully.']);
                      } catch (error) {
                        console.error('Google Sheets authentication failed', error);
                        setLog(prev => [...prev, 'Google Sheets authentication failed.']);
                      }
                    }}
                    className="mt-1"
                  >
                    {config.serviceTokens?.sheets?.access_token
                      ? 'Reconnect Sheets'
                      : 'Connect Sheets'}
                  </Button>
                </div>
                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                  This connects to a separate Google account specifically for Google Sheets access,
                  independent of your main login account.
                </p>
              </div>
            ) : (
              commonInputs
            )}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Spreadsheet ID
                  </Label>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Load available spreadsheets from your connected Google account.
                  </p>
                </div>
                {config.authMethod === 'google-oauth' && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={fetchGoogleSpreadsheets}
                    disabled={googleMetadataLoading}
                    className="mt-1"
                  >
                    {googleMetadataLoading ? 'Loading…' : 'Refresh spreadsheets'}
                  </Button>
                )}
              </div>

              {availableSpreadsheets.length > 0 ? (
                <Select
                  value={config.spreadsheetId || ''}
                  onValueChange={value => {
                    updateNodeConfig(node.id, { spreadsheetId: value });
                  }}
                >
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue placeholder="Select a spreadsheet" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSpreadsheets.map(spreadsheet => (
                      <SelectItem key={spreadsheet.id} value={spreadsheet.id}>
                        {spreadsheet.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <VariableInput
                  label="Spreadsheet ID"
                  fieldKey={`${node.id}-spreadsheetId`}
                  value={config.spreadsheetId || ''}
                  onChange={value => updateNodeConfig(node.id, { spreadsheetId: value })}
                  placeholder="Enter Google Sheets spreadsheet ID"
                  className="mt-1"
                  availableVariables={availableVariables}
                />
              )}

              {config.authMethod === 'google-oauth' &&
                !availableSpreadsheets.length &&
                !googleMetadataLoading && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Use the refresh button to load spreadsheets from the connected Google account.
                  </p>
                )}
              {googleMetadataError && (
                <p className="text-xs text-rose-600 dark:text-rose-400">
                  {googleMetadataError}
                  {googleMetadataError.includes('insufficient authentication scopes') && (
                    <span className="block mt-1">
                      Try reconnecting your Google account to grant the necessary permissions.
                    </span>
                  )}
                </p>
              )}
            </div>
            {availableSheetNames.length > 0 &&
              [
                'read',
                'append',
                'update',
                'clear',
                'find',
                'upsert',
                'delete',
                'bulkDeleteRows',
                'formatCells',
              ].includes(config.action || '') && (
                <div>
                  <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Sheet Name
                  </Label>
                  <Select
                    value={config.sheetName || ''}
                    onValueChange={value => updateNodeConfig(node.id, { sheetName: value })}
                  >
                    <SelectTrigger className="mt-1 w-full">
                      <SelectValue placeholder="Select sheet tab" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSheetNames.map(sheetName => (
                        <SelectItem key={sheetName} value={sheetName}>
                          {sheetName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            <div>
              <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Action
              </Label>
              <Select
                value={config.action || 'read'}
                onValueChange={value => updateNodeConfig(node.id, { action: value })}
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="read">Read Data</SelectItem>
                  <SelectItem value="append">Append Rows</SelectItem>
                  <SelectItem value="update">Update Range</SelectItem>
                  <SelectItem value="delete">Delete Rows</SelectItem>
                  <SelectItem value="clear">Clear Range</SelectItem>
                  <SelectItem value="find">Find Rows</SelectItem>
                  <SelectItem value="upsert">Upsert Row</SelectItem>
                  <SelectItem value="createSpreadsheet">Create Spreadsheet</SelectItem>
                  <SelectItem value="createSheet">Create Sheet</SelectItem>
                  <SelectItem value="deleteSheet">Delete Sheet</SelectItem>
                  <SelectItem value="getMetadata">Get Metadata</SelectItem>
                  <SelectItem value="listSpreadsheets">List Spreadsheets</SelectItem>
                  <SelectItem value="batchUpdate">Batch Update</SelectItem>
                  <SelectItem value="formatCells">Format Cells</SelectItem>
                  <SelectItem value="bulkDeleteRows">Bulk Delete Rows</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(config.action === 'read' ||
              config.action === 'append' ||
              config.action === 'update' ||
              config.action === 'clear' ||
              config.action === 'find' ||
              config.action === 'upsert' ||
              config.action === 'formatCells') && (
              <div>
                <VariableInput
                  label="Sheet Name or Range"
                  fieldKey={`${node.id}-sheetNameOrRange`}
                  value={config.sheetName || config.range || ''}
                  onChange={value => {
                    if (value.includes('!')) {
                      updateNodeConfig(node.id, { range: value, sheetName: '' });
                    } else {
                      updateNodeConfig(node.id, { sheetName: value, range: '' });
                    }
                  }}
                  placeholder="Sheet1 or Sheet1!A1:B10"
                  className="mt-1"
                  availableVariables={availableVariables}
                />
              </div>
            )}
            {(config.action === 'find' || config.action === 'upsert') && (
              <>
                <div>
                  <VariableInput
                    label="Column"
                    fieldKey={`${node.id}-column`}
                    value={config.column || ''}
                    onChange={value => updateNodeConfig(node.id, { column: value })}
                    placeholder="Column name or number (e.g., 'Name' or 1)"
                    className="mt-1"
                    availableVariables={availableVariables}
                  />
                </div>
                <div>
                  <VariableInput
                    label="Value"
                    fieldKey={`${node.id}-value`}
                    value={config.value || ''}
                    onChange={value => updateNodeConfig(node.id, { value })}
                    placeholder="Value to match"
                    className="mt-1"
                    availableVariables={availableVariables}
                  />
                </div>
              </>
            )}
          </div>
        );
      case 'data-gmail':
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Authentication Method
              </Label>
              <Select
                value={config.authMethod || 'manual'}
                onValueChange={value => updateNodeConfig(node.id, { authMethod: value })}
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="Select authentication method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="google-oauth">Google OAuth</SelectItem>
                  <SelectItem value="manual">Manual / Saved Credential</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {config.authMethod === 'google-oauth' ? (
              <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4 text-sm dark:border-slate-700/80 dark:bg-slate-900/80">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      Gmail Account
                    </Label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {config.serviceTokens?.gmail?.access_token
                        ? `Connected to Gmail`
                        : 'Connect a separate Google account for Gmail access.'}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={async () => {
                      try {
                        await authenticateService('gmail');
                        setLog(prev => [...prev, 'Gmail account connected successfully.']);
                      } catch (error) {
                        console.error('Gmail authentication failed', error);
                        setLog(prev => [...prev, 'Gmail authentication failed.']);
                      }
                    }}
                    className="mt-1"
                  >
                    {config.serviceTokens?.gmail?.access_token
                      ? 'Reconnect Gmail'
                      : 'Connect Gmail'}
                  </Button>
                </div>
                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                  This connects to a separate Google account specifically for Gmail access,
                  independent of your main login account.
                </p>
              </div>
            ) : (
              commonInputs
            )}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Action
                </Label>
                <Select
                  value={config.action || 'send'}
                  onValueChange={value => updateNodeConfig(node.id, { action: value })}
                >
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue placeholder="Select Gmail action" />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      'send',
                      'reply',
                      'search',
                      'get',
                      'copy',
                      'move',
                      'updateLabels',
                      'markAsRead',
                      'markAsUnread',
                      'delete',
                      'createDraft',
                      'sendDraft',
                      'listAttachments',
                      'downloadAttachment',
                      'batchSend',
                      'batchDelete',
                      'batchLabel',
                      'createLabel',
                      'deleteLabel',
                      'getThread',
                      'replyToThread',
                      'forward',
                      'createFilter',
                      'apiCall',
                    ].map(action => (
                      <SelectItem key={action} value={action}>
                        {action.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Basic Email Fields */}
              {(config.action === 'send' ||
                config.action === 'reply' ||
                config.action === 'forward' ||
                config.action === 'batchSend') && (
                <>
                  <div>
                    <VariableInput
                      label="To"
                      fieldKey={`${node.id}-to`}
                      value={config.to || ''}
                      onChange={value => updateNodeConfig(node.id, { to: value })}
                      placeholder="recipient@example.com"
                      className="mt-1"
                      availableVariables={availableVariables}
                    />
                  </div>
                  <div>
                    <VariableInput
                      label="Subject"
                      fieldKey={`${node.id}-subject`}
                      value={config.subject || ''}
                      onChange={value => updateNodeConfig(node.id, { subject: value })}
                      placeholder="Email subject"
                      className="mt-1"
                      availableVariables={availableVariables}
                    />
                  </div>
                  <div>
                    <VariableTextarea
                      label="Body"
                      fieldKey={`${node.id}-body`}
                      value={config.body || ''}
                      onChange={value => updateNodeConfig(node.id, { body: value })}
                      placeholder="Plain text body"
                      className="mt-1 h-24"
                      availableVariables={availableVariables}
                    />
                  </div>
                  <div>
                    <VariableTextarea
                      label="HTML Body"
                      fieldKey={`${node.id}-htmlBody`}
                      value={config.htmlBody || ''}
                      onChange={value => updateNodeConfig(node.id, { htmlBody: value })}
                      placeholder="HTML body content"
                      className="mt-1 h-24"
                      availableVariables={availableVariables}
                    />
                  </div>
                  <div>
                    <VariableInput
                      label="Template ID"
                      fieldKey={`${node.id}-templateId`}
                      value={config.templateId || ''}
                      onChange={value => updateNodeConfig(node.id, { templateId: value })}
                      placeholder="Email template identifier"
                      className="mt-1"
                      availableVariables={availableVariables}
                    />
                  </div>
                </>
              )}

              {/* Message/Thread IDs */}
              {(config.action === 'get' ||
                config.action === 'reply' ||
                config.action === 'copy' ||
                config.action === 'move' ||
                config.action === 'updateLabels' ||
                config.action === 'markAsRead' ||
                config.action === 'markAsUnread' ||
                config.action === 'delete' ||
                config.action === 'listAttachments' ||
                config.action === 'downloadAttachment' ||
                config.action === 'getThread' ||
                config.action === 'replyToThread') && (
                <div>
                  <VariableInput
                    label="Message ID"
                    fieldKey={`${node.id}-messageId`}
                    value={config.messageId || ''}
                    onChange={value => updateNodeConfig(node.id, { messageId: value })}
                    placeholder="Gmail message ID"
                    className="mt-1"
                    availableVariables={availableVariables}
                  />
                </div>
              )}

              {(config.action === 'getThread' || config.action === 'replyToThread') && (
                <div>
                  <VariableInput
                    label="Thread ID"
                    fieldKey={`${node.id}-threadId`}
                    value={config.threadId || ''}
                    onChange={value => updateNodeConfig(node.id, { threadId: value })}
                    placeholder="Gmail thread ID"
                    className="mt-1"
                    availableVariables={availableVariables}
                  />
                </div>
              )}

              {/* Search Query */}
              {config.action === 'search' && (
                <div>
                  <VariableInput
                    label="Search Query"
                    fieldKey={`${node.id}-searchQuery`}
                    value={config.searchQuery || ''}
                    onChange={value => updateNodeConfig(node.id, { searchQuery: value })}
                    placeholder="is:unread from:example.com"
                    className="mt-1"
                    availableVariables={availableVariables}
                  />
                </div>
              )}

              {/* Label Operations */}
              {(config.action === 'updateLabels' || config.action === 'batchLabel') && (
                <>
                  <div>
                    <VariableInput
                      label="Add Label IDs"
                      fieldKey={`${node.id}-addLabelIds`}
                      value={config.addLabelIds || ''}
                      onChange={value => updateNodeConfig(node.id, { addLabelIds: value })}
                      placeholder="INBOX,IMPORTANT"
                      className="mt-1"
                      availableVariables={availableVariables}
                    />
                  </div>
                  <div>
                    <VariableInput
                      label="Remove Label IDs"
                      fieldKey={`${node.id}-removeLabelIds`}
                      value={config.removeLabelIds || ''}
                      onChange={value => updateNodeConfig(node.id, { removeLabelIds: value })}
                      placeholder="UNREAD,SPAM"
                      className="mt-1"
                      availableVariables={availableVariables}
                    />
                  </div>
                </>
              )}

              {/* Draft Operations */}
              {(config.action === 'createDraft' || config.action === 'sendDraft') && (
                <div>
                  <VariableInput
                    label="Draft ID"
                    fieldKey={`${node.id}-draftId`}
                    value={config.draftId || ''}
                    onChange={value => updateNodeConfig(node.id, { draftId: value })}
                    placeholder="Gmail draft ID"
                    className="mt-1"
                    availableVariables={availableVariables}
                  />
                </div>
              )}

              {/* Attachment Operations */}
              {config.action === 'downloadAttachment' && (
                <>
                  <div>
                    <VariableInput
                      label="Attachment ID"
                      fieldKey={`${node.id}-attachmentId`}
                      value={config.attachmentId || ''}
                      onChange={value => updateNodeConfig(node.id, { attachmentId: value })}
                      placeholder="Attachment ID to download"
                      className="mt-1"
                      availableVariables={availableVariables}
                    />
                  </div>
                  <div>
                    <VariableInput
                      label="Download Path"
                      fieldKey={`${node.id}-downloadPath`}
                      value={config.downloadPath || ''}
                      onChange={value => updateNodeConfig(node.id, { downloadPath: value })}
                      placeholder="Local download path"
                      className="mt-1"
                      availableVariables={availableVariables}
                    />
                  </div>
                </>
              )}

              {/* Batch Operations */}
              {(config.action === 'batchSend' ||
                config.action === 'batchDelete' ||
                config.action === 'batchLabel') && (
                <div>
                  <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Batch Size
                  </Label>
                  <Input
                    value={config.batchSize || '10'}
                    onChange={e => updateNodeConfig(node.id, { batchSize: e.target.value })}
                    placeholder="Number of items to process (1-100)"
                    className="mt-1"
                    type="number"
                    min="1"
                    max="100"
                  />
                </div>
              )}

              {/* Label Management */}
              {(config.action === 'createLabel' || config.action === 'deleteLabel') && (
                <div>
                  <VariableInput
                    label="Label Name"
                    fieldKey={`${node.id}-labelName`}
                    value={config.labelName || ''}
                    onChange={value => updateNodeConfig(node.id, { labelName: value })}
                    placeholder="Name for the label"
                    className="mt-1"
                    availableVariables={availableVariables}
                  />
                </div>
              )}

              {/* API Call */}
              {config.action === 'apiCall' && (
                <>
                  <div>
                    <VariableInput
                      label="API URL"
                      fieldKey={`${node.id}-apiUrl`}
                      value={config.apiUrl || ''}
                      onChange={value => updateNodeConfig(node.id, { apiUrl: value })}
                      placeholder="Custom Gmail API URL"
                      className="mt-1"
                      availableVariables={availableVariables}
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      HTTP Method
                    </Label>
                    <Select
                      value={config.apiMethod || 'GET'}
                      onValueChange={value => updateNodeConfig(node.id, { apiMethod: value })}
                    >
                      <SelectTrigger className="mt-1 w-full">
                        <SelectValue placeholder="Select HTTP method" />
                      </SelectTrigger>
                      <SelectContent>
                        {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(method => (
                          <SelectItem key={method} value={method}>
                            {method}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {/* From Address */}
              <div>
                <VariableInput
                  label="From Address"
                  fieldKey={`${node.id}-defaultFrom`}
                  value={config.defaultFrom || ''}
                  onChange={value => updateNodeConfig(node.id, { defaultFrom: value })}
                  placeholder="sender@example.com or me"
                  className="mt-1"
                  availableVariables={availableVariables}
                />
              </div>
            </div>
          </div>
        );
      case 'trigger-gmail':
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Authentication Method
              </Label>
              <Select
                value={config.authMethod || 'manual'}
                onValueChange={value => updateNodeConfig(node.id, { authMethod: value })}
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="Select authentication method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="google-oauth">Google OAuth</SelectItem>
                  <SelectItem value="manual">Manual / Saved Credential</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {config.authMethod === 'google-oauth' ? (
              <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4 text-sm dark:border-slate-700/80 dark:bg-slate-900/80">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      Gmail Trigger Account
                    </Label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {config.serviceTokens?.gmail?.access_token
                        ? `Connected to Gmail`
                        : 'Connect a separate Google account for Gmail triggers.'}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={async () => {
                      try {
                        await authenticateService('gmail');
                        setLog(prev => [...prev, 'Gmail trigger account connected successfully.']);
                      } catch (error) {
                        console.error('Gmail trigger authentication failed', error);
                        setLog(prev => [...prev, 'Gmail trigger authentication failed.']);
                      }
                    }}
                    className="mt-1"
                  >
                    {config.serviceTokens?.gmail?.access_token
                      ? 'Reconnect Gmail'
                      : 'Connect Gmail'}
                  </Button>
                </div>
                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                  This connects to a separate Google account specifically for Gmail trigger access,
                  independent of your main login account.
                </p>
              </div>
            ) : (
              commonInputs
            )}

            <div>
              <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Trigger Type
              </Label>
              <Select
                value={config.triggerType || 'polling'}
                onValueChange={value => updateNodeConfig(node.id, { triggerType: value })}
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="Select trigger type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="polling">Polling</SelectItem>
                  <SelectItem value="webhook">Webhook</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <VariableInput
                label="Query"
                fieldKey={`${node.id}-query`}
                value={config.query || ''}
                onChange={value => updateNodeConfig(node.id, { query: value })}
                placeholder="is:unread from:sales@example.com"
                className="mt-1"
                availableVariables={availableVariables}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Use Gmail search syntax to filter the trigger. Leave empty to monitor all messages.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Max Results
                </Label>
                <Input
                  type="number"
                  min="1"
                  max="500"
                  value={config.maxResults ?? 20}
                  onChange={e => updateNodeConfig(node.id, { maxResults: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Check Interval (s)
                </Label>
                <Input
                  type="number"
                  min="10"
                  max="3600"
                  value={config.checkInterval ?? 60}
                  onChange={e =>
                    updateNodeConfig(node.id, { checkInterval: Number(e.target.value) })
                  }
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`includeBody-${node.id}`}
                  checked={config.includeBody ?? true}
                  onChange={e => updateNodeConfig(node.id, { includeBody: e.target.checked })}
                  className="rounded"
                />
                <Label
                  htmlFor={`includeBody-${node.id}`}
                  className="text-xs font-medium text-slate-600 dark:text-slate-300"
                >
                  Include Body
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`markAsRead-${node.id}`}
                  checked={config.markAsRead ?? true}
                  onChange={e => updateNodeConfig(node.id, { markAsRead: e.target.checked })}
                  className="rounded"
                />
                <Label
                  htmlFor={`markAsRead-${node.id}`}
                  className="text-xs font-medium text-slate-600 dark:text-slate-300"
                >
                  Mark as Read
                </Label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`downloadAttachments-${node.id}`}
                  checked={config.downloadAttachments ?? false}
                  onChange={e =>
                    updateNodeConfig(node.id, { downloadAttachments: e.target.checked })
                  }
                  className="rounded"
                />
                <Label
                  htmlFor={`downloadAttachments-${node.id}`}
                  className="text-xs font-medium text-slate-600 dark:text-slate-300"
                >
                  Download Attachments
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`retryOnError-${node.id}`}
                  checked={config.retryOnError ?? false}
                  onChange={e => updateNodeConfig(node.id, { retryOnError: e.target.checked })}
                  className="rounded"
                />
                <Label
                  htmlFor={`retryOnError-${node.id}`}
                  className="text-xs font-medium text-slate-600 dark:text-slate-300"
                >
                  Retry on Error
                </Label>
              </div>
            </div>

            {config.downloadAttachments && (
              <div>
                <VariableInput
                  label="Attachment Path"
                  fieldKey={`${node.id}-attachmentPath`}
                  value={config.attachmentPath || ''}
                  onChange={value => updateNodeConfig(node.id, { attachmentPath: value })}
                  placeholder="./attachments"
                  className="mt-1"
                  availableVariables={availableVariables}
                />
              </div>
            )}

            {config.retryOnError && (
              <div>
                <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Max Retries
                </Label>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  value={config.maxRetries ?? 3}
                  onChange={e => updateNodeConfig(node.id, { maxRetries: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>
            )}
          </div>
        );

      case 'trigger-google-sheets':
        return (
          <div className="space-y-4">
            {commonInputs}
            <div>
              <VariableInput
                label="Spreadsheet ID"
                fieldKey={`${node.id}-spreadsheetId`}
                value={config.spreadsheetId || ''}
                onChange={value => updateNodeConfig(node.id, { spreadsheetId: value })}
                placeholder="Enter Google Sheets spreadsheet ID"
                className="mt-1"
                availableVariables={availableVariables}
              />
            </div>
            <div>
              <VariableInput
                label="Sheet Name"
                fieldKey={`${node.id}-sheetName`}
                value={config.sheetName || ''}
                onChange={value => updateNodeConfig(node.id, { sheetName: value })}
                placeholder="Sheet to monitor"
                className="mt-1"
                availableVariables={availableVariables}
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Trigger Type
              </Label>
              <Select
                value={config.triggerType || 'onNewRow'}
                onValueChange={value => updateNodeConfig(node.id, { triggerType: value })}
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="Select trigger type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="onNewRow">On New Row</SelectItem>
                  <SelectItem value="onRowChanged">On Row Changed</SelectItem>
                  <SelectItem value="onSheetChanged">On Sheet Changed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Check Interval (seconds)
              </Label>
              <Input
                type="number"
                min="1"
                max="3600"
                value={config.checkInterval || 60}
                onChange={e =>
                  updateNodeConfig(node.id, { checkInterval: parseInt(e.target.value) || 60 })
                }
                className="mt-1"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`useHeaderRow-trigger-${node.id}`}
                checked={config.useHeaderRow ?? true}
                onChange={e => updateNodeConfig(node.id, { useHeaderRow: e.target.checked })}
                className="rounded"
              />
              <Label
                htmlFor={`useHeaderRow-trigger-${node.id}`}
                className="text-xs font-medium text-slate-600 dark:text-slate-300"
              >
                Use first row as headers
              </Label>
            </div>
          </div>
        );
      case 'calendar-google':
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Authentication Method
              </Label>
              <Select
                value={config.authMethod || 'manual'}
                onValueChange={value => updateNodeConfig(node.id, { authMethod: value })}
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="Select authentication method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="google-oauth">Google OAuth</SelectItem>
                  <SelectItem value="manual">Manual / Saved Credential</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {config.authMethod === 'google-oauth' ? (
              <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4 text-sm dark:border-slate-700/80 dark:bg-slate-900/80">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      Google Calendar Account
                    </Label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {config.serviceTokens?.calendar?.access_token
                        ? `Connected to Google Calendar`
                        : 'Connect a separate Google account for Calendar access.'}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={async () => {
                      try {
                        await authenticateService('calendar');
                        setLog(prev => [
                          ...prev,
                          'Google Calendar account connected successfully.',
                        ]);
                      } catch (error) {
                        console.error('Google Calendar authentication failed', error);
                        setLog(prev => [...prev, 'Google Calendar authentication failed.']);
                      }
                    }}
                    className="mt-1"
                  >
                    {config.serviceTokens?.calendar?.access_token
                      ? 'Reconnect Calendar'
                      : 'Connect Calendar'}
                  </Button>
                </div>
                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                  This connects to a separate Google account specifically for Google Calendar
                  access, independent of your main login account.
                </p>
              </div>
            ) : (
              commonInputs
            )}
            <div>
              <VariableInput
                label="Calendar ID"
                fieldKey={`${node.id}-calendarId`}
                value={config.calendarId || ''}
                onChange={value => updateNodeConfig(node.id, { calendarId: value })}
                placeholder="primary or calendar email"
                className="mt-1"
                availableVariables={availableVariables}
              />
            </div>
            <div>
              <VariableInput
                label="Event Summary"
                fieldKey={`${node.id}-summary`}
                value={config.summary || ''}
                onChange={value => updateNodeConfig(node.id, { summary: value })}
                placeholder="Meeting title"
                className="mt-1"
                availableVariables={availableVariables}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <VariableInput
                  label="Start Time (ISO)"
                  fieldKey={`${node.id}-startTime`}
                  value={config.startTime || ''}
                  onChange={value => updateNodeConfig(node.id, { startTime: value })}
                  placeholder="2026-01-01T10:00:00Z"
                  className="mt-1"
                  availableVariables={availableVariables}
                />
              </div>
              <div>
                <VariableInput
                  label="End Time (ISO)"
                  fieldKey={`${node.id}-endTime`}
                  value={config.endTime || ''}
                  onChange={value => updateNodeConfig(node.id, { endTime: value })}
                  placeholder="2026-01-01T11:00:00Z"
                  className="mt-1"
                  availableVariables={availableVariables}
                />
              </div>
            </div>
          </div>
        );
      case 'core-http-request':
        return (
          <div className="space-y-6">
            {/* Request Core Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Request Core
                </Label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <VariableInput
                    label="Base URL"
                    fieldKey={`${node.id}-baseUrl`}
                    value={config.baseUrl || ''}
                    onChange={value => updateNodeConfig(node.id, { baseUrl: value })}
                    placeholder="https://api.example.com"
                    className="mt-1"
                    availableVariables={availableVariables}
                  />
                </div>
                <div>
                  <VariableInput
                    label="Path"
                    fieldKey={`${node.id}-path`}
                    value={config.path || ''}
                    onChange={value => updateNodeConfig(node.id, { path: value })}
                    placeholder="/v1/users"
                    className="mt-1"
                    availableVariables={availableVariables}
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  HTTP Method
                </Label>
                <Select
                  value={config.method || 'GET'}
                  onValueChange={value => updateNodeConfig(node.id, { method: value })}
                >
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue placeholder="Select HTTP method" />
                  </SelectTrigger>
                  <SelectContent>
                    {['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].map(method => (
                      <SelectItem key={method} value={method}>
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Authentication Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Authentication
                </Label>
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Auth Type
                </Label>
                <Select
                  value={config.authType || 'none'}
                  onValueChange={value => updateNodeConfig(node.id, { authType: value })}
                >
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue placeholder="Select authentication type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="basic">Basic Auth</SelectItem>
                    <SelectItem value="bearer">Bearer Token</SelectItem>
                    <SelectItem value="header">Custom Header</SelectItem>
                    <SelectItem value="oauth2">OAuth 2.0</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {config.authType === 'basic' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <VariableInput
                      label="Username"
                      fieldKey={`${node.id}-authConfig.username`}
                      value={config.authConfig?.username || ''}
                      onChange={value =>
                        updateNodeConfig(node.id, {
                          authConfig: { ...config.authConfig, username: value },
                        })
                      }
                      placeholder="Username"
                      className="mt-1"
                      availableVariables={availableVariables}
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      Password
                    </Label>
                    <Input
                      type="password"
                      value={config.authConfig?.password || ''}
                      onChange={e =>
                        updateNodeConfig(node.id, {
                          authConfig: { ...config.authConfig, password: e.target.value },
                        })
                      }
                      className="mt-1"
                    />
                  </div>
                </div>
              )}

              {config.authType === 'bearer' && (
                <div>
                  <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Bearer Token
                  </Label>
                  <Input
                    type="password"
                    value={config.authConfig?.token || ''}
                    onChange={e =>
                      updateNodeConfig(node.id, {
                        authConfig: { ...config.authConfig, token: e.target.value },
                      })
                    }
                    placeholder="your-bearer-token"
                    className="mt-1"
                  />
                </div>
              )}

              {config.authType === 'header' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <VariableInput
                      label="Header Name"
                      fieldKey={`${node.id}-authConfig.headerName`}
                      value={config.authConfig?.headerName || ''}
                      onChange={value =>
                        updateNodeConfig(node.id, {
                          authConfig: { ...config.authConfig, headerName: value },
                        })
                      }
                      placeholder="X-API-Key"
                      className="mt-1"
                      availableVariables={availableVariables}
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      Header Value
                    </Label>
                    <Input
                      type="password"
                      value={config.authConfig?.headerValue || ''}
                      onChange={e =>
                        updateNodeConfig(node.id, {
                          authConfig: { ...config.authConfig, headerValue: e.target.value },
                        })
                      }
                      className="mt-1"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Headers Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Headers
                </Label>
              </div>
              <div>
                <VariableTextarea
                  label="Custom Headers (JSON)"
                  fieldKey={`${node.id}-headers`}
                  value={JSON.stringify(config.headers || {}, null, 2)}
                  onChange={value => {
                    try {
                      const parsed = JSON.parse(value);
                      updateNodeConfig(node.id, { headers: parsed });
                    } catch {
                      // ignore invalid JSON while typing
                    }
                  }}
                  placeholder='{"Content-Type": "application/json", "Accept": "application/json"}'
                  className="mt-1 h-24 font-mono text-xs"
                  availableVariables={availableVariables}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`auto-headers-${node.id}`}
                  checked={config.autoHeaders !== false}
                  onChange={e => updateNodeConfig(node.id, { autoHeaders: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <Label
                  htmlFor={`auto-headers-${node.id}`}
                  className="text-xs font-medium text-slate-600 dark:text-slate-300"
                >
                  Auto-generate headers (Accept, User-Agent)
                </Label>
              </div>
            </div>

            {/* Body Configuration Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Request Body
                </Label>
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Body Mode
                </Label>
                <Select
                  value={config.bodyMode || 'json'}
                  onValueChange={value => updateNodeConfig(node.id, { bodyMode: value })}
                >
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue placeholder="Select body mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="raw">Raw</SelectItem>
                    <SelectItem value="form-data">Form Data</SelectItem>
                    <SelectItem value="urlencoded">URL Encoded</SelectItem>
                    <SelectItem value="binary">Binary</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {config.bodyMode === 'json' && (
                <div>
                  <VariableTextarea
                    label="JSON Body"
                    fieldKey={`${node.id}-bodyConfig.json`}
                    value={JSON.stringify(config.bodyConfig?.json || {}, null, 2)}
                    onChange={value => {
                      try {
                        const parsed = JSON.parse(value);
                        updateNodeConfig(node.id, {
                          bodyConfig: { ...config.bodyConfig, json: parsed },
                        });
                      } catch {
                        // ignore invalid JSON while typing
                      }
                    }}
                    placeholder='{"key": "value", "nested": {"data": true}}'
                    className="mt-1 h-32 font-mono text-xs"
                    availableVariables={availableVariables}
                  />
                </div>
              )}

              {config.bodyMode === 'raw' && (
                <div className="space-y-3">
                  <div>
                    <VariableTextarea
                      label="Raw Content"
                      fieldKey={`${node.id}-bodyConfig.raw.content`}
                      value={config.bodyConfig?.raw?.content || ''}
                      onChange={value =>
                        updateNodeConfig(node.id, {
                          bodyConfig: {
                            ...config.bodyConfig,
                            raw: { ...config.bodyConfig?.raw, content: value },
                          },
                        })
                      }
                      placeholder="Plain text, XML, or other content"
                      className="mt-1 h-24"
                      availableVariables={availableVariables}
                    />
                  </div>
                  <div>
                    <VariableInput
                      label="Content Type"
                      fieldKey={`${node.id}-bodyConfig.raw.contentType`}
                      value={config.bodyConfig?.raw?.contentType || 'text/plain'}
                      onChange={value =>
                        updateNodeConfig(node.id, {
                          bodyConfig: {
                            ...config.bodyConfig,
                            raw: { ...config.bodyConfig?.raw, contentType: value },
                          },
                        })
                      }
                      placeholder="text/plain"
                      className="mt-1"
                      availableVariables={availableVariables}
                    />
                  </div>
                </div>
              )}

              {config.bodyMode === 'form-data' && (
                <div>
                  <VariableTextarea
                    label="Form Data (JSON Array)"
                    fieldKey={`${node.id}-bodyConfig.formData`}
                    value={JSON.stringify(config.bodyConfig?.formData || [], null, 2)}
                    onChange={value => {
                      try {
                        const parsed = JSON.parse(value);
                        updateNodeConfig(node.id, {
                          bodyConfig: { ...config.bodyConfig, formData: parsed },
                        });
                      } catch {
                        // ignore invalid JSON while typing
                      }
                    }}
                    placeholder='[{"key": "file", "value": "base64data", "type": "file", "filename": "test.jpg"}]'
                    className="mt-1 h-32 font-mono text-xs"
                    availableVariables={availableVariables}
                  />
                </div>
              )}

              {config.bodyMode === 'urlencoded' && (
                <div>
                  <VariableTextarea
                    label="URL Encoded Data"
                    fieldKey={`${node.id}-bodyConfig.urlencoded`}
                    value={
                      config.bodyConfig?.urlencoded
                        ? Object.entries(config.bodyConfig.urlencoded)
                            .map(([k, v]) => `${k}=${v}`)
                            .join('&')
                        : ''
                    }
                    onChange={value => {
                      const pairs = value.split('&').filter(Boolean);
                      const urlencoded: Record<string, string> = {};
                      pairs.forEach(pair => {
                        const [key, ...valueParts] = pair.split('=');
                        if (key) urlencoded[key] = valueParts.join('=');
                      });
                      updateNodeConfig(node.id, {
                        bodyConfig: { ...config.bodyConfig, urlencoded },
                      });
                    }}
                    placeholder="key1=value1&key2=value2"
                    className="mt-1 h-24"
                    availableVariables={availableVariables}
                  />
                </div>
              )}

              {config.bodyMode === 'binary' && (
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      Binary Data (Base64)
                    </Label>
                    <VariableTextarea
                      label="Binary Data (Base64)"
                      fieldKey={`${node.id}-bodyConfig.binary.data`}
                      value={config.bodyConfig?.binary?.data || ''}
                      onChange={value =>
                        updateNodeConfig(node.id, {
                          bodyConfig: {
                            ...config.bodyConfig,
                            binary: { ...config.bodyConfig?.binary, data: value },
                          },
                        })
                      }
                      placeholder="Base64 encoded binary data"
                      className="mt-1 h-24 font-mono text-xs"
                      availableVariables={availableVariables}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        Filename
                      </Label>
                      <VariableInput
                        label="Filename"
                        fieldKey={`${node.id}-bodyConfig.binary.filename`}
                        value={config.bodyConfig?.binary?.filename || ''}
                        onChange={value =>
                          updateNodeConfig(node.id, {
                            bodyConfig: {
                              ...config.bodyConfig,
                              binary: { ...config.bodyConfig?.binary, filename: value },
                            },
                          })
                        }
                        placeholder="file.bin"
                        className="mt-1"
                        availableVariables={availableVariables}
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        Content Type
                      </Label>
                      <VariableInput
                        label="Content Type"
                        fieldKey={`${node.id}-bodyConfig.binary.contentType`}
                        value={config.bodyConfig?.binary?.contentType || ''}
                        onChange={value =>
                          updateNodeConfig(node.id, {
                            bodyConfig: {
                              ...config.bodyConfig,
                              binary: { ...config.bodyConfig?.binary, contentType: value },
                            },
                          })
                        }
                        placeholder="application/octet-stream"
                        className="mt-1"
                        availableVariables={availableVariables}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Data Mapping Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Data Mapping (Expressions)
                </Label>
              </div>
              <div>
                <VariableInput
                  label="URL Expression"
                  fieldKey={`${node.id}-dataMapping.url`}
                  value={config.dataMapping?.url || ''}
                  onChange={value =>
                    updateNodeConfig(node.id, {
                      dataMapping: { ...config.dataMapping, url: value },
                    })
                  }
                  placeholder="{{baseUrl}}/users/{{userId}}"
                  className="mt-1"
                  availableVariables={availableVariables}
                />
              </div>
              <div>
                <VariableTextarea
                  label="Header Expressions (JSON)"
                  fieldKey={`${node.id}-dataMapping.headers`}
                  value={JSON.stringify(config.dataMapping?.headers || {}, null, 2)}
                  onChange={value => {
                    try {
                      const parsed = JSON.parse(value);
                      updateNodeConfig(node.id, {
                        dataMapping: { ...config.dataMapping, headers: parsed },
                      });
                    } catch {
                      // ignore invalid JSON while typing
                    }
                  }}
                  placeholder='{"Authorization": "Bearer {{token}}"}'
                  className="mt-1 h-20 font-mono text-xs"
                  availableVariables={availableVariables}
                />
              </div>
              <div>
                <VariableTextarea
                  label="Body Expression"
                  fieldKey={`${node.id}-dataMapping.body`}
                  value={
                    config.dataMapping?.body ? JSON.stringify(config.dataMapping.body, null, 2) : ''
                  }
                  onChange={value => {
                    try {
                      const parsed = JSON.parse(value);
                      updateNodeConfig(node.id, {
                        dataMapping: { ...config.dataMapping, body: parsed },
                      });
                    } catch {
                      // ignore invalid JSON while typing
                    }
                  }}
                  placeholder='{"user": "{{userData}}", "timestamp": "{{currentTime}}"}'
                  className="mt-1 h-20 font-mono text-xs"
                  availableVariables={availableVariables}
                />
              </div>
              <div>
                <VariableTextarea
                  label="Query Param Expressions (JSON)"
                  fieldKey={`${node.id}-dataMapping.queryParams`}
                  value={JSON.stringify(config.dataMapping?.queryParams || {}, null, 2)}
                  onChange={value => {
                    try {
                      const parsed = JSON.parse(value);
                      updateNodeConfig(node.id, {
                        dataMapping: { ...config.dataMapping, queryParams: parsed },
                      });
                    } catch {
                      // ignore invalid JSON while typing
                    }
                  }}
                  placeholder='{"limit": "{{pageSize}}", "offset": "{{pageOffset}}"}'
                  className="mt-1 h-20 font-mono text-xs"
                  availableVariables={availableVariables}
                />
              </div>
            </div>

            {/* Response Handling Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Response Handling
                </Label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Response Format
                  </Label>
                  <Select
                    value={config.responseFormat || 'json'}
                    onValueChange={value => updateNodeConfig(node.id, { responseFormat: value })}
                  >
                    <SelectTrigger className="mt-1 w-full">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="string">String</SelectItem>
                      <SelectItem value="binary">Binary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Response Mode
                  </Label>
                  <Select
                    value={config.responseMode || 'full'}
                    onValueChange={value => updateNodeConfig(node.id, { responseMode: value })}
                  >
                    <SelectTrigger className="mt-1 w-full">
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Full Response</SelectItem>
                      <SelectItem value="body-only">Body Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Error Handling Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Error Handling
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`continue-on-fail-${node.id}`}
                  checked={config.continueOnFail || false}
                  onChange={e => updateNodeConfig(node.id, { continueOnFail: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <Label
                  htmlFor={`continue-on-fail-${node.id}`}
                  className="text-xs font-medium text-slate-600 dark:text-slate-300"
                >
                  Continue on failure (don't stop workflow)
                </Label>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Retry Count
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    value={config.retryCount ?? 0}
                    onChange={e =>
                      updateNodeConfig(node.id, { retryCount: Number(e.target.value) })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Retry Delay (ms)
                  </Label>
                  <Input
                    type="number"
                    min="100"
                    max="60000"
                    value={config.retryDelay ?? 1000}
                    onChange={e =>
                      updateNodeConfig(node.id, { retryDelay: Number(e.target.value) })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Retry Condition
                  </Label>
                  <Select
                    value={config.retryCondition || 'always'}
                    onValueChange={value => updateNodeConfig(node.id, { retryCondition: value })}
                  >
                    <SelectTrigger className="mt-1 w-full">
                      <SelectValue placeholder="When to retry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="always">Always</SelectItem>
                      <SelectItem value="5xx">5xx Errors</SelectItem>
                      <SelectItem value="network">Network Errors</SelectItem>
                      <SelectItem value="timeout">Timeout</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <VariableTextarea
                  label="Fail Conditions (JSON Array)"
                  fieldKey={`${node.id}-failConditions`}
                  value={JSON.stringify(config.failConditions || [], null, 2)}
                  onChange={value => {
                    try {
                      const parsed = JSON.parse(value);
                      updateNodeConfig(node.id, { failConditions: parsed });
                    } catch {
                      // ignore invalid JSON while typing
                    }
                  }}
                  placeholder='[{"condition": "status", "value": "404"}, {"condition": "contains", "value": "error"}]'
                  className="mt-1 h-20 font-mono text-xs"
                  availableVariables={availableVariables}
                />
              </div>
            </div>

            {/* Pagination Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Pagination
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`pagination-enabled-${node.id}`}
                  checked={config.pagination?.enabled || false}
                  onChange={e =>
                    updateNodeConfig(node.id, {
                      pagination: { ...config.pagination, enabled: e.target.checked },
                    })
                  }
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <Label
                  htmlFor={`pagination-enabled-${node.id}`}
                  className="text-xs font-medium text-slate-600 dark:text-slate-300"
                >
                  Enable pagination
                </Label>
              </div>

              {config.pagination?.enabled && (
                <>
                  <div>
                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      Pagination Type
                    </Label>
                    <Select
                      value={config.pagination?.type || 'offset'}
                      onValueChange={value =>
                        updateNodeConfig(node.id, {
                          pagination: { ...config.pagination, type: value },
                        })
                      }
                    >
                      <SelectTrigger className="mt-1 w-full">
                        <SelectValue placeholder="Select pagination type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="offset">Offset-based</SelectItem>
                        <SelectItem value="cursor">Cursor-based</SelectItem>
                        <SelectItem value="page">Page-based</SelectItem>
                        <SelectItem value="link">Link-based</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(config.pagination?.type === 'offset' || config.pagination?.type === 'page') && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <VariableInput
                          label={
                            config.pagination?.type === 'offset' ? 'Offset Param' : 'Page Param'
                          }
                          fieldKey={`${node.id}-pagination.config.${
                            config.pagination.type === 'offset' ? 'offsetParam' : 'pageParam'
                          }`}
                          value={
                            config.pagination?.config?.[
                              config.pagination.type === 'offset' ? 'offsetParam' : 'pageParam'
                            ] || (config.pagination.type === 'offset' ? 'offset' : 'page')
                          }
                          onChange={value =>
                            updateNodeConfig(node.id, {
                              pagination: {
                                ...config.pagination,
                                config: {
                                  ...config.pagination.config,
                                  [config.pagination.type === 'offset'
                                    ? 'offsetParam'
                                    : 'pageParam']: value,
                                },
                              },
                            })
                          }
                          className="mt-1"
                          availableVariables={availableVariables}
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                          Limit Param
                        </Label>
                        <VariableInput
                          label="Limit Param"
                          fieldKey={`${node.id}-pagination.config.limitParam`}
                          value={config.pagination?.config?.limitParam || 'limit'}
                          onChange={value =>
                            updateNodeConfig(node.id, {
                              pagination: {
                                ...config.pagination,
                                config: {
                                  ...config.pagination.config,
                                  limitParam: value,
                                },
                              },
                            })
                          }
                          className="mt-1"
                          availableVariables={availableVariables}
                        />
                      </div>
                    </div>
                  )}

                  {config.pagination?.type === 'cursor' && (
                    <div>
                      <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        Cursor Param
                      </Label>
                      <VariableInput
                        label="Cursor Param"
                        fieldKey={`${node.id}-pagination.config.cursorParam`}
                        value={config.pagination?.config?.cursorParam || 'cursor'}
                        onChange={value =>
                          updateNodeConfig(node.id, {
                            pagination: {
                              ...config.pagination,
                              config: {
                                ...config.pagination.config,
                                cursorParam: value,
                              },
                            },
                          })
                        }
                        className="mt-1"
                        availableVariables={availableVariables}
                      />
                    </div>
                  )}

                  {config.pagination?.type === 'link' && (
                    <div>
                      <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        Next Link Path
                      </Label>
                      <VariableInput
                        label="Next Link Path"
                        fieldKey={`${node.id}-pagination.config.nextLinkPath`}
                        value={config.pagination?.config?.nextLinkPath || 'next'}
                        onChange={value =>
                          updateNodeConfig(node.id, {
                            pagination: {
                              ...config.pagination,
                              config: {
                                ...config.pagination.config,
                                nextLinkPath: value,
                              },
                            },
                          })
                        }
                        placeholder="next"
                        className="mt-1"
                        availableVariables={availableVariables}
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        Has Next Path
                      </Label>
                      <VariableInput
                        label="Has Next Path"
                        fieldKey={`${node.id}-pagination.config.hasNextPath`}
                        value={config.pagination?.config?.hasNextPath || 'hasNext'}
                        onChange={value =>
                          updateNodeConfig(node.id, {
                            pagination: {
                              ...config.pagination,
                              config: {
                                ...config.pagination.config,
                                hasNextPath: value,
                              },
                            },
                          })
                        }
                        className="mt-1"
                        availableVariables={availableVariables}
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        Max Pages
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        max="1000"
                        value={config.pagination?.config?.maxPages ?? 100}
                        onChange={e =>
                          updateNodeConfig(node.id, {
                            pagination: {
                              ...config.pagination,
                              config: {
                                ...config.pagination.config,
                                maxPages: Number(e.target.value),
                              },
                            },
                          })
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Networking Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Networking
                </Label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Timeout (ms)
                  </Label>
                  <Input
                    type="number"
                    min="1000"
                    max="300000"
                    value={config.timeout ?? 30000}
                    onChange={e => updateNodeConfig(node.id, { timeout: Number(e.target.value) })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Max Redirects
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    value={config.maxRedirects ?? 5}
                    onChange={e =>
                      updateNodeConfig(node.id, { maxRedirects: Number(e.target.value) })
                    }
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`follow-redirects-${node.id}`}
                  checked={config.followRedirects !== false}
                  onChange={e => updateNodeConfig(node.id, { followRedirects: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <Label
                  htmlFor={`follow-redirects-${node.id}`}
                  className="text-xs font-medium text-slate-600 dark:text-slate-300"
                >
                  Follow redirects
                </Label>
              </div>

              {/* Proxy Configuration */}
              <div className="space-y-3">
                <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Proxy Configuration
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <VariableInput
                      label="Proxy Host"
                      fieldKey={`${node.id}-proxy.host`}
                      value={config.proxy?.host || ''}
                      onChange={value =>
                        updateNodeConfig(node.id, {
                          proxy: { ...config.proxy, host: value },
                        })
                      }
                      placeholder="proxy.example.com"
                      className="mt-1"
                      availableVariables={availableVariables}
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      min="1"
                      max="65535"
                      value={config.proxy?.port || 8080}
                      onChange={e =>
                        updateNodeConfig(node.id, {
                          proxy: { ...config.proxy, port: Number(e.target.value) },
                        })
                      }
                      placeholder="8080"
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <VariableInput
                      label="Proxy Username"
                      fieldKey={`${node.id}-proxy.auth.username`}
                      value={config.proxy?.auth?.username || ''}
                      onChange={value =>
                        updateNodeConfig(node.id, {
                          proxy: {
                            ...config.proxy,
                            auth: { ...config.proxy?.auth, username: value },
                          },
                        })
                      }
                      placeholder="Proxy username"
                      className="mt-1"
                      availableVariables={availableVariables}
                    />
                  </div>
                  <div>
                    <Input
                      type="password"
                      value={config.proxy?.auth?.password || ''}
                      onChange={e =>
                        updateNodeConfig(node.id, {
                          proxy: {
                            ...config.proxy,
                            auth: { ...config.proxy?.auth, password: e.target.value },
                          },
                        })
                      }
                      placeholder="Proxy password"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`ssl-ignore-${node.id}`}
                  checked={config.sslIgnore || false}
                  onChange={e => updateNodeConfig(node.id, { sslIgnore: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <Label
                  htmlFor={`ssl-ignore-${node.id}`}
                  className="text-xs font-medium text-slate-600 dark:text-slate-300"
                >
                  Ignore SSL certificate errors
                </Label>
              </div>
            </div>

            {/* Execution Options Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Execution Options
                </Label>
              </div>

              {/* Batching */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`batching-enabled-${node.id}`}
                    checked={config.batching?.enabled || false}
                    onChange={e =>
                      updateNodeConfig(node.id, {
                        batching: { ...config.batching, enabled: e.target.checked },
                      })
                    }
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label
                    htmlFor={`batching-enabled-${node.id}`}
                    className="text-xs font-medium text-slate-600 dark:text-slate-300"
                  >
                    Enable batching
                  </Label>
                </div>
                {config.batching?.enabled && (
                  <div className="grid grid-cols-2 gap-3 ml-6">
                    <div>
                      <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        Batch Size
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={config.batching?.size ?? 10}
                        onChange={e =>
                          updateNodeConfig(node.id, {
                            batching: { ...config.batching, size: Number(e.target.value) },
                          })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        Batch Delay (ms)
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        max="10000"
                        value={config.batching?.delay ?? 0}
                        onChange={e =>
                          updateNodeConfig(node.id, {
                            batching: { ...config.batching, delay: Number(e.target.value) },
                          })
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Rate Limiting */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`rate-limit-enabled-${node.id}`}
                    checked={config.rateLimit?.enabled || false}
                    onChange={e =>
                      updateNodeConfig(node.id, {
                        rateLimit: { ...config.rateLimit, enabled: e.target.checked },
                      })
                    }
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label
                    htmlFor={`rate-limit-enabled-${node.id}`}
                    className="text-xs font-medium text-slate-600 dark:text-slate-300"
                  >
                    Enable rate limiting
                  </Label>
                </div>
                {config.rateLimit?.enabled && (
                  <div className="ml-6">
                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      Rate Limit (requests per minute)
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      max="1000"
                      value={config.rateLimit?.requests ?? 10}
                      onChange={e =>
                        updateNodeConfig(node.id, {
                          rateLimit: { ...config.rateLimit, requests: Number(e.target.value) },
                        })
                      }
                      className="mt-1"
                    />
                  </div>
                )}
              </div>

              {/* Concurrency */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`concurrency-enabled-${node.id}`}
                    checked={config.concurrency?.enabled || false}
                    onChange={e =>
                      updateNodeConfig(node.id, {
                        concurrency: { ...config.concurrency, enabled: e.target.checked },
                      })
                    }
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label
                    htmlFor={`concurrency-enabled-${node.id}`}
                    className="text-xs font-medium text-slate-600 dark:text-slate-300"
                  >
                    Enable concurrency control
                  </Label>
                </div>
                {config.concurrency?.enabled && (
                  <div className="ml-6">
                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      Max Concurrency
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      max="50"
                      value={config.concurrency?.limit ?? 5}
                      onChange={e =>
                        updateNodeConfig(node.id, {
                          concurrency: { ...config.concurrency, limit: Number(e.target.value) },
                        })
                      }
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      default: {
        const genericConfigComponent = renderGenericNodeConfig(node);
        if (genericConfigComponent) {
          return genericConfigComponent;
        }

        return (
          <div className="space-y-4">
            <div>
              <VariableTextarea
                label="Custom JSON Config"
                fieldKey={`${node.id}-customConfig`}
                value={JSON.stringify(config, null, 2)}
                onChange={value => {
                  try {
                    const parsed = JSON.parse(value);
                    updateNodeConfig(node.id, parsed);
                  } catch {
                    // ignore invalid JSON while typing
                  }
                }}
                className="mt-1 h-40 font-mono"
                availableVariables={availableVariables}
              />
            </div>
          </div>
        );
      }
    }
  };

  return (
    <>
      {activeSection === 'builder' && showNodePalette && (
        <aside
          className="fixed z-50 h-[calc(100%-5rem)] w-96 max-w-[28rem] overflow-y-auto rounded-2xl border border-blue-300/50 bg-white/95 p-6 shadow-2xl backdrop-blur-xl dark:border-blue-500/30 dark:bg-slate-900/95"
          style={{ left: nodePalettePosition.x, top: nodePalettePosition.y }}
        >
          <div
            className="mb-6 flex cursor-grab items-center justify-between rounded-xl p-3 hover:bg-blue-50/40 dark:hover:bg-slate-800/50 bg-gradient-to-r from-blue-50/30 to-indigo-50/30 dark:from-slate-800/30 dark:to-slate-700/30"
            onMouseDown={event => {
              event.preventDefault();
              setDraggingPane('palette');
              setDragOffset({
                x: event.clientX - nodePalettePosition.x,
                y: event.clientY - nodePalettePosition.y,
              });
            }}
            onMouseUp={() => setDraggingPane(null)}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  Node Palette
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Drag nodes to build your workflow
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowNodePalette(false)}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors duration-200"
            >
              ✕
            </button>
          </div>

          <div className="mb-6">
            <div className="relative">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="w-5 h-5"
                >
                  <path d="M21 21l-4.35-4.35" />
                  <circle cx="10" cy="10" r="6" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search nodes..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200/60 bg-gradient-to-r from-white/90 to-slate-50/80 text-slate-800 placeholder-slate-400 focus:border-blue-400/80 focus:bg-white/95 focus:ring-2 focus:ring-blue-400/20 focus:outline-none transition-all duration-300 dark:border-slate-700/60 dark:bg-gradient-to-r dark:from-slate-900/90 dark:to-slate-800/80 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-blue-500/80 dark:focus:bg-slate-900/95 dark:focus:ring-blue-500/20 backdrop-blur-sm shadow-sm focus:shadow-lg"
              />
            </div>
          </div>

          <div className="space-y-4">
            {Object.entries(groupedNodeTypes).map(([category, categoryNodes]) => (
              <section
                key={category}
                className="rounded-2xl bg-gradient-to-br from-white/90 via-slate-50/80 to-blue-50/40 p-5 dark:from-slate-800/90 dark:via-slate-700/80 dark:to-slate-600/40 border border-slate-200/50 dark:border-slate-600/50 shadow-sm hover:shadow-md transition-all duration-300 backdrop-blur-sm"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 shadow-sm"></div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {category}
                  </h4>
                  <div className="ml-auto px-2 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100/60 dark:bg-slate-700/60 rounded-full border border-slate-200/40 dark:border-slate-600/40">
                    {categoryNodes.length}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {categoryNodes
                    .filter(
                      node =>
                        node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        node.id.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map(node => (
                      <button
                        key={node.id}
                        onClick={() => {
                          const newNode: Node<AgentNodeData> = {
                            id: `${nodes.length + 1}`,
                            type: node.id,
                            position: {
                              x: Math.random() * 400 + 100,
                              y: Math.random() * 300 + 100,
                            },
                            data: {
                              label: node.label,
                              config: {},
                              icon: node.icon,
                            },
                          };
                          setNodes([...nodes, newNode]);
                        }}
                        className="group w-full rounded-xl border border-slate-200/60 bg-gradient-to-r from-white/80 to-slate-50/60 p-4 text-left text-sm text-slate-800 transition-all duration-300 hover:border-blue-400/70 hover:bg-gradient-to-r hover:from-blue-50/90 hover:to-indigo-50/80 hover:shadow-lg hover:scale-[1.02] hover:-translate-y-0.5 dark:border-slate-700/60 dark:bg-gradient-to-r dark:from-slate-900/80 dark:to-slate-800/60 dark:text-slate-100 dark:hover:border-blue-500/70 dark:hover:from-blue-950/90 dark:hover:to-indigo-950/80 flex items-center gap-4 backdrop-blur-sm"
                      >
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 dark:from-slate-700 dark:via-slate-600 dark:to-slate-500 flex items-center justify-center shadow-md group-hover:shadow-xl group-hover:scale-110 transition-all duration-300 border border-white/50 dark:border-slate-600/50">
                          {renderIcon(
                            node.icon,
                            'w-10 h-10 text-blue-700 dark:text-blue-300 drop-shadow-sm'
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-slate-900 dark:text-slate-100 truncate text-base group-hover:text-blue-900 dark:group-hover:text-blue-100 transition-colors duration-200">
                            {node.label}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium uppercase tracking-wide">
                            {node.category}
                          </div>
                        </div>
                        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                            <Plus className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              </section>
            ))}
          </div>
        </aside>
      )}

      {activeSection === 'settings' && (
        <aside
          className="fixed z-50 h-[calc(100%-5rem)] w-96 max-w-[28rem] overflow-y-auto rounded-2xl border border-blue-300/50 bg-white/90 p-4 shadow-2xl backdrop-blur-xl dark:border-blue-500/30 dark:bg-slate-900/90"
          style={{ left: settingsPosition.x, top: settingsPosition.y }}
        >
          <div
            className="mb-4 flex cursor-grab items-center justify-between rounded-lg p-2 hover:bg-blue-50/40 dark:hover:bg-slate-800/50"
            onMouseDown={event => {
              event.preventDefault();
              setDraggingPane('settings');
              setDragOffset({
                x: event.clientX - settingsPosition.x,
                y: event.clientY - settingsPosition.y,
              });
            }}
            onMouseUp={() => setDraggingPane(null)}
          >
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Settings</h3>
            <button
              onClick={() => setActiveSection('builder')}
              className="rounded-md px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Close
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <Label
                htmlFor="openai-key"
                className="text-xs font-medium text-slate-600 dark:text-slate-300"
              >
                OpenAI API Key
              </Label>
              <Input
                id="openai-key"
                type="password"
                value={apiKeys.openai}
                onChange={e => setApiKeys({ ...apiKeys, openai: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label
                htmlFor="gemini-key"
                className="text-xs font-medium text-slate-600 dark:text-slate-300"
              >
                Gemini API Key
              </Label>
              <Input
                id="gemini-key"
                type="password"
                value={apiKeys.gemini}
                onChange={e => setApiKeys({ ...apiKeys, gemini: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label
                htmlFor="deepseek-key"
                className="text-xs font-medium text-slate-600 dark:text-slate-300"
              >
                DeepSeek API Key
              </Label>
              <Input
                id="deepseek-key"
                type="password"
                value={apiKeys.deepseek}
                onChange={e => setApiKeys({ ...apiKeys, deepseek: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label
                htmlFor="gmail-key"
                className="text-xs font-medium text-slate-600 dark:text-slate-300"
              >
                Gmail API Key
              </Label>
              <Input
                id="gmail-key"
                type="password"
                value={apiKeys.gmail}
                onChange={e => setApiKeys({ ...apiKeys, gmail: e.target.value })}
                className="mt-1"
              />
            </div>

            <Button
              size="sm"
              onClick={saveApiKeys}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save Keys
            </Button>
          </div>
        </aside>
      )}

      {selectedNode && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={() => selectNode(undefined)}
          />
          <aside
            className="fixed z-50 h-[calc(100%-5rem)] w-96 max-w-[28rem] rounded-2xl border border-purple-300/50 bg-white/95 p-4 shadow-2xl backdrop-blur-xl dark:border-purple-500/30 dark:bg-slate-900/95"
            style={{ left: nodeConfigPosition.x, top: nodeConfigPosition.y, overflow: 'visible' }}
          >
            <div
              className="mb-4 flex cursor-grab items-center justify-between rounded-lg p-2 hover:bg-purple-50/40 dark:hover:bg-purple-900/20"
              onMouseDown={event => {
                event.preventDefault();
                setDraggingPane('nodeConfig');
                setDragOffset({
                  x: event.clientX - nodeConfigPosition.x,
                  y: event.clientY - nodeConfigPosition.y,
                });
              }}
              onMouseUp={() => setDraggingPane(null)}
            >
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  Node Configuration
                </h3>
              </div>
              <button
                onClick={() => selectNode(undefined)}
                className="rounded-md px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 transition-all duration-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto max-h-[calc(100%-60px)] pr-2">
              {/* Node Label Section */}
              <div className="rounded-[14px] border-2 border-slate-200/70 bg-slate-50/90 p-4 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/90">
                <label
                  htmlFor="node-label"
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--color-foreground)',
                    marginBottom: '8px',
                    display: 'block',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  📝 Node Label
                </label>
                <Input
                  id="node-label"
                  value={selectedNode.data?.label || ''}
                  onChange={e => {
                    setNodes(
                      nodes.map(n =>
                        n.id === selectedNodeId
                          ? { ...n, data: { ...n.data, label: e.target.value } }
                          : n
                      )
                    );
                  }}
                  className="w-full bg-white/80 dark:bg-slate-800/80 border-purple-300 dark:border-purple-600 focus:border-purple-500 focus:ring-purple-500 transition-all duration-200"
                  placeholder="Give your node a clear, descriptive name..."
                />
              </div>

              {/* Configuration Section */}
              <div className="rounded-[14px] border-2 border-sky-200/70 bg-slate-50/90 p-4 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/90">
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'flex-start',
                    gap: '12px',
                    marginBottom: '16px',
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '8px',
                      }}
                    >
                      <Badge
                        style={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: '#fff',
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: '8px',
                        }}
                      >
                        {nodeTypeCategory(selectedNode.type || '')}
                      </Badge>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          color: isNodeConfigured(selectedNode) ? '#10b981' : '#ef4444',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: isNodeConfigured(selectedNode) ? '#10b981' : '#ef4444',
                            display: 'inline-block',
                          }}
                        />
                        {isNodeConfigured(selectedNode) ? 'Configured' : 'Incomplete'}
                      </span>
                    </div>
                    <h4
                      style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        color: 'var(--color-foreground)',
                        margin: 0,
                      }}
                    >
                      {selectedNode.data.label}
                    </h4>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {renderNodeConfigForm(selectedNode)}
                </div>
              </div>

              {/* Node Info Section */}
              <div className="rounded-[14px] border-2 border-emerald-200/70 bg-slate-50/90 p-4 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/90">
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '12px',
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#10b981',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: 'var(--color-foreground)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    ℹ️ Node Details
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    fontSize: '12px',
                    color: 'var(--color-muted-foreground)',
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '12px' }}>
                    <strong
                      style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-foreground)' }}
                    >
                      ID:
                    </strong>
                    <span
                      style={{ fontFamily: 'var(--font-mono)', color: '#667eea', fontWeight: 600 }}
                    >
                      {selectedNode.id}
                    </span>

                    <strong
                      style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-foreground)' }}
                    >
                      Type:
                    </strong>
                    <span
                      style={{ fontFamily: 'var(--font-mono)', color: '#667eea', fontWeight: 600 }}
                    >
                      {selectedNode.type}
                    </span>

                    <strong
                      style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-foreground)' }}
                    >
                      Position:
                    </strong>
                    <span
                      style={{ fontFamily: 'var(--font-mono)', color: '#667eea', fontWeight: 600 }}
                    >
                      ({Math.round(selectedNode.position?.x ?? 0)},{' '}
                      {Math.round(selectedNode.position?.y ?? 0)})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </>
      )}

      {contextMenu.type && (
        <div
          className="fixed z-50 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-2xl shadow-2xl p-2 min-w-56"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onMouseLeave={() => setContextMenu({ type: null, x: 0, y: 0 })}
        >
          {contextMenu.type === 'node' && (
            <>
              <div className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide border-b border-slate-200/50 dark:border-slate-700/50 mb-1">
                Node Actions
              </div>
              <button
                className="w-full text-left px-3 py-3 text-sm hover:bg-blue-50/70 dark:hover:bg-blue-900/20 rounded-xl transition-all duration-200 transform hover:scale-105 flex items-center gap-3"
                onClick={() => {
                  if (contextMenu.id) duplicateNode(contextMenu.id);
                  setContextMenu({ type: null, x: 0, y: 0 });
                }}
              >
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Duplicate Node</span>
              </button>
              <button
                className="w-full text-left px-3 py-3 text-sm hover:bg-slate-50/70 dark:hover:bg-slate-700/50 rounded-xl transition-all duration-200 transform hover:scale-105 flex items-center gap-3"
                onClick={() => {
                  if (contextMenu.data?.config) copyConfig(contextMenu.data.config);
                  setContextMenu({ type: null, x: 0, y: 0 });
                }}
              >
                <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                <span>Copy Config</span>
              </button>
              <div className="border-t border-slate-200/50 dark:border-slate-700/50 my-2"></div>
              <button
                className="w-full text-left px-3 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50/70 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200 transform hover:scale-105 flex items-center gap-3"
                onClick={() => {
                  if (contextMenu.id) {
                    setNodes(nodes.filter(n => n.id !== contextMenu.id));
                  }
                  setContextMenu({ type: null, x: 0, y: 0 });
                }}
              >
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Delete Node</span>
              </button>
            </>
          )}
          {contextMenu.type === 'edge' && (
            <>
              <div className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide border-b border-slate-200/50 dark:border-slate-700/50 mb-1">
                Edge Actions
              </div>
              <button
                className="w-full text-left px-3 py-3 text-sm hover:bg-blue-50/70 dark:hover:bg-blue-900/20 rounded-xl transition-all duration-200 transform hover:scale-105 flex items-center gap-3"
                onClick={() => {
                  if (contextMenu.id) duplicateEdge(contextMenu.id);
                  setContextMenu({ type: null, x: 0, y: 0 });
                }}
              >
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Duplicate Edge</span>
              </button>
              <div className="border-t border-slate-200/50 dark:border-slate-700/50 my-2"></div>
              <button
                className="w-full text-left px-3 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50/70 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200 transform hover:scale-105 flex items-center gap-3"
                onClick={() => {
                  if (contextMenu.id) {
                    setEdges(edges.filter(e => e.id !== contextMenu.id));
                  }
                  setContextMenu({ type: null, x: 0, y: 0 });
                }}
              >
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Delete Edge</span>
              </button>
            </>
          )}
          {contextMenu.type === 'canvas' && (
            <>
              <div className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide border-b border-slate-200/50 dark:border-slate-700/50 mb-1">
                Canvas Actions
              </div>
              <button
                className="w-full text-left px-3 py-3 text-sm hover:bg-slate-50/70 dark:hover:bg-slate-700/50 rounded-xl transition-all duration-200 transform hover:scale-105 flex items-center gap-3"
                onClick={() => {
                  setNodes([]);
                  setEdges([]);
                  setContextMenu({ type: null, x: 0, y: 0 });
                }}
              >
                <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                <span>Clear Canvas</span>
              </button>
              <button
                className="w-full text-left px-3 py-3 text-sm hover:bg-blue-50/70 dark:hover:bg-blue-900/20 rounded-xl transition-all duration-200 transform hover:scale-105 flex items-center gap-3"
                onClick={() => {
                  /* undo not available in this component */
                }}
              >
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Undo</span>
              </button>
              <button
                className="w-full text-left px-3 py-3 text-sm hover:bg-blue-50/70 dark:hover:bg-blue-900/20 rounded-xl transition-all duration-200 transform hover:scale-105 flex items-center gap-3"
                onClick={() => {
                  /* redo not available in this component */
                }}
              >
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Redo</span>
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
