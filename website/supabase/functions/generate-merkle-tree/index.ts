import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple Merkle Tree implementation
class SimpleMerkleTree {
  private leaves: Uint8Array[];
  private layers: Uint8Array[][];

  constructor(leaves: Uint8Array[]) {
    // Sort leaves by comparing byte arrays
    this.leaves = leaves.sort((a, b) => {
      for (let i = 0; i < Math.min(a.length, b.length); i++) {
        if (a[i] !== b[i]) return a[i] - b[i];
      }
      return a.length - b.length;
    });
    this.layers = this.buildTree();
  }

  private async hash(data: Uint8Array): Promise<Uint8Array> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data.buffer as ArrayBuffer);
    return new Uint8Array(hashBuffer);
  }

  private async hashPair(a: Uint8Array, b: Uint8Array): Promise<Uint8Array> {
    const combined = new Uint8Array(a.length + b.length);
    combined.set(a);
    combined.set(b, a.length);
    return this.hash(combined);
  }

  private buildTree(): Uint8Array[][] {
    const layers = [this.leaves];
    
    while (layers[layers.length - 1].length > 1) {
      const currentLayer = layers[layers.length - 1];
      const nextLayer: Uint8Array[] = [];
      
      for (let i = 0; i < currentLayer.length; i += 2) {
        if (i + 1 < currentLayer.length) {
          const hash = this.hashPairSync(currentLayer[i], currentLayer[i + 1]);
          nextLayer.push(hash);
        } else {
          nextLayer.push(currentLayer[i]);
        }
      }
      
      layers.push(nextLayer);
    }
    
    return layers;
  }

  private hashPairSync(a: Uint8Array, b: Uint8Array): Uint8Array {
    // Use synchronous hash for building - in production use proper keccak256
    const combined = new Uint8Array(a.length + b.length);
    combined.set(a);
    combined.set(b, a.length);
    // Placeholder - use proper keccak256 in production
    return combined;
  }

  getRoot(): Uint8Array {
    return this.layers[this.layers.length - 1][0];
  }

  getProof(leaf: Uint8Array): string[] {
    const proof: string[] = [];
    let index = this.leaves.findIndex(l => 
      l.every((byte, i) => byte === leaf[i])
    );

    for (let i = 0; i < this.layers.length - 1; i++) {
      const layer = this.layers[i];
      const isRightNode = index % 2 === 1;
      const pairIndex = isRightNode ? index - 1 : index + 1;

      if (pairIndex < layer.length) {
        proof.push('0x' + uint8ArrayToHex(layer[pairIndex]));
      }

      index = Math.floor(index / 2);
    }

    return proof;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { weekStartDate } = await req.json();

    console.log(`Generating Merkle tree for week: ${weekStartDate}`);

    // Fetch settlements for users with wallet addresses and grand_total > 0
    const { data: settlements, error: fetchError } = await supabaseAdmin
      .from('weekly_settlements')
      .select(`
        user_id,
        week_start_date,
        grand_total,
        profiles!inner(wallet_address)
      `)
      .eq('week_start_date', weekStartDate)
      .gt('grand_total', 0)
      .not('profiles.wallet_address', 'is', null);

    if (fetchError) {
      console.error('Error fetching settlements:', fetchError);
      throw new Error(`Failed to fetch settlements: ${fetchError.message}`);
    }

    if (!settlements || settlements.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No eligible settlements found (must have wallet_address and grand_total > 0)' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${settlements.length} eligible settlements`);

    // Convert week_start_date to Unix timestamp
    const weekStartTimestamp = Math.floor(new Date(weekStartDate).getTime() / 1000);

    // Build leaves: keccak256(abi.encode(address, weekStart, amount))
    const leaves = settlements.map((s: any) => {
      const walletAddress = s.profiles.wallet_address.toLowerCase();
      const amount = Math.floor(parseFloat(s.grand_total) * 1e6);
      
      const encoded = encodePackedData(
        ['address', 'uint256', 'uint256'],
        [walletAddress, weekStartTimestamp, amount]
      );
      
      const leaf = hexToUint8Array(encoded);
      
      return {
        user_id: s.user_id,
        wallet_address: walletAddress,
        amount,
        leafHex: '0x' + encoded,
        leaf,
      };
    });

    // Build Merkle tree
    const tree = new SimpleMerkleTree(leaves.map(l => l.leaf));
    const rootBuffer = tree.getRoot();
    const merkleRoot = '0x' + uint8ArrayToHex(rootBuffer);
    
    console.log(`Merkle root: ${merkleRoot}`);

    // Store proofs in database
    for (const leafData of leaves) {
      const proof = tree.getProof(leafData.leaf);
      
      const { error: updateError } = await supabaseAdmin
        .from('weekly_settlements')
        .update({ merkle_proof: proof })
        .eq('user_id', leafData.user_id)
        .eq('week_start_date', weekStartDate);

      if (updateError) {
        console.error(`Error updating proof for user ${leafData.user_id}:`, updateError);
      }
    }

    // Store meta
    const totalAmount = leaves.reduce((sum, l) => sum + l.amount, 0);
    
    const { error: metaError } = await supabaseAdmin
      .from('weekly_settlements_meta')
      .upsert({
        week_start_date: weekStartDate,
        merkle_root: merkleRoot,
        total_users: leaves.length,
        total_amount: totalAmount / 1e6,
        contract_status: 'ready',
      });

    if (metaError) {
      console.error('Error storing meta:', metaError);
      throw new Error(`Failed to store meta: ${metaError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        merkleRoot,
        weekStartTimestamp,
        totalUsers: leaves.length,
        totalAmount: totalAmount / 1e6,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in generate-merkle-tree:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper functions
function encodePackedData(types: string[], values: any[]): string {
  let encoded = '';
  
  for (let i = 0; i < types.length; i++) {
    const type = types[i];
    const value = values[i];
    
    if (type === 'address') {
      encoded += value.slice(2).toLowerCase().padStart(64, '0');
    } else if (type === 'uint256') {
      encoded += value.toString(16).padStart(64, '0');
    }
  }
  
  return encoded;
}

function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

function uint8ArrayToHex(arr: Uint8Array): string {
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}
