// EdgeOne Makers - Request Header Probe
//
// Single file, zero dependencies, no build step. Pure ASCII on purpose:
// non-ASCII text gets mangled when uploaded through an editor that assumes GBK.
//
// IMPORTANT: this file must be named [[default]].js inside cloud-functions/,
// otherwise Makers only routes the filename to that one path and everything
// else 404s at the platform level.
//
// Routing is deliberately forgiving: ANY path returns the page, and JSON is
// served when the URL carries ?json=1 (or ends with /json or /echo). A probe
// should never answer 404 just because the route did not line up.
//
// All responses are no-store so CDN caching cannot blur the results.

// Headers that could carry the client IP, ordered by platform likelihood.
const IP_CANDIDATES = [
  'eo-connecting-ip',
  'cf-connecting-ip',
  'true-client-ip',
  'x-real-ip',
  'x-forwarded-for',
  'x-client-ip',
  'x-cluster-client-ip',
  'x-original-forwarded-for',
  'x-remote-ip',
  'x-scf-client-ip',
  'ali-cdn-real-ip',
  'cdn-src-ip',
  'forwarded',
  'via',
];

const looksLikeIp = (name) =>
  IP_CANDIDATES.includes(name) || /(^|-)(ip|ips|forwarded|real)$/.test(name) || /forwarded-for/.test(name);

function collectHeaders(request) {
  const out = {};
  try {
    for (const [name, value] of request.headers) {
      out[String(name).toLowerCase()] = value;
    }
  } catch {
    /* header iteration unavailable: return what we have */
  }
  return out;
}

// request.url is a full URL in most runtimes but may arrive relative here.
// Never let URL parsing throw: a probe must always answer.
function parseUrl(request) {
  const raw = String(request?.url ?? '');
  try {
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) return new URL(raw);
  } catch {
    /* fall through to the relative form */
  }
  try {
    return new URL(raw || '/', 'http://placeholder.local');
  } catch {
    return new URL('http://placeholder.local/');
  }
}

function snapshot(request) {
  const url = parseUrl(request);
  const headers = collectHeaders(request);
  const ipLike = {};
  for (const [name, value] of Object.entries(headers)) {
    if (looksLikeIp(name)) ipLike[name] = value;
  }
  return {
    ok: true,
    method: request?.method ?? 'GET',
    // surfaced so a routing mismatch is obvious at a glance
    rawUrl: String(request?.url ?? ''),
    path: url.pathname,
    query: url.search,
    headerCount: Object.keys(headers).length,
    ipLike,
    headers,
    serverTime: new Date().toISOString(),
    runtime: process.version,
    region: process.env.TENCENTCLOUD_REGION ?? null,
    envKeys: Object.keys(process.env)
      .filter((k) => /EDGEONE|TENCENT|SCF|EO_/i.test(k))
      .sort(),
  };
}

function wantsJson(request, url) {
  if (url.searchParams.has('json')) return true;
  if (String(url.searchParams.get('format') ?? '').toLowerCase() === 'json') return true;
  return /(^|\/)(json|echo)\/?$/i.test(url.pathname);
}

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'referrer-policy': 'no-referrer',
  'x-content-type-options': 'nosniff',
};

const HTML_HEADERS = {
  'content-type': 'text/html; charset=utf-8',
  'cache-control': 'no-store',
  'referrer-policy': 'no-referrer',
  'x-content-type-options': 'nosniff',
  'content-security-policy':
    "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'",
};

const PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>EdgeOne Makers - Request Header Probe</title>
<style>
  :root{--bg:#0d1117;--panel:#161b22;--line:#30363d;--fg:#e6edf3;--dim:#8b949e;--ok:#3fb950;--warn:#d29922;--bad:#f85149;--acc:#58a6ff}
  @media (prefers-color-scheme: light){
    :root{--bg:#fff;--panel:#f6f8fa;--line:#d0d7de;--fg:#1f2328;--dim:#656d76;--ok:#1a7f37;--warn:#9a6700;--bad:#cf222e;--acc:#0969da}
  }
  *{box-sizing:border-box}
  body{margin:0;padding:24px 16px 64px;background:var(--bg);color:var(--fg);
    font:14px/1.6 -apple-system,"Segoe UI",Roboto,"PingFang SC","Microsoft YaHei",sans-serif}
  .wrap{max-width:960px;margin:0 auto}
  h1{font-size:19px;margin:0 0 4px}
  .sub{color:var(--dim);font-size:13px;margin-bottom:20px}
  section{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:16px;margin-bottom:16px}
  h2{font-size:14px;margin:0 0 12px;font-weight:600}
  table{width:100%;border-collapse:collapse;font-size:13px}
  td,th{padding:6px 8px;border-bottom:1px solid var(--line);vertical-align:top;text-align:left}
  tr:last-child td{border-bottom:0}
  th{color:var(--dim);font-weight:500;width:34%}
  code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:12.5px;word-break:break-all}
  .tag{display:inline-block;padding:1px 7px;border-radius:20px;font-size:11px;margin-left:6px;vertical-align:1px}
  .t-ok{background:rgba(63,185,80,.15);color:var(--ok)}
  .t-warn{background:rgba(210,153,34,.15);color:var(--warn)}
  .t-bad{background:rgba(248,81,73,.15);color:var(--bad)}
  .btns{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}
  button{cursor:pointer;font:inherit;font-size:13px;padding:7px 13px;border-radius:6px;
    border:1px solid var(--line);background:var(--bg);color:var(--fg)}
  button:hover{border-color:var(--acc);color:var(--acc)}
  .note{color:var(--dim);font-size:12.5px;margin:10px 0 0}
  .verdict{margin-top:14px;padding:12px;border-radius:6px;background:var(--bg);border:1px solid var(--line);font-size:13px}
  .verdict b{color:var(--acc)}
  .muted{color:var(--dim)}
  .empty{color:var(--dim);font-style:italic}
</style>
</head>
<body>
<div class="wrap">
  <h1>EdgeOne Makers - Request Header Probe</h1>
  <div class="sub">Shows which headers the platform injects, and whether a client-supplied header is kept, overwritten or appended. Everything is <code>no-store</code>.</div>

  <section>
    <h2>Routing (sanity check)</h2>
    <table id="route"><tr><td class="muted">loading...</td></tr></table>
    <p class="note">If <code>path</code> above is not what you typed in the address bar, the function is mounted somewhere else and every route will misbehave.</p>
  </section>

  <section>
    <h2>Current request</h2>
    <table id="cur"><tr><td class="muted">loading...</td></tr></table>
  </section>

  <section>
    <h2>Comparison test</h2>
    <div class="btns">
      <button data-h="">(1) Bare request</button>
      <button data-h="X-Forwarded-For: 9.9.9.9">(2) X-Forwarded-For: 9.9.9.9</button>
      <button data-h="X-Real-IP: 8.8.8.8">(3) X-Real-IP: 8.8.8.8</button>
      <button data-h="EO-Connecting-IP: 7.7.7.7">(4) EO-Connecting-IP: 7.7.7.7</button>
      <button data-h="True-Client-IP: 6.6.6.6">(5) True-Client-IP: 6.6.6.6</button>
    </div>
    <table id="cmp"><tr><td class="muted">click a button above</td></tr></table>
    <p class="note">Browsers refuse to set forbidden headers such as <code>Host</code> or <code>Via</code>; use <code>curl</code> for those (see below).</p>
    <div class="verdict" id="verdict" hidden></div>
  </section>

  <section>
    <h2>Test with curl (most accurate)</h2>
    <table>
      <tr><th>Bare</th><td><code>curl -s "https://YOUR-HOST/?json=1"</code></td></tr>
      <tr><th>Fake XFF</th><td><code>curl -s -H 'X-Forwarded-For: 9.9.9.9' "https://YOUR-HOST/?json=1"</code></td></tr>
      <tr><th>Fake X-Real-IP</th><td><code>curl -s -H 'X-Real-IP: 8.8.8.8' "https://YOUR-HOST/?json=1"</code></td></tr>
      <tr><th>IP headers only</th><td><code>curl -s "https://YOUR-HOST/?json=1" | jq .ipLike</code></td></tr>
    </table>
    <p class="note"><code>?json=1</code> works on any path, so it survives being mounted under a subdirectory.</p>
  </section>
</div>

<script>
const IP_HINTS = ['eo-connecting-ip','cf-connecting-ip','true-client-ip','x-real-ip','x-forwarded-for',
  'x-client-ip','x-cluster-client-ip','x-original-forwarded-for','x-remote-ip','x-scf-client-ip','forwarded','via'];

// Relative to the current document, so a subdirectory mount still works.
const JSON_URL = '?json=1';

function isIp(name){
  return IP_HINTS.includes(name) || /(^|-)(ip|ips|forwarded|real)$/.test(name) || /forwarded-for/.test(name);
}

function esc(v){
  return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;');
}

function rows(el, list){
  if (!list.length){ el.innerHTML = '<tr><td class="empty">(no matching headers)</td></tr>'; return; }
  el.innerHTML = list.map(function(pair){
    var k = pair[0], v = pair[1];
    return '<tr><th><code>' + k + '</code>' + (isIp(k) ? '<span class="tag t-warn">IP</span>' : '') +
      '</th><td><code>' + esc(v) + '</code></td></tr>';
  }).join('');
}

async function load(){
  const r = await fetch(JSON_URL, { cache: 'no-store' });
  const d = await r.json();

  document.getElementById('route').innerHTML =
    '<tr><th>rawUrl</th><td><code>' + esc(d.rawUrl) + '</code></td></tr>' +
    '<tr><th>path</th><td><code>' + esc(d.path) + '</code></td></tr>' +
    '<tr><th>query</th><td><code>' + esc(d.query || '(none)') + '</code></td></tr>' +
    '<tr><th>runtime</th><td><code>' + esc(d.runtime) + '</code></td></tr>';

  const all = Object.entries(d.headers).sort(function(a,b){ return a[0].localeCompare(b[0]); });
  const ip = all.filter(function(p){ return isIp(p[0]); });
  const rest = all.filter(function(p){ return !isIp(p[0]); });
  const el = document.getElementById('cur');
  if (ip.length) {
    rows(el, ip.concat([['--- other headers ---', 'total ' + all.length]]).concat(rest));
  } else {
    rows(el, all);
  }
}
load();

const state = {};
function verdict(){
  const el = document.getElementById('verdict');
  const base = state[''];
  if (!base) return;
  const lines = [];
  Object.keys(state).forEach(function(key){
    if (key === '') return;
    const cur = state[key];
    const hname = key.slice(0, key.indexOf(':')).trim();
    const lname = hname.toLowerCase();
    const got = cur.headers[lname];
    if (got === undefined){
      lines.push('Sent <code>' + hname + '</code> -&gt; <strong>never arrived</strong> (platform stripped it).');
    } else {
      const sent = key.slice(key.indexOf(':') + 1).trim();
      if (got === sent) lines.push('Sent <code>' + hname + '</code> -&gt; passed through as <code>' + esc(got) + '</code> <span class="tag t-bad">SPOOFABLE</span>');
      else if (got.indexOf(sent) >= 0) lines.push('Sent <code>' + hname + '</code> -&gt; appended to <code>' + esc(got) + '</code> <span class="tag t-ok">TAKE LAST HOP</span>');
      else lines.push('Sent <code>' + hname + '</code> -&gt; overwritten with <code>' + esc(got) + '</code> <span class="tag t-ok">PLATFORM OWNED</span>');
    }
  });
  if (!lines.length){ el.hidden = true; return; }
  const baseKeys = Object.keys(base.ipLike);
  const baseIpHtml = baseKeys.length
    ? baseKeys.map(function(k){ return '<code>' + k + '</code>=<code>' + esc(base.ipLike[k]) + '</code>'; }).join(', ')
    : '<em>no IP-shaped headers in the bare request</em>';
  el.innerHTML = '<b>IP headers seen in the bare request:</b> ' + baseIpHtml +
    '<br><br><b>Spoof test results:</b><br>' + lines.join('<br>');
  el.hidden = false;
}

document.querySelectorAll('button[data-h]').forEach(function(btn){
  btn.addEventListener('click', async function(){
    const spec = btn.dataset.h;
    const headers = {};
    if (spec){
      const i = spec.indexOf(':');
      headers[spec.slice(0, i).trim()] = spec.slice(i + 1).trim();
    }
    const r = await fetch(JSON_URL, { cache: 'no-store', headers: headers });
    const d = await r.json();
    state[spec] = d;
    const all = Object.entries(d.headers).sort(function(a,b){ return a[0].localeCompare(b[0]); });
    const ip = all.filter(function(p){ return isIp(p[0]); });
    const el = document.getElementById('cmp');
    el.innerHTML = '<tr><th>' + esc(spec || 'bare request') + '</th><td>' +
      (ip.length
        ? ip.map(function(p){ return '<code>' + p[0] + '</code> = <code>' + esc(p[1]) + '</code>'; }).join('<br>')
        : '<span class="empty">no IP-shaped headers</span>') +
      '</td></tr>';
    verdict();
  });
});
</script>
</body>
</html>`;

function handler(context) {
  const request = context?.request ?? context;
  const url = parseUrl(request);

  if (wantsJson(request, url)) {
    return new Response(JSON.stringify(snapshot(request), null, 2), { status: 200, headers: JSON_HEADERS });
  }
  // Any other path serves the page: a probe answering 404 is never useful.
  return new Response(PAGE, { status: 200, headers: HTML_HEADERS });
}

// Tolerate the calling conventions Makers has used.
handler.fetch = handler;
handler.onRequest = handler;

export default handler;
export { handler as onRequest, handler as fetch };
