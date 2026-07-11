# GTM 컨테이너 Import 실패-수정 연대기

> Janibell 프로젝트(2026-05) 진행 중 발생한 8번의 GTM Import 에러와 각 원인·해결.
> 다음 프로젝트에서 비슷한 에러 메시지가 보이면 즉시 어디를 봐야 할지 알 수 있도록 정리.

## 빠른 찾기 — 에러 메시지별 인덱스

| 에러 메시지에 들어 있는 키워드 | 원인 | 해결 섹션 |
|---|---|---|
| `Error deserializing enum type [Type]. Unrecognized value [template]` | 파라미터 type이 소문자 | §1 |
| `Error deserializing enum type [TagFiringOption]. Unrecognized value [oncePerEvent]` | tagFiringOption camelCase | §2 |
| `Error deserializing enum type [EventType]. Unrecognized value [pageview]` | 트리거 type camelCase | §3 |
| `Error deserializing enum type [BuiltInVariableType]. Unrecognized value [pageUrl]` | 내장 변수 type camelCase | §4 |
| `Error deserializing enum type [BuiltInVariableType]. Unrecognized value [VIDEO_ELAPSED_TIME]` | GTM에 없는 enum 값 | §5 |
| `The name contains invalid character: ":"` | 이름에 금지문자 | §6 |
| (필터 type 미해결 시 가능) `Unrecognized value [matchRegex]` | 필터 type camelCase | §7 |
| (consent 미해결 시 가능) `Unrecognized value [needed]` | consentStatus camelCase | §8 |
| Klaviyo 이벤트가 GTM에서 안 잡힘 / catalog CTA가 누락됨 | SDK dispatch 타깃 + 정규식 패턴 | §9 |

---

## §1. 파라미터 type 소문자 에러 (첫 번째 발견)

**에러 메시지**
```
Error deserializing enum type [Type]. Unrecognized value [template].
```

**원인** — JSON 안의 `parameter` 객체의 `type` 필드가 `"template"`, `"boolean"`,
`"integer"`, `"list"`, `"map"` 같은 소문자로 들어가 있었음.

**해결** — 모두 UPPERCASE로 변환

```diff
- { "type": "template", "key": "value", "value": "G-XXX" }
+ { "type": "TEMPLATE", "key": "value", "value": "G-XXX" }
```

**build_gtm.py 적용 위치** — `_PARAM_TYPE_ENUMS` 세트 + `_TYPE_MAP` 매핑, `_normalize_node()` 함수에서 처리.

---

## §2. tagFiringOption camelCase 에러 (두 번째)

**에러 메시지**
```
Error deserializing enum type [TagFiringOption]. Unrecognized value [oncePerEvent].
```

**원인** — `tag[].tagFiringOption` 필드가 camelCase `"oncePerEvent"`로 들어가 있었음.

**해결** — UPPERCASE_SNAKE_CASE로 변환

```diff
- "tagFiringOption": "oncePerEvent"
+ "tagFiringOption": "ONCE_PER_EVENT"
```

**유효한 값**: `ONCE_PER_EVENT`, `ONCE_PER_LOAD`, `UNLIMITED`

**build_gtm.py 적용 위치** — `add_tag()` 함수의 기본값 + `_ENUM_FIELD_MAP`.

---

## §3. 트리거 EventType camelCase 에러 (세 번째)

**에러 메시지**
```
Error deserializing enum type [EventType]. Unrecognized value [pageview].
```

**원인** — `trigger[].type` 필드가 camelCase `"pageview"`, `"customEvent"`,
`"linkClick"` 등으로 들어가 있었음.

**해결** — `_TRIGGER_TYPE_MAP`으로 일괄 변환

```diff
- "type": "pageview"
+ "type": "PAGEVIEW"

- "type": "customEvent"
+ "type": "CUSTOM_EVENT"

- "type": "linkClick"
+ "type": "LINK_CLICK"
```

**build_gtm.py 적용 위치** — `_TRIGGER_TYPE_MAP` 딕셔너리. `add_trigger()` 시점에 자동 변환되거나, `_normalize_node()`가 `context="trigger"`일 때 처리.

---

## §4. 내장 변수 type camelCase 에러 (네 번째)

**에러 메시지**
```
Error deserializing enum type [BuiltInVariableType]. Unrecognized value [pageUrl].
```

**원인** — `builtInVariable[].type` 필드가 camelCase `"pageUrl"`, `"clickElement"` 등으로 들어가 있었음.

**해결** — 모두 UPPERCASE_SNAKE로 변환

```diff
- { "type": "pageUrl" }
+ { "type": "PAGE_URL" }

- { "type": "clickElement" }
+ { "type": "CLICK_ELEMENT" }
```

**build_gtm.py 적용 위치** — `_BUILTIN_TYPES` 리스트.

---

