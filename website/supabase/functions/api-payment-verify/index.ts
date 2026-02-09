import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Solana USDT SPL Token Mint Address (mainnet)
const SOLANA_USDT_MINT = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';

// Ethereum USDT ERC-20 Contract Address (mainnet)
const ETH_USDT_CONTRACT = '0xdAC17F958D2ee523a2206206994597C13D831ec7';

// Tron USDT TRC-20 Contract Address (mainnet)
const TRON_USDT_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';

interface VerificationResult {
  verified: boolean;
  amountReceived?: number;
  senderAddress?: string;
  error?: string;
}

// Extract sender from Solana transaction
function getSolanaTransactionSender(transaction: any): string | null {
  try {
    const accountKeys = transaction.transaction?.message?.accountKeys || [];
    if (accountKeys.length > 0) {
      const firstAccount = accountKeys[0];
      if (typeof firstAccount === 'string') {
        return firstAccount;
      } else if (firstAccount?.pubkey) {
        return firstAccount.pubkey;
      }
    }
    return null;
  } catch (error) {
    console.error('Error extracting Solana sender:', error);
    return null;
  }
}

// Verify Solana USDT transaction via Helius
async function verifySolanaTransaction(
  txSignature: string, 
  expectedWallet: string, 
  expectedAmount: number,
  expectedSender?: string
): Promise<VerificationResult> {
  const heliusApiKey = Deno.env.get('HELIUS_API_KEY');
  if (!heliusApiKey) {
    console.error('HELIUS_API_KEY not configured');
    return { verified: false, error: 'Payment verification service not configured' };
  }

  const rpcUrl = `https://mainnet.helius-rpc.com/?api-key=${heliusApiKey}`;

  try {
    console.log(`Verifying Solana transaction ${txSignature}`);
    
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getTransaction',
        params: [
          txSignature,
          { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }
        ],
      }),
    });

    const result = await response.json();
    
    if (result.error) {
      console.error('Helius RPC error:', result.error);
      return { verified: false, error: 'Transaction not found or not finalized' };
    }

    const transaction = result.result;
    if (!transaction) {
      return { verified: false, error: 'Transaction not found' };
    }

    if (transaction.meta?.err) {
      return { verified: false, error: 'Transaction failed on chain' };
    }

    const senderAddress = getSolanaTransactionSender(transaction);
    console.log(`Transaction sender: ${senderAddress}, expected: ${expectedSender}`);

    if (expectedSender && senderAddress) {
      if (senderAddress.toLowerCase() !== expectedSender.toLowerCase()) {
        return { 
          verified: false, 
          senderAddress,
          error: `Payment must be sent from your linked wallet. Expected: ${expectedSender.slice(0, 8)}..., Got: ${senderAddress.slice(0, 8)}...` 
        };
      }
    }

    const preTokenBalances = transaction.meta?.preTokenBalances || [];
    const postTokenBalances = transaction.meta?.postTokenBalances || [];

    let usdtReceived = 0;
    
    for (const postBalance of postTokenBalances) {
      if (postBalance.mint !== SOLANA_USDT_MINT) continue;
      if (postBalance.owner?.toLowerCase() !== expectedWallet.toLowerCase()) continue;

      const preBalance = preTokenBalances.find(
        (pre: any) => pre.accountIndex === postBalance.accountIndex
      );

      const preAmount = preBalance?.uiTokenAmount?.uiAmount || 0;
      const postAmount = postBalance.uiTokenAmount?.uiAmount || 0;
      const difference = postAmount - preAmount;

      if (difference > 0) {
        usdtReceived += difference;
      }
    }

    console.log(`Solana USDT received: ${usdtReceived}, expected: ${expectedAmount}`);

    const tolerance = expectedAmount * 0.01;
    if (usdtReceived >= expectedAmount - tolerance) {
      return { verified: true, amountReceived: usdtReceived, senderAddress: senderAddress || undefined };
    }

    if (usdtReceived > 0) {
      return { 
        verified: false, 
        amountReceived: usdtReceived,
        senderAddress: senderAddress || undefined,
        error: `Insufficient amount: received ${usdtReceived} USDT, expected ${expectedAmount} USDT`
      };
    }

    return { verified: false, senderAddress: senderAddress || undefined, error: 'No USDT transfer to deposit wallet found in transaction' };

  } catch (error) {
    console.error('Error verifying Solana transaction:', error);
    return { verified: false, error: 'Failed to verify transaction' };
  }
}

