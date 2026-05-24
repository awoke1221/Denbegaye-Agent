'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Database,
  Server,
  Key,
  Shield,
  AlertTriangle,
  CheckCircle,
  Settings,
  Save,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  Activity,
  HardDrive,
  Cpu,
  MemoryStick,
  Search,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

interface QueueMetrics {
  queued: number;
  processing: number;
  completed: number;
  failed: number;
  dead_letter: number;
  delayed_retry: number;
}

interface SystemMetrics {
  database: {
    status: string;
    connections: number;
    queries_per_second: number;
    storage_used_gb: number;
    storage_total_gb: number;
    uptime: string;
  };
  api: {
    status: string;
    requests_per_minute: number;
    avg_response_time_ms: number;
    error_rate_percent: number;
    uptime: string;
  };
  storage: {
    status: string;
    files_count: number;
    total_size_gb: number;
    backup_status: string;
  };
  server: {
    status: string;
    cpu_usage_percent: number;
    memory_usage_percent: number;
    disk_usage_percent: number;
    network_in_mbps: number;
    network_out_mbps: number;
  };
  queue?: QueueMetrics;
}

interface ApiKey {
  id: string;
  name: string;
  key_preview: string;
  created_at: string;
  last_used_at?: string;
  permissions: string[];
  status: string;
}

interface SystemSettings {
  maintenance_mode: boolean;
  email_notifications: boolean;
  auto_backup: boolean;
  admin_email: string;
  system_name: string;
}

