-- Fix missing created_at column in verdicts table
ALTER TABLE public.verdicts ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
