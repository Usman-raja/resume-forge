-- Resume Forge database (Cloudflare D1 / SQLite).
-- Paste into Cloudflare → Storage & Databases → D1 → your database → Console, and run.
-- Safe to run again.

CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY,          -- "g:<google user id>"
  email       TEXT,
  name        TEXT,
  picture     TEXT,
  created_at  TEXT NOT NULL,
  last_login  TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash  TEXT PRIMARY KEY,          -- SHA-256 of the cookie value (the raw token is never stored)
  user_id     TEXT NOT NULL,
  expires_at  INTEGER NOT NULL,          -- ms since epoch
  created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user ON sessions (user_id);

CREATE TABLE IF NOT EXISTS resumes (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  title       TEXT NOT NULL DEFAULT 'My resume',
  data        TEXT NOT NULL DEFAULT '{}',
  settings    TEXT NOT NULL DEFAULT '{}',
  is_public   INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS resumes_user ON resumes (user_id, updated_at);

-- AI allowance per person per UTC day. subject = "u:<user id>" or "ip:<salted hash>" (raw IPs are never stored).
CREATE TABLE IF NOT EXISTS ai_usage (
  subject     TEXT NOT NULL,
  day         TEXT NOT NULL,
  used        INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (subject, day)
);
CREATE INDEX IF NOT EXISTS ai_usage_day ON ai_usage (day);
