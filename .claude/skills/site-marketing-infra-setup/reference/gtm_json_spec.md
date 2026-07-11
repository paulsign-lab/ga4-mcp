# GTM 컨테이너 JSON 스펙 — 영역별 type 케이싱 (반드시 지킬 것)

GTM 컨테이너 JSON은 영역에 따라 `type` 필드의 케이싱 규약이 다르다. 한 곳이라도 어긋나면 **GTM 가져오기(Import) 단계에서 enum을 인식 못 해 실패**하거나, 통과하더라도 변수/트리거가 "UNKNOWN" 상태로 들어와 동작하지 않는다. `scripts/build_gtm.py`를 수정하거나 새 빌더를 만들 때 이 표를 그대로 따른다.

## 케이싱 매트릭스

| 영역 | 형식 | 올바른 예 | 잘못된 예 |
|---|---|---|---|
| `variable[*].type` (변수 종류) | 소문자/약어 | `"c"` (constant), `"v"` (dataLayer), `"smm"` (lookup table), `"jsm"` (JS macro), `"k"` (1st-party cookie), `"u"` (URL), `"j"` (JS var) | `"CONSTANT"`, `"DataLayer"` |
| `trigger[*].type` | camelCase | `"pageview"`, `"customEvent"`, `"linkClick"`, `"click"`, `"formSubmission"`, `"youTubeVideo"`, `"timer"`, `"elementVisibility"`, `"historyChange"`, `"scrollDepth"` | `"PAGEVIEW"`, `"custom_event"`, `"LinkClick"` |
| `tag[*].type` | 소문자/약어 | `"googtag"` (Google tag), `"gaawe"` (GA4 event), `"html"` (Custom HTML), `"img"` (Custom Image) | `"GoogleTag"`, `"GA4Event"` |
| **`parameter[*].type`** ★ | **반드시 UPPERCASE** | `"TEMPLATE"`, `"BOOLEAN"`, `"INTEGER"`, `"LIST"`, `"MAP"`, `"TAG_REFERENCE"`, `"TRIGGER_REFERENCE"` | `"template"`, `"boolean"`, `"list"`, `"Map"` |
| `filter[*].type` / `customEventFilter[*].type` | camelCase | `"equals"`, `"contains"`, `"matchRegex"`, `"matchRegexIgnoreCase"`, `"startsWith"`, `"endsWith"`, `"less"`, `"greater"` | `"EQUALS"`, `"match_regex"` |
| `builtInVariable[*].type` | camelCase 이름 그대로 | `"pageUrl"`, `"pagePath"`, `"clickText"`, `"clickUrl"`, `"videoTitle"`, `"formId"` | `"PAGE_URL"`, `"page_path"` |

★ 표시된 줄이 가장 많이 틀리는 곳. **parameter type만 UPPERCASE**이고 나머지는 모두 다른 케이싱이라는 점이 비대칭적이라 혼동된다.

## 왜 parameter type만 UPPERCASE인가

GTM API 스펙에서 `parameter.type`은 [`Parameter.Type` enum](https://developers.google.com/tag-platform/tag-manager/api/v2/reference/accounts/containers/workspaces/variables#Parameter.Type)으로 정의되어 있고, enum 값은 protobuf 관례에 따라 UPPERCASE다. 반면 트리거 type·태그 type·변수 type은 서버에서 문자열 식별자(slug)로 다뤄지기 때문에 소문자/camelCase가 정답이다. GTM UI에서 JSON을 export 하면 자동으로 올바른 케이싱이 박혀 나오지만, 손으로 빌드할 땐 이 비대칭을 명시적으로 의식해야 한다.

## 빌더 작성 시 안전망 2중 적용

빌더 스크립트는 반드시 다음 2단계 안전망을 가진다.

1. **헬퍼 단계**: 파라미터 dict를 만드는 함수에서 type을 즉시 `.upper()` 변환한다.
   ```python
   def param(t, k, v=None, **extra):
       p = {"type": t.upper() if isinstance(t, str) else t, "key": k}
       ...
   ```
   인라인으로 `{"type": "LIST", "key": "map", ...}` 형태를 쓸 땐 작성 시점부터 UPPERCASE로 박는다.

2. **출력 직전 정규화 + 검증**: 트리 전체를 재귀로 돌며 `_PARAM_TYPE_TOKENS = {"TEMPLATE","BOOLEAN","INTEGER","LIST","MAP","TAG_REFERENCE","TRIGGER_REFERENCE"}` 화이트리스트와 매칭되는 type 값을 UPPERCASE로 정규화한다. 그 후 검증 함수로 소문자 잔존이 0건임을 확인한 뒤에만 파일에 쓴다. 잔존이 있으면 `sys.exit(2)`로 명시적 실패.

   화이트리스트 방식이 핵심 — 트리거/태그/필터 type까지 대문자로 만들면 그쪽이 깨진다. 정규화 대상은 위 7개 토큰만.

`scripts/build_gtm.py`의 `_normalize_param_types()`와 `_validate_no_lowercase_param_types()`가 이 안전망의 참조 구현.

## Import 후 가장 자주 보는 에러 메시지

| 메시지 | 원인 |
|---|---|
| `Invalid value at 'container_version.variable[*].parameter[*].type' (TYPE_ENUM)` | parameter.type을 소문자로 둔 경우 |
| 변수가 GTM UI에 "UNKNOWN" 종류로 들어옴 | `variable.type`을 대문자나 잘못된 slug로 적은 경우 |
| 트리거가 "Custom Event"로 잘못 매핑됨 | `trigger.type`을 `"customevent"`나 `"CUSTOM_EVENT"`로 적은 경우 (정답: `"customEvent"`) |
| 필터가 무시되어 전체 페이지에서 발화 | `filter.type`을 UPPERCASE로 적은 경우 |

## 검증 명령어

생성된 JSON에 소문자 parameter type이 남아있는지 빠르게 확인:

```bash
# 0건이어야 정상
grep -E '"type":\s*"(template|boolean|integer|list|map)"' outputs/<site>/<container>.json | wc -l
```

빌더에서 `_validate_no_lowercase_param_types()`를 통과했다면 위 grep도 0이어야 한다.
