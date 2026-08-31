-- Namma Samasye Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Sessions (anonymous)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('kn', 'en', 'hi', 'te')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Incidents
CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id TEXT UNIQUE NOT NULL,
  session_id UUID NOT NULL REFERENCES sessions(id),
  category_id TEXT NOT NULL,
  subcategory TEXT NOT NULL,
  original_text TEXT NOT NULL,
  structured_interpretation TEXT DEFAULT '',
  ai_summary TEXT DEFAULT '',
  location TEXT DEFAULT '',
  location_area TEXT DEFAULT '',
  location_lat DECIMAL,
  location_lng DECIMAL,
  date_of_incident TIMESTAMPTZ,
  language TEXT NOT NULL DEFAULT 'en',
  status TEXT NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW','UNDER_REVIEW','MISSING_INFORMATION','ON_HOLD','PROCEEDING','INVALID','CLOSED','RESOLVED')),
  severity TEXT DEFAULT 'medium',
  is_recurring BOOLEAN DEFAULT FALSE,
  ai_scenario_match TEXT DEFAULT '',
  ai_confidence DECIMAL DEFAULT 0,
  ai_reason TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Incident Q&A
CREATE TABLE IF NOT EXISTS incident_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  question_text TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Evidence
CREATE TABLE IF NOT EXISTS evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('image','video','audio','document','link')),
  description TEXT DEFAULT '',
  url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','rejected')),
  date_added TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Status History
CREATE TABLE IF NOT EXISTS status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  admin_id TEXT DEFAULT 'system',
  admin_note TEXT DEFAULT '',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admin Users
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'VIEW_ONLY' CHECK (role IN ('SUPER_ADMIN','ADMIN','REVIEWER','VIEW_ONLY')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admin Notes
CREATE TABLE IF NOT EXISTS admin_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  admin_id TEXT NOT NULL,
  content TEXT NOT NULL,
  is_private BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Community Clusters
CREATE TABLE IF NOT EXISTS community_clusters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  area TEXT NOT NULL,
  category TEXT NOT NULL,
  incident_count INTEGER DEFAULT 0,
  evidence_count INTEGER DEFAULT 0,
  first_reported TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_reported TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified BOOLEAN DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'potential' CHECK (status IN ('potential','confirmed','dismissed'))
);

-- Official Resources
CREATE TABLE IF NOT EXISTS official_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  authority TEXT NOT NULL,
  official_url TEXT NOT NULL,
  official_phone TEXT,
  description TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  last_verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id),
  incident_id UUID REFERENCES incidents(id),
  type TEXT NOT NULL CHECK (type IN ('status_change','info_requested','info_submitted','report_proceeding','report_closed')),
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Area Statistics (materialized view target)
CREATE TABLE IF NOT EXISTS area_statistics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  area TEXT NOT NULL,
  category TEXT NOT NULL,
  period TEXT NOT NULL,
  report_count INTEGER DEFAULT 0,
  evidence_count INTEGER DEFAULT 0,
  verified_count INTEGER DEFAULT 0,
  open_count INTEGER DEFAULT 0,
  closed_count INTEGER DEFAULT 0,
  trend TEXT DEFAULT 'stable',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI Interpretations
CREATE TABLE IF NOT EXISTS ai_interpretations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  scenario TEXT NOT NULL,
  confidence DECIMAL NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Language Metadata
CREATE TABLE IF NOT EXISTS language_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  language TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  UNIQUE(language, key)
);

-- Indexes
CREATE INDEX idx_incidents_session ON incidents(session_id);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_category ON incidents(category_id);
CREATE INDEX idx_incidents_area ON incidents(location_area);
CREATE INDEX idx_incidents_created ON incidents(created_at);
CREATE INDEX idx_evidence_incident ON evidence(incident_id);
CREATE INDEX idx_status_history_incident ON status_history(incident_id);
CREATE INDEX idx_admin_notes_incident ON admin_notes(incident_id);
CREATE INDEX idx_notifications_session ON notifications(session_id);
CREATE INDEX idx_community_clusters_area ON community_clusters(area);
CREATE INDEX idx_audit_logs_admin ON audit_logs(admin_id);
CREATE INDEX idx_area_statistics_area ON area_statistics(area);

-- Function to generate incident ID
CREATE OR REPLACE FUNCTION generate_incident_id()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  result TEXT := 'NS-';
  i INTEGER;
BEGIN
  FOR i IN 1..5 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate incident_id
CREATE OR REPLACE FUNCTION set_incident_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.incident_id IS NULL OR NEW.incident_id = '' THEN
    NEW.incident_id := generate_incident_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_incident_id
  BEFORE INSERT ON incidents
  FOR EACH ROW
  EXECUTE FUNCTION set_incident_id();

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_incidents_updated_at
  BEFORE UPDATE ON incidents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
