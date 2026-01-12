-- Initial Database Schema for Boopin Data Platform
-- Run this first before any other migrations

-- ================================================
-- CORE TABLES
-- ================================================

-- 1. Sites table (for multi-site support)
CREATE TABLE IF NOT EXISTS sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Visitors table
CREATE TABLE IF NOT EXISTS visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  anonymous_id TEXT NOT NULL,
  email TEXT,
  name TEXT,
  phone TEXT,
  properties JSONB DEFAULT '{}',
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  visit_count INTEGER DEFAULT 1,
  is_identified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(site_id, anonymous_id)
);

-- 3. Events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  visitor_id UUID REFERENCES visitors(id) ON DELETE CASCADE,
  session_id TEXT,
  event_type TEXT NOT NULL,
  page_url TEXT,
  page_path TEXT,
  page_title TEXT,
  referrer TEXT,
  user_agent TEXT,
  browser TEXT,
  os TEXT,
  device_type TEXT,
  ip_address TEXT,
  country TEXT,
  city TEXT,
  region TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  properties JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Page Views table (optional - for backward compatibility)
CREATE TABLE IF NOT EXISTS page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  visitor_id UUID REFERENCES visitors(id) ON DELETE CASCADE,
  page_path TEXT NOT NULL,
  page_url TEXT,
  page_title TEXT,
  referrer TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- FEATURE TABLES
-- ================================================

-- 5. Goals table
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL,
  target_value VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Funnels table
CREATE TABLE IF NOT EXISTS funnels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  steps JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Cohorts table
CREATE TABLE IF NOT EXISTS cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  rules JSONB NOT NULL DEFAULT '{}',
  visitor_count INTEGER DEFAULT 0,
  last_calculated_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Segments table
CREATE TABLE IF NOT EXISTS segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  rules JSONB NOT NULL DEFAULT '{}',
  visitor_count INTEGER DEFAULT 0,
  last_calculated_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Webhooks table
CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  secret TEXT,
  event_types JSONB,
  is_active BOOLEAN DEFAULT true,
  total_triggers INTEGER DEFAULT 0,
  last_triggered_at TIMESTAMP,
  last_status INTEGER,
  last_error TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. API Keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  key_hash TEXT UNIQUE NOT NULL,
  key_prefix VARCHAR(10) NOT NULL,
  permissions JSONB DEFAULT '{}',
  last_used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- ================================================
-- INDEXES FOR PERFORMANCE
-- ================================================

-- Sites indexes
CREATE INDEX IF NOT EXISTS idx_sites_domain ON sites(domain);

-- Visitors indexes
CREATE INDEX IF NOT EXISTS idx_visitors_site_id ON visitors(site_id);
CREATE INDEX IF NOT EXISTS idx_visitors_anonymous_id ON visitors(anonymous_id);
CREATE INDEX IF NOT EXISTS idx_visitors_email ON visitors(email);
CREATE INDEX IF NOT EXISTS idx_visitors_is_identified ON visitors(is_identified);

-- Events indexes
CREATE INDEX IF NOT EXISTS idx_events_site_id ON events(site_id);
CREATE INDEX IF NOT EXISTS idx_events_visitor_id ON events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_page_path ON events(page_path);
CREATE INDEX IF NOT EXISTS idx_events_country ON events(country);
CREATE INDEX IF NOT EXISTS idx_events_device_type ON events(device_type);
CREATE INDEX IF NOT EXISTS idx_events_browser ON events(browser);
CREATE INDEX IF NOT EXISTS idx_events_os ON events(os);

-- Page Views indexes
CREATE INDEX IF NOT EXISTS idx_page_views_site_id ON page_views(site_id);
CREATE INDEX IF NOT EXISTS idx_page_views_visitor_id ON page_views(visitor_id);
CREATE INDEX IF NOT EXISTS idx_page_views_timestamp ON page_views(timestamp);

-- Goals indexes
CREATE INDEX IF NOT EXISTS idx_goals_site_id ON goals(site_id);

-- Funnels indexes
CREATE INDEX IF NOT EXISTS idx_funnels_site_id ON funnels(site_id);

-- Cohorts indexes
CREATE INDEX IF NOT EXISTS idx_cohorts_site_id ON cohorts(site_id);

-- Segments indexes
CREATE INDEX IF NOT EXISTS idx_segments_site_id ON segments(site_id);

-- Webhooks indexes
CREATE INDEX IF NOT EXISTS idx_webhooks_site_id ON webhooks(site_id);

-- API Keys indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_site_id ON api_keys(site_id);

-- ================================================
-- DEFAULT DATA
-- ================================================

-- Insert default site (used by test tracking page)
INSERT INTO sites (id, name, domain, description)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Default Site',
  'localhost',
  'Default site for testing and development'
)
ON CONFLICT (id) DO NOTHING;

-- ================================================
-- NOTES
-- ================================================
-- This schema uses UUID for all primary keys
-- All tables support multi-site architecture via site_id foreign key
-- JSONB is used for flexible properties and rules storage
-- Timestamps use TIMESTAMPTZ for timezone awareness
-- Indexes are created for common query patterns
