---
name: site-marketing-infra-setup
description: |
  Analyze any website and generate a complete marketing infrastructure setup
  package: GA4 event design, GTM container JSON, dataLayer snippet, SEO audit
  spreadsheet, and step-by-step implementation guide. Use this skill whenever a
  user provides a website URL and wants any of the following: GA4 setup,
  GTM/Tag Manager configuration, marketing tracking setup, analytics
  implementation, data layer planning, conversion tracking design, B2B lead
  tracking, e-commerce tracking, or SEO audit. Trigger even if the user only
  hints at one of these (e.g., "I just launched this site, what should I do for
  analytics?" or "set up tracking on example.com" or "the dataLayer for my
  store"). Supports Shopify and platform-agnostic (Generic JS) sites; B2B lead
  and D2C e-commerce business models.
license: MIT
---

# Site Marketing Infrastructure Setup

This skill turns a single URL into a complete, ready-to-implement marketing
infrastructure package. It bundles the analyst, the writer, and the engineer
into one workflow.

## What you produce — always 4 deliverables

For every invocation you produce these four files in the user's working folder:

1. **`Marketing_Checklist.xlsx`** — 10-sheet master spreadsheet (master checklist,
   GA4 event matrix, GTM tag map, Looker widget spec, Search Console routine,
   per-page SEO, discovered issues, URL redirects, progress summary)
2. **`Marketing_Guide.docx`** — 11-part implementation guide (concepts, GA4 setup,
   GTM setup, Liquid/JS dataLayer, Pixel, Search Console, SEO, B2B/D2C event
   design, Looker dashboard, ops routine, discovered issues + appendix)
3. **`gtm_container.json`** — GTM container ready to Import (17+ tags, triggers,
   variables; platform/playbook-specific)
4. **`dataLayer_snippet.*`** — Platform-specific snippet (`.liquid` for Shopify,
   `.js` for generic) that the developer pastes into the site

## The workflow — 7 steps

### Step 1. Receive URL + start a TodoList

The user gives you a URL. Create a TodoList with these 7 steps so progress is
visible. Default working folder: the user's current cowork directory. If none
is set, ask the user where to save the output.

### Step 2. Crawl + detect platform

Use Chrome MCP (`mcp__Claude_in_Chrome__navigate` + `javascript_tool`) if
available, otherwise WebFetch. Visit the homepage and inspect for platform
markers:

- **Shopify**: `window.Shopify` exists, `Shopify.theme.name`, `cdn.shopify.com`,
  `/products/`, `/collections/` paths, `meta[name="shopify-digital-wallet"]`
- **WordPress / WooCommerce**: `wp-content`, `wp-json`, `woocommerce` body class
- **Webflow**: `webflow.com/css/webflow`, `data-wf-page`
- **Custom / Other**: none of the above

For this skill version: **Shopify** → use Liquid templates / **anything else**
→ use Generic JS templates.

Also detect: existing GTM (`window.google_tag_manager`), GA4
(`window.gtag` or `_ga` cookie), Meta Pixel (`window.fbq`), Klaviyo
(`klaviyo` script). Tell the user what's already installed before proceeding.

See `reference/platform_detection.md` for the full detection matrix and a
copy-paste JavaScript probe you can run in `javascript_tool`.

### Step 3. Crawl 5-8 key pages

Visit these (skip ones that 404):
- Homepage (`/`)
- A collection / category page (look at GNB top-level links)
- A product / detail page (first `/products/*` or `/product/*` link)
- About / brand story page
- Contact page
- Cart / checkout (if visible) — D2C signal
- Pricing page (if visible) — SaaS signal
- Blog index

For each page capture: title, meta description, H1, primary CTA text, form
fields, navigation links, schema.org JSON-LD, og:image presence. Save into an
in-memory dictionary you'll use in Step 6.

### Step 4. Detect business model and propose a playbook

Use the heuristics in `reference/business_model_detection.md`:

- **B2B Lead**: PDP has no "Add to Cart" / shows "Contact Us" / "Request
  a Quote", $0.00 prices or "Contact for Pricing", catalog/spec download
  links, B2B-segmented industry collections
- **D2C E-commerce**: PDP has "Add to Cart" + visible prices, cart icon
  with count, checkout flow, customer accounts, discount codes

Propose a model and **ask the user to confirm before continuing**:

> "Based on what I see (no Add-to-Cart button, '$0.00' prices, 'Contact Us'
> as the only CTA on product pages), this looks like a **B2B Lead** site.
> I'll use the `b2b_lead` playbook. Confirm or correct?"

