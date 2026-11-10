// EdgeOne Makers - Request Header Probe (JSON endpoint)
//
// Single file, zero dependencies, no build step. Pure ASCII on purpose:
// non-ASCII text gets mangled when uploaded through an editor that assumes GBK.
//
// Deploy layout:
//   public/index.html            static UI (the page you actually open)
//   cloud-functions/[[default]].js   this file, answers every path with JSON
//
// The UI is static because Makers resolves "/" as a static asset first: with an
// empty public/ the root returns the platform's own 404 and the function is never
// reached. Keeping the page in public/index.html makes "/" work, and this file
// only has to serve data.
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

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'referrer-policy': 'no-referrer',
  'x-content-type-options': 'nosniff',
};

function handler(context) {
  const request = context?.request ?? context;
  // Every path answers with the same JSON: the page is a static file, so there is
  // no reason to distinguish routes, and a probe should never 404 on a mismatch.
  return new Response(JSON.stringify(snapshot(request), null, 2), { status: 200, headers: JSON_HEADERS });
}

// Tolerate the calling conventions Makers has used.
handler.fetch = handler;
handler.onRequest = handler;

export default handler;
export { handler as onRequest, handler as fetch };
