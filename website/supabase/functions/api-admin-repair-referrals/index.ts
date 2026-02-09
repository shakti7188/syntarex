import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateAdminAuth } from '../_shared/admin-auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrphanedUser {
  id: string;
  email: string;
  full_name: string | null;
  sponsor_id: string;
  binary_position: string | null;
}

interface RepairResult {
  userId: string;
  email: string;
  status: 'repaired' | 'failed';
  referralsCreated?: number;
  error?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate admin authorization
    const auth = await validateAdminAuth(req);
    if (!auth.authorized) {
      return new Response(JSON.stringify({ error: auth.error!.message }), {
        status: auth.error!.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json().catch(() => ({}));
    const dryRun = body.dryRun === true;

    console.log(`=== Referral Repair ${dryRun ? '(DRY RUN)' : ''} Started ===`);

    // Find profiles with sponsor_id but no referral records
    const { data: profilesWithSponsors, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name, sponsor_id, binary_position')
      .not('sponsor_id', 'is', null);

    if (profileError) {
      throw new Error(`Failed to fetch profiles: ${profileError.message}`);
    }

    console.log(`Found ${profilesWithSponsors?.length || 0} profiles with sponsors`);

    // Find which profiles have referral records
    const { data: existingReferrals, error: refError } = await supabase
      .from('referrals')
      .select('referee_id')
      .in('referee_id', profilesWithSponsors?.map(p => p.id) || []);

    if (refError) {
      throw new Error(`Failed to fetch referrals: ${refError.message}`);
    }

    const usersWithReferrals = new Set(existingReferrals?.map(r => r.referee_id) || []);
    
    // Identify orphaned users (have sponsor but no referral records)
    const orphanedUsers: OrphanedUser[] = (profilesWithSponsors || [])
      .filter(p => !usersWithReferrals.has(p.id) && p.sponsor_id)
      .map(p => ({
        id: p.id,
        email: p.email,
        full_name: p.full_name,
        sponsor_id: p.sponsor_id!,
        binary_position: p.binary_position,
      }));

    console.log(`Found ${orphanedUsers.length} orphaned users needing repair`);

    if (orphanedUsers.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No orphaned users found. Referral system is healthy.',
          orphanedCount: 0,
          repaired: [],
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (dryRun) {
      return new Response(
        JSON.stringify({
          success: true,
          message: `Dry run complete. Found ${orphanedUsers.length} users that would be repaired.`,
          dryRun: true,
          orphanedCount: orphanedUsers.length,
          orphanedUsers: orphanedUsers.map(u => ({
            id: u.id,
            email: u.email,
            full_name: u.full_name,
            sponsor_id: u.sponsor_id,
            binary_position: u.binary_position,
          })),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Repair each orphaned user
    const repairResults: RepairResult[] = [];

    for (const user of orphanedUsers) {
      try {
        console.log(`Repairing referral chain for ${user.email}...`);

        // Call the create_referral_chain function
        const { error: rpcError } = await supabase.rpc('create_referral_chain', {
          p_referee_id: user.id,
          p_sponsor_id: user.sponsor_id,
          p_binary_position: user.binary_position || null,
        });

        if (rpcError) {
          throw new Error(rpcError.message);
        }

        // Count how many referral records were created
        const { count } = await supabase
          .from('referrals')
          .select('*', { count: 'exact', head: true })
          .eq('referee_id', user.id);

        repairResults.push({
          userId: user.id,
          email: user.email,
          status: 'repaired',
          referralsCreated: count || 0,
        });

        console.log(`✓ Repaired ${user.email} - ${count} referral records created`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        repairResults.push({
          userId: user.id,
          email: user.email,
          status: 'failed',
          error: errorMessage,
        });
        console.error(`✗ Failed to repair ${user.email}: ${errorMessage}`);
      }
    }

    const successCount = repairResults.filter(r => r.status === 'repaired').length;
    const failCount = repairResults.filter(r => r.status === 'failed').length;

    console.log(`=== Referral Repair Complete ===`);
    console.log(`Repaired: ${successCount}, Failed: ${failCount}`);

    // Log the repair operation
    await supabase.from('security_audit_logs').insert({
      user_id: auth.user!.id,
      operation: 'REFERRAL_REPAIR',
      resource_type: 'referrals',
      status: 'success',
      metadata: {
        orphanedCount: orphanedUsers.length,
        repaired: successCount,
        failed: failCount,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Repair complete. ${successCount} users repaired, ${failCount} failed.`,
        orphanedCount: orphanedUsers.length,
        repairedCount: successCount,
        failedCount: failCount,
        results: repairResults,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
