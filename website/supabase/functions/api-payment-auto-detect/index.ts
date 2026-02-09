import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Solana USDT SPL Token Mint Address (mainnet)
const SOLANA_USDT_MINT = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';

// Ethereum USDT ERC-20 Contract Address (mainnet)
const ETH_USDT_CONTRACT = '0xdAC17F958D2ee523a2206206994597C13D831ec7'.toLowerCase();

// Tron USDT TRC-20 Contract Address (mainnet)
const TRON_USDT_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';

interface DetectionResult {
  found: boolean;
  txHash?: string;
  amount?: number;
  error?: string;
}

// Search for Solana USDT transactions to our deposit wallet from user's wallet
async function searchSolanaTransactions(
  depositWallet: string,
  userWallet: string,
  expectedAmount: number,
  orderCreatedAt: string
): Promise<DetectionResult> {
  const heliusApiKey = Deno.env.get('HELIUS_API_KEY');
  if (!heliusApiKey) {
    return { found: false, error: 'Helius API not configured' };
  }

  const rpcUrl = `https://mainnet.helius-rpc.com/?api-key=${heliusApiKey}`;
  const orderTimestamp = new Date(orderCreatedAt).getTime() / 1000;

  try {
    console.log(`Searching Solana transactions from ${userWallet} to ${depositWallet}`);

    const signaturesResponse = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getSignaturesForAddress',
        params: [depositWallet, { limit: 30 }],
      }),
    });

    const signaturesResult = await signaturesResponse.json();
    if (signaturesResult.error || !signaturesResult.result) {
      console.error('Failed to get signatures:', signaturesResult.error);
      return { found: false, error: 'Failed to query blockchain' };
    }

    const signatures = signaturesResult.result;
    console.log(`Found ${signatures.length} recent transactions`);

    for (const sig of signatures) {
      if (sig.blockTime && sig.blockTime < orderTimestamp) {
        continue;
      }

      if (sig.err) continue;

      const txResponse = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getTransaction',
          params: [sig.signature, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }],
        }),
      });

      const txResult = await txResponse.json();
      if (!txResult.result) continue;

      const transaction = txResult.result;

      const accountKeys = transaction.transaction?.message?.accountKeys || [];
      let senderAddress = null;
      if (accountKeys.length > 0) {
        const firstAccount = accountKeys[0];
        senderAddress = typeof firstAccount === 'string' ? firstAccount : firstAccount?.pubkey;
      }

      if (!senderAddress || senderAddress.toLowerCase() !== userWallet.toLowerCase()) {
        continue;
      }

      const preTokenBalances = transaction.meta?.preTokenBalances || [];
      const postTokenBalances = transaction.meta?.postTokenBalances || [];

      for (const postBalance of postTokenBalances) {
        if (postBalance.mint !== SOLANA_USDT_MINT) continue;
        if (postBalance.owner?.toLowerCase() !== depositWallet.toLowerCase()) continue;

        const preBalance = preTokenBalances.find(
          (pre: any) => pre.accountIndex === postBalance.accountIndex
        );

        const preAmount = preBalance?.uiTokenAmount?.uiAmount || 0;
        const postAmount = postBalance.uiTokenAmount?.uiAmount || 0;
        const amountReceived = postAmount - preAmount;

        if (amountReceived > 0) {
          const tolerance = expectedAmount * 0.02;
          if (Math.abs(amountReceived - expectedAmount) < tolerance) {
            console.log(`Found matching Solana transaction: ${sig.signature}, amount: ${amountReceived}`);
            return { found: true, txHash: sig.signature, amount: amountReceived };
          }
        }
      }
    }

    return { found: false };
  } catch (error) {
    console.error('Error searching Solana transactions:', error);
    return { found: false, error: 'Failed to search blockchain' };
  }
}

// Search for Ethereum USDT transactions to our deposit wallet from user's wallet
async function searchEthereumTransactions(
  depositWallet: string,
  userWallet: string,
  expectedAmount: number,
  orderCreatedAt: string
): Promise<DetectionResult> {
  const alchemyApiKey = Deno.env.get('ALCHEMY_API_KEY');
  if (!alchemyApiKey) {
    return { found: false, error: 'Alchemy API not configured' };
  }

  const rpcUrl = `https://eth-mainnet.g.alchemy.com/v2/${alchemyApiKey}`;

  try {
    console.log(`Searching Ethereum transactions from ${userWallet} to ${depositWallet}`);

    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'alchemy_getAssetTransfers',
        params: [{
          fromAddress: userWallet,
          toAddress: depositWallet,
          contractAddresses: [ETH_USDT_CONTRACT],
          category: ['erc20'],
          maxCount: '0x14',
          order: 'desc',
          withMetadata: true,
        }],
      }),
    });

    const result = await response.json();
    if (result.error) {
      console.error('Alchemy error:', result.error);
      return { found: false, error: 'Failed to query blockchain' };
    }

    const transfers = result.result?.transfers || [];
    console.log(`Found ${transfers.length} USDT transfers`);

    const orderTimestamp = new Date(orderCreatedAt).getTime();

    for (const transfer of transfers) {
      const transferTimestamp = transfer.metadata?.blockTimestamp 
        ? new Date(transfer.metadata.blockTimestamp).getTime() 
        : 0;
      
      if (transferTimestamp < orderTimestamp) {
        continue;
      }

      const amount = transfer.value || 0;
      
      const tolerance = expectedAmount * 0.02;
      if (Math.abs(amount - expectedAmount) < tolerance) {
        console.log(`Found matching Ethereum transaction: ${transfer.hash}, amount: ${amount}`);
        return { found: true, txHash: transfer.hash, amount };
      }
    }

    return { found: false };
  } catch (error) {
    console.error('Error searching Ethereum transactions:', error);
    return { found: false, error: 'Failed to search blockchain' };
  }
}

