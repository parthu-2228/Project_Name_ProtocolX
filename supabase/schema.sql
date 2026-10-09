-- ==============================================================================
-- "WHAT DID I MISS?" — SUPABASE SCHEMA & ROW LEVEL SECURITY (RLS)
-- ==============================================================================
-- PRIVACY MANIFESTO:
-- This database stores ABSOLUTELY ZERO CHAT CONTENT, raw text, summaries, or tasks.
-- All chat data is stored strictly on the user's browser via IndexedDB (Dexie).
-- Supabase is strictly used for non-content preferences, profile, and anonymous telemetry.
-- ==============================================================================

-- 1. PROFILES TABLE (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- 2. USER SETTINGS TABLE (Display name, nicknames for mention detection, keyword preferences)
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    display_name TEXT DEFAULT 'Me',
    nicknames TEXT[] DEFAULT ARRAY['me', 'partha', 'ps']::TEXT[],
    priority_keywords TEXT[] DEFAULT ARRAY['urgent', 'asap', 'blocker', 'deadline', 'jaldi', 'critical', 'eod', 'bug']::TEXT[],
    theme TEXT DEFAULT 'dark',
    ai_mode_preference TEXT DEFAULT 'smart', -- 'smart' or 'quick'
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for user_settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own settings"
    ON public.user_settings
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
    ON public.user_settings
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
    ON public.user_settings
    FOR UPDATE
    USING (auth.uid() = user_id);

-- 3. ANONYMOUS USAGE STATS TABLE (Optional, zero content, zero user identifier)
-- Helps developers track adoption counts without violating user privacy
CREATE TABLE IF NOT EXISTS public.anonymous_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL, -- e.g. "summary_generated", "action_item_completed"
    processed_message_count INT DEFAULT 0, -- message count bucket only, never content
    processing_mode TEXT DEFAULT 'rules', -- 'rules' or 'ollama'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for anonymous_stats
ALTER TABLE public.anonymous_stats ENABLE ROW LEVEL SECURITY;

-- Allow anonymous or authenticated clients to insert metric events
CREATE POLICY "Anyone can insert anonymous metric events"
    ON public.anonymous_stats
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- No public select policy: events cannot be queried by unauthorized clients
CREATE POLICY "Admins only can read stats"
    ON public.anonymous_stats
    FOR SELECT
    TO service_role
    USING (true);

-- 4. AUTOMATIC PROFILE & SETTINGS TRIGGER ON USER SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));

    INSERT INTO public.user_settings (user_id, display_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'));

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
