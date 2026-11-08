-- Supabase Auth is the source of authenticated identities. Existing installations
-- may have created these optional user_id foreign keys from migration 001.
-- Drop them idempotently; ownership remains enforced by application checks and RLS.
DO $$
BEGIN
    ALTER TABLE public.conversations
        DROP CONSTRAINT IF EXISTS conversations_user_id_fkey;
    ALTER TABLE public.feedback
        DROP CONSTRAINT IF EXISTS feedback_user_id_fkey;
END;
$$;
