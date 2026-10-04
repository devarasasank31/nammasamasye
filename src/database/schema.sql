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
  attachments JSONB DEFAULT '[]',
  ai_scenario_match TEXT DEFAULT '',
  ai_confidence DECIMAL DEFAULT 0,
  ai_reason TEXT DEFAULT '',
  -- Four-line AI summary shown on the public feed (never the raw report)
  ai_context TEXT DEFAULT '',
  -- Auto-detected from the pinned coordinate (offline Bengaluru gazetteer)
  ward TEXT DEFAULT '',
  ward_number INTEGER,
  zone TEXT DEFAULT '',
  police_station TEXT DEFAULT '',
  ward_distance_km DECIMAL,
  -- Priority engine output: P1 life-safety (3d) .. P4 routine (30d)
  priority TEXT DEFAULT 'P3' CHECK (priority IN ('P1','P2','P3','P4')),
  priority_base TEXT,
  priority_score INTEGER,
  priority_reason TEXT DEFAULT '',
  sla_days INTEGER DEFAULT 21,
  -- Citizen signals from the public issue feed
  support_count INTEGER DEFAULT 0,
  flag_count INTEGER DEFAULT 0,
  cluster_key TEXT DEFAULT '',
  cluster_citizens INTEGER DEFAULT 1,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Back-fill for databases created before ward/priority existed.
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS ward TEXT DEFAULT '';
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS ward_number INTEGER;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS zone TEXT DEFAULT '';
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS police_station TEXT DEFAULT '';
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS ward_distance_km DECIMAL;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'P3';
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS priority_base TEXT;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS priority_score INTEGER;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS priority_reason TEXT DEFAULT '';
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS sla_days INTEGER DEFAULT 21;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS support_count INTEGER DEFAULT 0;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS flag_count INTEGER DEFAULT 0;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS cluster_key TEXT DEFAULT '';
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS cluster_citizens INTEGER DEFAULT 1;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS ai_context TEXT DEFAULT '';

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

