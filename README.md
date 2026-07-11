# GA4 MCP for Claude Code

> GA4 데이터를 **자연어 한 줄**로 조회하고, 결과를 **Google Sheets에 자동 저장**하는 Claude Code 연동 가이드.  
> 여기에 더해, 웹사이트 URL 하나로 **dataLayer·GTM 추적 설정을 자동 설계**하는 스킬까지 함께 들어 있습니다.  
> 설치 시간: 약 10분 · 주간 채널 리포트: 30초 · 채널별 시트 자동 생성: 1분

## 이 저장소가 하는 두 가지

이 저장소는 GA4를 두 방향에서 다룹니다. **데이터를 만드는 쪽**과 **데이터를 읽는 쪽**입니다.

| 축 | 하는 일 | 언제 | 사용 |
|---|---|---|---|
| 🛠️ **설정** | 사이트 분석 → dataLayer·GTM·SEO 산출물 생성 | 추적이 아직 없을 때 | `site-marketing-infra-setup` 스킬 (`prompts/09`) |
| 📊 **분석** | 이미 쌓인 GA4 데이터를 자연어로 조회·리포트 | 데이터가 쌓인 뒤 | GA4 MCP + `prompts/00~08` |

흐름은 이렇습니다. **설정**으로 사이트에 추적 코드를 심어 데이터가 쌓이게 만든 다음,
며칠~몇 주 뒤 **분석**으로 그 성과를 읽습니다.

- 판매하는 쇼핑몰(**D2C**)이든, 카탈로그·문의 중심의 **B2B** 기업 사이트든 각각에 맞는 dataLayer가 설계됩니다.
- dataLayer는 "파는 것"이 아니라 **"가치 있는 행동"**을 추적합니다 — D2C는 구매, B2B는 문의·다운로드.

> 이 스킬 하나만 따로 쓰는 방법과 산출물 상세는 [.claude/skills/site-marketing-infra-setup/README.md](.claude/skills/site-marketing-infra-setup/README.md)를 보세요.

## 이렇게 달라집니다

| 작업 | 전 | 후 |
|---|---|---|
| 주간 채널별 리포트 | GA4 클릭 + CSV + 표 정리 · 60분 | 자연어 한 줄 · 30초 |
| 랜딩 페이지 TOP 10 | 10분 | 30초 |
| 이번 주 vs 지난 주 비교 | 10분 | 1분 |
| 실시간 활성 사용자 확인 | GA4 탭 열기 | 5초 |
| 이커머스 매출·퍼널 분석 | 30분 | 1분 |
| B2B 리드·카탈로그 다운로드 분석 | 30분 | 1분 |
| GA4 데이터 → Google Sheets 표·그래프 | 수동 복사 + 서식 작업 · 30분 | 자연어 한 줄 · 1분 |

---

## 준비물

