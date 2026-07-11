# site-marketing-infra-setup

URL 하나로 마케팅 인프라 패키지(GA4 이벤트 설계 + GTM 컨테이너 JSON + dataLayer
스니펫 + SEO 체크리스트 + 구현 가이드) 4종을 자동 생성하는 Claude 스킬.

## 무엇을 할 수 있는가

```
사용자: "janibell.com 분석해서 GA4 세팅해줘"
       ↓
Claude (이 스킬을 켜고)
  1. Chrome MCP로 5~8개 핵심 페이지 크롤링
  2. 플랫폼 자동 감지 (Shopify / Generic)
  3. 비즈니스 모델 분류 (B2B Lead / D2C E-commerce) → 사용자 확인
  4. 페이지별 SEO 진단 + URL 핸들 점검
  5. 산출물 4종 자동 생성
       ↓
산출물:
  · Marketing_Checklist.xlsx (10 시트)
  · Marketing_Guide.docx (11 파트)
  · gtm_container.json (Import 즉시 사용)
  · dataLayer_snippet.liquid 또는 .js
```

## 설치

이 스킬은 두 위치에 둘 수 있습니다.

### 방법 A — 사용자 스킬 (모든 프로젝트에서 자동 인식)

```bash
mkdir -p ~/.claude/skills/
cp -r site-marketing-infra-setup ~/.claude/skills/
```

설치 후 Claude/Cowork를 재시작하면 어느 프로젝트에서든 URL만 던지면 작동합니다.

### 방법 B — 전용 프로젝트 (Git 관리, 외부 공유)

```bash
mkdir -p ~/Documents/Claude/Projects/Marketing_Infra_Skill
mv site-marketing-infra-setup ~/Documents/Claude/Projects/Marketing_Infra_Skill/
cd ~/Documents/Claude/Projects/Marketing_Infra_Skill
git init && git add . && git commit -m "Initial skill bundle"
```

이 방식은 스킬을 수정·버전 관리하기 좋지만, 사용 시 해당 프로젝트를 열어야
합니다.

### 방법 C — 둘 다 (Recommended)

마스터본은 전용 프로젝트(B)에 두고, 사용자 스킬 폴더(A)에 심볼릭 링크:

```bash
# 전용 프로젝트에 마스터 보관
mv site-marketing-infra-setup ~/Documents/Claude/Projects/Marketing_Infra_Skill/

# 사용자 스킬 폴더에 링크
ln -s ~/Documents/Claude/Projects/Marketing_Infra_Skill/site-marketing-infra-setup \
      ~/.claude/skills/site-marketing-infra-setup
```

이러면 전용 프로젝트에서 수정해도 ~/.claude/skills/에 즉시 반영되고,
어느 프로젝트에서든 호출 가능합니다.

## 폴더 구조

```
site-marketing-infra-setup/
├── SKILL.md                          # Claude가 읽는 작업 매뉴얼
├── README.md                         # 이 파일
│
├── playbooks/
│   ├── b2b_lead.md                   # B2B 리드 사이트 이벤트 설계
│   └── d2c_ecommerce.md              # D2C 이커머스 이벤트 설계
│
├── templates/
│   ├── shopify_dataLayer.liquid      # Shopify Liquid 템플릿
│   ├── generic_dataLayer.js          # 비Shopify용 순수 JS
│   └── gtm_container_base.json       # GTM 컨테이너 베이스
│
├── scripts/
│   ├── build_xlsx.py                 # 체크리스트 생성
│   ├── build_docx.js                 # 가이드 생성
│   └── build_gtm.py                  # GTM JSON 생성
│
├── reference/
│   ├── platform_detection.md         # Shopify/WP/Webflow 자동 식별
│   ├── business_model_detection.md   # B2B vs D2C 식별 휴리스틱
│   ├── url_handle_patterns.md        # Pattern A 키워드 URL 가이드
│   └── ga4_event_naming_conventions.md
│
└── examples/
    ├── janibell_b2b.example.md       # Janibell 사례 (참고용 결과물)
    └── janibell_b2b.config.json      # config 구조 예시
```

## 어떻게 호출되는가

스킬 트리거 키워드 (description에 박혀 있어 자동 인식):

- "{URL} 분석"
- "{URL} GA4 세팅"
- "{URL} GTM"
- "dataLayer"
- "이 사이트의 마케팅 인프라"
- "추적 코드 설치 도와줘"
- "리드 트래킹 설계"
- "이커머스 추적"

명시적으로 호출하고 싶다면 메시지에 `/site-marketing-infra-setup`이라고 적어도
됩니다.

## 지원 범위 (v1.0)

| 영역 | 지원 |
|---|---|
| 플랫폼 | Shopify, Generic JS (다른 모든 플랫폼) |
| 비즈니스 모델 | B2B 리드, D2C 이커머스 |
| 언어 | 한국어 가이드, 영어 사이트 카피 |
| 외부 도구 | Chrome MCP (있으면 우선), WebFetch (폴백) |

확장 우선순위 (필요 시 추가):
- WordPress / WooCommerce 전용 템플릿
- Webflow 전용 템플릿
- SaaS 가입 모델 playbook (trial / retention 중심)
- Content / Media playbook (scroll / share / time-on-page 중심)
- Meta Conversion API (서버사이드) 변형

## 첫 실행 가이드

설치 후 가장 안전한 첫 실행은 작은 사이트로 dry-run:

```
"https://example-small-store.com 마케팅 인프라 패키지 만들어줘"
```

스킬이 자동으로 발동되어 위 7단계를 따라가며, 사용자에게 3번의 확인을 요청
(플랫폼·모델 / URL 패턴 / 저장 직전)합니다.

## Janibell 참고 사례

이 스킬의 산출물 품질을 미리 확인하려면 `examples/janibell_b2b.example.md`를
보세요. 이 스킬이 어떤 사이트에 작동했을 때 무엇이 나오는지 한 페이지에
요약되어 있습니다.

## 라이센스

MIT