-- Custom problems typed under "Something Else", with how many people used them
CREATE TABLE IF NOT EXISTS custom_problems (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text TEXT NOT NULL,
  normalized TEXT NOT NULL UNIQUE,
  language TEXT NOT NULL DEFAULT 'en',
  count INTEGER NOT NULL DEFAULT 1,
  first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
CREATE INDEX idx_custom_problems_count ON custom_problems(count DESC);

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

-- ============================================================================
-- SECURITY — Row Level Security (the database firewall)
-- ----------------------------------------------------------------------------
-- Run this whole file in the Supabase SQL editor. With RLS enabled, the
-- public anon key can no longer read or write tables it does not need, even
-- if the key leaks out of the browser bundle.
--
-- Grants below match what the current code does with the anon key (citizens
-- report anonymously, admins act through the browser). Every grant is the
-- narrowest one that keeps the app working:
--   * admin_users / audit_logs / notifications / community_clusters /
--     area_statistics / ai_interpretations / language_metadata are left with
--     no anon policy at all -> service role only.
--   * column-level UPDATE grants mean a leaked anon key cannot rewrite
--     history, only the one field each feature legitimately updates.
-- When server routes switch to getSupabaseServiceClient(), drop the anon
-- INSERT/UPDATE grants down to SELECT-only.
-- ============================================================================

-- 1. Turn RLS on for every table (deny by default)
DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename IN (
        'sessions','incidents','incident_answers','evidence','status_history',
        'admin_users','admin_notes','community_clusters','official_resources',
        'audit_logs','notifications','area_statistics','ai_interpretations',
        'language_metadata','custom_problems'
      )
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

-- 2. Revoke the wide default table grants Supabase gives to public roles
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;

-- 3. Citizens: read + file incidents (nothing else)
GRANT SELECT, INSERT ON public.incidents TO anon;
GRANT UPDATE (status) ON public.incidents TO anon;
GRANT SELECT, INSERT ON public.incident_answers TO anon;
GRANT SELECT, INSERT ON public.evidence TO anon;
GRANT SELECT, INSERT ON public.status_history TO anon;
GRANT SELECT, INSERT ON public.sessions TO anon;
GRANT UPDATE (last_active) ON public.sessions TO anon;
GRANT SELECT, INSERT ON public.admin_notes TO anon;
GRANT SELECT ON public.official_resources TO anon;

-- Shared "people also report" dictionary: everyone appends, nobody deletes
GRANT SELECT, INSERT ON public.custom_problems TO anon;
GRANT UPDATE (count, last_seen, language) ON public.custom_problems TO anon;

-- Admin resources screen runs in the browser today (see
-- src/app/admin/resources/page.tsx) until it is moved behind the service key.
GRANT UPDATE, DELETE ON public.official_resources TO anon;

-- 4. Policies (explicit, idempotent)
DROP POLICY IF EXISTS "anon select incidents" ON public.incidents;
CREATE POLICY "anon select incidents" ON public.incidents FOR SELECT USING (true);
DROP POLICY IF EXISTS "anon insert incidents" ON public.incidents;
CREATE POLICY "anon insert incidents" ON public.incidents FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "anon update incidents" ON public.incidents;
CREATE POLICY "anon update incidents" ON public.incidents FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon select answers" ON public.incident_answers;
CREATE POLICY "anon select answers" ON public.incident_answers FOR SELECT USING (true);
DROP POLICY IF EXISTS "anon insert answers" ON public.incident_answers;
CREATE POLICY "anon insert answers" ON public.incident_answers FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "anon select evidence" ON public.evidence;
CREATE POLICY "anon select evidence" ON public.evidence FOR SELECT USING (true);
DROP POLICY IF EXISTS "anon insert evidence" ON public.evidence;
CREATE POLICY "anon insert evidence" ON public.evidence FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "anon select history" ON public.status_history;
CREATE POLICY "anon select history" ON public.status_history FOR SELECT USING (true);
DROP POLICY IF EXISTS "anon insert history" ON public.status_history;
CREATE POLICY "anon insert history" ON public.status_history FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "anon select sessions" ON public.sessions;
CREATE POLICY "anon select sessions" ON public.sessions FOR SELECT USING (true);
DROP POLICY IF EXISTS "anon insert sessions" ON public.sessions;
CREATE POLICY "anon insert sessions" ON public.sessions FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "anon update sessions" ON public.sessions;
CREATE POLICY "anon update sessions" ON public.sessions FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon select notes" ON public.admin_notes;
CREATE POLICY "anon select notes" ON public.admin_notes FOR SELECT USING (true);
DROP POLICY IF EXISTS "anon insert notes" ON public.admin_notes;
CREATE POLICY "anon insert notes" ON public.admin_notes FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "anon select resources" ON public.official_resources;
CREATE POLICY "anon select resources" ON public.official_resources FOR SELECT USING (true);
DROP POLICY IF EXISTS "anon write resources" ON public.official_resources;
CREATE POLICY "anon write resources" ON public.official_resources FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon delete resources" ON public.official_resources;
CREATE POLICY "anon delete resources" ON public.official_resources FOR DELETE USING (true);

DROP POLICY IF EXISTS "anon select custom problems" ON public.custom_problems;
CREATE POLICY "anon select custom problems" ON public.custom_problems FOR SELECT USING (true);
DROP POLICY IF EXISTS "anon insert custom problems" ON public.custom_problems;
CREATE POLICY "anon insert custom problems" ON public.custom_problems FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "anon update custom problems" ON public.custom_problems;
CREATE POLICY "anon update custom problems" ON public.custom_problems FOR UPDATE USING (true) WITH CHECK (true);

-- Everything with no policy above (admin_users, audit_logs, notifications,
-- community_clusters, area_statistics, ai_interpretations, language_metadata)
-- stays reachable only through the service role key, which bypasses RLS.
