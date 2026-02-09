import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface PackagePurchase {
  id: string;
  package_id: string;
  total_price: number;
  payment_currency: string;
  status: string;
  created_at: string;
  transaction_hash: string | null;
  package: {
    id: string;
    name: string;
    tier: string;
    price_usd: number;
    hashrate_ths: number;
    xflow_tokens: number;
    description: string | null;
  } | null;
}

export interface PackagePurchaseStats {
  totalPackages: number;
  totalHashrate: number;
  totalXflowTokens: number;
  totalInvested: number;
}

export const usePackagePurchases = () => {
  const { user } = useAuth();

  const { data: purchases, isLoading, error, refetch } = useQuery({
    queryKey: ['package-purchases', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('package_purchases')
        .select(`
          id,
          package_id,
          total_price,
          payment_currency,
          status,
          created_at,
          transaction_hash,
          package:packages (
            id,
            name,
            tier,
            price_usd,
            hashrate_ths,
            xflow_tokens,
            description
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching package purchases:', error);
        throw error;
      }

      return (data || []) as PackagePurchase[];
    },
    enabled: !!user?.id,
  });

  // Calculate stats from purchases
  const stats: PackagePurchaseStats = {
    totalPackages: purchases?.filter(p => p.status?.toLowerCase() === 'completed').length || 0,
    totalHashrate: purchases?.reduce((sum, p) => {
      if (p.status?.toLowerCase() === 'completed' && p.package) {
        return sum + (p.package.hashrate_ths || 0);
      }
      return sum;
    }, 0) || 0,
    totalXflowTokens: purchases?.reduce((sum, p) => {
      if (p.status?.toLowerCase() === 'completed' && p.package) {
        return sum + (p.package.xflow_tokens || 0);
      }
      return sum;
    }, 0) || 0,
    totalInvested: purchases?.reduce((sum, p) => {
      if (p.status?.toLowerCase() === 'completed') {
        return sum + (p.total_price || 0);
      }
      return sum;
    }, 0) || 0,
  };

  return {
    purchases: purchases || [],
    stats,
    isLoading,
    error,
    refetch,
  };
};
