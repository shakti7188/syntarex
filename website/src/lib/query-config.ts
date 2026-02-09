import { QueryClient } from "@tanstack/react-query";

/**
 * Centralized React Query configuration with optimized caching
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache for 5 minutes by default
      staleTime: 5 * 60 * 1000,
      
      // Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      
      // Retry failed requests 1 time
      retry: 1,
      
      // Refetch on window focus only if data is stale
      refetchOnWindowFocus: true,
      
      // Don't refetch on mount if data is fresh
      refetchOnMount: false,
      
      // Don't refetch on reconnect if data is fresh
      refetchOnReconnect: false,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
    },
  },
});

/**
 * Specific cache configurations for different data types
 */
export const CACHE_TIMES = {
  // Static data that rarely changes
  STATIC: {
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
  },
  
  // Semi-static data (machine types, settings)
  SEMI_STATIC: {
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  },
  
  // Dynamic data (balances, stats)
  DYNAMIC: {
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  },
  
  // Real-time data (active trades, current hashrate)
  REALTIME: {
    staleTime: 5 * 1000, // 5 seconds
    gcTime: 1 * 60 * 1000, // 1 minute
  },
  
  // User-specific data
  USER: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  },
};

/**
 * Query key factory for consistent cache management
 */
export const queryKeys = {
  // Machine related
  machineTypes: () => ['machine-types'] as const,
  machineInventory: (userId?: string) => ['machine-inventory', userId] as const,
  machineDetail: (id: string) => ['machine-detail', id] as const,
  
  // Mining pools
  poolConfigs: (userId?: string) => ['mining-pool-configs', userId] as const,
  poolStats: (poolId: string) => ['pool-stats', poolId] as const,
  poolWorkers: (poolId: string) => ['pool-workers', poolId] as const,
  poolPayouts: (poolId: string) => ['pool-payouts', poolId] as const,
  
  // Hashrate
  hashrateAllocations: (userId?: string) => ['hashrate-allocations', userId] as const,
  hashrateTokenizations: (userId?: string) => ['hashrate-tokenizations', userId] as const,
  
  // Marketplace
  marketplaceListings: () => ['marketplace-listings'] as const,
  myTrades: (userId?: string) => ['my-trades', userId] as const,
  myListings: (userId?: string) => ['my-listings', userId] as const,
  
  // Tokens & Balances
  tokenBalances: (userId?: string) => ['token-balances', userId] as const,
  tokenInfo: (symbol: string) => ['token-info', symbol] as const,
  
  // Commissions & Settlements
  commissions: (userId?: string, weekStart?: string) => ['commissions', userId, weekStart] as const,
  settlements: (userId?: string) => ['settlements', userId] as const,
  claimableSettlements: (userId?: string) => ['claimable-settlements', userId] as const,
  
  // Network & Referrals
  networkTree: (userId?: string) => ['network-tree', userId] as const,
  referrals: (userId?: string) => ['referrals', userId] as const,
  
  // User
  userProfile: (userId?: string) => ['user-profile', userId] as const,
  userRank: (userId?: string) => ['user-rank', userId] as const,
  
  // Transactions
  paymentTransactions: (userId?: string) => ['payment-transactions', userId] as const,
  
  // Admin
  adminUsers: () => ['admin-users'] as const,
  adminAnalytics: () => ['admin-analytics'] as const,
};
