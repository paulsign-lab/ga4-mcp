#!/bin/bash
# Google Analytics MCP 자동 설치 스크립트
# 사용법: bash setup.sh

set -e

echo "=== Google Analytics MCP 설치 시작 ==="
echo ""

# Homebrew 확인
if ! command -v brew &>/dev/null; then
  echo "[1/5] Homebrew 설치 중..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
else
  echo "[1/5] Homebrew 이미 설치됨 ($(brew --version | head -1))"
fi

# Python 3.11 설치
echo "[2/5] Python 3.11 설치 중..."
brew install python@3.11 2>/dev/null || echo "  이미 설치됨"

# pipx 설치
echo "[3/5] pipx 설치 중..."
brew install pipx 2>/dev/null || echo "  이미 설치됨"
pipx ensurepath

# analytics-mcp 설치
echo "[4/5] analytics-mcp 설치 중..."
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
if pipx list | grep -q "analytics-mcp"; then
  echo "  analytics-mcp 이미 설치됨"
else
  pipx install analytics-mcp --python python3.11
fi

# Claude Code MCP 등록
echo "[5/5] Claude Code에 MCP 서버 등록 중..."
ANALYTICS_BIN="$HOME/.local/bin/analytics-mcp"
CREDENTIALS_PATH="$HOME/.config/gcloud/application_default_credentials.json"

if [ ! -f "$CREDENTIALS_PATH" ]; then
  echo ""
  echo "⚠️  Google 인증 파일이 없습니다."
  echo "아래 명령어로 인증을 먼저 완료해주세요:"
  echo ""
  echo "  gcloud auth application-default login \\"
  echo "    --client-id-file=~/Downloads/client_secret_XXX.json \\"
  echo "    --scopes=https://www.googleapis.com/auth/analytics.readonly"
  echo ""
  echo "인증 완료 후 다시 이 스크립트를 실행하거나 수동으로 등록하세요:"
  echo "  claude mcp add analytics-mcp $ANALYTICS_BIN \\"
  echo "    -e GOOGLE_APPLICATION_CREDENTIALS=$CREDENTIALS_PATH"
  exit 0
fi

claude mcp add analytics-mcp "$ANALYTICS_BIN" \
  -e GOOGLE_APPLICATION_CREDENTIALS="$CREDENTIALS_PATH" 2>/dev/null || \
  echo "  (이미 등록되어 있거나 claude 명령어를 찾을 수 없습니다)"

echo ""
echo "=== 설치 완료 ==="
echo ""
echo "Claude Code를 재시작한 후 /mcp 명령어로 연결 상태를 확인하세요."
echo ""
