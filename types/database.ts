/**
 * Complete TypeScript type definitions for all Supabase database tables.
 * Auto-aligned with supabase-schema.sql
 * Generated: May 10, 2026
 */

// ============================================================================
// AUTHENTICATION & PROFILES
// ============================================================================

/**
 * User profile information
 * Foreign Key: auth.users.id
 */
export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  timezone?: string; // Default: 'UTC'
  preferences?: Record<string, any>; // Default: {}
  subscription_tier?: 'free' | 'pro' | 'enterprise'; // Default: 'free'
  credits_remaining?: number; // Default: 1000
  created_at?: string;
  updated_at?: string;
  role?: 'user' | 'moderator' | 'admin'; // Default: 'user'
}

// ============================================================================
// AGENT MANAGEMENT
// ============================================================================

/**
 * User's AI agents
 * Foreign Keys: profiles.id, agent_templates.id
 */
export interface UserAgent {
  id: string;
  user_id: string;
  template_id?: string;
  name: string;
  description?: string;
  config: Record<string, any>; // Nodes and edges configuration
  status?: 'draft' | 'active' | 'archived' | 'error'; // Default: 'draft'
  is_favorite?: boolean; // Default: false
  tags?: string[]; // Default: []
  version?: string; // Default: '1.0.0'
  created_at?: string;
  updated_at?: string;
}

/**
 * Agent execution record
 * Foreign Keys: user_agents.id, profiles.id
 */
export interface AgentExecution {
  id: string;
  agent_id?: string;
  user_id?: string;
  idempotency_key?: string; // UNIQUE
  workflow_id?: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  input_data?: Record<string, any>;
  output_data?: Record<string, any>;
  error_message?: string;
  execution_time_ms?: number;
  tokens_used?: number;
  cost_cents?: number;
  metadata?: Record<string, any>; // Default: {}
  started_at?: string;
  completed_at?: string;
  created_at?: string;
  partial_success?: boolean; // Default: false
  circuit_breaker_tripped?: boolean; // Default: false
  failed_nodes?: string[]; // Default: []
  is_temporary?: boolean; // Default: false
}

/**
 * Agent memory storage for conversation history and facts
 * Foreign Keys: user_agents.id, profiles.id
 */
export interface AgentMemory {
  id: string;
  agent_id?: string;
  user_id?: string;
  content: string;
  embedding?: any; // User-defined type for vector embeddings
  metadata?: Record<string, any>; // Default: {}
  memory_type?: 'conversation' | 'fact' | 'procedure' | 'context'; // Default: 'conversation'
  importance_score?: number; // Default: 0.5 (0.0-1.0)
  access_count?: number; // Default: 0
  last_accessed_at?: string;
  expires_at?: string;
  created_at?: string;
}

/**
 * Relationship between memories (context graph)
 * Foreign Keys: agent_memories.id
 */
export interface MemoryRelationship {
  id: string;
  source_memory_id?: string;
  target_memory_id?: string;
  relationship_type: 'related' | 'contradicts' | 'supports' | 'follows';
  strength?: number; // Default: 0.5 (0.0-1.0)
  created_at?: string;
}

/**
 * Agent template for quick setup
 * Foreign Key: profiles.id (created_by)
 */
export interface AgentTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  config: Record<string, any>;
  ui_schema?: Record<string, any>;
  is_public?: boolean; // Default: false
  created_by?: string;
  usage_count?: number; // Default: 0
  version?: string; // Default: '1.0.0'
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// WORKFLOWS
// ============================================================================

/**
 * Workflow definitions separate from agent configs
 * Foreign Keys: profiles.id, user_agents.id
 */
export interface Workflow {
  id: string;
  user_id?: string;
  agent_id?: string;
  name: string;
  description?: string;
  definition: Record<string, any>; // Workflow graph definition
  version?: number; // Default: 1
  is_active?: boolean; // Default: true
  tags?: string[]; // Default: []
  created_at?: string;
  updated_at?: string;
}

/**
 * Workflow execution records (provider-specific)
 * Foreign Key: workflows.id
 */
export interface WorkflowExecution {
  id: string;
  workflow_id?: string;
  external_execution_id: string;
  provider: 'inngest' | 'upstash' | 'temporal';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  input_payload?: Record<string, any>;
  output_payload?: Record<string, any>;
  error_details?: Record<string, any>;
  execution_time_ms?: number;
  cost_cents?: number;
  started_at?: string;
  completed_at?: string;
  created_at?: string;
}

// ============================================================================
// DATA SOURCES & RECORDS
// ============================================================================

/**
 * External data source integration
 * Foreign Key: profiles.id
 */
export interface DataSource {
  id: string;
  user_id?: string;
  name: string;
  type: 'email_list' | 'phone_list' | 'contact_list' | 'csv_upload' | 'api_integration';
  config: Record<string, any>;
  record_count?: number; // Default: 0
  last_sync_at?: string;
  is_active?: boolean; // Default: true
  created_at?: string;
  updated_at?: string;
}

/**
 * Individual data records from data sources
 * Foreign Key: data_sources.id
 */
