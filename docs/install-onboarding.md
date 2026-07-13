# 구글 MCP 설치 온보딩 (수강생용 안내 흐름)

> 이 문서는 **수강생이 "구글 MCP 설치하자 / GA4 연결해줘 / 시트 연결해줘"** 라고
> 요청했을 때, Claude가 **처음부터 끝까지 한 단계씩 안내**하기 위한 대본입니다.
> Claude는 이 순서를 그대로 따라가되, **각 단계에서 수강생이 완료했는지 확인한 뒤** 다음으로 넘어갑니다.
> 한 번에 모든 걸 쏟아내지 말고, 막히는 지점에서 함께 해결하세요.

---

## 시작 안내 (수강생에게 그대로 전달)

> GA4·구글 시트 MCP 설치를 도와드릴게요. 크게 **5단계**이고, 처음이면 약 15분입니다.
> GA4 연동은 **필수**, 구글 시트 연동은 **선택**입니다. 한 단계씩 같이 진행할게요.
>
> ⚠️ 시작 전 딱 두 가지만 기억해 주세요. 이 두 가지가 90%의 오류 원인입니다.
> 1. **다운로드한 JSON 파일을 폴더로 직접 옮기지 마세요.** `~/Downloads/`에 그대로 두면 `setup.sh`가 알아서 처리합니다.
> 2. **GCP 동의 화면을 반드시 "프로덕션"으로 게시하세요.** 안 하면 정확히 7일 뒤 인증이 깨집니다.

---

## 0단계 · 준비물 확인

수강생에게 확인:

