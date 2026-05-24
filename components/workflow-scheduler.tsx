'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/lib/supabaseClient';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Clock,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  Calendar,
  Zap,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
} from 'lucide-react';
import { ScheduledJob } from '@/lib/scheduler';
import { useAuth } from '@/contexts/AuthContext';

interface WorkflowSchedulerProps {
  workflows: Array<{ id: string; name: string; description?: string }>;
  className?: string;
}

export function WorkflowScheduler({ workflows, className }: WorkflowSchedulerProps) {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<ScheduledJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingJob, setEditingJob] = useState<ScheduledJob | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    workflowId: '',
    name: '',
    description: '',
    cronExpression: '0 9 * * 1', // Default: Monday 9 AM
    timezone: 'UTC',
    enabled: true,
    payload: '{}',
  });

  useEffect(() => {
    if (user) {
      loadJobs();
    }
  }, [user]);

  const loadJobs = async () => {
    if (!user) return;

    try {
      const session = await supabase.auth.getSession();
      const accessToken = session?.data?.session?.access_token || '';
      const response = await fetch('/api/scheduler/jobs', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setJobs(data);
      }
    } catch (error) {
      console.error('Failed to load scheduled jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async () => {
    if (!user) return;

    try {
      const payload = JSON.parse(formData.payload);

      const session = await supabase.auth.getSession();
      const accessToken = session?.data?.session?.access_token;

      const response = await fetch('/api/scheduler/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          ...formData,
          userId: user.id,
          payload,
        }),
      });

      if (response.ok) {
        setShowCreateDialog(false);
        resetForm();
        loadJobs();
      }
    } catch (error) {
      console.error('Failed to create job:', error);
    }
  };

  const handleUpdateJob = async () => {
    if (!editingJob || !user) return;

    try {
      const payload = JSON.parse(formData.payload);
      const session = await supabase.auth.getSession();
      const accessToken = session?.data?.session?.access_token;

      const response = await fetch(`/api/scheduler/jobs/${editingJob.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          ...formData,
          payload,
        }),
      });

      if (response.ok) {
        setEditingJob(null);
        resetForm();
        loadJobs();
      }
    } catch (error) {
      console.error('Failed to update job:', error);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!user) return;

    if (!confirm('Are you sure you want to delete this scheduled job?')) return;

    try {
      const session = await supabase.auth.getSession();
      const accessToken = session?.data?.session?.access_token;

      const response = await fetch(`/api/scheduler/jobs/${jobId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        loadJobs();
      }
    } catch (error) {
      console.error('Failed to delete job:', error);
    }
  };

  const handleToggleJob = async (jobId: string, enabled: boolean) => {
    if (!user) return;

    try {
      const session = await supabase.auth.getSession();
      const accessToken = session?.data?.session?.access_token;

      const response = await fetch(`/api/scheduler/jobs/${jobId}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ enabled }),
      });

      if (response.ok) {
        loadJobs();
      }
    } catch (error) {
      console.error('Failed to toggle job:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      workflowId: '',
      name: '',
      description: '',
      cronExpression: '0 9 * * 1',
      timezone: 'UTC',
      enabled: true,
      payload: '{}',
    });
  };

  const openEditDialog = (job: ScheduledJob) => {
    setEditingJob(job);
    setFormData({
      workflowId: job.workflowId,
      name: job.name,
      description: job.description || '',
      cronExpression: job.cronExpression,
      timezone: job.timezone || 'UTC',
      enabled: job.enabled ?? true,
      payload: JSON.stringify(job.payload || {}, null, 2),
    });
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failure':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'success':
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Success
          </Badge>
        );
      case 'failure':
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            Failed
          </Badge>
        );
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center">
            <Clock className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p>Loading scheduled workflows...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Workflow Scheduler
        </CardTitle>
        <CardDescription>
          Schedule automated execution of your workflows using cron expressions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-muted-foreground">
            {jobs.length} scheduled job{jobs.length !== 1 ? 's' : ''}
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Schedule Workflow
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Schedule New Workflow</DialogTitle>
                <DialogDescription>
                  Configure when and how your workflow should run automatically.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="workflow-select">Workflow</Label>
                  <Select
                    value={formData.workflowId}
                    onValueChange={value => setFormData({ ...formData, workflowId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a workflow" />
                    </SelectTrigger>
                    <SelectContent>
                      {workflows.map(workflow => (
                        <SelectItem key={workflow.id} value={workflow.id}>
                          {workflow.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="job-name">Job Name</Label>
                  <Input
                    id="job-name"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter job name"
                  />
                </div>
                <div>
                  <Label htmlFor="job-description">Description (Optional)</Label>
                  <Textarea
                    id="job-description"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe what this job does"
                  />
                </div>
                <div>
                  <Label htmlFor="cron-expression">Cron Expression</Label>
                  <Input
                    id="cron-expression"
                    value={formData.cronExpression}
                    onChange={e => setFormData({ ...formData, cronExpression: e.target.value })}
                    placeholder="0 9 * * 1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Use cron format: minute hour day month day-of-week
                  </p>
                </div>
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input
                    id="timezone"
                    value={formData.timezone}
                    onChange={e => setFormData({ ...formData, timezone: e.target.value })}
                    placeholder="UTC"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enabled"
                    checked={formData.enabled}
                    onCheckedChange={checked => setFormData({ ...formData, enabled: checked })}
                  />
                  <Label htmlFor="enabled">Enabled</Label>
                </div>
                <div>
                  <Label htmlFor="payload">Payload (JSON)</Label>
                  <Textarea
                    id="payload"
                    value={formData.payload}
                    onChange={e => setFormData({ ...formData, payload: e.target.value })}
                    placeholder='{"key": "value"}'
                    className="font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateJob} disabled={!formData.workflowId || !formData.name}>
                  Create Job
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <ScrollArea className="h-96">
          <div className="space-y-2">
            {jobs.map(job => (
              <Card key={job.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(job.lastExecutionStatus)}
                    <div>
                      <h4 className="font-medium">{job.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {job.description || 'No description'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{job.cronExpression}</Badge>
                        {getStatusBadge(job.lastExecutionStatus)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleJob(job.id, !job.enabled)}
                    >
                      {job.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(job)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteJob(job.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {job.lastExecutionAt && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Last executed: {new Date(job.lastExecutionAt).toLocaleString()}
                  </div>
                )}
              </Card>
            ))}
            {jobs.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No scheduled workflows yet</p>
                <p className="text-sm">Create your first scheduled job to get started</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Edit Dialog */}
        <Dialog open={!!editingJob} onOpenChange={open => !open && setEditingJob(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Scheduled Job</DialogTitle>
              <DialogDescription>
                Modify the configuration of this scheduled workflow.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-workflow-select">Workflow</Label>
                <Select
                  value={formData.workflowId}
                  onValueChange={value => setFormData({ ...formData, workflowId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a workflow" />
                  </SelectTrigger>
                  <SelectContent>
                    {workflows.map(workflow => (
                      <SelectItem key={workflow.id} value={workflow.id}>
                        {workflow.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-job-name">Job Name</Label>
                <Input
                  id="edit-job-name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter job name"
                />
              </div>
              <div>
                <Label htmlFor="edit-job-description">Description (Optional)</Label>
                <Textarea
                  id="edit-job-description"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this job does"
                />
              </div>
              <div>
                <Label htmlFor="edit-cron-expression">Cron Expression</Label>
                <Input
                  id="edit-cron-expression"
                  value={formData.cronExpression}
                  onChange={e => setFormData({ ...formData, cronExpression: e.target.value })}
                  placeholder="0 9 * * 1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use cron format: minute hour day month day-of-week
                </p>
              </div>
              <div>
                <Label htmlFor="edit-timezone">Timezone</Label>
                <Input
                  id="edit-timezone"
                  value={formData.timezone}
                  onChange={e => setFormData({ ...formData, timezone: e.target.value })}
                  placeholder="UTC"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-enabled"
                  checked={formData.enabled}
                  onCheckedChange={checked => setFormData({ ...formData, enabled: checked })}
                />
                <Label htmlFor="edit-enabled">Enabled</Label>
              </div>
              <div>
                <Label htmlFor="edit-payload">Payload (JSON)</Label>
                <Textarea
                  id="edit-payload"
                  value={formData.payload}
                  onChange={e => setFormData({ ...formData, payload: e.target.value })}
                  placeholder='{"key": "value"}'
                  className="font-mono"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setEditingJob(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateJob} disabled={!formData.workflowId || !formData.name}>
                Update Job
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
