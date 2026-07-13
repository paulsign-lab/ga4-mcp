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
4. **JSON 다운로드** → `~/Downloads/` 폴더에 그대로 저장

> ℹ️ **다운로드 파일 이름은 바꿀 수 없습니다.**  
> 구글은 항상 `client_secret_<클라이언트ID>.apps.googleusercontent.com.json` 형태로 내려줍니다.  
> 그래서 이름으로 GA4용/Sheets용을 구분하려 애쓸 필요 없습니다 —  
> **두 파일을 모두 `~/Downloads/`에 두기만 하면**, `setup.sh`가 GA4에 쓴 파일과  
> 다른 나머지 하나를 Sheets용으로 자동 배정합니다.

> 🔴 **JSON을 손으로 `mcp-server/` 안에 옮기지 마세요.**  
> `~/Downloads/`에 두고 `bash setup.sh`만 실행하면 복사·이름변경·`npm install`까지  
> 자동 처리됩니다. 직접 옮기면 `npm install`이 건너뛰어져 `-32000` 오류가 납니다.

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

> 🔴 **동의 화면이 "프로덕션"으로 게시돼 있어야 토큰이 유지됩니다.**  
> GA4 가이드 3-6단계에서 프로덕션 게시를 마쳤다면 Sheets에도 그대로 적용됩니다.  
> 아직 "테스트" 상태라면 이 토큰도 **7일 뒤 만료**되어 시트 연동이 끊깁니다 —  
> `docs/gcp-setup-guide.md`의 **3-6단계(프로덕션 게시)**를 먼저 완료하세요.

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

### 토큰 만료 (`Token has been expired` / `invalid_grant`)

**7일 만에 만료된다면 동의 화면이 아직 "테스트" 상태입니다.**  
→ 먼저 `docs/gcp-setup-guide.md`의 **3-6단계(프로덕션 게시)**를 완료하세요. (근본 해결)

그런 다음 저장된 토큰을 지우고 재인증합니다.

```bash
rm mcp-server/token.json
claude  # 재시작하면 브라우저 인증이 다시 열림
```

### `-32000` / `google-sheets 재연결 실패`

`mcp-server/node_modules/`가 없어서 서버가 시작하자마자 죽는 경우입니다.  
(JSON을 손으로 옮기고 `setup.sh`를 건너뛰면 이 상태가 됩니다)

```bash
cd mcp-server && npm install && cd ..
```

→ 설치 후 `/mcp`로 `google-sheets`를 재연결하세요.
