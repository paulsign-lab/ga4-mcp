# Playbook: D2C E-commerce Site

This playbook applies when the site sells directly to consumers via online
checkout. Typical signals: visible prices, "Add to Cart" button on PDP, cart
icon with item count, full checkout flow, customer accounts, possibly
discount codes / loyalty programs / subscription products.

## KPI definition — Revenue & ROAS

The most important KPI hierarchy:

> **Primary: `purchase` count and total `purchase_revenue` (GA4 `purchase` event)**
> **Secondary: AOV (Average Order Value), Conversion Rate, ROAS (when ads run)**
> **Tertiary: Return Rate (90-day repeat purchaser), LTV cohort**

Unlike B2B, D2C has a single clearly-defined conversion: the checkout
purchase. Everything else is upstream funnel context.

## Funnel — 6 stages (GA4 standard ecommerce funnel)

| Stage | Event | D2C Benchmark | Notes |
|---|---|---|---|
| 1. Site visit | `page_view` | — | |
| 2. Product interest | `view_item` | ~30-40% of sessions | PDP load |
| 3. Cart addition | `add_to_cart` | ~5-10% of sessions | Critical mid-funnel signal |
| 4. Checkout start | `begin_checkout` | ~2-4% of sessions | Reached checkout page |
| 5. Payment info | `add_payment_info` | ~1-2% of sessions | Last step before purchase |
| 6. Purchase | `purchase` | ~1-2% of sessions | The KPI |

Funnel drop-off analysis (Looker) shows where to focus optimization:
- High view_item but low add_to_cart → product page issue (price, photos, copy)
- High add_to_cart but low begin_checkout → cart friction (shipping cost shown
  too late, account-required, etc.)
- High begin_checkout but low purchase → payment/trust issue

## Event matrix — 22 events

GA4 has standard ecommerce events; use them. Don't invent custom ones for
things the standard already covers.

| # | event_name | Type | Conversion? | Trigger | Required params |
|---|---|---|---|---|---|
| 1 | `page_view` | Standard | No | All pages | page_location, page_title, page_type |
| 2 | `session_start` | Standard | No | Session begin | (auto) |
| 3 | `scroll` | Enhanced | No | 90% scroll | (auto) |
| 4 | `click` (outbound) | Enhanced | No | External link | link_url, link_domain |
| 5 | `view_item_list` | Standard | No | PLP load | item_list_name, items[] |
| 6 | `view_item` | Standard | No | PDP load | items[] |
| 7 | `select_item` | Standard | No | PLP card click | items[] |
| 8 | `add_to_cart` | Standard | YES | Add to Cart click | items[], currency, value |
| 9 | `remove_from_cart` | Standard | No | Remove from cart | items[] |
| 10 | `view_cart` | Standard | No | Cart drawer/page view | items[], currency, value |
| 11 | `begin_checkout` | Standard | YES | Checkout page load | items[], currency, value, coupon |
| 12 | `add_shipping_info` | Standard | No | Shipping info entered | items[], shipping_tier |
| 13 | `add_payment_info` | Standard | YES | Payment info entered | items[], payment_type |
| 14 | `purchase` | Standard | **YES ★** | Order confirmation page | transaction_id, items[], currency, value, tax, shipping, coupon |
| 15 | `refund` | Standard | No | Order refunded (manual/admin) | transaction_id, items[] |
| 16 | `view_promotion` | Standard | No | Promo banner impression | promotion_name, items[] |
| 17 | `select_promotion` | Standard | No | Promo banner click | promotion_name |
| 18 | `sign_up` | Standard | YES | Account creation | method (email/google/apple) |
| 19 | `login` | Standard | No | Customer login | method |
| 20 | `newsletter_subscribe` | Custom | YES | Footer newsletter | form_location, source_page |
| 21 | `share` | Standard | No | Share button click | content_type, item_id, method |
| 22 | `search` | Standard | No | Site search submit | search_term |

★ = the primary conversion event.

## Custom dimensions (Event-scope) — register 5 in GA4 Admin

D2C custom dimensions are leaner than B2B because GA4 standard ecommerce
already carries product info inside `items[]`.

| Dimension name | Parameter | Use |
|---|---|---|
| product_category | `item_category` | Product type / line |
| product_brand | `item_brand` | Multi-brand stores |
| coupon_code | `coupon` | Discount code performance |
| shipping_tier | `shipping_tier` | Standard / Express / etc. |
| customer_tier | `customer_tier` (User Property) | new / returning / VIP |