## §5. 존재하지 않는 enum 값 (다섯 번째) ★

**에러 메시지**
```
Error deserializing enum type [BuiltInVariableType]. Unrecognized value [VIDEO_ELAPSED_TIME].
```

**원인** — 가장 까다로웠던 케이스. `VIDEO_ELAPSED_TIME`은 UPPERCASE_SNAKE 형식이지만,
**GTM의 BuiltInVariableType enum에 아예 존재하지 않는 값**이었음. 빌더가 자체
리스트와만 비교하니 못 잡았음.

**해결** — GTM API 공식 카탈로그를 외부 권위로 가져와서 검증

```python
_GTM_OFFICIAL_BUILTIN_ENUM = {  # 외부 카탈로그
    "PAGE_URL", "PAGE_HOSTNAME", ...,
    # VIDEO_ELAPSED_TIME 없음 (존재하지 않는 값이라 빠짐)
    "VIDEO_CURRENT_TIME", "VIDEO_DURATION", "VIDEO_PERCENT",
    "VIDEO_PROVIDER", "VIDEO_STATUS", "VIDEO_TITLE", "VIDEO_URL", "VIDEO_VISIBLE",
    ...
}

_invalid_builtins = _known_builtin_types - _GTM_OFFICIAL_BUILTIN_ENUM
if _invalid_builtins:
    raise SystemExit(f"빌더 자체 오류: {_invalid_builtins}")
```

**교훈** — **검증자는 자기 자신의 리스트가 아닌 외부 권위(공식 enum 카탈로그)와
대조해야 의미가 있다.**

**build_gtm.py 적용 위치** — `_GTM_OFFICIAL_BUILTIN_ENUM` 세트 + 빌드 시작 시 즉시 검증.

---

## §6. 이름 금지문자 (여섯 번째)

**에러 메시지**
```
The name contains invalid character: ":".
```

**원인** — 트리거 이름에 `:` 콜론이 포함됨. 우리는 `"Phone Click (tel:)"`,
`"Email Click (mailto:)"`로 짓는 게 직관적이라 생각했지만 GTM은 이름 필드에서 콜론을 금지함.

**해결**

```diff
- "Phone Click (tel:)"
+ "Phone Click (tel)"

- "Email Click (mailto:)"
+ "Email Click (mailto)"
```

**금지 문자 전체**: `:` `<` `>` `&` `"` `'`

**build_gtm.py 적용 위치** — `_INVALID_NAME_CHARS = set(':<>&"')`. 모든 tag/trigger/variable/folder의 name 검증.

---

## §7. 필터 type (가능성)

**우리 프로젝트에선 사전 예방으로 미발생**

**원인 (예측)** — `trigger[].filter[].type`이 `"matchRegex"`, `"startsWith"` 같은
camelCase로 들어가면 GTM이 거부.

**해결** — `_FILTER_TYPE_MAP`으로 일괄 변환

```python
_FILTER_TYPE_MAP = {
    "equals":     "EQUALS",
    "contains":   "CONTAINS",
    "startsWith": "STARTS_WITH",
    "matchRegex": "MATCH_REGEX",
    ...
}
```

§3와 같이 트리거 작업 시 한 번에 변환하면 자동 예방.

---

## §8. consentStatus (예측)

**우리 프로젝트에선 미발생 (consentSettings를 안 씀)**

**원인 (예측)** — `tag[].consentSettings.consentStatus`가 `"needed"`로 들어가면 GTM이 거부. UPPERCASE 필요.

**해결**

```diff
- "consentStatus": "needed"
+ "consentStatus": "NEEDED"
```

`_ENUM_FIELD_MAP`에 미리 박아둠.

---

## §9. 런타임 이벤트 캡처 실패 (아홉 번째)

JSON import는 통과했지만, **실제 사이트에서 이벤트가 GTM dataLayer에 안 잡히는** 케이스. import 에러와 다른 층위의 사고로, 빌드 후 라이브 검증 단계에서 발견됨.

### 9-1. Klaviyo 최신 SDK는 `window`에 dispatch

**증상** — Klaviyo `Active on Site` 이벤트가 GTM Preview에서 안 보임. `document.addEventListener('klaviyoForms', ...)`로 듣고 있었으나 fire 안 됨.

**원인** — Klaviyo SDK가 버전 업되며 dispatch 타깃이 `document` → `window`로 이동. 옛 가이드 그대로 `document`만 listen하면 캡처 누락.

**해결** — **처음부터 `window`와 `document` 양쪽 모두 listen**

```javascript
['klaviyoForms', 'klaviyoFormsSubmit'].forEach(evt => {
  window.addEventListener(evt, handler);
  document.addEventListener(evt, handler);
});
```

**교훈** — 외부 SDK는 dispatch 타깃이 버전마다 바뀔 수 있음. 비용 거의 없이 양쪽을 듣는 게 안전.

