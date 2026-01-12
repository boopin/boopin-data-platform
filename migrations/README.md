# Database Migrations

This folder contains SQL migration scripts for the Boopin Data Platform database.

## 🚨 IMPORTANT: First Time Setup

If this is your first time setting up the database, you **MUST** run the initial schema first:

### Step 1: Run Initial Schema (Required)
```bash
# Using psql CLI
psql $DATABASE_URL -f migrations/000_initial_schema.sql

# OR using Neon Console:
# 1. Go to https://console.neon.tech
# 2. Select your project → SQL Editor
# 3. Copy and paste the contents of 000_initial_schema.sql
# 4. Click "Run"
```

### Step 2: Run Additional Migrations (If Needed)
After the initial schema is set up, run any additional migrations in order:
```bash
psql $DATABASE_URL -f migrations/001_add_multi_site_support.sql
```

## Running Migrations

### Option 1: Using Neon Console
1. Go to your Neon dashboard: https://console.neon.tech
2. Select your project
3. Go to SQL Editor
4. Copy and paste the migration SQL
5. Click "Run"

### Option 2: Using psql CLI
```bash
psql $DATABASE_URL -f migrations/000_initial_schema.sql
psql $DATABASE_URL -f migrations/001_add_multi_site_support.sql
```

### Option 3: Using Vercel Postgres CLI
```bash
vercel env pull .env.local
# Then use the connection string from .env.local
psql "<connection-string>" -f migrations/000_initial_schema.sql
```

## Migration List

- `000_initial_schema.sql` - **[RUN THIS FIRST]** Creates all core tables (sites, visitors, events, goals, etc.)
- `001_add_multi_site_support.sql` - Adds multi-site support to existing tables (only if migrating from single-site)

## Notes

- Migrations are numbered sequentially
- Always test migrations on a staging/development database first
- Backup your database before running migrations
- The first migration creates a default site and assigns all existing data to it