// Extract sender from Ethereum transaction
async function getEthereumTransactionSender(
  txHash: string, 
  alchemyApiKey: string
): Promise<string | null> {
  try {
    const rpcUrl = `https://eth-mainnet.g.alchemy.com/v2/${alchemyApiKey}`;
    
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getTransactionByHash',
        params: [txHash],
      }),
    });

    const result = await response.json();
    if (result.result?.from) {
      return result.result.from.toLowerCase();
    }
    return null;
  } catch (error) {
    console.error('Error getting Ethereum sender:', error);
    return null;
  }
}

// Verify Ethereum USDT transaction via Alchemy
async function verifyEthereumTransaction(
  txHash: string, 
  expectedWallet: string, 
  expectedAmount: number,
  expectedSender?: string
): Promise<VerificationResult> {
  const alchemyApiKey = Deno.env.get('ALCHEMY_API_KEY');
  if (!alchemyApiKey) {
    console.error('ALCHEMY_API_KEY not configured');
    return { verified: false, error: 'Ethereum payment verification service not configured' };
  }

  const rpcUrl = `https://eth-mainnet.g.alchemy.com/v2/${alchemyApiKey}`;

  try {
    console.log(`Verifying Ethereum transaction ${txHash}`);
    
    const senderAddress = await getEthereumTransactionSender(txHash, alchemyApiKey);
    console.log(`Transaction sender: ${senderAddress}, expected: ${expectedSender}`);

    if (expectedSender && senderAddress) {
      if (senderAddress.toLowerCase() !== expectedSender.toLowerCase()) {
        return { 
          verified: false, 
          senderAddress,
          error: `Payment must be sent from your linked wallet. Expected: ${expectedSender.slice(0, 8)}..., Got: ${senderAddress.slice(0, 8)}...` 
        };
      }
    }

    const receiptResponse = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getTransactionReceipt',
        params: [txHash],
      }),
    });

    const receiptResult = await receiptResponse.json();
    
    if (receiptResult.error) {
      console.error('Alchemy RPC error:', receiptResult.error);
      return { verified: false, error: 'Transaction not found or not finalized' };
    }

    const receipt = receiptResult.result;
    if (!receipt) {
      return { verified: false, error: 'Transaction not found or pending' };
    }

    if (receipt.status !== '0x1') {
      return { verified: false, senderAddress: senderAddress || undefined, error: 'Transaction failed on chain' };
    }

    const transferTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
    
    let usdtReceived = 0;
    const normalizedExpectedWallet = expectedWallet.toLowerCase();
    const normalizedUsdtContract = ETH_USDT_CONTRACT.toLowerCase();

    for (const log of receipt.logs) {
      if (log.address.toLowerCase() !== normalizedUsdtContract) continue;
      if (log.topics[0] !== transferTopic) continue;
      
      const toAddress = '0x' + log.topics[2].slice(26).toLowerCase();
      
      if (toAddress !== normalizedExpectedWallet) continue;

      const amountHex = log.data;
      const amountRaw = BigInt(amountHex);
      const amount = Number(amountRaw) / 1e6;
      
      usdtReceived += amount;
    }

    console.log(`Ethereum USDT received: ${usdtReceived}, expected: ${expectedAmount}`);

    const tolerance = expectedAmount * 0.01;
    if (usdtReceived >= expectedAmount - tolerance) {
      return { verified: true, amountReceived: usdtReceived, senderAddress: senderAddress || undefined };
    }

    if (usdtReceived > 0) {
      return { 
        verified: false, 
        amountReceived: usdtReceived,
        senderAddress: senderAddress || undefined,
        error: `Insufficient amount: received ${usdtReceived} USDT, expected ${expectedAmount} USDT`
      };
    }

    return { verified: false, senderAddress: senderAddress || undefined, error: 'No USDT transfer to deposit wallet found in transaction' };

  } catch (error) {
    console.error('Error verifying Ethereum transaction:', error);
    return { verified: false, error: 'Failed to verify transaction' };
  }
}

