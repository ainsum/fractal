/**
 * Cache Service for managing response caching with LRU implementation
 */

import { PERFORMANCE_CONSTANTS } from '../shared/constants';
import { logger } from '../shared/logger';
import type { AIResponse } from '../shared/types';

export class CacheService {
  private cache: Map<string, AIResponse> = new Map();

  constructor() {
    logger.info('Initializing Cache Service', { component: 'CacheService', method: 'constructor' });
  }

  /**
   * Generate cache key for request
   */
  public generateCacheKey(url: string, provider: string, options: any): string {
    return `${url}:${provider}:${JSON.stringify(options)}`;
  }

  /**
   * Get cached response
   */
  public get(key: string): AIResponse | undefined {
    const cached = this.cache.get(key);
    if (cached) {
      logger.cacheHit(key, { component: 'CacheService', method: 'get' });
    } else {
      logger.cacheMiss(key, { component: 'CacheService', method: 'get' });
    }
    return cached;
  }

  /**
   * Cache response with LRU implementation
   */
  public set(key: string, response: AIResponse): void {
    // Implement LRU cache
    if (this.cache.size >= PERFORMANCE_CONSTANTS.MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
      logger.debug('Evicted oldest cache entry', {
        component: 'CacheService',
        method: 'set',
        evictedKey: firstKey,
        cacheSize: this.cache.size,
      });
    }

    this.cache.set(key, response);
    logger.debug('Cached response', {
      component: 'CacheService',
      method: 'set',
      key,
      cacheSize: this.cache.size,
    });
  }

  /**
   * Check if key exists in cache
   */
  public has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Remove specific key from cache
   */
  public delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      logger.debug('Deleted cache entry', {
        component: 'CacheService',
        method: 'delete',
        key,
        cacheSize: this.cache.size,
      });
    }
    return deleted;
  }

  /**
   * Clear all cache
   */
  public clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    logger.info('Cache cleared', {
      component: 'CacheService',
      method: 'clear',
      clearedEntries: size,
    });
  }

  /**
   * Get cache statistics
   */
  public getStats(): { size: number; maxSize: number; hitRate?: number } {
    return {
      size: this.cache.size,
      maxSize: PERFORMANCE_CONSTANTS.MAX_CACHE_SIZE,
    };
  }

  /**
   * Get all cache keys
   */
  public getKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache size
   */
  public getSize(): number {
    return this.cache.size;
  }

  /**
   * Check if cache is full
   */
  public isFull(): boolean {
    return this.cache.size >= PERFORMANCE_CONSTANTS.MAX_CACHE_SIZE;
  }
}
