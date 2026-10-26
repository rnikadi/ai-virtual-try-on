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
- Gemini API: `gemini-3.1-flash-image` edits the photo, `gemini-3.1-flash-lite` pre-checks it (both configurable in `.env`)

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
| POST | `/api/tryon` | Multipart form with `productId` and `photo`; runs a try-on and returns the session (201 on success, 422 with `errorMessage` on failure) |
| GET | `/api/tryon/:id` | One try-on session |
| GET | `/api/tryon?limit=` | Recent try-ons, newest first |

## How a try-on works

1. The uploaded photo is auto-rotated, resized to at most 1536 px and saved under `backend/uploads/inputs`.
2. A cheap vision model checks the photo shows what this product needs (full body, face, ears and neck,
   hand or room). A wrong photo gets a helpful message, and no image is generated or paid for.
3. A category-specific prompt (`backend/src/tryon/prompts.ts`) is sent to the Gemini image model with
   the shopper's photo and the product photo. The output keeps the photo's aspect ratio.
4. The result is saved under `backend/uploads/results`, and the session row records the status,
   model, prompt and latency.

Without a `GEMINI_API_KEY` the backend runs in **mock mode**: it overlays the product thumbnail on the
photo with a "mock preview" label, so the UI can be built and demoed end to end. `/api/health` shows
which mode is active.

### Useful scripts

```bash
npm run tryon -- EYE-001 ~/Pictures/me.jpg   # one try-on from the command line
npm run catalog:images                       # replace placeholder product images with Gemini-generated photos
npm run catalog:images -- APP-001 HOM-002    # ...or just some products
```

## Status

- [x] Step 1: Foundation (repo layout, Postgres, migrations, seed catalog)
- [x] Step 2: Try-on engine (Gemini endpoint, per-category prompts, photo check, mock mode)
- [x] Step 3: Stakeholder demo UI (category tabs, per-product photo guidance, before/after slider, recent try-ons)
- [ ] Step 4: Demo polish: [demo guide and cost notes](docs/DEMO.md) written; prompt tuning against real photos once a Gemini key is set

Product images in `backend/assets/products` are placeholders. Try-on quality depends on them, so run
`npm run catalog:images` once a Gemini key is set, or drop in real product photos with the same file names.