- **Node.js 18+** — 터미널에서 `node --version` (없으면 [nodejs.org](https://nodejs.org) LTS 설치)
- **GA4 속성에 접근 권한이 있는 Google 계정** — GCP 콘솔과 GA4를 **같은 계정**으로 진행해야 함
- **GA4 속성 ID** (숫자 9자리) — analytics.google.com → ⚙ 관리 → 속성 설정 → '속성 ID'

> 계정이 GA4에 접근 권한이 있는지 불확실하면, GA4 → 관리 → 속성 액세스 관리에서 본인 이메일을 확인하도록 안내.

---

## 1단계 · GCP 인증 준비 (가장 오래 걸리는 부분)

이 단계는 GCP 콘솔에서 진행합니다. **상세 클릭 순서는 별도 가이드에 있으니 그 문서를 열어 따라가도록** 안내하세요.

### GA4용 (필수)
→ **[docs/gcp-setup-guide.md](gcp-setup-guide.md)** 를 열어 1~5단계를 진행

핵심 체크포인트 (Claude가 반드시 확인):
- [ ] Google Analytics **Data** API 활성화 (Admin API 아님)
- [ ] OAuth 동의 화면 User Type = **외부**
- [ ] 🔴 **게시 상태 = "프로덕션" (3-6단계)** — 7일 만료 방지, 절대 건너뛰지 말 것
- [ ] OAuth 클라이언트 ID = **데스크톱 앱**
- [ ] `client_secret_*.json` 이 **`~/Downloads/`에 그대로** 있음 (옮기지 않음)

### 구글 시트용 (선택 — 시트 연동을 원할 때만)
→ **[docs/sheets-gcp-setup.md](sheets-gcp-setup.md)** 를 열어 진행
- 같은 GCP 프로젝트에 **Google Sheets API** 추가 활성화
- 시트용 OAuth 클라이언트(데스크톱 앱) 하나 **더** 발급 → `~/Downloads/`에 그대로 저장
- 동의 화면 프로덕션 게시는 GA4에서 이미 했다면 그대로 적용됨

---

## 2단계 · 저장소 가져오기 + **IDE로 폴더 열기** (터미널 없이)

> 🔑 **가장 중요한 원칙:** Claude Code는 **켜질 때의 "현재 폴더"** 에서 `.mcp.json`을 읽습니다.
> 그래서 방법이 뭐든 **결국 `ga4-mcp` 폴더가 IDE의 열린 프로젝트여야** MCP가 연결됩니다.
> 터미널 `cd`를 몰라도, **IDE에서 그 폴더를 여는 것**이 `cd` 역할을 대신합니다.

### 클론 방법 (터미널이 어렵다면 아래 중 하나)

| 방법 | 방식 |
|---|---|
| **IDE 내장 클론** (추천) | 명령 팔레트(`Cmd/Ctrl+Shift+P`) → "Git: Clone" → GitHub 주소 붙여넣기 → 저장 위치 선택 → 완료되면 **"열기"** 클릭 |
| **GitHub Desktop** | GUI 앱으로 클릭만으로 클론 후, 그 폴더를 IDE로 열기 |
| **ZIP 다운로드** | GitHub → 초록 `Code` 버튼 → "Download ZIP" → 압축 풀기 → 그 폴더를 IDE로 열기 |

GitHub 주소: `https://github.com/paulsign-lab/ga4-mcp.git`

**IDE 내장 클론**이 제일 매끄럽습니다 — 클론이 끝나면 "여시겠습니까?"가 뜨는데,
여기서 **"열기"** 를 누르면 `ga4-mcp` 폴더가 그대로 프로젝트로 열립니다.

> 🔴 **흔한 실수:** 상위 폴더(예: `교육/`)에서 Claude를 먼저 켠 뒤 거기서 클론하면,
> 저장소는 `교육/ga4-mcp/`에 생기지만 Claude는 여전히 `교육/`을 보고 있어 **MCP가 안 붙습니다.**
> → 이럴 땐 **IDE에서 `ga4-mcp` 폴더를 다시 열고(= 프로젝트로 열기)** Claude를 재시작하면 됩니다.

(터미널에 익숙하다면: `git clone https://github.com/paulsign-lab/ga4-mcp.git && cd ga4-mcp` 후 그 폴더에서 `claude`)

---

## 3단계 · setup.sh 실행 (자동 설치)

```bash
bash setup.sh
```

이 스크립트가 **한 번에** 처리합니다 — 직접 손댈 필요 없음:
1. Node.js / gcloud CLI 확인 (없으면 gcloud 자동 설치)
2. `~/Downloads/`의 `client_secret_*.json` 자동 탐지 → GA4 인증(`--client-id-file`로 스코프 차단 회피)
3. GA4 속성 ID 입력 → `.mcp.json` 자동 등록
4. 시트용 JSON이 있으면 `mcp-server/oauth_credentials.json`으로 복사 + `npm install`

> 브라우저가 열리면 GA4 접근 권한이 있는 계정으로 로그인·허용.
> "확인되지 않은 앱" 경고가 뜨면 **고급 → (앱이름)으로 이동** 클릭 (정상).

---

## 4단계 · Claude Code 실행 & 연결 확인

**`ga4-mcp` 폴더가 열린 상태**에서 Claude Code를 켭니다.
(IDE로 그 폴더를 열었다면 IDE의 통합 터미널/Claude가 자동으로 그 폴더 기준으로 시작됩니다.)

```bash
claude       # ga4-mcp 폴더가 '현재 폴더'인 상태에서
```

Claude가 켜지면:
```
/mcp
```
- `ga4 · Connected` → GA4 완료
- `google-sheets · Connected` → 시트 완료 (설정한 경우)

---

## 5단계 · 첫 조회로 검증

```
지난 7일 채널별 세션 수와 전환 수를 표로 정리해줘
```

데이터가 표로 나오면 설치 성공입니다.
시트까지 설정했다면 이어서: `이 결과를 새 구글 시트에 표로 만들어줘`

> 첫 시트 도구 호출 시 브라우저 인증이 한 번 더 열립니다 → 로그인하면 `token.json` 자동 생성.

---

## 자주 막히는 지점 → 바로 이 오류 진단

| 증상 | 원인 | 해결 |
|---|---|---|
| `google-sheets` **-32000** | `mcp-server/node_modules` 없음 (JSON을 손으로 옮기고 setup.sh 건너뜀) | `cd mcp-server && npm install` 후 `/mcp` 재연결 |
| GA4 **invalid_grant** (7일 뒤) | 동의 화면이 "테스트" 상태 | GA4 가이드 **3-6 프로덕션 게시** 후 `bash setup.sh` 재실행 |
| GA4 **액세스 차단됨** | 옵션 없이 `gcloud auth ...` 수동 실행 (기본 클라이언트 스코프 차단) | 수동으로 치지 말고 `bash setup.sh` 재실행 |
| GA4 **PERMISSION_DENIED** | 계정이 해당 GA4 속성 접근 권한 없음 | GA4 → 관리 → 속성 액세스 관리에서 이메일 권한 확인 |
| 도구가 안 보임 / MCP 미연결 | `ga4-mcp`가 아닌 상위 폴더에서 Claude 실행 중 | **IDE에서 `ga4-mcp` 폴더를 다시 열고** Claude 재시작 (터미널이면 `cd ga4-mcp && claude`) |

> 어떤 오류든 대부분의 정답은 **"손대지 말고 `bash setup.sh` 재실행"** 입니다.
