import Redis from 'ioredis';

const redisUrl =
  process.env.REDIS_URL || process.env.NEXT_PUBLIC_REDIS_URL || 'redis://127.0.0.1:6379';

declare global {
  let __redisClient: Redis | undefined;
}

const redisClient = globalThis.__redisClient || new Redis(redisUrl);

if (process.env.NODE_ENV !== 'production') {
  globalThis.__redisClient = redisClient;
}

export const AGENT_RUN_QUEUE = 'agent_execution_queue';

export const enqueueAgentRun = async (job: Record<string, unknown>) => {
  return redisClient.lpush(AGENT_RUN_QUEUE, JSON.stringify(job));
};

export default redisClient;
