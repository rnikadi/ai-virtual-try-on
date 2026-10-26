-- Demo catalog: a few products per try-on category.
-- Safe to re-run: existing rows are updated in place.

INSERT INTO categories (id, name, description, photo_subject, photo_guidance, sort_order) VALUES
  ('apparel',   'Clothing',               'Tops, dresses, jackets and more, shown on your body.',
   'full_body',    'Upload a well-lit, front-facing photo showing you from head to at least the knees. Plain background works best.', 1),
  ('eyewear',   'Glasses & sunglasses',   'Frames placed on your face at the right size and angle.',
   'face',         'Upload a front-facing photo of your face with eyes open and hair away from your temples. Remove any glasses you are wearing.', 2),
  ('jewelry',   'Jewelry & accessories',  'Earrings, necklaces, rings, watches and hats.',
   'face_or_hand', 'For earrings, necklaces and hats upload a head-and-shoulders photo. For rings and watches upload a clear photo of your hand.', 3),
  ('makeup',    'Makeup',                 'Lipstick, eyeshadow and blush shades on your own face.',
   'face',         'Upload a close, front-facing photo of your bare face in natural light, without filters.', 4),
  ('home',      'Furniture & decor',      'Furniture and decor placed in a photo of your room.',
   'room',         'Upload a wide photo of the room taken at eye level, with the spot you want to fill clearly visible.', 5)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  photo_subject = EXCLUDED.photo_subject,
  photo_guidance = EXCLUDED.photo_guidance,
  sort_order = EXCLUDED.sort_order;

INSERT INTO products (category_id, sku, name, brand, description, price_cents, image_url, attributes) VALUES
  ('apparel', 'APP-001', 'Classic Denim Jacket',      'Northline', 'Mid-wash denim jacket with a relaxed fit.',              8900, '/assets/products/APP-001.png', '{"garment": "jacket", "fit": "relaxed", "color": "mid-blue denim"}'),
  ('apparel', 'APP-002', 'Linen Summer Dress',        'Solstice',  'Knee-length sleeveless dress in breathable linen.',      7400, '/assets/products/APP-002.png', '{"garment": "dress", "fit": "regular", "color": "terracotta"}'),
  ('apparel', 'APP-003', 'Crew Neck Knit Sweater',    'Hearth',    'Soft merino crew neck sweater.',                         6500, '/assets/products/APP-003.png', '{"garment": "sweater", "fit": "regular", "color": "forest green"}'),

  ('eyewear', 'EYE-001', 'Round Tortoise Frames',     'Optica',    'Round acetate frames in classic tortoiseshell.',        12900, '/assets/products/EYE-001.png', '{"style": "round", "lens": "clear", "frame_color": "tortoiseshell"}'),
  ('eyewear', 'EYE-002', 'Aviator Sunglasses',        'Skyway',    'Gold metal aviators with green tinted lenses.',          9900, '/assets/products/EYE-002.png', '{"style": "aviator", "lens": "green tint", "frame_color": "gold"}'),
  ('eyewear', 'EYE-003', 'Bold Square Frames',        'Optica',    'Thick black square frames.',                            11900, '/assets/products/EYE-003.png', '{"style": "square", "lens": "clear", "frame_color": "black"}'),

  ('jewelry', 'JEW-001', 'Gold Hoop Earrings',        'Aurum',     'Medium 14k gold-plated hoops.',                          4900, '/assets/products/JEW-001.png', '{"type": "earrings", "placement": "ears", "material": "gold"}'),
  ('jewelry', 'JEW-002', 'Silver Pendant Necklace',   'Aurum',     'Sterling silver chain with a small round pendant.',      5900, '/assets/products/JEW-002.png', '{"type": "necklace", "placement": "neck", "material": "silver"}'),
  ('jewelry', 'JEW-003', 'Minimal Leather Watch',     'Tempo',     '38mm white dial on a tan leather strap.',               14900, '/assets/products/JEW-003.png', '{"type": "watch", "placement": "wrist", "material": "steel and leather"}'),
  ('jewelry', 'JEW-004', 'Solitaire Ring',            'Aurum',     'Thin gold band with a single round stone.',              8900, '/assets/products/JEW-004.png', '{"type": "ring", "placement": "finger", "material": "gold"}'),

  ('makeup',  'MUP-001', 'Velvet Matte Lipstick - Ruby',  'Lumen', 'Long-wear matte lipstick in a classic red.',             2400, '/assets/products/MUP-001.png', '{"type": "lipstick", "area": "lips", "shade": "ruby red", "hex": "#9B111E", "finish": "matte"}'),
  ('makeup',  'MUP-002', 'Satin Lipstick - Rosewood',     'Lumen', 'Satin-finish lipstick in a muted rose.',                 2400, '/assets/products/MUP-002.png', '{"type": "lipstick", "area": "lips", "shade": "rosewood", "hex": "#A8566A", "finish": "satin"}'),
  ('makeup',  'MUP-003', 'Shimmer Eyeshadow - Bronze',    'Lumen', 'Warm bronze shimmer eyeshadow.',                         2100, '/assets/products/MUP-003.png', '{"type": "eyeshadow", "area": "eyelids", "shade": "bronze", "hex": "#B0753F", "finish": "shimmer"}'),

  ('home',    'HOM-001', 'Mid-Century Armchair',      'Casa',      'Walnut frame armchair with mustard upholstery.',        34900, '/assets/products/HOM-001.png', '{"type": "armchair", "width_cm": 76, "depth_cm": 80, "height_cm": 82}'),
  ('home',    'HOM-002', 'Arc Floor Lamp',            'Casa',      'Brushed brass arc lamp with a white dome shade.',       18900, '/assets/products/HOM-002.png', '{"type": "floor lamp", "width_cm": 40, "depth_cm": 150, "height_cm": 190}'),
  ('home',    'HOM-003', 'Fiddle Leaf Fig Planter',   'Verde',     'Faux fiddle leaf fig in a white ceramic pot.',           9900, '/assets/products/HOM-003.png', '{"type": "plant", "width_cm": 60, "depth_cm": 60, "height_cm": 150}')
ON CONFLICT (sku) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  brand = EXCLUDED.brand,
  description = EXCLUDED.description,
  price_cents = EXCLUDED.price_cents,
  image_url = EXCLUDED.image_url,
  attributes = EXCLUDED.attributes;
