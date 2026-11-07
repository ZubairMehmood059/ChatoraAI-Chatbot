# Chatora AI Database Migrations

This directory contains version-controlled database migrations for Chatora AI.

## Migration Files

- **`001_initial_schema.sql`**: Initial database schema for Supabase PostgreSQL.
  - Tables: `users`, `conversations`, `messages`, `feedback`
  - Proper foreign keys with `ON DELETE CASCADE` and `ON DELETE SET NULL`
  - Performance indexes on all foreign keys and query patterns
  - Automatic `updated_at` triggers
  - Comprehensive Row Level Security (RLS) policies protecting user data isolation
  - Schema grants for `authenticated` and `anon` roles

## How to Apply Migrations to Supabase

### Option 1: Supabase Dashboard SQL Editor (Recommended for Cloud)
1. Log in to the [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your project and navigate to **SQL Editor** in the left sidebar.
3. Open `001_initial_schema.sql` and paste the contents into a new query window.
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

