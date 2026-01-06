-- Migration: Add Multi-Site Support
-- Description: Add sites table and site_id columns to all relevant tables

-- 1. Create sites table
CREATE TABLE IF NOT EXISTS sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on domain for faster lookups
CREATE INDEX IF NOT EXISTS idx_sites_domain ON sites(domain);

-- 2. Add site_id column to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES sites(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_events_site_id ON events(site_id);

-- 3. Add site_id column to page_views table
ALTER TABLE page_views ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES sites(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_page_views_site_id ON page_views(site_id);

-- 4. Add site_id column to visitors table
ALTER TABLE visitors ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES sites(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_visitors_site_id ON visitors(site_id);

-- 5. Add site_id column to goals table
ALTER TABLE goals ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES sites(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_goals_site_id ON goals(site_id);

-- 6. Add site_id column to funnels table
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES sites(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_funnels_site_id ON funnels(site_id);

-- 7. Add site_id column to cohorts table
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES sites(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_cohorts_site_id ON cohorts(site_id);

-- 8. Add site_id column to segments table
ALTER TABLE segments ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES sites(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_segments_site_id ON segments(site_id);

-- 9. Add site_id column to api_keys table (API keys are site-specific)
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES sites(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_api_keys_site_id ON api_keys(site_id);

-- 10. Create a default site for existing data
INSERT INTO sites (id, name, domain, description)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Default Site',
  'localhost',
  'Default site created during migration'
)
ON CONFLICT (id) DO NOTHING;

-- 11. Update all existing records to use the default site
UPDATE events SET site_id = '00000000-0000-0000-0000-000000000001' WHERE site_id IS NULL;
UPDATE page_views SET site_id = '00000000-0000-0000-0000-000000000001' WHERE site_id IS NULL;
UPDATE visitors SET site_id = '00000000-0000-0000-0000-000000000001' WHERE site_id IS NULL;
UPDATE goals SET site_id = '00000000-0000-0000-0000-000000000001' WHERE site_id IS NULL;
UPDATE funnels SET site_id = '00000000-0000-0000-0000-000000000001' WHERE site_id IS NULL;
UPDATE cohorts SET site_id = '00000000-0000-0000-0000-000000000001' WHERE site_id IS NULL;
UPDATE segments SET site_id = '00000000-0000-0000-0000-000000000001' WHERE site_id IS NULL;
UPDATE api_keys SET site_id = '00000000-0000-0000-0000-000000000001' WHERE site_id IS NULL;

-- 12. Make site_id NOT NULL after backfilling (optional - uncomment if you want strict enforcement)
-- ALTER TABLE events ALTER COLUMN site_id SET NOT NULL;
-- ALTER TABLE page_views ALTER COLUMN site_id SET NOT NULL;
-- ALTER TABLE visitors ALTER COLUMN site_id SET NOT NULL;
-- ALTER TABLE goals ALTER COLUMN site_id SET NOT NULL;
-- ALTER TABLE funnels ALTER COLUMN site_id SET NOT NULL;
-- ALTER TABLE cohorts ALTER COLUMN site_id SET NOT NULL;
-- ALTER TABLE segments ALTER COLUMN site_id SET NOT NULL;
-- ALTER TABLE api_keys ALTER COLUMN site_id SET NOT NULL;
