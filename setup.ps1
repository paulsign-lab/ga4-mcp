# GA4 MCP 자동 설치 스크립트 (Windows PowerShell)
# 사용법: PowerShell을 관리자 권한으로 열고 실행:
#   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
#   .\setup.ps1

$ErrorActionPreference = "Stop"

function Write-OK   { param($msg) Write-Host "  [OK] $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "  [!]  $msg" -ForegroundColor Yellow }
function Write-Err  { param($msg) Write-Host "  [X]  $msg" -ForegroundColor Red; exit 1 }
function Write-Info { param($msg) Write-Host "       $msg" -ForegroundColor Gray }

Write-Host ""
Write-Host "GA4 MCP 설치 시작 (Windows)" -ForegroundColor Cyan
Write-Host "------------------------------------------"
Write-Host ""

# ── Step 1: Node.js 확인 ─────────────────────────────────
Write-Host "[1/4] Node.js 확인..."
try {
    $nodeVer = (node --version 2>$null)
    $nodeMajor = [int]($nodeVer -replace 'v', '' -split '\.')[0]
    if ($nodeMajor -lt 18) {
        Write-Err "Node.js 18 이상이 필요합니다 (현재: $nodeVer). https://nodejs.org 에서 LTS 설치 후 재실행하세요."
    }
    Write-OK "Node.js $nodeVer"
} catch {
    Write-Err "Node.js가 없습니다. https://nodejs.org 에서 LTS 버전을 설치 후 재실행하세요."
}

# ── Step 2: gcloud CLI 확인 / 설치 ─────────────────────
Write-Host ""
Write-Host "[2/4] gcloud CLI 확인..."

$gcloudCmd = $null
if (Get-Command gcloud -ErrorAction SilentlyContinue) {
    $gcloudCmd = "gcloud"
    Write-OK "gcloud 이미 설치됨"
} elseif (Test-Path "$env:UserProfile\google-cloud-sdk\bin\gcloud.cmd") {
    $gcloudCmd = "$env:UserProfile\google-cloud-sdk\bin\gcloud.cmd"
    Write-OK "gcloud 발견 (~/google-cloud-sdk)"
} else {
    Write-Host "  [>] gcloud CLI를 자동 설치합니다 (약 2~3분)..."
    $gcloudZip = "$env:Temp\gcloud.zip"
    $gcloudDest = "$env:UserProfile\google-cloud-sdk"

    (New-Object Net.WebClient).DownloadFile(
        "https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-cli-windows-x86_64.zip",
        $gcloudZip
    )
    Expand-Archive -Path $gcloudZip -DestinationPath $env:UserProfile -Force
    Remove-Item $gcloudZip

    & "$gcloudDest\install.bat" --quiet 2>$null
    $gcloudCmd = "$gcloudDest\bin\gcloud.cmd"
    Write-OK "gcloud 설치 완료 (새 터미널에서 'gcloud' 명령 사용 가능)"
}

# ── Step 3: ADC 인증 ────────────────────────────────────
Write-Host ""
Write-Host "[3/4] Google 인증 설정..."

$adcFile = "$env:APPDATA\gcloud\application_default_credentials.json"
$skipAuth = $false

if (Test-Path $adcFile) {
    Write-OK "기존 인증 파일 발견"
    $reauth = Read-Host "  다시 인증하려면 y, 건너뛰려면 Enter"
    if ($reauth -ne "y") { $skipAuth = $true }
}

if (-not $skipAuth) {
    # OAuth 클라이언트 JSON 자동 탐지
    $oauthClient = $null
    $savedClient = "$env:APPDATA\gcloud\ga4_oauth_client.json"

    if (Test-Path $savedClient) {
        $oauthClient = $savedClient
    } else {
        $found = Get-ChildItem "$env:USERPROFILE\Downloads\client_secret_*.json" -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($found) {
            if (-not (Test-Path (Split-Path $savedClient))) { New-Item -ItemType Directory -Path (Split-Path $savedClient) -Force | Out-Null }
            Copy-Item $found.FullName $savedClient
            $oauthClient = $savedClient
            Write-OK "OAuth 클라이언트 JSON 발견: $($found.Name)"
        }
    }

    Write-Host ""
    if ($oauthClient) {
        Write-Info "브라우저가 열리면 GA4에 접근 권한이 있는 Google 계정으로 로그인 후 '허용' 클릭하세요."
        Write-Host ""
        & $gcloudCmd auth application-default login `
            --client-id-file="$oauthClient" `
            --scopes="https://www.googleapis.com/auth/analytics.readonly,https://www.googleapis.com/auth/cloud-platform"
    } else {
        Write-Warn "OAuth 클라이언트 JSON을 찾지 못했습니다."
        Write-Info ""
        Write-Info "회사 Google Workspace 계정은 기본 클라이언트로 인증이 차단될 수 있습니다."
        Write-Info "해결 방법:"
        Write-Info "  1. docs\gcp-setup-guide.md 를 열어 GCP OAuth 클라이언트를 발급받으세요."
        Write-Info "  2. client_secret_*.json 파일을 Downloads 폴더에 저장하세요."
        Write-Info "  3. 이 스크립트를 다시 실행하세요."
        Write-Host ""
        $try = Read-Host "  기본 클라이언트로 시도하시겠어요? (개인 Gmail만 권장) [y/N]"
        if ($try -eq "y") {
            & $gcloudCmd auth application-default login `
                --scopes="https://www.googleapis.com/auth/analytics.readonly,https://www.googleapis.com/auth/cloud-platform"
        } else {
            Write-Host ""
            Write-Info "OAuth 클라이언트 JSON 발급 후 이 스크립트를 다시 실행해주세요."
            exit 0
        }
    }
    Write-OK "인증 완료"
}

# ── Step 4: GA4 속성 ID 설정 ────────────────────────────
Write-Host ""
Write-Host "[4/4] GA4 속성 ID 설정..."

# 현재 .mcp.json에서 속성 ID 읽기
$currentId = node -e @"
try {
  const d = JSON.parse(require('fs').readFileSync('.mcp.json', 'utf8'));
  const id = d.mcpServers.ga4.env.GA_PROPERTY_ID;
  if (id && id !== '여기에_9자리_숫자_입력') process.stdout.write(id);
} catch(e) {}
"@ 2>$null

if ($currentId) {
    Write-OK "현재 등록된 속성 ID: $currentId"
    $newId = Read-Host "  다른 속성으로 변경하려면 새 ID 입력, 유지하려면 Enter"
    if ($newId) { $propertyId = $newId } else { $propertyId = $currentId }
} else {
    Write-Host ""
    Write-Info "GA4 속성 ID 찾는 방법:"
    Write-Info "  analytics.google.com → 왼쪽 하단 톱니바퀴(관리)"
    Write-Info "  → 오른쪽 '속성' 컬럼 → '속성 설정'"
    Write-Info "  → 오른쪽 상단 '속성 ID' (숫자 9자리, 예: 471063826)"
    Write-Host ""

    do {
        $propertyId = Read-Host "  GA4 속성 ID 입력"
        if ($propertyId -notmatch '^\d{6,12}$') {
            Write-Warn "숫자만 입력하세요 (예: 471063826)"
            $propertyId = $null
        }
    } while (-not $propertyId)
}

# .mcp.json 속성 ID 업데이트
node -e @"
const fs = require('fs');
const d = JSON.parse(fs.readFileSync('.mcp.json', 'utf8'));
d.mcpServers.ga4.env.GA_PROPERTY_ID = '$propertyId';
fs.writeFileSync('.mcp.json', JSON.stringify(d, null, 2) + '\n');
"@
Write-OK ".mcp.json 속성 ID 등록 완료 ($propertyId)"

# ── 설치 완료 ─────────────────────────────────────────────
Write-Host ""
Write-Host "------------------------------------------"
Write-Host "설치 완료!" -ForegroundColor Green
Write-Host ""
Write-Host "  지금 바로 시작하세요 (이 폴더에서!):"
Write-Host ""
Write-Host "    claude" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Claude가 실행되면 아래 질문을 입력해보세요:"
Write-Host ""
Write-Host "    「지난 7일 채널별 세션 수와 전환 수를 표로 정리해줘」" -ForegroundColor Yellow
Write-Host ""
Write-Host "  분석 템플릿: prompts\ 폴더"
Write-Host ""
