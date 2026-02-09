import { supabase } from "@/integrations/supabase/client";

// Generic sum utility for numeric fields
export const sumField = (
  data: any[] | null,
  field: string
): number => {
  return data?.reduce((sum, item) => sum + Number(item[field] || 0), 0) || 0;
};

// Fetch commissions by type and user
export const fetchCommissionsByType = async (
  table: string,
  userId: string,
  amountField: string = 'amount'
) => {
  const { data } = await supabase
    .from(table as any)
    .select(amountField)
    .eq("user_id", userId);
  return sumField(data, amountField);
};

// Fetch direct commissions grouped by tier
export const fetchDirectCommissionsByTier = async (userId: string) => {
  const { data } = await supabase
    .from("direct_commissions")
    .select("tier, amount")
    .eq("user_id", userId);

  return {
    l1: data?.filter(c => c.tier === 1).reduce((sum, c) => sum + Number(c.amount), 0) || 0,
    l2: data?.filter(c => c.tier === 2).reduce((sum, c) => sum + Number(c.amount), 0) || 0,
    l3: data?.filter(c => c.tier === 3).reduce((sum, c) => sum + Number(c.amount), 0) || 0,
  };
};

// Fetch current week's date range
export const getCurrentWeekRange = () => {
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  return {
    start: startOfWeek,
    startStr: startOfWeek.toISOString().split('T')[0],
    startISO: startOfWeek.toISOString(),
  };
};

// Fetch transactions for a date range
export const fetchTransactionsSum = async (fromDate: string) => {
  const { data } = await supabase
    .from("transactions")
    .select("amount")
    .gte("created_at", fromDate);
  return sumField(data, 'amount');
};

// Fetch count with optional filters
export const fetchCount = async (
  table: string,
  filters?: { column: string; value: any }[]
) => {
  let query = supabase.from(table as any).select("*", { count: "exact", head: true });
  
  filters?.forEach(({ column, value }) => {
    query = query.eq(column, value) as any;
  });

  const { count } = await query;
  return count || 0;
};
