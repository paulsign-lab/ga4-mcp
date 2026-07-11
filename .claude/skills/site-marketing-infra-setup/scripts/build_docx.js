// Janibell 마케팅 인프라 상세 가이드 docx 빌더
const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, PageOrientation, LevelFormat, ExternalHyperlink,
  HeadingLevel, BorderStyle, WidthType, ShadingType, PageNumber, PageBreak,
  TableOfContents, TabStopType, TabStopPosition
} = require("docx");

// ============ 스타일 토큰 ============
const FONT = "Arial";
const COLOR_PRIMARY = "1E3A2A";
const COLOR_ACCENT = "C9A66B";
const COLOR_MUTED = "555555";
const COLOR_LIGHT_BG = "F4EFE6";
const COLOR_CODE_BG = "F4F2EE";
const COLOR_NOTE_BG = "FFF8E7";
const COLOR_BORDER = "9C8E73";

// ============ 헬퍼 함수 ============
const P = (text, opts={}) => new Paragraph({
  children: Array.isArray(text)
    ? text.map(t => typeof t === 'string' ? new TextRun({text: t, font: FONT}) : t)
    : [new TextRun({text, font: FONT, ...opts})],
  spacing: { before: 80, after: 80, line: 320 },
  ...opts.paragraph
});
const H = (text, level) => new Paragraph({
  heading: level,
  children: [new TextRun({text, font: FONT, bold: true, color: COLOR_PRIMARY})],
  spacing: { before: 280, after: 140 },
});
const H1 = t => H(t, HeadingLevel.HEADING_1);
const H2 = t => H(t, HeadingLevel.HEADING_2);
const H3 = t => H(t, HeadingLevel.HEADING_3);
const PB = () => new Paragraph({ children: [new PageBreak()] });

// 본문 글머리표
const BUL = (text) => new Paragraph({
  numbering: { reference: "bullets", level: 0 },
  children: [new TextRun({text, font: FONT})],
  spacing: { before: 40, after: 40, line: 300 },
});
const NUM = (text) => new Paragraph({
  numbering: { reference: "numbers", level: 0 },
  children: [new TextRun({text, font: FONT})],
  spacing: { before: 40, after: 40, line: 300 },
});

// 인라인 굵게/링크
const B = t => new TextRun({text: t, font: FONT, bold: true});
const T = t => new TextRun({text: t, font: FONT});
const Code = t => new TextRun({text: t, font: "Courier New", size: 20});
const Link = (text, url) => new ExternalHyperlink({
  children: [new TextRun({text, font: FONT, color: "0563C1", underline: {}})],
  link: url,
});

// 노트 박스(노란 배경의 1-셀 테이블)
const NOTE = (label, body) => {
  const border = { style: BorderStyle.SINGLE, size: 6, color: COLOR_ACCENT };
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [
      new TableRow({
        children: [new TableCell({
          borders: { top: border, bottom: border, left: border, right: border },
          width: { size: 9360, type: WidthType.DXA },
          shading: { fill: COLOR_NOTE_BG, type: ShadingType.CLEAR },
          margins: { top: 120, bottom: 120, left: 200, right: 200 },
          children: [
            new Paragraph({ children: [new TextRun({text: `★ ${label}`, font: FONT, bold: true, color: COLOR_PRIMARY})], spacing:{after:80} }),
            new Paragraph({ children: [new TextRun({text: body, font: FONT})] }),
          ]
        })]
      })
    ]
  });
};

// 코드 블록
const CODE = (lines) => {
  const border = { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER };
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [
      new TableRow({
        children: [new TableCell({
          borders: { top: border, bottom: border, left: border, right: border },
          width: { size: 9360, type: WidthType.DXA },
          shading: { fill: COLOR_CODE_BG, type: ShadingType.CLEAR },
          margins: { top: 120, bottom: 120, left: 160, right: 160 },
          children: lines.map(l => new Paragraph({
            children: [new TextRun({text: l, font: "Courier New", size: 18})],
            spacing: { before: 0, after: 0, line: 260 },
          }))
        })]
      })
    ]
  });
};

// 표
const TBL = (head, rows, widths) => {
  const totalW = widths.reduce((a,b)=>a+b,0);
  const border = { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER };
  const borders = { top: border, bottom: border, left: border, right: border };
  const headRow = new TableRow({
    tableHeader: true,
    children: head.map((h, i) => new TableCell({
      borders,
      width: { size: widths[i], type: WidthType.DXA },
      shading: { fill: COLOR_PRIMARY, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({ children: [new TextRun({text: h, font: FONT, bold: true, color: "FFFFFF"})], alignment: AlignmentType.CENTER })]
    }))
  });
  const bodyRows = rows.map((r, ri) => new TableRow({
    children: r.map((c, i) => new TableCell({
      borders,
      width: { size: widths[i], type: WidthType.DXA },
      shading: ri % 2 === 1 ? { fill: "FBFAF6", type: ShadingType.CLEAR } : undefined,
      margins: { top: 60, bottom: 60, left: 100, right: 100 },
      children: String(c).split("\n").map(s => new Paragraph({
        children: [new TextRun({text: s, font: FONT, size: 18})],
        spacing: { before: 20, after: 20, line: 260 }
      }))
    }))
  }));
  return new Table({
    width: { size: totalW, type: WidthType.DXA },
    columnWidths: widths,
    rows: [headRow, ...bodyRows]
  });
};

// ============ 문서 구성 ============

const children = [];

// 표지
children.push(new Paragraph({
  alignment: AlignmentType.LEFT,
  spacing: { before: 0, after: 200 },
  children: [new TextRun({ text: "JANIBELL", font: FONT, bold: true, size: 36, color: COLOR_PRIMARY })]
}));
children.push(new Paragraph({
  alignment: AlignmentType.LEFT,
  spacing: { before: 0, after: 200 },
  children: [new TextRun({ text: "마케팅 인프라 구축 가이드", font: FONT, bold: true, size: 64, color: COLOR_PRIMARY })]
}));
children.push(new Paragraph({
  alignment: AlignmentType.LEFT,
  spacing: { before: 0, after: 200 },
  children: [new TextRun({ text: "GA4 · GTM · Meta Pixel · Search Console · SEO · Looker Studio", font: FONT, size: 28, color: COLOR_MUTED })]
}));
children.push(new Paragraph({
  alignment: AlignmentType.LEFT,
  spacing: { before: 600, after: 200 },
  children: [new TextRun({ text: "janibell.com  ·  Shopify (Motion theme)", font: FONT, size: 24, color: COLOR_MUTED })]
}));
children.push(new Paragraph({
  alignment: AlignmentType.LEFT,
  spacing: { before: 0, after: 200 },
  children: [new TextRun({ text: "v2.0  ·  Last update: 2026-05-14  ·  Pattern A (키워드 URL) 적용판", font: FONT, italics: true, size: 22, color: COLOR_MUTED })]
}));
children.push(PB());

// 목차
children.push(H1("목차"));
children.push(new TableOfContents("목차", { hyperlink: true, headingStyleRange: "1-2" }));
children.push(PB());

