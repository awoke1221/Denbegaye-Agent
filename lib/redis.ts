import Redis from 'ioredis';

const redisUrl =
  process.env.REDIS_URL || process.env.NEXT_PUBLIC_REDIS_URL || 'redis://127.0.0.1:6379';

type GlobalWithRedis = typeof globalThis & {
  __redisClient?: Redis;
};

const globalWithRedis = globalThis as GlobalWithRedis;
const redisClient = globalWithRedis.__redisClient || new Redis(redisUrl);

if (process.env.NODE_ENV !== 'production') {
  globalWithRedis.__redisClient = redisClient;
}

export const AGENT_RUN_QUEUE = 'agent_execution_queue';

export const enqueueAgentRun = async (job: Record<string, unknown>) => {
  return redisClient.lpush(AGENT_RUN_QUEUE, JSON.stringify(job));
};

export default redisClient;
