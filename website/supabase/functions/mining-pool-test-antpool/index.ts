import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";
import { verifyHmacRequest } from '../_shared/hmac-auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-hmac-signature, x-request-timestamp',
};

// AntPool API Adapter (same as sync function)
class AntPoolAdapter {
  private apiKey: string;
  private apiSecret: string;
  private subaccount: string;
  private baseUrl: string;

  constructor(config: {
    api_key: string;
    api_secret: string;
    subaccount?: string;
    base_url?: string;
  }) {
    this.apiKey = config.api_key;
    this.apiSecret = config.api_secret;
    this.subaccount = config.subaccount || '';
    this.baseUrl = config.base_url || Deno.env.get('ANTPOOL_API_BASE_URL') || 'https://antpool.com/api';
  }

  private signRequest(params: Record<string, any>): string {
    const sortedKeys = Object.keys(params).sort();
    const queryString = sortedKeys.map(key => `${key}=${params[key]}`).join('&');
    const hmac = createHmac('sha256', this.apiSecret);
    hmac.update(queryString);
    return hmac.digest('hex');
  }

  private async makeRequest(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    try {
      const requestParams: Record<string, any> = {
        key: this.apiKey,
        nonce: Date.now().toString(),
        ...params,
      };

      const signature = this.signRequest(requestParams);
      requestParams.signature = signature;

      const queryString = new URLSearchParams(requestParams).toString();
      const url = `${this.baseUrl}${endpoint}?${queryString}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AntPool API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      
      if (data.code !== 0) {
        throw new Error(`AntPool API error: ${data.message || 'Unknown error'}`);
      }

      return data.data;
    } catch (error) {
      console.error('AntPool API request failed:', error);
      throw error;
    }
  }

  async fetchAccountStats(subaccount?: string): Promise<any> {
    const params: any = {};
    if (subaccount || this.subaccount) {
      params.subaccount = subaccount || this.subaccount;
    }

    const data = await this.makeRequest('/account.htm', params);

    const currentHashrate = this.normalizeHashrate(data.hashrate || 0, data.hashrate_unit || 'TH');
    const avg24hHashrate = this.normalizeHashrate(data.hashrate_24h || data.hashrate, data.hashrate_unit || 'TH');

    return {
      current_hashrate_hs: currentHashrate,
      avg_24h_hashrate_hs: avg24hHashrate,
      unpaid_balance_btc: parseFloat(data.unpaid || '0'),
      payout_coin: data.coin || 'BTC',
      worker_count: parseInt(data.worker_count || '0'),
      active_worker_count: parseInt(data.active_worker_count || '0'),
      raw_payload: data,
    };
  }

  async fetchWorkers(subaccount?: string): Promise<any[]> {
    const params: any = {};
    if (subaccount || this.subaccount) {
      params.subaccount = subaccount || this.subaccount;
    }

    const data = await this.makeRequest('/workers.htm', params);
    const workers = data.workers || data || [];

    return workers.map((worker: any) => ({
      worker_name: worker.worker || worker.worker_name,
      status: this.normalizeWorkerStatus(worker.status),
      current_hashrate_hs: this.normalizeHashrate(worker.hashrate || 0, worker.hashrate_unit || 'TH'),
      avg_hashrate_hs: this.normalizeHashrate(worker.hashrate_avg || worker.hashrate, worker.hashrate_unit || 'TH'),
      last_share_time: worker.last_share_time ? new Date(worker.last_share_time * 1000) : null,
      raw_payload: worker,
    }));
  }

  async fetchPayouts(subaccount?: string): Promise<any[]> {
    const params: any = {
      page: 1,
      page_size: 10,
    };
    
    if (subaccount || this.subaccount) {
      params.subaccount = subaccount || this.subaccount;
    }

    const data = await this.makeRequest('/paymentHistory.htm', params);
    const payouts = data.rows || data.payouts || data || [];

    return payouts.map((payout: any) => ({
      payout_time: new Date(payout.time * 1000 || payout.payout_time),
      amount_btc: parseFloat(payout.amount || '0'),
      coin: payout.coin || 'BTC',
      transaction_id: payout.tx_id || payout.transaction_id || null,
      raw_payload: payout,
    }));
  }

  private normalizeHashrate(value: string | number, unit: string): number {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    const multipliers: Record<string, number> = {
      'H': 1,
      'KH': 1e3,
      'MH': 1e6,
      'GH': 1e9,
      'TH': 1e12,
      'PH': 1e15,
      'EH': 1e18,
    };

    const unitUpper = unit.toUpperCase().replace('/S', '');
    const multiplier = multipliers[unitUpper] || 1e12;

    return numValue * multiplier;
  }

  private normalizeWorkerStatus(status: string | number): string {
    const statusStr = String(status).toLowerCase();
    
    if (statusStr === '1' || statusStr === 'active' || statusStr === 'online') {
      return 'online';
    }
    if (statusStr === '0' || statusStr === 'inactive' || statusStr === 'offline') {
      return 'offline';
    }
    return 'unknown';
  }
}

// Test endpoint
Deno.serve(async (req) => {
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

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { api_key, api_secret, subaccount, base_url } = await req.json();

    if (!api_key || !api_secret) {
      return new Response(
        JSON.stringify({ error: 'api_key and api_secret are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Testing AntPool connection...');

    // Initialize adapter
    const adapter = new AntPoolAdapter({
      api_key,
      api_secret,
      subaccount,
      base_url,
    });

    // Test account stats
    console.log('Fetching account stats...');
    const stats = await adapter.fetchAccountStats();

    // Test workers
    console.log('Fetching workers...');
    const workers = await adapter.fetchWorkers();

    // Test payouts
    console.log('Fetching recent payouts...');
    const payouts = await adapter.fetchPayouts();

    // Calculate summary
    const summary = {
      connection_status: 'success',
      account_stats: {
        current_hashrate_ths: (stats.current_hashrate_hs / 1e12).toFixed(2),
        avg_24h_hashrate_ths: (stats.avg_24h_hashrate_hs / 1e12).toFixed(2),
        unpaid_balance_btc: stats.unpaid_balance_btc.toFixed(8),
        payout_coin: stats.payout_coin,
      },
      workers: {
        total_count: stats.worker_count,
        active_count: stats.active_worker_count,
        sample: workers.slice(0, 3).map(w => ({
          name: w.worker_name,
          status: w.status,
          hashrate_ths: (w.current_hashrate_hs / 1e12).toFixed(2),
        })),
      },
      payouts: {
        count: payouts.length,
        latest: payouts[0] ? {
          time: payouts[0].payout_time,
          amount_btc: payouts[0].amount_btc.toFixed(8),
          transaction_id: payouts[0].transaction_id,
        } : null,
      },
    };

    return new Response(
      JSON.stringify(summary),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Test failed:', error);
    
    // Classify error type
    let errorType = 'unknown';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('403') || error.message.includes('authentication')) {
        errorType = 'authentication';
        statusCode = 401;
      } else if (error.message.includes('429') || error.message.includes('rate limit')) {
        errorType = 'rate_limit';
        statusCode = 429;
      } else if (error.message.includes('timeout') || error.message.includes('ECONNREFUSED')) {
        errorType = 'network';
        statusCode = 503;
      }
    }

    return new Response(
      JSON.stringify({ 
        connection_status: 'failed',
        error_type: errorType,
        error_message: error instanceof Error ? error.message : String(error),
      }),
      { 
        status: statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
