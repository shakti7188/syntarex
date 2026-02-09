import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get NFT ID from URL path or query param
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const nftIdFromPath = pathParts[pathParts.length - 1];
    const nftId = url.searchParams.get('id') || nftIdFromPath;

    if (!nftId || nftId === 'api-nft-metadata') {
      return new Response(
        JSON.stringify({ error: 'NFT ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[NFT Metadata] Fetching metadata for NFT: ${nftId}`);

    // Create Supabase client with service role for read access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch NFT record
    const { data: nft, error: nftError } = await supabase
      .from('purchase_nfts')
      .select(`
        *,
        purchase:package_purchases (
          id,
          total_price,
          payment_currency,
          transaction_hash,
          created_at,
          package:packages (
            id,
            name,
            tier,
            hashrate_ths,
            xflow_tokens,
            description
          )
        ),
        user:profiles (
          id,
          username,
          wallet_address
        )
      `)
      .eq('id', nftId)
      .single();

    if (nftError || !nft) {
      console.error('[NFT Metadata] NFT not found:', nftError);
      return new Response(
        JSON.stringify({ error: 'NFT not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const purchase = nft.purchase;
    const pkg = purchase?.package;

    // Build ERC721 standard metadata
    const metadata = {
      name: `SynteraX Mining Certificate #${nft.certificate_number}`,
      description: `Official proof of ownership for ${pkg?.name || 'Mining Package'} on SynteraX platform. This NFT serves as an immutable receipt and certificate of your investment in Bitcoin mining hashrate.`,
      image: `https://synterax.io/nft/certificate/${nft.id}.png`,
      external_url: `https://synterax.io/nft/${nft.id}`,
      animation_url: null,
      background_color: "0D0D0D",
      attributes: [
        {
          trait_type: "Package Name",
          value: pkg?.name || "Mining Package"
        },
        {
          trait_type: "Package Tier",
          value: pkg?.tier || "STANDARD"
        },
        {
          trait_type: "Hashrate (TH/s)",
          value: pkg?.hashrate_ths || 0,
          display_type: "number"
        },
        {
          trait_type: "XFLOW Tokens",
          value: pkg?.xflow_tokens || 0,
          display_type: "number"
        },
        {
          trait_type: "Price (USD)",
          value: purchase?.total_price || 0,
          display_type: "number"
        },
        {
          trait_type: "Payment Currency",
          value: purchase?.payment_currency || "USDT"
        },
        {
          trait_type: "Certificate Number",
          value: nft.certificate_number,
          display_type: "number"
        },
        {
          trait_type: "Purchase Date",
          value: purchase?.created_at,
          display_type: "date"
        },
        {
          trait_type: "Soulbound",
          value: nft.is_soulbound ? "Yes" : "No"
        },
        {
          trait_type: "Mint Status",
          value: nft.mint_status
        }
      ],
      properties: {
        purchase_id: nft.purchase_id,
        certificate_number: nft.certificate_number,
        chain: nft.chain,
        token_id: nft.token_id,
        contract_address: nft.contract_address,
        tx_hash: nft.tx_hash,
        minted_at: nft.minted_at,
        issued_at: nft.created_at
      }
    };

    console.log(`[NFT Metadata] Returning metadata for certificate #${nft.certificate_number}`);

    return new Response(
      JSON.stringify(metadata),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
        } 
      }
    );

  } catch (error) {
    console.error('[NFT Metadata] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
