-- Add action_steps and tags columns to verdicts table
ALTER TABLE public.verdicts ADD COLUMN IF NOT EXISTS action_steps JSONB;
ALTER TABLE public.verdicts ADD COLUMN IF NOT EXISTS tags JSONB;

-- Backfill or set constraints if needed
-- Assuming action_steps should be NOT NULL if the code expects it
-- ALTER TABLE public.verdicts ALTER COLUMN action_steps SET NOT NULL;
