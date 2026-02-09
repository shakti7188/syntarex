import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { verifyHmacRequest } from '../_shared/hmac-auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-hmac-signature, x-request-timestamp',
};

/**
 * F2Pool API Adapter for Testing
 */
class F2PoolAdapter {
  private apiToken: string;
  private baseUrl: string;
  private accountName: string;

  constructor(config: {
    api_token: string;
    account_name: string;
    base_url?: string;
  }) {
    this.apiToken = config.api_token;
    this.accountName = config.account_name;
    this.baseUrl = config.base_url || 'https://api.f2pool.com/v2';
  }

  /**
   * Make authenticated request to F2Pool API
   */
  private async makeRequest(endpoint: string, body: any) {
    const url = `${this.baseUrl}${endpoint}`;
    
    console.log(`F2Pool Test Request: ${endpoint}`, { accountName: this.accountName });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'F2P-API-SECRET': this.apiToken,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    // Check for F2Pool API error format
    if (data.code && data.msg) {
      throw new Error(`F2Pool API: ${data.msg}`);
    }

    return data;
  }

  /**
   * Fetch account statistics
   */
  async fetchAccountStats(currency: string = 'bitcoin') {
    const hashrateData = await this.makeRequest('/hash_rate/info', {
      mining_user_name: this.accountName,
      currency,
    });

    const balanceData = await this.makeRequest('/assets/balance', {
      mining_user_name: this.accountName,
      currency,
      calculate_estimated_income: true,
    });

    const info = hashrateData.info || {};
    const balanceInfo = balanceData.balance_info || {};

    return {
      current_hashrate_hs: info.hash_rate || 0,
      avg_24h_hashrate_hs: info.h24_hash_rate || 0,
      unpaid_balance_btc: parseFloat(balanceInfo.balance || 0),
      estimated_daily_income: parseFloat(balanceInfo.estimated_income || 0),
    };
  }

  /**
   * Fetch workers list
   */
  async fetchWorkers(currency: string = 'bitcoin') {
    const data = await this.makeRequest('/hash_rate/worker/list', {
      mining_user_name: this.accountName,
      currency,
    });

    const workers = data.workers || [];

    return workers.map((worker: any) => ({
      name: worker.hash_rate_info?.name || 'unknown',
      hashrate: worker.hash_rate_info?.hash_rate || 0,
      status: this.normalizeWorkerStatus(worker.status),
      last_share: worker.last_share_at 
        ? new Date(worker.last_share_at * 1000).toISOString() 
        : null,
    }));
  }

  /**
   * Fetch recent payouts
   */
  async fetchPayouts(currency: string = 'bitcoin') {
    const endTime = Math.floor(Date.now() / 1000);
    const startTime = endTime - (7 * 24 * 60 * 60); // Last 7 days

    const data = await this.makeRequest('/assets/transactions/list', {
      mining_user_name: this.accountName,
      currency,
      type: 'payout',
      start_time: startTime,
      end_time: endTime,
    });

    const transactions = data.transactions || [];

    return transactions
      .filter((tx: any) => tx.payout_extra)
      .slice(0, 5) // Return last 5 payouts
      .map((tx: any) => {
        const payout = tx.payout_extra;
        return {
          time: new Date(payout.paid_time * 1000).toISOString(),
          amount: parseFloat(payout.value || 0),
          tx_id: payout.tx_id || null,
        };
      });
  }

  /**
   * Normalize worker status
   */
  private normalizeWorkerStatus(status: number): string {
    switch (status) {
      case 0:
        return 'online';
      case 1:
        return 'offline';
      case 2:
        return 'expired';
      default:
        return 'unknown';
    }
  }

  /**
   * Convert H/s to TH/s for display
   */
  private formatHashrate(hs: number): string {
    const ths = hs / 1e12;
    return `${ths.toFixed(2)} TH/s`;
  }
}

/**
 * Test endpoint for F2Pool connection
 * POST /mining-pool-test-f2pool
 * Body: { api_token: string, account_name: string, currency?: string }
 */
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate using HMAC signature
    const syncToken = Deno.env.get('MINING_POOL_SYNC_TOKEN');
    
    if (!syncToken) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify HMAC signature with timestamp validation
    const authResult = await verifyHmacRequest(req, syncToken);
    
    if (!authResult.valid) {
      console.error('HMAC authentication failed:', authResult.error);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: ' + authResult.error }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const { api_token, account_name, currency = 'bitcoin', base_url } = await req.json();

    if (!api_token || !account_name) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields',
          required: ['api_token', 'account_name'],
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Testing F2Pool connection for account: ${account_name}`);

    const adapter = new F2PoolAdapter({
      api_token,
      account_name,
      base_url,
    });

    // Test 1: Fetch account stats
    console.log('Testing account stats...');
    const stats = await adapter.fetchAccountStats(currency);

    // Test 2: Fetch workers
    console.log('Testing worker list...');
    const workers = await adapter.fetchWorkers(currency);

    // Test 3: Fetch recent payouts
    console.log('Testing payouts...');
    const payouts = await adapter.fetchPayouts(currency);

    // Build summary response
    const summary = {
      status: 'connected',
      account: account_name,
      currency: currency.toUpperCase(),
      timestamp: new Date().toISOString(),
      stats: {
        current_hashrate: `${(stats.current_hashrate_hs / 1e12).toFixed(2)} TH/s`,
        avg_24h_hashrate: `${(stats.avg_24h_hashrate_hs / 1e12).toFixed(2)} TH/s`,
        unpaid_balance: `${stats.unpaid_balance_btc.toFixed(8)} BTC`,
        estimated_daily: `${stats.estimated_daily_income.toFixed(8)} BTC`,
      },
      workers: {
        total: workers.length,
        online: workers.filter((w: any) => w.status === 'online').length,
        offline: workers.filter((w: any) => w.status === 'offline').length,
        sample: workers.slice(0, 3), // Show first 3 workers
      },
      payouts: {
        last_7_days: payouts.length,
        recent: payouts,
      },
      message: '✓ F2Pool connection successful! All endpoints responding correctly.',
    };

    console.log('✓ F2Pool test successful');

    return new Response(
      JSON.stringify(summary, null, 2),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('F2Pool test failed:', error);

    // Classify error type
    let status = 500;
    let errorType = 'unknown_error';
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes('401') || errorMessage.includes('403')) {
      status = 401;
      errorType = 'authentication_failed';
    } else if (errorMessage.includes('404')) {
      status = 404;
      errorType = 'account_not_found';
    } else if (errorMessage.includes('429')) {
      status = 429;
      errorType = 'rate_limit_exceeded';
    } else if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
      status = 503;
      errorType = 'network_error';
    }

    return new Response(
      JSON.stringify({
        status: 'failed',
        error_type: errorType,
        error: errorMessage,
        timestamp: new Date().toISOString(),
        help: {
          authentication_failed: 'Check your API token is valid and has proper permissions',
          account_not_found: 'Verify the account name exists in your F2Pool account',
          rate_limit_exceeded: 'Too many requests. Please wait and try again',
          network_error: 'Connection to F2Pool failed. Check your network or try again later',
        }[errorType] || 'Please check your configuration and try again',
      }),
      { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
