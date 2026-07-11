// Google Sheets MCP Server
// OAuth 2.0 인증 + 10가지 도구 제공
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { google } from "googleapis";
import { z } from "zod";
import fs from "fs";
import path from "path";
import http from "http";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CREDENTIALS_PATH = path.join(__dirname, "oauth_credentials.json");
const TOKEN_PATH = path.join(__dirname, "token.json");
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const REDIRECT_PORT = 3456;

// ── 인증 ──────────────────────────────────────────────────────────────────

function loadCredentials() {
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    throw new Error(
      "oauth_credentials.json이 없습니다.\n" +
      "docs/sheets-gcp-setup.md를 참고해 발급 후 mcp-server/ 폴더에 저장하세요."
    );
  }
  const raw = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf8"));
  const creds = raw.installed || raw.web;
  if (!creds) {
    throw new Error(
      "올바르지 않은 자격증명 파일입니다.\n" +
      "애플리케이션 유형이 '데스크톱 앱'인지 확인하세요 (파일 안에 'installed' 키가 있어야 함)."
    );
  }
  return creds;
}

async function getAuthClient() {
  const creds = loadCredentials();
  const oAuth2Client = new google.auth.OAuth2(
    creds.client_id,
    creds.client_secret,
    `http://localhost:${REDIRECT_PORT}/oauth2callback`
  );

  // 저장된 토큰이 있으면 재사용
  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8"));
    oAuth2Client.setCredentials(token);
    // 토큰 자동 갱신
    oAuth2Client.on("tokens", (tokens) => {
      const current = fs.existsSync(TOKEN_PATH)
        ? JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8"))
        : {};
      fs.writeFileSync(TOKEN_PATH, JSON.stringify({ ...current, ...tokens }));
    });
    return oAuth2Client;
  }

  // 브라우저 인증 필요
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });

  console.error("\n🔐 Google Sheets 인증이 필요합니다.");
  console.error("브라우저에서 아래 URL로 이동해 인증을 완료하세요:\n");
  console.error(authUrl);
  console.error("");

  // 브라우저 자동 열기
  try {
    const platform = process.platform;
    if (platform === "darwin") execSync(`open "${authUrl}"`);
    else if (platform === "win32") execSync(`start "" "${authUrl}"`);
    else execSync(`xdg-open "${authUrl}"`);
  } catch {
    // 자동 열기 실패 시 URL만 출력 (위에서 이미 출력됨)
  }

  // OAuth 콜백 대기
  const code = await new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, `http://localhost:${REDIRECT_PORT}`);
      const code = url.searchParams.get("code");
      const error = url.searchParams.get("error");

      if (code) {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(`
          <html><body style="font-family:sans-serif;text-align:center;padding:40px">
            <h2>✅ 인증 완료!</h2>
            <p>이 창을 닫고 Claude Code로 돌아가세요.</p>
          </body></html>
        `);
        server.close();
        resolve(code);
      } else {
        res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
        res.end(`<html><body><h2>❌ 인증 실패: ${error}</h2></body></html>`);
        server.close();
        reject(new Error(`인증 실패: ${error}`));
      }
    });

    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        reject(new Error(`포트 ${REDIRECT_PORT}이 이미 사용 중입니다. 잠시 후 다시 시도하세요.`));
      } else {
        reject(err);
      }
    });

    server.listen(REDIRECT_PORT, "localhost", () => {
      console.error(`\n로컬 인증 서버 대기 중 (포트 ${REDIRECT_PORT})...`);
    });
  });

  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
  console.error("\n✅ 인증 완료. token.json이 저장됐습니다.\n");
  return oAuth2Client;
}

// ── MCP 서버 ──────────────────────────────────────────────────────────────

const server = new McpServer({
  name: "google-sheets",
  version: "1.0.0",
});

let sheetsApi = null;

async function getSheets() {
  if (!sheetsApi) {
    const auth = await getAuthClient();
    sheetsApi = google.sheets({ version: "v4", auth });
  }
  return sheetsApi;
}

// 헥스 컬러 → Google API RGB 형식 변환
function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  return {
    red: parseInt(clean.slice(0, 2), 16) / 255,
    green: parseInt(clean.slice(2, 4), 16) / 255,
    blue: parseInt(clean.slice(4, 6), 16) / 255,
  };
}

// ── 도구 1: get_spreadsheet_info ─────────────────────────────────────────

server.tool(
  "get_spreadsheet_info",
  "스프레드시트 제목 및 시트 목록(행·열 수 포함) 조회",
  { spreadsheet_id: z.string().describe("스프레드시트 ID (URL에서 /d/ 뒤 문자열)") },
  async ({ spreadsheet_id }) => {
    const sheets = await getSheets();
    const res = await sheets.spreadsheets.get({ spreadsheetId: spreadsheet_id });
    const d = res.data;
    const list = d.sheets
      .map((s) => `  · ${s.properties.title} — ${s.properties.gridProperties.rowCount}행 × ${s.properties.gridProperties.columnCount}열`)
      .join("\n");
    return {
      content: [{ type: "text", text: `📊 ${d.properties.title}\n\n시트 목록:\n${list}` }],
    };
  }
);

