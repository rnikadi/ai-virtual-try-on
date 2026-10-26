-- Ready-made shopper photos for demos, one per kind of photo a try-on needs,
-- so a presenter can run a try-on without uploading a photo of themselves.
CREATE TABLE sample_photos (
  subject     TEXT PRIMARY KEY CHECK (subject IN ('full_body', 'face', 'head_and_shoulders', 'hand', 'room')),
  image_url   TEXT NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
