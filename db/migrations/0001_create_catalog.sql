-- Try-on categories. Each category needs a different kind of shopper photo,
-- which the backend validates and the UI explains before upload.
CREATE TABLE categories (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  description      TEXT NOT NULL,
  photo_subject    TEXT NOT NULL CHECK (photo_subject IN ('full_body', 'face', 'face_or_hand', 'room')),
  photo_guidance   TEXT NOT NULL,
  sort_order       INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE products (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id  TEXT NOT NULL REFERENCES categories(id),
  sku          TEXT NOT NULL UNIQUE,
  name         TEXT NOT NULL,
  brand        TEXT NOT NULL,
  description  TEXT NOT NULL,
  price_cents  INTEGER NOT NULL CHECK (price_cents >= 0),
  currency     CHAR(3) NOT NULL DEFAULT 'USD',
  image_url    TEXT NOT NULL,
  -- Category-specific details used to build the Gemini prompt,
  -- e.g. {"placement": "ears"} for earrings or {"fit": "oversized"} for a jacket.
  attributes   JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX products_category_idx ON products (category_id);