| 항목 | 확인 방법 |
|---|---|
| **Node.js 18+** | `node --version` (없으면 [nodejs.org](https://nodejs.org) LTS 설치) |
| **GA4 속성 ID** | analytics.google.com → 왼쪽 하단 ⚙ 관리 → 속성 설정 → 오른쪽 상단 '속성 ID' (숫자 9자리) |
| **GA4용 GCP OAuth 클라이언트 JSON** | 회사 Google Workspace 계정 필수 · 개인 Gmail은 선택 ([발급 방법 →](docs/gcp-setup-guide.md)) |
| **Sheets용 GCP OAuth 클라이언트 JSON** | Google Sheets MCP 사용 시 필요 · GA4와 별도 발급 ([발급 방법 →](docs/sheets-gcp-setup.md)) |

---

## 설치 (3단계 · 약 10분)

### 0단계 · GCP 인증 준비 (처음이라면)

구글 계정 인증이 처음이라면 setup.sh 실행 전에 먼저 읽어보세요.

| 용도 | 가이드 |
|---|---|
| **GA4 연동** (필수) | [docs/gcp-setup-guide.md](docs/gcp-setup-guide.md) |
| **Google Sheets 연동** (선택) | [docs/sheets-gcp-setup.md](docs/sheets-gcp-setup.md) |

→ 각 가이드에서 GCP 콘솔 API 활성화 + OAuth 클라이언트 발급 방법을 단계별로 안내합니다.

### 1단계 · 클론

```bash
git clone https://github.com/paulsign-lab/ga4-mcp.git
cd ga4-mcp
```

### 2단계 · 자동 설치 실행

**macOS / Linux:**
```bash
bash setup.sh
```

**Windows (PowerShell):**
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\setup.ps1
```

스크립트가 순서대로 처리합니다.

1. Node.js 버전 확인
2. gcloud CLI 설치 (없으면 자동 설치 · 약 2분)
3. Google 계정 인증 (브라우저 OAuth 1회 클릭)
4. GA4 속성 ID 입력 → `.mcp.json` 자동 등록
5. Google Sheets MCP 설정 (OAuth JSON 감지 시 자동 · 없으면 건너뜀)

### 3단계 · Claude Code 실행

```bash
claude
```

> 반드시 `ga4-mcp` 폴더 안에서 실행해야 합니다.  
> `.mcp.json`이 이 폴더에 있어야 GA4 MCP가 자동 연결됩니다.

연결 확인:

```
/mcp
```

`ga4 · Connected` 와 `google-sheets · Connected` 가 보이면 완료입니다.  
(Sheets 설정을 건너뛴 경우 ga4만 표시됩니다)

---

## 처음 시작할 때

`prompts/00-first-steps.md` 파일을 열어 아래 순서로 진행하세요.

1. GA4 연결 확인
2. 기본 데이터 확인
3. **내 사이트 유형 선택** (이커머스 / B2B / 일반)
4. 전환 이벤트 확인

> 💡 4번에서 **전환 이벤트가 하나도 없다면** 아직 추적이 설정되지 않은 것입니다.
> 분석할 데이터가 없으니, 먼저 아래 "추적 설정하기"로 dataLayer·GTM을 심으세요.

---

## 추적 설정하기 (dataLayer · GTM) — 🛠️ 설정편

분석할 데이터가 아직 없다면, `ga4-mcp` 폴더에서 `claude`를 실행한 뒤 내 사이트 URL을 주세요.
포함된 `site-marketing-infra-setup` 스킬이 사이트를 분석해 추적 인프라 4종을 만들어 줍니다.

```
example.com 분석해서 마케팅 인프라 세팅해줘
```

| 산출물 | 내용 |
|---|---|
| `Marketing_Checklist.xlsx` | GA4 이벤트 매트릭스·GTM 태그맵·SEO 등 10개 시트 |
| `Marketing_Guide.docx` | 개념→GA4→GTM→dataLayer→Pixel→SEO 11파트 가이드 |
| `gtm_container.json` | GTM에 **Import 즉시 사용** 가능한 컨테이너 |
| `dataLayer 스니펫` | 사이트에 붙여넣는 코드 (`.liquid` Shopify / `.js` 일반) |

- **D2C 이커머스**: `purchase` 중심 구매 퍼널 22종 이벤트 (`items[]`·`value`·`coupon`)
- **B2B 리드**: `request_quote`·`contact_form_submit`·`catalog_download_complete` 중심 (판매 이벤트 제외)

자세한 사용법은 `prompts/09-datalayer-gtm-setup.md`.

---

## 웹사이트 유형별 분석 파일

| 내 사이트 유형 | 파일 | 주요 내용 |
|---|---|---|
| 온라인 쇼핑몰·이커머스 | `prompts/06-ecommerce-report.md` | 매출, 구매 전환율, 장바구니 이탈, AOV, 제품별 성과 |
| B2B 기업 웹사이트 (카탈로그·문의) | `prompts/07-b2b-report.md` | 리드 수, 카탈로그 다운로드, 체류 시간, 재방문율 |
| 채널·트래픽 분석 중심 | `prompts/01` ~ `05` | 주간 리포트, 랜딩 분석, 기간 비교, 종합 리포트 |

---

## 바로 쓸 수 있는 분석 질문

### 기본 리포트

```
지난 7일 채널별 세션 수와 전환 수를 표로 정리해줘
```
```
지난 28일 랜딩 페이지 TOP 10을 이탈률 포함해서 보여줘
```
```
이번 주 오가닉 트래픽이 지난 주 대비 몇 % 변화했어?
```

### 이커머스

```
지난 28일 채널별 매출과 구매 전환율을 표로 정리해줘
```
```
지난 28일 장바구니 이탈 분석해줘 — 단계별 이탈률 포함해서
```

### B2B 기업 사이트

```
지난 28일 채널별 리드 발생 수와 리드 전환율을 표로 정리해줘
```
```
지난 28일 카탈로그 다운로드가 가장 많이 발생한 페이지 TOP 5 알려줘
```

### 실시간

```
지금 내 사이트 활성 사용자 몇 명이야? 어떤 페이지 보고 있어?
```

### Google Sheets 연동 (Sheets MCP 설정 시)

```
지난 7일 채널별 세션 수와 전환 수를 GA4에서 가져와서
새 구글 시트를 만들어 표로 정리해줘. 헤더는 파란 배경으로 서식 적용해줘.
```
```
지난 28일 채널별 매출 데이터를 Google Sheets로 내보내고
이탈률이 높은 행은 빨간 배경으로 강조해줘.
```
```
GA4 주간 리포트를 4개 탭(요약·채널·랜딩·디바이스)으로 자동 생성해줘.
```

> 더 많은 연동 예시: `prompts/08-ga4-to-sheets.md`

---

## 트러블슈팅

### `차단된 앱` (브라우저 인증 화면)

회사 Google Workspace 계정이고 GCP OAuth 클라이언트가 없을 때 발생합니다.  
→ [docs/gcp-setup-guide.md](docs/gcp-setup-guide.md) 완료 후 재실행

### `GA_PROPERTY_ID is not set`

`.mcp.json`에 속성 ID가 입력되지 않은 상태입니다.  
→ `bash setup.sh` 재실행 (속성 ID 입력 단계에서 입력)  
또는 `.mcp.json`을 직접 열어 수정 후 Claude Code 재시작

### `PERMISSION_DENIED`

인증 계정이 해당 GA4 속성에 접근 권한이 없습니다.  
→ analytics.google.com → 관리 → 속성 액세스 관리 → 본인 이메일 권한 확인

### `mcp__ga4__*` 도구가 보이지 않음

`ga4-mcp` 폴더 안에서 `claude`를 실행했는지 확인하세요.  
→ `cd ga4-mcp && claude` 후 `/mcp` 입력

### `mcp__google-sheets__*` 도구가 보이지 않음

1. `mcp-server/oauth_credentials.json` 파일이 있는지 확인  
   → 없으면 `bash setup.sh` 재실행 (Sheets OAuth JSON이 Downloads에 있어야 함)
2. `mcp-server/node_modules/` 폴더가 있는지 확인  
   → 없으면 `cd mcp-server && npm install`
3. Claude Code 완전 종료 후 재시작 → 브라우저 인증 팝업 완료

### 브라우저 인증 창이 안 열림 (Sheets MCP)

터미널 출력에 URL이 표시됩니다. 복사해서 브라우저 주소창에 직접 붙여넣기하세요.

### 데이터가 없음 (행 0개)

기간 내 트래픽 데이터가 없을 수 있습니다.  
→ "지난 90일" 로 기간을 늘려 다시 질문해보세요

### `invalid_grant` 또는 `reauth required`

ADC 토큰이 만료됐습니다.  
→ `bash setup.sh` 재실행 후 y 입력하여 재인증

---

## 파일 구조

```
ga4-mcp/
├── README.md                          이 문서
├── .mcp.json                          MCP 서버 설정 (Claude Code 자동 로드)
├── .gitignore
├── setup.sh                           macOS / Linux 자동 설치
├── setup.ps1                          Windows 자동 설치 (PowerShell)
├── CLAUDE.md                          Claude 컨텍스트 (분석/설정 라우팅 + MCP 도구 목록)
├── .claude/
│   └── skills/
│       └── site-marketing-infra-setup/   🛠️ dataLayer·GTM 설정 스킬
│           ├── SKILL.md                   스킬 작업 매뉴얼 (7단계 워크플로우)
│           ├── playbooks/                 b2b_lead.md · d2c_ecommerce.md
│           ├── templates/                 dataLayer 스니펫 · GTM 베이스
│           ├── scripts/                   xlsx · docx · GTM JSON 빌더
│           ├── reference/                 플랫폼·모델 감지, GTM 검증 규칙
│           └── examples/                  Janibell 산출물 예시 (품질 기준)
├── docs/
│   ├── gcp-setup-guide.md             GA4용 Google Cloud 인증 가이드
│   └── sheets-gcp-setup.md            Google Sheets MCP 인증 가이드
├── mcp-server/                        Google Sheets MCP 서버
│   ├── index.js                       MCP 서버 (10개 도구)
│   ├── package.json
│   ├── .gitignore
│   └── oauth_credentials.json         (setup.sh이 자동 생성 · gitignore됨)
└── prompts/
    ├── 00-first-steps.md              처음 시작할 때 — 환경 파악 + 유형 선택
    ├── 01-weekly-channel-report.md    주간 채널별 리포트
    ├── 02-landing-pages.md            랜딩 페이지 분석
    ├── 03-period-comparison.md        기간 비교 분석
    ├── 04-realtime.md                 실시간 모니터링
    ├── 05-full-marketing-report.md    종합 마케팅 리포트
    ├── 06-ecommerce-report.md         B2C 이커머스 전용
    ├── 07-b2b-report.md               B2B 기업 웹사이트 전용
    ├── 08-ga4-to-sheets.md            GA4 → Google Sheets 연동 활용
    └── 09-datalayer-gtm-setup.md      🛠️ dataLayer·GTM 설정 (스킬 호출)
```

> 🛠️ **설정편**(`.claude/skills/` + `prompts/09`)은 추적을 새로 심는 단계,
> 📊 **분석편**(`prompts/00~08`)은 쌓인 데이터를 읽는 단계입니다.
> `ga4-mcp` 폴더 안에서 `claude`를 실행하면 두 축이 한 세션에서 모두 작동합니다.

---

## 사용 패키지

### GA4 MCP

| 항목 | 값 |
|---|---|
| 패키지 | `mcp-server-ga4` (npm · MIT) |
| 실행 | `npx -y mcp-server-ga4` (별도 설치 불필요) |
| 인증 | Google ADC (gcloud CLI 발급) |
| 노출 도구 | `run_report` · `batch_run_reports` · `get_realtime_data` · `list_metrics` · `list_dimensions` |
| 필요 환경 | Node.js 18+ · gcloud CLI |

### Google Sheets MCP

| 항목 | 값 |
|---|---|
| 구현 | 자체 구현 MCP 서버 (`mcp-server/index.js`) |
| 인증 | OAuth 2.0 Desktop App (첫 실행 시 브라우저 1회 인증) |
| 노출 도구 | `get_spreadsheet_info` · `read_sheet` · `write_sheet` · `append_sheet` · `create_spreadsheet` · `format_cells` 등 10개 |
| 필요 환경 | Node.js 18+ · `mcp-server/oauth_credentials.json` |

> GA4 MCP는 Python/pipx 없이 Node.js만으로 실행됩니다. (이전 버전 `analytics-mcp` PyPI 대체)