// 0. 들어가며
children.push(H1("0. 들어가며 - 이 가이드의 사용법"));
children.push(P("janibell.com Shopify 스토어가 도메인 연결까지 완료된 시점에서, 마케팅 데이터를 수집하고 SEO와 운영을 정상화하기 위해 필요한 모든 작업을 한 문서에 담았습니다."));
children.push(P("이 가이드는 두 가지 문서와 함께 사용합니다."));
children.push(BUL("Janibell_마케팅인프라_체크리스트.xlsx → 모든 작업을 한 줄씩 체크하면서 진행하기 위한 마스터 리스트"));
children.push(BUL("janibell_gtm_container.json → GTM에 그대로 Import 하면 17개 태그·15개 트리거·11개 변수가 자동 생성됩니다"));
children.push(BUL("janibell_dataLayer_snippet.liquid → Shopify theme.liquid 안에 붙여 넣을 이벤트 발동 코드"));
children.push(P("작업은 다음 순서로 진행하는 것을 권장합니다."));
children.push(NUM("Part 2~3: GA4와 GTM 계정·컨테이너 생성 (45분)"));
children.push(NUM("Part 4: Shopify theme.liquid에 GTM 스니펫 + dataLayer 코드 삽입 (30분)"));
children.push(NUM("Part 5: Meta Pixel 연결 (선택, 30분)"));
children.push(NUM("Part 6: Search Console 등록 + sitemap (20분)"));
children.push(NUM("Part 7: SEO 기초 작업 (페이지별, 3~5시간)"));
children.push(NUM("Part 8~9: B2B 이벤트 검증 + Looker Studio 대시보드 (2~3시간)"));
children.push(NUM("Part 10: 운영 루틴 매뉴얼화 (일일/주간/월간)"));
children.push(NOTE("핵심 원칙", "B2B 사이트는 '결제 전환'이 아닌 '리드 발생'이 곧 KPI입니다. GA4 이커머스 표준 이벤트(purchase, add_to_cart)는 사용하지 않거나 의미를 다르게 정의해야 합니다. 이 가이드는 처음부터 'B2B 리드 깔때기'를 중심으로 설계되어 있습니다."));
children.push(PB());

// ============================================================
// Part 1. 개념 정리
// ============================================================
children.push(H1("Part 1. 개념 정리 - 왜 이 도구들이 모두 필요한가"));
children.push(P("처음 다루는 분도 전체 그림을 잡을 수 있도록 4가지 도구의 관계를 짧게 정리합니다. 한 번만 읽으면 됩니다."));

children.push(H2("1-1. 4가지 도구의 역할"));
children.push(TBL(
  ["도구", "역할", "비유로 설명하자면"],
  [
    ["Google Analytics 4 (GA4)", "사이트 방문자의 행동 데이터를 보관하고 분석", "데이터를 쌓는 '창고'이자 '보고서 엔진'"],
    ["Google Tag Manager (GTM)", "'어떤 클릭/제출이 일어났는지'를 GA4·Pixel 같은 도구에 전달", "데이터를 운반하는 '교통 정리원'"],
    ["Meta Pixel", "페이스북/인스타 광고 집행에 필요한 추적 코드", "광고 채널 전용 영수증 기록기"],
    ["Search Console", "구글 검색에서 우리 사이트가 어떻게 노출되는지 확인", "검색엔진과 직접 소통하는 '관계 창구'"],
  ],
  [2200, 4000, 3160]
));

children.push(H2("1-2. 데이터가 흐르는 순서"));
children.push(P("사용자가 janibell.com 'Contact Us' 버튼을 눌렀을 때 데이터는 이렇게 흐릅니다."));
children.push(CODE([
  "사용자 클릭",
  "   ↓",
  "Shopify theme.liquid 안 dataLayer.push({event:'request_quote', ...})",
  "   ↓",
  "GTM이 이 신호를 잡아 → GA4에 'request_quote' 이벤트 전송",
  "                  → Meta Pixel에 'Lead' 이벤트 전송",
  "   ↓",
  "GA4: 이벤트 보관 + Looker Studio 리포트에 반영",
  "Meta: 광고 리타게팅 모수에 자동 추가",
]));

children.push(H2("1-3. 왜 GA4에 직접 코드를 안 박고 GTM을 쓰나"));
children.push(P("GA4의 측정 ID를 Shopify에 직접 박을 수도 있지만, 그렇게 하면 이벤트를 새로 추가할 때마다 개발사를 다시 불러야 합니다. GTM을 한번 깔아두면 마케터가 GA4·Pixel·LinkedIn·Hotjar 등 어떤 도구든 코드 수정 없이 추가/제거할 수 있습니다. 한 번 더 깔아두는 수고에 비해 장기 이득이 매우 큽니다."));
children.push(NOTE("이 가이드의 선택", "Shopify에 GA4를 직접 박지 않습니다. 모든 이벤트는 GTM을 거쳐 GA4로 보냅니다. dataLayer라는 '약속된 데이터 형식'으로 한 번만 푸시하면, 동일한 데이터를 GA4·Pixel·LinkedIn 어디든 보낼 수 있습니다."));

children.push(H2("1-4. dataLayer가 뭔가요 (핵심 개념)"));
children.push(P("dataLayer는 페이지에서 '어떤 일이 일어났는지'를 GTM에게 알려주는 빈 게시판이라고 생각하면 쉽습니다. 페이지 안 어디서든 다음과 같이 한 줄만 푸시하면 됩니다."));
children.push(CODE([
  "window.dataLayer = window.dataLayer || [];",
  "window.dataLayer.push({",
  "  event: 'request_quote',",
  "  product_handle: 'akord-e-s80',",
  "  industry: 'BABY'",
  "});",
]));
children.push(P("이 한 줄을 보는 즉시 GTM은 '아, Contact Us 클릭이 일어났구나' 하고 미리 설정해둔 태그를 발사합니다. 우리가 만들 GTM 컨테이너에는 이미 이 약속(이벤트명+파라미터)이 다 들어있습니다. 개발사는 dataLayer.push 한 줄만 정확한 위치에 심어주면 됩니다."));
children.push(PB());

// ============================================================
// Part 2. GA4 설정
// ============================================================
children.push(H1("Part 2. GA4 단계별 설정 가이드"));

children.push(H2("2-1. 계정 정리 (작업 전 1회)"));
children.push(NUM("janibell 운영용 Google 계정을 한 개 정한다. 예: ops@magikan.com. 개인 Gmail은 권장하지 않음(퇴사·인수인계 리스크)"));
children.push(NUM("팀 권한 정책 결정: 마스터 1명(관리자), 마케팅 1~2명(편집자), 외부 에이전시(분석자) 정도가 일반적"));
children.push(NUM("위 계정으로 https://analytics.google.com 접속"));

children.push(H2("2-2. 계정 → 속성 → 데이터 스트림 생성"));
children.push(P("GA4의 구조는 다음과 같이 3단입니다."));
children.push(CODE([
  "Janibell (계정)",
  "  └─ Janibell - janibell.com (속성)",
  "       └─ Web Stream: janibell.com (데이터 스트림)",
]));
children.push(P("관리(좌하단 톱니) → '계정 만들기' → 계정 이름 'Janibell' → 데이터 공유 옵션 기본값 → 만들기."));
children.push(P("이어서 '속성 만들기' → 속성 이름 'Janibell - janibell.com', 시간대 'Asia/Seoul', 통화 'USD'. 비즈니스 정보 '리테일'·'대~중'."));
children.push(P("'웹' 데이터 스트림 선택 → URL https://janibell.com, 스트림 이름 'janibell.com', 향상된 측정 토글 ON 그대로 둠 → 만들기."));
children.push(P("화면 우측 상단에 'G-XXXXXXXXXX' 형태의 측정 ID가 나옵니다. 이것을 메모해두세요(GTM 변수에 한 번만 넣을 값)."));

