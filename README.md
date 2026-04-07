# Google Analytics 4 MCP for Claude Code

Google Analytics 데이터를 Claude Code에서 직접 분석할 수 있도록 설정하는 가이드입니다.

## 사용 MCP 서버

- [google-analytics-mcp](https://github.com/googleanalytics/google-analytics-mcp) by Google

## 사전 요구사항

- macOS
- Python 3.10 이상
- Google Cloud 프로젝트
- Google Analytics 4 계정

---

## 설치 과정

### 1. Homebrew 설치

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2. Python 3.11 및 pipx 설치

```bash
brew install python@3.11
brew install pipx
pipx ensurepath
```

### 3. analytics-mcp 설치

```bash
pipx install analytics-mcp --python python3.11
```

설치 확인:
```bash
pipx list | grep analytics
# 출력 예시: package analytics-mcp 0.2.0, installed using Python 3.11.x
```

### 4. Google Cloud API 활성화

[Google Cloud Console](https://console.cloud.google.com)에서:

1. 프로젝트 생성 또는 선택
2. **Google Analytics Admin API** 활성화
3. **Google Analytics Data API** 활성화
4. 사용자 인증 정보 → OAuth 2.0 클라이언트 ID 생성 → JSON 다운로드

### 5. Google 인증 설정 (Application Default Credentials)

```bash
# gcloud CLI 설치 (없는 경우)
brew install --cask google-cloud-sdk

# OAuth 인증
gcloud auth application-default login \
  --client-id-file=~/Downloads/client_secret_XXX.json \
  --scopes=https://www.googleapis.com/auth/analytics.readonly
```

인증 완료 시 credentials 파일 생성 위치:
```
~/.config/gcloud/application_default_credentials.json
```

### 6. Claude Code에 MCP 서버 등록

```bash
claude mcp add analytics-mcp /Users/$(whoami)/.local/bin/analytics-mcp \
  -e GOOGLE_APPLICATION_CREDENTIALS=/Users/$(whoami)/.config/gcloud/application_default_credentials.json
```

등록 확인:
```bash
claude mcp list
```

---

## 사용 방법

Claude Code를 재시작한 후 `/mcp` 명령어로 연결 상태를 확인하세요.

이후 자연어로 Google Analytics 데이터를 분석할 수 있습니다:

```
내 GA4 프로퍼티 목록 보여줘
지난 7일간 페이지뷰 알려줘
어떤 채널에서 트래픽이 가장 많이 오는지 분석해줘
이번 달 신규 사용자 수와 재방문자 수 비교해줘
```

---

## 설정 파일 구조

```
~/.local/bin/analytics-mcp        # MCP 실행 파일 (pipx로 설치)
~/.config/gcloud/application_default_credentials.json  # Google 인증 파일
~/.claude.json                     # Claude Code MCP 등록 정보
```

## 트러블슈팅

### `analytics-mcp not found`
```bash
export PATH="$PATH:/Users/$(whoami)/.local/bin"
# 또는 ~/.zshrc에 추가
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.zshrc
```

### Python 버전 오류
analytics-mcp는 Python 3.10 이상이 필요합니다.
```bash
python3 --version  # 3.10+ 확인
pipx install analytics-mcp --python python3.11
```

### 인증 오류
```bash
gcloud auth application-default print-access-token
# 토큰 출력되면 인증 정상
```
