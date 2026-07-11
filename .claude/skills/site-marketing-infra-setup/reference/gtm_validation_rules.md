# GTM 컨테이너 JSON 생성 규칙 레퍼런스

> Janibell 프로젝트(2026-05) 시행착오를 통해 정제한 GTM Import 검증 규칙 결정판.
> Google 공식 문서가 모든 enum 값과 이름 규칙을 완전히 공개하지 않아 이 레퍼런스가
> 사실상 비공식 통합 카탈로그 역할을 한다.

## 한 줄 요약

> GTM 컨테이너 JSON에는 `type` 필드가 **5가지 위치**에 등장하고, **각각 다른 형식**을
> 요구한다. 그 외에 **이름 금지문자**(`:` `<` `>` `&` `"` `'`)도 있다. 빌더는
> 저장 직전 **8-Way 사전 검증**을 통과해야 한다.

---

## 1. type 필드의 5가지 위치별 형식

GTM JSON 구조 안에서 `type` 필드가 등장하는 5가지 위치와 각각의 형식 규칙:

### 1-1. 파라미터 type — **UPPERCASE (단순)**

위치: 모든 `parameter` 객체 내부

```json
{
  "parameter": [
    { "type": "TEMPLATE",  "key": "value", "value": "G-XXX" },
    { "type": "BOOLEAN",   "key": "enabled", "value": "true" },
    { "type": "INTEGER",   "key": "count", "value": "10" },
    { "type": "LIST",      "key": "map", "list": [...] },
    { "type": "MAP",       "map": [...] }
  ]
}
```

**허용되는 값**: `TEMPLATE`, `BOOLEAN`, `INTEGER`, `LIST`, `MAP`, `TAG_REFERENCE`, `TRIGGER_REFERENCE`

### 1-2. 트리거 type — **UPPERCASE_SNAKE**

위치: `containerVersion.trigger[].type`

```json
{ "name": "All Pages", "type": "PAGEVIEW" }
{ "name": "CTA Click", "type": "CLICK" }
{ "name": "Form CE",   "type": "CUSTOM_EVENT" }
```

**허용되는 값**:

| 트리거 종류 | 정확한 enum |
|---|---|
| 페이지 뷰 | `PAGEVIEW` |
| DOM Ready | `DOM_READY` |
| Window Loaded | `WINDOW_LOADED` |
| 모든 요소 클릭 | `CLICK` |
| Just Links 클릭 | `LINK_CLICK` |
| 폼 제출 | `FORM_SUBMISSION` |
| Custom Event | `CUSTOM_EVENT` |
| YouTube 비디오 | `YOU_TUBE_VIDEO` |
| 스크롤 깊이 | `SCROLL_DEPTH` |
| 요소 가시성 | `ELEMENT_VISIBILITY` |
| JS Error | `JS_ERROR` |
| History Change | `HISTORY_CHANGE` |
| Timer | `TIMER` |
| 트리거 그룹 | `TRIGGER_GROUP` |
| 초기화 | `INIT` |
| 동의 초기화 | `CONSENT_INIT` |
| 서버 페이지뷰 | `SERVER_PAGEVIEW` |
| 항상 | `ALWAYS` |

### 1-3. 필터 조건 type — **UPPERCASE_SNAKE**

위치: `trigger[].filter[].type`, `trigger[].customEventFilter[].type`

```json
{ "filter": [
  { "type": "EQUALS",          "parameter": [...] },
  { "type": "CONTAINS",        "parameter": [...] },
  { "type": "MATCH_REGEX",     "parameter": [...] },
  { "type": "STARTS_WITH",     "parameter": [...] }
]}
```

**허용되는 값**: `EQUALS`, `CONTAINS`, `STARTS_WITH`, `ENDS_WITH`, `MATCH_REGEX`,
`LESS`, `LESS_OR_EQUALS`, `GREATER`, `GREATER_OR_EQUALS`, `CSS_SELECTOR`, `URL_MATCHES`,
그리고 위 각각의 `_CASE_INSENSITIVE` 변형.

### 1-4. 변수 type — **소문자 약어** (이건 다름!)

위치: `containerVersion.variable[].type`

```json
{ "name": "GA4 ID", "type": "c" }      // 상수 (Constant)
{ "name": "items",  "type": "v" }      // dataLayer Variable
{ "name": "lookup", "type": "smm" }    // Lookup Table
```

**허용되는 값**:

| 변수 종류 | 정확한 enum |
|---|---|
| 상수 (Constant) | `c` |
| Data Layer Variable | `v` |
| URL Variable | `u` |
| Custom JavaScript (JS Macro) | `jsm` |
| Lookup Table | `smm` |
| Regex Table | `remm` |
| 1st Party Cookie | `k` |
| DOM Element | `d` |
| JavaScript Variable | `j` |
| Random Number | `r` |
| HTTP Referrer | `f` |
| Custom Event | `e` |
| Auto-Event Variable | `aev` |
| Google Analytics Settings | `gas` |
| Google Tag (Configs) | `awec` |