children.push(H2("2-3. 데이터 보존 14개월 설정"));
children.push(P("관리 → 데이터 보존 → '이벤트 데이터 보존' 14개월로 변경 → 저장. (기본 2개월이면 작년 같은 달 비교 불가)"));

children.push(H2("2-4. 내부 트래픽 제외"));
children.push(P("관리 → 데이터 스트림 → janibell.com → '태그 설정 구성' → '내부 트래픽 정의'. 사무실/대표/개발사 공인 IP를 추가하고 traffic_type = 'internal'로 태깅."));
children.push(P("그 다음 관리 → 데이터 필터 → 'Internal Traffic' 필터 상태를 '사용 중'으로 변경(기본은 '테스트'). 이 단계를 안 하면 IP 등록만 해두고 실제로 제외는 안 됩니다."));

children.push(H2("2-5. 전환 이벤트(Key Event) 표시"));
children.push(P("관리 → 이벤트 → 다음 8개 이벤트가 들어오면 '주요 이벤트로 표시' 토글 ON."));
children.push(TBL(
  ["#", "이벤트명", "왜 전환인가"],
  [
    ["1", "request_quote", "PDP에서 견적 요청 = B2B 최상위 리드"],
    ["2", "contact_form_submit", "Contact 폼 제출 = 직접 리드"],
    ["3", "catalog_download_complete", "PDF 다운 = 콜드 리드 확보"],
    ["4", "file_download", "매뉴얼/스펙시트 다운 = 관심도 신호"],
    ["5", "newsletter_subscribe", "동의 받은 마케팅 리드"],
    ["6", "phone_click", "전화 시도 = 오프라인 전환"],
    ["7", "email_click", "이메일 시도 = 오프라인 전환"],
    ["8", "klaviyo_form_submit", "Klaviyo 폼 = 이메일 풀 확장"],
  ],
  [800, 3600, 4960]
));
children.push(NOTE("운영 팁", "처음에는 이벤트가 GA4에 한 번 들어와야 '주요 이벤트로 표시' 토글이 활성화됩니다. Part 3에서 GTM 미리보기로 한 번씩 발동시킨 뒤 24시간 안에 다시 와서 토글을 켜세요."));

children.push(H2("2-6. 맞춤 측정기준(Custom Dimension) 등록"));
children.push(P("이벤트 파라미터를 GA4 보고서에서 '쪼개서 볼 수 있게' 등록하는 단계입니다. 등록 안 하면 'industry=BABY' 같은 값이 데이터에 들어와도 GA4 보고서에서 나눠볼 수 없습니다."));
children.push(P("관리 → 맞춤 정의 → 맞춤 측정기준 만들기. 모두 범위는 '이벤트'."));
children.push(TBL(
  ["측정기준 이름", "범위", "이벤트 매개변수", "용도"],
  [
    ["industry", "이벤트", "industry", "산업군(BABY/PETS/CARE 등) 분리"],
    ["inquiry_type", "이벤트", "inquiry_type", "quote/sample/support/partnership 분리"],
    ["product_handle", "이벤트", "product_handle", "제품별 인기·전환 분석"],
    ["product_category", "이벤트", "product_category", "Legacy/New Technology 등 시리즈"],
    ["file_name", "이벤트", "file_name", "어떤 PDF가 다운로드 되었는지"],
    ["form_location", "이벤트", "form_location", "Contact 폼이 footer/PDP/Contact page 중 어디서 제출됐는지"],
  ],
  [2200, 1200, 2200, 3760]
));

children.push(H2("2-7. Search Console 연결"));
children.push(P("관리 → Search Console 연결 → 속성 선택 → 'Janibell - janibell.com' 속성에 연결. (Search Console 측에도 권한이 미리 있어야 하므로 Part 6을 먼저 끝내고 와도 됩니다.)"));
children.push(PB());

// ============================================================
// Part 3. GTM 설정
// ============================================================
children.push(H1("Part 3. GTM 단계별 설정 가이드"));

children.push(H2("3-1. GTM 계정·컨테이너 생성"));
children.push(P("https://tagmanager.google.com 접속 → '계정 만들기' → 계정 이름 'Janibell', 국가 '대한민국'. 컨테이너 이름 'janibell.com', 대상 플랫폼 '웹' → 만들기."));
children.push(P("생성되면 'GTM-XXXXXX' 형태의 컨테이너 ID가 나옵니다. 두 개의 코드 스니펫(<head>용, <body>용)이 보입니다. Part 4에서 Shopify에 붙여 넣을 것입니다."));

children.push(H2("3-2. 컨테이너 JSON Import (핵심 - 가장 빠른 길)"));
children.push(P("저희가 만든 janibell_gtm_container.json을 Import 하면 17개 태그 + 15개 트리거 + 11개 변수가 자동 생성됩니다. 마우스 클릭 약 30회를 줄여줍니다."));
children.push(NUM("GTM 좌측 메뉴 '관리(Admin)' → '컨테이너 가져오기(Import Container)'"));
children.push(NUM("파일 선택: janibell_gtm_container.json"));
children.push(NUM("작업공간: '기본 작업공간(Default Workspace)' 선택"));
children.push(NUM("가져오기 옵션: '병합(Merge)' + '충돌 시 기존 항목 덮어쓰기(Overwrite conflicting tags...)' 선택"));
children.push(NUM("미리보기로 추가될 항목 확인 후 '확인' → '가져오기'"));
children.push(NUM("좌측 메뉴 '변수(Variables)' → 사용자 정의 변수(Variables) → 'const.GA4_ID' 변수의 값을 본인 측정 ID(G-XXXXXXX)로 1회만 변경"));
children.push(NOTE("Import 개념 설명", "'컨테이너 JSON'은 GTM 안에 있는 모든 태그·트리거·변수를 백업/복원할 수 있는 표준 포맷입니다. 저장된 JSON을 다른 컨테이너로 Import 하면 항목들이 한 번에 똑같이 생성됩니다. 우리가 제공하는 컨테이너는 빈 컨테이너 위에 'B2B 데이터 설계' 한 세트를 통째로 얹어주는 셈입니다."));

children.push(H2("3-3. JSON Import의 내부 구조 (개념 이해용)"));
children.push(P("janibell_gtm_container.json을 열어보면 대략 이런 구조입니다."));
children.push(CODE([
  "{",
  "  \"exportFormatVersion\": 2,",
  "  \"containerVersion\": {",
  "    \"container\": {...},",
  "    \"tag\":      [ {태그 17개} ],",
  "    \"trigger\":  [ {트리거 15개} ],",
  "    \"variable\": [ {변수 11개} ],",
  "    \"folder\":   [ {폴더} ]",
  "  }",
  "}",
]));
children.push(P("tag는 '무엇을 보낼지', trigger는 '언제 보낼지', variable은 '동적 값을 어떻게 가져올지'를 정의합니다. JSON Import는 단순히 이 정의들을 GTM 데이터베이스에 INSERT 하는 것이라고 이해하면 됩니다."));

