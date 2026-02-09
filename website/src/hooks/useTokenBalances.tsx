import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface TokenBalance {
  id: string;
  token_type: string;
  balance: number;
  locked_balance: number;
  updated_at: string;
}

export const useTokenBalances = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["token-balances", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("token_balances")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      return data as TokenBalance[];
    },
    enabled: !!user,
  });
};
