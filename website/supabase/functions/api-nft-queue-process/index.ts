import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QueueItem {
  id: string;
  nft_id: string;
  attempts: number;
  max_attempts: number;
  nft: {
    id: string;
    purchase_id: string;
    certificate_number: number;
    metadata: any;
    user: {
      id: string;
      wallet_address: string;
      wallet_verified: boolean;
    };
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Verify user is admin
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check admin role
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleData } = await serviceClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { action, batchSize = 10 } = body;

    console.log(`[NFT Queue] Processing action: ${action}, batch size: ${batchSize}`);

    if (action === 'process') {
      // Get pending items from queue
      const { data: queueItems, error: queueError } = await serviceClient
        .from('nft_mint_queue')
        .select(`
          id,
          nft_id,
          attempts,
          max_attempts,
          nft:purchase_nfts (
            id,
            purchase_id,
            certificate_number,
            metadata,
            user:profiles (
              id,
              wallet_address,
              wallet_verified
            )
          )
        `)
        .eq('status', 'pending')
        .lte('next_attempt_at', new Date().toISOString())
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(batchSize);

      if (queueError) {
        console.error('[NFT Queue] Error fetching queue:', queueError);
        throw queueError;
      }

      console.log(`[NFT Queue] Found ${queueItems?.length || 0} items to process`);

      const results = {
        processed: 0,
        success: 0,
        failed: 0,
        skipped: 0,
        details: [] as any[]
      };

      for (const item of (queueItems || []) as unknown as QueueItem[]) {
        results.processed++;
        
        const nft = item.nft;
        const user = nft?.user;

        // Skip if user doesn't have verified wallet
        if (!user?.wallet_verified || !user?.wallet_address) {
          console.log(`[NFT Queue] Skipping ${item.nft_id} - wallet not verified`);
          
          // Update NFT status to WALLET_REQUIRED
          await serviceClient
            .from('purchase_nfts')
            .update({ mint_status: 'WALLET_REQUIRED' })
            .eq('id', item.nft_id);
          
          // Remove from queue
          await serviceClient
            .from('nft_mint_queue')
            .update({ status: 'skipped', error_message: 'Wallet not verified' })
            .eq('id', item.id);
          
          results.skipped++;
          results.details.push({ nft_id: item.nft_id, status: 'skipped', reason: 'wallet_not_verified' });
          continue;
        }

        try {
          // Update NFT status to MINTING
          await serviceClient
            .from('purchase_nfts')
            .update({ 
              mint_status: 'MINTING',
              mint_attempts: (item.attempts || 0) + 1
            })
            .eq('id', item.nft_id);

          // Update queue item
          await serviceClient
            .from('nft_mint_queue')
            .update({ 
              status: 'processing',
              attempts: (item.attempts || 0) + 1,
              last_attempt_at: new Date().toISOString()
            })
            .eq('id', item.id);

          // In a real implementation, this would call the blockchain minting API
          // For now, we simulate successful minting
          
          // Simulate minting delay
          await new Promise(resolve => setTimeout(resolve, 100));

          // Generate mock token ID and tx hash for now
          const mockTokenId = `${nft.certificate_number}`;
          const mockTxHash = `0x${Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;

          // Update NFT as minted
          await serviceClient
            .from('purchase_nfts')
            .update({
              mint_status: 'MINTED',
              token_id: mockTokenId,
              tx_hash: mockTxHash,
              minted_at: new Date().toISOString()
            })
            .eq('id', item.nft_id);

          // Mark queue item as complete
          await serviceClient
            .from('nft_mint_queue')
            .update({ status: 'completed' })
            .eq('id', item.id);

          results.success++;
          results.details.push({ 
            nft_id: item.nft_id, 
            status: 'success', 
            token_id: mockTokenId,
            tx_hash: mockTxHash
          });

          console.log(`[NFT Queue] Successfully minted NFT ${item.nft_id} with token ID ${mockTokenId}`);

        } catch (mintError) {
          console.error(`[NFT Queue] Error minting ${item.nft_id}:`, mintError);

          const errorMessage = mintError instanceof Error ? mintError.message : 'Unknown error';
          
          // Check if max attempts reached
          if ((item.attempts || 0) + 1 >= item.max_attempts) {
            // Mark as failed
            await serviceClient
              .from('purchase_nfts')
              .update({ 
                mint_status: 'FAILED',
                mint_error: errorMessage
              })
              .eq('id', item.nft_id);

            await serviceClient
              .from('nft_mint_queue')
              .update({ status: 'failed', error_message: errorMessage })
              .eq('id', item.id);

            results.failed++;
            results.details.push({ nft_id: item.nft_id, status: 'failed', error: errorMessage });
          } else {
            // Schedule retry
            const nextAttempt = new Date();
            nextAttempt.setMinutes(nextAttempt.getMinutes() + Math.pow(2, item.attempts || 0) * 5); // Exponential backoff

            await serviceClient
              .from('purchase_nfts')
              .update({ 
                mint_status: 'QUEUED',
                mint_error: errorMessage
              })
              .eq('id', item.nft_id);

            await serviceClient
              .from('nft_mint_queue')
              .update({ 
                status: 'pending', 
                next_attempt_at: nextAttempt.toISOString(),
                error_message: errorMessage
              })
              .eq('id', item.id);

            results.details.push({ nft_id: item.nft_id, status: 'retry_scheduled', next_attempt: nextAttempt.toISOString() });
          }
        }
      }

      console.log(`[NFT Queue] Processing complete:`, results);

      return new Response(
        JSON.stringify({ success: true, results }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'retry') {
      // Retry failed NFTs
      const { nft_id } = body;

      if (!nft_id) {
        return new Response(
          JSON.stringify({ error: 'nft_id required for retry' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Reset NFT status
      await serviceClient
        .from('purchase_nfts')
        .update({ 
          mint_status: 'QUEUED',
          mint_error: null,
          mint_attempts: 0
        })
        .eq('id', nft_id);

      // Add back to queue
      await serviceClient
        .from('nft_mint_queue')
        .upsert({
          nft_id,
          status: 'pending',
          attempts: 0,
          next_attempt_at: new Date().toISOString(),
          error_message: null
        }, { onConflict: 'nft_id' });

      console.log(`[NFT Queue] Retry scheduled for NFT ${nft_id}`);

      return new Response(
        JSON.stringify({ success: true, message: 'Retry scheduled' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'stats') {
      // Get queue statistics
      const { data: stats } = await serviceClient
        .from('purchase_nfts')
        .select('mint_status')
        .then(({ data }) => {
          const counts = {
            PENDING: 0,
            QUEUED: 0,
            MINTING: 0,
            MINTED: 0,
            FAILED: 0,
            WALLET_REQUIRED: 0
          };
          data?.forEach(item => {
            counts[item.mint_status as keyof typeof counts]++;
          });
          return { data: counts };
        });

      const { count: queueCount } = await serviceClient
        .from('nft_mint_queue')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      return new Response(
        JSON.stringify({ 
          success: true, 
          stats: {
            ...stats,
            queue_pending: queueCount || 0
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use: process, retry, or stats' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[NFT Queue] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