children.push(H2("3-4. 미리보기(Preview) 모드로 검증"));
children.push(P("화면 우상단 'Preview' 클릭 → URL janibell.com 입력 → Connect."));
children.push(P("실제 janibell.com이 열리면서, 별도 'Tag Assistant' 창에서 페이지에서 발생하는 dataLayer 이벤트와 발동된 태그가 실시간으로 보입니다."));
children.push(P("다음 19개 동작을 실제로 한 번씩 해보면서 모두 태그가 발동되는지 확인하세요. 발동 안 된 항목은 트리거 설정을 수정해야 합니다."));
children.push(TBL(
  ["#", "수행할 동작", "발동돼야 할 태그"],
  [
    ["1", "홈 로드", "GA4-Config, Meta-Pixel-Base"],
    ["2", "/collections/diaper-pails 진입 (Pattern A 핸들)", "GA4-Event-view_item_list"],
    ["3", "PDP 진입 (/products/akord-e-s80)", "GA4-Event-view_item"],
    ["4", "PLP에서 제품 카드 클릭", "GA4-Event-select_item"],
    ["5", "PDP에서 'Contact Us' 클릭", "GA4-Event-request_quote, Meta-Pixel-Lead"],
    ["6", "GNB 'BABY' 메뉴 클릭", "GA4-Event-nav_click"],
    ["7", "/pages/contact-us 진입", "GA4-Event-contact_form_view"],
    ["8", "Contact 폼 첫 필드 클릭", "GA4-Event-contact_form_start"],
    ["9", "Contact 폼 제출", "GA4-Event-contact_form_submit, Meta-Pixel-Lead"],
    ["10", "/pages/catalogue 진입 → Klaviyo 폼 제출", "GA4-Event-catalog_download_start"],
    ["11", "Catalog PDF 다운로드 완료", "GA4-Event-catalog_download_complete, Meta-Pixel-CompleteReg"],
    ["12", "임의 매뉴얼 PDF 클릭", "GA4-Event-file_download"],
    ["13", "tel: 링크 클릭", "GA4-Event-phone_click"],
    ["14", "mailto: 링크 클릭", "GA4-Event-email_click"],
    ["15", "Footer Newsletter 제출", "GA4-Event-newsletter_subscribe"],
    ["16", "Klaviyo 일반 팝업 제출(있다면)", "GA4-Event-klaviyo_form_submit"],
    ["17", "YouTube 영상 30% 재생", "GA4-Event-video_play"],
    ["18", "외부 도메인 링크 클릭", "(자동) click"],
    ["19", "페이지 90% 스크롤", "(자동) scroll"],
  ],
  [600, 4360, 4400]
));

children.push(H2("3-5. 게시(Submit / Publish)"));
children.push(P("검증이 끝나면 우상단 'Submit' → 버전 이름 'v1.0 - Initial launch', 설명에 '초기 17 태그 / 15 트리거 / 11 변수 구성' → Publish. 게시 즉시 실제 사용자 데이터가 GA4로 흘러 들어가기 시작합니다."));
children.push(PB());

// ============================================================
// Part 4. Shopify에 GTM + dataLayer 삽입
// ============================================================
children.push(H1("Part 4. Shopify theme.liquid에 GTM + dataLayer 삽입"));

children.push(H2("4-1. 어디에 넣어야 하나"));
children.push(P("Shopify Admin → 온라인 스토어 → 테마 → 현재 테마(Motion_final) 옆 '...' → '코드 편집' → Layout/theme.liquid를 엽니다."));
children.push(TBL(
  ["위치", "넣을 코드", "역할"],
  [
    ["<head> 바로 다음 줄", "GTM <script> 스니펫", "GTM 로더 (필수)"],
    ["<head> 마지막 직전", "dataLayer 초기화 + 페이지 메타 push 스니펫", "page_type, industry, items 자동 push"],
    ["<body> 바로 다음 줄", "GTM <noscript> 스니펫", "JS 미지원 환경 대응 (필수)"],
  ],
  [2400, 4000, 2960]
));
children.push(NOTE("주의", "Shopify의 'Online Store → Preferences → Google Analytics' 칸에는 아무것도 넣지 않습니다. GA4 추적은 100% GTM이 담당합니다. Shopify 기본 GA4 통합과 GTM이 동시에 작동하면 이벤트가 중복으로 발사됩니다."));

children.push(H2("4-2. GTM 스니펫 (두 군데에 붙여넣기)"));
children.push(P("<head> 다음 줄에 붙여넣을 코드 (GTM-XXXXXX 부분만 본인 컨테이너 ID로 교체):"));
children.push(CODE([
  "<!-- Google Tag Manager -->",
  "<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':",
  "new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],",
  "j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=",
  "'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);",
  "})(window,document,'script','dataLayer','GTM-XXXXXX');</script>",
  "<!-- End Google Tag Manager -->",
]));
children.push(P("<body> 다음 줄에 붙여넣을 코드:"));
children.push(CODE([
  "<!-- Google Tag Manager (noscript) -->",
  "<noscript><iframe src=\"https://www.googletagmanager.com/ns.html?id=GTM-XXXXXX\"",
  "height=\"0\" width=\"0\" style=\"display:none;visibility:hidden\"></iframe></noscript>",
  "<!-- End Google Tag Manager (noscript) -->",
]));

children.push(H2("4-3. dataLayer 초기화 + 페이지 메타 (janibell_dataLayer_snippet.liquid)"));
children.push(P("janibell_dataLayer_snippet.liquid 파일에는 페이지 종류·산업군·제품 정보를 자동으로 dataLayer에 푸시하는 코드가 들어있습니다. theme.liquid의 <head> 마지막 직전에 통째로 붙여 넣습니다(또는 별도 스니펫으로 만들어서 {% render %} 합니다)."));
children.push(P("이 스니펫이 자동으로 처리해주는 것:"));
children.push(BUL("페이지 종류 자동 분류: home / collection / product / page / blog / article / cart / search / 404"));
children.push(BUL("컬렉션 페이지 → industry 자동 매핑 (BABY/PETS/CARE/MEDICAL/PUBLIC/HOSPITALITY/OFFICE/HOME)"));
children.push(BUL("PDP 진입 시 view_item dataLayer.push (product_handle, product_title, industry)"));
children.push(BUL("PLP 진입 시 view_item_list dataLayer.push"));
children.push(BUL("Contact 폼 제출 시 contact_form_submit + 폼 필드 (industry, inquiry_type, company, country)"));
children.push(BUL("Catalog PDF 다운로드 후 catalog_download_complete (Klaviyo 콜백 연동)"));

children.push(H2("4-4. Contact 폼 필드 확장 (B2B용)"));
children.push(P("현재 /pages/contact-us의 폼은 Name/Email/Message만 있습니다. B2B 리드 퀄리티를 위해 다음 필드를 추가하세요. Shopify Admin → 온라인 스토어 → 테마 → 코드 편집 → Sections/contact-form.liquid 또는 contact 폼이 들어 있는 섹션 파일을 엽니다."));
children.push(TBL(
  ["필드명 (HTML name)", "유형", "옵션 (있는 경우)", "필수 여부"],
  [
    ["contact[name]", "text", "—", "Y (기존)"],
    ["contact[email]", "email", "—", "Y (기존)"],
    ["contact[company]", "text", "—", "Y"],
    ["contact[country]", "select", "United States / Canada / Mexico / Other", "Y"],
    ["contact[industry]", "select", "Baby Care / Pet Care / Healthcare / Senior Care / Hospitality / Office / Retail / Other", "Y"],
    ["contact[inquiry_type]", "radio", "Quote / Sample / Support / Partnership", "Y"],
    ["contact[quantity_range]", "select", "<100 / 100~500 / 500~2000 / 2000+", "N"],
    ["contact[body]", "textarea", "—", "N (기존)"],
  ],
  [2600, 1400, 4000, 1360]
));
children.push(P("폼이 제출되면 janibell_dataLayer_snippet.liquid가 자동으로 dataLayer.push 합니다."));
children.push(PB());

