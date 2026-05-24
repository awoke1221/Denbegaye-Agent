// Stub implementations for removed backend functions
// These should be replaced with calls to the workers service

export interface ScheduledJob {
  id: string;
  workflowId: string;
  userId: string;
  cronExpression: string;
  name: string;
  isActive: boolean;
  nextRun?: Date;
  lastRun?: Date;
  description?: string;
  timezone?: string;
  enabled?: boolean;
  payload?: Record<string, any>;
  lastExecutionStatus?: string;
  lastExecutionAt?: Date;
}

export const getScheduledJobs = async (userId: string): Promise<ScheduledJob[]> => {
  // TODO: Call workers service
  return [];
};

export const createScheduledJob = async (job: Omit<ScheduledJob, 'id'>): Promise<string> => {
  // TODO: Call workers service
  return 'job-id';
};

export const updateScheduledJob = async (
  jobId: string,
  updates: Partial<ScheduledJob>
): Promise<void> => {
  // TODO: Call workers service
};

export const deleteScheduledJob = async (jobId: string): Promise<void> => {
  // TODO: Call workers service
};
