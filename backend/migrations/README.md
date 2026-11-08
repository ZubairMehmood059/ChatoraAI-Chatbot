# Chatora AI Database Migrations

This directory contains version-controlled database migrations for Chatora AI.

## Migration Files

- **`001_initial_schema.sql`**: Initial database schema for Supabase PostgreSQL.
  - Tables: `users`, `conversations`, `messages`, `feedback`
  - Message-to-conversation foreign key with cascading deletion
  - Performance indexes on all foreign keys and query patterns
  - Automatic `updated_at` triggers
  - Comprehensive Row Level Security (RLS) policies protecting user data isolation
  - Schema grants for `authenticated` and `anon` roles
- **`002_decouple_supabase_auth_ids.sql`**: Drops legacy optional `user_id` foreign keys to the local `users` table. Supabase Auth is the source of authenticated identities; API authorization and RLS still scope records by the verified user ID.

## How to Apply Migrations to Supabase

### Option 1: Supabase Dashboard SQL Editor (Recommended for Cloud)

1. Log in to the [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your project and navigate to **SQL Editor** in the left sidebar.
3. Apply `001_initial_schema.sql` for a new project, then apply `002_decouple_supabase_auth_ids.sql` to remove legacy user foreign keys (safe to repeat).
4. Click **Run** to execute the migration.

### Option 2: Supabase CLI

```bash
# Link your local project to Supabase
supabase link --project-ref <your-project-id>

# Apply migrations
supabase db push
```

### Option 3: Python Async Migration Runner

Run the included migration script with your configured `DATABASE_URL`:

```bash
python -m backend.app.scripts.migrate
```