// ============================================================
// Part 5. Meta Pixel
// ============================================================
children.push(H1("Part 5. Meta Pixel 설정 (Facebook / Instagram 광고용)"));
children.push(P("향후 Meta 광고를 집행할 계획이 있다면 미리 설치해두는 것이 좋습니다. 광고를 안 해도 픽셀 ID만 발급받고 GTM에 넣어 두면, 광고 시작 시점에 이미 수개월치 모수가 쌓여 있어 효과가 큽니다."));

children.push(H2("5-1. Meta 비즈니스 계정"));
children.push(NUM("https://business.facebook.com 에서 비즈니스 계정 'Janibell' 생성 (Magikan 계정 활용 가능)"));
children.push(NUM("이벤트 관리자(Events Manager) → 데이터 소스 → 'Web' → '픽셀 만들기' → 이름 'Janibell'"));
children.push(NUM("발급된 픽셀 ID(15자리 숫자) 메모"));

children.push(H2("5-2. GTM에 Pixel ID 한 번만 입력"));
children.push(P("GTM → 변수 → 사용자 정의 변수 → 'const.META_PIXEL_ID' 변수 값을 본인 픽셀 ID로 교체. 'Meta-Pixel-Base' / 'Meta-Pixel-Lead' / 'Meta-Pixel-CompleteReg' 세 태그가 자동으로 이 변수를 사용합니다."));

children.push(H2("5-3. Pixel 이벤트 매핑"));
children.push(TBL(
  ["GA4 이벤트", "Pixel 이벤트(자동 변환)", "용도"],
  [
    ["request_quote", "Lead", "PDP 견적 리드 - 광고 리타게팅 모수"],
    ["contact_form_submit", "Lead", "Contact 폼 리드 - 광고 리타게팅 모수"],
    ["catalog_download_complete", "CompleteRegistration", "콜드 리드 - 일반 광고 모수"],
    ["view_item", "ViewContent", "리타게팅 (관심 제품)"],
    ["newsletter_subscribe", "Subscribe", "이메일 풀 확장 모수"],
  ],
  [2800, 2600, 3960]
));

children.push(H2("5-4. Conversion API(CAPI) - 보류 권장"));
children.push(P("CAPI는 iOS14.5+ 광고 식별자 거부 대응으로 서버에서 직접 픽셀에 이벤트를 보내는 방식입니다. 구축에 개발 공수가 들고, 광고를 본격 집행하기 전에는 ROI가 낮습니다. 우선은 픽셀(브라우저) 방식으로만 충분합니다."));
children.push(PB());

// ============================================================
// Part 6. Search Console
// ============================================================
children.push(H1("Part 6. Search Console 등록 + sitemap 제출"));

children.push(H2("6-1. 속성 추가 - 반드시 '도메인 속성'으로"));
children.push(P("https://search.google.com/search-console 접속 → '속성 추가' → '도메인' 탭 선택 → 'janibell.com' 입력. 'URL 접두어' 탭은 사용하지 마세요. (도메인 속성을 쓰면 https/http, www/non-www, 모든 하위 도메인이 한 번에 다 잡힙니다.)"));
children.push(P("DNS TXT 레코드 인증 화면이 나옵니다. 도메인 등록업체(Shopify Domains 또는 Cafe24/가비아 등) 관리화면에 들어가 TXT 레코드를 추가합니다."));
children.push(CODE([
  "Type:  TXT",
  "Host:  @  (또는 빈칸)",
  "Value: google-site-verification=AAAAAAAA... (Search Console이 준 문자열)",
  "TTL:   기본값",
]));
children.push(P("DNS 반영까지 보통 5분~수시간 걸립니다. 반영되면 Search Console로 돌아와 '확인' 클릭."));

children.push(H2("6-2. sitemap.xml 제출"));
children.push(P("Shopify는 /sitemap.xml을 자동 생성합니다. Search Console → Sitemaps → 'sitemap.xml' 입력 → '제출'. 상태가 'Success'로 바뀌면 끝."));

children.push(H2("6-3. 핵심 5개 페이지 색인 요청"));
children.push(P("Search Console 상단 검색바에 URL을 넣으면 '실시간 URL 검사 → 색인 요청'을 할 수 있습니다. 다음 페이지들을 우선 색인 요청 (URL 핸들 마이그레이션 후 새 URL로 요청해야 함):"));
children.push(BUL("https://janibell.com/  (홈)"));
children.push(BUL("https://janibell.com/pages/brand-story  (오타 수정 후)"));
children.push(BUL("https://janibell.com/pages/sustainability"));
children.push(BUL("https://janibell.com/pages/contact-us"));
children.push(BUL("https://janibell.com/pages/catalogue"));
children.push(BUL("https://janibell.com/collections/diaper-pails  (Pattern A 컬렉션 - BABY)"));
children.push(BUL("https://janibell.com/collections/pet-waste-pails  (Pattern A 컬렉션 - PETS)"));
children.push(BUL("https://janibell.com/collections/adult-care-disposal  (Pattern A 컬렉션 - CARE)"));
children.push(BUL("https://janibell.com/collections/medical-waste-pails  (Pattern A 컬렉션 - MEDICAL)"));
children.push(BUL("https://janibell.com/collections/sanitary-disposal-bins  (Pattern A 컬렉션 - PUBLIC)"));
children.push(BUL("https://janibell.com/collections/hospitality-sanitary-bins  (Pattern A 컬렉션 - HOSPITALITY)"));
children.push(BUL("https://janibell.com/collections/office-sanitary-bins  (Pattern A 컬렉션 - OFFICE)"));
children.push(BUL("https://janibell.com/collections/home-odor-sealing-pails  (Pattern A 컬렉션 - HOME)"));

children.push(H2("6-4. GA4↔Search Console 양방향 연결"));
children.push(P("GA4 관리 → 'Search Console 연결' → 속성 선택. 그리고 Search Console 설정 → '사용자 및 권한'에 GA4 운영 계정을 '소유자'로 추가."));
children.push(P("연결되면 GA4 보고서에 '인수 → Search Console' 메뉴가 생기고, 검색 노출수·CTR·검색어를 GA4 안에서도 볼 수 있게 됩니다."));

children.push(H2("6-5. Bing Webmaster Tools (선택)"));
children.push(P("https://www.bing.com/webmasters → 'Search Console에서 가져오기' 1-click. 미국·캐나다 트래픽 중 Bing 점유율이 약 6~8%로 무시할 수 없습니다."));
children.push(PB());

// ============================================================
// Part 7. SEO 기초 작업
// ============================================================
children.push(H1("Part 7. SEO 기초 작업"));

children.push(H2("7-1. 페이지별 Title / Meta Description"));
children.push(P("체크리스트의 '6_SEO_페이지별' 시트에 페이지별 권장 카피가 들어 있습니다. 한 번에 다 적용하기 어렵다면 다음 우선순위로:"));
children.push(NUM("홈, /pages/contact-us, /pages/catalogue, /pages/brand-story (P0)"));
children.push(NUM("/collections/* 8개 (P0)"));
children.push(NUM("/pages/technology, /pages/sustainability, /pages/faq (P1)"));
children.push(NUM("PDP는 Shopify가 기본값을 잘 만들어주므로 후순위 (P2)"));
children.push(NOTE("Shopify에서 수정하는 위치", "각 페이지의 'Search engine listing preview' 영역. 컬렉션은 컬렉션 편집, 페이지는 페이지 편집, 제품은 제품 편집 화면 가장 아래에 있습니다."));

