'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Users,
  Bot,
  BarChart3,
  Settings,
  Shield,
  Activity,
  Database,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Crown,
  Zap,
  Server,
  UserCheck,
  Ban,
  Trash2,
  Eye,
  RefreshCw,
  BookOpen,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { UserManagement } from './components/UserManagement';
import { AgentManagement } from './components/AgentManagement';
import { SubscriptionManagement } from './components/SubscriptionManagement';
import { RateLimitingManagement } from './components/RateLimitingManagement';
import { SystemAdministration } from './components/SystemAdministration';
import { TemplateManagement } from './components/TemplateManagement';
import { supabase } from '@/lib/supabaseClient';

interface Activity {
  id: string;
  type: string;
  action: string;
  user: string;
  time: string;
  details?: any;
}

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalAgents: number;
  runningExecutions: number;
  errorRate: number;
  systemHealth: {
    database: string;
    api: string;
    storage: string;
    overall: string;
  };
}

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalAgents: 0,
    runningExecutions: 0,
    errorRate: 0,
    systemHealth: {
      database: 'unknown',
      api: 'unknown',
      storage: 'unknown',
      overall: 'unknown',
    },
  });
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check admin access and fetch data
  useEffect(() => {
    const initializeAdmin = async () => {
      if (authLoading) {
        return;
      }

      if (!user) {
        setPageLoading(false);
        router.push('/');
        return;
      }

      try {
        // First, ensure profile exists
        const { data: existingProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        let profile = existingProfile;

        if (fetchError && fetchError.code === 'PGRST116') {
          // Profile doesn't exist, create it
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || '',
              role: 'admin', // Set as admin for development
            })
            .select('role')
            .single();

          if (createError) {
            console.error('Admin check: Profile creation error:', createError);
            setPageLoading(false);
            router.push('/');
            return;
          }

          profile = newProfile;
        } else if (fetchError) {
          console.error('Admin check: Profile query error:', fetchError);
          setPageLoading(false);
          router.push('/');
          return;
        }

        if (profile?.role !== 'admin') {
          // Update role to admin for development
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ role: 'admin' })
            .eq('id', user.id);

          if (updateError) {
            console.error('Admin check: Profile update error:', updateError);
            setPageLoading(false);
            router.push('/');
            return;
          }
        }

        setIsAdmin(true);
        await fetchDashboardData();
      } catch (error) {
        console.error('Admin check failed:', error);
        setPageLoading(false);
        router.push('/');
      }
    };

    initializeAdmin();
  }, [user, authLoading, router]);

  // Fetch real admin data from server-side API
  const fetchDashboardData = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.access_token) {
        throw new Error('No access token');
      }

      const response = await fetch(`/api/admin/dashboard`, {
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
      // Handle both expected response formats
      if (data.stats) {
        setStats(data.stats);
        setRecentActivities(data.recentActivities || data.recent_activities || []);
      } else {
        const systemHealth = data.system_health || {
          database: data.system_status || 'unknown',
          api: data.system_status || 'unknown',
          storage: data.system_status || 'unknown',
          overall: data.system_status || 'unknown',
        };

        setStats({
          totalUsers: data.total_users ?? data.totalUsers ?? 0,
          activeUsers: data.active_users ?? data.activeUsers ?? 0,
          totalAgents: data.total_agents ?? data.totalAgents ?? 0,
          runningExecutions: data.running_executions ?? data.runningExecutions ?? 0,
          errorRate: data.error_rate ?? data.errorRate ?? 0,
          systemHealth,
        });

        setRecentActivities(
          data.recentActivities || data.recent_activities || data.recentExecutions || []
        );
      }
    } catch (error) {
      console.error('Error fetching admin dashboard data:', error);
      // Fallback to basic data if API fails
      setStats({
        totalUsers: 0,
        activeUsers: 0,
        totalAgents: 0,
        runningExecutions: 0,
        errorRate: 0,
        systemHealth: {
          database: 'error',
          api: 'error',
          storage: 'error',
          overall: 'error',
        },
      });
    } finally {
      setPageLoading(false);
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-400';
      case 'warning':
        return 'text-yellow-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  if (authLoading || pageLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-[var(--text-secondary)]">
            You don't have permission to access the admin dashboard.
          </p>
        </div>
      </div>
    );
  }

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)]">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[rgba(255,255,255,0.7)] border-b border-[var(--border-default)]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Crown className="w-8 h-8 text-[var(--text-primary)]" />
            <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
              Advanced Admin Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Badge
              variant="outline"
              className={`${getHealthColor(stats.systemHealth.overall)} border-current`}
            >
              {getHealthIcon(stats.systemHealth.overall)}
              <span className="ml-1">System {stats.systemHealth.overall}</span>
            </Badge>
            <Button
              onClick={() => router.push('/admin/blog')}
              variant="ghost"
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Blog posts
            </Button>
            <Button
              onClick={() => router.push('/')}
              variant="ghost"
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Back to App
            </Button>
            <Button
              onClick={fetchDashboardData}
              variant="ghost"
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              disabled={pageLoading}
            >
              <RefreshCw className={`w-4 h-4 ${pageLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* System Health Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Database</CardTitle>
              {getHealthIcon(stats.systemHealth.database)}
            </CardHeader>
            <CardContent>
              <div className={`text-lg font-bold ${getHealthColor(stats.systemHealth.database)}`}>
                {stats.systemHealth.database}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">API</CardTitle>
              {getHealthIcon(stats.systemHealth.api)}
            </CardHeader>
            <CardContent>
              <div className={`text-lg font-bold ${getHealthColor(stats.systemHealth.api)}`}>
                {stats.systemHealth.api}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Storage</CardTitle>
              {getHealthIcon(stats.systemHealth.storage)}
            </CardHeader>
            <CardContent>
              <div className={`text-lg font-bold ${getHealthColor(stats.systemHealth.storage)}`}>
                {stats.systemHealth.storage}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Error Rate</CardTitle>
              <AlertTriangle
                className={`w-4 h-4 ${stats.errorRate > 5 ? 'text-red-400' : stats.errorRate > 1 ? 'text-yellow-400' : 'text-green-400'}`}
              />
            </CardHeader>
            <CardContent>
              <div
                className={`text-lg font-bold ${stats.errorRate > 5 ? 'text-red-400' : stats.errorRate > 1 ? 'text-yellow-400' : 'text-green-400'}`}
              >
                {stats.errorRate.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Users</CardTitle>
              <Users className="h-4 w-4 text-cyan-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-green-400">+12% from last month</p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Active Users</CardTitle>
              <UserCheck className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeUsers.toLocaleString()}</div>
              <p className="text-xs text-green-400">
                {((stats.activeUsers / Math.max(stats.totalUsers, 1)) * 100).toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Active Agents</CardTitle>
              <Bot className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAgents.toLocaleString()}</div>
              <p className="text-xs text-green-400">+8% from last month</p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Running Executions
              </CardTitle>
              <Activity className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.runningExecutions}</div>
              <p className="text-xs text-yellow-400">Real-time count</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Admin Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-8 bg-white/5">
            <TabsTrigger value="overview" className="data-[state=active]:bg-cyan-500">
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-cyan-500">
              Users
            </TabsTrigger>
            <TabsTrigger value="agents" className="data-[state=active]:bg-cyan-500">
              Agents
            </TabsTrigger>
            <TabsTrigger value="templates" className="data-[state=active]:bg-cyan-500">
              Templates
            </TabsTrigger>
            <TabsTrigger value="executions" className="data-[state=active]:bg-cyan-500">
              Executions
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="data-[state=active]:bg-cyan-500">
              Subscriptions
            </TabsTrigger>
            <TabsTrigger value="rate-limits" className="data-[state=active]:bg-cyan-500">
              Rate Limits
            </TabsTrigger>
            <TabsTrigger value="system" className="data-[state=active]:bg-cyan-500">
              System
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Recent Activity */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Latest system activities and user actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.length > 0 ? (
                    recentActivities.map(activity => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 p-3 rounded-lg bg-white/5"
                      >
                        <div
                          className={`w-2 h-2 rounded-full mt-2 ${
                            activity.type === 'error'
                              ? 'bg-red-400'
                              : activity.type === 'success'
                                ? 'bg-green-400'
                                : activity.type === 'running'
                                  ? 'bg-blue-400'
                                  : 'bg-gray-400'
                          }`}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.action}</p>
                          <p className="text-xs text-gray-400">
                            {activity.user} • {activity.time}
                          </p>
                          {activity.details && (
                            <div className="mt-2 text-xs text-gray-500">
                              Status: {activity.details.status} | Duration:{' '}
                              {activity.details.execution_time || 'N/A'}ms
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-center py-4">No recent activity</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="agents">
            <AgentManagement />
          </TabsContent>

          <TabsContent value="templates">
            <TemplateManagement />
          </TabsContent>

          <TabsContent value="executions">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Execution Management
                </CardTitle>
                <CardDescription>Monitor and manage agent executions</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">
                  Execution management interface will be implemented here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscriptions">
            <SubscriptionManagement />
          </TabsContent>

          <TabsContent value="rate-limits">
            <RateLimitingManagement />
          </TabsContent>

          <TabsContent value="system">
            <SystemAdministration />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
