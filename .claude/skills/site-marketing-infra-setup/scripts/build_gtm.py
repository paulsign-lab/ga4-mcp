"""
Janibell GTM 컨테이너 JSON 생성기
GTM 관리자 → 컨테이너 가져오기 → 이 JSON 선택 → 병합 + 덮어쓰기로 Import
"""
import json
from datetime import datetime

ACC = "1234567890"   # placeholder accountId (Import 시 자동 매핑)
CONT = "9876543210"  # placeholder containerId

now = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.000Z")

# ---------- Helpers ----------
# GTM 컨테이너 JSON의 파라미터 type 필드는 반드시 대문자 enum이어야 함:
# TEMPLATE / BOOLEAN / INTEGER / LIST / MAP / TAG_REFERENCE / TRIGGER_REFERENCE
_TYPE_MAP = {
    "template": "TEMPLATE",
    "boolean":  "BOOLEAN",
    "integer":  "INTEGER",
    "list":     "LIST",
    "map":      "MAP",
    "tagref":   "TAG_REFERENCE",
    "triggerref":"TRIGGER_REFERENCE",
}
def param(t, k, v=None, **extra):
    # 소문자로 들어오면 대문자 enum으로 자동 변환 (이미 대문자면 그대로 통과)
    t_up = _TYPE_MAP.get(t, t.upper() if t.islower() else t)
    p = {"type": t_up, "key": k}
    if v is not None: p["value"] = v
    p.update(extra)
    return p

# ---------- Variables ----------
variables = []
VAR_ID = 1
def add_var(name, var_type, params=None, folder_id=None, description=""):
    global VAR_ID
    v = {
        "accountId": ACC,
        "containerId": CONT,
        "variableId": str(VAR_ID),
        "name": name,
        "type": var_type,
        "parameter": params or [],
        "fingerprint": str(VAR_ID * 1000),
    }
    if folder_id:
        v["parentFolderId"] = str(folder_id)
    if description:
        v["notes"] = description
    variables.append(v)
    VAR_ID += 1
    return v

# c = constant, v = dataLayer variable, smm = lookup table, jsm = JS macro
add_var("const.GA4_ID", "c", [param("template", "value", "G-5T5VJM4ZQ1")],
        folder_id=3, description="GA4 측정 ID (Janibell 운영 계정에서 발급된 실측값).")
add_var("const.META_PIXEL_ID", "c", [param("template", "value", "0000000000000000")],
        folder_id=3, description="Meta(Facebook) 픽셀 ID. 광고 사용 시점에 본인 ID로 변경하세요.")
add_var("const.CATALOG_KLAVIYO_FORM_ID", "c", [param("template", "value", "TJJpWA")],
        folder_id=3, description="Janibell 카탈로그 게이트용 Klaviyo 폼 ID. 폼 교체 시 이 값만 수정.")
add_var("dl.items", "v", [param("template", "name", "items"), param("integer", "dataLayerVersion", "2")],
        folder_id=3, description="GA4 이커머스 items 배열")
add_var("dl.product_handle", "v", [param("template", "name", "product_handle"), param("integer", "dataLayerVersion", "2")], folder_id=3)
add_var("dl.product_title", "v", [param("template", "name", "product_title"), param("integer", "dataLayerVersion", "2")], folder_id=3)
add_var("dl.product_category", "v", [param("template", "name", "product_category"), param("integer", "dataLayerVersion", "2")], folder_id=3)
add_var("dl.industry", "v", [param("template", "name", "industry"), param("integer", "dataLayerVersion", "2")], folder_id=3,
        description="컬렉션/제품에서 자동 매핑되는 산업군. BABY/PETS/CARE/MEDICAL/PUBLIC/HOSPITALITY/OFFICE/HOME")
add_var("dl.inquiry_type", "v", [param("template", "name", "inquiry_type"), param("integer", "dataLayerVersion", "2")], folder_id=3,
        description="quote / sample / support / partnership")
add_var("dl.form_location", "v", [param("template", "name", "form_location"), param("integer", "dataLayerVersion", "2")], folder_id=3)
add_var("dl.file_name", "v", [param("template", "name", "file_name"), param("integer", "dataLayerVersion", "2")], folder_id=3)
add_var("dl.source_section", "v", [param("template", "name", "source_section"), param("integer", "dataLayerVersion", "2")], folder_id=3)
add_var("dl.klaviyo_form_id", "v", [param("template", "name", "klaviyo_form_id"), param("integer", "dataLayerVersion", "2")], folder_id=3)
add_var("dl.video_title", "v", [param("template", "name", "video_title"), param("integer", "dataLayerVersion", "2")], folder_id=3)
add_var("dl.video_percent", "v", [param("template", "name", "video_percent"), param("integer", "dataLayerVersion", "2")], folder_id=3)