children.push(H2("7-2. 구조화 데이터(JSON-LD)"));
children.push(P("구조화 데이터는 검색 결과 미리보기를 풍부하게 만들어 CTR을 5~15% 올립니다. 다음 4종을 우선 적용:"));
children.push(TBL(
  ["스키마", "어느 페이지", "Shopify에서의 위치"],
  [
    ["Organization", "전 페이지", "theme.liquid 안에 1회"],
    ["Product", "/products/*", "product-template.liquid"],
    ["BreadcrumbList", "전 페이지", "theme.liquid 안에 1회"],
    ["FAQPage", "/pages/faq", "page.faq.liquid (가장 SEO 효과 큼)"],
  ],
  [2200, 2400, 4760]
));
children.push(P("Organization JSON-LD 샘플 (theme.liquid <head>에):"));
children.push(CODE([
  "<script type=\"application/ld+json\">",
  "{",
  "  \"@context\":\"https://schema.org\",",
  "  \"@type\":\"Organization\",",
  "  \"name\":\"Janibell\",",
  "  \"url\":\"https://janibell.com\",",
  "  \"logo\":\"https://janibell.com/cdn/shop/files/janibell-logo.png\",",
  "  \"sameAs\":[\"https://www.magikan.com\",\"https://www.linkedin.com/company/janibell\"],",
  "  \"contactPoint\":[{\"@type\":\"ContactPoint\",\"contactType\":\"sales\",\"email\":\"sales@janibell.com\",\"areaServed\":\"US\"}]",
  "}",
  "</script>",
]));

children.push(H2("7-3. URL 핸들 마이그레이션 - Pattern A (키워드 URL)"));
children.push(P("현재 GNB의 컬렉션 7개가 /collections/baby사본 등 '사본' 접미사 URL이고, 메뉴 라벨과 핸들이 어긋난 상태입니다(예: 'BABY' 메뉴가 /collections/home사본을 가리킴). 이것을 SEO 키워드를 살린 'Pattern A' URL로 일괄 재핸들링합니다."));
children.push(P("Pattern A 핸들 매핑:"));
children.push(TBL(
  ["메뉴 라벨", "Pattern A 핸들", "타겟 검색어"],
  [
    ["HOME", "/collections/home-odor-sealing-pails", "home odor-sealing pail"],
    ["BABY", "/collections/diaper-pails", "diaper pail, wholesale diaper pail"],
    ["PETS", "/collections/pet-waste-pails", "pet waste disposal, litter pail"],
    ["CARE", "/collections/adult-care-disposal", "adult incontinence disposal, senior care pail"],
    ["MEDICAL", "/collections/medical-waste-pails", "medical waste container, clinical waste bin"],
    ["PUBLIC", "/collections/sanitary-disposal-bins", "feminine hygiene bin, sanitary disposal"],
    ["HOSPITALITY", "/collections/hospitality-sanitary-bins", "hotel sanitary bin, hospitality disposal"],
    ["OFFICE", "/collections/office-sanitary-bins", "office washroom bin, workplace disposal"],
  ],
  [2000, 4000, 3360]
));
children.push(P("왜 Pattern A인가 — B2B 구매자는 '산업군'이 아니라 '제품 카테고리 키워드'로 검색합니다 (\"diaper pail wholesale\", \"adult incontinence pail\"). 컬렉션 페이지가 PDP보다 SEO 상 강하므로(콘텐츠 양이 풍부), URL 핸들에 핵심 키워드를 박는 것이 가장 비용 대비 효과가 높습니다."));
children.push(P("Shopify 작업 순서 (체크리스트 9_URL_리다이렉트 시트에 동일하게 정리):"));
children.push(NUM("Shopify Admin → Products → Collections → '사본' 7개 + 'home' 컬렉션 각각 클릭"));
children.push(NUM("각 컬렉션 하단 'Search engine listing' → 'Edit' → handle을 위 표의 Pattern A로 수정 + Title도 함께 수정 (체크리스트 6_SEO_페이지별 시트 참고)"));
children.push(NUM("Navigation → URL redirects → 'Add URL redirect'로 9개 행 입력 (사본 7개 + home 1개 + brand-stroy→brand-story 1개)"));
children.push(NUM("Main menu 편집 → 각 라벨(BABY/PETS/...)이 새 Pattern A URL을 가리키도록 재연결"));
children.push(NUM("Search Console → 새 URL 9개 'Request Indexing' 한 번씩"));
children.push(NUM("Brand Story 페이지 핸들 'brand-stroy'(오타) → 'brand-story'로 수정 + 위 3번 redirect 표에 함께 포함"));
children.push(NOTE("코드는 이미 적용됨", "janibell_dataLayer_snippet.liquid는 v2.0에서 INDUSTRY_MAP에 Pattern A 핸들 8개와 LEGACY_MAP에 옛 핸들 8개를 이중으로 가지고 있습니다. janibell_gtm_container.json의 lookup.pagePath_industry 변수에도 동일하게 16행이 들어 있어요. 마이그레이션 직후 며칠간 옛 URL로 들어오는 트래픽도 정상적으로 industry로 분류됩니다. 1~2개월 후 옛 URL 트래픽이 거의 0이 되면 LEGACY_MAP 8행을 제거해도 됩니다."));

children.push(H2("7-4. 이미지 alt 일괄 점검"));
children.push(P("Shopify Admin → Settings → Files → 이미지 클릭 → alt 입력. 대량 일괄 편집은 'Bulk image alt' 같은 무료 앱을 사용하면 빠릅니다. 모든 PDP 메인 이미지와 Hero 영역 이미지의 alt가 비어 있지 않게 합니다."));

children.push(H2("7-5. Core Web Vitals 측정"));
children.push(P("https://pagespeed.web.dev 에서 / (홈), /collections/diaper-pails (Pattern A 컬렉션 예시), /products/akord-e-s80 (PDP) 세 페이지를 모바일/PC로 측정. LCP < 2.5s, CLS < 0.1, INP < 200ms 목표."));
children.push(P("문제 시 가장 흔한 원인: Hero 이미지 용량 과다 → WebP 변환 + Shopify CDN srcset 활용 → 1차로 해결됨."));
children.push(PB());

// ============================================================
// Part 8. B2B 데이터 설계 철학
// ============================================================
children.push(H1("Part 8. B2B 데이터 설계 철학"));

children.push(H2("8-1. 왜 GA4 표준 이벤트를 안 쓰는가"));
children.push(P("GA4는 기본적으로 'purchase / add_to_cart / begin_checkout' 같은 D2C 이커머스 이벤트를 표준으로 제공합니다. Janibell은 PDP에 'Add to Cart'가 없고 모든 거래가 견적·계약 기반이므로, 이 이벤트를 억지로 쓰면:"));
children.push(BUL("'전자상거래 보고서'가 영원히 0으로 비어 있어서 GA4 화면이 늘 비어 보이게 됩니다."));
children.push(BUL("실제 의미 있는 행동(견적 요청, 카탈로그 다운로드)이 보고서 사이드바에서 보이지 않습니다."));
children.push(P("그래서 우리는 'view_item' 같은 깔때기 상단 이벤트만 GA4 표준을 따르고, 깔때기 중후단은 모두 커스텀 이벤트로 설계했습니다."));

