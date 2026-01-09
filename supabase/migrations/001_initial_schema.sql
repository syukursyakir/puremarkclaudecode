-- ================================================================
-- PureMark Database Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard
-- ================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- USERS TABLE (extends Supabase auth.users)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    diet TEXT CHECK (diet IN ('halal', 'kosher', NULL)),
    allergies TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can only read/write their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- ================================================================
-- SCAN HISTORY TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS public.scan_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_name TEXT,
    scan_timestamp TIMESTAMPTZ DEFAULT NOW(),
    detected_language TEXT,

    -- Ingredients data (JSONB for flexibility)
    ingredients JSONB DEFAULT '[]',
    analysis JSONB DEFAULT '[]',

    -- Verdict
    diet_verdict JSONB,
    allergens TEXT[] DEFAULT '{}',

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.scan_history ENABLE ROW LEVEL SECURITY;

-- Users can only access their own scan history
CREATE POLICY "Users can view own scans" ON public.scan_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scans" ON public.scan_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own scans" ON public.scan_history
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can update own scans" ON public.scan_history
    FOR UPDATE USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS scan_history_user_id_idx ON public.scan_history(user_id);
CREATE INDEX IF NOT EXISTS scan_history_timestamp_idx ON public.scan_history(scan_timestamp DESC);

-- ================================================================
-- FEEDBACK TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    category TEXT NOT NULL CHECK (category IN ('bug', 'feature', 'ui_ux', 'general')),
    message TEXT NOT NULL,
    images TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Users can insert feedback (even anonymous)
CREATE POLICY "Anyone can submit feedback" ON public.feedback
    FOR INSERT WITH CHECK (true);

-- Users can view their own feedback
CREATE POLICY "Users can view own feedback" ON public.feedback
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- ================================================================
-- ANONYMOUS PROFILES (for users who haven't signed up)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.anonymous_profiles (
    device_id TEXT PRIMARY KEY,
    diet TEXT CHECK (diet IN ('halal', 'kosher', NULL)),
    allergies TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.anonymous_profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can read/write anonymous profiles (identified by device_id)
CREATE POLICY "Anyone can manage anonymous profiles" ON public.anonymous_profiles
    FOR ALL USING (true);

-- ================================================================
-- FUNCTION: Auto-create profile on user signup
-- ================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, diet, allergies)
    VALUES (NEW.id, NULL, '{}');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ================================================================
-- FUNCTION: Update timestamp on profile change
-- ================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Trigger for anonymous_profiles
DROP TRIGGER IF EXISTS anonymous_profiles_updated_at ON public.anonymous_profiles;
CREATE TRIGGER anonymous_profiles_updated_at
    BEFORE UPDATE ON public.anonymous_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
