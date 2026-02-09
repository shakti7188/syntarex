import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TeamMember {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  rank: string | null;
  level?: number;
  binary_position?: "left" | "right" | null;
  is_active?: boolean;
  left_volume?: number;
  right_volume?: number;
  total_left_members?: number;
  total_right_members?: number;
  username?: string;
  sponsor_name?: string | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== get-network-tree: Starting request ===');
    
    // Extract JWT token from Authorization header
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      console.error('Missing Authorization header');
      throw new Error('Unauthorized: Missing Authorization header');
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    // Auth client uses anon key to verify the user's token
    const authClient = createClient(
      supabaseUrl ?? '',
      supabaseAnonKey ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
        auth: {
          persistSession: false,
        },
      }
    );
    
    // Data client uses service role to bypass RLS for fetching referral data
    const supabaseClient = createClient(
      supabaseUrl ?? '',
      supabaseServiceKey ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // Get authenticated user using auth client (anon key)
    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error(`Unauthorized: ${userError?.message || 'Invalid token'}`);
    }

    // Parse request body to check for targetUserId (for subtree navigation)
    let targetUserId = user.id;
    let requestBody: any = {};
    
    if (req.method === 'POST') {
      try {
        requestBody = await req.json();
        if (requestBody.targetUserId) {
          targetUserId = requestBody.targetUserId;
        }
      } catch (e) {
        // No body or invalid JSON, use authenticated user
      }
    }

    console.log(`Fetching network tree for target user: ${targetUserId} (authenticated: ${user.id})`);

    // Security: Limit tree depth to prevent resource exhaustion
    const MAX_TREE_DEPTH = 3;
    const MAX_REFERRALS_PER_LEVEL = 1000;

    // Get target user's profile for the current user card
    const { data: targetProfile } = await supabaseClient
      .from('profiles')
      .select('id, email, full_name, avatar_url, rank, username, sponsor_id')
      .eq('id', targetUserId)
      .single();

    // Get sponsor name if exists
    let sponsorName: string | null = null;
    if (targetProfile?.sponsor_id) {
      const { data: sponsor } = await supabaseClient
        .from('profiles')
        .select('full_name, username, email')
        .eq('id', targetProfile.sponsor_id)
        .single();
      sponsorName = sponsor?.full_name || sponsor?.username || sponsor?.email?.split('@')[0] || null;
    }

    // Get all referrals for target user (up to MAX_TREE_DEPTH levels deep)
    const { data: referrals, error: referralsError } = await supabaseClient
      .from('referrals')
      .select(`
        referee_id,
        referral_level,
        binary_position,
        is_active,
        profiles:referee_id (
          id,
          email,
          full_name,
          avatar_url,
          rank,
          username
        )
      `)
      .eq('referrer_id', targetUserId)
      .lte('referral_level', MAX_TREE_DEPTH)
      .limit(MAX_REFERRALS_PER_LEVEL)
      .order('referral_level');

    if (referralsError) {
      console.error('Error fetching referrals:', referralsError);
      throw referralsError;
    }

    // Get user's binary tree info
    const { data: binaryTree, error: binaryError } = await supabaseClient
      .from('binary_tree')
      .select('left_leg_id, right_leg_id, left_volume, right_volume, total_left_members, total_right_members')
      .eq('user_id', targetUserId)
      .single();

    if (binaryError && binaryError.code !== 'PGRST116') {
      console.error('Error fetching binary tree:', binaryError);
    }

    // Get activity status for all referrals
    const refereeIds = referrals?.map((r: any) => r.referee_id) || [];
    const { data: activityData } = await supabaseClient
      .from('user_activity')
      .select('user_id, is_active')
      .in('user_id', refereeIds);

    const activityMap = new Map(
      activityData?.map((a: any) => [a.user_id, a.is_active]) || []
    );

    // Organize referrals by level
    const directReferrals = {
      level1: [] as TeamMember[],
      level2: [] as TeamMember[],
      level3: [] as TeamMember[],
    };

    referrals?.forEach((ref: any) => {
      if (!ref.profiles) return;

      const member: TeamMember = {
        id: ref.profiles.id,
        email: ref.profiles.email,
        full_name: ref.profiles.full_name,
        avatar_url: ref.profiles.avatar_url,
        rank: ref.profiles.rank,
        username: ref.profiles.username,
        level: ref.referral_level,
        binary_position: ref.binary_position,
        is_active: activityMap.get(ref.referee_id) ?? true,
      };

      if (ref.referral_level === 1) directReferrals.level1.push(member);
      else if (ref.referral_level === 2) directReferrals.level2.push(member);
      else if (ref.referral_level === 3) directReferrals.level3.push(member);
    });

    // === RECURSIVE BINARY TREE TRAVERSAL ===
    const { data: allBinaryTrees } = await supabaseClient
      .from('binary_tree')
      .select('user_id, left_leg_id, right_leg_id, left_volume, right_volume, total_left_members, total_right_members')
      .limit(2000);

    const treeMap = new Map<string, { 
      left_leg_id: string | null; 
      right_leg_id: string | null;
      left_volume: number;
      right_volume: number;
      total_left_members: number;
      total_right_members: number;
    }>(
      allBinaryTrees?.map((t: any) => [t.user_id, { 
        left_leg_id: t.left_leg_id, 
        right_leg_id: t.right_leg_id,
        left_volume: Number(t.left_volume || 0),
        right_volume: Number(t.right_volume || 0),
        total_left_members: t.total_left_members || 0,
        total_right_members: t.total_right_members || 0,
      }]) || []
    );

    // Helper function to recursively collect all members in a leg using BFS
    const collectLegMembers = (
      startUserId: string | null,
      maxDepth: number = 10,
      maxMembers: number = 500
    ): string[] => {
      if (!startUserId) return [];
      
      const memberIds: string[] = [];
      const queue: { userId: string; depth: number }[] = [{ userId: startUserId, depth: 1 }];
      const visited = new Set<string>();
      
      while (queue.length > 0 && memberIds.length < maxMembers) {
        const item = queue.shift()!;
        const { userId, depth } = item;
        
        if (visited.has(userId) || depth > maxDepth) continue;
        visited.add(userId);
        memberIds.push(userId);
        
        const tree = treeMap.get(userId);
        if (tree) {
          if (tree.left_leg_id && !visited.has(tree.left_leg_id)) {
            queue.push({ userId: tree.left_leg_id, depth: depth + 1 });
          }
          if (tree.right_leg_id && !visited.has(tree.right_leg_id)) {
            queue.push({ userId: tree.right_leg_id, depth: depth + 1 });
          }
        }
      }
      
      return memberIds;
    };

    // Get complete recursive downline for each leg
    const leftLegStartId = binaryTree?.left_leg_id || null;
    const rightLegStartId = binaryTree?.right_leg_id || null;
    
    const leftMemberIds = collectLegMembers(leftLegStartId);
    const rightMemberIds = collectLegMembers(rightLegStartId);
    
    console.log(`Recursive binary tree: Left leg ${leftMemberIds.length} members, Right leg ${rightMemberIds.length} members`);

    // Batch fetch profiles for all members
    const allMemberIds = [...new Set([...leftMemberIds, ...rightMemberIds])];
    
    let allProfiles: any[] = [];
    if (allMemberIds.length > 0) {
      const { data: profiles } = await supabaseClient
        .from('profiles')
        .select('id, email, full_name, avatar_url, rank, username')
        .in('id', allMemberIds);
      allProfiles = profiles || [];
    }

    // Fetch activity status for all members
    let allActivity: any[] = [];
    if (allMemberIds.length > 0) {
      const { data: activity } = await supabaseClient
        .from('user_activity')
        .select('user_id, is_active')
        .in('user_id', allMemberIds);
      allActivity = activity || [];
    }

    const memberActivityMap = new Map(allActivity.map((a: any) => [a.user_id, a.is_active]));
    const profilesMap = new Map(allProfiles.map((p: any) => [p.id, p]));

    // Build left team members with BV data
    const leftTeam: TeamMember[] = [];
    for (const id of leftMemberIds) {
      const profile = profilesMap.get(id);
      const memberTree = treeMap.get(id);
      if (profile) {
        leftTeam.push({
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          rank: profile.rank,
          username: profile.username,
          binary_position: 'left',
          is_active: memberActivityMap.get(id) ?? true,
          left_volume: memberTree?.left_volume || 0,
          right_volume: memberTree?.right_volume || 0,
          total_left_members: memberTree?.total_left_members || 0,
          total_right_members: memberTree?.total_right_members || 0,
        });
      }
    }

    // Build right team members with BV data
    const rightTeam: TeamMember[] = [];
    for (const id of rightMemberIds) {
      const profile = profilesMap.get(id);
      const memberTree = treeMap.get(id);
      if (profile) {
        rightTeam.push({
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          rank: profile.rank,
          username: profile.username,
          binary_position: 'right',
          is_active: memberActivityMap.get(id) ?? true,
          left_volume: memberTree?.left_volume || 0,
          right_volume: memberTree?.right_volume || 0,
          total_left_members: memberTree?.total_left_members || 0,
          total_right_members: memberTree?.total_right_members || 0,
        });
      }
    }

    // Get direct children for the tree visualization
    const leftDirectChild = leftLegStartId ? profilesMap.get(leftLegStartId) : null;
    const rightDirectChild = rightLegStartId ? profilesMap.get(rightLegStartId) : null;

    // Add BV data to direct children
    let leftDirectChildFull = null;
    let rightDirectChildFull = null;

    if (leftDirectChild) {
      const tree = treeMap.get(leftDirectChild.id);
      leftDirectChildFull = {
        ...leftDirectChild,
        binary_position: 'left' as const,
        is_active: memberActivityMap.get(leftDirectChild.id) ?? true,
        left_volume: tree?.left_volume || 0,
        right_volume: tree?.right_volume || 0,
        total_left_members: tree?.total_left_members || 0,
        total_right_members: tree?.total_right_members || 0,
      };
    }

    if (rightDirectChild) {
      const tree = treeMap.get(rightDirectChild.id);
      rightDirectChildFull = {
        ...rightDirectChild,
        binary_position: 'right' as const,
        is_active: memberActivityMap.get(rightDirectChild.id) ?? true,
        left_volume: tree?.left_volume || 0,
        right_volume: tree?.right_volume || 0,
        total_left_members: tree?.total_left_members || 0,
        total_right_members: tree?.total_right_members || 0,
      };
    }

    const totalMembers = directReferrals.level1.length + 
                        directReferrals.level2.length + 
                        directReferrals.level3.length;

    // Build current user object with all stats
    const currentUser: TeamMember = {
      id: targetProfile?.id || targetUserId,
      email: targetProfile?.email || '',
      full_name: targetProfile?.full_name || null,
      avatar_url: targetProfile?.avatar_url || null,
      rank: targetProfile?.rank || null,
      username: targetProfile?.username || null,
      sponsor_name: sponsorName,
      left_volume: Number(binaryTree?.left_volume || 0),
      right_volume: Number(binaryTree?.right_volume || 0),
      total_left_members: binaryTree?.total_left_members || 0,
      total_right_members: binaryTree?.total_right_members || 0,
    };

    const treeSnapshot = {
      currentUser,
      directReferrals,
      binaryTeam: {
        left: leftTeam,
        right: rightTeam,
        leftVolume: Number(binaryTree?.left_volume || 0),
        rightVolume: Number(binaryTree?.right_volume || 0),
      },
      leftDirectChild: leftDirectChildFull,
      rightDirectChild: rightDirectChildFull,
      totalMembers,
      timestamp: new Date().toISOString(),
    };

    console.log(`Tree snapshot generated: ${totalMembers} total members`);

    return new Response(JSON.stringify(treeSnapshot), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in get-network-tree:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