children.push(H2("8-2. B2B 리드 깔때기"));
children.push(P("이 깔때기를 GA4 '탐색 → 유입경로' 보고서에 그대로 만들 수 있습니다."));
children.push(TBL(
  ["단계", "이벤트", "북미 B2B 평균(참고)", "Janibell 1차 목표"],
  [
    ["1. 사이트 방문", "page_view", "—", "월 5,000 세션"],
    ["2. 제품 관심", "view_item", "20% 세션", "1,000 view_item"],
    ["3. 카탈로그 다운/Contact 도달", "catalog_view + contact_form_view", "4% 세션", "200 도달"],
    ["4. 카탈로그 다운로드 / Contact 폼 시작", "catalog_download_start + contact_form_start", "1.5% 세션", "75 시작"],
    ["5. 견적/연락 리드 완성", "request_quote + contact_form_submit + catalog_download_complete", "0.6% 세션", "30 리드/월"],
  ],
  [2200, 4000, 1800, 1360]
));
children.push(NOTE("핵심 지표 정의", "월간 'Qualified Lead' = request_quote + contact_form_submit + catalog_download_complete 의 합. 이 한 숫자를 'janibell 월간 KPI'로 단순화하길 권장합니다."));

children.push(H2("8-3. industry 측정기준이 핵심인 이유"));
children.push(P("janibell은 한 사이트로 8개 산업군(HOME/BABY/PETS/CARE/MEDICAL/PUBLIC/HOSPITALITY/OFFICE)을 동시에 다룹니다. industry 측정기준이 없으면:"));
children.push(BUL("어느 산업군이 PDP는 많이 보지만 견적이 안 나는지 모릅니다."));
children.push(BUL("Looker 대시보드에서 '산업군별 비교'를 한 줄에 그릴 수 없습니다."));
children.push(P("janibell_dataLayer_snippet.liquid의 INDUSTRY_MAP 변수와 GTM의 lookup.pagePath_industry 변수가 /collections/diaper-pails → 'BABY', /collections/pet-waste-pails → 'PETS' 식으로 자동 매핑합니다. PDP/PLP/Contact/Catalog 모든 이벤트에 industry가 자동으로 따라붙어요."));
children.push(PB());

// ============================================================
// Part 9. Looker Studio 대시보드
// ============================================================
children.push(H1("Part 9. Looker Studio - B2B 리드 1페이지 대시보드"));

children.push(H2("9-1. 보고서 생성 + 데이터 소스 연결"));
children.push(NUM("https://lookerstudio.google.com 접속 → '빈 보고서 만들기'"));
children.push(NUM("데이터 소스 선택 화면에서 'Google Analytics' 커넥터 선택 → 본인 GA4 속성 'Janibell - janibell.com' 선택"));
children.push(NUM("보고서 이름 'Janibell - B2B Lead Daily Dashboard'"));

children.push(H2("9-2. 1페이지 그리드 레이아웃"));
children.push(P("페이지 크기는 1280×900 또는 1600×900을 권장합니다. 6행 그리드를 만들고 위에서부터 차례로 배치합니다."));
children.push(TBL(
  ["행", "위젯 1", "위젯 2", "위젯 3", "위젯 4"],
  [
    ["1. 핵심 KPI", "어제 리드", "이번주 리드", "이번달 리드", "리드/세션 효율"],
    ["2. 깔때기/유형", "리드 깔때기 (가로막대)", "리드 유형 도넛", "—", "—"],
    ["3. 산업군", "산업군별 리드 (가로막대)", "산업군별 PDP 조회", "—", "—"],
    ["4. 유입/랜딩", "유입 채널 TOP10 (표)", "랜딩 페이지 TOP10 (표)", "—", "—"],
    ["5. 콘텐츠", "제품 인기 TOP10 (표)", "다운로드 자산 TOP5 (표)", "—", "—"],
    ["6. 트렌드", "일별 리드 30일 (꺾은선)", "검색어 TOP10 (표·GSC)", "—", "—"],
  ],
  [1400, 2000, 2000, 2000, 1960]
));
children.push(P("각 위젯의 측정항목/차원은 체크리스트 '4_Looker_위젯스펙' 시트에 모두 정리되어 있습니다."));

children.push(H2("9-3. 계산된 필드(Calculated Fields) 만들기"));
children.push(P("'리드 이벤트수'와 같이 여러 이벤트를 합친 지표는 계산된 필드로 만듭니다. 데이터 소스 → '필드 추가' → 이름 'leads', 수식:"));
children.push(CODE([
  "CASE",
  "  WHEN Event name IN ('request_quote','contact_form_submit','catalog_download_complete')",
  "  THEN Event count",
  "  ELSE 0",
  "END",
]));
children.push(P("동일한 방식으로 'leads_quote' (request_quote만), 'leads_form' (contact_form_submit만)을 만들면 도넛 차트에 쓸 수 있습니다."));

children.push(H2("9-4. 일일 이메일 스케줄"));
children.push(P("보고서 우상단 '공유' → '이메일 일정' → 빈도 '매일' 또는 '평일만' → 시간 '09:00 KST' → 수신자 본인 + 대표 + 마케팅 1명. 형식 PDF."));
children.push(NOTE("운영 팁", "처음 2주는 매일 봅니다. 어떤 위젯이 정작 안 보는지 알게 됩니다. 그 후에는 '월요일 아침 + 매월 1일' 정도로 줄여도 충분합니다. 위젯이 너무 많으면 아무도 안 봅니다."));
children.push(PB());

// ============================================================
// Part 10. 운영 루틴
// ============================================================
children.push(H1("Part 10. 운영 루틴 - 일일·주간·월간"));

children.push(H2("10-1. 일일 5분 루틴 (매일 오전 09:30)"));
children.push(P("아침에 메일로 받은 Looker 대시보드 PDF를 열고, Search Console 알림 메일을 확인합니다. 다음 6가지만 5분 안에 훑습니다."));
children.push(NUM("어제 리드 수: 일주일 평균 대비 ±20% 이내인가?"));
children.push(NUM("새 알림 메일: Search Console 보안/수동 조치 알림이 있나?"));
children.push(NUM("Search Console > 색인 > 페이지: 신규 'Not Indexed' 항목이 있나?"));
children.push(NUM("Looker > 일별 리드 추이 그래프: 어제 점이 추세선에서 크게 벗어났나?"));
children.push(NUM("Looker > 유입 채널: 비정상적인 'Referral' 스파이크가 있나(스팸 가능성)?"));
children.push(NUM("어제 발행한 콘텐츠/캠페인이 있다면, 해당 URL의 노출수가 0이 아닌지 확인"));

children.push(H2("10-2. 주간 30분 회의 (매주 월 11:00)"));
children.push(P("Looker 대시보드를 함께 보면서 3개 질문에 답합니다."));
children.push(NUM("이번 주 가장 많이 본 산업군은? 그 산업군의 리드율은 평소 대비 어떤가?"));
children.push(NUM("이번 주 가장 많이 본 제품 TOP3는? 그 제품들이 견적으로 전환되었나?"));
children.push(NUM("Search Console 상위 쿼리에 변화가 있나? (새로 등장하거나 사라진 키워드)"));
children.push(P("의사결정 항목 1개 이상을 슬랙에 적고 회의 종료. 데이터 보는 회의는 '결정' 1개로 끝내야 일주일 뒤에도 흐름이 이어집니다."));

