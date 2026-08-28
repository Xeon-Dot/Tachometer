export const dashboardHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Tachometer — AI API Performance Dashboard</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js"></script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#0a0a0f;--card:#14141e;--card2:#1a1a2e;--border:#24243a;--muted:#8b8ba3;--accent:#7c5cff;--accent2:#00d9ff;--green:#00e676;--red:#ff4757;--yellow:#ffb02e}
body{font-family:'Inter',system-ui,sans-serif;background:var(--bg);color:#e8e8f0;min-height:100vh}
.mono{font-family:'JetBrains Mono',monospace}
.topbar{position:sticky;top:0;z-index:10;backdrop-filter:blur(16px);background:rgba(10,10,15,.85);border-bottom:1px solid var(--border);padding:14px 24px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
.brand{display:flex;align-items:center;gap:12px}
.logo{width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,var(--accent),var(--accent2));display:grid;place-items:center;font-size:20px}
.brand h1{font-size:18px;font-weight:800;letter-spacing:-.03em}
.brand h1 span{color:var(--accent2)}
.brand p{font-size:12px;color:var(--muted)}
.controls{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.select, .btn{border:1px solid var(--border);background:var(--card);color:#e8e8f0;border-radius:10px;padding:8px 12px;font-size:13px}
.btn{cursor:pointer;background:var(--accent);border-color:var(--accent);font-weight:700}
.btn:hover{filter:brightness(1.1)}
.badge{font-size:11px;padding:4px 8px;border-radius:999px;border:1px solid var(--border);background:var(--card)}
.dot{width:8px;height:8px;border-radius:50%;background:var(--green);display:inline-block;box-shadow:0 0 8px var(--green);animation:pulse 1.5s infinite}
@keyframes pulse{0%,100%{opacity:1} 50%{opacity:.4}}
.wrap{max-width:1280px;margin:0 auto;padding:20px 24px 40px}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:16px 0}
@media(max-width:900px){.kpis{grid-template-columns:repeat(2,1fr)}}
@media(max-width:520px){.kpis{grid-template-columns:1fr}}
.kpi{background:linear-gradient(180deg,var(--card),var(--card2));border:1px solid var(--border);border-radius:16px;padding:16px}
.kpi label{font-size:11px;letter-spacing:.08em;color:var(--muted);text-transform:uppercase}
.kpi strong{font-size:22px;display:block;margin-top:6px}
.kpi small{color:var(--muted);font-size:11px}
.grid2{display:grid;grid-template-columns:1.2fr .8fr;gap:12px}
@media(max-width:900px){.grid2{grid-template-columns:1fr}}
.card{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:16px}
.card h3{font-size:13px;letter-spacing:-.02em;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between}
.providers{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px;margin:12px 0}
.prov{background:linear-gradient(180deg,var(--card),#0f0f1a);border:1px solid var(--border);border-radius:16px;padding:16px;position:relative;overflow:hidden}
.prov::before{content:"";position:absolute;inset:0 0 auto 0;height:2px;background:linear-gradient(90deg,var(--accent),var(--accent2));opacity:.8}
.prov h4{font-size:13px;display:flex;align-items:center;gap:8px}
.prov h4 span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pill{font-size:10px;padding:3px 7px;border-radius:999px;background:#1e1e32;border:1px solid var(--border);color:var(--muted)}
.metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px}
.metric{background:#0f0f1a;border:1px solid var(--border);border-radius:12px;padding:10px}
.metric label{font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em}
.metric b{font-size:15px;display:block;margin-top:4px}
.metric small{font-size:10px;color:var(--muted)}
.bar{height:4px;background:#1e1e32;border-radius:999px;overflow:hidden;margin-top:8px}
.bar i{display:block;height:100%;background:linear-gradient(90deg,var(--accent),var(--accent2))}
.tableWrap{overflow:auto;border:1px solid var(--border);border-radius:12px}
table{width:100%;border-collapse:collapse;font-size:12px}
th{position:sticky;top:0;background:#14141e;text-align:left;padding:10px 12px;color:var(--muted);font-weight:600;white-space:nowrap;border-bottom:1px solid var(--border)}
td{padding:9px 12px;border-bottom:1px solid #1a1a28;white-space:nowrap}
tr:hover td{background:#13131f}
.status{padding:3px 7px;border-radius:999px;font-size:11px;font-weight:700}
.s2xx{background:rgba(0,230,118,.15);color:var(--green);border:1px solid rgba(0,230,118,.25)}
.s4xx{background:rgba(255,176,46,.15);color:var(--yellow);border:1px solid rgba(255,176,46,.25)}
.s5xx{background:rgba(255,71,87,.15);color:var(--red);border:1px solid rgba(255,71,87,.25)}
.code{font-size:11px;background:#0f0f1a;border:1px solid var(--border);border-radius:8px;padding:12px;overflow:auto;white-space:pre-wrap;word-break:break-all}
.hint{color:var(--muted);font-size:12px;line-height:1.6}
a{color:var(--accent2);text-decoration:none}
a:hover{text-decoration:underline}
</style>
</head>
<body>
<div class="topbar">
  <div class="brand">
    <div class="logo">◉</div>
    <div>
      <h1>TACHO<span>METER</span> <span style="font-weight:400;color:var(--muted);font-size:12px" class="mono">/ tach.cometer</span></h1>
      <p>AI API Proxy · 실시간 성능 계측</p>
    </div>
  </div>
  <div class="controls">
    <span class="badge"><i class="dot"></i> <span id="liveText">LIVE</span> · <span id="reqCount">0</span> req</span>
    <select id="windowSel" class="select">
      <option value="5">최근 5분</option>
      <option value="15">최근 15분</option>
      <option value="60" selected>최근 60분</option>
      <option value="180">최근 3시간</option>
      <option value="1440">최근 24시간</option>
    </select>
    <select id="providerSel" class="select"><option value="__all__">전체 프로바이더</option></select>
    <button class="btn" id="refreshBtn">↻ 새로고침</button>
  </div>
</div>

<div class="wrap">
  <div class="card" style="margin-top:4px">
    <h3>프록시 사용법 <span class="mono" style="font-size:11px;color:var(--muted)">https://tach.cometer/pass/&lt;target-host&gt;/&lt;path&gt;</span></h3>
    <div class="code" id="exampleCode">curl https://tach.cometer/pass/api.openai.com/v1/responses \\
  -H "Authorization: Bearer $OPENAI_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"gpt-4o-mini","input":"hello"}'

# Anthropic
curl https://tach.cometer/pass/api.anthropic.com/v1/messages \\
  -H "x-api-key: $ANTHROPIC_API_KEY" ...

# 임의 프로바이더도 동일 패턴
curl https://tach.cometer/pass/api.some.provider/api/v1/chat/completions ...</div>
    <p class="hint" style="margin-top:10px">요청은 그대로 패스스루되며, 응답 헤더·바디를 그대로 전달합니다. TTFT, 지연시간, 토큰, RPM/TPM이 자동 계측됩니다. 로컬에서는 <span class="mono">http://localhost:3000/pass/api.openai.com/...</span> 형태로 호출하세요.</p>
  </div>

  <div class="kpis" id="kpis"></div>

  <div class="grid2">
    <div class="card">
      <h3>요청량 & 지연시간 <span class="mono" id="chartMeta" style="color:var(--muted);font-weight:400"></span></h3>
      <canvas id="mainChart" height="140"></canvas>
    </div>
    <div class="card">
      <h3>토큰 처리량</h3>
      <canvas id="tokenChart" height="140"></canvas>
      <div class="hint" id="tokenHint" style="margin-top:10px"></div>
    </div>
  </div>

  <h3 style="margin:18px 0 10px;font-size:13px">모델 순위 <span style="color:var(--muted);font-weight:400">· 토큰 사용량 기준</span></h3>
  <div class="card" style="padding:0;overflow:hidden">
    <div class="tableWrap" style="border:none;border-radius:0">
      <table>
        <thead><tr><th>#</th><th>모델</th><th>총 토큰</th><th>Input</th><th>Output</th><th>Cached</th><th>요청수</th><th>Avg latency</th><th>Providers</th></tr></thead>
        <tbody id="modelRankBody"><tr><td colspan="9" style="text-align:center;color:var(--muted);padding:16px">로딩중…</td></tr></tbody>
      </table>
    </div>
  </div>

  <h3 style="margin:18px 0 10px;font-size:13px">프로바이더 별 요약</h3>
  <div class="providers" id="providers"></div>

  <div class="card">
    <h3>최근 요청 <span style="color:var(--muted);font-weight:400" id="recentMeta"></span></h3>
    <div class="tableWrap"><table>
      <thead><tr><th>시간</th><th>Provider</th><th>Path</th><th>Model</th><th>Status</th><th>Latency</th><th>TTFT</th><th>In / Out / Cached</th><th>Stream</th></tr></thead>
      <tbody id="recentBody"><tr><td colspan="9" style="text-align:center;color:var(--muted);padding:20px">로딩중…</td></tr></tbody>
    </table></div>
  </div>

  <p class="hint" style="margin-top:16px">API: <a href="/api/stats" target="_blank">/api/stats</a> · <a href="/api/requests" target="_blank">/api/requests</a> · <a href="/health" target="_blank">/health</a></p>
</div>

<script>
const $ = s=>document.querySelector(s);
const fmt = n=> n==null ? '—' : (typeof n==='number'? (Number.isInteger(n)? n.toLocaleString() : n.toLocaleString()): n);
const ms = n=> n==null ? '—' : n + ' ms';
const pct = n=> n==null ? '—' : n+'%';

let mainChart, tokenChart;
let lastData=null;

function ensureCharts(series, summary){
  const ctx1 = document.getElementById('mainChart');
  const ctx2 = document.getElementById('tokenChart');
  const labels = series.map(s=>s.time);
  const counts = series.map(s=>s.count);
  const lat = series.map(s=>s.avgLatency);
  const sum = summary.find(s=>s.provider==='__all__');
  if(mainChart) mainChart.destroy();
  if(tokenChart) tokenChart.destroy();
  mainChart = new Chart(ctx1, {
    type:'bar',
    data:{labels, datasets:[
      {label:'Requests', data:counts, yAxisID:'y', backgroundColor:'rgba(124,92,255,.9)', borderRadius:6},
      {label:'Avg latency (ms)', data:lat, yAxisID:'y1', type:'line', borderColor:'#00d9ff', backgroundColor:'rgba(0,217,255,.15)', tension:.35, pointRadius:2}
    ]},
    options:{
      responsive:true, interaction:{mode:'index',intersect:false},
      plugins:{legend:{labels:{color:'#8b8ba3',boxWidth:12}}},
      scales:{
        x:{ticks:{color:'#8b8ba3',maxTicksLimit:12}, grid:{color:'rgba(255,255,255,.06)'}},
        y:{position:'left', ticks:{color:'#8b8ba3'}, grid:{color:'rgba(255,255,255,.06)'}},
        y1:{position:'right', ticks:{color:'#00d9ff'}, grid:{display:false}}
      }
    }
  });
  const tpmIn = sum? sum.tpm.input:0;
  const tpmOut = sum? sum.tpm.output:0;
  const hint = document.getElementById('tokenHint');
  hint.textContent = sum ? \`RPM \${sum.rpm} · TPM in \${fmt(sum.tpm.input)} / out \${fmt(sum.tpm.output)} · tokens/sec \${fmt(sum.tokensPerSec)}\` : '';
  tokenChart = new Chart(ctx2, {
    type:'doughnut',
    data:{labels:['Input','Output','Cached'], datasets:[{data:[sum?sum.inputTokens.total:0, sum?sum.outputTokens.total:0, sum?sum.cachedTokens.total:0], backgroundColor:['#7c5cff','#00d9ff','#ffb02e'], borderWidth:0}]},
    options:{plugins:{legend:{labels:{color:'#8b8ba3',boxWidth:12}}}, cutout:'62%'}
  });
}

function renderKpis(summary){
  const s = summary.find(x=>x.provider==='__all__') || summary[0];
  const el = document.getElementById('kpis');
  if(!s){ el.innerHTML = '<div class="kpi"><label>아직 데이터 없음</label><strong>—</strong><small>프록시로 첫 요청을 보내보세요</small></div>'; return; }
  el.innerHTML = \`
    <div class="kpi"><label>Total Requests</label><strong>\${fmt(s.totalRequests)}</strong><small>성공률 \${pct(s.successRate)} · RPM \${fmt(s.rpm)}</small></div>
    <div class="kpi"><label>Avg Latency</label><strong>\${ms(s.latency.avg)}</strong><small>P50 \${ms(s.latency.p50)} · P95 \${ms(s.latency.p95)} · P99 \${ms(s.latency.p99)}</small></div>
    <div class="kpi"><label>TTFT (Time to First Token)</label><strong>\${ms(s.ttft.avg)}</strong><small>P50 \${ms(s.ttft.p50)} · P95 \${ms(s.ttft.p95)}</small></div>
    <div class="kpi"><label>Tokens</label><strong>\${fmt(s.inputTokens.total + s.outputTokens.total)}</strong><small>In \${fmt(s.inputTokens.total)} · Out \${fmt(s.outputTokens.total)} · Cached \${fmt(s.cachedTokens.total)}</small></div>
  \`;
}

function renderProviders(summaries){
  const wrap = document.getElementById('providers');
  const sel = document.getElementById('providerSel');
  const list = summaries.filter(s=>s.provider!=='__all__');
  const cur = sel.value;
  sel.innerHTML = '<option value="__all__">전체 프로바이더</option>' + list.map(s=>\`<option value="\${s.provider}">\${s.provider} (\${s.totalRequests})</option>\`).join('');
  sel.value = list.some(s=>s.provider===cur) ? cur : '__all__';
  if(!list.length){ wrap.innerHTML = '<div class="hint" style="grid-column:1/-1;padding:12px;border:1px dashed var(--border);border-radius:12px">아직 수집된 프로바이더가 없습니다. 위에 예시처럼 프록시로 요청을 보내면 여기에 카드가 생깁니다.</div>'; return; }
  wrap.innerHTML = list.map(s=>\`
    <div class="prov">
      <h4>◉ <span>\${s.provider}</span> <span class="pill">\${s.totalRequests} req</span> <span class="pill" style="margin-left:auto">\${pct(s.successRate)} ok</span></h4>
      <div class="metrics">
        <div class="metric"><label>Latency avg</label><b>\${ms(s.latency.avg)}</b><small>P50 \${ms(s.latency.p50)} · P95 \${ms(s.latency.p95)}</small></div>
        <div class="metric"><label>TTFT avg</label><b>\${ms(s.ttft.avg)}</b><small>P95 \${ms(s.ttft.p95)}</small></div>
        <div class="metric"><label>RPM / TPM</label><b>\${fmt(s.rpm)}</b><small>\${fmt(s.tpm.input)}/\${fmt(s.tpm.output)} tpm</small></div>
        <div class="metric"><label>Input tokens</label><b>\${fmt(s.inputTokens.total)}</b><small>avg \${fmt(s.inputTokens.avg)}</small></div>
        <div class="metric"><label>Output tokens</label><b>\${fmt(s.outputTokens.total)}</b><small>avg \${fmt(s.outputTokens.avg)} · \${fmt(s.tokensPerSec)}/s</small></div>
        <div class="metric"><label>Cached</label><b>\${fmt(s.cachedTokens.total)}</b><small>P99 \${ms(s.latency.p99)}</small></div>
      </div>
      <div class="bar"><i style="width:\${Math.min(100,s.successRate)}%"></i></div>
    </div>
  \`).join('');
}

function renderModelRankings(rankings){
  const tb=document.getElementById('modelRankBody');
  if(!rankings||!rankings.length){ tb.innerHTML='<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:16px">아직 모델 데이터가 없습니다</td></tr>'; return; }
  const max = Math.max(...rankings.map(r=>r.totalTokens),1);
  const medal=['🥇','🥈','🥉'];
  tb.innerHTML = rankings.map((r,i)=>{
    const w = Math.round(r.totalTokens/max*100);
    const rank = i<3 ? medal[i] : (i+1);
    return \`<tr>
      <td style="font-weight:700">\${rank}</td>
      <td class="mono" style="font-weight:600;max-width:220px;overflow:hidden;text-overflow:ellipsis" title="\${r.model}">\${r.model}</td>
      <td class="mono"><b>\${fmt(r.totalTokens)}</b><div class="bar" style="width:80px;margin-top:4px"><i style="width:\${w}%"></i></div></td>
      <td class="mono">\${fmt(r.inputTokens)}</td>
      <td class="mono">\${fmt(r.outputTokens)}</td>
      <td class="mono">\${fmt(r.cachedTokens)}</td>
      <td>\${fmt(r.totalRequests)}</td>
      <td class="mono">\${ms(r.avgLatency)}</td>
      <td class="mono" style="max-width:160px;overflow:hidden;text-overflow:ellipsis" title="\${r.providers.join(', ')}">\${r.providers.join(', ')}</td>
    </tr>\`;
  }).join('');
}

function renderRecent(rows){
  const tb = document.getElementById('recentBody');
  const meta = document.getElementById('recentMeta');
  meta.textContent = rows.length ? \`· \${rows.length} rows\` : '';
  if(!rows.length){ tb.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:22px">아직 요청이 없습니다</td></tr>'; return; }
  tb.innerHTML = rows.slice(0,100).map(r=>{
    const d = new Date(r.timestamp);
    const t = d.toLocaleString('ko-KR');
    const sc = r.status>=500?'s5xx':r.status>=400?'s4xx':'s2xx';
    return \`<tr>
      <td class="mono" style="font-size:11px">\${t}</td>
      <td class="mono" style="max-width:160px;overflow:hidden;text-overflow:ellipsis">\${r.provider}</td>
      <td class="mono" style="max-width:220px;overflow:hidden;text-overflow:ellipsis" title="\${r.path}">\${r.path}</td>
      <td>\${r.model||'—'}</td>
      <td><span class="status \${sc}">\${r.status}</span></td>
      <td class="mono">\${ms(r.latencyMs)}</td>
      <td class="mono">\${ms(r.ttftMs)}</td>
      <td class="mono">\${fmt(r.inputTokens)} / \${fmt(r.outputTokens)} / \${fmt(r.cachedTokens)}</td>
      <td>\${r.isStreaming?'●':''}</td>
    </tr>\`;
  }).join('');
}

async function load(){
  const w = document.getElementById('windowSel').value;
  const [statsRes, reqRes] = await Promise.all([
    fetch('/api/stats?window='+w).then(r=>r.json()),
    fetch('/api/requests?limit=100').then(r=>r.json())
  ]);
  lastData = statsRes;
  document.getElementById('reqCount').textContent = statsRes.total ?? statsRes.summaries?.find(s=>s.provider==='__all__')?.totalRequests ?? 0;
  document.getElementById('chartMeta').textContent = \`window \${w}m\`;
  renderKpis(statsRes.summaries||[]);
  renderProviders(statsRes.summaries||[]);
  renderModelRankings(statsRes.modelRankings||[]);
  ensureCharts(statsRes.series||[], statsRes.summaries||[]);
  renderRecent(reqRes.requests||[]);
}

document.getElementById('refreshBtn').addEventListener('click', load);
document.getElementById('windowSel').addEventListener('change', load);
setInterval(load, 2000);
load();
</script>
</body>
</html>`