// ── 도구 2: read_sheet ───────────────────────────────────────────────────

server.tool(
  "read_sheet",
  "지정 범위의 셀 데이터 읽기",
  {
    spreadsheet_id: z.string(),
    range: z.string().describe("예: 채널분석!A1:E20  또는  Sheet1"),
  },
  async ({ spreadsheet_id, range }) => {
    const sheets = await getSheets();
    const res = await sheets.spreadsheets.values.get({ spreadsheetId: spreadsheet_id, range });
    const rows = res.data.values || [];
    if (rows.length === 0) return { content: [{ type: "text", text: "해당 범위에 데이터가 없습니다." }] };
    const text = rows.map((r) => r.join("\t")).join("\n");
    return {
      content: [{ type: "text", text: `[${range}] ${rows.length}행:\n\n${text}` }],
    };
  }
);

// ── 도구 3: batch_read_sheet ─────────────────────────────────────────────

server.tool(
  "batch_read_sheet",
  "여러 범위를 API 1회 호출로 동시 읽기 (할당량 절약)",
  {
    spreadsheet_id: z.string(),
    ranges: z.array(z.string()).describe("범위 배열 (예: ['Sheet1!A1:C5', 'Sheet2!A1:B3'])"),
  },
  async ({ spreadsheet_id, ranges }) => {
    const sheets = await getSheets();
    const res = await sheets.spreadsheets.values.batchGet({ spreadsheetId: spreadsheet_id, ranges });
    const results = (res.data.valueRanges || []).map((vr) => {
      const rows = vr.values || [];
      const preview = rows.slice(0, 5).map((r) => r.join("\t")).join("\n");
      return `[${vr.range}] ${rows.length}행:\n${preview}${rows.length > 5 ? `\n... 외 ${rows.length - 5}행` : ""}`;
    });
    return { content: [{ type: "text", text: results.join("\n\n") }] };
  }
);

// ── 도구 4: write_sheet ──────────────────────────────────────────────────

server.tool(
  "write_sheet",
  "지정 범위에 데이터 쓰기 (기존 내용 덮어씀)",
  {
    spreadsheet_id: z.string(),
    range: z.string().describe("예: 채널분석!A1"),
    values: z.array(z.array(z.string())).describe("2차원 배열 (행 → 열)"),
  },
  async ({ spreadsheet_id, range, values }) => {
    const sheets = await getSheets();
    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheet_id,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    });
    return {
      content: [{ type: "text", text: `✅ ${range}에 ${values.length}행 기록 완료` }],
    };
  }
);

// ── 도구 5: append_sheet ─────────────────────────────────────────────────

server.tool(
  "append_sheet",
  "시트 마지막 행 아래에 데이터 추가",
  {
    spreadsheet_id: z.string(),
    range: z.string().describe("시트 이름 (예: Sheet1)"),
    values: z.array(z.array(z.string())),
  },
  async ({ spreadsheet_id, range, values }) => {
    const sheets = await getSheets();
    await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheet_id,
      range,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values },
    });
    return {
      content: [{ type: "text", text: `✅ ${values.length}행 추가 완료 (${range})` }],
    };
  }
);

// ── 도구 6: clear_sheet ──────────────────────────────────────────────────

server.tool(
  "clear_sheet",
  "지정 범위의 데이터 삭제 (서식은 유지)",
  {
    spreadsheet_id: z.string(),
    range: z.string().describe("예: Sheet1!A2:Z1000 (헤더 제외 전체)"),
  },
  async ({ spreadsheet_id, range }) => {
    const sheets = await getSheets();
    await sheets.spreadsheets.values.clear({ spreadsheetId: spreadsheet_id, range });
    return { content: [{ type: "text", text: `✅ ${range} 데이터 삭제 완료` }] };
  }
);

// ── 도구 7: add_sheet ────────────────────────────────────────────────────

server.tool(
  "add_sheet",
  "새 시트 탭 추가",
  {
    spreadsheet_id: z.string(),
    title: z.string().describe("새 시트 이름"),
  },
  async ({ spreadsheet_id, title }) => {
    const sheets = await getSheets();
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheet_id,
      requestBody: { requests: [{ addSheet: { properties: { title } } }] },
    });
    return { content: [{ type: "text", text: `✅ '${title}' 시트 추가 완료` }] };
  }
);

// ── 도구 8: delete_sheet ─────────────────────────────────────────────────