children.push(H2("10-3. 월간 60분 SEO 리뷰 (매월 1일)"));
children.push(NUM("Search Console > 실적 > 28일 vs 직전 28일 비교: 클릭/노출/CTR/평균순위"));
children.push(NUM("상위 검색어 변화: 새로 등장한 키워드는 콘텐츠로 강화할 가치가 있는가?"));
children.push(NUM("페이지별 클릭: 콘텐츠를 추가/리프레시 할 페이지 1~2개 선정"));
children.push(NUM("Core Web Vitals: 'Poor' URL 0개 유지되고 있는가?"));
children.push(NUM("스키마: 'FAQPage / Product / Organization' 모두 '유효' 상태 유지되는가?"));
children.push(NUM("월간 KPI 한 줄 정리: 'Qualified Lead = X건 / Goal=30건 / Run-rate=Y'"));
children.push(PB());

// ============================================================
// Part 11. 발견된 사이트 이슈 정리
// ============================================================
children.push(H1("Part 11. 발견된 사이트 이슈 - 데이터 작업과 함께 처리"));
children.push(P("2026-05-14 janibell.com 크롤링 분석 결과 입니다. P0 항목은 GA4/GTM 설치 전·중에 함께 처리해야 깨끗한 데이터가 쌓입니다. 자세한 권장 조치는 체크리스트 '7_사이트_발견이슈' 시트 참고."));
children.push(TBL(
  ["#", "이슈", "우선순위"],
  [
    ["1", "컬렉션 7개 URL '사본' 접미사 + 메뉴-핸들 매핑 불일치 → Pattern A 키워드 URL로 재핸들링 (체크리스트 9_URL_리다이렉트 시트 참고)", "P0"],
    ["2", "Brand Story 페이지 URL이 'brand-stroy' 오타", "P0"],
    ["3", "GNB의 Products/Legacy/New Technology 메뉴 3개가 모두 /pages/technology로 동일 링크", "P0"],
    ["4", "전 제품 가격 $0.00 + PDP에 'Add to Cart' 없음 (B2B 의도이면 'Contact for Pricing'으로 명시)", "P1"],
    ["5", "Shopify product.vendor가 'janibell.dev'로 일괄 표시", "P1"],
    ["6", "GA4/GTM/Meta Pixel 미설치(Klaviyo만 있음)", "P0"],
    ["7", "_fwb / __bs_imweb / _imweb_login_state 등 아임웹 잔여 쿠키", "P2"],
    ["8", "/pages/catalogue에 Klaviyo 폼/PDF 다운로드 게이트 미연결", "P0"],
    ["9", "Contact 폼에 B2B 필수 필드(Company/Country/Industry/InquiryType) 없음", "P0"],
    ["10", "Search Console 속성 미등록", "P0"],
    ["11", "Sustainability 페이지에 본문 미배포 (Migration Notice만 노출)", "P1"],
  ],
  [600, 7000, 1760]
));
children.push(PB());

// ============================================================
// 부록 A. GTM 컨테이너 JSON 구조
// ============================================================
children.push(H1("부록 A. janibell_gtm_container.json 구조 설명"));
children.push(P("Import 한 컨테이너 안에 무엇이 들어 있는지 한 번 들여다보면, 다음에 직접 태그를 추가할 때도 흐름이 잡힙니다."));

children.push(H2("A-1. 폴더 구조"));
children.push(BUL("GA4 - Tags : GA4 관련 태그 17개"));
children.push(BUL("GA4 - Triggers : 트리거 15개 (페이지뷰/클릭/폼/커스텀이벤트)"));
children.push(BUL("Variables : 사용자 정의 변수 11개 (dataLayer 변수 + Lookup 1개 + 상수 2개)"));
children.push(BUL("Meta Pixel : Pixel 베이스 1개 + Lead/CompleteReg 2개"));

children.push(H2("A-2. 자주 수정할 변수 3개"));
children.push(TBL(
  ["변수명", "기본값", "본인 값으로 교체"],
  [
    ["const.GA4_ID", "G-XXXXXXX", "본인 GA4 측정 ID"],
    ["const.META_PIXEL_ID", "0000000000000000", "Meta 픽셀 ID (광고 계획 시)"],
    ["lookup.pagePath_industry", "(테이블)", "/collections/<slug> 신규 추가 시 행 추가"],
  ],
  [2800, 3000, 3560]
));

children.push(H2("A-3. 새 산업군 컬렉션이 추가되면"));
children.push(P("Pattern A 네이밍 컨벤션(키워드 URL)을 그대로 따릅니다. 예: 자동차 시장 진출로 새 컬렉션을 추가한다면, 핸들은 'automotive-disposal-bins' (키워드 형태). GTM의 lookup.pagePath_industry 변수에 한 행만 추가합니다."));
children.push(CODE([
  "Input                                       →  Output",
  "/collections/automotive-disposal-bins        →  AUTOMOTIVE",
]));
children.push(P("janibell_dataLayer_snippet.liquid의 INDUSTRY_MAP에도 같은 한 줄을 추가:"));
children.push(CODE([
  "'automotive-disposal-bins' : 'AUTOMOTIVE',",
]));
children.push(P("그 외 GA4 이벤트, 태그, 트리거는 손댈 필요 없습니다. industry 측정기준에 'AUTOMOTIVE'가 자동으로 들어와요. 새 산업군 추가에 드는 시간 = 5분."));

children.push(PB());

// 닫기
children.push(H1("끝맺으며"));
children.push(P("이 가이드는 처음부터 끝까지 한 번 실행하고 나면 다시 펼 일이 줄어들도록 설계되었습니다. 다만 다음 두 시점에는 다시 펼쳐 보길 권장드립니다."));
children.push(BUL("새로운 산업군(컬렉션)/제품 라인을 추가할 때 → 부록 A-3 참고"));
children.push(BUL("새 페이지/캠페인을 런칭할 때 → Part 6, Part 7"));
children.push(P("문서·체크리스트·GTM JSON·dataLayer 코드 네 파일이 한 세트로 움직입니다. 한 파일을 수정하면 다른 파일도 같이 업데이트하는 것을 기본 원칙으로 운영하시면 됩니다."));

// ============ 도큐먼트 빌드 ============
const doc = new Document({
  creator: "Janibell",
  title: "Janibell 마케팅 인프라 구축 가이드",
  description: "GA4 / GTM / Meta Pixel / Search Console / SEO / Looker Studio",
  styles: {
    default: { document: { run: { font: FONT, size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, font: FONT, color: COLOR_PRIMARY },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: FONT, color: COLOR_PRIMARY },
        paragraph: { spacing: { before: 280, after: 140 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: FONT, color: COLOR_PRIMARY },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 } },
    ],
  },
  numbering: {
    config: [
      { reference: "bullets",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbers",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: "Janibell  ·  마케팅 인프라 구축 가이드", font: FONT, size: 18, color: COLOR_MUTED })]
        })]
      })
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "— ", font: FONT, size: 18, color: COLOR_MUTED }),
            new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 18, color: COLOR_MUTED }),
            new TextRun({ text: " —", font: FONT, size: 18, color: COLOR_MUTED }),
          ]
        })]
      })
    },
    children: children
  }]
});

Packer.toBuffer(doc).then(buffer => {
  const out = "/sessions/compassionate-sweet-noether/mnt/outputs/janibell_setup/Janibell_마케팅인프라_가이드.docx";
  fs.writeFileSync(out, buffer);
  console.log("Saved:", out);
});
