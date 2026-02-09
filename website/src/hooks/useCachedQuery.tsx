import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { CACHE_TIMES, queryKeys } from "@/lib/query-config";

type CacheStrategy = 'STATIC' | 'SEMI_STATIC' | 'DYNAMIC' | 'REALTIME' | 'USER';

interface UseCachedQueryOptions<T> extends Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'> {
  cacheStrategy?: CacheStrategy;
}

/**
 * Enhanced useQuery hook with predefined caching strategies
 */
export function useCachedQuery<T>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>,
  options: UseCachedQueryOptions<T> = {}
) {
  const { cacheStrategy = 'USER', ...queryOptions } = options;
  
  const cacheConfig = CACHE_TIMES[cacheStrategy];

  return useQuery({
    queryKey,
    queryFn,
    ...cacheConfig,
    ...queryOptions, // Allow overrides
  });
}

/**
 * Specialized hooks for common query patterns
 */
export const useStaticQuery = <T,>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>,
  options: Omit<UseCachedQueryOptions<T>, 'cacheStrategy'> = {}
) => useCachedQuery(queryKey, queryFn, { ...options, cacheStrategy: 'STATIC' });

export const useDynamicQuery = <T,>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>,
  options: Omit<UseCachedQueryOptions<T>, 'cacheStrategy'> = {}
) => useCachedQuery(queryKey, queryFn, { ...options, cacheStrategy: 'DYNAMIC' });

export const useRealtimeQuery = <T,>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>,
  options: Omit<UseCachedQueryOptions<T>, 'cacheStrategy'> = {}
) => useCachedQuery(queryKey, queryFn, { ...options, cacheStrategy: 'REALTIME' });
