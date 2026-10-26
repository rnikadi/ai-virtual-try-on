-- One row per try-on request, so the demo can show history and we can
-- report latency and failure rates.
CREATE TABLE tryon_sessions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id         UUID NOT NULL REFERENCES products(id),
  status             TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'processing', 'succeeded', 'failed')),
  user_image_path    TEXT NOT NULL,
  result_image_path  TEXT,
  model              TEXT,
  prompt             TEXT,
  latency_ms         INTEGER,
  error_message      TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at       TIMESTAMPTZ
);

CREATE INDEX tryon_sessions_created_idx ON tryon_sessions (created_at DESC);
