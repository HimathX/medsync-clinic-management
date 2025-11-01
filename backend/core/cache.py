"""
Simple in-memory cache for frequently accessed data
Reduces database queries for static/rarely-changing data
"""
import time
import threading
from typing import Any, Optional, Dict, Tuple
from functools import wraps
import logging

logger = logging.getLogger(__name__)

class SimpleCache:
    """In-memory cache with TTL support and thread-safe operations"""
    
    def __init__(self):
        self._cache: Dict[str, Tuple[Any, float]] = {}
        self._lock = threading.RLock()  # Reentrant lock for thread safety
        self._default_ttl = 300  # 5 minutes default
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache if not expired (thread-safe)"""
        with self._lock:
            if key in self._cache:
                value, expiry = self._cache[key]
                if time.time() < expiry:
                    logger.debug(f"Cache HIT: {key}")
                    return value
                else:
                    # Expired, remove it
                    logger.debug(f"Cache EXPIRED: {key}")
                    del self._cache[key]
            logger.debug(f"Cache MISS: {key}")
            return None
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None):
        """Set value in cache with TTL in seconds (thread-safe)"""
        with self._lock:
            ttl = ttl or self._default_ttl
            expiry = time.time() + ttl
            self._cache[key] = (value, expiry)
            logger.debug(f"Cache SET: {key} (TTL: {ttl}s)")
    
    def delete(self, key: str):
        """Remove value from cache (thread-safe)"""
        with self._lock:
            if key in self._cache:
                del self._cache[key]
                logger.debug(f"Cache DELETE: {key}")
    
    def clear(self):
        """Clear all cache entries (thread-safe)"""
        with self._lock:
            self._cache.clear()
            logger.info("Cache CLEARED")
    
    def get_stats(self) -> dict:
        """Get cache statistics (thread-safe)"""
        with self._lock:
            now = time.time()
            active = sum(1 for _, expiry in self._cache.values() if expiry > now)
            return {
                "total_keys": len(self._cache),
                "active_keys": active,
                "expired_keys": len(self._cache) - active
            }

# Global cache instance
cache = SimpleCache()

def cached(ttl: int = 300, key_prefix: str = ""):
    """
    Decorator to cache function results
    
    Args:
        ttl: Time to live in seconds (default: 300 = 5 minutes)
        key_prefix: Prefix for cache key
    
    Example:
        @cached(ttl=600, key_prefix="branches")
        def get_all_branches():
            return fetch_from_db()
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Create cache key from function name and arguments
            cache_key = f"{key_prefix}:{func.__name__}:{str(args)}:{str(kwargs)}"
            
            # Try to get from cache
            result = cache.get(cache_key)
            if result is not None:
                return result
            
            # Execute function and cache result
            result = func(*args, **kwargs)
            cache.set(cache_key, result, ttl)
            return result
        
        return wrapper
    return decorator