# JS macro: file extension from Click URL
add_var("js.fileExtension", "jsm", [param("template", "javascript",
    "function() { var u = {{Click URL}} || ''; var m = u.split('?')[0].match(/\\.([a-zA-Z0-9]+)$/); return m ? m[1].toLowerCase() : ''; }")
], folder_id=3, description="Click URL에서 확장자 추출")

# Lookup: pagePath → industry (v3.0 — 2026-05-20 사이트 재편 반영, 9개 산업군)
# 메뉴 노출은 6개로 단순화되었지만 industry 차원은 9개로 유지 (HOSPITALITY/OFFICE/ADULTCARE 분리 유지)
add_var("lookup.pagePath_industry", "smm", [
    param("template", "input", "{{Page Path}}"),
    param("template", "defaultValue", "OTHER"),
    {"type": "list", "key": "map", "list": [
        # === 현재 운영 중인 6개 메뉴 노출 컬렉션 ===
        {"type": "map", "map": [param("template","key","/collections/home-odor-sealing-pails"), param("template","value","HOME_KITCHEN")]},
        {"type": "map", "map": [param("template","key","/collections/diaper-pails"), param("template","value","DIAPERS")]},
        {"type": "map", "map": [param("template","key","/collections/pet-waste-pails"), param("template","value","PETS")]},
        {"type": "map", "map": [param("template","key","/collections/adult-care-disposal"), param("template","value","ADULTCARE")]},
        {"type": "map", "map": [param("template","key","/collections/medical-waste-pails"), param("template","value","MEDICAL")]},
        {"type": "map", "map": [param("template","key","/collections/sanitary-disposal-bins"), param("template","value","BIZ_PUBLIC")]},
        # === 사용자가 별도로 만들 / 유지할 컬렉션 (메뉴 미노출이지만 industry로 추적) ===
        {"type": "map", "map": [param("template","key","/collections/feminine-care-products"), param("template","value","FEMCARE")]},
        {"type": "map", "map": [param("template","key","/collections/hospitality-sanitary-bins"), param("template","value","HOSPITALITY")]},
        {"type": "map", "map": [param("template","key","/collections/office-sanitary-bins"), param("template","value","OFFICE")]},
        # === Legacy 핸들 - 마이그레이션 안전망 (사본·이전 형태가 외부 링크로 들어올 경우) ===
        {"type": "map", "map": [param("template","key","/collections/home"), param("template","value","HOME_KITCHEN")]},
        {"type": "map", "map": [param("template","key","/collections/baby"), param("template","value","DIAPERS")]},
        {"type": "map", "map": [param("template","key","/collections/pets"), param("template","value","PETS")]},
        {"type": "map", "map": [param("template","key","/collections/care"), param("template","value","ADULTCARE")]},
        {"type": "map", "map": [param("template","key","/collections/feminine-care"), param("template","value","FEMCARE")]},
        {"type": "map", "map": [param("template","key","/collections/medical"), param("template","value","MEDICAL")]},
        {"type": "map", "map": [param("template","key","/collections/public"), param("template","value","BIZ_PUBLIC")]},
        {"type": "map", "map": [param("template","key","/collections/hospitality"), param("template","value","HOSPITALITY")]},
        {"type": "map", "map": [param("template","key","/collections/office"), param("template","value","OFFICE")]},
    ]}
], folder_id=3, description="컬렉션 경로 → industry 매핑 (v3.0, 9개 산업군). 신규 컬렉션 추가 시 이 표에 한 줄만 추가.")

# 메뉴 라벨 → industry 매핑 (nav_click 이벤트에서 사용)
add_var("lookup.menuLabel_industry", "smm", [
    param("template", "input", "{{Click Text}}"),
    param("template", "defaultValue", "OTHER"),
    {"type": "list", "key": "map", "list": [
        {"type": "map", "map": [param("template","key","HOME & KITCHEN"), param("template","value","HOME_KITCHEN")]},
        {"type": "map", "map": [param("template","key","DIAPERS"), param("template","value","DIAPERS")]},
        {"type": "map", "map": [param("template","key","PETS"), param("template","value","PETS")]},
        {"type": "map", "map": [param("template","key","FEMININE CARE"), param("template","value","FEMCARE")]},
        {"type": "map", "map": [param("template","key","MEDICAL & HEALTHCARE"), param("template","value","MEDICAL")]},
        {"type": "map", "map": [param("template","key","BIZ & PUBLIC"), param("template","value","BIZ_PUBLIC")]},
    ]}
], folder_id=3, description="GNB 메뉴 라벨 텍스트 → industry 매핑 (메뉴 클릭 시 nav_click 이벤트에 활용).")

