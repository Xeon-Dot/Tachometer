export const dashboardHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/>
<meta name="color-scheme" content="light"/>
<title>Tachometer — AI API Performance Dashboard</title>
<link rel="icon" href="/favicon.svg" type="image/svg+xml"/>
<link rel="icon" href="/favicon.ico" sizes="32x32"/>
<link rel="apple-touch-icon" href="/favicon.svg"/>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
<script defer src="https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js"></script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{
  --bg:#fafafa;
  --card:#ffffff;
  --foreground:#18181b;
  --muted-fg:#52525b;
  --muted-fg-soft:#71717a;
  --muted:#f4f4f5;
  --border:#e4e4e7;
  --border-strong:#d4d4d8;
  --primary:#18181b;
  --primary-fg:#fafafa;
  --ring:#18181b;
  --radius:8px;
  --radius-sm:6px;
}
html{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;scrollbar-gutter:stable;overflow-x:clip}
body{font-family:'JetBrains Mono',ui-monospace,monospace;background:var(--bg);color:var(--foreground);min-height:100vh;line-height:1.5;font-size:14px;overflow-x:clip;max-width:100%}
.mono{font-family:'JetBrains Mono',ui-monospace,monospace}
.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
a{color:var(--foreground);text-decoration:underline;text-underline-offset:3px;text-decoration-color:var(--border-strong);text-decoration-thickness:1px}
a:hover{text-decoration-color:var(--foreground)}
a:focus-visible{outline:2px solid var(--ring);outline-offset:2px;border-radius:2px}
.topbar{position:sticky;top:0;z-index:20;background:rgba(255,255,255,.96);backdrop-filter:saturate(1.2) blur(8px);border-bottom:1px solid var(--border);min-height:56px;padding:max(10px,env(safe-area-inset-top)) max(24px, env(safe-area-inset-right)) 10px max(24px, env(safe-area-inset-left));display:flex;align-items:center;justify-content:space-between;gap:16px;transition:transform .25s ease}
@media(max-width:768px){.topbar--hidden{transform:translateY(-100%)}}
.brand{display:flex;align-items:center;gap:12px;min-width:0;flex:1 1 auto}
.logo{width:32px;height:32px;border-radius:6px;background:var(--primary);color:var(--primary-fg);display:grid;place-items:center;font-size:13px;font-weight:700;letter-spacing:-.04em;flex-shrink:0}
.brand h1{font-size:15px;font-weight:700;letter-spacing:-.03em;line-height:1}
.brand h1 span{font-weight:400;color:var(--muted-fg-soft)}
.brand p{font-size:12px;color:var(--muted-fg);margin-top:2px}
.controls{display:flex;align-items:center;gap:8px;flex-wrap:wrap;flex-shrink:0}
.select,.btn{height:40px;border:1px solid var(--border);background:var(--card);color:var(--foreground);border-radius:var(--radius-sm);padding:0 12px;font-size:13px;font-weight:500;line-height:1;outline:none;transition:border-color .15s,background .15s,opacity .15s,box-shadow .15s,transform .08s;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.select{padding-inline-end:32px;min-width:148px;background-color:var(--card);appearance:none;background-image:linear-gradient(45deg,transparent 50%,currentColor 50%),linear-gradient(135deg,currentColor 50%,transparent 50%);background-position:calc(100% - 14px) calc(50% - 2px),calc(100% - 9px) calc(50% - 2px);background-size:5px 5px,5px 5px;background-repeat:no-repeat;color:var(--foreground)}
.select:hover{border-color:var(--border-strong)}
.select:focus-visible,.btn:focus-visible{outline:2px solid var(--ring);outline-offset:2px}
.select:focus{border-color:var(--border-strong)}
.btn{cursor:pointer;background:var(--primary);color:var(--primary-fg);border-color:var(--primary);font-weight:600;padding:0 14px;white-space:nowrap;display:inline-flex;align-items:center;justify-content:center;gap:8px;user-select:none}
.btn:hover{background:#27272a;border-color:#27272a}
.btn:active{transform:translateY(0.5px);background:#27272a}
.btn:disabled{opacity:.52;cursor:not-allowed}
.btn[aria-busy="true"]{opacity:.88;pointer-events:none}
.btnSpinner{width:12px;height:12px;border-radius:50%;border:1.5px solid rgba(250,250,250,.35);border-top-color:var(--primary-fg);display:none;flex-shrink:0;animation:spin .65s linear infinite}
.btn[aria-busy="true"] .btnSpinner{display:block}
.btnLabel{line-height:1}
.btn-ghost{background:var(--card);color:var(--foreground);border-color:var(--border)}
.btn-ghost:hover{background:var(--muted);border-color:var(--border-strong)}
.btn-ghost:active{background:#ececef}
.select:disabled{opacity:.55;cursor:not-allowed;background-color:var(--muted)}
.badge{display:inline-flex;align-items:center;gap:8px;font-size:12px;font-weight:500;padding:0 10px;height:32px;border-radius:999px;border:1px solid var(--border);background:var(--card);white-space:nowrap}
.dot{width:7px;height:7px;border-radius:50%;background:#16a34a;flex-shrink:0;box-shadow:0 0 0 3px rgba(22,163,74,.12)}
@media(prefers-reduced-motion:reduce){.dot{animation:none!important}.btnSpinner{animation:none!important}}
@keyframes spin{to{transform:rotate(360deg)}}
.wrap{max-width:1280px;margin:0 auto;padding:24px max(24px, env(safe-area-inset-right)) 48px max(24px, env(safe-area-inset-left))}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin:20px 0 16px}
.kpi{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:16px 16px 14px;transition:border-color .15s}
@media(hover:hover){.kpi:hover{border-color:var(--border-strong)}}
.kpi label{font-size:11px;letter-spacing:.06em;color:var(--muted-fg);text-transform:uppercase;font-weight:600}
.kpi strong{font-size:22px;font-weight:700;letter-spacing:-.03em;display:block;margin-top:8px;line-height:1}
.kpi small{color:var(--muted-fg);font-size:12px;display:block;margin-top:6px;line-height:1.4}
.kpi small span{color:var(--foreground);font-weight:500}
.grid2{display:grid;grid-template-columns:1.35fr .85fr;gap:16px}
.card{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:20px}
.card h3{font-size:13px;font-weight:600;letter-spacing:-.02em;display:flex;align-items:center;justify-content:space-between;gap:12px}
.card h3 small{font-weight:500;color:var(--muted-fg);font-size:11px;letter-spacing:0}
.chartBox{position:relative;min-height:180px;margin-top:14px}
.chartBox canvas{max-width:100%}
.codeWrap{position:relative}
.code{font-family:'JetBrains Mono',monospace;font-size:11.5px;line-height:1.65;background:var(--muted);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px 44px 14px 14px;overflow-x:auto;white-space:pre;word-break:normal;color:#27272a;scrollbar-width:thin;-webkit-overflow-scrolling:touch;overscroll-behavior-inline:contain;max-width:100%;transition:border-color .15s,box-shadow .15s}
.code:focus-visible{outline:2px solid var(--ring);outline-offset:2px;border-color:var(--border-strong)}
.code::-webkit-scrollbar{height:6px}
.copyBtn{position:absolute;inset-block-start:8px;inset-inline-end:8px;height:28px;min-width:28px;padding:0 9px;border-radius:6px;border:1px solid var(--border);background:var(--card);color:var(--foreground);font-size:11px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;touch-action:manipulation;-webkit-tap-highlight-color:transparent;transition:border-color .15s,background .15s,color .15s,transform .08s;isolation:isolate}
.copyBtn::before{content:"";position:absolute;inset:-8px;border-radius:10px}
.copyBtn:hover{background:var(--foreground);color:var(--card);border-color:var(--foreground)}
.copyBtn:active{transform:translateY(0.5px)}
.copyBtn:focus-visible{outline:2px solid var(--ring);outline-offset:2px}
.copyBtn[data-copied="true"]{background:var(--foreground);color:var(--card);border-color:var(--foreground)}
.copyBtn:disabled{opacity:.6;cursor:not-allowed}
.hint{color:var(--muted-fg);font-size:12px;line-height:1.6;overflow-wrap:anywhere}
.section-head{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin:28px 0 10px;flex-wrap:wrap}
.section-head h3{font-size:13px;font-weight:600;letter-spacing:-.02em}
.section-head p{font-size:12px;color:var(--muted-fg)}
.providers{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(320px,100%),1fr));gap:12px;margin:0;container-type:inline-size}
.prov{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:16px;transition:border-color .15s;min-width:0}
@media(hover:hover){.prov:hover{border-color:var(--border-strong)}}
.prov h4{font-size:13px;font-weight:600;display:flex;align-items:center;gap:8px;min-width:0}
.prov h4 span:first-of-type{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;flex:1}
.pill{font-size:11px;font-weight:500;padding:3px 7px;border-radius:6px;background:var(--muted);border:1px solid var(--border);color:var(--muted-fg);white-space:nowrap}
.metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:14px}
.metric{background:var(--muted);border:1px solid transparent;border-radius:6px;padding:10px 10px 9px;min-width:0;overflow:hidden}
.metric label{font-size:10px;color:var(--muted-fg);text-transform:uppercase;letter-spacing:.06em;font-weight:600}
.metric b{font-size:14px;display:block;margin-top:5px;font-weight:600;letter-spacing:-.02em;overflow-wrap:anywhere}
.metric small{font-size:11px;color:var(--muted-fg);display:block;margin-top:2px;overflow-wrap:anywhere}
.bar{height:4px;background:var(--muted);border-radius:999px;overflow:hidden;margin-top:8px;border:1px solid var(--border)}
.bar i{display:block;height:100%;background:var(--foreground)}
.tableWrap{overflow:auto;border:1px solid var(--border);border-radius:var(--radius);background:var(--card);scrollbar-width:thin;-webkit-overflow-scrolling:touch;overscroll-behavior-inline:contain;max-width:100%;position:relative;touch-action:pan-x pan-y;scrollbar-gutter:stable}
.tableWrap:focus-visible{outline:2px solid var(--ring);outline-offset:2px}
.tableWrap{scrollbar-color:var(--border-strong) transparent}
table{width:100%;border-collapse:collapse;font-size:12.5px}
th{text-align:start;padding:10px 12px;color:var(--muted-fg);font-weight:600;white-space:nowrap;border-bottom:1px solid var(--border);background:#fafafa;font-size:11px;letter-spacing:.04em;text-transform:uppercase}
td{padding:10px 12px;border-bottom:1px solid var(--border);white-space:nowrap}
tr:last-child td{border-bottom:none}
@media(hover:hover){tbody tr:hover td{background:#fafafa}}
tbody tr:focus-within td{background:#fafafa}
.status{padding:3px 7px;border-radius:6px;font-size:11px;font-weight:600;border:1px solid var(--border);display:inline-flex;align-items:center;gap:4px;line-height:1}
.s2xx{background:#f0fdf4;color:#15803d;border-color:#bbf7d0}
.s4xx{background:#fffbeb;color:#b45309;border-color:#fde68a}
.s5xx{background:#fef2f2;color:#b91c1c;border-color:#fecdd3}
.empty{border:1px dashed var(--border);border-radius:var(--radius);padding:22px 16px;text-align:center;color:var(--muted-fg);font-size:13px;background:var(--card);line-height:1.6}
.empty strong{color:var(--foreground);font-weight:600}
.empty .btn{margin-top:12px}
.inline-meta{font-size:11px;color:var(--muted-fg);font-weight:500;overflow-wrap:anywhere}
.searchWrap{position:relative;display:flex;align-items:center;flex:0 1 auto}
.searchWrap input{height:36px;border:1px solid var(--border);border-radius:var(--radius-sm);padding-block:0;padding-inline-start:30px;padding-inline-end:28px;font-size:13px;width:220px;max-width:100%;background:var(--card);outline:none;transition:border-color .15s,box-shadow .15s,background .15s;touch-action:manipulation}
.searchWrap input::placeholder{color:var(--muted-fg-soft)}
.searchWrap input:hover{border-color:var(--border-strong)}
.searchWrap input:focus{border-color:var(--border-strong)}
.searchWrap input:focus-visible{outline:2px solid var(--ring);outline-offset:2px}
.searchIcon{position:absolute;inset-inline-start:9px;color:var(--muted-fg-soft);pointer-events:none;font-size:12px}
.searchClear{position:absolute;inset-inline-end:6px;width:22px;height:22px;border-radius:50%;border:1px solid transparent;background:transparent;color:var(--muted-fg);display:none;place-items:center;font-size:12px;line-height:1;cursor:pointer;touch-action:manipulation}
.searchClear:hover{background:var(--muted);border-color:var(--border);color:var(--foreground)}
.searchClear:focus-visible{outline:2px solid var(--ring);outline-offset:2px}
.searchWrap:has(input:not(:placeholder-shown)) .searchClear{display:grid}
.searchWrap:has(input:focus) input{border-color:var(--border-strong)}
.recentHead{padding:14px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;border-bottom:1px solid var(--border);flex-wrap:wrap}
.skeleton{background:linear-gradient(90deg, var(--muted) 25%, #ececef 37%, var(--muted) 63%);background-size:400% 100%;animation:shimmer 1.2s ease-in-out infinite;border-radius:6px}
@media(prefers-reduced-motion:reduce){.skeleton{animation:none;background:var(--muted)}}
@keyframes shimmer{0%{background-position:100% 0} 100%{background-position:-100% 0}}
.alert{border:1px solid #fecdd3;background:#fef2f2;color:#7f1d1d;border-radius:var(--radius-sm);padding:10px 12px;font-size:12px;line-height:1.5;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
.alert strong{font-weight:600}
.alertActions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.alert .btn{height:32px;padding:0 12px;font-size:12px;border-radius:6px}
.toastHost{position:fixed;inset-inline:0;bottom:calc(16px + env(safe-area-inset-bottom));display:flex;justify-content:center;pointer-events:none;z-index:40;padding:0 16px}
.toast{background:var(--primary);color:var(--primary-fg);font-size:12px;font-weight:600;padding:10px 14px;border-radius:999px;border:1px solid var(--primary);box-shadow:0 10px 24px rgba(0,0,0,.18);opacity:0;transform:translateY(6px);transition:opacity .18s,transform .18s;max-width:min(92vw,420px);text-align:center}
.toast[data-show="true"]{opacity:1;transform:translateY(0)}
@media(prefers-reduced-motion:reduce){.toast{transition:none}}

@media(max-width:1024px){
  .wrap{max-width:100%}
  .grid2{gap:14px}
}
@media(max-width:960px){
  .kpis{grid-template-columns:repeat(2,1fr)}
  .grid2{grid-template-columns:1fr}
  .chartBox{min-height:220px}
}
@media(max-width:768px){
  .tableWrap table th:first-child,
  .tableWrap table td:first-child{
    position:sticky;
    inset-inline-start:0;
    z-index:2;
    border-inline-end:1px solid var(--border);
    box-shadow:2px 0 6px rgba(0,0,0,.06);
  }
  .tableWrap table th:first-child{background:#fafafa}
  .tableWrap table td:first-child{background:var(--card)}
  .tableWrap table tbody tr:hover td:first-child{background:#fafafa}
  .recentHead{gap:10px}
}
@media(max-width:640px){
  .topbar{padding:12px max(16px, env(safe-area-inset-right)) 12px max(16px, env(safe-area-inset-left));gap:12px;align-items:stretch;flex-direction:column}
  .brand{flex:0 0 auto}
  .controls{display:grid;grid-template-columns:1fr 1fr;gap:8px;width:100%}
  .controls .badge{grid-column:1 / -1;justify-content:center;height:36px}
  .controls .select{width:100%;min-width:0;font-size:16px;height:44px}
  .controls .btn{grid-column:1 / -1;width:100%;height:44px;justify-content:center}
  .wrap{padding:16px max(16px, env(safe-area-inset-right)) calc(20px + env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left))}
  table{font-size:12px} th,td{padding:9px 10px}
  .searchWrap{width:100%}
  .searchWrap input{font-size:16px;height:44px;width:100%}
  .code{font-size:11px;padding:12px 48px 12px 12px}
  .copyBtn{height:36px;min-width:44px}
  .card{padding:16px}
  .chartBox{min-height:200px}
  .kpis{gap:12px}
  .section-head{margin:20px 0 10px}
  .recentHead{padding:12px 14px;align-items:stretch}
  .recentHead > div:last-child{width:100%}
}
@media(max-width:520px){
  .kpis{grid-template-columns:1fr;gap:12px}
  .card h3{flex-wrap:wrap}
}
@media(max-width:480px){
  .providers{grid-template-columns:1fr}
  .metrics{grid-template-columns:repeat(2,1fr)}
}
@media(max-width:375px){
  .wrap{padding:14px max(14px, env(safe-area-inset-right)) calc(16px + env(safe-area-inset-bottom)) max(14px, env(safe-area-inset-left))}
  .kpi{padding:14px}
  .card{padding:14px}
  .recentHead{padding:12px}
  .metrics{gap:8px}
}
@media(max-width:360px){
  .brand h1{font-size:14px}
  .brand p{font-size:11px}
  .metrics{grid-template-columns:1fr}
  .chartBox{min-height:180px}
}
@media(max-width:320px){
  .topbar{gap:10px;padding:10px max(12px, env(safe-area-inset-right)) 10px max(12px, env(safe-area-inset-left))}
  .wrap{padding:12px max(12px, env(safe-area-inset-right)) calc(16px + env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left))}
  .badge{font-size:11px;padding:0 8px;height:32px}
  .kpi strong{font-size:20px}
  .providers{gap:10px}
}
@media(min-width:1280px){
  .wrap{max-width:1280px}
}
@media(min-width:1536px){
  .wrap{max-width:1440px}
}
@media(min-width:1920px){
  .wrap{max-width:1440px}
}
@media(pointer:coarse){
  .select,.btn{height:44px;min-height:44px}
  .searchWrap input{height:44px;min-height:44px}
  .copyBtn{height:36px;min-height:36px;padding:0 12px}
  .tableWrap{scroll-snap-type:inline proximity}
}
@media(hover:none){
  .kpi:hover,.prov:hover{border-color:var(--border)}
}
@media(prefers-contrast:more){
  :root{--border:#c9c9cf;--border-strong:#a1a1aa}
  .card,.kpi,.prov,.tableWrap{border-width:1.5px}
}
</style>
</head>
<body>
<a href="#main" class="sr-only" style="position:absolute;top:8px;left:8px;background:var(--primary);color:var(--primary-fg);padding:8px 12px;border-radius:6px;z-index:50">본문으로 건너뛰기</a>
<div class="topbar" role="banner">
  <div class="brand" aria-label="Tachometer">
    <div class="logo" aria-hidden="true">◉</div>
    <div>
      <h1>TACHOMETER <span class="mono" style="font-size:11px">/ tach.cometer</span></h1>
      <p>AI API Proxy · 실시간 성능 계측</p>
    </div>
  </div>
  <div class="controls" role="toolbar" aria-label="대시보드 컨트롤">
    <span class="badge" aria-live="polite" aria-atomic="true"><i class="dot" aria-hidden="true"></i> <span id="liveText">LIVE</span> <span style="color:var(--muted-fg-soft)" aria-hidden="true">·</span> <span id="reqCount" class="mono" style="font-weight:600">—</span><span style="color:var(--muted-fg)">req</span></span>
    <label class="sr-only" for="windowSel">시간 윈도우</label>
    <select id="windowSel" class="select" aria-label="시간 윈도우">
      <option value="5">최근 5분</option>
      <option value="15">최근 15분</option>
      <option value="60" selected>최근 60분</option>
      <option value="180">최근 3시간</option>
      <option value="1440">최근 24시간</option>
      <option value="all">전체 시간</option>
    </select>
    <label class="sr-only" for="providerSel">프로바이더</label>
    <select id="providerSel" class="select" aria-label="프로바이더"><option value="__all__">전체 프로바이더</option></select>
    <button class="btn" id="refreshBtn" type="button" aria-label="새로고침"><span class="btnSpinner" aria-hidden="true"></span><span class="btnLabel">새로고침</span></button>
  </div>
</div>

<main id="main" class="wrap">
  <section class="card" style="padding:16px" aria-labelledby="usageTitle">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:12px;min-width:0">
      <h3 id="usageTitle" style="margin:0">프록시 사용법</h3>
      <span class="mono inline-meta" style="word-break:break-all">POST https://tach.cometer/pass/&lt;target-host&gt;/&lt;path&gt;</span>
    </div>
    <div class="codeWrap">
      <pre class="code" id="exampleCode" tabindex="0" aria-label="curl 예시">curl https://tach.cometer/pass/api.openai.com/v1/responses \\
  -H "Authorization: Bearer $OPENAI_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"gpt-4o-mini","input":"hello"}'

# Anthropic
curl https://tach.cometer/pass/api.anthropic.com/v1/messages \\
  -H "x-api-key: $ANTHROPIC_API_KEY" ...

# 임의 프로바이더도 동일 패턴
curl https://tach.cometer/pass/api.some.provider/api/v1/chat/completions ...</pre>
      <button class="copyBtn" id="copyBtn" type="button" aria-label="예시 복사" aria-live="polite"><span id="copyBtnText">복사</span></button>
    </div>
    <p class="hint" style="margin-top:12px">요청은 그대로 패스스루되며 응답 헤더·바디를 그대로 전달한다. TTFT, 지연시간, 토큰, RPM/TPM이 자동 계측된다. 로컬은 <span class="mono" style="color:var(--foreground)">http://localhost:3000/pass/api.openai.com/...</span></p>
  </section>

  <div id="alertSlot" style="margin-top:12px;display:none"></div>

  <div class="kpis" id="kpis" aria-live="polite" aria-atomic="true" aria-busy="true">
    <div class="kpi"><div class="skeleton" style="height:11px;width:90px"></div><div class="skeleton" style="height:22px;width:80px;margin-top:12px"></div><div class="skeleton" style="height:12px;width:140px;margin-top:10px"></div></div>
    <div class="kpi"><div class="skeleton" style="height:11px;width:90px"></div><div class="skeleton" style="height:22px;width:80px;margin-top:12px"></div><div class="skeleton" style="height:12px;width:140px;margin-top:10px"></div></div>
    <div class="kpi"><div class="skeleton" style="height:11px;width:60px"></div><div class="skeleton" style="height:22px;width:80px;margin-top:12px"></div><div class="skeleton" style="height:12px;width:120px;margin-top:10px"></div></div>
    <div class="kpi"><div class="skeleton" style="height:11px;width:70px"></div><div class="skeleton" style="height:22px;width:80px;margin-top:12px"></div><div class="skeleton" style="height:12px;width:160px;margin-top:10px"></div></div>
    <div class="kpi"><div class="skeleton" style="height:11px;width:80px"></div><div class="skeleton" style="height:22px;width:80px;margin-top:12px"></div><div class="skeleton" style="height:12px;width:140px;margin-top:10px"></div></div>
  </div>

  <div class="grid2">
    <div class="card" style="min-width:0;overflow:hidden">
      <h3>요청량 & 지연시간 <small class="mono" id="chartMeta">—</small></h3>
      <div class="chartBox"><canvas id="mainChart" height="140" role="img" aria-label="시간대별 요청량과 지연시간 차트"></canvas></div>
    </div>
    <div class="card" style="min-width:0;overflow:hidden">
      <h3>토큰 처리량</h3>
      <div class="chartBox"><canvas id="tokenChart" height="140" role="img" aria-label="입력 출력 캐시 토큰 분포"></canvas></div>
      <div class="hint mono" id="tokenHint" style="margin-top:12px;font-size:11px;overflow-wrap:anywhere" aria-live="polite">—</div>
    </div>
  </div>

  <div class="section-head">
    <h3>모델 순위 <span style="color:var(--muted-fg);font-weight:400">· 토큰 사용량 기준</span></h3>
    <p class="mono inline-meta" id="modelMeta" aria-live="polite"></p>
  </div>
  <div class="tableWrap" tabindex="0" aria-label="모델 순위 표, 좌우로 스크롤 가능">
    <table>
      <caption class="sr-only">토큰 사용량 기준 모델 순위</caption>
      <thead><tr><th scope="col">#</th><th scope="col">모델</th><th scope="col">총 토큰</th><th scope="col">Input</th><th scope="col">Output</th><th scope="col">Cached</th><th scope="col">요청수</th><th scope="col">Avg latency</th><th scope="col">Providers</th></tr></thead>
      <tbody id="modelRankBody"><tr><td colspan="9" style="text-align:center;color:var(--muted-fg);padding:16px">로딩중…</td></tr></tbody>
    </table>
  </div>

  <div class="section-head">
    <h3>프로바이더 별 요약</h3>
    <span class="mono inline-meta" id="providerMeta" aria-live="polite"></span>
  </div>
  <div class="providers" id="providers" aria-live="polite" aria-busy="true">
    <div class="card" style="padding:16px"><div class="skeleton" style="height:12px;width:140px"></div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:14px"><div class="skeleton" style="height:64px"></div><div class="skeleton" style="height:64px"></div><div class="skeleton" style="height:64px"></div></div></div>
  </div>

  <div class="card" style="padding:0;overflow:hidden;margin-top:16px;max-width:100%">
    <div class="recentHead">
      <h3 style="margin:0;flex:0 0 auto">최근 요청 <span style="color:var(--muted-fg);font-weight:400" id="recentMeta"></span></h3>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;min-width:0;flex:1 1 220px;justify-content:flex-end">
        <label class="searchWrap" aria-label="최근 요청 검색">
          <span class="searchIcon" aria-hidden="true">⌕</span>
          <input id="recentSearch" type="search" placeholder="provider, path, model 검색" autocomplete="off" spellcheck="false" aria-label="최근 요청 검색" enterkeyhint="search"/>
          <button class="searchClear" id="recentSearchClear" type="button" aria-label="검색어 지우기" tabindex="-1">×</button>
        </label>
        <span class="mono inline-meta" style="white-space:nowrap">최근 100개</span>
      </div>
    </div>
    <div class="tableWrap" style="border:none;border-radius:0" tabindex="0" aria-label="최근 요청 표, 좌우로 스크롤 가능">
      <table>
        <caption class="sr-only">최근 요청 100개</caption>
        <thead><tr><th scope="col">시간</th><th scope="col">Provider</th><th scope="col">Path</th><th scope="col">Model</th><th scope="col">Status</th><th scope="col">Latency</th><th scope="col">TTFT</th><th scope="col">In / Out / Cached</th><th scope="col">Stream</th></tr></thead>
        <tbody id="recentBody" aria-live="polite" aria-atomic="false"><tr><td colspan="9" style="text-align:center;color:var(--muted-fg);padding:20px">로딩중…</td></tr></tbody>
      </table>
    </div>
  </div>

  <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:16px" class="hint mono">
    <span>API:</span>
    <a href="/api/stats">/api/stats</a>
    <span>·</span>
    <a href="/api/requests">/api/requests</a>
    <span>·</span>
    <a href="/health">/health</a>
    <a href="/healthz">/healthz</a>
    <a href="/readyz">/readyz</a>
  </div>
</main>
<div class="toastHost" aria-live="polite" aria-atomic="true"><div id="toast" class="toast" role="status" data-show="false"></div></div>
<div id="a11yStatus" class="sr-only" aria-live="polite" aria-atomic="true"></div>

<script>
const fmt = n=> n==null ? '\\u2014' : (typeof n==='number'? (Number.isInteger(n)? n.toLocaleString() : n.toLocaleString()): n);
const ms = n=>{ if(n==null) return '\\u2014'; if(Math.abs(n)>=1000) return (n/1000).toFixed(n>=10000?1:2)+' s'; return n+' ms'; };
const pct = n=> n==null ? '\\u2014' : n+'%';
const $ = s=>document.querySelector(s);

let mainChart, tokenChart;
let recentRows = [];
let lastStats = null;
const reducedMotion = typeof window.matchMedia==='function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let toastTimer = 0;
let copyTimer = 0;

function announce(msg){
  const el = document.getElementById('a11yStatus');
  if(!el) return;
  el.textContent = '';
  requestAnimationFrame(()=>{ el.textContent = msg; });
}
function showToast(msg){
  const el = document.getElementById('toast');
  if(!el) return;
  el.textContent = msg;
  el.dataset.show = 'true';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>{ el.dataset.show='false'; }, 2200);
}

function chartDefaults(){
  return {
    animation: reducedMotion ? false : { duration: 420 },
    responsive: true,
    maintainAspectRatio: true,
  };
}

function ensureCharts(series, summary){
  if(typeof Chart==='undefined') return;
  const ctx1 = document.getElementById('mainChart');
  const ctx2 = document.getElementById('tokenChart');
  if(!ctx1 || !ctx2) return;
  const labels = series.map(s=>s.time);
  const counts = series.map(s=>s.count);
  const lat = series.map(s=>s.avgLatency);
  const sum = summary.find(s=>s.provider==='__all__');
  const hint = document.getElementById('tokenHint');
  if(hint) hint.textContent = sum ? \`RPM \${sum.rpm} \\u00b7 TPM in \${fmt(sum.tpm.input)} / out \${fmt(sum.tpm.output)} \\u00b7 tokens/sec \${fmt(sum.tokensPerSec)}\` : '\\u2014';
  const grid = 'rgba(228,228,231,1)';
  const tick = '#52525b';
  const common = chartDefaults();
  const tokenData = [sum?sum.inputTokens.total:0, sum?sum.outputTokens.total:0, sum?sum.cachedTokens.total:0];
  if(mainChart){
    mainChart.data.labels = labels;
    mainChart.data.datasets[0].data = counts;
    mainChart.data.datasets[1].data = lat;
    mainChart.update('none');
  } else {
    mainChart = new Chart(ctx1, {
      type:'bar',
      data:{labels, datasets:[
        {label:'Requests', data:counts, yAxisID:'y', backgroundColor:'#18181b', borderRadius:4, borderSkipped:false, barThickness:10, maxBarThickness:14},
        {label:'Avg latency (ms)', data:lat, yAxisID:'y1', type:'line', borderColor:'#71717a', backgroundColor:'rgba(113,113,122,.08)', tension:.35, pointRadius:0, pointHoverRadius:3, borderWidth:1.5}
      ]},
      options:{
        ...common,
        interaction:{mode:'index',intersect:false},
        plugins:{legend:{labels:{color:tick,boxWidth:12,font:{family:'JetBrains Mono',size:11},usePointStyle:true,pointStyle:'rectRounded'}}},
        scales:{
          x:{ticks:{color:tick,maxTicksLimit:12,font:{size:11}}, grid:{color:grid, lineWidth:1, drawBorder:false}, border:{display:false}},
          y:{position:'left', ticks:{color:tick,font:{size:11}}, grid:{color:grid, lineWidth:1, drawBorder:false}, border:{display:false}},
          y1:{position:'right', ticks:{color:tick,font:{size:11}}, grid:{display:false}, border:{display:false}}
        }
      }
    });
  }
  const doughnutColors = ['#18181b','#71717a','#e4e4e7'];
  if(tokenChart){
    tokenChart.data.datasets[0].data = tokenData;
    tokenChart.update('none');
  } else {
    tokenChart = new Chart(ctx2, {
      type:'doughnut',
      data:{labels:['Input','Output','Cached'], datasets:[{data:tokenData, backgroundColor:doughnutColors, borderWidth:0, hoverOffset:1}]},
      options:{...common, plugins:{legend:{labels:{color:tick,boxWidth:12,font:{family:'JetBrains Mono',size:11},usePointStyle:true}}}, cutout:'64%'}
    });
  }
}

function renderKpis(summary){
  const s = summary.find(x=>x.provider==='__all__') || summary[0];
  const el = document.getElementById('kpis');
  if(!el) return;
  el.setAttribute('aria-busy','false');
  if(!s){ el.innerHTML = '<div class="kpi"><label>아직 데이터 없음</label><strong>\u2014</strong><small>프록시로 첫 요청을 보내면 여기에 수치가 채워집니다. 위 curl 예시를 그대로 실행해 보세요.</small></div>'; return; }
  const toks = n=> n==null ? '\u2014' : n+' tok/s';
  el.innerHTML = \`
    <div class="kpi"><label>Total requests</label><strong>\${fmt(s.totalRequests)}</strong><small>성공률 <span>\${pct(s.successRate)}</span> \u00b7 RPM <span>\${fmt(s.rpm)}</span></small></div>
    <div class="kpi"><label>Avg latency</label><strong>\${ms(s.latency.avg)}</strong><small>P50 <span>\${ms(s.latency.p50)}</span> \u00b7 P95 <span>\${ms(s.latency.p95)}</span> \u00b7 P99 <span>\${ms(s.latency.p99)}</span></small></div>
    <div class="kpi"><label>TTFT</label><strong>\${ms(s.ttft.avg)}</strong><small>P50 <span>\${ms(s.ttft.p50)}</span> \u00b7 P95 <span>\${ms(s.ttft.p95)}</span></small></div>
    <div class="kpi"><label>Tokens</label><strong>\${fmt(s.inputTokens.total + s.outputTokens.total)}</strong><small>In <span>\${fmt(s.inputTokens.total)}</span> \u00b7 Out <span>\${fmt(s.outputTokens.total)}</span> \u00b7 Cached <span>\${fmt(s.cachedTokens.total)}</span></small></div>
    <div class="kpi"><label>Throughput</label><strong>\${toks(s.tokensPerSec)}</strong><small>Output tokens/sec</small></div>
  \`;
}

function renderProviders(summaries){
  const wrap = document.getElementById('providers');
  const sel = document.getElementById('providerSel');
  const meta = document.getElementById('providerMeta');
  const list = summaries.filter(s=>s.provider!=='__all__');
  const cur = sel.value;
  const nextSig = list.map(s=>s.provider).join('|');
  const isFocused = document.activeElement === sel;
  if(sel.dataset.sig !== nextSig && !isFocused){
    sel.innerHTML = '<option value="__all__">전체 프로바이더</option>' + list.map(s=>\`<option value="\${s.provider}">\${s.provider} (\${s.totalRequests})</option>\`).join('');
    sel.dataset.sig = nextSig;
  } else if(sel.dataset.sig === nextSig && !isFocused){
    for(const s of list){
      const opt = Array.from(sel.options).find(o=>o.value===s.provider);
      if(opt) opt.textContent = s.provider + ' (' + s.totalRequests + ')';
    }
  }
  sel.value = list.some(s=>s.provider===cur) ? cur : '__all__';
  if(wrap) wrap.setAttribute('aria-busy','false');
  if(meta) meta.textContent = list.length ? \`\${list.length} providers\` : '';
  if(!list.length){ wrap.innerHTML = '<div class="empty"><strong>아직 수집된 프로바이더가 없습니다.</strong><br/>위 예시처럼 <span class="mono">/pass/&lt;host&gt;/&lt;path&gt;</span> 로 요청을 보내면 여기에 카드가 생깁니다.</div>'; return; }
  wrap.innerHTML = list.map(s=>\`
    <div class="prov">
      <h4><span>\${s.provider}</span> <span class="pill">\${s.totalRequests} req</span> <span class="pill" style="margin-left:auto">\${pct(s.successRate)} ok</span></h4>
      <div class="metrics">
        <div class="metric"><label>Latency avg</label><b>\${ms(s.latency.avg)}</b><small>P50 \${ms(s.latency.p50)} \\u00b7 P95 \${ms(s.latency.p95)}</small></div>
        <div class="metric"><label>TTFT avg</label><b>\${ms(s.ttft.avg)}</b><small>P95 \${ms(s.ttft.p95)}</small></div>
        <div class="metric"><label>RPM / TPM</label><b>\${fmt(s.rpm)}</b><small>\${fmt(s.tpm.input)}/\${fmt(s.tpm.output)} tpm</small></div>
        <div class="metric"><label>Input tokens</label><b>\${fmt(s.inputTokens.total)}</b><small>avg \${fmt(s.inputTokens.avg)}</small></div>
        <div class="metric"><label>Output tokens</label><b>\${fmt(s.outputTokens.total)}</b><small>avg \${fmt(s.outputTokens.avg)} \\u00b7 \${fmt(s.tokensPerSec)}/s</small></div>
        <div class="metric"><label>Cached</label><b>\${fmt(s.cachedTokens.total)}</b><small>P99 \${ms(s.latency.p99)}</small></div>
      </div>
      <div class="bar" aria-hidden="true"><i style="width:\${Math.min(100,s.successRate)}%"></i></div>
    </div>
  \`).join('');
}

function renderModelRankings(rankings){
  const tb=document.getElementById('modelRankBody');
  const meta=document.getElementById('modelMeta');
  if(meta) meta.textContent = rankings?.length ? \`\${rankings.length} models\` : '';
  if(!rankings||!rankings.length){ tb.innerHTML='<tr><td colspan="9" style="text-align:center;color:var(--muted-fg);padding:18px">아직 모델 데이터가 없습니다 — 첫 요청의 <span class="mono">usage</span> 가 수집되면 여기에 순위가 생깁니다.</td></tr>'; return; }
  const max = Math.max(...rankings.map(r=>r.totalTokens),1);
  tb.innerHTML = rankings.map((r,i)=>{
    const w = Math.round(r.totalTokens/max*100);
    const rank = String(i+1).padStart(2,'0');
    const esc = s=> String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
    return \`<tr>
      <td class="mono" style="color:var(--muted-fg);font-weight:500">\${rank}</td>
      <td class="mono" style="font-weight:600;max-width:220px;overflow:hidden;text-overflow:ellipsis" title="\${esc(r.model)}">\${esc(r.model)}</td>
      <td class="mono"><span style="font-weight:600">\${fmt(r.totalTokens)}</span><div class="bar" style="width:80px;margin-top:6px;height:3px" aria-hidden="true"><i style="width:\${w}%"></i></div></td>
      <td class="mono">\${fmt(r.inputTokens)}</td>
      <td class="mono">\${fmt(r.outputTokens)}</td>
      <td class="mono">\${fmt(r.cachedTokens)}</td>
      <td class="mono">\${fmt(r.totalRequests)}</td>
      <td class="mono">\${ms(r.avgLatency)}</td>
      <td class="mono" style="max-width:160px;overflow:hidden;text-overflow:ellipsis" title="\${esc(r.providers.join(', '))}">\${esc(r.providers.join(', '))}</td>
    </tr>\`;
  }).join('');
}

function filteredRecent(){
  const q = (document.getElementById('recentSearch')?.value || '').trim().toLowerCase();
  if(!q) return recentRows;
  return recentRows.filter(r=> (r.provider+' '+r.path+' '+(r.model||'')).toLowerCase().includes(q));
}

function renderRecent(rows){
  const tb = document.getElementById('recentBody');
  const meta = document.getElementById('recentMeta');
  const list = rows ?? filteredRecent();
  if(meta) meta.textContent = list.length ? \`\\u00b7 \${list.length} rows\` : '';
  if(!list.length){
    const emptyMsg = recentRows.length ? '검색 결과가 없습니다 — 다른 키워드로 시도해 보세요.' : '아직 요청이 없습니다 — 위 curl 예시로 첫 요청을 보내보세요.';
    tb.innerHTML = \`<tr><td colspan="9" style="text-align:center;color:var(--muted-fg);padding:22px">\${emptyMsg}</td></tr>\`; return;
  }
  tb.innerHTML = list.slice(0,100).map(r=>{
    const d = new Date(r.timestamp);
    const t = d.toLocaleString('ko-KR');
    const sc = r.status>=500?'s5xx':r.status>=400?'s4xx':'s2xx';
    const esc = s=> String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
    return \`<tr>
      <td class="mono" style="font-size:11px;color:var(--muted-fg)">\${t}</td>
      <td class="mono" style="max-width:160px;overflow:hidden;text-overflow:ellipsis" title="\${esc(r.provider)}">\${esc(r.provider)}</td>
      <td class="mono" style="max-width:220px;overflow:hidden;text-overflow:ellipsis" title="\${esc(r.path)}">\${esc(r.path)}</td>
      <td class="mono" style="font-size:12px;max-width:160px;overflow:hidden;text-overflow:ellipsis" title="\${esc(r.model||'')}">\${esc(r.model||'\\u2014')}</td>
      <td><span class="status \${sc}">\${r.status}</span></td>
      <td class="mono">\${ms(r.latencyMs)}</td>
      <td class="mono">\${ms(r.ttftMs)}</td>
      <td class="mono">\${fmt(r.inputTokens)} / \${fmt(r.outputTokens)} / \${fmt(r.cachedTokens)}</td>
      <td style="text-align:center">\${r.isStreaming?'<span aria-label="streaming" style="width:6px;height:6px;border-radius:50%;background:var(--foreground);display:inline-block"></span>':''}</td>
    </tr>\`;
  }).join('');
}

function showAlert(msg){
  const slot = document.getElementById('alertSlot');
  if(!slot) return;
  slot.style.display = 'block';
  slot.innerHTML = \`<div class="alert" role="alert"><span><strong>불러오기 실패</strong> — \${msg} · 잠시 후 다시 시도합니다.</span><span class="alertActions"><button class="btn btn-ghost" type="button" data-role="alertRetry" aria-label="다시 시도">다시 시도</button></span></div>\`;
  const retry = slot.querySelector('[data-role="alertRetry"]');
  if(retry) retry.addEventListener('click', ()=> load({manual:true}));
}
function clearAlert(){
  const slot = document.getElementById('alertSlot');
  if(slot){ slot.style.display='none'; slot.innerHTML=''; }
}

let isLoading = false;
async function load(opts){
  const manual = !!(opts && opts.manual);
  if(isLoading) return;
  isLoading = true;
  const btn = document.getElementById('refreshBtn');
  const ws = document.getElementById('windowSel');
  const ps = document.getElementById('providerSel');
  if(btn){ btn.setAttribute('aria-busy','true'); btn.disabled=true; }
  if(ws) ws.disabled = true;
  if(ps) ps.disabled = true;
  const w = ws ? ws.value : '60';
  try{
    const [statsRes, reqRes] = await Promise.all([
      fetch('/api/stats?window='+w).then(r=>{ if(!r.ok) throw new Error('stats '+r.status); return r.json(); }),
      fetch('/api/requests?limit=100').then(r=>{ if(!r.ok) throw new Error('requests '+r.status); return r.json(); })
    ]);
    lastStats = statsRes;
    recentRows = reqRes.requests||[];
    document.getElementById('reqCount').textContent = statsRes.total ?? statsRes.summaries?.find(s=>s.provider==='__all__')?.totalRequests ?? 0;
    document.getElementById('chartMeta').textContent = w === 'all' ? '전체 시간' : \`window \${w}m\`;
    renderKpis(statsRes.summaries||[]);
    renderProviders(statsRes.summaries||[]);
    renderModelRankings(statsRes.modelRankings||[]);
    ensureCharts(statsRes.series||[], statsRes.summaries||[]);
    renderRecent(filteredRecent());
    clearAlert();
    announce('대시보드가 갱신되었습니다');
    if(manual) showToast('새로고침 완료');
  } catch(e){
    showAlert((e && e.message) ? e.message : '네트워크 오류');
    announce('불러오기에 실패했습니다');
    const kpis = document.getElementById('kpis');
    if(kpis && kpis.querySelector('.skeleton')){ kpis.innerHTML = '<div class="alert" role="alert"><span>데이터를 불러오지 못했습니다. 다시 시도하세요.</span><span class="alertActions"><button class="btn btn-ghost" type="button" data-role="kpiRetry">다시 시도</button></span></div>'; const r=kpis.querySelector('[data-role="kpiRetry"]'); if(r) r.addEventListener('click', ()=> load({manual:true})); }
  } finally {
    isLoading = false;
    if(btn){ btn.removeAttribute('aria-busy'); btn.disabled=false; }
    if(ws) ws.disabled = false;
    if(ps) ps.disabled = false;
  }
}

document.getElementById('refreshBtn').addEventListener('click', ()=> load({manual:true}));
document.getElementById('windowSel').addEventListener('change', ()=> load({manual:true}));
const recentSearchEl = document.getElementById('recentSearch');
const recentSearchClearEl = document.getElementById('recentSearchClear');
if(recentSearchEl) recentSearchEl.addEventListener('input', ()=> renderRecent(filteredRecent()));
if(recentSearchClearEl) recentSearchClearEl.addEventListener('click', ()=>{
  if(!recentSearchEl) return;
  recentSearchEl.value='';
  recentSearchEl.focus();
  renderRecent(filteredRecent());
});
document.getElementById('copyBtn').addEventListener('click', async ()=>{
  const pre = document.getElementById('exampleCode');
  const btn = document.getElementById('copyBtn');
  const label = document.getElementById('copyBtnText');
  try{
    await navigator.clipboard.writeText(pre.textContent);
    if(btn) btn.dataset.copied='true';
    if(label) label.textContent='복사됨';
    if(btn) btn.setAttribute('aria-label','복사됨');
    announce('예시가 클립보드에 복사되었습니다');
    showToast('복사됨');
    clearTimeout(copyTimer);
    copyTimer = setTimeout(()=>{
      if(btn) btn.dataset.copied='false';
      if(label) label.textContent='복사';
      if(btn) btn.setAttribute('aria-label','예시 복사');
    }, 1400);
  } catch{
    const r = document.createRange(); r.selectNodeContents(pre); const s=window.getSelection(); s.removeAllRanges(); s.addRange(r);
    showToast('선택됨 — 복사하세요');
    announce('예시가 선택되었습니다');
  }
});
document.addEventListener('keydown', (e)=>{
  if((e.metaKey || e.ctrlKey) && e.key.toLowerCase()==='k'){
    const inp = document.getElementById('recentSearch');
    if(inp){ e.preventDefault(); inp.focus(); inp.select(); }
  }
  if(e.key==='Escape'){
    const inp = document.getElementById('recentSearch');
    if(inp && document.activeElement===inp && inp.value){
      inp.value='';
      renderRecent(filteredRecent());
      announce('검색어가 지워졌습니다');
    }
  }
});
const exampleCodeEl = document.getElementById('exampleCode');
if(exampleCodeEl){
  exampleCodeEl.addEventListener('keydown', async (e)=>{
    if((e.metaKey || e.ctrlKey) && e.key.toLowerCase()==='c' && window.getSelection().isCollapsed){
      e.preventDefault();
      const btn = document.getElementById('copyBtn');
      if(btn) btn.click();
    }
  });
}

function waitForChart(cb){
  if(typeof Chart !== 'undefined') cb();
  else setTimeout(()=>waitForChart(cb), 40);
}
function startPolling(){
  waitForChart(()=>{
    load();
    setInterval(load, 2000);
  });
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', startPolling);
else startPolling();

// ponytail: hide topbar on scroll-down, show on scroll-up (mobile only)
(function(){
  const topbar = document.querySelector('.topbar');
  if(!topbar || matchMedia('(min-width:769px)').matches || reducedMotion) return;
  let lastY = 0, ticking = false;
  addEventListener('scroll', ()=>{
    if(ticking) return; ticking = true;
    requestAnimationFrame(()=>{
      const y = scrollY;
      if(y > 56 && y - lastY > 4) topbar.classList.add('topbar--hidden');
      else if(y < lastY - 4 || y <= 0) topbar.classList.remove('topbar--hidden');
      lastY = y; ticking = false;
    });
  }, {passive:true});
})();
</script>
</body>
</html>`
