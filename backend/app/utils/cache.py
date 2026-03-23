"""Disk cache and joblib wrapper for expensive computations."""

import diskcache


# Global cache instance — stores API responses, embeddings, cluster results
cache = diskcache.Cache(".cache/pipeline")


def cached(key: str):
    """Decorator to cache function results to disk."""
    def decorator(func):
        def wrapper(*args, **kwargs):
            if key in cache:
                return cache[key]
            result = func(*args, **kwargs)
            cache[key] = result
            return result
        return wrapper
    return decorator