### 1-5. 태그 type — **소문자 (템플릿 ID)**

위치: `containerVersion.tag[].type`

```json
{ "name": "GA4 Event", "type": "gaawe" }
{ "name": "Google Tag", "type": "googtag" }
{ "name": "Custom HTML", "type": "html" }
```

**허용되는 값**:

| 태그 종류 | 정확한 enum |
|---|---|
| Google Tag (Config) | `googtag` |
| GA4 Event | `gaawe` |
| Universal Analytics | `ua` |
| Custom HTML | `html` |
| Custom Image | `img` |
| Google Ads Conversion | `awct` |
| Google Ads Remarketing | `sp` |
| Bing Ads | `baut` |
| Conversion Linker | `cvt` |

---

## 2. 그 외 enum 필드

### 2-1. tagFiringOption — **UPPERCASE_SNAKE**

위치: `tag[].tagFiringOption`

**허용되는 값**: `ONCE_PER_EVENT`, `ONCE_PER_LOAD`, `UNLIMITED`

### 2-2. consentStatus — **UPPERCASE_SNAKE**

위치: `tag[].consentSettings.consentStatus`

**허용되는 값**: `NEEDED`, `NOT_SET`

### 2-3. usageContext — **UPPERCASE 배열**

위치: `container.usageContext`

**허용되는 값**: `["WEB"]`, `["AMP"]`, `["IOS"]`, `["ANDROID"]`, `["SERVER"]`

---

## 3. 내장 변수 (BuiltInVariableType) — **공식 카탈로그**

위치: `containerVersion.builtInVariable[].type`

GTM API v2 공식 enum 카탈로그. **이 리스트에 없는 값은 절대 넣지 말 것.**

### 페이지·이벤트

```
PAGE_URL, PAGE_HOSTNAME, PAGE_PATH
REFERRER, EVENT, EVENT_NAME
FIRST_PARTY_SERVING_URL, QUERY_STRING, HTML_ID
```

### 클릭

```
CLICK_ELEMENT, CLICK_CLASSES, CLICK_ID, CLICK_TARGET, CLICK_URL, CLICK_TEXT
```

### 폼

```
FORM_ELEMENT, FORM_CLASSES, FORM_ID, FORM_TARGET, FORM_URL, FORM_TEXT
```

### 히스토리

```
HISTORY_SOURCE, NEW_HISTORY_URL, OLD_HISTORY_URL,
NEW_HISTORY_FRAGMENT, OLD_HISTORY_FRAGMENT,
NEW_HISTORY_STATE, OLD_HISTORY_STATE
```

### 비디오 — **주의: VIDEO_ELAPSED_TIME은 존재하지 않음**

```
VIDEO_CURRENT_TIME, VIDEO_DURATION, VIDEO_PERCENT,
VIDEO_PROVIDER, VIDEO_STATUS, VIDEO_TITLE, VIDEO_URL, VIDEO_VISIBLE
```

### 스크롤·가시성

```
SCROLL_DEPTH_THRESHOLD, SCROLL_DEPTH_UNITS, SCROLL_DEPTH_DIRECTION
ELEMENT_VISIBILITY_RATIO, ELEMENT_VISIBILITY_TIME,
ELEMENT_VISIBILITY_FIRST_TIME, ELEMENT_VISIBILITY_RECENT_TIME
```

### 에러·디버그·컨테이너

```
ERROR_MESSAGE, ERROR_URL, ERROR_LINE
CONTAINER_VERSION, DEBUG_MODE, RANDOM_NUMBER, CONTAINER_ID, ENVIRONMENT_NAME
```

### 디바이스·플랫폼

```
DEVICE_NAME, LANGUAGE, OS_VERSION, PLATFORM, RESOLUTION, USER_AGENT, VISITOR_REGION
```

### 모바일 앱 (보통 안 씀)

```
APP_ID, APP_NAME, APP_VERSION_CODE, APP_VERSION_NAME, APP_INSTANCE_ID, SDK_VERSION
ADVERTISER_ID, ADVERTISING_TRACKING_ENABLED
```

### AMP (Accelerated Mobile Pages, 거의 안 씀)

```
AMP_BROWSER_LANGUAGE, AMP_CANONICAL_HOST, AMP_CANONICAL_PATH, AMP_CANONICAL_URL,
AMP_CLIENT_ID, AMP_CLIENT_MAX_SCROLL_X, AMP_CLIENT_MAX_SCROLL_Y,
AMP_CLIENT_SCREEN_HEIGHT, AMP_CLIENT_SCREEN_WIDTH,
AMP_CLIENT_SCROLL_X, AMP_CLIENT_SCROLL_Y, AMP_CLIENT_TIMESTAMP, AMP_CLIENT_TIMEZONE,
AMP_GTM_EVENT, AMP_PAGE_DOWNLOAD_TIME, AMP_PAGE_LOAD_TIME, AMP_PAGE_VIEW_ID,
AMP_REFERRER, AMP_TITLE, AMP_TOTAL_ENGAGED_TIME
```

### 서버 GTM (sGTM)

