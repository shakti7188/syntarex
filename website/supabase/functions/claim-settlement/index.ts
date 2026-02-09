import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { settlementId, walletAddress, merkleProof } = await req.json();

    if (!settlementId || !walletAddress) {
      throw new Error("Missing required fields");
    }

    // Get settlement details
    const { data: settlement, error: settlementError } = await supabaseClient
      .from("weekly_settlements")
      .select("*")
      .eq("id", settlementId)
      .eq("user_id", user.id)
      .single();

    if (settlementError || !settlement) {
      throw new Error("Settlement not found");
    }

    // Check if already claimed
    if (settlement.status === "CLAIMED") {
      throw new Error("Settlement already claimed");
    }

    // Check if settlement is ready to claim
    if (settlement.status !== "READY_TO_CLAIM" || !settlement.is_finalized) {
      throw new Error("Settlement not ready to claim");
    }

    // Verify merkle proof exists
    if (!settlement.merkle_proof || !merkleProof) {
      throw new Error("Merkle proof required");
    }

    // In production, you would:
    // 1. Verify the Merkle proof against the week's Merkle root
    // 2. Call the smart contract to execute the claim
    // 3. Wait for transaction confirmation
    // 4. Update the settlement with transaction hash

    // For now, we'll simulate the claim process
    const txHash = `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`;

    // Update settlement status
    const { data: updatedSettlement, error: updateError } = await supabaseClient
      .from("weekly_settlements")
      .update({
        status: "CLAIMED",
        claimed_at: new Date().toISOString(),
        transaction_hash: txHash,
        wallet_address: walletAddress,
      })
      .eq("id", settlementId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Create transaction record
    await supabaseClient.from("transactions").insert({
      user_id: user.id,
      transaction_type: "SETTLEMENT_CLAIM",
      amount: settlement.total_amount,
      currency: "USDT",
      status: "COMPLETED",
      tx_hash: txHash,
      related_id: settlementId,
      payment_method: "CRYPTO",
      description: `Weekly settlement claim for week ${settlement.week_start}`,
      completed_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        settlement: updatedSettlement,
        txHash,
        message: "Settlement claimed successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error claiming settlement:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
