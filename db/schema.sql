-- documently.in usage events. METADATA ONLY: no file names, file contents, raw IPs or full user agents.
CREATE TABLE IF NOT EXISTS events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  ts          INTEGER NOT NULL,            -- unix epoch milliseconds (server time)
  session     TEXT    NOT NULL,            -- random per-tab id, not linked to a person
  path        TEXT,                        -- page path, e.g. /compress-pdf/to-100kb/
  tool        TEXT    NOT NULL,            -- tool slug
  preset      TEXT,                        -- preset slug, if any
  action      TEXT    NOT NULL CHECK (action IN ('view','start','success','error','download')),
  in_bytes    INTEGER,
  out_bytes   INTEGER,
  count       INTEGER,                     -- pages or files processed
  duration_ms INTEGER,
  error       TEXT,                        -- short error code/message, no file names
  device      TEXT,                        -- mobile | tablet | desktop | bot | unknown
  browser     TEXT,                        -- browser family only
  country     TEXT,                        -- ISO-3166 alpha-2 from Cloudflare
  referrer    TEXT                         -- referrer host only
);

CREATE INDEX IF NOT EXISTS idx_events_ts ON events (ts);
CREATE INDEX IF NOT EXISTS idx_events_tool_ts ON events (tool, ts);
CREATE INDEX IF NOT EXISTS idx_events_session_ts ON events (session, ts);
