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

### Option A: everything in Docker (recommended)

Requires only Docker Desktop (or Docker Engine with Compose v2.24+).

```bash
cp .env.example .env          # add GEMINI_API_KEY to use Gemini; leave it empty for mock mode
docker compose up --build     # first run takes a few minutes
```

Open http://localhost:5173. Compose starts four services:

| Service | What it does | Port |
| --- | --- | --- |
| `db` | PostgreSQL 16, data kept in the `tryon-db` volume | 5432 |
| `migrate` | Applies migrations and seeds the catalog, then exits | |
| `backend` | Express API with hot reload | 4000 |
| `frontend` | Vite dev server with hot reload | 5173 |

Edits under `backend/src`, `frontend/src` and `db/` reload automatically. Rebuild (`docker compose up --build`)
only after changing dependencies in a `package.json`.

Common commands:

```bash
docker compose logs -f backend               # follow API logs
docker compose restart backend               # pick up a changed .env
docker compose run --rm migrate              # re-run migrations and seeds
docker compose exec db psql -U tryon         # open a SQL shell
docker compose down                          # stop
docker compose down -v                       # stop and delete the database
```

If port 5432, 4000 or 5173 is already in use on your machine, stop the other process or change the
left-hand number in the `ports:` entry in `docker-compose.yml`.

### Option B: Node on your machine, Postgres in Docker

Requires Node 22+ and Docker.

```bash
cp .env.example .env
npm install
npm run db:up           # start only Postgres in Docker
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
| GET | `/api/admin/products` | Products with their image prompt |
| POST | `/api/admin/products/:id/image` | Multipart form with `image`; replaces the product photo |
| DELETE | `/api/admin/products/:id/image` | Switches the product back to the bundled image |
| GET | `/api/samples` | Sample shopper photos, one per kind of photo |
| POST | `/api/admin/samples/:subject` | Multipart form with `image`; replaces a sample photo |

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
```

## Status

- [x] Step 1: Foundation (repo layout, Postgres, migrations, seed catalog)
- [x] Step 2: Try-on engine (Gemini endpoint, per-category prompts, photo check, mock mode)
- [x] Step 3: Stakeholder demo UI (category tabs, per-product photo guidance, before/after slider, recent try-ons)
- [ ] Step 4: Demo polish: [demo guide and cost notes](docs/DEMO.md) written; prompt tuning against real photos once a Gemini key is set

## Demo images

Product photos (`backend/assets/products`) and sample shopper photos (`backend/assets/samples`) are committed
to the repo, so the demo works straight after `docker compose up` with no image generation at runtime. The
try-on panel offers the matching sample photo as **Use sample**, so nobody has to upload their own photo.

They were generated with Gemini by a one-time script, using the prompts in
`backend/src/catalog/imagePrompts.ts` and `samplePrompts.ts`:

```bash
npm run demo-images                    # generate only images that don't exist yet
npm run demo-images -- --force         # regenerate everything (about $1.50)
npm run demo-images -- APP-001 hand    # regenerate specific SKUs or sample subjects
```

Commit the results under `backend/assets`. The **Demo images** page (link in the top bar) shows each prompt
and lets you upload a replacement locally; "Use original" switches back. It has no login and is meant for
local use.
