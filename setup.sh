#!/bin/bash
# GA4 MCP 자동 설치 스크립트 (macOS / Linux)
# 사용법: bash setup.sh

set -e

# ── 색상 ──────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
ok()   { echo -e "  ${GREEN}✅ $*${NC}"; }
warn() { echo -e "  ${YELLOW}⚠️  $*${NC}"; }
err()  { echo -e "  ${RED}❌ $*${NC}"; exit 1; }

echo ""
echo "🚀 GA4 + Google Sheets MCP 설치 시작"
echo "──────────────────────────────────────────"
echo ""

# ── Step 1: Node.js 확인 ─────────────────────────────────────
echo "📦 [1/5] Node.js 확인..."
if ! command -v node &>/dev/null; then
  err "Node.js가 없습니다. https://nodejs.org 에서 LTS 버전을 설치 후 다시 실행하세요."
fi
NODE_VER=$(node --version | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VER" -lt 18 ]; then
  err "Node.js 18 이상이 필요합니다 (현재: $(node --version)). nodejs.org에서 LTS로 업그레이드하세요."
fi
ok "Node.js $(node --version)"

# ── Step 2: gcloud CLI 확인 / 설치 ──────────────────────────
echo ""
echo "☁️  [2/5] gcloud CLI 확인..."

GCLOUD_CMD=""
if command -v gcloud &>/dev/null; then
  GCLOUD_CMD="gcloud"
  ok "gcloud 이미 설치됨 — $(gcloud --version 2>/dev/null | head -1)"
elif [ -f "$HOME/google-cloud-sdk/bin/gcloud" ]; then
  GCLOUD_CMD="$HOME/google-cloud-sdk/bin/gcloud"
  ok "gcloud 발견 (~/google-cloud-sdk)"
else
  echo "  📥 gcloud CLI를 자동 설치합니다 (약 2~3분)..."
  ARCH=$(uname -m)
  OS=$(uname -s)

  if [ "$OS" = "Darwin" ]; then
    if [ "$ARCH" = "arm64" ]; then
      GCLOUD_URL="https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-cli-darwin-arm.tar.gz"
    else
      GCLOUD_URL="https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-cli-darwin-x86_64.tar.gz"
    fi
  elif [ "$OS" = "Linux" ]; then
    GCLOUD_URL="https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-cli-linux-x86_64.tar.gz"
  else
    echo ""
    err "Windows는 setup.sh를 지원하지 않습니다. README.md의 'Windows 설치' 섹션을 참고하세요."
  fi

  curl -fSL "$GCLOUD_URL" -o /tmp/gcloud.tar.gz
  tar -xzf /tmp/gcloud.tar.gz -C "$HOME"
  "$HOME/google-cloud-sdk/install.sh" \
    --quiet \
    --usage-reporting=false \
    --path-update=true \
    --rc-path="$HOME/.zshrc" 2>/dev/null || true
  rm -f /tmp/gcloud.tar.gz
  GCLOUD_CMD="$HOME/google-cloud-sdk/bin/gcloud"
  ok "gcloud 설치 완료"
fi

# ── Step 3: Google 인증 (ADC) ────────────────────────────────
echo ""
echo "🔐 [3/5] Google 인증 설정..."

ADC_FILE="$HOME/.config/gcloud/application_default_credentials.json"
SKIP_AUTH=""

if [ -f "$ADC_FILE" ]; then
  ok "기존 인증 파일 발견"
  echo ""
  read -r -p "  다시 인증하려면 y, 건너뛰려면 Enter: " REAUTH
  [ "$REAUTH" != "y" ] && [ "$REAUTH" != "Y" ] && SKIP_AUTH=1
fi

if [ -z "$SKIP_AUTH" ]; then
  # OAuth 클라이언트 JSON 자동 탐지 (Downloads 폴더 검색)
  OAUTH_CLIENT=""
  SAVED_CLIENT="$HOME/.config/gcloud/ga4_oauth_client.json"

  if [ -f "$SAVED_CLIENT" ]; then
    OAUTH_CLIENT="$SAVED_CLIENT"
  else
    # ~/Downloads 우선, 없으면 프로젝트 폴더 안(손으로 옮긴 경우)도 탐지
    FOUND=$(ls "$HOME/Downloads"/client_secret_*.json ./client_secret_*.json 2>/dev/null | head -1 || true)
    if [ -n "$FOUND" ]; then
      mkdir -p "$HOME/.config/gcloud"
      cp "$FOUND" "$SAVED_CLIENT"
      OAUTH_CLIENT="$SAVED_CLIENT"
      ok "OAuth 클라이언트 JSON 발견: $(basename "$FOUND")"
    fi
  fi

  echo ""
  if [ -n "$OAUTH_CLIENT" ]; then
    echo "  🔑 OAuth 클라이언트 사용 중 (차단 오류 방지)"
    echo "  브라우저가 열리면 GA4에 접근 권한이 있는 Google 계정으로"
    echo "  로그인 후 '허용' 버튼을 클릭하세요."
    echo ""
    warn "동의 화면이 '테스트' 상태면 인증이 7일 뒤 만료됩니다."
    echo "     → GCP 콘솔 → OAuth 동의 화면 → '앱 게시(프로덕션)'를 꼭 해두세요."
    echo "        (docs/gcp-setup-guide.md 3-6단계)"
    echo ""
    "$GCLOUD_CMD" auth application-default login \
      --client-id-file="$OAUTH_CLIENT" \
      --scopes="https://www.googleapis.com/auth/analytics.readonly,https://www.googleapis.com/auth/cloud-platform"
  else
    warn "OAuth 클라이언트 JSON을 찾지 못했습니다."
    echo ""
    echo "     회사 Google Workspace 계정(xxx@company.com)을 사용하는 경우"
    echo "     기본 클라이언트로는 인증이 차단됩니다."
    echo ""
    echo "     해결 방법:"
    echo "     1. GCP 콘솔 → API 및 서비스 → 사용자 인증 정보"
    echo "        → OAuth 클라이언트 ID (데스크톱 앱) JSON 다운로드"
    echo "     2. ~/Downloads/ 폴더에 저장"
    echo "     3. bash setup.sh 재실행"
    echo ""
    echo "     자세한 발급 방법: README.md → 'GCP OAuth 클라이언트 발급'"
    echo ""
    read -r -p "  기본 클라이언트로 시도하시겠어요? (개인 Gmail만 권장) [y/N]: " TRY
    if [ "$TRY" = "y" ] || [ "$TRY" = "Y" ]; then
      "$GCLOUD_CMD" auth application-default login \
        --scopes="https://www.googleapis.com/auth/analytics.readonly,https://www.googleapis.com/auth/cloud-platform"
    else
      echo ""
      echo "  OAuth 클라이언트 JSON 발급 후 bash setup.sh를 다시 실행해주세요."
      exit 0
    fi
  fi

  ok "인증 완료: ~/.config/gcloud/application_default_credentials.json"
fi

# ── Step 4: GA4 속성 ID 설정 ─────────────────────────────────
echo ""
echo "📊 [4/5] GA4 속성 ID 설정..."

# 현재 .mcp.json에서 속성 ID 읽기
CURRENT_ID=$(node -e "
try {
  const d = JSON.parse(require('fs').readFileSync('.mcp.json', 'utf8'));
  const id = d.mcpServers.ga4.env.GA_PROPERTY_ID;
  if (id && id !== '여기에_9자리_숫자_입력') process.stdout.write(id);
} catch(e) {}
" 2>/dev/null || true)

if [ -n "$CURRENT_ID" ]; then
  ok "현재 등록된 속성 ID: $CURRENT_ID"
  read -r -p "  다른 속성으로 변경하려면 새 ID 입력, 유지하려면 Enter: " NEW_ID
  [ -n "$NEW_ID" ] && PROPERTY_ID="$NEW_ID" || PROPERTY_ID="$CURRENT_ID"
else
  echo ""
  echo "  GA4 속성 ID 찾는 방법:"
  echo "  ① analytics.google.com 접속"
  echo "  ② 왼쪽 하단 ⚙ 관리 클릭"
  echo "  ③ 오른쪽 '속성' 컬럼 → '속성 설정' 클릭"
  echo "  ④ 오른쪽 상단 '속성 ID' 값 복사 (숫자 9자리, 예: 471063826)"
  echo ""

  while true; do
    read -r -p "  GA4 속성 ID 입력: " PROPERTY_ID
    if echo "$PROPERTY_ID" | grep -qE '^[0-9]{6,12}$'; then
      break
    else
      warn "숫자만 입력하세요 (예: 471063826)"
    fi
  done
fi

# .mcp.json 속성 ID + Sheets 경로 업데이트
REPO_PATH="$(pwd)"
node -e "
const fs = require('fs');
const d = JSON.parse(fs.readFileSync('.mcp.json', 'utf8'));
d.mcpServers.ga4.env.GA_PROPERTY_ID = '$PROPERTY_ID';
d.mcpServers['google-sheets'].args = ['$REPO_PATH/mcp-server/index.js'];
fs.writeFileSync('.mcp.json', JSON.stringify(d, null, 2) + '\n');
"
ok ".mcp.json 속성 ID 등록 완료 ($PROPERTY_ID)"

# ── Step 5: Google Sheets MCP 설정 ───────────────────────────
echo ""
echo "📋 [5/5] Google Sheets MCP 설정..."

SHEETS_DEST="$REPO_PATH/mcp-server/oauth_credentials.json"
SHEETS_DONE=""

if [ -f "$SHEETS_DEST" ]; then
  ok "Sheets OAuth 클라이언트 이미 설정됨"
  SHEETS_DONE=1
else
  # sheets 이름 포함 파일 우선 탐색 (Downloads + 프로젝트 폴더)
  SHEETS_FILE=$(ls "$HOME/Downloads"/client_secret_sheets*.json ./client_secret_sheets*.json 2>/dev/null | head -1 || true)

  if [ -z "$SHEETS_FILE" ]; then
    # GA4 파일 제외한 첫 번째 client_secret 파일 탐색 (Downloads + 프로젝트 폴더)
    SAVED_GA4="$HOME/.config/gcloud/ga4_oauth_client.json"
    for f in "$HOME/Downloads"/client_secret_*.json ./client_secret_*.json; do
      [ -f "$f" ] || continue
      if ! cmp -s "$f" "$SAVED_GA4" 2>/dev/null; then
        SHEETS_FILE="$f"
        break
      fi
    done
  fi

  if [ -n "$SHEETS_FILE" ]; then
    cp "$SHEETS_FILE" "$SHEETS_DEST"
    ok "Sheets OAuth 클라이언트 설정: $(basename "$SHEETS_FILE")"
    SHEETS_DONE=1
  else
    warn "Google Sheets OAuth 클라이언트 JSON을 찾지 못했습니다."
    echo ""
    echo "     ▸ Sheets MCP 설정 방법: docs/sheets-gcp-setup.md"
    echo "     ▸ GA4 분석은 지금 바로 사용 가능합니다."
    echo "     ▸ Sheets JSON 발급 후 bash setup.sh 재실행으로 추가할 수 있습니다."
    echo ""
  fi
fi

if [ -n "$SHEETS_DONE" ]; then
  echo "  📦 Sheets MCP 의존성 설치 중..."
  (cd "$REPO_PATH/mcp-server" && npm install --quiet 2>/dev/null || npm install)
  ok "npm 의존성 설치 완료"
fi

# ── 설치 완료 ─────────────────────────────────────────────────
echo ""
echo "──────────────────────────────────────────"
echo -e "${GREEN}🎉 설치 완료!${NC}"
echo ""
echo "  지금 바로 시작하세요 (이 폴더에서!):"
echo ""
echo "    claude"
echo ""
echo "  Claude가 실행되면 아래 질문을 입력해보세요:"
echo ""
echo "    「지난 7일 채널별 세션 수와 전환 수를 표로 정리해줘」"
echo ""
if [ -n "$SHEETS_DONE" ]; then
  echo "  Google Sheets 연동 예시:"
  echo ""
  echo "    「GA4 채널 리포트를 구글 시트에 표로 만들어줘」"
  echo ""
fi
echo "  분석 템플릿: prompts/ 폴더"
echo ""
echo -e "  ${YELLOW}🔴 인증이 일주일 뒤 끊긴다면${NC} 동의 화면이 아직 '테스트' 상태입니다."
echo "     GCP 콘솔 → OAuth 동의 화면 → '앱 게시(프로덕션)' 후 bash setup.sh 재실행."
echo ""