**dataLayer 스니펫 적용 위치** — `templates/datalayer_snippets/klaviyo_listener.js` 헤더 주석에 "always-both-targets" 명시.

---

### 9-2. `catalog_cta_click` 정규식은 중간 단어 허용 패턴 사용

**증상** — `catalog_cta_click` 트리거가 일부 버튼에서만 fire. 같은 컴포넌트인데도 캡처되는 것과 안 되는 것이 섞임.

**원인** — 트리거 정규식이 `^Download\s*Catalog$`처럼 **`\s*`만 허용**. 실제 버튼 텍스트는 `Download Product Catalog`, `Download Full Catalog (PDF)` 등 중간에 단어가 끼는 변형이 많음. `\s*`는 공백만 매치하므로 중간 단어를 못 잡음.

**해결** — **`[\s\w]*` 패턴으로 중간 단어 허용**

```diff
- "value": "^Download\\s*Catalog$"
+ "value": "^Download[\\s\\w]*Catalog$"
```

**매치 예**:
- `Download Catalog` ✓
- `Download Product Catalog` ✓
- `Download Full Catalog` ✓
- `Download the 2026 Catalog` ✓

**교훈** — CTA 카피는 디자이너/카피라이터가 자유롭게 변형함. 정규식은 **고정 어휘 사이의 가변 영역**을 `[\s\w]*`로 허용하는 게 기본값. `\s*`로 짜면 한 단어만 끼어도 누락.

**build_gtm.py 적용 위치** — `_CTA_REGEX_PATTERNS` 사전에 `catalog`, `quote`, `demo`, `pricing` CTA 모두 `[\s\w]*` 패턴으로 등록.

---

## 시행착오의 핵심 교훈

### 1. type 필드 형식은 5가지 위치에서 모두 다름

같은 `type`이라는 키 이름이지만:
- 파라미터 → UPPERCASE
- 트리거 → UPPERCASE_SNAKE
- 필터 → UPPERCASE_SNAKE
- 변수 → 소문자 약어
- 태그 → 소문자 템플릿 ID
- 내장 변수 → UPPERCASE_SNAKE + 공식 카탈로그 한정

### 2. 자기 자신 리스트로 검증하면 무의미

`VIDEO_ELAPSED_TIME` 케이스가 결정타. **검증자에 GTM의 공식 enum 카탈로그를 박지 않으면 빌더가 자기 실수를 못 잡는다.**

### 3. 이름 필드는 enum이 아니지만 금지문자 검증 필요

`:` 한 글자가 통째로 import를 막을 수 있음. enum 검증을 다 통과해도 이름 검증이 빠지면 또 막힘.

### 4. 빌더에 8-Way 사전 검증 통과 못 하면 절대 사용자에게 보내지 말 것

빌더가 자체 검증에 실패하면 `raise SystemExit`로 중단해야 함. 잘못된 파일이 사용자에게 도달하면 5~10번의 import 시도 → 사용자 신뢰 손상.

### 5. 공식 문서만으로는 부족함

Google이 GTM API 문서를 일부만 공개. 실전 검증 규칙은 GTM Admin UI에 직접 시도하거나, 누군가 시행착오로 정리한 레퍼런스(이 문서 같은)가 가장 신뢰 가능.

---

## 새 프로젝트 적용 체크리스트

다음 GTM 컨테이너 빌드 시 이 체크리스트를 따르면 동일 사고 회피:

- [ ] `_PARAM_TYPE_ENUMS` 세트 적용 (§1)
- [ ] `tagFiringOption`은 처음부터 UPPERCASE_SNAKE로 박음 (§2)
- [ ] `_TRIGGER_TYPE_MAP` 적용해서 add_trigger 시점부터 변환 (§3)
- [ ] `_BUILTIN_TYPES` 처음부터 UPPERCASE_SNAKE로 작성 (§4)
- [ ] `_GTM_OFFICIAL_BUILTIN_ENUM` 외부 카탈로그와 자체 리스트 대조 (§5) ★
- [ ] 모든 name 필드에 `_INVALID_NAME_CHARS` 검증 (§6)
- [ ] `_FILTER_TYPE_MAP` 적용 (§7)
- [ ] `_ENUM_FIELD_MAP`에 consentStatus 포함 (§8)
- [ ] Klaviyo 리스너는 `window` + `document` 양쪽 등록 (§9-1)
- [ ] CTA 정규식은 `[\s\w]*`로 중간 단어 허용 (§9-2)
- [ ] **빌드 마지막에 8-Way Validator 통과 못 하면 raise SystemExit**
- [ ] **`✓ 사전 검증 통과` 메시지를 본 후에만 사용자에게 파일 전달**

위 10가지가 모두 들어간 빌더가 `build_gtm.py` v3.2.4. 그대로 새 프로젝트에 옮기면 됨.
