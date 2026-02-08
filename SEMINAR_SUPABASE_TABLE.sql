-- Seminar tool: full data collection (sessions, reflections, events).
-- Run this in the PILOT STUDY Supabase project (immrkllzjvhdnzesmaat).

-- 1. Seminar sessions (one row per participant; who saw tutorial, which video)
CREATE TABLE IF NOT EXISTS seminar_sessions (
  participant_name TEXT PRIMARY KEY,
  saw_tutorial BOOLEAN NOT NULL DEFAULT false,
  video_id TEXT,
  survey_verification_code TEXT,  -- e.g. 628034 (stored when they go to post-survey)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- If table already existed without survey_verification_code, add it:
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seminar_sessions' AND column_name = 'survey_verification_code') THEN
    ALTER TABLE seminar_sessions ADD COLUMN survey_verification_code TEXT;
  END IF;
END $$;

ALTER TABLE seminar_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon insert and update on seminar_sessions" ON seminar_sessions;
CREATE POLICY "Allow anon insert and update on seminar_sessions"
  ON seminar_sessions FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION seminar_sessions_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS seminar_sessions_updated_at ON seminar_sessions;
CREATE TRIGGER seminar_sessions_updated_at BEFORE UPDATE ON seminar_sessions
  FOR EACH ROW EXECUTE FUNCTION seminar_sessions_updated_at();

-- 2. Seminar reflections (reflection text, revisions, AI feedback, analysis, final submission)
CREATE TABLE IF NOT EXISTS seminar_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT,
  participant_name TEXT NOT NULL,
  video_id TEXT NOT NULL,
  language TEXT DEFAULT 'de',
  reflection_text TEXT NOT NULL,
  analysis_percentages JSONB,
  weakest_component TEXT,
  feedback_extended TEXT,
  feedback_short TEXT,
  revision_number INTEGER DEFAULT 1,
  parent_reflection_id UUID REFERENCES seminar_reflections(id),
  submitted_at TIMESTAMPTZ,  -- when user clicked Continue to Post-Survey (final submission)
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seminar_reflections_participant ON seminar_reflections(participant_name);
CREATE INDEX IF NOT EXISTS idx_seminar_reflections_video ON seminar_reflections(video_id);
CREATE INDEX IF NOT EXISTS idx_seminar_reflections_created ON seminar_reflections(created_at);

ALTER TABLE seminar_reflections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon all seminar_reflections" ON seminar_reflections FOR ALL TO anon USING (true) WITH CHECK (true);

-- 3. Seminar user events (timeline: feedback view time, concept clicks, page views, etc.)
CREATE TABLE IF NOT EXISTS seminar_user_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT,
  reflection_id UUID REFERENCES seminar_reflections(id),
  participant_name TEXT,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  timestamp_utc TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seminar_events_participant ON seminar_user_events(participant_name);
CREATE INDEX IF NOT EXISTS idx_seminar_events_type ON seminar_user_events(event_type);
CREATE INDEX IF NOT EXISTS idx_seminar_events_timestamp ON seminar_user_events(timestamp_utc);

ALTER TABLE seminar_user_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon all seminar_user_events" ON seminar_user_events FOR ALL TO anon USING (true) WITH CHECK (true);
