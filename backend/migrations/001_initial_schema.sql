-- ==============================================================================
-- Chatora AI — Initial Database Schema & Row Level Security (RLS)
-- Migration: 001_initial_schema.sql
-- Compatible with: Supabase PostgreSQL 15+
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TRIGGER FUNCTION FOR UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. TABLES

-- 3.1 Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    salt TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.2 Conversations Table
CREATE TABLE IF NOT EXISTS public.conversations (
    id TEXT PRIMARY KEY DEFAULT ('conv_' || extract(epoch from now())::bigint || '_' || encode(gen_random_bytes(4), 'hex')),
    title TEXT NOT NULL DEFAULT 'New Conversation',
    pinned BOOLEAN NOT NULL DEFAULT FALSE,
    -- Auth ownership IDs come from Supabase Auth and need not exist in public.users.
    user_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.3 Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
    id TEXT PRIMARY KEY DEFAULT ('msg_' || extract(epoch from now())::bigint || '_' || encode(gen_random_bytes(3), 'hex')),
    conversation_id TEXT NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'complete' CHECK (status IN ('complete', 'stopped', 'error', 'pending')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.4 Feedback Table
CREATE TABLE IF NOT EXISTS public.feedback (
    id TEXT PRIMARY KEY DEFAULT ('fb_' || extract(epoch from now())::bigint || '_' || encode(gen_random_bytes(3), 'hex')),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    category TEXT NOT NULL,
    message TEXT NOT NULL,
    ip_hash TEXT,
    -- Optional Supabase Auth identity attribution; public.users is not the auth source.
    user_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. PERFORMANCE & FOREIGN KEY INDEXES

-- Foreign key and ownership indexes
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback(user_id);

-- Composite query indexes for sorting and filtering
CREATE INDEX IF NOT EXISTS idx_conversations_user_pinned_updated 
    ON public.conversations(user_id, pinned DESC, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_convo_created 
    ON public.messages(conversation_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_feedback_created_at 
    ON public.feedback(created_at DESC);

-- 5. AUTOMATIC TIMESTAMP TRIGGERS
DROP TRIGGER IF EXISTS trg_users_updated_at ON public.users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_conversations_updated_at ON public.conversations;
CREATE TRIGGER trg_conversations_updated_at
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- Strict user-level data isolation using (select auth.uid()) to avoid per-row re-evaluation

-- Enable RLS on all public tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- 6.1 Users RLS Policies
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
CREATE POLICY "Users can read own profile"
    ON public.users
    FOR SELECT
    TO authenticated
    USING ((select auth.uid())::text = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
    ON public.users
    FOR UPDATE
    TO authenticated
    USING ((select auth.uid())::text = id)
    WITH CHECK ((select auth.uid())::text = id);

-- 6.2 Conversations RLS Policies
DROP POLICY IF EXISTS "Users can select own conversations" ON public.conversations;
CREATE POLICY "Users can select own conversations"
    ON public.conversations
    FOR SELECT
    TO authenticated
    USING ((select auth.uid())::text = user_id);

DROP POLICY IF EXISTS "Users can insert own conversations" ON public.conversations;
CREATE POLICY "Users can insert own conversations"
    ON public.conversations
    FOR INSERT
    TO authenticated
    WITH CHECK ((select auth.uid())::text = user_id);

DROP POLICY IF EXISTS "Users can update own conversations" ON public.conversations;
CREATE POLICY "Users can update own conversations"
    ON public.conversations
    FOR UPDATE
    TO authenticated
    USING ((select auth.uid())::text = user_id)
    WITH CHECK ((select auth.uid())::text = user_id);

DROP POLICY IF EXISTS "Users can delete own conversations" ON public.conversations;
CREATE POLICY "Users can delete own conversations"
    ON public.conversations
    FOR DELETE
    TO authenticated
    USING ((select auth.uid())::text = user_id);

-- 6.3 Messages RLS Policies
DROP POLICY IF EXISTS "Users can select messages in their conversations" ON public.messages;
CREATE POLICY "Users can select messages in their conversations"
    ON public.messages
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations c 
            WHERE c.id = messages.conversation_id 
            AND c.user_id = (select auth.uid())::text
        )
    );

DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON public.messages;
CREATE POLICY "Users can insert messages in their conversations"
    ON public.messages
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.conversations c 
            WHERE c.id = messages.conversation_id 
            AND c.user_id = (select auth.uid())::text
        )
    );

DROP POLICY IF EXISTS "Users can update messages in their conversations" ON public.messages;
CREATE POLICY "Users can update messages in their conversations"
    ON public.messages
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations c 
            WHERE c.id = messages.conversation_id 
            AND c.user_id = (select auth.uid())::text
        )
    );

DROP POLICY IF EXISTS "Users can delete messages in their conversations" ON public.messages;
CREATE POLICY "Users can delete messages in their conversations"
    ON public.messages
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations c 
            WHERE c.id = messages.conversation_id 
            AND c.user_id = (select auth.uid())::text
        )
    );

-- 6.4 Feedback RLS Policies
-- Anyone (authenticated or guest/anon) can submit feedback
DROP POLICY IF EXISTS "Anyone can submit feedback" ON public.feedback;
CREATE POLICY "Anyone can submit feedback"
    ON public.feedback
    FOR INSERT
    TO authenticated, anon
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own feedback submissions" ON public.feedback;
CREATE POLICY "Users can view own feedback submissions"
    ON public.feedback
    FOR SELECT
    TO authenticated
    USING ((select auth.uid())::text = user_id);

-- 7. ROLE PERMISSIONS
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT ON public.feedback TO anon;