export function SystemAdministration() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState('monitoring');
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [settings, setSettings] = useState<SystemSettings>({
    maintenance_mode: false,
    email_notifications: true,
    auto_backup: true,
    admin_email: '',
    system_name: 'Denbegnaye Agent Platform',
  });
  const [loading, setLoading] = useState(true);

  // Fetch system metrics from admin API
  const fetchSystemMetrics = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.access_token) {
        throw new Error('No access token');
      }

      const response = await fetch(`/api/admin/system/metrics`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSystemMetrics(data.metrics);
    } catch (error) {
      console.error('Error fetching system metrics:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch system metrics',
        variant: 'destructive',
      });
    }
  };

  // Fetch API keys from admin API
  const fetchApiKeys = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.access_token) {
        throw new Error('No access token');
      }

      const response = await fetch(`/api/admin/system/api-keys`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setApiKeys(data.apiKeys);
    } catch (error) {
      console.error('Error fetching API keys:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch API keys',
        variant: 'destructive',
      });
    }
  };

  // Fetch system settings from admin API
  const fetchSystemSettings = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.access_token) {
        throw new Error('No access token');
      }

      const response = await fetch(`/api/admin/system/settings`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSettings(data.settings);
    } catch (error) {
      console.error('Error fetching system settings:', error);
      // Use default settings if fetch fails
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchSystemMetrics(), fetchApiKeys(), fetchSystemSettings()]);
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleSystemAction = async (action: string, params?: any) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.access_token) {
        throw new Error('No access token');
      }

      const response = await fetch(`/api/admin/system`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, ...params }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast({
        title: 'Success',
        description: `System ${action} completed successfully`,
      });

      // Refresh data after action
      if (action === 'backup' || action === 'optimize' || action === 'clear_cache') {
        fetchSystemMetrics();
      }
    } catch (error) {
      console.error(`Error performing system action ${action}:`, error);
      toast({
        title: 'Error',
        description: `Failed to ${action} system`,
        variant: 'destructive',
      });
    }
  };

  const handleSettingsUpdate = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.access_token) {
        throw new Error('No access token');
      }

      const response = await fetch(`/api/admin/system/settings`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast({
        title: 'Success',
        description: 'System settings updated successfully',
      });
    } catch (error) {
      console.error('Error updating system settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update system settings',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Healthy</Badge>
        );
      case 'warning':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Warning</Badge>
        );
      case 'error':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Error</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading system data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">System Administration</h2>
          <p className="text-gray-400">Monitor system health and manage configuration</p>
        </div>
        <Button
          onClick={() => {
            fetchSystemMetrics();
            fetchApiKeys();
            fetchSystemSettings();
          }}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Status
        </Button>
      </div>

      {/* System Status Overview */}
      {systemMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white/5 border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Database className="w-5 h-5 text-blue-400" />
                {getStatusBadge(systemMetrics.database.status)}
              </div>
              <div className="text-sm text-gray-400">Database</div>
              <div className="text-xs mt-1">{systemMetrics.database.connections} connections</div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Server className="w-5 h-5 text-green-400" />
                {getStatusBadge(systemMetrics.api.status)}
              </div>
              <div className="text-sm text-gray-400">API Services</div>
              <div className="text-xs mt-1">{systemMetrics.api.requests_per_minute} req/min</div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <HardDrive className="w-5 h-5 text-yellow-400" />
                {getStatusBadge(systemMetrics.storage.status)}
              </div>
              <div className="text-sm text-gray-400">Storage</div>
              <div className="text-xs mt-1">{systemMetrics.storage.total_size_gb} GB used</div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-5 h-5 text-purple-400" />
                {getStatusBadge(systemMetrics.server.status)}
              </div>
              <div className="text-sm text-gray-400">Server</div>
              <div className="text-xs mt-1">CPU: {systemMetrics.server.cpu_usage_percent}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed System Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 bg-white/5">
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="monitoring" className="space-y-4">
          {systemMetrics && (
            <>
              {/* Server Metrics */}
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="w-5 h-5" />
                    Server Performance
                  </CardTitle>
                  <CardDescription>Real-time server resource usage</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>CPU Usage</span>
                        <span>{systemMetrics.server.cpu_usage_percent}%</span>
                      </div>
                      <Progress value={systemMetrics.server.cpu_usage_percent} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Memory Usage</span>
                        <span>{systemMetrics.server.memory_usage_percent}%</span>
                      </div>
                      <Progress value={systemMetrics.server.memory_usage_percent} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Disk Usage</span>
                        <span>{systemMetrics.server.disk_usage_percent}%</span>
                      </div>
                      <Progress value={systemMetrics.server.disk_usage_percent} className="h-2" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Network In:</span>{' '}
                      {systemMetrics.server.network_in_mbps} Mbps
                    </div>
                    <div>
                      <span className="text-gray-400">Network Out:</span>{' '}
                      {systemMetrics.server.network_out_mbps} Mbps
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Database Metrics */}
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Database Metrics
                  </CardTitle>
                  <CardDescription>Database performance and usage statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{systemMetrics.database.connections}</div>
                      <div className="text-xs text-gray-400">Active Connections</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {systemMetrics.database.queries_per_second}
                      </div>
                      <div className="text-xs text-gray-400">Queries/sec</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {systemMetrics.database.storage_used_gb}GB
                      </div>
                      <div className="text-xs text-gray-400">Storage Used</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">
                        {systemMetrics.database.uptime}
                      </div>
                      <div className="text-xs text-gray-400">Uptime</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Queue Metrics */}
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    Queue Metrics
                  </CardTitle>
                  <CardDescription>Monitor Bull/Supabase queue health</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold">{systemMetrics.queue?.queued ?? 0}</div>
                      <div className="text-xs text-gray-400">Queued</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-400">
                        {systemMetrics.queue?.processing ?? 0}
                      </div>
                      <div className="text-xs text-gray-400">Processing</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-400">
                        {systemMetrics.queue?.completed ?? 0}
                      </div>
                      <div className="text-xs text-gray-400">Completed</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-400">
                        {systemMetrics.queue?.failed ?? 0}
                      </div>
                      <div className="text-xs text-gray-400">Failed</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-400">
                        {systemMetrics.queue?.dead_letter ?? 0}
                      </div>
                      <div className="text-xs text-gray-400">Dead Letter</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-yellow-400">
                        {systemMetrics.queue?.delayed_retry ?? 0}
                      </div>
                      <div className="text-xs text-gray-400">Delayed Retry</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="api-keys" className="space-y-4">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                API Key Management
              </CardTitle>
              <CardDescription>Manage API keys and their permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {apiKeys.map(apiKey => (
                  <div
                    key={apiKey.id}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{apiKey.name}</div>
                      <div className="text-sm text-gray-400 font-mono">{apiKey.key_preview}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Created: {formatDate(apiKey.created_at)}
                        {apiKey.last_used_at && ` | Last used: ${formatDate(apiKey.last_used_at)}`}
                      </div>
                      <div className="flex gap-1 mt-2">
                        {apiKey.permissions.map(perm => (
                          <Badge key={perm} variant="outline" className="text-xs">
                            {perm}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <Button className="w-full mt-4" variant="outline">
                <Key className="w-4 h-4 mr-2" />
                Generate New API Key
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                System Settings
              </CardTitle>
              <CardDescription>Configure system-wide settings and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Maintenance Mode</Label>
                  <div className="text-sm text-gray-400">
                    Temporarily disable user access for maintenance
                  </div>
                </div>
                <Switch
                  checked={settings.maintenance_mode}
                  onCheckedChange={checked =>
                    setSettings(prev => ({ ...prev, maintenance_mode: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <div className="text-sm text-gray-400">
                    Send system alerts and notifications via email
                  </div>
                </div>
                <Switch
                  checked={settings.email_notifications}
                  onCheckedChange={checked =>
                    setSettings(prev => ({ ...prev, email_notifications: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Automatic Backups</Label>
                  <div className="text-sm text-gray-400">
                    Enable daily automatic database backups
                  </div>
                </div>
                <Switch
                  checked={settings.auto_backup}
                  onCheckedChange={checked =>
                    setSettings(prev => ({ ...prev, auto_backup: checked }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Admin Email</Label>
                <Input
                  value={settings.admin_email}
                  onChange={e => setSettings(prev => ({ ...prev, admin_email: e.target.value }))}
                  placeholder="admin@denbegnaye.com"
                  className="bg-white/5 border-white/10"
                />
              </div>

              <div className="space-y-2">
                <Label>System Name</Label>
                <Input
                  value={settings.system_name}
                  onChange={e => setSettings(prev => ({ ...prev, system_name: e.target.value }))}
                  placeholder="Denbegnaye Agent Platform"
                  className="bg-white/5 border-white/10"
                />
              </div>

              <Button onClick={handleSettingsUpdate} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Maintenance Operations
              </CardTitle>
              <CardDescription>Database maintenance and system operations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="h-20 flex flex-col gap-2"
                  onClick={() => handleSystemAction('backup')}
                >
                  <Download className="w-6 h-6" />
                  <span className="text-sm">Backup Database</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col gap-2"
                  onClick={() => handleSystemAction('restore')}
                >
                  <Upload className="w-6 h-6" />
                  <span className="text-sm">Restore Backup</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col gap-2"
                  onClick={() => handleSystemAction('optimize')}
                >
                  <RefreshCw className="w-6 h-6" />
                  <span className="text-sm">Optimize Database</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col gap-2 text-red-400"
                  onClick={() => handleSystemAction('clear_cache')}
                >
                  <Trash2 className="w-6 h-6" />
                  <span className="text-sm">Clear Cache</span>
                </Button>
              </div>

              <div className="pt-4 border-t border-white/10">
                <h4 className="font-medium mb-2">Recent Backups</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>2024-01-15 02:00:00</span>
                    <Badge className="bg-green-500/20 text-green-400">Success</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>2024-01-14 02:00:00</span>
                    <Badge className="bg-green-500/20 text-green-400">Success</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>2024-01-13 02:00:00</span>
                    <Badge className="bg-green-500/20 text-green-400">Success</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