// Search for Tron USDT transactions to our deposit wallet from user's wallet
async function searchTronTransactions(
  depositWallet: string,
  userWallet: string,
  expectedAmount: number,
  orderCreatedAt: string
): Promise<DetectionResult> {
  const tronGridApiKey = Deno.env.get('TRONGRID_API_KEY');
  if (!tronGridApiKey) {
    return { found: false, error: 'TronGrid API not configured' };
  }

  try {
    console.log(`Searching Tron transactions from ${userWallet} to ${depositWallet}`);

    const orderTimestamp = new Date(orderCreatedAt).getTime();

    // Get TRC20 transfers to the deposit wallet
    const response = await fetch(
      `https://api.trongrid.io/v1/accounts/${depositWallet}/transactions/trc20?limit=50&contract_address=${TRON_USDT_CONTRACT}`,
      {
        headers: { 'TRON-PRO-API-KEY': tronGridApiKey },
      }
    );

    if (!response.ok) {
      console.error('TronGrid API error:', response.status);
      return { found: false, error: 'Failed to query blockchain' };
    }

    const result = await response.json();
    const transfers = result.data || [];
    console.log(`Found ${transfers.length} TRC20 transfers`);

    for (const transfer of transfers) {
      // Check timestamp
      const transferTimestamp = transfer.block_timestamp || 0;
      if (transferTimestamp < orderTimestamp) {
        continue;
      }

      // Check if sender matches user wallet
      const fromAddress = transfer.from;
      if (!fromAddress || fromAddress !== userWallet) {
        continue;
      }

      // Check if receiver matches deposit wallet
      const toAddress = transfer.to;
      if (toAddress !== depositWallet) {
        continue;
      }

      // Get amount (USDT has 6 decimals on Tron)
      const amountRaw = transfer.value || '0';
      const amount = Number(amountRaw) / 1e6;

      const tolerance = expectedAmount * 0.02;
      if (Math.abs(amount - expectedAmount) < tolerance) {
        console.log(`Found matching Tron transaction: ${transfer.transaction_id}, amount: ${amount}`);
        return { found: true, txHash: transfer.transaction_id, amount };
      }
    }

    return { found: false };
  } catch (error) {
    console.error('Error searching Tron transactions:', error);
    return { found: false, error: 'Failed to search blockchain' };
  }
}

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

    const { orderId } = await req.json();
    
    if (!orderId) {
      return new Response(JSON.stringify({ error: 'Order ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Auto-detecting payment for order ${orderId}`);

    // Get user's linked wallet
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('wallet_address, wallet_network')
      .eq('id', user.id)
      .single();

    if (!userProfile?.wallet_address) {
      return new Response(JSON.stringify({ 
        found: false, 
        error: 'No wallet linked to your account' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the payment order
    const { data: order, error: orderError } = await supabase
      .from('payment_orders')
      .select(`
        *,
        deposit_wallets!inner(wallet_address)
      `)
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if order is already confirmed or has tx_hash
    if (order.status === 'CONFIRMED') {
      return new Response(JSON.stringify({ 
        found: true, 
        txHash: order.tx_hash,
        alreadyConfirmed: true 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (order.tx_hash) {
      return new Response(JSON.stringify({ 
        found: true, 
        txHash: order.tx_hash,
        alreadySubmitted: true 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if order is expired
    if (new Date(order.expires_at) < new Date()) {
      return new Response(JSON.stringify({ 
        found: false, 
        error: 'Order has expired' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify wallet network matches order chain
    const expectedNetwork = order.chain === 'ETHEREUM' ? 'ETHEREUM' : order.chain === 'TRON' ? 'TRON' : 'SOLANA';
    if (userProfile.wallet_network !== expectedNetwork) {
      return new Response(JSON.stringify({ 
        found: false, 
        error: `Wallet network mismatch. Expected ${expectedNetwork}` 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Search for matching transaction
    let result: DetectionResult;
    
    if (order.chain === 'ETHEREUM') {
      result = await searchEthereumTransactions(
        order.deposit_wallets.wallet_address,
        userProfile.wallet_address,
        order.amount_expected,
        order.created_at
      );
    } else if (order.chain === 'TRON') {
      result = await searchTronTransactions(
        order.deposit_wallets.wallet_address,
        userProfile.wallet_address,
        order.amount_expected,
        order.created_at
      );
    } else {
      result = await searchSolanaTransactions(
        order.deposit_wallets.wallet_address,
        userProfile.wallet_address,
        order.amount_expected,
        order.created_at
      );
    }

    console.log(`Auto-detection result for order ${orderId}:`, result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Auto-detection error:', error);
    return new Response(JSON.stringify({ 
      found: false, 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});