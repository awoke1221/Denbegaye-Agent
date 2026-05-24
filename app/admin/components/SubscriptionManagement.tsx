'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  CreditCard,
  Search,
  Filter,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Activity,
  RefreshCw,
  Shield,
  Mail,
  Calendar,
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
import { Checkbox } from '@/components/ui/checkbox';
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
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

interface Subscription {
  id: string;
  user_id: string;
  user: {
    id: string;
    email: string;
    full_name?: string;
  };
  plan: {
    id: string;
    name: string;
    tier: string;
    price_monthly: number;
    price_yearly: number;
    limits: {
      agents: number;
      executions: number;
      api_calls: number;
      storage_mb: number;
    };
  };
  status: string;
  billing_cycle: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function SubscriptionManagement() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [showRateLimitDialog, setShowRateLimitDialog] = useState(false);
  const [rateLimits, setRateLimits] = useState({
    agents: 0,
    executions: 0,
    api_calls: 0,
    storage_mb: 0,
  });
  const [notifyUserByEmail, setNotifyUserByEmail] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionMessageType, setActionMessageType] = useState<'success' | 'destructive' | 'info'>(
    'success'
  );

  // Fetch subscriptions from admin API
  const fetchSubscriptions = async (page = 1, search = '', status = 'all') => {
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
      if (status !== 'all') params.append('status', status);

      const response = await fetch(`/api/admin/subscriptions?${params}`, {
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
      setSubscriptions(data.subscriptions);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch subscriptions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  useEffect(() => {
    if (!actionMessage) {
      return;
    }

    const timer = window.setTimeout(() => {
      setActionMessage(null);
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [actionMessage]);

  const handleSubscriptionAction = async (
    subscriptionId: string,
    action: string,
    newStatus?: string
  ) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.access_token) {
        throw new Error('No access token');
      }

      const response = await fetch(`/api/admin/subscriptions`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId,
          action,
          status: newStatus,
          notifyUser: notifyUserByEmail,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const emailMessage = result.notificationSent ? ' Email notification sent.' : '';

      toast({
        title: 'Success',
        description: `Subscription ${action} successfully.${emailMessage}`,
      });

      setActionMessage(`Subscription ${action} successfully.${emailMessage}`);
      setActionMessageType('success');

      // Refresh subscriptions list
      fetchSubscriptions(pagination.page, searchTerm, statusFilter);
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast({
        title: 'Error',
        description: `Failed to ${action} subscription`,
        variant: 'destructive',
      });
      setActionMessage(`Failed to ${action} subscription.`);
      setActionMessageType('destructive');
    }
  };

  const handleRateLimitUpdate = async () => {
    if (!selectedSubscription) return;

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.access_token) {
        throw new Error('No access token');
      }

      // Map the dialog's rateLimits fields to the backend expected fields
      const payload: any = {
        // keep requests_* unspecified here to let backend use sensible defaults if not provided
        agents_limit: rateLimits.agents,
        executions_per_month: rateLimits.executions,
        api_calls_per_month: rateLimits.api_calls,
        storage_mb: rateLimits.storage_mb,
      };

      const userId =
        selectedSubscription.user?.id || selectedSubscription.user_id || selectedSubscription.id;

      const response = await fetch(`/api/admin/subscriptions/${userId}/limits`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast({
        title: 'Success',
        description: 'Rate limits updated successfully',
      });

      setActionMessage('Rate limits updated successfully.');
      setActionMessageType('success');
      setShowRateLimitDialog(false);
      // Refresh subscriptions list
      fetchSubscriptions(pagination.page, searchTerm, statusFilter);
    } catch (error) {
      console.error('Error updating rate limits:', error);
      toast({
        title: 'Error',
        description: 'Failed to update rate limits',
        variant: 'destructive',
      });
      setActionMessage('Failed to update rate limits.');
      setActionMessageType('destructive');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>;
      case 'canceled':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Canceled</Badge>;
      case 'past_due':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Past Due</Badge>
        );
      case 'trialing':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Trialing</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

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
      default:
        return <Badge variant="secondary">{tier}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Subscription Management</h2>
          <p className="text-gray-400">Manage user subscriptions, billing, and rate limits</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Checkbox
              id="notify-user-email"
              checked={notifyUserByEmail}
              onCheckedChange={checked => setNotifyUserByEmail(Boolean(checked))}
            />
            <Label htmlFor="notify-user-email" className="cursor-pointer">
              Notify user by email
            </Label>
          </div>
          <Button onClick={() => fetchSubscriptions(pagination.page, searchTerm, statusFilter)}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      {actionMessage ? (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            actionMessageType === 'success'
              ? 'bg-green-500/10 border-green-500 text-green-200'
              : actionMessageType === 'destructive'
                ? 'bg-red-500/10 border-red-500 text-red-200'
                : 'bg-blue-500/10 border-blue-500 text-blue-200'
          }`}
        >
          {actionMessage}
        </div>
      ) : null}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {subscriptions.filter(s => s.status === 'active').length}
                </div>
                <p className="text-xs text-gray-400">Active Subscriptions</p>
              </div>
              <CreditCard className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-400">
                  {formatCurrency(
                    subscriptions
                      .filter(s => s.status === 'active')
                      .reduce(
                        (acc, s) =>
                          acc +
                          (s.billing_cycle === 'yearly'
                            ? s.plan.price_yearly
                            : s.plan.price_monthly),
                        0
                      )
                  )}
                </div>
                <p className="text-xs text-gray-400">Monthly Revenue</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-400">
                  {subscriptions.length > 0
                    ? Math.round(
                        (subscriptions.filter(s => s.status === 'canceled').length /
                          subscriptions.length) *
                          100
                      )
                    : 0}
                  %
                </div>
                <p className="text-xs text-gray-400">Churn Rate</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-purple-400">
                  {subscriptions.filter(s => s.status === 'trialing').length}
                </div>
                <p className="text-xs text-gray-400">Trial Users</p>
              </div>
              <Activity className="w-8 h-8 text-purple-400" />
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
                  placeholder="Search subscriptions by user or plan..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 bg-white/5 border-white/10">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
                <SelectItem value="past_due">Past Due</SelectItem>
                <SelectItem value="trialing">Trialing</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => fetchSubscriptions(1, searchTerm, statusFilter)}
              variant="outline"
            >
              <Filter className="w-4 h-4 mr-2" />
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Subscriptions ({pagination.total.toLocaleString()})
          </CardTitle>
          <CardDescription>
            Page {pagination.page} of {pagination.totalPages}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              Loading subscriptions...
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Billing</TableHead>
                    <TableHead>Period End</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map(subscription => (
                    <TableRow key={subscription.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                            {subscription.user.full_name ? (
                              <span className="text-sm font-medium text-cyan-400">
                                {subscription.user.full_name.charAt(0).toUpperCase()}
                              </span>
                            ) : (
                              <span className="text-sm font-medium text-cyan-400">
                                {subscription.user.email.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium">
                              {subscription.user.full_name || 'No name'}
                            </p>
                            <p className="text-sm text-gray-400">{subscription.user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{subscription.plan.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {getTierBadge(subscription.plan.tier)}
                            <span className="text-sm text-gray-400">
                              {formatCurrency(
                                subscription.billing_cycle === 'yearly'
                                  ? subscription.plan.price_yearly
                                  : subscription.plan.price_monthly
                              )}
                              /{subscription.billing_cycle === 'yearly' ? 'yr' : 'mo'}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                      <TableCell className="text-sm text-gray-400 capitalize">
                        {subscription.billing_cycle}
                      </TableCell>
                      <TableCell className="text-sm text-gray-400">
                        {formatDate(subscription.current_period_end)}
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
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedSubscription(subscription);
                                setRateLimits(subscription.plan.limits);
                                setShowRateLimitDialog(true);
                              }}
                            >
                              <Shield className="mr-2 h-4 w-4" />
                              Manage Limits
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Mail className="mr-2 h-4 w-4" />
                              Send Invoice
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {subscription.status === 'active' && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleSubscriptionAction(subscription.id, 'cancel', 'canceled')
                                }
                                className="text-red-400"
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Cancel Subscription
                              </DropdownMenuItem>
                            )}
                            {subscription.status === 'canceled' && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleSubscriptionAction(subscription.id, 'reactivate', 'active')
                                }
                                className="text-green-400"
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Reactivate
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-gray-400">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} subscriptions
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        fetchSubscriptions(pagination.page - 1, searchTerm, statusFilter)
                      }
                      disabled={pagination.page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        fetchSubscriptions(pagination.page + 1, searchTerm, statusFilter)
                      }
                      disabled={pagination.page === pagination.totalPages}
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

      {/* Rate Limit Management Dialog */}
      <Dialog open={showRateLimitDialog} onOpenChange={setShowRateLimitDialog}>
        <DialogContent className="bg-[#020617] border-white/10">
          <DialogHeader>
            <DialogTitle>Manage Rate Limits</DialogTitle>
            <DialogDescription>
              Adjust rate limits for{' '}
              {selectedSubscription?.user.full_name || selectedSubscription?.user.email}'s
              subscription plan.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="agents" className="text-right">
                Max Agents
              </Label>
              <Input
                id="agents"
                type="number"
                value={rateLimits.agents}
                onChange={e =>
                  setRateLimits(prev => ({ ...prev, agents: parseInt(e.target.value) || 0 }))
                }
                className="col-span-3 bg-white/5 border-white/10"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="executions" className="text-right">
                Max Executions
              </Label>
              <Input
                id="executions"
                type="number"
                value={rateLimits.executions}
                onChange={e =>
                  setRateLimits(prev => ({ ...prev, executions: parseInt(e.target.value) || 0 }))
                }
                className="col-span-3 bg-white/5 border-white/10"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="api_calls" className="text-right">
                Max API Calls
              </Label>
              <Input
                id="api_calls"
                type="number"
                value={rateLimits.api_calls}
                onChange={e =>
                  setRateLimits(prev => ({ ...prev, api_calls: parseInt(e.target.value) || 0 }))
                }
                className="col-span-3 bg-white/5 border-white/10"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="storage" className="text-right">
                Max Storage (MB)
              </Label>
              <Input
                id="storage"
                type="number"
                value={rateLimits.storage_mb}
                onChange={e =>
                  setRateLimits(prev => ({ ...prev, storage_mb: parseInt(e.target.value) || 0 }))
                }
                className="col-span-3 bg-white/5 border-white/10"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRateLimitDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRateLimitUpdate} className="bg-blue-600 hover:bg-blue-700">
              Update Limits
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
