-- Create enum for upload status
CREATE TYPE upload_status AS ENUM ('SUCCESS', 'PARTIAL', 'FAILED');

-- Create machine_bulk_uploads table
CREATE TABLE public.machine_bulk_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  total_rows INTEGER NOT NULL DEFAULT 0,
  successful_rows INTEGER NOT NULL DEFAULT 0,
  failed_rows INTEGER NOT NULL DEFAULT 0,
  status upload_status NOT NULL,
  errors_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.machine_bulk_uploads ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view all bulk uploads"
  ON public.machine_bulk_uploads
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert bulk uploads"
  ON public.machine_bulk_uploads
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster queries
CREATE INDEX idx_machine_bulk_uploads_admin_user ON public.machine_bulk_uploads(admin_user_id);
CREATE INDEX idx_machine_bulk_uploads_created_at ON public.machine_bulk_uploads(created_at DESC);