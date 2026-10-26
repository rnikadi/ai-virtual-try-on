# AI Virtual Try-On (POC)

A proof of concept for virtual try-on in an online store, built for a stakeholder demo.
Shoppers upload a photo and see a product on themselves or in their room, generated
with Google's Gemini image model.

## Try-on categories

Each category needs a different kind of photo, and gets its own prompt and validation.

| Category | Shopper photo | Examples |
| --- | --- | --- |
| Clothing | Full body, front-facing | Jackets, dresses, sweaters |
| Glasses & sunglasses | Face, front-facing | Optical frames, sunglasses |
| Jewelry & accessories | Head and shoulders, or hand | Earrings, necklaces, rings, watches |
| Makeup | Close-up of bare face | Lipstick, eyeshadow |
| Furniture & decor | Wide photo of a room | Armchairs, lamps, plants |

## Stack

- `frontend/`: React + TypeScript (Vite)
- `backend/`: Node + Express + TypeScript
- `db/`: PostgreSQL migration scripts (`db/migrations`) and seed data (`db/seeds`)
- Gemini API for image generation (wired in from step 2)

## Getting started

Requires Node 22+ and Docker.

```bash
cp .env.example .env    # add GEMINI_API_KEY when you have it
npm install
npm run db:up           # start Postgres in Docker
npm run db:migrate      # apply migrations
npm run db:seed         # load the demo catalog
npm run dev:backend     # API on http://localhost:4000
npm run dev:frontend    # UI on http://localhost:5173
```

`npm run db:reset` drops and rebuilds the local database from scratch.

### Migrations

Migrations are plain SQL files in `db/migrations`, applied in filename order and tracked
in the `schema_migrations` table. To change the schema, add a new numbered file
(for example `0003_add_product_sizes.sql`) rather than editing an applied one.

## API

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/health` | Database check and whether a Gemini key is configured |
| GET | `/api/categories` | Try-on categories with photo guidance |
| GET | `/api/products?category=` | Products, optionally filtered by category |
| GET | `/api/products/:id` | One product |

## Status

- [x] Step 1: Foundation (repo layout, Postgres, migrations, seed catalog)
- [ ] Step 2: Try-on engine (Gemini endpoint, per-category prompts)
- [ ] Step 3: Stakeholder demo UI
- [ ] Step 4: Demo polish (errors, cost and latency notes, demo script)

Product images in `backend/assets/products` are placeholders and will be replaced with
realistic product photos, which the try-on quality depends on.
