export const dashboardHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/>
<meta name="color-scheme" content="light dark"/>
<title>Tachometer — AI API Performance Dashboard</title>
<link rel="icon" href="/favicon.svg" type="image/svg+xml"/>
<link rel="icon" href="/favicon.ico" sizes="32x32"/>
<link rel="apple-touch-icon" href="/favicon.svg"/>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
<script defer src="https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js"></script>
<script>
(function(){try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark')t='system';var d=t==='dark'||(t==='system'&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();
</script>
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
  --code-bg:#f4f4f5;
  --code-fg:#27272a;
  --table-th-bg:#fafafa;
  --table-row-hover:#fafafa;
  --status-2xx-bg:#f0fdf4;--status-2xx-fg:#15803d;--status-2xx-border:#bbf7d0;
  --status-4xx-bg:#fffbeb;--status-4xx-fg:#b45309;--status-4xx-border:#fde68a;
  --status-5xx-bg:#fef2f2;--status-5xx-fg:#b91c1c;--status-5xx-border:#fecdd3;
  --alert-bg:#fef2f2;--alert-fg:#7f1d1d;--alert-border:#fecdd3;
  --skeleton-2:#ececef;
  --chart-grid:rgba(228,228,231,1);--chart-tick:#52525b;--chart-bar:#18181b;--chart-line:#71717a;--chart-line-bg:rgba(113,113,122,.08);--chart-doughnut:#18181b,#52525b,#a1a1aa,#e4e4e7;
  --btn-hover:#27272a;--btn-ghost-active:#ececef;
  --shadow-sticky:2px 0 6px rgba(0,0,0,.06);
}
html.dark{
  --bg:#000000;
  --card:#0a0a0a;
  --foreground:#fafafa;
  --muted-fg:#a1a1aa;
  --muted-fg-soft:#71717a;
  --muted:#18181b;
  --border:#27272a;
  --border-strong:#3f3f46;
  --primary:#fafafa;
  --primary-fg:#000000;
  --ring:#fafafa;
  --code-bg:#18181b;
  --code-fg:#d4d4d8;
  --table-th-bg:#0a0a0a;
  --table-row-hover:#18181b;
  --status-2xx-bg:#052e16;--status-2xx-fg:#4ade80;--status-2xx-border:#166534;
  --status-4xx-bg:#422006;--status-4xx-fg:#fbbf24;--status-4xx-border:#854d0e;
  --status-5xx-bg:#450a0a;--status-5xx-fg:#f87171;--status-5xx-border:#991b1b;
  --alert-bg:#450a0a;--alert-fg:#fca5a5;--alert-border:#991b1b;
  --skeleton-2:#1a1a1a;
  --chart-grid:rgba(63,63,70,1);--chart-tick:#a1a1aa;--chart-bar:#fafafa;--chart-line:#71717a;--chart-line-bg:rgba(113,113,122,.12);--chart-doughnut:#fafafa,#a1a1aa,#52525b,#27272a;
  --btn-hover:#3f3f46;--btn-ghost-active:#27272a;
  --shadow-sticky:2px 0 6px rgba(0,0,0,.4);
}
html{color-scheme:light;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;scrollbar-gutter:stable;overflow-x:clip;transition:color-scheme .3s}
html.dark{color-scheme:dark}
body{font-family:'JetBrains Mono',ui-monospace,monospace;background:var(--bg);color:var(--foreground);min-height:100vh;line-height:1.5;font-size:14px;overflow-x:clip;max-width:100%}
.mono{font-family:'JetBrains Mono',ui-monospace,monospace}
.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
a{color:var(--foreground);text-decoration:underline;text-underline-offset:3px;text-decoration-color:var(--border-strong);text-decoration-thickness:1px}
a:hover{text-decoration-color:var(--foreground)}
a:focus-visible{outline:2px solid var(--ring);outline-offset:2px;border-radius:2px}
.topbar{position:sticky;top:0;z-index:20;background:rgba(250,250,250,.96);backdrop-filter:saturate(1.2) blur(8px);border-bottom:1px solid var(--border);min-height:56px;padding:max(10px,env(safe-area-inset-top)) max(24px, env(safe-area-inset-right)) 10px max(24px, env(safe-area-inset-left));display:flex;align-items:center;justify-content:space-between;gap:16px}
html.dark .topbar{background:rgba(0,0,0,.96)}
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
.btn:hover{background:var(--btn-hover);border-color:var(--btn-hover)}
.btn:active{transform:translateY(0.5px);background:var(--btn-hover)}
.btn:disabled{opacity:.52;cursor:not-allowed}
.btn[aria-busy="true"]{opacity:.88;pointer-events:none}
.btnSpinner{width:12px;height:12px;border-radius:50%;border:1.5px solid rgba(250,250,250,.35);border-top-color:var(--primary-fg);display:none;flex-shrink:0;animation:spin .65s linear infinite}
.btn[aria-busy="true"] .btnSpinner{display:block}
.btnLabel{line-height:1}
.btn-ghost{background:var(--card);color:var(--foreground);border-color:var(--border)}
.btn-ghost:hover{background:var(--muted);border-color:var(--border-strong)}
.btn-ghost:active{background:var(--btn-ghost-active)}
.themeBtn{width:40px;padding:0;font-size:15px;flex-shrink:0}
.themeIcon{display:block;line-height:1;font-size:15px}
.select:disabled{opacity:.55;cursor:not-allowed;background-color:var(--muted)}
.badge{display:inline-flex;align-items:center;gap:8px;font-size:12px;font-weight:500;padding:0 10px;height:32px;border-radius:999px;border:1px solid var(--border);background:var(--card);white-space:nowrap}
.dot{width:7px;height:7px;border-radius:50%;background:#16a34a;flex-shrink:0;box-shadow:0 0 0 3px rgba(22,163,74,.12)}
@media(prefers-reduced-motion:reduce){.dot{animation:none!important}.btnSpinner{animation:none!important}}
@keyframes spin{to{transform:rotate(360deg)}}
.wrap{max-width:1280px;margin:0 auto;padding:24px max(24px, env(safe-area-inset-right)) 48px max(24px, env(safe-area-inset-left))}
.kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:20px 0 16px}
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
.code{font-family:'JetBrains Mono',monospace;font-size:11.5px;line-height:1.65;background:var(--code-bg);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px 44px 14px 14px;overflow-x:auto;white-space:pre;word-break:normal;color:var(--code-fg);scrollbar-width:thin;-webkit-overflow-scrolling:touch;overscroll-behavior-inline:contain;max-width:100%;transition:border-color .15s,box-shadow .15s}
.code:focus-visible{outline:2px solid var(--ring);outline-offset:2px;border-color:var(--border-strong)}
.code::-webkit-scrollbar{height:6px}
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
th{text-align:start;padding:10px 12px;color:var(--muted-fg);font-weight:600;white-space:nowrap;border-bottom:1px solid var(--border);background:var(--table-th-bg);font-size:11px;letter-spacing:.04em;text-transform:uppercase}
td{padding:10px 12px;border-bottom:1px solid var(--border);white-space:nowrap}
tr:last-child td{border-bottom:none}
@media(hover:hover){tbody tr:hover td{background:var(--table-row-hover)}}
tbody tr:focus-within td{background:var(--table-row-hover)}
.status{padding:3px 7px;border-radius:6px;font-size:11px;font-weight:600;border:1px solid var(--border);display:inline-flex;align-items:center;gap:4px;line-height:1}
.s2xx{background:var(--status-2xx-bg);color:var(--status-2xx-fg);border-color:var(--status-2xx-border)}
.s4xx{background:var(--status-4xx-bg);color:var(--status-4xx-fg);border-color:var(--status-4xx-border)}
.s5xx{background:var(--status-5xx-bg);color:var(--status-5xx-fg);border-color:var(--status-5xx-border)}
.empty{border:1px dashed var(--border);border-radius:var(--radius);padding:22px 16px;text-align:center;color:var(--muted-fg);font-size:13px;background:var(--card);line-height:1.6}
.empty strong{color:var(--foreground);font-weight:600}
.empty .btn{margin-top:12px}
.inline-meta{font-size:11px;color:var(--muted-fg);font-weight:500;overflow-wrap:anywhere}
.recentHead{padding:14px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;border-bottom:1px solid var(--border);flex-wrap:wrap}
.skeleton{background:linear-gradient(90deg, var(--muted) 25%, var(--skeleton-2) 37%, var(--muted) 63%);background-size:400% 100%;animation:shimmer 1.2s ease-in-out infinite;border-radius:6px}
@media(prefers-reduced-motion:reduce){.skeleton{animation:none;background:var(--muted)}}
@keyframes shimmer{0%{background-position:100% 0} 100%{background-position:-100% 0}}
.alert{border:1px solid var(--alert-border);background:var(--alert-bg);color:var(--alert-fg);border-radius:var(--radius-sm);padding:10px 12px;font-size:12px;line-height:1.5;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
.alert strong{font-weight:600}
.alertActions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.alert .btn{height:32px;padding:0 12px;font-size:12px;border-radius:6px}
@media(max-width:1024px){
  .wrap{max-width:100%}
  .grid2{grid-template-columns:1fr;gap:14px}
  .kpis{grid-template-columns:repeat(2,1fr)}
  .chartBox{min-height:220px}
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
      .code{font-size:11px;padding:12px 48px 12px 12px}
    .card{padding:16px}
  .chartBox{min-height:200px}
  .kpis{grid-template-columns:1fr;gap:12px}
  .section-head{margin:20px 0 10px}
  .recentHead{padding:12px 14px;align-items:stretch}
  .recentHead > div:last-child{width:100%}
  .providers{grid-template-columns:1fr}
  .metrics{grid-template-columns:repeat(2,1fr)}
  .tableWrap table th:first-child,
  .tableWrap table td:first-child{
    position:sticky;
    inset-inline-start:0;
    z-index:2;
    border-inline-end:1px solid var(--border);
    box-shadow:var(--shadow-sticky);
  }
  .tableWrap table th:first-child{background:var(--table-th-bg)}
  .tableWrap table td:first-child{background:var(--card)}
  .recentHead{gap:10px}
}
</style>
</head>
<body>
<a href="#main" class="sr-only" style="position:absolute;top:8px;left:8px;background:var(--primary);color:var(--primary-fg);padding:8px 12px;border-radius:6px;z-index:50">Skip to content</a>
<div class="topbar" role="banner">
  <div class="brand" aria-label="Tachometer">
    <div class="logo" aria-hidden="true">◉</div>
    <div>
      <h1>TACHOMETER <span class="mono" style="font-size:11px">/ tacho.xeon.kr</span></h1>
      <p>AI API Proxy · Real-time performance metering</p>
    </div>
  </div>
  <div class="controls" role="toolbar" aria-label="Dashboard controls">
    <span class="badge" aria-live="polite" aria-atomic="true"><i class="dot" aria-hidden="true"></i> <span id="liveText">LIVE</span> <span style="color:var(--muted-fg-soft)" aria-hidden="true">·</span> <span id="reqCount" class="mono" style="font-weight:600">—</span><span style="color:var(--muted-fg)">req</span></span>
    <button class="btn btn-ghost themeBtn" id="themeBtn" type="button" aria-label="Change theme" title="Theme"><span class="themeIcon" id="themeIcon" aria-hidden="true"></span></button>
    <label class="sr-only" for="providerSel">Provider</label>
    <select id="providerSel" class="select" aria-label="Provider">
      <option value="all">All providers</option>
    </select>
    <label class="sr-only" for="windowSel">Time window</label>
    <select id="windowSel" class="select" aria-label="Time window">
      <option value="5">Last 5 min</option>
      <option value="15">Last 15 min</option>
      <option value="60" selected>Last 60 min</option>
      <option value="180">Last 3 hours</option>
      <option value="1440">Last 24 hours</option>
      <option value="all">All time</option>
    </select>
    <button class="btn" id="refreshBtn" type="button" aria-label="Refresh"><span class="btnSpinner" aria-hidden="true"></span><span class="btnLabel">Refresh</span></button>
  </div>
</div>

<main id="main" class="wrap">
  <section class="card" style="padding:16px" aria-labelledby="usageTitle">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:12px;min-width:0">
      <h3 id="usageTitle" style="margin:0">Proxy usage</h3>
      <span class="mono inline-meta" style="word-break:break-all">POST https://tacho.xeon.kr/pass/&lt;target-host&gt;/&lt;path&gt;</span>
    </div>
    <div class="codeWrap">
      <pre class="code" id="exampleCode" tabindex="0" aria-label="curl example">curl https://tacho.xeon.kr/pass/api.openai.com/v1/responses \\
  -H "Authorization: Bearer $OPENAI_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"gpt-4o-mini","input":"hello"}'

# Anthropic
curl https://tacho.xeon.kr/pass/api.anthropic.com/v1/messages \\
  -H "x-api-key: $ANTHROPIC_API_KEY" ...

# Any provider uses the same pattern
curl https://tacho.xeon.kr/pass/api.some.provider/api/v1/chat/completions ...</pre>
    </div>
  </section>

  <div style="margin-top:12px;display:none"></div>

  <div class="kpis" id="kpis" aria-live="polite" aria-atomic="true" aria-busy="true">
    <div class="kpi"><div class="skeleton" style="height:11px;width:90px"></div><div class="skeleton" style="height:22px;width:80px;margin-top:12px"></div><div class="skeleton" style="height:12px;width:140px;margin-top:10px"></div></div>
    <div class="kpi"><div class="skeleton" style="height:11px;width:90px"></div><div class="skeleton" style="height:22px;width:80px;margin-top:12px"></div><div class="skeleton" style="height:12px;width:140px;margin-top:10px"></div></div>
    <div class="kpi"><div class="skeleton" style="height:11px;width:60px"></div><div class="skeleton" style="height:22px;width:80px;margin-top:12px"></div><div class="skeleton" style="height:12px;width:120px;margin-top:10px"></div></div>
    <div class="kpi"><div class="skeleton" style="height:11px;width:70px"></div><div class="skeleton" style="height:22px;width:80px;margin-top:12px"></div><div class="skeleton" style="height:12px;width:160px;margin-top:10px"></div></div>
    <div class="kpi"><div class="skeleton" style="height:11px;width:80px"></div><div class="skeleton" style="height:22px;width:80px;margin-top:12px"></div><div class="skeleton" style="height:12px;width:140px;margin-top:10px"></div></div>
    <div class="kpi"><div class="skeleton" style="height:11px;width:60px"></div><div class="skeleton" style="height:22px;width:90px;margin-top:12px"></div><div class="skeleton" style="height:12px;width:160px;margin-top:10px"></div></div>
  </div>

  <div class="grid2">
    <div class="card" style="min-width:0;overflow:hidden">
      <h3>Requests & latency <small class="mono" id="chartMeta">—</small></h3>
      <div class="chartBox"><canvas id="mainChart" height="140" role="img" aria-label="Requests and latency over time chart"></canvas></div>
    </div>
    <div class="card" style="min-width:0;overflow:hidden">
      <h3>Token throughput</h3>
      <div class="chartBox"><canvas id="tokenChart" height="140" role="img" aria-label="Input, output, and cache token distribution"></canvas></div>
      <div class="hint mono" id="tokenHint" style="margin-top:12px;font-size:11px;overflow-wrap:anywhere" aria-live="polite">—</div>
    </div>
  </div>

  <div class="section-head">
    <h3>Model rankings <span style="color:var(--muted-fg);font-weight:400">· by token usage</span></h3>
    <p class="mono inline-meta" id="modelMeta" aria-live="polite"></p>
  </div>
  <div class="tableWrap" tabindex="0" aria-label="Model rankings table, scrollable horizontally">
    <table>
      <caption class="sr-only">Model rankings</caption>
      <thead><tr><th scope="col">#</th><th scope="col">Model</th><th scope="col">Total tokens</th><th scope="col">Input</th><th scope="col">Output</th><th scope="col">Cache R/W</th><th scope="col">Cost</th><th scope="col">Requests</th><th scope="col">Avg latency</th><th scope="col">Providers</th></tr></thead>
      <tbody id="modelRankBody"><tr><td colspan="10" style="text-align:center;color:var(--muted-fg);padding:16px">Loading…</td></tr></tbody>
    </table>
  </div>

  <div class="section-head">
    <h3>Provider summary</h3>
    <span class="mono inline-meta" id="providerMeta" aria-live="polite"></span>
  </div>
  <div class="providers" id="providers" aria-live="polite" aria-busy="true">
    <div class="card" style="padding:16px"><div class="skeleton" style="height:12px;width:140px"></div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:14px"><div class="skeleton" style="height:64px"></div><div class="skeleton" style="height:64px"></div><div class="skeleton" style="height:64px"></div></div></div>
  </div>

  <div class="card" style="padding:0;overflow:hidden;margin-top:16px;max-width:100%">
    <div class="recentHead">
      <h3 style="margin:0;flex:0 0 auto">Recent requests <span style="color:var(--muted-fg);font-weight:400" id="recentMeta"></span></h3>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;min-width:0;flex:1 1 220px;justify-content:flex-end">
        <span class="mono inline-meta" style="white-space:nowrap">Last 100</span>
      </div>
    </div>
    <div class="tableWrap" style="border:none;border-radius:0" tabindex="0" aria-label="Recent requests table, scrollable horizontally">
      <table>
        <caption class="sr-only">Last 100 requests</caption>
        <thead><tr><th scope="col">Time</th><th scope="col">Provider</th><th scope="col">Path</th><th scope="col">Model</th><th scope="col">Status</th><th scope="col">Latency</th><th scope="col">TTFT</th><th scope="col">In / Out | Cache R / W</th><th scope="col">Cost</th></tr></thead>
        <tbody id="recentBody" aria-live="polite" aria-atomic="false"><tr><td colspan="9" style="text-align:center;color:var(--muted-fg);padding:20px">Loading…</td></tr></tbody>
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
    <span>·</span>
    <span id="pricingMeta">Loading pricing data…</span>
  </div>
</main>

<script>
const fmt = n=> n==null ? '\\u2014' : (typeof n==='number'? (Number.isInteger(n)? n.toLocaleString() : n.toLocaleString()): n);
const ms = n=>{ if(n==null) return '\\u2014'; if(Math.abs(n)>=1000) return (n/1000).toFixed(n>=10000?1:2)+' s'; return n+' ms'; };
const localTime = t=> new Date(t).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
const pct = n=> n==null ? '\\u2014' : n+'%';
const usd = n=>{ if(n==null) return '\\u2014'; const a=Math.abs(n); const d = a===0 ? 2 : a<0.01 ? 6 : a<1 ? 4 : 2; return '$'+n.toFixed(d); };
const inputExcludesCached = p=> /anthropic/i.test(String(p||''));
const netIn = (total, cached, write, provider)=> inputExcludesCached(provider) ? (total||0) : Math.max(0, (total||0) - (cached||0) - (write||0));
const costCell = c=>{ if(!c) return '\\u2014'; if(!c.pricedRequests && c.unpricedRequests) return '\\u2014'; return usd(c.total); };
const $ = s=>document.querySelector(s);

let mainChart, tokenChart;
let recentRows = [];
const reducedMotion = typeof window.matchMedia==='function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const THEME_KEY='theme';
const THEME_LABEL={light:'Light',dark:'Dark',system:'System'};
const THEME_ICON={light:'☀',dark:'☾',system:'◐'};
const themeMedia = typeof window.matchMedia==='function' ? window.matchMedia('(prefers-color-scheme: dark)') : null;

function readTheme(){
  try{
    const t=localStorage.getItem(THEME_KEY);
    if(t==='light'||t==='dark') return t;
  }catch(e){}
  return 'system';
}
function prefersDark(){ return !!(themeMedia && themeMedia.matches); }
function applyTheme(){
  const mode=readTheme();
  const dark = mode==='dark' || (mode==='system' && prefersDark());
  document.documentElement.classList.toggle('dark', dark);
  const icon=document.getElementById('themeIcon');
  if(icon) icon.textContent=THEME_ICON[mode];
  const btn=document.getElementById('themeBtn');
  if(btn){
    const label=THEME_LABEL[mode];
    btn.title='Theme: '+label;
    btn.setAttribute('aria-label','Change theme — currently '+label+', click to switch');
  }
  applyChartTheme();
}
function cycleTheme(){
  const order={light:'dark',dark:'system',system:'light'};
  const next=order[readTheme()]||'light';
  try{ localStorage.setItem(THEME_KEY,next); }catch(e){}
  applyTheme();
}
if(themeMedia){
  const onSchemeChange=function(){ if(readTheme()==='system') applyTheme(); };
  if(themeMedia.addEventListener) themeMedia.addEventListener('change',onSchemeChange);
  else if(themeMedia.addListener) themeMedia.addListener(onSchemeChange);
}


function chartDefaults(){
  return {
    animation: reducedMotion ? false : { duration: 420 },
    responsive: true,
    maintainAspectRatio: true,
  };
}

function chartPalette(){
  const cs=getComputedStyle(document.documentElement);
  return {
    grid:cs.getPropertyValue('--chart-grid').trim()||'rgba(228,228,231,1)',
    tick:cs.getPropertyValue('--chart-tick').trim()||'#52525b',
    bar:cs.getPropertyValue('--chart-bar').trim()||'#18181b',
    line:cs.getPropertyValue('--chart-line').trim()||'#71717a',
    lineBg:cs.getPropertyValue('--chart-line-bg').trim()||'rgba(113,113,122,.08)',
    doughnut:(cs.getPropertyValue('--chart-doughnut').trim()||'#18181b,#71717a,#e4e4e7').split(',')
  };
}

function applyChartTheme(){
  const p=chartPalette();
  if(mainChart){
    const ds=mainChart.data.datasets;
    ds[0].backgroundColor=p.bar;
    ds[1].borderColor=p.line;
    ds[1].backgroundColor=p.lineBg;
    mainChart.options.plugins.legend.labels.color=p.tick;
    mainChart.options.scales.x.ticks.color=p.tick;
    mainChart.options.scales.x.grid.color=p.grid;
    mainChart.options.scales.y.ticks.color=p.tick;
    mainChart.options.scales.y.grid.color=p.grid;
    mainChart.options.scales.y1.ticks.color=p.tick;
    mainChart.update('none');
  }
  if(tokenChart){
    tokenChart.data.datasets[0].backgroundColor=p.doughnut;
    tokenChart.options.plugins.legend.labels.color=p.tick;
    tokenChart.update('none');
  }
}

function ensureCharts(series, summary){
  if(typeof Chart==='undefined') return;
  const ctx1 = document.getElementById('mainChart');
  const ctx2 = document.getElementById('tokenChart');
  if(!ctx1 || !ctx2) return;
  const labels = series.map(s=>localTime(s.time));
  const counts = series.map(s=>s.count);
  const lat = series.map(s=>s.avgLatency);
  const sum = summary.find(s=>s.provider==='__all__');
  const hint = document.getElementById('tokenHint');
  if(hint) hint.textContent = sum ? \`RPM \${sum.rpm} \\u00b7 TPM in \${fmt(sum.tpm.netInput)} / out \${fmt(sum.tpm.output)} \\u00b7 tokens/sec \${fmt(sum.tokensPerSec)}\` : '\\u2014';
  const pal=chartPalette();
  const grid=pal.grid, tick=pal.tick, barColor=pal.bar, lineColor=pal.line, lineBg=pal.lineBg;
  const common = chartDefaults();
  const tokenData = [sum?sum.inputTokens.netTotal:0, sum?sum.outputTokens.total:0, sum?sum.cachedTokens.total:0, sum?sum.cacheWriteTokens.total:0];
  if(mainChart){
    mainChart.data.labels = labels;
    mainChart.data.datasets[0].data = counts;
    mainChart.data.datasets[1].data = lat;
    mainChart.update('none');
  } else {
    mainChart = new Chart(ctx1, {
      type:'bar',
      data:{labels, datasets:[
        {label:'Requests', data:counts, yAxisID:'y', backgroundColor:barColor, borderRadius:4, borderSkipped:false, barThickness:10, maxBarThickness:14},
        {label:'Avg latency (ms)', data:lat, yAxisID:'y1', type:'line', borderColor:lineColor, backgroundColor:lineBg, tension:.35, pointRadius:0, pointHoverRadius:3, borderWidth:1.5}
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
  const doughnutColors=pal.doughnut;
  if(tokenChart){
    tokenChart.data.datasets[0].data = tokenData;
    tokenChart.update('none');
  } else {
    tokenChart = new Chart(ctx2, {
      type:'doughnut',
      data:{labels:['Input','Output','Cache R','Cache W'], datasets:[{data:tokenData, backgroundColor:doughnutColors, borderWidth:0, hoverOffset:1}]},
      options:{...common, plugins:{legend:{labels:{color:tick,boxWidth:12,font:{family:'JetBrains Mono',size:11},usePointStyle:true}}}, cutout:'64%'}
    });
  }
}

function renderKpis(summary){
  const s = summary.find(x=>x.provider==='__all__') || summary[0];
  const el = document.getElementById('kpis');
  if(!el) return;
  el.setAttribute('aria-busy','false');
  if(!s){ el.innerHTML = '<div class="kpi"><label>No data yet</label><strong>\u2014</strong><small>Send your first request through the proxy and the numbers will appear here. Try the curl example above.</small></div>'; return; }
  const toks = n=> n==null ? '\u2014' : n+' tok/s';
  el.innerHTML = \`
    <div class="kpi"><label>Total requests</label><strong>\${fmt(s.totalRequests)}</strong><small>Success rate <span>\${pct(s.successRate)}</span> \u00b7 RPM <span>\${fmt(s.rpm)}</span></small></div>
    <div class="kpi"><label>Avg latency</label><strong>\${ms(s.latency.avg)}</strong><small>P50 <span>\${ms(s.latency.p50)}</span> \u00b7 P95 <span>\${ms(s.latency.p95)}</span> \u00b7 P99 <span>\${ms(s.latency.p99)}</span></small></div>
    <div class="kpi"><label>TTFT</label><strong>\${ms(s.ttft.avg)}</strong><small>P50 <span>\${ms(s.ttft.p50)}</span> \u00b7 P95 <span>\${ms(s.ttft.p95)}</span></small></div>
    <div class="kpi"><label>Tokens</label><strong>\${fmt(s.inputTokens.total + s.outputTokens.total)}</strong><small>In <span>\${fmt(s.inputTokens.netTotal)}</span> \u00b7 Out <span>\${fmt(s.outputTokens.total)}</span> \u00b7 Cache R <span>\${fmt(s.cachedTokens.total)}</span> \u00b7 W <span>\${fmt(s.cacheWriteTokens.total)}</span></small></div>
    <div class="kpi"><label>Throughput</label><strong>\${toks(s.tokensPerSec)}</strong><small>Output tokens/sec</small></div>
    <div class="kpi"><label>Cost</label><strong>\${costCell(s.cost)}</strong><small>Input <span>\${usd(s.cost.input)}</span> \u00b7 Output <span>\${usd(s.cost.output)}</span> \u00b7 Cache <span>\${usd(s.cost.cacheRead + s.cost.cacheWrite)}</span>\${s.cost.unpricedRequests ? ' \\u00b7 <span>'+fmt(s.cost.unpricedRequests)+'</span> unpriced' : ''}</small></div>
  \`;
}

function renderProviders(summaries){
  const wrap = document.getElementById('providers');
  const meta = document.getElementById('providerMeta');
  const list = (summaries||[]).filter(s=>s.provider!=='__all__');
  if(wrap) wrap.setAttribute('aria-busy','false');
  if(meta) meta.textContent = list.length ? \`\${list.length} providers\` : '';
  if(!list.length){ wrap.innerHTML = '<div class="empty"><strong>No providers collected yet.</strong><br/>Send a request to <span class="mono">/pass/&lt;host&gt;/&lt;path&gt;</span> as in the example above and a card will appear here.</div>'; return; }
  wrap.innerHTML = list.map(s=>\`
    <div class="prov">
      <h4><span>\${s.provider}</span> <span class="pill">\${s.totalRequests} req</span> <span class="pill" style="margin-left:auto">\${pct(s.successRate)} ok</span></h4>
      <div class="metrics">
        <div class="metric"><label>Latency avg</label><b>\${ms(s.latency.avg)}</b><small>P50 \${ms(s.latency.p50)} \\u00b7 P95 \${ms(s.latency.p95)} \\u00b7 P99 \${ms(s.latency.p99)}</small></div>
        <div class="metric"><label>TTFT avg</label><b>\${ms(s.ttft.avg)}</b><small>P95 \${ms(s.ttft.p95)}</small></div>
        <div class="metric"><label>RPM / TPM</label><b>\${fmt(s.rpm)}</b><small>\${fmt(s.tpm.netInput)}/\${fmt(s.tpm.output)} tpm</small></div>
        <div class="metric"><label>Input tokens</label><b>\${fmt(s.inputTokens.netTotal)}</b><small>avg \${fmt(s.inputTokens.netAvg)}</small></div>
        <div class="metric"><label>Output tokens</label><b>\${fmt(s.outputTokens.total)}</b><small>avg \${fmt(s.outputTokens.avg)} \\u00b7 \${fmt(s.tokensPerSec)}/s</small></div>
        <div class="metric"><label>Cache R / W</label><b>\${fmt(s.cachedTokens.total)} / \${fmt(s.cacheWriteTokens.total)}</b><small>read / write tokens</small></div>
        <div class="metric" style="grid-column:1/-1"><label>Cost</label><b>\${costCell(s.cost)}</b><small>Input \${usd(s.cost.input)} \\u00b7 Output \${usd(s.cost.output)} \\u00b7 Cache \${usd(s.cost.cacheRead + s.cost.cacheWrite)}\${s.cost.unpricedRequests ? ' \\u00b7 '+fmt(s.cost.unpricedRequests)+' unpriced' : ''}</small></div>
      </div>
      <div class="bar" aria-hidden="true"><i style="width:\${Math.min(100,s.successRate)}%"></i></div>
    </div>
  \`).join('');
}

function renderModelRankings(rankings){
  const tb=document.getElementById('modelRankBody');
  const meta=document.getElementById('modelMeta');
  if(meta) meta.textContent = rankings?.length ? \`\${rankings.length} models\` : '';
  if(!rankings||!rankings.length){ tb.innerHTML='<tr><td colspan="10" style="text-align:center;color:var(--muted-fg);padding:18px">No model data yet — rankings appear here once <span class="mono">usage</span> is collected from the first request.</td></tr>'; return; }
  const max = Math.max(...rankings.map(r=>r.totalTokens),1);
  tb.innerHTML = rankings.map((r,i)=>{
    const w = Math.round(r.totalTokens/max*100);
    const rank = String(i+1).padStart(2,'0');
    const esc = s=> String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
    return \`<tr>
      <td class="mono" style="color:var(--muted-fg);font-weight:500">\${rank}</td>
      <td class="mono" style="font-weight:600;max-width:220px;overflow:hidden;text-overflow:ellipsis" title="\${esc(r.model)}">\${esc(r.model)}</td>
      <td class="mono"><span style="font-weight:600">\${fmt(r.totalTokens)}</span><div class="bar" style="width:80px;margin-top:6px;height:3px" aria-hidden="true"><i style="width:\${w}%"></i></div></td>
      <td class="mono">\${fmt(r.netInputTokens)}</td>
      <td class="mono">\${fmt(r.outputTokens)}</td>
      <td class="mono">\${fmt(r.cachedTokens)} / \${fmt(r.cacheWriteTokens)}</td>
      <td class="mono" title="\${r.cost && r.cost.unpricedRequests ? r.cost.unpricedRequests+' unpriced' : ''}">\${costCell(r.cost)}</td>
      <td class="mono">\${fmt(r.totalRequests)}</td>
      <td class="mono">\${ms(r.avgLatency)}</td>
      <td class="mono" style="max-width:160px;overflow:hidden;text-overflow:ellipsis" title="\${esc(r.providers.join(', '))}">\${esc(r.providers.join(', '))}</td>
    </tr>\`;
  }).join('');
}

function renderRecent(){
  const tb = document.getElementById('recentBody');
  const meta = document.getElementById('recentMeta');
  const list = recentRows;
  if(meta) meta.textContent = list.length ? \`\\u00b7 \${list.length} rows\` : '';
  if(!list.length){
    const emptyMsg = recentRows.length ? 'No results — try a different keyword.' : 'No requests yet — send your first request using the curl example above.';
    tb.innerHTML = \`<tr><td colspan="9" style="text-align:center;color:var(--muted-fg);padding:22px">\${emptyMsg}</td></tr>\`; return;
  }
  tb.innerHTML = list.slice(0,100).map(r=>{
    const d = new Date(r.timestamp);
    const t = d.toLocaleString('en-US');
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
      <td class="mono">\${fmt(netIn(r.inputTokens, r.cachedTokens, r.cacheWriteTokens, r.provider))} / \${fmt(r.outputTokens)} / \${fmt(r.cachedTokens)} / \${fmt(r.cacheWriteTokens)}</td>
      <td class="mono">\${usd(r.cost)}</td>
    </tr>\`;
  }).join('');
}

let isLoading = false;
function escAttr(s){ return String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;'); }
function syncProviderOptions(providers, current){
  const ps = document.getElementById('providerSel');
  if(!ps) return;
  const list = Array.isArray(providers) ? providers : [];
  const key = 'all\\0' + list.join('\\0');
  if(ps.dataset.optsKey === key){
    if(ps.value !== current && (current === 'all' || list.includes(current))) ps.value = current;
    return;
  }
  ps.dataset.optsKey = key;
  ps.innerHTML = '<option value="all">All providers</option>' + list.map(function(p){ return '<option value="' + escAttr(p) + '">' + escAttr(p) + '</option>'; }).join('');
  if(current && current !== 'all' && !list.includes(current)){
    const opt = document.createElement('option');
    opt.value = current; opt.textContent = current;
    ps.appendChild(opt);
  }
  ps.value = current || 'all';
}
function syncUrl(w, p){
  const u = new URL(location.href);
  u.searchParams.set('window', w);
  if(p && p !== 'all') u.searchParams.set('provider', p);
  else u.searchParams.delete('provider');
  history.replaceState(null, '', u.toString());
}
async function load(){
  if(isLoading) return;
  isLoading = true;
  const btn = document.getElementById('refreshBtn');
  const ws = document.getElementById('windowSel');
  const ps = document.getElementById('providerSel');
  if(btn){ btn.setAttribute('aria-busy','true'); btn.disabled=true; }
  if(ws) ws.disabled = true;
  if(ps) ps.disabled = true;
  const w = ws ? ws.value : '60';
  const p = ps ? ps.value : 'all';
  try{
    const [statsRes, reqRes] = await Promise.all([
      fetch('/api/stats?window='+encodeURIComponent(w)+'&provider='+encodeURIComponent(p)).then(r=>{ if(!r.ok) throw new Error('stats '+r.status); return r.json(); }),
      fetch('/api/requests?limit=100&provider='+encodeURIComponent(p)).then(r=>{ if(!r.ok) throw new Error('requests '+r.status); return r.json(); })
    ]);
    const providers = statsRes.providers || (statsRes.summaries||[]).filter(s=>s.provider!=='__all__').map(s=>s.provider);
    syncProviderOptions(providers, statsRes.provider || p);
    recentRows = reqRes.requests||[];
    document.getElementById('reqCount').textContent = statsRes.total ?? statsRes.summaries?.find(s=>s.provider==='__all__')?.totalRequests ?? 0;
    const provLabel = (statsRes.provider && statsRes.provider !== 'all') ? ' \\u00b7 ' + statsRes.provider : '';
    document.getElementById('chartMeta').textContent = (w === 'all' ? 'All time' : 'window ' + w + 'm') + provLabel;
    const pm = document.getElementById('pricingMeta');
    if(pm){
      const pr = statsRes.pricing;
      if(!pr) pm.textContent = '';
      else if(pr.error) pm.textContent = 'pricing error: ' + pr.error;
      else if(!pr.updatedAt) pm.textContent = 'Loading pricing…';
      else pm.textContent = 'pricing ' + fmt(pr.models) + ' models · updated ' + new Date(pr.updatedAt).toLocaleTimeString('en-US');
    }
    renderKpis(statsRes.summaries||[]);
    renderProviders(statsRes.summaries||[]);
    renderModelRankings(statsRes.modelRankings||[]);
    ensureCharts(statsRes.series||[], statsRes.summaries||[]);
    renderRecent();
  } catch(e){
    const kpis = document.getElementById('kpis');
    if(kpis && kpis.querySelector('.skeleton')){ kpis.innerHTML = '<div class="alert" role="alert"><span>Failed to load data. Please try again.</span></div>'; }
  } finally {
    isLoading = false;
    if(btn){ btn.removeAttribute('aria-busy'); btn.disabled=false; }
    if(ws) ws.disabled = false;
    if(ps) ps.disabled = false;
  }
}

document.getElementById('refreshBtn').addEventListener('click', ()=> load());
function onFilterChange(){
  const ws = document.getElementById('windowSel');
  const ps = document.getElementById('providerSel');
  syncUrl(ws ? ws.value : '60', ps ? ps.value : 'all');
  load();
}
document.getElementById('windowSel').addEventListener('change', onFilterChange);
document.getElementById('providerSel').addEventListener('change', onFilterChange);
// Read ?window= and ?provider= from URL on load
(function(){
  const u = new URL(location.href);
  const w = u.searchParams.get('window');
  if(w){
    const ws = document.getElementById('windowSel');
    if(ws && Array.from(ws.options).some(o=>o.value===w)){
      ws.value = w;
    }
  }
  const pv = u.searchParams.get('provider');
  if(pv){
    const ps = document.getElementById('providerSel');
    if(ps){
      if(!Array.from(ps.options).some(o=>o.value===pv)){
        const opt = document.createElement('option');
        opt.value = pv; opt.textContent = pv;
        ps.appendChild(opt);
      }
      ps.value = pv;
    }
  }
})();

// theme toggle wiring
(function(){
  const btn=document.getElementById('themeBtn');
  if(btn) btn.addEventListener('click', cycleTheme);
  applyTheme();
})();

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
</script>
</body>
</html>`;