# ---------- Triggers ----------
triggers = []
TRIG_ID = 100
def add_trigger(name, ttype, filter_list=None, custom_event_filter=None, folder_id=2, **extra):
    global TRIG_ID
    t = {
        "accountId": ACC,
        "containerId": CONT,
        "triggerId": str(TRIG_ID),
        "name": name,
        "type": ttype,
        "fingerprint": str(TRIG_ID * 100),
    }
    if filter_list:
        t["filter"] = filter_list
    if custom_event_filter:
        t["customEventFilter"] = custom_event_filter
    if folder_id:
        t["parentFolderId"] = str(folder_id)
    t.update(extra)
    triggers.append(t)
    TRIG_ID += 1
    return t

# filter helpers
def f_contains(var, val):
    return {"type": "contains", "parameter": [param("template","arg0",var), param("template","arg1",val)]}
def f_equals(var, val):
    return {"type": "equals", "parameter": [param("template","arg0",var), param("template","arg1",val)]}
def f_regex(var, val):
    return {"type": "matchRegex", "parameter": [param("template","arg0",var), param("template","arg1",val)]}
def f_starts(var, val):
    return {"type": "startsWith", "parameter": [param("template","arg0",var), param("template","arg1",val)]}

ALL_PAGES = add_trigger("All Pages", "pageview")
PLP_VIEW = add_trigger("PLP - Collection Page View", "pageview", [f_regex("{{Page Path}}", "^/collections/")])
PDP_VIEW = add_trigger("PDP - Product Page View", "pageview", [f_regex("{{Page Path}}", "^/products/")])
CONTACT_PAGE = add_trigger("Contact Page View", "pageview", [f_equals("{{Page Path}}", "/pages/contact-us")])

# Clicks
PLP_CARD_CLICK = add_trigger("PLP - Product Card Click", "linkClick",
    [f_contains("{{Click URL}}", "/products/")],
    waitForTags={"type": "boolean", "value": "true"},
    waitForTagsTimeout={"type": "template", "value": "2000"},
    checkValidation={"type": "boolean", "value": "false"})
PDP_CTA_CLICK = add_trigger("PDP - Contact/Quote CTA Click", "click",
    [f_regex("{{Page Path}}", "^/products/"),
     f_regex("{{Click Text}}", "(?i)(contact\\s*us|request\\s*a?\\s*quote|get\\s*a?\\s*quote)")])
NAV_CLICK = add_trigger("Nav Link Click", "linkClick",
    [f_regex("{{Click Element}}", "^.*(header|footer|nav).*$")],
    waitForTags={"type": "boolean", "value": "false"})
PHONE_CLICK = add_trigger("Phone Click (tel)", "linkClick",
    [f_starts("{{Click URL}}", "tel:")],
    waitForTags={"type": "boolean", "value": "false"})
EMAIL_CLICK = add_trigger("Email Click (mailto)", "linkClick",
    [f_starts("{{Click URL}}", "mailto:")],
    waitForTags={"type": "boolean", "value": "false"})
PDF_CLICK = add_trigger("PDF Download Click", "linkClick",
    [f_regex("{{Click URL}}", "\\.pdf($|\\?)")])

# Form submissions
NEWSLETTER_SUBMIT = add_trigger("Newsletter Footer Submit", "formSubmission",
    [f_equals("{{Form ID}}", "newsletter-footer")],
    checkValidation={"type": "boolean", "value": "true"})

# Custom Events (dataLayer push)
CE_CONTACT_START = add_trigger("CE - contact_form_start", "customEvent",
    custom_event_filter=[f_equals("{{_event}}", "contact_form_start")])
CE_CONTACT_SUBMIT = add_trigger("CE - contact_form_submit", "customEvent",
    custom_event_filter=[f_equals("{{_event}}", "contact_form_submit")])
CE_CATALOG_CTA_CLICK = add_trigger("CE - catalog_cta_click", "customEvent",
    custom_event_filter=[f_equals("{{_event}}", "catalog_cta_click")])
CE_CATALOG_EMAIL_SUBMIT = add_trigger("CE - catalog_email_submit (★KPI)", "customEvent",
    custom_event_filter=[f_equals("{{_event}}", "catalog_email_submit")])
CE_CATALOG_PDF_DOWNLOAD = add_trigger("CE - catalog_pdf_downloaded", "customEvent",
    custom_event_filter=[f_equals("{{_event}}", "catalog_pdf_downloaded")])
CE_KLAVIYO_SUBMIT = add_trigger("CE - klaviyo_form_submit", "customEvent",
    custom_event_filter=[f_equals("{{_event}}", "klaviyo_form_submit")])
CE_VIDEO = add_trigger("YouTube Video 30%+ Play", "youTubeVideo",
    captureStart={"type":"boolean","value":"false"},
    captureComplete={"type":"boolean","value":"true"},
    captureProgress={"type":"boolean","value":"true"},
    progressThresholdsPercent={"type":"template","value":"30,50,75,90"},
    fixMissingApi={"type":"boolean","value":"true"},
    triggerStartOption={"type":"template","value":"DOM_READY"})