Map to playbook file:
- `playbooks/b2b_lead.md` (B2B)
- `playbooks/d2c_ecommerce.md` (D2C)

Read the playbook fully before Step 5. The playbook contains: KPI definition,
event matrix (15-25 events), custom dimensions, funnel definition, B2B/D2C
specific copywriting for the guide.

### Step 5. SEO audit — per-page

For each page captured in Step 3, evaluate:
- Title length (50-65 char ideal) + presence of primary keyword
- Meta description (140-160 char ideal)
- H1 vs Title alignment
- URL handle quality — check for: duplicate suffixes (`사본`, `copy-of-`),
  typos, generic vs keyword-rich
- Schema.org coverage (Organization, Product, BreadcrumbList, FAQPage as
  applicable)
- og:image presence

For each problem found, propose a fix and capture it as a row in the SEO
sheet and (if URL change is needed) in the URL redirects sheet.

Pay special attention to **URL handle quality**. If you see generic handles
(`/collections/baby`) or duplicate-suffix handles (`/collections/baby사본`),
propose Pattern A (keyword-rich URLs) — see
`reference/url_handle_patterns.md` for examples.

### Step 6. Generate the 4 deliverables

Use the scripts in `scripts/`:

- `python scripts/build_xlsx.py --config <config.json>` → checklist
- `node scripts/build_docx.js --config <config.json>` → guide
- `python scripts/build_gtm.py --out outputs/<site>/gtm_container.json` → container JSON
- Render the right template into the dataLayer snippet:
  - Shopify → `templates/shopify_dataLayer.liquid` with substitutions
  - Generic → `templates/generic_dataLayer.js` with substitutions

**GTM JSON 케이싱 — 자주 깨지는 부분.** GTM 컨테이너 JSON은 영역별로 `type` 필드 케이싱이 다르고(parameter는 UPPERCASE, trigger/filter는 UPPERCASE_SNAKE, variable/tag는 소문자 약어, 내장 변수는 UPPERCASE_SNAKE + 공식 카탈로그 한정), 한 곳만 어긋나도 Import가 enum 에러로 실패한다. `build_gtm.py`는 출력 직전 8-Way 사전 검증 + 정규화 안전망을 가지고 있으니 그대로 사용한다. 빌더를 새로 만들거나 손으로 JSON을 수정해야 한다면 먼저 **`reference/gtm_validation_rules.md`** 를 읽고 케이싱 매트릭스를 따른다. 그리고 빌더 출력에 다음 메시지가 보여야만 사용자에게 .json 파일을 전달한다:

```
✓ 사전 검증 통과: 모든 enum 값과 이름 형식이 GTM 정식 형식
```

산출물 저장 직후 한 번 더 spot check:

```bash
# 0건이어야 정상 — 소문자 parameter type 잔존 검사
grep -E '"type":\s*"(template|boolean|integer|list|map)"' \
  outputs/<site>/gtm_container.json | wc -l
```

The `<config.json>` is a single dictionary you build in memory containing:
- `site.url`, `site.name`, `site.platform`
- `model` = "b2b_lead" or "d2c_ecommerce"
- `industries` = list of detected categories (e.g., ["BABY", "PETS", ...])
- `industry_url_map` = `{handle: industry}` pairs
- `pages` = SEO audit results from Step 5
- `discovered_issues` = problems found across Steps 2-5
- `kpis` = the playbook's KPI list, possibly customized

