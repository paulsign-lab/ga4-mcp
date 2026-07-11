# Google Sheets MCP 인증 설정 가이드

> GA4 인증(`docs/gcp-setup-guide.md`)을 완료한 분은  
> **같은 GCP 프로젝트**를 사용합니다. 1단계부터 그대로 따라오세요.  
> 처음이라면 GA4 가이드를 먼저 완료하는 것을 권장합니다.

---

## Sheets MCP 인증이 GA4와 다른 점

| 항목 | GA4 MCP | Google Sheets MCP |
|---|---|---|
| 인증 방식 | ADC (gcloud CLI) | OAuth 2.0 (직접 브라우저 인증) |
| 설정 파일 | `~/.config/gcloud/application_default_credentials.json` | `mcp-server/oauth_credentials.json` + `mcp-server/token.json` |
| 브라우저 인증 | 1회 (gcloud 설정 시) | 1회 (Claude Code 첫 실행 시) |
| API | Google Analytics Data API | Google Sheets API v4 |
| GCP OAuth 클라이언트 | 필요 (GA4용 발급) | **별도로 새 클라이언트 발급 필요** |

---

## 전체 3단계 흐름

```
1단계: 같은 GCP 프로젝트에 Sheets API 활성화   (1분)
2단계: Sheets용 OAuth 클라이언트 ID 발급        (3분)
3단계: JSON 파일 저장 → setup.sh이 자동 처리    (1분)
```

---

## 1단계 · Google Sheets API 활성화 (1분)

GA4 설정 때 만든 GCP 프로젝트를 그대로 사용합니다.

1. [console.cloud.google.com](https://console.cloud.google.com) 접속
2. 상단에서 `ga4-mcp` 프로젝트가 선택돼 있는지 확인
3. 상단 검색창에 `Google Sheets API` 입력 후 Enter
4. **Google Sheets API** 클릭 → **사용 설정** 클릭

> ✅ 이미 GA4 가이드에서 OAuth 동의 화면과 테스트 사용자를 설정했다면  
> 그 설정이 Sheets에도 그대로 적용됩니다. 다시 할 필요 없습니다.

---

## 2단계 · Sheets용 OAuth 클라이언트 ID 발급 (3분)

GA4용과 **별도**로 Sheets 전용 OAuth 클라이언트를 만듭니다.

1. 왼쪽 메뉴 → **API 및 서비스** → **사용자 인증 정보**
2. **+ 사용자 인증 정보 만들기** → **OAuth 클라이언트 ID**

   | 항목 | 선택값 |
   |---|---|
   | 애플리케이션 유형 | **데스크톱 앱** ⚠️ 반드시 |
   | 이름 | `sheets-mcp` |

3. **만들기** 클릭
4. **JSON 다운로드** → `~/Downloads/` 폴더에 저장

> ⚠️ `client_secret_sheets_*.json` 처럼 구분되는 이름으로 저장하거나  
> GA4 JSON과 혼동되지 않도록 주의하세요.

---

## 3단계 · setup.sh이 자동 처리

`setup.sh`를 실행하면:

1. `~/Downloads/`에서 Sheets용 JSON 파일을 감지
2. `mcp-server/oauth_credentials.json`으로 복사
3. `mcp-server/`에 npm 의존성 설치

이후 **Claude Code를 처음 시작할 때** 브라우저가 자동으로 열립니다.

```
브라우저 인증 절차:
① 구글 계정 선택 (테스트 사용자로 등록한 계정)
② "이 앱은 확인하지 않았습니다" → 고급 → (앱이름)으로 이동 클릭
③ 스프레드시트 읽기/쓰기 권한 → 허용
④ "✅ 인증 완료!" 페이지 표시 → 브라우저 닫기
```

인증 완료 후 `mcp-server/token.json`이 자동 생성됩니다.  
이후 60일간 자동 로그인 (만료 시 자동 갱신).

---

## 완료 체크리스트

```
☐  GCP 프로젝트에 Google Sheets API 활성화
☐  Sheets용 OAuth 클라이언트 ID (데스크톱 앱) JSON 다운로드
☐  JSON 파일이 ~/Downloads/ 폴더에 있음
☐  bash setup.sh 실행 완료
☐  Claude Code 첫 실행 시 브라우저 인증 완료
☐  mcp-server/token.json 파일이 생성됨
```

---

## 트러블슈팅

### `oauth_credentials.json` 파일을 찾지 못함

`setup.sh`가 `~/Downloads/`에서 `client_secret_*.json` 파일을 찾습니다.  
파일이 다른 위치에 있다면 직접 복사하세요:

```bash
cp ~/Documents/client_secret_XXX.json ./mcp-server/oauth_credentials.json
```

### "이 앱은 확인하지 않았습니다" 화면에서 막힘

**고급** 링크를 클릭하면 하단에 "(앱이름)으로 이동" 링크가 나타납니다.  
테스트 앱이므로 경고가 뜨는 것은 정상입니다.

### `mcp__google-sheets__*` 도구가 안 보임

```bash
claude mcp list | grep google-sheets
```

`Connected`가 아니라면 Claude Code를 완전히 종료 후 재시작하세요.  
재시작 시 브라우저가 열리면 인증을 완료하세요.

### 브라우저가 자동으로 안 열림

터미널에 출력된 `https://accounts.google.com/...` URL을 복사해  
브라우저 주소창에 직접 붙여넣기하세요.

### 토큰 만료 (`Token has been expired`)

60일 이상 사용하지 않으면 토큰이 만료됩니다.

```bash
rm mcp-server/token.json
claude  # 재시작하면 브라우저 인증이 다시 열림
```
