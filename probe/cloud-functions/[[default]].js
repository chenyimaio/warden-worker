// EdgeOne Makers · 请求头探测器（单文件，零依赖，无需构建）
//
// 目的：确认平台到底注入了哪些请求头（尤其是客户端真实 IP），
// 以及客户端自带的同名头会被「保留 / 覆盖 / 追加」成什么样。
//
// 路由：
//   GET /        交互页面：展示当前头 + 一键对比测试
//   GET /json    当前请求的完整头（给 curl / jq 用）
//
// 所有响应都是 no-store，避免 CDN 缓存把探测结果搅混。

// 常见的「客户端 IP」类头，按平台可能性排序
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
  for (const [name, value] of request.headers) {
    out[String(name).toLowerCase()] = value;
  }
  return out;
}

function snapshot(request) {
  const headers = collectHeaders(request);
  const ipLike = {};
  for (const [name, value] of Object.entries(headers)) {
    if (looksLikeIp(name)) ipLike[name] = value;
  }
  return {
    ok: true,
    method: request.method,
    url: request.url,
    headerCount: Object.keys(headers).length,
    ipLike,
    headers,
    serverTime: new Date().toISOString(),
    runtime: process.version,
    region: process.env.TENCENTCLOUD_REGION ?? null,
    envKeys: Object.keys(process.env).filter((k) => /EDGEONE|TENCENT|SCF|EO_/i.test(k)).sort(),
  };
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
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>EdgeOne Makers · 请求头探测</title>
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
  button:disabled{opacity:.5;cursor:default}
  .note{color:var(--dim);font-size:12.5px;margin:10px 0 0}
  .verdict{margin-top:14px;padding:12px;border-radius:6px;background:var(--bg);border:1px solid var(--line);font-size:13px}
  .verdict b{color:var(--acc)}
  .muted{color:var(--dim)}
  .empty{color:var(--dim);font-style:italic}
</style>
</head>
<body>
<div class="wrap">
  <h1>EdgeOne Makers · 请求头探测</h1>
  <div class="sub">用来确认平台注入了哪些头、客户端自带的同名头会不会被覆盖。全部响应 <code>no-store</code>。</div>

  <section>
    <h2>当前请求</h2>
    <table id="cur"><tr><td class="muted">加载中…</td></tr></table>
  </section>

  <section>
    <h2>对比测试</h2>
    <div class="btns">
      <button data-h="">① 裸请求（不带自定义头）</button>
      <button data-h="X-Forwarded-For: 9.9.9.9">② 带 X-Forwarded-For: 9.9.9.9</button>
      <button data-h="X-Real-IP: 8.8.8.8">③ 带 X-Real-IP: 8.8.8.8</button>
      <button data-h="EO-Connecting-IP: 7.7.7.7">④ 带 EO-Connecting-IP: 7.7.7.7</button>
      <button data-h="True-Client-IP: 6.6.6.6">⑤ 带 True-Client-IP: 6.6.6.6</button>
    </div>
    <table id="cmp"><tr><td class="muted">点一个按钮开始</td></tr></table>
    <p class="note">浏览器不允许设置 <code>Host</code> / <code>Via</code> 等禁止头；这些用 <code>curl</code> 测更准（见下）。</p>
    <div class="verdict" id="verdict" hidden></div>
  </section>

  <section>
    <h2>用 curl 测（最准）</h2>
    <table>
      <tr><th>裸请求</th><td><code>curl -s https://你的域名/json</code></td></tr>
      <tr><th>伪造 XFF</th><td><code>curl -s -H 'X-Forwarded-For: 9.9.9.9' https://你的域名/json</code></td></tr>
      <tr><th>伪造 X-Real-IP</th><td><code>curl -s -H 'X-Real-IP: 8.8.8.8' https://你的域名/json</code></td></tr>
      <tr><th>只看 IP 类头</th><td><code>curl -s https://你的域名/json | jq .ipLike</code></td></tr>
    </table>
  </section>
</div>

<script>
const IP_HINTS = ['eo-connecting-ip','cf-connecting-ip','true-client-ip','x-real-ip','x-forwarded-for',
  'x-client-ip','x-cluster-client-ip','x-original-forwarded-for','x-remote-ip','x-scf-client-ip','forwarded','via'];

function isIp(name){
  return IP_HINTS.includes(name) || /(^|-)(ip|ips|forwarded|real)$/.test(name) || /forwarded-for/.test(name);
}

function rows(el, list){
  if (!list.length){ el.innerHTML = '<tr><td class="empty">（没有匹配的头）</td></tr>'; return; }
  el.innerHTML = list.map(([k,v]) =>
    '<tr><th><code>'+k+'</code>'+(isIp(k)?'<span class="tag t-warn">IP 类</span>':'')+'</th><td><code>'+
    String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</code></td></tr>').join('');
}

async function load(){
  const r = await fetch('/json', { cache: 'no-store' });
  const d = await r.json();
  const all = Object.entries(d.headers).sort((a,b)=>a[0].localeCompare(b[0]));
  const ip = all.filter(([k])=>isIp(k));
  const el = document.getElementById('cur');
  rows(el, ip.length ? ip.concat([['—— 其余头 ——','共 '+all.length+' 个']]).concat(all.filter(([k])=>!isIp(k))) : all);
}
load();

const state = {};
function verdict(){
  const el = document.getElementById('verdict');
  const base = state[''];
  if (!base) return;
  const baseIp = base.ipLike;
  const lines = [];
  for (const key of Object.keys(state)) {
    if (key === '') continue;
    const cur = state[key];
    const [hname] = key.split(':').map(s=>s.trim());
    const lname = hname.toLowerCase();
    const got = cur.headers[lname];
    if (got === undefined){
      lines.push('带 <code>'+hname+'</code> → 服务端<strong>完全没收到</strong>这个头（平台剥离了）。');
    } else {
      const sent = key.slice(key.indexOf(':')+1).trim();
      if (got === sent) lines.push('带 <code>'+hname+'</code> → 原样透传 <code>'+got+'</code> <span class="tag t-bad">可伪造</span>');
      else if (got.includes(sent)) lines.push('带 <code>'+hname+'</code> → 被<strong>追加</strong>为 <code>'+got+'</code> <span class="tag t-ok">取最后一跳可信</span>');
      else lines.push('带 <code>'+hname+'</code> → 被<strong>覆盖</strong>为 <code>'+got+'</code> <span class="tag t-ok">平台接管</span>');
    }
  }
  if (!lines.length) { el.hidden = true; return; }
  const baseIpHtml = Object.keys(baseIp).length
    ? Object.entries(baseIp).map(([k,v])=>'<code>'+k+'</code>=<code>'+v+'</code>').join('、')
    : '<em>裸请求里没有任何 IP 类头</em>';
  el.innerHTML = '<b>裸请求里看到的 IP 类头：</b>' + baseIpHtml +
    '<br><br><b>伪造测试结果：</b><br>' + lines.join('<br>');
  el.hidden = false;
}

document.querySelectorAll('button[data-h]').forEach(btn => {
  btn.addEventListener('click', async () => {
    const spec = btn.dataset.h;
    const headers = {};
    if (spec){ const i = spec.indexOf(':'); headers[spec.slice(0,i).trim()] = spec.slice(i+1).trim(); }
    const r = await fetch('/json', { cache: 'no-store', headers });
    const d = await r.json();
    state[spec] = d;
    const all = Object.entries(d.headers).sort((a,b)=>a[0].localeCompare(b[0]));
    const ip = all.filter(([k])=>isIp(k));
    const el = document.getElementById('cmp');
    el.innerHTML = '<tr><th>'+(spec || '裸请求')+'</th><td>'+
      (ip.length ? ip.map(([k,v])=>'<code>'+k+'</code> = <code>'+v+'</code>').join('<br>') : '<span class="empty">没有 IP 类头</span>')+
      '</td></tr>';
    verdict();
  });
});
</script>
</body>
</html>`;

function handler(context) {
  const request = context?.request ?? context;
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';

  if (path === '/json' || path === '/echo') {
    return new Response(JSON.stringify(snapshot(request), null, 2), { status: 200, headers: JSON_HEADERS });
  }
  if (path === '/' || path === '/index.html') {
    return new Response(PAGE, { status: 200, headers: HTML_HEADERS });
  }
  return new Response(JSON.stringify({ error: 'not_found', path }), { status: 404, headers: JSON_HEADERS });
}

// 兼容 Makers 的几种调用约定
handler.fetch = handler;
handler.onRequest = handler;

export default handler;
export { handler as onRequest, handler as fetch };