A reference config built for Janibell is at `examples/janibell_b2b.config.json` —
use it as a structural template.

### Step 7. Present to the user

Save all 4 files to the working folder. Provide computer:// links. Summarize:
- What platform/model was detected
- How many events the GTM container defines
- How many SEO issues were found and what priority
- The next 3 actions the user should take in their Shopify/GTM/Search Console
  admin (always: GTM Import → Liquid paste → Search Console verify)

## Interactive checkpoints — do not skip

Three places where you **must** stop and confirm with the user before
continuing. These prevent generating the wrong package for the wrong site.

1. **After platform/model detection (Step 4)**: confirm or correct.
2. **After SEO audit (Step 5) discovers URL changes**: if URL handle
   migrations are needed, ask the user to choose Pattern A (keyword-rich) or
   Pattern B (simple short form). See `reference/url_handle_patterns.md`.
3. **Before saving final files**: present a one-paragraph plan of what's
   about to be written ("I'll generate 4 files: checklist with N rows, guide
   with N parts, GTM container with N tags, Liquid snippet for Shopify
   Motion theme. OK to proceed?").

These checkpoints exist because misclassification cascades: a B2B site
analyzed as D2C produces useless `purchase` events and misses
`request_quote`. Ten seconds of confirmation saves a wrong package.

## Reading the playbooks

The two playbooks contain the heart of the design. Do not freelance the event
matrix — read the playbook end-to-end before generating anything in Step 6.
The playbooks contain:

- The KPI definition (which events count as conversions)
- The full event matrix (15-25 events, parameters, triggers)
- Custom dimensions to register in GA4
- B2B/D2C-specific copywriting templates for the guide
- Common pitfalls and where most analysts make mistakes

## Common pitfalls (read before first use)

- **Don't trust the navigation menu labels for industry detection.** Many sites
  have menu labels that don't match the collection handle (e.g., "BABY" menu
  points to `/collections/home사본`). Always inspect the actual `href` and
  derive `industry` from the URL handle, not the menu label.
- **Don't over-engineer for small sites.** If the site has <100 monthly
  visitors, 5-6 events is enough. Don't deploy a 20-event matrix; the user
  won't fill it with traffic.
- **Don't skip the redirect step.** Whenever you propose a URL handle change,
  always generate a 301 redirect entry in the URL redirects sheet. SEO assets
  must move with the URL.
- **The dataLayer snippet is the source of truth.** GTM lookup tables and GA4
  custom dimensions are downstream consumers. If you change a key in the
  snippet, also change it in the GTM lookup and the GA4 dimension list.
- **GTM JSON은 5가지 위치의 `type` 필드가 각각 다른 케이싱을 요구한다.**
  parameter는 UPPERCASE, trigger/filter는 UPPERCASE_SNAKE, variable/tag는
  소문자 약어, 내장 변수는 UPPERCASE_SNAKE + 공식 카탈로그 내 값만, 거기에
  이름 필드 금지문자(`:` `<` `>` `&` `"` `'`)까지 — 한 군데만 어긋나도 GTM
  Import가 enum 에러로 막힌다. 자세한 규칙·카탈로그·과거 케이스는 아래
  "GTM 컨테이너 JSON 생성 — 검증 규칙" 섹션과 `reference/gtm_validation_rules.md`,
  `reference/gtm_lessons_learned.md`를 참고. 빌더(`scripts/build_gtm.py`)에는
  출력 직전 8-Way 자동 검증이 박혀 있으니 반드시 그대로 사용한다.

## GTM 컨테이너 JSON 생성 — 검증 규칙 (★ Step 6에서 필수 준수)

GTM 컨테이너 JSON을 생성·전달하는 모든 작업은 **반드시 사전 검증을 통과**해야
사용자에게 도달한다. Janibell 프로젝트(2026-05)에서 8번의 import 에러 끝에 확립된
규칙이며 그 학습 자산이 다음 두 파일에 정리되어 있다.

