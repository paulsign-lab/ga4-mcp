# Business Model Detection — B2B vs D2C

Heuristics for classifying a site as B2B Lead or D2C E-commerce based on
crawl observations. **Always confirm with the user** before generating the
package — these are signals, not certainties.

## D2C E-commerce signals (any 2+ = likely D2C)

| Signal | Where to look | Weight |
|---|---|---|
| Visible price on PDP (not $0 / not "Contact for pricing") | PDP HTML | ★★★ |
| "Add to Cart" / "Buy Now" button on PDP | PDP HTML | ★★★ |
| Cart icon with item count badge in header | Header HTML | ★★★ |
| `/cart` page reachable and functional | URL crawl | ★★★ |
| `/checkout` flow exists | URL crawl | ★★★ |
| Customer account / login link visible | Header HTML | ★★ |
| Coupon / discount code field at checkout | Checkout HTML | ★★ |
| Free shipping threshold banner | Sitewide banner | ★★ |
| Product reviews visible on PDP | PDP HTML | ★ |
| Subscription / recurring purchase options | PDP HTML | ★ |
| Klaviyo with abandoned cart flow | Existing tracking | ★ |

## B2B Lead signals (any 2+ = likely B2B)

| Signal | Where to look | Weight |
|---|---|---|
| No "Add to Cart" on PDP | PDP HTML | ★★★ |
| Primary CTA on PDP is "Contact Us" / "Request a Quote" / "Get a Quote" | PDP HTML | ★★★ |
| Price shows $0.00 or "Contact for Pricing" or hidden | PDP HTML | ★★★ |
| Catalogue / spec sheet / brochure download page | URL crawl | ★★★ |
| "Wholesale" / "B2B" / "Trade" / "Distributor" in nav or copy | Site copy | ★★★ |
| Industry-segmented collections (e.g., Healthcare / Hospitality / Office) | Nav menu | ★★ |
| Minimum Order Quantity (MOQ) mentioned | PDP / Contact page | ★★ |
| Contact form has Company / Country / Industry fields | Contact form | ★★ |
| Case studies / customer logos page | URL crawl | ★ |
| Sustainability / certifications page prominent | Nav menu | ★ |
| Email gate on downloadable assets (Klaviyo on catalogue) | Catalogue page | ★ |

## Hybrid (both signals present)

Some sites do both. Examples: a manufacturer that sells direct online (D2C)
and also wholesales to retailers (B2B). For these:

- Build the **primary** model (whichever has more signal points)
- Add the **secondary** model's critical events as supplementary
- Tell the user explicitly: "I see both retail (D2C) and wholesale (B2B)
  patterns. I'll build a D2C-primary package with B2B lead events layered
  on top. Confirm or correct?"

## Edge cases worth flagging to the user

- **Pre-launch / no products yet**: site has nav but PDPs are stubs. Build B2B
  default (more forgiving), warn that some events will fire 0 times until
  products exist.
- **Marketplace / aggregator**: sells multiple brands. Add `product_brand` as
  a primary custom dimension regardless of model.
- **SaaS / subscription software**: this skill v1.0 doesn't have a SaaS
  playbook. Tell the user and offer to use D2C playbook with
  `purchase` → `subscription_start` parameter remapping as a temporary
  workaround.

## What NOT to use as a signal

- **Industry-vertical keywords alone** ("medical", "industrial", "hospitality")
  don't indicate B2B by themselves — D2C brands sell in these verticals too
  (e.g., medical-grade consumer skincare).
- **Korean / Japanese language** ≠ B2B. Many Asian D2C brands are pure retail.
- **High-priced products** ≠ B2B. Luxury D2C exists.

The cart-and-price signals (top three rows of each table) are the most
reliable. Lead with those.
