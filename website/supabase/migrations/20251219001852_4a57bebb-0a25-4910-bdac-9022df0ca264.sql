-- Create NFT mint status enum
CREATE TYPE nft_mint_status AS ENUM ('PENDING', 'QUEUED', 'MINTING', 'MINTED', 'FAILED', 'WALLET_REQUIRED');

-- Create purchase_nfts table to store NFT receipts for each package purchase
CREATE TABLE public.purchase_nfts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_id UUID NOT NULL UNIQUE REFERENCES public.package_purchases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  certificate_number SERIAL UNIQUE,
  token_id TEXT,
  contract_address TEXT,
  chain TEXT DEFAULT 'POLYGON',
  tx_hash TEXT,
  metadata_uri TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  mint_status nft_mint_status NOT NULL DEFAULT 'PENDING',
  mint_error TEXT,
  mint_attempts INTEGER DEFAULT 0,
  minted_at TIMESTAMP WITH TIME ZONE,
  is_soulbound BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create nft_mint_queue table for batch processing
CREATE TABLE public.nft_mint_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nft_id UUID NOT NULL REFERENCES public.purchase_nfts(id) ON DELETE CASCADE,
  priority INTEGER DEFAULT 0,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  next_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create nft_contract_config table for storing contract configuration
CREATE TABLE public.nft_contract_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chain TEXT NOT NULL UNIQUE,
  contract_address TEXT NOT NULL,
  admin_wallet TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  soulbound_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_purchase_nfts_user_id ON public.purchase_nfts(user_id);
CREATE INDEX idx_purchase_nfts_mint_status ON public.purchase_nfts(mint_status);
CREATE INDEX idx_purchase_nfts_created_at ON public.purchase_nfts(created_at DESC);
CREATE INDEX idx_nft_mint_queue_status ON public.nft_mint_queue(status);
CREATE INDEX idx_nft_mint_queue_next_attempt ON public.nft_mint_queue(next_attempt_at);

-- Enable RLS
ALTER TABLE public.purchase_nfts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nft_mint_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nft_contract_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for purchase_nfts
CREATE POLICY "Users can view their own NFTs"
  ON public.purchase_nfts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all NFTs"
  ON public.purchase_nfts
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for nft_mint_queue (admin only)
CREATE POLICY "Admins can manage mint queue"
  ON public.nft_mint_queue
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for nft_contract_config (admin only)
CREATE POLICY "Admins can manage contract config"
  ON public.nft_contract_config
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view contract config"
  ON public.nft_contract_config
  FOR SELECT
  USING (is_active = true);

-- Create trigger to update updated_at
CREATE TRIGGER update_purchase_nfts_updated_at
  BEFORE UPDATE ON public.purchase_nfts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_nft_mint_queue_updated_at
  BEFORE UPDATE ON public.nft_mint_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_nft_contract_config_updated_at
  BEFORE UPDATE ON public.nft_contract_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate NFT metadata
CREATE OR REPLACE FUNCTION public.generate_nft_metadata(p_purchase_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_purchase RECORD;
  v_package RECORD;
  v_user RECORD;
  v_metadata JSONB;
BEGIN
  -- Get purchase details
  SELECT * INTO v_purchase FROM package_purchases WHERE id = p_purchase_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Purchase not found: %', p_purchase_id;
  END IF;
  
  -- Get package details
  SELECT * INTO v_package FROM packages WHERE id = v_purchase.package_id;
  
  -- Get user details
  SELECT * INTO v_user FROM profiles WHERE id = v_purchase.user_id;
  
  -- Build metadata following ERC721 standard
  v_metadata := jsonb_build_object(
    'name', 'SynteraX Mining Package #' || p_purchase_id,
    'description', 'Official proof of ownership for ' || v_package.name || ' mining package on SynteraX platform.',
    'image', 'https://synterax.io/nft/certificate/' || p_purchase_id || '.png',
    'external_url', 'https://synterax.io/nft/' || p_purchase_id,
    'attributes', jsonb_build_array(
      jsonb_build_object('trait_type', 'Package Name', 'value', v_package.name),
      jsonb_build_object('trait_type', 'Package Tier', 'value', v_package.tier),
      jsonb_build_object('trait_type', 'Hashrate (TH/s)', 'value', v_package.hashrate_ths, 'display_type', 'number'),
      jsonb_build_object('trait_type', 'XFLOW Tokens', 'value', v_package.xflow_tokens, 'display_type', 'number'),
      jsonb_build_object('trait_type', 'Price (USD)', 'value', v_purchase.total_price, 'display_type', 'number'),
      jsonb_build_object('trait_type', 'Payment Currency', 'value', v_purchase.payment_currency),
      jsonb_build_object('trait_type', 'Purchase Date', 'value', v_purchase.created_at, 'display_type', 'date'),
      jsonb_build_object('trait_type', 'Certificate Type', 'value', 'Mining Package Receipt'),
      jsonb_build_object('trait_type', 'Soulbound', 'value', 'true')
    ),
    'properties', jsonb_build_object(
      'purchase_id', p_purchase_id,
      'package_id', v_package.id,
      'user_id', v_user.id,
      'transaction_hash', v_purchase.transaction_hash,
      'payment_order_id', v_purchase.payment_order_id,
      'issued_at', now()
    )
  );
  
  RETURN v_metadata;
END;
$$;

-- Create function to auto-create NFT record when purchase is completed
CREATE OR REPLACE FUNCTION public.create_nft_on_purchase_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_wallet_verified BOOLEAN;
  v_nft_id UUID;
  v_initial_status nft_mint_status;
BEGIN
  -- Only process when status changes to 'completed' (case-insensitive)
  IF LOWER(NEW.status) = 'completed' AND (OLD.status IS NULL OR LOWER(OLD.status) != 'completed') THEN
    -- Check if user has verified wallet
    SELECT wallet_verified INTO v_wallet_verified
    FROM profiles WHERE id = NEW.user_id;
    
    -- Set initial status based on wallet verification
    IF COALESCE(v_wallet_verified, false) THEN
      v_initial_status := 'QUEUED';
    ELSE
      v_initial_status := 'WALLET_REQUIRED';
    END IF;
    
    -- Create NFT record
    INSERT INTO purchase_nfts (
      purchase_id,
      user_id,
      metadata,
      mint_status
    ) VALUES (
      NEW.id,
      NEW.user_id,
      generate_nft_metadata(NEW.id),
      v_initial_status
    )
    RETURNING id INTO v_nft_id;
    
    -- If queued for minting, add to mint queue
    IF v_initial_status = 'QUEUED' THEN
      INSERT INTO nft_mint_queue (nft_id, priority)
      VALUES (v_nft_id, 0);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on package_purchases
CREATE TRIGGER trigger_create_nft_on_purchase_complete
  AFTER INSERT OR UPDATE ON public.package_purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.create_nft_on_purchase_complete();

-- Enable realtime for purchase_nfts
ALTER PUBLICATION supabase_realtime ADD TABLE public.purchase_nfts;

-- Insert default contract config (Polygon Amoy testnet for development)
INSERT INTO public.nft_contract_config (chain, contract_address, admin_wallet, is_active, soulbound_enabled)
VALUES ('POLYGON', '0x0000000000000000000000000000000000000000', '0x0000000000000000000000000000000000000000', true, true)
ON CONFLICT (chain) DO NOTHING;