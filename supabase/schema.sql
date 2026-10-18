-- Table used by app.py (log_scan, count_known_matches, /api/feedback, /api/log, /api/stats).
-- Run once in the Supabase SQL Editor.
create table if not exists public.scans (
  id                  bigint generated always as identity primary key,
  created_at          timestamptz not null default now(),
  input_type          text not null,          -- 'text', 'screenshot' or 'phone'
  input_snippet       text,
  normalized_text     text,
  verdict             text not null,          -- 'safe' | 'caution' | 'danger'
  summary             text,
  recommended_action  text,
  findings            text,                   -- JSON string written by app.py
  has_link            boolean default false,
  has_install_request boolean default false,
  model_used          text,
  language            text,
  degraded            boolean default false,
  feedback            text                    -- set by /api/feedback
);

create index if not exists scans_normalized_text_idx on public.scans (normalized_text);

-- Lock the table to the server: RLS on with no policies means the public anon key
-- cannot read or write it. app.py uses the service_role key, which bypasses RLS.
alter table public.scans enable row level security;
