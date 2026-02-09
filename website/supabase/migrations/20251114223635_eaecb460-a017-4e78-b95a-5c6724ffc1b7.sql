-- Enable full replica identity for allocation_settings table for realtime updates
ALTER TABLE public.allocation_settings REPLICA IDENTITY FULL;