### 작업 전 필수 참고 파일

작업 시작 직후 다음 두 파일을 끝까지 읽는다:

- `reference/gtm_validation_rules.md` — GTM JSON의 7가지 enum 영역, 이름 규칙,
  80+ 공식 BuiltInVariable 카탈로그가 정리됨
- `reference/gtm_lessons_learned.md` — 알려진 8가지 import 에러 케이스와 해결법
  (에러 메시지별 빠른 찾기 인덱스 포함)

### 빌더 사용 원칙

`scripts/build_gtm.py`를 사용하거나 그 검증 로직을 그대로 복제한다. 빌더는 저장 직전
**8-Way 사전 검증**을 자동으로 수행하며, 통과한 JSON만 사용자에게 전달한다.

빌더 표준 출력에서 다음 메시지가 보여야 한다:

```
✓ 사전 검증 통과: 모든 enum 값과 이름 형식이 GTM 정식 형식
```

이 메시지가 안 나오거나 검증 중 어느 한 가지라도 실패하면:

1. **빌드 즉시 중단** (`raise SystemExit`)
2. 어느 검증에서 막혔는지 사용자에게 보고
3. 원인 수정 후 재빌드
4. 통과한 후에만 .json 전달

### 사용자가 GTM Import 에러를 보고하면

다음 순서로 대응한다:

1. **에러 메시지에서 enum 이름·필드명 추출** (예: `EventType`, `BuiltInVariableType`)
2. `reference/gtm_lessons_learned.md`의 "빠른 찾기 인덱스" 표에서 같은 키워드 검색
3. 알려진 케이스면 해당 섹션(§1~§8)의 해결법 즉시 적용
4. 새로운 케이스면 빌더 정규화 함수에 케이스 추가 + 공식 카탈로그 확장 + 재빌드
5. 같은 에러가 두 번 나오지 않도록 빌더에 영구 차단 로직 박기

### 8-Way 검증 체크리스트 (빌더에 이미 박혀 있지만 개념 이해용)

| # | 검증 영역 | 기대 형식 |
|---|---|---|
| 1 | 트리거 type | UPPERCASE_SNAKE (예: `PAGEVIEW`, `CUSTOM_EVENT`) |
| 2 | 필터 type | UPPERCASE_SNAKE (예: `EQUALS`, `MATCH_REGEX`) |
| 3 | 변수 type | 소문자 약어 (예: `c`, `v`, `smm`, `jsm`) |
| 4 | 태그 type | 소문자 템플릿 ID (예: `googtag`, `gaawe`, `html`) |
| 5 | 내장 변수 type | UPPERCASE_SNAKE + GTM 공식 카탈로그 내 값만 |
| 6 | 파라미터 type | UPPERCASE (`TEMPLATE`, `BOOLEAN`, `INTEGER`, `LIST`, `MAP`) |
| 7 | tagFiringOption | `ONCE_PER_EVENT` / `ONCE_PER_LOAD` / `UNLIMITED` |
| 8 | 이름 필드 | 금지 문자 (`:` `<` `>` `&` `"` `'`) 미포함 |

이 8가지가 모두 통과한 JSON만 사용자에게 전달한다는 원칙은 절대 양보하지 않는다.

## Versioning

- v1.0 (2026-05): initial release — Shopify + Generic, B2B + D2C
- v1.1 (2026-05): GTM JSON 8-Way 검증 + `reference/gtm_validation_rules.md` /
  `reference/gtm_lessons_learned.md` 추가 (Janibell 프로젝트 학습 반영)
- Expansion priorities (when needed): WordPress/Woo Liquid analog, SaaS and
  Content/Media playbooks, Webflow templates, Meta CAPI server-side variant

## Janibell case study

The end-to-end output of this skill, applied to janibell.com (a B2B
odor-sealing disposal systems site), is at `examples/janibell_b2b.example.md`.
Read this if you want a feel for the final deliverable quality and depth
before generating for a new site.
