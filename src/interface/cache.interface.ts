import type { Request } from "express";

export interface cacheOptions {
  ttl?: number; // time to live in seconds
  keyPrefix?: string; // optional prefix for the cache key
  skipCacheIf?: (req: Request) => boolean; // function to determine if caching should be skipped
  invalidateOnMethods?: string[];
}