# ---------- Tags ----------
tags = []
TAG_ID = 1000
def add_tag(name, ttype, params=None, firing_triggers=None, folder_id=1, **extra):
    global TAG_ID
    t = {
        "accountId": ACC,
        "containerId": CONT,
        "tagId": str(TAG_ID),
        "name": name,
        "type": ttype,
        "parameter": params or [],
        "firingTriggerId": [str(tr["triggerId"]) for tr in (firing_triggers or [])],
        "tagFiringOption": "ONCE_PER_EVENT",
        "fingerprint": str(TAG_ID * 10),
        "monitoringMetadata": {"type": "map"},
    }
    if folder_id:
        t["parentFolderId"] = str(folder_id)
    t.update(extra)
    tags.append(t)
    TAG_ID += 1
    return t

# GA4 Google Tag (config)
add_tag("GA4 - Google Tag (Config)", "googtag",
    params=[
        param("template", "tagId", "{{const.GA4_ID}}"),
        {"type":"list","key":"configSettingsTable","list":[
            {"type":"map","map":[param("template","parameter","send_page_view"), param("template","parameterValue","true")]},
        ]}
    ],
    firing_triggers=[ALL_PAGES])

# GA4 Event tags
def ga4_event_tag(name, event_name, trigger_list, extra_params=None, folder_id=1):
    pl = [
        param("template", "measurementIdOverride", "{{const.GA4_ID}}"),
        param("template", "eventName", event_name),
    ]
    if extra_params:
        pl.append({"type":"list", "key":"eventParameters", "list": [
            {"type":"map", "map":[param("template","name",k), param("template","value",v)]}
            for k,v in extra_params.items()
        ]})
    return add_tag(name, "gaawe", params=pl, firing_triggers=trigger_list, folder_id=folder_id)

ga4_event_tag("GA4 - view_item_list", "view_item_list", [PLP_VIEW], {
    "industry": "{{lookup.pagePath_industry}}",
    "items": "{{dl.items}}",
})
ga4_event_tag("GA4 - view_item", "view_item", [PDP_VIEW], {
    "industry": "{{dl.industry}}",
    "items": "{{dl.items}}",
    "product_handle": "{{dl.product_handle}}",
})
ga4_event_tag("GA4 - select_item", "select_item", [PLP_CARD_CLICK], {
    "industry": "{{lookup.pagePath_industry}}",
    "item_id": "{{Click URL}}",
})
ga4_event_tag("GA4 - request_quote", "request_quote", [PDP_CTA_CLICK], {
    "product_handle": "{{dl.product_handle}}",
    "product_title": "{{dl.product_title}}",
    "industry": "{{dl.industry}}",
    "source_section": "{{dl.source_section}}",
})
ga4_event_tag("GA4 - nav_click", "nav_click", [NAV_CLICK], {
    "nav_label": "{{Click Text}}",
    "nav_target": "{{Click URL}}",
    "industry": "{{lookup.menuLabel_industry}}",
})
ga4_event_tag("GA4 - contact_form_view", "contact_form_view", [CONTACT_PAGE], {
    "form_location": "/pages/contact-us",
    "referrer_page": "{{Referrer}}",
})
ga4_event_tag("GA4 - contact_form_start", "contact_form_start", [CE_CONTACT_START], {
    "form_location": "{{dl.form_location}}",
})
ga4_event_tag("GA4 - contact_form_submit", "contact_form_submit", [CE_CONTACT_SUBMIT], {
    "form_location": "{{dl.form_location}}",
    "industry": "{{dl.industry}}",
})
# === Janibell B2B 카탈로그 게이트 (3단 깔때기) ===
ga4_event_tag("GA4 - catalog_cta_click (의도)", "catalog_cta_click", [CE_CATALOG_CTA_CLICK], {
    "industry": "{{dl.industry}}",
})
ga4_event_tag("GA4 - catalog_email_submit (★KPI)", "catalog_email_submit", [CE_CATALOG_EMAIL_SUBMIT], {
    "industry": "{{dl.industry}}",
    "klaviyo_form_id": "{{dl.klaviyo_form_id}}",
})
ga4_event_tag("GA4 - catalog_pdf_downloaded", "catalog_pdf_downloaded", [CE_CATALOG_PDF_DOWNLOAD], {
    "file_name": "{{dl.file_name}}",
    "industry": "{{dl.industry}}",
})
ga4_event_tag("GA4 - file_download", "file_download", [PDF_CLICK], {
    "file_name": "{{Click URL}}",
    "file_extension": "{{js.fileExtension}}",
})
ga4_event_tag("GA4 - phone_click", "phone_click", [PHONE_CLICK], {
    "phone_number": "{{Click URL}}",
})
ga4_event_tag("GA4 - email_click", "email_click", [EMAIL_CLICK], {
    "email_address": "{{Click URL}}",
})
ga4_event_tag("GA4 - newsletter_subscribe", "newsletter_subscribe", [NEWSLETTER_SUBMIT], {
    "form_location": "footer",
})
ga4_event_tag("GA4 - klaviyo_form_submit", "klaviyo_form_submit", [CE_KLAVIYO_SUBMIT], {
    "industry": "{{dl.industry}}",
})
ga4_event_tag("GA4 - video_play", "video_play", [CE_VIDEO], {
    "video_title": "{{Video Title}}",
    "video_percent": "{{Video Percent}}",
})

