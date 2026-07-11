# GA4 MCP — Claude 컨텍스트

이 프로젝트는 `mcp-server-ga4`가 연결된 GA4 데이터 분석 환경입니다.

---

## 웹사이트 유형 파악 (첫 질문)

사용자가 분석을 요청할 때 웹사이트 유형이 불분명하면 **먼저 유형을 확인**하세요.

```
이 사이트는 온라인 쇼핑몰인가요, 아니면 B2B 기업 소개·리드 발생 목적의 사이트인가요?
```

| 유형 | 핵심 지표 | 전환 이벤트 |
|---|---|---|
| **B2C 이커머스** | 매출, 구매 전환율, AOV, 장바구니 이탈률 | `purchase`, `add_to_cart`, `begin_checkout` |
| **B2B 기업 웹사이트** | 리드 수, 리드 전환율, 체류 시간, 재방문율 | `generate_lead`, `form_submit`, `file_download` |
| **일반 콘텐츠·브랜드** | 세션, 채널, 이탈률, 페이지뷰 | 사이트별 상이 |

전환 이벤트를 모르는 경우: `mcp__ga4__run_report`로 `eventName` 차원을 조회해 어떤 이벤트가 있는지 먼저 확인하세요.

---

## 사용 가능한 MCP 도구

| 도구 | 용도 |
|---|---|
| `mcp__ga4__run_report` | 차원·지표 조합으로 데이터 조회 (주요 도구, 90% 호출) |
| `mcp__ga4__batch_run_reports` | 여러 리포트 동시 조회 (기간 비교 등) |
| `mcp__ga4__get_realtime_data` | 실시간 활성 사용자·페이지 (5초) |
| `mcp__ga4__list_metrics` | 사용 가능한 지표 목록 조회 |
| `mcp__ga4__list_dimensions` | 사용 가능한 차원 목록 조회 |

---

## 자주 쓰는 차원 (Dimensions)

### 공통

| 차원 | 설명 |
|---|---|
| `sessionDefaultChannelGroup` | 채널 그룹 (Organic Search / Paid Search / Direct 등) |
| `landingPagePlusQueryString` | 랜딩 페이지 URL |
| `newVsReturning` | 신규 사용자 vs 재방문자 |
| `deviceCategory` | 디바이스 (mobile / desktop / tablet) |
| `sessionSourceMedium` | 소스/매체 (google/cpc · naver/organic 등) |
| `sessionCampaignName` | UTM 캠페인명 |
| `country` | 국가 |
| `pagePath` | 페이지 경로 |
| `eventName` | 이벤트 이름 (전환 이벤트 확인용) |

### B2C 이커머스 전용

| 차원 | 설명 |
|---|---|
| `itemName` | 제품명 |
| `itemCategory` | 제품 카테고리 |
| `itemId` | 제품 ID (SKU) |
| `transactionId` | 주문 ID |

---

## 자주 쓰는 지표 (Metrics)

### 공통

| 지표 | 설명 |
|---|---|
| `sessions` | 세션 수 |
| `activeUsers` | 활성 사용자 수 |
| `newUsers` | 신규 사용자 수 |
| `conversions` | 전환 수 |
| `conversionRate` | 전환율 |
| `bounceRate` | 이탈률 |
| `averageSessionDuration` | 평균 세션 시간 (초 단위 → 분:초로 변환해서 표시) |
| `screenPageViews` | 페이지뷰 수 |
| `screenPageViewsPerSession` | 세션당 페이지뷰 |

### B2C 이커머스 전용

| 지표 | 설명 |
|---|---|
| `totalRevenue` | 총 매출 (₩) |
| `purchaseRevenue` | 구매 매출 |
| `transactions` | 거래(구매) 수 |
| `transactionsPerSession` | 세션당 구매율 |
| `averagePurchaseRevenue` | 평균 주문 금액 (AOV) |
| `itemsViewed` | 제품 조회 수 |
| `itemsAddedToCart` | 장바구니 추가 수 |
| `itemsPurchased` | 구매된 제품 수 |
| `cartToViewRate` | 조회→장바구니 전환율 |
| `purchaseToViewRate` | 조회→구매 전환율 |