// Verify Tron USDT transaction via TronGrid
async function verifyTronTransaction(
  txHash: string, 
  expectedWallet: string, 
  expectedAmount: number,
  expectedSender?: string
): Promise<VerificationResult> {
  const tronGridApiKey = Deno.env.get('TRONGRID_API_KEY');
  if (!tronGridApiKey) {
    console.error('TRONGRID_API_KEY not configured');
    return { verified: false, error: 'Tron payment verification service not configured' };
  }

  try {
    console.log(`Verifying Tron transaction ${txHash}`);
    
    // Get transaction info from TronGrid
    const txResponse = await fetch(`https://api.trongrid.io/v1/transactions/${txHash}`, {
      headers: { 'TRON-PRO-API-KEY': tronGridApiKey },
    });

    if (!txResponse.ok) {
      console.error('TronGrid transaction fetch failed:', txResponse.status);
      return { verified: false, error: 'Transaction not found or not finalized' };
    }

    const txData = await txResponse.json();
    
    if (!txData.data || txData.data.length === 0) {
      return { verified: false, error: 'Transaction not found' };
    }

    const transaction = txData.data[0];
    
    // Check if transaction was successful
    if (transaction.ret?.[0]?.contractRet !== 'SUCCESS') {
      return { verified: false, error: 'Transaction failed on chain' };
    }

    // Get sender address
    const senderAddress = transaction.raw_data?.contract?.[0]?.parameter?.value?.owner_address;
    let senderBase58: string | null = null;
    
    if (senderAddress) {
      // Convert hex address to base58
      try {
        const hexToBase58Response = await fetch(`https://api.trongrid.io/wallet/getaddress`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'TRON-PRO-API-KEY': tronGridApiKey 
          },
          body: JSON.stringify({ address: senderAddress }),
        });
        const addrData = await hexToBase58Response.json();
        senderBase58 = addrData.base58 || null;
      } catch {
        console.log('Could not convert sender address to base58');
      }
    }

    console.log(`Transaction sender: ${senderBase58}, expected: ${expectedSender}`);

    if (expectedSender && senderBase58) {
      if (senderBase58 !== expectedSender) {
        return { 
          verified: false, 
          senderAddress: senderBase58,
          error: `Payment must be sent from your linked wallet. Expected: ${expectedSender.slice(0, 8)}..., Got: ${senderBase58.slice(0, 8)}...` 
        };
      }
    }

    // Get TRC20 transfer events for this transaction
    const eventsResponse = await fetch(`https://api.trongrid.io/v1/transactions/${txHash}/events`, {
      headers: { 'TRON-PRO-API-KEY': tronGridApiKey },
    });

    if (!eventsResponse.ok) {
      return { verified: false, error: 'Could not fetch transaction events' };
    }

    const eventsData = await eventsResponse.json();
    const events = eventsData.data || [];

    let usdtReceived = 0;
    const normalizedExpectedWallet = expectedWallet.toUpperCase();

    for (const event of events) {
      // Check if this is a USDT Transfer event
      if (event.contract_address !== TRON_USDT_CONTRACT) continue;
      if (event.event_name !== 'Transfer') continue;

      const toAddress = event.result?.to || event.result?._to;
      if (!toAddress) continue;

      // Compare addresses (may need to handle hex vs base58)
      const toAddressNormalized = toAddress.toUpperCase();
      if (toAddressNormalized !== normalizedExpectedWallet) continue;

      // Get amount (USDT on Tron has 6 decimals)
      const amountRaw = event.result?.value || event.result?._value || '0';
      const amount = Number(amountRaw) / 1e6;
      
      usdtReceived += amount;
    }

    console.log(`Tron USDT received: ${usdtReceived}, expected: ${expectedAmount}`);

    const tolerance = expectedAmount * 0.01;
    if (usdtReceived >= expectedAmount - tolerance) {
      return { verified: true, amountReceived: usdtReceived, senderAddress: senderBase58 || undefined };
    }

    if (usdtReceived > 0) {
      return { 
        verified: false, 
        amountReceived: usdtReceived,
        senderAddress: senderBase58 || undefined,
        error: `Insufficient amount: received ${usdtReceived} USDT, expected ${expectedAmount} USDT`
      };
    }

    return { verified: false, senderAddress: senderBase58 || undefined, error: 'No USDT transfer to deposit wallet found in transaction' };

  } catch (error) {
    console.error('Error verifying Tron transaction:', error);
    return { verified: false, error: 'Failed to verify transaction' };
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

    const serviceSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
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

    console.log(`Verifying payment order ${orderId}`);

    // Get the payment order with deposit wallet (includes sender_wallet_expected snapshot)
    const { data: order, error: orderError } = await supabase
      .from('payment_orders')
      .select(`
        *,
        deposit_wallets!inner(wallet_address),
        packages!inner(*)
      `)
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', orderError);
      return new Response(JSON.stringify({ error: 'Payment order not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (order.status === 'CONFIRMED') {
      return new Response(JSON.stringify({
        success: true,
        verified: true,
        order: order,
        message: 'Payment already confirmed',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (order.status !== 'AWAITING_CONFIRMATION') {
      return new Response(JSON.stringify({ 
        error: `Cannot verify order with status: ${order.status}` 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!order.tx_hash) {
      return new Response(JSON.stringify({ error: 'No transaction submitted for this order' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // SECURITY: Use the wallet snapshot from order creation, NOT the current profile wallet
    // This prevents wallet-swap attacks where someone changes their wallet after creating an order
    const expectedSender = order.sender_wallet_expected;
    
    if (!expectedSender) {
      console.log('Warning: Order has no sender_wallet_expected - legacy order created before security update');
      // For legacy orders, fall back to current profile wallet with warning
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('wallet_address, wallet_network')
        .eq('id', user.id)
        .single();
      
      if (userProfile?.wallet_address) {
        console.log(`Falling back to current profile wallet: ${userProfile.wallet_address}`);
      }
    } else {
      console.log(`Using order snapshot wallet for sender verification: ${expectedSender}`);
    }

    // Verify based on chain
    let verification: VerificationResult;
    
    if (order.chain === 'ETHEREUM') {
      verification = await verifyEthereumTransaction(
        order.tx_hash,
        order.deposit_wallets.wallet_address,
        order.amount_expected,
        expectedSender
      );
    } else if (order.chain === 'TRON') {
      verification = await verifyTronTransaction(
        order.tx_hash,
        order.deposit_wallets.wallet_address,
        order.amount_expected,
        expectedSender
      );
    } else {
      // Default to Solana
      verification = await verifySolanaTransaction(
        order.tx_hash,
        order.deposit_wallets.wallet_address,
        order.amount_expected,
        expectedSender
      );
    }

    if (!verification.verified) {
      await serviceSupabase
        .from('payment_orders')
        .update({
          confirmations: (order.confirmations || 0) + 1,
        })
        .eq('id', orderId);

      return new Response(JSON.stringify({
        success: false,
        verified: false,
        error: verification.error,
        amountReceived: verification.amountReceived,
        senderAddress: verification.senderAddress,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Payment verified! Create package purchase and hashrate allocation
    console.log('Payment verified, creating purchase and allocation');

    const { error: updateOrderError } = await serviceSupabase
      .from('payment_orders')
      .update({
        status: 'CONFIRMED',
        amount_received: verification.amountReceived,
        confirmed_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateOrderError) {
      console.error('Failed to update order status:', updateOrderError);
    }

    const { data: purchase, error: purchaseError } = await serviceSupabase
      .from('package_purchases')
      .insert({
        user_id: user.id,
        package_id: order.package_id,
        payment_currency: 'USDT',
        total_price: order.amount_expected,
        payment_order_id: orderId,
        transaction_hash: order.tx_hash,
        status: 'COMPLETED',
      })
      .select()
      .single();

    if (purchaseError) {
      console.error('Failed to create package purchase:', purchaseError);
      return new Response(JSON.stringify({ error: 'Failed to activate package' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: machineTypes } = await serviceSupabase
      .from('machine_types')
      .select('id')
      .eq('status', 'ACTIVE')
      .limit(1)
      .single();

    const { data: machineInventory, error: inventoryError } = await serviceSupabase
      .from('machine_inventory')
      .insert({
        user_id: user.id,
        machine_type_id: machineTypes?.id,
        purchase_id: null,
        status: 'ACTIVE',
        deployment_status: 'ACTIVATED',
        activated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (inventoryError) {
      console.error('Failed to create machine inventory:', inventoryError);
    }

    const hashrateThS = order.packages.hashrate_ths || 0;
    
    if (machineInventory && hashrateThS > 0) {
      const { error: allocationError } = await serviceSupabase
        .from('hashrate_allocations')
        .insert({
          user_id: user.id,
          machine_inventory_id: machineInventory.id,
          total_ths: hashrateThS,
          untokenized_ths: hashrateThS,
          tokenized_ths: 0,
          status: 'ACTIVE',
        });

      if (allocationError) {
        console.error('Failed to create hashrate allocation:', allocationError);
      }
    }

    if (machineInventory) {
      await serviceSupabase
        .from('payment_orders')
        .update({ allocation_id: machineInventory.id })
        .eq('id', orderId);
    }

    await serviceSupabase
      .from('deposit_wallets')
      .update({
        total_received: order.deposit_wallets.total_received + (verification.amountReceived || 0),
      })
      .eq('id', order.deposit_wallet_id);

    console.log(`Package purchase ${purchase.id} created successfully`);

    return new Response(JSON.stringify({
      success: true,
      verified: true,
      order: { ...order, status: 'CONFIRMED' },
      purchase: purchase,
      message: 'Payment verified and package activated!',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in api-payment-verify:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});