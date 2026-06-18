-- 00_init_schema.sql
-- Comprehensive schema for OPERA

-- 1. Profiles (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    full_name TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Sessions
CREATE TABLE IF NOT EXISTS public.sessions (
    session_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    raw_mind_dump TEXT NOT NULL,
    rounds INT DEFAULT 1,
    category TEXT,
    emotional_state TEXT,
    current_status TEXT DEFAULT 'ingested',
    detected_biases JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Council Debates
CREATE TABLE IF NOT EXISTS public.council_debates (
    debate_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.sessions(session_id) ON DELETE CASCADE NOT NULL,
    persona_name TEXT NOT NULL,
    message_content TEXT NOT NULL,
    turn_sequence INT NOT NULL,
    round_number INT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Verdicts
CREATE TABLE IF NOT EXISTS public.verdicts (
    verdict_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.sessions(session_id) ON DELETE CASCADE NOT NULL,
    verdict_summary TEXT NOT NULL,
    action_steps JSONB,
    tags JSONB,
    is_committed BOOLEAN DEFAULT FALSE,
    favourite_persona TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS) - Basic Setup
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.council_debates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verdicts ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (Example)
CREATE POLICY "Users can view own profiles" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profiles" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view own sessions" ON public.sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON public.sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view debates for own sessions" ON public.council_debates FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.sessions WHERE session_id = council_debates.session_id));
CREATE POLICY "Users can view verdicts for own sessions" ON public.verdicts FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.sessions WHERE session_id = verdicts.session_id));
