import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// In-memory rate limiting (5 attempts per minute per user)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const key = `verify:${userId}`;
  const limit = rateLimitStore.get(key);

  if (!limit || limit.resetAt < now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + 60000 }); // 1 minute
    return { allowed: true, remaining: 4 };
  }

  if (limit.count >= 5) {
    return { allowed: false, remaining: 0 };
  }

  limit.count++;
  return { allowed: true, remaining: 5 - limit.count };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Check rate limit
    const rateLimit = checkRateLimit(user.id);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Too many verification attempts.' }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': '0',
            'Retry-After': '60'
          } 
        }
      );
    }

    const { walletAddress, signature, message, nonce } = await req.json();

    // Comprehensive input validation
    if (!walletAddress || typeof walletAddress !== 'string') {
      throw new Error('Invalid wallet address');
    }
    
    // Validate Ethereum address format (0x followed by 40 hex characters)
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      throw new Error('Invalid Ethereum wallet address format');
    }

    if (!signature || typeof signature !== 'string') {
      throw new Error('Invalid signature');
    }
    
    // Validate signature length (should be 132 characters: 0x + 130 hex chars)
    if (!/^0x[a-fA-F0-9]{130}$/.test(signature)) {
      throw new Error('Invalid signature format');
    }

    if (!message || typeof message !== 'string') {
      throw new Error('Invalid message');
    }
    
    // Validate message length (prevent DOS attacks with huge strings)
    if (message.length > 1000) {
      throw new Error('Message too long');
    }

    if (!nonce || typeof nonce !== 'string') {
      throw new Error('Invalid nonce');
    }
    
    // Validate nonce is a valid UUID format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(nonce)) {
      throw new Error('Invalid nonce format');
    }

    console.log(`Verifying signature for user ${user.id}, wallet: ${walletAddress}`);

    // Verify nonce is valid and not expired
    const { data: nonceData, error: nonceError } = await supabaseAdmin
      .from('wallet_nonces')
      .select('*')
      .eq('user_id', user.id)
      .eq('nonce', nonce)
      .eq('used', false)
      .single();

    if (nonceError || !nonceData) {
      throw new Error('Invalid or expired nonce');
    }

    // Check if nonce is expired
    if (new Date(nonceData.expires_at) < new Date()) {
      throw new Error('Nonce expired');
    }

    // Verify message format
    const expectedMessage = `Link wallet ${walletAddress} to account ${user.id}\nNonce: ${nonce}`;
    if (message !== expectedMessage) {
      throw new Error('Invalid message format');
    }

    // Verify the signature cryptographically
    console.log('Verifying signature...');
    try {
      // Import viem for signature verification
      const { verifyMessage, recoverMessageAddress } = await import('https://esm.sh/viem@2.21.40');
      
      // Recover the address from the signature
      const recoveredAddress = await recoverMessageAddress({
        message,
        signature: signature as `0x${string}`
      });

      if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new Error('Signature verification failed: recovered address does not match');
      }
      
      console.log('Signature verified successfully');
    } catch (error: any) {
      console.error('Signature verification error:', error);
      throw new Error(`Invalid signature: ${error.message}`);
    }

    // Check if wallet is already linked to another account
    const { data: existingWallet } = await supabaseAdmin
      .from('profiles')
      .select('id, wallet_address')
      .eq('wallet_address', walletAddress.toLowerCase())
      .not('id', 'eq', user.id)
      .maybeSingle();

    if (existingWallet) {
      throw new Error('Wallet already linked to another account');
    }

    // Mark nonce as used
    await supabaseAdmin
      .from('wallet_nonces')
      .update({ used: true })
      .eq('id', nonceData.id);

    // Link wallet to user profile
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ wallet_address: walletAddress.toLowerCase() })
      .eq('id', user.id);

    if (updateError) {
      throw new Error(`Failed to link wallet: ${updateError.message}`);
    }

    console.log(`Successfully linked wallet ${walletAddress} to user ${user.id}`);

    return new Response(
      JSON.stringify({ success: true, walletAddress: walletAddress.toLowerCase() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in verify-wallet-signature:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
