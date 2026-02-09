import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";
import { verifyHmacRequest } from '../_shared/hmac-auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// AntPool API Adapter
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

  /**
   * Generate HMAC-SHA256 signature for AntPool API requests
   */
  private signRequest(params: Record<string, any>): string {
    // Sort parameters alphabetically
    const sortedKeys = Object.keys(params).sort();
    const queryString = sortedKeys.map(key => `${key}=${params[key]}`).join('&');
    
    // Generate HMAC-SHA256 signature
    const hmac = createHmac('sha256', this.apiSecret);
    hmac.update(queryString);
    return hmac.digest('hex');
  }

  /**
   * Make authenticated request to AntPool API
   */
  private async makeRequest(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    try {
      // Add required parameters
      const requestParams: Record<string, any> = {
        key: this.apiKey,
        nonce: Date.now().toString(),
        ...params,
      };

      // Generate signature
      const signature = this.signRequest(requestParams);
      requestParams.signature = signature;

      // Build query string
      const queryString = new URLSearchParams(requestParams).toString();
      const url = `${this.baseUrl}${endpoint}?${queryString}`;

      console.log(`Making request to AntPool: ${endpoint}`);

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
      
      // AntPool typically returns: { code: 0, message: 'success', data: {...} }
      if (data.code !== 0) {
        throw new Error(`AntPool API error: ${data.message || 'Unknown error'}`);
      }

      return data.data;
    } catch (error) {
      console.error('AntPool API request failed:', error);
      throw error;
    }
  }

  /**
   * Fetch account statistics from AntPool
   */
  async fetchAccountStats(subaccount?: string): Promise<{
    current_hashrate_hs: number;
    avg_24h_hashrate_hs: number;
    unpaid_balance_btc: number;
    payout_coin: string;
    worker_count: number;
    active_worker_count: number;
    raw_payload: any;
  }> {
    const params: any = {};
    if (subaccount || this.subaccount) {
      params.subaccount = subaccount || this.subaccount;
    }

    const data = await this.makeRequest('/account.htm', params);

    // Normalize hashrate to H/s (AntPool typically returns in TH/s or similar)
    // Assuming data structure like: { hashrate: "100", hashrate_24h: "95", unpaid: "0.00123", ... }
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

  /**
   * Fetch worker list from AntPool
   */
  async fetchWorkers(subaccount?: string): Promise<Array<{
    worker_name: string;
    status: string;
    current_hashrate_hs: number;
    avg_hashrate_hs: number;
    last_share_time: Date | null;
    raw_payload: any;
  }>> {
    const params: any = {};
    if (subaccount || this.subaccount) {
      params.subaccount = subaccount || this.subaccount;
    }

    const data = await this.makeRequest('/workers.htm', params);

    // AntPool returns workers array
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

  /**
   * Fetch payout history from AntPool
   */
  async fetchPayouts(subaccount?: string, sinceTime?: Date): Promise<Array<{
    payout_time: Date;
    amount_btc: number;
    coin: string;
    transaction_id: string | null;
    raw_payload: any;
  }>> {
    const params: any = {
      page: 1,
      page_size: 100,
    };
    
    if (subaccount || this.subaccount) {
      params.subaccount = subaccount || this.subaccount;
    }

    const data = await this.makeRequest('/paymentHistory.htm', params);

    // AntPool returns payouts array
    const payouts = data.rows || data.payouts || data || [];

    return payouts
      .map((payout: any) => ({
        payout_time: new Date(payout.time * 1000 || payout.payout_time),
        amount_btc: parseFloat(payout.amount || '0'),
        coin: payout.coin || 'BTC',
        transaction_id: payout.tx_id || payout.transaction_id || null,
        raw_payload: payout,
      }))
      .filter((payout: any) => {
        if (!sinceTime) return true;
        return payout.payout_time > sinceTime;
      });
  }

  /**
   * Normalize hashrate to H/s (base unit)
   */
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
    const multiplier = multipliers[unitUpper] || 1e12; // Default to TH/s

    return numValue * multiplier;
  }

  /**
   * Normalize worker status to unified format
   */
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

// Rate limiting map
const lastSyncTimes = new Map<string, number>();
const RATE_LIMIT_MS = 10 * 60 * 1000; // 10 minutes

// Sync service function
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate sync request using HMAC signature
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    console.log('Starting AntPool sync job...');

    // Rate limiting check
    const now = Date.now();
    const lastSync = lastSyncTimes.get('antpool') || 0;
    if (now - lastSync < RATE_LIMIT_MS) {
      const waitTime = Math.ceil((RATE_LIMIT_MS - (now - lastSync)) / 1000 / 60);
      return new Response(
        JSON.stringify({ error: `Rate limit exceeded. Wait ${waitTime} minutes.` }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    lastSyncTimes.set('antpool', now);

    // Fetch all active AntPool configurations
    const { data: configs, error: configError } = await supabaseClient
      .from('mining_pool_configs')
      .select('*')
      .eq('pool_provider', 'ANTPOOL')
      .eq('is_active', true);

    if (configError) {
      throw configError;
    }

    console.log(`Found ${configs?.length || 0} active AntPool configurations`);

    const results = [];

    for (const config of configs || []) {
      try {
        console.log(`Syncing pool config: ${config.id} (${config.pool_name})`);

        // Update sync status to IN_PROGRESS
        await supabaseClient
          .from('mining_pool_configs')
          .update({ last_sync_status: 'IN_PROGRESS' })
          .eq('id', config.id);

        // Initialize adapter
        const adapter = new AntPoolAdapter({
          api_key: config.api_key,
          api_secret: config.api_secret,
          subaccount: config.subaccount,
          base_url: config.base_url,
        });

        // Fetch and store account stats
        const stats = await adapter.fetchAccountStats();
        const { error: statsError } = await supabaseClient
          .from('mining_pool_stats_snapshots')
          .insert({
            pool_config_id: config.id,
            ...stats,
          });

        if (statsError) {
          console.error('Failed to insert stats:', statsError);
        }

        // Fetch and upsert workers
        const workers = await adapter.fetchWorkers();
        for (const worker of workers) {
          const { error: workerError } = await supabaseClient
            .from('mining_pool_workers')
            .upsert({
              pool_config_id: config.id,
              ...worker,
            }, {
              onConflict: 'pool_config_id,worker_name',
            });

          if (workerError) {
            console.error('Failed to upsert worker:', workerError);
          }
        }

        // Fetch and insert new payouts
        const lastPayout = await supabaseClient
          .from('mining_pool_payouts')
          .select('payout_time')
          .eq('pool_config_id', config.id)
          .order('payout_time', { ascending: false })
          .limit(1)
          .single();

        const sinceTime = lastPayout.data?.payout_time ? new Date(lastPayout.data.payout_time) : undefined;
        const payouts = await adapter.fetchPayouts(undefined, sinceTime);

        for (const payout of payouts) {
          const { error: payoutError } = await supabaseClient
            .from('mining_pool_payouts')
            .insert({
              pool_config_id: config.id,
              ...payout,
            });

          if (payoutError && !payoutError.message.includes('duplicate')) {
            console.error('Failed to insert payout:', payoutError);
          }
        }

        // Update sync status to SUCCESS
        await supabaseClient
          .from('mining_pool_configs')
          .update({
            last_sync_at: new Date().toISOString(),
            last_sync_status: 'SUCCESS',
            last_sync_error: null,
          })
          .eq('id', config.id);

        results.push({
          config_id: config.id,
          pool_name: config.pool_name,
          status: 'success',
          stats_synced: true,
          workers_synced: workers.length,
          payouts_synced: payouts.length,
        });

      } catch (error) {
        console.error(`Failed to sync pool config ${config.id}:`, error);

        // Update sync status to ERROR
        await supabaseClient
          .from('mining_pool_configs')
          .update({
            last_sync_at: new Date().toISOString(),
            last_sync_status: 'ERROR',
            last_sync_error: error instanceof Error ? error.message : String(error),
          })
          .eq('id', config.id);

        results.push({
          config_id: config.id,
          pool_name: config.pool_name,
          status: 'error',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        synced: results.length,
        results,
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Sync job failed:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : String(error),
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
