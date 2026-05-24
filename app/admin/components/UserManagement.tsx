'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Users,
  Search,
  Filter,
  MoreHorizontal,
  Shield,
  UserCheck,
  UserX,
  Crown,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: string;
  created_at: string;
  updated_at: string;
  stats: {
    agents_count: number;
    executions_count: number;
    subscription: any;
  };
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function UserManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [newRole, setNewRole] = useState('');

  // Fetch users from admin API
  const fetchUsers = async (page = 1, search = '', role = 'all') => {
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
      if (role !== 'all') params.append('role', role);

      const response = await fetch(`/api/admin/users?${params}`, {
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
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.access_token) {
        throw new Error('No access token');
      }

      const response = await fetch(`/api/admin/users`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast({
        title: 'Success',
        description: 'User role updated successfully',
      });

      // Refresh users list
      fetchUsers(pagination.page, searchTerm, roleFilter);
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive',
      });
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
            <Crown className="w-3 h-3 mr-1" />
            Admin
          </Badge>
        );
      case 'moderator':
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            <Shield className="w-3 h-3 mr-1" />
            Moderator
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">
            <UserCheck className="w-3 h-3 mr-1" />
            User
          </Badge>
        );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-gray-400">Manage user accounts, roles, and permissions</p>
        </div>
        <Button onClick={() => fetchUsers(pagination.page, searchTerm, roleFilter)}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
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
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-48 bg-white/5 border-white/10">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => fetchUsers(1, searchTerm, roleFilter)} variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Users ({pagination.total.toLocaleString()})
          </CardTitle>
          <CardDescription>
            Page {pagination.page} of {pagination.totalPages}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              Loading users...
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Agents</TableHead>
                    <TableHead>Executions</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(user => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                            {user.avatar_url ? (
                              <img
                                src={user.avatar_url}
                                alt={user.full_name || user.email}
                                className="w-8 h-8 rounded-full"
                              />
                            ) : (
                              <span className="text-sm font-medium text-cyan-400">
                                {(user.full_name || user.email).charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{user.full_name || 'No name'}</p>
                            <p className="text-sm text-gray-400">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>{user.stats.agents_count}</TableCell>
                      <TableCell>{user.stats.executions_count}</TableCell>
                      <TableCell>
                        {user.stats.subscription ? (
                          <Badge variant="outline" className="text-green-400 border-green-400">
                            {user.stats.subscription.plan} ({user.stats.subscription.tier})
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-400 border-gray-400">
                            Free
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-400">
                        {formatDate(user.created_at)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-400">
                        {formatDate(user.updated_at)}
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
                                setSelectedUser(user);
                                setShowUserDialog(true);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleRoleChange(user.id, 'admin')}
                              disabled={user.role === 'admin'}
                            >
                              <Crown className="mr-2 h-4 w-4" />
                              Make Admin
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleRoleChange(user.id, 'moderator')}
                              disabled={user.role === 'moderator'}
                            >
                              <Shield className="mr-2 h-4 w-4" />
                              Make Moderator
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleRoleChange(user.id, 'user')}
                              disabled={user.role === 'user'}
                            >
                              <UserCheck className="mr-2 h-4 w-4" />
                              Make User
                            </DropdownMenuItem>
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
                    {pagination.total} users
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => fetchUsers(pagination.page - 1, searchTerm, roleFilter)}
                      disabled={pagination.page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => fetchUsers(pagination.page + 1, searchTerm, roleFilter)}
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

      {/* User Details Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="bg-[#020617] border-white/10">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>Detailed information about the selected user</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center">
                  {selectedUser.avatar_url ? (
                    <img
                      src={selectedUser.avatar_url}
                      alt={selectedUser.full_name || selectedUser.email}
                      className="w-16 h-16 rounded-full"
                    />
                  ) : (
                    <span className="text-2xl font-medium text-cyan-400">
                      {(selectedUser.full_name || selectedUser.email).charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{selectedUser.full_name || 'No name'}</h3>
                  <p className="text-gray-400">{selectedUser.email}</p>
                  {getRoleBadge(selectedUser.role)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-400">User ID</Label>
                  <p className="font-mono text-sm">{selectedUser.id}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-400">Joined</Label>
                  <p className="text-sm">{formatDate(selectedUser.created_at)}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-400">Last Active</Label>
                  <p className="text-sm">{formatDate(selectedUser.updated_at)}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-400">Agents Created</Label>
                  <p className="text-sm">{selectedUser.stats.agents_count}</p>
                </div>
              </div>

              {selectedUser.stats.subscription && (
                <div>
                  <Label className="text-sm text-gray-400">Subscription</Label>
                  <div className="mt-1">
                    <Badge variant="outline" className="text-green-400 border-green-400">
                      {selectedUser.stats.subscription.plan} ({selectedUser.stats.subscription.tier}
                      )
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowUserDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
