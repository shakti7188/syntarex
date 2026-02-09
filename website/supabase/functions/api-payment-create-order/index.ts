import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { packageId, chain = 'SOLANA' } = await req.json();
    if (!packageId) {
      return new Response(JSON.stringify({ error: 'Package ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate chain
    const validChains = ['SOLANA', 'ETHEREUM', 'TRON'];
    const selectedChain = chain.toUpperCase();
    if (!validChains.includes(selectedChain)) {
      return new Response(JSON.stringify({ error: 'Invalid chain. Must be SOLANA, ETHEREUM, or TRON' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Creating payment order for user ${user.id}, package ${packageId}, chain ${selectedChain}`);

    // Get user's profile to check wallet and verification status
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('wallet_address, wallet_network, wallet_verified, wallet_verified_at')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Failed to get user profile:', profileError);
      return new Response(JSON.stringify({ error: 'Failed to get user profile' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify user has linked wallet for the selected chain
    const expectedNetwork = selectedChain === 'ETHEREUM' ? 'ETHEREUM' : selectedChain === 'TRON' ? 'TRON' : 'SOLANA';
    if (!userProfile?.wallet_address || userProfile?.wallet_network !== expectedNetwork) {
      return new Response(JSON.stringify({ 
        error: `You must link a ${expectedNetwork} wallet before making a payment on this network. Go to Settings to link your wallet.` 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if wallet is verified (signature proof of ownership)
    if (!userProfile.wallet_verified) {
      return new Response(JSON.stringify({ 
        error: 'Your wallet must be verified before making payments. Please verify wallet ownership by signing a message in Settings.',
        code: 'WALLET_NOT_VERIFIED'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`User wallet verified: ${userProfile.wallet_address} on ${userProfile.wallet_network}`);

    // Get package details
    const { data: packageData, error: packageError } = await supabase
      .from('packages')
      .select('*')
      .eq('id', packageId)
      .eq('is_active', true)
      .single();

    if (packageError || !packageData) {
      console.error('Package not found:', packageError);
      return new Response(JSON.stringify({ error: 'Package not found or inactive' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get active deposit wallet for selected chain
    const { data: walletData, error: walletError } = await supabase
      .from('deposit_wallets')
      .select('*')
      .eq('is_active', true)
      .eq('chain', selectedChain)
      .eq('currency', 'USDT')
      .limit(1)
      .single();

    if (walletError || !walletData) {
      console.error('No active deposit wallet found for chain:', selectedChain, walletError);
      return new Response(JSON.stringify({ error: `No deposit wallet available for ${selectedChain}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check for existing pending orders for this package and chain (non-expired)
    const { data: existingOrder } = await supabase
      .from('payment_orders')
      .select('*')
      .eq('user_id', user.id)
      .eq('package_id', packageId)
      .eq('chain', selectedChain)
      .eq('status', 'PENDING')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (existingOrder) {
      console.log('Returning existing pending order:', existingOrder.id);
      return new Response(JSON.stringify({
        success: true,
        order: existingOrder,
        walletAddress: walletData.wallet_address,
        amountUsdt: existingOrder.amount_expected,
        expiresAt: existingOrder.expires_at,
        chain: selectedChain,
        userWallet: userProfile.wallet_address,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Add unique padding to amount (random cents between 0.01 and 0.99)
    // This prevents amount-based transaction hijacking
    const baseAmount = packageData.price_usd;
    const uniquePadding = (Math.floor(Math.random() * 99) + 1) / 100; // 0.01 - 0.99
    const uniqueAmount = Math.round((baseAmount + uniquePadding) * 100) / 100;
    
    console.log(`Base amount: ${baseAmount}, Unique amount: ${uniqueAmount}`);

    // Create new payment order with 30-minute expiry
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    
    // SECURITY: Snapshot the user's wallet at order creation time
    // This prevents wallet swapping attacks where someone changes their wallet after creating an order
    const { data: newOrder, error: orderError } = await supabase
      .from('payment_orders')
      .insert({
        user_id: user.id,
        package_id: packageId,
        deposit_wallet_id: walletData.id,
        amount_expected: uniqueAmount,
        currency: 'USDT',
        chain: selectedChain,
        status: 'PENDING',
        expires_at: expiresAt,
        sender_wallet_expected: userProfile.wallet_address, // SNAPSHOT: Lock wallet at order time
      })
      .select()
      .single();

    if (orderError) {
      console.error('Failed to create payment order:', orderError);
      return new Response(JSON.stringify({ error: 'Failed to create payment order' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Created new payment order:', newOrder.id, 'with amount:', uniqueAmount);

    return new Response(JSON.stringify({
      success: true,
      order: newOrder,
      walletAddress: walletData.wallet_address,
      amountUsdt: uniqueAmount,
      expiresAt: expiresAt,
      chain: selectedChain,
      userWallet: userProfile.wallet_address,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in api-payment-create-order:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