# Meta Pixel tags (HTML)
add_tag("Meta Pixel - Base (PageView)", "html",
    params=[
        param("template", "html",
              "<script>\n!function(f,b,e,v,n,t,s)\n{if(f.fbq)return;n=f.fbq=function(){n.callMethod?\nn.callMethod.apply(n,arguments):n.queue.push(arguments)};\nif(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';\nn.queue=[];t=b.createElement(e);t.async=!0;\nt.src=v;s=b.getElementsByTagName(e)[0];\ns.parentNode.insertBefore(t,s)}(window, document,'script',\n'https://connect.facebook.net/en_US/fbevents.js');\nfbq('init', '{{const.META_PIXEL_ID}}');\nfbq('track', 'PageView');\n</script>"),
        param("boolean", "supportDocumentWrite", "false"),
    ],
    firing_triggers=[ALL_PAGES], folder_id=4)

add_tag("Meta Pixel - Lead (PDP Quote)", "html",
    params=[
        param("template", "html",
              "<script>fbq('track','Lead',{content_name: {{Click Text}}, content_category: {{dl.industry}}});</script>"),
        param("boolean", "supportDocumentWrite", "false"),
    ],
    firing_triggers=[PDP_CTA_CLICK, CE_CONTACT_SUBMIT], folder_id=4)

# ★ 핵심: catalog email submit이 가장 강한 Lead 시그널 — Meta Pixel에도 Lead로 전달
add_tag("Meta Pixel - Lead (★ Catalog Email)", "html",
    params=[
        param("template", "html",
              "<script>fbq('track','Lead',{content_name:'Catalog Email Gate', content_category: {{dl.industry}}, value: 50, currency:'USD'});</script>"),
        param("boolean", "supportDocumentWrite", "false"),
    ],
    firing_triggers=[CE_CATALOG_EMAIL_SUBMIT], folder_id=4)

add_tag("Meta Pixel - CompleteRegistration (PDF Download)", "html",
    params=[
        param("template", "html",
              "<script>fbq('track','CompleteRegistration',{content_name:'Catalog PDF Downloaded'});</script>"),
        param("boolean", "supportDocumentWrite", "false"),
    ],
    firing_triggers=[CE_CATALOG_PDF_DOWNLOAD], folder_id=4)

# ---------- Folders ----------
folders = [
    {"accountId": ACC, "containerId": CONT, "folderId": "1", "name": "GA4 Tags", "fingerprint": "10"},
    {"accountId": ACC, "containerId": CONT, "folderId": "2", "name": "Triggers", "fingerprint": "20"},
    {"accountId": ACC, "containerId": CONT, "folderId": "3", "name": "Variables", "fingerprint": "30"},
    {"accountId": ACC, "containerId": CONT, "folderId": "4", "name": "Meta Pixel", "fingerprint": "40"},
]

# ---------- Built-in Variables ----------
# 우리 컨테이너에서 실제로 참조하는 내장 변수만 포함 (lean 빌드)
# 참조 흔적: {{Click URL}}, {{Click Text}}, {{Click Element}}, {{Page Path}},
# {{Form ID}}, {{Referrer}}, {{Video Title}}, {{Video Percent}}, {{_event}}
built_in = []
_BUILTIN_TYPES = [
    "PAGE_URL", "PAGE_HOSTNAME", "PAGE_PATH",
    "REFERRER", "EVENT",
    "CLICK_ELEMENT", "CLICK_CLASSES", "CLICK_ID", "CLICK_TARGET", "CLICK_URL", "CLICK_TEXT",
    "FORM_ELEMENT", "FORM_CLASSES", "FORM_ID", "FORM_TARGET", "FORM_URL", "FORM_TEXT",
    "HISTORY_SOURCE", "NEW_HISTORY_FRAGMENT", "OLD_HISTORY_FRAGMENT", "NEW_HISTORY_STATE", "OLD_HISTORY_STATE",
    "VIDEO_CURRENT_TIME", "VIDEO_DURATION", "VIDEO_PERCENT",
    "VIDEO_PROVIDER", "VIDEO_STATUS", "VIDEO_TITLE", "VIDEO_URL", "VIDEO_VISIBLE",
]
for n in _BUILTIN_TYPES:
    built_in.append({"accountId": ACC, "containerId": CONT, "type": n})