```
CLIENT_NAME, REQUEST_METHOD, REQUEST_PATH,
SERVER_PAGE_LOCATION_URL, SERVER_PAGE_LOCATION_PATH, SERVER_PAGE_LOCATION_HOSTNAME
```

**우리 컨테이너 표준 lean 세트 (실제로 사용하는 것만)**

대부분의 B2B/D2C 사이트는 다음 30개로 충분:

```
PAGE_URL, PAGE_HOSTNAME, PAGE_PATH,
REFERRER, EVENT,
CLICK_ELEMENT, CLICK_CLASSES, CLICK_ID, CLICK_TARGET, CLICK_URL, CLICK_TEXT,
FORM_ELEMENT, FORM_CLASSES, FORM_ID, FORM_TARGET, FORM_URL, FORM_TEXT,
HISTORY_SOURCE, NEW_HISTORY_FRAGMENT, OLD_HISTORY_FRAGMENT, NEW_HISTORY_STATE, OLD_HISTORY_STATE,
VIDEO_CURRENT_TIME, VIDEO_DURATION, VIDEO_PERCENT,
VIDEO_PROVIDER, VIDEO_STATUS, VIDEO_TITLE, VIDEO_URL, VIDEO_VISIBLE
```

---

## 4. 이름 필드 규칙

태그 / 트리거 / 변수 / 폴더의 `name` 필드는 다음 문자를 **포함할 수 없음**:

```
:  <  >  &  "  '
```

### 안전한 이름 패턴

- 영문자 + 숫자 + 공백
- 하이픈 `-`
- 언더스코어 `_`
- 괄호 `(` `)`
- 슬래시 `/`
- 한글
- 유니코드 기호 일부 (예: ★) — 보통 OK이지만 100% 안전하다고 보장 X

### 흔한 실수

```
❌ "Phone Click (tel:)"          ← 콜론
❌ "Email Click (mailto:)"        ← 콜론
❌ "<Click>"                       ← 꺽쇠
❌ "A & B Click"                   ← 앰퍼샌드

✓ "Phone Click (tel)"
✓ "Email Click (mailto)"
✓ "Click - A and B"
```

---

## 5. 빌더 사전 검증 — 8-Way Validator

`build_gtm.py`의 마지막 단계에 있는 자가 검증. **저장 전에 모두 통과해야 함.**

1. 트리거 type ∈ 18가지 GTM 정식 값
2. 필터 type ∈ 16가지 GTM 정식 값
3. 변수 type ∈ 15가지 GTM 정식 약어
4. 태그 type ∈ 9가지 GTM 정식 템플릿 ID
5. 내장 변수 type ∈ 80+ 공식 카탈로그
6. 파라미터 type ∈ 7가지 UPPERCASE 단순값
7. tagFiringOption ∈ 3가지 값
8. **모든 name 필드에 금지문자(:<>&"') 없음**

검증 통과 시 `✓ 사전 검증 통과` 출력. 실패 시 `raise SystemExit`로 빌드 중단
→ 사용자에게 잘못된 파일이 도달하지 못 함.

---

## 6. JSON 최상위 구조

표준 GTM 컨테이너 export 형식:

```json
{
  "exportFormatVersion": 2,
  "exportTime": "2026-05-20T14:00:00.000Z",
  "containerVersion": {
    "accountId":      "1234567890",
    "containerVersionId": "0",
    "container": {
      "accountId":   "1234567890",
      "containerId": "9876543210",
      "name":        "site.com",
      "publicId":    "GTM-XXXXXX",
      "usageContext": ["WEB"],
      "fingerprint": "1",
      ...
    },
    "tag":      [ /* 태그들 */ ],
    "trigger":  [ /* 트리거들 */ ],
    "variable": [ /* 변수들 */ ],
    "folder":   [ /* 폴더들 */ ],
    "builtInVariable": [ /* 내장 변수들 */ ],
    "fingerprint": "1",
    "tagManagerUrl": "https://tagmanager.google.com/..."
  }
}
```

---

## 7. ID 필드 — placeholder OK

`accountId`, `containerId`, `tagId`, `triggerId`, `variableId`, `folderId`,
`fingerprint`는 Import 시 GTM이 자동으로 재할당함. 빌더는 placeholder
(`"1234567890"`, `"1"`, `"100"` 등)만 채워두면 충분.

`exportFormatVersion`은 반드시 `2`.

---

## 8. 참고 자료

- GTM API v2 Reference: https://developers.google.com/tag-platform/tag-manager/api/v2
- BuiltInVariableType enum:
  https://developers.google.com/tag-platform/tag-manager/api/v2/reference/accounts/containers/workspaces/built_in_variables
- Tag enum (templateId):
  https://developers.google.com/tag-platform/tag-manager/api/v2/reference/accounts/containers/workspaces/tags

단, **공식 문서는 이 레퍼런스만큼 자세하지 않음**. import 검증의 실제 규칙은
GTM Admin UI에서 직접 시도하며 발견해야 하는 부분이 있어서 위 1~5번 섹션이
실전에서 더 유용함.
