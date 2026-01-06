# Database Migrations

This folder contains SQL migration scripts for the Pulse Analytics database.

## Running Migrations

### Option 1: Using Neon Console
1. Go to your Neon dashboard: https://console.neon.tech
2. Select your project
3. Go to SQL Editor
4. Copy and paste the migration SQL
5. Click "Run"

### Option 2: Using psql CLI
```bash
psql $DATABASE_URL -f migrations/001_add_multi_site_support.sql
```

### Option 3: Using Vercel Postgres CLI
```bash
vercel env pull .env.local
# Then use the connection string from .env.local
psql "<connection-string>" -f migrations/001_add_multi_site_support.sql
```

## Migration List

- `001_add_multi_site_support.sql` - Adds sites table and site_id columns to all tables

## Notes

- Migrations are numbered sequentially
- Always test migrations on a staging/development database first
- Backup your database before running migrations
- The first migration creates a default site and assigns all existing data to it