container_version = {
    "accountId": ACC,
    "containerVersionId": "0",
    "container": {
        "accountId": ACC,
        "containerId": CONT,
        "name": "janibell.com",
        "publicId": "GTM-XXXXXX",
        "usageContext": ["WEB"],
        "fingerprint": "1",
        "tagManagerUrl": "https://tagmanager.google.com/#/container/accounts/" + ACC + "/containers/" + CONT,
        "features": {
            "supportUserPermissions": True,
            "supportEnvironments": True,
            "supportWorkspaces": True,
            "supportGtagConfigs": True,
            "supportBuiltInVariables": True,
            "supportClients": True,
            "supportFolders": True,
            "supportTags": True,
            "supportTemplates": True,
            "supportTriggers": True,
            "supportVariables": True,
            "supportVersions": True,
            "supportZones": True,
        }
    },
    "tag": tags,
    "trigger": triggers,
    "variable": variables,
    "folder": folders,
    "builtInVariable": built_in,
    "fingerprint": "1",
    "tagManagerUrl": "https://tagmanager.google.com/#/versions/accounts/" + ACC + "/containers/" + CONT + "/versions/0",
}

export = {
    "exportFormatVersion": 2,
    "exportTime": now,
    "containerVersion": container_version,
}

# --------- normalize all GTM enum fields per spec ---------
import re

# 1. 파라미터 "type" — 단순 UPPERCASE (TEMPLATE / BOOLEAN / ...)
_PARAM_TYPE_ENUMS = {"template","boolean","integer","list","map","tagref","triggerref","tag_reference","trigger_reference"}

# 2. 트리거 "type" (EventType enum) — UPPERCASE_SNAKE
_TRIGGER_TYPE_MAP = {
    "pageview":         "PAGEVIEW",
    "domReady":         "DOM_READY",
    "windowLoaded":     "WINDOW_LOADED",
    "customEvent":      "CUSTOM_EVENT",
    "formSubmission":   "FORM_SUBMISSION",
    "click":            "CLICK",
    "linkClick":        "LINK_CLICK",
    "jsError":          "JS_ERROR",
    "historyChange":    "HISTORY_CHANGE",
    "timer":            "TIMER",
    "youTubeVideo":     "YOU_TUBE_VIDEO",
    "scrollDepth":      "SCROLL_DEPTH",
    "elementVisibility":"ELEMENT_VISIBILITY",
    "triggerGroup":     "TRIGGER_GROUP",
    "serverPageview":   "SERVER_PAGEVIEW",
    "init":             "INIT",
    "consentInit":      "CONSENT_INIT",
    "always":           "ALWAYS",
}

# 3. 필터 조건 type — UPPERCASE_SNAKE
_FILTER_TYPE_MAP = {
    "equals":          "EQUALS",
    "contains":        "CONTAINS",
    "startsWith":      "STARTS_WITH",
    "endsWith":        "ENDS_WITH",
    "matchRegex":      "MATCH_REGEX",
    "less":            "LESS",
    "lessOrEquals":    "LESS_OR_EQUALS",
    "greater":         "GREATER",
    "greaterOrEquals": "GREATER_OR_EQUALS",
    "cssSelector":     "CSS_SELECTOR",
    "urlMatches":      "URL_MATCHES",
    "equalsCaseInsensitive":     "EQUALS_CASE_INSENSITIVE",
    "containsCaseInsensitive":   "CONTAINS_CASE_INSENSITIVE",
    "startsWithCaseInsensitive": "STARTS_WITH_CASE_INSENSITIVE",
    "endsWithCaseInsensitive":   "ENDS_WITH_CASE_INSENSITIVE",
    "matchRegexCaseInsensitive": "MATCH_REGEX_CASE_INSENSITIVE",
}

# 4. 그 외 알려진 enum 필드 직접 매핑
_ENUM_FIELD_MAP = {
    "tagFiringOption": {
        "oncePerEvent":  "ONCE_PER_EVENT",
        "oncePerLoad":   "ONCE_PER_LOAD",
        "unlimited":     "UNLIMITED",
    },
    "consentStatus": {
        "needed":  "NEEDED",
        "notSet":  "NOT_SET",
    },
}

def _to_snake_upper(s):
    return re.sub(r'([a-z0-9])([A-Z])', r'\1_\2', s).upper()

def _normalize_node(node, context=None):
    """context = 'trigger' | 'filter' | 'parameter' 등 부모 컨텍스트 힌트"""
    if isinstance(node, dict):
        t = node.get("type")
        if isinstance(t, str):
            # 컨텍스트별 type 처리
            if context == "trigger" and t in _TRIGGER_TYPE_MAP:
                node["type"] = _TRIGGER_TYPE_MAP[t]
            elif context == "filter" and t in _FILTER_TYPE_MAP:
                node["type"] = _FILTER_TYPE_MAP[t]
            elif t.lower() in _PARAM_TYPE_ENUMS:
                node["type"] = _TYPE_MAP.get(t.lower(), t.upper())

        # 알려진 enum 필드 직접 매핑
        for field, value_map in _ENUM_FIELD_MAP.items():
            if field in node:
                v = node[field]
                if isinstance(v, str) and v in value_map:
                    node[field] = value_map[v]

        # 자식 노드 재귀 (컨텍스트 추론)
        for key, child in node.items():
            if key in ("filter", "customEventFilter", "autoEventFilter"):
                _normalize_node(child, context="filter")
            else:
                _normalize_node(child, context=context)

    elif isinstance(node, list):
        for item in node:
            _normalize_node(item, context=context)

