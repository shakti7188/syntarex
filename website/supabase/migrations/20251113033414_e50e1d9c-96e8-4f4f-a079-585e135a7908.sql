-- A. Hosting Sites / Data Centers
CREATE TYPE public.cooling_type AS ENUM ('AIR', 'HYDRO', 'IMMERSION');

CREATE TABLE public.hosting_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_name TEXT NOT NULL,
  location TEXT NOT NULL,
  latitude NUMERIC,
  longitude NUMERIC,
  total_capacity_mw NUMERIC NOT NULL DEFAULT 0,
  assigned_capacity_mw NUMERIC NOT NULL DEFAULT 0,
  available_capacity_mw NUMERIC GENERATED ALWAYS AS (total_capacity_mw - assigned_capacity_mw) STORED,
  cooling_type cooling_type NOT NULL DEFAULT 'AIR',
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add hosting_site_id to machine_inventory
ALTER TABLE public.machine_inventory 
ADD COLUMN hosting_site_id UUID REFERENCES public.hosting_sites(id);

-- B. Bulk Upload Logs (track CSV uploads)
CREATE TABLE public.bulk_upload_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_by UUID NOT NULL,
  file_name TEXT NOT NULL,
  total_rows INTEGER NOT NULL DEFAULT 0,
  successful_rows INTEGER NOT NULL DEFAULT 0,
  failed_rows INTEGER NOT NULL DEFAULT 0,
  error_details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- C. KYC Module
CREATE TYPE public.kyc_status AS ENUM ('NOT_REQUIRED', 'PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');

CREATE TABLE public.user_kyc (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  status kyc_status NOT NULL DEFAULT 'NOT_REQUIRED',
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  rejection_reason TEXT,
  total_purchase_amount NUMERIC NOT NULL DEFAULT 0,
  total_tokenization_ths NUMERIC NOT NULL DEFAULT 0,
  kyc_required_threshold_met BOOLEAN NOT NULL DEFAULT false,
  documents JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS Policies for hosting_sites
ALTER TABLE public.hosting_sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage hosting sites"
ON public.hosting_sites FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view hosting sites"
ON public.hosting_sites FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for bulk_upload_logs
ALTER TABLE public.bulk_upload_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view bulk upload logs"
ON public.bulk_upload_logs FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert bulk upload logs"
ON public.bulk_upload_logs FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for user_kyc
ALTER TABLE public.user_kyc ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all KYC records"
ON public.user_kyc FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own KYC status"
ON public.user_kyc FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own KYC"
ON public.user_kyc FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Triggers
CREATE TRIGGER update_hosting_sites_updated_at
BEFORE UPDATE ON public.hosting_sites
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_user_kyc_updated_at
BEFORE UPDATE ON public.user_kyc
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();