-- Add server_side tracking support
-- This migration adds columns to support server-side event tracking and session stitching

-- Add server_side flag to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS server_side BOOLEAN DEFAULT false;

-- Add index for server-side events
CREATE INDEX IF NOT EXISTS idx_events_server_side ON events(server_side) WHERE server_side = true;

-- Add merged_into column to visitors for session stitching
ALTER TABLE visitors ADD COLUMN IF NOT EXISTS merged_into UUID REFERENCES visitors(id);

-- Add index for session stitching
CREATE INDEX IF NOT EXISTS idx_visitors_merged_into ON visitors(merged_into) WHERE merged_into IS NOT NULL;

-- Add device_fingerprint column to visitors for fallback identification
ALTER TABLE visitors ADD COLUMN IF NOT EXISTS device_fingerprint TEXT;

-- Add index for device fingerprint lookups
CREATE INDEX IF NOT EXISTS idx_visitors_fingerprint ON visitors(device_fingerprint) WHERE device_fingerprint IS NOT NULL;