# 최상위에서 trigger 배열은 컨텍스트 'trigger'로 명시
cv = export["containerVersion"]
for trig in cv.get("trigger", []):
    _normalize_node(trig, context="trigger")

# 그 외는 일반 정규화
_normalize_node(export)

# --- 사전 검증: GTM이 인식하지 못할 enum 값을 사전에 모두 탐지 ---
_known_trigger_types = set(_TRIGGER_TYPE_MAP.values())
_known_filter_types  = set(_FILTER_TYPE_MAP.values())
_known_param_types   = {"TEMPLATE","BOOLEAN","INTEGER","LIST","MAP","TAG_REFERENCE","TRIGGER_REFERENCE"}
# GTM API v2 공식 BuiltInVariableType enum (외부 권위 있는 카탈로그)
# https://developers.google.com/tag-platform/tag-manager/api/v2/reference 기준
_GTM_OFFICIAL_BUILTIN_ENUM = {
    "BUILT_IN_VARIABLE_TYPE_UNSPECIFIED",
    # 페이지·이벤트
    "PAGE_URL", "PAGE_HOSTNAME", "PAGE_PATH", "REFERRER", "EVENT", "EVENT_NAME",
    "FIRST_PARTY_SERVING_URL", "QUERY_STRING", "HTML_ID",
    # 클릭
    "CLICK_ELEMENT", "CLICK_CLASSES", "CLICK_ID", "CLICK_TARGET", "CLICK_URL", "CLICK_TEXT",
    # 폼
    "FORM_ELEMENT", "FORM_CLASSES", "FORM_ID", "FORM_TARGET", "FORM_URL", "FORM_TEXT",
    # 히스토리
    "HISTORY_SOURCE", "NEW_HISTORY_URL", "OLD_HISTORY_URL",
    "NEW_HISTORY_FRAGMENT", "OLD_HISTORY_FRAGMENT",
    "NEW_HISTORY_STATE", "OLD_HISTORY_STATE",
    # 비디오 (VIDEO_ELAPSED_TIME은 enum에 없음!)
    "VIDEO_CURRENT_TIME", "VIDEO_DURATION", "VIDEO_PERCENT",
    "VIDEO_PROVIDER", "VIDEO_STATUS", "VIDEO_TITLE", "VIDEO_URL", "VIDEO_VISIBLE",
    # 스크롤·가시성
    "SCROLL_DEPTH_THRESHOLD", "SCROLL_DEPTH_UNITS", "SCROLL_DEPTH_DIRECTION",
    "ELEMENT_VISIBILITY_RATIO", "ELEMENT_VISIBILITY_TIME",
    "ELEMENT_VISIBILITY_FIRST_TIME", "ELEMENT_VISIBILITY_RECENT_TIME",
    # 에러
    "ERROR_MESSAGE", "ERROR_URL", "ERROR_LINE",
    # 컨테이너·디버그
    "CONTAINER_VERSION", "DEBUG_MODE", "RANDOM_NUMBER", "CONTAINER_ID", "ENVIRONMENT_NAME",
    # 디바이스·플랫폼
    "DEVICE_NAME", "LANGUAGE", "OS_VERSION", "PLATFORM", "RESOLUTION", "USER_AGENT", "VISITOR_REGION",
    # 모바일 앱
    "APP_ID", "APP_NAME", "APP_VERSION_CODE", "APP_VERSION_NAME", "APP_INSTANCE_ID", "SDK_VERSION",
    "ADVERTISER_ID", "ADVERTISING_TRACKING_ENABLED",
    # AMP
    "AMP_BROWSER_LANGUAGE", "AMP_CANONICAL_HOST", "AMP_CANONICAL_PATH", "AMP_CANONICAL_URL",
    "AMP_CLIENT_ID", "AMP_CLIENT_MAX_SCROLL_X", "AMP_CLIENT_MAX_SCROLL_Y",
    "AMP_CLIENT_SCREEN_HEIGHT", "AMP_CLIENT_SCREEN_WIDTH",
    "AMP_CLIENT_SCROLL_X", "AMP_CLIENT_SCROLL_Y", "AMP_CLIENT_TIMESTAMP", "AMP_CLIENT_TIMEZONE",
    "AMP_GTM_EVENT", "AMP_PAGE_DOWNLOAD_TIME", "AMP_PAGE_LOAD_TIME", "AMP_PAGE_VIEW_ID",
    "AMP_REFERRER", "AMP_TITLE", "AMP_TOTAL_ENGAGED_TIME",
    # 서버 GTM
    "CLIENT_NAME", "REQUEST_METHOD", "REQUEST_PATH",
    "SERVER_PAGE_LOCATION_URL", "SERVER_PAGE_LOCATION_PATH", "SERVER_PAGE_LOCATION_HOSTNAME",
}
# 우리가 빌드에 포함한 값들 (validator 비교용)
_known_builtin_types = set(_BUILTIN_TYPES)
# 우리 리스트에 있는 값이 GTM 공식 enum에 존재하는지 사전 검증
_invalid_builtins = _known_builtin_types - _GTM_OFFICIAL_BUILTIN_ENUM
if _invalid_builtins:
    raise SystemExit(f"\n✗ 빌더 자체 오류: 다음 내장 변수 값이 GTM 공식 enum에 없습니다 — 빌드 중단: {_invalid_builtins}")
