import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TokenInfo {
  id: string;
  token_symbol: string;
  token_name: string;
  blockchain: string;
  contract_address: string;
  decimals: number;
  current_price_usd: number | null;
  payment_discount_percent: number;
  description: string | null;
  website_url: string | null;
}

export const useTokenInfo = (symbol: string) => {
  return useQuery({
    queryKey: ["token-info", symbol],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("token_info")
        .select("*")
        .eq("token_symbol", symbol)
        .maybeSingle();

      if (error) throw error;
      return data as TokenInfo | null;
    },
  });
};

export const useAllTokenInfo = () => {
  return useQuery({
    queryKey: ["token-info-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("token_info").select("*");
      if (error) throw error;
      return data as TokenInfo[];
    },
  });
};
