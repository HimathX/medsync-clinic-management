/**
 * Simple client-side cache for API responses
 * Reduces redundant network requests for frequently accessed data
 */

class ClientCache {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes in milliseconds
  }

  /**
   * Generate a cache key from URL and params
   */
  generateKey(url, params = {}) {
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    return `${url}?${paramString}`;
  }

  /**
   * Get cached data if not expired
   */
  get(key) {
    const cached = this.cache.get(key);
    if (!cached) {
      return null;
    }

    const now = Date.now();
    if (now > cached.expiry) {
      // Expired, remove from cache
      this.cache.delete(key);
      return null;
    }

    console.log(`Cache HIT: ${key}`);
    return cached.data;
  }

  /**
   * Store data in cache with TTL
   */
  set(key, data, ttl = null) {
    const expiry = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { data, expiry });
    console.log(`Cache SET: ${key} (TTL: ${(ttl || this.defaultTTL) / 1000}s)`);
  }

  /**
   * Remove specific key from cache
   */
  delete(key) {
    this.cache.delete(key);
    console.log(`Cache DELETE: ${key}`);
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear();
    console.log('Cache CLEARED');
  }

  /**
   * Clear expired entries
   */
  clearExpired() {
    const now = Date.now();
    let removed = 0;
    
    for (const [key, value] of this.cache.entries()) {
      if (now > value.expiry) {
        this.cache.delete(key);
        removed++;
      }
    }
    
    if (removed > 0) {
      console.log(`Cache: Removed ${removed} expired entries`);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    let active = 0;
    let expired = 0;

    for (const value of this.cache.values()) {
      if (now <= value.expiry) {
        active++;
      } else {
        expired++;
      }
    }

    return {
      total: this.cache.size,
      active,
      expired
    };
  }
}

// Export singleton instance
const clientCache = new ClientCache();

// Clear expired entries every minute
setInterval(() => {
  clientCache.clearExpired();
}, 60 * 1000);

export default clientCache;
