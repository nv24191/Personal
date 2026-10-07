CREATE TABLE IF NOT EXISTS feedback_submissions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('suggestion', 'issue')),
  game_id TEXT,
  message TEXT NOT NULL,
  device_info TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'seen', 'working', 'resolved', 'important', 'archived')),
  admin_notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS feedback_created_at ON feedback_submissions (created_at);
CREATE INDEX IF NOT EXISTS feedback_status_created ON feedback_submissions (status, created_at);

CREATE TABLE IF NOT EXISTS feedback_rate_limits (
  client_key TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  request_count INTEGER NOT NULL
);