### B2B 분석 시 중요 지표

| 지표 | 설명 |
|---|---|
| `engagementRate` | 인게이지먼트율 (이탈하지 않은 비율) |
| `engagedSessions` | 인게이지먼트 세션 수 |
| `userEngagementDuration` | 총 인게이지먼트 시간 |

---

## 기간 형식

| 표현 | 형식 |
|---|---|
| 최근 7일 | `last_7_days` |
| 최근 28일 | `last_28_days` |
| 최근 90일 | `last_90_days` |
| 이번 달 | `this_month` |
| 지난 달 | `last_month` |
| 특정 날짜 범위 | `startDate: "2026-01-01"` `endDate: "2026-01-31"` |

기간 미지정 시 기본값: `last_7_days`

---

## 출력 포맷 기본 규칙

- 표 헤더: 한국어
- 비율 수치: 소수점 둘째 자리 (예: 3.25%)
- 정수 수치: 천 단위 쉼표 (예: 12,340)
- 세션 시간: 초 → 분:초 변환 (예: 176초 → 2분 56초)
- 매출: ₩ 단위 + 천 단위 쉼표 (예: ₩1,234,000)
- 변화율: ▲ 증가 / ▼ 감소로 표시

---

## 응답 패턴

### 일반 분석 요청

1. 사이트 유형 파악 (모호한 경우 먼저 확인)
2. `run_report`로 데이터 조회
3. 마크다운 표로 정리
4. 핵심 인사이트 1~3줄 자동 추가

### 기간 비교 요청

`batch_run_reports`로 두 기간 동시 조회 → 변화율(%) 계산 → ▲▼ 기호로 표시

### B2C 이커머스 분석

매출(`totalRevenue`) 및 구매 퍼널 중심으로 분석.  
`purchase` 이벤트가 없으면 설정 여부를 확인하도록 안내.

### B2B 사이트 분석

리드 전환 이벤트 이름을 먼저 확인 후 분석.  
세션 수뿐 아니라 **체류 시간, 이탈률, 재방문율** 등 질적 지표도 함께 제시.  
소규모 사이트는 기간을 `last_90_days`로 늘려 충분한 데이터 확보.

---

## 트러블슈팅 대응

| 에러 메시지 | 원인 | 안내 |
|---|---|---|
| `GA_PROPERTY_ID is not set` | 속성 ID 미입력 | `bash setup.sh` 재실행 또는 `.mcp.json` 직접 수정 |
| `PERMISSION_DENIED` | 계정 권한 없음 | GA4 속성 액세스 관리에서 이메일 권한 확인 |
| 데이터 0행 | 기간 내 데이터 없음 | 기간을 `last_90_days`로 늘려 재시도 |
| 이커머스 지표 0 | 전자상거래 이벤트 미설정 | GA4 전자상거래 설정 확인 안내 |
| 전환 이벤트 없음 | GA4 전환 표시 미설정 | GA4 → 관리 → 이벤트 → 전환으로 표시 안내 |

---

## 분석 템플릿

`prompts/` 폴더에 유형별 분석 질문이 정리돼 있습니다.

| 파일 | 내용 |
|---|---|
| `00-first-steps.md` | 처음 시작할 때 — 환경 파악 + 유형 선택 |
| `01-weekly-channel-report.md` | 주간 채널 리포트 |
| `02-landing-pages.md` | 랜딩 페이지 분석 |
| `03-period-comparison.md` | 기간 비교 분석 |
| `04-realtime.md` | 실시간 모니터링 |
| `05-full-marketing-report.md` | 종합 마케팅 리포트 |
| `06-ecommerce-report.md` | B2C 이커머스 전용 |
| `07-b2b-report.md` | B2B 기업 웹사이트 전용 |
