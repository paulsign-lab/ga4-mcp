# Example: janibell.com (B2B Lead, Shopify)

This is the end-to-end output of `site-marketing-infra-setup` applied to a
real client site. Use this as a reference for the quality and depth of
deliverables to expect.

## Input

```
URL:      https://janibell.com
Working:  /Users/.../Documents/Claude/Projects/매직캔_B2B웹사이트 구축&교육/
```

## Detection results (Step 2-4)

```
Platform:        Shopify (theme: Motion_final)
Currency:        USD
Locale:          en
Existing tracking:
  · GTM:        not installed
  · GA4:        not installed
  · Meta Pixel: not installed
  · Klaviyo:    installed ✓ (forms only, no catalog gate yet)
Business model:  B2B Lead (confidence: high)
  ✓ No "Add to Cart" on PDP
  ✓ Primary CTA = "Contact Us"
  ✓ Prices all $0.00
  ✓ Industry-segmented collections (HOME/BABY/PETS/CARE/MEDICAL/PUBLIC/
     HOSPITALITY/OFFICE)
  ✓ Catalogue page exists (no PDF gate yet)
Detected industries: 8 (mapped to Pattern A keyword URLs)
```

## Industries detected → Pattern A handles

| Menu label | Old handle (broken) | Pattern A handle |
|---|---|---|
| HOME | `/collections/home` | `/collections/home-odor-sealing-pails` |
| BABY | `/collections/home사본` | `/collections/diaper-pails` |
| PETS | `/collections/baby사본` | `/collections/pet-waste-pails` |
| CARE | `/collections/medical사본` | `/collections/adult-care-disposal` |
| MEDICAL | `/collections/pets사본` | `/collections/medical-waste-pails` |
| PUBLIC | `/collections/care사본` | `/collections/sanitary-disposal-bins` |
| HOSPITALITY | `/collections/office사본` | `/collections/hospitality-sanitary-bins` |
| OFFICE | `/collections/public사본` | `/collections/office-sanitary-bins` |

Notice the menu-to-handle mismatch in the old layout (e.g., BABY menu was
linking to `home사본`). The skill caught this and proposed a clean
re-mapping.

## Deliverables produced

### 1. Marketing_Checklist.xlsx — 10 sheets

| Sheet | Rows |
|---|---|
| 0_시작하기 | 5 |
| 1_마스터체크리스트 | 50 |
| 2_GA4_이벤트설계 | 22 |
| 3_GTM_태그매핑 | 50 |
| 4_Looker_위젯스펙 | 14 |
| 5_SearchConsole_운영 | 18 |
| 6_SEO_페이지별 | 19 |
| 7_사이트_발견이슈 | 12 |
| 9_URL_리다이렉트 | 9 |
| 10_진행률요약 | 10 (live formula) |

### 2. Marketing_Guide.docx — 11 parts + 1 appendix

- Part 0: 들어가며
- Part 1: 개념 정리 (GA4·GTM·Pixel·Search Console 관계)
- Part 2: GA4 단계별 설정 가이드 (계정→스트림→커스텀 디멘젼)
- Part 3: GTM 단계별 설정 가이드 (컨테이너 Import 포함)
- Part 4: Shopify theme.liquid 삽입 (GTM + dataLayer)
- Part 5: Meta Pixel 설정
- Part 6: Search Console 등록 + sitemap
- Part 7: SEO 기초 작업 (Pattern A URL 마이그레이션 포함)
- Part 8: B2B 데이터 설계 철학
- Part 9: Looker Studio 1페이지 대시보드
- Part 10: 운영 루틴 (일일·주간·월간)
- Part 11: 발견된 사이트 이슈 12건
- 부록 A: GTM 컨테이너 JSON 구조 + 신규 산업군 추가법

### 3. gtm_container.json

- 20 tags (1 GA4 Config + 16 GA4 Event + 3 Meta Pixel)
- 17 triggers
- 15 variables (12 dataLayer + 1 JS macro + 1 lookup table + 1 constant)
- 4 folders

Lookup table contains 16 entries (8 Pattern A + 8 Legacy fallback).

### 4. janibell_dataLayer_snippet.liquid

v2.0 with dual mapping: `INDUSTRY_MAP` (Pattern A) + `LEGACY_MAP` (transition
safety net). Auto-pushes:

- page_view, page_type, page_path, industry, user_logged_in (all pages)
- view_item (PDP)
- view_item_list (PLP)
- contact_form_start / submit (Contact page)
- catalog_download_start / complete (Catalogue page, Klaviyo-triggered)
- klaviyo_form_submit (any other Klaviyo form)

## Discovered issues (sample 5 of 12)

| # | Issue | Priority | Resolution |
|---|---|---|---|
| 1 | 7 collections with `사본` suffix + menu-handle mismatch | P0 | Pattern A migration |
| 2 | Brand Story URL typo: `brand-stroy` → `brand-story` | P0 | Rename + 301 redirect |
| 3 | Contact form missing Company / Country / Industry / Inquiry Type | P0 | Add 5 fields + dataLayer push |
| 4 | Catalogue page exists but no Klaviyo gate / no PDF | P0 | Install Klaviyo form + PDF link |
| 5 | Vendor field shows 'janibell.dev' across all products | P1 | Bulk edit to 'Janibell' |

## What the user did with this output

Within 2 working days:
1. Imported `gtm_container.json` to GTM (5 min)
2. Pasted `janibell_dataLayer_snippet.liquid` into `theme.liquid` (15 min)
3. Migrated 8 collection handles to Pattern A + set up 9 URL redirects (30 min)
4. Verified all 19 events in GA4 DebugView (45 min)
5. Built the 1-page Looker dashboard from the spec (90 min)
6. Submitted sitemap to Search Console + indexed 13 priority URLs (10 min)

Total time to live tracking: ~3 hours of admin work.
Without the skill, this same package would have taken approximately 2 weeks of
analyst + developer collaboration to design and deliver.
