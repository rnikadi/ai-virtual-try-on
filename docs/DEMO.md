# Stakeholder demo guide

## Before the meeting

1. Put your key in `.env` (`GEMINI_API_KEY=...`) and restart the backend. The badge in the top right
   should read **Live · gemini-3.1-flash-image**, not "Mock mode".
2. Product and sample photos ship with the repo, so there is nothing to generate.
3. Do a dry run in each category with **Use sample**, so results show in "Recent try-ons". If you'd rather use
   real people, prepare one photo per kind of try-on instead:
   - a full-body photo (clothing)
   - a front-facing face photo (glasses, makeup)
   - a head-and-shoulders photo with ears visible (earrings, necklace)
   - a hand photo (ring, watch)
   - a wide room photo (furniture)
4. Use photos of people who have agreed to it, ideally team members.

## Suggested 5-minute flow

1. **The problem (30s).** Shoppers can't tell how a product will look on them, which drives returns and
   abandoned carts.
2. **Clothing (1 min).** Open Clothing, pick the denim jacket, upload the full-body photo, drag the
   before/after slider.
3. **Show the distinctions (1.5 min).** Switch tabs and point out that each category asks for a different
   photo: face for glasses and makeup, ears and neck for earrings, a hand for rings and watches, a room for
   furniture. Run one or two of them.
4. **Guardrails (30s).** Upload a face photo for the jacket. The app explains the photo doesn't fit instead
   of producing a bad image, and no image generation is charged.
5. **Cost and next steps (1.5 min).** Use the numbers below.

## Cost and latency (Gemini API list prices, October 2026)

| Step | Model | Approximate cost |
| --- | --- | --- |
| Photo check | `gemini-3.1-flash-lite` | well under $0.001 per photo |
| Try-on image (1K output) | `gemini-3.1-flash-image` | about $0.07 per image |
| Try-on image, cheaper option | `gemini-3.1-flash-lite-image` | about $0.03 per image |

So 1,000 try-ons cost roughly $35 to $70 in API fees. Batch pricing is about half, but batch is not
suitable for interactive try-on. Check https://ai.google.dev/gemini-api/docs/pricing for current prices.

Latency is shown under each result ("Generated in Xs"). Measure it during your dry run and quote those
numbers rather than estimates. Every try-on is also stored in the `tryon_sessions` table:

```sql
SELECT count(*) FILTER (WHERE status = 'succeeded') AS succeeded,
       count(*) FILTER (WHERE status = 'failed')    AS failed,
       round(avg(latency_ms) FILTER (WHERE status = 'succeeded')) AS avg_ms
FROM tryon_sessions;
```

## Known limits of the POC

- Results are AI-generated previews, not exact fit or size guidance.
- Photos are stored on local disk with no login or retention policy. A production version needs consent,
  automatic deletion and object storage.
- Product images matter: low-quality or cluttered product photos give weaker try-ons.
- Each try-on runs inside one HTTP request (typically several seconds). A production version would queue
  jobs and stream progress.
