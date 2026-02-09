import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';
import { verifyHmacRequest } from '../_shared/hmac-auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * F2Pool API Adapter
 * Connects to F2Pool's v2 API and normalizes data for our schema
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
    
    console.log(`F2Pool API Request: ${endpoint}`, { body });

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
      console.error(`F2Pool API Error: ${response.status}`, errorText);
      throw new Error(`F2Pool API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // Check for F2Pool API error format
    if (data.code && data.msg) {
      console.error('F2Pool API returned error:', data);
      throw new Error(`F2Pool API error: ${data.msg}`);
    }

    return data;
  }

  /**
   * Fetch account statistics (hashrate and balance)
   */
  async fetchAccountStats(currency: string = 'bitcoin') {
    console.log(`Fetching account stats for ${this.accountName}`);

    // Fetch hashrate info
    const hashrateData = await this.makeRequest('/hash_rate/info', {
      mining_user_name: this.accountName,
      currency,
    });

    // Fetch balance info
    const balanceData = await this.makeRequest('/assets/balance', {
      mining_user_name: this.accountName,
      currency,
      calculate_estimated_income: true,
    });

    const info = hashrateData.info || {};
    const balanceInfo = balanceData.balance_info || {};

    return {
      current_hashrate_hs: this.normalizeHashrate(info.hash_rate || 0),
      avg_24h_hashrate_hs: this.normalizeHashrate(info.h24_hash_rate || 0),
      unpaid_balance_btc: parseFloat(balanceInfo.balance || 0),
      estimated_daily_income: parseFloat(balanceInfo.estimated_income || 0),
      worker_count: 0, // Will be updated from worker list
      active_worker_count: 0,
      payout_coin: currency.toUpperCase(),
      raw_payload: {
        hashrate: hashrateData,
        balance: balanceData,
      },
    };
  }

  /**
   * Fetch workers list
   */
  async fetchWorkers(currency: string = 'bitcoin') {
    console.log(`Fetching workers for ${this.accountName}`);

    const data = await this.makeRequest('/hash_rate/worker/list', {
      mining_user_name: this.accountName,
      currency,
    });

    const workers = data.workers || [];

    return workers.map((worker: any) => ({
      worker_name: worker.hash_rate_info?.name || 'unknown',
      current_hashrate_hs: this.normalizeHashrate(worker.hash_rate_info?.hash_rate || 0),
      avg_hashrate_hs: this.normalizeHashrate(worker.hash_rate_info?.h24_hash_rate || 0),
      last_share_time: worker.last_share_at ? new Date(worker.last_share_at * 1000).toISOString() : null,
      status: this.normalizeWorkerStatus(worker.status),
      raw_payload: worker,
    }));
  }

  /**
   * Fetch payout history
   */
  async fetchPayouts(currency: string = 'bitcoin', sinceTime?: Date) {
    console.log(`Fetching payouts for ${this.accountName}`);

    const endTime = Math.floor(Date.now() / 1000);
    const startTime = sinceTime 
      ? Math.floor(sinceTime.getTime() / 1000)
      : endTime - (30 * 24 * 60 * 60); // Default: last 30 days

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
      .map((tx: any) => {
        const payout = tx.payout_extra;
        return {
          payout_time: new Date(payout.paid_time * 1000).toISOString(),
          amount_btc: parseFloat(payout.value || 0),
          transaction_id: payout.tx_id || null,
          coin: currency.toUpperCase(),
          raw_payload: tx,
        };
      });
  }

  /**
   * Normalize hashrate to H/s (hash per second)
   * F2Pool returns hashrate in H/s by default
   */
  private normalizeHashrate(value: number): number {
    return value || 0;
  }

  /**
   * Normalize worker status
   * F2Pool: 0 = Online, 1 = Offline, 2 = Expire
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
}

// Rate limiting map
const lastSyncTimes = new Map<string, number>();
const RATE_LIMIT_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Main Edge Function Handler
 * Syncs F2Pool data for all active configurations
 */
Deno.serve(async (req) => {
  // Handle CORS preflight
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting F2Pool sync...');

    // Rate limiting check
    const now = Date.now();
    const lastSync = lastSyncTimes.get('f2pool') || 0;
    if (now - lastSync < RATE_LIMIT_MS) {
      const waitTime = Math.ceil((RATE_LIMIT_MS - (now - lastSync)) / 1000 / 60);
      return new Response(
        JSON.stringify({ error: `Rate limit exceeded. Wait ${waitTime} minutes.` }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    lastSyncTimes.set('f2pool', now);

    // Fetch all active F2Pool configurations
    const { data: configs, error: configError } = await supabase
      .from('mining_pool_configs')
      .select('*')
      .eq('pool_provider', 'f2pool')
      .eq('is_active', true);

    if (configError) {
      throw new Error(`Failed to fetch configs: ${configError.message}`);
    }

    if (!configs || configs.length === 0) {
      console.log('No active F2Pool configurations found');
      return new Response(
        JSON.stringify({ message: 'No active F2Pool configurations found', synced: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = [];

    // Process each configuration
    for (const config of configs) {
      const startTime = Date.now();
      console.log(`Processing F2Pool config: ${config.id} for user ${config.user_id}`);

      try {
        const adapter = new F2PoolAdapter({
          api_token: config.api_secret,
          account_name: config.subaccount || config.pool_name,
          base_url: config.base_url,
        });

        const currency = 'bitcoin'; // Default to Bitcoin, can be made configurable
        const lastSyncAt = config.last_sync_at ? new Date(config.last_sync_at) : undefined;

        // 1. Fetch and store account stats
        console.log('Fetching account stats...');
        const stats = await adapter.fetchAccountStats(currency);
        
        // 2. Fetch workers
        console.log('Fetching workers...');
        const workers = await adapter.fetchWorkers(currency);
        
        // Update worker counts in stats
        stats.worker_count = workers.length;
        stats.active_worker_count = workers.filter((w: any) => w.status === 'online').length;

        // Store stats snapshot
        const { error: statsError } = await supabase
          .from('mining_pool_stats_snapshots')
          .insert({
            pool_config_id: config.id,
            current_hashrate_hs: stats.current_hashrate_hs,
            avg_24h_hashrate_hs: stats.avg_24h_hashrate_hs,
            unpaid_balance_btc: stats.unpaid_balance_btc,
            worker_count: stats.worker_count,
            active_worker_count: stats.active_worker_count,
            payout_coin: stats.payout_coin,
            raw_payload: stats.raw_payload,
          });

        if (statsError) {
          console.error('Failed to insert stats:', statsError);
        }

        // 3. Upsert workers
        console.log(`Upserting ${workers.length} workers...`);
        for (const worker of workers) {
          const { error: workerError } = await supabase
            .from('mining_pool_workers')
            .upsert(
              {
                pool_config_id: config.id,
                worker_name: worker.worker_name,
                current_hashrate_hs: worker.current_hashrate_hs,
                avg_hashrate_hs: worker.avg_hashrate_hs,
                last_share_time: worker.last_share_time,
                status: worker.status,
                raw_payload: worker.raw_payload,
              },
              { onConflict: 'pool_config_id,worker_name' }
            );

          if (workerError) {
            console.error(`Failed to upsert worker ${worker.worker_name}:`, workerError);
          }
        }

        // 4. Fetch and store payouts
        console.log('Fetching payouts...');
        const sinceTime = lastSyncAt || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
        const payouts = await adapter.fetchPayouts(currency, sinceTime);
        
        console.log(`Inserting ${payouts.length} payouts...`);
        for (const payout of payouts) {
          // Check if payout already exists
          const { data: existing } = await supabase
            .from('mining_pool_payouts')
            .select('id')
            .eq('pool_config_id', config.id)
            .eq('payout_time', payout.payout_time)
            .eq('amount_btc', payout.amount_btc)
            .single();

          if (!existing) {
            const { error: payoutError } = await supabase
              .from('mining_pool_payouts')
              .insert({
                pool_config_id: config.id,
                payout_time: payout.payout_time,
                amount_btc: payout.amount_btc,
                transaction_id: payout.transaction_id,
                coin: payout.coin,
                raw_payload: payout.raw_payload,
              });

            if (payoutError) {
              console.error('Failed to insert payout:', payoutError);
            }
          }
        }

        // Update sync status
        const { error: updateError } = await supabase
          .from('mining_pool_configs')
          .update({
            last_sync_at: new Date().toISOString(),
            last_sync_status: 'success',
            last_sync_error: null,
          })
          .eq('id', config.id);

        if (updateError) {
          console.error('Failed to update sync status:', updateError);
        }

        const duration = Date.now() - startTime;
        results.push({
          config_id: config.id,
          status: 'success',
          duration_ms: duration,
          stats: {
            workers: workers.length,
            payouts: payouts.length,
          },
        });

        console.log(`✓ Successfully synced config ${config.id} in ${duration}ms`);
      } catch (error) {
        console.error(`Failed to sync config ${config.id}:`, error);
        const errorMessage = error instanceof Error ? error.message : String(error);

        // Update error status
        await supabase
          .from('mining_pool_configs')
          .update({
            last_sync_at: new Date().toISOString(),
            last_sync_status: 'failed',
            last_sync_error: errorMessage,
          })
          .eq('id', config.id);

        results.push({
          config_id: config.id,
          status: 'failed',
          error: errorMessage,
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: 'F2Pool sync completed',
        synced: results.filter(r => r.status === 'success').length,
        failed: results.filter(r => r.status === 'failed').length,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Sync error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