User Properties (3): `customer_tier`, `total_orders`, `customer_lifetime_value`
— populated from Shopify customer object on login.

## What goes into `gtm_container.json` for D2C

The base GTM container should contain:

- 1 × Google Tag (GA4 config) on All Pages
- 19 × GA4 Event tags (events 5-22 above; 1-4 are auto-collected via Enhanced
  Measurement)
- 4 × Meta Pixel tags: Base, ViewContent (=view_item), AddToCart, Purchase
- 3 × Google Ads conversion tags (placeholder for when ads start): Purchase,
  AddToCart, BeginCheckout
- 18 × Triggers matching the event matrix
- 12 × Variables (dataLayer variables for items, currency, value, transaction_id,
  coupon, etc. + 2 constants)

Shopify D2C tracking note: Shopify's native pixel (Customer Events) may emit
events automatically. If the user has it enabled, **either** disable
Shopify's native ecommerce events **or** disable the GTM ones — don't run
both, or `purchase` events double-count revenue.

## Looker Studio dashboard — 1-page D2C view

Structure (6 rows):

- Row 1 (KPI scorecards): yesterday's revenue · this month revenue · MTD AOV · MTD conversion rate
- Row 2 (funnel/composition): 6-stage purchase funnel · purchase by traffic source (donut)
- Row 3 (products): top 10 products by revenue (table) · top 10 by units sold (table)
- Row 4 (acquisition): top 10 channels (table, with ROAS column if ads connected) · top 10 landing pages
- Row 5 (cart health): cart abandonment rate (gauge) · top abandoned products
- Row 6 (trend): 30-day daily revenue trendline · top search queries (GSC)

## SEO copywriting tone for D2C

When generating Title / Meta Description, use consumer-direct language:

- Include **"Shop", "Buy", "Free Shipping", "Sale"** when applicable
- Lead with the product benefit: "Soft Cotton T-Shirts — Free Shipping Over $50"
- Use price hooks: "From $19", "Starting at $X"
- For collections: include trend / seasonal keywords ("Fall 2026", "Best
  Sellers")
- Reviews / testimonials count: cite if >100 reviews ("Rated 4.8★ by 2,400+
  customers")

## Discovered-issues checklist (Step 5 of the workflow)

Issues to actively look for on a D2C site:

1. Shopify's native pixel + manual GTM events both running → revenue double-count
2. Free-shipping threshold not communicated until late in cart → friction
3. `transaction_id` missing or duplicate-able → GA4 will deduplicate purchases
   silently, undercounting
4. Coupon field exists but `coupon` parameter not pushed to purchase event →
   discount analysis impossible
5. Cart abandonment email automation not connected (Klaviyo / Shopify Email)
6. No upsell / cross-sell PDP module → AOV improvement opportunity
7. Mobile checkout fields too long / not auto-fill enabled
8. Customer reviews not on PDP → conversion ceiling
9. Meta Pixel installed but `value` parameter missing on `add_to_cart` →
   advertising algorithm can't optimize for high-value carts

## Common mistakes when applying this playbook

- **Don't track `request_quote` or `contact_form_submit` as conversions in
  D2C.** These exist on most D2C sites but they're customer service signals,
  not commercial signals. The conversion is `purchase`.
- **Don't custom-build ecommerce events.** GA4's standard set covers
  everything; using custom names breaks built-in reports (Monetization,
  E-commerce purchases, etc.).
- **Don't forget `coupon` parameter.** Half the value of GA4 ecommerce data
  is being able to attribute revenue to coupon codes (which feed back to
  influencer marketing, retargeting offers, etc.).
- **Don't double-fire `purchase`.** Shopify Order Status page might be visited
  multiple times by the same customer. The fire-rule should use
  `transaction_id` deduplication, ideally server-side.

## D2C + B2B hybrid sites

Some sites do both (retail to consumers AND wholesale to retailers). For those:

- Build the D2C event matrix as primary (this playbook)
- Add B2B events 9, 10, 11, 12, 15 (request_quote, contact_form_*,
  catalog_download_*) from `b2b_lead.md` as a secondary track
- Use `customer_tier` User Property to segment: 'retail' vs 'wholesale'
- Set up two separate Looker dashboards rather than mixing — the audiences are
  different
