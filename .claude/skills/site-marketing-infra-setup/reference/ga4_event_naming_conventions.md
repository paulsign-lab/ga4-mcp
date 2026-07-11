# GA4 Event Naming Conventions

Distilled from official GA4 docs + CJ ENM enterprise analytics standards.

## GA4 system limits (memorize these)

| Item | Limit |
|---|---|
| Unique event names per property | 500 |
| Event name length | 40 chars |
| Parameters per event | 25 |
| Parameter name length | 40 chars |
| Parameter value length | 100 chars |
| User properties per property | 25 |
| User property name length | 24 chars |
| User property value length | 36 chars |

When you exceed these silently, GA4 truncates without warning. Stay well
under the limits — it's free insurance.

## Event name rules

1. **Lowercase + underscores.** `view_item` not `viewItem` or `view-item`.
2. **Verb-noun form.** `request_quote`, not `quote_request`. Consistent
   reading direction matters when you have 20+ events.
3. **Reuse GA4 standard events when applicable.** Don't custom-build
   `product_view` when `view_item` exists — built-in reports break.
4. **Avoid GA4 reserved names.** `app_remove`, `app_clear_data`,
   `first_open`, `in_app_purchase`, `session_start`, `user_engagement`
   etc. are reserved.

See full reserved list: https://support.google.com/analytics/answer/9234069

## Parameter naming conventions — prefix-based

Group parameters by logical scope using prefixes. This is the convention
CJ ENM uses across 141 dimensions:

| Prefix | Scope | Examples |
|---|---|---|
| `page_` | Page context | `page_type`, `page_location`, `page_title` |
| `event_` | Event-specific metadata | `event_label`, `event_id` |
| `prd_` or `item_` | Product fields | `prd_handle`, `item_id`, `item_brand` |
| `purchase_` | Transaction fields | `purchase_value`, `purchase_currency` |
| `user_` | User properties | `user_logged_in`, `user_tier` |
| `device_` | Device info | `device_type` (mostly auto-collected) |
| `visit_` | Session-scope | `visit_source`, `visit_channel` |
| `utm_` | Marketing tags | `utm_source`, `utm_campaign` |

In this skill, we use a leaner subset (no `device_`, no `visit_` — auto-
collected; no `utm_` — auto-collected via Enhanced Measurement) but the
prefix discipline is the same.

## Custom dimension registration in GA4

Parameters are only **visible in GA4 reports** if registered as Custom
Dimensions in Admin → Custom Definitions. Up to 50 Event-scope custom
dimensions are free; more cost.

Strategy: register the parameters that matter for analysis FIRST, leave the
others as "ambient context" that flows through to BigQuery but doesn't show
in standard reports.

For B2B sites (this skill's b2b_lead playbook): 6 dimensions.
For D2C sites: 5 dimensions.

## Conversion event marking

After events fire for ~24 hours, mark them as "Key Event" (formerly
"Conversion") in Admin → Events. This unlocks:

- Visibility in the "Conversions" section of Standard Reports
- Use as Google Ads conversion (if connected)
- "Conversion rate" calculations

For B2B: mark the 3 Qualified Lead events + tel/mailto clicks + newsletter +
file_download (8 total).
For D2C: mark `purchase`, `begin_checkout`, `add_payment_info`, `sign_up`,
`newsletter_subscribe` (5 total).

## Avoid these naming pitfalls

| Pitfall | Why |
|---|---|
| `Buy_Button_Click` | Mixed case, no verb-noun, vague — use `add_to_cart` |
| `pdp_view` | Custom for something GA4 covers (`view_item`) |
| `lead` | Too generic — use `request_quote`, `contact_form_submit`, etc. |
| `event_action`, `event_category`, `event_label` | UA terminology; GA4 doesn't use these slots |
| `purchase_complete` | Just `purchase` — Shopify/Klaviyo/Meta expect this exact name |

## CJ ENM-style "transmission timing" annotation

For documentation only (helpful for handoff to developers): annotate each
parameter with its transmission timing. Categories used by CJ ENM:

- `[공통]` (Common): pushed on every page load
- `[전자상거래]` (Ecommerce): pushed on PDP/PLP/cart/checkout/purchase
- `[검색]` (Search): pushed on search-related pages
- `[로그인 시]` (On login): pushed only after login

In our skill's checklist sheet `2_GA4_이벤트설계`, the "전송 시점" column
serves this role.

## Data type discipline

GA4 ingests everything as text, but for downstream BigQuery / Looker
calculations:

- Numbers should be sent as numbers, not strings (`100`, not `"100"`)
- Booleans as `true`/`false`, not `"Y"`/`"N"`
- Timestamps in ISO 8601 (`2026-05-14T09:00:00Z`), not Korean format

When generating the dataLayer snippet, the skill's templates already handle
this correctly. If you ever modify them, preserve the JSON typing.
