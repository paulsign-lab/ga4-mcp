# URL Handle Patterns — Pattern A (keyword-rich) vs Pattern B (short)

When the SEO audit (Step 5) detects suboptimal URL handles — generic short
forms, duplicate suffixes (`사본`, `copy-of-`), or typos — propose a migration.
Two patterns are available; default to A.

## Pattern A — Keyword-rich (RECOMMENDED)

URL handle contains the primary search keyword for that page.

| Use case | Bad | Pattern A |
|---|---|---|
| B2B diaper-pail collection | `/collections/baby` | `/collections/diaper-pails` |
| D2C men's t-shirts collection | `/collections/mens` | `/collections/mens-t-shirts` |
| B2B incontinence disposal | `/collections/care` | `/collections/adult-care-disposal` |
| D2C running shoes | `/collections/running` | `/collections/running-shoes` |

**When to use:** almost always. The only downside is slightly longer URLs.

**Why it wins:**
- Comes directly from how buyers search ("diaper pail wholesale", not "baby")
- Collection pages outrank product pages in SEO (more content density), so
  URL keywords compound
- Shopify/Google match URL keywords with high confidence

## Pattern B — Short form

URL handle is the segment name only.

| Use case | Pattern B |
|---|---|
| B2B diaper-pail collection | `/collections/baby` |
| D2C men's t-shirts | `/collections/mens` |

**When to use:** only if the user explicitly wants ultra-short URLs for brand
consistency or print/marketing reasons. Acknowledge SEO sacrifice.

## Korean-environment-specific issues

Many Korean Shopify / Cafe24 stores have these recurring problems:

- `/collections/handle사본` — auto-suffix from duplicating a collection in
  Korean Shopify Admin (사본 = "copy")
- URL-encoded form: `/collections/handle%EC%82%AC%EB%B3%B8`
- Typos surviving the launch: `/pages/brand-stroy` (should be `brand-story`)

**The Janibell case** had a particularly bad version: the menu labels
(BABY/PETS/CARE...) didn't even match the handle they pointed to. BABY menu
linked to `/collections/home사본`, PETS to `/collections/baby사본`, etc. — a
duplication-order mistake that cascaded.

When you detect this pattern, ALWAYS recommend a full re-mapping (not just
removing 사본) so menu labels and handles align cleanly.

## Migration steps you must always include

When proposing any URL handle change, the SEO sheet and the URL redirects
sheet must both update, and the dataLayer's `INDUSTRY_MAP` must include both
the new handle and the old handle (as `LEGACY_MAP` fallback) for 1-2 months.

```
1. Shopify Admin → Collections → edit handle to Pattern A
2. Navigation → URL redirects → add 301: old → new
3. Main menu → update links to point to new handles
4. Search Console → URL Inspection → Request Indexing for each new URL
5. dataLayer snippet INDUSTRY_MAP — already has Pattern A + LEGACY_MAP from generation
6. After 60 days, optionally remove LEGACY_MAP entries
```

The skill's `build_xlsx.py` script generates the redirect table automatically
when the config includes `url_migrations` entries.

## Quick keyword-research shortcut

If you need to propose a Pattern A handle but aren't sure of the search
keyword:

1. The user's industry segment name in the menu (e.g., "MEDICAL")
2. + the core product type from a quick crawl of products in that segment
   (e.g., "waste pail", "disposal bin")
3. = `medical-waste-pails`, `medical-disposal-bins`

If 3+ valid options, default to the shorter / more common phrase. Don't
spend more than 30 seconds picking — title and meta description can compensate
for any keyword the URL misses.