_known_tag_firing    = {"ONCE_PER_EVENT","ONCE_PER_LOAD","UNLIMITED"}
# 변수 type — GTM은 이건 소문자 약어 유지
_known_var_types     = {"c","v","jsm","smm","k","u","d","e","j","r","f","remm","gas","aev","awec","msm"}
# 태그 type — 템플릿 ID (소문자 유지)
_known_tag_types     = {"googtag","gaawe","ua","html","img","awct","sp","baut","cvt"}

_problems = []

# 1. 트리거 type
for trig in cv.get("trigger", []):
    tt = trig.get("type", "")
    if tt and tt not in _known_trigger_types:
        _problems.append(f"[trigger] '{trig.get('name')}' → type='{tt}'")

# 2. 트리거 filter / customEventFilter type
for trig in cv.get("trigger", []):
    for fl in (trig.get("filter") or []) + (trig.get("customEventFilter") or []):
        ft = fl.get("type", "")
        if ft and ft not in _known_filter_types:
            _problems.append(f"[filter] '{trig.get('name')}' → filter.type='{ft}'")

# 3. 변수 type
for v in cv.get("variable", []):
    vt = v.get("type", "")
    if vt and vt not in _known_var_types:
        _problems.append(f"[variable] '{v.get('name')}' → type='{vt}' (예상되지 않은 변수 타입)")

# 4. 태그 type
for t in cv.get("tag", []):
    tt = t.get("type", "")
    if tt and tt not in _known_tag_types:
        _problems.append(f"[tag] '{t.get('name')}' → type='{tt}' (예상되지 않은 태그 타입)")

# 5. 내장 변수 type
for bv in cv.get("builtInVariable", []):
    bt = bv.get("type", "")
    if bt and bt not in _known_builtin_types:
        _problems.append(f"[builtIn] type='{bt}' (예상되지 않은 내장 변수 타입)")

# 6. 파라미터 type (모든 곳)
def _check_params(node, path=""):
    if isinstance(node, dict):
        # 파라미터 객체의 type 검증
        if "type" in node and "key" in node:  # 파라미터 패턴
            pt = node.get("type")
            if isinstance(pt, str) and pt not in _known_param_types:
                _problems.append(f"[parameter] {path} → type='{pt}'")
        for k, v in node.items():
            _check_params(v, f"{path}.{k}")
    elif isinstance(node, list):
        for i, v in enumerate(node):
            _check_params(v, f"{path}[{i}]")
_check_params(export)

# 7. tagFiringOption
for t in cv.get("tag", []):
    tfo = t.get("tagFiringOption", "")
    if tfo and tfo not in _known_tag_firing:
        _problems.append(f"[tagFiringOption] '{t.get('name')}' → '{tfo}'")

# 8. 이름 필드 특수문자 검증 (GTM은 :, <, >, &, ", ' 등 금지)
_INVALID_NAME_CHARS = set(':<>&"')
for collection_key, label in [("tag","tag"), ("trigger","trigger"), ("variable","variable"), ("folder","folder")]:
    for item in cv.get(collection_key, []):
        name = item.get("name", "")
        for ch in _INVALID_NAME_CHARS:
            if ch in name:
                _problems.append(f"[{label}.name] '{name}' contains forbidden character '{ch}'")

if _problems:
    print("\n⚠ 사전 검증 경고 — GTM Import 시 에러 가능성:")
    for p in _problems: print(f"  - {p}")
    raise SystemExit("\n✗ 빌드 중단: 위 문제 먼저 수정")
else:
    print("\n✓ 사전 검증 통과: 모든 enum 값과 이름 형식이 GTM 정식 형식")

out = "/sessions/compassionate-sweet-noether/mnt/outputs/janibell_setup/janibell_gtm_container.json"
with open(out, "w", encoding="utf-8") as f:
    json.dump(export, f, ensure_ascii=False, indent=2)
print(f"Tags: {len(tags)}  Triggers: {len(triggers)}  Variables: {len(variables)}  Folders: {len(folders)}")
print(f"Saved: {out}")
