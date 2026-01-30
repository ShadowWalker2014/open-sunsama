/**
 * Redis client utilities for Open Sunsama API
 * Uses lazy initialization to avoid accessing env vars at module level
 */

import Redis from 'ioredis';

let redisClient: Redis | null = null;
let redisSub: Redis | null = null;
let redisPub: Redis | null = null;

/**
 * Get or create the main Redis client
 * Used for general Redis operations (caching, etc.)
 */
export function getRedisClient(): Redis {
  if (!redisClient) {
    const url = process.env.REDIS_URL;
    if (!url) throw new Error('REDIS_URL not configured');
    redisClient = new Redis(url);
    redisClient.on('error', (err) => {
      console.error('[Redis] Client error:', err);
    });
  }
  return redisClient;
}

/**
 * Get or create the Redis subscriber client
 * Used for receiving pub/sub messages
 * Note: A client in subscribe mode cannot run other commands
 */
export function getRedisSubscriber(): Redis {
  if (!redisSub) {
    const url = process.env.REDIS_URL;
    if (!url) throw new Error('REDIS_URL not configured');
    redisSub = new Redis(url);
    redisSub.on('error', (err) => {
      console.error('[Redis] Subscriber error:', err);
    });
  }
  return redisSub;
}

/**
 * Get or create the Redis publisher client
 * Used for publishing pub/sub messages
 */
export function getRedisPublisher(): Redis {
  if (!redisPub) {
    const url = process.env.REDIS_URL;
    if (!url) throw new Error('REDIS_URL not configured');
    redisPub = new Redis(url);
    redisPub.on('error', (err) => {
      console.error('[Redis] Publisher error:', err);
    });
  }
  return redisPub;
}

/**
 * Close all Redis connections gracefully
 * Called during server shutdown
 */
export async function closeRedisConnections(): Promise<void> {
  const closePromises: Promise<string>[] = [];

  if (redisClient) {
    closePromises.push(redisClient.quit());
  }
  if (redisSub) {
    closePromises.push(redisSub.quit());
  }
  if (redisPub) {
    closePromises.push(redisPub.quit());
  }

  await Promise.all(closePromises);

  redisClient = null;
  redisSub = null;
  redisPub = null;

  console.log('[Redis] All connections closed');
}
