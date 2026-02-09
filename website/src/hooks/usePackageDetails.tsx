import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const PLUG_IN_DATE = new Date('2026-02-01T00:00:00Z');

export interface PackageDetails {
  purchase: {
    id: string;
    package_id: string;
    total_price: number;
    status: string;
    created_at: string;
    payment_order_id: string | null;
    package: {
      name: string;
      tier: string;
      hashrate_ths: number;
      xflow_tokens: number;
      price_usd: number;
      description: string | null;
    } | null;
  };
  paymentOrder: {
    id: string;
    tx_hash: string | null;
    chain: string;
    currency: string;
    amount_expected: number;
    amount_received: number | null;
    confirmed_at: string | null;
    status: string;
  } | null;
  earnings: {
    total_btc: number;
    total_usd: number;
    records: Array<{
      id: string;
      period: string;
      btc_earned: number;
      usd_value: number;
      status: string;
      created_at: string;
    }>;
  };
  allocation: {
    id: string;
    total_ths: number;
    status: string;
  } | null;
}

export const usePackageDetails = (purchaseId: string | null) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['package-details', purchaseId],
    queryFn: async (): Promise<PackageDetails | null> => {
      if (!purchaseId || !user?.id) return null;

      // Fetch purchase with package details
      const { data: purchase, error: purchaseError } = await supabase
        .from('package_purchases')
        .select(`
          id,
          package_id,
          total_price,
          status,
          created_at,
          payment_order_id,
          package:packages(
            name,
            tier,
            hashrate_ths,
            xflow_tokens,
            price_usd,
            description
          )
        `)
        .eq('id', purchaseId)
        .eq('user_id', user.id)
        .single();

      if (purchaseError || !purchase) {
        console.error('Error fetching purchase:', purchaseError);
        return null;
      }

      // Fetch payment order if exists
      let paymentOrder = null;
      if (purchase.payment_order_id) {
        const { data: order } = await supabase
          .from('payment_orders')
          .select('id, tx_hash, chain, currency, amount_expected, amount_received, confirmed_at, status')
          .eq('id', purchase.payment_order_id)
          .single();
        paymentOrder = order;
      }

      // Fetch earnings for this user
      const { data: earningsData } = await supabase
        .from('user_earnings')
        .select('id, period, btc_earned, usd_value, status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const earnings = {
        total_btc: earningsData?.reduce((sum, e) => sum + Number(e.btc_earned || 0), 0) || 0,
        total_usd: earningsData?.reduce((sum, e) => sum + Number(e.usd_value || 0), 0) || 0,
        records: earningsData || []
      };

      // Fetch hashrate allocation
      const { data: allocation } = await supabase
        .from('hashrate_allocations')
        .select('id, total_ths, status')
        .eq('user_id', user.id)
        .maybeSingle();

      return {
        purchase: {
          ...purchase,
          package: Array.isArray(purchase.package) ? purchase.package[0] : purchase.package
        },
        paymentOrder,
        earnings,
        allocation
      };
    },
    enabled: !!purchaseId && !!user?.id,
  });
};

export const getTimeUntilPlugIn = () => {
  const now = new Date();
  const diff = PLUG_IN_DATE.getTime() - now.getTime();
  
  if (diff <= 0) {
    return { isLive: true, days: 0, hours: 0, minutes: 0 };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return { isLive: false, days, hours, minutes };
};