export interface DataRecord {
  id: string;
  data_source_id?: string;
  external_id?: string;
  data: Record<string, any>;
  metadata?: Record<string, any>; // Default: {}
  status?: 'active' | 'inactive' | 'error'; // Default: 'active'
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// API KEYS & CREDENTIALS
// ============================================================================

/**
 * User's API keys for various providers (encrypted)
 * Foreign Key: profiles.id
 */
export interface UserApiKey {
  id: string;
  user_id?: string;
  provider: 'openai' | 'anthropic' | 'google' | 'deepseek' | 'groq';
  encrypted_key: string;
  key_hash: string;
  is_active?: boolean; // Default: true
  usage_count?: number; // Default: 0
  last_used_at?: string;
  created_at?: string;
  label?: string;
}

// ============================================================================
// WEBHOOKS
// ============================================================================

/**
 * Webhook trigger configuration
 * Foreign Keys: workflows.id, profiles.id
 */
export interface WebhookTrigger {
  id: string;
  workflowid?: string;
  userid?: string;
  name: string;
  description?: string;
  url: string;
  secret?: string;
  enabled?: boolean; // Default: true
  method: 'GET' | 'POST' | 'PUT' | 'PATCH';
  headers?: Record<string, string>; // Default: {}
  createdat?: string;
  updatedat?: string;
  lasttriggered?: string;
  triggercount?: number; // Default: 0
}

/**
 * Webhook event log
 * Foreign Key: webhooktriggers.id
 */
export interface WebhookEvent {
  id: string;
  webhookid?: string;
  status: 'success' | 'failure';
  eventtype: 'trigger' | 'error';
  payload?: Record<string, any>;
  metadata?: Record<string, any>;
  errormessage?: string;
  createdat?: string;
}

// ============================================================================
// SUBSCRIPTIONS & BILLING
// ============================================================================

/**
 * Pricing plan definition
 */
export interface PricingPlan {
  id: string;
  name: string;
  tier: 'free' | 'pro' | 'enterprise'; // UNIQUE
  description?: string;
  price_monthly: number;
  price_yearly: number;
  features?: Record<string, any>; // Default: {}
  limits?: Record<string, any>; // Default: {}
  is_active?: boolean; // Default: true
  stripe_price_id_monthly?: string;
  stripe_price_id_yearly?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * User's subscription status
 * Foreign Keys: profiles.id, pricing_plans.id
 */
export interface UserSubscription {
  id: string;
  user_id: string; // UNIQUE
  plan_id?: string;
  stripe_subscription_id?: string; // UNIQUE
  status?: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing'; // Default: 'active'
  billing_cycle?: 'monthly' | 'yearly'; // Default: 'monthly'
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean; // Default: false
  created_at?: string;
  updated_at?: string;
}

/**
 * Payment transaction record
 * Foreign Keys: profiles.id, user_subscriptions.id
 */
export interface PaymentHistory {
  id: string;
  user_id?: string;
  subscription_id?: string;
  stripe_payment_intent_id?: string; // UNIQUE
  amount: number;
  currency?: string; // Default: 'usd'
  status: 'succeeded' | 'failed' | 'pending' | 'canceled';
  description?: string;
  metadata?: Record<string, any>; // Default: {}
  created_at?: string;
}

// ============================================================================
// USAGE TRACKING & ANALYTICS
// ============================================================================

/**
 * Usage quotas and limits per billing period
 * Foreign Key: profiles.id
 */
export interface UsageTracking {
  id: string;
  user_id?: string;
  metric_type: 'agent_creations' | 'executions' | 'api_calls' | 'storage_mb';
  count?: number; // Default: 0
  period_start: string;
  period_end: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * User event analytics
 * Foreign Key: profiles.id
 */
export interface UsageAnalytics {
  id: string;
  user_id?: string;
  event_type: string;
  event_data?: Record<string, any>; // Default: {}
  session_id?: string;
  user_agent?: string;
  ip_address?: string; // inet type
  created_at?: string;
}

/**
 * Performance metrics collection
 * Foreign Keys: profiles.id, user_agents.id
 */
export interface PerformanceMetric {
  id: string;
  user_id?: string;
  agent_id?: string;
  metric_type: 'execution_time' | 'token_usage' | 'api_latency' | 'error_rate';
  value: number;
  unit?: string;
  metadata?: Record<string, any>; // Default: {}
  recorded_at?: string;
}

// ============================================================================
// JOB QUEUE
// ============================================================================

/**
 * Background job queue for async processing
 */
export interface JobQueue {
  id: string;
  job_type: string;
  payload: Record<string, any>;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'dead_letter';
  priority?: number; // Default: 1
  max_attempts?: number; // Default: 3
  attempt_count?: number; // Default: 0
  scheduled_at?: string;
  started_at?: string;
  completed_at?: string;
  failed_at?: string;
  error_message?: string;
  created_at?: string;
  next_retry_at?: string;
  updated_at?: string;
}

// ============================================================================
// AGGREGATE TYPES FOR API RESPONSES
// ============================================================================

/**
 * Complete user profile with related data
 */
export interface UserProfileWithRelations extends Profile {
  subscription?: UserSubscription & { plan?: PricingPlan };
  api_keys?: UserApiKey[];
  agents?: UserAgent[];
}

/**
 * Agent with execution history
 */
export interface AgentWithExecutions extends UserAgent {
  executions?: AgentExecution[];
  memories?: AgentMemory[];
  workflows?: Workflow[];
}

/**
 * Execution with full context
 */
export interface ExecutionWithDetails extends AgentExecution {
  agent?: UserAgent;
  user?: Profile;
  performance_metrics?: PerformanceMetric[];
}

/**
 * Data source with records
 */
export interface DataSourceWithRecords extends DataSource {
  records?: DataRecord[];
  record_count?: number;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Database operation response
 */
export interface DatabaseResponse<T = any> {
  data: T | null;
  error: DatabaseError | null;
  count?: number;
}

/**
 * Database error details
 */
export interface DatabaseError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page?: number;
  pageSize?: number;
  limit?: number;
  offset?: number;
}

/**
 * Database query filters
 */
export interface QueryFilters {
  [key: string]: any;
}

/**
 * Database query options
 */
export interface QueryOptions extends PaginationOptions {
  select?: string;
  order?: string;
  ascending?: boolean;
  filters?: QueryFilters;
}
