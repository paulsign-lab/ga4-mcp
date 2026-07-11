# 🛠️ dataLayer · GTM 설정 (분석할 데이터를 '만드는' 단계)

01~08 프롬프트가 **이미 쌓인 GA4 데이터를 분석**하는 "분석편"이라면,
이 파일은 그 데이터를 **처음부터 만들어내는** "설정편"입니다.

> 💡 `00-first-steps.md` → Step 4에서 전환 이벤트가 **하나도 안 잡히거나 건수가 0**이라면,
> 분석할 데이터 자체가 없는 상태입니다. 그때 이 파일로 오세요.
> 사이트에 dataLayer·GTM을 심어야 `purchase`·`generate_lead` 같은 이벤트가 GA4로 흘러들어옵니다.

---

## 무엇을 하는가

이 저장소에는 `site-marketing-infra-setup` 스킬이 함께 들어 있습니다.
웹사이트 URL 하나를 주면 Claude가 사이트를 분석해서 **마케팅 인프라 4종**을 자동으로 만들어 줍니다.

| 산출물 | 내용 |
|---|---|
| `Marketing_Checklist.xlsx` | 10개 시트 마스터 체크리스트 (GA4 이벤트 매트릭스·GTM 태그맵·SEO 등) |
| `Marketing_Guide.docx` | 11파트 구현 가이드 (개념→GA4→GTM→dataLayer→Pixel→SEO→Looker) |
| `gtm_container.json` | GTM에 **Import 즉시 사용** 가능한 컨테이너 |
| `dataLayer 스니펫` | 사이트에 붙여넣는 코드 (`.liquid` Shopify / `.js` 일반) |

`dataLayer 스니펫`이 데이터를 **발생**시키고, `gtm_container.json`이 그걸 **받아 GA4·Meta로 전송**합니다.
둘 다 심어야 이후 01~08 분석 프롬프트가 볼 데이터가 생깁니다.

---

## 시작하기 — 스킬 호출

`ga4-mcp` 폴더 안에서 `claude`를 실행한 상태에서, 내 사이트 URL과 함께 아래처럼 입력하세요.

```
example.com 분석해서 마케팅 인프라 세팅해줘
```

또는 더 짧게:

```
example.com dataLayer랑 GTM 짜줘
```

스킬이 자동으로 발동해 아래 7단계를 진행합니다.

1. 사이트 크롤링 + 플랫폼 감지 (Shopify / 일반)
2. 비즈니스 모델 분류 (**B2B 리드 / D2C 이커머스**) → **사용자 확인**
3. 핵심 페이지 5~8개 SEO·URL 점검
4. 산출물 4종 생성
5. 저장 직전 최종 확인

> ⚠️ 스킬은 3개 지점에서 **반드시 사용자 확인을 요청**합니다
> (① 플랫폼·모델 감지 후 ② URL 패턴 변경 시 ③ 저장 직전).
> 잘못 분류된 채로 진행되는 걸 막기 위한 장치이니, 확인 요청이 뜨면 검토하고 답하세요.

---

## 내 사이트 유형별 — 무엇이 만들어지나

### D2C 이커머스 (제품을 직접 판매)

구매 퍼널 전체를 추적하도록 설계됩니다.

```
내 쇼핑몰 example.com 분석해서 이커머스 dataLayer랑 GTM 컨테이너 만들어줘
```

- 핵심 전환: `purchase` (+ `add_to_cart` `begin_checkout` `view_item`)
- 6단계 퍼널 이탈 분석용 이벤트 22종
- `items[]`·`value`·`coupon`·`transaction_id` 등 상품 맥락 파라미터
- ⚠️ Shopify는 자체 픽셀과 **이중 집계** 주의 (스킬이 자동으로 잡아줌)

### B2B 리드 (카탈로그·문의 중심, 판매 버튼 없음)

판매가 아니라 **리드(가치 있는 행동)**를 추적하도록 설계됩니다.

```
우리 회사 소개 사이트 example.com 분석해서 B2B 리드 트래킹 짜줘
```

- 핵심 전환: `request_quote` + `contact_form_submit` + `catalog_download_complete`
- `industry`·`inquiry_type`·`product_handle` 등 리드 맥락 커스텀 차원
- ⚠️ `purchase`·`add_to_cart`는 넣지 않음 (노이즈)

> 💡 "판매 버튼이 없는데 dataLayer가 왜 필요하냐"는 질문이 나오면:
> dataLayer는 '파는 걸' 추적하는 게 아니라 **'가치 있는 행동'을 추적**하는 것입니다.
> B2B는 그 행동이 문의·다운로드이고, D2C는 그 행동이 구매입니다.

---

## 설정 → 분석 연결 흐름

```
[이 파일 09] 사이트 분석 → dataLayer·GTM 생성 → 사이트에 설치
        ↓  (며칠~몇 주 데이터 쌓임)
[00-first-steps] 전환 이벤트 확인 → 데이터가 잡히는지 검증
        ↓
[06 / 07] 이커머스 · B2B 분석으로 성과 측정
```

설치 직후엔 데이터가 없으니, 이벤트가 GA4에 들어오기 시작하면
`00-first-steps.md` Step 4로 돌아가 정상 수집을 확인한 뒤 분석을 시작하세요.

---

## 설치 후 할 일 (스킬이 산출물과 함께 안내함)

1. `gtm_container.json` → GTM 관리 화면에서 **가져오기(Import)**
2. `dataLayer 스니펫` → 사이트 소스(Shopify 테마 / 워드프레스 등)에 붙여넣기
3. Google Search Console 소유권 확인
4. GA4 → 관리 → 이벤트에서 핵심 이벤트를 **전환(주요 이벤트)으로 표시**

이 4단계까지 끝나면 데이터가 쌓이기 시작하고, 이 저장소의 01~08 분석 프롬프트가 본격적으로 쓸모 있어집니다.
