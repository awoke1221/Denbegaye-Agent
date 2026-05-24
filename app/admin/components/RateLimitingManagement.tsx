'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Users,
  Shield,
  Zap,
  TrendingUp,
  MoreHorizontal,
  RefreshCw,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  Sliders,
  Save,
  X,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

interface UserWithSubscription {
  id: string;
  email: string;
  full_name?: string;
  subscription_tier: string;
  tier: string;
  limits: any;
  customLimits: any | null;
  usage: {
    minute: number;
    hour: number;
    day: number;
  };
  created_at: string;
  last_sign_in_at?: string;
}

interface RateLimitTiers {
  [key: string]: {
    requests_per_minute: number;
    requests_per_hour: number;
    requests_per_day: number;
    agents_limit: number;
    executions_per_month: number;
    api_calls_per_month: number;
    storage_mb: number;
  };
}

export function RateLimitingManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<UserWithSubscription | null>(null);
  const [showRateLimitDialog, setShowRateLimitDialog] = useState(false);
  const [rateLimitTiers, setRateLimitTiers] = useState<RateLimitTiers>({});
  const [customLimits, setCustomLimits] = useState({
    requests_per_minute: 0,
    requests_per_hour: 0,
    requests_per_day: 0,
    agents_limit: 0,
    executions_per_month: 0,
    api_calls_per_month: 0,
    storage_mb: 0,
  });
  const [savingLimits, setSavingLimits] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });

  // Fetch users with subscription and rate limit data
  const fetchUsersWithSubscriptions = async (page = 1, search = '', tier = 'all') => {
    try {
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.access_token) {
        throw new Error('No access token');
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });

      if (search) params.append('search', search);
      if (tier !== 'all') params.append('tier', tier);

      const response = await fetch(`/api/admin/subscriptions/users?${params}`, {
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
      setUsers(data.users || []);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users with subscription data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch available rate limit tiers
  const fetchRateLimitTiers = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.access_token) {
        throw new Error('No access token');
      }

      const response = await fetch(`/api/admin/rate-limit-tiers`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRateLimitTiers(data.tiers || data.rateLimitTiers || {});
      } else {
        const errorBody = await response.text();
        console.error('Error fetching rate limit tiers:', response.status, errorBody);
      }
    } catch (error) {
      console.error('Error fetching rate limit tiers:', error);
    }
  };

  // Open rate limit dialog
  const handleOpenRateLimitDialog = (user: UserWithSubscription) => {
    setSelectedUser(user);
    if (user.customLimits) {
      setCustomLimits(user.customLimits.limits);
    } else {
      setCustomLimits(user.limits);
    }
    setShowRateLimitDialog(true);
  };

  // Save custom rate limits
  const handleSaveRateLimits = async () => {
    if (!selectedUser) return;

    try {
      setSavingLimits(true);
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.access_token) {
        throw new Error('No access token');
      }

      const response = await fetch(`/api/admin/subscriptions/${selectedUser.id}/limits`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customLimits),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast({
        title: 'Success',
        description: `Rate limits updated for ${selectedUser.email}`,
      });

      setShowRateLimitDialog(false);
      fetchUsersWithSubscriptions(pagination.page, searchTerm, tierFilter);
    } catch (error) {
      console.error('Error saving rate limits:', error);
      toast({
        title: 'Error',
        description: 'Failed to save rate limits',
        variant: 'destructive',
      });
    } finally {
      setSavingLimits(false);
    }
  };

  // Reset custom rate limits
  const handleResetRateLimits = async () => {
    if (!selectedUser) return;

    try {
      setSavingLimits(true);
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.access_token) {
        throw new Error('No access token');
      }

      const response = await fetch(`/api/admin/subscriptions/${selectedUser.id}/limits`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast({
        title: 'Success',
        description: `Rate limits reset to tier defaults for ${selectedUser.email}`,
      });

      setShowRateLimitDialog(false);
      fetchUsersWithSubscriptions(pagination.page, searchTerm, tierFilter);
    } catch (error) {
      console.error('Error resetting rate limits:', error);
      toast({
        title: 'Error',
        description: 'Failed to reset rate limits',
        variant: 'destructive',
      });
    } finally {
      setSavingLimits(false);
    }
  };

  useEffect(() => {
    fetchUsersWithSubscriptions();
    fetchRateLimitTiers();
  }, []);

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'enterprise':
        return (
          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
            Enterprise
          </Badge>
        );
      case 'pro':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Pro</Badge>;
      case 'free':
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Free</Badge>;
      case 'custom':
        return (
          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Custom</Badge>
        );
      default:
        return <Badge variant="secondary">{tier}</Badge>;
    }
  };

  const getUsagePercentage = (current: number, limit: number) => {
    if (limit === 0) return 0;
    return Math.min((current / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage < 50) return 'text-green-400';
    if (percentage < 80) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Rate Limiting Management</h2>
          <p className="text-gray-400">Manage subscription-based rate limits for users</p>
        </div>
        <Button
          onClick={() => fetchUsersWithSubscriptions(pagination.page, searchTerm, tierFilter)}
          variant="outline"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{pagination.total}</div>
                <p className="text-xs text-gray-400">Total Users</p>
              </div>
              <Users className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-400">
                  {users.filter(u => u.tier === 'free').length}
                </div>
                <p className="text-xs text-gray-400">Free Tier</p>
              </div>
              <Zap className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-400">
                  {users.filter(u => u.tier === 'pro').length}
                </div>
                <p className="text-xs text-gray-400">Pro Tier</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-purple-400">
                  {users.filter(u => u.tier === 'enterprise').length}
                </div>
                <p className="text-xs text-gray-400">Enterprise</p>
              </div>
              <Shield className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users by email or name..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10"
                />
              </div>
            </div>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-48 bg-white/5 border-white/10">
                <SelectValue placeholder="Filter by tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => fetchUsersWithSubscriptions(1, searchTerm, tierFilter)}
              variant="outline"
            >
              <Filter className="w-4 h-4 mr-2" />
              Apply
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Users & Rate Limits
          </CardTitle>
          <CardDescription>
            Page {pagination.page} of {pagination.pages}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              Loading users...
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No users found</div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Requests/Min</TableHead>
                      <TableHead>Requests/Hour</TableHead>
                      <TableHead>Requests/Day</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map(userItem => (
                      <TableRow key={userItem.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                              <span className="text-sm font-medium text-cyan-400">
                                {userItem.full_name?.charAt(0).toUpperCase() ||
                                  userItem.email.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{userItem.full_name || 'No name'}</p>
                              <p className="text-sm text-gray-400">{userItem.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getTierBadge(userItem.tier)}</TableCell>
                        <TableCell>
                          <div>
                            <div
                              className={`text-sm font-medium ${getUsageColor(
                                getUsagePercentage(
                                  userItem.usage.minute,
                                  userItem.limits.requests_per_minute
                                )
                              )}`}
                            >
                              {userItem.usage.minute}/{userItem.limits.requests_per_minute}
                            </div>
                            <Progress
                              value={getUsagePercentage(
                                userItem.usage.minute,
                                userItem.limits.requests_per_minute
                              )}
                              className="h-1.5 mt-1"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div
                              className={`text-sm font-medium ${getUsageColor(
                                getUsagePercentage(
                                  userItem.usage.hour,
                                  userItem.limits.requests_per_hour
                                )
                              )}`}
                            >
                              {userItem.usage.hour}/{userItem.limits.requests_per_hour}
                            </div>
                            <Progress
                              value={getUsagePercentage(
                                userItem.usage.hour,
                                userItem.limits.requests_per_hour
                              )}
                              className="h-1.5 mt-1"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div
                              className={`text-sm font-medium ${getUsageColor(
                                getUsagePercentage(
                                  userItem.usage.day,
                                  userItem.limits.requests_per_day
                                )
                              )}`}
                            >
                              {userItem.usage.day}/{userItem.limits.requests_per_day}
                            </div>
                            <Progress
                              value={getUsagePercentage(
                                userItem.usage.day,
                                userItem.limits.requests_per_day
                              )}
                              className="h-1.5 mt-1"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          {userItem.customLimits ? (
                            <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                              Custom
                            </Badge>
                          ) : (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                              Default
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleOpenRateLimitDialog(userItem)}>
                                <Sliders className="mr-2 h-4 w-4" />
                                Edit Limits
                              </DropdownMenuItem>
                              {userItem.customLimits && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleResetRateLimits()}
                                    className="text-red-400"
                                  >
                                    <X className="mr-2 h-4 w-4" />
                                    Reset to Tier Default
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-gray-400">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} users
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        fetchUsersWithSubscriptions(pagination.page - 1, searchTerm, tierFilter)
                      }
                      disabled={pagination.page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        fetchUsersWithSubscriptions(pagination.page + 1, searchTerm, tierFilter)
                      }
                      disabled={pagination.page === pagination.pages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rate Limit Editor Dialog */}
      <Dialog open={showRateLimitDialog} onOpenChange={setShowRateLimitDialog}>
        <DialogContent className="max-w-2xl bg-[#020617] border-white/10">
          <DialogHeader>
            <DialogTitle>Edit Rate Limits</DialogTitle>
            <DialogDescription>
              Configure rate limits for {selectedUser?.email}
              {selectedUser?.customLimits && (
                <span className="ml-2 text-orange-400">(Custom Limits)</span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minute">Requests per Minute</Label>
                <Input
                  id="minute"
                  type="number"
                  min="1"
                  value={customLimits.requests_per_minute}
                  onChange={e =>
                    setCustomLimits(prev => ({
                      ...prev,
                      requests_per_minute: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="mt-1 bg-white/5 border-white/10"
                />
              </div>
              <div>
                <Label htmlFor="hour">Requests per Hour</Label>
                <Input
                  id="hour"
                  type="number"
                  min="1"
                  value={customLimits.requests_per_hour}
                  onChange={e =>
                    setCustomLimits(prev => ({
                      ...prev,
                      requests_per_hour: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="mt-1 bg-white/5 border-white/10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="day">Requests per Day</Label>
                <Input
                  id="day"
                  type="number"
                  min="1"
                  value={customLimits.requests_per_day}
                  onChange={e =>
                    setCustomLimits(prev => ({
                      ...prev,
                      requests_per_day: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="mt-1 bg-white/5 border-white/10"
                />
              </div>
              <div>
                <Label htmlFor="agents">Max Agents</Label>
                <Input
                  id="agents"
                  type="number"
                  min="1"
                  value={customLimits.agents_limit}
                  onChange={e =>
                    setCustomLimits(prev => ({
                      ...prev,
                      agents_limit: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="mt-1 bg-white/5 border-white/10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="executions">Executions per Month</Label>
                <Input
                  id="executions"
                  type="number"
                  min="1"
                  value={customLimits.executions_per_month}
                  onChange={e =>
                    setCustomLimits(prev => ({
                      ...prev,
                      executions_per_month: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="mt-1 bg-white/5 border-white/10"
                />
              </div>
              <div>
                <Label htmlFor="api">API Calls per Month</Label>
                <Input
                  id="api"
                  type="number"
                  min="1"
                  value={customLimits.api_calls_per_month}
                  onChange={e =>
                    setCustomLimits(prev => ({
                      ...prev,
                      api_calls_per_month: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="mt-1 bg-white/5 border-white/10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="storage">Storage (MB)</Label>
              <Input
                id="storage"
                type="number"
                min="1"
                value={customLimits.storage_mb}
                onChange={e =>
                  setCustomLimits(prev => ({
                    ...prev,
                    storage_mb: parseInt(e.target.value) || 0,
                  }))
                }
                className="mt-1 bg-white/5 border-white/10"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRateLimitDialog(false)}
              disabled={savingLimits}
            >
              Cancel
            </Button>
            {selectedUser?.customLimits && (
              <Button
                variant="outline"
                onClick={() => handleResetRateLimits()}
                disabled={savingLimits}
                className="text-red-400 hover:text-red-300"
              >
                Reset
              </Button>
            )}
            <Button
              onClick={() => handleSaveRateLimits()}
              disabled={savingLimits}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {savingLimits ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Limits
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