server.tool(
  "delete_sheet",
  "시트 탭 삭제",
  {
    spreadsheet_id: z.string(),
    sheet_title: z.string().describe("삭제할 시트 이름"),
  },
  async ({ spreadsheet_id, sheet_title }) => {
    const sheets = await getSheets();
    const info = await sheets.spreadsheets.get({ spreadsheetId: spreadsheet_id });
    const sheet = info.data.sheets.find((s) => s.properties.title === sheet_title);
    if (!sheet) throw new Error(`'${sheet_title}' 시트를 찾을 수 없습니다.`);
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheet_id,
      requestBody: {
        requests: [{ deleteSheet: { sheetId: sheet.properties.sheetId } }],
      },
    });
    return { content: [{ type: "text", text: `✅ '${sheet_title}' 시트 삭제 완료` }] };
  }
);

// ── 도구 9: create_spreadsheet ───────────────────────────────────────────

server.tool(
  "create_spreadsheet",
  "새 스프레드시트 파일 생성 후 URL 반환",
  {
    title: z.string().describe("스프레드시트 파일 이름"),
    sheet_names: z.array(z.string()).optional().describe("초기 시트 탭 이름 목록 (기본: ['Sheet1'])"),
  },
  async ({ title, sheet_names }) => {
    const sheets = await getSheets();
    const sheetList = (sheet_names || ["Sheet1"]).map((t) => ({ properties: { title: t } }));
    const res = await sheets.spreadsheets.create({
      requestBody: { properties: { title }, sheets: sheetList },
    });
    const url = `https://docs.google.com/spreadsheets/d/${res.data.spreadsheetId}`;
    return {
      content: [{ type: "text", text: `✅ '${title}' 생성 완료\n🔗 ${url}` }],
    };
  }
);

// ── 도구 10: format_cells ────────────────────────────────────────────────

server.tool(
  "format_cells",
  "셀 서식 적용 (배경색, 글자색, 굵게, 정렬)",
  {
    spreadsheet_id: z.string(),
    sheet_title: z.string().describe("서식을 적용할 시트 이름"),
    start_row: z.number().describe("시작 행 인덱스 (0부터, 예: 헤더=0)"),
    end_row: z.number().describe("끝 행 인덱스 (exclusive)"),
    start_col: z.number().describe("시작 열 인덱스 (0부터, A=0)"),
    end_col: z.number().describe("끝 열 인덱스 (exclusive)"),
    background_color: z.string().optional().describe("배경색 헥스 코드 (예: #4285f4)"),
    text_color: z.string().optional().describe("글자색 헥스 코드 (예: #ffffff)"),
    bold: z.boolean().optional().describe("굵게 여부"),
    horizontal_alignment: z.enum(["LEFT", "CENTER", "RIGHT"]).optional(),
  },
  async ({ spreadsheet_id, sheet_title, start_row, end_row, start_col, end_col, background_color, text_color, bold, horizontal_alignment }) => {
    const sheets = await getSheets();
    const info = await sheets.spreadsheets.get({ spreadsheetId: spreadsheet_id });
    const sheet = info.data.sheets.find((s) => s.properties.title === sheet_title);
    if (!sheet) throw new Error(`'${sheet_title}' 시트를 찾을 수 없습니다.`);

    const cellFormat = {};
    const fields = [];

    if (background_color) {
      cellFormat.backgroundColor = hexToRgb(background_color);
      fields.push("userEnteredFormat.backgroundColor");
    }
    if (bold !== undefined || text_color) {
      cellFormat.textFormat = {};
      if (bold !== undefined) { cellFormat.textFormat.bold = bold; fields.push("userEnteredFormat.textFormat.bold"); }
      if (text_color) { cellFormat.textFormat.foregroundColor = hexToRgb(text_color); fields.push("userEnteredFormat.textFormat.foregroundColor"); }
    }
    if (horizontal_alignment) {
      cellFormat.horizontalAlignment = horizontal_alignment;
      fields.push("userEnteredFormat.horizontalAlignment");
    }

    if (fields.length === 0) return { content: [{ type: "text", text: "적용할 서식이 없습니다." }] };

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheet_id,
      requestBody: {
        requests: [{
          repeatCell: {
            range: {
              sheetId: sheet.properties.sheetId,
              startRowIndex: start_row,
              endRowIndex: end_row,
              startColumnIndex: start_col,
              endColumnIndex: end_col,
            },
            cell: { userEnteredFormat: cellFormat },
            fields: fields.join(","),
          },
        }],
      },
    });

    return {
      content: [{
        type: "text",
        text: `✅ 서식 적용 완료 (${sheet_title} · 행 ${start_row}~${end_row - 1} · 열 ${start_col}~${end_col - 1})`,
      }],
    };
  }
);

// ── 시작 ──────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
