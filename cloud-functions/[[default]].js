// generated at deploy time by edgeone/scripts/build-makes.mjs — do not commit the built output
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/@edgeone/pages-blob/dist/index.js
var require_dist = __commonJS({
  "node_modules/@edgeone/pages-blob/dist/index.js"(exports, module) {
    "use strict";
    var U = Object.defineProperty;
    var ge = Object.getOwnPropertyDescriptor;
    var fe = Object.getOwnPropertyNames;
    var he = Object.prototype.hasOwnProperty;
    var me = (t, e) => {
      for (var n in e) U(t, n, { get: e[n], enumerable: true });
    };
    var ye = (t, e, n, r) => {
      if (e && typeof e == "object" || typeof e == "function") for (let s of fe(e)) !he.call(t, s) && s !== n && U(t, s, { get: () => e[s], enumerable: !(r = ge(e, s)) || r.enumerable });
      return t;
    };
    var pe = (t) => ye(U({}, "__esModule", { value: true }), t);
    var Le = {};
    me(Le, { InvalidKeyError: () => w, InvalidStoreNameError: () => p, MissingProjectIdError: () => S, PagesBlobError: () => m, PreconditionFailedError: () => b, QuotaExceededError: () => x, RateLimitedError: () => B, Store: () => T, getStore: () => _e, listStores: () => Ne });
    module.exports = pe(Le);
    var m = class extends Error {
      code;
      constructor(e, n) {
        super(`PagesBlob: ${n}`), this.name = "PagesBlobError", this.code = e;
      }
    };
    var w = class extends m {
      constructor(e) {
        super("INVALID_KEY", e);
      }
    };
    var p = class extends m {
      constructor(e) {
        super("INVALID_STORE_NAME", e);
      }
    };
    var E = class extends m {
      constructor(e) {
        super("MISSING_ENVIRONMENT", `Environment not configured for Pages Blob. Missing: ${e.join(", ")}. Supply these properties when creating a store, or ensure the function is running in a Pages environment.`);
      }
    };
    var we = "If usage just dropped back under the limit, wait a few minutes and retry.";
    var Ce = { storage: "write denied: storage quota exceeded (free plan 1 GB). Reads and deletes still work; delete objects or upgrade the plan.", "complex-operations": "write denied: complex operation quota (writes and lists) exceeded. Reads and deletes still work; upgrade the plan or wait until usage is back under the limit.", egress: "write denied: egress bandwidth quota exceeded. Only deletes still work; upgrade the plan or wait until usage is back under the limit." };
    var x = class extends m {
      reason;
      overMetrics;
      constructor(e = {}) {
        let n = e.reason && Ce[e.reason] || "write denied: blob quota exceeded.";
        super("QUOTA_EXCEEDED", `${n} ${we}`), this.reason = e.reason, this.overMetrics = e.overMetrics ?? [];
      }
    };
    var B = class extends m {
      constructor() {
        super("RATE_LIMITED", "request rate limited, please retry later");
      }
    };
    var S = class extends m {
      constructor() {
        super("MISSING_PROJECT_ID", "projectId is required when using API token mode. Please supply { name, projectId, token } to getStore() / listStores().");
      }
    };
    var y = class extends m {
      constructor(e) {
        super("CREDENTIAL_ERROR", e);
      }
    };
    var h = class extends m {
      statusCode;
      constructor(e, n) {
        super("COS_ERROR", `COS returned ${e}: ${n}`), this.statusCode = e;
      }
    };
    var b = class extends m {
      constructor() {
        super("PRECONDITION_FAILED", "conditional write failed (key already exists)");
      }
    };
    function C(t) {
      if (t === "") throw new w("Blob key must not be empty.");
      if (t.startsWith("/") || t.startsWith("%2F")) throw new w("Blob key must not start with forward slash (/).");
      if (new TextEncoder().encode(t).length > 600) throw new w("Blob key must be a sequence of Unicode characters whose UTF-8 encoding is at most 600 bytes long.");
    }
    function F(t) {
      if (t === "") throw new p("Store name must not be empty.");
      if (t.includes("/") || t.includes(":")) throw new p("Store name must not contain forward slashes (/) or colons (:).");
      if (!/^[a-zA-Z0-9_-]+$/.test(t)) throw new p("Store name must only contain letters, digits, underscores, and hyphens.");
      if (new TextEncoder().encode(t).length > 64) throw new p("Store name must be a sequence of Unicode characters whose UTF-8 encoding is at most 64 bytes long.");
    }
    var T = class {
      cosClient;
      storeName;
      defaultConsistency;
      constructor(e, n, r = "eventual") {
        this.cosClient = e, this.storeName = n, this.defaultConsistency = r;
      }
      resolveConsistency(e) {
        return e ?? this.defaultConsistency;
      }
      async set(e, n, r) {
        C(e);
        let s = await this.cosClient.putObject(this.storeName, e, n, { onlyIfNew: r?.onlyIfNew, cacheControl: r?.cacheControl });
        if (r?.onlyIfNew && s.statusCode === 412) throw new b();
      }
      async setJSON(e, n, r) {
        C(e);
        let s = JSON.stringify(n), o = await this.cosClient.putObject(this.storeName, e, s, { onlyIfNew: r?.onlyIfNew, contentType: "application/json", cacheControl: r?.cacheControl });
        if (r?.onlyIfNew && o.statusCode === 412) throw new b();
      }
      async createUploadUrl(e, n) {
        C(e);
        let { url: r, expiresAt: s } = await this.cosClient.createPresignedPutUrl(this.storeName, e, { expireSeconds: n?.expireSeconds, contentType: n?.contentType });
        return { url: r, key: e, expiresAt: s };
      }
      async get(e, n) {
        C(e);
        let r = this.resolveConsistency(n?.consistency), s = await this.cosClient.getObject(this.storeName, e, r);
        if (s === null) return null;
        let { body: o } = s, c = n?.type ?? "text", i = new TextDecoder("utf-8");
        switch (c) {
          case "text":
            return i.decode(o);
          case "json":
            return JSON.parse(i.decode(o));
          case "arrayBuffer":
            return o.buffer.slice(o.byteOffset, o.byteOffset + o.byteLength);
          case "blob":
            return new Blob([o]);
          case "stream":
            return new ReadableStream({ start(d) {
              d.enqueue(o), d.close();
            } });
          default:
            return i.decode(o);
        }
      }
      async getMetadata(e, n) {
        C(e);
        let r = this.resolveConsistency(n?.consistency);
        return this.cosClient.headObject(this.storeName, e, r);
      }
      async getWithHeaders(e, n) {
        C(e);
        let r = this.resolveConsistency(n?.consistency), s = await this.cosClient.getObject(this.storeName, e, r);
        return s ? { body: new TextDecoder("utf-8").decode(s.body), headers: s.headers || {} } : null;
      }
      async delete(e) {
        C(e), await this.cosClient.deleteObject(this.storeName, e);
      }
      async list(e) {
        let n = e?.paginate !== false, r = e?.limit, s = [], o = [], c = this.resolveConsistency(e?.consistency), i = e?.cursor || "", d = true, a;
        for (; d; ) {
          let l = r !== void 0 ? r - s.length : 1e3, g = Math.min(l, 1e3);
          if (g <= 0) break;
          let u = await this.cosClient.listObjects(this.storeName, { prefix: e?.prefix, delimiter: e?.directories ? "/" : void 0, marker: i || void 0, maxKeys: g, consistency: c });
          for (let f of u.contents) s.push({ key: f.key, etag: f.etag });
          o.push(...u.commonPrefixes), r !== void 0 && s.length >= r ? (s.length = r, (u.isTruncated || u.contents.length === g) && (a = u.nextMarker), d = false) : u.isTruncated ? !n && r === void 0 ? (a = u.nextMarker, d = false) : i = u.nextMarker : d = false;
        }
        return { blobs: s, directories: o, ...a ? { cursor: a } : {} };
      }
    };
    var xe = new TextEncoder();
    function K(t) {
      let e = xe.encode(t), n = new ArrayBuffer(e.byteLength), r = new Uint8Array(n);
      return r.set(e), r;
    }
    function V(t) {
      let e = t instanceof Uint8Array ? t : new Uint8Array(t), n = "";
      for (let r = 0; r < e.length; r++) n += e[r].toString(16).padStart(2, "0");
      return n;
    }
    async function W(t, e) {
      let n = await crypto.subtle.importKey("raw", K(t), { name: "HMAC", hash: "SHA-1" }, false, ["sign"]), r = await crypto.subtle.sign("HMAC", n, K(e));
      return V(r);
    }
    async function be(t) {
      let e = await crypto.subtle.digest("SHA-1", K(t));
      return V(e);
    }
    function j(t) {
      return encodeURIComponent(t).replace(/[!'()*]/g, (e) => "%" + e.charCodeAt(0).toString(16).toUpperCase());
    }
    function I(t) {
      try {
        return decodeURIComponent(t);
      } catch {
        return t;
      }
    }
    function Ee(t) {
      return t.split("/").map((e) => I(e)).join("/");
    }
    function k(t) {
      return Ee(I(t));
    }
    function J(t) {
      return t.split("/").map((e) => j(I(e))).join("/");
    }
    var Se = /* @__PURE__ */ new Set(["cache-control", "content-disposition", "content-encoding", "content-length", "content-md5", "content-type", "expect", "expires", "if-match", "if-modified-since", "if-none-match", "if-unmodified-since", "origin", "range", "transfer-encoding"]);
    function Te(t) {
      return t === "host" || t === "x-cos-security-token" ? false : !!(Se.has(t) || t.startsWith("x-cos-"));
    }
    function X(t) {
      if (!t) return [];
      let e = [];
      for (let [n, r] of Object.entries(t)) r != null && e.push([n.toLowerCase(), String(r)]);
      return e.sort(([n], [r]) => n < r ? -1 : n > r ? 1 : 0), e;
    }
    function Y(t) {
      return t.map(([e, n]) => `${j(e)}=${j(n)}`).join("&");
    }
    function G(t) {
      return t.map(([e]) => j(e)).join(";");
    }
    async function Z(t) {
      let e = t.method.toLowerCase(), n = t.pathname.startsWith("/") ? t.pathname : `/${t.pathname}`, r = Math.floor(Date.now() / 1e3), s = r + (t.expireSeconds ?? 3600), o = `${r};${s}`, i = X(t.headers).filter(([L]) => Te(L)), d = G(i), a = Y(i), l = X(t.query), g = G(l), u = Y(l), f = `${e}
${n}
${u}
${a}
`, _ = `sha1
${o}
${await be(f)}
`, N = await W(t.secretKey, o), de = await W(N, _), le = ["q-sign-algorithm=sha1", `q-ak=${t.secretId}`, `q-sign-time=${o}`, `q-key-time=${o}`, `q-header-list=${d}`, `q-url-param-list=${g}`, `q-signature=${de}`].join("&"), H = {};
      for (let [L, ue] of i) H[L] = ue;
      return { authorization: le, signedHeaders: H };
    }
    async function Q(t) {
      let e = new URL(t.domain), n = I(t.key), r = `/${k(t.key)}`, s = `/${J(n)}`;
      e.pathname = s;
      let { authorization: o } = await Z({ method: t.method, pathname: r, query: t.query, headers: t.headers, secretId: t.credential.secretId, secretKey: t.credential.secretKey, expireSeconds: t.expireSeconds });
      if (t.query) for (let [c, i] of Object.entries(t.query)) i != null && e.searchParams.set(c, String(i));
      for (let c of o.split("&")) {
        let i = c.indexOf("=");
        if (i === -1) continue;
        let d = c.slice(0, i), a = c.slice(i + 1);
        e.searchParams.set(d, a);
      }
      return t.credential.sessionToken && e.searchParams.set("x-cos-security-token", t.credential.sessionToken), e.toString();
    }
    async function P(t) {
      let e = new URL(t.domain), n = t.key ? I(t.key) : "", r = t.key ? `/${k(t.key)}` : "/", s = n ? `/${J(n)}` : "/";
      if (e.pathname = s, t.query) for (let [g, u] of Object.entries(t.query)) u != null && e.searchParams.set(g, String(u));
      let { authorization: o } = await Z({ method: t.method, pathname: r, query: t.query, headers: t.headers, secretId: t.credential.secretId, secretKey: t.credential.secretKey }), c = new Headers();
      if (t.headers) for (let [g, u] of Object.entries(t.headers)) u != null && c.set(g, String(u));
      c.set("Authorization", o), t.credential.sessionToken && c.set("x-cos-security-token", t.credential.sessionToken);
      let i = e.toString(), d = { method: t.method, headers: c, body: t.body ?? void 0, signal: t.signal }, a = 2, l;
      for (let g = 0; g <= a; g++) try {
        return await fetch(i, d);
      } catch (u) {
        if (l = u, u instanceof DOMException && u.name === "AbortError") throw u;
        g < a && await new Promise((f) => setTimeout(f, 1e3 * (g + 1)));
      }
      throw l;
    }
    var Pe = "blob.edgeone.site";
    var Ie = "blob-nocache.edgeone.site";
    var ke = "max-age=0, stale-while-revalidate=60";
    var D = class t {
      credentialManager;
      bucket = "";
      region = "";
      keyPrefix = "";
      cachedDomain = "";
      uncachedDomain = "";
      initialized = false;
      static buildErrorDetail(e, n, r, s, o) {
        let c = r ? `${n}/${r}` : n, i = o ? ` [request-id: ${o}]` : "";
        return `${e} ${c} - ${Ae(s)}${i}`;
      }
      constructor(e) {
        this.credentialManager = e;
      }
      computeSubdomain(e) {
        let n = [];
        if (e.appId && n.push(e.appId), e.zoneId && n.push(e.zoneId), e.projectId && n.push(e.projectId), n.length >= 2) return n.join("-");
        if (e.resourcePrefix) {
          let s = e.resourcePrefix.replace(/\/?\*$/, "").split("/").filter(Boolean);
          if (s.length >= 2) return s.slice(0, Math.min(s.length, 3)).join("-");
        }
        return "";
      }
      async ensureInitialized() {
        if (this.initialized) return;
        let e = await this.credentialManager.getCredential();
        !this.keyPrefix && e.resourcePrefix && (this.keyPrefix = e.resourcePrefix.replace(/\/?\*$/, ""));
        let n = e.edgeRegion === "CN", r = e.cosMainland, s = e.cosOverseas, o = n ? r || s : s || r;
        !this.bucket && o && (this.bucket = o.bucket, this.region = o.region);
        let { cachedDomain: c, uncachedDomain: i } = e;
        if (!c || !i) {
          let d = this.computeSubdomain(e);
          if (!d) throw new h(0, "unable to derive tenant subdomain from credential; missing appId/zoneId/projectId or resourcePrefix");
          c ||= `https://${d}.${Pe}`, i ||= `https://${d}.${Ie}`;
        }
        this.cachedDomain = c, this.uncachedDomain = i, this.initialized = true;
      }
      async resolveDomain(e) {
        return await this.ensureInitialized(), e === "strong" ? this.uncachedDomain : this.cachedDomain;
      }
      async resolveCredential() {
        let e = await this.credentialManager.getCredential();
        return { secretId: e.tmpSecretId, secretKey: e.tmpSecretKey, sessionToken: e.sessionToken };
      }
      buildCosKey(e, n) {
        return `${this.keyPrefix}/${e}/${n}`;
      }
      async getDomains() {
        return await this.ensureInitialized(), { cached: this.cachedDomain, uncached: this.uncachedDomain };
      }
      async putObject(e, n, r, s) {
        let o = await this.resolveDomain("strong"), c = await this.ensureWriteAllowed(), i = await this.resolveCredential(), d = this.buildCosKey(e, n), { defaultCacheControl: a = ke } = c, l = s?.cacheControl === null ? void 0 : s?.cacheControl ?? a, g = {};
        s?.onlyIfNew && (g["x-cos-forbid-overwrite"] = "true"), l && (g["Cache-Control"] = l), s?.contentType && (g["Content-Type"] = s.contentType);
        let u;
        try {
          let f = await P({ domain: o, method: "PUT", key: d, headers: g, body: r, credential: i });
          if (s?.onlyIfNew && (f.status === 409 || f.status === 412)) return await f.arrayBuffer().catch(() => {
          }), { etag: "", statusCode: 412 };
          if (f.ok) {
            let N = f.headers.get("etag") || "";
            return await f.arrayBuffer().catch(() => {
            }), { etag: N, statusCode: f.status };
          }
          let _ = await A(f);
          u = new h(f.status, t.buildErrorDetail("PUT", o, d, _ || `status ${f.status}`, R(f)));
        } catch (f) {
          u = new h(0, t.buildErrorDetail("PUT", o, d, v(f)));
        }
        throw await this.explainWriteFailure(u);
      }
      async ensureWriteAllowed() {
        let e = await this.credentialManager.getCredential();
        if (e.writeAllowed !== false) return e;
        let n = e;
        try {
          n = await this.credentialManager.refreshCredential();
        } catch {
        }
        return ee(n), n;
      }
      async explainWriteFailure(e) {
        if (![0, 403, 550].includes(e.statusCode)) return e;
        try {
          let n = await this.credentialManager.refreshCredential();
          ee(n);
        } catch (n) {
          if (n instanceof x) return n;
        }
        return e;
      }
      async createPresignedPutUrl(e, n, r) {
        let s = await this.resolveDomain("strong");
        await this.ensureWriteAllowed();
        let o = await this.resolveCredential(), c = this.buildCosKey(e, n), i = {};
        r?.contentType && (i["Content-Type"] = r.contentType);
        let d = r?.expireSeconds ?? 3600, a = await Q({ domain: s, method: "PUT", key: c, headers: i, credential: o, expireSeconds: d }), l = Math.floor(Date.now() / 1e3) + d;
        return { url: a, expiresAt: l };
      }
      async getObject(e, n, r) {
        let s = await this.resolveDomain(r), o = await this.resolveCredential(), c = this.buildCosKey(e, n);
        try {
          let i = await P({ domain: s, method: "GET", key: c, credential: o });
          if (i.status === 404) return await i.arrayBuffer().catch(() => {
          }), null;
          if (!i.ok) {
            let l = await A(i);
            throw new h(i.status, t.buildErrorDetail("GET", s, c, l || `status ${i.status}`, R(i)));
          }
          let d = new Uint8Array(await i.arrayBuffer()), a = te(i.headers);
          return { body: d, contentType: a["content-type"], headers: a };
        } catch (i) {
          throw i instanceof h ? i : new h(0, t.buildErrorDetail("GET", s, c, v(i)));
        }
      }
      async headObject(e, n, r) {
        let s = await this.resolveDomain(r), o = await this.resolveCredential(), c = this.buildCosKey(e, n);
        try {
          let i = await P({ domain: s, method: "HEAD", key: c, credential: o });
          if (i.status === 404) return null;
          if (!i.ok) {
            let a = await A(i);
            throw new h(i.status, t.buildErrorDetail("HEAD", s, c, a || `status ${i.status}`, R(i)));
          }
          let d = te(i.headers);
          return { cacheControl: d["cache-control"], contentType: d["content-type"], etag: d.etag, headers: d };
        } catch (i) {
          throw i instanceof h ? i : new h(0, t.buildErrorDetail("HEAD", s, c, v(i)));
        }
      }
      async deleteObject(e, n) {
        let r = await this.resolveDomain("strong"), s = await this.resolveCredential(), o = this.buildCosKey(e, n);
        try {
          let c = await P({ domain: r, method: "DELETE", key: o, credential: s });
          if (c.status === 204 || c.status === 404 || c.ok) {
            await c.arrayBuffer().catch(() => {
            });
            return;
          }
          let i = await A(c);
          throw new h(c.status, t.buildErrorDetail("DELETE", r, o, i || `status ${c.status}`, R(c)));
        } catch (c) {
          throw c instanceof h ? c : new h(0, t.buildErrorDetail("DELETE", r, o, v(c)));
        }
      }
      async listObjects(e, n) {
        await this.ensureInitialized();
        let r = `${this.keyPrefix}/${e}/`, s = n?.prefix ? r + n.prefix : r, o = await this.getBucketRaw({ prefix: s, delimiter: n?.delimiter, marker: n?.marker, maxKeys: n?.maxKeys, consistency: n?.consistency }), c = o.contents.map((d) => {
          let a = d.key, l = a.startsWith(r) ? a.slice(r.length) : a;
          return l ? { key: l, etag: d.etag } : null;
        }).filter((d) => d !== null), i = o.commonPrefixes.map((d) => d.startsWith(r) ? d.slice(r.length) : d).filter((d) => !!d);
        return { contents: c, commonPrefixes: i, isTruncated: o.isTruncated, nextMarker: o.nextMarker };
      }
      async listStores(e) {
        let n = [], r = "", s = true;
        for (; s; ) {
          await this.ensureInitialized();
          let o = `${this.keyPrefix}/`, c = await this.getBucketRaw({ prefix: o, delimiter: "/", maxKeys: 1e3, marker: r || void 0, consistency: e });
          for (let i of c.commonPrefixes) {
            let d = i.startsWith(o) ? i.slice(o.length, -1) : i.slice(0, -1);
            d && n.push(d);
          }
          if (s = c.isTruncated, r = c.nextMarker, !s || !r) break;
        }
        return n;
      }
      async getBucketRaw(e) {
        let n = await this.resolveDomain(e.consistency), r = await this.resolveCredential(), s = { prefix: k(e.prefix) };
        e.delimiter && (s.delimiter = e.delimiter), e.marker && (s.marker = k(e.marker)), e.maxKeys && (s["max-keys"] = e.maxKeys);
        try {
          let o = await P({ domain: n, method: "GET", query: s, credential: r });
          if (!o.ok) {
            let i = await A(o);
            throw new h(o.status, t.buildErrorDetail("LIST", n, e.prefix, i || `status ${o.status}`, R(o)));
          }
          let c = await o.text();
          return Re(c);
        } catch (o) {
          throw o instanceof h ? o : new h(0, t.buildErrorDetail("LIST", n, e.prefix, v(o)));
        }
      }
    };
    function ee(t) {
      if (t.writeAllowed === false) throw new x({ reason: t.writeDeniedReason, overMetrics: t.overMetrics });
    }
    function Ae(t) {
      return t.replace(/[a-zA-Z0-9\-]+\.cos\.[a-zA-Z0-9\-.]+\.myqcloud\.com/gi, "[cos-origin]").replace(/[a-zA-Z0-9\-]+\.cos\.[a-zA-Z0-9\-.]+\.tencentcos\.cn/gi, "[cos-origin]");
    }
    async function A(t) {
      try {
        return await t.text();
      } catch {
        return "";
      }
    }
    function R(t) {
      return t.headers.get("x-cos-request-id") || t.headers.get("x-eo-log-id") || void 0;
    }
    function v(t) {
      let e = t, n = e.message || String(t), r = e.cause;
      if (r) {
        let s = r.message || r.code || "";
        return s ? `${n} (${s})` : n;
      }
      return n;
    }
    function te(t) {
      let e = {};
      return t.forEach((n, r) => {
        e[r.toLowerCase()] = n;
      }), e;
    }
    function Re(t) {
      let e = [], n = /<Contents>([\s\S]*?)<\/Contents>/g, r;
      for (; (r = n.exec(t)) !== null; ) {
        let a = r[1], l = M(a, "Key"), g = M(a, "ETag");
        l !== null && e.push({ key: q(l), etag: g || "" });
      }
      let s = [], o = /<CommonPrefixes>([\s\S]*?)<\/CommonPrefixes>/g;
      for (; (r = o.exec(t)) !== null; ) {
        let a = r[1], l = M(a, "Prefix");
        l !== null && s.push(q(l));
      }
      let i = M(t, "IsTruncated") === "true", d = M(t, "NextMarker") || "";
      return { contents: e, commonPrefixes: s, isTruncated: i, nextMarker: q(d) };
    }
    function M(t, e) {
      let r = new RegExp(`<${e}>([\\s\\S]*?)<\\/${e}>`).exec(t);
      return r ? r[1] : null;
    }
    function q(t) {
      return t.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
    }
    var ve = "X-RateLimit-Reset";
    async function $(t, e, n = 2) {
      e.signal?.throwIfAborted?.();
      try {
        let r = await fetch(t, e);
        if (n > 0 && (r.status === 429 || r.status >= 500)) {
          let s = ne(r.headers.get(ve));
          return await re(s, e.signal), $(t, e, n - 1);
        }
        return r;
      } catch (r) {
        if (n === 0 || r instanceof DOMException && r.name === "AbortError") throw r;
        let s = ne();
        return await re(s, e.signal), $(t, e, n - 1);
      }
    }
    function ne(t) {
      return t ? Math.max(Number(t) * 1e3 - Date.now(), 500) : 1500;
    }
    function re(t, e) {
      return new Promise((n, r) => {
        if (e?.aborted) return r(e.reason);
        let s = setTimeout(() => {
          e?.removeEventListener("abort", o), n();
        }, t), o = () => {
          clearTimeout(s), r(e.reason);
        };
        e?.addEventListener("abort", o, { once: true });
      });
    }
    var Me = "prod";
    function se() {
      let t = typeof process < "u" ? process.env.PAGES_BLOB_STS_ENV : void 0;
      return t === "test" || t === "prod" ? t : Me;
    }
    var De = 300;
    var Oe = 6e4;
    var Be = "https://blob-sts.edgeone.site/";
    var O = class {
      authToken;
      projectId;
      cached = null;
      lastForcedRefreshAt = 0;
      constructor(e, n) {
        this.authToken = e, this.projectId = n;
      }
      async getCredential() {
        if (this.cached && !this.isExpired(this.cached)) return this.cached;
        let e = await this.fetchCredential();
        return this.cached = e, e;
      }
      async refreshCredential() {
        if (this.cached && Date.now() - this.lastForcedRefreshAt < Oe) return this.cached;
        this.lastForcedRefreshAt = Date.now();
        let e = await this.fetchCredential(true);
        return this.cached = e, e;
      }
      clearCache() {
        this.cached = null;
      }
      isExpired(e) {
        let n = Math.floor(Date.now() / 1e3);
        return e.expiredTime - n < De;
      }
      async fetchCredential(e = false) {
        for (let s = 1; s <= 3; s++) {
          let o = new AbortController(), c = setTimeout(() => o.abort(), 1e4), i;
          try {
            i = await $(Be, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.authToken}`, "X-Env": se(), ...e ? { "X-SKIP-CACHE": "true" } : {} }, body: JSON.stringify(this.projectId ? { ProjectId: this.projectId } : {}), signal: o.signal });
          } catch (l) {
            if (s < 3) {
              await z(500 * s);
              continue;
            }
            throw new y(`failed to obtain STS credential: ${l.message || "timeout"}`);
          } finally {
            clearTimeout(c);
          }
          if (i.status === 413) throw new y("storage quota exceeded");
          if (i.status === 429) throw new y("rate limited, please retry later");
          if (!i.ok) {
            if (i.status >= 500 && s < 3) {
              await z(500 * s);
              continue;
            }
            let l = await i.text().catch(() => "unknown error");
            throw new y(`failed to obtain STS credential: ${i.status} ${l}`);
          }
          let d = await i.json(), a = d.data && typeof d.data == "object" ? d.data : d;
          if (a.tmpSecretId && a.tmpSecretKey && a.sessionToken && a.expiredTime) {
            let l = a.cosMainland, g = a.cosOverseas, u = i.headers.get("X-Edge-Region") || void 0;
            return { tmpSecretId: a.tmpSecretId, tmpSecretKey: a.tmpSecretKey, sessionToken: a.sessionToken, expiredTime: a.expiredTime, appId: a.appId || void 0, zoneId: a.zoneId || void 0, projectId: a.projectId || void 0, resourcePrefix: a.resourcePrefix || void 0, cosMainland: l || void 0, cosOverseas: g || void 0, edgeRegion: u, defaultCacheControl: typeof a.defaultCacheControl == "string" && a.defaultCacheControl ? a.defaultCacheControl : void 0, cachedDomain: ie(a.cachedDomain), uncachedDomain: ie(a.uncachedDomain), writeAllowed: typeof a.writeAllowed == "boolean" ? a.writeAllowed : void 0, writeDeniedReason: typeof a.writeDeniedReason == "string" && a.writeDeniedReason ? a.writeDeniedReason : void 0, overMetrics: Array.isArray(a.overMetrics) ? a.overMetrics.filter((f) => typeof f == "string") : void 0 };
          }
          if (a.code !== void 0 && a.code !== 0) {
            let l = a.msg || a.message || "unknown error";
            throw new y(`credential exchange failed (code=${a.code}): ${l}`);
          }
          if (d.code !== void 0 && d.code !== 0) {
            let l = d.msg || d.message || "unknown error";
            throw new y(`credential exchange failed (code=${d.code}): ${l}`);
          }
          if (s < 3) {
            await z(500 * s);
            continue;
          }
          throw new y("invalid STS credential response");
        }
        throw new y("invalid STS credential response");
      }
    };
    function ie(t) {
      if (typeof t != "string") return;
      let e = t.trim().replace(/\/+$/, "");
      if (e) return /^https?:\/\//i.test(e) ? e : `https://${e}`;
    }
    function z(t) {
      return new Promise((e) => setTimeout(e, t));
    }
    var je = "{{PAGES_BLOB_DEPLOY_CREDENTIAL}}";
    function ae() {
      let t = {}, e = $e();
      if (e) t.deployCredential = e;
      else {
        let r = oe("PAGES_BLOB_DEPLOY_CREDENTIAL");
        r && (t.deployCredential = r);
      }
      let n = oe("PAGES_PROJECT_ID");
      return n && (t.projectId = n), t;
    }
    function $e() {
      let t = je;
      if (!(t.startsWith("{{") && t.endsWith("}}"))) return t || void 0;
    }
    function oe(t) {
      if (typeof process < "u" && process.env) return process.env[t];
    }
    function _e(t) {
      let e = typeof t == "string" ? t : t.name;
      F(e);
      let n = ce(typeof t == "string" ? void 0 : t), r = new O(n.authToken, n.projectId), s = new D(r);
      return new T(s, e, n.consistency ?? "eventual");
    }
    async function Ne(t) {
      let e = ce(t ? { name: "__list__", projectId: t.projectId, token: t.token, consistency: t.consistency } : void 0), n = new O(e.authToken, e.projectId);
      return { stores: (await new D(n).listStores(e.consistency)).map((o) => ({ name: o })) };
    }
    function ce(t) {
      let e = ae(), n = t?.token || e.deployCredential, r = t?.projectId || e.projectId;
      if (t?.token || e.projectId) {
        if (!r) throw new S();
        if (!n) throw new E(["token"]);
        return { authToken: n, projectId: r, consistency: t?.consistency };
      }
      if (t?.projectId && !n) throw new E(["token"]);
      if (!e.deployCredential) throw new E(["deployCredential"]);
      return { authToken: e.deployCredential, consistency: t?.consistency };
    }
  }
});

// node_modules/nodemailer/lib/fetch/cookies.js
var require_cookies = __commonJS({
  "node_modules/nodemailer/lib/fetch/cookies.js"(exports, module) {
    "use strict";
    var urllib = __require("url");
    var SESSION_TIMEOUT = 1800;
    var Cookies = class {
      constructor(options) {
        this.options = options || {};
        this.cookies = [];
      }
      /**
       * Stores a cookie string to the cookie storage
       *
       * @param {String} cookieStr Value from the 'Set-Cookie:' header
       * @param {String} url Current URL
       */
      set(cookieStr, url) {
        let urlparts = urllib.parse(url || "");
        let cookie = this.parse(cookieStr);
        let domain;
        if (cookie.domain) {
          domain = cookie.domain.replace(/^\./, "");
          if (
            // can't be valid if the requested domain is shorter than current hostname
            urlparts.hostname.length < domain.length || // prefix domains with dot to be sure that partial matches are not used
            ("." + urlparts.hostname).substr(-domain.length + 1) !== "." + domain
          ) {
            cookie.domain = urlparts.hostname;
          }
        } else {
          cookie.domain = urlparts.hostname;
        }
        if (!cookie.path) {
          cookie.path = this.getPath(urlparts.pathname);
        }
        if (!cookie.expires) {
          cookie.expires = new Date(Date.now() + (Number(this.options.sessionTimeout || SESSION_TIMEOUT) || SESSION_TIMEOUT) * 1e3);
        }
        return this.add(cookie);
      }
      /**
       * Returns cookie string for the 'Cookie:' header.
       *
       * @param {String} url URL to check for
       * @returns {String} Cookie header or empty string if no matches were found
       */
      get(url) {
        return this.list(url).map((cookie) => cookie.name + "=" + cookie.value).join("; ");
      }
      /**
       * Lists all valied cookie objects for the specified URL
       *
       * @param {String} url URL to check for
       * @returns {Array} An array of cookie objects
       */
      list(url) {
        let result = [];
        let i;
        let cookie;
        for (i = this.cookies.length - 1; i >= 0; i--) {
          cookie = this.cookies[i];
          if (this.isExpired(cookie)) {
            this.cookies.splice(i, i);
            continue;
          }
          if (this.match(cookie, url)) {
            result.unshift(cookie);
          }
        }
        return result;
      }
      /**
       * Parses cookie string from the 'Set-Cookie:' header
       *
       * @param {String} cookieStr String from the 'Set-Cookie:' header
       * @returns {Object} Cookie object
       */
      parse(cookieStr) {
        let cookie = {};
        (cookieStr || "").toString().split(";").forEach((cookiePart) => {
          let valueParts = cookiePart.split("=");
          let key = valueParts.shift().trim().toLowerCase();
          let value = valueParts.join("=").trim();
          let domain;
          if (!key) {
            return;
          }
          switch (key) {
            case "expires":
              value = new Date(value);
              if (value.toString() !== "Invalid Date") {
                cookie.expires = value;
              }
              break;
            case "path":
              cookie.path = value;
              break;
            case "domain":
              domain = value.toLowerCase();
              if (domain.length && domain.charAt(0) !== ".") {
                domain = "." + domain;
              }
              cookie.domain = domain;
              break;
            case "max-age":
              cookie.expires = new Date(Date.now() + (Number(value) || 0) * 1e3);
              break;
            case "secure":
              cookie.secure = true;
              break;
            case "httponly":
              cookie.httponly = true;
              break;
            default:
              if (!cookie.name) {
                cookie.name = key;
                cookie.value = value;
              }
          }
        });
        return cookie;
      }
      /**
       * Checks if a cookie object is valid for a specified URL
       *
       * @param {Object} cookie Cookie object
       * @param {String} url URL to check for
       * @returns {Boolean} true if cookie is valid for specifiec URL
       */
      match(cookie, url) {
        let urlparts = urllib.parse(url || "");
        if (urlparts.hostname !== cookie.domain && (cookie.domain.charAt(0) !== "." || ("." + urlparts.hostname).substr(-cookie.domain.length) !== cookie.domain)) {
          return false;
        }
        let path = this.getPath(urlparts.pathname);
        if (path.substr(0, cookie.path.length) !== cookie.path) {
          return false;
        }
        if (cookie.secure && urlparts.protocol !== "https:") {
          return false;
        }
        return true;
      }
      /**
       * Adds (or updates/removes if needed) a cookie object to the cookie storage
       *
       * @param {Object} cookie Cookie value to be stored
       */
      add(cookie) {
        let i;
        let len;
        if (!cookie || !cookie.name) {
          return false;
        }
        for (i = 0, len = this.cookies.length; i < len; i++) {
          if (this.compare(this.cookies[i], cookie)) {
            if (this.isExpired(cookie)) {
              this.cookies.splice(i, 1);
              return false;
            }
            this.cookies[i] = cookie;
            return true;
          }
        }
        if (!this.isExpired(cookie)) {
          this.cookies.push(cookie);
        }
        return true;
      }
      /**
       * Checks if two cookie objects are the same
       *
       * @param {Object} a Cookie to check against
       * @param {Object} b Cookie to check against
       * @returns {Boolean} True, if the cookies are the same
       */
      compare(a, b) {
        return a.name === b.name && a.path === b.path && a.domain === b.domain && a.secure === b.secure && a.httponly === a.httponly;
      }
      /**
       * Checks if a cookie is expired
       *
       * @param {Object} cookie Cookie object to check against
       * @returns {Boolean} True, if the cookie is expired
       */
      isExpired(cookie) {
        return cookie.expires && cookie.expires < /* @__PURE__ */ new Date() || !cookie.value;
      }
      /**
       * Returns normalized cookie path for an URL path argument
       *
       * @param {String} pathname
       * @returns {String} Normalized path
       */
      getPath(pathname) {
        let path = (pathname || "/").split("/");
        path.pop();
        path = path.join("/").trim();
        if (path.charAt(0) !== "/") {
          path = "/" + path;
        }
        if (path.substr(-1) !== "/") {
          path += "/";
        }
        return path;
      }
    };
    module.exports = Cookies;
  }
});

// node_modules/nodemailer/package.json
var require_package = __commonJS({
  "node_modules/nodemailer/package.json"(exports, module) {
    module.exports = {
      name: "nodemailer",
      version: "6.10.1",
      description: "Easy as cake e-mail sending from your Node.js applications",
      main: "lib/nodemailer.js",
      scripts: {
        test: "node --test --test-concurrency=1 test/**/*.test.js test/**/*-test.js",
        "test:coverage": "c8 node --test --test-concurrency=1 test/**/*.test.js test/**/*-test.js",
        lint: "eslint .",
        update: "rm -rf node_modules/ package-lock.json && ncu -u && npm install"
      },
      repository: {
        type: "git",
        url: "https://github.com/nodemailer/nodemailer.git"
      },
      keywords: [
        "Nodemailer"
      ],
      author: "Andris Reinman",
      license: "MIT-0",
      bugs: {
        url: "https://github.com/nodemailer/nodemailer/issues"
      },
      homepage: "https://nodemailer.com/",
      devDependencies: {
        "@aws-sdk/client-ses": "3.731.1",
        bunyan: "1.8.15",
        c8: "10.1.3",
        eslint: "8.57.0",
        "eslint-config-nodemailer": "1.2.0",
        "eslint-config-prettier": "9.1.0",
        libbase64: "1.3.0",
        libmime: "5.3.6",
        libqp: "2.1.1",
        "nodemailer-ntlm-auth": "1.0.4",
        proxy: "1.0.2",
        "proxy-test-server": "1.0.0",
        "smtp-server": "3.13.6"
      },
      engines: {
        node: ">=6.0.0"
      }
    };
  }
});

// node_modules/nodemailer/lib/fetch/index.js
var require_fetch = __commonJS({
  "node_modules/nodemailer/lib/fetch/index.js"(exports, module) {
    "use strict";
    var http = __require("http");
    var https = __require("https");
    var urllib = __require("url");
    var zlib = __require("zlib");
    var PassThrough = __require("stream").PassThrough;
    var Cookies = require_cookies();
    var packageData = require_package();
    var net = __require("net");
    var MAX_REDIRECTS = 5;
    module.exports = function(url, options) {
      return nmfetch(url, options);
    };
    module.exports.Cookies = Cookies;
    function nmfetch(url, options) {
      options = options || {};
      options.fetchRes = options.fetchRes || new PassThrough();
      options.cookies = options.cookies || new Cookies();
      options.redirects = options.redirects || 0;
      options.maxRedirects = isNaN(options.maxRedirects) ? MAX_REDIRECTS : options.maxRedirects;
      if (options.cookie) {
        [].concat(options.cookie || []).forEach((cookie) => {
          options.cookies.set(cookie, url);
        });
        options.cookie = false;
      }
      let fetchRes = options.fetchRes;
      let parsed = urllib.parse(url);
      let method = (options.method || "").toString().trim().toUpperCase() || "GET";
      let finished = false;
      let cookies;
      let body2;
      let handler2 = parsed.protocol === "https:" ? https : http;
      let headers = {
        "accept-encoding": "gzip,deflate",
        "user-agent": "nodemailer/" + packageData.version
      };
      Object.keys(options.headers || {}).forEach((key) => {
        headers[key.toLowerCase().trim()] = options.headers[key];
      });
      if (options.userAgent) {
        headers["user-agent"] = options.userAgent;
      }
      if (parsed.auth) {
        headers.Authorization = "Basic " + Buffer.from(parsed.auth).toString("base64");
      }
      if (cookies = options.cookies.get(url)) {
        headers.cookie = cookies;
      }
      if (options.body) {
        if (options.contentType !== false) {
          headers["Content-Type"] = options.contentType || "application/x-www-form-urlencoded";
        }
        if (typeof options.body.pipe === "function") {
          headers["Transfer-Encoding"] = "chunked";
          body2 = options.body;
          body2.on("error", (err) => {
            if (finished) {
              return;
            }
            finished = true;
            err.type = "FETCH";
            err.sourceUrl = url;
            fetchRes.emit("error", err);
          });
        } else {
          if (options.body instanceof Buffer) {
            body2 = options.body;
          } else if (typeof options.body === "object") {
            try {
              body2 = Buffer.from(
                Object.keys(options.body).map((key) => {
                  let value = options.body[key].toString().trim();
                  return encodeURIComponent(key) + "=" + encodeURIComponent(value);
                }).join("&")
              );
            } catch (E) {
              if (finished) {
                return;
              }
              finished = true;
              E.type = "FETCH";
              E.sourceUrl = url;
              fetchRes.emit("error", E);
              return;
            }
          } else {
            body2 = Buffer.from(options.body.toString().trim());
          }
          headers["Content-Type"] = options.contentType || "application/x-www-form-urlencoded";
          headers["Content-Length"] = body2.length;
        }
        method = (options.method || "").toString().trim().toUpperCase() || "POST";
      }
      let req;
      let reqOptions = {
        method,
        host: parsed.hostname,
        path: parsed.path,
        port: parsed.port ? parsed.port : parsed.protocol === "https:" ? 443 : 80,
        headers,
        rejectUnauthorized: false,
        agent: false
      };
      if (options.tls) {
        Object.keys(options.tls).forEach((key) => {
          reqOptions[key] = options.tls[key];
        });
      }
      if (parsed.protocol === "https:" && parsed.hostname && parsed.hostname !== reqOptions.host && !net.isIP(parsed.hostname) && !reqOptions.servername) {
        reqOptions.servername = parsed.hostname;
      }
      try {
        req = handler2.request(reqOptions);
      } catch (E) {
        finished = true;
        setImmediate(() => {
          E.type = "FETCH";
          E.sourceUrl = url;
          fetchRes.emit("error", E);
        });
        return fetchRes;
      }
      if (options.timeout) {
        req.setTimeout(options.timeout, () => {
          if (finished) {
            return;
          }
          finished = true;
          req.abort();
          let err = new Error("Request Timeout");
          err.type = "FETCH";
          err.sourceUrl = url;
          fetchRes.emit("error", err);
        });
      }
      req.on("error", (err) => {
        if (finished) {
          return;
        }
        finished = true;
        err.type = "FETCH";
        err.sourceUrl = url;
        fetchRes.emit("error", err);
      });
      req.on("response", (res) => {
        let inflate;
        if (finished) {
          return;
        }
        switch (res.headers["content-encoding"]) {
          case "gzip":
          case "deflate":
            inflate = zlib.createUnzip();
            break;
        }
        if (res.headers["set-cookie"]) {
          [].concat(res.headers["set-cookie"] || []).forEach((cookie) => {
            options.cookies.set(cookie, url);
          });
        }
        if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
          options.redirects++;
          if (options.redirects > options.maxRedirects) {
            finished = true;
            let err = new Error("Maximum redirect count exceeded");
            err.type = "FETCH";
            err.sourceUrl = url;
            fetchRes.emit("error", err);
            req.abort();
            return;
          }
          options.method = "GET";
          options.body = false;
          return nmfetch(urllib.resolve(url, res.headers.location), options);
        }
        fetchRes.statusCode = res.statusCode;
        fetchRes.headers = res.headers;
        if (res.statusCode >= 300 && !options.allowErrorResponse) {
          finished = true;
          let err = new Error("Invalid status code " + res.statusCode);
          err.type = "FETCH";
          err.sourceUrl = url;
          fetchRes.emit("error", err);
          req.abort();
          return;
        }
        res.on("error", (err) => {
          if (finished) {
            return;
          }
          finished = true;
          err.type = "FETCH";
          err.sourceUrl = url;
          fetchRes.emit("error", err);
          req.abort();
        });
        if (inflate) {
          res.pipe(inflate).pipe(fetchRes);
          inflate.on("error", (err) => {
            if (finished) {
              return;
            }
            finished = true;
            err.type = "FETCH";
            err.sourceUrl = url;
            fetchRes.emit("error", err);
            req.abort();
          });
        } else {
          res.pipe(fetchRes);
        }
      });
      setImmediate(() => {
        if (body2) {
          try {
            if (typeof body2.pipe === "function") {
              return body2.pipe(req);
            } else {
              req.write(body2);
            }
          } catch (err) {
            finished = true;
            err.type = "FETCH";
            err.sourceUrl = url;
            fetchRes.emit("error", err);
            return;
          }
        }
        req.end();
      });
      return fetchRes;
    }
  }
});

// node_modules/nodemailer/lib/shared/index.js
var require_shared = __commonJS({
  "node_modules/nodemailer/lib/shared/index.js"(exports, module) {
    "use strict";
    var urllib = __require("url");
    var util3 = __require("util");
    var fs = __require("fs");
    var nmfetch = require_fetch();
    var dns = __require("dns");
    var net = __require("net");
    var os = __require("os");
    var DNS_TTL = 5 * 60 * 1e3;
    var networkInterfaces;
    try {
      networkInterfaces = os.networkInterfaces();
    } catch (err) {
    }
    module.exports.networkInterfaces = networkInterfaces;
    var isFamilySupported = (family, allowInternal) => {
      let networkInterfaces2 = module.exports.networkInterfaces;
      if (!networkInterfaces2) {
        return true;
      }
      const familySupported = (
        // crux that replaces Object.values(networkInterfaces) as Object.values is not supported in nodejs v6
        Object.keys(networkInterfaces2).map((key) => networkInterfaces2[key]).reduce((acc, val) => acc.concat(val), []).filter((i) => !i.internal || allowInternal).filter((i) => i.family === "IPv" + family || i.family === family).length > 0
      );
      return familySupported;
    };
    var resolver = (family, hostname, options, callback) => {
      options = options || {};
      const familySupported = isFamilySupported(family, options.allowInternalNetworkInterfaces);
      if (!familySupported) {
        return callback(null, []);
      }
      const resolver2 = dns.Resolver ? new dns.Resolver(options) : dns;
      resolver2["resolve" + family](hostname, (err, addresses) => {
        if (err) {
          switch (err.code) {
            case dns.NODATA:
            case dns.NOTFOUND:
            case dns.NOTIMP:
            case dns.SERVFAIL:
            case dns.CONNREFUSED:
            case dns.REFUSED:
            case "EAI_AGAIN":
              return callback(null, []);
          }
          return callback(err);
        }
        return callback(null, Array.isArray(addresses) ? addresses : [].concat(addresses || []));
      });
    };
    var dnsCache = module.exports.dnsCache = /* @__PURE__ */ new Map();
    var formatDNSValue = (value, extra) => {
      if (!value) {
        return Object.assign({}, extra || {});
      }
      return Object.assign(
        {
          servername: value.servername,
          host: !value.addresses || !value.addresses.length ? null : value.addresses.length === 1 ? value.addresses[0] : value.addresses[Math.floor(Math.random() * value.addresses.length)]
        },
        extra || {}
      );
    };
    module.exports.resolveHostname = (options, callback) => {
      options = options || {};
      if (!options.host && options.servername) {
        options.host = options.servername;
      }
      if (!options.host || net.isIP(options.host)) {
        let value = {
          addresses: [options.host],
          servername: options.servername || false
        };
        return callback(
          null,
          formatDNSValue(value, {
            cached: false
          })
        );
      }
      let cached;
      if (dnsCache.has(options.host)) {
        cached = dnsCache.get(options.host);
        if (!cached.expires || cached.expires >= Date.now()) {
          return callback(
            null,
            formatDNSValue(cached.value, {
              cached: true
            })
          );
        }
      }
      resolver(4, options.host, options, (err, addresses) => {
        if (err) {
          if (cached) {
            return callback(
              null,
              formatDNSValue(cached.value, {
                cached: true,
                error: err
              })
            );
          }
          return callback(err);
        }
        if (addresses && addresses.length) {
          let value = {
            addresses,
            servername: options.servername || options.host
          };
          dnsCache.set(options.host, {
            value,
            expires: Date.now() + (options.dnsTtl || DNS_TTL)
          });
          return callback(
            null,
            formatDNSValue(value, {
              cached: false
            })
          );
        }
        resolver(6, options.host, options, (err2, addresses2) => {
          if (err2) {
            if (cached) {
              return callback(
                null,
                formatDNSValue(cached.value, {
                  cached: true,
                  error: err2
                })
              );
            }
            return callback(err2);
          }
          if (addresses2 && addresses2.length) {
            let value = {
              addresses: addresses2,
              servername: options.servername || options.host
            };
            dnsCache.set(options.host, {
              value,
              expires: Date.now() + (options.dnsTtl || DNS_TTL)
            });
            return callback(
              null,
              formatDNSValue(value, {
                cached: false
              })
            );
          }
          try {
            dns.lookup(options.host, { all: true }, (err3, addresses3) => {
              if (err3) {
                if (cached) {
                  return callback(
                    null,
                    formatDNSValue(cached.value, {
                      cached: true,
                      error: err3
                    })
                  );
                }
                return callback(err3);
              }
              let address = addresses3 ? addresses3.filter((addr) => isFamilySupported(addr.family)).map((addr) => addr.address).shift() : false;
              if (addresses3 && addresses3.length && !address) {
                console.warn(`Failed to resolve IPv${addresses3[0].family} addresses with current network`);
              }
              if (!address && cached) {
                return callback(
                  null,
                  formatDNSValue(cached.value, {
                    cached: true
                  })
                );
              }
              let value = {
                addresses: address ? [address] : [options.host],
                servername: options.servername || options.host
              };
              dnsCache.set(options.host, {
                value,
                expires: Date.now() + (options.dnsTtl || DNS_TTL)
              });
              return callback(
                null,
                formatDNSValue(value, {
                  cached: false
                })
              );
            });
          } catch (err3) {
            if (cached) {
              return callback(
                null,
                formatDNSValue(cached.value, {
                  cached: true,
                  error: err3
                })
              );
            }
            return callback(err3);
          }
        });
      });
    };
    module.exports.parseConnectionUrl = (str) => {
      str = str || "";
      let options = {};
      [urllib.parse(str, true)].forEach((url) => {
        let auth;
        switch (url.protocol) {
          case "smtp:":
            options.secure = false;
            break;
          case "smtps:":
            options.secure = true;
            break;
          case "direct:":
            options.direct = true;
            break;
        }
        if (!isNaN(url.port) && Number(url.port)) {
          options.port = Number(url.port);
        }
        if (url.hostname) {
          options.host = url.hostname;
        }
        if (url.auth) {
          auth = url.auth.split(":");
          if (!options.auth) {
            options.auth = {};
          }
          options.auth.user = auth.shift();
          options.auth.pass = auth.join(":");
        }
        Object.keys(url.query || {}).forEach((key) => {
          let obj = options;
          let lKey = key;
          let value = url.query[key];
          if (!isNaN(value)) {
            value = Number(value);
          }
          switch (value) {
            case "true":
              value = true;
              break;
            case "false":
              value = false;
              break;
          }
          if (key.indexOf("tls.") === 0) {
            lKey = key.substr(4);
            if (!options.tls) {
              options.tls = {};
            }
            obj = options.tls;
          } else if (key.indexOf(".") >= 0) {
            return;
          }
          if (!(lKey in obj)) {
            obj[lKey] = value;
          }
        });
      });
      return options;
    };
    module.exports._logFunc = (logger, level, defaults, data, message2, ...args) => {
      let entry = {};
      Object.keys(defaults || {}).forEach((key) => {
        if (key !== "level") {
          entry[key] = defaults[key];
        }
      });
      Object.keys(data || {}).forEach((key) => {
        if (key !== "level") {
          entry[key] = data[key];
        }
      });
      logger[level](entry, message2, ...args);
    };
    module.exports.getLogger = (options, defaults) => {
      options = options || {};
      let response = {};
      let levels = ["trace", "debug", "info", "warn", "error", "fatal"];
      if (!options.logger) {
        levels.forEach((level) => {
          response[level] = () => false;
        });
        return response;
      }
      let logger = options.logger;
      if (options.logger === true) {
        logger = createDefaultLogger(levels);
      }
      levels.forEach((level) => {
        response[level] = (data, message2, ...args) => {
          module.exports._logFunc(logger, level, defaults, data, message2, ...args);
        };
      });
      return response;
    };
    module.exports.callbackPromise = (resolve, reject) => function() {
      let args = Array.from(arguments);
      let err = args.shift();
      if (err) {
        reject(err);
      } else {
        resolve(...args);
      }
    };
    module.exports.parseDataURI = (uri) => {
      let input = uri;
      let commaPos = input.indexOf(",");
      if (!commaPos) {
        return uri;
      }
      let data = input.substring(commaPos + 1);
      let metaStr = input.substring("data:".length, commaPos);
      let encoding;
      let metaEntries = metaStr.split(";");
      let lastMetaEntry = metaEntries.length > 1 ? metaEntries[metaEntries.length - 1] : false;
      if (lastMetaEntry && lastMetaEntry.indexOf("=") < 0) {
        encoding = lastMetaEntry.toLowerCase();
        metaEntries.pop();
      }
      let contentType = metaEntries.shift() || "application/octet-stream";
      let params = {};
      for (let entry of metaEntries) {
        let sep = entry.indexOf("=");
        if (sep >= 0) {
          let key = entry.substring(0, sep);
          let value = entry.substring(sep + 1);
          params[key] = value;
        }
      }
      switch (encoding) {
        case "base64":
          data = Buffer.from(data, "base64");
          break;
        case "utf8":
          data = Buffer.from(data);
          break;
        default:
          try {
            data = Buffer.from(decodeURIComponent(data));
          } catch (err) {
            data = Buffer.from(data);
          }
          data = Buffer.from(data);
      }
      return { data, encoding, contentType, params };
    };
    module.exports.resolveContent = (data, key, callback) => {
      let promise;
      if (!callback) {
        promise = new Promise((resolve, reject) => {
          callback = module.exports.callbackPromise(resolve, reject);
        });
      }
      let content = data && data[key] && data[key].content || data[key];
      let contentStream;
      let encoding = (typeof data[key] === "object" && data[key].encoding || "utf8").toString().toLowerCase().replace(/[-_\s]/g, "");
      if (!content) {
        return callback(null, content);
      }
      if (typeof content === "object") {
        if (typeof content.pipe === "function") {
          return resolveStream(content, (err, value) => {
            if (err) {
              return callback(err);
            }
            if (data[key].content) {
              data[key].content = value;
            } else {
              data[key] = value;
            }
            callback(null, value);
          });
        } else if (/^https?:\/\//i.test(content.path || content.href)) {
          contentStream = nmfetch(content.path || content.href);
          return resolveStream(contentStream, callback);
        } else if (/^data:/i.test(content.path || content.href)) {
          let parsedDataUri = module.exports.parseDataURI(content.path || content.href);
          if (!parsedDataUri || !parsedDataUri.data) {
            return callback(null, Buffer.from(0));
          }
          return callback(null, parsedDataUri.data);
        } else if (content.path) {
          return resolveStream(fs.createReadStream(content.path), callback);
        }
      }
      if (typeof data[key].content === "string" && !["utf8", "usascii", "ascii"].includes(encoding)) {
        content = Buffer.from(data[key].content, encoding);
      }
      setImmediate(() => callback(null, content));
      return promise;
    };
    module.exports.assign = function() {
      let args = Array.from(arguments);
      let target = args.shift() || {};
      args.forEach((source) => {
        Object.keys(source || {}).forEach((key) => {
          if (["tls", "auth"].includes(key) && source[key] && typeof source[key] === "object") {
            if (!target[key]) {
              target[key] = {};
            }
            Object.keys(source[key]).forEach((subKey) => {
              target[key][subKey] = source[key][subKey];
            });
          } else {
            target[key] = source[key];
          }
        });
      });
      return target;
    };
    module.exports.encodeXText = (str) => {
      if (!/[^\x21-\x2A\x2C-\x3C\x3E-\x7E]/.test(str)) {
        return str;
      }
      let buf = Buffer.from(str);
      let result = "";
      for (let i = 0, len = buf.length; i < len; i++) {
        let c = buf[i];
        if (c < 33 || c > 126 || c === 43 || c === 61) {
          result += "+" + (c < 16 ? "0" : "") + c.toString(16).toUpperCase();
        } else {
          result += String.fromCharCode(c);
        }
      }
      return result;
    };
    function resolveStream(stream, callback) {
      let responded = false;
      let chunks = [];
      let chunklen = 0;
      stream.on("error", (err) => {
        if (responded) {
          return;
        }
        responded = true;
        callback(err);
      });
      stream.on("readable", () => {
        let chunk;
        while ((chunk = stream.read()) !== null) {
          chunks.push(chunk);
          chunklen += chunk.length;
        }
      });
      stream.on("end", () => {
        if (responded) {
          return;
        }
        responded = true;
        let value;
        try {
          value = Buffer.concat(chunks, chunklen);
        } catch (E) {
          return callback(E);
        }
        callback(null, value);
      });
    }
    function createDefaultLogger(levels) {
      let levelMaxLen = 0;
      let levelNames = /* @__PURE__ */ new Map();
      levels.forEach((level) => {
        if (level.length > levelMaxLen) {
          levelMaxLen = level.length;
        }
      });
      levels.forEach((level) => {
        let levelName = level.toUpperCase();
        if (levelName.length < levelMaxLen) {
          levelName += " ".repeat(levelMaxLen - levelName.length);
        }
        levelNames.set(level, levelName);
      });
      let print = (level, entry, message2, ...args) => {
        let prefix = "";
        if (entry) {
          if (entry.tnx === "server") {
            prefix = "S: ";
          } else if (entry.tnx === "client") {
            prefix = "C: ";
          }
          if (entry.sid) {
            prefix = "[" + entry.sid + "] " + prefix;
          }
          if (entry.cid) {
            prefix = "[#" + entry.cid + "] " + prefix;
          }
        }
        message2 = util3.format(message2, ...args);
        message2.split(/\r?\n/).forEach((line) => {
          console.log("[%s] %s %s", (/* @__PURE__ */ new Date()).toISOString().substr(0, 19).replace(/T/, " "), levelNames.get(level), prefix + line);
        });
      };
      let logger = {};
      levels.forEach((level) => {
        logger[level] = print.bind(null, level);
      });
      return logger;
    }
  }
});

// node_modules/nodemailer/lib/mime-funcs/mime-types.js
var require_mime_types = __commonJS({
  "node_modules/nodemailer/lib/mime-funcs/mime-types.js"(exports, module) {
    "use strict";
    var path = __require("path");
    var defaultMimeType = "application/octet-stream";
    var defaultExtension = "bin";
    var mimeTypes = /* @__PURE__ */ new Map([
      ["application/acad", "dwg"],
      ["application/applixware", "aw"],
      ["application/arj", "arj"],
      ["application/atom+xml", "xml"],
      ["application/atomcat+xml", "atomcat"],
      ["application/atomsvc+xml", "atomsvc"],
      ["application/base64", ["mm", "mme"]],
      ["application/binhex", "hqx"],
      ["application/binhex4", "hqx"],
      ["application/book", ["book", "boo"]],
      ["application/ccxml+xml,", "ccxml"],
      ["application/cdf", "cdf"],
      ["application/cdmi-capability", "cdmia"],
      ["application/cdmi-container", "cdmic"],
      ["application/cdmi-domain", "cdmid"],
      ["application/cdmi-object", "cdmio"],
      ["application/cdmi-queue", "cdmiq"],
      ["application/clariscad", "ccad"],
      ["application/commonground", "dp"],
      ["application/cu-seeme", "cu"],
      ["application/davmount+xml", "davmount"],
      ["application/drafting", "drw"],
      ["application/dsptype", "tsp"],
      ["application/dssc+der", "dssc"],
      ["application/dssc+xml", "xdssc"],
      ["application/dxf", "dxf"],
      ["application/ecmascript", ["js", "es"]],
      ["application/emma+xml", "emma"],
      ["application/envoy", "evy"],
      ["application/epub+zip", "epub"],
      ["application/excel", ["xls", "xl", "xla", "xlb", "xlc", "xld", "xlk", "xll", "xlm", "xlt", "xlv", "xlw"]],
      ["application/exi", "exi"],
      ["application/font-tdpfr", "pfr"],
      ["application/fractals", "fif"],
      ["application/freeloader", "frl"],
      ["application/futuresplash", "spl"],
      ["application/geo+json", "geojson"],
      ["application/gnutar", "tgz"],
      ["application/groupwise", "vew"],
      ["application/hlp", "hlp"],
      ["application/hta", "hta"],
      ["application/hyperstudio", "stk"],
      ["application/i-deas", "unv"],
      ["application/iges", ["iges", "igs"]],
      ["application/inf", "inf"],
      ["application/internet-property-stream", "acx"],
      ["application/ipfix", "ipfix"],
      ["application/java", "class"],
      ["application/java-archive", "jar"],
      ["application/java-byte-code", "class"],
      ["application/java-serialized-object", "ser"],
      ["application/java-vm", "class"],
      ["application/javascript", "js"],
      ["application/json", "json"],
      ["application/lha", "lha"],
      ["application/lzx", "lzx"],
      ["application/mac-binary", "bin"],
      ["application/mac-binhex", "hqx"],
      ["application/mac-binhex40", "hqx"],
      ["application/mac-compactpro", "cpt"],
      ["application/macbinary", "bin"],
      ["application/mads+xml", "mads"],
      ["application/marc", "mrc"],
      ["application/marcxml+xml", "mrcx"],
      ["application/mathematica", "ma"],
      ["application/mathml+xml", "mathml"],
      ["application/mbedlet", "mbd"],
      ["application/mbox", "mbox"],
      ["application/mcad", "mcd"],
      ["application/mediaservercontrol+xml", "mscml"],
      ["application/metalink4+xml", "meta4"],
      ["application/mets+xml", "mets"],
      ["application/mime", "aps"],
      ["application/mods+xml", "mods"],
      ["application/mp21", "m21"],
      ["application/mp4", "mp4"],
      ["application/mspowerpoint", ["ppt", "pot", "pps", "ppz"]],
      ["application/msword", ["doc", "dot", "w6w", "wiz", "word"]],
      ["application/mswrite", "wri"],
      ["application/mxf", "mxf"],
      ["application/netmc", "mcp"],
      ["application/octet-stream", ["*"]],
      ["application/oda", "oda"],
      ["application/oebps-package+xml", "opf"],
      ["application/ogg", "ogx"],
      ["application/olescript", "axs"],
      ["application/onenote", "onetoc"],
      ["application/patch-ops-error+xml", "xer"],
      ["application/pdf", "pdf"],
      ["application/pgp-encrypted", "asc"],
      ["application/pgp-signature", "pgp"],
      ["application/pics-rules", "prf"],
      ["application/pkcs-12", "p12"],
      ["application/pkcs-crl", "crl"],
      ["application/pkcs10", "p10"],
      ["application/pkcs7-mime", ["p7c", "p7m"]],
      ["application/pkcs7-signature", "p7s"],
      ["application/pkcs8", "p8"],
      ["application/pkix-attr-cert", "ac"],
      ["application/pkix-cert", ["cer", "crt"]],
      ["application/pkix-crl", "crl"],
      ["application/pkix-pkipath", "pkipath"],
      ["application/pkixcmp", "pki"],
      ["application/plain", "text"],
      ["application/pls+xml", "pls"],
      ["application/postscript", ["ps", "ai", "eps"]],
      ["application/powerpoint", "ppt"],
      ["application/pro_eng", ["part", "prt"]],
      ["application/prs.cww", "cww"],
      ["application/pskc+xml", "pskcxml"],
      ["application/rdf+xml", "rdf"],
      ["application/reginfo+xml", "rif"],
      ["application/relax-ng-compact-syntax", "rnc"],
      ["application/resource-lists+xml", "rl"],
      ["application/resource-lists-diff+xml", "rld"],
      ["application/ringing-tones", "rng"],
      ["application/rls-services+xml", "rs"],
      ["application/rsd+xml", "rsd"],
      ["application/rss+xml", "xml"],
      ["application/rtf", ["rtf", "rtx"]],
      ["application/sbml+xml", "sbml"],
      ["application/scvp-cv-request", "scq"],
      ["application/scvp-cv-response", "scs"],
      ["application/scvp-vp-request", "spq"],
      ["application/scvp-vp-response", "spp"],
      ["application/sdp", "sdp"],
      ["application/sea", "sea"],
      ["application/set", "set"],
      ["application/set-payment-initiation", "setpay"],
      ["application/set-registration-initiation", "setreg"],
      ["application/shf+xml", "shf"],
      ["application/sla", "stl"],
      ["application/smil", ["smi", "smil"]],
      ["application/smil+xml", "smi"],
      ["application/solids", "sol"],
      ["application/sounder", "sdr"],
      ["application/sparql-query", "rq"],
      ["application/sparql-results+xml", "srx"],
      ["application/srgs", "gram"],
      ["application/srgs+xml", "grxml"],
      ["application/sru+xml", "sru"],
      ["application/ssml+xml", "ssml"],
      ["application/step", ["step", "stp"]],
      ["application/streamingmedia", "ssm"],
      ["application/tei+xml", "tei"],
      ["application/thraud+xml", "tfi"],
      ["application/timestamped-data", "tsd"],
      ["application/toolbook", "tbk"],
      ["application/vda", "vda"],
      ["application/vnd.3gpp.pic-bw-large", "plb"],
      ["application/vnd.3gpp.pic-bw-small", "psb"],
      ["application/vnd.3gpp.pic-bw-var", "pvb"],
      ["application/vnd.3gpp2.tcap", "tcap"],
      ["application/vnd.3m.post-it-notes", "pwn"],
      ["application/vnd.accpac.simply.aso", "aso"],
      ["application/vnd.accpac.simply.imp", "imp"],
      ["application/vnd.acucobol", "acu"],
      ["application/vnd.acucorp", "atc"],
      ["application/vnd.adobe.air-application-installer-package+zip", "air"],
      ["application/vnd.adobe.fxp", "fxp"],
      ["application/vnd.adobe.xdp+xml", "xdp"],
      ["application/vnd.adobe.xfdf", "xfdf"],
      ["application/vnd.ahead.space", "ahead"],
      ["application/vnd.airzip.filesecure.azf", "azf"],
      ["application/vnd.airzip.filesecure.azs", "azs"],
      ["application/vnd.amazon.ebook", "azw"],
      ["application/vnd.americandynamics.acc", "acc"],
      ["application/vnd.amiga.ami", "ami"],
      ["application/vnd.android.package-archive", "apk"],
      ["application/vnd.anser-web-certificate-issue-initiation", "cii"],
      ["application/vnd.anser-web-funds-transfer-initiation", "fti"],
      ["application/vnd.antix.game-component", "atx"],
      ["application/vnd.apple.installer+xml", "mpkg"],
      ["application/vnd.apple.mpegurl", "m3u8"],
      ["application/vnd.aristanetworks.swi", "swi"],
      ["application/vnd.audiograph", "aep"],
      ["application/vnd.blueice.multipass", "mpm"],
      ["application/vnd.bmi", "bmi"],
      ["application/vnd.businessobjects", "rep"],
      ["application/vnd.chemdraw+xml", "cdxml"],
      ["application/vnd.chipnuts.karaoke-mmd", "mmd"],
      ["application/vnd.cinderella", "cdy"],
      ["application/vnd.claymore", "cla"],
      ["application/vnd.cloanto.rp9", "rp9"],
      ["application/vnd.clonk.c4group", "c4g"],
      ["application/vnd.cluetrust.cartomobile-config", "c11amc"],
      ["application/vnd.cluetrust.cartomobile-config-pkg", "c11amz"],
      ["application/vnd.commonspace", "csp"],
      ["application/vnd.contact.cmsg", "cdbcmsg"],
      ["application/vnd.cosmocaller", "cmc"],
      ["application/vnd.crick.clicker", "clkx"],
      ["application/vnd.crick.clicker.keyboard", "clkk"],
      ["application/vnd.crick.clicker.palette", "clkp"],
      ["application/vnd.crick.clicker.template", "clkt"],
      ["application/vnd.crick.clicker.wordbank", "clkw"],
      ["application/vnd.criticaltools.wbs+xml", "wbs"],
      ["application/vnd.ctc-posml", "pml"],
      ["application/vnd.cups-ppd", "ppd"],
      ["application/vnd.curl.car", "car"],
      ["application/vnd.curl.pcurl", "pcurl"],
      ["application/vnd.data-vision.rdz", "rdz"],
      ["application/vnd.denovo.fcselayout-link", "fe_launch"],
      ["application/vnd.dna", "dna"],
      ["application/vnd.dolby.mlp", "mlp"],
      ["application/vnd.dpgraph", "dpg"],
      ["application/vnd.dreamfactory", "dfac"],
      ["application/vnd.dvb.ait", "ait"],
      ["application/vnd.dvb.service", "svc"],
      ["application/vnd.dynageo", "geo"],
      ["application/vnd.ecowin.chart", "mag"],
      ["application/vnd.enliven", "nml"],
      ["application/vnd.epson.esf", "esf"],
      ["application/vnd.epson.msf", "msf"],
      ["application/vnd.epson.quickanime", "qam"],
      ["application/vnd.epson.salt", "slt"],
      ["application/vnd.epson.ssf", "ssf"],
      ["application/vnd.eszigno3+xml", "es3"],
      ["application/vnd.ezpix-album", "ez2"],
      ["application/vnd.ezpix-package", "ez3"],
      ["application/vnd.fdf", "fdf"],
      ["application/vnd.fdsn.seed", "seed"],
      ["application/vnd.flographit", "gph"],
      ["application/vnd.fluxtime.clip", "ftc"],
      ["application/vnd.framemaker", "fm"],
      ["application/vnd.frogans.fnc", "fnc"],
      ["application/vnd.frogans.ltf", "ltf"],
      ["application/vnd.fsc.weblaunch", "fsc"],
      ["application/vnd.fujitsu.oasys", "oas"],
      ["application/vnd.fujitsu.oasys2", "oa2"],
      ["application/vnd.fujitsu.oasys3", "oa3"],
      ["application/vnd.fujitsu.oasysgp", "fg5"],
      ["application/vnd.fujitsu.oasysprs", "bh2"],
      ["application/vnd.fujixerox.ddd", "ddd"],
      ["application/vnd.fujixerox.docuworks", "xdw"],
      ["application/vnd.fujixerox.docuworks.binder", "xbd"],
      ["application/vnd.fuzzysheet", "fzs"],
      ["application/vnd.genomatix.tuxedo", "txd"],
      ["application/vnd.geogebra.file", "ggb"],
      ["application/vnd.geogebra.tool", "ggt"],
      ["application/vnd.geometry-explorer", "gex"],
      ["application/vnd.geonext", "gxt"],
      ["application/vnd.geoplan", "g2w"],
      ["application/vnd.geospace", "g3w"],
      ["application/vnd.gmx", "gmx"],
      ["application/vnd.google-earth.kml+xml", "kml"],
      ["application/vnd.google-earth.kmz", "kmz"],
      ["application/vnd.grafeq", "gqf"],
      ["application/vnd.groove-account", "gac"],
      ["application/vnd.groove-help", "ghf"],
      ["application/vnd.groove-identity-message", "gim"],
      ["application/vnd.groove-injector", "grv"],
      ["application/vnd.groove-tool-message", "gtm"],
      ["application/vnd.groove-tool-template", "tpl"],
      ["application/vnd.groove-vcard", "vcg"],
      ["application/vnd.hal+xml", "hal"],
      ["application/vnd.handheld-entertainment+xml", "zmm"],
      ["application/vnd.hbci", "hbci"],
      ["application/vnd.hhe.lesson-player", "les"],
      ["application/vnd.hp-hpgl", ["hgl", "hpg", "hpgl"]],
      ["application/vnd.hp-hpid", "hpid"],
      ["application/vnd.hp-hps", "hps"],
      ["application/vnd.hp-jlyt", "jlt"],
      ["application/vnd.hp-pcl", "pcl"],
      ["application/vnd.hp-pclxl", "pclxl"],
      ["application/vnd.hydrostatix.sof-data", "sfd-hdstx"],
      ["application/vnd.hzn-3d-crossword", "x3d"],
      ["application/vnd.ibm.minipay", "mpy"],
      ["application/vnd.ibm.modcap", "afp"],
      ["application/vnd.ibm.rights-management", "irm"],
      ["application/vnd.ibm.secure-container", "sc"],
      ["application/vnd.iccprofile", "icc"],
      ["application/vnd.igloader", "igl"],
      ["application/vnd.immervision-ivp", "ivp"],
      ["application/vnd.immervision-ivu", "ivu"],
      ["application/vnd.insors.igm", "igm"],
      ["application/vnd.intercon.formnet", "xpw"],
      ["application/vnd.intergeo", "i2g"],
      ["application/vnd.intu.qbo", "qbo"],
      ["application/vnd.intu.qfx", "qfx"],
      ["application/vnd.ipunplugged.rcprofile", "rcprofile"],
      ["application/vnd.irepository.package+xml", "irp"],
      ["application/vnd.is-xpr", "xpr"],
      ["application/vnd.isac.fcs", "fcs"],
      ["application/vnd.jam", "jam"],
      ["application/vnd.jcp.javame.midlet-rms", "rms"],
      ["application/vnd.jisp", "jisp"],
      ["application/vnd.joost.joda-archive", "joda"],
      ["application/vnd.kahootz", "ktz"],
      ["application/vnd.kde.karbon", "karbon"],
      ["application/vnd.kde.kchart", "chrt"],
      ["application/vnd.kde.kformula", "kfo"],
      ["application/vnd.kde.kivio", "flw"],
      ["application/vnd.kde.kontour", "kon"],
      ["application/vnd.kde.kpresenter", "kpr"],
      ["application/vnd.kde.kspread", "ksp"],
      ["application/vnd.kde.kword", "kwd"],
      ["application/vnd.kenameaapp", "htke"],
      ["application/vnd.kidspiration", "kia"],
      ["application/vnd.kinar", "kne"],
      ["application/vnd.koan", "skp"],
      ["application/vnd.kodak-descriptor", "sse"],
      ["application/vnd.las.las+xml", "lasxml"],
      ["application/vnd.llamagraphics.life-balance.desktop", "lbd"],
      ["application/vnd.llamagraphics.life-balance.exchange+xml", "lbe"],
      ["application/vnd.lotus-1-2-3", "123"],
      ["application/vnd.lotus-approach", "apr"],
      ["application/vnd.lotus-freelance", "pre"],
      ["application/vnd.lotus-notes", "nsf"],
      ["application/vnd.lotus-organizer", "org"],
      ["application/vnd.lotus-screencam", "scm"],
      ["application/vnd.lotus-wordpro", "lwp"],
      ["application/vnd.macports.portpkg", "portpkg"],
      ["application/vnd.mcd", "mcd"],
      ["application/vnd.medcalcdata", "mc1"],
      ["application/vnd.mediastation.cdkey", "cdkey"],
      ["application/vnd.mfer", "mwf"],
      ["application/vnd.mfmp", "mfm"],
      ["application/vnd.micrografx.flo", "flo"],
      ["application/vnd.micrografx.igx", "igx"],
      ["application/vnd.mif", "mif"],
      ["application/vnd.mobius.daf", "daf"],
      ["application/vnd.mobius.dis", "dis"],
      ["application/vnd.mobius.mbk", "mbk"],
      ["application/vnd.mobius.mqy", "mqy"],
      ["application/vnd.mobius.msl", "msl"],
      ["application/vnd.mobius.plc", "plc"],
      ["application/vnd.mobius.txf", "txf"],
      ["application/vnd.mophun.application", "mpn"],
      ["application/vnd.mophun.certificate", "mpc"],
      ["application/vnd.mozilla.xul+xml", "xul"],
      ["application/vnd.ms-artgalry", "cil"],
      ["application/vnd.ms-cab-compressed", "cab"],
      ["application/vnd.ms-excel", ["xls", "xla", "xlc", "xlm", "xlt", "xlw", "xlb", "xll"]],
      ["application/vnd.ms-excel.addin.macroenabled.12", "xlam"],
      ["application/vnd.ms-excel.sheet.binary.macroenabled.12", "xlsb"],
      ["application/vnd.ms-excel.sheet.macroenabled.12", "xlsm"],
      ["application/vnd.ms-excel.template.macroenabled.12", "xltm"],
      ["application/vnd.ms-fontobject", "eot"],
      ["application/vnd.ms-htmlhelp", "chm"],
      ["application/vnd.ms-ims", "ims"],
      ["application/vnd.ms-lrm", "lrm"],
      ["application/vnd.ms-officetheme", "thmx"],
      ["application/vnd.ms-outlook", "msg"],
      ["application/vnd.ms-pki.certstore", "sst"],
      ["application/vnd.ms-pki.pko", "pko"],
      ["application/vnd.ms-pki.seccat", "cat"],
      ["application/vnd.ms-pki.stl", "stl"],
      ["application/vnd.ms-pkicertstore", "sst"],
      ["application/vnd.ms-pkiseccat", "cat"],
      ["application/vnd.ms-pkistl", "stl"],
      ["application/vnd.ms-powerpoint", ["ppt", "pot", "pps", "ppa", "pwz"]],
      ["application/vnd.ms-powerpoint.addin.macroenabled.12", "ppam"],
      ["application/vnd.ms-powerpoint.presentation.macroenabled.12", "pptm"],
      ["application/vnd.ms-powerpoint.slide.macroenabled.12", "sldm"],
      ["application/vnd.ms-powerpoint.slideshow.macroenabled.12", "ppsm"],
      ["application/vnd.ms-powerpoint.template.macroenabled.12", "potm"],
      ["application/vnd.ms-project", "mpp"],
      ["application/vnd.ms-word.document.macroenabled.12", "docm"],
      ["application/vnd.ms-word.template.macroenabled.12", "dotm"],
      ["application/vnd.ms-works", ["wks", "wcm", "wdb", "wps"]],
      ["application/vnd.ms-wpl", "wpl"],
      ["application/vnd.ms-xpsdocument", "xps"],
      ["application/vnd.mseq", "mseq"],
      ["application/vnd.musician", "mus"],
      ["application/vnd.muvee.style", "msty"],
      ["application/vnd.neurolanguage.nlu", "nlu"],
      ["application/vnd.noblenet-directory", "nnd"],
      ["application/vnd.noblenet-sealer", "nns"],
      ["application/vnd.noblenet-web", "nnw"],
      ["application/vnd.nokia.configuration-message", "ncm"],
      ["application/vnd.nokia.n-gage.data", "ngdat"],
      ["application/vnd.nokia.n-gage.symbian.install", "n-gage"],
      ["application/vnd.nokia.radio-preset", "rpst"],
      ["application/vnd.nokia.radio-presets", "rpss"],
      ["application/vnd.nokia.ringing-tone", "rng"],
      ["application/vnd.novadigm.edm", "edm"],
      ["application/vnd.novadigm.edx", "edx"],
      ["application/vnd.novadigm.ext", "ext"],
      ["application/vnd.oasis.opendocument.chart", "odc"],
      ["application/vnd.oasis.opendocument.chart-template", "otc"],
      ["application/vnd.oasis.opendocument.database", "odb"],
      ["application/vnd.oasis.opendocument.formula", "odf"],
      ["application/vnd.oasis.opendocument.formula-template", "odft"],
      ["application/vnd.oasis.opendocument.graphics", "odg"],
      ["application/vnd.oasis.opendocument.graphics-template", "otg"],
      ["application/vnd.oasis.opendocument.image", "odi"],
      ["application/vnd.oasis.opendocument.image-template", "oti"],
      ["application/vnd.oasis.opendocument.presentation", "odp"],
      ["application/vnd.oasis.opendocument.presentation-template", "otp"],
      ["application/vnd.oasis.opendocument.spreadsheet", "ods"],
      ["application/vnd.oasis.opendocument.spreadsheet-template", "ots"],
      ["application/vnd.oasis.opendocument.text", "odt"],
      ["application/vnd.oasis.opendocument.text-master", "odm"],
      ["application/vnd.oasis.opendocument.text-template", "ott"],
      ["application/vnd.oasis.opendocument.text-web", "oth"],
      ["application/vnd.olpc-sugar", "xo"],
      ["application/vnd.oma.dd2+xml", "dd2"],
      ["application/vnd.openofficeorg.extension", "oxt"],
      ["application/vnd.openxmlformats-officedocument.presentationml.presentation", "pptx"],
      ["application/vnd.openxmlformats-officedocument.presentationml.slide", "sldx"],
      ["application/vnd.openxmlformats-officedocument.presentationml.slideshow", "ppsx"],
      ["application/vnd.openxmlformats-officedocument.presentationml.template", "potx"],
      ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "xlsx"],
      ["application/vnd.openxmlformats-officedocument.spreadsheetml.template", "xltx"],
      ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx"],
      ["application/vnd.openxmlformats-officedocument.wordprocessingml.template", "dotx"],
      ["application/vnd.osgeo.mapguide.package", "mgp"],
      ["application/vnd.osgi.dp", "dp"],
      ["application/vnd.palm", "pdb"],
      ["application/vnd.pawaafile", "paw"],
      ["application/vnd.pg.format", "str"],
      ["application/vnd.pg.osasli", "ei6"],
      ["application/vnd.picsel", "efif"],
      ["application/vnd.pmi.widget", "wg"],
      ["application/vnd.pocketlearn", "plf"],
      ["application/vnd.powerbuilder6", "pbd"],
      ["application/vnd.previewsystems.box", "box"],
      ["application/vnd.proteus.magazine", "mgz"],
      ["application/vnd.publishare-delta-tree", "qps"],
      ["application/vnd.pvi.ptid1", "ptid"],
      ["application/vnd.quark.quarkxpress", "qxd"],
      ["application/vnd.realvnc.bed", "bed"],
      ["application/vnd.recordare.musicxml", "mxl"],
      ["application/vnd.recordare.musicxml+xml", "musicxml"],
      ["application/vnd.rig.cryptonote", "cryptonote"],
      ["application/vnd.rim.cod", "cod"],
      ["application/vnd.rn-realmedia", "rm"],
      ["application/vnd.rn-realplayer", "rnx"],
      ["application/vnd.route66.link66+xml", "link66"],
      ["application/vnd.sailingtracker.track", "st"],
      ["application/vnd.seemail", "see"],
      ["application/vnd.sema", "sema"],
      ["application/vnd.semd", "semd"],
      ["application/vnd.semf", "semf"],
      ["application/vnd.shana.informed.formdata", "ifm"],
      ["application/vnd.shana.informed.formtemplate", "itp"],
      ["application/vnd.shana.informed.interchange", "iif"],
      ["application/vnd.shana.informed.package", "ipk"],
      ["application/vnd.simtech-mindmapper", "twd"],
      ["application/vnd.smaf", "mmf"],
      ["application/vnd.smart.teacher", "teacher"],
      ["application/vnd.solent.sdkm+xml", "sdkm"],
      ["application/vnd.spotfire.dxp", "dxp"],
      ["application/vnd.spotfire.sfs", "sfs"],
      ["application/vnd.stardivision.calc", "sdc"],
      ["application/vnd.stardivision.draw", "sda"],
      ["application/vnd.stardivision.impress", "sdd"],
      ["application/vnd.stardivision.math", "smf"],
      ["application/vnd.stardivision.writer", "sdw"],
      ["application/vnd.stardivision.writer-global", "sgl"],
      ["application/vnd.stepmania.stepchart", "sm"],
      ["application/vnd.sun.xml.calc", "sxc"],
      ["application/vnd.sun.xml.calc.template", "stc"],
      ["application/vnd.sun.xml.draw", "sxd"],
      ["application/vnd.sun.xml.draw.template", "std"],
      ["application/vnd.sun.xml.impress", "sxi"],
      ["application/vnd.sun.xml.impress.template", "sti"],
      ["application/vnd.sun.xml.math", "sxm"],
      ["application/vnd.sun.xml.writer", "sxw"],
      ["application/vnd.sun.xml.writer.global", "sxg"],
      ["application/vnd.sun.xml.writer.template", "stw"],
      ["application/vnd.sus-calendar", "sus"],
      ["application/vnd.svd", "svd"],
      ["application/vnd.symbian.install", "sis"],
      ["application/vnd.syncml+xml", "xsm"],
      ["application/vnd.syncml.dm+wbxml", "bdm"],
      ["application/vnd.syncml.dm+xml", "xdm"],
      ["application/vnd.tao.intent-module-archive", "tao"],
      ["application/vnd.tmobile-livetv", "tmo"],
      ["application/vnd.trid.tpt", "tpt"],
      ["application/vnd.triscape.mxs", "mxs"],
      ["application/vnd.trueapp", "tra"],
      ["application/vnd.ufdl", "ufd"],
      ["application/vnd.uiq.theme", "utz"],
      ["application/vnd.umajin", "umj"],
      ["application/vnd.unity", "unityweb"],
      ["application/vnd.uoml+xml", "uoml"],
      ["application/vnd.vcx", "vcx"],
      ["application/vnd.visio", "vsd"],
      ["application/vnd.visionary", "vis"],
      ["application/vnd.vsf", "vsf"],
      ["application/vnd.wap.wbxml", "wbxml"],
      ["application/vnd.wap.wmlc", "wmlc"],
      ["application/vnd.wap.wmlscriptc", "wmlsc"],
      ["application/vnd.webturbo", "wtb"],
      ["application/vnd.wolfram.player", "nbp"],
      ["application/vnd.wordperfect", "wpd"],
      ["application/vnd.wqd", "wqd"],
      ["application/vnd.wt.stf", "stf"],
      ["application/vnd.xara", ["web", "xar"]],
      ["application/vnd.xfdl", "xfdl"],
      ["application/vnd.yamaha.hv-dic", "hvd"],
      ["application/vnd.yamaha.hv-script", "hvs"],
      ["application/vnd.yamaha.hv-voice", "hvp"],
      ["application/vnd.yamaha.openscoreformat", "osf"],
      ["application/vnd.yamaha.openscoreformat.osfpvg+xml", "osfpvg"],
      ["application/vnd.yamaha.smaf-audio", "saf"],
      ["application/vnd.yamaha.smaf-phrase", "spf"],
      ["application/vnd.yellowriver-custom-menu", "cmp"],
      ["application/vnd.zul", "zir"],
      ["application/vnd.zzazz.deck+xml", "zaz"],
      ["application/vocaltec-media-desc", "vmd"],
      ["application/vocaltec-media-file", "vmf"],
      ["application/voicexml+xml", "vxml"],
      ["application/widget", "wgt"],
      ["application/winhlp", "hlp"],
      ["application/wordperfect", ["wp", "wp5", "wp6", "wpd"]],
      ["application/wordperfect6.0", ["w60", "wp5"]],
      ["application/wordperfect6.1", "w61"],
      ["application/wsdl+xml", "wsdl"],
      ["application/wspolicy+xml", "wspolicy"],
      ["application/x-123", "wk1"],
      ["application/x-7z-compressed", "7z"],
      ["application/x-abiword", "abw"],
      ["application/x-ace-compressed", "ace"],
      ["application/x-aim", "aim"],
      ["application/x-authorware-bin", "aab"],
      ["application/x-authorware-map", "aam"],
      ["application/x-authorware-seg", "aas"],
      ["application/x-bcpio", "bcpio"],
      ["application/x-binary", "bin"],
      ["application/x-binhex40", "hqx"],
      ["application/x-bittorrent", "torrent"],
      ["application/x-bsh", ["bsh", "sh", "shar"]],
      ["application/x-bytecode.elisp", "elc"],
      ["application/x-bytecode.python", "pyc"],
      ["application/x-bzip", "bz"],
      ["application/x-bzip2", ["boz", "bz2"]],
      ["application/x-cdf", "cdf"],
      ["application/x-cdlink", "vcd"],
      ["application/x-chat", ["cha", "chat"]],
      ["application/x-chess-pgn", "pgn"],
      ["application/x-cmu-raster", "ras"],
      ["application/x-cocoa", "cco"],
      ["application/x-compactpro", "cpt"],
      ["application/x-compress", "z"],
      ["application/x-compressed", ["tgz", "gz", "z", "zip"]],
      ["application/x-conference", "nsc"],
      ["application/x-cpio", "cpio"],
      ["application/x-cpt", "cpt"],
      ["application/x-csh", "csh"],
      ["application/x-debian-package", "deb"],
      ["application/x-deepv", "deepv"],
      ["application/x-director", ["dir", "dcr", "dxr"]],
      ["application/x-doom", "wad"],
      ["application/x-dtbncx+xml", "ncx"],
      ["application/x-dtbook+xml", "dtb"],
      ["application/x-dtbresource+xml", "res"],
      ["application/x-dvi", "dvi"],
      ["application/x-elc", "elc"],
      ["application/x-envoy", ["env", "evy"]],
      ["application/x-esrehber", "es"],
      ["application/x-excel", ["xls", "xla", "xlb", "xlc", "xld", "xlk", "xll", "xlm", "xlt", "xlv", "xlw"]],
      ["application/x-font-bdf", "bdf"],
      ["application/x-font-ghostscript", "gsf"],
      ["application/x-font-linux-psf", "psf"],
      ["application/x-font-otf", "otf"],
      ["application/x-font-pcf", "pcf"],
      ["application/x-font-snf", "snf"],
      ["application/x-font-ttf", "ttf"],
      ["application/x-font-type1", "pfa"],
      ["application/x-font-woff", "woff"],
      ["application/x-frame", "mif"],
      ["application/x-freelance", "pre"],
      ["application/x-futuresplash", "spl"],
      ["application/x-gnumeric", "gnumeric"],
      ["application/x-gsp", "gsp"],
      ["application/x-gss", "gss"],
      ["application/x-gtar", "gtar"],
      ["application/x-gzip", ["gz", "gzip"]],
      ["application/x-hdf", "hdf"],
      ["application/x-helpfile", ["help", "hlp"]],
      ["application/x-httpd-imap", "imap"],
      ["application/x-ima", "ima"],
      ["application/x-internet-signup", ["ins", "isp"]],
      ["application/x-internett-signup", "ins"],
      ["application/x-inventor", "iv"],
      ["application/x-ip2", "ip"],
      ["application/x-iphone", "iii"],
      ["application/x-java-class", "class"],
      ["application/x-java-commerce", "jcm"],
      ["application/x-java-jnlp-file", "jnlp"],
      ["application/x-javascript", "js"],
      ["application/x-koan", ["skd", "skm", "skp", "skt"]],
      ["application/x-ksh", "ksh"],
      ["application/x-latex", ["latex", "ltx"]],
      ["application/x-lha", "lha"],
      ["application/x-lisp", "lsp"],
      ["application/x-livescreen", "ivy"],
      ["application/x-lotus", "wq1"],
      ["application/x-lotusscreencam", "scm"],
      ["application/x-lzh", "lzh"],
      ["application/x-lzx", "lzx"],
      ["application/x-mac-binhex40", "hqx"],
      ["application/x-macbinary", "bin"],
      ["application/x-magic-cap-package-1.0", "mc$"],
      ["application/x-mathcad", "mcd"],
      ["application/x-meme", "mm"],
      ["application/x-midi", ["mid", "midi"]],
      ["application/x-mif", "mif"],
      ["application/x-mix-transfer", "nix"],
      ["application/x-mobipocket-ebook", "prc"],
      ["application/x-mplayer2", "asx"],
      ["application/x-ms-application", "application"],
      ["application/x-ms-wmd", "wmd"],
      ["application/x-ms-wmz", "wmz"],
      ["application/x-ms-xbap", "xbap"],
      ["application/x-msaccess", "mdb"],
      ["application/x-msbinder", "obd"],
      ["application/x-mscardfile", "crd"],
      ["application/x-msclip", "clp"],
      ["application/x-msdownload", ["exe", "dll"]],
      ["application/x-msexcel", ["xls", "xla", "xlw"]],
      ["application/x-msmediaview", ["mvb", "m13", "m14"]],
      ["application/x-msmetafile", "wmf"],
      ["application/x-msmoney", "mny"],
      ["application/x-mspowerpoint", "ppt"],
      ["application/x-mspublisher", "pub"],
      ["application/x-msschedule", "scd"],
      ["application/x-msterminal", "trm"],
      ["application/x-mswrite", "wri"],
      ["application/x-navi-animation", "ani"],
      ["application/x-navidoc", "nvd"],
      ["application/x-navimap", "map"],
      ["application/x-navistyle", "stl"],
      ["application/x-netcdf", ["cdf", "nc"]],
      ["application/x-newton-compatible-pkg", "pkg"],
      ["application/x-nokia-9000-communicator-add-on-software", "aos"],
      ["application/x-omc", "omc"],
      ["application/x-omcdatamaker", "omcd"],
      ["application/x-omcregerator", "omcr"],
      ["application/x-pagemaker", ["pm4", "pm5"]],
      ["application/x-pcl", "pcl"],
      ["application/x-perfmon", ["pma", "pmc", "pml", "pmr", "pmw"]],
      ["application/x-pixclscript", "plx"],
      ["application/x-pkcs10", "p10"],
      ["application/x-pkcs12", ["p12", "pfx"]],
      ["application/x-pkcs7-certificates", ["p7b", "spc"]],
      ["application/x-pkcs7-certreqresp", "p7r"],
      ["application/x-pkcs7-mime", ["p7m", "p7c"]],
      ["application/x-pkcs7-signature", ["p7s", "p7a"]],
      ["application/x-pointplus", "css"],
      ["application/x-portable-anymap", "pnm"],
      ["application/x-project", ["mpc", "mpt", "mpv", "mpx"]],
      ["application/x-qpro", "wb1"],
      ["application/x-rar-compressed", "rar"],
      ["application/x-rtf", "rtf"],
      ["application/x-sdp", "sdp"],
      ["application/x-sea", "sea"],
      ["application/x-seelogo", "sl"],
      ["application/x-sh", "sh"],
      ["application/x-shar", ["shar", "sh"]],
      ["application/x-shockwave-flash", "swf"],
      ["application/x-silverlight-app", "xap"],
      ["application/x-sit", "sit"],
      ["application/x-sprite", ["spr", "sprite"]],
      ["application/x-stuffit", "sit"],
      ["application/x-stuffitx", "sitx"],
      ["application/x-sv4cpio", "sv4cpio"],
      ["application/x-sv4crc", "sv4crc"],
      ["application/x-tar", "tar"],
      ["application/x-tbook", ["sbk", "tbk"]],
      ["application/x-tcl", "tcl"],
      ["application/x-tex", "tex"],
      ["application/x-tex-tfm", "tfm"],
      ["application/x-texinfo", ["texi", "texinfo"]],
      ["application/x-troff", ["roff", "t", "tr"]],
      ["application/x-troff-man", "man"],
      ["application/x-troff-me", "me"],
      ["application/x-troff-ms", "ms"],
      ["application/x-troff-msvideo", "avi"],
      ["application/x-ustar", "ustar"],
      ["application/x-visio", ["vsd", "vst", "vsw"]],
      ["application/x-vnd.audioexplosion.mzz", "mzz"],
      ["application/x-vnd.ls-xpix", "xpix"],
      ["application/x-vrml", "vrml"],
      ["application/x-wais-source", ["src", "wsrc"]],
      ["application/x-winhelp", "hlp"],
      ["application/x-wintalk", "wtk"],
      ["application/x-world", ["wrl", "svr"]],
      ["application/x-wpwin", "wpd"],
      ["application/x-wri", "wri"],
      ["application/x-x509-ca-cert", ["cer", "crt", "der"]],
      ["application/x-x509-user-cert", "crt"],
      ["application/x-xfig", "fig"],
      ["application/x-xpinstall", "xpi"],
      ["application/x-zip-compressed", "zip"],
      ["application/xcap-diff+xml", "xdf"],
      ["application/xenc+xml", "xenc"],
      ["application/xhtml+xml", "xhtml"],
      ["application/xml", "xml"],
      ["application/xml-dtd", "dtd"],
      ["application/xop+xml", "xop"],
      ["application/xslt+xml", "xslt"],
      ["application/xspf+xml", "xspf"],
      ["application/xv+xml", "mxml"],
      ["application/yang", "yang"],
      ["application/yin+xml", "yin"],
      ["application/ynd.ms-pkipko", "pko"],
      ["application/zip", "zip"],
      ["audio/adpcm", "adp"],
      ["audio/aiff", ["aiff", "aif", "aifc"]],
      ["audio/basic", ["snd", "au"]],
      ["audio/it", "it"],
      ["audio/make", ["funk", "my", "pfunk"]],
      ["audio/make.my.funk", "pfunk"],
      ["audio/mid", ["mid", "rmi"]],
      ["audio/midi", ["midi", "kar", "mid"]],
      ["audio/mod", "mod"],
      ["audio/mp4", "mp4a"],
      ["audio/mpeg", ["mpga", "mp3", "m2a", "mp2", "mpa", "mpg"]],
      ["audio/mpeg3", "mp3"],
      ["audio/nspaudio", ["la", "lma"]],
      ["audio/ogg", "oga"],
      ["audio/s3m", "s3m"],
      ["audio/tsp-audio", "tsi"],
      ["audio/tsplayer", "tsp"],
      ["audio/vnd.dece.audio", "uva"],
      ["audio/vnd.digital-winds", "eol"],
      ["audio/vnd.dra", "dra"],
      ["audio/vnd.dts", "dts"],
      ["audio/vnd.dts.hd", "dtshd"],
      ["audio/vnd.lucent.voice", "lvp"],
      ["audio/vnd.ms-playready.media.pya", "pya"],
      ["audio/vnd.nuera.ecelp4800", "ecelp4800"],
      ["audio/vnd.nuera.ecelp7470", "ecelp7470"],
      ["audio/vnd.nuera.ecelp9600", "ecelp9600"],
      ["audio/vnd.qcelp", "qcp"],
      ["audio/vnd.rip", "rip"],
      ["audio/voc", "voc"],
      ["audio/voxware", "vox"],
      ["audio/wav", "wav"],
      ["audio/webm", "weba"],
      ["audio/x-aac", "aac"],
      ["audio/x-adpcm", "snd"],
      ["audio/x-aiff", ["aiff", "aif", "aifc"]],
      ["audio/x-au", "au"],
      ["audio/x-gsm", ["gsd", "gsm"]],
      ["audio/x-jam", "jam"],
      ["audio/x-liveaudio", "lam"],
      ["audio/x-mid", ["mid", "midi"]],
      ["audio/x-midi", ["midi", "mid"]],
      ["audio/x-mod", "mod"],
      ["audio/x-mpeg", "mp2"],
      ["audio/x-mpeg-3", "mp3"],
      ["audio/x-mpegurl", "m3u"],
      ["audio/x-mpequrl", "m3u"],
      ["audio/x-ms-wax", "wax"],
      ["audio/x-ms-wma", "wma"],
      ["audio/x-nspaudio", ["la", "lma"]],
      ["audio/x-pn-realaudio", ["ra", "ram", "rm", "rmm", "rmp"]],
      ["audio/x-pn-realaudio-plugin", ["ra", "rmp", "rpm"]],
      ["audio/x-psid", "sid"],
      ["audio/x-realaudio", "ra"],
      ["audio/x-twinvq", "vqf"],
      ["audio/x-twinvq-plugin", ["vqe", "vql"]],
      ["audio/x-vnd.audioexplosion.mjuicemediafile", "mjf"],
      ["audio/x-voc", "voc"],
      ["audio/x-wav", "wav"],
      ["audio/xm", "xm"],
      ["chemical/x-cdx", "cdx"],
      ["chemical/x-cif", "cif"],
      ["chemical/x-cmdf", "cmdf"],
      ["chemical/x-cml", "cml"],
      ["chemical/x-csml", "csml"],
      ["chemical/x-pdb", ["pdb", "xyz"]],
      ["chemical/x-xyz", "xyz"],
      ["drawing/x-dwf", "dwf"],
      ["i-world/i-vrml", "ivr"],
      ["image/bmp", ["bmp", "bm"]],
      ["image/cgm", "cgm"],
      ["image/cis-cod", "cod"],
      ["image/cmu-raster", ["ras", "rast"]],
      ["image/fif", "fif"],
      ["image/florian", ["flo", "turbot"]],
      ["image/g3fax", "g3"],
      ["image/gif", "gif"],
      ["image/ief", ["ief", "iefs"]],
      ["image/jpeg", ["jpeg", "jpe", "jpg", "jfif", "jfif-tbnl"]],
      ["image/jutvision", "jut"],
      ["image/ktx", "ktx"],
      ["image/naplps", ["nap", "naplps"]],
      ["image/pict", ["pic", "pict"]],
      ["image/pipeg", "jfif"],
      ["image/pjpeg", ["jfif", "jpe", "jpeg", "jpg"]],
      ["image/png", ["png", "x-png"]],
      ["image/prs.btif", "btif"],
      ["image/svg+xml", "svg"],
      ["image/tiff", ["tif", "tiff"]],
      ["image/vasa", "mcf"],
      ["image/vnd.adobe.photoshop", "psd"],
      ["image/vnd.dece.graphic", "uvi"],
      ["image/vnd.djvu", "djvu"],
      ["image/vnd.dvb.subtitle", "sub"],
      ["image/vnd.dwg", ["dwg", "dxf", "svf"]],
      ["image/vnd.dxf", "dxf"],
      ["image/vnd.fastbidsheet", "fbs"],
      ["image/vnd.fpx", "fpx"],
      ["image/vnd.fst", "fst"],
      ["image/vnd.fujixerox.edmics-mmr", "mmr"],
      ["image/vnd.fujixerox.edmics-rlc", "rlc"],
      ["image/vnd.ms-modi", "mdi"],
      ["image/vnd.net-fpx", ["fpx", "npx"]],
      ["image/vnd.rn-realflash", "rf"],
      ["image/vnd.rn-realpix", "rp"],
      ["image/vnd.wap.wbmp", "wbmp"],
      ["image/vnd.xiff", "xif"],
      ["image/webp", "webp"],
      ["image/x-cmu-raster", "ras"],
      ["image/x-cmx", "cmx"],
      ["image/x-dwg", ["dwg", "dxf", "svf"]],
      ["image/x-freehand", "fh"],
      ["image/x-icon", "ico"],
      ["image/x-jg", "art"],
      ["image/x-jps", "jps"],
      ["image/x-niff", ["niff", "nif"]],
      ["image/x-pcx", "pcx"],
      ["image/x-pict", ["pct", "pic"]],
      ["image/x-portable-anymap", "pnm"],
      ["image/x-portable-bitmap", "pbm"],
      ["image/x-portable-graymap", "pgm"],
      ["image/x-portable-greymap", "pgm"],
      ["image/x-portable-pixmap", "ppm"],
      ["image/x-quicktime", ["qif", "qti", "qtif"]],
      ["image/x-rgb", "rgb"],
      ["image/x-tiff", ["tif", "tiff"]],
      ["image/x-windows-bmp", "bmp"],
      ["image/x-xbitmap", "xbm"],
      ["image/x-xbm", "xbm"],
      ["image/x-xpixmap", ["xpm", "pm"]],
      ["image/x-xwd", "xwd"],
      ["image/x-xwindowdump", "xwd"],
      ["image/xbm", "xbm"],
      ["image/xpm", "xpm"],
      ["message/rfc822", ["eml", "mht", "mhtml", "nws", "mime"]],
      ["model/iges", ["iges", "igs"]],
      ["model/mesh", "msh"],
      ["model/vnd.collada+xml", "dae"],
      ["model/vnd.dwf", "dwf"],
      ["model/vnd.gdl", "gdl"],
      ["model/vnd.gtw", "gtw"],
      ["model/vnd.mts", "mts"],
      ["model/vnd.vtu", "vtu"],
      ["model/vrml", ["vrml", "wrl", "wrz"]],
      ["model/x-pov", "pov"],
      ["multipart/x-gzip", "gzip"],
      ["multipart/x-ustar", "ustar"],
      ["multipart/x-zip", "zip"],
      ["music/crescendo", ["mid", "midi"]],
      ["music/x-karaoke", "kar"],
      ["paleovu/x-pv", "pvu"],
      ["text/asp", "asp"],
      ["text/calendar", "ics"],
      ["text/css", "css"],
      ["text/csv", "csv"],
      ["text/ecmascript", "js"],
      ["text/h323", "323"],
      ["text/html", ["html", "htm", "stm", "acgi", "htmls", "htx", "shtml"]],
      ["text/iuls", "uls"],
      ["text/javascript", "js"],
      ["text/mcf", "mcf"],
      ["text/n3", "n3"],
      ["text/pascal", "pas"],
      [
        "text/plain",
        [
          "txt",
          "bas",
          "c",
          "h",
          "c++",
          "cc",
          "com",
          "conf",
          "cxx",
          "def",
          "f",
          "f90",
          "for",
          "g",
          "hh",
          "idc",
          "jav",
          "java",
          "list",
          "log",
          "lst",
          "m",
          "mar",
          "pl",
          "sdml",
          "text"
        ]
      ],
      ["text/plain-bas", "par"],
      ["text/prs.lines.tag", "dsc"],
      ["text/richtext", ["rtx", "rt", "rtf"]],
      ["text/scriplet", "wsc"],
      ["text/scriptlet", "sct"],
      ["text/sgml", ["sgm", "sgml"]],
      ["text/tab-separated-values", "tsv"],
      ["text/troff", "t"],
      ["text/turtle", "ttl"],
      ["text/uri-list", ["uni", "unis", "uri", "uris"]],
      ["text/vnd.abc", "abc"],
      ["text/vnd.curl", "curl"],
      ["text/vnd.curl.dcurl", "dcurl"],
      ["text/vnd.curl.mcurl", "mcurl"],
      ["text/vnd.curl.scurl", "scurl"],
      ["text/vnd.fly", "fly"],
      ["text/vnd.fmi.flexstor", "flx"],
      ["text/vnd.graphviz", "gv"],
      ["text/vnd.in3d.3dml", "3dml"],
      ["text/vnd.in3d.spot", "spot"],
      ["text/vnd.rn-realtext", "rt"],
      ["text/vnd.sun.j2me.app-descriptor", "jad"],
      ["text/vnd.wap.wml", "wml"],
      ["text/vnd.wap.wmlscript", "wmls"],
      ["text/webviewhtml", "htt"],
      ["text/x-asm", ["asm", "s"]],
      ["text/x-audiosoft-intra", "aip"],
      ["text/x-c", ["c", "cc", "cpp"]],
      ["text/x-component", "htc"],
      ["text/x-fortran", ["for", "f", "f77", "f90"]],
      ["text/x-h", ["h", "hh"]],
      ["text/x-java-source", ["java", "jav"]],
      ["text/x-java-source,java", "java"],
      ["text/x-la-asf", "lsx"],
      ["text/x-m", "m"],
      ["text/x-pascal", "p"],
      ["text/x-script", "hlb"],
      ["text/x-script.csh", "csh"],
      ["text/x-script.elisp", "el"],
      ["text/x-script.guile", "scm"],
      ["text/x-script.ksh", "ksh"],
      ["text/x-script.lisp", "lsp"],
      ["text/x-script.perl", "pl"],
      ["text/x-script.perl-module", "pm"],
      ["text/x-script.phyton", "py"],
      ["text/x-script.rexx", "rexx"],
      ["text/x-script.scheme", "scm"],
      ["text/x-script.sh", "sh"],
      ["text/x-script.tcl", "tcl"],
      ["text/x-script.tcsh", "tcsh"],
      ["text/x-script.zsh", "zsh"],
      ["text/x-server-parsed-html", ["shtml", "ssi"]],
      ["text/x-setext", "etx"],
      ["text/x-sgml", ["sgm", "sgml"]],
      ["text/x-speech", ["spc", "talk"]],
      ["text/x-uil", "uil"],
      ["text/x-uuencode", ["uu", "uue"]],
      ["text/x-vcalendar", "vcs"],
      ["text/x-vcard", "vcf"],
      ["text/xml", "xml"],
      ["video/3gpp", "3gp"],
      ["video/3gpp2", "3g2"],
      ["video/animaflex", "afl"],
      ["video/avi", "avi"],
      ["video/avs-video", "avs"],
      ["video/dl", "dl"],
      ["video/fli", "fli"],
      ["video/gl", "gl"],
      ["video/h261", "h261"],
      ["video/h263", "h263"],
      ["video/h264", "h264"],
      ["video/jpeg", "jpgv"],
      ["video/jpm", "jpm"],
      ["video/mj2", "mj2"],
      ["video/mp4", "mp4"],
      ["video/mpeg", ["mpeg", "mp2", "mpa", "mpe", "mpg", "mpv2", "m1v", "m2v", "mp3"]],
      ["video/msvideo", "avi"],
      ["video/ogg", "ogv"],
      ["video/quicktime", ["mov", "qt", "moov"]],
      ["video/vdo", "vdo"],
      ["video/vivo", ["viv", "vivo"]],
      ["video/vnd.dece.hd", "uvh"],
      ["video/vnd.dece.mobile", "uvm"],
      ["video/vnd.dece.pd", "uvp"],
      ["video/vnd.dece.sd", "uvs"],
      ["video/vnd.dece.video", "uvv"],
      ["video/vnd.fvt", "fvt"],
      ["video/vnd.mpegurl", "mxu"],
      ["video/vnd.ms-playready.media.pyv", "pyv"],
      ["video/vnd.rn-realvideo", "rv"],
      ["video/vnd.uvvu.mp4", "uvu"],
      ["video/vnd.vivo", ["viv", "vivo"]],
      ["video/vosaic", "vos"],
      ["video/webm", "webm"],
      ["video/x-amt-demorun", "xdr"],
      ["video/x-amt-showrun", "xsr"],
      ["video/x-atomic3d-feature", "fmf"],
      ["video/x-dl", "dl"],
      ["video/x-dv", ["dif", "dv"]],
      ["video/x-f4v", "f4v"],
      ["video/x-fli", "fli"],
      ["video/x-flv", "flv"],
      ["video/x-gl", "gl"],
      ["video/x-isvideo", "isu"],
      ["video/x-la-asf", ["lsf", "lsx"]],
      ["video/x-m4v", "m4v"],
      ["video/x-motion-jpeg", "mjpg"],
      ["video/x-mpeg", ["mp3", "mp2"]],
      ["video/x-mpeq2a", "mp2"],
      ["video/x-ms-asf", ["asf", "asr", "asx"]],
      ["video/x-ms-asf-plugin", "asx"],
      ["video/x-ms-wm", "wm"],
      ["video/x-ms-wmv", "wmv"],
      ["video/x-ms-wmx", "wmx"],
      ["video/x-ms-wvx", "wvx"],
      ["video/x-msvideo", "avi"],
      ["video/x-qtc", "qtc"],
      ["video/x-scm", "scm"],
      ["video/x-sgi-movie", ["movie", "mv"]],
      ["windows/metafile", "wmf"],
      ["www/mime", "mime"],
      ["x-conference/x-cooltalk", "ice"],
      ["x-music/x-midi", ["mid", "midi"]],
      ["x-world/x-3dmf", ["3dm", "3dmf", "qd3", "qd3d"]],
      ["x-world/x-svr", "svr"],
      ["x-world/x-vrml", ["flr", "vrml", "wrl", "wrz", "xaf", "xof"]],
      ["x-world/x-vrt", "vrt"],
      ["xgl/drawing", "xgz"],
      ["xgl/movie", "xmz"]
    ]);
    var extensions = /* @__PURE__ */ new Map([
      ["123", "application/vnd.lotus-1-2-3"],
      ["323", "text/h323"],
      ["*", "application/octet-stream"],
      ["3dm", "x-world/x-3dmf"],
      ["3dmf", "x-world/x-3dmf"],
      ["3dml", "text/vnd.in3d.3dml"],
      ["3g2", "video/3gpp2"],
      ["3gp", "video/3gpp"],
      ["7z", "application/x-7z-compressed"],
      ["a", "application/octet-stream"],
      ["aab", "application/x-authorware-bin"],
      ["aac", "audio/x-aac"],
      ["aam", "application/x-authorware-map"],
      ["aas", "application/x-authorware-seg"],
      ["abc", "text/vnd.abc"],
      ["abw", "application/x-abiword"],
      ["ac", "application/pkix-attr-cert"],
      ["acc", "application/vnd.americandynamics.acc"],
      ["ace", "application/x-ace-compressed"],
      ["acgi", "text/html"],
      ["acu", "application/vnd.acucobol"],
      ["acx", "application/internet-property-stream"],
      ["adp", "audio/adpcm"],
      ["aep", "application/vnd.audiograph"],
      ["afl", "video/animaflex"],
      ["afp", "application/vnd.ibm.modcap"],
      ["ahead", "application/vnd.ahead.space"],
      ["ai", "application/postscript"],
      ["aif", ["audio/aiff", "audio/x-aiff"]],
      ["aifc", ["audio/aiff", "audio/x-aiff"]],
      ["aiff", ["audio/aiff", "audio/x-aiff"]],
      ["aim", "application/x-aim"],
      ["aip", "text/x-audiosoft-intra"],
      ["air", "application/vnd.adobe.air-application-installer-package+zip"],
      ["ait", "application/vnd.dvb.ait"],
      ["ami", "application/vnd.amiga.ami"],
      ["ani", "application/x-navi-animation"],
      ["aos", "application/x-nokia-9000-communicator-add-on-software"],
      ["apk", "application/vnd.android.package-archive"],
      ["application", "application/x-ms-application"],
      ["apr", "application/vnd.lotus-approach"],
      ["aps", "application/mime"],
      ["arc", "application/octet-stream"],
      ["arj", ["application/arj", "application/octet-stream"]],
      ["art", "image/x-jg"],
      ["asf", "video/x-ms-asf"],
      ["asm", "text/x-asm"],
      ["aso", "application/vnd.accpac.simply.aso"],
      ["asp", "text/asp"],
      ["asr", "video/x-ms-asf"],
      ["asx", ["video/x-ms-asf", "application/x-mplayer2", "video/x-ms-asf-plugin"]],
      ["atc", "application/vnd.acucorp"],
      ["atomcat", "application/atomcat+xml"],
      ["atomsvc", "application/atomsvc+xml"],
      ["atx", "application/vnd.antix.game-component"],
      ["au", ["audio/basic", "audio/x-au"]],
      ["avi", ["video/avi", "video/msvideo", "application/x-troff-msvideo", "video/x-msvideo"]],
      ["avs", "video/avs-video"],
      ["aw", "application/applixware"],
      ["axs", "application/olescript"],
      ["azf", "application/vnd.airzip.filesecure.azf"],
      ["azs", "application/vnd.airzip.filesecure.azs"],
      ["azw", "application/vnd.amazon.ebook"],
      ["bas", "text/plain"],
      ["bcpio", "application/x-bcpio"],
      ["bdf", "application/x-font-bdf"],
      ["bdm", "application/vnd.syncml.dm+wbxml"],
      ["bed", "application/vnd.realvnc.bed"],
      ["bh2", "application/vnd.fujitsu.oasysprs"],
      ["bin", ["application/octet-stream", "application/mac-binary", "application/macbinary", "application/x-macbinary", "application/x-binary"]],
      ["bm", "image/bmp"],
      ["bmi", "application/vnd.bmi"],
      ["bmp", ["image/bmp", "image/x-windows-bmp"]],
      ["boo", "application/book"],
      ["book", "application/book"],
      ["box", "application/vnd.previewsystems.box"],
      ["boz", "application/x-bzip2"],
      ["bsh", "application/x-bsh"],
      ["btif", "image/prs.btif"],
      ["bz", "application/x-bzip"],
      ["bz2", "application/x-bzip2"],
      ["c", ["text/plain", "text/x-c"]],
      ["c++", "text/plain"],
      ["c11amc", "application/vnd.cluetrust.cartomobile-config"],
      ["c11amz", "application/vnd.cluetrust.cartomobile-config-pkg"],
      ["c4g", "application/vnd.clonk.c4group"],
      ["cab", "application/vnd.ms-cab-compressed"],
      ["car", "application/vnd.curl.car"],
      ["cat", ["application/vnd.ms-pkiseccat", "application/vnd.ms-pki.seccat"]],
      ["cc", ["text/plain", "text/x-c"]],
      ["ccad", "application/clariscad"],
      ["cco", "application/x-cocoa"],
      ["ccxml", "application/ccxml+xml,"],
      ["cdbcmsg", "application/vnd.contact.cmsg"],
      ["cdf", ["application/cdf", "application/x-cdf", "application/x-netcdf"]],
      ["cdkey", "application/vnd.mediastation.cdkey"],
      ["cdmia", "application/cdmi-capability"],
      ["cdmic", "application/cdmi-container"],
      ["cdmid", "application/cdmi-domain"],
      ["cdmio", "application/cdmi-object"],
      ["cdmiq", "application/cdmi-queue"],
      ["cdx", "chemical/x-cdx"],
      ["cdxml", "application/vnd.chemdraw+xml"],
      ["cdy", "application/vnd.cinderella"],
      ["cer", ["application/pkix-cert", "application/x-x509-ca-cert"]],
      ["cgm", "image/cgm"],
      ["cha", "application/x-chat"],
      ["chat", "application/x-chat"],
      ["chm", "application/vnd.ms-htmlhelp"],
      ["chrt", "application/vnd.kde.kchart"],
      ["cif", "chemical/x-cif"],
      ["cii", "application/vnd.anser-web-certificate-issue-initiation"],
      ["cil", "application/vnd.ms-artgalry"],
      ["cla", "application/vnd.claymore"],
      ["class", ["application/octet-stream", "application/java", "application/java-byte-code", "application/java-vm", "application/x-java-class"]],
      ["clkk", "application/vnd.crick.clicker.keyboard"],
      ["clkp", "application/vnd.crick.clicker.palette"],
      ["clkt", "application/vnd.crick.clicker.template"],
      ["clkw", "application/vnd.crick.clicker.wordbank"],
      ["clkx", "application/vnd.crick.clicker"],
      ["clp", "application/x-msclip"],
      ["cmc", "application/vnd.cosmocaller"],
      ["cmdf", "chemical/x-cmdf"],
      ["cml", "chemical/x-cml"],
      ["cmp", "application/vnd.yellowriver-custom-menu"],
      ["cmx", "image/x-cmx"],
      ["cod", ["image/cis-cod", "application/vnd.rim.cod"]],
      ["com", ["application/octet-stream", "text/plain"]],
      ["conf", "text/plain"],
      ["cpio", "application/x-cpio"],
      ["cpp", "text/x-c"],
      ["cpt", ["application/mac-compactpro", "application/x-compactpro", "application/x-cpt"]],
      ["crd", "application/x-mscardfile"],
      ["crl", ["application/pkix-crl", "application/pkcs-crl"]],
      ["crt", ["application/pkix-cert", "application/x-x509-user-cert", "application/x-x509-ca-cert"]],
      ["cryptonote", "application/vnd.rig.cryptonote"],
      ["csh", ["text/x-script.csh", "application/x-csh"]],
      ["csml", "chemical/x-csml"],
      ["csp", "application/vnd.commonspace"],
      ["css", ["text/css", "application/x-pointplus"]],
      ["csv", "text/csv"],
      ["cu", "application/cu-seeme"],
      ["curl", "text/vnd.curl"],
      ["cww", "application/prs.cww"],
      ["cxx", "text/plain"],
      ["dae", "model/vnd.collada+xml"],
      ["daf", "application/vnd.mobius.daf"],
      ["davmount", "application/davmount+xml"],
      ["dcr", "application/x-director"],
      ["dcurl", "text/vnd.curl.dcurl"],
      ["dd2", "application/vnd.oma.dd2+xml"],
      ["ddd", "application/vnd.fujixerox.ddd"],
      ["deb", "application/x-debian-package"],
      ["deepv", "application/x-deepv"],
      ["def", "text/plain"],
      ["der", "application/x-x509-ca-cert"],
      ["dfac", "application/vnd.dreamfactory"],
      ["dif", "video/x-dv"],
      ["dir", "application/x-director"],
      ["dis", "application/vnd.mobius.dis"],
      ["djvu", "image/vnd.djvu"],
      ["dl", ["video/dl", "video/x-dl"]],
      ["dll", "application/x-msdownload"],
      ["dms", "application/octet-stream"],
      ["dna", "application/vnd.dna"],
      ["doc", "application/msword"],
      ["docm", "application/vnd.ms-word.document.macroenabled.12"],
      ["docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
      ["dot", "application/msword"],
      ["dotm", "application/vnd.ms-word.template.macroenabled.12"],
      ["dotx", "application/vnd.openxmlformats-officedocument.wordprocessingml.template"],
      ["dp", ["application/commonground", "application/vnd.osgi.dp"]],
      ["dpg", "application/vnd.dpgraph"],
      ["dra", "audio/vnd.dra"],
      ["drw", "application/drafting"],
      ["dsc", "text/prs.lines.tag"],
      ["dssc", "application/dssc+der"],
      ["dtb", "application/x-dtbook+xml"],
      ["dtd", "application/xml-dtd"],
      ["dts", "audio/vnd.dts"],
      ["dtshd", "audio/vnd.dts.hd"],
      ["dump", "application/octet-stream"],
      ["dv", "video/x-dv"],
      ["dvi", "application/x-dvi"],
      ["dwf", ["model/vnd.dwf", "drawing/x-dwf"]],
      ["dwg", ["application/acad", "image/vnd.dwg", "image/x-dwg"]],
      ["dxf", ["application/dxf", "image/vnd.dwg", "image/vnd.dxf", "image/x-dwg"]],
      ["dxp", "application/vnd.spotfire.dxp"],
      ["dxr", "application/x-director"],
      ["ecelp4800", "audio/vnd.nuera.ecelp4800"],
      ["ecelp7470", "audio/vnd.nuera.ecelp7470"],
      ["ecelp9600", "audio/vnd.nuera.ecelp9600"],
      ["edm", "application/vnd.novadigm.edm"],
      ["edx", "application/vnd.novadigm.edx"],
      ["efif", "application/vnd.picsel"],
      ["ei6", "application/vnd.pg.osasli"],
      ["el", "text/x-script.elisp"],
      ["elc", ["application/x-elc", "application/x-bytecode.elisp"]],
      ["eml", "message/rfc822"],
      ["emma", "application/emma+xml"],
      ["env", "application/x-envoy"],
      ["eol", "audio/vnd.digital-winds"],
      ["eot", "application/vnd.ms-fontobject"],
      ["eps", "application/postscript"],
      ["epub", "application/epub+zip"],
      ["es", ["application/ecmascript", "application/x-esrehber"]],
      ["es3", "application/vnd.eszigno3+xml"],
      ["esf", "application/vnd.epson.esf"],
      ["etx", "text/x-setext"],
      ["evy", ["application/envoy", "application/x-envoy"]],
      ["exe", ["application/octet-stream", "application/x-msdownload"]],
      ["exi", "application/exi"],
      ["ext", "application/vnd.novadigm.ext"],
      ["ez2", "application/vnd.ezpix-album"],
      ["ez3", "application/vnd.ezpix-package"],
      ["f", ["text/plain", "text/x-fortran"]],
      ["f4v", "video/x-f4v"],
      ["f77", "text/x-fortran"],
      ["f90", ["text/plain", "text/x-fortran"]],
      ["fbs", "image/vnd.fastbidsheet"],
      ["fcs", "application/vnd.isac.fcs"],
      ["fdf", "application/vnd.fdf"],
      ["fe_launch", "application/vnd.denovo.fcselayout-link"],
      ["fg5", "application/vnd.fujitsu.oasysgp"],
      ["fh", "image/x-freehand"],
      ["fif", ["application/fractals", "image/fif"]],
      ["fig", "application/x-xfig"],
      ["fli", ["video/fli", "video/x-fli"]],
      ["flo", ["image/florian", "application/vnd.micrografx.flo"]],
      ["flr", "x-world/x-vrml"],
      ["flv", "video/x-flv"],
      ["flw", "application/vnd.kde.kivio"],
      ["flx", "text/vnd.fmi.flexstor"],
      ["fly", "text/vnd.fly"],
      ["fm", "application/vnd.framemaker"],
      ["fmf", "video/x-atomic3d-feature"],
      ["fnc", "application/vnd.frogans.fnc"],
      ["for", ["text/plain", "text/x-fortran"]],
      ["fpx", ["image/vnd.fpx", "image/vnd.net-fpx"]],
      ["frl", "application/freeloader"],
      ["fsc", "application/vnd.fsc.weblaunch"],
      ["fst", "image/vnd.fst"],
      ["ftc", "application/vnd.fluxtime.clip"],
      ["fti", "application/vnd.anser-web-funds-transfer-initiation"],
      ["funk", "audio/make"],
      ["fvt", "video/vnd.fvt"],
      ["fxp", "application/vnd.adobe.fxp"],
      ["fzs", "application/vnd.fuzzysheet"],
      ["g", "text/plain"],
      ["g2w", "application/vnd.geoplan"],
      ["g3", "image/g3fax"],
      ["g3w", "application/vnd.geospace"],
      ["gac", "application/vnd.groove-account"],
      ["gdl", "model/vnd.gdl"],
      ["geo", "application/vnd.dynageo"],
      ["geojson", "application/geo+json"],
      ["gex", "application/vnd.geometry-explorer"],
      ["ggb", "application/vnd.geogebra.file"],
      ["ggt", "application/vnd.geogebra.tool"],
      ["ghf", "application/vnd.groove-help"],
      ["gif", "image/gif"],
      ["gim", "application/vnd.groove-identity-message"],
      ["gl", ["video/gl", "video/x-gl"]],
      ["gmx", "application/vnd.gmx"],
      ["gnumeric", "application/x-gnumeric"],
      ["gph", "application/vnd.flographit"],
      ["gqf", "application/vnd.grafeq"],
      ["gram", "application/srgs"],
      ["grv", "application/vnd.groove-injector"],
      ["grxml", "application/srgs+xml"],
      ["gsd", "audio/x-gsm"],
      ["gsf", "application/x-font-ghostscript"],
      ["gsm", "audio/x-gsm"],
      ["gsp", "application/x-gsp"],
      ["gss", "application/x-gss"],
      ["gtar", "application/x-gtar"],
      ["gtm", "application/vnd.groove-tool-message"],
      ["gtw", "model/vnd.gtw"],
      ["gv", "text/vnd.graphviz"],
      ["gxt", "application/vnd.geonext"],
      ["gz", ["application/x-gzip", "application/x-compressed"]],
      ["gzip", ["multipart/x-gzip", "application/x-gzip"]],
      ["h", ["text/plain", "text/x-h"]],
      ["h261", "video/h261"],
      ["h263", "video/h263"],
      ["h264", "video/h264"],
      ["hal", "application/vnd.hal+xml"],
      ["hbci", "application/vnd.hbci"],
      ["hdf", "application/x-hdf"],
      ["help", "application/x-helpfile"],
      ["hgl", "application/vnd.hp-hpgl"],
      ["hh", ["text/plain", "text/x-h"]],
      ["hlb", "text/x-script"],
      ["hlp", ["application/winhlp", "application/hlp", "application/x-helpfile", "application/x-winhelp"]],
      ["hpg", "application/vnd.hp-hpgl"],
      ["hpgl", "application/vnd.hp-hpgl"],
      ["hpid", "application/vnd.hp-hpid"],
      ["hps", "application/vnd.hp-hps"],
      [
        "hqx",
        [
          "application/mac-binhex40",
          "application/binhex",
          "application/binhex4",
          "application/mac-binhex",
          "application/x-binhex40",
          "application/x-mac-binhex40"
        ]
      ],
      ["hta", "application/hta"],
      ["htc", "text/x-component"],
      ["htke", "application/vnd.kenameaapp"],
      ["htm", "text/html"],
      ["html", "text/html"],
      ["htmls", "text/html"],
      ["htt", "text/webviewhtml"],
      ["htx", "text/html"],
      ["hvd", "application/vnd.yamaha.hv-dic"],
      ["hvp", "application/vnd.yamaha.hv-voice"],
      ["hvs", "application/vnd.yamaha.hv-script"],
      ["i2g", "application/vnd.intergeo"],
      ["icc", "application/vnd.iccprofile"],
      ["ice", "x-conference/x-cooltalk"],
      ["ico", "image/x-icon"],
      ["ics", "text/calendar"],
      ["idc", "text/plain"],
      ["ief", "image/ief"],
      ["iefs", "image/ief"],
      ["ifm", "application/vnd.shana.informed.formdata"],
      ["iges", ["application/iges", "model/iges"]],
      ["igl", "application/vnd.igloader"],
      ["igm", "application/vnd.insors.igm"],
      ["igs", ["application/iges", "model/iges"]],
      ["igx", "application/vnd.micrografx.igx"],
      ["iif", "application/vnd.shana.informed.interchange"],
      ["iii", "application/x-iphone"],
      ["ima", "application/x-ima"],
      ["imap", "application/x-httpd-imap"],
      ["imp", "application/vnd.accpac.simply.imp"],
      ["ims", "application/vnd.ms-ims"],
      ["inf", "application/inf"],
      ["ins", ["application/x-internet-signup", "application/x-internett-signup"]],
      ["ip", "application/x-ip2"],
      ["ipfix", "application/ipfix"],
      ["ipk", "application/vnd.shana.informed.package"],
      ["irm", "application/vnd.ibm.rights-management"],
      ["irp", "application/vnd.irepository.package+xml"],
      ["isp", "application/x-internet-signup"],
      ["isu", "video/x-isvideo"],
      ["it", "audio/it"],
      ["itp", "application/vnd.shana.informed.formtemplate"],
      ["iv", "application/x-inventor"],
      ["ivp", "application/vnd.immervision-ivp"],
      ["ivr", "i-world/i-vrml"],
      ["ivu", "application/vnd.immervision-ivu"],
      ["ivy", "application/x-livescreen"],
      ["jad", "text/vnd.sun.j2me.app-descriptor"],
      ["jam", ["application/vnd.jam", "audio/x-jam"]],
      ["jar", "application/java-archive"],
      ["jav", ["text/plain", "text/x-java-source"]],
      ["java", ["text/plain", "text/x-java-source,java", "text/x-java-source"]],
      ["jcm", "application/x-java-commerce"],
      ["jfif", ["image/pipeg", "image/jpeg", "image/pjpeg"]],
      ["jfif-tbnl", "image/jpeg"],
      ["jisp", "application/vnd.jisp"],
      ["jlt", "application/vnd.hp-jlyt"],
      ["jnlp", "application/x-java-jnlp-file"],
      ["joda", "application/vnd.joost.joda-archive"],
      ["jpe", ["image/jpeg", "image/pjpeg"]],
      ["jpeg", ["image/jpeg", "image/pjpeg"]],
      ["jpg", ["image/jpeg", "image/pjpeg"]],
      ["jpgv", "video/jpeg"],
      ["jpm", "video/jpm"],
      ["jps", "image/x-jps"],
      ["js", ["application/javascript", "application/ecmascript", "text/javascript", "text/ecmascript", "application/x-javascript"]],
      ["json", "application/json"],
      ["jut", "image/jutvision"],
      ["kar", ["audio/midi", "music/x-karaoke"]],
      ["karbon", "application/vnd.kde.karbon"],
      ["kfo", "application/vnd.kde.kformula"],
      ["kia", "application/vnd.kidspiration"],
      ["kml", "application/vnd.google-earth.kml+xml"],
      ["kmz", "application/vnd.google-earth.kmz"],
      ["kne", "application/vnd.kinar"],
      ["kon", "application/vnd.kde.kontour"],
      ["kpr", "application/vnd.kde.kpresenter"],
      ["ksh", ["application/x-ksh", "text/x-script.ksh"]],
      ["ksp", "application/vnd.kde.kspread"],
      ["ktx", "image/ktx"],
      ["ktz", "application/vnd.kahootz"],
      ["kwd", "application/vnd.kde.kword"],
      ["la", ["audio/nspaudio", "audio/x-nspaudio"]],
      ["lam", "audio/x-liveaudio"],
      ["lasxml", "application/vnd.las.las+xml"],
      ["latex", "application/x-latex"],
      ["lbd", "application/vnd.llamagraphics.life-balance.desktop"],
      ["lbe", "application/vnd.llamagraphics.life-balance.exchange+xml"],
      ["les", "application/vnd.hhe.lesson-player"],
      ["lha", ["application/octet-stream", "application/lha", "application/x-lha"]],
      ["lhx", "application/octet-stream"],
      ["link66", "application/vnd.route66.link66+xml"],
      ["list", "text/plain"],
      ["lma", ["audio/nspaudio", "audio/x-nspaudio"]],
      ["log", "text/plain"],
      ["lrm", "application/vnd.ms-lrm"],
      ["lsf", "video/x-la-asf"],
      ["lsp", ["application/x-lisp", "text/x-script.lisp"]],
      ["lst", "text/plain"],
      ["lsx", ["video/x-la-asf", "text/x-la-asf"]],
      ["ltf", "application/vnd.frogans.ltf"],
      ["ltx", "application/x-latex"],
      ["lvp", "audio/vnd.lucent.voice"],
      ["lwp", "application/vnd.lotus-wordpro"],
      ["lzh", ["application/octet-stream", "application/x-lzh"]],
      ["lzx", ["application/lzx", "application/octet-stream", "application/x-lzx"]],
      ["m", ["text/plain", "text/x-m"]],
      ["m13", "application/x-msmediaview"],
      ["m14", "application/x-msmediaview"],
      ["m1v", "video/mpeg"],
      ["m21", "application/mp21"],
      ["m2a", "audio/mpeg"],
      ["m2v", "video/mpeg"],
      ["m3u", ["audio/x-mpegurl", "audio/x-mpequrl"]],
      ["m3u8", "application/vnd.apple.mpegurl"],
      ["m4v", "video/x-m4v"],
      ["ma", "application/mathematica"],
      ["mads", "application/mads+xml"],
      ["mag", "application/vnd.ecowin.chart"],
      ["man", "application/x-troff-man"],
      ["map", "application/x-navimap"],
      ["mar", "text/plain"],
      ["mathml", "application/mathml+xml"],
      ["mbd", "application/mbedlet"],
      ["mbk", "application/vnd.mobius.mbk"],
      ["mbox", "application/mbox"],
      ["mc$", "application/x-magic-cap-package-1.0"],
      ["mc1", "application/vnd.medcalcdata"],
      ["mcd", ["application/mcad", "application/vnd.mcd", "application/x-mathcad"]],
      ["mcf", ["image/vasa", "text/mcf"]],
      ["mcp", "application/netmc"],
      ["mcurl", "text/vnd.curl.mcurl"],
      ["mdb", "application/x-msaccess"],
      ["mdi", "image/vnd.ms-modi"],
      ["me", "application/x-troff-me"],
      ["meta4", "application/metalink4+xml"],
      ["mets", "application/mets+xml"],
      ["mfm", "application/vnd.mfmp"],
      ["mgp", "application/vnd.osgeo.mapguide.package"],
      ["mgz", "application/vnd.proteus.magazine"],
      ["mht", "message/rfc822"],
      ["mhtml", "message/rfc822"],
      ["mid", ["audio/mid", "audio/midi", "music/crescendo", "x-music/x-midi", "audio/x-midi", "application/x-midi", "audio/x-mid"]],
      ["midi", ["audio/midi", "music/crescendo", "x-music/x-midi", "audio/x-midi", "application/x-midi", "audio/x-mid"]],
      ["mif", ["application/vnd.mif", "application/x-mif", "application/x-frame"]],
      ["mime", ["message/rfc822", "www/mime"]],
      ["mj2", "video/mj2"],
      ["mjf", "audio/x-vnd.audioexplosion.mjuicemediafile"],
      ["mjpg", "video/x-motion-jpeg"],
      ["mlp", "application/vnd.dolby.mlp"],
      ["mm", ["application/base64", "application/x-meme"]],
      ["mmd", "application/vnd.chipnuts.karaoke-mmd"],
      ["mme", "application/base64"],
      ["mmf", "application/vnd.smaf"],
      ["mmr", "image/vnd.fujixerox.edmics-mmr"],
      ["mny", "application/x-msmoney"],
      ["mod", ["audio/mod", "audio/x-mod"]],
      ["mods", "application/mods+xml"],
      ["moov", "video/quicktime"],
      ["mov", "video/quicktime"],
      ["movie", "video/x-sgi-movie"],
      ["mp2", ["video/mpeg", "audio/mpeg", "video/x-mpeg", "audio/x-mpeg", "video/x-mpeq2a"]],
      ["mp3", ["audio/mpeg", "audio/mpeg3", "video/mpeg", "audio/x-mpeg-3", "video/x-mpeg"]],
      ["mp4", ["video/mp4", "application/mp4"]],
      ["mp4a", "audio/mp4"],
      ["mpa", ["video/mpeg", "audio/mpeg"]],
      ["mpc", ["application/vnd.mophun.certificate", "application/x-project"]],
      ["mpe", "video/mpeg"],
      ["mpeg", "video/mpeg"],
      ["mpg", ["video/mpeg", "audio/mpeg"]],
      ["mpga", "audio/mpeg"],
      ["mpkg", "application/vnd.apple.installer+xml"],
      ["mpm", "application/vnd.blueice.multipass"],
      ["mpn", "application/vnd.mophun.application"],
      ["mpp", "application/vnd.ms-project"],
      ["mpt", "application/x-project"],
      ["mpv", "application/x-project"],
      ["mpv2", "video/mpeg"],
      ["mpx", "application/x-project"],
      ["mpy", "application/vnd.ibm.minipay"],
      ["mqy", "application/vnd.mobius.mqy"],
      ["mrc", "application/marc"],
      ["mrcx", "application/marcxml+xml"],
      ["ms", "application/x-troff-ms"],
      ["mscml", "application/mediaservercontrol+xml"],
      ["mseq", "application/vnd.mseq"],
      ["msf", "application/vnd.epson.msf"],
      ["msg", "application/vnd.ms-outlook"],
      ["msh", "model/mesh"],
      ["msl", "application/vnd.mobius.msl"],
      ["msty", "application/vnd.muvee.style"],
      ["mts", "model/vnd.mts"],
      ["mus", "application/vnd.musician"],
      ["musicxml", "application/vnd.recordare.musicxml+xml"],
      ["mv", "video/x-sgi-movie"],
      ["mvb", "application/x-msmediaview"],
      ["mwf", "application/vnd.mfer"],
      ["mxf", "application/mxf"],
      ["mxl", "application/vnd.recordare.musicxml"],
      ["mxml", "application/xv+xml"],
      ["mxs", "application/vnd.triscape.mxs"],
      ["mxu", "video/vnd.mpegurl"],
      ["my", "audio/make"],
      ["mzz", "application/x-vnd.audioexplosion.mzz"],
      ["n-gage", "application/vnd.nokia.n-gage.symbian.install"],
      ["n3", "text/n3"],
      ["nap", "image/naplps"],
      ["naplps", "image/naplps"],
      ["nbp", "application/vnd.wolfram.player"],
      ["nc", "application/x-netcdf"],
      ["ncm", "application/vnd.nokia.configuration-message"],
      ["ncx", "application/x-dtbncx+xml"],
      ["ngdat", "application/vnd.nokia.n-gage.data"],
      ["nif", "image/x-niff"],
      ["niff", "image/x-niff"],
      ["nix", "application/x-mix-transfer"],
      ["nlu", "application/vnd.neurolanguage.nlu"],
      ["nml", "application/vnd.enliven"],
      ["nnd", "application/vnd.noblenet-directory"],
      ["nns", "application/vnd.noblenet-sealer"],
      ["nnw", "application/vnd.noblenet-web"],
      ["npx", "image/vnd.net-fpx"],
      ["nsc", "application/x-conference"],
      ["nsf", "application/vnd.lotus-notes"],
      ["nvd", "application/x-navidoc"],
      ["nws", "message/rfc822"],
      ["o", "application/octet-stream"],
      ["oa2", "application/vnd.fujitsu.oasys2"],
      ["oa3", "application/vnd.fujitsu.oasys3"],
      ["oas", "application/vnd.fujitsu.oasys"],
      ["obd", "application/x-msbinder"],
      ["oda", "application/oda"],
      ["odb", "application/vnd.oasis.opendocument.database"],
      ["odc", "application/vnd.oasis.opendocument.chart"],
      ["odf", "application/vnd.oasis.opendocument.formula"],
      ["odft", "application/vnd.oasis.opendocument.formula-template"],
      ["odg", "application/vnd.oasis.opendocument.graphics"],
      ["odi", "application/vnd.oasis.opendocument.image"],
      ["odm", "application/vnd.oasis.opendocument.text-master"],
      ["odp", "application/vnd.oasis.opendocument.presentation"],
      ["ods", "application/vnd.oasis.opendocument.spreadsheet"],
      ["odt", "application/vnd.oasis.opendocument.text"],
      ["oga", "audio/ogg"],
      ["ogv", "video/ogg"],
      ["ogx", "application/ogg"],
      ["omc", "application/x-omc"],
      ["omcd", "application/x-omcdatamaker"],
      ["omcr", "application/x-omcregerator"],
      ["onetoc", "application/onenote"],
      ["opf", "application/oebps-package+xml"],
      ["org", "application/vnd.lotus-organizer"],
      ["osf", "application/vnd.yamaha.openscoreformat"],
      ["osfpvg", "application/vnd.yamaha.openscoreformat.osfpvg+xml"],
      ["otc", "application/vnd.oasis.opendocument.chart-template"],
      ["otf", "application/x-font-otf"],
      ["otg", "application/vnd.oasis.opendocument.graphics-template"],
      ["oth", "application/vnd.oasis.opendocument.text-web"],
      ["oti", "application/vnd.oasis.opendocument.image-template"],
      ["otp", "application/vnd.oasis.opendocument.presentation-template"],
      ["ots", "application/vnd.oasis.opendocument.spreadsheet-template"],
      ["ott", "application/vnd.oasis.opendocument.text-template"],
      ["oxt", "application/vnd.openofficeorg.extension"],
      ["p", "text/x-pascal"],
      ["p10", ["application/pkcs10", "application/x-pkcs10"]],
      ["p12", ["application/pkcs-12", "application/x-pkcs12"]],
      ["p7a", "application/x-pkcs7-signature"],
      ["p7b", "application/x-pkcs7-certificates"],
      ["p7c", ["application/pkcs7-mime", "application/x-pkcs7-mime"]],
      ["p7m", ["application/pkcs7-mime", "application/x-pkcs7-mime"]],
      ["p7r", "application/x-pkcs7-certreqresp"],
      ["p7s", ["application/pkcs7-signature", "application/x-pkcs7-signature"]],
      ["p8", "application/pkcs8"],
      ["par", "text/plain-bas"],
      ["part", "application/pro_eng"],
      ["pas", "text/pascal"],
      ["paw", "application/vnd.pawaafile"],
      ["pbd", "application/vnd.powerbuilder6"],
      ["pbm", "image/x-portable-bitmap"],
      ["pcf", "application/x-font-pcf"],
      ["pcl", ["application/vnd.hp-pcl", "application/x-pcl"]],
      ["pclxl", "application/vnd.hp-pclxl"],
      ["pct", "image/x-pict"],
      ["pcurl", "application/vnd.curl.pcurl"],
      ["pcx", "image/x-pcx"],
      ["pdb", ["application/vnd.palm", "chemical/x-pdb"]],
      ["pdf", "application/pdf"],
      ["pfa", "application/x-font-type1"],
      ["pfr", "application/font-tdpfr"],
      ["pfunk", ["audio/make", "audio/make.my.funk"]],
      ["pfx", "application/x-pkcs12"],
      ["pgm", ["image/x-portable-graymap", "image/x-portable-greymap"]],
      ["pgn", "application/x-chess-pgn"],
      ["pgp", "application/pgp-signature"],
      ["pic", ["image/pict", "image/x-pict"]],
      ["pict", "image/pict"],
      ["pkg", "application/x-newton-compatible-pkg"],
      ["pki", "application/pkixcmp"],
      ["pkipath", "application/pkix-pkipath"],
      ["pko", ["application/ynd.ms-pkipko", "application/vnd.ms-pki.pko"]],
      ["pl", ["text/plain", "text/x-script.perl"]],
      ["plb", "application/vnd.3gpp.pic-bw-large"],
      ["plc", "application/vnd.mobius.plc"],
      ["plf", "application/vnd.pocketlearn"],
      ["pls", "application/pls+xml"],
      ["plx", "application/x-pixclscript"],
      ["pm", ["text/x-script.perl-module", "image/x-xpixmap"]],
      ["pm4", "application/x-pagemaker"],
      ["pm5", "application/x-pagemaker"],
      ["pma", "application/x-perfmon"],
      ["pmc", "application/x-perfmon"],
      ["pml", ["application/vnd.ctc-posml", "application/x-perfmon"]],
      ["pmr", "application/x-perfmon"],
      ["pmw", "application/x-perfmon"],
      ["png", "image/png"],
      ["pnm", ["application/x-portable-anymap", "image/x-portable-anymap"]],
      ["portpkg", "application/vnd.macports.portpkg"],
      ["pot", ["application/vnd.ms-powerpoint", "application/mspowerpoint"]],
      ["potm", "application/vnd.ms-powerpoint.template.macroenabled.12"],
      ["potx", "application/vnd.openxmlformats-officedocument.presentationml.template"],
      ["pov", "model/x-pov"],
      ["ppa", "application/vnd.ms-powerpoint"],
      ["ppam", "application/vnd.ms-powerpoint.addin.macroenabled.12"],
      ["ppd", "application/vnd.cups-ppd"],
      ["ppm", "image/x-portable-pixmap"],
      ["pps", ["application/vnd.ms-powerpoint", "application/mspowerpoint"]],
      ["ppsm", "application/vnd.ms-powerpoint.slideshow.macroenabled.12"],
      ["ppsx", "application/vnd.openxmlformats-officedocument.presentationml.slideshow"],
      ["ppt", ["application/vnd.ms-powerpoint", "application/mspowerpoint", "application/powerpoint", "application/x-mspowerpoint"]],
      ["pptm", "application/vnd.ms-powerpoint.presentation.macroenabled.12"],
      ["pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation"],
      ["ppz", "application/mspowerpoint"],
      ["prc", "application/x-mobipocket-ebook"],
      ["pre", ["application/vnd.lotus-freelance", "application/x-freelance"]],
      ["prf", "application/pics-rules"],
      ["prt", "application/pro_eng"],
      ["ps", "application/postscript"],
      ["psb", "application/vnd.3gpp.pic-bw-small"],
      ["psd", ["application/octet-stream", "image/vnd.adobe.photoshop"]],
      ["psf", "application/x-font-linux-psf"],
      ["pskcxml", "application/pskc+xml"],
      ["ptid", "application/vnd.pvi.ptid1"],
      ["pub", "application/x-mspublisher"],
      ["pvb", "application/vnd.3gpp.pic-bw-var"],
      ["pvu", "paleovu/x-pv"],
      ["pwn", "application/vnd.3m.post-it-notes"],
      ["pwz", "application/vnd.ms-powerpoint"],
      ["py", "text/x-script.phyton"],
      ["pya", "audio/vnd.ms-playready.media.pya"],
      ["pyc", "application/x-bytecode.python"],
      ["pyv", "video/vnd.ms-playready.media.pyv"],
      ["qam", "application/vnd.epson.quickanime"],
      ["qbo", "application/vnd.intu.qbo"],
      ["qcp", "audio/vnd.qcelp"],
      ["qd3", "x-world/x-3dmf"],
      ["qd3d", "x-world/x-3dmf"],
      ["qfx", "application/vnd.intu.qfx"],
      ["qif", "image/x-quicktime"],
      ["qps", "application/vnd.publishare-delta-tree"],
      ["qt", "video/quicktime"],
      ["qtc", "video/x-qtc"],
      ["qti", "image/x-quicktime"],
      ["qtif", "image/x-quicktime"],
      ["qxd", "application/vnd.quark.quarkxpress"],
      ["ra", ["audio/x-realaudio", "audio/x-pn-realaudio", "audio/x-pn-realaudio-plugin"]],
      ["ram", "audio/x-pn-realaudio"],
      ["rar", "application/x-rar-compressed"],
      ["ras", ["image/cmu-raster", "application/x-cmu-raster", "image/x-cmu-raster"]],
      ["rast", "image/cmu-raster"],
      ["rcprofile", "application/vnd.ipunplugged.rcprofile"],
      ["rdf", "application/rdf+xml"],
      ["rdz", "application/vnd.data-vision.rdz"],
      ["rep", "application/vnd.businessobjects"],
      ["res", "application/x-dtbresource+xml"],
      ["rexx", "text/x-script.rexx"],
      ["rf", "image/vnd.rn-realflash"],
      ["rgb", "image/x-rgb"],
      ["rif", "application/reginfo+xml"],
      ["rip", "audio/vnd.rip"],
      ["rl", "application/resource-lists+xml"],
      ["rlc", "image/vnd.fujixerox.edmics-rlc"],
      ["rld", "application/resource-lists-diff+xml"],
      ["rm", ["application/vnd.rn-realmedia", "audio/x-pn-realaudio"]],
      ["rmi", "audio/mid"],
      ["rmm", "audio/x-pn-realaudio"],
      ["rmp", ["audio/x-pn-realaudio-plugin", "audio/x-pn-realaudio"]],
      ["rms", "application/vnd.jcp.javame.midlet-rms"],
      ["rnc", "application/relax-ng-compact-syntax"],
      ["rng", ["application/ringing-tones", "application/vnd.nokia.ringing-tone"]],
      ["rnx", "application/vnd.rn-realplayer"],
      ["roff", "application/x-troff"],
      ["rp", "image/vnd.rn-realpix"],
      ["rp9", "application/vnd.cloanto.rp9"],
      ["rpm", "audio/x-pn-realaudio-plugin"],
      ["rpss", "application/vnd.nokia.radio-presets"],
      ["rpst", "application/vnd.nokia.radio-preset"],
      ["rq", "application/sparql-query"],
      ["rs", "application/rls-services+xml"],
      ["rsd", "application/rsd+xml"],
      ["rt", ["text/richtext", "text/vnd.rn-realtext"]],
      ["rtf", ["application/rtf", "text/richtext", "application/x-rtf"]],
      ["rtx", ["text/richtext", "application/rtf"]],
      ["rv", "video/vnd.rn-realvideo"],
      ["s", "text/x-asm"],
      ["s3m", "audio/s3m"],
      ["saf", "application/vnd.yamaha.smaf-audio"],
      ["saveme", "application/octet-stream"],
      ["sbk", "application/x-tbook"],
      ["sbml", "application/sbml+xml"],
      ["sc", "application/vnd.ibm.secure-container"],
      ["scd", "application/x-msschedule"],
      ["scm", ["application/vnd.lotus-screencam", "video/x-scm", "text/x-script.guile", "application/x-lotusscreencam", "text/x-script.scheme"]],
      ["scq", "application/scvp-cv-request"],
      ["scs", "application/scvp-cv-response"],
      ["sct", "text/scriptlet"],
      ["scurl", "text/vnd.curl.scurl"],
      ["sda", "application/vnd.stardivision.draw"],
      ["sdc", "application/vnd.stardivision.calc"],
      ["sdd", "application/vnd.stardivision.impress"],
      ["sdkm", "application/vnd.solent.sdkm+xml"],
      ["sdml", "text/plain"],
      ["sdp", ["application/sdp", "application/x-sdp"]],
      ["sdr", "application/sounder"],
      ["sdw", "application/vnd.stardivision.writer"],
      ["sea", ["application/sea", "application/x-sea"]],
      ["see", "application/vnd.seemail"],
      ["seed", "application/vnd.fdsn.seed"],
      ["sema", "application/vnd.sema"],
      ["semd", "application/vnd.semd"],
      ["semf", "application/vnd.semf"],
      ["ser", "application/java-serialized-object"],
      ["set", "application/set"],
      ["setpay", "application/set-payment-initiation"],
      ["setreg", "application/set-registration-initiation"],
      ["sfd-hdstx", "application/vnd.hydrostatix.sof-data"],
      ["sfs", "application/vnd.spotfire.sfs"],
      ["sgl", "application/vnd.stardivision.writer-global"],
      ["sgm", ["text/sgml", "text/x-sgml"]],
      ["sgml", ["text/sgml", "text/x-sgml"]],
      ["sh", ["application/x-shar", "application/x-bsh", "application/x-sh", "text/x-script.sh"]],
      ["shar", ["application/x-bsh", "application/x-shar"]],
      ["shf", "application/shf+xml"],
      ["shtml", ["text/html", "text/x-server-parsed-html"]],
      ["sid", "audio/x-psid"],
      ["sis", "application/vnd.symbian.install"],
      ["sit", ["application/x-stuffit", "application/x-sit"]],
      ["sitx", "application/x-stuffitx"],
      ["skd", "application/x-koan"],
      ["skm", "application/x-koan"],
      ["skp", ["application/vnd.koan", "application/x-koan"]],
      ["skt", "application/x-koan"],
      ["sl", "application/x-seelogo"],
      ["sldm", "application/vnd.ms-powerpoint.slide.macroenabled.12"],
      ["sldx", "application/vnd.openxmlformats-officedocument.presentationml.slide"],
      ["slt", "application/vnd.epson.salt"],
      ["sm", "application/vnd.stepmania.stepchart"],
      ["smf", "application/vnd.stardivision.math"],
      ["smi", ["application/smil", "application/smil+xml"]],
      ["smil", "application/smil"],
      ["snd", ["audio/basic", "audio/x-adpcm"]],
      ["snf", "application/x-font-snf"],
      ["sol", "application/solids"],
      ["spc", ["text/x-speech", "application/x-pkcs7-certificates"]],
      ["spf", "application/vnd.yamaha.smaf-phrase"],
      ["spl", ["application/futuresplash", "application/x-futuresplash"]],
      ["spot", "text/vnd.in3d.spot"],
      ["spp", "application/scvp-vp-response"],
      ["spq", "application/scvp-vp-request"],
      ["spr", "application/x-sprite"],
      ["sprite", "application/x-sprite"],
      ["src", "application/x-wais-source"],
      ["sru", "application/sru+xml"],
      ["srx", "application/sparql-results+xml"],
      ["sse", "application/vnd.kodak-descriptor"],
      ["ssf", "application/vnd.epson.ssf"],
      ["ssi", "text/x-server-parsed-html"],
      ["ssm", "application/streamingmedia"],
      ["ssml", "application/ssml+xml"],
      ["sst", ["application/vnd.ms-pkicertstore", "application/vnd.ms-pki.certstore"]],
      ["st", "application/vnd.sailingtracker.track"],
      ["stc", "application/vnd.sun.xml.calc.template"],
      ["std", "application/vnd.sun.xml.draw.template"],
      ["step", "application/step"],
      ["stf", "application/vnd.wt.stf"],
      ["sti", "application/vnd.sun.xml.impress.template"],
      ["stk", "application/hyperstudio"],
      ["stl", ["application/vnd.ms-pkistl", "application/sla", "application/vnd.ms-pki.stl", "application/x-navistyle"]],
      ["stm", "text/html"],
      ["stp", "application/step"],
      ["str", "application/vnd.pg.format"],
      ["stw", "application/vnd.sun.xml.writer.template"],
      ["sub", "image/vnd.dvb.subtitle"],
      ["sus", "application/vnd.sus-calendar"],
      ["sv4cpio", "application/x-sv4cpio"],
      ["sv4crc", "application/x-sv4crc"],
      ["svc", "application/vnd.dvb.service"],
      ["svd", "application/vnd.svd"],
      ["svf", ["image/vnd.dwg", "image/x-dwg"]],
      ["svg", "image/svg+xml"],
      ["svr", ["x-world/x-svr", "application/x-world"]],
      ["swf", "application/x-shockwave-flash"],
      ["swi", "application/vnd.aristanetworks.swi"],
      ["sxc", "application/vnd.sun.xml.calc"],
      ["sxd", "application/vnd.sun.xml.draw"],
      ["sxg", "application/vnd.sun.xml.writer.global"],
      ["sxi", "application/vnd.sun.xml.impress"],
      ["sxm", "application/vnd.sun.xml.math"],
      ["sxw", "application/vnd.sun.xml.writer"],
      ["t", ["text/troff", "application/x-troff"]],
      ["talk", "text/x-speech"],
      ["tao", "application/vnd.tao.intent-module-archive"],
      ["tar", "application/x-tar"],
      ["tbk", ["application/toolbook", "application/x-tbook"]],
      ["tcap", "application/vnd.3gpp2.tcap"],
      ["tcl", ["text/x-script.tcl", "application/x-tcl"]],
      ["tcsh", "text/x-script.tcsh"],
      ["teacher", "application/vnd.smart.teacher"],
      ["tei", "application/tei+xml"],
      ["tex", "application/x-tex"],
      ["texi", "application/x-texinfo"],
      ["texinfo", "application/x-texinfo"],
      ["text", ["application/plain", "text/plain"]],
      ["tfi", "application/thraud+xml"],
      ["tfm", "application/x-tex-tfm"],
      ["tgz", ["application/gnutar", "application/x-compressed"]],
      ["thmx", "application/vnd.ms-officetheme"],
      ["tif", ["image/tiff", "image/x-tiff"]],
      ["tiff", ["image/tiff", "image/x-tiff"]],
      ["tmo", "application/vnd.tmobile-livetv"],
      ["torrent", "application/x-bittorrent"],
      ["tpl", "application/vnd.groove-tool-template"],
      ["tpt", "application/vnd.trid.tpt"],
      ["tr", "application/x-troff"],
      ["tra", "application/vnd.trueapp"],
      ["trm", "application/x-msterminal"],
      ["tsd", "application/timestamped-data"],
      ["tsi", "audio/tsp-audio"],
      ["tsp", ["application/dsptype", "audio/tsplayer"]],
      ["tsv", "text/tab-separated-values"],
      ["ttf", "application/x-font-ttf"],
      ["ttl", "text/turtle"],
      ["turbot", "image/florian"],
      ["twd", "application/vnd.simtech-mindmapper"],
      ["txd", "application/vnd.genomatix.tuxedo"],
      ["txf", "application/vnd.mobius.txf"],
      ["txt", "text/plain"],
      ["ufd", "application/vnd.ufdl"],
      ["uil", "text/x-uil"],
      ["uls", "text/iuls"],
      ["umj", "application/vnd.umajin"],
      ["uni", "text/uri-list"],
      ["unis", "text/uri-list"],
      ["unityweb", "application/vnd.unity"],
      ["unv", "application/i-deas"],
      ["uoml", "application/vnd.uoml+xml"],
      ["uri", "text/uri-list"],
      ["uris", "text/uri-list"],
      ["ustar", ["application/x-ustar", "multipart/x-ustar"]],
      ["utz", "application/vnd.uiq.theme"],
      ["uu", ["application/octet-stream", "text/x-uuencode"]],
      ["uue", "text/x-uuencode"],
      ["uva", "audio/vnd.dece.audio"],
      ["uvh", "video/vnd.dece.hd"],
      ["uvi", "image/vnd.dece.graphic"],
      ["uvm", "video/vnd.dece.mobile"],
      ["uvp", "video/vnd.dece.pd"],
      ["uvs", "video/vnd.dece.sd"],
      ["uvu", "video/vnd.uvvu.mp4"],
      ["uvv", "video/vnd.dece.video"],
      ["vcd", "application/x-cdlink"],
      ["vcf", "text/x-vcard"],
      ["vcg", "application/vnd.groove-vcard"],
      ["vcs", "text/x-vcalendar"],
      ["vcx", "application/vnd.vcx"],
      ["vda", "application/vda"],
      ["vdo", "video/vdo"],
      ["vew", "application/groupwise"],
      ["vis", "application/vnd.visionary"],
      ["viv", ["video/vivo", "video/vnd.vivo"]],
      ["vivo", ["video/vivo", "video/vnd.vivo"]],
      ["vmd", "application/vocaltec-media-desc"],
      ["vmf", "application/vocaltec-media-file"],
      ["voc", ["audio/voc", "audio/x-voc"]],
      ["vos", "video/vosaic"],
      ["vox", "audio/voxware"],
      ["vqe", "audio/x-twinvq-plugin"],
      ["vqf", "audio/x-twinvq"],
      ["vql", "audio/x-twinvq-plugin"],
      ["vrml", ["model/vrml", "x-world/x-vrml", "application/x-vrml"]],
      ["vrt", "x-world/x-vrt"],
      ["vsd", ["application/vnd.visio", "application/x-visio"]],
      ["vsf", "application/vnd.vsf"],
      ["vst", "application/x-visio"],
      ["vsw", "application/x-visio"],
      ["vtu", "model/vnd.vtu"],
      ["vxml", "application/voicexml+xml"],
      ["w60", "application/wordperfect6.0"],
      ["w61", "application/wordperfect6.1"],
      ["w6w", "application/msword"],
      ["wad", "application/x-doom"],
      ["wav", ["audio/wav", "audio/x-wav"]],
      ["wax", "audio/x-ms-wax"],
      ["wb1", "application/x-qpro"],
      ["wbmp", "image/vnd.wap.wbmp"],
      ["wbs", "application/vnd.criticaltools.wbs+xml"],
      ["wbxml", "application/vnd.wap.wbxml"],
      ["wcm", "application/vnd.ms-works"],
      ["wdb", "application/vnd.ms-works"],
      ["web", "application/vnd.xara"],
      ["weba", "audio/webm"],
      ["webm", "video/webm"],
      ["webp", "image/webp"],
      ["wg", "application/vnd.pmi.widget"],
      ["wgt", "application/widget"],
      ["wiz", "application/msword"],
      ["wk1", "application/x-123"],
      ["wks", "application/vnd.ms-works"],
      ["wm", "video/x-ms-wm"],
      ["wma", "audio/x-ms-wma"],
      ["wmd", "application/x-ms-wmd"],
      ["wmf", ["windows/metafile", "application/x-msmetafile"]],
      ["wml", "text/vnd.wap.wml"],
      ["wmlc", "application/vnd.wap.wmlc"],
      ["wmls", "text/vnd.wap.wmlscript"],
      ["wmlsc", "application/vnd.wap.wmlscriptc"],
      ["wmv", "video/x-ms-wmv"],
      ["wmx", "video/x-ms-wmx"],
      ["wmz", "application/x-ms-wmz"],
      ["woff", "application/x-font-woff"],
      ["word", "application/msword"],
      ["wp", "application/wordperfect"],
      ["wp5", ["application/wordperfect", "application/wordperfect6.0"]],
      ["wp6", "application/wordperfect"],
      ["wpd", ["application/wordperfect", "application/vnd.wordperfect", "application/x-wpwin"]],
      ["wpl", "application/vnd.ms-wpl"],
      ["wps", "application/vnd.ms-works"],
      ["wq1", "application/x-lotus"],
      ["wqd", "application/vnd.wqd"],
      ["wri", ["application/mswrite", "application/x-wri", "application/x-mswrite"]],
      ["wrl", ["model/vrml", "x-world/x-vrml", "application/x-world"]],
      ["wrz", ["model/vrml", "x-world/x-vrml"]],
      ["wsc", "text/scriplet"],
      ["wsdl", "application/wsdl+xml"],
      ["wspolicy", "application/wspolicy+xml"],
      ["wsrc", "application/x-wais-source"],
      ["wtb", "application/vnd.webturbo"],
      ["wtk", "application/x-wintalk"],
      ["wvx", "video/x-ms-wvx"],
      ["x-png", "image/png"],
      ["x3d", "application/vnd.hzn-3d-crossword"],
      ["xaf", "x-world/x-vrml"],
      ["xap", "application/x-silverlight-app"],
      ["xar", "application/vnd.xara"],
      ["xbap", "application/x-ms-xbap"],
      ["xbd", "application/vnd.fujixerox.docuworks.binder"],
      ["xbm", ["image/xbm", "image/x-xbm", "image/x-xbitmap"]],
      ["xdf", "application/xcap-diff+xml"],
      ["xdm", "application/vnd.syncml.dm+xml"],
      ["xdp", "application/vnd.adobe.xdp+xml"],
      ["xdr", "video/x-amt-demorun"],
      ["xdssc", "application/dssc+xml"],
      ["xdw", "application/vnd.fujixerox.docuworks"],
      ["xenc", "application/xenc+xml"],
      ["xer", "application/patch-ops-error+xml"],
      ["xfdf", "application/vnd.adobe.xfdf"],
      ["xfdl", "application/vnd.xfdl"],
      ["xgz", "xgl/drawing"],
      ["xhtml", "application/xhtml+xml"],
      ["xif", "image/vnd.xiff"],
      ["xl", "application/excel"],
      ["xla", ["application/vnd.ms-excel", "application/excel", "application/x-msexcel", "application/x-excel"]],
      ["xlam", "application/vnd.ms-excel.addin.macroenabled.12"],
      ["xlb", ["application/excel", "application/vnd.ms-excel", "application/x-excel"]],
      ["xlc", ["application/vnd.ms-excel", "application/excel", "application/x-excel"]],
      ["xld", ["application/excel", "application/x-excel"]],
      ["xlk", ["application/excel", "application/x-excel"]],
      ["xll", ["application/excel", "application/vnd.ms-excel", "application/x-excel"]],
      ["xlm", ["application/vnd.ms-excel", "application/excel", "application/x-excel"]],
      ["xls", ["application/vnd.ms-excel", "application/excel", "application/x-msexcel", "application/x-excel"]],
      ["xlsb", "application/vnd.ms-excel.sheet.binary.macroenabled.12"],
      ["xlsm", "application/vnd.ms-excel.sheet.macroenabled.12"],
      ["xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
      ["xlt", ["application/vnd.ms-excel", "application/excel", "application/x-excel"]],
      ["xltm", "application/vnd.ms-excel.template.macroenabled.12"],
      ["xltx", "application/vnd.openxmlformats-officedocument.spreadsheetml.template"],
      ["xlv", ["application/excel", "application/x-excel"]],
      ["xlw", ["application/vnd.ms-excel", "application/excel", "application/x-msexcel", "application/x-excel"]],
      ["xm", "audio/xm"],
      ["xml", ["application/xml", "text/xml", "application/atom+xml", "application/rss+xml"]],
      ["xmz", "xgl/movie"],
      ["xo", "application/vnd.olpc-sugar"],
      ["xof", "x-world/x-vrml"],
      ["xop", "application/xop+xml"],
      ["xpi", "application/x-xpinstall"],
      ["xpix", "application/x-vnd.ls-xpix"],
      ["xpm", ["image/xpm", "image/x-xpixmap"]],
      ["xpr", "application/vnd.is-xpr"],
      ["xps", "application/vnd.ms-xpsdocument"],
      ["xpw", "application/vnd.intercon.formnet"],
      ["xslt", "application/xslt+xml"],
      ["xsm", "application/vnd.syncml+xml"],
      ["xspf", "application/xspf+xml"],
      ["xsr", "video/x-amt-showrun"],
      ["xul", "application/vnd.mozilla.xul+xml"],
      ["xwd", ["image/x-xwd", "image/x-xwindowdump"]],
      ["xyz", ["chemical/x-xyz", "chemical/x-pdb"]],
      ["yang", "application/yang"],
      ["yin", "application/yin+xml"],
      ["z", ["application/x-compressed", "application/x-compress"]],
      ["zaz", "application/vnd.zzazz.deck+xml"],
      ["zip", ["application/zip", "multipart/x-zip", "application/x-zip-compressed", "application/x-compressed"]],
      ["zir", "application/vnd.zul"],
      ["zmm", "application/vnd.handheld-entertainment+xml"],
      ["zoo", "application/octet-stream"],
      ["zsh", "text/x-script.zsh"]
    ]);
    module.exports = {
      detectMimeType(filename) {
        if (!filename) {
          return defaultMimeType;
        }
        let parsed = path.parse(filename);
        let extension = (parsed.ext.substr(1) || parsed.name || "").split("?").shift().trim().toLowerCase();
        let value = defaultMimeType;
        if (extensions.has(extension)) {
          value = extensions.get(extension);
        }
        if (Array.isArray(value)) {
          return value[0];
        }
        return value;
      },
      detectExtension(mimeType) {
        if (!mimeType) {
          return defaultExtension;
        }
        let parts = (mimeType || "").toLowerCase().trim().split("/");
        let rootType = parts.shift().trim();
        let subType = parts.join("/").trim();
        if (mimeTypes.has(rootType + "/" + subType)) {
          let value = mimeTypes.get(rootType + "/" + subType);
          if (Array.isArray(value)) {
            return value[0];
          }
          return value;
        }
        switch (rootType) {
          case "text":
            return "txt";
          default:
            return "bin";
        }
      }
    };
  }
});

// node_modules/nodemailer/lib/punycode/index.js
var require_punycode = __commonJS({
  "node_modules/nodemailer/lib/punycode/index.js"(exports, module) {
    "use strict";
    var maxInt = 2147483647;
    var base = 36;
    var tMin = 1;
    var tMax = 26;
    var skew = 38;
    var damp = 700;
    var initialBias = 72;
    var initialN = 128;
    var delimiter = "-";
    var regexPunycode = /^xn--/;
    var regexNonASCII = /[^\0-\x7F]/;
    var regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g;
    var errors = {
      overflow: "Overflow: input needs wider integers to process",
      "not-basic": "Illegal input >= 0x80 (not a basic code point)",
      "invalid-input": "Invalid input"
    };
    var baseMinusTMin = base - tMin;
    var floor = Math.floor;
    var stringFromCharCode = String.fromCharCode;
    function error(type) {
      throw new RangeError(errors[type]);
    }
    function map(array, callback) {
      const result = [];
      let length = array.length;
      while (length--) {
        result[length] = callback(array[length]);
      }
      return result;
    }
    function mapDomain(domain, callback) {
      const parts = domain.split("@");
      let result = "";
      if (parts.length > 1) {
        result = parts[0] + "@";
        domain = parts[1];
      }
      domain = domain.replace(regexSeparators, ".");
      const labels = domain.split(".");
      const encoded = map(labels, callback).join(".");
      return result + encoded;
    }
    function ucs2decode(string) {
      const output = [];
      let counter = 0;
      const length = string.length;
      while (counter < length) {
        const value = string.charCodeAt(counter++);
        if (value >= 55296 && value <= 56319 && counter < length) {
          const extra = string.charCodeAt(counter++);
          if ((extra & 64512) == 56320) {
            output.push(((value & 1023) << 10) + (extra & 1023) + 65536);
          } else {
            output.push(value);
            counter--;
          }
        } else {
          output.push(value);
        }
      }
      return output;
    }
    var ucs2encode = (codePoints) => String.fromCodePoint(...codePoints);
    var basicToDigit = function(codePoint) {
      if (codePoint >= 48 && codePoint < 58) {
        return 26 + (codePoint - 48);
      }
      if (codePoint >= 65 && codePoint < 91) {
        return codePoint - 65;
      }
      if (codePoint >= 97 && codePoint < 123) {
        return codePoint - 97;
      }
      return base;
    };
    var digitToBasic = function(digit, flag) {
      return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
    };
    var adapt = function(delta, numPoints, firstTime) {
      let k = 0;
      delta = firstTime ? floor(delta / damp) : delta >> 1;
      delta += floor(delta / numPoints);
      for (
        ;
        /* no initialization */
        delta > baseMinusTMin * tMax >> 1;
        k += base
      ) {
        delta = floor(delta / baseMinusTMin);
      }
      return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
    };
    var decode2 = function(input) {
      const output = [];
      const inputLength = input.length;
      let i = 0;
      let n = initialN;
      let bias = initialBias;
      let basic = input.lastIndexOf(delimiter);
      if (basic < 0) {
        basic = 0;
      }
      for (let j = 0; j < basic; ++j) {
        if (input.charCodeAt(j) >= 128) {
          error("not-basic");
        }
        output.push(input.charCodeAt(j));
      }
      for (let index = basic > 0 ? basic + 1 : 0; index < inputLength; ) {
        const oldi = i;
        for (let w = 1, k = base; ; k += base) {
          if (index >= inputLength) {
            error("invalid-input");
          }
          const digit = basicToDigit(input.charCodeAt(index++));
          if (digit >= base) {
            error("invalid-input");
          }
          if (digit > floor((maxInt - i) / w)) {
            error("overflow");
          }
          i += digit * w;
          const t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
          if (digit < t) {
            break;
          }
          const baseMinusT = base - t;
          if (w > floor(maxInt / baseMinusT)) {
            error("overflow");
          }
          w *= baseMinusT;
        }
        const out = output.length + 1;
        bias = adapt(i - oldi, out, oldi == 0);
        if (floor(i / out) > maxInt - n) {
          error("overflow");
        }
        n += floor(i / out);
        i %= out;
        output.splice(i++, 0, n);
      }
      return String.fromCodePoint(...output);
    };
    var encode2 = function(input) {
      const output = [];
      input = ucs2decode(input);
      const inputLength = input.length;
      let n = initialN;
      let delta = 0;
      let bias = initialBias;
      for (const currentValue of input) {
        if (currentValue < 128) {
          output.push(stringFromCharCode(currentValue));
        }
      }
      const basicLength = output.length;
      let handledCPCount = basicLength;
      if (basicLength) {
        output.push(delimiter);
      }
      while (handledCPCount < inputLength) {
        let m = maxInt;
        for (const currentValue of input) {
          if (currentValue >= n && currentValue < m) {
            m = currentValue;
          }
        }
        const handledCPCountPlusOne = handledCPCount + 1;
        if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
          error("overflow");
        }
        delta += (m - n) * handledCPCountPlusOne;
        n = m;
        for (const currentValue of input) {
          if (currentValue < n && ++delta > maxInt) {
            error("overflow");
          }
          if (currentValue === n) {
            let q = delta;
            for (let k = base; ; k += base) {
              const t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
              if (q < t) {
                break;
              }
              const qMinusT = q - t;
              const baseMinusT = base - t;
              output.push(stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0)));
              q = floor(qMinusT / baseMinusT);
            }
            output.push(stringFromCharCode(digitToBasic(q, 0)));
            bias = adapt(delta, handledCPCountPlusOne, handledCPCount === basicLength);
            delta = 0;
            ++handledCPCount;
          }
        }
        ++delta;
        ++n;
      }
      return output.join("");
    };
    var toUnicode = function(input) {
      return mapDomain(input, function(string) {
        return regexPunycode.test(string) ? decode2(string.slice(4).toLowerCase()) : string;
      });
    };
    var toASCII = function(input) {
      return mapDomain(input, function(string) {
        return regexNonASCII.test(string) ? "xn--" + encode2(string) : string;
      });
    };
    var punycode = {
      /**
       * A string representing the current Punycode.js version number.
       * @memberOf punycode
       * @type String
       */
      version: "2.3.1",
      /**
       * An object of methods to convert from JavaScript's internal character
       * representation (UCS-2) to Unicode code points, and back.
       * @see <https://mathiasbynens.be/notes/javascript-encoding>
       * @memberOf punycode
       * @type Object
       */
      ucs2: {
        decode: ucs2decode,
        encode: ucs2encode
      },
      decode: decode2,
      encode: encode2,
      toASCII,
      toUnicode
    };
    module.exports = punycode;
  }
});

// node_modules/nodemailer/lib/base64/index.js
var require_base64 = __commonJS({
  "node_modules/nodemailer/lib/base64/index.js"(exports, module) {
    "use strict";
    var Transform = __require("stream").Transform;
    function encode2(buffer) {
      if (typeof buffer === "string") {
        buffer = Buffer.from(buffer, "utf-8");
      }
      return buffer.toString("base64");
    }
    function wrap(str, lineLength) {
      str = (str || "").toString();
      lineLength = lineLength || 76;
      if (str.length <= lineLength) {
        return str;
      }
      let result = [];
      let pos = 0;
      let chunkLength = lineLength * 1024;
      while (pos < str.length) {
        let wrappedLines = str.substr(pos, chunkLength).replace(new RegExp(".{" + lineLength + "}", "g"), "$&\r\n").trim();
        result.push(wrappedLines);
        pos += chunkLength;
      }
      return result.join("\r\n").trim();
    }
    var Encoder = class extends Transform {
      constructor(options) {
        super();
        this.options = options || {};
        if (this.options.lineLength !== false) {
          this.options.lineLength = this.options.lineLength || 76;
        }
        this._curLine = "";
        this._remainingBytes = false;
        this.inputBytes = 0;
        this.outputBytes = 0;
      }
      _transform(chunk, encoding, done) {
        if (encoding !== "buffer") {
          chunk = Buffer.from(chunk, encoding);
        }
        if (!chunk || !chunk.length) {
          return setImmediate(done);
        }
        this.inputBytes += chunk.length;
        if (this._remainingBytes && this._remainingBytes.length) {
          chunk = Buffer.concat([this._remainingBytes, chunk], this._remainingBytes.length + chunk.length);
          this._remainingBytes = false;
        }
        if (chunk.length % 3) {
          this._remainingBytes = chunk.slice(chunk.length - chunk.length % 3);
          chunk = chunk.slice(0, chunk.length - chunk.length % 3);
        } else {
          this._remainingBytes = false;
        }
        let b64 = this._curLine + encode2(chunk);
        if (this.options.lineLength) {
          b64 = wrap(b64, this.options.lineLength);
          let lastLF = b64.lastIndexOf("\n");
          if (lastLF < 0) {
            this._curLine = b64;
            b64 = "";
          } else if (lastLF === b64.length - 1) {
            this._curLine = "";
          } else {
            this._curLine = b64.substr(lastLF + 1);
            b64 = b64.substr(0, lastLF + 1);
          }
        }
        if (b64) {
          this.outputBytes += b64.length;
          this.push(Buffer.from(b64, "ascii"));
        }
        setImmediate(done);
      }
      _flush(done) {
        if (this._remainingBytes && this._remainingBytes.length) {
          this._curLine += encode2(this._remainingBytes);
        }
        if (this._curLine) {
          this._curLine = wrap(this._curLine, this.options.lineLength);
          this.outputBytes += this._curLine.length;
          this.push(this._curLine, "ascii");
          this._curLine = "";
        }
        done();
      }
    };
    module.exports = {
      encode: encode2,
      wrap,
      Encoder
    };
  }
});

// node_modules/nodemailer/lib/qp/index.js
var require_qp = __commonJS({
  "node_modules/nodemailer/lib/qp/index.js"(exports, module) {
    "use strict";
    var Transform = __require("stream").Transform;
    function encode2(buffer) {
      if (typeof buffer === "string") {
        buffer = Buffer.from(buffer, "utf-8");
      }
      let ranges = [
        // https://tools.ietf.org/html/rfc2045#section-6.7
        [9],
        // <TAB>
        [10],
        // <LF>
        [13],
        // <CR>
        [32, 60],
        // <SP>!"#$%&'()*+,-./0123456789:;
        [62, 126]
        // >?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\]^_`abcdefghijklmnopqrstuvwxyz{|}
      ];
      let result = "";
      let ord;
      for (let i = 0, len = buffer.length; i < len; i++) {
        ord = buffer[i];
        if (checkRanges(ord, ranges) && !((ord === 32 || ord === 9) && (i === len - 1 || buffer[i + 1] === 10 || buffer[i + 1] === 13))) {
          result += String.fromCharCode(ord);
          continue;
        }
        result += "=" + (ord < 16 ? "0" : "") + ord.toString(16).toUpperCase();
      }
      return result;
    }
    function wrap(str, lineLength) {
      str = (str || "").toString();
      lineLength = lineLength || 76;
      if (str.length <= lineLength) {
        return str;
      }
      let pos = 0;
      let len = str.length;
      let match2, code, line;
      let lineMargin = Math.floor(lineLength / 3);
      let result = "";
      while (pos < len) {
        line = str.substr(pos, lineLength);
        if (match2 = line.match(/\r\n/)) {
          line = line.substr(0, match2.index + match2[0].length);
          result += line;
          pos += line.length;
          continue;
        }
        if (line.substr(-1) === "\n") {
          result += line;
          pos += line.length;
          continue;
        } else if (match2 = line.substr(-lineMargin).match(/\n.*?$/)) {
          line = line.substr(0, line.length - (match2[0].length - 1));
          result += line;
          pos += line.length;
          continue;
        } else if (line.length > lineLength - lineMargin && (match2 = line.substr(-lineMargin).match(/[ \t.,!?][^ \t.,!?]*$/))) {
          line = line.substr(0, line.length - (match2[0].length - 1));
        } else if (line.match(/[=][\da-f]{0,2}$/i)) {
          if (match2 = line.match(/[=][\da-f]{0,1}$/i)) {
            line = line.substr(0, line.length - match2[0].length);
          }
          while (line.length > 3 && line.length < len - pos && !line.match(/^(?:=[\da-f]{2}){1,4}$/i) && (match2 = line.match(/[=][\da-f]{2}$/gi))) {
            code = parseInt(match2[0].substr(1, 2), 16);
            if (code < 128) {
              break;
            }
            line = line.substr(0, line.length - 3);
            if (code >= 192) {
              break;
            }
          }
        }
        if (pos + line.length < len && line.substr(-1) !== "\n") {
          if (line.length === lineLength && line.match(/[=][\da-f]{2}$/i)) {
            line = line.substr(0, line.length - 3);
          } else if (line.length === lineLength) {
            line = line.substr(0, line.length - 1);
          }
          pos += line.length;
          line += "=\r\n";
        } else {
          pos += line.length;
        }
        result += line;
      }
      return result;
    }
    function checkRanges(nr, ranges) {
      for (let i = ranges.length - 1; i >= 0; i--) {
        if (!ranges[i].length) {
          continue;
        }
        if (ranges[i].length === 1 && nr === ranges[i][0]) {
          return true;
        }
        if (ranges[i].length === 2 && nr >= ranges[i][0] && nr <= ranges[i][1]) {
          return true;
        }
      }
      return false;
    }
    var Encoder = class extends Transform {
      constructor(options) {
        super();
        this.options = options || {};
        if (this.options.lineLength !== false) {
          this.options.lineLength = this.options.lineLength || 76;
        }
        this._curLine = "";
        this.inputBytes = 0;
        this.outputBytes = 0;
      }
      _transform(chunk, encoding, done) {
        let qp;
        if (encoding !== "buffer") {
          chunk = Buffer.from(chunk, encoding);
        }
        if (!chunk || !chunk.length) {
          return done();
        }
        this.inputBytes += chunk.length;
        if (this.options.lineLength) {
          qp = this._curLine + encode2(chunk);
          qp = wrap(qp, this.options.lineLength);
          qp = qp.replace(/(^|\n)([^\n]*)$/, (match2, lineBreak, lastLine) => {
            this._curLine = lastLine;
            return lineBreak;
          });
          if (qp) {
            this.outputBytes += qp.length;
            this.push(qp);
          }
        } else {
          qp = encode2(chunk);
          this.outputBytes += qp.length;
          this.push(qp, "ascii");
        }
        done();
      }
      _flush(done) {
        if (this._curLine) {
          this.outputBytes += this._curLine.length;
          this.push(this._curLine, "ascii");
        }
        done();
      }
    };
    module.exports = {
      encode: encode2,
      wrap,
      Encoder
    };
  }
});

// node_modules/nodemailer/lib/mime-funcs/index.js
var require_mime_funcs = __commonJS({
  "node_modules/nodemailer/lib/mime-funcs/index.js"(exports, module) {
    "use strict";
    var base64 = require_base64();
    var qp = require_qp();
    var mimeTypes = require_mime_types();
    module.exports = {
      /**
       * Checks if a value is plaintext string (uses only printable 7bit chars)
       *
       * @param {String} value String to be tested
       * @returns {Boolean} true if it is a plaintext string
       */
      isPlainText(value, isParam) {
        const re = isParam ? /[\x00-\x08\x0b\x0c\x0e-\x1f"\u0080-\uFFFF]/ : /[\x00-\x08\x0b\x0c\x0e-\x1f\u0080-\uFFFF]/;
        if (typeof value !== "string" || re.test(value)) {
          return false;
        } else {
          return true;
        }
      },
      /**
       * Checks if a multi line string containes lines longer than the selected value.
       *
       * Useful when detecting if a mail message needs any processing at all –
       * if only plaintext characters are used and lines are short, then there is
       * no need to encode the values in any way. If the value is plaintext but has
       * longer lines then allowed, then use format=flowed
       *
       * @param {Number} lineLength Max line length to check for
       * @returns {Boolean} Returns true if there is at least one line longer than lineLength chars
       */
      hasLongerLines(str, lineLength) {
        if (str.length > 128 * 1024) {
          return true;
        }
        return new RegExp("^.{" + (lineLength + 1) + ",}", "m").test(str);
      },
      /**
       * Encodes a string or an Buffer to an UTF-8 MIME Word (rfc2047)
       *
       * @param {String|Buffer} data String to be encoded
       * @param {String} mimeWordEncoding='Q' Encoding for the mime word, either Q or B
       * @param {Number} [maxLength=0] If set, split mime words into several chunks if needed
       * @return {String} Single or several mime words joined together
       */
      encodeWord(data, mimeWordEncoding, maxLength) {
        mimeWordEncoding = (mimeWordEncoding || "Q").toString().toUpperCase().trim().charAt(0);
        maxLength = maxLength || 0;
        let encodedStr;
        let toCharset = "UTF-8";
        if (maxLength && maxLength > 7 + toCharset.length) {
          maxLength -= 7 + toCharset.length;
        }
        if (mimeWordEncoding === "Q") {
          encodedStr = qp.encode(data).replace(/[^a-z0-9!*+\-/=]/gi, (chr) => {
            let ord = chr.charCodeAt(0).toString(16).toUpperCase();
            if (chr === " ") {
              return "_";
            } else {
              return "=" + (ord.length === 1 ? "0" + ord : ord);
            }
          });
        } else if (mimeWordEncoding === "B") {
          encodedStr = typeof data === "string" ? data : base64.encode(data);
          maxLength = maxLength ? Math.max(3, (maxLength - maxLength % 4) / 4 * 3) : 0;
        }
        if (maxLength && (mimeWordEncoding !== "B" ? encodedStr : base64.encode(data)).length > maxLength) {
          if (mimeWordEncoding === "Q") {
            encodedStr = this.splitMimeEncodedString(encodedStr, maxLength).join("?= =?" + toCharset + "?" + mimeWordEncoding + "?");
          } else {
            let parts = [];
            let lpart = "";
            for (let i = 0, len = encodedStr.length; i < len; i++) {
              let chr = encodedStr.charAt(i);
              if (/[\ud83c\ud83d\ud83e]/.test(chr) && i < len - 1) {
                chr += encodedStr.charAt(++i);
              }
              if (Buffer.byteLength(lpart + chr) <= maxLength || i === 0) {
                lpart += chr;
              } else {
                parts.push(base64.encode(lpart));
                lpart = chr;
              }
            }
            if (lpart) {
              parts.push(base64.encode(lpart));
            }
            if (parts.length > 1) {
              encodedStr = parts.join("?= =?" + toCharset + "?" + mimeWordEncoding + "?");
            } else {
              encodedStr = parts.join("");
            }
          }
        } else if (mimeWordEncoding === "B") {
          encodedStr = base64.encode(data);
        }
        return "=?" + toCharset + "?" + mimeWordEncoding + "?" + encodedStr + (encodedStr.substr(-2) === "?=" ? "" : "?=");
      },
      /**
       * Finds word sequences with non ascii text and converts these to mime words
       *
       * @param {String} value String to be encoded
       * @param {String} mimeWordEncoding='Q' Encoding for the mime word, either Q or B
       * @param {Number} [maxLength=0] If set, split mime words into several chunks if needed
       * @param {Boolean} [encodeAll=false] If true and the value needs encoding then encodes entire string, not just the smallest match
       * @return {String} String with possible mime words
       */
      encodeWords(value, mimeWordEncoding, maxLength, encodeAll) {
        maxLength = maxLength || 0;
        let encodedValue;
        let firstMatch = value.match(/(?:^|\s)([^\s]*["\u0080-\uFFFF])/);
        if (!firstMatch) {
          return value;
        }
        if (encodeAll) {
          return this.encodeWord(value, mimeWordEncoding, maxLength);
        }
        let lastMatch = value.match(/(["\u0080-\uFFFF][^\s]*)[^"\u0080-\uFFFF]*$/);
        if (!lastMatch) {
          return value;
        }
        let startIndex = firstMatch.index + (firstMatch[0].match(/[^\s]/) || {
          index: 0
        }).index;
        let endIndex = lastMatch.index + (lastMatch[1] || "").length;
        encodedValue = (startIndex ? value.substr(0, startIndex) : "") + this.encodeWord(value.substring(startIndex, endIndex), mimeWordEncoding || "Q", maxLength) + (endIndex < value.length ? value.substr(endIndex) : "");
        return encodedValue;
      },
      /**
       * Joins parsed header value together as 'value; param1=value1; param2=value2'
       * PS: We are following RFC 822 for the list of special characters that we need to keep in quotes.
       *      Refer: https://www.w3.org/Protocols/rfc1341/4_Content-Type.html
       * @param {Object} structured Parsed header value
       * @return {String} joined header value
       */
      buildHeaderValue(structured) {
        let paramsArray = [];
        Object.keys(structured.params || {}).forEach((param) => {
          let value = structured.params[param];
          if (!this.isPlainText(value, true) || value.length >= 75) {
            this.buildHeaderParam(param, value, 50).forEach((encodedParam) => {
              if (!/[\s"\\;:/=(),<>@[\]?]|^[-']|'$/.test(encodedParam.value) || encodedParam.key.substr(-1) === "*") {
                paramsArray.push(encodedParam.key + "=" + encodedParam.value);
              } else {
                paramsArray.push(encodedParam.key + "=" + JSON.stringify(encodedParam.value));
              }
            });
          } else if (/[\s'"\\;:/=(),<>@[\]?]|^-/.test(value)) {
            paramsArray.push(param + "=" + JSON.stringify(value));
          } else {
            paramsArray.push(param + "=" + value);
          }
        });
        return structured.value + (paramsArray.length ? "; " + paramsArray.join("; ") : "");
      },
      /**
       * Encodes a string or an Buffer to an UTF-8 Parameter Value Continuation encoding (rfc2231)
       * Useful for splitting long parameter values.
       *
       * For example
       *      title="unicode string"
       * becomes
       *     title*0*=utf-8''unicode
       *     title*1*=%20string
       *
       * @param {String|Buffer} data String to be encoded
       * @param {Number} [maxLength=50] Max length for generated chunks
       * @param {String} [fromCharset='UTF-8'] Source sharacter set
       * @return {Array} A list of encoded keys and headers
       */
      buildHeaderParam(key, data, maxLength) {
        let list = [];
        let encodedStr = typeof data === "string" ? data : (data || "").toString();
        let encodedStrArr;
        let chr, ord;
        let line;
        let startPos = 0;
        let i, len;
        maxLength = maxLength || 50;
        if (this.isPlainText(data, true)) {
          if (encodedStr.length <= maxLength) {
            return [
              {
                key,
                value: encodedStr
              }
            ];
          }
          encodedStr = encodedStr.replace(new RegExp(".{" + maxLength + "}", "g"), (str) => {
            list.push({
              line: str
            });
            return "";
          });
          if (encodedStr) {
            list.push({
              line: encodedStr
            });
          }
        } else {
          if (/[\uD800-\uDBFF]/.test(encodedStr)) {
            encodedStrArr = [];
            for (i = 0, len = encodedStr.length; i < len; i++) {
              chr = encodedStr.charAt(i);
              ord = chr.charCodeAt(0);
              if (ord >= 55296 && ord <= 56319 && i < len - 1) {
                chr += encodedStr.charAt(i + 1);
                encodedStrArr.push(chr);
                i++;
              } else {
                encodedStrArr.push(chr);
              }
            }
            encodedStr = encodedStrArr;
          }
          line = "utf-8''";
          let encoded = true;
          startPos = 0;
          for (i = 0, len = encodedStr.length; i < len; i++) {
            chr = encodedStr[i];
            if (encoded) {
              chr = this.safeEncodeURIComponent(chr);
            } else {
              chr = chr === " " ? chr : this.safeEncodeURIComponent(chr);
              if (chr !== encodedStr[i]) {
                if ((this.safeEncodeURIComponent(line) + chr).length >= maxLength) {
                  list.push({
                    line,
                    encoded
                  });
                  line = "";
                  startPos = i - 1;
                } else {
                  encoded = true;
                  i = startPos;
                  line = "";
                  continue;
                }
              }
            }
            if ((line + chr).length >= maxLength) {
              list.push({
                line,
                encoded
              });
              line = chr = encodedStr[i] === " " ? " " : this.safeEncodeURIComponent(encodedStr[i]);
              if (chr === encodedStr[i]) {
                encoded = false;
                startPos = i - 1;
              } else {
                encoded = true;
              }
            } else {
              line += chr;
            }
          }
          if (line) {
            list.push({
              line,
              encoded
            });
          }
        }
        return list.map((item, i2) => ({
          // encoded lines: {name}*{part}*
          // unencoded lines: {name}*{part}
          // if any line needs to be encoded then the first line (part==0) is always encoded
          key: key + "*" + i2 + (item.encoded ? "*" : ""),
          value: item.line
        }));
      },
      /**
       * Parses a header value with key=value arguments into a structured
       * object.
       *
       *   parseHeaderValue('content-type: text/plain; CHARSET='UTF-8'') ->
       *   {
       *     'value': 'text/plain',
       *     'params': {
       *       'charset': 'UTF-8'
       *     }
       *   }
       *
       * @param {String} str Header value
       * @return {Object} Header value as a parsed structure
       */
      parseHeaderValue(str) {
        let response = {
          value: false,
          params: {}
        };
        let key = false;
        let value = "";
        let type = "value";
        let quote = false;
        let escaped = false;
        let chr;
        for (let i = 0, len = str.length; i < len; i++) {
          chr = str.charAt(i);
          if (type === "key") {
            if (chr === "=") {
              key = value.trim().toLowerCase();
              type = "value";
              value = "";
              continue;
            }
            value += chr;
          } else {
            if (escaped) {
              value += chr;
            } else if (chr === "\\") {
              escaped = true;
              continue;
            } else if (quote && chr === quote) {
              quote = false;
            } else if (!quote && chr === '"') {
              quote = chr;
            } else if (!quote && chr === ";") {
              if (key === false) {
                response.value = value.trim();
              } else {
                response.params[key] = value.trim();
              }
              type = "key";
              value = "";
            } else {
              value += chr;
            }
            escaped = false;
          }
        }
        if (type === "value") {
          if (key === false) {
            response.value = value.trim();
          } else {
            response.params[key] = value.trim();
          }
        } else if (value.trim()) {
          response.params[value.trim().toLowerCase()] = "";
        }
        Object.keys(response.params).forEach((key2) => {
          let actualKey, nr, match2, value2;
          if (match2 = key2.match(/(\*(\d+)|\*(\d+)\*|\*)$/)) {
            actualKey = key2.substr(0, match2.index);
            nr = Number(match2[2] || match2[3]) || 0;
            if (!response.params[actualKey] || typeof response.params[actualKey] !== "object") {
              response.params[actualKey] = {
                charset: false,
                values: []
              };
            }
            value2 = response.params[key2];
            if (nr === 0 && match2[0].substr(-1) === "*" && (match2 = value2.match(/^([^']*)'[^']*'(.*)$/))) {
              response.params[actualKey].charset = match2[1] || "iso-8859-1";
              value2 = match2[2];
            }
            response.params[actualKey].values[nr] = value2;
            delete response.params[key2];
          }
        });
        Object.keys(response.params).forEach((key2) => {
          let value2;
          if (response.params[key2] && Array.isArray(response.params[key2].values)) {
            value2 = response.params[key2].values.map((val) => val || "").join("");
            if (response.params[key2].charset) {
              response.params[key2] = "=?" + response.params[key2].charset + "?Q?" + value2.replace(/[=?_\s]/g, (s) => {
                let c = s.charCodeAt(0).toString(16);
                if (s === " ") {
                  return "_";
                } else {
                  return "%" + (c.length < 2 ? "0" : "") + c;
                }
              }).replace(/%/g, "=") + "?=";
            } else {
              response.params[key2] = value2;
            }
          }
        });
        return response;
      },
      /**
       * Returns file extension for a content type string. If no suitable extensions
       * are found, 'bin' is used as the default extension
       *
       * @param {String} mimeType Content type to be checked for
       * @return {String} File extension
       */
      detectExtension: (mimeType) => mimeTypes.detectExtension(mimeType),
      /**
       * Returns content type for a file extension. If no suitable content types
       * are found, 'application/octet-stream' is used as the default content type
       *
       * @param {String} extension Extension to be checked for
       * @return {String} File extension
       */
      detectMimeType: (extension) => mimeTypes.detectMimeType(extension),
      /**
       * Folds long lines, useful for folding header lines (afterSpace=false) and
       * flowed text (afterSpace=true)
       *
       * @param {String} str String to be folded
       * @param {Number} [lineLength=76] Maximum length of a line
       * @param {Boolean} afterSpace If true, leave a space in th end of a line
       * @return {String} String with folded lines
       */
      foldLines(str, lineLength, afterSpace) {
        str = (str || "").toString();
        lineLength = lineLength || 76;
        let pos = 0, len = str.length, result = "", line, match2;
        while (pos < len) {
          line = str.substr(pos, lineLength);
          if (line.length < lineLength) {
            result += line;
            break;
          }
          if (match2 = line.match(/^[^\n\r]*(\r?\n|\r)/)) {
            line = match2[0];
            result += line;
            pos += line.length;
            continue;
          } else if ((match2 = line.match(/(\s+)[^\s]*$/)) && match2[0].length - (afterSpace ? (match2[1] || "").length : 0) < line.length) {
            line = line.substr(0, line.length - (match2[0].length - (afterSpace ? (match2[1] || "").length : 0)));
          } else if (match2 = str.substr(pos + line.length).match(/^[^\s]+(\s*)/)) {
            line = line + match2[0].substr(0, match2[0].length - (!afterSpace ? (match2[1] || "").length : 0));
          }
          result += line;
          pos += line.length;
          if (pos < len) {
            result += "\r\n";
          }
        }
        return result;
      },
      /**
       * Splits a mime encoded string. Needed for dividing mime words into smaller chunks
       *
       * @param {String} str Mime encoded string to be split up
       * @param {Number} maxlen Maximum length of characters for one part (minimum 12)
       * @return {Array} Split string
       */
      splitMimeEncodedString: (str, maxlen) => {
        let curLine, match2, chr, done, lines = [];
        maxlen = Math.max(maxlen || 0, 12);
        while (str.length) {
          curLine = str.substr(0, maxlen);
          if (match2 = curLine.match(/[=][0-9A-F]?$/i)) {
            curLine = curLine.substr(0, match2.index);
          }
          done = false;
          while (!done) {
            done = true;
            if (match2 = str.substr(curLine.length).match(/^[=]([0-9A-F]{2})/i)) {
              chr = parseInt(match2[1], 16);
              if (chr < 194 && chr > 127) {
                curLine = curLine.substr(0, curLine.length - 3);
                done = false;
              }
            }
          }
          if (curLine.length) {
            lines.push(curLine);
          }
          str = str.substr(curLine.length);
        }
        return lines;
      },
      encodeURICharComponent: (chr) => {
        let res = "";
        let ord = chr.charCodeAt(0).toString(16).toUpperCase();
        if (ord.length % 2) {
          ord = "0" + ord;
        }
        if (ord.length > 2) {
          for (let i = 0, len = ord.length / 2; i < len; i++) {
            res += "%" + ord.substr(i, 2);
          }
        } else {
          res += "%" + ord;
        }
        return res;
      },
      safeEncodeURIComponent(str) {
        str = (str || "").toString();
        try {
          str = encodeURIComponent(str);
        } catch (E) {
          return str.replace(/[^\x00-\x1F *'()<>@,;:\\"[\]?=\u007F-\uFFFF]+/g, "");
        }
        return str.replace(/[\x00-\x1F *'()<>@,;:\\"[\]?=\u007F-\uFFFF]/g, (chr) => this.encodeURICharComponent(chr));
      }
    };
  }
});

// node_modules/nodemailer/lib/addressparser/index.js
var require_addressparser = __commonJS({
  "node_modules/nodemailer/lib/addressparser/index.js"(exports, module) {
    "use strict";
    function _handleAddress(tokens) {
      let isGroup = false;
      let state = "text";
      let address;
      let addresses = [];
      let data = {
        address: [],
        comment: [],
        group: [],
        text: []
      };
      let i;
      let len;
      for (i = 0, len = tokens.length; i < len; i++) {
        let token = tokens[i];
        let prevToken = i ? tokens[i - 1] : null;
        if (token.type === "operator") {
          switch (token.value) {
            case "<":
              state = "address";
              break;
            case "(":
              state = "comment";
              break;
            case ":":
              state = "group";
              isGroup = true;
              break;
            default:
              state = "text";
              break;
          }
        } else if (token.value) {
          if (state === "address") {
            token.value = token.value.replace(/^[^<]*<\s*/, "");
          }
          if (prevToken && prevToken.noBreak && data[state].length) {
            data[state][data[state].length - 1] += token.value;
          } else {
            data[state].push(token.value);
          }
        }
      }
      if (!data.text.length && data.comment.length) {
        data.text = data.comment;
        data.comment = [];
      }
      if (isGroup) {
        data.text = data.text.join(" ");
        addresses.push({
          name: data.text || address && address.name,
          group: data.group.length ? addressparser(data.group.join(",")) : []
        });
      } else {
        if (!data.address.length && data.text.length) {
          for (i = data.text.length - 1; i >= 0; i--) {
            if (data.text[i].match(/^[^@\s]+@[^@\s]+$/)) {
              data.address = data.text.splice(i, 1);
              break;
            }
          }
          let _regexHandler = function(address2) {
            if (!data.address.length) {
              data.address = [address2.trim()];
              return " ";
            } else {
              return address2;
            }
          };
          if (!data.address.length) {
            for (i = data.text.length - 1; i >= 0; i--) {
              data.text[i] = data.text[i].replace(/\s*\b[^@\s]+@[^\s]+\b\s*/, _regexHandler).trim();
              if (data.address.length) {
                break;
              }
            }
          }
        }
        if (!data.text.length && data.comment.length) {
          data.text = data.comment;
          data.comment = [];
        }
        if (data.address.length > 1) {
          data.text = data.text.concat(data.address.splice(1));
        }
        data.text = data.text.join(" ");
        data.address = data.address.join(" ");
        if (!data.address && isGroup) {
          return [];
        } else {
          address = {
            address: data.address || data.text || "",
            name: data.text || data.address || ""
          };
          if (address.address === address.name) {
            if ((address.address || "").match(/@/)) {
              address.name = "";
            } else {
              address.address = "";
            }
          }
          addresses.push(address);
        }
      }
      return addresses;
    }
    var Tokenizer = class {
      constructor(str) {
        this.str = (str || "").toString();
        this.operatorCurrent = "";
        this.operatorExpecting = "";
        this.node = null;
        this.escaped = false;
        this.list = [];
        this.operators = {
          '"': '"',
          "(": ")",
          "<": ">",
          ",": "",
          ":": ";",
          // Semicolons are not a legal delimiter per the RFC2822 grammar other
          // than for terminating a group, but they are also not valid for any
          // other use in this context.  Given that some mail clients have
          // historically allowed the semicolon as a delimiter equivalent to the
          // comma in their UI, it makes sense to treat them the same as a comma
          // when used outside of a group.
          ";": ""
        };
      }
      /**
       * Tokenizes the original input string
       *
       * @return {Array} An array of operator|text tokens
       */
      tokenize() {
        let list = [];
        for (let i = 0, len = this.str.length; i < len; i++) {
          let chr = this.str.charAt(i);
          let nextChr = i < len - 1 ? this.str.charAt(i + 1) : null;
          this.checkChar(chr, nextChr);
        }
        this.list.forEach((node) => {
          node.value = (node.value || "").toString().trim();
          if (node.value) {
            list.push(node);
          }
        });
        return list;
      }
      /**
       * Checks if a character is an operator or text and acts accordingly
       *
       * @param {String} chr Character from the address field
       */
      checkChar(chr, nextChr) {
        if (this.escaped) {
        } else if (chr === this.operatorExpecting) {
          this.node = {
            type: "operator",
            value: chr
          };
          if (nextChr && ![" ", "	", "\r", "\n", ",", ";"].includes(nextChr)) {
            this.node.noBreak = true;
          }
          this.list.push(this.node);
          this.node = null;
          this.operatorExpecting = "";
          this.escaped = false;
          return;
        } else if (!this.operatorExpecting && chr in this.operators) {
          this.node = {
            type: "operator",
            value: chr
          };
          this.list.push(this.node);
          this.node = null;
          this.operatorExpecting = this.operators[chr];
          this.escaped = false;
          return;
        } else if (['"', "'"].includes(this.operatorExpecting) && chr === "\\") {
          this.escaped = true;
          return;
        }
        if (!this.node) {
          this.node = {
            type: "text",
            value: ""
          };
          this.list.push(this.node);
        }
        if (chr === "\n") {
          chr = " ";
        }
        if (chr.charCodeAt(0) >= 33 || [" ", "	"].includes(chr)) {
          this.node.value += chr;
        }
        this.escaped = false;
      }
    };
    function addressparser(str, options) {
      options = options || {};
      let tokenizer = new Tokenizer(str);
      let tokens = tokenizer.tokenize();
      let addresses = [];
      let address = [];
      let parsedAddresses = [];
      tokens.forEach((token) => {
        if (token.type === "operator" && (token.value === "," || token.value === ";")) {
          if (address.length) {
            addresses.push(address);
          }
          address = [];
        } else {
          address.push(token);
        }
      });
      if (address.length) {
        addresses.push(address);
      }
      addresses.forEach((address2) => {
        address2 = _handleAddress(address2);
        if (address2.length) {
          parsedAddresses = parsedAddresses.concat(address2);
        }
      });
      if (options.flatten) {
        let addresses2 = [];
        let walkAddressList = (list) => {
          list.forEach((address2) => {
            if (address2.group) {
              return walkAddressList(address2.group);
            } else {
              addresses2.push(address2);
            }
          });
        };
        walkAddressList(parsedAddresses);
        return addresses2;
      }
      return parsedAddresses;
    }
    module.exports = addressparser;
  }
});

// node_modules/nodemailer/lib/mime-node/last-newline.js
var require_last_newline = __commonJS({
  "node_modules/nodemailer/lib/mime-node/last-newline.js"(exports, module) {
    "use strict";
    var Transform = __require("stream").Transform;
    var LastNewline = class extends Transform {
      constructor() {
        super();
        this.lastByte = false;
      }
      _transform(chunk, encoding, done) {
        if (chunk.length) {
          this.lastByte = chunk[chunk.length - 1];
        }
        this.push(chunk);
        done();
      }
      _flush(done) {
        if (this.lastByte === 10) {
          return done();
        }
        if (this.lastByte === 13) {
          this.push(Buffer.from("\n"));
          return done();
        }
        this.push(Buffer.from("\r\n"));
        return done();
      }
    };
    module.exports = LastNewline;
  }
});

// node_modules/nodemailer/lib/mime-node/le-windows.js
var require_le_windows = __commonJS({
  "node_modules/nodemailer/lib/mime-node/le-windows.js"(exports, module) {
    "use strict";
    var stream = __require("stream");
    var Transform = stream.Transform;
    var LeWindows = class extends Transform {
      constructor(options) {
        super(options);
        this.options = options || {};
        this.lastByte = false;
      }
      /**
       * Escapes dots
       */
      _transform(chunk, encoding, done) {
        let buf;
        let lastPos = 0;
        for (let i = 0, len = chunk.length; i < len; i++) {
          if (chunk[i] === 10) {
            if (i && chunk[i - 1] !== 13 || !i && this.lastByte !== 13) {
              if (i > lastPos) {
                buf = chunk.slice(lastPos, i);
                this.push(buf);
              }
              this.push(Buffer.from("\r\n"));
              lastPos = i + 1;
            }
          }
        }
        if (lastPos && lastPos < chunk.length) {
          buf = chunk.slice(lastPos);
          this.push(buf);
        } else if (!lastPos) {
          this.push(chunk);
        }
        this.lastByte = chunk[chunk.length - 1];
        done();
      }
    };
    module.exports = LeWindows;
  }
});

// node_modules/nodemailer/lib/mime-node/le-unix.js
var require_le_unix = __commonJS({
  "node_modules/nodemailer/lib/mime-node/le-unix.js"(exports, module) {
    "use strict";
    var stream = __require("stream");
    var Transform = stream.Transform;
    var LeWindows = class extends Transform {
      constructor(options) {
        super(options);
        this.options = options || {};
      }
      /**
       * Escapes dots
       */
      _transform(chunk, encoding, done) {
        let buf;
        let lastPos = 0;
        for (let i = 0, len = chunk.length; i < len; i++) {
          if (chunk[i] === 13) {
            buf = chunk.slice(lastPos, i);
            lastPos = i + 1;
            this.push(buf);
          }
        }
        if (lastPos && lastPos < chunk.length) {
          buf = chunk.slice(lastPos);
          this.push(buf);
        } else if (!lastPos) {
          this.push(chunk);
        }
        done();
      }
    };
    module.exports = LeWindows;
  }
});

// node_modules/nodemailer/lib/mime-node/index.js
var require_mime_node = __commonJS({
  "node_modules/nodemailer/lib/mime-node/index.js"(exports, module) {
    "use strict";
    var crypto5 = __require("crypto");
    var fs = __require("fs");
    var punycode = require_punycode();
    var PassThrough = __require("stream").PassThrough;
    var shared = require_shared();
    var mimeFuncs = require_mime_funcs();
    var qp = require_qp();
    var base64 = require_base64();
    var addressparser = require_addressparser();
    var nmfetch = require_fetch();
    var LastNewline = require_last_newline();
    var LeWindows = require_le_windows();
    var LeUnix = require_le_unix();
    var MimeNode = class _MimeNode {
      constructor(contentType, options) {
        this.nodeCounter = 0;
        options = options || {};
        this.baseBoundary = options.baseBoundary || crypto5.randomBytes(8).toString("hex");
        this.boundaryPrefix = options.boundaryPrefix || "--_NmP";
        this.disableFileAccess = !!options.disableFileAccess;
        this.disableUrlAccess = !!options.disableUrlAccess;
        this.normalizeHeaderKey = options.normalizeHeaderKey;
        this.date = /* @__PURE__ */ new Date();
        this.rootNode = options.rootNode || this;
        this.keepBcc = !!options.keepBcc;
        if (options.filename) {
          this.filename = options.filename;
          if (!contentType) {
            contentType = mimeFuncs.detectMimeType(this.filename.split(".").pop());
          }
        }
        this.textEncoding = (options.textEncoding || "").toString().trim().charAt(0).toUpperCase();
        this.parentNode = options.parentNode;
        this.hostname = options.hostname;
        this.newline = options.newline;
        this.childNodes = [];
        this._nodeId = ++this.rootNode.nodeCounter;
        this._headers = [];
        this._isPlainText = false;
        this._hasLongLines = false;
        this._envelope = false;
        this._raw = false;
        this._transforms = [];
        this._processFuncs = [];
        if (contentType) {
          this.setHeader("Content-Type", contentType);
        }
      }
      /////// PUBLIC METHODS
      /**
       * Creates and appends a child node.Arguments provided are passed to MimeNode constructor
       *
       * @param {String} [contentType] Optional content type
       * @param {Object} [options] Optional options object
       * @return {Object} Created node object
       */
      createChild(contentType, options) {
        if (!options && typeof contentType === "object") {
          options = contentType;
          contentType = void 0;
        }
        let node = new _MimeNode(contentType, options);
        this.appendChild(node);
        return node;
      }
      /**
       * Appends an existing node to the mime tree. Removes the node from an existing
       * tree if needed
       *
       * @param {Object} childNode node to be appended
       * @return {Object} Appended node object
       */
      appendChild(childNode) {
        if (childNode.rootNode !== this.rootNode) {
          childNode.rootNode = this.rootNode;
          childNode._nodeId = ++this.rootNode.nodeCounter;
        }
        childNode.parentNode = this;
        this.childNodes.push(childNode);
        return childNode;
      }
      /**
       * Replaces current node with another node
       *
       * @param {Object} node Replacement node
       * @return {Object} Replacement node
       */
      replace(node) {
        if (node === this) {
          return this;
        }
        this.parentNode.childNodes.forEach((childNode, i) => {
          if (childNode === this) {
            node.rootNode = this.rootNode;
            node.parentNode = this.parentNode;
            node._nodeId = this._nodeId;
            this.rootNode = this;
            this.parentNode = void 0;
            node.parentNode.childNodes[i] = node;
          }
        });
        return node;
      }
      /**
       * Removes current node from the mime tree
       *
       * @return {Object} removed node
       */
      remove() {
        if (!this.parentNode) {
          return this;
        }
        for (let i = this.parentNode.childNodes.length - 1; i >= 0; i--) {
          if (this.parentNode.childNodes[i] === this) {
            this.parentNode.childNodes.splice(i, 1);
            this.parentNode = void 0;
            this.rootNode = this;
            return this;
          }
        }
      }
      /**
       * Sets a header value. If the value for selected key exists, it is overwritten.
       * You can set multiple values as well by using [{key:'', value:''}] or
       * {key: 'value'} as the first argument.
       *
       * @param {String|Array|Object} key Header key or a list of key value pairs
       * @param {String} value Header value
       * @return {Object} current node
       */
      setHeader(key, value) {
        let added = false, headerValue;
        if (!value && key && typeof key === "object") {
          if (key.key && "value" in key) {
            this.setHeader(key.key, key.value);
          } else if (Array.isArray(key)) {
            key.forEach((i) => {
              this.setHeader(i.key, i.value);
            });
          } else {
            Object.keys(key).forEach((i) => {
              this.setHeader(i, key[i]);
            });
          }
          return this;
        }
        key = this._normalizeHeaderKey(key);
        headerValue = {
          key,
          value
        };
        for (let i = 0, len = this._headers.length; i < len; i++) {
          if (this._headers[i].key === key) {
            if (!added) {
              this._headers[i] = headerValue;
              added = true;
            } else {
              this._headers.splice(i, 1);
              i--;
              len--;
            }
          }
        }
        if (!added) {
          this._headers.push(headerValue);
        }
        return this;
      }
      /**
       * Adds a header value. If the value for selected key exists, the value is appended
       * as a new field and old one is not touched.
       * You can set multiple values as well by using [{key:'', value:''}] or
       * {key: 'value'} as the first argument.
       *
       * @param {String|Array|Object} key Header key or a list of key value pairs
       * @param {String} value Header value
       * @return {Object} current node
       */
      addHeader(key, value) {
        if (!value && key && typeof key === "object") {
          if (key.key && key.value) {
            this.addHeader(key.key, key.value);
          } else if (Array.isArray(key)) {
            key.forEach((i) => {
              this.addHeader(i.key, i.value);
            });
          } else {
            Object.keys(key).forEach((i) => {
              this.addHeader(i, key[i]);
            });
          }
          return this;
        } else if (Array.isArray(value)) {
          value.forEach((val) => {
            this.addHeader(key, val);
          });
          return this;
        }
        this._headers.push({
          key: this._normalizeHeaderKey(key),
          value
        });
        return this;
      }
      /**
       * Retrieves the first mathcing value of a selected key
       *
       * @param {String} key Key to search for
       * @retun {String} Value for the key
       */
      getHeader(key) {
        key = this._normalizeHeaderKey(key);
        for (let i = 0, len = this._headers.length; i < len; i++) {
          if (this._headers[i].key === key) {
            return this._headers[i].value;
          }
        }
      }
      /**
       * Sets body content for current node. If the value is a string, charset is added automatically
       * to Content-Type (if it is text/*). If the value is a Buffer, you need to specify
       * the charset yourself
       *
       * @param (String|Buffer) content Body content
       * @return {Object} current node
       */
      setContent(content) {
        this.content = content;
        if (typeof this.content.pipe === "function") {
          this._contentErrorHandler = (err) => {
            this.content.removeListener("error", this._contentErrorHandler);
            this.content = err;
          };
          this.content.once("error", this._contentErrorHandler);
        } else if (typeof this.content === "string") {
          this._isPlainText = mimeFuncs.isPlainText(this.content);
          if (this._isPlainText && mimeFuncs.hasLongerLines(this.content, 76)) {
            this._hasLongLines = true;
          }
        }
        return this;
      }
      build(callback) {
        let promise;
        if (!callback) {
          promise = new Promise((resolve, reject) => {
            callback = shared.callbackPromise(resolve, reject);
          });
        }
        let stream = this.createReadStream();
        let buf = [];
        let buflen = 0;
        let returned = false;
        stream.on("readable", () => {
          let chunk;
          while ((chunk = stream.read()) !== null) {
            buf.push(chunk);
            buflen += chunk.length;
          }
        });
        stream.once("error", (err) => {
          if (returned) {
            return;
          }
          returned = true;
          return callback(err);
        });
        stream.once("end", (chunk) => {
          if (returned) {
            return;
          }
          returned = true;
          if (chunk && chunk.length) {
            buf.push(chunk);
            buflen += chunk.length;
          }
          return callback(null, Buffer.concat(buf, buflen));
        });
        return promise;
      }
      getTransferEncoding() {
        let transferEncoding = false;
        let contentType = (this.getHeader("Content-Type") || "").toString().toLowerCase().trim();
        if (this.content) {
          transferEncoding = (this.getHeader("Content-Transfer-Encoding") || "").toString().toLowerCase().trim();
          if (!transferEncoding || !["base64", "quoted-printable"].includes(transferEncoding)) {
            if (/^text\//i.test(contentType)) {
              if (this._isPlainText && !this._hasLongLines) {
                transferEncoding = "7bit";
              } else if (typeof this.content === "string" || this.content instanceof Buffer) {
                transferEncoding = this._getTextEncoding(this.content) === "Q" ? "quoted-printable" : "base64";
              } else {
                transferEncoding = this.textEncoding === "B" ? "base64" : "quoted-printable";
              }
            } else if (!/^(multipart|message)\//i.test(contentType)) {
              transferEncoding = transferEncoding || "base64";
            }
          }
        }
        return transferEncoding;
      }
      /**
       * Builds the header block for the mime node. Append \r\n\r\n before writing the content
       *
       * @returns {String} Headers
       */
      buildHeaders() {
        let transferEncoding = this.getTransferEncoding();
        let headers = [];
        if (transferEncoding) {
          this.setHeader("Content-Transfer-Encoding", transferEncoding);
        }
        if (this.filename && !this.getHeader("Content-Disposition")) {
          this.setHeader("Content-Disposition", "attachment");
        }
        if (this.rootNode === this) {
          if (!this.getHeader("Date")) {
            this.setHeader("Date", this.date.toUTCString().replace(/GMT/, "+0000"));
          }
          this.messageId();
          if (!this.getHeader("MIME-Version")) {
            this.setHeader("MIME-Version", "1.0");
          }
          for (let i = this._headers.length - 2; i >= 0; i--) {
            let header = this._headers[i];
            if (header.key === "Content-Type") {
              this._headers.splice(i, 1);
              this._headers.push(header);
            }
          }
        }
        this._headers.forEach((header) => {
          let key = header.key;
          let value = header.value;
          let structured;
          let param;
          let options = {};
          let formattedHeaders = ["From", "Sender", "To", "Cc", "Bcc", "Reply-To", "Date", "References"];
          if (value && typeof value === "object" && !formattedHeaders.includes(key)) {
            Object.keys(value).forEach((key2) => {
              if (key2 !== "value") {
                options[key2] = value[key2];
              }
            });
            value = (value.value || "").toString();
            if (!value.trim()) {
              return;
            }
          }
          if (options.prepared) {
            if (options.foldLines) {
              headers.push(mimeFuncs.foldLines(key + ": " + value));
            } else {
              headers.push(key + ": " + value);
            }
            return;
          }
          switch (header.key) {
            case "Content-Disposition":
              structured = mimeFuncs.parseHeaderValue(value);
              if (this.filename) {
                structured.params.filename = this.filename;
              }
              value = mimeFuncs.buildHeaderValue(structured);
              break;
            case "Content-Type":
              structured = mimeFuncs.parseHeaderValue(value);
              this._handleContentType(structured);
              if (structured.value.match(/^text\/plain\b/) && typeof this.content === "string" && /[\u0080-\uFFFF]/.test(this.content)) {
                structured.params.charset = "utf-8";
              }
              value = mimeFuncs.buildHeaderValue(structured);
              if (this.filename) {
                param = this._encodeWords(this.filename);
                if (param !== this.filename || /[\s'"\\;:/=(),<>@[\]?]|^-/.test(param)) {
                  param = '"' + param + '"';
                }
                value += "; name=" + param;
              }
              break;
            case "Bcc":
              if (!this.keepBcc) {
                return;
              }
              break;
          }
          value = this._encodeHeaderValue(key, value);
          if (!(value || "").toString().trim()) {
            return;
          }
          if (typeof this.normalizeHeaderKey === "function") {
            let normalized = this.normalizeHeaderKey(key, value);
            if (normalized && typeof normalized === "string" && normalized.length) {
              key = normalized;
            }
          }
          headers.push(mimeFuncs.foldLines(key + ": " + value, 76));
        });
        return headers.join("\r\n");
      }
      /**
       * Streams the rfc2822 message from the current node. If this is a root node,
       * mandatory header fields are set if missing (Date, Message-Id, MIME-Version)
       *
       * @return {String} Compiled message
       */
      createReadStream(options) {
        options = options || {};
        let stream = new PassThrough(options);
        let outputStream = stream;
        let transform;
        this.stream(stream, options, (err) => {
          if (err) {
            outputStream.emit("error", err);
            return;
          }
          stream.end();
        });
        for (let i = 0, len = this._transforms.length; i < len; i++) {
          transform = typeof this._transforms[i] === "function" ? this._transforms[i]() : this._transforms[i];
          outputStream.once("error", (err) => {
            transform.emit("error", err);
          });
          outputStream = outputStream.pipe(transform);
        }
        transform = new LastNewline();
        outputStream.once("error", (err) => {
          transform.emit("error", err);
        });
        outputStream = outputStream.pipe(transform);
        for (let i = 0, len = this._processFuncs.length; i < len; i++) {
          transform = this._processFuncs[i];
          outputStream = transform(outputStream);
        }
        if (this.newline) {
          const winbreak = ["win", "windows", "dos", "\r\n"].includes(this.newline.toString().toLowerCase());
          const newlineTransform = winbreak ? new LeWindows() : new LeUnix();
          const stream2 = outputStream.pipe(newlineTransform);
          outputStream.on("error", (err) => stream2.emit("error", err));
          return stream2;
        }
        return outputStream;
      }
      /**
       * Appends a transform stream object to the transforms list. Final output
       * is passed through this stream before exposing
       *
       * @param {Object} transform Read-Write stream
       */
      transform(transform) {
        this._transforms.push(transform);
      }
      /**
       * Appends a post process function. The functon is run after transforms and
       * uses the following syntax
       *
       *   processFunc(input) -> outputStream
       *
       * @param {Object} processFunc Read-Write stream
       */
      processFunc(processFunc) {
        this._processFuncs.push(processFunc);
      }
      stream(outputStream, options, done) {
        let transferEncoding = this.getTransferEncoding();
        let contentStream;
        let localStream;
        let returned = false;
        let callback = (err) => {
          if (returned) {
            return;
          }
          returned = true;
          done(err);
        };
        let finalize = () => {
          let childId = 0;
          let processChildNode = () => {
            if (childId >= this.childNodes.length) {
              outputStream.write("\r\n--" + this.boundary + "--\r\n");
              return callback();
            }
            let child = this.childNodes[childId++];
            outputStream.write((childId > 1 ? "\r\n" : "") + "--" + this.boundary + "\r\n");
            child.stream(outputStream, options, (err) => {
              if (err) {
                return callback(err);
              }
              setImmediate(processChildNode);
            });
          };
          if (this.multipart) {
            setImmediate(processChildNode);
          } else {
            return callback();
          }
        };
        let sendContent = () => {
          if (this.content) {
            if (Object.prototype.toString.call(this.content) === "[object Error]") {
              return callback(this.content);
            }
            if (typeof this.content.pipe === "function") {
              this.content.removeListener("error", this._contentErrorHandler);
              this._contentErrorHandler = (err) => callback(err);
              this.content.once("error", this._contentErrorHandler);
            }
            let createStream = () => {
              if (["quoted-printable", "base64"].includes(transferEncoding)) {
                contentStream = new (transferEncoding === "base64" ? base64 : qp).Encoder(options);
                contentStream.pipe(outputStream, {
                  end: false
                });
                contentStream.once("end", finalize);
                contentStream.once("error", (err) => callback(err));
                localStream = this._getStream(this.content);
                localStream.pipe(contentStream);
              } else {
                localStream = this._getStream(this.content);
                localStream.pipe(outputStream, {
                  end: false
                });
                localStream.once("end", finalize);
              }
              localStream.once("error", (err) => callback(err));
            };
            if (this.content._resolve) {
              let chunks = [];
              let chunklen = 0;
              let returned2 = false;
              let sourceStream = this._getStream(this.content);
              sourceStream.on("error", (err) => {
                if (returned2) {
                  return;
                }
                returned2 = true;
                callback(err);
              });
              sourceStream.on("readable", () => {
                let chunk;
                while ((chunk = sourceStream.read()) !== null) {
                  chunks.push(chunk);
                  chunklen += chunk.length;
                }
              });
              sourceStream.on("end", () => {
                if (returned2) {
                  return;
                }
                returned2 = true;
                this.content._resolve = false;
                this.content._resolvedValue = Buffer.concat(chunks, chunklen);
                setImmediate(createStream);
              });
            } else {
              setImmediate(createStream);
            }
            return;
          } else {
            return setImmediate(finalize);
          }
        };
        if (this._raw) {
          setImmediate(() => {
            if (Object.prototype.toString.call(this._raw) === "[object Error]") {
              return callback(this._raw);
            }
            if (typeof this._raw.pipe === "function") {
              this._raw.removeListener("error", this._contentErrorHandler);
            }
            let raw2 = this._getStream(this._raw);
            raw2.pipe(outputStream, {
              end: false
            });
            raw2.on("error", (err) => outputStream.emit("error", err));
            raw2.on("end", finalize);
          });
        } else {
          outputStream.write(this.buildHeaders() + "\r\n\r\n");
          setImmediate(sendContent);
        }
      }
      /**
       * Sets envelope to be used instead of the generated one
       *
       * @return {Object} SMTP envelope in the form of {from: 'from@example.com', to: ['to@example.com']}
       */
      setEnvelope(envelope) {
        let list;
        this._envelope = {
          from: false,
          to: []
        };
        if (envelope.from) {
          list = [];
          this._convertAddresses(this._parseAddresses(envelope.from), list);
          list = list.filter((address) => address && address.address);
          if (list.length && list[0]) {
            this._envelope.from = list[0].address;
          }
        }
        ["to", "cc", "bcc"].forEach((key) => {
          if (envelope[key]) {
            this._convertAddresses(this._parseAddresses(envelope[key]), this._envelope.to);
          }
        });
        this._envelope.to = this._envelope.to.map((to) => to.address).filter((address) => address);
        let standardFields = ["to", "cc", "bcc", "from"];
        Object.keys(envelope).forEach((key) => {
          if (!standardFields.includes(key)) {
            this._envelope[key] = envelope[key];
          }
        });
        return this;
      }
      /**
       * Generates and returns an object with parsed address fields
       *
       * @return {Object} Address object
       */
      getAddresses() {
        let addresses = {};
        this._headers.forEach((header) => {
          let key = header.key.toLowerCase();
          if (["from", "sender", "reply-to", "to", "cc", "bcc"].includes(key)) {
            if (!Array.isArray(addresses[key])) {
              addresses[key] = [];
            }
            this._convertAddresses(this._parseAddresses(header.value), addresses[key]);
          }
        });
        return addresses;
      }
      /**
       * Generates and returns SMTP envelope with the sender address and a list of recipients addresses
       *
       * @return {Object} SMTP envelope in the form of {from: 'from@example.com', to: ['to@example.com']}
       */
      getEnvelope() {
        if (this._envelope) {
          return this._envelope;
        }
        let envelope = {
          from: false,
          to: []
        };
        this._headers.forEach((header) => {
          let list = [];
          if (header.key === "From" || !envelope.from && ["Reply-To", "Sender"].includes(header.key)) {
            this._convertAddresses(this._parseAddresses(header.value), list);
            if (list.length && list[0]) {
              envelope.from = list[0].address;
            }
          } else if (["To", "Cc", "Bcc"].includes(header.key)) {
            this._convertAddresses(this._parseAddresses(header.value), envelope.to);
          }
        });
        envelope.to = envelope.to.map((to) => to.address);
        return envelope;
      }
      /**
       * Returns Message-Id value. If it does not exist, then creates one
       *
       * @return {String} Message-Id value
       */
      messageId() {
        let messageId = this.getHeader("Message-ID");
        if (!messageId) {
          messageId = this._generateMessageId();
          this.setHeader("Message-ID", messageId);
        }
        return messageId;
      }
      /**
       * Sets pregenerated content that will be used as the output of this node
       *
       * @param {String|Buffer|Stream} Raw MIME contents
       */
      setRaw(raw2) {
        this._raw = raw2;
        if (this._raw && typeof this._raw.pipe === "function") {
          this._contentErrorHandler = (err) => {
            this._raw.removeListener("error", this._contentErrorHandler);
            this._raw = err;
          };
          this._raw.once("error", this._contentErrorHandler);
        }
        return this;
      }
      /////// PRIVATE METHODS
      /**
       * Detects and returns handle to a stream related with the content.
       *
       * @param {Mixed} content Node content
       * @returns {Object} Stream object
       */
      _getStream(content) {
        let contentStream;
        if (content._resolvedValue) {
          contentStream = new PassThrough();
          setImmediate(() => {
            try {
              contentStream.end(content._resolvedValue);
            } catch (err) {
              contentStream.emit("error", err);
            }
          });
          return contentStream;
        } else if (typeof content.pipe === "function") {
          return content;
        } else if (content && typeof content.path === "string" && !content.href) {
          if (this.disableFileAccess) {
            contentStream = new PassThrough();
            setImmediate(() => contentStream.emit("error", new Error("File access rejected for " + content.path)));
            return contentStream;
          }
          return fs.createReadStream(content.path);
        } else if (content && typeof content.href === "string") {
          if (this.disableUrlAccess) {
            contentStream = new PassThrough();
            setImmediate(() => contentStream.emit("error", new Error("Url access rejected for " + content.href)));
            return contentStream;
          }
          return nmfetch(content.href, { headers: content.httpHeaders });
        } else {
          contentStream = new PassThrough();
          setImmediate(() => {
            try {
              contentStream.end(content || "");
            } catch (err) {
              contentStream.emit("error", err);
            }
          });
          return contentStream;
        }
      }
      /**
       * Parses addresses. Takes in a single address or an array or an
       * array of address arrays (eg. To: [[first group], [second group],...])
       *
       * @param {Mixed} addresses Addresses to be parsed
       * @return {Array} An array of address objects
       */
      _parseAddresses(addresses) {
        return [].concat.apply(
          [],
          [].concat(addresses).map((address) => {
            if (address && address.address) {
              address.address = this._normalizeAddress(address.address);
              address.name = address.name || "";
              return [address];
            }
            return addressparser(address);
          })
        );
      }
      /**
       * Normalizes a header key, uses Camel-Case form, except for uppercase MIME-
       *
       * @param {String} key Key to be normalized
       * @return {String} key in Camel-Case form
       */
      _normalizeHeaderKey(key) {
        key = (key || "").toString().replace(/\r?\n|\r/g, " ").trim().toLowerCase().replace(/^X-SMTPAPI$|^(MIME|DKIM|ARC|BIMI)\b|^[a-z]|-(SPF|FBL|ID|MD5)$|-[a-z]/gi, (c) => c.toUpperCase()).replace(/^Content-Features$/i, "Content-features");
        return key;
      }
      /**
       * Checks if the content type is multipart and defines boundary if needed.
       * Doesn't return anything, modifies object argument instead.
       *
       * @param {Object} structured Parsed header value for 'Content-Type' key
       */
      _handleContentType(structured) {
        this.contentType = structured.value.trim().toLowerCase();
        this.multipart = /^multipart\//i.test(this.contentType) ? this.contentType.substr(this.contentType.indexOf("/") + 1) : false;
        if (this.multipart) {
          this.boundary = structured.params.boundary = structured.params.boundary || this.boundary || this._generateBoundary();
        } else {
          this.boundary = false;
        }
      }
      /**
       * Generates a multipart boundary value
       *
       * @return {String} boundary value
       */
      _generateBoundary() {
        return this.rootNode.boundaryPrefix + "-" + this.rootNode.baseBoundary + "-Part_" + this._nodeId;
      }
      /**
       * Encodes a header value for use in the generated rfc2822 email.
       *
       * @param {String} key Header key
       * @param {String} value Header value
       */
      _encodeHeaderValue(key, value) {
        key = this._normalizeHeaderKey(key);
        switch (key) {
          // Structured headers
          case "From":
          case "Sender":
          case "To":
          case "Cc":
          case "Bcc":
          case "Reply-To":
            return this._convertAddresses(this._parseAddresses(value));
          // values enclosed in <>
          case "Message-ID":
          case "In-Reply-To":
          case "Content-Id":
            value = (value || "").toString().replace(/\r?\n|\r/g, " ");
            if (value.charAt(0) !== "<") {
              value = "<" + value;
            }
            if (value.charAt(value.length - 1) !== ">") {
              value = value + ">";
            }
            return value;
          // space separated list of values enclosed in <>
          case "References":
            value = [].concat.apply(
              [],
              [].concat(value || "").map((elm) => {
                elm = (elm || "").toString().replace(/\r?\n|\r/g, " ").trim();
                return elm.replace(/<[^>]*>/g, (str) => str.replace(/\s/g, "")).split(/\s+/);
              })
            ).map((elm) => {
              if (elm.charAt(0) !== "<") {
                elm = "<" + elm;
              }
              if (elm.charAt(elm.length - 1) !== ">") {
                elm = elm + ">";
              }
              return elm;
            });
            return value.join(" ").trim();
          case "Date":
            if (Object.prototype.toString.call(value) === "[object Date]") {
              return value.toUTCString().replace(/GMT/, "+0000");
            }
            value = (value || "").toString().replace(/\r?\n|\r/g, " ");
            return this._encodeWords(value);
          case "Content-Type":
          case "Content-Disposition":
            return (value || "").toString().replace(/\r?\n|\r/g, " ");
          default:
            value = (value || "").toString().replace(/\r?\n|\r/g, " ");
            return this._encodeWords(value);
        }
      }
      /**
       * Rebuilds address object using punycode and other adjustments
       *
       * @param {Array} addresses An array of address objects
       * @param {Array} [uniqueList] An array to be populated with addresses
       * @return {String} address string
       */
      _convertAddresses(addresses, uniqueList) {
        let values = [];
        uniqueList = uniqueList || [];
        [].concat(addresses || []).forEach((address) => {
          if (address.address) {
            address.address = this._normalizeAddress(address.address);
            if (!address.name) {
              values.push(address.address.indexOf(" ") >= 0 ? `<${address.address}>` : `${address.address}`);
            } else if (address.name) {
              values.push(`${this._encodeAddressName(address.name)} <${address.address}>`);
            }
            if (address.address) {
              if (!uniqueList.filter((a) => a.address === address.address).length) {
                uniqueList.push(address);
              }
            }
          } else if (address.group) {
            let groupListAddresses = (address.group.length ? this._convertAddresses(address.group, uniqueList) : "").trim();
            values.push(`${this._encodeAddressName(address.name)}:${groupListAddresses};`);
          }
        });
        return values.join(", ");
      }
      /**
       * Normalizes an email address
       *
       * @param {Array} address An array of address objects
       * @return {String} address string
       */
      _normalizeAddress(address) {
        address = (address || "").toString().replace(/[\x00-\x1F<>]+/g, " ").trim();
        let lastAt = address.lastIndexOf("@");
        if (lastAt < 0) {
          return address;
        }
        let user = address.substr(0, lastAt);
        let domain = address.substr(lastAt + 1);
        let encodedDomain;
        try {
          encodedDomain = punycode.toASCII(domain.toLowerCase());
        } catch (err) {
        }
        if (user.indexOf(" ") >= 0) {
          if (user.charAt(0) !== '"') {
            user = '"' + user;
          }
          if (user.substr(-1) !== '"') {
            user = user + '"';
          }
        }
        return `${user}@${encodedDomain}`;
      }
      /**
       * If needed, mime encodes the name part
       *
       * @param {String} name Name part of an address
       * @returns {String} Mime word encoded string if needed
       */
      _encodeAddressName(name) {
        if (!/^[\w ]*$/.test(name)) {
          if (/^[\x20-\x7e]*$/.test(name)) {
            return '"' + name.replace(/([\\"])/g, "\\$1") + '"';
          } else {
            return mimeFuncs.encodeWord(name, this._getTextEncoding(name), 52);
          }
        }
        return name;
      }
      /**
       * If needed, mime encodes the name part
       *
       * @param {String} name Name part of an address
       * @returns {String} Mime word encoded string if needed
       */
      _encodeWords(value) {
        return mimeFuncs.encodeWords(value, this._getTextEncoding(value), 52, true);
      }
      /**
       * Detects best mime encoding for a text value
       *
       * @param {String} value Value to check for
       * @return {String} either 'Q' or 'B'
       */
      _getTextEncoding(value) {
        value = (value || "").toString();
        let encoding = this.textEncoding;
        let latinLen;
        let nonLatinLen;
        if (!encoding) {
          nonLatinLen = (value.match(/[\x00-\x08\x0B\x0C\x0E-\x1F\u0080-\uFFFF]/g) || []).length;
          latinLen = (value.match(/[a-z]/gi) || []).length;
          encoding = nonLatinLen < latinLen ? "Q" : "B";
        }
        return encoding;
      }
      /**
       * Generates a message id
       *
       * @return {String} Random Message-ID value
       */
      _generateMessageId() {
        return "<" + [2, 2, 2, 6].reduce(
          // crux to generate UUID-like random strings
          (prev, len) => prev + "-" + crypto5.randomBytes(len).toString("hex"),
          crypto5.randomBytes(4).toString("hex")
        ) + "@" + // try to use the domain of the FROM address or fallback to server hostname
        (this.getEnvelope().from || this.hostname || "localhost").split("@").pop() + ">";
      }
    };
    module.exports = MimeNode;
  }
});

// node_modules/nodemailer/lib/mail-composer/index.js
var require_mail_composer = __commonJS({
  "node_modules/nodemailer/lib/mail-composer/index.js"(exports, module) {
    "use strict";
    var MimeNode = require_mime_node();
    var mimeFuncs = require_mime_funcs();
    var parseDataURI = require_shared().parseDataURI;
    var MailComposer = class {
      constructor(mail) {
        this.mail = mail || {};
        this.message = false;
      }
      /**
       * Builds MimeNode instance
       */
      compile() {
        this._alternatives = this.getAlternatives();
        this._htmlNode = this._alternatives.filter((alternative) => /^text\/html\b/i.test(alternative.contentType)).pop();
        this._attachments = this.getAttachments(!!this._htmlNode);
        this._useRelated = !!(this._htmlNode && this._attachments.related.length);
        this._useAlternative = this._alternatives.length > 1;
        this._useMixed = this._attachments.attached.length > 1 || this._alternatives.length && this._attachments.attached.length === 1;
        if (this.mail.raw) {
          this.message = new MimeNode("message/rfc822", { newline: this.mail.newline }).setRaw(this.mail.raw);
        } else if (this._useMixed) {
          this.message = this._createMixed();
        } else if (this._useAlternative) {
          this.message = this._createAlternative();
        } else if (this._useRelated) {
          this.message = this._createRelated();
        } else {
          this.message = this._createContentNode(
            false,
            [].concat(this._alternatives || []).concat(this._attachments.attached || []).shift() || {
              contentType: "text/plain",
              content: ""
            }
          );
        }
        if (this.mail.headers) {
          this.message.addHeader(this.mail.headers);
        }
        ["from", "sender", "to", "cc", "bcc", "reply-to", "in-reply-to", "references", "subject", "message-id", "date"].forEach((header) => {
          let key = header.replace(/-(\w)/g, (o, c) => c.toUpperCase());
          if (this.mail[key]) {
            this.message.setHeader(header, this.mail[key]);
          }
        });
        if (this.mail.envelope) {
          this.message.setEnvelope(this.mail.envelope);
        }
        this.message.messageId();
        return this.message;
      }
      /**
       * List all attachments. Resulting attachment objects can be used as input for MimeNode nodes
       *
       * @param {Boolean} findRelated If true separate related attachments from attached ones
       * @returns {Object} An object of arrays (`related` and `attached`)
       */
      getAttachments(findRelated) {
        let icalEvent, eventObject;
        let attachments = [].concat(this.mail.attachments || []).map((attachment, i) => {
          let data;
          let isMessageNode = /^message\//i.test(attachment.contentType);
          if (/^data:/i.test(attachment.path || attachment.href)) {
            attachment = this._processDataUrl(attachment);
          }
          let contentType = attachment.contentType || mimeFuncs.detectMimeType(attachment.filename || attachment.path || attachment.href || "bin");
          let isImage = /^image\//i.test(contentType);
          let contentDisposition = attachment.contentDisposition || (isMessageNode || isImage && attachment.cid ? "inline" : "attachment");
          data = {
            contentType,
            contentDisposition,
            contentTransferEncoding: "contentTransferEncoding" in attachment ? attachment.contentTransferEncoding : "base64"
          };
          if (attachment.filename) {
            data.filename = attachment.filename;
          } else if (!isMessageNode && attachment.filename !== false) {
            data.filename = (attachment.path || attachment.href || "").split("/").pop().split("?").shift() || "attachment-" + (i + 1);
            if (data.filename.indexOf(".") < 0) {
              data.filename += "." + mimeFuncs.detectExtension(data.contentType);
            }
          }
          if (/^https?:\/\//i.test(attachment.path)) {
            attachment.href = attachment.path;
            attachment.path = void 0;
          }
          if (attachment.cid) {
            data.cid = attachment.cid;
          }
          if (attachment.raw) {
            data.raw = attachment.raw;
          } else if (attachment.path) {
            data.content = {
              path: attachment.path
            };
          } else if (attachment.href) {
            data.content = {
              href: attachment.href,
              httpHeaders: attachment.httpHeaders
            };
          } else {
            data.content = attachment.content || "";
          }
          if (attachment.encoding) {
            data.encoding = attachment.encoding;
          }
          if (attachment.headers) {
            data.headers = attachment.headers;
          }
          return data;
        });
        if (this.mail.icalEvent) {
          if (typeof this.mail.icalEvent === "object" && (this.mail.icalEvent.content || this.mail.icalEvent.path || this.mail.icalEvent.href || this.mail.icalEvent.raw)) {
            icalEvent = this.mail.icalEvent;
          } else {
            icalEvent = {
              content: this.mail.icalEvent
            };
          }
          eventObject = {};
          Object.keys(icalEvent).forEach((key) => {
            eventObject[key] = icalEvent[key];
          });
          eventObject.contentType = "application/ics";
          if (!eventObject.headers) {
            eventObject.headers = {};
          }
          eventObject.filename = eventObject.filename || "invite.ics";
          eventObject.headers["Content-Disposition"] = "attachment";
          eventObject.headers["Content-Transfer-Encoding"] = "base64";
        }
        if (!findRelated) {
          return {
            attached: attachments.concat(eventObject || []),
            related: []
          };
        } else {
          return {
            attached: attachments.filter((attachment) => !attachment.cid).concat(eventObject || []),
            related: attachments.filter((attachment) => !!attachment.cid)
          };
        }
      }
      /**
       * List alternatives. Resulting objects can be used as input for MimeNode nodes
       *
       * @returns {Array} An array of alternative elements. Includes the `text` and `html` values as well
       */
      getAlternatives() {
        let alternatives = [], text, html, watchHtml, amp, icalEvent, eventObject;
        if (this.mail.text) {
          if (typeof this.mail.text === "object" && (this.mail.text.content || this.mail.text.path || this.mail.text.href || this.mail.text.raw)) {
            text = this.mail.text;
          } else {
            text = {
              content: this.mail.text
            };
          }
          text.contentType = "text/plain; charset=utf-8";
        }
        if (this.mail.watchHtml) {
          if (typeof this.mail.watchHtml === "object" && (this.mail.watchHtml.content || this.mail.watchHtml.path || this.mail.watchHtml.href || this.mail.watchHtml.raw)) {
            watchHtml = this.mail.watchHtml;
          } else {
            watchHtml = {
              content: this.mail.watchHtml
            };
          }
          watchHtml.contentType = "text/watch-html; charset=utf-8";
        }
        if (this.mail.amp) {
          if (typeof this.mail.amp === "object" && (this.mail.amp.content || this.mail.amp.path || this.mail.amp.href || this.mail.amp.raw)) {
            amp = this.mail.amp;
          } else {
            amp = {
              content: this.mail.amp
            };
          }
          amp.contentType = "text/x-amp-html; charset=utf-8";
        }
        if (this.mail.icalEvent) {
          if (typeof this.mail.icalEvent === "object" && (this.mail.icalEvent.content || this.mail.icalEvent.path || this.mail.icalEvent.href || this.mail.icalEvent.raw)) {
            icalEvent = this.mail.icalEvent;
          } else {
            icalEvent = {
              content: this.mail.icalEvent
            };
          }
          eventObject = {};
          Object.keys(icalEvent).forEach((key) => {
            eventObject[key] = icalEvent[key];
          });
          if (eventObject.content && typeof eventObject.content === "object") {
            eventObject.content._resolve = true;
          }
          eventObject.filename = false;
          eventObject.contentType = "text/calendar; charset=utf-8; method=" + (eventObject.method || "PUBLISH").toString().trim().toUpperCase();
          if (!eventObject.headers) {
            eventObject.headers = {};
          }
        }
        if (this.mail.html) {
          if (typeof this.mail.html === "object" && (this.mail.html.content || this.mail.html.path || this.mail.html.href || this.mail.html.raw)) {
            html = this.mail.html;
          } else {
            html = {
              content: this.mail.html
            };
          }
          html.contentType = "text/html; charset=utf-8";
        }
        [].concat(text || []).concat(watchHtml || []).concat(amp || []).concat(html || []).concat(eventObject || []).concat(this.mail.alternatives || []).forEach((alternative) => {
          let data;
          if (/^data:/i.test(alternative.path || alternative.href)) {
            alternative = this._processDataUrl(alternative);
          }
          data = {
            contentType: alternative.contentType || mimeFuncs.detectMimeType(alternative.filename || alternative.path || alternative.href || "txt"),
            contentTransferEncoding: alternative.contentTransferEncoding
          };
          if (alternative.filename) {
            data.filename = alternative.filename;
          }
          if (/^https?:\/\//i.test(alternative.path)) {
            alternative.href = alternative.path;
            alternative.path = void 0;
          }
          if (alternative.raw) {
            data.raw = alternative.raw;
          } else if (alternative.path) {
            data.content = {
              path: alternative.path
            };
          } else if (alternative.href) {
            data.content = {
              href: alternative.href
            };
          } else {
            data.content = alternative.content || "";
          }
          if (alternative.encoding) {
            data.encoding = alternative.encoding;
          }
          if (alternative.headers) {
            data.headers = alternative.headers;
          }
          alternatives.push(data);
        });
        return alternatives;
      }
      /**
       * Builds multipart/mixed node. It should always contain different type of elements on the same level
       * eg. text + attachments
       *
       * @param {Object} parentNode Parent for this note. If it does not exist, a root node is created
       * @returns {Object} MimeNode node element
       */
      _createMixed(parentNode) {
        let node;
        if (!parentNode) {
          node = new MimeNode("multipart/mixed", {
            baseBoundary: this.mail.baseBoundary,
            textEncoding: this.mail.textEncoding,
            boundaryPrefix: this.mail.boundaryPrefix,
            disableUrlAccess: this.mail.disableUrlAccess,
            disableFileAccess: this.mail.disableFileAccess,
            normalizeHeaderKey: this.mail.normalizeHeaderKey,
            newline: this.mail.newline
          });
        } else {
          node = parentNode.createChild("multipart/mixed", {
            disableUrlAccess: this.mail.disableUrlAccess,
            disableFileAccess: this.mail.disableFileAccess,
            normalizeHeaderKey: this.mail.normalizeHeaderKey,
            newline: this.mail.newline
          });
        }
        if (this._useAlternative) {
          this._createAlternative(node);
        } else if (this._useRelated) {
          this._createRelated(node);
        }
        [].concat(!this._useAlternative && this._alternatives || []).concat(this._attachments.attached || []).forEach((element) => {
          if (!this._useRelated || element !== this._htmlNode) {
            this._createContentNode(node, element);
          }
        });
        return node;
      }
      /**
       * Builds multipart/alternative node. It should always contain same type of elements on the same level
       * eg. text + html view of the same data
       *
       * @param {Object} parentNode Parent for this note. If it does not exist, a root node is created
       * @returns {Object} MimeNode node element
       */
      _createAlternative(parentNode) {
        let node;
        if (!parentNode) {
          node = new MimeNode("multipart/alternative", {
            baseBoundary: this.mail.baseBoundary,
            textEncoding: this.mail.textEncoding,
            boundaryPrefix: this.mail.boundaryPrefix,
            disableUrlAccess: this.mail.disableUrlAccess,
            disableFileAccess: this.mail.disableFileAccess,
            normalizeHeaderKey: this.mail.normalizeHeaderKey,
            newline: this.mail.newline
          });
        } else {
          node = parentNode.createChild("multipart/alternative", {
            disableUrlAccess: this.mail.disableUrlAccess,
            disableFileAccess: this.mail.disableFileAccess,
            normalizeHeaderKey: this.mail.normalizeHeaderKey,
            newline: this.mail.newline
          });
        }
        this._alternatives.forEach((alternative) => {
          if (this._useRelated && this._htmlNode === alternative) {
            this._createRelated(node);
          } else {
            this._createContentNode(node, alternative);
          }
        });
        return node;
      }
      /**
       * Builds multipart/related node. It should always contain html node with related attachments
       *
       * @param {Object} parentNode Parent for this note. If it does not exist, a root node is created
       * @returns {Object} MimeNode node element
       */
      _createRelated(parentNode) {
        let node;
        if (!parentNode) {
          node = new MimeNode('multipart/related; type="text/html"', {
            baseBoundary: this.mail.baseBoundary,
            textEncoding: this.mail.textEncoding,
            boundaryPrefix: this.mail.boundaryPrefix,
            disableUrlAccess: this.mail.disableUrlAccess,
            disableFileAccess: this.mail.disableFileAccess,
            normalizeHeaderKey: this.mail.normalizeHeaderKey,
            newline: this.mail.newline
          });
        } else {
          node = parentNode.createChild('multipart/related; type="text/html"', {
            disableUrlAccess: this.mail.disableUrlAccess,
            disableFileAccess: this.mail.disableFileAccess,
            normalizeHeaderKey: this.mail.normalizeHeaderKey,
            newline: this.mail.newline
          });
        }
        this._createContentNode(node, this._htmlNode);
        this._attachments.related.forEach((alternative) => this._createContentNode(node, alternative));
        return node;
      }
      /**
       * Creates a regular node with contents
       *
       * @param {Object} parentNode Parent for this note. If it does not exist, a root node is created
       * @param {Object} element Node data
       * @returns {Object} MimeNode node element
       */
      _createContentNode(parentNode, element) {
        element = element || {};
        element.content = element.content || "";
        let node;
        let encoding = (element.encoding || "utf8").toString().toLowerCase().replace(/[-_\s]/g, "");
        if (!parentNode) {
          node = new MimeNode(element.contentType, {
            filename: element.filename,
            baseBoundary: this.mail.baseBoundary,
            textEncoding: this.mail.textEncoding,
            boundaryPrefix: this.mail.boundaryPrefix,
            disableUrlAccess: this.mail.disableUrlAccess,
            disableFileAccess: this.mail.disableFileAccess,
            normalizeHeaderKey: this.mail.normalizeHeaderKey,
            newline: this.mail.newline
          });
        } else {
          node = parentNode.createChild(element.contentType, {
            filename: element.filename,
            textEncoding: this.mail.textEncoding,
            disableUrlAccess: this.mail.disableUrlAccess,
            disableFileAccess: this.mail.disableFileAccess,
            normalizeHeaderKey: this.mail.normalizeHeaderKey,
            newline: this.mail.newline
          });
        }
        if (element.headers) {
          node.addHeader(element.headers);
        }
        if (element.cid) {
          node.setHeader("Content-Id", "<" + element.cid.replace(/[<>]/g, "") + ">");
        }
        if (element.contentTransferEncoding) {
          node.setHeader("Content-Transfer-Encoding", element.contentTransferEncoding);
        } else if (this.mail.encoding && /^text\//i.test(element.contentType)) {
          node.setHeader("Content-Transfer-Encoding", this.mail.encoding);
        }
        if (!/^text\//i.test(element.contentType) || element.contentDisposition) {
          node.setHeader(
            "Content-Disposition",
            element.contentDisposition || (element.cid && /^image\//i.test(element.contentType) ? "inline" : "attachment")
          );
        }
        if (typeof element.content === "string" && !["utf8", "usascii", "ascii"].includes(encoding)) {
          element.content = Buffer.from(element.content, encoding);
        }
        if (element.raw) {
          node.setRaw(element.raw);
        } else {
          node.setContent(element.content);
        }
        return node;
      }
      /**
       * Parses data uri and converts it to a Buffer
       *
       * @param {Object} element Content element
       * @return {Object} Parsed element
       */
      _processDataUrl(element) {
        let parsedDataUri;
        if ((element.path || element.href).match(/^data:/)) {
          parsedDataUri = parseDataURI(element.path || element.href);
        }
        if (!parsedDataUri) {
          return element;
        }
        element.content = parsedDataUri.data;
        element.contentType = element.contentType || parsedDataUri.contentType;
        if ("path" in element) {
          element.path = false;
        }
        if ("href" in element) {
          element.href = false;
        }
        return element;
      }
    };
    module.exports = MailComposer;
  }
});

// node_modules/nodemailer/lib/dkim/message-parser.js
var require_message_parser = __commonJS({
  "node_modules/nodemailer/lib/dkim/message-parser.js"(exports, module) {
    "use strict";
    var Transform = __require("stream").Transform;
    var MessageParser = class extends Transform {
      constructor(options) {
        super(options);
        this.lastBytes = Buffer.alloc(4);
        this.headersParsed = false;
        this.headerBytes = 0;
        this.headerChunks = [];
        this.rawHeaders = false;
        this.bodySize = 0;
      }
      /**
       * Keeps count of the last 4 bytes in order to detect line breaks on chunk boundaries
       *
       * @param {Buffer} data Next data chunk from the stream
       */
      updateLastBytes(data) {
        let lblen = this.lastBytes.length;
        let nblen = Math.min(data.length, lblen);
        for (let i = 0, len = lblen - nblen; i < len; i++) {
          this.lastBytes[i] = this.lastBytes[i + nblen];
        }
        for (let i = 1; i <= nblen; i++) {
          this.lastBytes[lblen - i] = data[data.length - i];
        }
      }
      /**
       * Finds and removes message headers from the remaining body. We want to keep
       * headers separated until final delivery to be able to modify these
       *
       * @param {Buffer} data Next chunk of data
       * @return {Boolean} Returns true if headers are already found or false otherwise
       */
      checkHeaders(data) {
        if (this.headersParsed) {
          return true;
        }
        let lblen = this.lastBytes.length;
        let headerPos = 0;
        this.curLinePos = 0;
        for (let i = 0, len = this.lastBytes.length + data.length; i < len; i++) {
          let chr;
          if (i < lblen) {
            chr = this.lastBytes[i];
          } else {
            chr = data[i - lblen];
          }
          if (chr === 10 && i) {
            let pr1 = i - 1 < lblen ? this.lastBytes[i - 1] : data[i - 1 - lblen];
            let pr2 = i > 1 ? i - 2 < lblen ? this.lastBytes[i - 2] : data[i - 2 - lblen] : false;
            if (pr1 === 10) {
              this.headersParsed = true;
              headerPos = i - lblen + 1;
              this.headerBytes += headerPos;
              break;
            } else if (pr1 === 13 && pr2 === 10) {
              this.headersParsed = true;
              headerPos = i - lblen + 1;
              this.headerBytes += headerPos;
              break;
            }
          }
        }
        if (this.headersParsed) {
          this.headerChunks.push(data.slice(0, headerPos));
          this.rawHeaders = Buffer.concat(this.headerChunks, this.headerBytes);
          this.headerChunks = null;
          this.emit("headers", this.parseHeaders());
          if (data.length - 1 > headerPos) {
            let chunk = data.slice(headerPos);
            this.bodySize += chunk.length;
            setImmediate(() => this.push(chunk));
          }
          return false;
        } else {
          this.headerBytes += data.length;
          this.headerChunks.push(data);
        }
        this.updateLastBytes(data);
        return false;
      }
      _transform(chunk, encoding, callback) {
        if (!chunk || !chunk.length) {
          return callback();
        }
        if (typeof chunk === "string") {
          chunk = Buffer.from(chunk, encoding);
        }
        let headersFound;
        try {
          headersFound = this.checkHeaders(chunk);
        } catch (E) {
          return callback(E);
        }
        if (headersFound) {
          this.bodySize += chunk.length;
          this.push(chunk);
        }
        setImmediate(callback);
      }
      _flush(callback) {
        if (this.headerChunks) {
          let chunk = Buffer.concat(this.headerChunks, this.headerBytes);
          this.bodySize += chunk.length;
          this.push(chunk);
          this.headerChunks = null;
        }
        callback();
      }
      parseHeaders() {
        let lines = (this.rawHeaders || "").toString().split(/\r?\n/);
        for (let i = lines.length - 1; i > 0; i--) {
          if (/^\s/.test(lines[i])) {
            lines[i - 1] += "\n" + lines[i];
            lines.splice(i, 1);
          }
        }
        return lines.filter((line) => line.trim()).map((line) => ({
          key: line.substr(0, line.indexOf(":")).trim().toLowerCase(),
          line
        }));
      }
    };
    module.exports = MessageParser;
  }
});

// node_modules/nodemailer/lib/dkim/relaxed-body.js
var require_relaxed_body = __commonJS({
  "node_modules/nodemailer/lib/dkim/relaxed-body.js"(exports, module) {
    "use strict";
    var Transform = __require("stream").Transform;
    var crypto5 = __require("crypto");
    var RelaxedBody = class extends Transform {
      constructor(options) {
        super();
        options = options || {};
        this.chunkBuffer = [];
        this.chunkBufferLen = 0;
        this.bodyHash = crypto5.createHash(options.hashAlgo || "sha1");
        this.remainder = "";
        this.byteLength = 0;
        this.debug = options.debug;
        this._debugBody = options.debug ? [] : false;
      }
      updateHash(chunk) {
        let bodyStr;
        let nextRemainder = "";
        let state = "file";
        for (let i = chunk.length - 1; i >= 0; i--) {
          let c = chunk[i];
          if (state === "file" && (c === 10 || c === 13)) {
          } else if (state === "file" && (c === 9 || c === 32)) {
            state = "line";
          } else if (state === "line" && (c === 9 || c === 32)) {
          } else if (state === "file" || state === "line") {
            state = "body";
            if (i === chunk.length - 1) {
              break;
            }
          }
          if (i === 0) {
            if (state === "file" && (!this.remainder || /[\r\n]$/.test(this.remainder)) || state === "line" && (!this.remainder || /[ \t]$/.test(this.remainder))) {
              this.remainder += chunk.toString("binary");
              return;
            } else if (state === "line" || state === "file") {
              nextRemainder = chunk.toString("binary");
              chunk = false;
              break;
            }
          }
          if (state !== "body") {
            continue;
          }
          nextRemainder = chunk.slice(i + 1).toString("binary");
          chunk = chunk.slice(0, i + 1);
          break;
        }
        let needsFixing = !!this.remainder;
        if (chunk && !needsFixing) {
          for (let i = 0, len = chunk.length; i < len; i++) {
            if (i && chunk[i] === 10 && chunk[i - 1] !== 13) {
              needsFixing = true;
              break;
            } else if (i && chunk[i] === 13 && chunk[i - 1] === 32) {
              needsFixing = true;
              break;
            } else if (i && chunk[i] === 32 && chunk[i - 1] === 32) {
              needsFixing = true;
              break;
            } else if (chunk[i] === 9) {
              needsFixing = true;
              break;
            }
          }
        }
        if (needsFixing) {
          bodyStr = this.remainder + (chunk ? chunk.toString("binary") : "");
          this.remainder = nextRemainder;
          bodyStr = bodyStr.replace(/\r?\n/g, "\n").replace(/[ \t]*$/gm, "").replace(/[ \t]+/gm, " ").replace(/\n/g, "\r\n");
          chunk = Buffer.from(bodyStr, "binary");
        } else if (nextRemainder) {
          this.remainder = nextRemainder;
        }
        if (this.debug) {
          this._debugBody.push(chunk);
        }
        this.bodyHash.update(chunk);
      }
      _transform(chunk, encoding, callback) {
        if (!chunk || !chunk.length) {
          return callback();
        }
        if (typeof chunk === "string") {
          chunk = Buffer.from(chunk, encoding);
        }
        this.updateHash(chunk);
        this.byteLength += chunk.length;
        this.push(chunk);
        callback();
      }
      _flush(callback) {
        if (/[\r\n]$/.test(this.remainder) && this.byteLength > 2) {
          this.bodyHash.update(Buffer.from("\r\n"));
        }
        if (!this.byteLength) {
          this.push(Buffer.from("\r\n"));
        }
        this.emit("hash", this.bodyHash.digest("base64"), this.debug ? Buffer.concat(this._debugBody) : false);
        callback();
      }
    };
    module.exports = RelaxedBody;
  }
});

// node_modules/nodemailer/lib/dkim/sign.js
var require_sign = __commonJS({
  "node_modules/nodemailer/lib/dkim/sign.js"(exports, module) {
    "use strict";
    var punycode = require_punycode();
    var mimeFuncs = require_mime_funcs();
    var crypto5 = __require("crypto");
    module.exports = (headers, hashAlgo, bodyHash, options) => {
      options = options || {};
      let defaultFieldNames = "From:Sender:Reply-To:Subject:Date:Message-ID:To:Cc:MIME-Version:Content-Type:Content-Transfer-Encoding:Content-ID:Content-Description:Resent-Date:Resent-From:Resent-Sender:Resent-To:Resent-Cc:Resent-Message-ID:In-Reply-To:References:List-Id:List-Help:List-Unsubscribe:List-Subscribe:List-Post:List-Owner:List-Archive";
      let fieldNames = options.headerFieldNames || defaultFieldNames;
      let canonicalizedHeaderData = relaxedHeaders(headers, fieldNames, options.skipFields);
      let dkimHeader = generateDKIMHeader(options.domainName, options.keySelector, canonicalizedHeaderData.fieldNames, hashAlgo, bodyHash);
      let signer, signature;
      canonicalizedHeaderData.headers += "dkim-signature:" + relaxedHeaderLine(dkimHeader);
      signer = crypto5.createSign(("rsa-" + hashAlgo).toUpperCase());
      signer.update(canonicalizedHeaderData.headers);
      try {
        signature = signer.sign(options.privateKey, "base64");
      } catch (E) {
        return false;
      }
      return dkimHeader + signature.replace(/(^.{73}|.{75}(?!\r?\n|\r))/g, "$&\r\n ").trim();
    };
    module.exports.relaxedHeaders = relaxedHeaders;
    function generateDKIMHeader(domainName, keySelector, fieldNames, hashAlgo, bodyHash) {
      let dkim = [
        "v=1",
        "a=rsa-" + hashAlgo,
        "c=relaxed/relaxed",
        "d=" + punycode.toASCII(domainName),
        "q=dns/txt",
        "s=" + keySelector,
        "bh=" + bodyHash,
        "h=" + fieldNames
      ].join("; ");
      return mimeFuncs.foldLines("DKIM-Signature: " + dkim, 76) + ";\r\n b=";
    }
    function relaxedHeaders(headers, fieldNames, skipFields) {
      let includedFields = /* @__PURE__ */ new Set();
      let skip = /* @__PURE__ */ new Set();
      let headerFields = /* @__PURE__ */ new Map();
      (skipFields || "").toLowerCase().split(":").forEach((field) => {
        skip.add(field.trim());
      });
      (fieldNames || "").toLowerCase().split(":").filter((field) => !skip.has(field.trim())).forEach((field) => {
        includedFields.add(field.trim());
      });
      for (let i = headers.length - 1; i >= 0; i--) {
        let line = headers[i];
        if (includedFields.has(line.key) && !headerFields.has(line.key)) {
          headerFields.set(line.key, relaxedHeaderLine(line.line));
        }
      }
      let headersList = [];
      let fields = [];
      includedFields.forEach((field) => {
        if (headerFields.has(field)) {
          fields.push(field);
          headersList.push(field + ":" + headerFields.get(field));
        }
      });
      return {
        headers: headersList.join("\r\n") + "\r\n",
        fieldNames: fields.join(":")
      };
    }
    function relaxedHeaderLine(line) {
      return line.substr(line.indexOf(":") + 1).replace(/\r?\n/g, "").replace(/\s+/g, " ").trim();
    }
  }
});

// node_modules/nodemailer/lib/dkim/index.js
var require_dkim = __commonJS({
  "node_modules/nodemailer/lib/dkim/index.js"(exports, module) {
    "use strict";
    var MessageParser = require_message_parser();
    var RelaxedBody = require_relaxed_body();
    var sign3 = require_sign();
    var PassThrough = __require("stream").PassThrough;
    var fs = __require("fs");
    var path = __require("path");
    var crypto5 = __require("crypto");
    var DKIM_ALGO = "sha256";
    var MAX_MESSAGE_SIZE = 128 * 1024;
    var DKIMSigner = class {
      constructor(options, keys2, input, output) {
        this.options = options || {};
        this.keys = keys2;
        this.cacheTreshold = Number(this.options.cacheTreshold) || MAX_MESSAGE_SIZE;
        this.hashAlgo = this.options.hashAlgo || DKIM_ALGO;
        this.cacheDir = this.options.cacheDir || false;
        this.chunks = [];
        this.chunklen = 0;
        this.readPos = 0;
        this.cachePath = this.cacheDir ? path.join(this.cacheDir, "message." + Date.now() + "-" + crypto5.randomBytes(14).toString("hex")) : false;
        this.cache = false;
        this.headers = false;
        this.bodyHash = false;
        this.parser = false;
        this.relaxedBody = false;
        this.input = input;
        this.output = output;
        this.output.usingCache = false;
        this.hasErrored = false;
        this.input.on("error", (err) => {
          this.hasErrored = true;
          this.cleanup();
          output.emit("error", err);
        });
      }
      cleanup() {
        if (!this.cache || !this.cachePath) {
          return;
        }
        fs.unlink(this.cachePath, () => false);
      }
      createReadCache() {
        this.cache = fs.createReadStream(this.cachePath);
        this.cache.once("error", (err) => {
          this.cleanup();
          this.output.emit("error", err);
        });
        this.cache.once("close", () => {
          this.cleanup();
        });
        this.cache.pipe(this.output);
      }
      sendNextChunk() {
        if (this.hasErrored) {
          return;
        }
        if (this.readPos >= this.chunks.length) {
          if (!this.cache) {
            return this.output.end();
          }
          return this.createReadCache();
        }
        let chunk = this.chunks[this.readPos++];
        if (this.output.write(chunk) === false) {
          return this.output.once("drain", () => {
            this.sendNextChunk();
          });
        }
        setImmediate(() => this.sendNextChunk());
      }
      sendSignedOutput() {
        let keyPos = 0;
        let signNextKey = () => {
          if (keyPos >= this.keys.length) {
            this.output.write(this.parser.rawHeaders);
            return setImmediate(() => this.sendNextChunk());
          }
          let key = this.keys[keyPos++];
          let dkimField = sign3(this.headers, this.hashAlgo, this.bodyHash, {
            domainName: key.domainName,
            keySelector: key.keySelector,
            privateKey: key.privateKey,
            headerFieldNames: this.options.headerFieldNames,
            skipFields: this.options.skipFields
          });
          if (dkimField) {
            this.output.write(Buffer.from(dkimField + "\r\n"));
          }
          return setImmediate(signNextKey);
        };
        if (this.bodyHash && this.headers) {
          return signNextKey();
        }
        this.output.write(this.parser.rawHeaders);
        this.sendNextChunk();
      }
      createWriteCache() {
        this.output.usingCache = true;
        this.cache = fs.createWriteStream(this.cachePath);
        this.cache.once("error", (err) => {
          this.cleanup();
          this.relaxedBody.unpipe(this.cache);
          this.relaxedBody.on("readable", () => {
            while (this.relaxedBody.read() !== null) {
            }
          });
          this.hasErrored = true;
          this.output.emit("error", err);
        });
        this.cache.once("close", () => {
          this.sendSignedOutput();
        });
        this.relaxedBody.removeAllListeners("readable");
        this.relaxedBody.pipe(this.cache);
      }
      signStream() {
        this.parser = new MessageParser();
        this.relaxedBody = new RelaxedBody({
          hashAlgo: this.hashAlgo
        });
        this.parser.on("headers", (value) => {
          this.headers = value;
        });
        this.relaxedBody.on("hash", (value) => {
          this.bodyHash = value;
        });
        this.relaxedBody.on("readable", () => {
          let chunk;
          if (this.cache) {
            return;
          }
          while ((chunk = this.relaxedBody.read()) !== null) {
            this.chunks.push(chunk);
            this.chunklen += chunk.length;
            if (this.chunklen >= this.cacheTreshold && this.cachePath) {
              return this.createWriteCache();
            }
          }
        });
        this.relaxedBody.on("end", () => {
          if (this.cache) {
            return;
          }
          this.sendSignedOutput();
        });
        this.parser.pipe(this.relaxedBody);
        setImmediate(() => this.input.pipe(this.parser));
      }
    };
    var DKIM = class {
      constructor(options) {
        this.options = options || {};
        this.keys = [].concat(
          this.options.keys || {
            domainName: options.domainName,
            keySelector: options.keySelector,
            privateKey: options.privateKey
          }
        );
      }
      sign(input, extraOptions) {
        let output = new PassThrough();
        let inputStream = input;
        let writeValue = false;
        if (Buffer.isBuffer(input)) {
          writeValue = input;
          inputStream = new PassThrough();
        } else if (typeof input === "string") {
          writeValue = Buffer.from(input);
          inputStream = new PassThrough();
        }
        let options = this.options;
        if (extraOptions && Object.keys(extraOptions).length) {
          options = {};
          Object.keys(this.options || {}).forEach((key) => {
            options[key] = this.options[key];
          });
          Object.keys(extraOptions || {}).forEach((key) => {
            if (!(key in options)) {
              options[key] = extraOptions[key];
            }
          });
        }
        let signer = new DKIMSigner(options, this.keys, inputStream, output);
        setImmediate(() => {
          signer.signStream();
          if (writeValue) {
            setImmediate(() => {
              inputStream.end(writeValue);
            });
          }
        });
        return output;
      }
    };
    module.exports = DKIM;
  }
});

// node_modules/nodemailer/lib/smtp-connection/http-proxy-client.js
var require_http_proxy_client = __commonJS({
  "node_modules/nodemailer/lib/smtp-connection/http-proxy-client.js"(exports, module) {
    "use strict";
    var net = __require("net");
    var tls = __require("tls");
    var urllib = __require("url");
    function httpProxyClient(proxyUrl, destinationPort, destinationHost, callback) {
      let proxy = urllib.parse(proxyUrl);
      let options;
      let connect;
      let socket;
      options = {
        host: proxy.hostname,
        port: Number(proxy.port) ? Number(proxy.port) : proxy.protocol === "https:" ? 443 : 80
      };
      if (proxy.protocol === "https:") {
        options.rejectUnauthorized = false;
        connect = tls.connect.bind(tls);
      } else {
        connect = net.connect.bind(net);
      }
      let finished = false;
      let tempSocketErr = (err) => {
        if (finished) {
          return;
        }
        finished = true;
        try {
          socket.destroy();
        } catch (E) {
        }
        callback(err);
      };
      let timeoutErr = () => {
        let err = new Error("Proxy socket timed out");
        err.code = "ETIMEDOUT";
        tempSocketErr(err);
      };
      socket = connect(options, () => {
        if (finished) {
          return;
        }
        let reqHeaders = {
          Host: destinationHost + ":" + destinationPort,
          Connection: "close"
        };
        if (proxy.auth) {
          reqHeaders["Proxy-Authorization"] = "Basic " + Buffer.from(proxy.auth).toString("base64");
        }
        socket.write(
          // HTTP method
          "CONNECT " + destinationHost + ":" + destinationPort + " HTTP/1.1\r\n" + // HTTP request headers
          Object.keys(reqHeaders).map((key) => key + ": " + reqHeaders[key]).join("\r\n") + // End request
          "\r\n\r\n"
        );
        let headers = "";
        let onSocketData = (chunk) => {
          let match2;
          let remainder;
          if (finished) {
            return;
          }
          headers += chunk.toString("binary");
          if (match2 = headers.match(/\r\n\r\n/)) {
            socket.removeListener("data", onSocketData);
            remainder = headers.substr(match2.index + match2[0].length);
            headers = headers.substr(0, match2.index);
            if (remainder) {
              socket.unshift(Buffer.from(remainder, "binary"));
            }
            finished = true;
            match2 = headers.match(/^HTTP\/\d+\.\d+ (\d+)/i);
            if (!match2 || (match2[1] || "").charAt(0) !== "2") {
              try {
                socket.destroy();
              } catch (E) {
              }
              return callback(new Error("Invalid response from proxy" + (match2 && ": " + match2[1] || "")));
            }
            socket.removeListener("error", tempSocketErr);
            socket.removeListener("timeout", timeoutErr);
            socket.setTimeout(0);
            return callback(null, socket);
          }
        };
        socket.on("data", onSocketData);
      });
      socket.setTimeout(httpProxyClient.timeout || 30 * 1e3);
      socket.on("timeout", timeoutErr);
      socket.once("error", tempSocketErr);
    }
    module.exports = httpProxyClient;
  }
});

// node_modules/nodemailer/lib/mailer/mail-message.js
var require_mail_message = __commonJS({
  "node_modules/nodemailer/lib/mailer/mail-message.js"(exports, module) {
    "use strict";
    var shared = require_shared();
    var MimeNode = require_mime_node();
    var mimeFuncs = require_mime_funcs();
    var MailMessage = class {
      constructor(mailer, data) {
        this.mailer = mailer;
        this.data = {};
        this.message = null;
        data = data || {};
        let options = mailer.options || {};
        let defaults = mailer._defaults || {};
        Object.keys(data).forEach((key) => {
          this.data[key] = data[key];
        });
        this.data.headers = this.data.headers || {};
        Object.keys(defaults).forEach((key) => {
          if (!(key in this.data)) {
            this.data[key] = defaults[key];
          } else if (key === "headers") {
            Object.keys(defaults.headers).forEach((key2) => {
              if (!(key2 in this.data.headers)) {
                this.data.headers[key2] = defaults.headers[key2];
              }
            });
          }
        });
        ["disableFileAccess", "disableUrlAccess", "normalizeHeaderKey"].forEach((key) => {
          if (key in options) {
            this.data[key] = options[key];
          }
        });
      }
      resolveContent(...args) {
        return shared.resolveContent(...args);
      }
      resolveAll(callback) {
        let keys2 = [
          [this.data, "html"],
          [this.data, "text"],
          [this.data, "watchHtml"],
          [this.data, "amp"],
          [this.data, "icalEvent"]
        ];
        if (this.data.alternatives && this.data.alternatives.length) {
          this.data.alternatives.forEach((alternative, i) => {
            keys2.push([this.data.alternatives, i]);
          });
        }
        if (this.data.attachments && this.data.attachments.length) {
          this.data.attachments.forEach((attachment, i) => {
            if (!attachment.filename) {
              attachment.filename = (attachment.path || attachment.href || "").split("/").pop().split("?").shift() || "attachment-" + (i + 1);
              if (attachment.filename.indexOf(".") < 0) {
                attachment.filename += "." + mimeFuncs.detectExtension(attachment.contentType);
              }
            }
            if (!attachment.contentType) {
              attachment.contentType = mimeFuncs.detectMimeType(attachment.filename || attachment.path || attachment.href || "bin");
            }
            keys2.push([this.data.attachments, i]);
          });
        }
        let mimeNode = new MimeNode();
        let addressKeys = ["from", "to", "cc", "bcc", "sender", "replyTo"];
        addressKeys.forEach((address) => {
          let value;
          if (this.message) {
            value = [].concat(mimeNode._parseAddresses(this.message.getHeader(address === "replyTo" ? "reply-to" : address)) || []);
          } else if (this.data[address]) {
            value = [].concat(mimeNode._parseAddresses(this.data[address]) || []);
          }
          if (value && value.length) {
            this.data[address] = value;
          } else if (address in this.data) {
            this.data[address] = null;
          }
        });
        let singleKeys = ["from", "sender"];
        singleKeys.forEach((address) => {
          if (this.data[address]) {
            this.data[address] = this.data[address].shift();
          }
        });
        let pos = 0;
        let resolveNext = () => {
          if (pos >= keys2.length) {
            return callback(null, this.data);
          }
          let args = keys2[pos++];
          if (!args[0] || !args[0][args[1]]) {
            return resolveNext();
          }
          shared.resolveContent(...args, (err, value) => {
            if (err) {
              return callback(err);
            }
            let node = {
              content: value
            };
            if (args[0][args[1]] && typeof args[0][args[1]] === "object" && !Buffer.isBuffer(args[0][args[1]])) {
              Object.keys(args[0][args[1]]).forEach((key) => {
                if (!(key in node) && !["content", "path", "href", "raw"].includes(key)) {
                  node[key] = args[0][args[1]][key];
                }
              });
            }
            args[0][args[1]] = node;
            resolveNext();
          });
        };
        setImmediate(() => resolveNext());
      }
      normalize(callback) {
        let envelope = this.data.envelope || this.message.getEnvelope();
        let messageId = this.message.messageId();
        this.resolveAll((err, data) => {
          if (err) {
            return callback(err);
          }
          data.envelope = envelope;
          data.messageId = messageId;
          ["html", "text", "watchHtml", "amp"].forEach((key) => {
            if (data[key] && data[key].content) {
              if (typeof data[key].content === "string") {
                data[key] = data[key].content;
              } else if (Buffer.isBuffer(data[key].content)) {
                data[key] = data[key].content.toString();
              }
            }
          });
          if (data.icalEvent && Buffer.isBuffer(data.icalEvent.content)) {
            data.icalEvent.content = data.icalEvent.content.toString("base64");
            data.icalEvent.encoding = "base64";
          }
          if (data.alternatives && data.alternatives.length) {
            data.alternatives.forEach((alternative) => {
              if (alternative && alternative.content && Buffer.isBuffer(alternative.content)) {
                alternative.content = alternative.content.toString("base64");
                alternative.encoding = "base64";
              }
            });
          }
          if (data.attachments && data.attachments.length) {
            data.attachments.forEach((attachment) => {
              if (attachment && attachment.content && Buffer.isBuffer(attachment.content)) {
                attachment.content = attachment.content.toString("base64");
                attachment.encoding = "base64";
              }
            });
          }
          data.normalizedHeaders = {};
          Object.keys(data.headers || {}).forEach((key) => {
            let value = [].concat(data.headers[key] || []).shift();
            value = value && value.value || value;
            if (value) {
              if (["references", "in-reply-to", "message-id", "content-id"].includes(key)) {
                value = this.message._encodeHeaderValue(key, value);
              }
              data.normalizedHeaders[key] = value;
            }
          });
          if (data.list && typeof data.list === "object") {
            let listHeaders = this._getListHeaders(data.list);
            listHeaders.forEach((entry) => {
              data.normalizedHeaders[entry.key] = entry.value.map((val) => val && val.value || val).join(", ");
            });
          }
          if (data.references) {
            data.normalizedHeaders.references = this.message._encodeHeaderValue("references", data.references);
          }
          if (data.inReplyTo) {
            data.normalizedHeaders["in-reply-to"] = this.message._encodeHeaderValue("in-reply-to", data.inReplyTo);
          }
          return callback(null, data);
        });
      }
      setMailerHeader() {
        if (!this.message || !this.data.xMailer) {
          return;
        }
        this.message.setHeader("X-Mailer", this.data.xMailer);
      }
      setPriorityHeaders() {
        if (!this.message || !this.data.priority) {
          return;
        }
        switch ((this.data.priority || "").toString().toLowerCase()) {
          case "high":
            this.message.setHeader("X-Priority", "1 (Highest)");
            this.message.setHeader("X-MSMail-Priority", "High");
            this.message.setHeader("Importance", "High");
            break;
          case "low":
            this.message.setHeader("X-Priority", "5 (Lowest)");
            this.message.setHeader("X-MSMail-Priority", "Low");
            this.message.setHeader("Importance", "Low");
            break;
          default:
        }
      }
      setListHeaders() {
        if (!this.message || !this.data.list || typeof this.data.list !== "object") {
          return;
        }
        if (this.data.list && typeof this.data.list === "object") {
          this._getListHeaders(this.data.list).forEach((listHeader) => {
            listHeader.value.forEach((value) => {
              this.message.addHeader(listHeader.key, value);
            });
          });
        }
      }
      _getListHeaders(listData) {
        return Object.keys(listData).map((key) => ({
          key: "list-" + key.toLowerCase().trim(),
          value: [].concat(listData[key] || []).map((value) => ({
            prepared: true,
            foldLines: true,
            value: [].concat(value || []).map((value2) => {
              if (typeof value2 === "string") {
                value2 = {
                  url: value2
                };
              }
              if (value2 && value2.url) {
                if (key.toLowerCase().trim() === "id") {
                  let comment2 = value2.comment || "";
                  if (mimeFuncs.isPlainText(comment2)) {
                    comment2 = '"' + comment2 + '"';
                  } else {
                    comment2 = mimeFuncs.encodeWord(comment2);
                  }
                  return (value2.comment ? comment2 + " " : "") + this._formatListUrl(value2.url).replace(/^<[^:]+\/{,2}/, "");
                }
                let comment = value2.comment || "";
                if (!mimeFuncs.isPlainText(comment)) {
                  comment = mimeFuncs.encodeWord(comment);
                }
                return this._formatListUrl(value2.url) + (value2.comment ? " (" + comment + ")" : "");
              }
              return "";
            }).filter((value2) => value2).join(", ")
          }))
        }));
      }
      _formatListUrl(url) {
        url = url.replace(/[\s<]+|[\s>]+/g, "");
        if (/^(https?|mailto|ftp):/.test(url)) {
          return "<" + url + ">";
        }
        if (/^[^@]+@[^@]+$/.test(url)) {
          return "<mailto:" + url + ">";
        }
        return "<http://" + url + ">";
      }
    };
    module.exports = MailMessage;
  }
});

// node_modules/nodemailer/lib/mailer/index.js
var require_mailer = __commonJS({
  "node_modules/nodemailer/lib/mailer/index.js"(exports, module) {
    "use strict";
    var EventEmitter = __require("events");
    var shared = require_shared();
    var mimeTypes = require_mime_types();
    var MailComposer = require_mail_composer();
    var DKIM = require_dkim();
    var httpProxyClient = require_http_proxy_client();
    var util3 = __require("util");
    var urllib = __require("url");
    var packageData = require_package();
    var MailMessage = require_mail_message();
    var net = __require("net");
    var dns = __require("dns");
    var crypto5 = __require("crypto");
    var Mail = class extends EventEmitter {
      constructor(transporter, options, defaults) {
        super();
        this.options = options || {};
        this._defaults = defaults || {};
        this._defaultPlugins = {
          compile: [(...args) => this._convertDataImages(...args)],
          stream: []
        };
        this._userPlugins = {
          compile: [],
          stream: []
        };
        this.meta = /* @__PURE__ */ new Map();
        this.dkim = this.options.dkim ? new DKIM(this.options.dkim) : false;
        this.transporter = transporter;
        this.transporter.mailer = this;
        this.logger = shared.getLogger(this.options, {
          component: this.options.component || "mail"
        });
        this.logger.debug(
          {
            tnx: "create"
          },
          "Creating transport: %s",
          this.getVersionString()
        );
        if (typeof this.transporter.on === "function") {
          this.transporter.on("log", (log) => {
            this.logger.debug(
              {
                tnx: "transport"
              },
              "%s: %s",
              log.type,
              log.message
            );
          });
          this.transporter.on("error", (err) => {
            this.logger.error(
              {
                err,
                tnx: "transport"
              },
              "Transport Error: %s",
              err.message
            );
            this.emit("error", err);
          });
          this.transporter.on("idle", (...args) => {
            this.emit("idle", ...args);
          });
        }
        ["close", "isIdle", "verify"].forEach((method) => {
          this[method] = (...args) => {
            if (typeof this.transporter[method] === "function") {
              if (method === "verify" && typeof this.getSocket === "function") {
                this.transporter.getSocket = this.getSocket;
                this.getSocket = false;
              }
              return this.transporter[method](...args);
            } else {
              this.logger.warn(
                {
                  tnx: "transport",
                  methodName: method
                },
                "Non existing method %s called for transport",
                method
              );
              return false;
            }
          };
        });
        if (this.options.proxy && typeof this.options.proxy === "string") {
          this.setupProxy(this.options.proxy);
        }
      }
      use(step, plugin) {
        step = (step || "").toString();
        if (!this._userPlugins.hasOwnProperty(step)) {
          this._userPlugins[step] = [plugin];
        } else {
          this._userPlugins[step].push(plugin);
        }
        return this;
      }
      /**
       * Sends an email using the preselected transport object
       *
       * @param {Object} data E-data description
       * @param {Function?} callback Callback to run once the sending succeeded or failed
       */
      sendMail(data, callback = null) {
        let promise;
        if (!callback) {
          promise = new Promise((resolve, reject) => {
            callback = shared.callbackPromise(resolve, reject);
          });
        }
        if (typeof this.getSocket === "function") {
          this.transporter.getSocket = this.getSocket;
          this.getSocket = false;
        }
        let mail = new MailMessage(this, data);
        this.logger.debug(
          {
            tnx: "transport",
            name: this.transporter.name,
            version: this.transporter.version,
            action: "send"
          },
          "Sending mail using %s/%s",
          this.transporter.name,
          this.transporter.version
        );
        this._processPlugins("compile", mail, (err) => {
          if (err) {
            this.logger.error(
              {
                err,
                tnx: "plugin",
                action: "compile"
              },
              "PluginCompile Error: %s",
              err.message
            );
            return callback(err);
          }
          mail.message = new MailComposer(mail.data).compile();
          mail.setMailerHeader();
          mail.setPriorityHeaders();
          mail.setListHeaders();
          this._processPlugins("stream", mail, (err2) => {
            if (err2) {
              this.logger.error(
                {
                  err: err2,
                  tnx: "plugin",
                  action: "stream"
                },
                "PluginStream Error: %s",
                err2.message
              );
              return callback(err2);
            }
            if (mail.data.dkim || this.dkim) {
              mail.message.processFunc((input) => {
                let dkim = mail.data.dkim ? new DKIM(mail.data.dkim) : this.dkim;
                this.logger.debug(
                  {
                    tnx: "DKIM",
                    messageId: mail.message.messageId(),
                    dkimDomains: dkim.keys.map((key) => key.keySelector + "." + key.domainName).join(", ")
                  },
                  "Signing outgoing message with %s keys",
                  dkim.keys.length
                );
                return dkim.sign(input, mail.data._dkim);
              });
            }
            this.transporter.send(mail, (...args) => {
              if (args[0]) {
                this.logger.error(
                  {
                    err: args[0],
                    tnx: "transport",
                    action: "send"
                  },
                  "Send Error: %s",
                  args[0].message
                );
              }
              callback(...args);
            });
          });
        });
        return promise;
      }
      getVersionString() {
        return util3.format("%s (%s; +%s; %s/%s)", packageData.name, packageData.version, packageData.homepage, this.transporter.name, this.transporter.version);
      }
      _processPlugins(step, mail, callback) {
        step = (step || "").toString();
        if (!this._userPlugins.hasOwnProperty(step)) {
          return callback();
        }
        let userPlugins = this._userPlugins[step] || [];
        let defaultPlugins = this._defaultPlugins[step] || [];
        if (userPlugins.length) {
          this.logger.debug(
            {
              tnx: "transaction",
              pluginCount: userPlugins.length,
              step
            },
            "Using %s plugins for %s",
            userPlugins.length,
            step
          );
        }
        if (userPlugins.length + defaultPlugins.length === 0) {
          return callback();
        }
        let pos = 0;
        let block = "default";
        let processPlugins = () => {
          let curplugins = block === "default" ? defaultPlugins : userPlugins;
          if (pos >= curplugins.length) {
            if (block === "default" && userPlugins.length) {
              block = "user";
              pos = 0;
              curplugins = userPlugins;
            } else {
              return callback();
            }
          }
          let plugin = curplugins[pos++];
          plugin(mail, (err) => {
            if (err) {
              return callback(err);
            }
            processPlugins();
          });
        };
        processPlugins();
      }
      /**
       * Sets up proxy handler for a Nodemailer object
       *
       * @param {String} proxyUrl Proxy configuration url
       */
      setupProxy(proxyUrl) {
        let proxy = urllib.parse(proxyUrl);
        this.getSocket = (options, callback) => {
          let protocol = proxy.protocol.replace(/:$/, "").toLowerCase();
          if (this.meta.has("proxy_handler_" + protocol)) {
            return this.meta.get("proxy_handler_" + protocol)(proxy, options, callback);
          }
          switch (protocol) {
            // Connect using a HTTP CONNECT method
            case "http":
            case "https":
              httpProxyClient(proxy.href, options.port, options.host, (err, socket) => {
                if (err) {
                  return callback(err);
                }
                return callback(null, {
                  connection: socket
                });
              });
              return;
            case "socks":
            case "socks5":
            case "socks4":
            case "socks4a": {
              if (!this.meta.has("proxy_socks_module")) {
                return callback(new Error("Socks module not loaded"));
              }
              let connect = (ipaddress) => {
                let proxyV2 = !!this.meta.get("proxy_socks_module").SocksClient;
                let socksClient = proxyV2 ? this.meta.get("proxy_socks_module").SocksClient : this.meta.get("proxy_socks_module");
                let proxyType = Number(proxy.protocol.replace(/\D/g, "")) || 5;
                let connectionOpts = {
                  proxy: {
                    ipaddress,
                    port: Number(proxy.port),
                    type: proxyType
                  },
                  [proxyV2 ? "destination" : "target"]: {
                    host: options.host,
                    port: options.port
                  },
                  command: "connect"
                };
                if (proxy.auth) {
                  let username = decodeURIComponent(proxy.auth.split(":").shift());
                  let password = decodeURIComponent(proxy.auth.split(":").pop());
                  if (proxyV2) {
                    connectionOpts.proxy.userId = username;
                    connectionOpts.proxy.password = password;
                  } else if (proxyType === 4) {
                    connectionOpts.userid = username;
                  } else {
                    connectionOpts.authentication = {
                      username,
                      password
                    };
                  }
                }
                socksClient.createConnection(connectionOpts, (err, info) => {
                  if (err) {
                    return callback(err);
                  }
                  return callback(null, {
                    connection: info.socket || info
                  });
                });
              };
              if (net.isIP(proxy.hostname)) {
                return connect(proxy.hostname);
              }
              return dns.resolve(proxy.hostname, (err, address) => {
                if (err) {
                  return callback(err);
                }
                connect(Array.isArray(address) ? address[0] : address);
              });
            }
          }
          callback(new Error("Unknown proxy configuration"));
        };
      }
      _convertDataImages(mail, callback) {
        if (!this.options.attachDataUrls && !mail.data.attachDataUrls || !mail.data.html) {
          return callback();
        }
        mail.resolveContent(mail.data, "html", (err, html) => {
          if (err) {
            return callback(err);
          }
          let cidCounter = 0;
          html = (html || "").toString().replace(/(<img\b[^<>]{0,1024} src\s{0,20}=[\s"']{0,20})(data:([^;]+);[^"'>\s]+)/gi, (match2, prefix, dataUri, mimeType) => {
            let cid = crypto5.randomBytes(10).toString("hex") + "@localhost";
            if (!mail.data.attachments) {
              mail.data.attachments = [];
            }
            if (!Array.isArray(mail.data.attachments)) {
              mail.data.attachments = [].concat(mail.data.attachments || []);
            }
            mail.data.attachments.push({
              path: dataUri,
              cid,
              filename: "image-" + ++cidCounter + "." + mimeTypes.detectExtension(mimeType)
            });
            return prefix + "cid:" + cid;
          });
          mail.data.html = html;
          callback();
        });
      }
      set(key, value) {
        return this.meta.set(key, value);
      }
      get(key) {
        return this.meta.get(key);
      }
    };
    module.exports = Mail;
  }
});

// node_modules/nodemailer/lib/smtp-connection/data-stream.js
var require_data_stream = __commonJS({
  "node_modules/nodemailer/lib/smtp-connection/data-stream.js"(exports, module) {
    "use strict";
    var stream = __require("stream");
    var Transform = stream.Transform;
    var DataStream = class extends Transform {
      constructor(options) {
        super(options);
        this.options = options || {};
        this._curLine = "";
        this.inByteCount = 0;
        this.outByteCount = 0;
        this.lastByte = false;
      }
      /**
       * Escapes dots
       */
      _transform(chunk, encoding, done) {
        let chunks = [];
        let chunklen = 0;
        let i, len, lastPos = 0;
        let buf;
        if (!chunk || !chunk.length) {
          return done();
        }
        if (typeof chunk === "string") {
          chunk = Buffer.from(chunk);
        }
        this.inByteCount += chunk.length;
        for (i = 0, len = chunk.length; i < len; i++) {
          if (chunk[i] === 46) {
            if (i && chunk[i - 1] === 10 || !i && (!this.lastByte || this.lastByte === 10)) {
              buf = chunk.slice(lastPos, i + 1);
              chunks.push(buf);
              chunks.push(Buffer.from("."));
              chunklen += buf.length + 1;
              lastPos = i + 1;
            }
          } else if (chunk[i] === 10) {
            if (i && chunk[i - 1] !== 13 || !i && this.lastByte !== 13) {
              if (i > lastPos) {
                buf = chunk.slice(lastPos, i);
                chunks.push(buf);
                chunklen += buf.length + 2;
              } else {
                chunklen += 2;
              }
              chunks.push(Buffer.from("\r\n"));
              lastPos = i + 1;
            }
          }
        }
        if (chunklen) {
          if (lastPos < chunk.length) {
            buf = chunk.slice(lastPos);
            chunks.push(buf);
            chunklen += buf.length;
          }
          this.outByteCount += chunklen;
          this.push(Buffer.concat(chunks, chunklen));
        } else {
          this.outByteCount += chunk.length;
          this.push(chunk);
        }
        this.lastByte = chunk[chunk.length - 1];
        done();
      }
      /**
       * Finalizes the stream with a dot on a single line
       */
      _flush(done) {
        let buf;
        if (this.lastByte === 10) {
          buf = Buffer.from(".\r\n");
        } else if (this.lastByte === 13) {
          buf = Buffer.from("\n.\r\n");
        } else {
          buf = Buffer.from("\r\n.\r\n");
        }
        this.outByteCount += buf.length;
        this.push(buf);
        done();
      }
    };
    module.exports = DataStream;
  }
});

// node_modules/nodemailer/lib/smtp-connection/index.js
var require_smtp_connection = __commonJS({
  "node_modules/nodemailer/lib/smtp-connection/index.js"(exports, module) {
    "use strict";
    var packageInfo = require_package();
    var EventEmitter = __require("events").EventEmitter;
    var net = __require("net");
    var tls = __require("tls");
    var os = __require("os");
    var crypto5 = __require("crypto");
    var DataStream = require_data_stream();
    var PassThrough = __require("stream").PassThrough;
    var shared = require_shared();
    var CONNECTION_TIMEOUT = 2 * 60 * 1e3;
    var SOCKET_TIMEOUT = 10 * 60 * 1e3;
    var GREETING_TIMEOUT = 30 * 1e3;
    var DNS_TIMEOUT = 30 * 1e3;
    var SMTPConnection = class extends EventEmitter {
      constructor(options) {
        super(options);
        this.id = crypto5.randomBytes(8).toString("base64").replace(/\W/g, "");
        this.stage = "init";
        this.options = options || {};
        this.secureConnection = !!this.options.secure;
        this.alreadySecured = !!this.options.secured;
        this.port = Number(this.options.port) || (this.secureConnection ? 465 : 587);
        this.host = this.options.host || "localhost";
        this.servername = this.options.servername ? this.options.servername : !net.isIP(this.host) ? this.host : false;
        this.allowInternalNetworkInterfaces = this.options.allowInternalNetworkInterfaces || false;
        if (typeof this.options.secure === "undefined" && this.port === 465) {
          this.secureConnection = true;
        }
        this.name = this.options.name || this._getHostname();
        this.logger = shared.getLogger(this.options, {
          component: this.options.component || "smtp-connection",
          sid: this.id
        });
        this.customAuth = /* @__PURE__ */ new Map();
        Object.keys(this.options.customAuth || {}).forEach((key) => {
          let mapKey = (key || "").toString().trim().toUpperCase();
          if (!mapKey) {
            return;
          }
          this.customAuth.set(mapKey, this.options.customAuth[key]);
        });
        this.version = packageInfo.version;
        this.authenticated = false;
        this.destroyed = false;
        this.secure = !!this.secureConnection;
        this._remainder = "";
        this._responseQueue = [];
        this.lastServerResponse = false;
        this._socket = false;
        this._supportedAuth = [];
        this.allowsAuth = false;
        this._envelope = false;
        this._supportedExtensions = [];
        this._maxAllowedSize = 0;
        this._responseActions = [];
        this._recipientQueue = [];
        this._greetingTimeout = false;
        this._connectionTimeout = false;
        this._destroyed = false;
        this._closing = false;
        this._onSocketData = (chunk) => this._onData(chunk);
        this._onSocketError = (error) => this._onError(error, "ESOCKET", false, "CONN");
        this._onSocketClose = () => this._onClose();
        this._onSocketEnd = () => this._onEnd();
        this._onSocketTimeout = () => this._onTimeout();
      }
      /**
       * Creates a connection to a SMTP server and sets up connection
       * listener
       */
      connect(connectCallback) {
        if (typeof connectCallback === "function") {
          this.once("connect", () => {
            this.logger.debug(
              {
                tnx: "smtp"
              },
              "SMTP handshake finished"
            );
            connectCallback();
          });
          const isDestroyedMessage = this._isDestroyedMessage("connect");
          if (isDestroyedMessage) {
            return connectCallback(this._formatError(isDestroyedMessage, "ECONNECTION", false, "CONN"));
          }
        }
        let opts = {
          port: this.port,
          host: this.host,
          allowInternalNetworkInterfaces: this.allowInternalNetworkInterfaces,
          timeout: this.options.dnsTimeout || DNS_TIMEOUT
        };
        if (this.options.localAddress) {
          opts.localAddress = this.options.localAddress;
        }
        let setupConnectionHandlers = () => {
          this._connectionTimeout = setTimeout(() => {
            this._onError("Connection timeout", "ETIMEDOUT", false, "CONN");
          }, this.options.connectionTimeout || CONNECTION_TIMEOUT);
          this._socket.on("error", this._onSocketError);
        };
        if (this.options.connection) {
          this._socket = this.options.connection;
          setupConnectionHandlers();
          if (this.secureConnection && !this.alreadySecured) {
            setImmediate(
              () => this._upgradeConnection((err) => {
                if (err) {
                  this._onError(new Error("Error initiating TLS - " + (err.message || err)), "ETLS", false, "CONN");
                  return;
                }
                this._onConnect();
              })
            );
          } else {
            setImmediate(() => this._onConnect());
          }
          return;
        } else if (this.options.socket) {
          this._socket = this.options.socket;
          return shared.resolveHostname(opts, (err, resolved) => {
            if (err) {
              return setImmediate(() => this._onError(err, "EDNS", false, "CONN"));
            }
            this.logger.debug(
              {
                tnx: "dns",
                source: opts.host,
                resolved: resolved.host,
                cached: !!resolved.cached
              },
              "Resolved %s as %s [cache %s]",
              opts.host,
              resolved.host,
              resolved.cached ? "hit" : "miss"
            );
            Object.keys(resolved).forEach((key) => {
              if (key.charAt(0) !== "_" && resolved[key]) {
                opts[key] = resolved[key];
              }
            });
            try {
              this._socket.connect(this.port, this.host, () => {
                this._socket.setKeepAlive(true);
                this._onConnect();
              });
              setupConnectionHandlers();
            } catch (E) {
              return setImmediate(() => this._onError(E, "ECONNECTION", false, "CONN"));
            }
          });
        } else if (this.secureConnection) {
          if (this.options.tls) {
            Object.keys(this.options.tls).forEach((key) => {
              opts[key] = this.options.tls[key];
            });
          }
          if (this.servername && !opts.servername) {
            opts.servername = this.servername;
          }
          return shared.resolveHostname(opts, (err, resolved) => {
            if (err) {
              return setImmediate(() => this._onError(err, "EDNS", false, "CONN"));
            }
            this.logger.debug(
              {
                tnx: "dns",
                source: opts.host,
                resolved: resolved.host,
                cached: !!resolved.cached
              },
              "Resolved %s as %s [cache %s]",
              opts.host,
              resolved.host,
              resolved.cached ? "hit" : "miss"
            );
            Object.keys(resolved).forEach((key) => {
              if (key.charAt(0) !== "_" && resolved[key]) {
                opts[key] = resolved[key];
              }
            });
            try {
              this._socket = tls.connect(opts, () => {
                this._socket.setKeepAlive(true);
                this._onConnect();
              });
              setupConnectionHandlers();
            } catch (E) {
              return setImmediate(() => this._onError(E, "ECONNECTION", false, "CONN"));
            }
          });
        } else {
          return shared.resolveHostname(opts, (err, resolved) => {
            if (err) {
              return setImmediate(() => this._onError(err, "EDNS", false, "CONN"));
            }
            this.logger.debug(
              {
                tnx: "dns",
                source: opts.host,
                resolved: resolved.host,
                cached: !!resolved.cached
              },
              "Resolved %s as %s [cache %s]",
              opts.host,
              resolved.host,
              resolved.cached ? "hit" : "miss"
            );
            Object.keys(resolved).forEach((key) => {
              if (key.charAt(0) !== "_" && resolved[key]) {
                opts[key] = resolved[key];
              }
            });
            try {
              this._socket = net.connect(opts, () => {
                this._socket.setKeepAlive(true);
                this._onConnect();
              });
              setupConnectionHandlers();
            } catch (E) {
              return setImmediate(() => this._onError(E, "ECONNECTION", false, "CONN"));
            }
          });
        }
      }
      /**
       * Sends QUIT
       */
      quit() {
        this._sendCommand("QUIT");
        this._responseActions.push(this.close);
      }
      /**
       * Closes the connection to the server
       */
      close() {
        clearTimeout(this._connectionTimeout);
        clearTimeout(this._greetingTimeout);
        this._responseActions = [];
        if (this._closing) {
          return;
        }
        this._closing = true;
        let closeMethod = "end";
        if (this.stage === "init") {
          closeMethod = "destroy";
        }
        this.logger.debug(
          {
            tnx: "smtp"
          },
          'Closing connection to the server using "%s"',
          closeMethod
        );
        let socket = this._socket && this._socket.socket || this._socket;
        if (socket && !socket.destroyed) {
          try {
            socket[closeMethod]();
          } catch (E) {
          }
        }
        this._destroy();
      }
      /**
       * Authenticate user
       */
      login(authData, callback) {
        const isDestroyedMessage = this._isDestroyedMessage("login");
        if (isDestroyedMessage) {
          return callback(this._formatError(isDestroyedMessage, "ECONNECTION", false, "API"));
        }
        this._auth = authData || {};
        this._authMethod = (this._auth.method || "").toString().trim().toUpperCase() || false;
        if (!this._authMethod && this._auth.oauth2 && !this._auth.credentials) {
          this._authMethod = "XOAUTH2";
        } else if (!this._authMethod || this._authMethod === "XOAUTH2" && !this._auth.oauth2) {
          this._authMethod = (this._supportedAuth[0] || "PLAIN").toUpperCase().trim();
        }
        if (this._authMethod !== "XOAUTH2" && (!this._auth.credentials || !this._auth.credentials.user || !this._auth.credentials.pass)) {
          if (this._auth.user && this._auth.pass || this.customAuth.has(this._authMethod)) {
            this._auth.credentials = {
              user: this._auth.user,
              pass: this._auth.pass,
              options: this._auth.options
            };
          } else {
            return callback(this._formatError('Missing credentials for "' + this._authMethod + '"', "EAUTH", false, "API"));
          }
        }
        if (this.customAuth.has(this._authMethod)) {
          let handler2 = this.customAuth.get(this._authMethod);
          let lastResponse;
          let returned = false;
          let resolve = () => {
            if (returned) {
              return;
            }
            returned = true;
            this.logger.info(
              {
                tnx: "smtp",
                username: this._auth.user,
                action: "authenticated",
                method: this._authMethod
              },
              "User %s authenticated",
              JSON.stringify(this._auth.user)
            );
            this.authenticated = true;
            callback(null, true);
          };
          let reject = (err) => {
            if (returned) {
              return;
            }
            returned = true;
            callback(this._formatError(err, "EAUTH", lastResponse, "AUTH " + this._authMethod));
          };
          let handlerResponse = handler2({
            auth: this._auth,
            method: this._authMethod,
            extensions: [].concat(this._supportedExtensions),
            authMethods: [].concat(this._supportedAuth),
            maxAllowedSize: this._maxAllowedSize || false,
            sendCommand: (cmd, done) => {
              let promise;
              if (!done) {
                promise = new Promise((resolve2, reject2) => {
                  done = shared.callbackPromise(resolve2, reject2);
                });
              }
              this._responseActions.push((str) => {
                lastResponse = str;
                let codes = str.match(/^(\d+)(?:\s(\d+\.\d+\.\d+))?\s/);
                let data = {
                  command: cmd,
                  response: str
                };
                if (codes) {
                  data.status = Number(codes[1]) || 0;
                  if (codes[2]) {
                    data.code = codes[2];
                  }
                  data.text = str.substr(codes[0].length);
                } else {
                  data.text = str;
                  data.status = 0;
                }
                done(null, data);
              });
              setImmediate(() => this._sendCommand(cmd));
              return promise;
            },
            resolve,
            reject
          });
          if (handlerResponse && typeof handlerResponse.catch === "function") {
            handlerResponse.then(resolve).catch(reject);
          }
          return;
        }
        switch (this._authMethod) {
          case "XOAUTH2":
            this._handleXOauth2Token(false, callback);
            return;
          case "LOGIN":
            this._responseActions.push((str) => {
              this._actionAUTH_LOGIN_USER(str, callback);
            });
            this._sendCommand("AUTH LOGIN");
            return;
          case "PLAIN":
            this._responseActions.push((str) => {
              this._actionAUTHComplete(str, callback);
            });
            this._sendCommand(
              "AUTH PLAIN " + Buffer.from(
                //this._auth.user+'\u0000'+
                "\0" + // skip authorization identity as it causes problems with some servers
                this._auth.credentials.user + "\0" + this._auth.credentials.pass,
                "utf-8"
              ).toString("base64"),
              // log entry without passwords
              "AUTH PLAIN " + Buffer.from(
                //this._auth.user+'\u0000'+
                "\0" + // skip authorization identity as it causes problems with some servers
                this._auth.credentials.user + "\0/* secret */",
                "utf-8"
              ).toString("base64")
            );
            return;
          case "CRAM-MD5":
            this._responseActions.push((str) => {
              this._actionAUTH_CRAM_MD5(str, callback);
            });
            this._sendCommand("AUTH CRAM-MD5");
            return;
        }
        return callback(this._formatError('Unknown authentication method "' + this._authMethod + '"', "EAUTH", false, "API"));
      }
      /**
       * Sends a message
       *
       * @param {Object} envelope Envelope object, {from: addr, to: [addr]}
       * @param {Object} message String, Buffer or a Stream
       * @param {Function} callback Callback to return once sending is completed
       */
      send(envelope, message2, done) {
        if (!message2) {
          return done(this._formatError("Empty message", "EMESSAGE", false, "API"));
        }
        const isDestroyedMessage = this._isDestroyedMessage("send message");
        if (isDestroyedMessage) {
          return done(this._formatError(isDestroyedMessage, "ECONNECTION", false, "API"));
        }
        if (this._maxAllowedSize && envelope.size > this._maxAllowedSize) {
          return setImmediate(() => {
            done(this._formatError("Message size larger than allowed " + this._maxAllowedSize, "EMESSAGE", false, "MAIL FROM"));
          });
        }
        let returned = false;
        let callback = function() {
          if (returned) {
            return;
          }
          returned = true;
          done(...arguments);
        };
        if (typeof message2.on === "function") {
          message2.on("error", (err) => callback(this._formatError(err, "ESTREAM", false, "API")));
        }
        let startTime = Date.now();
        this._setEnvelope(envelope, (err, info) => {
          if (err) {
            let stream2 = new PassThrough();
            if (typeof message2.pipe === "function") {
              message2.pipe(stream2);
            } else {
              stream2.write(message2);
              stream2.end();
            }
            return callback(err);
          }
          let envelopeTime = Date.now();
          let stream = this._createSendStream((err2, str) => {
            if (err2) {
              return callback(err2);
            }
            info.envelopeTime = envelopeTime - startTime;
            info.messageTime = Date.now() - envelopeTime;
            info.messageSize = stream.outByteCount;
            info.response = str;
            return callback(null, info);
          });
          if (typeof message2.pipe === "function") {
            message2.pipe(stream);
          } else {
            stream.write(message2);
            stream.end();
          }
        });
      }
      /**
       * Resets connection state
       *
       * @param {Function} callback Callback to return once connection is reset
       */
      reset(callback) {
        this._sendCommand("RSET");
        this._responseActions.push((str) => {
          if (str.charAt(0) !== "2") {
            return callback(this._formatError("Could not reset session state. response=" + str, "EPROTOCOL", str, "RSET"));
          }
          this._envelope = false;
          return callback(null, true);
        });
      }
      /**
       * Connection listener that is run when the connection to
       * the server is opened
       *
       * @event
       */
      _onConnect() {
        clearTimeout(this._connectionTimeout);
        this.logger.info(
          {
            tnx: "network",
            localAddress: this._socket.localAddress,
            localPort: this._socket.localPort,
            remoteAddress: this._socket.remoteAddress,
            remotePort: this._socket.remotePort
          },
          "%s established to %s:%s",
          this.secure ? "Secure connection" : "Connection",
          this._socket.remoteAddress,
          this._socket.remotePort
        );
        if (this._destroyed) {
          this.close();
          return;
        }
        this.stage = "connected";
        this._socket.removeListener("data", this._onSocketData);
        this._socket.removeListener("timeout", this._onSocketTimeout);
        this._socket.removeListener("close", this._onSocketClose);
        this._socket.removeListener("end", this._onSocketEnd);
        this._socket.on("data", this._onSocketData);
        this._socket.once("close", this._onSocketClose);
        this._socket.once("end", this._onSocketEnd);
        this._socket.setTimeout(this.options.socketTimeout || SOCKET_TIMEOUT);
        this._socket.on("timeout", this._onSocketTimeout);
        this._greetingTimeout = setTimeout(() => {
          if (this._socket && !this._destroyed && this._responseActions[0] === this._actionGreeting) {
            this._onError("Greeting never received", "ETIMEDOUT", false, "CONN");
          }
        }, this.options.greetingTimeout || GREETING_TIMEOUT);
        this._responseActions.push(this._actionGreeting);
        this._socket.resume();
      }
      /**
       * 'data' listener for data coming from the server
       *
       * @event
       * @param {Buffer} chunk Data chunk coming from the server
       */
      _onData(chunk) {
        if (this._destroyed || !chunk || !chunk.length) {
          return;
        }
        let data = (chunk || "").toString("binary");
        let lines = (this._remainder + data).split(/\r?\n/);
        let lastline;
        this._remainder = lines.pop();
        for (let i = 0, len = lines.length; i < len; i++) {
          if (this._responseQueue.length) {
            lastline = this._responseQueue[this._responseQueue.length - 1];
            if (/^\d+-/.test(lastline.split("\n").pop())) {
              this._responseQueue[this._responseQueue.length - 1] += "\n" + lines[i];
              continue;
            }
          }
          this._responseQueue.push(lines[i]);
        }
        if (this._responseQueue.length) {
          lastline = this._responseQueue[this._responseQueue.length - 1];
          if (/^\d+-/.test(lastline.split("\n").pop())) {
            return;
          }
        }
        this._processResponse();
      }
      /**
       * 'error' listener for the socket
       *
       * @event
       * @param {Error} err Error object
       * @param {String} type Error name
       */
      _onError(err, type, data, command) {
        clearTimeout(this._connectionTimeout);
        clearTimeout(this._greetingTimeout);
        if (this._destroyed) {
          return;
        }
        err = this._formatError(err, type, data, command);
        this.logger.error(data, err.message);
        this.emit("error", err);
        this.close();
      }
      _formatError(message2, type, response, command) {
        let err;
        if (/Error\]$/i.test(Object.prototype.toString.call(message2))) {
          err = message2;
        } else {
          err = new Error(message2);
        }
        if (type && type !== "Error") {
          err.code = type;
        }
        if (response) {
          err.response = response;
          err.message += ": " + response;
        }
        let responseCode = typeof response === "string" && Number((response.match(/^\d+/) || [])[0]) || false;
        if (responseCode) {
          err.responseCode = responseCode;
        }
        if (command) {
          err.command = command;
        }
        return err;
      }
      /**
       * 'close' listener for the socket
       *
       * @event
       */
      _onClose() {
        let serverResponse = false;
        if (this._remainder && this._remainder.trim()) {
          if (this.options.debug || this.options.transactionLog) {
            this.logger.debug(
              {
                tnx: "server"
              },
              this._remainder.replace(/\r?\n$/, "")
            );
          }
          this.lastServerResponse = serverResponse = this._remainder.trim();
        }
        this.logger.info(
          {
            tnx: "network"
          },
          "Connection closed"
        );
        if (this.upgrading && !this._destroyed) {
          return this._onError(new Error("Connection closed unexpectedly"), "ETLS", serverResponse, "CONN");
        } else if (![this._actionGreeting, this.close].includes(this._responseActions[0]) && !this._destroyed) {
          return this._onError(new Error("Connection closed unexpectedly"), "ECONNECTION", serverResponse, "CONN");
        } else if (/^[45]\d{2}\b/.test(serverResponse)) {
          return this._onError(new Error("Connection closed unexpectedly"), "ECONNECTION", serverResponse, "CONN");
        }
        this._destroy();
      }
      /**
       * 'end' listener for the socket
       *
       * @event
       */
      _onEnd() {
        if (this._socket && !this._socket.destroyed) {
          this._socket.destroy();
        }
      }
      /**
       * 'timeout' listener for the socket
       *
       * @event
       */
      _onTimeout() {
        return this._onError(new Error("Timeout"), "ETIMEDOUT", false, "CONN");
      }
      /**
       * Destroys the client, emits 'end'
       */
      _destroy() {
        if (this._destroyed) {
          return;
        }
        this._destroyed = true;
        this.emit("end");
      }
      /**
       * Upgrades the connection to TLS
       *
       * @param {Function} callback Callback function to run when the connection
       *        has been secured
       */
      _upgradeConnection(callback) {
        this._socket.removeListener("data", this._onSocketData);
        this._socket.removeListener("timeout", this._onSocketTimeout);
        let socketPlain = this._socket;
        let opts = {
          socket: this._socket,
          host: this.host
        };
        Object.keys(this.options.tls || {}).forEach((key) => {
          opts[key] = this.options.tls[key];
        });
        if (this.servername && !opts.servername) {
          opts.servername = this.servername;
        }
        this.upgrading = true;
        try {
          this._socket = tls.connect(opts, () => {
            this.secure = true;
            this.upgrading = false;
            this._socket.on("data", this._onSocketData);
            socketPlain.removeListener("close", this._onSocketClose);
            socketPlain.removeListener("end", this._onSocketEnd);
            return callback(null, true);
          });
        } catch (err) {
          return callback(err);
        }
        this._socket.on("error", this._onSocketError);
        this._socket.once("close", this._onSocketClose);
        this._socket.once("end", this._onSocketEnd);
        this._socket.setTimeout(this.options.socketTimeout || SOCKET_TIMEOUT);
        this._socket.on("timeout", this._onSocketTimeout);
        socketPlain.resume();
      }
      /**
       * Processes queued responses from the server
       *
       * @param {Boolean} force If true, ignores _processing flag
       */
      _processResponse() {
        if (!this._responseQueue.length) {
          return false;
        }
        let str = this.lastServerResponse = (this._responseQueue.shift() || "").toString();
        if (/^\d+-/.test(str.split("\n").pop())) {
          return;
        }
        if (this.options.debug || this.options.transactionLog) {
          this.logger.debug(
            {
              tnx: "server"
            },
            str.replace(/\r?\n$/, "")
          );
        }
        if (!str.trim()) {
          setImmediate(() => this._processResponse());
        }
        let action = this._responseActions.shift();
        if (typeof action === "function") {
          action.call(this, str);
          setImmediate(() => this._processResponse());
        } else {
          return this._onError(new Error("Unexpected Response"), "EPROTOCOL", str, "CONN");
        }
      }
      /**
       * Send a command to the server, append \r\n
       *
       * @param {String} str String to be sent to the server
       * @param {String} logStr Optional string to be used for logging instead of the actual string
       */
      _sendCommand(str, logStr) {
        if (this._destroyed) {
          return;
        }
        if (this._socket.destroyed) {
          return this.close();
        }
        if (this.options.debug || this.options.transactionLog) {
          this.logger.debug(
            {
              tnx: "client"
            },
            (logStr || str || "").toString().replace(/\r?\n$/, "")
          );
        }
        this._socket.write(Buffer.from(str + "\r\n", "utf-8"));
      }
      /**
       * Initiates a new message by submitting envelope data, starting with
       * MAIL FROM: command
       *
       * @param {Object} envelope Envelope object in the form of
       *        {from:'...', to:['...']}
       *        or
       *        {from:{address:'...',name:'...'}, to:[address:'...',name:'...']}
       */
      _setEnvelope(envelope, callback) {
        let args = [];
        let useSmtpUtf8 = false;
        this._envelope = envelope || {};
        this._envelope.from = (this._envelope.from && this._envelope.from.address || this._envelope.from || "").toString().trim();
        this._envelope.to = [].concat(this._envelope.to || []).map((to) => (to && to.address || to || "").toString().trim());
        if (!this._envelope.to.length) {
          return callback(this._formatError("No recipients defined", "EENVELOPE", false, "API"));
        }
        if (this._envelope.from && /[\r\n<>]/.test(this._envelope.from)) {
          return callback(this._formatError("Invalid sender " + JSON.stringify(this._envelope.from), "EENVELOPE", false, "API"));
        }
        if (/[\x80-\uFFFF]/.test(this._envelope.from)) {
          useSmtpUtf8 = true;
        }
        for (let i = 0, len = this._envelope.to.length; i < len; i++) {
          if (!this._envelope.to[i] || /[\r\n<>]/.test(this._envelope.to[i])) {
            return callback(this._formatError("Invalid recipient " + JSON.stringify(this._envelope.to[i]), "EENVELOPE", false, "API"));
          }
          if (/[\x80-\uFFFF]/.test(this._envelope.to[i])) {
            useSmtpUtf8 = true;
          }
        }
        this._envelope.rcptQueue = JSON.parse(JSON.stringify(this._envelope.to || []));
        this._envelope.rejected = [];
        this._envelope.rejectedErrors = [];
        this._envelope.accepted = [];
        if (this._envelope.dsn) {
          try {
            this._envelope.dsn = this._setDsnEnvelope(this._envelope.dsn);
          } catch (err) {
            return callback(this._formatError("Invalid DSN " + err.message, "EENVELOPE", false, "API"));
          }
        }
        this._responseActions.push((str) => {
          this._actionMAIL(str, callback);
        });
        if (useSmtpUtf8 && this._supportedExtensions.includes("SMTPUTF8")) {
          args.push("SMTPUTF8");
          this._usingSmtpUtf8 = true;
        }
        if (this._envelope.use8BitMime && this._supportedExtensions.includes("8BITMIME")) {
          args.push("BODY=8BITMIME");
          this._using8BitMime = true;
        }
        if (this._envelope.size && this._supportedExtensions.includes("SIZE")) {
          args.push("SIZE=" + this._envelope.size);
        }
        if (this._envelope.dsn && this._supportedExtensions.includes("DSN")) {
          if (this._envelope.dsn.ret) {
            args.push("RET=" + shared.encodeXText(this._envelope.dsn.ret));
          }
          if (this._envelope.dsn.envid) {
            args.push("ENVID=" + shared.encodeXText(this._envelope.dsn.envid));
          }
        }
        this._sendCommand("MAIL FROM:<" + this._envelope.from + ">" + (args.length ? " " + args.join(" ") : ""));
      }
      _setDsnEnvelope(params) {
        let ret = (params.ret || params.return || "").toString().toUpperCase() || null;
        if (ret) {
          switch (ret) {
            case "HDRS":
            case "HEADERS":
              ret = "HDRS";
              break;
            case "FULL":
            case "BODY":
              ret = "FULL";
              break;
          }
        }
        if (ret && !["FULL", "HDRS"].includes(ret)) {
          throw new Error("ret: " + JSON.stringify(ret));
        }
        let envid = (params.envid || params.id || "").toString() || null;
        let notify = params.notify || null;
        if (notify) {
          if (typeof notify === "string") {
            notify = notify.split(",");
          }
          notify = notify.map((n) => n.trim().toUpperCase());
          let validNotify = ["NEVER", "SUCCESS", "FAILURE", "DELAY"];
          let invaliNotify = notify.filter((n) => !validNotify.includes(n));
          if (invaliNotify.length || notify.length > 1 && notify.includes("NEVER")) {
            throw new Error("notify: " + JSON.stringify(notify.join(",")));
          }
          notify = notify.join(",");
        }
        let orcpt = (params.recipient || params.orcpt || "").toString() || null;
        if (orcpt && orcpt.indexOf(";") < 0) {
          orcpt = "rfc822;" + orcpt;
        }
        return {
          ret,
          envid,
          notify,
          orcpt
        };
      }
      _getDsnRcptToArgs() {
        let args = [];
        if (this._envelope.dsn && this._supportedExtensions.includes("DSN")) {
          if (this._envelope.dsn.notify) {
            args.push("NOTIFY=" + shared.encodeXText(this._envelope.dsn.notify));
          }
          if (this._envelope.dsn.orcpt) {
            args.push("ORCPT=" + shared.encodeXText(this._envelope.dsn.orcpt));
          }
        }
        return args.length ? " " + args.join(" ") : "";
      }
      _createSendStream(callback) {
        let dataStream = new DataStream();
        let logStream;
        if (this.options.lmtp) {
          this._envelope.accepted.forEach((recipient, i) => {
            let final = i === this._envelope.accepted.length - 1;
            this._responseActions.push((str) => {
              this._actionLMTPStream(recipient, final, str, callback);
            });
          });
        } else {
          this._responseActions.push((str) => {
            this._actionSMTPStream(str, callback);
          });
        }
        dataStream.pipe(this._socket, {
          end: false
        });
        if (this.options.debug) {
          logStream = new PassThrough();
          logStream.on("readable", () => {
            let chunk;
            while (chunk = logStream.read()) {
              this.logger.debug(
                {
                  tnx: "message"
                },
                chunk.toString("binary").replace(/\r?\n$/, "")
              );
            }
          });
          dataStream.pipe(logStream);
        }
        dataStream.once("end", () => {
          this.logger.info(
            {
              tnx: "message",
              inByteCount: dataStream.inByteCount,
              outByteCount: dataStream.outByteCount
            },
            "<%s bytes encoded mime message (source size %s bytes)>",
            dataStream.outByteCount,
            dataStream.inByteCount
          );
        });
        return dataStream;
      }
      /** ACTIONS **/
      /**
       * Will be run after the connection is created and the server sends
       * a greeting. If the incoming message starts with 220 initiate
       * SMTP session by sending EHLO command
       *
       * @param {String} str Message from the server
       */
      _actionGreeting(str) {
        clearTimeout(this._greetingTimeout);
        if (str.substr(0, 3) !== "220") {
          this._onError(new Error("Invalid greeting. response=" + str), "EPROTOCOL", str, "CONN");
          return;
        }
        if (this.options.lmtp) {
          this._responseActions.push(this._actionLHLO);
          this._sendCommand("LHLO " + this.name);
        } else {
          this._responseActions.push(this._actionEHLO);
          this._sendCommand("EHLO " + this.name);
        }
      }
      /**
       * Handles server response for LHLO command. If it yielded in
       * error, emit 'error', otherwise treat this as an EHLO response
       *
       * @param {String} str Message from the server
       */
      _actionLHLO(str) {
        if (str.charAt(0) !== "2") {
          this._onError(new Error("Invalid LHLO. response=" + str), "EPROTOCOL", str, "LHLO");
          return;
        }
        this._actionEHLO(str);
      }
      /**
       * Handles server response for EHLO command. If it yielded in
       * error, try HELO instead, otherwise initiate TLS negotiation
       * if STARTTLS is supported by the server or move into the
       * authentication phase.
       *
       * @param {String} str Message from the server
       */
      _actionEHLO(str) {
        let match2;
        if (str.substr(0, 3) === "421") {
          this._onError(new Error("Server terminates connection. response=" + str), "ECONNECTION", str, "EHLO");
          return;
        }
        if (str.charAt(0) !== "2") {
          if (this.options.requireTLS) {
            this._onError(new Error("EHLO failed but HELO does not support required STARTTLS. response=" + str), "ECONNECTION", str, "EHLO");
            return;
          }
          this._responseActions.push(this._actionHELO);
          this._sendCommand("HELO " + this.name);
          return;
        }
        this._ehloLines = str.split(/\r?\n/).map((line) => line.replace(/^\d+[ -]/, "").trim()).filter((line) => line).slice(1);
        if (!this.secure && !this.options.ignoreTLS && (/[ -]STARTTLS\b/im.test(str) || this.options.requireTLS)) {
          this._sendCommand("STARTTLS");
          this._responseActions.push(this._actionSTARTTLS);
          return;
        }
        if (/[ -]SMTPUTF8\b/im.test(str)) {
          this._supportedExtensions.push("SMTPUTF8");
        }
        if (/[ -]DSN\b/im.test(str)) {
          this._supportedExtensions.push("DSN");
        }
        if (/[ -]8BITMIME\b/im.test(str)) {
          this._supportedExtensions.push("8BITMIME");
        }
        if (/[ -]PIPELINING\b/im.test(str)) {
          this._supportedExtensions.push("PIPELINING");
        }
        if (/[ -]AUTH\b/i.test(str)) {
          this.allowsAuth = true;
        }
        if (/[ -]AUTH(?:(\s+|=)[^\n]*\s+|\s+|=)PLAIN/i.test(str)) {
          this._supportedAuth.push("PLAIN");
        }
        if (/[ -]AUTH(?:(\s+|=)[^\n]*\s+|\s+|=)LOGIN/i.test(str)) {
          this._supportedAuth.push("LOGIN");
        }
        if (/[ -]AUTH(?:(\s+|=)[^\n]*\s+|\s+|=)CRAM-MD5/i.test(str)) {
          this._supportedAuth.push("CRAM-MD5");
        }
        if (/[ -]AUTH(?:(\s+|=)[^\n]*\s+|\s+|=)XOAUTH2/i.test(str)) {
          this._supportedAuth.push("XOAUTH2");
        }
        if (match2 = str.match(/[ -]SIZE(?:[ \t]+(\d+))?/im)) {
          this._supportedExtensions.push("SIZE");
          this._maxAllowedSize = Number(match2[1]) || 0;
        }
        this.emit("connect");
      }
      /**
       * Handles server response for HELO command. If it yielded in
       * error, emit 'error', otherwise move into the authentication phase.
       *
       * @param {String} str Message from the server
       */
      _actionHELO(str) {
        if (str.charAt(0) !== "2") {
          this._onError(new Error("Invalid HELO. response=" + str), "EPROTOCOL", str, "HELO");
          return;
        }
        this.allowsAuth = true;
        this.emit("connect");
      }
      /**
       * Handles server response for STARTTLS command. If there's an error
       * try HELO instead, otherwise initiate TLS upgrade. If the upgrade
       * succeedes restart the EHLO
       *
       * @param {String} str Message from the server
       */
      _actionSTARTTLS(str) {
        if (str.charAt(0) !== "2") {
          if (this.options.opportunisticTLS) {
            this.logger.info(
              {
                tnx: "smtp"
              },
              "Failed STARTTLS upgrade, continuing unencrypted"
            );
            return this.emit("connect");
          }
          this._onError(new Error("Error upgrading connection with STARTTLS"), "ETLS", str, "STARTTLS");
          return;
        }
        this._upgradeConnection((err, secured) => {
          if (err) {
            this._onError(new Error("Error initiating TLS - " + (err.message || err)), "ETLS", false, "STARTTLS");
            return;
          }
          this.logger.info(
            {
              tnx: "smtp"
            },
            "Connection upgraded with STARTTLS"
          );
          if (secured) {
            if (this.options.lmtp) {
              this._responseActions.push(this._actionLHLO);
              this._sendCommand("LHLO " + this.name);
            } else {
              this._responseActions.push(this._actionEHLO);
              this._sendCommand("EHLO " + this.name);
            }
          } else {
            this.emit("connect");
          }
        });
      }
      /**
       * Handle the response for AUTH LOGIN command. We are expecting
       * '334 VXNlcm5hbWU6' (base64 for 'Username:'). Data to be sent as
       * response needs to be base64 encoded username. We do not need
       * exact match but settle with 334 response in general as some
       * hosts invalidly use a longer message than VXNlcm5hbWU6
       *
       * @param {String} str Message from the server
       */
      _actionAUTH_LOGIN_USER(str, callback) {
        if (!/^334[ -]/.test(str)) {
          callback(this._formatError('Invalid login sequence while waiting for "334 VXNlcm5hbWU6"', "EAUTH", str, "AUTH LOGIN"));
          return;
        }
        this._responseActions.push((str2) => {
          this._actionAUTH_LOGIN_PASS(str2, callback);
        });
        this._sendCommand(Buffer.from(this._auth.credentials.user + "", "utf-8").toString("base64"));
      }
      /**
       * Handle the response for AUTH CRAM-MD5 command. We are expecting
       * '334 <challenge string>'. Data to be sent as response needs to be
       * base64 decoded challenge string, MD5 hashed using the password as
       * a HMAC key, prefixed by the username and a space, and finally all
       * base64 encoded again.
       *
       * @param {String} str Message from the server
       */
      _actionAUTH_CRAM_MD5(str, callback) {
        let challengeMatch = str.match(/^334\s+(.+)$/);
        let challengeString = "";
        if (!challengeMatch) {
          return callback(this._formatError("Invalid login sequence while waiting for server challenge string", "EAUTH", str, "AUTH CRAM-MD5"));
        } else {
          challengeString = challengeMatch[1];
        }
        let base64decoded = Buffer.from(challengeString, "base64").toString("ascii"), hmacMD5 = crypto5.createHmac("md5", this._auth.credentials.pass);
        hmacMD5.update(base64decoded);
        let prepended = this._auth.credentials.user + " " + hmacMD5.digest("hex");
        this._responseActions.push((str2) => {
          this._actionAUTH_CRAM_MD5_PASS(str2, callback);
        });
        this._sendCommand(
          Buffer.from(prepended).toString("base64"),
          // hidden hash for logs
          Buffer.from(this._auth.credentials.user + " /* secret */").toString("base64")
        );
      }
      /**
       * Handles the response to CRAM-MD5 authentication, if there's no error,
       * the user can be considered logged in. Start waiting for a message to send
       *
       * @param {String} str Message from the server
       */
      _actionAUTH_CRAM_MD5_PASS(str, callback) {
        if (!str.match(/^235\s+/)) {
          return callback(this._formatError('Invalid login sequence while waiting for "235"', "EAUTH", str, "AUTH CRAM-MD5"));
        }
        this.logger.info(
          {
            tnx: "smtp",
            username: this._auth.user,
            action: "authenticated",
            method: this._authMethod
          },
          "User %s authenticated",
          JSON.stringify(this._auth.user)
        );
        this.authenticated = true;
        callback(null, true);
      }
      /**
       * Handle the response for AUTH LOGIN command. We are expecting
       * '334 UGFzc3dvcmQ6' (base64 for 'Password:'). Data to be sent as
       * response needs to be base64 encoded password.
       *
       * @param {String} str Message from the server
       */
      _actionAUTH_LOGIN_PASS(str, callback) {
        if (!/^334[ -]/.test(str)) {
          return callback(this._formatError('Invalid login sequence while waiting for "334 UGFzc3dvcmQ6"', "EAUTH", str, "AUTH LOGIN"));
        }
        this._responseActions.push((str2) => {
          this._actionAUTHComplete(str2, callback);
        });
        this._sendCommand(
          Buffer.from((this._auth.credentials.pass || "").toString(), "utf-8").toString("base64"),
          // Hidden pass for logs
          Buffer.from("/* secret */", "utf-8").toString("base64")
        );
      }
      /**
       * Handles the response for authentication, if there's no error,
       * the user can be considered logged in. Start waiting for a message to send
       *
       * @param {String} str Message from the server
       */
      _actionAUTHComplete(str, isRetry, callback) {
        if (!callback && typeof isRetry === "function") {
          callback = isRetry;
          isRetry = false;
        }
        if (str.substr(0, 3) === "334") {
          this._responseActions.push((str2) => {
            if (isRetry || this._authMethod !== "XOAUTH2") {
              this._actionAUTHComplete(str2, true, callback);
            } else {
              setImmediate(() => this._handleXOauth2Token(true, callback));
            }
          });
          this._sendCommand("");
          return;
        }
        if (str.charAt(0) !== "2") {
          this.logger.info(
            {
              tnx: "smtp",
              username: this._auth.user,
              action: "authfail",
              method: this._authMethod
            },
            "User %s failed to authenticate",
            JSON.stringify(this._auth.user)
          );
          return callback(this._formatError("Invalid login", "EAUTH", str, "AUTH " + this._authMethod));
        }
        this.logger.info(
          {
            tnx: "smtp",
            username: this._auth.user,
            action: "authenticated",
            method: this._authMethod
          },
          "User %s authenticated",
          JSON.stringify(this._auth.user)
        );
        this.authenticated = true;
        callback(null, true);
      }
      /**
       * Handle response for a MAIL FROM: command
       *
       * @param {String} str Message from the server
       */
      _actionMAIL(str, callback) {
        let message2, curRecipient;
        if (Number(str.charAt(0)) !== 2) {
          if (this._usingSmtpUtf8 && /^550 /.test(str) && /[\x80-\uFFFF]/.test(this._envelope.from)) {
            message2 = "Internationalized mailbox name not allowed";
          } else {
            message2 = "Mail command failed";
          }
          return callback(this._formatError(message2, "EENVELOPE", str, "MAIL FROM"));
        }
        if (!this._envelope.rcptQueue.length) {
          return callback(this._formatError("Can't send mail - no recipients defined", "EENVELOPE", false, "API"));
        } else {
          this._recipientQueue = [];
          if (this._supportedExtensions.includes("PIPELINING")) {
            while (this._envelope.rcptQueue.length) {
              curRecipient = this._envelope.rcptQueue.shift();
              this._recipientQueue.push(curRecipient);
              this._responseActions.push((str2) => {
                this._actionRCPT(str2, callback);
              });
              this._sendCommand("RCPT TO:<" + curRecipient + ">" + this._getDsnRcptToArgs());
            }
          } else {
            curRecipient = this._envelope.rcptQueue.shift();
            this._recipientQueue.push(curRecipient);
            this._responseActions.push((str2) => {
              this._actionRCPT(str2, callback);
            });
            this._sendCommand("RCPT TO:<" + curRecipient + ">" + this._getDsnRcptToArgs());
          }
        }
      }
      /**
       * Handle response for a RCPT TO: command
       *
       * @param {String} str Message from the server
       */
      _actionRCPT(str, callback) {
        let message2, err, curRecipient = this._recipientQueue.shift();
        if (Number(str.charAt(0)) !== 2) {
          if (this._usingSmtpUtf8 && /^553 /.test(str) && /[\x80-\uFFFF]/.test(curRecipient)) {
            message2 = "Internationalized mailbox name not allowed";
          } else {
            message2 = "Recipient command failed";
          }
          this._envelope.rejected.push(curRecipient);
          err = this._formatError(message2, "EENVELOPE", str, "RCPT TO");
          err.recipient = curRecipient;
          this._envelope.rejectedErrors.push(err);
        } else {
          this._envelope.accepted.push(curRecipient);
        }
        if (!this._envelope.rcptQueue.length && !this._recipientQueue.length) {
          if (this._envelope.rejected.length < this._envelope.to.length) {
            this._responseActions.push((str2) => {
              this._actionDATA(str2, callback);
            });
            this._sendCommand("DATA");
          } else {
            err = this._formatError("Can't send mail - all recipients were rejected", "EENVELOPE", str, "RCPT TO");
            err.rejected = this._envelope.rejected;
            err.rejectedErrors = this._envelope.rejectedErrors;
            return callback(err);
          }
        } else if (this._envelope.rcptQueue.length) {
          curRecipient = this._envelope.rcptQueue.shift();
          this._recipientQueue.push(curRecipient);
          this._responseActions.push((str2) => {
            this._actionRCPT(str2, callback);
          });
          this._sendCommand("RCPT TO:<" + curRecipient + ">" + this._getDsnRcptToArgs());
        }
      }
      /**
       * Handle response for a DATA command
       *
       * @param {String} str Message from the server
       */
      _actionDATA(str, callback) {
        if (!/^[23]/.test(str)) {
          return callback(this._formatError("Data command failed", "EENVELOPE", str, "DATA"));
        }
        let response = {
          accepted: this._envelope.accepted,
          rejected: this._envelope.rejected
        };
        if (this._ehloLines && this._ehloLines.length) {
          response.ehlo = this._ehloLines;
        }
        if (this._envelope.rejectedErrors.length) {
          response.rejectedErrors = this._envelope.rejectedErrors;
        }
        callback(null, response);
      }
      /**
       * Handle response for a DATA stream when using SMTP
       * We expect a single response that defines if the sending succeeded or failed
       *
       * @param {String} str Message from the server
       */
      _actionSMTPStream(str, callback) {
        if (Number(str.charAt(0)) !== 2) {
          return callback(this._formatError("Message failed", "EMESSAGE", str, "DATA"));
        } else {
          return callback(null, str);
        }
      }
      /**
       * Handle response for a DATA stream
       * We expect a separate response for every recipient. All recipients can either
       * succeed or fail separately
       *
       * @param {String} recipient The recipient this response applies to
       * @param {Boolean} final Is this the final recipient?
       * @param {String} str Message from the server
       */
      _actionLMTPStream(recipient, final, str, callback) {
        let err;
        if (Number(str.charAt(0)) !== 2) {
          err = this._formatError("Message failed for recipient " + recipient, "EMESSAGE", str, "DATA");
          err.recipient = recipient;
          this._envelope.rejected.push(recipient);
          this._envelope.rejectedErrors.push(err);
          for (let i = 0, len = this._envelope.accepted.length; i < len; i++) {
            if (this._envelope.accepted[i] === recipient) {
              this._envelope.accepted.splice(i, 1);
            }
          }
        }
        if (final) {
          return callback(null, str);
        }
      }
      _handleXOauth2Token(isRetry, callback) {
        this._auth.oauth2.getToken(isRetry, (err, accessToken) => {
          if (err) {
            this.logger.info(
              {
                tnx: "smtp",
                username: this._auth.user,
                action: "authfail",
                method: this._authMethod
              },
              "User %s failed to authenticate",
              JSON.stringify(this._auth.user)
            );
            return callback(this._formatError(err, "EAUTH", false, "AUTH XOAUTH2"));
          }
          this._responseActions.push((str) => {
            this._actionAUTHComplete(str, isRetry, callback);
          });
          this._sendCommand(
            "AUTH XOAUTH2 " + this._auth.oauth2.buildXOAuth2Token(accessToken),
            //  Hidden for logs
            "AUTH XOAUTH2 " + this._auth.oauth2.buildXOAuth2Token("/* secret */")
          );
        });
      }
      /**
       *
       * @param {string} command
       * @private
       */
      _isDestroyedMessage(command) {
        if (this._destroyed) {
          return "Cannot " + command + " - smtp connection is already destroyed.";
        }
        if (this._socket) {
          if (this._socket.destroyed) {
            return "Cannot " + command + " - smtp connection socket is already destroyed.";
          }
          if (!this._socket.writable) {
            return "Cannot " + command + " - smtp connection socket is already half-closed.";
          }
        }
      }
      _getHostname() {
        let defaultHostname;
        try {
          defaultHostname = os.hostname() || "";
        } catch (err) {
          defaultHostname = "localhost";
        }
        if (!defaultHostname || defaultHostname.indexOf(".") < 0) {
          defaultHostname = "[127.0.0.1]";
        }
        if (defaultHostname.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) {
          defaultHostname = "[" + defaultHostname + "]";
        }
        return defaultHostname;
      }
    };
    module.exports = SMTPConnection;
  }
});

// node_modules/nodemailer/lib/xoauth2/index.js
var require_xoauth2 = __commonJS({
  "node_modules/nodemailer/lib/xoauth2/index.js"(exports, module) {
    "use strict";
    var Stream = __require("stream").Stream;
    var nmfetch = require_fetch();
    var crypto5 = __require("crypto");
    var shared = require_shared();
    var XOAuth2 = class extends Stream {
      constructor(options, logger) {
        super();
        this.options = options || {};
        if (options && options.serviceClient) {
          if (!options.privateKey || !options.user) {
            setImmediate(() => this.emit("error", new Error('Options "privateKey" and "user" are required for service account!')));
            return;
          }
          let serviceRequestTimeout = Math.min(Math.max(Number(this.options.serviceRequestTimeout) || 0, 0), 3600);
          this.options.serviceRequestTimeout = serviceRequestTimeout || 5 * 60;
        }
        this.logger = shared.getLogger(
          {
            logger
          },
          {
            component: this.options.component || "OAuth2"
          }
        );
        this.provisionCallback = typeof this.options.provisionCallback === "function" ? this.options.provisionCallback : false;
        this.options.accessUrl = this.options.accessUrl || "https://accounts.google.com/o/oauth2/token";
        this.options.customHeaders = this.options.customHeaders || {};
        this.options.customParams = this.options.customParams || {};
        this.accessToken = this.options.accessToken || false;
        if (this.options.expires && Number(this.options.expires)) {
          this.expires = this.options.expires;
        } else {
          let timeout = Math.max(Number(this.options.timeout) || 0, 0);
          this.expires = timeout && Date.now() + timeout * 1e3 || 0;
        }
      }
      /**
       * Returns or generates (if previous has expired) a XOAuth2 token
       *
       * @param {Boolean} renew If false then use cached access token (if available)
       * @param {Function} callback Callback function with error object and token string
       */
      getToken(renew, callback) {
        if (!renew && this.accessToken && (!this.expires || this.expires > Date.now())) {
          return callback(null, this.accessToken);
        }
        let generateCallback = (...args) => {
          if (args[0]) {
            this.logger.error(
              {
                err: args[0],
                tnx: "OAUTH2",
                user: this.options.user,
                action: "renew"
              },
              "Failed generating new Access Token for %s",
              this.options.user
            );
          } else {
            this.logger.info(
              {
                tnx: "OAUTH2",
                user: this.options.user,
                action: "renew"
              },
              "Generated new Access Token for %s",
              this.options.user
            );
          }
          callback(...args);
        };
        if (this.provisionCallback) {
          this.provisionCallback(this.options.user, !!renew, (err, accessToken, expires) => {
            if (!err && accessToken) {
              this.accessToken = accessToken;
              this.expires = expires || 0;
            }
            generateCallback(err, accessToken);
          });
        } else {
          this.generateToken(generateCallback);
        }
      }
      /**
       * Updates token values
       *
       * @param {String} accessToken New access token
       * @param {Number} timeout Access token lifetime in seconds
       *
       * Emits 'token': { user: User email-address, accessToken: the new accessToken, timeout: TTL in seconds}
       */
      updateToken(accessToken, timeout) {
        this.accessToken = accessToken;
        timeout = Math.max(Number(timeout) || 0, 0);
        this.expires = timeout && Date.now() + timeout * 1e3 || 0;
        this.emit("token", {
          user: this.options.user,
          accessToken: accessToken || "",
          expires: this.expires
        });
      }
      /**
       * Generates a new XOAuth2 token with the credentials provided at initialization
       *
       * @param {Function} callback Callback function with error object and token string
       */
      generateToken(callback) {
        let urlOptions;
        let loggedUrlOptions;
        if (this.options.serviceClient) {
          let iat = Math.floor(Date.now() / 1e3);
          let tokenData = {
            iss: this.options.serviceClient,
            scope: this.options.scope || "https://mail.google.com/",
            sub: this.options.user,
            aud: this.options.accessUrl,
            iat,
            exp: iat + this.options.serviceRequestTimeout
          };
          let token;
          try {
            token = this.jwtSignRS256(tokenData);
          } catch (err) {
            return callback(new Error("Can't generate token. Check your auth options"));
          }
          urlOptions = {
            grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion: token
          };
          loggedUrlOptions = {
            grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion: tokenData
          };
        } else {
          if (!this.options.refreshToken) {
            return callback(new Error("Can't create new access token for user"));
          }
          urlOptions = {
            client_id: this.options.clientId || "",
            client_secret: this.options.clientSecret || "",
            refresh_token: this.options.refreshToken,
            grant_type: "refresh_token"
          };
          loggedUrlOptions = {
            client_id: this.options.clientId || "",
            client_secret: (this.options.clientSecret || "").substr(0, 6) + "...",
            refresh_token: (this.options.refreshToken || "").substr(0, 6) + "...",
            grant_type: "refresh_token"
          };
        }
        Object.keys(this.options.customParams).forEach((key) => {
          urlOptions[key] = this.options.customParams[key];
          loggedUrlOptions[key] = this.options.customParams[key];
        });
        this.logger.debug(
          {
            tnx: "OAUTH2",
            user: this.options.user,
            action: "generate"
          },
          "Requesting token using: %s",
          JSON.stringify(loggedUrlOptions)
        );
        this.postRequest(this.options.accessUrl, urlOptions, this.options, (error, body2) => {
          let data;
          if (error) {
            return callback(error);
          }
          try {
            data = JSON.parse(body2.toString());
          } catch (E) {
            return callback(E);
          }
          if (!data || typeof data !== "object") {
            this.logger.debug(
              {
                tnx: "OAUTH2",
                user: this.options.user,
                action: "post"
              },
              "Response: %s",
              (body2 || "").toString()
            );
            return callback(new Error("Invalid authentication response"));
          }
          let logData = {};
          Object.keys(data).forEach((key) => {
            if (key !== "access_token") {
              logData[key] = data[key];
            } else {
              logData[key] = (data[key] || "").toString().substr(0, 6) + "...";
            }
          });
          this.logger.debug(
            {
              tnx: "OAUTH2",
              user: this.options.user,
              action: "post"
            },
            "Response: %s",
            JSON.stringify(logData)
          );
          if (data.error) {
            let errorMessage = data.error;
            if (data.error_description) {
              errorMessage += ": " + data.error_description;
            }
            if (data.error_uri) {
              errorMessage += " (" + data.error_uri + ")";
            }
            return callback(new Error(errorMessage));
          }
          if (data.access_token) {
            this.updateToken(data.access_token, data.expires_in);
            return callback(null, this.accessToken);
          }
          return callback(new Error("No access token"));
        });
      }
      /**
       * Converts an access_token and user id into a base64 encoded XOAuth2 token
       *
       * @param {String} [accessToken] Access token string
       * @return {String} Base64 encoded token for IMAP or SMTP login
       */
      buildXOAuth2Token(accessToken) {
        let authData = ["user=" + (this.options.user || ""), "auth=Bearer " + (accessToken || this.accessToken), "", ""];
        return Buffer.from(authData.join(""), "utf-8").toString("base64");
      }
      /**
       * Custom POST request handler.
       * This is only needed to keep paths short in Windows – usually this module
       * is a dependency of a dependency and if it tries to require something
       * like the request module the paths get way too long to handle for Windows.
       * As we do only a simple POST request we do not actually require complicated
       * logic support (no redirects, no nothing) anyway.
       *
       * @param {String} url Url to POST to
       * @param {String|Buffer} payload Payload to POST
       * @param {Function} callback Callback function with (err, buff)
       */
      postRequest(url, payload, params, callback) {
        let returned = false;
        let chunks = [];
        let chunklen = 0;
        let req = nmfetch(url, {
          method: "post",
          headers: params.customHeaders,
          body: payload,
          allowErrorResponse: true
        });
        req.on("readable", () => {
          let chunk;
          while ((chunk = req.read()) !== null) {
            chunks.push(chunk);
            chunklen += chunk.length;
          }
        });
        req.once("error", (err) => {
          if (returned) {
            return;
          }
          returned = true;
          return callback(err);
        });
        req.once("end", () => {
          if (returned) {
            return;
          }
          returned = true;
          return callback(null, Buffer.concat(chunks, chunklen));
        });
      }
      /**
       * Encodes a buffer or a string into Base64url format
       *
       * @param {Buffer|String} data The data to convert
       * @return {String} The encoded string
       */
      toBase64URL(data) {
        if (typeof data === "string") {
          data = Buffer.from(data);
        }
        return data.toString("base64").replace(/[=]+/g, "").replace(/\+/g, "-").replace(/\//g, "_");
      }
      /**
       * Creates a JSON Web Token signed with RS256 (SHA256 + RSA)
       *
       * @param {Object} payload The payload to include in the generated token
       * @return {String} The generated and signed token
       */
      jwtSignRS256(payload) {
        payload = ['{"alg":"RS256","typ":"JWT"}', JSON.stringify(payload)].map((val) => this.toBase64URL(val)).join(".");
        let signature = crypto5.createSign("RSA-SHA256").update(payload).sign(this.options.privateKey);
        return payload + "." + this.toBase64URL(signature);
      }
    };
    module.exports = XOAuth2;
  }
});

// node_modules/nodemailer/lib/smtp-pool/pool-resource.js
var require_pool_resource = __commonJS({
  "node_modules/nodemailer/lib/smtp-pool/pool-resource.js"(exports, module) {
    "use strict";
    var SMTPConnection = require_smtp_connection();
    var assign = require_shared().assign;
    var XOAuth2 = require_xoauth2();
    var EventEmitter = __require("events");
    var PoolResource = class extends EventEmitter {
      constructor(pool) {
        super();
        this.pool = pool;
        this.options = pool.options;
        this.logger = this.pool.logger;
        if (this.options.auth) {
          switch ((this.options.auth.type || "").toString().toUpperCase()) {
            case "OAUTH2": {
              let oauth2 = new XOAuth2(this.options.auth, this.logger);
              oauth2.provisionCallback = this.pool.mailer && this.pool.mailer.get("oauth2_provision_cb") || oauth2.provisionCallback;
              this.auth = {
                type: "OAUTH2",
                user: this.options.auth.user,
                oauth2,
                method: "XOAUTH2"
              };
              oauth2.on("token", (token) => this.pool.mailer.emit("token", token));
              oauth2.on("error", (err) => this.emit("error", err));
              break;
            }
            default:
              if (!this.options.auth.user && !this.options.auth.pass) {
                break;
              }
              this.auth = {
                type: (this.options.auth.type || "").toString().toUpperCase() || "LOGIN",
                user: this.options.auth.user,
                credentials: {
                  user: this.options.auth.user || "",
                  pass: this.options.auth.pass,
                  options: this.options.auth.options
                },
                method: (this.options.auth.method || "").trim().toUpperCase() || this.options.authMethod || false
              };
          }
        }
        this._connection = false;
        this._connected = false;
        this.messages = 0;
        this.available = true;
      }
      /**
       * Initiates a connection to the SMTP server
       *
       * @param {Function} callback Callback function to run once the connection is established or failed
       */
      connect(callback) {
        this.pool.getSocket(this.options, (err, socketOptions) => {
          if (err) {
            return callback(err);
          }
          let returned = false;
          let options = this.options;
          if (socketOptions && socketOptions.connection) {
            this.logger.info(
              {
                tnx: "proxy",
                remoteAddress: socketOptions.connection.remoteAddress,
                remotePort: socketOptions.connection.remotePort,
                destHost: options.host || "",
                destPort: options.port || "",
                action: "connected"
              },
              "Using proxied socket from %s:%s to %s:%s",
              socketOptions.connection.remoteAddress,
              socketOptions.connection.remotePort,
              options.host || "",
              options.port || ""
            );
            options = assign(false, options);
            Object.keys(socketOptions).forEach((key) => {
              options[key] = socketOptions[key];
            });
          }
          this.connection = new SMTPConnection(options);
          this.connection.once("error", (err2) => {
            this.emit("error", err2);
            if (returned) {
              return;
            }
            returned = true;
            return callback(err2);
          });
          this.connection.once("end", () => {
            this.close();
            if (returned) {
              return;
            }
            returned = true;
            let timer = setTimeout(() => {
              if (returned) {
                return;
              }
              let err2 = new Error("Unexpected socket close");
              if (this.connection && this.connection._socket && this.connection._socket.upgrading) {
                err2.code = "ETLS";
              }
              callback(err2);
            }, 1e3);
            try {
              timer.unref();
            } catch (E) {
            }
          });
          this.connection.connect(() => {
            if (returned) {
              return;
            }
            if (this.auth && (this.connection.allowsAuth || options.forceAuth)) {
              this.connection.login(this.auth, (err2) => {
                if (returned) {
                  return;
                }
                returned = true;
                if (err2) {
                  this.connection.close();
                  this.emit("error", err2);
                  return callback(err2);
                }
                this._connected = true;
                callback(null, true);
              });
            } else {
              returned = true;
              this._connected = true;
              return callback(null, true);
            }
          });
        });
      }
      /**
       * Sends an e-mail to be sent using the selected settings
       *
       * @param {Object} mail Mail object
       * @param {Function} callback Callback function
       */
      send(mail, callback) {
        if (!this._connected) {
          return this.connect((err) => {
            if (err) {
              return callback(err);
            }
            return this.send(mail, callback);
          });
        }
        let envelope = mail.message.getEnvelope();
        let messageId = mail.message.messageId();
        let recipients = [].concat(envelope.to || []);
        if (recipients.length > 3) {
          recipients.push("...and " + recipients.splice(2).length + " more");
        }
        this.logger.info(
          {
            tnx: "send",
            messageId,
            cid: this.id
          },
          "Sending message %s using #%s to <%s>",
          messageId,
          this.id,
          recipients.join(", ")
        );
        if (mail.data.dsn) {
          envelope.dsn = mail.data.dsn;
        }
        this.connection.send(envelope, mail.message.createReadStream(), (err, info) => {
          this.messages++;
          if (err) {
            this.connection.close();
            this.emit("error", err);
            return callback(err);
          }
          info.envelope = {
            from: envelope.from,
            to: envelope.to
          };
          info.messageId = messageId;
          setImmediate(() => {
            let err2;
            if (this.messages >= this.options.maxMessages) {
              err2 = new Error("Resource exhausted");
              err2.code = "EMAXLIMIT";
              this.connection.close();
              this.emit("error", err2);
            } else {
              this.pool._checkRateLimit(() => {
                this.available = true;
                this.emit("available");
              });
            }
          });
          callback(null, info);
        });
      }
      /**
       * Closes the connection
       */
      close() {
        this._connected = false;
        if (this.auth && this.auth.oauth2) {
          this.auth.oauth2.removeAllListeners();
        }
        if (this.connection) {
          this.connection.close();
        }
        this.emit("close");
      }
    };
    module.exports = PoolResource;
  }
});

// node_modules/nodemailer/lib/well-known/services.json
var require_services = __commonJS({
  "node_modules/nodemailer/lib/well-known/services.json"(exports, module) {
    module.exports = {
      "1und1": {
        host: "smtp.1und1.de",
        port: 465,
        secure: true,
        authMethod: "LOGIN"
      },
      Aliyun: {
        domains: ["aliyun.com"],
        host: "smtp.aliyun.com",
        port: 465,
        secure: true
      },
      AOL: {
        domains: ["aol.com"],
        host: "smtp.aol.com",
        port: 587
      },
      Bluewin: {
        host: "smtpauths.bluewin.ch",
        domains: ["bluewin.ch"],
        port: 465
      },
      DebugMail: {
        host: "debugmail.io",
        port: 25
      },
      DynectEmail: {
        aliases: ["Dynect"],
        host: "smtp.dynect.net",
        port: 25
      },
      Ethereal: {
        aliases: ["ethereal.email"],
        host: "smtp.ethereal.email",
        port: 587
      },
      FastMail: {
        domains: ["fastmail.fm"],
        host: "smtp.fastmail.com",
        port: 465,
        secure: true
      },
      "Forward Email": {
        aliases: ["FE", "ForwardEmail"],
        domains: ["forwardemail.net"],
        host: "smtp.forwardemail.net",
        port: 465,
        secure: true
      },
      "Feishu Mail": {
        aliases: ["Feishu", "FeishuMail"],
        domains: ["www.feishu.cn"],
        host: "smtp.feishu.cn",
        port: 465,
        secure: true
      },
      GandiMail: {
        aliases: ["Gandi", "Gandi Mail"],
        host: "mail.gandi.net",
        port: 587
      },
      Gmail: {
        aliases: ["Google Mail"],
        domains: ["gmail.com", "googlemail.com"],
        host: "smtp.gmail.com",
        port: 465,
        secure: true
      },
      Godaddy: {
        host: "smtpout.secureserver.net",
        port: 25
      },
      GodaddyAsia: {
        host: "smtp.asia.secureserver.net",
        port: 25
      },
      GodaddyEurope: {
        host: "smtp.europe.secureserver.net",
        port: 25
      },
      "hot.ee": {
        host: "mail.hot.ee"
      },
      Hotmail: {
        aliases: ["Outlook", "Outlook.com", "Hotmail.com"],
        domains: ["hotmail.com", "outlook.com"],
        host: "smtp-mail.outlook.com",
        port: 587
      },
      iCloud: {
        aliases: ["Me", "Mac"],
        domains: ["me.com", "mac.com"],
        host: "smtp.mail.me.com",
        port: 587
      },
      Infomaniak: {
        host: "mail.infomaniak.com",
        domains: ["ik.me", "ikmail.com", "etik.com"],
        port: 587
      },
      Loopia: {
        host: "mailcluster.loopia.se",
        port: 465
      },
      "mail.ee": {
        host: "smtp.mail.ee"
      },
      "Mail.ru": {
        host: "smtp.mail.ru",
        port: 465,
        secure: true
      },
      "Mailcatch.app": {
        host: "sandbox-smtp.mailcatch.app",
        port: 2525
      },
      Maildev: {
        port: 1025,
        ignoreTLS: true
      },
      Mailgun: {
        host: "smtp.mailgun.org",
        port: 465,
        secure: true
      },
      Mailjet: {
        host: "in.mailjet.com",
        port: 587
      },
      Mailosaur: {
        host: "mailosaur.io",
        port: 25
      },
      Mailtrap: {
        host: "live.smtp.mailtrap.io",
        port: 587
      },
      Mandrill: {
        host: "smtp.mandrillapp.com",
        port: 587
      },
      Naver: {
        host: "smtp.naver.com",
        port: 587
      },
      One: {
        host: "send.one.com",
        port: 465,
        secure: true
      },
      OpenMailBox: {
        aliases: ["OMB", "openmailbox.org"],
        host: "smtp.openmailbox.org",
        port: 465,
        secure: true
      },
      Outlook365: {
        host: "smtp.office365.com",
        port: 587,
        secure: false
      },
      OhMySMTP: {
        host: "smtp.ohmysmtp.com",
        port: 587,
        secure: false
      },
      Postmark: {
        aliases: ["PostmarkApp"],
        host: "smtp.postmarkapp.com",
        port: 2525
      },
      Proton: {
        aliases: ["ProtonMail", "Proton.me", "Protonmail.com", "Protonmail.ch"],
        domains: ["proton.me", "protonmail.com", "pm.me", "protonmail.ch"],
        host: "smtp.protonmail.ch",
        port: 587,
        requireTLS: true
      },
      "qiye.aliyun": {
        host: "smtp.mxhichina.com",
        port: "465",
        secure: true
      },
      QQ: {
        domains: ["qq.com"],
        host: "smtp.qq.com",
        port: 465,
        secure: true
      },
      QQex: {
        aliases: ["QQ Enterprise"],
        domains: ["exmail.qq.com"],
        host: "smtp.exmail.qq.com",
        port: 465,
        secure: true
      },
      SendCloud: {
        host: "smtp.sendcloud.net",
        port: 2525
      },
      SendGrid: {
        host: "smtp.sendgrid.net",
        port: 587
      },
      SendinBlue: {
        aliases: ["Brevo"],
        host: "smtp-relay.brevo.com",
        port: 587
      },
      SendPulse: {
        host: "smtp-pulse.com",
        port: 465,
        secure: true
      },
      SES: {
        host: "email-smtp.us-east-1.amazonaws.com",
        port: 465,
        secure: true
      },
      "SES-US-EAST-1": {
        host: "email-smtp.us-east-1.amazonaws.com",
        port: 465,
        secure: true
      },
      "SES-US-WEST-2": {
        host: "email-smtp.us-west-2.amazonaws.com",
        port: 465,
        secure: true
      },
      "SES-EU-WEST-1": {
        host: "email-smtp.eu-west-1.amazonaws.com",
        port: 465,
        secure: true
      },
      "SES-AP-SOUTH-1": {
        host: "email-smtp.ap-south-1.amazonaws.com",
        port: 465,
        secure: true
      },
      "SES-AP-NORTHEAST-1": {
        host: "email-smtp.ap-northeast-1.amazonaws.com",
        port: 465,
        secure: true
      },
      "SES-AP-NORTHEAST-2": {
        host: "email-smtp.ap-northeast-2.amazonaws.com",
        port: 465,
        secure: true
      },
      "SES-AP-NORTHEAST-3": {
        host: "email-smtp.ap-northeast-3.amazonaws.com",
        port: 465,
        secure: true
      },
      "SES-AP-SOUTHEAST-1": {
        host: "email-smtp.ap-southeast-1.amazonaws.com",
        port: 465,
        secure: true
      },
      "SES-AP-SOUTHEAST-2": {
        host: "email-smtp.ap-southeast-2.amazonaws.com",
        port: 465,
        secure: true
      },
      Seznam: {
        aliases: ["Seznam Email"],
        domains: ["seznam.cz", "email.cz", "post.cz", "spoluzaci.cz"],
        host: "smtp.seznam.cz",
        port: 465,
        secure: true
      },
      Sparkpost: {
        aliases: ["SparkPost", "SparkPost Mail"],
        domains: ["sparkpost.com"],
        host: "smtp.sparkpostmail.com",
        port: 587,
        secure: false
      },
      Tipimail: {
        host: "smtp.tipimail.com",
        port: 587
      },
      Yahoo: {
        domains: ["yahoo.com"],
        host: "smtp.mail.yahoo.com",
        port: 465,
        secure: true
      },
      Yandex: {
        domains: ["yandex.ru"],
        host: "smtp.yandex.ru",
        port: 465,
        secure: true
      },
      Zoho: {
        host: "smtp.zoho.com",
        port: 465,
        secure: true,
        authMethod: "LOGIN"
      },
      "126": {
        host: "smtp.126.com",
        port: 465,
        secure: true
      },
      "163": {
        host: "smtp.163.com",
        port: 465,
        secure: true
      }
    };
  }
});

// node_modules/nodemailer/lib/well-known/index.js
var require_well_known = __commonJS({
  "node_modules/nodemailer/lib/well-known/index.js"(exports, module) {
    "use strict";
    var services = require_services();
    var normalized = {};
    Object.keys(services).forEach((key) => {
      let service = services[key];
      normalized[normalizeKey(key)] = normalizeService(service);
      [].concat(service.aliases || []).forEach((alias) => {
        normalized[normalizeKey(alias)] = normalizeService(service);
      });
      [].concat(service.domains || []).forEach((domain) => {
        normalized[normalizeKey(domain)] = normalizeService(service);
      });
    });
    function normalizeKey(key) {
      return key.replace(/[^a-zA-Z0-9.-]/g, "").toLowerCase();
    }
    function normalizeService(service) {
      let filter = ["domains", "aliases"];
      let response = {};
      Object.keys(service).forEach((key) => {
        if (filter.indexOf(key) < 0) {
          response[key] = service[key];
        }
      });
      return response;
    }
    module.exports = function(key) {
      key = normalizeKey(key.split("@").pop());
      return normalized[key] || false;
    };
  }
});

// node_modules/nodemailer/lib/smtp-pool/index.js
var require_smtp_pool = __commonJS({
  "node_modules/nodemailer/lib/smtp-pool/index.js"(exports, module) {
    "use strict";
    var EventEmitter = __require("events");
    var PoolResource = require_pool_resource();
    var SMTPConnection = require_smtp_connection();
    var wellKnown = require_well_known();
    var shared = require_shared();
    var packageData = require_package();
    var SMTPPool = class extends EventEmitter {
      constructor(options) {
        super();
        options = options || {};
        if (typeof options === "string") {
          options = {
            url: options
          };
        }
        let urlData;
        let service = options.service;
        if (typeof options.getSocket === "function") {
          this.getSocket = options.getSocket;
        }
        if (options.url) {
          urlData = shared.parseConnectionUrl(options.url);
          service = service || urlData.service;
        }
        this.options = shared.assign(
          false,
          // create new object
          options,
          // regular options
          urlData,
          // url options
          service && wellKnown(service)
          // wellknown options
        );
        this.options.maxConnections = this.options.maxConnections || 5;
        this.options.maxMessages = this.options.maxMessages || 100;
        this.logger = shared.getLogger(this.options, {
          component: this.options.component || "smtp-pool"
        });
        let connection = new SMTPConnection(this.options);
        this.name = "SMTP (pool)";
        this.version = packageData.version + "[client:" + connection.version + "]";
        this._rateLimit = {
          counter: 0,
          timeout: null,
          waiting: [],
          checkpoint: false,
          delta: Number(this.options.rateDelta) || 1e3,
          limit: Number(this.options.rateLimit) || 0
        };
        this._closed = false;
        this._queue = [];
        this._connections = [];
        this._connectionCounter = 0;
        this.idling = true;
        setImmediate(() => {
          if (this.idling) {
            this.emit("idle");
          }
        });
      }
      /**
       * Placeholder function for creating proxy sockets. This method immediatelly returns
       * without a socket
       *
       * @param {Object} options Connection options
       * @param {Function} callback Callback function to run with the socket keys
       */
      getSocket(options, callback) {
        return setImmediate(() => callback(null, false));
      }
      /**
       * Queues an e-mail to be sent using the selected settings
       *
       * @param {Object} mail Mail object
       * @param {Function} callback Callback function
       */
      send(mail, callback) {
        if (this._closed) {
          return false;
        }
        this._queue.push({
          mail,
          requeueAttempts: 0,
          callback
        });
        if (this.idling && this._queue.length >= this.options.maxConnections) {
          this.idling = false;
        }
        setImmediate(() => this._processMessages());
        return true;
      }
      /**
       * Closes all connections in the pool. If there is a message being sent, the connection
       * is closed later
       */
      close() {
        let connection;
        let len = this._connections.length;
        this._closed = true;
        clearTimeout(this._rateLimit.timeout);
        if (!len && !this._queue.length) {
          return;
        }
        for (let i = len - 1; i >= 0; i--) {
          if (this._connections[i] && this._connections[i].available) {
            connection = this._connections[i];
            connection.close();
            this.logger.info(
              {
                tnx: "connection",
                cid: connection.id,
                action: "removed"
              },
              "Connection #%s removed",
              connection.id
            );
          }
        }
        if (len && !this._connections.length) {
          this.logger.debug(
            {
              tnx: "connection"
            },
            "All connections removed"
          );
        }
        if (!this._queue.length) {
          return;
        }
        let invokeCallbacks = () => {
          if (!this._queue.length) {
            this.logger.debug(
              {
                tnx: "connection"
              },
              "Pending queue entries cleared"
            );
            return;
          }
          let entry = this._queue.shift();
          if (entry && typeof entry.callback === "function") {
            try {
              entry.callback(new Error("Connection pool was closed"));
            } catch (E) {
              this.logger.error(
                {
                  err: E,
                  tnx: "callback",
                  cid: connection.id
                },
                "Callback error for #%s: %s",
                connection.id,
                E.message
              );
            }
          }
          setImmediate(invokeCallbacks);
        };
        setImmediate(invokeCallbacks);
      }
      /**
       * Check the queue and available connections. If there is a message to be sent and there is
       * an available connection, then use this connection to send the mail
       */
      _processMessages() {
        let connection;
        let i, len;
        if (this._closed) {
          return;
        }
        if (!this._queue.length) {
          if (!this.idling) {
            this.idling = true;
            this.emit("idle");
          }
          return;
        }
        for (i = 0, len = this._connections.length; i < len; i++) {
          if (this._connections[i].available) {
            connection = this._connections[i];
            break;
          }
        }
        if (!connection && this._connections.length < this.options.maxConnections) {
          connection = this._createConnection();
        }
        if (!connection) {
          this.idling = false;
          return;
        }
        if (!this.idling && this._queue.length < this.options.maxConnections) {
          this.idling = true;
          this.emit("idle");
        }
        let entry = connection.queueEntry = this._queue.shift();
        entry.messageId = (connection.queueEntry.mail.message.getHeader("message-id") || "").replace(/[<>\s]/g, "");
        connection.available = false;
        this.logger.debug(
          {
            tnx: "pool",
            cid: connection.id,
            messageId: entry.messageId,
            action: "assign"
          },
          "Assigned message <%s> to #%s (%s)",
          entry.messageId,
          connection.id,
          connection.messages + 1
        );
        if (this._rateLimit.limit) {
          this._rateLimit.counter++;
          if (!this._rateLimit.checkpoint) {
            this._rateLimit.checkpoint = Date.now();
          }
        }
        connection.send(entry.mail, (err, info) => {
          if (entry === connection.queueEntry) {
            try {
              entry.callback(err, info);
            } catch (E) {
              this.logger.error(
                {
                  err: E,
                  tnx: "callback",
                  cid: connection.id
                },
                "Callback error for #%s: %s",
                connection.id,
                E.message
              );
            }
            connection.queueEntry = false;
          }
        });
      }
      /**
       * Creates a new pool resource
       */
      _createConnection() {
        let connection = new PoolResource(this);
        connection.id = ++this._connectionCounter;
        this.logger.info(
          {
            tnx: "pool",
            cid: connection.id,
            action: "conection"
          },
          "Created new pool resource #%s",
          connection.id
        );
        connection.on("available", () => {
          this.logger.debug(
            {
              tnx: "connection",
              cid: connection.id,
              action: "available"
            },
            "Connection #%s became available",
            connection.id
          );
          if (this._closed) {
            this.close();
          } else {
            this._processMessages();
          }
        });
        connection.once("error", (err) => {
          if (err.code !== "EMAXLIMIT") {
            this.logger.error(
              {
                err,
                tnx: "pool",
                cid: connection.id
              },
              "Pool Error for #%s: %s",
              connection.id,
              err.message
            );
          } else {
            this.logger.debug(
              {
                tnx: "pool",
                cid: connection.id,
                action: "maxlimit"
              },
              "Max messages limit exchausted for #%s",
              connection.id
            );
          }
          if (connection.queueEntry) {
            try {
              connection.queueEntry.callback(err);
            } catch (E) {
              this.logger.error(
                {
                  err: E,
                  tnx: "callback",
                  cid: connection.id
                },
                "Callback error for #%s: %s",
                connection.id,
                E.message
              );
            }
            connection.queueEntry = false;
          }
          this._removeConnection(connection);
          this._continueProcessing();
        });
        connection.once("close", () => {
          this.logger.info(
            {
              tnx: "connection",
              cid: connection.id,
              action: "closed"
            },
            "Connection #%s was closed",
            connection.id
          );
          this._removeConnection(connection);
          if (connection.queueEntry) {
            setTimeout(() => {
              if (connection.queueEntry) {
                if (this._shouldRequeuOnConnectionClose(connection.queueEntry)) {
                  this._requeueEntryOnConnectionClose(connection);
                } else {
                  this._failDeliveryOnConnectionClose(connection);
                }
              }
              this._continueProcessing();
            }, 50);
          } else {
            this._continueProcessing();
          }
        });
        this._connections.push(connection);
        return connection;
      }
      _shouldRequeuOnConnectionClose(queueEntry) {
        if (this.options.maxRequeues === void 0 || this.options.maxRequeues < 0) {
          return true;
        }
        return queueEntry.requeueAttempts < this.options.maxRequeues;
      }
      _failDeliveryOnConnectionClose(connection) {
        if (connection.queueEntry && connection.queueEntry.callback) {
          try {
            connection.queueEntry.callback(new Error("Reached maximum number of retries after connection was closed"));
          } catch (E) {
            this.logger.error(
              {
                err: E,
                tnx: "callback",
                messageId: connection.queueEntry.messageId,
                cid: connection.id
              },
              "Callback error for #%s: %s",
              connection.id,
              E.message
            );
          }
          connection.queueEntry = false;
        }
      }
      _requeueEntryOnConnectionClose(connection) {
        connection.queueEntry.requeueAttempts = connection.queueEntry.requeueAttempts + 1;
        this.logger.debug(
          {
            tnx: "pool",
            cid: connection.id,
            messageId: connection.queueEntry.messageId,
            action: "requeue"
          },
          "Re-queued message <%s> for #%s. Attempt: #%s",
          connection.queueEntry.messageId,
          connection.id,
          connection.queueEntry.requeueAttempts
        );
        this._queue.unshift(connection.queueEntry);
        connection.queueEntry = false;
      }
      /**
       * Continue to process message if the pool hasn't closed
       */
      _continueProcessing() {
        if (this._closed) {
          this.close();
        } else {
          setTimeout(() => this._processMessages(), 100);
        }
      }
      /**
       * Remove resource from pool
       *
       * @param {Object} connection The PoolResource to remove
       */
      _removeConnection(connection) {
        let index = this._connections.indexOf(connection);
        if (index !== -1) {
          this._connections.splice(index, 1);
        }
      }
      /**
       * Checks if connections have hit current rate limit and if so, queues the availability callback
       *
       * @param {Function} callback Callback function to run once rate limiter has been cleared
       */
      _checkRateLimit(callback) {
        if (!this._rateLimit.limit) {
          return callback();
        }
        let now = Date.now();
        if (this._rateLimit.counter < this._rateLimit.limit) {
          return callback();
        }
        this._rateLimit.waiting.push(callback);
        if (this._rateLimit.checkpoint <= now - this._rateLimit.delta) {
          return this._clearRateLimit();
        } else if (!this._rateLimit.timeout) {
          this._rateLimit.timeout = setTimeout(() => this._clearRateLimit(), this._rateLimit.delta - (now - this._rateLimit.checkpoint));
          this._rateLimit.checkpoint = now;
        }
      }
      /**
       * Clears current rate limit limitation and runs paused callback
       */
      _clearRateLimit() {
        clearTimeout(this._rateLimit.timeout);
        this._rateLimit.timeout = null;
        this._rateLimit.counter = 0;
        this._rateLimit.checkpoint = false;
        while (this._rateLimit.waiting.length) {
          let cb = this._rateLimit.waiting.shift();
          setImmediate(cb);
        }
      }
      /**
       * Returns true if there are free slots in the queue
       */
      isIdle() {
        return this.idling;
      }
      /**
       * Verifies SMTP configuration
       *
       * @param {Function} callback Callback function
       */
      verify(callback) {
        let promise;
        if (!callback) {
          promise = new Promise((resolve, reject) => {
            callback = shared.callbackPromise(resolve, reject);
          });
        }
        let auth = new PoolResource(this).auth;
        this.getSocket(this.options, (err, socketOptions) => {
          if (err) {
            return callback(err);
          }
          let options = this.options;
          if (socketOptions && socketOptions.connection) {
            this.logger.info(
              {
                tnx: "proxy",
                remoteAddress: socketOptions.connection.remoteAddress,
                remotePort: socketOptions.connection.remotePort,
                destHost: options.host || "",
                destPort: options.port || "",
                action: "connected"
              },
              "Using proxied socket from %s:%s to %s:%s",
              socketOptions.connection.remoteAddress,
              socketOptions.connection.remotePort,
              options.host || "",
              options.port || ""
            );
            options = shared.assign(false, options);
            Object.keys(socketOptions).forEach((key) => {
              options[key] = socketOptions[key];
            });
          }
          let connection = new SMTPConnection(options);
          let returned = false;
          connection.once("error", (err2) => {
            if (returned) {
              return;
            }
            returned = true;
            connection.close();
            return callback(err2);
          });
          connection.once("end", () => {
            if (returned) {
              return;
            }
            returned = true;
            return callback(new Error("Connection closed"));
          });
          let finalize = () => {
            if (returned) {
              return;
            }
            returned = true;
            connection.quit();
            return callback(null, true);
          };
          connection.connect(() => {
            if (returned) {
              return;
            }
            if (auth && (connection.allowsAuth || options.forceAuth)) {
              connection.login(auth, (err2) => {
                if (returned) {
                  return;
                }
                if (err2) {
                  returned = true;
                  connection.close();
                  return callback(err2);
                }
                finalize();
              });
            } else if (!auth && connection.allowsAuth && options.forceAuth) {
              let err2 = new Error("Authentication info was not provided");
              err2.code = "NoAuth";
              returned = true;
              connection.close();
              return callback(err2);
            } else {
              finalize();
            }
          });
        });
        return promise;
      }
    };
    module.exports = SMTPPool;
  }
});

// node_modules/nodemailer/lib/smtp-transport/index.js
var require_smtp_transport = __commonJS({
  "node_modules/nodemailer/lib/smtp-transport/index.js"(exports, module) {
    "use strict";
    var EventEmitter = __require("events");
    var SMTPConnection = require_smtp_connection();
    var wellKnown = require_well_known();
    var shared = require_shared();
    var XOAuth2 = require_xoauth2();
    var packageData = require_package();
    var SMTPTransport = class extends EventEmitter {
      constructor(options) {
        super();
        options = options || {};
        if (typeof options === "string") {
          options = {
            url: options
          };
        }
        let urlData;
        let service = options.service;
        if (typeof options.getSocket === "function") {
          this.getSocket = options.getSocket;
        }
        if (options.url) {
          urlData = shared.parseConnectionUrl(options.url);
          service = service || urlData.service;
        }
        this.options = shared.assign(
          false,
          // create new object
          options,
          // regular options
          urlData,
          // url options
          service && wellKnown(service)
          // wellknown options
        );
        this.logger = shared.getLogger(this.options, {
          component: this.options.component || "smtp-transport"
        });
        let connection = new SMTPConnection(this.options);
        this.name = "SMTP";
        this.version = packageData.version + "[client:" + connection.version + "]";
        if (this.options.auth) {
          this.auth = this.getAuth({});
        }
      }
      /**
       * Placeholder function for creating proxy sockets. This method immediatelly returns
       * without a socket
       *
       * @param {Object} options Connection options
       * @param {Function} callback Callback function to run with the socket keys
       */
      getSocket(options, callback) {
        return setImmediate(() => callback(null, false));
      }
      getAuth(authOpts) {
        if (!authOpts) {
          return this.auth;
        }
        let hasAuth = false;
        let authData = {};
        if (this.options.auth && typeof this.options.auth === "object") {
          Object.keys(this.options.auth).forEach((key) => {
            hasAuth = true;
            authData[key] = this.options.auth[key];
          });
        }
        if (authOpts && typeof authOpts === "object") {
          Object.keys(authOpts).forEach((key) => {
            hasAuth = true;
            authData[key] = authOpts[key];
          });
        }
        if (!hasAuth) {
          return false;
        }
        switch ((authData.type || "").toString().toUpperCase()) {
          case "OAUTH2": {
            if (!authData.service && !authData.user) {
              return false;
            }
            let oauth2 = new XOAuth2(authData, this.logger);
            oauth2.provisionCallback = this.mailer && this.mailer.get("oauth2_provision_cb") || oauth2.provisionCallback;
            oauth2.on("token", (token) => this.mailer.emit("token", token));
            oauth2.on("error", (err) => this.emit("error", err));
            return {
              type: "OAUTH2",
              user: authData.user,
              oauth2,
              method: "XOAUTH2"
            };
          }
          default:
            return {
              type: (authData.type || "").toString().toUpperCase() || "LOGIN",
              user: authData.user,
              credentials: {
                user: authData.user || "",
                pass: authData.pass,
                options: authData.options
              },
              method: (authData.method || "").trim().toUpperCase() || this.options.authMethod || false
            };
        }
      }
      /**
       * Sends an e-mail using the selected settings
       *
       * @param {Object} mail Mail object
       * @param {Function} callback Callback function
       */
      send(mail, callback) {
        this.getSocket(this.options, (err, socketOptions) => {
          if (err) {
            return callback(err);
          }
          let returned = false;
          let options = this.options;
          if (socketOptions && socketOptions.connection) {
            this.logger.info(
              {
                tnx: "proxy",
                remoteAddress: socketOptions.connection.remoteAddress,
                remotePort: socketOptions.connection.remotePort,
                destHost: options.host || "",
                destPort: options.port || "",
                action: "connected"
              },
              "Using proxied socket from %s:%s to %s:%s",
              socketOptions.connection.remoteAddress,
              socketOptions.connection.remotePort,
              options.host || "",
              options.port || ""
            );
            options = shared.assign(false, options);
            Object.keys(socketOptions).forEach((key) => {
              options[key] = socketOptions[key];
            });
          }
          let connection = new SMTPConnection(options);
          connection.once("error", (err2) => {
            if (returned) {
              return;
            }
            returned = true;
            connection.close();
            return callback(err2);
          });
          connection.once("end", () => {
            if (returned) {
              return;
            }
            let timer = setTimeout(() => {
              if (returned) {
                return;
              }
              returned = true;
              let err2 = new Error("Unexpected socket close");
              if (connection && connection._socket && connection._socket.upgrading) {
                err2.code = "ETLS";
              }
              callback(err2);
            }, 1e3);
            try {
              timer.unref();
            } catch (E) {
            }
          });
          let sendMessage = () => {
            let envelope = mail.message.getEnvelope();
            let messageId = mail.message.messageId();
            let recipients = [].concat(envelope.to || []);
            if (recipients.length > 3) {
              recipients.push("...and " + recipients.splice(2).length + " more");
            }
            if (mail.data.dsn) {
              envelope.dsn = mail.data.dsn;
            }
            this.logger.info(
              {
                tnx: "send",
                messageId
              },
              "Sending message %s to <%s>",
              messageId,
              recipients.join(", ")
            );
            connection.send(envelope, mail.message.createReadStream(), (err2, info) => {
              returned = true;
              connection.close();
              if (err2) {
                this.logger.error(
                  {
                    err: err2,
                    tnx: "send"
                  },
                  "Send error for %s: %s",
                  messageId,
                  err2.message
                );
                return callback(err2);
              }
              info.envelope = {
                from: envelope.from,
                to: envelope.to
              };
              info.messageId = messageId;
              try {
                return callback(null, info);
              } catch (E) {
                this.logger.error(
                  {
                    err: E,
                    tnx: "callback"
                  },
                  "Callback error for %s: %s",
                  messageId,
                  E.message
                );
              }
            });
          };
          connection.connect(() => {
            if (returned) {
              return;
            }
            let auth = this.getAuth(mail.data.auth);
            if (auth && (connection.allowsAuth || options.forceAuth)) {
              connection.login(auth, (err2) => {
                if (auth && auth !== this.auth && auth.oauth2) {
                  auth.oauth2.removeAllListeners();
                }
                if (returned) {
                  return;
                }
                if (err2) {
                  returned = true;
                  connection.close();
                  return callback(err2);
                }
                sendMessage();
              });
            } else {
              sendMessage();
            }
          });
        });
      }
      /**
       * Verifies SMTP configuration
       *
       * @param {Function} callback Callback function
       */
      verify(callback) {
        let promise;
        if (!callback) {
          promise = new Promise((resolve, reject) => {
            callback = shared.callbackPromise(resolve, reject);
          });
        }
        this.getSocket(this.options, (err, socketOptions) => {
          if (err) {
            return callback(err);
          }
          let options = this.options;
          if (socketOptions && socketOptions.connection) {
            this.logger.info(
              {
                tnx: "proxy",
                remoteAddress: socketOptions.connection.remoteAddress,
                remotePort: socketOptions.connection.remotePort,
                destHost: options.host || "",
                destPort: options.port || "",
                action: "connected"
              },
              "Using proxied socket from %s:%s to %s:%s",
              socketOptions.connection.remoteAddress,
              socketOptions.connection.remotePort,
              options.host || "",
              options.port || ""
            );
            options = shared.assign(false, options);
            Object.keys(socketOptions).forEach((key) => {
              options[key] = socketOptions[key];
            });
          }
          let connection = new SMTPConnection(options);
          let returned = false;
          connection.once("error", (err2) => {
            if (returned) {
              return;
            }
            returned = true;
            connection.close();
            return callback(err2);
          });
          connection.once("end", () => {
            if (returned) {
              return;
            }
            returned = true;
            return callback(new Error("Connection closed"));
          });
          let finalize = () => {
            if (returned) {
              return;
            }
            returned = true;
            connection.quit();
            return callback(null, true);
          };
          connection.connect(() => {
            if (returned) {
              return;
            }
            let authData = this.getAuth({});
            if (authData && (connection.allowsAuth || options.forceAuth)) {
              connection.login(authData, (err2) => {
                if (returned) {
                  return;
                }
                if (err2) {
                  returned = true;
                  connection.close();
                  return callback(err2);
                }
                finalize();
              });
            } else if (!authData && connection.allowsAuth && options.forceAuth) {
              let err2 = new Error("Authentication info was not provided");
              err2.code = "NoAuth";
              returned = true;
              connection.close();
              return callback(err2);
            } else {
              finalize();
            }
          });
        });
        return promise;
      }
      /**
       * Releases resources
       */
      close() {
        if (this.auth && this.auth.oauth2) {
          this.auth.oauth2.removeAllListeners();
        }
        this.emit("close");
      }
    };
    module.exports = SMTPTransport;
  }
});

// node_modules/nodemailer/lib/sendmail-transport/index.js
var require_sendmail_transport = __commonJS({
  "node_modules/nodemailer/lib/sendmail-transport/index.js"(exports, module) {
    "use strict";
    var spawn = __require("child_process").spawn;
    var packageData = require_package();
    var shared = require_shared();
    var SendmailTransport = class {
      constructor(options) {
        options = options || {};
        this._spawn = spawn;
        this.options = options || {};
        this.name = "Sendmail";
        this.version = packageData.version;
        this.path = "sendmail";
        this.args = false;
        this.winbreak = false;
        this.logger = shared.getLogger(this.options, {
          component: this.options.component || "sendmail"
        });
        if (options) {
          if (typeof options === "string") {
            this.path = options;
          } else if (typeof options === "object") {
            if (options.path) {
              this.path = options.path;
            }
            if (Array.isArray(options.args)) {
              this.args = options.args;
            }
            this.winbreak = ["win", "windows", "dos", "\r\n"].includes((options.newline || "").toString().toLowerCase());
          }
        }
      }
      /**
       * <p>Compiles a mailcomposer message and forwards it to handler that sends it.</p>
       *
       * @param {Object} emailMessage MailComposer object
       * @param {Function} callback Callback function to run when the sending is completed
       */
      send(mail, done) {
        mail.message.keepBcc = true;
        let envelope = mail.data.envelope || mail.message.getEnvelope();
        let messageId = mail.message.messageId();
        let args;
        let sendmail;
        let returned;
        const hasInvalidAddresses = [].concat(envelope.from || []).concat(envelope.to || []).some((addr) => /^-/.test(addr));
        if (hasInvalidAddresses) {
          return done(new Error("Can not send mail. Invalid envelope addresses."));
        }
        if (this.args) {
          args = ["-i"].concat(this.args).concat(envelope.to);
        } else {
          args = ["-i"].concat(envelope.from ? ["-f", envelope.from] : []).concat(envelope.to);
        }
        let callback = (err) => {
          if (returned) {
            return;
          }
          returned = true;
          if (typeof done === "function") {
            if (err) {
              return done(err);
            } else {
              return done(null, {
                envelope: mail.data.envelope || mail.message.getEnvelope(),
                messageId,
                response: "Messages queued for delivery"
              });
            }
          }
        };
        try {
          sendmail = this._spawn(this.path, args);
        } catch (E) {
          this.logger.error(
            {
              err: E,
              tnx: "spawn",
              messageId
            },
            "Error occurred while spawning sendmail. %s",
            E.message
          );
          return callback(E);
        }
        if (sendmail) {
          sendmail.on("error", (err) => {
            this.logger.error(
              {
                err,
                tnx: "spawn",
                messageId
              },
              "Error occurred when sending message %s. %s",
              messageId,
              err.message
            );
            callback(err);
          });
          sendmail.once("exit", (code) => {
            if (!code) {
              return callback();
            }
            let err;
            if (code === 127) {
              err = new Error("Sendmail command not found, process exited with code " + code);
            } else {
              err = new Error("Sendmail exited with code " + code);
            }
            this.logger.error(
              {
                err,
                tnx: "stdin",
                messageId
              },
              "Error sending message %s to sendmail. %s",
              messageId,
              err.message
            );
            callback(err);
          });
          sendmail.once("close", callback);
          sendmail.stdin.on("error", (err) => {
            this.logger.error(
              {
                err,
                tnx: "stdin",
                messageId
              },
              "Error occurred when piping message %s to sendmail. %s",
              messageId,
              err.message
            );
            callback(err);
          });
          let recipients = [].concat(envelope.to || []);
          if (recipients.length > 3) {
            recipients.push("...and " + recipients.splice(2).length + " more");
          }
          this.logger.info(
            {
              tnx: "send",
              messageId
            },
            "Sending message %s to <%s>",
            messageId,
            recipients.join(", ")
          );
          let sourceStream = mail.message.createReadStream();
          sourceStream.once("error", (err) => {
            this.logger.error(
              {
                err,
                tnx: "stdin",
                messageId
              },
              "Error occurred when generating message %s. %s",
              messageId,
              err.message
            );
            sendmail.kill("SIGINT");
            callback(err);
          });
          sourceStream.pipe(sendmail.stdin);
        } else {
          return callback(new Error("sendmail was not found"));
        }
      }
    };
    module.exports = SendmailTransport;
  }
});

// node_modules/nodemailer/lib/stream-transport/index.js
var require_stream_transport = __commonJS({
  "node_modules/nodemailer/lib/stream-transport/index.js"(exports, module) {
    "use strict";
    var packageData = require_package();
    var shared = require_shared();
    var StreamTransport = class {
      constructor(options) {
        options = options || {};
        this.options = options || {};
        this.name = "StreamTransport";
        this.version = packageData.version;
        this.logger = shared.getLogger(this.options, {
          component: this.options.component || "stream-transport"
        });
        this.winbreak = ["win", "windows", "dos", "\r\n"].includes((options.newline || "").toString().toLowerCase());
      }
      /**
       * Compiles a mailcomposer message and forwards it to handler that sends it
       *
       * @param {Object} emailMessage MailComposer object
       * @param {Function} callback Callback function to run when the sending is completed
       */
      send(mail, done) {
        mail.message.keepBcc = true;
        let envelope = mail.data.envelope || mail.message.getEnvelope();
        let messageId = mail.message.messageId();
        let recipients = [].concat(envelope.to || []);
        if (recipients.length > 3) {
          recipients.push("...and " + recipients.splice(2).length + " more");
        }
        this.logger.info(
          {
            tnx: "send",
            messageId
          },
          "Sending message %s to <%s> using %s line breaks",
          messageId,
          recipients.join(", "),
          this.winbreak ? "<CR><LF>" : "<LF>"
        );
        setImmediate(() => {
          let stream;
          try {
            stream = mail.message.createReadStream();
          } catch (E) {
            this.logger.error(
              {
                err: E,
                tnx: "send",
                messageId
              },
              "Creating send stream failed for %s. %s",
              messageId,
              E.message
            );
            return done(E);
          }
          if (!this.options.buffer) {
            stream.once("error", (err) => {
              this.logger.error(
                {
                  err,
                  tnx: "send",
                  messageId
                },
                "Failed creating message for %s. %s",
                messageId,
                err.message
              );
            });
            return done(null, {
              envelope: mail.data.envelope || mail.message.getEnvelope(),
              messageId,
              message: stream
            });
          }
          let chunks = [];
          let chunklen = 0;
          stream.on("readable", () => {
            let chunk;
            while ((chunk = stream.read()) !== null) {
              chunks.push(chunk);
              chunklen += chunk.length;
            }
          });
          stream.once("error", (err) => {
            this.logger.error(
              {
                err,
                tnx: "send",
                messageId
              },
              "Failed creating message for %s. %s",
              messageId,
              err.message
            );
            return done(err);
          });
          stream.on(
            "end",
            () => done(null, {
              envelope: mail.data.envelope || mail.message.getEnvelope(),
              messageId,
              message: Buffer.concat(chunks, chunklen)
            })
          );
        });
      }
    };
    module.exports = StreamTransport;
  }
});

// node_modules/nodemailer/lib/json-transport/index.js
var require_json_transport = __commonJS({
  "node_modules/nodemailer/lib/json-transport/index.js"(exports, module) {
    "use strict";
    var packageData = require_package();
    var shared = require_shared();
    var JSONTransport = class {
      constructor(options) {
        options = options || {};
        this.options = options || {};
        this.name = "JSONTransport";
        this.version = packageData.version;
        this.logger = shared.getLogger(this.options, {
          component: this.options.component || "json-transport"
        });
      }
      /**
       * <p>Compiles a mailcomposer message and forwards it to handler that sends it.</p>
       *
       * @param {Object} emailMessage MailComposer object
       * @param {Function} callback Callback function to run when the sending is completed
       */
      send(mail, done) {
        mail.message.keepBcc = true;
        let envelope = mail.data.envelope || mail.message.getEnvelope();
        let messageId = mail.message.messageId();
        let recipients = [].concat(envelope.to || []);
        if (recipients.length > 3) {
          recipients.push("...and " + recipients.splice(2).length + " more");
        }
        this.logger.info(
          {
            tnx: "send",
            messageId
          },
          "Composing JSON structure of %s to <%s>",
          messageId,
          recipients.join(", ")
        );
        setImmediate(() => {
          mail.normalize((err, data) => {
            if (err) {
              this.logger.error(
                {
                  err,
                  tnx: "send",
                  messageId
                },
                "Failed building JSON structure for %s. %s",
                messageId,
                err.message
              );
              return done(err);
            }
            delete data.envelope;
            delete data.normalizedHeaders;
            return done(null, {
              envelope,
              messageId,
              message: this.options.skipEncoding ? data : JSON.stringify(data)
            });
          });
        });
      }
    };
    module.exports = JSONTransport;
  }
});

// node_modules/nodemailer/lib/ses-transport/index.js
var require_ses_transport = __commonJS({
  "node_modules/nodemailer/lib/ses-transport/index.js"(exports, module) {
    "use strict";
    var EventEmitter = __require("events");
    var packageData = require_package();
    var shared = require_shared();
    var LeWindows = require_le_windows();
    var SESTransport = class extends EventEmitter {
      constructor(options) {
        super();
        options = options || {};
        this.options = options || {};
        this.ses = this.options.SES;
        this.name = "SESTransport";
        this.version = packageData.version;
        this.logger = shared.getLogger(this.options, {
          component: this.options.component || "ses-transport"
        });
        this.maxConnections = Number(this.options.maxConnections) || Infinity;
        this.connections = 0;
        this.sendingRate = Number(this.options.sendingRate) || Infinity;
        this.sendingRateTTL = null;
        this.rateInterval = 1e3;
        this.rateMessages = [];
        this.pending = [];
        this.idling = true;
        setImmediate(() => {
          if (this.idling) {
            this.emit("idle");
          }
        });
      }
      /**
       * Schedules a sending of a message
       *
       * @param {Object} emailMessage MailComposer object
       * @param {Function} callback Callback function to run when the sending is completed
       */
      send(mail, callback) {
        if (this.connections >= this.maxConnections) {
          this.idling = false;
          return this.pending.push({
            mail,
            callback
          });
        }
        if (!this._checkSendingRate()) {
          this.idling = false;
          return this.pending.push({
            mail,
            callback
          });
        }
        this._send(mail, (...args) => {
          setImmediate(() => callback(...args));
          this._sent();
        });
      }
      _checkRatedQueue() {
        if (this.connections >= this.maxConnections || !this._checkSendingRate()) {
          return;
        }
        if (!this.pending.length) {
          if (!this.idling) {
            this.idling = true;
            this.emit("idle");
          }
          return;
        }
        let next = this.pending.shift();
        this._send(next.mail, (...args) => {
          setImmediate(() => next.callback(...args));
          this._sent();
        });
      }
      _checkSendingRate() {
        clearTimeout(this.sendingRateTTL);
        let now = Date.now();
        let oldest = false;
        for (let i = this.rateMessages.length - 1; i >= 0; i--) {
          if (this.rateMessages[i].ts >= now - this.rateInterval && (!oldest || this.rateMessages[i].ts < oldest)) {
            oldest = this.rateMessages[i].ts;
          }
          if (this.rateMessages[i].ts < now - this.rateInterval && !this.rateMessages[i].pending) {
            this.rateMessages.splice(i, 1);
          }
        }
        if (this.rateMessages.length < this.sendingRate) {
          return true;
        }
        let delay = Math.max(oldest + 1001, now + 20);
        this.sendingRateTTL = setTimeout(() => this._checkRatedQueue(), now - delay);
        try {
          this.sendingRateTTL.unref();
        } catch (E) {
        }
        return false;
      }
      _sent() {
        this.connections--;
        this._checkRatedQueue();
      }
      /**
       * Returns true if there are free slots in the queue
       */
      isIdle() {
        return this.idling;
      }
      /**
       * Compiles a mailcomposer message and forwards it to SES
       *
       * @param {Object} emailMessage MailComposer object
       * @param {Function} callback Callback function to run when the sending is completed
       */
      _send(mail, callback) {
        let statObject = {
          ts: Date.now(),
          pending: true
        };
        this.connections++;
        this.rateMessages.push(statObject);
        let envelope = mail.data.envelope || mail.message.getEnvelope();
        let messageId = mail.message.messageId();
        let recipients = [].concat(envelope.to || []);
        if (recipients.length > 3) {
          recipients.push("...and " + recipients.splice(2).length + " more");
        }
        this.logger.info(
          {
            tnx: "send",
            messageId
          },
          "Sending message %s to <%s>",
          messageId,
          recipients.join(", ")
        );
        let getRawMessage = (next) => {
          if (!mail.data._dkim) {
            mail.data._dkim = {};
          }
          if (mail.data._dkim.skipFields && typeof mail.data._dkim.skipFields === "string") {
            mail.data._dkim.skipFields += ":date:message-id";
          } else {
            mail.data._dkim.skipFields = "date:message-id";
          }
          let sourceStream = mail.message.createReadStream();
          let stream = sourceStream.pipe(new LeWindows());
          let chunks = [];
          let chunklen = 0;
          stream.on("readable", () => {
            let chunk;
            while ((chunk = stream.read()) !== null) {
              chunks.push(chunk);
              chunklen += chunk.length;
            }
          });
          sourceStream.once("error", (err) => stream.emit("error", err));
          stream.once("error", (err) => {
            next(err);
          });
          stream.once("end", () => next(null, Buffer.concat(chunks, chunklen)));
        };
        setImmediate(
          () => getRawMessage((err, raw2) => {
            if (err) {
              this.logger.error(
                {
                  err,
                  tnx: "send",
                  messageId
                },
                "Failed creating message for %s. %s",
                messageId,
                err.message
              );
              statObject.pending = false;
              return callback(err);
            }
            let sesMessage = {
              RawMessage: {
                // required
                Data: raw2
                // required
              },
              Source: envelope.from,
              Destinations: envelope.to
            };
            Object.keys(mail.data.ses || {}).forEach((key) => {
              sesMessage[key] = mail.data.ses[key];
            });
            let ses = (this.ses.aws ? this.ses.ses : this.ses) || {};
            let aws = this.ses.aws || {};
            let getRegion = (cb) => {
              if (ses.config && typeof ses.config.region === "function") {
                return ses.config.region().then((region) => cb(null, region)).catch((err2) => cb(err2));
              }
              return cb(null, ses.config && ses.config.region || "us-east-1");
            };
            getRegion((err2, region) => {
              if (err2 || !region) {
                region = "us-east-1";
              }
              let sendPromise;
              if (typeof ses.send === "function" && aws.SendRawEmailCommand) {
                sendPromise = ses.send(new aws.SendRawEmailCommand(sesMessage));
              } else {
                sendPromise = ses.sendRawEmail(sesMessage).promise();
              }
              sendPromise.then((data) => {
                if (region === "us-east-1") {
                  region = "email";
                }
                statObject.pending = false;
                callback(null, {
                  envelope: {
                    from: envelope.from,
                    to: envelope.to
                  },
                  messageId: "<" + data.MessageId + (!/@/.test(data.MessageId) ? "@" + region + ".amazonses.com" : "") + ">",
                  response: data.MessageId,
                  raw: raw2
                });
              }).catch((err3) => {
                this.logger.error(
                  {
                    err: err3,
                    tnx: "send"
                  },
                  "Send error for %s: %s",
                  messageId,
                  err3.message
                );
                statObject.pending = false;
                callback(err3);
              });
            });
          })
        );
      }
      /**
       * Verifies SES configuration
       *
       * @param {Function} callback Callback function
       */
      verify(callback) {
        let promise;
        let ses = (this.ses.aws ? this.ses.ses : this.ses) || {};
        let aws = this.ses.aws || {};
        const sesMessage = {
          RawMessage: {
            // required
            Data: "From: invalid@invalid\r\nTo: invalid@invalid\r\n Subject: Invalid\r\n\r\nInvalid"
          },
          Source: "invalid@invalid",
          Destinations: ["invalid@invalid"]
        };
        if (!callback) {
          promise = new Promise((resolve, reject) => {
            callback = shared.callbackPromise(resolve, reject);
          });
        }
        const cb = (err) => {
          if (err && (err.code || err.Code) !== "InvalidParameterValue") {
            return callback(err);
          }
          return callback(null, true);
        };
        if (typeof ses.send === "function" && aws.SendRawEmailCommand) {
          sesMessage.RawMessage.Data = Buffer.from(sesMessage.RawMessage.Data);
          ses.send(new aws.SendRawEmailCommand(sesMessage), cb);
        } else {
          ses.sendRawEmail(sesMessage, cb);
        }
        return promise;
      }
    };
    module.exports = SESTransport;
  }
});

// node_modules/nodemailer/lib/nodemailer.js
var require_nodemailer = __commonJS({
  "node_modules/nodemailer/lib/nodemailer.js"(exports, module) {
    "use strict";
    var Mailer = require_mailer();
    var shared = require_shared();
    var SMTPPool = require_smtp_pool();
    var SMTPTransport = require_smtp_transport();
    var SendmailTransport = require_sendmail_transport();
    var StreamTransport = require_stream_transport();
    var JSONTransport = require_json_transport();
    var SESTransport = require_ses_transport();
    var nmfetch = require_fetch();
    var packageData = require_package();
    var ETHEREAL_API = (process.env.ETHEREAL_API || "https://api.nodemailer.com").replace(/\/+$/, "");
    var ETHEREAL_WEB = (process.env.ETHEREAL_WEB || "https://ethereal.email").replace(/\/+$/, "");
    var ETHEREAL_API_KEY = (process.env.ETHEREAL_API_KEY || "").replace(/\s*/g, "") || null;
    var ETHEREAL_CACHE = ["true", "yes", "y", "1"].includes((process.env.ETHEREAL_CACHE || "yes").toString().trim().toLowerCase());
    var testAccount = false;
    module.exports.createTransport = function(transporter, defaults) {
      let urlConfig;
      let options;
      let mailer;
      if (
        // provided transporter is a configuration object, not transporter plugin
        typeof transporter === "object" && typeof transporter.send !== "function" || // provided transporter looks like a connection url
        typeof transporter === "string" && /^(smtps?|direct):/i.test(transporter)
      ) {
        if (urlConfig = typeof transporter === "string" ? transporter : transporter.url) {
          options = shared.parseConnectionUrl(urlConfig);
        } else {
          options = transporter;
        }
        if (options.pool) {
          transporter = new SMTPPool(options);
        } else if (options.sendmail) {
          transporter = new SendmailTransport(options);
        } else if (options.streamTransport) {
          transporter = new StreamTransport(options);
        } else if (options.jsonTransport) {
          transporter = new JSONTransport(options);
        } else if (options.SES) {
          transporter = new SESTransport(options);
        } else {
          transporter = new SMTPTransport(options);
        }
      }
      mailer = new Mailer(transporter, options, defaults);
      return mailer;
    };
    module.exports.createTestAccount = function(apiUrl, callback) {
      let promise;
      if (!callback && typeof apiUrl === "function") {
        callback = apiUrl;
        apiUrl = false;
      }
      if (!callback) {
        promise = new Promise((resolve, reject) => {
          callback = shared.callbackPromise(resolve, reject);
        });
      }
      if (ETHEREAL_CACHE && testAccount) {
        setImmediate(() => callback(null, testAccount));
        return promise;
      }
      apiUrl = apiUrl || ETHEREAL_API;
      let chunks = [];
      let chunklen = 0;
      let requestHeaders = {};
      let requestBody = {
        requestor: packageData.name,
        version: packageData.version
      };
      if (ETHEREAL_API_KEY) {
        requestHeaders.Authorization = "Bearer " + ETHEREAL_API_KEY;
      }
      let req = nmfetch(apiUrl + "/user", {
        contentType: "application/json",
        method: "POST",
        headers: requestHeaders,
        body: Buffer.from(JSON.stringify(requestBody))
      });
      req.on("readable", () => {
        let chunk;
        while ((chunk = req.read()) !== null) {
          chunks.push(chunk);
          chunklen += chunk.length;
        }
      });
      req.once("error", (err) => callback(err));
      req.once("end", () => {
        let res = Buffer.concat(chunks, chunklen);
        let data;
        let err;
        try {
          data = JSON.parse(res.toString());
        } catch (E) {
          err = E;
        }
        if (err) {
          return callback(err);
        }
        if (data.status !== "success" || data.error) {
          return callback(new Error(data.error || "Request failed"));
        }
        delete data.status;
        testAccount = data;
        callback(null, testAccount);
      });
      return promise;
    };
    module.exports.getTestMessageUrl = function(info) {
      if (!info || !info.response) {
        return false;
      }
      let infoProps = /* @__PURE__ */ new Map();
      info.response.replace(/\[([^\]]+)\]$/, (m, props) => {
        props.replace(/\b([A-Z0-9]+)=([^\s]+)/g, (m2, key, value) => {
          infoProps.set(key, value);
        });
      });
      if (infoProps.has("STATUS") && infoProps.has("MSGID")) {
        return (testAccount.web || ETHEREAL_WEB) + "/message/" + infoProps.get("MSGID");
      }
      return false;
    };
  }
});

// node_modules/hash-wasm/dist/index.umd.js
var require_index_umd = __commonJS({
  "node_modules/hash-wasm/dist/index.umd.js"(exports, module) {
    (function(global2, factory) {
      typeof exports === "object" && typeof module !== "undefined" ? factory(exports) : typeof define === "function" && define.amd ? define(["exports"], factory) : (global2 = typeof globalThis !== "undefined" ? globalThis : global2 || self, factory(global2.hashwasm = {}));
    })(exports, (function(exports2) {
      "use strict";
      var name$l = "adler32";
      var data$l = "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";
      var hash$l = "1d004ff4";
      var wasmJson$l = {
        name: name$l,
        data: data$l,
        hash: hash$l
      };
      function __awaiter(thisArg, _arguments, P, generator) {
        function adopt(value) {
          return value instanceof P ? value : new P(function(resolve) {
            resolve(value);
          });
        }
        return new (P || (P = Promise))(function(resolve, reject) {
          function fulfilled(value) {
            try {
              step(generator.next(value));
            } catch (e) {
              reject(e);
            }
          }
          function rejected(value) {
            try {
              step(generator["throw"](value));
            } catch (e) {
              reject(e);
            }
          }
          function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
          }
          step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
      }
      typeof SuppressedError === "function" ? SuppressedError : function(error, suppressed, message2) {
        var e = new Error(message2);
        return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
      };
      class Mutex {
        constructor() {
          this.mutex = Promise.resolve();
        }
        lock() {
          let begin = () => {
          };
          this.mutex = this.mutex.then(() => new Promise(begin));
          return new Promise((res) => {
            begin = res;
          });
        }
        dispatch(fn) {
          return __awaiter(this, void 0, void 0, function* () {
            const unlock = yield this.lock();
            try {
              return yield Promise.resolve(fn());
            } finally {
              unlock();
            }
          });
        }
      }
      var _a;
      function getGlobal() {
        if (typeof globalThis !== "undefined")
          return globalThis;
        if (typeof self !== "undefined")
          return self;
        if (typeof window !== "undefined")
          return window;
        return global;
      }
      const globalObject = getGlobal();
      const nodeBuffer = (_a = globalObject.Buffer) !== null && _a !== void 0 ? _a : null;
      const textEncoder = globalObject.TextEncoder ? new globalObject.TextEncoder() : null;
      function intArrayToString(arr, len) {
        return String.fromCharCode(...arr.subarray(0, len));
      }
      function hexCharCodesToInt(a, b) {
        return (a & 15) + (a >> 6 | a >> 3 & 8) << 4 | (b & 15) + (b >> 6 | b >> 3 & 8);
      }
      function writeHexToUInt8(buf, str) {
        const size = str.length >> 1;
        for (let i = 0; i < size; i++) {
          const index = i << 1;
          buf[i] = hexCharCodesToInt(str.charCodeAt(index), str.charCodeAt(index + 1));
        }
      }
      function hexStringEqualsUInt8(str, buf) {
        if (str.length !== buf.length * 2) {
          return false;
        }
        for (let i = 0; i < buf.length; i++) {
          const strIndex = i << 1;
          if (buf[i] !== hexCharCodesToInt(str.charCodeAt(strIndex), str.charCodeAt(strIndex + 1))) {
            return false;
          }
        }
        return true;
      }
      const alpha = "a".charCodeAt(0) - 10;
      const digit = "0".charCodeAt(0);
      function getDigestHex(tmpBuffer, input, hashLength) {
        let p = 0;
        for (let i = 0; i < hashLength; i++) {
          let nibble = input[i] >>> 4;
          tmpBuffer[p++] = nibble > 9 ? nibble + alpha : nibble + digit;
          nibble = input[i] & 15;
          tmpBuffer[p++] = nibble > 9 ? nibble + alpha : nibble + digit;
        }
        return String.fromCharCode.apply(null, tmpBuffer);
      }
      const getUInt8Buffer = nodeBuffer !== null ? (data2) => {
        if (typeof data2 === "string") {
          const buf = nodeBuffer.from(data2, "utf8");
          return new Uint8Array(buf.buffer, buf.byteOffset, buf.length);
        }
        if (nodeBuffer.isBuffer(data2)) {
          return new Uint8Array(data2.buffer, data2.byteOffset, data2.length);
        }
        if (ArrayBuffer.isView(data2)) {
          return new Uint8Array(data2.buffer, data2.byteOffset, data2.byteLength);
        }
        throw new Error("Invalid data type!");
      } : (data2) => {
        if (typeof data2 === "string") {
          return textEncoder.encode(data2);
        }
        if (ArrayBuffer.isView(data2)) {
          return new Uint8Array(data2.buffer, data2.byteOffset, data2.byteLength);
        }
        throw new Error("Invalid data type!");
      };
      const base64Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
      const base64Lookup = new Uint8Array(256);
      for (let i = 0; i < base64Chars.length; i++) {
        base64Lookup[base64Chars.charCodeAt(i)] = i;
      }
      function encodeBase64(data2, pad = true) {
        const len = data2.length;
        const extraBytes = len % 3;
        const parts = [];
        const len2 = len - extraBytes;
        for (let i = 0; i < len2; i += 3) {
          const tmp = (data2[i] << 16 & 16711680) + (data2[i + 1] << 8 & 65280) + (data2[i + 2] & 255);
          const triplet = base64Chars.charAt(tmp >> 18 & 63) + base64Chars.charAt(tmp >> 12 & 63) + base64Chars.charAt(tmp >> 6 & 63) + base64Chars.charAt(tmp & 63);
          parts.push(triplet);
        }
        if (extraBytes === 1) {
          const tmp = data2[len - 1];
          const a = base64Chars.charAt(tmp >> 2);
          const b = base64Chars.charAt(tmp << 4 & 63);
          parts.push(`${a}${b}`);
          if (pad) {
            parts.push("==");
          }
        } else if (extraBytes === 2) {
          const tmp = (data2[len - 2] << 8) + data2[len - 1];
          const a = base64Chars.charAt(tmp >> 10);
          const b = base64Chars.charAt(tmp >> 4 & 63);
          const c = base64Chars.charAt(tmp << 2 & 63);
          parts.push(`${a}${b}${c}`);
          if (pad) {
            parts.push("=");
          }
        }
        return parts.join("");
      }
      function getDecodeBase64Length(data2) {
        let bufferLength = Math.floor(data2.length * 0.75);
        const len = data2.length;
        if (data2[len - 1] === "=") {
          bufferLength -= 1;
          if (data2[len - 2] === "=") {
            bufferLength -= 1;
          }
        }
        return bufferLength;
      }
      function decodeBase64(data2) {
        const bufferLength = getDecodeBase64Length(data2);
        const len = data2.length;
        const bytes = new Uint8Array(bufferLength);
        let p = 0;
        for (let i = 0; i < len; i += 4) {
          const encoded1 = base64Lookup[data2.charCodeAt(i)];
          const encoded2 = base64Lookup[data2.charCodeAt(i + 1)];
          const encoded3 = base64Lookup[data2.charCodeAt(i + 2)];
          const encoded4 = base64Lookup[data2.charCodeAt(i + 3)];
          bytes[p] = encoded1 << 2 | encoded2 >> 4;
          p += 1;
          bytes[p] = (encoded2 & 15) << 4 | encoded3 >> 2;
          p += 1;
          bytes[p] = (encoded3 & 3) << 6 | encoded4 & 63;
          p += 1;
        }
        return bytes;
      }
      const MAX_HEAP = 16 * 1024;
      const WASM_FUNC_HASH_LENGTH = 4;
      const wasmMutex = new Mutex();
      const wasmModuleCache = /* @__PURE__ */ new Map();
      function WASMInterface(binary, hashLength) {
        return __awaiter(this, void 0, void 0, function* () {
          let wasmInstance = null;
          let memoryView = null;
          let initialized = false;
          if (typeof WebAssembly === "undefined") {
            throw new Error("WebAssembly is not supported in this environment!");
          }
          const writeMemory = (data2, offset = 0) => {
            memoryView.set(data2, offset);
          };
          const getMemory = () => memoryView;
          const getExports = () => wasmInstance.exports;
          const setMemorySize = (totalSize) => {
            wasmInstance.exports.Hash_SetMemorySize(totalSize);
            const arrayOffset = wasmInstance.exports.Hash_GetBuffer();
            const memoryBuffer = wasmInstance.exports.memory.buffer;
            memoryView = new Uint8Array(memoryBuffer, arrayOffset, totalSize);
          };
          const getStateSize = () => {
            const view = new DataView(wasmInstance.exports.memory.buffer);
            const stateSize = view.getUint32(wasmInstance.exports.STATE_SIZE, true);
            return stateSize;
          };
          const loadWASMPromise = wasmMutex.dispatch(() => __awaiter(this, void 0, void 0, function* () {
            if (!wasmModuleCache.has(binary.name)) {
              const asm = decodeBase64(binary.data);
              const promise = WebAssembly.compile(asm.buffer);
              wasmModuleCache.set(binary.name, promise);
            }
            const module2 = yield wasmModuleCache.get(binary.name);
            wasmInstance = yield WebAssembly.instantiate(module2, {
              // env: {
              //   emscripten_memcpy_big: (dest, src, num) => {
              //     const memoryBuffer = wasmInstance.exports.memory.buffer;
              //     const memView = new Uint8Array(memoryBuffer, 0);
              //     memView.set(memView.subarray(src, src + num), dest);
              //   },
              //   print_memory: (offset, len) => {
              //     const memoryBuffer = wasmInstance.exports.memory.buffer;
              //     const memView = new Uint8Array(memoryBuffer, 0);
              //     console.log('print_int32', memView.subarray(offset, offset + len));
              //   },
              // },
            });
          }));
          const setupInterface = () => __awaiter(this, void 0, void 0, function* () {
            if (!wasmInstance) {
              yield loadWASMPromise;
            }
            const arrayOffset = wasmInstance.exports.Hash_GetBuffer();
            const memoryBuffer = wasmInstance.exports.memory.buffer;
            memoryView = new Uint8Array(memoryBuffer, arrayOffset, MAX_HEAP);
          });
          const init = (bits = null) => {
            initialized = true;
            wasmInstance.exports.Hash_Init(bits);
          };
          const updateUInt8Array = (data2) => {
            let read = 0;
            while (read < data2.length) {
              const chunk = data2.subarray(read, read + MAX_HEAP);
              read += chunk.length;
              memoryView.set(chunk);
              wasmInstance.exports.Hash_Update(chunk.length);
            }
          };
          const update = (data2) => {
            if (!initialized) {
              throw new Error("update() called before init()");
            }
            const Uint8Buffer = getUInt8Buffer(data2);
            updateUInt8Array(Uint8Buffer);
          };
          const digestChars = new Uint8Array(hashLength * 2);
          const digest = (outputType, padding = null) => {
            if (!initialized) {
              throw new Error("digest() called before init()");
            }
            initialized = false;
            wasmInstance.exports.Hash_Final(padding);
            if (outputType === "binary") {
              return memoryView.slice(0, hashLength);
            }
            return getDigestHex(digestChars, memoryView, hashLength);
          };
          const save = () => {
            if (!initialized) {
              throw new Error("save() can only be called after init() and before digest()");
            }
            const stateOffset = wasmInstance.exports.Hash_GetState();
            const stateLength = getStateSize();
            const memoryBuffer = wasmInstance.exports.memory.buffer;
            const internalState = new Uint8Array(memoryBuffer, stateOffset, stateLength);
            const prefixedState = new Uint8Array(WASM_FUNC_HASH_LENGTH + stateLength);
            writeHexToUInt8(prefixedState, binary.hash);
            prefixedState.set(internalState, WASM_FUNC_HASH_LENGTH);
            return prefixedState;
          };
          const load = (state) => {
            if (!(state instanceof Uint8Array)) {
              throw new Error("load() expects an Uint8Array generated by save()");
            }
            const stateOffset = wasmInstance.exports.Hash_GetState();
            const stateLength = getStateSize();
            const overallLength = WASM_FUNC_HASH_LENGTH + stateLength;
            const memoryBuffer = wasmInstance.exports.memory.buffer;
            if (state.length !== overallLength) {
              throw new Error(`Bad state length (expected ${overallLength} bytes, got ${state.length})`);
            }
            if (!hexStringEqualsUInt8(binary.hash, state.subarray(0, WASM_FUNC_HASH_LENGTH))) {
              throw new Error("This state was written by an incompatible hash implementation");
            }
            const internalState = state.subarray(WASM_FUNC_HASH_LENGTH);
            new Uint8Array(memoryBuffer, stateOffset, stateLength).set(internalState);
            initialized = true;
          };
          const isDataShort = (data2) => {
            if (typeof data2 === "string") {
              return data2.length < MAX_HEAP / 4;
            }
            return data2.byteLength < MAX_HEAP;
          };
          let canSimplify = isDataShort;
          switch (binary.name) {
            case "argon2":
            case "scrypt":
              canSimplify = () => true;
              break;
            case "blake2b":
            case "blake2s":
              canSimplify = (data2, initParam) => initParam <= 512 && isDataShort(data2);
              break;
            case "blake3":
              canSimplify = (data2, initParam) => initParam === 0 && isDataShort(data2);
              break;
            case "xxhash64":
            // cannot simplify
            case "xxhash3":
            case "xxhash128":
            case "crc64":
              canSimplify = () => false;
              break;
          }
          const calculate = (data2, initParam = null, digestParam = null) => {
            if (!canSimplify(data2, initParam)) {
              init(initParam);
              update(data2);
              return digest("hex", digestParam);
            }
            const buffer = getUInt8Buffer(data2);
            memoryView.set(buffer);
            wasmInstance.exports.Hash_Calculate(buffer.length, initParam, digestParam);
            return getDigestHex(digestChars, memoryView, hashLength);
          };
          yield setupInterface();
          return {
            getMemory,
            writeMemory,
            getExports,
            setMemorySize,
            init,
            update,
            digest,
            save,
            load,
            calculate,
            hashLength
          };
        });
      }
      function lockedCreate(mutex2, binary, hashLength) {
        return __awaiter(this, void 0, void 0, function* () {
          const unlock = yield mutex2.lock();
          const wasm = yield WASMInterface(binary, hashLength);
          unlock();
          return wasm;
        });
      }
      const mutex$l = new Mutex();
      let wasmCache$l = null;
      function adler32(data2) {
        if (wasmCache$l === null) {
          return lockedCreate(mutex$l, wasmJson$l, 4).then((wasm) => {
            wasmCache$l = wasm;
            return wasmCache$l.calculate(data2);
          });
        }
        try {
          const hash2 = wasmCache$l.calculate(data2);
          return Promise.resolve(hash2);
        } catch (err) {
          return Promise.reject(err);
        }
      }
      function createAdler32() {
        return WASMInterface(wasmJson$l, 4).then((wasm) => {
          wasm.init();
          const obj = {
            init: () => {
              wasm.init();
              return obj;
            },
            update: (data2) => {
              wasm.update(data2);
              return obj;
            },
            // biome-ignore lint/suspicious/noExplicitAny: Conflict with IHasher type
            digest: (outputType) => wasm.digest(outputType),
            save: () => wasm.save(),
            load: (data2) => {
              wasm.load(data2);
              return obj;
            },
            blockSize: 4,
            digestSize: 4
          };
          return obj;
        });
      }
      var name$k = "argon2";
      var data$k = "AGFzbQEAAAABKQVgAX8Bf2AAAX9gEH9/f39/f39/f39/f39/f38AYAR/f39/AGACf38AAwYFAAECAwQFBgEBAoCAAgYIAX8BQYCABAsHUwUGbWVtb3J5AgAPX19zdGFja19wb2ludGVyAwASSGFzaF9TZXRNZW1vcnlTaXplAAAOSGFzaF9HZXRCdWZmZXIAAQ5IYXNoX0NhbGN1bGF0ZQAECsc2BV0DAX8BfgF/QQAhAQJAIABBACkDiIAEIgKnIgNGDQBBACEBAkAgACADayIAQRB2IABB//8DcUEAR2oiAEAAQX9HDQBB/wHADwtBACACIABBEHStfDcDiIAECyABwAt0AwJ/AX4BfwJAQQAoAoCABCIADQBBAD8AQRB0IgE2AoCABAJAQQApA4iABCICpyIDQYCAIEYNAEEAIQBBgIAgIANrIgNBEHYgA0H//wNxQQBHaiIDQABBf0YNAUEAIAIgA0EQdK18NwOIgAQLIAEhAAsgAAvcDgECfiAAIAQpAwAiECAAKQMAIhF8IBFCAYZC/v///x+DIBBC/////w+DfnwiEDcDACAMIBAgDCkDAIVCIIkiEDcDACAIIBAgCCkDACIRfCARQgGGQv7///8fgyAQQv////8Pg358IhA3AwAgBCAQIAQpAwCFQiiJIhA3AwAgACAQIAApAwAiEXwgEEL/////D4MgEUIBhkL+////H4N+fCIQNwMAIAwgECAMKQMAhUIwiSIQNwMAIAggECAIKQMAIhF8IBBC/////w+DIBFCAYZC/v///x+DfnwiEDcDACAEIBAgBCkDAIVCAYk3AwAgASAFKQMAIhAgASkDACIRfCARQgGGQv7///8fgyAQQv////8Pg358IhA3AwAgDSAQIA0pAwCFQiCJIhA3AwAgCSAQIAkpAwAiEXwgEUIBhkL+////H4MgEEL/////D4N+fCIQNwMAIAUgECAFKQMAhUIoiSIQNwMAIAEgECABKQMAIhF8IBBC/////w+DIBFCAYZC/v///x+DfnwiEDcDACANIBAgDSkDAIVCMIkiEDcDACAJIBAgCSkDACIRfCAQQv////8PgyARQgGGQv7///8fg358IhA3AwAgBSAQIAUpAwCFQgGJNwMAIAIgBikDACIQIAIpAwAiEXwgEUIBhkL+////H4MgEEL/////D4N+fCIQNwMAIA4gECAOKQMAhUIgiSIQNwMAIAogECAKKQMAIhF8IBFCAYZC/v///x+DIBBC/////w+DfnwiEDcDACAGIBAgBikDAIVCKIkiEDcDACACIBAgAikDACIRfCAQQv////8PgyARQgGGQv7///8fg358IhA3AwAgDiAQIA4pAwCFQjCJIhA3AwAgCiAQIAopAwAiEXwgEEL/////D4MgEUIBhkL+////H4N+fCIQNwMAIAYgECAGKQMAhUIBiTcDACADIAcpAwAiECADKQMAIhF8IBFCAYZC/v///x+DIBBC/////w+DfnwiEDcDACAPIBAgDykDAIVCIIkiEDcDACALIBAgCykDACIRfCARQgGGQv7///8fgyAQQv////8Pg358IhA3AwAgByAQIAcpAwCFQiiJIhA3AwAgAyAQIAMpAwAiEXwgEEL/////D4MgEUIBhkL+////H4N+fCIQNwMAIA8gECAPKQMAhUIwiSIQNwMAIAsgECALKQMAIhF8IBBC/////w+DIBFCAYZC/v///x+DfnwiEDcDACAHIBAgBykDAIVCAYk3AwAgACAFKQMAIhAgACkDACIRfCARQgGGQv7///8fgyAQQv////8Pg358IhA3AwAgDyAQIA8pAwCFQiCJIhA3AwAgCiAQIAopAwAiEXwgEUIBhkL+////H4MgEEL/////D4N+fCIQNwMAIAUgECAFKQMAhUIoiSIQNwMAIAAgECAAKQMAIhF8IBBC/////w+DIBFCAYZC/v///x+DfnwiEDcDACAPIBAgDykDAIVCMIkiEDcDACAKIBAgCikDACIRfCAQQv////8PgyARQgGGQv7///8fg358IhA3AwAgBSAQIAUpAwCFQgGJNwMAIAEgBikDACIQIAEpAwAiEXwgEUIBhkL+////H4MgEEL/////D4N+fCIQNwMAIAwgECAMKQMAhUIgiSIQNwMAIAsgECALKQMAIhF8IBFCAYZC/v///x+DIBBC/////w+DfnwiEDcDACAGIBAgBikDAIVCKIkiEDcDACABIBAgASkDACIRfCAQQv////8PgyARQgGGQv7///8fg358IhA3AwAgDCAQIAwpAwCFQjCJIhA3AwAgCyAQIAspAwAiEXwgEEL/////D4MgEUIBhkL+////H4N+fCIQNwMAIAYgECAGKQMAhUIBiTcDACACIAcpAwAiECACKQMAIhF8IBFCAYZC/v///x+DIBBC/////w+DfnwiEDcDACANIBAgDSkDAIVCIIkiEDcDACAIIBAgCCkDACIRfCARQgGGQv7///8fgyAQQv////8Pg358IhA3AwAgByAQIAcpAwCFQiiJIhA3AwAgAiAQIAIpAwAiEXwgEEL/////D4MgEUIBhkL+////H4N+fCIQNwMAIA0gECANKQMAhUIwiSIQNwMAIAggECAIKQMAIhF8IBBC/////w+DIBFCAYZC/v///x+DfnwiEDcDACAHIBAgBykDAIVCAYk3AwAgAyAEKQMAIhAgAykDACIRfCARQgGGQv7///8fgyAQQv////8Pg358IhA3AwAgDiAQIA4pAwCFQiCJIhA3AwAgCSAQIAkpAwAiEXwgEUIBhkL+////H4MgEEL/////D4N+fCIQNwMAIAQgECAEKQMAhUIoiSIQNwMAIAMgECADKQMAIhF8IBBC/////w+DIBFCAYZC/v///x+DfnwiEDcDACAOIBAgDikDAIVCMIkiEDcDACAJIBAgCSkDACIRfCAQQv////8PgyARQgGGQv7///8fg358IhA3AwAgBCAQIAQpAwCFQgGJNwMAC+MdAQN/QQAhBEEAIAIpAwAgASkDAIU3A5CABEEAIAIpAwggASkDCIU3A5iABEEAIAIpAxAgASkDEIU3A6CABEEAIAIpAxggASkDGIU3A6iABEEAIAIpAyAgASkDIIU3A7CABEEAIAIpAyggASkDKIU3A7iABEEAIAIpAzAgASkDMIU3A8CABEEAIAIpAzggASkDOIU3A8iABEEAIAIpA0AgASkDQIU3A9CABEEAIAIpA0ggASkDSIU3A9iABEEAIAIpA1AgASkDUIU3A+CABEEAIAIpA1ggASkDWIU3A+iABEEAIAIpA2AgASkDYIU3A/CABEEAIAIpA2ggASkDaIU3A/iABEEAIAIpA3AgASkDcIU3A4CBBEEAIAIpA3ggASkDeIU3A4iBBEEAIAIpA4ABIAEpA4ABhTcDkIEEQQAgAikDiAEgASkDiAGFNwOYgQRBACACKQOQASABKQOQAYU3A6CBBEEAIAIpA5gBIAEpA5gBhTcDqIEEQQAgAikDoAEgASkDoAGFNwOwgQRBACACKQOoASABKQOoAYU3A7iBBEEAIAIpA7ABIAEpA7ABhTcDwIEE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";
      var hash$k = "2b50b0d6";
      var wasmJson$k = {
        name: name$k,
        data: data$k,
        hash: hash$k
      };
      var name$j = "blake2b";
      var data$j = "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";
      var hash$j = "22cf500a";
      var wasmJson$j = {
        name: name$j,
        data: data$j,
        hash: hash$j
      };
      const mutex$k = new Mutex();
      let wasmCache$k = null;
      function validateBits$4(bits) {
        if (!Number.isInteger(bits) || bits < 8 || bits > 512 || bits % 8 !== 0) {
          return new Error("Invalid variant! Valid values: 8, 16, ..., 512");
        }
        return null;
      }
      function getInitParam$1(outputBits, keyBits) {
        return outputBits | keyBits << 16;
      }
      function blake2b(data2, bits = 512, key = null) {
        if (validateBits$4(bits)) {
          return Promise.reject(validateBits$4(bits));
        }
        let keyBuffer = null;
        let initParam = bits;
        if (key !== null) {
          keyBuffer = getUInt8Buffer(key);
          if (keyBuffer.length > 64) {
            return Promise.reject(new Error("Max key length is 64 bytes"));
          }
          initParam = getInitParam$1(bits, keyBuffer.length);
        }
        const hashLength = bits / 8;
        if (wasmCache$k === null || wasmCache$k.hashLength !== hashLength) {
          return lockedCreate(mutex$k, wasmJson$j, hashLength).then((wasm) => {
            wasmCache$k = wasm;
            if (initParam > 512) {
              wasmCache$k.writeMemory(keyBuffer);
            }
            return wasmCache$k.calculate(data2, initParam);
          });
        }
        try {
          if (initParam > 512) {
            wasmCache$k.writeMemory(keyBuffer);
          }
          const hash2 = wasmCache$k.calculate(data2, initParam);
          return Promise.resolve(hash2);
        } catch (err) {
          return Promise.reject(err);
        }
      }
      function createBLAKE2b(bits = 512, key = null) {
        if (validateBits$4(bits)) {
          return Promise.reject(validateBits$4(bits));
        }
        let keyBuffer = null;
        let initParam = bits;
        if (key !== null) {
          keyBuffer = getUInt8Buffer(key);
          if (keyBuffer.length > 64) {
            return Promise.reject(new Error("Max key length is 64 bytes"));
          }
          initParam = getInitParam$1(bits, keyBuffer.length);
        }
        const outputSize = bits / 8;
        return WASMInterface(wasmJson$j, outputSize).then((wasm) => {
          if (initParam > 512) {
            wasm.writeMemory(keyBuffer);
          }
          wasm.init(initParam);
          const obj = {
            init: initParam > 512 ? () => {
              wasm.writeMemory(keyBuffer);
              wasm.init(initParam);
              return obj;
            } : () => {
              wasm.init(initParam);
              return obj;
            },
            update: (data2) => {
              wasm.update(data2);
              return obj;
            },
            // biome-ignore lint/suspicious/noExplicitAny: Conflict with IHasher type
            digest: (outputType) => wasm.digest(outputType),
            save: () => wasm.save(),
            load: (data2) => {
              wasm.load(data2);
              return obj;
            },
            blockSize: 128,
            digestSize: outputSize
          };
          return obj;
        });
      }
      function encodeResult(salt, options, res) {
        const parameters = [
          `m=${options.memorySize}`,
          `t=${options.iterations}`,
          `p=${options.parallelism}`
        ].join(",");
        return `$argon2${options.hashType}$v=19$${parameters}$${encodeBase64(salt, false)}$${encodeBase64(res, false)}`;
      }
      const uint32View = new DataView(new ArrayBuffer(4));
      function int32LE(x) {
        uint32View.setInt32(0, x, true);
        return new Uint8Array(uint32View.buffer);
      }
      function hashFunc(blake512, buf, len) {
        return __awaiter(this, void 0, void 0, function* () {
          if (len <= 64) {
            const blake = yield createBLAKE2b(len * 8);
            blake.update(int32LE(len));
            blake.update(buf);
            return blake.digest("binary");
          }
          const r = Math.ceil(len / 32) - 2;
          const ret = new Uint8Array(len);
          blake512.init();
          blake512.update(int32LE(len));
          blake512.update(buf);
          let vp = blake512.digest("binary");
          ret.set(vp.subarray(0, 32), 0);
          for (let i = 1; i < r; i++) {
            blake512.init();
            blake512.update(vp);
            vp = blake512.digest("binary");
            ret.set(vp.subarray(0, 32), i * 32);
          }
          const partialBytesNeeded = len - 32 * r;
          let blakeSmall;
          if (partialBytesNeeded === 64) {
            blakeSmall = blake512;
            blakeSmall.init();
          } else {
            blakeSmall = yield createBLAKE2b(partialBytesNeeded * 8);
          }
          blakeSmall.update(vp);
          vp = blakeSmall.digest("binary");
          ret.set(vp.subarray(0, partialBytesNeeded), r * 32);
          return ret;
        });
      }
      function getHashType(type) {
        switch (type) {
          case "d":
            return 0;
          case "i":
            return 1;
          default:
            return 2;
        }
      }
      function argon2Internal(options) {
        return __awaiter(this, void 0, void 0, function* () {
          var _a2;
          const { parallelism, iterations, hashLength } = options;
          const password = getUInt8Buffer(options.password);
          const salt = getUInt8Buffer(options.salt);
          const version = 19;
          const hashType = getHashType(options.hashType);
          const { memorySize } = options;
          const secret2 = getUInt8Buffer((_a2 = options.secret) !== null && _a2 !== void 0 ? _a2 : "");
          const [argon2Interface, blake512] = yield Promise.all([
            WASMInterface(wasmJson$k, 1024),
            createBLAKE2b(512)
          ]);
          argon2Interface.setMemorySize(memorySize * 1024 + 1024);
          const initVector = new Uint8Array(24);
          const initVectorView = new DataView(initVector.buffer);
          initVectorView.setInt32(0, parallelism, true);
          initVectorView.setInt32(4, hashLength, true);
          initVectorView.setInt32(8, memorySize, true);
          initVectorView.setInt32(12, iterations, true);
          initVectorView.setInt32(16, version, true);
          initVectorView.setInt32(20, hashType, true);
          argon2Interface.writeMemory(initVector, memorySize * 1024);
          blake512.init();
          blake512.update(initVector);
          blake512.update(int32LE(password.length));
          blake512.update(password);
          blake512.update(int32LE(salt.length));
          blake512.update(salt);
          blake512.update(int32LE(secret2.length));
          blake512.update(secret2);
          blake512.update(int32LE(0));
          const segments = Math.floor(memorySize / (parallelism * 4));
          const lanes = segments * 4;
          const param = new Uint8Array(72);
          const H0 = blake512.digest("binary");
          param.set(H0);
          for (let lane = 0; lane < parallelism; lane++) {
            param.set(int32LE(0), 64);
            param.set(int32LE(lane), 68);
            let position = lane * lanes;
            let chunk = yield hashFunc(blake512, param, 1024);
            argon2Interface.writeMemory(chunk, position * 1024);
            position += 1;
            param.set(int32LE(1), 64);
            chunk = yield hashFunc(blake512, param, 1024);
            argon2Interface.writeMemory(chunk, position * 1024);
          }
          const C = new Uint8Array(1024);
          writeHexToUInt8(C, argon2Interface.calculate(new Uint8Array([]), memorySize));
          const res = yield hashFunc(blake512, C, hashLength);
          if (options.outputType === "hex") {
            const digestChars = new Uint8Array(hashLength * 2);
            return getDigestHex(digestChars, res, hashLength);
          }
          if (options.outputType === "encoded") {
            return encodeResult(salt, options, res);
          }
          return res;
        });
      }
      const validateOptions$3 = (options) => {
        var _a2;
        if (!options || typeof options !== "object") {
          throw new Error("Invalid options parameter. It requires an object.");
        }
        if (!options.password) {
          throw new Error("Password must be specified");
        }
        options.password = getUInt8Buffer(options.password);
        if (options.password.length < 1) {
          throw new Error("Password must be specified");
        }
        if (!options.salt) {
          throw new Error("Salt must be specified");
        }
        options.salt = getUInt8Buffer(options.salt);
        if (options.salt.length < 8) {
          throw new Error("Salt should be at least 8 bytes long");
        }
        options.secret = getUInt8Buffer((_a2 = options.secret) !== null && _a2 !== void 0 ? _a2 : "");
        if (!Number.isInteger(options.iterations) || options.iterations < 1) {
          throw new Error("Iterations should be a positive number");
        }
        if (!Number.isInteger(options.parallelism) || options.parallelism < 1) {
          throw new Error("Parallelism should be a positive number");
        }
        if (!Number.isInteger(options.hashLength) || options.hashLength < 4) {
          throw new Error("Hash length should be at least 4 bytes.");
        }
        if (!Number.isInteger(options.memorySize)) {
          throw new Error("Memory size should be specified.");
        }
        if (options.memorySize < 8 * options.parallelism) {
          throw new Error("Memory size should be at least 8 * parallelism.");
        }
        if (options.outputType === void 0) {
          options.outputType = "hex";
        }
        if (!["hex", "binary", "encoded"].includes(options.outputType)) {
          throw new Error(`Insupported output type ${options.outputType}. Valid values: ['hex', 'binary', 'encoded']`);
        }
      };
      function argon2i(options) {
        return __awaiter(this, void 0, void 0, function* () {
          validateOptions$3(options);
          return argon2Internal(Object.assign(Object.assign({}, options), { hashType: "i" }));
        });
      }
      function argon2id2(options) {
        return __awaiter(this, void 0, void 0, function* () {
          validateOptions$3(options);
          return argon2Internal(Object.assign(Object.assign({}, options), { hashType: "id" }));
        });
      }
      function argon2d(options) {
        return __awaiter(this, void 0, void 0, function* () {
          validateOptions$3(options);
          return argon2Internal(Object.assign(Object.assign({}, options), { hashType: "d" }));
        });
      }
      const getHashParameters = (password, encoded, secret2) => {
        const regex = /^\$argon2(id|i|d)\$v=([0-9]+)\$((?:[mtp]=[0-9]+,){2}[mtp]=[0-9]+)\$([A-Za-z0-9+/]+)\$([A-Za-z0-9+/]+)$/;
        const match2 = encoded.match(regex);
        if (!match2) {
          throw new Error("Invalid hash");
        }
        const [, hashType, version, parameters, salt, hash2] = match2;
        if (version !== "19") {
          throw new Error(`Unsupported version: ${version}`);
        }
        const parsedParameters = {};
        const paramMap = { m: "memorySize", p: "parallelism", t: "iterations" };
        for (const x of parameters.split(",")) {
          const [n, v] = x.split("=");
          parsedParameters[paramMap[n]] = Number(v);
        }
        return Object.assign(Object.assign({}, parsedParameters), {
          password,
          secret: secret2,
          hashType,
          salt: decodeBase64(salt),
          hashLength: getDecodeBase64Length(hash2),
          outputType: "encoded"
        });
      };
      const validateVerifyOptions$1 = (options) => {
        if (!options || typeof options !== "object") {
          throw new Error("Invalid options parameter. It requires an object.");
        }
        if (options.hash === void 0 || typeof options.hash !== "string") {
          throw new Error("Hash should be specified");
        }
      };
      function argon2Verify(options) {
        return __awaiter(this, void 0, void 0, function* () {
          validateVerifyOptions$1(options);
          const params = getHashParameters(options.password, options.hash, options.secret);
          validateOptions$3(params);
          const hashStart = options.hash.lastIndexOf("$") + 1;
          const result = yield argon2Internal(params);
          return result.substring(hashStart) === options.hash.substring(hashStart);
        });
      }
      var name$i = "blake2s";
      var data$i = "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";
      var hash$i = "874cf174";
      var wasmJson$i = {
        name: name$i,
        data: data$i,
        hash: hash$i
      };
      const mutex$j = new Mutex();
      let wasmCache$j = null;
      function validateBits$3(bits) {
        if (!Number.isInteger(bits) || bits < 8 || bits > 256 || bits % 8 !== 0) {
          return new Error("Invalid variant! Valid values: 8, 16, ..., 256");
        }
        return null;
      }
      function getInitParam(outputBits, keyBits) {
        return outputBits | keyBits << 16;
      }
      function blake2s(data2, bits = 256, key = null) {
        if (validateBits$3(bits)) {
          return Promise.reject(validateBits$3(bits));
        }
        let keyBuffer = null;
        let initParam = bits;
        if (key !== null) {
          keyBuffer = getUInt8Buffer(key);
          if (keyBuffer.length > 32) {
            return Promise.reject(new Error("Max key length is 32 bytes"));
          }
          initParam = getInitParam(bits, keyBuffer.length);
        }
        const hashLength = bits / 8;
        if (wasmCache$j === null || wasmCache$j.hashLength !== hashLength) {
          return lockedCreate(mutex$j, wasmJson$i, hashLength).then((wasm) => {
            wasmCache$j = wasm;
            if (initParam > 512) {
              wasmCache$j.writeMemory(keyBuffer);
            }
            return wasmCache$j.calculate(data2, initParam);
          });
        }
        try {
          if (initParam > 512) {
            wasmCache$j.writeMemory(keyBuffer);
          }
          const hash2 = wasmCache$j.calculate(data2, initParam);
          return Promise.resolve(hash2);
        } catch (err) {
          return Promise.reject(err);
        }
      }
      function createBLAKE2s(bits = 256, key = null) {
        if (validateBits$3(bits)) {
          return Promise.reject(validateBits$3(bits));
        }
        let keyBuffer = null;
        let initParam = bits;
        if (key !== null) {
          keyBuffer = getUInt8Buffer(key);
          if (keyBuffer.length > 32) {
            return Promise.reject(new Error("Max key length is 32 bytes"));
          }
          initParam = getInitParam(bits, keyBuffer.length);
        }
        const outputSize = bits / 8;
        return WASMInterface(wasmJson$i, outputSize).then((wasm) => {
          if (initParam > 512) {
            wasm.writeMemory(keyBuffer);
          }
          wasm.init(initParam);
          const obj = {
            init: initParam > 512 ? () => {
              wasm.writeMemory(keyBuffer);
              wasm.init(initParam);
              return obj;
            } : () => {
              wasm.init(initParam);
              return obj;
            },
            update: (data2) => {
              wasm.update(data2);
              return obj;
            },
            // biome-ignore lint/suspicious/noExplicitAny: Conflict with IHasher type
            digest: (outputType) => wasm.digest(outputType),
            save: () => wasm.save(),
            load: (data2) => {
              wasm.load(data2);
              return obj;
            },
            blockSize: 64,
            digestSize: outputSize
          };
          return obj;
        });
      }
      var name$h = "blake3";
      var data$h = "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IgJBBXQiBykDyYIFNwNgIAEgBykDwYIFNwNYIAEgBykDuYIFNwNQIAEgBykDsYIFNwNIIAEgBykDqYIFNwNAIAEgBykDoYIFNwM4IAEgBykDmYIFNwMwIAEgBykDkYIFNwMoIBAhBiAPIQUgDiEEIA0hAyASIQkgAkUNAQsgAkF/aiIHQQV0IhEpA5GCBSETIBEpA5mCBSEUIBEpA6GCBSEVIBEpA6mCBSEWIAEgAzcDiAEgASAENwOAASABIAU3A3ggASAGNwNwIAFBsAFqIAFB8ABqIAFBKGoiESALQf8BcSAIIAlB/wFxEAIgASASOgBpIAFBwAA6AGggASAWNwNAIAEgFTcDOCABIBQ3AzAgASATNwMoIAFCADcDICABIA03AxggASAONwMQIAEgDzcDCCABIBA3AwAgASABKQPoASABKQPIAYU3A2AgASABKQPgASABKQPAAYU3A1ggASABKQPYASABKQO4AYU3A1AgASABKQPQASABKQOwAYU3A0ggB0UNACACQQV0QemBBWohAiASQf8BcSELA0AgAkFoaikDACEIIAJBcGopAwAhAyACQXhqKQMAIQQgAikDACEFIAEgDTcDiAEgASAONwOAASABIA83A3ggASAQNwNwIAFBsAFqIAFB8ABqIBFBwABCACALEAIgASASOgBpIAFBwAA6AGggASAFNwNAIAEgBDcDOCABIAM3AzAgASAINwMoIAFCADcDICABIA03AxggASAONwMQIAEgDzcDCCABIBA3AwAgASABKQPoASABKQPIAYU3A2AgASABKQPgASABKQPAAYU3A1ggASABKQPYASABKQO4AYU3A1AgASABKQPQASABKQOwAYU3A0ggAkFgaiECIAdBf2oiBw0ACwsgAUEoaiEJQgAhCEGAgQQhCyASQQhyQf8BcSEKA0AgAUGwAWogASAJQcAAIAggChACIAEgASkD0AEiAyABKQOwAYU3A3AgASABKQPYASIEIAEpA7gBhTcDeCABIAEpA+ABIgUgASkDwAGFNwOAASABIAEpA+gBIgYgDYU3A6gBIAEgBSAOhTcDoAEgASAEIA+FNwOYASABIAMgEIU3A5ABIAEgBiABKQPIAYU3A4gBAkACQCAAQcAAIABBwABJGyIRQQdxIhINACABQfAAaiECIAshByARIRIMAQsgAUHwAGohAiALIQcDQCAHIAItAAA6AAAgB0EBaiEHIAJBAWohAiASQX9qIhINAAsgEUH4AHEhEgsCQCAAQQhJDQADQCAHIAIpAAA3AAAgB0EIaiEHIAJBCGohAiASQXhqIhINAAsLIAhCAXwhCCALIBFqIQsgACARayIADQALCyABQfABaiQAC6cCAQR+AkACQCAAQSBGDQBCq7OP/JGjs/DbACEBQv+kuYjFkdqCm38hAkLy5rvjo6f9p6V/IQNC58yn0NbQ67O7fyEEQQAhAAwBC0EAKQOYgQQhAUEAKQOQgQQhAkEAKQOIgQQhA0EAKQOAgQQhBEEQIQALQQAgADoAioIFQQBCADcDgIIFQQBCADcD+IEFQQBCADcD8IEFQQBCADcD6IEFQQBCADcD4IEFQQBCADcD2IEFQQBCADcD0IEFQQBCADcDyIEFQQBCADcDwIEFQQAgATcDuIEFQQAgAjcDsIEFQQAgAzcDqIEFQQAgBDcDoIEFQQAgATcDmIEFQQAgAjcDkIEFQQAgAzcDiIEFQQAgBDcDgIEFQQBBADoAkIIFQQBBADsBiIIFCwYAIAAQAwsGACAAEAcLBgBBgIEFC68CAQR+AkACQCABQSBGDQBCq7OP/JGjs/DbACEDQv+kuYjFkdqCm38hBELy5rvjo6f9p6V/IQVC58yn0NbQ67O7fyEGQQAhAQwBC0EAKQOYgQQhA0EAKQOQgQQhBEEAKQOIgQQhBUEAKQOAgQQhBkEQIQELQQAgAToAioIFQQBCADcDgIIFQQBCADcD+IEFQQBCADcD8IEFQQBCADcD6IEFQQBCADcD4IEFQQBCADcD2IEFQQBCADcD0IEFQQBCADcDyIEFQQBCADcDwIEFQQAgAzcDuIEFQQAgBDcDsIEFQQAgBTcDqIEFQQAgBjcDoIEFQQAgAzcDmIEFQQAgBDcDkIEFQQAgBTcDiIEFQQAgBjcDgIEFQQBBADoAkIIFQQBBADsBiIIFIAAQAyACEAcLCwwBAEGAgAQLBHgHAAA=";
      var hash$h = "558f85b5";
      var wasmJson$h = {
        name: name$h,
        data: data$h,
        hash: hash$h
      };
      const mutex$i = new Mutex();
      let wasmCache$i = null;
      function validateBits$2(bits) {
        if (!Number.isInteger(bits) || bits < 8 || bits % 8 !== 0) {
          return new Error("Invalid variant! Valid values: 8, 16, ...");
        }
        return null;
      }
      function blake3(data2, bits = 256, key = null) {
        if (validateBits$2(bits)) {
          return Promise.reject(validateBits$2(bits));
        }
        let keyBuffer = null;
        let initParam = 0;
        if (key !== null) {
          keyBuffer = getUInt8Buffer(key);
          if (keyBuffer.length !== 32) {
            return Promise.reject(new Error("Key length must be exactly 32 bytes"));
          }
          initParam = 32;
        }
        const hashLength = bits / 8;
        const digestParam = hashLength;
        if (wasmCache$i === null || wasmCache$i.hashLength !== hashLength) {
          return lockedCreate(mutex$i, wasmJson$h, hashLength).then((wasm) => {
            wasmCache$i = wasm;
            if (initParam === 32) {
              wasmCache$i.writeMemory(keyBuffer);
            }
            return wasmCache$i.calculate(data2, initParam, digestParam);
          });
        }
        try {
          if (initParam === 32) {
            wasmCache$i.writeMemory(keyBuffer);
          }
          const hash2 = wasmCache$i.calculate(data2, initParam, digestParam);
          return Promise.resolve(hash2);
        } catch (err) {
          return Promise.reject(err);
        }
      }
      function createBLAKE3(bits = 256, key = null) {
        if (validateBits$2(bits)) {
          return Promise.reject(validateBits$2(bits));
        }
        let keyBuffer = null;
        let initParam = 0;
        if (key !== null) {
          keyBuffer = getUInt8Buffer(key);
          if (keyBuffer.length !== 32) {
            return Promise.reject(new Error("Key length must be exactly 32 bytes"));
          }
          initParam = 32;
        }
        const outputSize = bits / 8;
        const digestParam = outputSize;
        return WASMInterface(wasmJson$h, outputSize).then((wasm) => {
          if (initParam === 32) {
            wasm.writeMemory(keyBuffer);
          }
          wasm.init(initParam);
          const obj = {
            init: initParam === 32 ? () => {
              wasm.writeMemory(keyBuffer);
              wasm.init(initParam);
              return obj;
            } : () => {
              wasm.init(initParam);
              return obj;
            },
            update: (data2) => {
              wasm.update(data2);
              return obj;
            },
            // biome-ignore lint/suspicious/noExplicitAny: Conflict with IHasher type
            digest: (outputType) => wasm.digest(outputType, digestParam),
            save: () => wasm.save(),
            load: (data2) => {
              wasm.load(data2);
              return obj;
            },
            blockSize: 64,
            digestSize: outputSize
          };
          return obj;
        });
      }
      var name$g = "crc32";
      var data$g = "AGFzbQEAAAABEQRgAAF/YAF/AGAAAGACf38AAwgHAAEBAQIAAwUEAQECAgYPAn8BQYCABAt/AEGAgAQLB4IBCQZtZW1vcnkCAA9fX3N0YWNrX3BvaW50ZXIDAA5IYXNoX0dldEJ1ZmZlcgAACUhhc2hfSW5pdAACC0hhc2hfVXBkYXRlAAMKSGFzaF9GaW5hbAAEDUhhc2hfR2V0U3RhdGUABQ5IYXNoX0NhbGN1bGF0ZQAGClNUQVRFX1NJWkUDAQrNBwcGAEGAgQQLrgMBA39BgIEFIQFBACECA0AgAUEAQQBBAEEAQQBBAEEAQQAgAkEBcWsgAHEgAkEBdnMiA0EBcWsgAHEgA0EBdnMiA0EBcWsgAHEgA0EBdnMiA0EBcWsgAHEgA0EBdnMiA0EBcWsgAHEgA0EBdnMiA0EBcWsgAHEgA0EBdnMiA0EBcWsgAHEgA0EBdnMiA0EBcWsgAHEgA0EBdnM2AgAgAUEEaiEBIAJBAWoiAkGAAkcNAAtBACEAA0AgAEGEiQVqIABBhIEFaigCACICQf8BcUECdCgCgIEFIAJBCHZzIgI2AgAgAEGEkQVqIAJB/wFxQQJ0KAKAgQUgAkEIdnMiAjYCACAAQYSZBWogAkH/AXFBAnQoAoCBBSACQQh2cyICNgIAIABBhKEFaiACQf8BcUECdCgCgIEFIAJBCHZzIgI2AgAgAEGEqQVqIAJB/wFxQQJ0KAKAgQUgAkEIdnMiAjYCACAAQYSxBWogAkH/AXFBAnQoAoCBBSACQQh2cyICNgIAIABBhLkFaiACQf8BcUECdCgCgIEFIAJBCHZzNgIAIABBBGoiAEH8B0cNAAsLJwACQEEAKAKAwQUgAEYNACAAEAFBACAANgKAwQULQQBBADYChMEFC+kCAQN/QQAoAoTBBUF/cyEBQYCBBCECAkAgAEEISQ0AQYCBBCECA0AgAkEEaigCACIDQQ52QfwHcSgCgIkFIANBFnZB/AdxKAKAgQVzIANBBnZB/AdxKAKAkQVzIANB/wFxQQJ0KAKAmQVzIAIoAgAgAXMiAUEWdkH8B3EoAoChBXMgAUEOdkH8B3EoAoCpBXMgAUEGdkH8B3EoAoCxBXMgAUH/AXFBAnQoAoC5BXMhASACQQhqIQIgAEF4aiIAQQdLDQALCwJAIABFDQACQAJAIABBAXENACAAIQMMAQsgAUH/AXEgAi0AAHNBAnQoAoCBBSABQQh2cyEBIAJBAWohAiAAQX9qIQMLIABBAUYNAANAIAFB/wFxIAItAABzQQJ0KAKAgQUgAUEIdnMiAUH/AXEgAkEBai0AAHNBAnQoAoCBBSABQQh2cyEBIAJBAmohAiADQX5qIgMNAAsLQQAgAUF/czYChMEFCykBAX9BAEEAKAKEwQUiAEH/gfwHcUEIeCAAQRh4Qf+B/AdxcjYCgIEECwYAQYTBBQtQAAJAQQAoAoDBBSABRg0AIAEQAUEAIAE2AoDBBQtBAEEANgKEwQUgABADQQBBACgChMEFIgFB/4H8B3FBCHggAUEYeEH/gfwHcXI2AoCBBAsLDAEAQYCABAsEBAAAAA==";
      var hash$g = "e5d47522";
      var wasmJson$g = {
        name: name$g,
        data: data$g,
        hash: hash$g
      };
      const mutex$h = new Mutex();
      let wasmCache$h = null;
      function validatePoly(poly) {
        if (!Number.isInteger(poly) || poly < 0 || poly > 4294967295) {
          return new Error("Polynomial must be a valid 32-bit long unsigned integer");
        }
        return null;
      }
      function crc32(data2, polynomial = 3988292384) {
        if (validatePoly(polynomial)) {
          return Promise.reject(validatePoly(polynomial));
        }
        if (wasmCache$h === null) {
          return lockedCreate(mutex$h, wasmJson$g, 4).then((wasm) => {
            wasmCache$h = wasm;
            return wasmCache$h.calculate(data2, polynomial);
          });
        }
        try {
          const hash2 = wasmCache$h.calculate(data2, polynomial);
          return Promise.resolve(hash2);
        } catch (err) {
          return Promise.reject(err);
        }
      }
      function createCRC32(polynomial = 3988292384) {
        if (validatePoly(polynomial)) {
          return Promise.reject(validatePoly(polynomial));
        }
        return WASMInterface(wasmJson$g, 4).then((wasm) => {
          wasm.init(polynomial);
          const obj = {
            init: () => {
              wasm.init(polynomial);
              return obj;
            },
            update: (data2) => {
              wasm.update(data2);
              return obj;
            },
            // biome-ignore lint/suspicious/noExplicitAny: Conflict with IHasher type
            digest: (outputType) => wasm.digest(outputType),
            save: () => wasm.save(),
            load: (data2) => {
              wasm.load(data2);
              return obj;
            },
            blockSize: 4,
            digestSize: 4
          };
          return obj;
        });
      }
      var name$f = "crc64";
      var data$f = "AGFzbQEAAAABDANgAAF/YAAAYAF/AAMHBgABAgEAAQUEAQECAgYPAn8BQYCABAt/AEGAgAQLB4IBCQZtZW1vcnkCAA9fX3N0YWNrX3BvaW50ZXIDAA5IYXNoX0dldEJ1ZmZlcgAACUhhc2hfSW5pdAABC0hhc2hfVXBkYXRlAAIKSGFzaF9GaW5hbAADDUhhc2hfR2V0U3RhdGUABA5IYXNoX0NhbGN1bGF0ZQAFClNUQVRFX1NJWkUDAQrSBwYGAEGAgQQL4QMDAX4BfwJ+AkBBACkDgIEGQQApA4CBBCIAUQ0AQYCBBSEBQgAhAgNAIAFCAEIAQgBCAEIAQgBCAEIAIAJCAYN9IACDIAJCAYiFIgNCAYN9IACDIANCAYiFIgNCAYN9IACDIANCAYiFIgNCAYN9IACDIANCAYiFIgNCAYN9IACDIANCAYiFIgNCAYN9IACDIANCAYiFIgNCAYN9IACDIANCAYiFIgNCAYN9IACDIANCAYiFNwMAIAFBCGohASACQgF8IgJCgAJSDQALQQAhAQNAIAFBiJEFaiABQYiBBWopAwAiAqdB/wFxQQN0KQOAgQUgAkIIiIUiAjcDACABQYihBWogAqdB/wFxQQN0KQOAgQUgAkIIiIUiAjcDACABQYixBWogAqdB/wFxQQN0KQOAgQUgAkIIiIUiAjcDACABQYjBBWogAqdB/wFxQQN0KQOAgQUgAkIIiIUiAjcDACABQYjRBWogAqdB/wFxQQN0KQOAgQUgAkIIiIUiAjcDACABQYjhBWogAqdB/wFxQQN0KQOAgQUgAkIIiIUiAjcDACABQYjxBWogAqdB/wFxQQN0KQOAgQUgAkIIiIU3AwAgAUEIaiIBQfgPRw0AC0EAIAA3A4CBBgtBAEIANwOIgQYL9QICAX4Cf0EAKQOIgQZCf4UhAUGAgQQhAgJAIABBCEkNAEGAgQQhAgNAIAIpAwAgAYUiAUIwiKdB/wFxQQN0KQOAkQUgAUI4iKdBA3QpA4CBBYUgAUIoiKdB/wFxQQN0KQOAoQWFIAFCIIinQf8BcUEDdCkDgLEFhSABpyIDQRV2QfgPcSkDgMEFhSADQQ12QfgPcSkDgNEFhSADQQV2QfgPcSkDgOEFhSADQf8BcUEDdCkDgPEFhSEBIAJBCGohAiAAQXhqIgBBB0sNAAsLAkAgAEUNAAJAAkAgAEEBcQ0AIAAhAwwBCyABQv8BgyACMQAAhadBA3QpA4CBBSABQgiIhSEBIAJBAWohAiAAQX9qIQMLIABBAUYNAANAIAFC/wGDIAIxAACFp0EDdCkDgIEFIAFCCIiFIgFC/wGDIAJBAWoxAACFp0EDdCkDgIEFIAFCCIiFIQEgAkECaiECIANBfmoiAw0ACwtBACABQn+FNwOIgQYLZQEBfkEAQQApA4iBBiIAQjiGIABCgP4Dg0IohoQgAEKAgPwHg0IYhiAAQoCAgPgPg0IIhoSEIABCCIhCgICA+A+DIABCGIhCgID8B4OEIABCKIhCgP4DgyAAQjiIhISENwOAgQQLBgBBiIEGCwIACwsMAQBBgIAECwQIAAAA";
      var hash$f = "c112163d";
      var wasmJson$f = {
        name: name$f,
        data: data$f,
        hash: hash$f
      };
      const mutex$g = new Mutex();
      let wasmCache$g = null;
      const polyBuffer = new Uint8Array(8);
      function parsePoly(poly) {
        const errText = "Polynomial must be provided as a 16 char long hex string";
        if (typeof poly !== "string" || poly.length !== 16) {
          return { hi: 0, lo: 0, err: new Error(errText) };
        }
        const hi = Number(`0x${poly.slice(0, 8)}`);
        const lo = Number(`0x${poly.slice(8)}`);
        if (Number.isNaN(hi) || Number.isNaN(lo)) {
          return { hi, lo, err: new Error(errText) };
        }
        return { hi, lo, err: null };
      }
      function writePoly(arr, lo, hi) {
        const buffer = new DataView(arr);
        buffer.setUint32(0, lo, true);
        buffer.setUint32(4, hi, true);
      }
      function crc64(data2, polynomial = "c96c5795d7870f42") {
        const { hi, lo, err } = parsePoly(polynomial);
        if (err !== null) {
          return Promise.reject(err);
        }
        if (wasmCache$g === null) {
          return lockedCreate(mutex$g, wasmJson$f, 8).then((wasm) => {
            wasmCache$g = wasm;
            writePoly(polyBuffer.buffer, lo, hi);
            wasmCache$g.writeMemory(polyBuffer);
            return wasmCache$g.calculate(data2);
          });
        }
        try {
          writePoly(polyBuffer.buffer, lo, hi);
          wasmCache$g.writeMemory(polyBuffer);
          const hash2 = wasmCache$g.calculate(data2);
          return Promise.resolve(hash2);
        } catch (err2) {
          return Promise.reject(err2);
        }
      }
      function createCRC64(polynomial = "c96c5795d7870f42") {
        const { hi, lo, err } = parsePoly(polynomial);
        if (err !== null) {
          return Promise.reject(err);
        }
        return WASMInterface(wasmJson$f, 8).then((wasm) => {
          const instanceBuffer = new Uint8Array(8);
          writePoly(instanceBuffer.buffer, lo, hi);
          wasm.writeMemory(instanceBuffer);
          wasm.init();
          const obj = {
            init: () => {
              wasm.writeMemory(instanceBuffer);
              wasm.init();
              return obj;
            },
            update: (data2) => {
              wasm.update(data2);
              return obj;
            },
            // biome-ignore lint/suspicious/noExplicitAny: Conflict with IHasher type
            digest: (outputType) => wasm.digest(outputType),
            save: () => wasm.save(),
            load: (data2) => {
              wasm.load(data2);
              return obj;
            },
            blockSize: 8,
            digestSize: 8
          };
          return obj;
        });
      }
      var name$e = "md4";
      var data$e = "AGFzbQEAAAABEgRgAAF/YAAAYAF/AGACf38BfwMIBwABAgMBAAIFBAEBAgIGDwJ/AUGAgAQLfwBBgIAECweCAQkGbWVtb3J5AgAPX19zdGFja19wb2ludGVyAwAOSGFzaF9HZXRCdWZmZXIAAAlIYXNoX0luaXQAAQtIYXNoX1VwZGF0ZQACCkhhc2hfRmluYWwABA1IYXNoX0dldFN0YXRlAAUOSGFzaF9DYWxjdWxhdGUABgpTVEFURV9TSVpFAwEK5xYHBgBBgIEECy0AQQBC/rnrxemOlZkQNwKQgQVBAEKBxpS6lvHq5m83AoiBBUEAQgA3AoCBBQvKBQEHf0EAQQAoAoCBBSIBIABqQf////8BcSICNgKAgQVBAEEAKAKEgQUgAiABSWogAEEddmo2AoSBBQJAAkACQAJAAkACQCABQT9xIgMNAEGAgQQhBAwBCyAAQcAAIANrIgVJDQEgBUEDcSEGQQAhAQJAAkAgA0E/c0EDSQ0AIANBgIEFaiEEIAVB/ABxIQdBACEBA0AgBCABaiICQRhqIAFBgIEEai0AADoAACACQRlqIAFBgYEEai0AADoAACACQRpqIAFBgoEEai0AADoAACACQRtqIAFBg4EEai0AADoAACAHIAFBBGoiAUcNAAsgBkUNAQsgA0GYgQVqIQIDQCACIAFqIAFBgIEEai0AADoAACABQQFqIQEgBkF/aiIGDQALC0GYgQVBwAAQAxogACAFayEAIAVBgIEEaiEECyAAQcAATw0BIAAhAgwCCyAARQ0CIABBA3EhBkEAIQECQCAAQQRJDQAgA0GAgQVqIQQgAEF8cSEAQQAhAQNAIAQgAWoiAkEYaiABQYCBBGotAAA6AAAgAkEZaiABQYGBBGotAAA6AAAgAkEaaiABQYKBBGotAAA6AAAgAkEbaiABQYOBBGotAAA6AAAgACABQQRqIgFHDQALIAZFDQMLIANBmIEFaiECA0AgAiABaiABQYCBBGotAAA6AAAgAUEBaiEBIAZBf2oiBg0ADAMLCyAAQT9xIQIgBCAAQUBxEAMhBAsgAkUNACACQQNxIQZBACEBAkAgAkEESQ0AIAJBPHEhAEEAIQEDQCABQZiBBWogBCABaiICLQAAOgAAIAFBmYEFaiACQQFqLQAAOgAAIAFBmoEFaiACQQJqLQAAOgAAIAFBm4EFaiACQQNqLQAAOgAAIAAgAUEEaiIBRw0ACyAGRQ0BCwNAIAFBmIEFaiAEIAFqLQAAOgAAIAFBAWohASAGQX9qIgYNAAsLC5gLARd/QQAoApSBBSECQQAoApCBBSEDQQAoAoyBBSEEQQAoAoiBBSEFA0AgAEEcaigCACIGIABBFGooAgAiByAAQRhqKAIAIgggAEEQaigCACIJIABBLGooAgAiCiAAQShqKAIAIgsgAEEkaigCACIMIABBIGooAgAiDSALIAggAEEIaigCACIOIANqIABBBGooAgAiDyACaiAEIAMgAnNxIAJzIAVqIAAoAgAiEGpBA3ciESAEIANzcSADc2pBB3ciEiARIARzcSAEc2pBC3ciE2ogEiAHaiAJIBFqIABBDGooAgAiFCAEaiATIBIgEXNxIBFzakETdyIRIBMgEnNxIBJzakEDdyISIBEgE3NxIBNzakEHdyITIBIgEXNxIBFzakELdyIVaiATIAxqIBIgDWogESAGaiAVIBMgEnNxIBJzakETdyIRIBUgE3NxIBNzakEDdyISIBEgFXNxIBVzakEHdyITIBIgEXNxIBFzakELdyIVIABBOGooAgAiFmogEyAAQTRqKAIAIhdqIBIgAEEwaigCACIYaiARIApqIBUgEyASc3EgEnNqQRN3IhIgFSATc3EgE3NqQQN3IhMgEiAVc3EgFXNqQQd3IhUgEyASc3EgEnNqQQt3IhFqIAkgFWogECATaiASIABBPGooAgAiCWogESAVIBNzcSATc2pBE3ciEiARIBVycSARIBVxcmpBmfOJ1AVqQQN3IhMgEiARcnEgEiARcXJqQZnzidQFakEFdyIRIBMgEnJxIBMgEnFyakGZ84nUBWpBCXciFWogByARaiAPIBNqIBggEmogFSARIBNycSARIBNxcmpBmfOJ1AVqQQ13IhIgFSARcnEgFSARcXJqQZnzidQFakEDdyIRIBIgFXJxIBIgFXFyakGZ84nUBWpBBXciEyARIBJycSARIBJxcmpBmfOJ1AVqQQl3IhVqIAggE2ogDiARaiAXIBJqIBUgEyARcnEgEyARcXJqQZnzidQFakENdyIRIBUgE3JxIBUgE3FyakGZ84nUBWpBA3ciEiARIBVycSARIBVxcmpBmfOJ1AVqQQV3IhMgEiARcnEgEiARcXJqQZnzidQFakEJdyIVaiAGIBNqIBQgEmogFiARaiAVIBMgEnJxIBMgEnFyakGZ84nUBWpBDXciESAVIBNycSAVIBNxcmpBmfOJ1AVqQQN3IhIgESAVcnEgESAVcXJqQZnzidQFakEFdyITIBIgEXJxIBIgEXFyakGZ84nUBWpBCXciFWogECASaiAJIBFqIBUgEyAScnEgEyAScXJqQZnzidQFakENdyIGIBVzIhIgE3NqQaHX5/YGakEDdyIRIAZzIA0gE2ogEiARc2pBodfn9gZqQQl3IhJzakGh1+f2BmpBC3ciE2ogDiARaiATIBJzIBggBmogEiARcyATc2pBodfn9gZqQQ93IhFzakGh1+f2BmpBA3ciFSARcyALIBJqIBEgE3MgFXNqQaHX5/YGakEJdyISc2pBodfn9gZqQQt3IhNqIA8gFWogEyAScyAWIBFqIBIgFXMgE3NqQaHX5/YGakEPdyIRc2pBodfn9gZqQQN3IhUgEXMgDCASaiARIBNzIBVzakGh1+f2BmpBCXciEnNqQaHX5/YGakELdyITaiAUIBVqIBMgEnMgFyARaiASIBVzIBNzakGh1+f2BmpBD3ciEXNqQaHX5/YGakEDdyIVIBFzIAogEmogESATcyAVc2pBodfn9gZqQQl3IhJzakGh1+f2BmpBC3ciEyADaiEDIAkgEWogEiAVcyATc2pBodfn9gZqQQ93IARqIQQgEiACaiECIBUgBWohBSAAQcAAaiEAIAFBQGoiAQ0AC0EAIAI2ApSBBUEAIAM2ApCBBUEAIAQ2AoyBBUEAIAU2AoiBBSAAC44FAQd/QQAoAoCBBUE/cSIAQYABOgCYgQUCQAJAAkAgAEE/cyIBQQdLDQACQCAAQT9GDQAgAUEDcSEBQQAhAgJAIABBO0sNAEE7IABrQQJ2QQFqIgNBA3EhBEEAIQICQAJAIABBL0sNACAAQYCBBWohBSADQQJ0QfAAcSEGQQAhAgNAIAUgAmoiA0EhakIANwAAIANBGWpCADcAACAGIAJBEGoiAkcNAAsgBEUNAQsgBEECdCEFIAIgAGpBgIEFaiEGQQAhAwNAIAYgA2pBGWpBADYAACAFIANBBGoiA0cNAAsgAiADaiECCyABRQ0BCyACIABqQZmBBWohAwNAIANBADoAACADQQFqIQMgAUF/aiIBDQALC0GYgQUhAkGYgQVBwAAQAxpBgIEFIQFBNyEDDAELIABBN0YNAUE2IABrIgIhAwJAIAFBA3EiAUUNAEEAIAFrIQFBACEDA0AgA0HPgQVqQQA6AAAgASADQX9qIgNHDQALIAIgA2ohAwsgAkEDSQ0BIABBAWoiAkGAgQVqIQEgAkGYgQVqIQICQCADQX1qIgBBBHENACACIANqIgVBADoAACABIANqQRZqQQA7AAAgBUF9akEAOgAAIANBfGohAwsgAEEESQ0BCyACQXlqIQJBfyEFA0AgAiADaiIAQQdqQQA6AAAgASADaiIGQRZqQQA7AAAgAEEDakEAOwAAIAZBEmpBADsAACAAQQA6AAAgAkF4aiECIAFBeGohASADIAVBCGoiBUcNAAsLQQBBACgChIEFNgLUgQVBAEEAKAKAgQVBA3QiAzYC0IEFQQAgAzYCgIEFQZiBBUHAABADGkEAQQApAoiBBTcDgIEEQQBBACkCkIEFNwOIgQQLBgBBgIEFCzMAQQBC/rnrxemOlZkQNwKQgQVBAEKBxpS6lvHq5m83AoiBBUEAQgA3AoCBBSAAEAIQBAsLDAEAQYCABAsEmAAAAA==";
      var hash$e = "714a79fb";
      var wasmJson$e = {
        name: name$e,
        data: data$e,
        hash: hash$e
      };
      const mutex$f = new Mutex();
      let wasmCache$f = null;
      function md4(data2) {
        if (wasmCache$f === null) {
          return lockedCreate(mutex$f, wasmJson$e, 16).then((wasm) => {
            wasmCache$f = wasm;
            return wasmCache$f.calculate(data2);
          });
        }
        try {
          const hash2 = wasmCache$f.calculate(data2);
          return Promise.resolve(hash2);
        } catch (err) {
          return Promise.reject(err);
        }
      }
      function createMD4() {
        return WASMInterface(wasmJson$e, 16).then((wasm) => {
          wasm.init();
          const obj = {
            init: () => {
              wasm.init();
              return obj;
            },
            update: (data2) => {
              wasm.update(data2);
              return obj;
            },
            // biome-ignore lint/suspicious/noExplicitAny: Conflict with IHasher type
            digest: (outputType) => wasm.digest(outputType),
            save: () => wasm.save(),
            load: (data2) => {
              wasm.load(data2);
              return obj;
            },
            blockSize: 64,
            digestSize: 16
          };
          return obj;
        });
      }
      var name$d = "md5";
      var data$d = "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";
      var hash$d = "dc3031df";
      var wasmJson$d = {
        name: name$d,
        data: data$d,
        hash: hash$d
      };
      const mutex$e = new Mutex();
      let wasmCache$e = null;
      function md5(data2) {
        if (wasmCache$e === null) {
          return lockedCreate(mutex$e, wasmJson$d, 16).then((wasm) => {
            wasmCache$e = wasm;
            return wasmCache$e.calculate(data2);
          });
        }
        try {
          const hash2 = wasmCache$e.calculate(data2);
          return Promise.resolve(hash2);
        } catch (err) {
          return Promise.reject(err);
        }
      }
      function createMD5() {
        return WASMInterface(wasmJson$d, 16).then((wasm) => {
          wasm.init();
          const obj = {
            init: () => {
              wasm.init();
              return obj;
            },
            update: (data2) => {
              wasm.update(data2);
              return obj;
            },
            // biome-ignore lint/suspicious/noExplicitAny: Conflict with IHasher type
            digest: (outputType) => wasm.digest(outputType),
            save: () => wasm.save(),
            load: (data2) => {
              wasm.load(data2);
              return obj;
            },
            blockSize: 64,
            digestSize: 16
          };
          return obj;
        });
      }
      var name$c = "sha1";
      var data$c = "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";
      var hash$c = "a5f2c72b";
      var wasmJson$c = {
        name: name$c,
        data: data$c,
        hash: hash$c
      };
      const mutex$d = new Mutex();
      let wasmCache$d = null;
      function sha1(data2) {
        if (wasmCache$d === null) {
          return lockedCreate(mutex$d, wasmJson$c, 20).then((wasm) => {
            wasmCache$d = wasm;
            return wasmCache$d.calculate(data2);
          });
        }
        try {
          const hash2 = wasmCache$d.calculate(data2);
          return Promise.resolve(hash2);
        } catch (err) {
          return Promise.reject(err);
        }
      }
      function createSHA1() {
        return WASMInterface(wasmJson$c, 20).then((wasm) => {
          wasm.init();
          const obj = {
            init: () => {
              wasm.init();
              return obj;
            },
            update: (data2) => {
              wasm.update(data2);
              return obj;
            },
            // biome-ignore lint/suspicious/noExplicitAny: Conflict with IHasher type
            digest: (outputType) => wasm.digest(outputType),
            save: () => wasm.save(),
            load: (data2) => {
              wasm.load(data2);
              return obj;
            },
            blockSize: 64,
            digestSize: 20
          };
          return obj;
        });
      }
      var name$b = "sha3";
      var data$b = "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BSAAcjoAyIMFIAFBx4MFaiIDIAMtAABBgAFyOgAAQciDBSABEANBAEGAgICAeDYCiIUFCwJAIAJBAnYiA0UNACADQQNxIQVBACEEAkAgAkEQSQ0AIANB/P///wNxIQFBACEDQQAhBANAIANBgIIEaiADQYCCBWooAgA2AgAgA0GEggRqIANBhIIFaigCADYCACADQYiCBGogA0GIggVqKAIANgIAIANBjIIEaiADQYyCBWooAgA2AgAgA0EQaiEDIAEgBEEEaiIERw0ACyAFRQ0BCyAFQQJ0IQEgBEECdCEDA0AgA0GAggRqIANBgIIFaigCADYCACADQQRqIQMgAUF8aiIBDQALCwsGAEGAggULzgYBA39BAEIANwOAhQVBAEIANwP4hAVBAEIANwPwhAVBAEIANwPohAVBAEIANwPghAVBAEIANwPYhAVBAEIANwPQhAVBAEIANwPIhAVBAEIANwPAhAVBAEIANwO4hAVBAEIANwOwhAVBAEIANwOohAVBAEIANwOghAVBAEIANwOYhAVBAEIANwOQhAVBAEIANwOIhAVBAEIANwOAhAVBAEIANwP4gwVBAEIANwPwgwVBAEIANwPogwVBAEIANwPggwVBAEIANwPYgwVBAEIANwPQgwVBAEIANwPIgwVBAEIANwPAgwVBAEIANwO4gwVBAEIANwOwgwVBAEIANwOogwVBAEIANwOggwVBAEIANwOYgwVBAEIANwOQgwVBAEIANwOIgwVBAEIANwOAgwVBAEIANwP4ggVBAEIANwPwggVBAEIANwPoggVBAEIANwPgggVBAEIANwPYggVBAEIANwPQggVBAEIANwPIggVBAEIANwPAggVBAEIANwO4ggVBAEIANwOwggVBAEIANwOoggVBAEIANwOgggVBAEIANwOYggVBAEIANwOQggVBAEIANwOIggVBAEIANwOAggVBAEHADCABQQF0a0EDdjYCjIUFQQBBADYCiIUFIAAQAkHkAEEAKAKMhQUiAEEBdmshAwJAQQAoAoiFBSIBQQBIDQAgACEEAkAgACABRg0AIAFByIMFaiEFQQAhAQNAIAUgAWpBADoAACABQQFqIgEgAEEAKAKIhQUiBGtJDQALCyAEIAQtAMiDBSACcjoAyIMFIABBx4MFaiIBIAEtAABBgAFyOgAAQciDBSAAEANBAEGAgICAeDYCiIUFCwJAIANBAnYiAUUNACABQQNxIQVBACEEAkAgA0EQSQ0AIAFB/P///wNxIQBBACEBQQAhBANAIAFBgIIEaiABQYCCBWooAgA2AgAgAUGEggRqIAFBhIIFaigCADYCACABQYiCBGogAUGIggVqKAIANgIAIAFBjIIEaiABQYyCBWooAgA2AgAgAUEQaiEBIAAgBEEEaiIERw0ACyAFRQ0BCyAFQQJ0IQAgBEECdCEBA0AgAUGAggRqIAFBgIIFaigCADYCACABQQRqIQEgAEF8aiIADQALCwsL2QEBAEGAgAQL0AGQAQAAAAAAAAAAAAAAAAAAAQAAAAAAAACCgAAAAAAAAIqAAAAAAACAAIAAgAAAAICLgAAAAAAAAAEAAIAAAAAAgYAAgAAAAIAJgAAAAAAAgIoAAAAAAAAAiAAAAAAAAAAJgACAAAAAAAoAAIAAAAAAi4AAgAAAAACLAAAAAAAAgImAAAAAAACAA4AAAAAAAIACgAAAAAAAgIAAAAAAAACACoAAAAAAAAAKAACAAAAAgIGAAIAAAACAgIAAAAAAAIABAACAAAAAAAiAAIAAAACA";
      var hash$b = "961accfe";
      var wasmJson$b = {
        name: name$b,
        data: data$b,
        hash: hash$b
      };
      const mutex$c = new Mutex();
      let wasmCache$c = null;
      function validateBits$1(bits) {
        if (![224, 256, 384, 512].includes(bits)) {
          return new Error("Invalid variant! Valid values: 224, 256, 384, 512");
        }
        return null;
      }
      function sha3(data2, bits = 512) {
        if (validateBits$1(bits)) {
          return Promise.reject(validateBits$1(bits));
        }
        const hashLength = bits / 8;
        if (wasmCache$c === null || wasmCache$c.hashLength !== hashLength) {
          return lockedCreate(mutex$c, wasmJson$b, hashLength).then((wasm) => {
            wasmCache$c = wasm;
            return wasmCache$c.calculate(data2, bits, 6);
          });
        }
        try {
          const hash2 = wasmCache$c.calculate(data2, bits, 6);
          return Promise.resolve(hash2);
        } catch (err) {
          return Promise.reject(err);
        }
      }
      function createSHA3(bits = 512) {
        if (validateBits$1(bits)) {
          return Promise.reject(validateBits$1(bits));
        }
        const outputSize = bits / 8;
        return WASMInterface(wasmJson$b, outputSize).then((wasm) => {
          wasm.init(bits);
          const obj = {
            init: () => {
              wasm.init(bits);
              return obj;
            },
            update: (data2) => {
              wasm.update(data2);
              return obj;
            },
            // biome-ignore lint/suspicious/noExplicitAny: Conflict with IHasher type
            digest: (outputType) => wasm.digest(outputType, 6),
            save: () => wasm.save(),
            load: (data2) => {
              wasm.load(data2);
              return obj;
            },
            blockSize: 200 - 2 * outputSize,
            digestSize: outputSize
          };
          return obj;
        });
      }
      const mutex$b = new Mutex();
      let wasmCache$b = null;
      function validateBits(bits) {
        if (![224, 256, 384, 512].includes(bits)) {
          return new Error("Invalid variant! Valid values: 224, 256, 384, 512");
        }
        return null;
      }
      function keccak(data2, bits = 512) {
        if (validateBits(bits)) {
          return Promise.reject(validateBits(bits));
        }
        const hashLength = bits / 8;
        if (wasmCache$b === null || wasmCache$b.hashLength !== hashLength) {
          return lockedCreate(mutex$b, wasmJson$b, hashLength).then((wasm) => {
            wasmCache$b = wasm;
            return wasmCache$b.calculate(data2, bits, 1);
          });
        }
        try {
          const hash2 = wasmCache$b.calculate(data2, bits, 1);
          return Promise.resolve(hash2);
        } catch (err) {
          return Promise.reject(err);
        }
      }
      function createKeccak(bits = 512) {
        if (validateBits(bits)) {
          return Promise.reject(validateBits(bits));
        }
        const outputSize = bits / 8;
        return WASMInterface(wasmJson$b, outputSize).then((wasm) => {
          wasm.init(bits);
          const obj = {
            init: () => {
              wasm.init(bits);
              return obj;
            },
            update: (data2) => {
              wasm.update(data2);
              return obj;
            },
            // biome-ignore lint/suspicious/noExplicitAny: Conflict with IHasher type
            digest: (outputType) => wasm.digest(outputType, 1),
            save: () => wasm.save(),
            load: (data2) => {
              wasm.load(data2);
              return obj;
            },
            blockSize: 200 - 2 * outputSize,
            digestSize: outputSize
          };
          return obj;
        });
      }
      var name$a = "sha256";
      var data$a = "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";
      var hash$a = "8ed695a3";
      var wasmJson$a = {
        name: name$a,
        data: data$a,
        hash: hash$a
      };
      const mutex$a = new Mutex();
      let wasmCache$a = null;
      function sha224(data2) {
        if (wasmCache$a === null) {
          return lockedCreate(mutex$a, wasmJson$a, 28).then((wasm) => {
            wasmCache$a = wasm;
            return wasmCache$a.calculate(data2, 224);
          });
        }
        try {
          const hash2 = wasmCache$a.calculate(data2, 224);
          return Promise.resolve(hash2);
        } catch (err) {
          return Promise.reject(err);
        }
      }
      function createSHA224() {
        return WASMInterface(wasmJson$a, 28).then((wasm) => {
          wasm.init(224);
          const obj = {
            init: () => {
              wasm.init(224);
              return obj;
            },
            update: (data2) => {
              wasm.update(data2);
              return obj;
            },
            // biome-ignore lint/suspicious/noExplicitAny: Conflict with IHasher type
            digest: (outputType) => wasm.digest(outputType),
            save: () => wasm.save(),
            load: (data2) => {
              wasm.load(data2);
              return obj;
            },
            blockSize: 64,
            digestSize: 28
          };
          return obj;
        });
      }
      const mutex$9 = new Mutex();
      let wasmCache$9 = null;
      function sha2562(data2) {
        if (wasmCache$9 === null) {
          return lockedCreate(mutex$9, wasmJson$a, 32).then((wasm) => {
            wasmCache$9 = wasm;
            return wasmCache$9.calculate(data2, 256);
          });
        }
        try {
          const hash2 = wasmCache$9.calculate(data2, 256);
          return Promise.resolve(hash2);
        } catch (err) {
          return Promise.reject(err);
        }
      }
      function createSHA256() {
        return WASMInterface(wasmJson$a, 32).then((wasm) => {
          wasm.init(256);
          const obj = {
            init: () => {
              wasm.init(256);
              return obj;
            },
            update: (data2) => {
              wasm.update(data2);
              return obj;
            },
            // biome-ignore lint/suspicious/noExplicitAny: Conflict with IHasher type
            digest: (outputType) => wasm.digest(outputType),
            save: () => wasm.save(),
            load: (data2) => {
              wasm.load(data2);
              return obj;
            },
            blockSize: 64,
            digestSize: 32
          };
          return obj;
        });
      }
      var name$9 = "sha512";
      var data$9 = "AGFzbQEAAAABEQRgAAF/YAF/AGAAAGACf38AAwgHAAEBAQIAAwUEAQECAgYPAn8BQYCABAt/AEGAgAQLB4IBCQZtZW1vcnkCAA9fX3N0YWNrX3BvaW50ZXIDAA5IYXNoX0dldEJ1ZmZlcgAACUhhc2hfSW5pdAABC0hhc2hfVXBkYXRlAAIKSGFzaF9GaW5hbAAEDUhhc2hfR2V0U3RhdGUABQ5IYXNoX0NhbGN1bGF0ZQAGClNUQVRFX1NJWkUDAQrgaQcGAEGAgQQLmwIAQQBCADcDgIIFQQBBMEHAACAAQYADRiIAGzYCyIIFQQBCpJ/p99uD0trHAEL5wvibkaOz8NsAIAAbNwPAggVBAEKnn+an1sGLhltC6/qG2r+19sEfIAAbNwO4ggVBAEKRquDC9tCS2o5/Qp/Y+dnCkdqCm38gABs3A7CCBUEAQrGWgP7/zMmZ5wBC0YWa7/rPlIfRACAAGzcDqIIFQQBCubK5uI+b+5cVQvHt9Pilp/2npX8gABs3A6CCBUEAQpe6w4Ojq8CskX9Cq/DT9K/uvLc8IAAbNwOYggVBAEKHqvOzo6WKzeIAQrvOqqbY0Ouzu38gABs3A5CCBUEAQti9lojcq+fdS0KIkvOd/8z5hOoAIAAbNwOIggUL+gICAX4Hf0EAQQApA4CCBSIBIACtfDcDgIIFAkACQAJAIAGnQf8AcSICDQBBgIEEIQMMAQsgAEGAASACayIESSEFAkAgAEUNACAAIAQgBRsiA0EDcSEGIAJBgIEFaiEHQQAhAgJAIANBBEkNACADQfwBcSEIQQAhAgNAIAcgAmoiAyACQYCBBGotAAA6AAAgA0EBaiACQYGBBGotAAA6AAAgA0ECaiACQYKBBGotAAA6AAAgA0EDaiACQYOBBGotAAA6AAAgCCACQQRqIgJHDQALIAZFDQELA0AgByACaiACQYCBBGotAAA6AAAgAkEBaiECIAZBf2oiBg0ACwsgBQ0BQYCBBRADIAAgBGshACAEQYCBBGohAwsCQCAAQYABSQ0AA0AgAxADIANBgAFqIQMgAEGAf2oiAEH/AEsNAAsLIABFDQBBACEGQQAhAgNAIAJBgIEFaiADIAJqLQAAOgAAIAJBAWohAiAAIAZBAWoiBkH/AXFLDQALCwvcVgFWfkEAIAApAwgiAUI4hiABQoD+A4NCKIaEIAFCgID8B4NCGIYgAUKAgID4D4NCCIaEhCABQgiIQoCAgPgPgyABQhiIQoCA/AeDhCABQiiIQoD+A4MgAUI4iISEhCICQj+JIAJCOImFIAJCB4iFIAApAwAiAUI4hiABQoD+A4NCKIaEIAFCgID8B4NCGIYgAUKAgID4D4NCCIaEhCABQgiIQoCAgPgPgyABQhiIQoCA/AeDhCABQiiIQoD+A4MgAUI4iISEhCIDfCAAKQNIIgFCOIYgAUKA/gODQiiGhCABQoCA/AeDQhiGIAFCgICA+A+DQgiGhIQgAUIIiEKAgID4D4MgAUIYiEKAgPwHg4QgAUIoiEKA/gODIAFCOIiEhIQiBHwgACkDcCIBQjiGIAFCgP4Dg0IohoQgAUKAgPwHg0IYhiABQoCAgPgPg0IIhoSEIAFCCIhCgICA+A+DIAFCGIhCgID8B4OEIAFCKIhCgP4DgyABQjiIhISEIgVCLYkgBUIDiYUgBUIGiIV8IgZCP4kgBkI4iYUgBkIHiIUgACkDeCIBQjiGIAFCgP4Dg0IohoQgAUKAgPwHg0IYhiABQoCAgPgPg0IIhoSEIAFCCIhCgICA+A+DIAFCGIhCgID8B4OEIAFCKIhCgP4DgyABQjiIhISEIgd8IARCP4kgBEI4iYUgBEIHiIUgACkDQCIBQjiGIAFCgP4Dg0IohoQgAUKAgPwHg0IYhiABQoCAgPgPg0IIhoSEIAFCCIhCgICA+A+DIAFCGIhCgID8B4OEIAFCKIhCgP4DgyABQjiIhISEIgh8IAApAxAiAUI4hiABQoD+A4NCKIaEIAFCgID8B4NCGIYgAUKAgID4D4NCCIaEhCABQgiIQoCAgPgPgyABQhiIQoCA/AeDhCABQiiIQoD+A4MgAUI4iISEhCIJQj+JIAlCOImFIAlCB4iFIAJ8IAApA1AiAUI4hiABQoD+A4NCKIaEIAFCgID8B4NCGIYgAUKAgID4D4NCCIaEhCABQgiIQoCAgPgPgyABQhiIQoCA/AeDhCABQiiIQoD+A4MgAUI4iISEhCIKfCAHQi2JIAdCA4mFIAdCBoiFfCILfCAAKQM4IgFCOIYgAUKA/gODQiiGhCABQoCA/AeDQhiGIAFCgICA+A+DQgiGhIQgAUIIiEKAgID4D4MgAUIYiEKAgPwHg4QgAUIoiEKA/gODIAFCOIiEhIQiDEI/iSAMQjiJhSAMQgeIhSAAKQMwIgFCOIYgAUKA/gODQiiGhCABQoCA/AeDQhiGIAFCgICA+A+DQgiGhIQgAUIIiEKAgID4D4MgAUIYiEKAgPwHg4QgAUIoiEKA/gODIAFCOIiEhIQiDXwgB3wgACkDKCIBQjiGIAFCgP4Dg0IohoQgAUKAgPwHg0IYhiABQoCAgPgPg0IIhoSEIAFCCIhCgICA+A+DIAFCGIhCgID8B4OEIAFCKIhCgP4DgyABQjiIhISEIg5CP4kgDkI4iYUgDkIHiIUgACkDICIBQjiGIAFCgP4Dg0IohoQgAUKAgPwHg0IYhiABQoCAgPgPg0IIhoSEIAFCCIhCgICA+A+DIAFCGIhCgID8B4OEIAFCKIhCgP4DgyABQjiIhISEIg98IAApA2giAUI4hiABQoD+A4NCKIaEIAFCgID8B4NCGIYgAUKAgID4D4NCCIaEhCABQgiIQoCAgPgPgyABQhiIQoCA/AeDhCABQiiIQoD+A4MgAUI4iISEhCIQfCAAKQMYIgFCOIYgAUKA/gODQiiGhCABQoCA/AeDQhiGIAFCgICA+A+DQgiGhIQgAUIIiEKAgID4D4MgAUIYiEKAgPwHg4QgAUIoiEKA/gODIAFCOIiEhIQiEUI/iSARQjiJhSARQgeIhSAJfCAAKQNYIgFCOIYgAUKA/gODQiiGhCABQoCA/AeDQhiGIAFCgICA+A+DQgiGhIQgAUIIiEKAgID4D4MgAUIYiEKAgPwHg4QgAUIoiEKA/gODIAFCOIiEhIQiEnwgBkItiSAGQgOJhSAGQgaIhXwiE0ItiSATQgOJhSATQgaIhXwiFEItiSAUQgOJhSAUQgaIhXwiFUItiSAVQgOJhSAVQgaIhXwiFnwgBUI/iSAFQjiJhSAFQgeIhSAQfCAVfCAAKQNgIgFCOIYgAUKA/gODQiiGhCABQoCA/AeDQhiGIAFCgICA+A+DQgiGhIQgAUIIiEKAgID4D4MgAUIYiEKAgPwHg4QgAUIoiEKA/gODIAFCOIiEhIQiF0I/iSAXQjiJhSAXQgeIhSASfCAUfCAKQj+JIApCOImFIApCB4iFIAR8IBN8IAhCP4kgCEI4iYUgCEIHiIUgDHwgBnwgDUI/iSANQjiJhSANQgeIhSAOfCAFfCAPQj+JIA9COImFIA9CB4iFIBF8IBd8IAtCLYkgC0IDiYUgC0IGiIV8IhhCLYkgGEIDiYUgGEIGiIV8IhlCLYkgGUIDiYUgGUIGiIV8IhpCLYkgGkIDiYUgGkIGiIV8IhtCLYkgG0IDiYUgG0IGiIV8IhxCLYkgHEIDiYUgHEIGiIV8Ih1CLYkgHUIDiYUgHUIGiIV8Ih5CP4kgHkI4iYUgHkIHiIUgB0I/iSAHQjiJhSAHQgeIhSAFfCAafCAQQj+JIBBCOImFIBBCB4iFIBd8IBl8IBJCP4kgEkI4iYUgEkIHiIUgCnwgGHwgFkItiSAWQgOJhSAWQgaIhXwiH0ItiSAfQgOJhSAfQgaIhXwiIEItiSAgQgOJhSAgQgaIhXwiIXwgFkI/iSAWQjiJhSAWQgeIhSAafCALQj+JIAtCOImFIAtCB4iFIAZ8IBt8ICFCLYkgIUIDiYUgIUIGiIV8IiJ8IBVCP4kgFUI4iYUgFUIHiIUgGXwgIXwgFEI/iSAUQjiJhSAUQgeIhSAYfCAgfCATQj+JIBNCOImFIBNCB4iFIAt8IB98IB5CLYkgHkIDiYUgHkIGiIV8IiNCLYkgI0IDiYUgI0IGiIV8IiRCLYkgJEIDiYUgJEIGiIV8IiVCLYkgJUIDiYUgJUIGiIV8IiZ8IB1CP4kgHUI4iYUgHUIHiIUgIHwgJXwgHEI/iSAcQjiJhSAcQgeIhSAffCAkfCAbQj+JIBtCOImFIBtCB4iFIBZ8ICN8IBpCP4kgGkI4iYUgGkIHiIUgFXwgHnwgGUI/iSAZQjiJhSAZQgeIhSAUfCAdfCAYQj+JIBhCOImFIBhCB4iFIBN8IBx8ICJCLYkgIkIDiYUgIkIGiIV8IidCLYkgJ0IDiYUgJ0IGiIV8IihCLYkgKEIDiYUgKEIGiIV8IilCLYkgKUIDiYUgKUIGiIV8IipCLYkgKkIDiYUgKkIGiIV8IitCLYkgK0IDiYUgK0IGiIV8IixCLYkgLEIDiYUgLEIGiIV8Ii1CP4kgLUI4iYUgLUIHiIUgIUI/iSAhQjiJhSAhQgeIhSAdfCApfCAgQj+JICBCOImFICBCB4iFIBx8ICh8IB9CP4kgH0I4iYUgH0IHiIUgG3wgJ3wgJkItiSAmQgOJhSAmQgaIhXwiLkItiSAuQgOJhSAuQgaIhXwiL0ItiSAvQgOJhSAvQgaIhXwiMHwgJkI/iSAmQjiJhSAmQgeIhSApfCAiQj+JICJCOImFICJCB4iFIB58ICp8IDBCLYkgMEIDiYUgMEIGiIV8IjF8ICVCP4kgJUI4iYUgJUIHiIUgKHwgMHwgJEI/iSAkQjiJhSAkQgeIhSAnfCAvfCAjQj+JICNCOImFICNCB4iFICJ8IC58IC1CLYkgLUIDiYUgLUIGiIV8IjJCLYkgMkIDiYUgMkIGiIV8IjNCLYkgM0IDiYUgM0IGiIV8IjRCLYkgNEIDiYUgNEIGiIV8IjV8ICxCP4kgLEI4iYUgLEIHiIUgL3wgNHwgK0I/iSArQjiJhSArQgeIhSAufCAzfCAqQj+JICpCOImFICpCB4iFICZ8IDJ8IClCP4kgKUI4iYUgKUIHiIUgJXwgLXwgKEI/iSAoQjiJhSAoQgeIhSAkfCAsfCAnQj+JICdCOImFICdCB4iFICN8ICt8IDFCLYkgMUIDiYUgMUIGiIV8IjZCLYkgNkIDiYUgNkIGiIV8IjdCLYkgN0IDiYUgN0IGiIV8IjhCLYkgOEIDiYUgOEIGiIV8IjlCLYkgOUIDiYUgOUIGiIV8IjpCLYkgOkIDiYUgOkIGiIV8IjtCLYkgO0IDiYUgO0IGiIV8IjxCP4kgPEI4iYUgPEIHiIUgMEI/iSAwQjiJhSAwQgeIhSAsfCA4fCAvQj+JIC9COImFIC9CB4iFICt8IDd8IC5CP4kgLkI4iYUgLkIHiIUgKnwgNnwgNUItiSA1QgOJhSA1QgaIhXwiPUItiSA9QgOJhSA9QgaIhXwiPkItiSA+QgOJhSA+QgaIhXwiP3wgNUI/iSA1QjiJhSA1QgeIhSA4fCAxQj+JIDFCOImFIDFCB4iFIC18IDl8ID9CLYkgP0IDiYUgP0IGiIV8IkB8IDRCP4kgNEI4iYUgNEIHiIUgN3wgP3wgM0I/iSAzQjiJhSAzQgeIhSA2fCA+fCAyQj+JIDJCOImFIDJCB4iFIDF8ID18IDxCLYkgPEIDiYUgPEIGiIV8IkFCLYkgQUIDiYUgQUIGiIV8IkJCLYkgQkIDiYUgQkIGiIV8IkNCLYkgQ0IDiYUgQ0IGiIV8IkR8IDtCP4kgO0I4iYUgO0IHiIUgPnwgQ3wgOkI/iSA6QjiJhSA6QgeIhSA9fCBCfCA5Qj+JIDlCOImFIDlCB4iFIDV8IEF8IDhCP4kgOEI4iYUgOEIHiIUgNHwgPHwgN0I/iSA3QjiJhSA3QgeIhSAzfCA7fCA2Qj+JIDZCOImFIDZCB4iFIDJ8IDp8IEBCLYkgQEIDiYUgQEIGiIV8IkVCLYkgRUIDiYUgRUIGiIV8IkZCLYkgRkIDiYUgRkIGiIV8IkdCLYkgR0IDiYUgR0IGiIV8IkhCLYkgSEIDiYUgSEIGiIV8IklCLYkgSUIDiYUgSUIGiIV8IkpCLYkgSkIDiYUgSkIGiIV8IksgSSBFID8gPSAyICwgKiAiICAgFiAGIBcgCEEAKQOoggUiTEIyiSBMQi6JhSBMQheJhUEAKQPAggUiTXxBACkDuIIFIk5BACkDsIIFIk+FIEyDIE6FfCADfEKi3KK5jfOLxcIAfCIDQQApA6CCBSJQfCIBIA98IEwgEXwgTyAJfCBOIAJ8IAEgTyBMhYMgT4V8IAFCMokgAUIuiYUgAUIXiYV8Qs3LvZ+SktGb8QB8IlFBACkDmIIFIlJ8IgkgASBMhYMgTIV8IAlCMokgCUIuiYUgCUIXiYV8Qq/2tOL++b7gtX98IlNBACkDkIIFIlR8Ig8gCSABhYMgAYV8IA9CMokgD0IuiYUgD0IXiYV8Qry3p4zY9PbaaXwiVUEAKQOIggUiAXwiESAPIAmFgyAJhXwgEUIyiSARQi6JhSARQheJhXxCuOqimr/LsKs5fCJWIFIgVCABhYMgVCABg4UgAUIkiSABQh6JhSABQhmJhXwgA3wiAnwiA3wgDCARfCANIA98IA4gCXwgAyARIA+FgyAPhXwgA0IyiSADQi6JhSADQheJhXxCmaCXsJu+xPjZAHwiDSACIAGFIFSDIAIgAYOFIAJCJIkgAkIeiYUgAkIZiYV8IFF8Igl8IgggAyARhYMgEYV8IAhCMokgCEIuiYUgCEIXiYV8Qpuf5fjK1OCfkn98Ig4gCSAChSABgyAJIAKDhSAJQiSJIAlCHomFIAlCGYmFfCBTfCIPfCIRIAggA4WDIAOFfCARQjKJIBFCLomFIBFCF4mFfEKYgrbT3dqXjqt/fCJRIA8gCYUgAoMgDyAJg4UgD0IkiSAPQh6JhSAPQhmJhXwgVXwiAnwiAyARIAiFgyAIhXwgA0IyiSADQi6JhSADQheJhXxCwoSMmIrT6oNYfCJTIAIgD4UgCYMgAiAPg4UgAkIkiSACQh6JhSACQhmJhXwgVnwiCXwiDHwgEiADfCAKIBF8IAQgCHwgDCADIBGFgyARhXwgDEIyiSAMQi6JhSAMQheJhXxCvt/Bq5Tg1sESfCIEIAkgAoUgD4MgCSACg4UgCUIkiSAJQh6JhSAJQhmJhXwgDXwiD3wiESAMIAOFgyADhXwgEUIyiSARQi6JhSARQheJhXxCjOWS9+S34ZgkfCIKIA8gCYUgAoMgDyAJg4UgD0IkiSAPQh6JhSAPQhmJhXwgDnwiAnwiAyARIAyFgyAMhXwgA0IyiSADQi6JhSADQheJhXxC4un+r724n4bVAHwiEiACIA+FIAmDIAIgD4OFIAJCJIkgAkIeiYUgAkIZiYV8IFF8Igl8IgggAyARhYMgEYV8IAhCMokgCEIuiYUgCEIXiYV8Qu+S7pPPrpff8gB8IhcgCSAChSAPgyAJIAKDhSAJQiSJIAlCHomFIAlCGYmFfCBTfCIPfCIMfCAHIAh8IAUgA3wgECARfCAMIAggA4WDIAOFfCAMQjKJIAxCLomFIAxCF4mFfEKxrdrY47+s74B/fCIDIA8gCYUgAoMgDyAJg4UgD0IkiSAPQh6JhSAPQhmJhXwgBHwiBXwiAiAMIAiFgyAIhXwgAkIyiSACQi6JhSACQheJhXxCtaScrvLUge6bf3wiCCAFIA+FIAmDIAUgD4OFIAVCJIkgBUIeiYUgBUIZiYV8IAp8IgZ8IgkgAiAMhYMgDIV8IAlCMokgCUIuiYUgCUIXiYV8QpTNpPvMrvzNQXwiDCAGIAWFIA+DIAYgBYOFIAZCJIkgBkIeiYUgBkIZiYV8IBJ8Igd8Ig8gCSAChYMgAoV8IA9CMokgD0IuiYUgD0IXiYV8QtKVxfeZuNrNZHwiBCAHIAaFIAWDIAcgBoOFIAdCJIkgB0IeiYUgB0IZiYV8IBd8IgV8IhEgFHwgGCAPfCATIAl8IAsgAnwgESAPIAmFgyAJhXwgEUIyiSARQi6JhSARQheJhXxC48u8wuPwkd9vfCICIAUgB4UgBoMgBSAHg4UgBUIkiSAFQh6JhSAFQhmJhXwgA3wiBnwiCyARIA+FgyAPhXwgC0IyiSALQi6JhSALQheJhXxCtauz3Oi45+APfCIJIAYgBYUgB4MgBiAFg4UgBkIkiSAGQh6JhSAGQhmJhXwgCHwiB3wiEyALIBGFgyARhXwgE0IyiSATQi6JhSATQheJhXxC5biyvce5qIYkfCIPIAcgBoUgBYMgByAGg4UgB0IkiSAHQh6JhSAHQhmJhXwgDHwiBXwiFCATIAuFgyALhXwgFEIyiSAUQi6JhSAUQheJhXxC9YSsyfWNy/QtfCIRIAUgB4UgBoMgBSAHg4UgBUIkiSAFQh6JhSAFQhmJhXwgBHwiBnwiGHwgGiAUfCAVIBN8IBkgC3wgGCAUIBOFgyAThXwgGEIyiSAYQi6JhSAYQheJhXxCg8mb9aaVobrKAHwiFiAGIAWFIAeDIAYgBYOFIAZCJIkgBkIeiYUgBkIZiYV8IAJ8Igd8IgsgGCAUhYMgFIV8IAtCMokgC0IuiYUgC0IXiYV8QtT3h+rLu6rY3AB8IhkgByAGhSAFgyAHIAaDhSAHQiSJIAdCHomFIAdCGYmFfCAJfCIFfCITIAsgGIWDIBiFfCATQjKJIBNCLomFIBNCF4mFfEK1p8WYqJvi/PYAfCIYIAUgB4UgBoMgBSAHg4UgBUIkiSAFQh6JhSAFQhmJhXwgD3wiBnwiFCATIAuFgyALhXwgFEIyiSAUQi6JhSAUQheJhXxCq7+b866qlJ+Yf3wiGiAGIAWFIAeDIAYgBYOFIAZCJIkgBkIeiYUgBkIZiYV8IBF8Igd8IhV8IBwgFHwgHyATfCAbIAt8IBUgFCAThYMgE4V8IBVCMokgFUIuiYUgFUIXiYV8QpDk0O3SzfGYqH98IhsgByAGhSAFgyAHIAaDhSAHQiSJIAdCHomFIAdCGYmFfCAWfCIFfCILIBUgFIWDIBSFfCALQjKJIAtCLomFIAtCF4mFfEK/wuzHifnJgbB/fCIWIAUgB4UgBoMgBSAHg4UgBUIkiSAFQh6JhSAFQhmJhXwgGXwiBnwiEyALIBWFgyAVhXwgE0IyiSATQi6JhSATQheJhXxC5J289/v436y/f3wiGSAGIAWFIAeDIAYgBYOFIAZCJIkgBkIeiYUgBkIZiYV8IBh8Igd8IhQgEyALhYMgC4V8IBRCMokgFEIuiYUgFEIXiYV8QsKfou2z/oLwRnwiGCAHIAaFIAWDIAcgBoOFIAdCJIkgB0IeiYUgB0IZiYV8IBp8IgV8IhV8IB4gFHwgISATfCAdIAt8IBUgFCAThYMgE4V8IBVCMokgFUIuiYUgFUIXiYV8QqXOqpj5qOTTVXwiGiAFIAeFIAaDIAUgB4OFIAVCJIkgBUIeiYUgBUIZiYV8IBt8IgZ8IgsgFSAUhYMgFIV8IAtCMokgC0IuiYUgC0IXiYV8Qu+EjoCe6pjlBnwiGyAGIAWFIAeDIAYgBYOFIAZCJIkgBkIeiYUgBkIZiYV8IBZ8Igd8IhMgCyAVhYMgFYV8IBNCMokgE0IuiYUgE0IXiYV8QvDcudDwrMqUFHwiFiAHIAaFIAWDIAcgBoOFIAdCJIkgB0IeiYUgB0IZiYV8IBl8IgV8IhQgEyALhYMgC4V8IBRCMokgFEIuiYUgFEIXiYV8QvzfyLbU0MLbJ3wiGSAFIAeFIAaDIAUgB4OFIAVCJIkgBUIeiYUgBUIZiYV8IBh8IgZ8IhUgKHwgJCAUfCAnIBN8ICMgC3wgFSAUIBOFgyAThXwgFUIyiSAVQi6JhSAVQheJhXxCppKb4YWnyI0ufCIYIAYgBYUgB4MgBiAFg4UgBkIkiSAGQh6JhSAGQhmJhXwgGnwiB3wiCyAVIBSFgyAUhXwgC0IyiSALQi6JhSALQheJhXxC7dWQ1sW/m5bNAHwiGiAHIAaFIAWDIAcgBoOFIAdCJIkgB0IeiYUgB0IZiYV8IBt8IgV8IhMgCyAVhYMgFYV8IBNCMokgE0IuiYUgE0IXiYV8Qt/n1uy5ooOc0wB8IhsgBSAHhSAGgyAFIAeDhSAFQiSJIAVCHomFIAVCGYmFfCAWfCIGfCIUIBMgC4WDIAuFfCAUQjKJIBRCLomFIBRCF4mFfELex73dyOqcheUAfCIWIAYgBYUgB4MgBiAFg4UgBkIkiSAGQh6JhSAGQhmJhXwgGXwiB3wiFXwgJiAUfCApIBN8ICUgC3wgFSAUIBOFgyAThXwgFUIyiSAVQi6JhSAVQheJhXxCqOXe47PXgrX2AHwiGSAHIAaFIAWDIAcgBoOFIAdCJIkgB0IeiYUgB0IZiYV8IBh8IgV8IgsgFSAUhYMgFIV8IAtCMokgC0IuiYUgC0IXiYV8Qubdtr/kpbLhgX98IhggBSAHhSAGgyAFIAeDhSAFQiSJIAVCHomFIAVCGYmFfCAafCIGfCITIAsgFYWDIBWFfCATQjKJIBNCLomFIBNCF4mFfEK76oik0ZCLuZJ/fCIaIAYgBYUgB4MgBiAFg4UgBkIkiSAGQh6JhSAGQhmJhXwgG3wiB3wiFCATIAuFgyALhXwgFEIyiSAUQi6JhSAUQheJhXxC5IbE55SU+t+if3wiGyAHIAaFIAWDIAcgBoOFIAdCJIkgB0IeiYUgB0IZiYV8IBZ8IgV8IhV8IC8gFHwgKyATfCAuIAt8IBUgFCAThYMgE4V8IBVCMokgFUIuiYUgFUIXiYV8QoHgiOK7yZmNqH98IhYgBSAHhSAGgyAFIAeDhSAFQiSJIAVCHomFIAVCGYmFfCAZfCIGfCILIBUgFIWDIBSFfCALQjKJIAtCLomFIAtCF4mFfEKRr+KHje7ipUJ8IhkgBiAFhSAHgyAGIAWDhSAGQiSJIAZCHomFIAZCGYmFfCAYfCIHfCITIAsgFYWDIBWFfCATQjKJIBNCLomFIBNCF4mFfEKw/NKysLSUtkd8IhggByAGhSAFgyAHIAaDhSAHQiSJIAdCHomFIAdCGYmFfCAafCIFfCIUIBMgC4WDIAuFfCAUQjKJIBRCLomFIBRCF4mFfEKYpL23nYO6yVF8IhogBSAHhSAGgyAFIAeDhSAFQiSJIAVCHomFIAVCGYmFfCAbfCIGfCIVfCAxIBR8IC0gE3wgMCALfCAVIBQgE4WDIBOFfCAVQjKJIBVCLomFIBVCF4mFfEKQ0parxcTBzFZ8IhsgBiAFhSAHgyAGIAWDhSAGQiSJIAZCHomFIAZCGYmFfCAWfCIHfCILIBUgFIWDIBSFfCALQjKJIAtCLomFIAtCF4mFfEKqwMS71bCNh3R8IhYgByAGhSAFgyAHIAaDhSAHQiSJIAdCHomFIAdCGYmFfCAZfCIFfCITIAsgFYWDIBWFfCATQjKJIBNCLomFIBNCF4mFfEK4o++Vg46otRB8IhkgBSAHhSAGgyAFIAeDhSAFQiSJIAVCHomFIAVCGYmFfCAYfCIGfCIUIBMgC4WDIAuFfCAUQjKJIBRCLomFIBRCF4mFfELIocvG66Kw0hl8IhggBiAFhSAHgyAGIAWDhSAGQiSJIAZCHomFIAZCGYmFfCAafCIHfCIVIDR8IDcgFHwgMyATfCA2IAt8IBUgFCAThYMgE4V8IBVCMokgFUIuiYUgFUIXiYV8QtPWhoqFgdubHnwiGiAHIAaFIAWDIAcgBoOFIAdCJIkgB0IeiYUgB0IZiYV8IBt8IgV8IgsgFSAUhYMgFIV8IAtCMokgC0IuiYUgC0IXiYV8QpnXu/zN6Z2kJ3wiGyAFIAeFIAaDIAUgB4OFIAVCJIkgBUIeiYUgBUIZiYV8IBZ8IgZ8IhMgCyAVhYMgFYV8IBNCMokgE0IuiYUgE0IXiYV8QqiR7Yzelq/YNHwiFiAGIAWFIAeDIAYgBYOFIAZCJIkgBkIeiYUgBkIZiYV8IBl8Igd8IhQgEyALhYMgC4V8IBRCMokgFEIuiYUgFEIXiYV8QuO0pa68loOOOXwiGSAHIAaFIAWDIAcgBoOFIAdCJIkgB0IeiYUgB0IZiYV8IBh8IgV8IhV8IDkgFHwgNSATfCA4IAt8IBUgFCAThYMgE4V8IBVCMokgFUIuiYUgFUIXiYV8QsuVhpquyarszgB8IhggBSAHhSAGgyAFIAeDhSAFQiSJIAVCHomFIAVCGYmFfCAafCIGfCILIBUgFIWDIBSFfCALQjKJIAtCLomFIAtCF4mFfELzxo+798myztsAfCIaIAYgBYUgB4MgBiAFg4UgBkIkiSAGQh6JhSAGQhmJhXwgG3wiB3wiEyALIBWFgyAVhXwgE0IyiSATQi6JhSATQheJhXxCo/HKtb3+m5foAHwiGyAHIAaFIAWDIAcgBoOFIAdCJIkgB0IeiYUgB0IZiYV8IBZ8IgV8IhQgEyALhYMgC4V8IBRCMokgFEIuiYUgFEIXiYV8Qvzlvu/l3eDH9AB8IhYgBSAHhSAGgyAFIAeDhSAFQiSJIAVCHomFIAVCGYmFfCAZfCIGfCIVfCA7IBR8ID4gE3wgOiALfCAVIBQgE4WDIBOFfCAVQjKJIBVCLomFIBVCF4mFfELg3tyY9O3Y0vgAfCIZIAYgBYUgB4MgBiAFg4UgBkIkiSAGQh6JhSAGQhmJhXwgGHwiB3wiCyAVIBSFgyAUhXwgC0IyiSALQi6JhSALQheJhXxC8tbCj8qCnuSEf3wiGCAHIAaFIAWDIAcgBoOFIAdCJIkgB0IeiYUgB0IZiYV8IBp8IgV8IhMgCyAVhYMgFYV8IBNCMokgE0IuiYUgE0IXiYV8QuzzkNOBwcDjjH98IhogBSAHhSAGgyAFIAeDhSAFQiSJIAVCHomFIAVCGYmFfCAbfCIGfCIUIBMgC4WDIAuFfCAUQjKJIBRCLomFIBRCF4mFfEKovIybov+/35B/fCIbIAYgBYUgB4MgBiAFg4UgBkIkiSAGQh6JhSAGQhmJhXwgFnwiB3wiFXwgQSAUfCBAIBN8IDwgC3wgFSAUIBOFgyAThXwgFUIyiSAVQi6JhSAVQheJhXxC6fuK9L2dm6ikf3wiFiAHIAaFIAWDIAcgBoOFIAdCJIkgB0IeiYUgB0IZiYV8IBl8IgV8IgsgFSAUhYMgFIV8IAtCMokgC0IuiYUgC0IXiYV8QpXymZb7/uj8vn98IhkgBSAHhSAGgyAFIAeDhSAFQiSJIAVCHomFIAVCGYmFfCAYfCIGfCITIAsgFYWDIBWFfCATQjKJIBNCLomFIBNCF4mFfEKrpsmbrp7euEZ8IhggBiAFhSAHgyAGIAWDhSAGQiSJIAZCHomFIAZCGYmFfCAafCIHfCIUIBMgC4WDIAuFfCAUQjKJIBRCLomFIBRCF4mFfEKcw5nR7tnPk0p8IhogByAGhSAFgyAHIAaDhSAHQiSJIAdCHomFIAdCGYmFfCAbfCIFfCIVIEd8IEMgFHwgRiATfCBCIAt8IBUgFCAThYMgE4V8IBVCMokgFUIuiYUgFUIXiYV8QoeEg47ymK7DUXwiGyAFIAeFIAaDIAUgB4OFIAVCJIkgBUIeiYUgBUIZiYV8IBZ8IgZ8IgsgFSAUhYMgFIV8IAtCMokgC0IuiYUgC0IXiYV8Qp7Wg+/sup/tanwiFiAGIAWFIAeDIAYgBYOFIAZCJIkgBkIeiYUgBkIZiYV8IBl8Igd8IhMgCyAVhYMgFYV8IBNCMokgE0IuiYUgE0IXiYV8Qviiu/P+79O+dXwiGSAHIAaFIAWDIAcgBoOFIAdCJIkgB0IeiYUgB0IZiYV8IBh8IgV8IhQgEyALhYMgC4V8IBRCMokgFEIuiYUgFEIXiYV8Qrrf3ZCn9Zn4BnwiHCAFIAeFIAaDIAUgB4OFIAVCJIkgBUIeiYUgBUIZiYV8IBp8IgZ8IhV8ID1CP4kgPUI4iYUgPUIHiIUgOXwgRXwgREItiSBEQgOJhSBEQgaIhXwiGCAUfCBIIBN8IEQgC3wgFSAUIBOFgyAThXwgFUIyiSAVQi6JhSAVQheJhXxCprGiltq437EKfCIaIAYgBYUgB4MgBiAFg4UgBkIkiSAGQh6JhSAGQhmJhXwgG3wiB3wiCyAVIBSFgyAUhXwgC0IyiSALQi6JhSALQheJhXxCrpvk98uA5p8RfCIbIAcgBoUgBYMgByAGg4UgB0IkiSAHQh6JhSAHQhmJhXwgFnwiBXwiEyALIBWFgyAVhXwgE0IyiSATQi6JhSATQheJhXxCm47xmNHmwrgbfCIdIAUgB4UgBoMgBSAHg4UgBUIkiSAFQh6JhSAFQhmJhXwgGXwiBnwiFCATIAuFgyALhXwgFEIyiSAUQi6JhSAUQheJhXxChPuRmNL+3e0ofCIeIAYgBYUgB4MgBiAFg4UgBkIkiSAGQh6JhSAGQhmJhXwgHHwiB3wiFXwgP0I/iSA/QjiJhSA/QgeIhSA7fCBHfCA+Qj+JID5COImFID5CB4iFIDp8IEZ8IBhCLYkgGEIDiYUgGEIGiIV8IhZCLYkgFkIDiYUgFkIGiIV8IhkgFHwgSiATfCAWIAt8IBUgFCAThYMgE4V8IBVCMokgFUIuiYUgFUIXiYV8QpPJnIa076rlMnwiCyAHIAaFIAWDIAcgBoOFIAdCJIkgB0IeiYUgB0IZiYV8IBp8IgV8IhMgFSAUhYMgFIV8IBNCMokgE0IuiYUgE0IXiYV8Qrz9pq6hwa/PPHwiGiAFIAeFIAaDIAUgB4OFIAVCJIkgBUIeiYUgBUIZiYV8IBt8IgZ8IhQgEyAVhYMgFYV8IBRCMokgFEIuiYUgFEIXiYV8QsyawODJ+NmOwwB8IhsgBiAFhSAHgyAGIAWDhSAGQiSJIAZCHomFIAZCGYmFfCAdfCIHfCIVIBQgE4WDIBOFfCAVQjKJIBVCLomFIBVCF4mFfEK2hfnZ7Jf14swAfCIcIAcgBoUgBYMgByAGg4UgB0IkiSAHQh6JhSAHQhmJhXwgHnwiBXwiFiBNfDcDwIIFQQAgUCAFIAeFIAaDIAUgB4OFIAVCJIkgBUIeiYUgBUIZiYV8IAt8IgYgBYUgB4MgBiAFg4UgBkIkiSAGQh6JhSAGQhmJhXwgGnwiByAGhSAFgyAHIAaDhSAHQiSJIAdCHomFIAdCGYmFfCAbfCIFIAeFIAaDIAUgB4OFIAVCJIkgBUIeiYUgBUIZiYV8IBx8Igt8NwOgggVBACBOIEBCP4kgQEI4iYUgQEIHiIUgPHwgSHwgGUItiSAZQgOJhSAZQgaIhXwiGSATfCAWIBUgFIWDIBSFfCAWQjKJIBZCLomFIBZCF4mFfEKq/JXjz7PKv9kAfCIaIAZ8IhN8NwO4ggVBACBSIAsgBYUgB4MgCyAFg4UgC0IkiSALQh6JhSALQhmJhXwgGnwiBnw3A5iCBUEAIE8gQUI/iSBBQjiJhSBBQgeIhSBAfCAYfCBLQi2JIEtCA4mFIEtCBoiFfCAUfCATIBYgFYWDIBWFfCATQjKJIBNCLomFIBNCF4mFfELs9dvWs/Xb5d8AfCIYIAd8IhR8NwOwggVBACBUIAYgC4UgBYMgBiALg4UgBkIkiSAGQh6JhSAGQhmJhXwgGHwiB3w3A5CCBUEAIEwgRUI/iSBFQjiJhSBFQgeIhSBBfCBJfCAZQi2JIBlCA4mFIBlCBoiFfCAVfCAUIBMgFoWDIBaFfCAUQjKJIBRCLomFIBRCF4mFfEKXsJ3SxLGGouwAfCITIAV8fDcDqIIFQQAgASAHIAaFIAuDIAcgBoOFIAdCJIkgB0IeiYUgB0IZiYV8IBN8fDcDiIIFC7ULAgF+BH9BACkDgIIFIgCnQQN2QQ9xIgFBA3QiAiACKQOAgQVCfyAAQgOGIgCGQn+Fg0KAASAAhoU3A4CBBSABQQFqIQMCQAJAAkAgAUEOSQ0AAkAgA0EPRw0AQQBCADcD+IEFC0GAgQUQA0EAIQRBACEDDAELIAMhASADQQdxIgRBB0YNAQsgA0EDdEGAgQVqIQFBACECA0AgAUIANwMAIAFBCGohASAEIAJBAWoiAnNBB0cNAAsgAyACaiEBCwJAIANBeGpBB0kNAAJAQQcgAWsiBEEIcQ0AIAFBA3QiAkIANwO4gQUgAkIANwOwgQUgAkIANwOogQUgAkIANwOggQUgAkIANwOYgQUgAkIANwOQgQUgAkIANwOIgQUgAkIANwOAgQUgBEEISQ0BIAFBCGohAQsgAUEDdEGAgQVqIQEDQCABQgA3AwAgAUH4AGpCADcDACABQfAAakIANwMAIAFB6ABqQgA3AwAgAUHgAGpCADcDACABQdgAakIANwMAIAFB0ABqQgA3AwAgAUHIAGpCADcDACABQcAAakIANwMAIAFBOGpCADcDACABQTBqQgA3AwAgAUEoakIANwMAIAFBIGpCADcDACABQRhqQgA3AwAgAUEQakIANwMAIAFBCGpCADcDACABQYABaiEBDAALC0EAIQJBAEEAKQOAggUiAEI7hiAAQiuGQoCAgICAgMD/AIOEIABCG4ZCgICAgIDgP4MgAEILhkKAgICA8B+DhIQgAEIFiEKAgID4D4MgAEIViEKAgPwHg4QgAEIliEKA/gODIABCA4ZCOIiEhIQ3A/iBBUGAgQUQA0EAQQApA8CCBSIAQjiGIABCgP4Dg0IohoQgAEKAgPwHg0IYhiAAQoCAgPgPg0IIhoSEIABCCIhCgICA+A+DIABCGIhCgID8B4OEIABCKIhCgP4DgyAAQjiIhISENwPAggVBAEEAKQO4ggUiAEI4hiAAQoD+A4NCKIaEIABCgID8B4NCGIYgAEKAgID4D4NCCIaEhCAAQgiIQoCAgPgPgyAAQhiIQoCA/AeDhCAAQiiIQoD+A4MgAEI4iISEhDcDuIIFQQBBACkDsIIFIgBCOIYgAEKA/gODQiiGhCAAQoCA/AeDQhiGIABCgICA+A+DQgiGhIQgAEIIiEKAgID4D4MgAEIYiEKAgPwHg4QgAEIoiEKA/gODIABCOIiEhIQ3A7CCBUEAQQApA6iCBSIAQjiGIABCgP4Dg0IohoQgAEKAgPwHg0IYhiAAQoCAgPgPg0IIhoSEIABCCIhCgICA+A+DIABCGIhCgID8B4OEIABCKIhCgP4DgyAAQjiIhISENwOoggVBAEEAKQOgggUiAEI4hiAAQoD+A4NCKIaEIABCgID8B4NCGIYgAEKAgID4D4NCCIaEhCAAQgiIQoCAgPgPgyAAQhiIQoCA/AeDhCAAQiiIQoD+A4MgAEI4iISEhDcDoIIFQQBBACkDmIIFIgBCOIYgAEKA/gODQiiGhCAAQoCA/AeDQhiGIABCgICA+A+DQgiGhIQgAEIIiEKAgID4D4MgAEIYiEKAgPwHg4QgAEIoiEKA/gODIABCOIiEhIQ3A5iCBUEAQQApA5CCBSIAQjiGIABCgP4Dg0IohoQgAEKAgPwHg0IYhiAAQoCAgPgPg0IIhoSEIABCCIhCgICA+A+DIABCGIhCgID8B4OEIABCKIhCgP4DgyAAQjiIhISENwOQggVBAEEAKQOIggUiAEI4hiAAQoD+A4NCKIaEIABCgID8B4NCGIYgAEKAgID4D4NCCIaEhCAAQgiIQoCAgPgPgyAAQhiIQoCA/AeDhCAAQiiIQoD+A4MgAEI4iISEhDcDiIIFAkBBACgCyIIFIgRFDQBBACEBA0AgAUGAgQRqIAFBiIIFai0AADoAACABQQFqIQEgBCACQQFqIgJB/wFxSw0ACwsLBgBBgIEFC6ECAEEAQgA3A4CCBUEAQTBBwAAgAUGAA0YiARs2AsiCBUEAQqSf6ffbg9LaxwBC+cL4m5Gjs/DbACABGzcDwIIFQQBCp5/mp9bBi4ZbQuv6htq/tfbBHyABGzcDuIIFQQBCkargwvbQktqOf0Kf2PnZwpHagpt/IAEbNwOwggVBAEKxloD+/8zJmecAQtGFmu/6z5SH0QAgARs3A6iCBUEAQrmyubiPm/uXFULx7fT4paf9p6V/IAEbNwOgggVBAEKXusODo6vArJF/Qqvw0/Sv7ry3PCABGzcDmIIFQQBCh6rzs6Olis3iAEK7zqqm2NDrs7t/IAEbNwOQggVBAELYvZaI3Kvn3UtCiJLznf/M+YTqACABGzcDiIIFIAAQAhAECwsMAQBBgIAECwTQAAAA";
      var hash$9 = "922e1bd0";
      var wasmJson$9 = {
        name: name$9,
        data: data$9,
        hash: hash$9
      };
      const mutex$8 = new Mutex();
      let wasmCache$8 = null;
      function sha384(data2) {
        if (wasmCache$8 === null) {
          return lockedCreate(mutex$8, wasmJson$9, 48).then((wasm) => {
            wasmCache$8 = wasm;
            return wasmCache$8.calculate(data2, 384);
          });
        }
        try {
          const hash2 = wasmCache$8.calculate(data2, 384);
          return Promise.resolve(hash2);
        } catch (err) {
          return Promise.reject(err);
        }
      }
      function createSHA384() {
        return WASMInterface(wasmJson$9, 48).then((wasm) => {
          wasm.init(384);
          const obj = {
            init: () => {
              wasm.init(384);
              return obj;
            },
            update: (data2) => {
              wasm.update(data2);
              return obj;
            },
            // biome-ignore lint/suspicious/noExplicitAny: Conflict with IHasher type
            digest: (outputType) => wasm.digest(outputType),
            save: () => wasm.save(),
            load: (data2) => {
              wasm.load(data2);
              return obj;
            },
            blockSize: 128,
            digestSize: 48
          };
          return obj;
        });
      }
      const mutex$7 = new Mutex();
      let wasmCache$7 = null;
      function sha512(data2) {
        if (wasmCache$7 === null) {
          return lockedCreate(mutex$7, wasmJson$9, 64).then((wasm) => {
            wasmCache$7 = wasm;
            return wasmCache$7.calculate(data2, 512);
          });
        }
        try {
          const hash2 = wasmCache$7.calculate(data2, 512);
          return Promise.resolve(hash2);
        } catch (err) {
          return Promise.reject(err);
        }
      }
      function createSHA512() {
        return WASMInterface(wasmJson$9, 64).then((wasm) => {
          wasm.init(512);
          const obj = {
            init: () => {
              wasm.init(512);
              return obj;
            },
            update: (data2) => {
              wasm.update(data2);
              return obj;
            },
            // biome-ignore lint/suspicious/noExplicitAny: Conflict with IHasher type
            digest: (outputType) => wasm.digest(outputType),
            save: () => wasm.save(),
            load: (data2) => {
              wasm.load(data2);
              return obj;
            },
            blockSize: 128,
            digestSize: 64
          };
          return obj;
        });
      }
      var name$8 = "xxhash32";
      var data$8 = "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";
      var hash$8 = "b857aa2d";
      var wasmJson$8 = {
        name: name$8,
        data: data$8,
        hash: hash$8
      };
      const mutex$6 = new Mutex();
      let wasmCache$6 = null;
      function validateSeed$3(seed) {
        if (!Number.isInteger(seed) || seed < 0 || seed > 4294967295) {
          return new Error("Seed must be a valid 32-bit long unsigned integer.");
        }
        return null;
      }
      function xxhash32(data2, seed = 0) {
        if (validateSeed$3(seed)) {
          return Promise.reject(validateSeed$3(seed));
        }
        if (wasmCache$6 === null) {
          return lockedCreate(mutex$6, wasmJson$8, 4).then((wasm) => {
            wasmCache$6 = wasm;
            return wasmCache$6.calculate(data2, seed);
          });
        }
        try {
          const hash2 = wasmCache$6.calculate(data2, seed);
          return Promise.resolve(hash2);
        } catch (err) {
          return Promise.reject(err);
        }
      }
      function createXXHash32(seed = 0) {
        if (validateSeed$3(seed)) {
          return Promise.reject(validateSeed$3(seed));
        }
        return WASMInterface(wasmJson$8, 4).then((wasm) => {
          wasm.init(seed);
          const obj = {
            init: () => {
              wasm.init(seed);
              return obj;
            },
            update: (data2) => {
              wasm.update(data2);
              return obj;
            },
            // biome-ignore lint/suspicious/noExplicitAny: Conflict with IHasher type
            digest: (outputType) => wasm.digest(outputType),
            save: () => wasm.save(),
            load: (data2) => {
              wasm.load(data2);
              return obj;
            },
            blockSize: 16,
            digestSize: 4
          };
          return obj;
        });
      }
      var name$7 = "xxhash64";
      var data$7 = "AGFzbQEAAAABDANgAAF/YAAAYAF/AAMHBgABAgEAAQUEAQECAgYPAn8BQYCABAt/AEGAgAQLB4IBCQZtZW1vcnkCAA9fX3N0YWNrX3BvaW50ZXIDAA5IYXNoX0dldEJ1ZmZlcgAACUhhc2hfSW5pdAABC0hhc2hfVXBkYXRlAAIKSGFzaF9GaW5hbAADDUhhc2hfR2V0U3RhdGUABA5IYXNoX0NhbGN1bGF0ZQAFClNUQVRFX1NJWkUDAQqGEQYGAEGAgQQLZAEBfkEAQgA3A8iBBUEAQQApA4CBBCIANwOQgQVBACAAQvnq0NDnyaHk4QB8NwOYgQVBACAAQs/W077Sx6vZQnw3A4iBBUEAIABC1uuC7ur9ifXgAHw3A4CBBUEAQQA2AsCBBQvQCQMFfwR+AX8CQCAARQ0AQQBBACkDyIEFIACtfDcDyIEFAkBBACgCwIEFIgEgAGpBH0sNAEGAgQQhAgJAAkAgAEEDcSIDDQAgACEDDAELA0BBAEEAKALAgQUiAUEBajYCwIEFIAEgAi0AADoAoIEFIAJBAWohAiADQX9qIgMNAAsgAEF8cSEDCyAAQQRJDQEDQEEAQQAoAsCBBSIBQQFqNgLAgQUgASACLQAAOgCggQUgAkEBai0AACEBQQBBACgCwIEFIgRBAWo2AsCBBSAEIAE6AKCBBSACQQJqLQAAIQFBAEEAKALAgQUiBEEBajYCwIEFIAQgAToAoIEFIAJBA2otAAAhAUEAQQAoAsCBBSIEQQFqNgLAgQUgBCABOgCggQUgAkEEaiECIANBfGoiAw0ADAILCyAAQeCABGohBQJAAkAgAQ0AQQApA5iBBSEGQQApA5CBBSEHQQApA4iBBSEIQQApA4CBBSEJQYCBBCECDAELQYCBBCECAkAgAUEfSw0AQYCBBCECAkACQEEAIAFrQQNxIgMNACABIQQMAQsgASEEA0AgBEGggQVqIAItAAA6AAAgBEEBaiEEIAJBAWohAiADQX9qIgMNAAsLIAFBHEsNAAJAQRwgBGsiA0EEcQ0AIARBoIEFaiACLQAAOgAAIARBoYEFaiACLQABOgAAIARBooEFaiACLQACOgAAIARBo4EFaiACLQADOgAAIAJBBGohAiADQQRJDQEgBEEEaiEEC0EAIQoDQCAEIApqIgNBoIEFaiACIApqIgEtAAA6AAAgA0GhgQVqIAFBAWotAAA6AAAgA0GigQVqIAFBAmotAAA6AAAgA0GjgQVqIAFBA2otAAA6AAAgA0GkgQVqIAFBBGotAAA6AAAgA0GlgQVqIAFBBWotAAA6AAAgA0GmgQVqIAFBBmotAAA6AAAgA0GngQVqIAFBB2otAAA6AAAgBCAKQQhqIgpqQSBHDQALIAIgCmohAgtBAEEAKQOggQVCz9bTvtLHq9lCfkEAKQOAgQV8Qh+JQoeVr6+Ytt6bnn9+Igk3A4CBBUEAQQApA6iBBULP1tO+0ser2UJ+QQApA4iBBXxCH4lCh5Wvr5i23puef34iCDcDiIEFQQBBACkDsIEFQs/W077Sx6vZQn5BACkDkIEFfEIfiUKHla+vmLbem55/fiIHNwOQgQVBAEEAKQO4gQVCz9bTvtLHq9lCfkEAKQOYgQV8Qh+JQoeVr6+Ytt6bnn9+IgY3A5iBBQsgAEGAgQRqIQMCQCACIAVLDQADQCACKQMAQs/W077Sx6vZQn4gCXxCH4lCh5Wvr5i23puef34hCSACQRhqKQMAQs/W077Sx6vZQn4gBnxCH4lCh5Wvr5i23puef34hBiACQRBqKQMAQs/W077Sx6vZQn4gB3xCH4lCh5Wvr5i23puef34hByACQQhqKQMAQs/W077Sx6vZQn4gCHxCH4lCh5Wvr5i23puef34hCCACQSBqIgIgBU0NAAsLQQAgBjcDmIEFQQAgBzcDkIEFQQAgCDcDiIEFQQAgCTcDgIEFQQAgAyACazYCwIEFIAMgAkYNAEEAIQMDQCADQaCBBWogAiADai0AADoAACADQQFqIgNBACgCwIEFSQ0ACwsLuwYCBX4FfwJAAkBBACkDyIEFIgBCIFQNAEEAKQOIgQUiAUIHiUEAKQOAgQUiAkIBiXxBACkDkIEFIgNCDIl8QQApA5iBBSIEQhKJfCACQs/W077Sx6vZQn5CH4lCh5Wvr5i23puef36FQoeVr6+Ytt6bnn9+QuPcypX8zvL1hX98IAFCz9bTvtLHq9lCfkIfiUKHla+vmLbem55/foVCh5Wvr5i23puef35C49zKlfzO8vWFf3wgA0LP1tO+0ser2UJ+Qh+JQoeVr6+Ytt6bnn9+hUKHla+vmLbem55/fkLj3MqV/M7y9YV/fCAEQs/W077Sx6vZQn5CH4lCh5Wvr5i23puef36FQoeVr6+Ytt6bnn9+QuPcypX8zvL1hX98IQEMAQtBACkDkIEFQsXP2bLx5brqJ3whAQsgASAAfCEAQaCBBSEFQQAoAsCBBSIGQaCBBWohBwJAIAZBCEkNAEGggQUhBQNAIAUiCEEIaiEFIAgpAwBCz9bTvtLHq9lCfkIfiUKHla+vmLbem55/fiAAhUIbiUKHla+vmLbem55/fkLj3MqV/M7y9YV/fCEAIAhBEGogB00NAAsLAkACQCAFQQRqIgkgB00NACAFIQkMAQsgBTUCAEKHla+vmLbem55/fiAAhUIXiULP1tO+0ser2UJ+Qvnz3fGZ9pmrFnwhAAsCQCAJIAdGDQAgBkGfgQVqIQUCQAJAIAYgCWtBAXENACAJIQgMAQsgCUEBaiEIIAkxAABCxc/ZsvHluuonfiAAhUILiUKHla+vmLbem55/fiEACyAFIAlGDQADQCAIQQFqMQAAQsXP2bLx5brqJ34gCDEAAELFz9my8eW66id+IACFQguJQoeVr6+Ytt6bnn9+hUILiUKHla+vmLbem55/fiEAIAhBAmoiCCAHRw0ACwtBACAAQiGIIACFQs/W077Sx6vZQn4iAEIdiCAAhUL5893xmfaZqxZ+IgBCIIggAIUiAUI4hiABQoD+A4NCKIaEIAFCgID8B4NCGIYgAUKAgID4D4NCCIaEhCAAQgiIQoCAgPgPgyAAQhiIQoCA/AeDhCAAQiiIQoD+A4MgAEI4iISEhDcDgIEECwYAQYCBBQsCAAsLDAEAQYCABAsEUAAAAA==";
      var hash$7 = "09c6be90";
      var wasmJson$7 = {
        name: name$7,
        data: data$7,
        hash: hash$7
      };
      const mutex$5 = new Mutex();
      let wasmCache$5 = null;
      const seedBuffer$2 = new Uint8Array(8);
      function validateSeed$2(seed) {
        if (!Number.isInteger(seed) || seed < 0 || seed > 4294967295) {
          return new Error("Seed must be given as two valid 32-bit long unsigned integers (lo + high).");
        }
        return null;
      }
      function writeSeed$2(arr, low, high) {
        const buffer = new DataView(arr);
        buffer.setUint32(0, low, true);
        buffer.setUint32(4, high, true);
      }
      function xxhash64(data2, seedLow = 0, seedHigh = 0) {
        if (validateSeed$2(seedLow)) {
          return Promise.reject(validateSeed$2(seedLow));
        }
        if (validateSeed$2(seedHigh)) {
          return Promise.reject(validateSeed$2(seedHigh));
        }
        if (wasmCache$5 === null) {
          return lockedCreate(mutex$5, wasmJson$7, 8).then((wasm) => {
            wasmCache$5 = wasm;
            writeSeed$2(seedBuffer$2.buffer, seedLow, seedHigh);
            wasmCache$5.writeMemory(seedBuffer$2);
            return wasmCache$5.calculate(data2);
          });
        }
        try {
          writeSeed$2(seedBuffer$2.buffer, seedLow, seedHigh);
          wasmCache$5.writeMemory(seedBuffer$2);
          const hash2 = wasmCache$5.calculate(data2);
          return Promise.resolve(hash2);
        } catch (err) {
          return Promise.reject(err);
        }
      }
      function createXXHash64(seedLow = 0, seedHigh = 0) {
        if (validateSeed$2(seedLow)) {
          return Promise.reject(validateSeed$2(seedLow));
        }
        if (validateSeed$2(seedHigh)) {
          return Promise.reject(validateSeed$2(seedHigh));
        }
        return WASMInterface(wasmJson$7, 8).then((wasm) => {
          const instanceBuffer = new Uint8Array(8);
          writeSeed$2(instanceBuffer.buffer, seedLow, seedHigh);
          wasm.writeMemory(instanceBuffer);
          wasm.init();
          const obj = {
            init: () => {
              wasm.writeMemory(instanceBuffer);
              wasm.init();
              return obj;
            },
            update: (data2) => {
              wasm.update(data2);
              return obj;
            },
            // biome-ignore lint/suspicious/noExplicitAny: Conflict with IHasher type
            digest: (outputType) => wasm.digest(outputType),
            save: () => wasm.save(),
            load: (data2) => {
              wasm.load(data2);
              return obj;
            },
            blockSize: 32,
            digestSize: 8
          };
          return obj;
        });
      }
      var name$6 = "xxhash3";
      var data$6 = "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AnxBACkDsIQFhSIGQiCIIgd+IgggBEIgiCIJIAZC/////w+DIgZ+fCIEQiCIIAkgB358QoCAgIAQQgAgBCAIVBt8IARCIIYiBCAFIAZ+fCIFIARUrXwgBYUgA3wgASkDeCACfSAAQciDBWopAwCFIgNC/////w+DIgQgASkDcCACfCAAQcCDBWopAwCFIgVCIIgiBn4iByADQiCIIgggBUL/////D4MiBX58IgNCIIggCCAGfnxCgICAgBBCACADIAdUG3wgA0IghiIDIAQgBX58IgQgA1StfCAEhXwhAwsgASkDSCACfUEAKQOohAWFIgRC/////w+DIgUgASkDQCACfEEAKQOghAWFIgZCIIgiB34iCCAEQiCIIgkgBkL/////D4MiBn58IgRCIIggCSAHfnxCgICAgBBCACAEIAhUG3wgBEIghiIEIAUgBn58IgUgBFStfCAFhSADfCABKQNYIAJ9IABB2IMFaikDAIUiA0L/////D4MiBCABKQNQIAJ8IABB0IMFaikDAIUiBUIgiCIGfiIHIANCIIgiCCAFQv////8PgyIFfnwiA0IgiCAIIAZ+fEKAgICAEEIAIAMgB1QbfCADQiCGIgMgBCAFfnwiBCADVK18IASFfCEDCyABKQMoIAJ9QQApA5iEBYUiBEL/////D4MiBSABKQMgIAJ8QQApA5CEBYUiBkIgiCIHfiIIIARCIIgiCSAGQv////8PgyIGfnwiBEIgiCAJIAd+fEKAgICAEEIAIAQgCFQbfCAEQiCGIgQgBSAGfnwiBSAEVK18IAWFIAN8IAEpAzggAn0gAEHogwVqKQMAhSIDQv////8PgyIEIAEpAzAgAnwgAEHggwVqKQMAhSIFQiCIIgZ+IgcgA0IgiCIIIAVC/////w+DIgV+fCIDQiCIIAggBn58QoCAgIAQQgAgAyAHVBt8IANCIIYiAyAEIAV+fCIEIANUrXwgBIV8IQMLIAEpAwggAn1BACkDiIQFhSIEQv////8PgyIFIAEpAwAgAnxBACkDgIQFhSIGQiCIIgd+IgggBEIgiCIJIAZC/////w+DIgZ+fCIEQiCIIAkgB358QoCAgIAQQgAgBCAIVBt8IARCIIYiBCAFIAZ+fCIFIARUrXwgBYUgA3wgASkDGCACfSAAQfiDBWopAwCFIgNC/////w+DIgQgASkDECAC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QQAgAjYCgIYFC8oSBQR/CH4BfxB+BX8jACIAIQEgAEGAAWtBQHEiAiQAQQAoArCGBSIAQcCCBSAAGyEDAkACQAJAAkACQAJAQQApA5CGBSIEQvEBVA0AIAJBACkDgIIFNwMAIAJBACkDiIIFIgU3AwggAkEAKQOQggUiBjcDECACQQApA5iCBSIHNwMYIAJBACkDoIIFIgg3AyAgAkEAKQOoggUiCTcDKCACQQApA7CCBSIKNwMwIAJBACkDuIIFIgs3AzgCQEEAKAKAhgUiDEHAAEkNACACQQAoAoiGBTYCQCACIAJBwABqQQAoApiGBUGAhAUgDEF/akEGdiADQQAoApyGBSIAEAIgAyAAaiIAQXlqKQMAIQ0gACkDCSEOIAApAxkhDyAAKQMpIQUgDEHAgwVqKQMAIQogACkDASELIAxByIMFaikDACEQIAxB0IMFaikDACEGIAApAxEhByAMQdiDBWopAwAhESAMQeCDBWopAwAhCCAAKQMhIQkgDEHogwVqKQMAIRIgAikDACETIAIpAxAhFCACKQMgIRUgAikDMCEWIAIpAwghFyACKQMYIRggAikDKCEZIAIgAikDOCAMQfCDBWopAwAiGnwgACkDMSAMQfiDBWopAwAiG4UiHEIgiCAcQv////8Pg358NwM4IBkgCHwgCSAShSIJQiCIIAlC/////w+DfnwhCSAYIAZ8IAcgEYUiB0IgiCAHQv////8Pg358IQcgFyAKfCALIBCFIgtCIIggC0L/////D4N+fCELIBsgFiAFIBqFIgVCIIggBUL/////D4N+fHwhBSASIBUgDyAIhSIIQiCIIAhC/////w+Dfnx8IQggESAUIA4gBoUiBkIgiCAGQv////8Pg358fCEGIBAgEyANIAqFIgpCIIggCkL/////D4N+fHwhCgwFCyAMQcCFBWohHUHAACAMayEeIAJBwABqIQACQCAMQThNDQAgHiEfDAMLAkBBOCAMa0EDdiIAQQdGDQBBACAAQQFqQQdxIiBrIR8gAkHAAGohAANAIAAgHSkDADcDACAAQQhqIQAgHUEIaiEdIB9BAWoiHw0AC0HAACAMICBBA3RqayEfDAILIAJBwABqIQAgHiEfA0AgACAdKQMANwMAIABBCGogHUEIaikDADcDACAAQRBqIB1BEGopAwA3AwAgAEEYaiAdQRhq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";
      var hash$6 = "8d0b08d4";
      var wasmJson$6 = {
        name: name$6,
        data: data$6,
        hash: hash$6
      };
      const mutex$4 = new Mutex();
      let wasmCache$4 = null;
      const seedBuffer$1 = new Uint8Array(8);
      function validateSeed$1(seed) {
        if (!Number.isInteger(seed) || seed < 0 || seed > 4294967295) {
          return new Error("Seed must be given as two valid 32-bit long unsigned integers (lo + high).");
        }
        return null;
      }
      function writeSeed$1(arr, low, high) {
        const buffer = new DataView(arr);
        buffer.setUint32(0, low, true);
        buffer.setUint32(4, high, true);
      }
      function xxhash3(data2, seedLow = 0, seedHigh = 0) {
        if (validateSeed$1(seedLow)) {
          return Promise.reject(validateSeed$1(seedLow));
        }
        if (validateSeed$1(seedHigh)) {
          return Promise.reject(validateSeed$1(seedHigh));
        }
        if (wasmCache$4 === null) {
          return lockedCreate(mutex$4, wasmJson$6, 8).then((wasm) => {
            wasmCache$4 = wasm;
            writeSeed$1(seedBuffer$1.buffer, seedLow, seedHigh);
            wasmCache$4.writeMemory(seedBuffer$1);
            return wasmCache$4.calculate(data2);
          });
        }
        try {
          writeSeed$1(seedBuffer$1.buffer, seedLow, seedHigh);
          wasmCache$4.writeMemory(seedBuffer$1);
          const hash2 = wasmCache$4.calculate(data2);
          return Promise.resolve(hash2);
        } catch (err) {
          return Promise.reject(err);
        }
      }
      function createXXHash3(seedLow = 0, seedHigh = 0) {
        if (validateSeed$1(seedLow)) {
          return Promise.reject(validateSeed$1(seedLow));
        }
        if (validateSeed$1(seedHigh)) {
          return Promise.reject(validateSeed$1(seedHigh));
        }
        return WASMInterface(wasmJson$6, 8).then((wasm) => {
          const instanceBuffer = new Uint8Array(8);
          writeSeed$1(instanceBuffer.buffer, seedLow, seedHigh);
          wasm.writeMemory(instanceBuffer);
          wasm.init();
          const obj = {
            init: () => {
              wasm.writeMemory(instanceBuffer);
              wasm.init();
              return obj;
            },
            update: (data2) => {
              wasm.update(data2);
              return obj;
            },
            // biome-ignore lint/suspicious/noExplicitAny: Conflict with IHasher type
            digest: (outputType) => wasm.digest(outputType),
            save: () => wasm.save(),
            load: (data2) => {
              wasm.load(data2);
              return obj;
            },
            blockSize: 512,
            digestSize: 8
          };
          return obj;
        });
      }
      var name$5 = "xxhash128";
      var data$5 = "AGFzbQEAAAABKwdgAAF/YAR/f39/AGAHf39/f39/fwBgA39/fgF+YAR/f39+AGAAAGABfwADDQwAAQIDBAQEBQYFAAUFBAEBAgIGDwJ/AUGAgAQLfwBBwIEECweCAQkGbWVtb3J5AgAPX19zdGFja19wb2ludGVyAwAOSGFzaF9HZXRCdWZmZXIAAAlIYXNoX0luaXQABwtIYXNoX1VwZGF0ZQAICkhhc2hfRmluYWwACQ1IYXNoX0dldFN0YXRlAAoOSGFzaF9DYWxjdWxhdGUACwpTVEFURV9TSVpFAwEKn00MBgBBgIIEC/MDBAF/CH4Bfwh+AkAgA0UNACADQQN0IQQgACkDMCEFIAApAzghBiAAKQMgIQcgACkDKCEIIAApAxAhCSAAKQMYIQogACkDACELIAApAwghDEEAIQ0DQCAGIAFBMGopAwAiDnwgAiANaiIDQThqKQMAIAFBOGopAwAiD4UiBkIgiCAGQv////8Pg358IQYgCCABQSBqKQMAIhB8IANBKGopAwAgAUEoaikDACIRhSIIQiCIIAhC/////w+DfnwhCCAKIAFBEGopAwAiEnwgA0EYaikDACABQRhqKQMAIhOFIgpCIIggCkL/////D4N+fCEKIAwgASkDACIUfCADQQhqKQMAIAFBCGopAwAiFYUiDEIgiCAMQv////8Pg358IQwgA0EwaikDACAOhSIOQiCIIA5C/////w+DfiAFfCAPfCEFIANBIGopAwAgEIUiDkIgiCAOQv////8Pg34gB3wgEXwhByADQRBqKQMAIBKFIg5CIIggDkL/////D4N+IAl8IBN8IQkgAykDACAUhSIOQiCIIA5C/////w+DfiALfCAVfCELIAFBwABqIQEgBCANQQhqIg1HDQALIAAgCjcDGCAAIAs3AwAgACAMNwMIIAAgCDcDKCAAIAk3AxAgACAGNwM4IAAgBzcDICAAIAU3AzALC94CAgF/AX4CQCAEIAIgASgCACIHayICSQ0AIAAgAyAFIAdBA3RqIAIQASAAIAUgBmoiBykDACAAKQMAIghCL4iFIAiFQrHz3fEJfjcDACAAIAcpAwggACkDCCIIQi+IhSAIhUKx893xCX43AwggACAHKQMQIAApAxAiCEIviIUgCIVCsfPd8Ql+NwMQIAAgBykDGCAAKQMYIghCL4iFIAiFQrHz3fEJfjcDGCAAIAcpAyAgACkDICIIQi+IhSAIhUKx893xCX43AyAgACAHKQMoIAApAygiCEIviIUgCIVCsfPd8Ql+NwMoIAAgBykDMCAAKQMwIghCL4iFIAiFQrHz3fEJfjcDMCAAIAcpAzggACkDOCIIQi+IhSAIhUKx893xCX43AzggACADIAJBBnRqIAUgBCACayIHEAEgASAHNgIADwsgACADIAUgB0EDdGogBBABIAEgByAEajYCAAvlAwEGfiABKQM4IAApAziFIgNC/////w+DIgQgASkDMCAAKQMwhSIFQiCIIgZ+IgcgA0IgiCIIIAVC/////w+DIgV+fCIDQiCIIAggBn58QoCAgIAQQgAgAyAHVBt8IANCIIYiAyAEIAV+fCIEIANUrXwgBIUgASkDKCAAKQMohSIDQv////8PgyIEIAEpAyAgACkDIIUiBUIgiCIGfiIHIANCIIgiCCAFQv////8PgyIFfnwiA0IgiCAIIAZ+fEKAgICAEEIAIAMgB1QbfCADQiCGIgMgBCAFfnwiBCADVK18IASFIAEpAxggACkDGIUiA0L/////D4MiBCABKQMQIAApAxCFIgVCIIgiBn4iByADQiCIIgggBUL/////D4MiBX58IgNCIIggCCAGfnxCgICAgBBCACADIAdUG3wgA0IghiIDIAQgBX58IgQgA1StfCAEhSABKQMIIAApAwiFIgNC/////w+DIgQgASkDACAAKQMAhSIFQiCIIgZ+IgcgA0IgiCIIIAVC/////w+DIgV+fCIDQiCIIAggBn58QoCAgIAQQgAgAyAHVBt8IANCIIYiAyAEIAV+fCIEIANUrXwgBIUgAnx8fHwiA0IliCADhUL5893xmfKZqxZ+IgNCIIggA4ULgAgBBX4CQCABQQlJDQAgACABQfiDBWopAwAiBCACKQM4IAIpAzCFIAN8hSIFQv////8Pg0L3lK+vCH4gBUKAgICAcIN8QQApA4CEBSACKQMoIAIpAyCFIAN9hSAEhSIDQiCIIgRCsfPd8Ql+fCAEQoeVr68IfiIEIANC/////w+DIgVCsfPd8Ql+fCIDQiCIfEKAgICAEEIAIAMgBFQbfCADQiCGIgMgBUKHla+vCH58IgQgA1StfCIDQjiGIANCgP4Dg0IohoQgA0KAgPwHg0IYhiADQoCAgPgPg0IIhoSEIANCCIhCgICA+A+DIANCGIhCgID8B4OEIANCKIhCgP4DgyADQjiIhISEIAQgAUF/aq1CNoZ8hSIEQiCIIgVCz9bTvgJ+IARC/////w+DIgRCvdzKlQx+fCIGQiCGIgcgBELP1tO+An58IgRCJYggBIVC+fPd8ZnymasWfiIIQiCIIAiFNwMAIAAgBUK93MqVDH4gA0LP1tO+0ser2UJ+fCAGQiCIfCAEIAdUrXwiA0IliCADhUL5893xmfKZqxZ+IgNCIIggA4U3AwgPCwJAIAFBBEkNACAAIAIpAxggAikDEIUgA6ciAkH/gfwHcUEIeCACQRh4Qf+B/Adxcq1CIIYgA4V8IAFB/IMFajUCAEIghkEANQKAhAWEhSIDQiCIIgQgAUECdEGHla+veGqtIgV+IgYgA0L/////D4MiB0Kx893xCX58IgNCIIggBEKx893xCX58QoCAgIAQQgAgAyAGVBt8IANCIIYiBCAHIAV+fCIDQgGGfCADIARUrXwiBEIliCAEhUL5893xmfKZqxZ+IgVCIIggBYU3AwggACAEQgOIIAOFIgNCI4ggA4VCpb7j9NGMh9mff34iA0IciCADhTcDAA8LAkAgAUUNACAAIAMgAigCBCACKAIAc618IgRCIYhBAC0AgIQFQRB0IAFBCHRyIAFBAXYtAICEBUEYdHIgAUH/gwVqLQAAciIBrYUgBIVCz9bTvtLHq9lCfiIEQh2IIASFQvnz3fGZ9pmrFn4iBEIgiCAEhTcDACAAIAIoAgwgAigCCHOtIAN9IgNCIYggAUH/gfwHcUEIeCABQRh4Qf+B/AdxckENd62FIAOFQs/W077Sx6vZQn4iA0IdiCADhUL5893xmfaZqxZ+IgNCIIggA4U3AwgPCyAAIAIpA1AgAikDWIUgA4UiBEIhiCAEhULP1tO+0ser2UJ+IgRCHYggBIVC+fPd8Zn2masWfiIEQiCIIASFNwMIIAAgAikDQCACKQNIhSADhSIDQiGIIAOFQs/W077Sx6vZQn4iA0IdiCADhUL5893xmfaZqxZ+IgNCIIggA4U3AwALvQoBDH4gAa0iBEKHla+vmLbem55/fiEFAkACQCABQSFPDQBCACEGDAELAkACQCABQcEATw0AQgAhBgwBCwJAAkAgAUHhAE8NAEIAIQYMAQtBACkDuIQFIgdBACkDsIQFIgh8IAJB+ABqKQMAIAN9IAFByIMFaikDACIJhSIKQv////8PgyIGIAIpA3AgA3wgAUHAgwVqKQMAIguFIgxCIIgiDX4iDiAKQiCIIg8gDEL/////D4MiDH58IgpCIIggDyANfnxCgICAgBBCACAKIA5UG3wgCkIghiIKIAYgDH58IgYgClStfIUgBoUhBiACQegAaikDACADfSAHhSIKQv////8PgyIHIAIpA2AgA3wgCIUiCEIgiCIMfiINIApCIIgiDiAIQv////8PgyIIfnwiCkIgiCAOIAx+fEKAgICAEEIAIAogDVQbfCAKQiCGIgogByAIfnwiByAKVK18IAeFIAV8IAkgC3yFIQULIAJB2ABqKQMAIAN9IAFB2IMFaikDACIHhSIKQv////8PgyIIIAIpA1AgA3wgAUHQgwVqKQMAIgmFIgtCIIgiDH4iDSAKQiCIIg4gC0L/////D4MiC358IgpCIIggDiAMfnxCgICAgBBCACAKIA1UG3wgCkIghiIKIAggC358IgggClStfCAIhSAGfEEAKQOohAUiCkEAKQOghAUiCHyFIQYgAkHIAGopAwAgA30gCoUiCkL/////D4MiCyACKQNAIAN8IAiFIghCIIgiDH4iDSAKQiCIIg4gCEL/////D4MiCH58IgpCIIggDiAMfnxCgICAgBBCACAKIA1UG3wgCkIghiIKIAsgCH58IgggClStfCAIhSAFfCAHIAl8hSEFCyACQThqKQMAIAN9IAFB6IMFaikDACIHhSIKQv////8PgyIIIAIpAzAgA3wgAUHggwVqKQMAIgmFIgtCIIgiDH4iDSAKQiCIIg4gC0L/////D4MiC358IgpCIIggDiAMfnxCgICAgBBCACAKIA1UG3wgCkIghiIKIAggC358IgggClStfCAIhSAGfEEAKQOYhAUiCkEAKQOQhAUiCHyFIQYgAkEoaikDACADfSAKhSIKQv////8PgyILIAIpAyAgA3wgCIUiCEIgiCIMfiINIApCIIgiDiAIQv////8PgyIIfnwiCkIgiCAOIAx+fEKAgICAEEIAIAogDVQbfCAKQiCGIgogCyAIfnwiCCAKVK18IAiFIAV8IAcgCXyFIQULIAAgAkEYaikDACADfSABQfiDBWopAwAiB4UiCkL/////D4MiCCACKQMQIAN8IAFB8IMFaikDACIJ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mIIFIgc3AxggAkEAKQOgggUiCDcDICACQQApA6iCBSIJNwMoIAJBACkDsIIFIgo3AzAgAkEAKQO4ggUiCzcDOAJAQQAoAoCGBSIMQcAASQ0AIAJBACgCiIYFNgJAIAIgAkHAAGpBACgCmIYFQYCEBSAMQX9qQQZ2IANBACgCnIYFIgAQAiACIAIpAwggDEHAgwVqKQMAIgV8IAMgAGoiACkDASAMQciDBWopAwAiBoUiB0IgiCAHQv////8Pg358NwMIIAIgAikDGCAMQdCDBWopAwAiB3wgACkDESAMQdiDBWopAwAiCIUiCUIgiCAJQv////8Pg358NwMYIAIgBiAFIABBeWopAwCFIgVCIIggBUL/////D4N+IAIpAwB8fDcDACACIAggByAAKQMJhSIFQiCIIAVC/////w+DfiACKQMQfHw3AxAgACkDGSEFIAIpAyAhBiACIAIpAyggDEHggwVqKQMAIgd8IAApAyEgDEHogwVqKQMAIgiFIglCIIggCUL/////D4N+fDcDKCACIAggBiAFIAeFIgVCIIggBUL/////D4N+fHw3AyAgAiACKQM4IAxB8IMFaikDACIFfCAAKQMxIAxB+IMFaikDACIGhSIHQiCIIAdC/////w+Dfnw3AzggAiAGIAUgACkDKYUiBUIgiCAFQv////8Pg34gAikDMHx8NwMwQQAoApyGBSENDAULIAxBwIUFaiENQcAAIAxrIQ4gAkHAAGohAAJAIAxBOE0NACAOIQ8MAwsCQEE4IAxrQQN2IgBBB0YNAEEAIABBAWpBB3EiEGshDyACQcAAaiEAA0AgACANKQMANwMAIABBCGohACANQQhqIQ0gD0EBaiIPDQALQcAAIAwgEEEDdGprIQ8MAgsgAkHAAGohACAOIQ8DQCAAIA0pAwA3AwAgAEEIaiANQQhqKQMANwMAIABBEGogDUEQaikDADcDACAAQRhqIA1BGGopAwA3AwAgAEEgaiANQSBqKQMANwMAIABBKGogDUEoaikDADcDACAAQTBqIA1BMGopAwA3AwAgAEE4aiANQThqKQMANwMAIABBwABqIQAgDUHAAGohDSAPQUBqIg9BB0sNAAwCCwsgBKchAAJAQQApA6CGBSIFUA0AAkAgBEIQVg0AIAJBwABqIABBgIAEIAUQBAwGCwJAIARCgAFWDQAgAkHAAGogAEGAgAQgBRAFDAYLIAJBwABqIABBgIAEIAUQBgwFCwJAIARCEFYNACACQcAAaiAAIANCABAEDAULAkAgBEKAAVYNACACQcAAaiAAIANCABAFDAULIAJBwABqIAAgA0IAEAYMBAsgD0UNAQsgD0F/aiERAkAgD0EHcSIQRQ0AA0AgACANLQAAOgAAIABBAWohACANQQFqIQ0gEEF/aiIQDQALIA9BeHEhDwsgEUEHSQ0AA0AgACANKQAANwAAIABBCGohACANQQhqIQ0gD0F4aiIPDQALCyACQcAAaiAOaiENQYCEBSEAAkAgDEEISQ0AIAxBeGoiEEEDdkEBaiEPQYCEBSEAA0AgDSAAKQMANwMAIA1BCGohDSAAQQhqIQAgD0F/aiIPDQALIAwgEEF4cWtBeGohDAsCQCAMRQ0AAkACQCAMQQdxIg8NACAMIQ8MAQsDQCANIAAtAAA6AAAgDUEBaiENIABBAWohACAPQX9qIg8NAAsgDEF4cSEPCyAMQQhJDQADQCANIAApAAA3AAAgDUEIaiENIABBCGohACAPQXhqIg8NAAsLIAIgBSACKQNAIhJ8IANBACgCnIYFIg1qIgApAwEgAikDSCIFhSITQiCIIBNC/////w+Dfnw3AwggAiAHIAIpA1AiE3wgACkDESACKQNYIgeFIhRCIIggFEL/////D4N+fDcDGCACIAcgEyAAKQMJhSITQiCIIBNC/////w+DfiAGfHw3AxAgAiAFIBIgAEF5aikDAIUiBkIgiCAGQv////8Pg34gAikDAHx8NwMAIAApAxkhBSACIAkgAikDYCIGfCAAKQMhIAIpA2giB4UiCUIgiCAJQv////8Pg358NwMoIAIgByAFIAaFIgVCIIggBUL/////D4N+IAh8fDcDICACIAsgAikDcCIFfCAAKQMxIAIpA3giBoUiB0IgiCAHQv////8Pg358NwM4IAIgBiAFIAApAymFIgVCIIggBUL/////D4N+IAp8fDcDMAsgAiACIANBC2ogBEKHla+vmLbem55/fhADNwNAIAIgAiADIA1qQXVqIARCz9bTvtLHq9lCfkJ/hRADNwNIC0EAIAIpA3g3A8CCBEEAIAIpA3A3A7iCBEEAIAIpA2g3A7CCBEEAIAIpA2A3A6iCBEEAIAIpA1g3A6CCBEEAIAIpA1A3A5iCBEEAIAIpA0giBEI4hiAEQoD+A4NCKIaEIARCgID8B4NCGIYgBEKAgID4D4NCCIaEhCAEQgiIQoCAgPgPgyAEQhiIQoCA/AeDhCAEQiiIQoD+A4MgBEI4iISEhCIENwOAggRBACAENwOQggRBACACKQNAIgRCOIYgBEKA/gODQiiGhCAEQoCA/AeDQhiGIARCgICA+A+DQgiGhIQgBEIIiEKAgID4D4MgBEIYiEKAgPwHg4QgBEIoiEKA/gODIARCOIiEhIQ3A4iCBCABJAALBgBBgIIFCwIACwvNAQEAQYCABAvEAbj+bDkjpEu+fAGBLPchrRze1G3pg5CX23JApKS3s2cfy3nmTszA5XiCWtB9zP9yIbgIRnT3QySO4DWQ5oE6Jkw8KFK7kcMAy4jQZYsbUy6jcWRIl6IN+U44Ge9Gqd6s2Kj6dj/jnDQ/+dy7x8cLTx2KUeBLzbRZMciffsnZeHNk6sWsgzTT68PFgaD/+hNj6xcN3VG38NpJ0xZVJinUaJ4rFr5YfUeh/I/4uNF60DHORcs6j5UWBCiv1/vKu0tAfkACAAA=";
      var hash$5 = "6c7d9155";
      var wasmJson$5 = {
        name: name$5,
        data: data$5,
        hash: hash$5
      };
      const mutex$3 = new Mutex();
      let wasmCache$3 = null;
      const seedBuffer = new Uint8Array(8);
      function validateSeed(seed) {
        if (!Number.isInteger(seed) || seed < 0 || seed > 4294967295) {
          return new Error("Seed must be given as two valid 32-bit long unsigned integers (lo + high).");
        }
        return null;
      }
      function writeSeed(arr, low, high) {
        const buffer = new DataView(arr);
        buffer.setUint32(0, low, true);
        buffer.setUint32(4, high, true);
      }
      function xxhash128(data2, seedLow = 0, seedHigh = 0) {
        if (validateSeed(seedLow)) {
          return Promise.reject(validateSeed(seedLow));
        }
        if (validateSeed(seedHigh)) {
          return Promise.reject(validateSeed(seedHigh));
        }
        if (wasmCache$3 === null) {
          return lockedCreate(mutex$3, wasmJson$5, 16).then((wasm) => {
            wasmCache$3 = wasm;
            writeSeed(seedBuffer.buffer, seedLow, seedHigh);
            wasmCache$3.writeMemory(seedBuffer);
            return wasmCache$3.calculate(data2);
          });
        }
        try {
          writeSeed(seedBuffer.buffer, seedLow, seedHigh);
          wasmCache$3.writeMemory(seedBuffer);
          const hash2 = wasmCache$3.calculate(data2);
          return Promise.resolve(hash2);
        } catch (err) {
          return Promise.reject(err);
        }
      }
      function createXXHash128(seedLow = 0, seedHigh = 0) {
        if (validateSeed(seedLow)) {
          return Promise.reject(validateSeed(seedLow));
        }
        if (validateSeed(seedHigh)) {
          return Promise.reject(validateSeed(seedHigh));
        }
        return WASMInterface(wasmJson$5, 16).then((wasm) => {
          const instanceBuffer = new Uint8Array(8);
          writeSeed(instanceBuffer.buffer, seedLow, seedHigh);
          wasm.writeMemory(instanceBuffer);
          wasm.init();
          const obj = {
            init: () => {
              wasm.writeMemory(instanceBuffer);
              wasm.init();
              return obj;
            },
            update: (data2) => {
              wasm.update(data2);
              return obj;
            },
            // biome-ignore lint/suspicious/noExplicitAny: Conflict with IHasher type
            digest: (outputType) => wasm.digest(outputType),
            save: () => wasm.save(),
            load: (data2) => {
              wasm.load(data2);
              return obj;
            },
            blockSize: 512,
            digestSize: 16
          };
          return obj;
        });
      }
      var name$4 = "ripemd160";
      var data$4 = "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";
      var hash$4 = "4f7957e4";
      var wasmJson$4 = {
        name: name$4,
        data: data$4,
        hash: hash$4
      };
      const mutex$2 = new Mutex();
      let wasmCache$2 = null;
      function ripemd160(data2) {
        if (wasmCache$2 === null) {
          return lockedCreate(mutex$2, wasmJson$4, 20).then((wasm) => {
            wasmCache$2 = wasm;
            return wasmCache$2.calculate(data2);
          });
        }
        try {
          const hash2 = wasmCache$2.calculate(data2);
          return Promise.resolve(hash2);
        } catch (err) {
          return Promise.reject(err);
        }
      }
      function createRIPEMD160() {
        return WASMInterface(wasmJson$4, 20).then((wasm) => {
          wasm.init();
          const obj = {
            init: () => {
              wasm.init();
              return obj;
            },
            update: (data2) => {
              wasm.update(data2);
              return obj;
            },
            // biome-ignore lint/suspicious/noExplicitAny: Conflict with IHasher type
            digest: (outputType) => wasm.digest(outputType),
            save: () => wasm.save(),
            load: (data2) => {
              wasm.load(data2);
              return obj;
            },
            blockSize: 64,
            digestSize: 20
          };
          return obj;
        });
      }
      function calculateKeyBuffer(hasher, key) {
        const { blockSize } = hasher;
        const buf = getUInt8Buffer(key);
        if (buf.length > blockSize) {
          hasher.update(buf);
          const uintArr = hasher.digest("binary");
          hasher.init();
          return uintArr;
        }
        return new Uint8Array(buf.buffer, buf.byteOffset, buf.length);
      }
      function calculateHmac(hasher, key) {
        hasher.init();
        const { blockSize } = hasher;
        const keyBuf = calculateKeyBuffer(hasher, key);
        const keyBuffer = new Uint8Array(blockSize);
        keyBuffer.set(keyBuf);
        const opad = new Uint8Array(blockSize);
        for (let i = 0; i < blockSize; i++) {
          const v = keyBuffer[i];
          opad[i] = v ^ 92;
          keyBuffer[i] = v ^ 54;
        }
        hasher.update(keyBuffer);
        const obj = {
          init: () => {
            hasher.init();
            hasher.update(keyBuffer);
            return obj;
          },
          update: (data2) => {
            hasher.update(data2);
            return obj;
          },
          digest: ((outputType) => {
            const uintArr = hasher.digest("binary");
            hasher.init();
            hasher.update(opad);
            hasher.update(uintArr);
            return hasher.digest(outputType);
          }),
          save: () => {
            throw new Error("save() not supported");
          },
          load: () => {
            throw new Error("load() not supported");
          },
          blockSize: hasher.blockSize,
          digestSize: hasher.digestSize
        };
        return obj;
      }
      function createHMAC(hash2, key) {
        if (!hash2 || !hash2.then) {
          throw new Error('Invalid hash function is provided! Usage: createHMAC(createMD5(), "key").');
        }
        return hash2.then((hasher) => calculateHmac(hasher, key));
      }
      function calculatePBKDF2(digest, salt, iterations, hashLength, outputType) {
        return __awaiter(this, void 0, void 0, function* () {
          const DK = new Uint8Array(hashLength);
          const block1 = new Uint8Array(salt.length + 4);
          const block1View = new DataView(block1.buffer);
          const saltBuffer = getUInt8Buffer(salt);
          const saltUIntBuffer = new Uint8Array(saltBuffer.buffer, saltBuffer.byteOffset, saltBuffer.length);
          block1.set(saltUIntBuffer);
          let destPos = 0;
          const hLen = digest.digestSize;
          const l = Math.ceil(hashLength / hLen);
          let T = null;
          let U = null;
          for (let i = 1; i <= l; i++) {
            block1View.setUint32(salt.length, i);
            digest.init();
            digest.update(block1);
            T = digest.digest("binary");
            U = T.slice();
            for (let j = 1; j < iterations; j++) {
              digest.init();
              digest.update(U);
              U = digest.digest("binary");
              for (let k = 0; k < hLen; k++) {
                T[k] ^= U[k];
              }
            }
            DK.set(T.subarray(0, hashLength - destPos), destPos);
            destPos += hLen;
          }
          if (outputType === "binary") {
            return DK;
          }
          const digestChars = new Uint8Array(hashLength * 2);
          return getDigestHex(digestChars, DK, hashLength);
        });
      }
      const validateOptions$2 = (options) => {
        if (!options || typeof options !== "object") {
          throw new Error("Invalid options parameter. It requires an object.");
        }
        if (!options.hashFunction || !options.hashFunction.then) {
          throw new Error('Invalid hash function is provided! Usage: pbkdf2("password", "salt", 1000, 32, createSHA1()).');
        }
        if (!Number.isInteger(options.iterations) || options.iterations < 1) {
          throw new Error("Iterations should be a positive number");
        }
        if (!Number.isInteger(options.hashLength) || options.hashLength < 1) {
          throw new Error("Hash length should be a positive number");
        }
        if (options.outputType === void 0) {
          options.outputType = "hex";
        }
        if (!["hex", "binary"].includes(options.outputType)) {
          throw new Error(`Insupported output type ${options.outputType}. Valid values: ['hex', 'binary']`);
        }
      };
      function pbkdf2(options) {
        return __awaiter(this, void 0, void 0, function* () {
          validateOptions$2(options);
          const hmac = yield createHMAC(options.hashFunction, options.password);
          return calculatePBKDF2(hmac, options.salt, options.iterations, options.hashLength, options.outputType);
        });
      }
      var name$3 = "scrypt";
      var data$3 = "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B3cgFHMiC2o2AjAgACAAKAI0IAsgBmpBCXcgE3MiCmo2AjQgACAAKAI4IAogC2pBDXcgAnMiAmo2AjggACAAKAI8IAIgCmpBEncgBnNqNgI8C8QSAw5/AX4VfwJAIAJFDQAgAEEHdCIDQUBqIgRBACgCgIAEIgUgAiADbCIGaiADIAFsaiIHIANqIghqIQkgACACQQd0IgogAUEHdGoiC2whDCAAIAtBgAFqbCENIABBBXQiDkEBIA5BAUsbIgtBYHEhDyALQQFxIRAgAa1Cf3whESAEIAdqIRIgCEF4aiETIAhBcGohFCAIQWhqIRUgCEFgaiEWIAhBWGohFyAIQVBqIRggCEFIaiEZIAhBQGohGiAHIABBCHQiG2ohHCAAIApBgAFqbCEdQQAhHkEAIR8DQEEAKAKAgAQiICADIB9saiEhAkAgAEUNAAJAAkAgDg0AQQAhIgwBCyAgIB5qISNBACEEQQAhIgNAIAcgBGoiCyAjIARqIiQoAgA2AgAgC0EEaiAkQQRqKAIANgIAIAtBCGogJEEIaigCADYCACALQQxqICRBDGooAgA2AgAgBEEQaiEEIA8gIkEEaiIiRw0ACyAQRQ0BCyAHICJBAnQiBGogISAEaigCADYCAAsCQCABRQ0AQQAhJSAdISMgBiEmA0AgBSEkIAAhIgJAAkAgAA0AIBwgGikDADcDACAcIBkpAwA3AwggHCAYKQMANwMQIBwgFykDADcDGCAcIBYpAwA3AyAgHCAVKQMANwMoIBwgFCkDADcDMCAcIBMpAwA3AzgMAQsDQCAkICZqIgQgJCAMaiILKQMANwMAIARBCGogC0EIaikDADcDACAEQRBqIAtBEGopAwA3AwAgBEEYaiALQRhqKQMANwMAIARBIGogC0EgaikDADcDACAEQShqIAtBKGopAwA3AwAgBEEwaiALQTBqKQMANwMAIARBOGogC0E4aikDADcDACAEQcAAaiALQcAAaikDADcDACAEQcgAaiALQcgAaikDADcDACAEQdAAaiALQdAAaikDADcDACAEQdgAaiALQdgAaikDADcDACAEQeAAaiALQeAAaikDADcDACAEQegAaiALQegAaikDADcDACAEQfAAaiALQfAAaikDADcDACAEQfgAaiALQfgAaikDADcDACAkQYABaiEkICJBf2oiIg0ACyAHIAgg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";
      var hash$3 = "e914d656";
      var wasmJson$3 = {
        name: name$3,
        data: data$3,
        hash: hash$3
      };
      function scryptInternal(options) {
        return __awaiter(this, void 0, void 0, function* () {
          const { costFactor, blockSize, parallelism, hashLength } = options;
          const SHA256Hasher = createSHA256();
          const blockData = yield pbkdf2({
            password: options.password,
            salt: options.salt,
            iterations: 1,
            hashLength: 128 * blockSize * parallelism,
            hashFunction: SHA256Hasher,
            outputType: "binary"
          });
          const scryptInterface = yield WASMInterface(wasmJson$3, 0);
          const VSize = 128 * blockSize * costFactor;
          const XYSize = 256 * blockSize;
          scryptInterface.setMemorySize(blockData.length + VSize + XYSize);
          scryptInterface.writeMemory(blockData, 0);
          scryptInterface.getExports().scrypt(blockSize, costFactor, parallelism);
          const expensiveSalt = scryptInterface.getMemory().subarray(0, 128 * blockSize * parallelism);
          const outputData = yield pbkdf2({
            password: options.password,
            salt: expensiveSalt,
            iterations: 1,
            hashLength,
            hashFunction: SHA256Hasher,
            outputType: "binary"
          });
          if (options.outputType === "hex") {
            const digestChars = new Uint8Array(hashLength * 2);
            return getDigestHex(digestChars, outputData, hashLength);
          }
          return outputData;
        });
      }
      const isPowerOfTwo = (v) => v && !(v & v - 1);
      const validateOptions$1 = (options) => {
        if (!options || typeof options !== "object") {
          throw new Error("Invalid options parameter. It requires an object.");
        }
        if (!Number.isInteger(options.blockSize) || options.blockSize < 1) {
          throw new Error("Block size should be a positive number");
        }
        if (!Number.isInteger(options.costFactor) || options.costFactor < 2 || !isPowerOfTwo(options.costFactor)) {
          throw new Error("Cost factor should be a power of 2, greater than 1");
        }
        if (!Number.isInteger(options.parallelism) || options.parallelism < 1) {
          throw new Error("Parallelism should be a positive number");
        }
        if (!Number.isInteger(options.hashLength) || options.hashLength < 1) {
          throw new Error("Hash length should be a positive number.");
        }
        if (options.outputType === void 0) {
          options.outputType = "hex";
        }
        if (!["hex", "binary"].includes(options.outputType)) {
          throw new Error(`Insupported output type ${options.outputType}. Valid values: ['hex', 'binary']`);
        }
      };
      function scrypt(options) {
        return __awaiter(this, void 0, void 0, function* () {
          validateOptions$1(options);
          return scryptInternal(options);
        });
      }
      var name$2 = "bcrypt";
      var data$2 = "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BCABQQ52QfwHcSgC8IkEaiABQQZ2QfwHcSgC8JEEcyABQf8BcUECdCgC8JkEanMiAEEWdkH8B3EoAvCBBCAAQQ52QfwHcSgC8IkEaiAAQQZ2QfwHcSgC8JEEcyAAQf8BcUECdCgC8JkEanMgAXMiAUEWdkH8B3EoAvCBBCABQQ52QfwHcSgC8IkEaiABQQZ2QfwHcSgC8JEEcyABQf8BcUECdCgC8JkEanMgAHMiAEEWdkH8B3EoAvCBBCAAQQ52QfwHcSgC8IkEaiAAQQZ2QfwHcSgC8JEEcyAAQf8BcUECdCgC8JkEanMgAXMiAUEWdkH8B3EoAvCBBCABQQ52QfwHcSgC8IkEaiABQQZ2QfwHcSgC8JEEcyABQf8BcUECdCgC8JkEanMgAHMiAEEWdkH8B3EoAvCBBCAAQQ52QfwHcSgC8IkEaiAAQQZ2QfwHcSgC8JEEcyAAQf8BcUECdCgC8JkEanMgAXMiAUEWdkH8B3EoAvCBBCABQQ52QfwHcSgC8IkEaiABQQZ2QfwHcSgC8JEEcyABQf8BcUECdCgC8JkEanMgAHMiAEEWdkH8B3EoAvCBBCAAQQ52QfwHcSgC8IkEaiAAQQZ2QfwHcSgC8JEEcyAAQf8BcUECdCgC8JkEanMgAXMiAUEWdkH8B3EoAvCBBCABQQ52QfwHcSgC8IkEaiABQQZ2QfwHcSgC8JEEcyABQf8BcUECdCgC8JkEanMgAHMiAEEWdkH8B3EoAvCBBCAAQQ52QfwHcSgC8IkEaiAAQQZ2QfwHcSgC8JEEcyAAQf8BcUECdCgC8JkEanMgAXMiAUEWdkH8B3EoAvCBBCABQQ52QfwHcSgC8IkEaiABQQZ2QfwHcSgC8JEEcyABQf8BcUECdCgC8JkEanMgAHMiAEEWdkH8B3EoAvCBBCAAQQ52QfwHcSgC8IkEaiAAQQZ2QfwHcSgC8JEEcyAAQf8BcUECdCgC8JkEanMgAXMiAUEWdkH8B3EoAvCBBCABQQ52QfwHcSgC8IkEaiABQQZ2QfwHcSgC8JEEcyABQf8BcUECdCgC8JkEanMgAHMiAEEWdkH8B3EoAvCBBCAAQQ52QfwHcSgC8IkEaiAAQQZ2QfwHcSgC8JEEcyAAQf8BcUECdCgC8JkEanMgAXMiAUEWdkH8B3EoAvCBBCABQQ52QfwHcSgC8IkEaiABQQZ2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";
      var hash$2 = "ec6063c3";
      var wasmJson$2 = {
        name: name$2,
        data: data$2,
        hash: hash$2
      };
      function bcryptInternal(options) {
        return __awaiter(this, void 0, void 0, function* () {
          const { costFactor, password, salt } = options;
          const bcryptInterface = yield WASMInterface(wasmJson$2, 0);
          bcryptInterface.writeMemory(getUInt8Buffer(salt), 0);
          const passwordBuffer = getUInt8Buffer(password);
          bcryptInterface.writeMemory(passwordBuffer, 16);
          const shouldEncode = options.outputType === "encoded" ? 1 : 0;
          bcryptInterface.getExports().bcrypt(passwordBuffer.length, costFactor, shouldEncode);
          const memory = bcryptInterface.getMemory();
          if (options.outputType === "encoded") {
            return intArrayToString(memory, 60);
          }
          if (options.outputType === "hex") {
            const digestChars = new Uint8Array(24 * 2);
            return getDigestHex(digestChars, memory, 24);
          }
          return memory.slice(0, 24);
        });
      }
      const validateOptions = (options) => {
        if (!options || typeof options !== "object") {
          throw new Error("Invalid options parameter. It requires an object.");
        }
        if (!Number.isInteger(options.costFactor) || options.costFactor < 4 || options.costFactor > 31) {
          throw new Error("Cost factor should be a number between 4 and 31");
        }
        options.password = getUInt8Buffer(options.password);
        if (options.password.length < 1) {
          throw new Error("Password should be at least 1 byte long");
        }
        if (options.password.length > 72) {
          throw new Error("Password should be at most 72 bytes long");
        }
        options.salt = getUInt8Buffer(options.salt);
        if (options.salt.length !== 16) {
          throw new Error("Salt should be 16 bytes long");
        }
        if (options.outputType === void 0) {
          options.outputType = "encoded";
        }
        if (!["hex", "binary", "encoded"].includes(options.outputType)) {
          throw new Error(`Insupported output type ${options.outputType}. Valid values: ['hex', 'binary', 'encoded']`);
        }
      };
      function bcrypt(options) {
        return __awaiter(this, void 0, void 0, function* () {
          validateOptions(options);
          return bcryptInternal(options);
        });
      }
      const validateHashCharacters = (hash2) => {
        if (!/^\$2[axyb]\$[0-3][0-9]\$[./A-Za-z0-9]{53}$/.test(hash2)) {
          return false;
        }
        if (hash2[4] === "0" && Number(hash2[5]) < 4) {
          return false;
        }
        if (hash2[4] === "3" && Number(hash2[5]) > 1) {
          return false;
        }
        return true;
      };
      const validateVerifyOptions = (options) => {
        if (!options || typeof options !== "object") {
          throw new Error("Invalid options parameter. It requires an object.");
        }
        if (options.hash === void 0 || typeof options.hash !== "string") {
          throw new Error("Hash should be specified");
        }
        if (options.hash.length !== 60) {
          throw new Error("Hash should be 60 bytes long");
        }
        if (!validateHashCharacters(options.hash)) {
          throw new Error("Invalid hash");
        }
        options.password = getUInt8Buffer(options.password);
        if (options.password.length < 1) {
          throw new Error("Password should be at least 1 byte long");
        }
        if (options.password.length > 72) {
          throw new Error("Password should be at most 72 bytes long");
        }
      };
      function bcryptVerify(options) {
        return __awaiter(this, void 0, void 0, function* () {
          validateVerifyOptions(options);
          const { hash: hash2, password } = options;
          const bcryptInterface = yield WASMInterface(wasmJson$2, 0);
          bcryptInterface.writeMemory(getUInt8Buffer(hash2), 0);
          const passwordBuffer = getUInt8Buffer(password);
          bcryptInterface.writeMemory(passwordBuffer, 60);
          return !!bcryptInterface.getExports().bcrypt_verify(passwordBuffer.length);
        });
      }
      var name$1 = "whirlpool";
      var data$1 = "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";
      var hash$1 = "b272bf04";
      var wasmJson$1 = {
        name: name$1,
        data: data$1,
        hash: hash$1
      };
      const mutex$1 = new Mutex();
      let wasmCache$1 = null;
      function whirlpool(data2) {
        if (wasmCache$1 === null) {
          return lockedCreate(mutex$1, wasmJson$1, 64).then((wasm) => {
            wasmCache$1 = wasm;
            return wasmCache$1.calculate(data2);
          });
        }
        try {
          const hash2 = wasmCache$1.calculate(data2);
          return Promise.resolve(hash2);
        } catch (err) {
          return Promise.reject(err);
        }
      }
      function createWhirlpool() {
        return WASMInterface(wasmJson$1, 64).then((wasm) => {
          wasm.init();
          const obj = {
            init: () => {
              wasm.init();
              return obj;
            },
            update: (data2) => {
              wasm.update(data2);
              return obj;
            },
            // biome-ignore lint/suspicious/noExplicitAny: Conflict with IHasher type
            digest: (outputType) => wasm.digest(outputType),
            save: () => wasm.save(),
            load: (data2) => {
              wasm.load(data2);
              return obj;
            },
            blockSize: 64,
            digestSize: 64
          };
          return obj;
        });
      }
      var name = "sm3";
      var data = "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";
      var hash = "3ceec540";
      var wasmJson = {
        name,
        data,
        hash
      };
      const mutex = new Mutex();
      let wasmCache = null;
      function sm3(data2) {
        if (wasmCache === null) {
          return lockedCreate(mutex, wasmJson, 32).then((wasm) => {
            wasmCache = wasm;
            return wasmCache.calculate(data2);
          });
        }
        try {
          const hash2 = wasmCache.calculate(data2);
          return Promise.resolve(hash2);
        } catch (err) {
          return Promise.reject(err);
        }
      }
      function createSM3() {
        return WASMInterface(wasmJson, 32).then((wasm) => {
          wasm.init();
          const obj = {
            init: () => {
              wasm.init();
              return obj;
            },
            update: (data2) => {
              wasm.update(data2);
              return obj;
            },
            // biome-ignore lint/suspicious/noExplicitAny: Conflict with IHasher type
            digest: (outputType) => wasm.digest(outputType),
            save: () => wasm.save(),
            load: (data2) => {
              wasm.load(data2);
              return obj;
            },
            blockSize: 64,
            digestSize: 32
          };
          return obj;
        });
      }
      exports2.adler32 = adler32;
      exports2.argon2Verify = argon2Verify;
      exports2.argon2d = argon2d;
      exports2.argon2i = argon2i;
      exports2.argon2id = argon2id2;
      exports2.bcrypt = bcrypt;
      exports2.bcryptVerify = bcryptVerify;
      exports2.blake2b = blake2b;
      exports2.blake2s = blake2s;
      exports2.blake3 = blake3;
      exports2.crc32 = crc32;
      exports2.crc64 = crc64;
      exports2.createAdler32 = createAdler32;
      exports2.createBLAKE2b = createBLAKE2b;
      exports2.createBLAKE2s = createBLAKE2s;
      exports2.createBLAKE3 = createBLAKE3;
      exports2.createCRC32 = createCRC32;
      exports2.createCRC64 = createCRC64;
      exports2.createHMAC = createHMAC;
      exports2.createKeccak = createKeccak;
      exports2.createMD4 = createMD4;
      exports2.createMD5 = createMD5;
      exports2.createRIPEMD160 = createRIPEMD160;
      exports2.createSHA1 = createSHA1;
      exports2.createSHA224 = createSHA224;
      exports2.createSHA256 = createSHA256;
      exports2.createSHA3 = createSHA3;
      exports2.createSHA384 = createSHA384;
      exports2.createSHA512 = createSHA512;
      exports2.createSM3 = createSM3;
      exports2.createWhirlpool = createWhirlpool;
      exports2.createXXHash128 = createXXHash128;
      exports2.createXXHash3 = createXXHash3;
      exports2.createXXHash32 = createXXHash32;
      exports2.createXXHash64 = createXXHash64;
      exports2.keccak = keccak;
      exports2.md4 = md4;
      exports2.md5 = md5;
      exports2.pbkdf2 = pbkdf2;
      exports2.ripemd160 = ripemd160;
      exports2.scrypt = scrypt;
      exports2.sha1 = sha1;
      exports2.sha224 = sha224;
      exports2.sha256 = sha2562;
      exports2.sha3 = sha3;
      exports2.sha384 = sha384;
      exports2.sha512 = sha512;
      exports2.sm3 = sm3;
      exports2.whirlpool = whirlpool;
      exports2.xxhash128 = xxhash128;
      exports2.xxhash3 = xxhash3;
      exports2.xxhash32 = xxhash32;
      exports2.xxhash64 = xxhash64;
    }));
  }
});

// node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = /* @__PURE__ */ Symbol();

// node_modules/hono/dist/utils/buffer.js
var bufferToFormData = (arrayBuffer, contentType) => {
  return new Response(arrayBuffer, { headers: { "Content-Type": contentType.replace(/^[^;]+/, (mediaType) => mediaType.toLowerCase()) } }).formData();
};

// node_modules/hono/dist/utils/body.js
var MAX_NESTED_OBJECTS = 1e4;
var isRawRequest = (request) => "headers" in request;
var parseBody = async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const mediaType = (isRawRequest(request) ? request.headers : request.raw.headers).get("Content-Type")?.split(";")[0].trim().toLowerCase();
  if (mediaType === "multipart/form-data" || mediaType === "application/x-www-form-urlencoded") return parseFormData(request, {
    all,
    dot
  });
  return {};
};
async function parseFormData(request, options) {
  if (!isRawRequest(request) && request.bodyCache.formData) return convertFormDataToBodyData(await request.bodyCache.formData, options);
  const headers = isRawRequest(request) ? request.headers : request.raw.headers;
  const arrayBuffer = await request.arrayBuffer();
  const formDataPromise = bufferToFormData(arrayBuffer, headers.get("Content-Type") || "");
  if (!isRawRequest(request)) request.bodyCache.formData = formDataPromise;
  const formData = await formDataPromise;
  if (formData) return convertFormDataToBodyData(formData, options);
  return {};
}
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  const nestingState = { count: 0 };
  formData.forEach((value, key) => {
    if (!(options.all || key.endsWith("[]"))) form[key] = value;
    else handleParsingAllValues(form, key, value);
  });
  if (options.dot) Object.entries(form).forEach(([key, value]) => {
    if (key.includes(".")) {
      handleParsingNestedValues(form, key, value, nestingState);
      delete form[key];
    }
  });
  return form;
}
var handleParsingAllValues = (form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) form[key].push(value);
    else form[key] = [form[key], value];
  } else if (!key.endsWith("[]")) form[key] = value;
  else form[key] = [value];
};
var handleParsingNestedValues = (form, key, value, state) => {
  if (/(?:^|\.)__proto__\./.test(key)) return;
  let nestedForm = form;
  const keys2 = key.split(".", 34);
  if (keys2.length > 33) throwNestingLimitExceeded();
  keys2.forEach((key2, index) => {
    if (index === keys2.length - 1) nestedForm[key2] = value;
    else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        if (state.count++ >= MAX_NESTED_OBJECTS) throwNestingLimitExceeded();
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
};
var throwNestingLimitExceeded = () => {
  throw new Error("Nesting limit exceeded");
};

// node_modules/hono/dist/utils/url.js
var splitPath = (path) => {
  const paths = path.split("/");
  if (paths[0] === "") paths.shift();
  return paths;
};
var splitRoutingPath = (routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
};
var extractGroupsFromPath = (path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match2, index) => {
    const mark = `@${index}`;
    groups.push([mark, match2]);
    return mark;
  });
  return {
    groups,
    path
  };
};
var replaceGroupMarks = (paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) if (paths[j].includes(mark)) {
      paths[j] = paths[j].replace(mark, groups[i][1]);
      break;
    }
  }
  return paths;
};
var patternCache = {};
var getPattern = (label, next) => {
  if (label === "*") return "*";
  const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match2) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match2[2]) patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [
        cacheKey,
        match2[1],
        new RegExp(`^${match2[2]}(?=/${next})`)
      ] : [
        label,
        match2[1],
        new RegExp(`^${match2[2]}$`)
      ];
      else patternCache[cacheKey] = [
        label,
        match2[1],
        true
      ];
    }
    return patternCache[cacheKey];
  }
  return null;
};
var tryDecode = (str, decoder2) => {
  try {
    return decoder2(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder2(match2);
      } catch {
        return match2;
      }
    });
  }
};
var tryDecodeURI = (str) => tryDecode(str, decodeURI);
var getPath = (request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const hashIndex = url.indexOf("#", i);
      const end = queryIndex === -1 ? hashIndex === -1 ? void 0 : hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex);
      const path = url.slice(start, end);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63 || charCode === 35) break;
  }
  return url.slice(start, i);
};
var getPathNoStrict = (request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
};
var stripPathPrefix = (rawPath, decodedPath, prefixLength) => {
  if (rawPath.at(-1) === "/" && decodedPath.at(-1) !== "/") rawPath = rawPath.slice(0, -1);
  let index = 0;
  for (let i = decodedPath.indexOf("/"); i !== -1 && i < prefixLength; i = decodedPath.indexOf("/", i + 1)) {
    index = rawPath.indexOf("/", index + 1);
    if (index === -1) return "/";
  }
  return rawPath.slice(index) || "/";
};
var mergePath = (base, sub, ...rest) => {
  if (rest.length) sub = mergePath(sub, ...rest);
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
};
var checkOptionalParameter = (path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) return null;
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) basePath += "/" + segment;
    else if (/\:/.test(segment)) {
      if (segment.charCodeAt(segment.length - 1) === 63) {
        if (results.length === 0 && basePath === "") results.push("/");
        else results.push(basePath);
        const optionalSegment = segment.slice(0, -1);
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else basePath += "/" + segment;
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
};
var tryDecodeURIComponent = (str) => str.indexOf("%") !== -1 ? tryDecode(str, decodeURIComponent_) : str;
var _decodeURI = (value) => {
  if (value.indexOf("+") !== -1) value = value.replace(/\+/g, " ");
  return tryDecodeURIComponent(value);
};
var _getQueryParam = (url, key, multiple) => {
  const hashIndex = url.indexOf("#", 8);
  if (hashIndex !== -1) url = url.slice(0, hashIndex);
  let encoded;
  if (!multiple && key && !/[%+&=]/.test(key)) {
    const queryIndex = url.indexOf("?", 8);
    let keyIndex2 = queryIndex;
    if (keyIndex2 === -1) return;
    if (!url.startsWith(key, keyIndex2 + 1)) keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61 || trailingKeyCode === 38 || isNaN(trailingKeyCode)) {
        if (keyIndex2 > queryIndex && /(?:^|&)[^=&]*[%+]/.test(url.slice(queryIndex + 1, keyIndex2))) break;
        if (trailingKeyCode === 61) {
          const valueIndex = keyIndex2 + key.length + 2;
          const endIndex = url.indexOf("&", valueIndex);
          return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
        }
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) return;
  }
  const results = /* @__PURE__ */ Object.create(null);
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) valueIndex = -1;
    let name = url.slice(keyIndex + 1, valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex);
    if (encoded) name = _decodeURI(name);
    keyIndex = nextKeyIndex;
    if (name === "") continue;
    let value;
    if (valueIndex === -1) value = "";
    else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) value = _decodeURI(value);
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) results[name] = [];
      results[name].push(value);
    } else results[name] ??= value;
  }
  return key ? results[key] : results;
};
var getQueryParam = _getQueryParam;
var getQueryParams = (url, key) => {
  return _getQueryParam(url, key, true);
};
var decodeURIComponent_ = decodeURIComponent;

// node_modules/hono/dist/request.js
var HonoRequest = class {
  /**
  * `.raw` can get the raw Request object.
  *
  * @see {@link https://hono.dev/docs/api/request#raw}
  *
  * @example
  * ```ts
  * // For Cloudflare Workers
  * app.post('/', async (c) => {
  *   const metadata = c.req.raw.cf?.hostMetadata?
  *   ...
  * })
  * ```
  */
  raw;
  #validatedData;
  #matchResult;
  routeIndex = 0;
  /**
  * `.path` can get the pathname of the request.
  *
  * @see {@link https://hono.dev/docs/api/request#path}
  *
  * @example
  * ```ts
  * app.get('/about/me', (c) => {
  *   const pathname = c.req.path // `/about/me`
  * })
  * ```
  */
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex]?.[1][key];
    const param = this.#getParamValue(paramKey);
    return param && tryDecodeURIComponent(param);
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys2 = Object.keys(this.#matchResult[0][this.routeIndex]?.[1] ?? {});
    for (const key of keys2) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== void 0) decoded[key] = tryDecodeURIComponent(value);
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) return this.raw.headers.get(name) ?? void 0;
    const headerData = /* @__PURE__ */ Object.create(null);
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return parseBody(this, options);
  }
  #cachedBody = (key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) return cachedBody;
    for (const anyCachedKey in bodyCache) return bodyCache[anyCachedKey].then((body2) => {
      if (anyCachedKey === "json") body2 = JSON.stringify(body2);
      const contentType = anyCachedKey === "formData" ? void 0 : raw2.headers.get("content-type");
      return new Response(body2, { headers: contentType ? { "Content-Type": contentType } : void 0 })[key]();
    });
    return bodyCache[key] = raw2[key]();
  };
  /**
  * `.json()` can parse Request body of type `application/json`
  *
  * @see {@link https://hono.dev/docs/api/request#json}
  *
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.json()
  * })
  * ```
  */
  json() {
    return this.#cachedBody("text").then((text) => JSON.parse(text));
  }
  /**
  * `.text()` can parse Request body of type `text/plain`
  *
  * @see {@link https://hono.dev/docs/api/request#text}
  *
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.text()
  * })
  * ```
  */
  text() {
    return this.#cachedBody("text");
  }
  /**
  * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
  *
  * @see {@link https://hono.dev/docs/api/request#arraybuffer}
  *
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.arrayBuffer()
  * })
  * ```
  */
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  /**
  * `.bytes()` parses the request body as a `Uint8Array`.
  *
  * @see {@link https://hono.dev/docs/api/request#bytes}
  *
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.bytes()
  * })
  * ```
  */
  bytes() {
    return this.#cachedBody("arrayBuffer").then((buffer) => new Uint8Array(buffer));
  }
  /**
  * Parses the request body as a `Blob`.
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.blob();
  * });
  * ```
  * @see https://hono.dev/docs/api/request#blob
  */
  blob() {
    return this.#cachedBody("blob");
  }
  /**
  * Parses the request body as `FormData`.
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.formData();
  * });
  * ```
  * @see https://hono.dev/docs/api/request#formdata
  */
  formData() {
    return this.#cachedBody("formData");
  }
  /**
  * Adds validated data to the request.
  *
  * @param target - The target of the validation.
  * @param data - The validated data to add.
  */
  addValidatedData(target, data) {
    (this.#validatedData ??= {})[target] = data;
  }
  valid(target) {
    return this.#validatedData?.[target];
  }
  /**
  * `.url` can get the request url strings.
  *
  * @see {@link https://hono.dev/docs/api/request#url}
  *
  * @example
  * ```ts
  * app.get('/about/me', (c) => {
  *   const url = c.req.url // `http://localhost:8787/about/me`
  *   ...
  * })
  * ```
  */
  get url() {
    return this.raw.url;
  }
  /**
  * `.method` can get the method name of the request.
  *
  * @see {@link https://hono.dev/docs/api/request#method}
  *
  * @example
  * ```ts
  * app.get('/about/me', (c) => {
  *   const method = c.req.method // `GET`
  * })
  * ```
  */
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  /**
  * `.matchedRoutes` can return a matched route in the handler
  *
  * @deprecated
  *
  * Use matchedRoutes helper defined in "hono/route" instead.
  *
  * @see {@link https://hono.dev/docs/api/request#matchedroutes}
  *
  * @example
  * ```ts
  * app.use('*', async function logger(c, next) {
  *   await next()
  *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
  *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
  *     console.log(
  *       method,
  *       ' ',
  *       path,
  *       ' '.repeat(Math.max(10 - path.length, 0)),
  *       name,
  *       i === c.req.routeIndex ? '<- respond from here' : ''
  *     )
  *   })
  * })
  * ```
  */
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  /**
  * `.routePath` can retrieve the path registered within the handler
  *
  * @deprecated
  *
  * Use routePath helper defined in "hono/route" instead.
  *
  * @see {@link https://hono.dev/docs/api/request#routepath}
  *
  * @example
  * ```ts
  * app.get('/posts/:id', (c) => {
  *   return c.json({ path: c.req.routePath })
  * })
  * ```
  */
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};

// node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = (value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
};
var resolveCallback = async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) str = str.toString();
    if (str instanceof Promise) str = await str;
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) return Promise.resolve(str);
  if (buffer) buffer[0] += str;
  else buffer = [str];
  const resStr = Promise.all(callbacks.map((c) => c({
    phase,
    buffer,
    context
  }))).then((res) => Promise.all(res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))).then(() => buffer[0]));
  if (preserveCallbacks) return raw(await resStr, callbacks);
  else return resStr;
};

// node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = (contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
};
var createResponseInstance = (body2, init) => new Response(body2, init);
var Context = class {
  #rawRequest;
  #req;
  /**
  * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
  *
  * @see {@link https://hono.dev/docs/api/context#env}
  *
  * @example
  * ```ts
  * // Environment object for Cloudflare Workers
  * app.get('*', async c => {
  *   const counter = c.env.COUNTER
  * })
  * ```
  */
  env = {};
  #var;
  finalized = false;
  /**
  * `.error` can get the error object from the middleware if the Handler throws an error.
  *
  * @see {@link https://hono.dev/docs/api/context#error}
  *
  * @example
  * ```ts
  * app.use('*', async (c, next) => {
  *   await next()
  *   if (c.error) {
  *     // do something...
  *   }
  * })
  * ```
  */
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  /**
  * Creates an instance of the Context class.
  *
  * @param req - The Request object.
  * @param options - Optional configuration options for the context.
  */
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  /**
  * `.req` is the instance of {@link HonoRequest}.
  */
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  /**
  * @see {@link https://hono.dev/docs/api/context#event}
  * The FetchEvent associated with the current request.
  *
  * @throws Will throw an error if the context does not have a FetchEvent.
  */
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) return this.#executionCtx;
    else throw Error("This context has no FetchEvent");
  }
  /**
  * @see {@link https://hono.dev/docs/api/context#executionctx}
  * The ExecutionContext associated with the current request.
  *
  * @throws Will throw an error if the context does not have an ExecutionContext.
  */
  get executionCtx() {
    if (this.#executionCtx) return this.#executionCtx;
    else throw Error("This context has no ExecutionContext");
  }
  /**
  * @see {@link https://hono.dev/docs/api/context#res}
  * The Response object for the current request.
  */
  get res() {
    return this.#res ||= createResponseInstance(null, { headers: this.#preparedHeaders ??= new Headers() });
  }
  /**
  * Sets the Response object for the current request.
  *
  * @param _res - The Response object to set.
  */
  set res(_res) {
    if (this.#res && _res) {
      _res = createResponseInstance(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") continue;
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) _res.headers.append("set-cookie", cookie);
        } else _res.headers.set(k, v);
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  /**
  * `.render()` can create a response within a layout.
  *
  * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
  *
  * @example
  * ```ts
  * app.get('/', (c) => {
  *   return c.render('Hello!')
  * })
  * ```
  */
  render = (...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  };
  /**
  * Sets the layout for the response.
  *
  * @param layout - The layout to set.
  * @returns The layout function.
  */
  setLayout = (layout) => this.#layout = layout;
  /**
  * Gets the current layout for the response.
  *
  * @returns The current layout function.
  */
  getLayout = () => this.#layout;
  /**
  * `.setRenderer()` can set the layout in the custom middleware.
  *
  * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
  *
  * @example
  * ```tsx
  * app.use('*', async (c, next) => {
  *   c.setRenderer((content) => {
  *     return c.html(
  *       <html>
  *         <body>
  *           <p>{content}</p>
  *         </body>
  *       </html>
  *     )
  *   })
  *   await next()
  * })
  * ```
  */
  setRenderer = (renderer) => {
    this.#renderer = renderer;
  };
  /**
  * `.header()` can set headers.
  *
  * @see {@link https://hono.dev/docs/api/context#header}
  *
  * @example
  * ```ts
  * app.get('/welcome', (c) => {
  *   // Set headers
  *   c.header('X-Message', 'Hello!')
  *   c.header('Content-Type', 'text/plain')
  *
  *   // Append multiple headers using the append option (e.g. Vary)
  *   c.header('Vary', 'Accept-Encoding', { append: true })
  *   c.header('Vary', 'User-Agent', { append: true })
  *
  *   return c.body('Thank you for coming')
  * })
  * ```
  */
  header = (name, value, options) => {
    if (this.finalized && !this.#res.bodyUsed) this.#res = createResponseInstance(this.#res.body, this.#res);
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) headers.delete(name);
    else if (options?.append) headers.append(name, value);
    else headers.set(name, value);
  };
  status = (status) => {
    this.#status = status;
  };
  /**
  * `.set()` can set the value specified by the key.
  *
  * @see {@link https://hono.dev/docs/api/context#set-get}
  *
  * @example
  * ```ts
  * app.use('*', async (c, next) => {
  *   c.set('message', 'Hono is hot!!')
  *   await next()
  * })
  * ```
  */
  set = (key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  };
  /**
  * `.get()` can use the value specified by the key.
  *
  * @see {@link https://hono.dev/docs/api/context#set-get}
  *
  * @example
  * ```ts
  * app.get('/', (c) => {
  *   const message = c.get('message')
  *   return c.text(`The message is "${message}"`)
  * })
  * ```
  */
  get = (key) => {
    return this.#var ? this.#var.get(key) : void 0;
  };
  /**
  * `.var` can access the value of a variable.
  *
  * @see {@link https://hono.dev/docs/api/context#var}
  *
  * @example
  * ```ts
  * const result = c.var.client.oneMethod()
  * ```
  */
  get var() {
    if (!this.#var) return {};
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    let responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders;
    if (typeof arg === "object" && arg.headers) {
      responseHeaders ??= new Headers();
      for (const [key, value] of new Headers(arg.headers)) if (key === "set-cookie") responseHeaders.append(key, value);
      else responseHeaders.set(key, value);
    }
    if (headers) {
      if (!responseHeaders) {
        let count = 0;
        for (const k in headers) if (++count > 1 || typeof headers[k] !== "string") {
          responseHeaders = new Headers();
          break;
        }
      }
      if (responseHeaders) for (const k in headers) {
        const v = headers[k];
        if (typeof v === "string") responseHeaders.set(k, v);
        else {
          responseHeaders.delete(k);
          for (const v2 of v) responseHeaders.append(k, v2);
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return createResponseInstance(data, {
      status,
      headers: responseHeaders ?? headers
    });
  }
  newResponse = (...args) => this.#newResponse(...args);
  /**
  * `.body()` can return the HTTP response.
  * You can set headers with `.header()` and set HTTP status code with `.status`.
  * This can also be set in `.text()`, `.json()` and so on.
  *
  * @see {@link https://hono.dev/docs/api/context#body}
  *
  * @example
  * ```ts
  * app.get('/welcome', (c) => {
  *   // Set headers
  *   c.header('X-Message', 'Hello!')
  *   c.header('Content-Type', 'text/plain')
  *   // Set HTTP status code
  *   c.status(201)
  *
  *   // Return the response body
  *   return c.body('Thank you for coming')
  * })
  * ```
  */
  body = (data, arg, headers) => this.#newResponse(data, arg, headers);
  /**
  * `.text()` can render text as `Content-Type:text/plain`.
  *
  * @see {@link https://hono.dev/docs/api/context#text}
  *
  * @example
  * ```ts
  * app.get('/say', (c) => {
  *   return c.text('Hello!')
  * })
  * ```
  */
  text = (text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(text, arg, setDefaultContentType(TEXT_PLAIN, headers));
  };
  /**
  * `.json()` can render JSON as `Content-Type:application/json`.
  *
  * @see {@link https://hono.dev/docs/api/context#json}
  *
  * @example
  * ```ts
  * app.get('/api', (c) => {
  *   return c.json({ message: 'Hello!' })
  * })
  * ```
  */
  json = (object, arg, headers) => {
    return this.#newResponse(JSON.stringify(object), arg, setDefaultContentType("application/json", headers));
  };
  html = (html, arg, headers) => {
    const res = (html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers));
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  };
  /**
  * `.redirect()` can Redirect, default status code is 302.
  *
  * @see {@link https://hono.dev/docs/api/context#redirect}
  *
  * @example
  * ```ts
  * app.get('/redirect', (c) => {
  *   return c.redirect('/')
  * })
  * app.get('/redirect-permanently', (c) => {
  *   return c.redirect('/', 301)
  * })
  * ```
  */
  redirect = (location, status) => {
    const locationString = String(location);
    this.header("Location", !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString));
    return this.newResponse(null, status ?? 302);
  };
  /**
  * `.notFound()` can return the Not Found Response.
  *
  * @see {@link https://hono.dev/docs/api/context#notfound}
  *
  * @example
  * ```ts
  * app.get('/notfound', (c) => {
  *   return c.notFound()
  * })
  * ```
  */
  notFound = () => {
    this.#notFoundHandler ??= () => createResponseInstance();
    return this.#notFoundHandler(this);
  };
};

// node_modules/hono/dist/compose.js
var compose = (middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) throw new Error("next() called multiple times");
      index = i;
      let res;
      let isError = false;
      let handler2;
      if (middleware[i]) {
        handler2 = middleware[i][0][0];
        context.req.routeIndex = i;
      } else handler2 = i === middleware.length && next || void 0;
      if (handler2) try {
        res = await handler2(context, () => dispatch(i + 1));
      } catch (err) {
        if (err instanceof Error && onError) {
          context.error = err;
          res = await onError(err, context);
          isError = true;
        } else throw err;
      }
      else if (context.finalized === false && onNotFound) res = await onNotFound(context);
      if (res && (context.finalized === false || isError)) context.res = res;
      return context;
    }
  };
};

// node_modules/hono/dist/router.js
var METHODS = [
  "get",
  "post",
  "put",
  "delete",
  "options",
  "patch",
  "query"
];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
};

// node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// node_modules/hono/dist/utils/mount.js
var getPathPrefixLength = (c, pathPrefix, routePath) => {
  if (!/[:*]/.test(pathPrefix)) return pathPrefix.length;
  const path = c.req.path;
  const matchResult = c.req[GET_MATCH_RESULT];
  const paramNames = /* @__PURE__ */ new Set();
  let length = 0;
  for (const part of splitRoutingPath(pathPrefix)) {
    const pattern = getPattern(part);
    if (pattern && pattern !== "*") {
      const name = pattern[1];
      if (paramNames.has(name)) throw new Error(`mount(): Duplicate path parameter "${name}" in "${routePath}".`);
      paramNames.add(name);
    }
    if (pattern && pattern !== "*" && pattern[2] !== true) {
      const value = matchResult.length === 2 ? matchResult[1][matchResult[0][c.req.routeIndex][1][pattern[1]]] : matchResult[0][c.req.routeIndex][1][pattern[1]];
      length += value.length + 1;
    } else if (pattern || part.endsWith("*")) {
      const end = path.indexOf("/", length + 1);
      length = end === -1 ? path.length : end;
    } else length += part.length + 1;
  }
  return length;
};
var createMountedRequest = (c, pathPrefix, routePath) => {
  if (/[^/]\*$/.test(routePath)) throw new Error(`mount(): Wildcard must follow "/" in "${routePath}".`);
  const url = new URL(c.req.raw.url);
  url.pathname = stripPathPrefix(url.pathname, c.req.path, getPathPrefixLength(c, pathPrefix, routePath));
  return new Request(url, c.req.raw);
};

// node_modules/hono/dist/hono-base.js
var notFoundHandler = (c) => {
  return c.text("404 Not Found", 404);
};
var errorHandler = (err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
};
var Hono = class Hono2 {
  get;
  post;
  put;
  delete;
  options;
  patch;
  query;
  all;
  on;
  use;
  router;
  getPath;
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    [...METHODS, "all"].forEach((method) => {
      this[method] = (args1, ...args) => {
        const methodName = method.toUpperCase();
        if (typeof args1 === "string") this.#path = args1;
        else this.#addRoute(methodName, this.#path, args1);
        args.forEach((handler2) => {
          this.#addRoute(methodName, this.#path, handler2);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          const methodName = m.toUpperCase();
          for (const handler2 of handlers) this.#addRoute(methodName, this.#path, handler2);
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") this.#path = arg1;
      else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler2) => {
        this.#addRoute("ALL", this.#path, handler2);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new Hono2({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  errorHandler = errorHandler;
  /**
  * `.route()` allows grouping other Hono instance in routes.
  *
  * @see {@link https://hono.dev/docs/api/routing#grouping}
  *
  * @param {string} path - base Path
  * @param {Hono} app - other Hono instance
  * @returns {Hono} routed Hono instance
  *
  * @example
  * ```ts
  * const app = new Hono()
  * const app2 = new Hono()
  *
  * app2.get("/user", (c) => c.text("user"))
  * app.route("/api", app2) // GET /api/user
  * ```
  */
  route(path, app2) {
    const subApp = this.basePath(path);
    app2.routes.map((r) => {
      let handler2;
      if (app2.errorHandler === errorHandler) handler2 = r.handler;
      else {
        handler2 = async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res;
        handler2[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler2, r.basePath);
    });
    return this;
  }
  /**
  * `.basePath()` allows base paths to be specified.
  *
  * @see {@link https://hono.dev/docs/api/routing#base-path}
  *
  * @param {string} path - base Path
  * @returns {Hono} changed Hono instance
  *
  * @example
  * ```ts
  * const api = new Hono().basePath('/api')
  * ```
  */
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  /**
  * `.onError()` handles an error and returns a customized Response.
  *
  * @see {@link https://hono.dev/docs/api/hono#error-handling}
  *
  * @param {ErrorHandler} handler - request Handler for error
  * @returns {Hono} changed Hono instance
  *
  * @example
  * ```ts
  * app.onError((err, c) => {
  *   console.error(`${err}`)
  *   return c.text('Custom Error Message', 500)
  * })
  * ```
  */
  onError = (handler2) => {
    this.errorHandler = handler2;
    return this;
  };
  /**
  * `.notFound()` allows you to customize a Not Found Response.
  *
  * @see {@link https://hono.dev/docs/api/hono#not-found}
  *
  * @param {NotFoundHandler} handler - request handler for not-found
  * @returns {Hono} changed Hono instance
  *
  * @example
  * ```ts
  * app.notFound((c) => {
  *   return c.text('Custom 404 Message', 404)
  * })
  * ```
  */
  notFound = (handler2) => {
    this.#notFoundHandler = handler2;
    return this;
  };
  /**
  * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
  *
  * @deprecated Use `mount()` from `hono/mount` instead. `.mount()` will be removed in v5.
  *
  * @see {@link https://hono.dev/docs/api/hono#mount}
  *
  * @param {string} path - base Path
  * @param {Function} applicationHandler - other Request Handler
  * @param {MountOptions} [options] - options of `.mount()`
  * @returns {Hono} mounted Hono instance
  *
  * @example
  * ```ts
  * import { Router as IttyRouter } from 'itty-router'
  * import { Hono } from 'hono'
  * // Create itty-router application
  * const ittyRouter = IttyRouter()
  * // GET /itty-router/hello
  * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
  *
  * const app = new Hono()
  * app.mount('/itty-router', ittyRouter.handle)
  * ```
  *
  * @example
  * ```ts
  * const app = new Hono()
  * // Send the request to another application without modification.
  * app.mount('/app', anotherApp, {
  *   replaceRequest: (req) => req,
  * })
  * ```
  */
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") optionHandler = options;
      else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) replaceRequest = (request) => request;
        else replaceRequest = options.replaceRequest;
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    const mergedPath = mergePath(this._basePath, path);
    const defaultReplaceRequest = (c) => createMountedRequest(c, mergedPath.replace(/\/$/, ""), mergePath(mergedPath, "*"));
    const handler2 = async (c, next) => {
      const res = await applicationHandler(replaceRequest ? replaceRequest(c.req.raw) : defaultReplaceRequest(c), ...getOptions(c));
      if (res) return res;
      await next();
    };
    this.#addRoute("ALL", mergePath(path, "*"), handler2);
    return this;
  }
  #addRoute(method, path, handler2, baseRoutePath) {
    path = mergePath(this._basePath, path);
    const r = {
      basePath: baseRoutePath !== void 0 ? mergePath(this._basePath, baseRoutePath) : this._basePath,
      path,
      method,
      handler: handler2
    };
    this.router.add(method, path, [handler2, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) return this.errorHandler(err, c);
    throw err;
  }
  #dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
    const path = this.getPath(request, { env });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then((resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) throw new Error("Context is not finalized. Did you forget to return a Response object or `await next()`?");
        return context.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  /**
  * `.fetch()` will be entry point of your app.
  *
  * @see {@link https://hono.dev/docs/api/hono#fetch}
  *
  * @param {Request} request - request Object of request
  * @param {Env} env - env Object
  * @param {ExecutionContext} executionCtx - context of execution
  * @returns {Response | Promise<Response>} response of request
  *
  */
  fetch = (request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  };
  /**
  * `.request()` is a useful method for testing.
  * You can pass a URL or pathname to send a GET request.
  * app will return a Response object.
  * ```ts
  * test('GET /hello is ok', async () => {
  *   const res = await app.request('/hello')
  *   expect(res.status).toBe(200)
  * })
  * ```
  * @see https://hono.dev/docs/api/hono#request
  */
  request = (input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    input = input.toString();
    return this.fetch(new Request(/^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`, requestInit), Env, executionCtx);
  };
  /**
  * `.fire()` automatically adds a global fetch event listener.
  * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
  * @deprecated
  * Use `fire` from `hono/service-worker` instead.
  * ```ts
  * import { Hono } from 'hono'
  * import { fire } from 'hono/service-worker'
  *
  * const app = new Hono()
  * // ...
  * fire(app)
  * ```
  * @see https://hono.dev/docs/api/hono#fire
  * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
  * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
  */
  fire = () => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  };
};

// node_modules/hono/dist/router/utils.js
var createNullObject = () => /* @__PURE__ */ Object.create(null);

// node_modules/hono/dist/router/reg-exp-router/matcher.js
var emptyParam = [];
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match2 = ((method2, path2) => {
    const matcher = matchers[method2] || matchers["ALL"];
    const staticMatch = matcher[2][path2];
    if (staticMatch) return staticMatch;
    const match3 = path2.match(matcher[0]);
    if (!match3) return [[], emptyParam];
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  });
  this.match = match2;
  return match2(method, path);
}

// node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = "[^]*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/[^]*)";
var PATH_ERROR = /* @__PURE__ */ Symbol();
var regExpMetaChars = /* @__PURE__ */ new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) return b.length === 1 ? a < b ? -1 : 1 : -1;
  if (b.length === 1) return 1;
  if (a === "[^]*" || a === "(?:|/[^]*)") return b === "[^]*" ? -1 : 1;
  else if (b === "[^]*" || b === "(?:|/[^]*)") return -1;
  if (a === "[^/]+") return 1;
  else if (b === "[^/]+") return -1;
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
var Node = class Node2 {
  #index;
  #varIndex;
  #children = createNullObject();
  insert(tokens, index, paramMap, context, keys2) {
    let node = this;
    for (let i = 0, len = tokens.length; i < len; i++) {
      const token = tokens[i];
      const pattern = token.length === 1 ? token === "*" ? i === len - 1 ? [
        "",
        "",
        ONLY_WILDCARD_REG_EXP_STR
      ] : [
        "",
        "",
        LABEL_REG_EXP_STR
      ] : null : token === "/*" ? [
        "",
        "",
        TAIL_WILDCARD_REG_EXP_STR
      ] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
      let nextNode;
      if (pattern) {
        const name = pattern[1];
        let regexpStr = pattern[2] || "[^/]+";
        if (name && pattern[2]) {
          if (new RegExp(regexpStr).test("")) throw PATH_ERROR;
          regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
          if (/\((?!\?:)/.test(regexpStr)) throw PATH_ERROR;
          if (regexpStr.length === 1 && regExpMetaChars.has(regexpStr)) throw PATH_ERROR;
        }
        keys2.push(regexpStr);
        nextNode = node.#children[regexpStr];
        if (!nextNode) {
          if (regexpStr !== "[^]*" && regexpStr !== "(?:|/[^]*)") {
            for (const k in node.#children) if ((regexpStr.length > 1 || k.length > 1) && k !== "[^]*" && k !== "(?:|/[^]*)") throw PATH_ERROR;
          }
          nextNode = node.#children[regexpStr] = new Node2();
        }
        if (name !== "") {
          nextNode.#varIndex ??= context.varIndex++;
          paramMap.push([name, nextNode.#varIndex]);
        }
      } else {
        keys2.push(token);
        nextNode = node.#children[token];
        if (!nextNode) {
          for (const k in node.#children) if (k.length > 1 && k !== "[^]*" && k !== "(?:|/[^]*)") throw PATH_ERROR;
          nextNode = node.#children[token] = new Node2();
        }
      }
      node = nextNode;
    }
    if (node.#index !== void 0) throw PATH_ERROR;
    node.#index = index;
  }
  buildRegExpStr() {
    const strList = Object.keys(this.#children).sort(compareKey).map((k) => {
      const c = this.#children[k];
      const childStr = c.buildRegExpStr();
      return childStr === "" ? "" : (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + childStr;
    }).filter(Boolean);
    if (typeof this.#index === "number" && this.#index !== -1) strList.unshift(`#${this.#index}`);
    if (strList.length === 0) return "";
    if (strList.length === 1) return strList[0];
    return "(?:" + strList.join("|") + ")";
  }
};

// node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = class {
  #context = { varIndex: 0 };
  #root = new Node();
  #index = 0;
  paths = createNullObject();
  insert(path, isStatic) {
    const keys2 = [];
    if (isStatic) {
      this.#root.insert(path.split(""), -1, [], this.#context, keys2);
      this.paths[path] = [
        -1,
        [],
        keys2
      ];
      return;
    }
    const paramAssoc = [];
    const groups = [];
    let markedPath = path;
    for (let i = 0; ; ) {
      let replaced = false;
      markedPath = markedPath.replace(/\{(?:\{[\d,]+\}|[^}])+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) break;
    }
    const tokens = markedPath.match(/(?::[^\/]+)|(?:\/\*$)|./gs) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) if (tokens[j].indexOf(mark) !== -1) {
        tokens[j] = tokens[j].replace(mark, groups[i][1]);
        break;
      }
    }
    this.#root.insert(tokens, this.#index, paramAssoc, this.#context, keys2);
    this.paths[path] = [
      this.#index++,
      paramAssoc,
      keys2
    ];
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") return [
      /^$/,
      [],
      []
    ];
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [
      new RegExp(`^${regexp}`),
      indexReplacementMap,
      paramReplacementMap
    ];
  }
};

// node_modules/hono/dist/router/reg-exp-router/router.js
function endsWithWildcard(keys2) {
  const tail = keys2[keys2.length - 1];
  return tail === "[^]*" || tail === "(?:|/[^]*)";
}
function covers(wildcard, target) {
  const last = wildcard.length - 1;
  for (let i = 0; i < last; i++) if (wildcard[i] !== target[i]) return false;
  return wildcard[last] === "[^]*" || target.length === last || target[last] === "/";
}
var RegExpRouter = class {
  name = "RegExpRouter";
  #handlers;
  #tries;
  constructor() {
    this.#handlers = { ["ALL"]: [] };
    this.#tries = { ["ALL"]: new Trie() };
  }
  #insertPath(method, path) {
    try {
      this.#tries[method].insert(path, !/\*|\/:/.test(path));
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
  }
  add(method, path, handler2) {
    const handlers = this.#handlers;
    if (!handlers) throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    const tries = this.#tries;
    if (!handlers[method]) {
      tries[method] = new Trie();
      handlers[method] = [...handlers["ALL"]];
      for (const p in tries["ALL"].paths) this.#insertPath(method, p);
    }
    if (path === "/*") path = "*";
    const methods = method === "ALL" ? Object.keys(handlers) : [method];
    const paths = checkOptionalParameter(path) || [path];
    for (const path2 of paths) for (const m of methods) {
      if (!tries[m].paths[path2]) this.#insertPath(m, path2);
      handlers[m].push([handler2, path2]);
    }
  }
  match = match;
  buildAllMatchers() {
    const matchers = createNullObject();
    for (const method of Object.keys(this.#handlers)) matchers[method] = this.#buildMatcher(method);
    this.#handlers = this.#tries = void 0;
    return matchers;
  }
  #buildMatcher(method) {
    const handlers = this.#handlers[method];
    const trie = this.#tries[method];
    const staticMap = createNullObject();
    const handlerData = [];
    const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
    const own = createNullObject();
    const entries = handlers.map(([h, p], i) => {
      (own[p] ??= []).push(i);
      return [h, trie.paths[p][1].reduceRight((map, [key, varIndex]) => {
        map[key] = paramReplacementMap[varIndex];
        return map;
      }, createNullObject())];
    });
    const wildcards = Object.keys(own).filter((p) => endsWithWildcard(trie.paths[p][2]));
    for (const path in trie.paths) {
      const [index, , keys2] = trie.paths[path];
      const indexes = [...own[path]];
      for (const p of wildcards) if (p !== path && covers(trie.paths[p][2], keys2)) indexes.push(...own[p]);
      const data = indexes.sort((a, b) => a - b).map((i) => entries[i]);
      if (index === -1) {
        const last = Math.max(-1, ...data.flatMap(([, map]) => Object.values(map)));
        staticMap[path] = [data, last === -1 ? emptyParam : path.match(regexp).slice(0, last + 1)];
      } else handlerData[index] = data;
    }
    return [
      regexp,
      indexReplacementMap.map((i) => handlerData[i]),
      staticMap
    ];
  }
};

// node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = class {
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler2) {
    if (!this.#routes) throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    this.#routes.push([
      method,
      path,
      handler2
    ]);
  }
  match(method, path) {
    if (!this.#routes) throw new Error("Fatal error");
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) router.add(...routes[i2]);
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) continue;
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) throw new Error("Fatal error");
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) throw new Error("No active router has been determined yet.");
    return this.#routers[0];
  }
};

// node_modules/hono/dist/router/trie-router/node.js
var emptyParams = createNullObject();
var order = 0;
var Node3 = class Node4 {
  #methods = [];
  #children = createNullObject();
  #patterns = [];
  #pattern;
  #params = emptyParams;
  insert(method, path, handler2) {
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = /* @__PURE__ */ new Set();
    let i = 0;
    for (const p of parts) {
      const nextP = parts[++i];
      const pattern = getPattern(p, nextP) || (nextP === void 0 && p && p.indexOf("*") === p.length - 1 ? p : null);
      const isParam = Array.isArray(pattern);
      const key = isParam ? pattern[0] : pattern || p;
      const child = curNode.#children[key] ||= new Node4();
      if (pattern && !child.#pattern) {
        child.#pattern = pattern;
        curNode.#patterns.push(child);
      }
      curNode = child;
      if (isParam) possibleKeys.add(pattern[1]);
    }
    curNode.#methods.push({ [method]: {
      handler: handler2,
      possibleKeys: [...possibleKeys],
      score: ++order
    } });
  }
  #pushHandlerSets(handlerSets, node, method, nodeParams, params) {
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m["ALL"];
      if (handlerSet) {
        handlerSet.params = createNullObject();
        handlerSets.push(handlerSet);
        for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
          const key = handlerSet.possibleKeys[i2];
          handlerSet.params[key] = params?.[key] && !i2 ? params[key] : nodeParams[key] ?? params?.[key];
        }
      }
    }
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    let curNodes = [this];
    const parts = splitPath(path);
    const curNodesQueue = [];
    const len = parts.length;
    let partOffsets = null;
    for (let i = 0; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) this.#pushHandlerSets(handlerSets, nextNode.#children["*"], method, node.#params);
            this.#pushHandlerSets(handlerSets, nextNode, method, node.#params);
          } else tempNodes.push(nextNode);
        }
        for (const child of node.#patterns) {
          const pattern = child.#pattern;
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (typeof pattern === "string") {
            if (pattern === "*" || part.startsWith(pattern.slice(0, -1))) {
              this.#pushHandlerSets(handlerSets, child, method, node.#params);
              if (pattern === "*") {
                child.#params = params;
                tempNodes.push(child);
              }
            }
            continue;
          }
          const [, name, matcher] = pattern;
          if (!part && matcher === true) continue;
          if (matcher !== true) {
            if (!partOffsets) {
              partOffsets = [];
              let offset = path[0] === "/" ? 1 : 0;
              for (let p = 0; p < len; p++) {
                partOffsets[p] = offset;
                offset += parts[p].length + 1;
              }
            }
            const restPathString = path.slice(partOffsets[i]);
            const m = matcher.exec(restPathString);
            if (m) {
              if (!Object.hasOwn(params, name)) params[name] = m[0];
              this.#pushHandlerSets(handlerSets, child, method, node.#params, params);
              if (m[0].length === restPathString.length && child.#children["*"]) this.#pushHandlerSets(handlerSets, child.#children["*"], method, node.#params, params);
              for (const _ in child.#children) {
                child.#params = params;
                const componentCount = m[0].match(/\//g)?.length ?? 0;
                (curNodesQueue[componentCount] ||= []).push(child);
                break;
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            if (!Object.hasOwn(params, name)) params[name] = part;
            if (isLast) {
              this.#pushHandlerSets(handlerSets, child, method, params, node.#params);
              if (child.#children["*"]) this.#pushHandlerSets(handlerSets, child.#children["*"], method, params, node.#params);
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      const shifted = curNodesQueue.shift();
      curNodes = shifted ? tempNodes.concat(shifted) : tempNodes;
    }
    if (handlerSets[1]) handlerSets.sort((a, b) => {
      return a.score - b.score;
    });
    return [handlerSets.map(({ handler: handler2, params }) => [handler2, params])];
  }
};

// node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  name = "TrieRouter";
  #node = new Node3();
  add(method, path, handler2) {
    for (const result of checkOptionalParameter(path) || [path]) this.#node.insert(method, result, handler2);
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
};

// node_modules/hono/dist/hono.js
var Hono3 = class extends Hono {
  /**
  * Creates an instance of the Hono class.
  *
  * @param options - Optional configuration options for the Hono instance.
  */
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({ routers: [new RegExpRouter(), new TrieRouter()] });
  }
};

// node_modules/hono/dist/middleware/cors/index.js
var cors = (options) => {
  const opts = {
    origin: "*",
    allowMethods: [
      "GET",
      "HEAD",
      "PUT",
      "POST",
      "DELETE",
      "PATCH",
      "QUERY"
    ],
    allowHeaders: [],
    exposeHeaders: [],
    ...options
  };
  const exposeHeadersStr = opts.exposeHeaders?.length ? opts.exposeHeaders.join(",") : void 0;
  const allowHeadersStr = opts.allowHeaders?.length ? opts.allowHeaders.join(",") : void 0;
  const findAllowOrigin = ((optsOrigin) => {
    if (typeof optsOrigin === "string") {
      if (optsOrigin === "*") return () => optsOrigin;
      else return (origin) => optsOrigin === origin ? origin : null;
    } else if (typeof optsOrigin === "function") return optsOrigin;
    else return (origin) => optsOrigin.includes(origin) ? origin : null;
  })(opts.origin);
  const findAllowMethods = ((optsAllowMethods) => {
    if (typeof optsAllowMethods === "function") return async (origin, c) => (await optsAllowMethods(origin, c)).join(",");
    else if (Array.isArray(optsAllowMethods)) {
      const methodsStr = optsAllowMethods.join(",");
      return () => methodsStr;
    } else return () => "";
  })(opts.allowMethods);
  return async function cors2(c, next) {
    function set(key, value) {
      c.res.headers.set(key, value);
    }
    const allowOrigin = await findAllowOrigin(c.req.header("origin") || "", c);
    if (allowOrigin) set("Access-Control-Allow-Origin", allowOrigin);
    if (opts.credentials) set("Access-Control-Allow-Credentials", "true");
    if (exposeHeadersStr) set("Access-Control-Expose-Headers", exposeHeadersStr);
    if (c.req.method === "OPTIONS") {
      if (opts.origin !== "*") c.res.headers.append("Vary", "Origin");
      if (opts.maxAge != null) set("Access-Control-Max-Age", opts.maxAge.toString());
      const allowMethods = await findAllowMethods(c.req.header("origin") || "", c);
      if (allowMethods) set("Access-Control-Allow-Methods", allowMethods);
      let headersStr = allowHeadersStr;
      if (!headersStr) {
        const requestHeaders = c.req.header("Access-Control-Request-Headers");
        if (requestHeaders) headersStr = requestHeaders.split(",").map((h) => h.trim()).join(",");
      }
      if (headersStr) {
        set("Access-Control-Allow-Headers", headersStr);
        c.res.headers.append("Vary", "Access-Control-Request-Headers");
      }
      c.res.headers.delete("Content-Length");
      c.res.headers.delete("Content-Type");
      return new Response(null, {
        headers: c.res.headers,
        status: 204,
        statusText: "No Content"
      });
    }
    await next();
    if (opts.origin !== "*") c.header("Vary", "Origin", { append: true });
  };
};

// src/index.js
import { createHash as createHash2, pbkdf2Sync as pbkdf2Sync2, randomBytes as randomBytes3, timingSafeEqual as timingSafeEqual3 } from "node:crypto";

// src/crypto.js
import { createHash, createHmac as createHmac2, randomBytes, randomUUID, pbkdf2Sync, timingSafeEqual as timingSafeEqual2 } from "node:crypto";

// node_modules/jose/dist/node/esm/runtime/base64url.js
import { Buffer as Buffer2 } from "node:buffer";

// node_modules/jose/dist/node/esm/lib/buffer_utils.js
var encoder = new TextEncoder();
var decoder = new TextDecoder();
var MAX_INT32 = 2 ** 32;
function concat(...buffers) {
  const size = buffers.reduce((acc, { length }) => acc + length, 0);
  const buf = new Uint8Array(size);
  let i = 0;
  for (const buffer of buffers) {
    buf.set(buffer, i);
    i += buffer.length;
  }
  return buf;
}

// node_modules/jose/dist/node/esm/runtime/base64url.js
function normalize(input) {
  let encoded = input;
  if (encoded instanceof Uint8Array) {
    encoded = decoder.decode(encoded);
  }
  return encoded;
}
var encode = (input) => Buffer2.from(input).toString("base64url");
var decode = (input) => new Uint8Array(Buffer2.from(normalize(input), "base64url"));

// node_modules/jose/dist/node/esm/util/errors.js
var JOSEError = class extends Error {
  static code = "ERR_JOSE_GENERIC";
  code = "ERR_JOSE_GENERIC";
  constructor(message2, options) {
    super(message2, options);
    this.name = this.constructor.name;
    Error.captureStackTrace?.(this, this.constructor);
  }
};
var JWTClaimValidationFailed = class extends JOSEError {
  static code = "ERR_JWT_CLAIM_VALIDATION_FAILED";
  code = "ERR_JWT_CLAIM_VALIDATION_FAILED";
  claim;
  reason;
  payload;
  constructor(message2, payload, claim = "unspecified", reason = "unspecified") {
    super(message2, { cause: { claim, reason, payload } });
    this.claim = claim;
    this.reason = reason;
    this.payload = payload;
  }
};
var JWTExpired = class extends JOSEError {
  static code = "ERR_JWT_EXPIRED";
  code = "ERR_JWT_EXPIRED";
  claim;
  reason;
  payload;
  constructor(message2, payload, claim = "unspecified", reason = "unspecified") {
    super(message2, { cause: { claim, reason, payload } });
    this.claim = claim;
    this.reason = reason;
    this.payload = payload;
  }
};
var JOSEAlgNotAllowed = class extends JOSEError {
  static code = "ERR_JOSE_ALG_NOT_ALLOWED";
  code = "ERR_JOSE_ALG_NOT_ALLOWED";
};
var JOSENotSupported = class extends JOSEError {
  static code = "ERR_JOSE_NOT_SUPPORTED";
  code = "ERR_JOSE_NOT_SUPPORTED";
};
var JWSInvalid = class extends JOSEError {
  static code = "ERR_JWS_INVALID";
  code = "ERR_JWS_INVALID";
};
var JWTInvalid = class extends JOSEError {
  static code = "ERR_JWT_INVALID";
  code = "ERR_JWT_INVALID";
};
var JWSSignatureVerificationFailed = class extends JOSEError {
  static code = "ERR_JWS_SIGNATURE_VERIFICATION_FAILED";
  code = "ERR_JWS_SIGNATURE_VERIFICATION_FAILED";
  constructor(message2 = "signature verification failed", options) {
    super(message2, options);
  }
};

// node_modules/jose/dist/node/esm/runtime/is_key_object.js
import * as util from "node:util";
var is_key_object_default = (obj) => util.types.isKeyObject(obj);

// node_modules/jose/dist/node/esm/runtime/webcrypto.js
import * as crypto2 from "node:crypto";
import * as util2 from "node:util";
var webcrypto2 = crypto2.webcrypto;
var webcrypto_default = webcrypto2;
var isCryptoKey = (key) => util2.types.isCryptoKey(key);

// node_modules/jose/dist/node/esm/lib/crypto_key.js
function unusable(name, prop = "algorithm.name") {
  return new TypeError(`CryptoKey does not support this operation, its ${prop} must be ${name}`);
}
function isAlgorithm(algorithm, name) {
  return algorithm.name === name;
}
function getHashLength(hash) {
  return parseInt(hash.name.slice(4), 10);
}
function getNamedCurve(alg) {
  switch (alg) {
    case "ES256":
      return "P-256";
    case "ES384":
      return "P-384";
    case "ES512":
      return "P-521";
    default:
      throw new Error("unreachable");
  }
}
function checkUsage(key, usages) {
  if (usages.length && !usages.some((expected) => key.usages.includes(expected))) {
    let msg = "CryptoKey does not support this operation, its usages must include ";
    if (usages.length > 2) {
      const last = usages.pop();
      msg += `one of ${usages.join(", ")}, or ${last}.`;
    } else if (usages.length === 2) {
      msg += `one of ${usages[0]} or ${usages[1]}.`;
    } else {
      msg += `${usages[0]}.`;
    }
    throw new TypeError(msg);
  }
}
function checkSigCryptoKey(key, alg, ...usages) {
  switch (alg) {
    case "HS256":
    case "HS384":
    case "HS512": {
      if (!isAlgorithm(key.algorithm, "HMAC"))
        throw unusable("HMAC");
      const expected = parseInt(alg.slice(2), 10);
      const actual = getHashLength(key.algorithm.hash);
      if (actual !== expected)
        throw unusable(`SHA-${expected}`, "algorithm.hash");
      break;
    }
    case "RS256":
    case "RS384":
    case "RS512": {
      if (!isAlgorithm(key.algorithm, "RSASSA-PKCS1-v1_5"))
        throw unusable("RSASSA-PKCS1-v1_5");
      const expected = parseInt(alg.slice(2), 10);
      const actual = getHashLength(key.algorithm.hash);
      if (actual !== expected)
        throw unusable(`SHA-${expected}`, "algorithm.hash");
      break;
    }
    case "PS256":
    case "PS384":
    case "PS512": {
      if (!isAlgorithm(key.algorithm, "RSA-PSS"))
        throw unusable("RSA-PSS");
      const expected = parseInt(alg.slice(2), 10);
      const actual = getHashLength(key.algorithm.hash);
      if (actual !== expected)
        throw unusable(`SHA-${expected}`, "algorithm.hash");
      break;
    }
    case "EdDSA": {
      if (key.algorithm.name !== "Ed25519" && key.algorithm.name !== "Ed448") {
        throw unusable("Ed25519 or Ed448");
      }
      break;
    }
    case "Ed25519": {
      if (!isAlgorithm(key.algorithm, "Ed25519"))
        throw unusable("Ed25519");
      break;
    }
    case "ES256":
    case "ES384":
    case "ES512": {
      if (!isAlgorithm(key.algorithm, "ECDSA"))
        throw unusable("ECDSA");
      const expected = getNamedCurve(alg);
      const actual = key.algorithm.namedCurve;
      if (actual !== expected)
        throw unusable(expected, "algorithm.namedCurve");
      break;
    }
    default:
      throw new TypeError("CryptoKey does not support this operation");
  }
  checkUsage(key, usages);
}

// node_modules/jose/dist/node/esm/lib/invalid_key_input.js
function message(msg, actual, ...types4) {
  types4 = types4.filter(Boolean);
  if (types4.length > 2) {
    const last = types4.pop();
    msg += `one of type ${types4.join(", ")}, or ${last}.`;
  } else if (types4.length === 2) {
    msg += `one of type ${types4[0]} or ${types4[1]}.`;
  } else {
    msg += `of type ${types4[0]}.`;
  }
  if (actual == null) {
    msg += ` Received ${actual}`;
  } else if (typeof actual === "function" && actual.name) {
    msg += ` Received function ${actual.name}`;
  } else if (typeof actual === "object" && actual != null) {
    if (actual.constructor?.name) {
      msg += ` Received an instance of ${actual.constructor.name}`;
    }
  }
  return msg;
}
var invalid_key_input_default = (actual, ...types4) => {
  return message("Key must be ", actual, ...types4);
};
function withAlg(alg, actual, ...types4) {
  return message(`Key for the ${alg} algorithm must be `, actual, ...types4);
}

// node_modules/jose/dist/node/esm/runtime/is_key_like.js
var is_key_like_default = (key) => is_key_object_default(key) || isCryptoKey(key);
var types3 = ["KeyObject"];
if (globalThis.CryptoKey || webcrypto_default?.CryptoKey) {
  types3.push("CryptoKey");
}

// node_modules/jose/dist/node/esm/lib/is_disjoint.js
var isDisjoint = (...headers) => {
  const sources = headers.filter(Boolean);
  if (sources.length === 0 || sources.length === 1) {
    return true;
  }
  let acc;
  for (const header of sources) {
    const parameters = Object.keys(header);
    if (!acc || acc.size === 0) {
      acc = new Set(parameters);
      continue;
    }
    for (const parameter of parameters) {
      if (acc.has(parameter)) {
        return false;
      }
      acc.add(parameter);
    }
  }
  return true;
};
var is_disjoint_default = isDisjoint;

// node_modules/jose/dist/node/esm/lib/is_object.js
function isObjectLike(value) {
  return typeof value === "object" && value !== null;
}
function isObject(input) {
  if (!isObjectLike(input) || Object.prototype.toString.call(input) !== "[object Object]") {
    return false;
  }
  if (Object.getPrototypeOf(input) === null) {
    return true;
  }
  let proto = input;
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto);
  }
  return Object.getPrototypeOf(input) === proto;
}

// node_modules/jose/dist/node/esm/runtime/get_named_curve.js
import { KeyObject } from "node:crypto";

// node_modules/jose/dist/node/esm/lib/is_jwk.js
function isJWK(key) {
  return isObject(key) && typeof key.kty === "string";
}
function isPrivateJWK(key) {
  return key.kty !== "oct" && typeof key.d === "string";
}
function isPublicJWK(key) {
  return key.kty !== "oct" && typeof key.d === "undefined";
}
function isSecretJWK(key) {
  return isJWK(key) && key.kty === "oct" && typeof key.k === "string";
}

// node_modules/jose/dist/node/esm/runtime/get_named_curve.js
var namedCurveToJOSE = (namedCurve) => {
  switch (namedCurve) {
    case "prime256v1":
      return "P-256";
    case "secp384r1":
      return "P-384";
    case "secp521r1":
      return "P-521";
    case "secp256k1":
      return "secp256k1";
    default:
      throw new JOSENotSupported("Unsupported key curve for this operation");
  }
};
var getNamedCurve2 = (kee, raw2) => {
  let key;
  if (isCryptoKey(kee)) {
    key = KeyObject.from(kee);
  } else if (is_key_object_default(kee)) {
    key = kee;
  } else if (isJWK(kee)) {
    return kee.crv;
  } else {
    throw new TypeError(invalid_key_input_default(kee, ...types3));
  }
  if (key.type === "secret") {
    throw new TypeError('only "private" or "public" type keys can be used for this operation');
  }
  switch (key.asymmetricKeyType) {
    case "ed25519":
    case "ed448":
      return `Ed${key.asymmetricKeyType.slice(2)}`;
    case "x25519":
    case "x448":
      return `X${key.asymmetricKeyType.slice(1)}`;
    case "ec": {
      const namedCurve = key.asymmetricKeyDetails.namedCurve;
      if (raw2) {
        return namedCurve;
      }
      return namedCurveToJOSE(namedCurve);
    }
    default:
      throw new TypeError("Invalid asymmetric key type for this operation");
  }
};
var get_named_curve_default = getNamedCurve2;

// node_modules/jose/dist/node/esm/runtime/check_key_length.js
import { KeyObject as KeyObject2 } from "node:crypto";
var check_key_length_default = (key, alg) => {
  let modulusLength;
  try {
    if (key instanceof KeyObject2) {
      modulusLength = key.asymmetricKeyDetails?.modulusLength;
    } else {
      modulusLength = Buffer.from(key.n, "base64url").byteLength << 3;
    }
  } catch {
  }
  if (typeof modulusLength !== "number" || modulusLength < 2048) {
    throw new TypeError(`${alg} requires key modulusLength to be 2048 bits or larger`);
  }
};

// node_modules/jose/dist/node/esm/runtime/jwk_to_key.js
import { createPrivateKey, createPublicKey } from "node:crypto";
var parse = (key) => {
  if (key.d) {
    return createPrivateKey({ format: "jwk", key });
  }
  return createPublicKey({ format: "jwk", key });
};
var jwk_to_key_default = parse;

// node_modules/jose/dist/node/esm/key/import.js
async function importJWK(jwk, alg) {
  if (!isObject(jwk)) {
    throw new TypeError("JWK must be an object");
  }
  alg ||= jwk.alg;
  switch (jwk.kty) {
    case "oct":
      if (typeof jwk.k !== "string" || !jwk.k) {
        throw new TypeError('missing "k" (Key Value) Parameter value');
      }
      return decode(jwk.k);
    case "RSA":
      if ("oth" in jwk && jwk.oth !== void 0) {
        throw new JOSENotSupported('RSA JWK "oth" (Other Primes Info) Parameter value is not supported');
      }
    case "EC":
    case "OKP":
      return jwk_to_key_default({ ...jwk, alg });
    default:
      throw new JOSENotSupported('Unsupported "kty" (Key Type) Parameter value');
  }
}

// node_modules/jose/dist/node/esm/lib/check_key_type.js
var tag = (key) => key?.[Symbol.toStringTag];
var jwkMatchesOp = (alg, key, usage) => {
  if (key.use !== void 0 && key.use !== "sig") {
    throw new TypeError("Invalid key for this operation, when present its use must be sig");
  }
  if (key.key_ops !== void 0 && key.key_ops.includes?.(usage) !== true) {
    throw new TypeError(`Invalid key for this operation, when present its key_ops must include ${usage}`);
  }
  if (key.alg !== void 0 && key.alg !== alg) {
    throw new TypeError(`Invalid key for this operation, when present its alg must be ${alg}`);
  }
  return true;
};
var symmetricTypeCheck = (alg, key, usage, allowJwk) => {
  if (key instanceof Uint8Array)
    return;
  if (allowJwk && isJWK(key)) {
    if (isSecretJWK(key) && jwkMatchesOp(alg, key, usage))
      return;
    throw new TypeError(`JSON Web Key for symmetric algorithms must have JWK "kty" (Key Type) equal to "oct" and the JWK "k" (Key Value) present`);
  }
  if (!is_key_like_default(key)) {
    throw new TypeError(withAlg(alg, key, ...types3, "Uint8Array", allowJwk ? "JSON Web Key" : null));
  }
  if (key.type !== "secret") {
    throw new TypeError(`${tag(key)} instances for symmetric algorithms must be of type "secret"`);
  }
};
var asymmetricTypeCheck = (alg, key, usage, allowJwk) => {
  if (allowJwk && isJWK(key)) {
    switch (usage) {
      case "sign":
        if (isPrivateJWK(key) && jwkMatchesOp(alg, key, usage))
          return;
        throw new TypeError(`JSON Web Key for this operation be a private JWK`);
      case "verify":
        if (isPublicJWK(key) && jwkMatchesOp(alg, key, usage))
          return;
        throw new TypeError(`JSON Web Key for this operation be a public JWK`);
    }
  }
  if (!is_key_like_default(key)) {
    throw new TypeError(withAlg(alg, key, ...types3, allowJwk ? "JSON Web Key" : null));
  }
  if (key.type === "secret") {
    throw new TypeError(`${tag(key)} instances for asymmetric algorithms must not be of type "secret"`);
  }
  if (usage === "sign" && key.type === "public") {
    throw new TypeError(`${tag(key)} instances for asymmetric algorithm signing must be of type "private"`);
  }
  if (usage === "decrypt" && key.type === "public") {
    throw new TypeError(`${tag(key)} instances for asymmetric algorithm decryption must be of type "private"`);
  }
  if (key.algorithm && usage === "verify" && key.type === "private") {
    throw new TypeError(`${tag(key)} instances for asymmetric algorithm verifying must be of type "public"`);
  }
  if (key.algorithm && usage === "encrypt" && key.type === "private") {
    throw new TypeError(`${tag(key)} instances for asymmetric algorithm encryption must be of type "public"`);
  }
};
function checkKeyType(allowJwk, alg, key, usage) {
  const symmetric = alg.startsWith("HS") || alg === "dir" || alg.startsWith("PBES2") || /^A\d{3}(?:GCM)?KW$/.test(alg);
  if (symmetric) {
    symmetricTypeCheck(alg, key, usage, allowJwk);
  } else {
    asymmetricTypeCheck(alg, key, usage, allowJwk);
  }
}
var check_key_type_default = checkKeyType.bind(void 0, false);
var checkKeyTypeWithJwk = checkKeyType.bind(void 0, true);

// node_modules/jose/dist/node/esm/lib/validate_crit.js
function validateCrit(Err, recognizedDefault, recognizedOption, protectedHeader, joseHeader) {
  if (joseHeader.crit !== void 0 && protectedHeader?.crit === void 0) {
    throw new Err('"crit" (Critical) Header Parameter MUST be integrity protected');
  }
  if (!protectedHeader || protectedHeader.crit === void 0) {
    return /* @__PURE__ */ new Set();
  }
  if (!Array.isArray(protectedHeader.crit) || protectedHeader.crit.length === 0 || protectedHeader.crit.some((input) => typeof input !== "string" || input.length === 0)) {
    throw new Err('"crit" (Critical) Header Parameter MUST be an array of non-empty strings when present');
  }
  let recognized;
  if (recognizedOption !== void 0) {
    recognized = new Map([...Object.entries(recognizedOption), ...recognizedDefault.entries()]);
  } else {
    recognized = recognizedDefault;
  }
  for (const parameter of protectedHeader.crit) {
    if (!recognized.has(parameter)) {
      throw new JOSENotSupported(`Extension Header Parameter "${parameter}" is not recognized`);
    }
    if (joseHeader[parameter] === void 0) {
      throw new Err(`Extension Header Parameter "${parameter}" is missing`);
    }
    if (recognized.get(parameter) && protectedHeader[parameter] === void 0) {
      throw new Err(`Extension Header Parameter "${parameter}" MUST be integrity protected`);
    }
  }
  return new Set(protectedHeader.crit);
}
var validate_crit_default = validateCrit;

// node_modules/jose/dist/node/esm/lib/validate_algorithms.js
var validateAlgorithms = (option, algorithms) => {
  if (algorithms !== void 0 && (!Array.isArray(algorithms) || algorithms.some((s) => typeof s !== "string"))) {
    throw new TypeError(`"${option}" option must be an array of strings`);
  }
  if (!algorithms) {
    return void 0;
  }
  return new Set(algorithms);
};
var validate_algorithms_default = validateAlgorithms;

// node_modules/jose/dist/node/esm/runtime/verify.js
import * as crypto4 from "node:crypto";
import { promisify as promisify2 } from "node:util";

// node_modules/jose/dist/node/esm/runtime/dsa_digest.js
function dsaDigest(alg) {
  switch (alg) {
    case "PS256":
    case "RS256":
    case "ES256":
    case "ES256K":
      return "sha256";
    case "PS384":
    case "RS384":
    case "ES384":
      return "sha384";
    case "PS512":
    case "RS512":
    case "ES512":
      return "sha512";
    case "Ed25519":
    case "EdDSA":
      return void 0;
    default:
      throw new JOSENotSupported(`alg ${alg} is not supported either by JOSE or your javascript runtime`);
  }
}

// node_modules/jose/dist/node/esm/runtime/node_key.js
import { constants, KeyObject as KeyObject3 } from "node:crypto";
var ecCurveAlgMap = /* @__PURE__ */ new Map([
  ["ES256", "P-256"],
  ["ES256K", "secp256k1"],
  ["ES384", "P-384"],
  ["ES512", "P-521"]
]);
function keyForCrypto(alg, key) {
  let asymmetricKeyType;
  let asymmetricKeyDetails;
  let isJWK2;
  if (key instanceof KeyObject3) {
    asymmetricKeyType = key.asymmetricKeyType;
    asymmetricKeyDetails = key.asymmetricKeyDetails;
  } else {
    isJWK2 = true;
    switch (key.kty) {
      case "RSA":
        asymmetricKeyType = "rsa";
        break;
      case "EC":
        asymmetricKeyType = "ec";
        break;
      case "OKP": {
        if (key.crv === "Ed25519") {
          asymmetricKeyType = "ed25519";
          break;
        }
        if (key.crv === "Ed448") {
          asymmetricKeyType = "ed448";
          break;
        }
        throw new TypeError("Invalid key for this operation, its crv must be Ed25519 or Ed448");
      }
      default:
        throw new TypeError("Invalid key for this operation, its kty must be RSA, OKP, or EC");
    }
  }
  let options;
  switch (alg) {
    case "Ed25519":
      if (asymmetricKeyType !== "ed25519") {
        throw new TypeError(`Invalid key for this operation, its asymmetricKeyType must be ed25519`);
      }
      break;
    case "EdDSA":
      if (!["ed25519", "ed448"].includes(asymmetricKeyType)) {
        throw new TypeError("Invalid key for this operation, its asymmetricKeyType must be ed25519 or ed448");
      }
      break;
    case "RS256":
    case "RS384":
    case "RS512":
      if (asymmetricKeyType !== "rsa") {
        throw new TypeError("Invalid key for this operation, its asymmetricKeyType must be rsa");
      }
      check_key_length_default(key, alg);
      break;
    case "PS256":
    case "PS384":
    case "PS512":
      if (asymmetricKeyType === "rsa-pss") {
        const { hashAlgorithm, mgf1HashAlgorithm, saltLength } = asymmetricKeyDetails;
        const length = parseInt(alg.slice(-3), 10);
        if (hashAlgorithm !== void 0 && (hashAlgorithm !== `sha${length}` || mgf1HashAlgorithm !== hashAlgorithm)) {
          throw new TypeError(`Invalid key for this operation, its RSA-PSS parameters do not meet the requirements of "alg" ${alg}`);
        }
        if (saltLength !== void 0 && saltLength > length >> 3) {
          throw new TypeError(`Invalid key for this operation, its RSA-PSS parameter saltLength does not meet the requirements of "alg" ${alg}`);
        }
      } else if (asymmetricKeyType !== "rsa") {
        throw new TypeError("Invalid key for this operation, its asymmetricKeyType must be rsa or rsa-pss");
      }
      check_key_length_default(key, alg);
      options = {
        padding: constants.RSA_PKCS1_PSS_PADDING,
        saltLength: constants.RSA_PSS_SALTLEN_DIGEST
      };
      break;
    case "ES256":
    case "ES256K":
    case "ES384":
    case "ES512": {
      if (asymmetricKeyType !== "ec") {
        throw new TypeError("Invalid key for this operation, its asymmetricKeyType must be ec");
      }
      const actual = get_named_curve_default(key);
      const expected = ecCurveAlgMap.get(alg);
      if (actual !== expected) {
        throw new TypeError(`Invalid key curve for the algorithm, its curve must be ${expected}, got ${actual}`);
      }
      options = { dsaEncoding: "ieee-p1363" };
      break;
    }
    default:
      throw new JOSENotSupported(`alg ${alg} is not supported either by JOSE or your javascript runtime`);
  }
  if (isJWK2) {
    return { format: "jwk", key, ...options };
  }
  return options ? { ...options, key } : key;
}

// node_modules/jose/dist/node/esm/runtime/sign.js
import * as crypto3 from "node:crypto";
import { promisify } from "node:util";

// node_modules/jose/dist/node/esm/runtime/hmac_digest.js
function hmacDigest(alg) {
  switch (alg) {
    case "HS256":
      return "sha256";
    case "HS384":
      return "sha384";
    case "HS512":
      return "sha512";
    default:
      throw new JOSENotSupported(`alg ${alg} is not supported either by JOSE or your javascript runtime`);
  }
}

// node_modules/jose/dist/node/esm/runtime/get_sign_verify_key.js
import { KeyObject as KeyObject4, createSecretKey } from "node:crypto";
function getSignVerifyKey(alg, key, usage) {
  if (key instanceof Uint8Array) {
    if (!alg.startsWith("HS")) {
      throw new TypeError(invalid_key_input_default(key, ...types3));
    }
    return createSecretKey(key);
  }
  if (key instanceof KeyObject4) {
    return key;
  }
  if (isCryptoKey(key)) {
    checkSigCryptoKey(key, alg, usage);
    return KeyObject4.from(key);
  }
  if (isJWK(key)) {
    if (alg.startsWith("HS")) {
      return createSecretKey(Buffer.from(key.k, "base64url"));
    }
    return key;
  }
  throw new TypeError(invalid_key_input_default(key, ...types3, "Uint8Array", "JSON Web Key"));
}

// node_modules/jose/dist/node/esm/runtime/sign.js
var oneShotSign = promisify(crypto3.sign);
var sign2 = async (alg, key, data) => {
  const k = getSignVerifyKey(alg, key, "sign");
  if (alg.startsWith("HS")) {
    const hmac = crypto3.createHmac(hmacDigest(alg), k);
    hmac.update(data);
    return hmac.digest();
  }
  return oneShotSign(dsaDigest(alg), data, keyForCrypto(alg, k));
};
var sign_default = sign2;

// node_modules/jose/dist/node/esm/runtime/verify.js
var oneShotVerify = promisify2(crypto4.verify);
var verify2 = async (alg, key, signature, data) => {
  const k = getSignVerifyKey(alg, key, "verify");
  if (alg.startsWith("HS")) {
    const expected = await sign_default(alg, k, data);
    const actual = signature;
    try {
      return crypto4.timingSafeEqual(actual, expected);
    } catch {
      return false;
    }
  }
  const algorithm = dsaDigest(alg);
  const keyInput = keyForCrypto(alg, k);
  try {
    return await oneShotVerify(algorithm, data, keyInput, signature);
  } catch {
    return false;
  }
};
var verify_default = verify2;

// node_modules/jose/dist/node/esm/jws/flattened/verify.js
async function flattenedVerify(jws, key, options) {
  if (!isObject(jws)) {
    throw new JWSInvalid("Flattened JWS must be an object");
  }
  if (jws.protected === void 0 && jws.header === void 0) {
    throw new JWSInvalid('Flattened JWS must have either of the "protected" or "header" members');
  }
  if (jws.protected !== void 0 && typeof jws.protected !== "string") {
    throw new JWSInvalid("JWS Protected Header incorrect type");
  }
  if (jws.payload === void 0) {
    throw new JWSInvalid("JWS Payload missing");
  }
  if (typeof jws.signature !== "string") {
    throw new JWSInvalid("JWS Signature missing or incorrect type");
  }
  if (jws.header !== void 0 && !isObject(jws.header)) {
    throw new JWSInvalid("JWS Unprotected Header incorrect type");
  }
  let parsedProt = {};
  if (jws.protected) {
    try {
      const protectedHeader = decode(jws.protected);
      parsedProt = JSON.parse(decoder.decode(protectedHeader));
    } catch {
      throw new JWSInvalid("JWS Protected Header is invalid");
    }
  }
  if (!is_disjoint_default(parsedProt, jws.header)) {
    throw new JWSInvalid("JWS Protected and JWS Unprotected Header Parameter names must be disjoint");
  }
  const joseHeader = {
    ...parsedProt,
    ...jws.header
  };
  const extensions = validate_crit_default(JWSInvalid, /* @__PURE__ */ new Map([["b64", true]]), options?.crit, parsedProt, joseHeader);
  let b64 = true;
  if (extensions.has("b64")) {
    b64 = parsedProt.b64;
    if (typeof b64 !== "boolean") {
      throw new JWSInvalid('The "b64" (base64url-encode payload) Header Parameter must be a boolean');
    }
  }
  const { alg } = joseHeader;
  if (typeof alg !== "string" || !alg) {
    throw new JWSInvalid('JWS "alg" (Algorithm) Header Parameter missing or invalid');
  }
  const algorithms = options && validate_algorithms_default("algorithms", options.algorithms);
  if (algorithms && !algorithms.has(alg)) {
    throw new JOSEAlgNotAllowed('"alg" (Algorithm) Header Parameter value not allowed');
  }
  if (b64) {
    if (typeof jws.payload !== "string") {
      throw new JWSInvalid("JWS Payload must be a string");
    }
  } else if (typeof jws.payload !== "string" && !(jws.payload instanceof Uint8Array)) {
    throw new JWSInvalid("JWS Payload must be a string or an Uint8Array instance");
  }
  let resolvedKey = false;
  if (typeof key === "function") {
    key = await key(parsedProt, jws);
    resolvedKey = true;
    checkKeyTypeWithJwk(alg, key, "verify");
    if (isJWK(key)) {
      key = await importJWK(key, alg);
    }
  } else {
    checkKeyTypeWithJwk(alg, key, "verify");
  }
  const data = concat(encoder.encode(jws.protected ?? ""), encoder.encode("."), typeof jws.payload === "string" ? encoder.encode(jws.payload) : jws.payload);
  let signature;
  try {
    signature = decode(jws.signature);
  } catch {
    throw new JWSInvalid("Failed to base64url decode the signature");
  }
  const verified = await verify_default(alg, key, signature, data);
  if (!verified) {
    throw new JWSSignatureVerificationFailed();
  }
  let payload;
  if (b64) {
    try {
      payload = decode(jws.payload);
    } catch {
      throw new JWSInvalid("Failed to base64url decode the payload");
    }
  } else if (typeof jws.payload === "string") {
    payload = encoder.encode(jws.payload);
  } else {
    payload = jws.payload;
  }
  const result = { payload };
  if (jws.protected !== void 0) {
    result.protectedHeader = parsedProt;
  }
  if (jws.header !== void 0) {
    result.unprotectedHeader = jws.header;
  }
  if (resolvedKey) {
    return { ...result, key };
  }
  return result;
}

// node_modules/jose/dist/node/esm/jws/compact/verify.js
async function compactVerify(jws, key, options) {
  if (jws instanceof Uint8Array) {
    jws = decoder.decode(jws);
  }
  if (typeof jws !== "string") {
    throw new JWSInvalid("Compact JWS must be a string or Uint8Array");
  }
  const { 0: protectedHeader, 1: payload, 2: signature, length } = jws.split(".");
  if (length !== 3) {
    throw new JWSInvalid("Invalid Compact JWS");
  }
  const verified = await flattenedVerify({ payload, protected: protectedHeader, signature }, key, options);
  const result = { payload: verified.payload, protectedHeader: verified.protectedHeader };
  if (typeof key === "function") {
    return { ...result, key: verified.key };
  }
  return result;
}

// node_modules/jose/dist/node/esm/lib/epoch.js
var epoch_default = (date) => Math.floor(date.getTime() / 1e3);

// node_modules/jose/dist/node/esm/lib/secs.js
var minute = 60;
var hour = minute * 60;
var day = hour * 24;
var week = day * 7;
var year = day * 365.25;
var REGEX = /^(\+|\-)? ?(\d+|\d+\.\d+) ?(seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)(?: (ago|from now))?$/i;
var secs_default = (str) => {
  const matched = REGEX.exec(str);
  if (!matched || matched[4] && matched[1]) {
    throw new TypeError("Invalid time period format");
  }
  const value = parseFloat(matched[2]);
  const unit = matched[3].toLowerCase();
  let numericDate;
  switch (unit) {
    case "sec":
    case "secs":
    case "second":
    case "seconds":
    case "s":
      numericDate = Math.round(value);
      break;
    case "minute":
    case "minutes":
    case "min":
    case "mins":
    case "m":
      numericDate = Math.round(value * minute);
      break;
    case "hour":
    case "hours":
    case "hr":
    case "hrs":
    case "h":
      numericDate = Math.round(value * hour);
      break;
    case "day":
    case "days":
    case "d":
      numericDate = Math.round(value * day);
      break;
    case "week":
    case "weeks":
    case "w":
      numericDate = Math.round(value * week);
      break;
    default:
      numericDate = Math.round(value * year);
      break;
  }
  if (matched[1] === "-" || matched[4] === "ago") {
    return -numericDate;
  }
  return numericDate;
};

// node_modules/jose/dist/node/esm/lib/jwt_claims_set.js
var normalizeTyp = (value) => value.toLowerCase().replace(/^application\//, "");
var checkAudiencePresence = (audPayload, audOption) => {
  if (typeof audPayload === "string") {
    return audOption.includes(audPayload);
  }
  if (Array.isArray(audPayload)) {
    return audOption.some(Set.prototype.has.bind(new Set(audPayload)));
  }
  return false;
};
var jwt_claims_set_default = (protectedHeader, encodedPayload, options = {}) => {
  let payload;
  try {
    payload = JSON.parse(decoder.decode(encodedPayload));
  } catch {
  }
  if (!isObject(payload)) {
    throw new JWTInvalid("JWT Claims Set must be a top-level JSON object");
  }
  const { typ } = options;
  if (typ && (typeof protectedHeader.typ !== "string" || normalizeTyp(protectedHeader.typ) !== normalizeTyp(typ))) {
    throw new JWTClaimValidationFailed('unexpected "typ" JWT header value', payload, "typ", "check_failed");
  }
  const { requiredClaims = [], issuer, subject, audience, maxTokenAge } = options;
  const presenceCheck = [...requiredClaims];
  if (maxTokenAge !== void 0)
    presenceCheck.push("iat");
  if (audience !== void 0)
    presenceCheck.push("aud");
  if (subject !== void 0)
    presenceCheck.push("sub");
  if (issuer !== void 0)
    presenceCheck.push("iss");
  for (const claim of new Set(presenceCheck.reverse())) {
    if (!(claim in payload)) {
      throw new JWTClaimValidationFailed(`missing required "${claim}" claim`, payload, claim, "missing");
    }
  }
  if (issuer && !(Array.isArray(issuer) ? issuer : [issuer]).includes(payload.iss)) {
    throw new JWTClaimValidationFailed('unexpected "iss" claim value', payload, "iss", "check_failed");
  }
  if (subject && payload.sub !== subject) {
    throw new JWTClaimValidationFailed('unexpected "sub" claim value', payload, "sub", "check_failed");
  }
  if (audience && !checkAudiencePresence(payload.aud, typeof audience === "string" ? [audience] : audience)) {
    throw new JWTClaimValidationFailed('unexpected "aud" claim value', payload, "aud", "check_failed");
  }
  let tolerance;
  switch (typeof options.clockTolerance) {
    case "string":
      tolerance = secs_default(options.clockTolerance);
      break;
    case "number":
      tolerance = options.clockTolerance;
      break;
    case "undefined":
      tolerance = 0;
      break;
    default:
      throw new TypeError("Invalid clockTolerance option type");
  }
  const { currentDate } = options;
  const now = epoch_default(currentDate || /* @__PURE__ */ new Date());
  if ((payload.iat !== void 0 || maxTokenAge) && typeof payload.iat !== "number") {
    throw new JWTClaimValidationFailed('"iat" claim must be a number', payload, "iat", "invalid");
  }
  if (payload.nbf !== void 0) {
    if (typeof payload.nbf !== "number") {
      throw new JWTClaimValidationFailed('"nbf" claim must be a number', payload, "nbf", "invalid");
    }
    if (payload.nbf > now + tolerance) {
      throw new JWTClaimValidationFailed('"nbf" claim timestamp check failed', payload, "nbf", "check_failed");
    }
  }
  if (payload.exp !== void 0) {
    if (typeof payload.exp !== "number") {
      throw new JWTClaimValidationFailed('"exp" claim must be a number', payload, "exp", "invalid");
    }
    if (payload.exp <= now - tolerance) {
      throw new JWTExpired('"exp" claim timestamp check failed', payload, "exp", "check_failed");
    }
  }
  if (maxTokenAge) {
    const age = now - payload.iat;
    const max = typeof maxTokenAge === "number" ? maxTokenAge : secs_default(maxTokenAge);
    if (age - tolerance > max) {
      throw new JWTExpired('"iat" claim timestamp check failed (too far in the past)', payload, "iat", "check_failed");
    }
    if (age < 0 - tolerance) {
      throw new JWTClaimValidationFailed('"iat" claim timestamp check failed (it should be in the past)', payload, "iat", "check_failed");
    }
  }
  return payload;
};

// node_modules/jose/dist/node/esm/jwt/verify.js
async function jwtVerify(jwt, key, options) {
  const verified = await compactVerify(jwt, key, options);
  if (verified.protectedHeader.crit?.includes("b64") && verified.protectedHeader.b64 === false) {
    throw new JWTInvalid("JWTs MUST NOT use unencoded payload");
  }
  const payload = jwt_claims_set_default(verified.protectedHeader, verified.payload, options);
  const result = { payload, protectedHeader: verified.protectedHeader };
  if (typeof key === "function") {
    return { ...result, key: verified.key };
  }
  return result;
}

// node_modules/jose/dist/node/esm/jws/flattened/sign.js
var FlattenedSign = class {
  _payload;
  _protectedHeader;
  _unprotectedHeader;
  constructor(payload) {
    if (!(payload instanceof Uint8Array)) {
      throw new TypeError("payload must be an instance of Uint8Array");
    }
    this._payload = payload;
  }
  setProtectedHeader(protectedHeader) {
    if (this._protectedHeader) {
      throw new TypeError("setProtectedHeader can only be called once");
    }
    this._protectedHeader = protectedHeader;
    return this;
  }
  setUnprotectedHeader(unprotectedHeader) {
    if (this._unprotectedHeader) {
      throw new TypeError("setUnprotectedHeader can only be called once");
    }
    this._unprotectedHeader = unprotectedHeader;
    return this;
  }
  async sign(key, options) {
    if (!this._protectedHeader && !this._unprotectedHeader) {
      throw new JWSInvalid("either setProtectedHeader or setUnprotectedHeader must be called before #sign()");
    }
    if (!is_disjoint_default(this._protectedHeader, this._unprotectedHeader)) {
      throw new JWSInvalid("JWS Protected and JWS Unprotected Header Parameter names must be disjoint");
    }
    const joseHeader = {
      ...this._protectedHeader,
      ...this._unprotectedHeader
    };
    const extensions = validate_crit_default(JWSInvalid, /* @__PURE__ */ new Map([["b64", true]]), options?.crit, this._protectedHeader, joseHeader);
    let b64 = true;
    if (extensions.has("b64")) {
      b64 = this._protectedHeader.b64;
      if (typeof b64 !== "boolean") {
        throw new JWSInvalid('The "b64" (base64url-encode payload) Header Parameter must be a boolean');
      }
    }
    const { alg } = joseHeader;
    if (typeof alg !== "string" || !alg) {
      throw new JWSInvalid('JWS "alg" (Algorithm) Header Parameter missing or invalid');
    }
    checkKeyTypeWithJwk(alg, key, "sign");
    let payload = this._payload;
    if (b64) {
      payload = encoder.encode(encode(payload));
    }
    let protectedHeader;
    if (this._protectedHeader) {
      protectedHeader = encoder.encode(encode(JSON.stringify(this._protectedHeader)));
    } else {
      protectedHeader = encoder.encode("");
    }
    const data = concat(protectedHeader, encoder.encode("."), payload);
    const signature = await sign_default(alg, key, data);
    const jws = {
      signature: encode(signature),
      payload: ""
    };
    if (b64) {
      jws.payload = decoder.decode(payload);
    }
    if (this._unprotectedHeader) {
      jws.header = this._unprotectedHeader;
    }
    if (this._protectedHeader) {
      jws.protected = decoder.decode(protectedHeader);
    }
    return jws;
  }
};

// node_modules/jose/dist/node/esm/jws/compact/sign.js
var CompactSign = class {
  _flattened;
  constructor(payload) {
    this._flattened = new FlattenedSign(payload);
  }
  setProtectedHeader(protectedHeader) {
    this._flattened.setProtectedHeader(protectedHeader);
    return this;
  }
  async sign(key, options) {
    const jws = await this._flattened.sign(key, options);
    if (jws.payload === void 0) {
      throw new TypeError("use the flattened module for creating JWS with b64: false");
    }
    return `${jws.protected}.${jws.payload}.${jws.signature}`;
  }
};

// node_modules/jose/dist/node/esm/jwt/produce.js
function validateInput(label, input) {
  if (!Number.isFinite(input)) {
    throw new TypeError(`Invalid ${label} input`);
  }
  return input;
}
var ProduceJWT = class {
  _payload;
  constructor(payload = {}) {
    if (!isObject(payload)) {
      throw new TypeError("JWT Claims Set MUST be an object");
    }
    this._payload = payload;
  }
  setIssuer(issuer) {
    this._payload = { ...this._payload, iss: issuer };
    return this;
  }
  setSubject(subject) {
    this._payload = { ...this._payload, sub: subject };
    return this;
  }
  setAudience(audience) {
    this._payload = { ...this._payload, aud: audience };
    return this;
  }
  setJti(jwtId) {
    this._payload = { ...this._payload, jti: jwtId };
    return this;
  }
  setNotBefore(input) {
    if (typeof input === "number") {
      this._payload = { ...this._payload, nbf: validateInput("setNotBefore", input) };
    } else if (input instanceof Date) {
      this._payload = { ...this._payload, nbf: validateInput("setNotBefore", epoch_default(input)) };
    } else {
      this._payload = { ...this._payload, nbf: epoch_default(/* @__PURE__ */ new Date()) + secs_default(input) };
    }
    return this;
  }
  setExpirationTime(input) {
    if (typeof input === "number") {
      this._payload = { ...this._payload, exp: validateInput("setExpirationTime", input) };
    } else if (input instanceof Date) {
      this._payload = { ...this._payload, exp: validateInput("setExpirationTime", epoch_default(input)) };
    } else {
      this._payload = { ...this._payload, exp: epoch_default(/* @__PURE__ */ new Date()) + secs_default(input) };
    }
    return this;
  }
  setIssuedAt(input) {
    if (typeof input === "undefined") {
      this._payload = { ...this._payload, iat: epoch_default(/* @__PURE__ */ new Date()) };
    } else if (input instanceof Date) {
      this._payload = { ...this._payload, iat: validateInput("setIssuedAt", epoch_default(input)) };
    } else if (typeof input === "string") {
      this._payload = {
        ...this._payload,
        iat: validateInput("setIssuedAt", epoch_default(/* @__PURE__ */ new Date()) + secs_default(input))
      };
    } else {
      this._payload = { ...this._payload, iat: validateInput("setIssuedAt", input) };
    }
    return this;
  }
};

// node_modules/jose/dist/node/esm/jwt/sign.js
var SignJWT = class extends ProduceJWT {
  _protectedHeader;
  setProtectedHeader(protectedHeader) {
    this._protectedHeader = protectedHeader;
    return this;
  }
  async sign(key, options) {
    const sig = new CompactSign(encoder.encode(JSON.stringify(this._payload)));
    sig.setProtectedHeader(this._protectedHeader);
    if (Array.isArray(this._protectedHeader?.crit) && this._protectedHeader.crit.includes("b64") && this._protectedHeader.b64 === false) {
      throw new JWTInvalid("JWTs MUST NOT use unencoded payload");
    }
    return sig.sign(key, options);
  }
};

// src/crypto.js
var newId = () => randomUUID();
var nowIso = () => (/* @__PURE__ */ new Date()).toISOString();
var emailKey = (email) => createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
function randomB64(bytes = 16) {
  return randomBytes(bytes).toString("base64");
}
function hashPassword(masterPasswordHash, salt, iterations) {
  return pbkdf2Sync(masterPasswordHash, salt, iterations, 32, "sha256").toString("base64");
}
function verifyPassword(storedHash, salt, iterations, candidate) {
  const a = Buffer.from(storedHash, "base64");
  const b = Buffer.from(hashPassword(candidate, salt, iterations), "base64");
  return a.length === b.length && timingSafeEqual2(a, b);
}
function secret(env, name) {
  const v = env?.[name] ?? process.env[name];
  if (!v) throw new Error(`missing secret: ${name}`);
  return new TextEncoder().encode(v);
}
async function signAccess(env, claims) {
  return await new SignJWT(claims).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("1h").sign(secret(env, "JWT_SECRET"));
}
async function signRefresh(env, payload) {
  return await new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("30d").sign(secret(env, "JWT_REFRESH_SECRET"));
}
async function verifyAccess(env, token) {
  const { payload } = await jwtVerify(token, secret(env, "JWT_SECRET"));
  return payload;
}
async function verifyRefresh(env, token) {
  const { payload } = await jwtVerify(token, secret(env, "JWT_REFRESH_SECRET"));
  return payload;
}
var REMEMBER_ISS = "warden-edgeone-remember";
async function signRemember(env, { sub, uid }) {
  return await new SignJWT({ sub, uid, iss: REMEMBER_ISS }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("30d").sign(secret(env, "JWT_REFRESH_SECRET"));
}
async function verifyRemember(env, token) {
  const res = await jwtVerify(token, secret(env, "JWT_REFRESH_SECRET"));
  if (res.payload.iss !== REMEMBER_ISS) throw new Error("bad remember issuer");
  return res;
}
var ATT_TTL_SEC = 600;
function makeAttachmentToken(env, { uid, aid, ttl = ATT_TTL_SEC }) {
  const exp = Math.floor(Date.now() / 1e3) + ttl;
  const payload = Buffer.from(`${uid}:${aid}:${exp}`).toString("base64url");
  const sig = createHmac2("sha256", secret(env, "JWT_SECRET")).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}
function verifyAttachmentToken(env, token) {
  const parts = String(token || "").split(".");
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expect = createHmac2("sha256", secret(env, "JWT_SECRET")).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expect);
  if (a.length !== b.length || !timingSafeEqual2(a, b)) return null;
  const decoded = Buffer.from(payload, "base64url").toString("utf8");
  const [uid, aid, expStr] = decoded.split(":");
  if (!uid || !aid || !expStr) return null;
  if (Number(expStr) < Math.floor(Date.now() / 1e3)) return null;
  return { uid, aid };
}
var deviceTypeName = (t) => ({
  0: "Android",
  1: "iOS",
  2: "ChromeExtension",
  3: "FirefoxExtension",
  4: "OperaExtension",
  5: "EdgeExtension",
  6: "WindowsDesktop",
  7: "MacOsDesktop",
  8: "LinuxDesktop",
  9: "Chrome",
  10: "Firefox",
  11: "Opera",
  12: "Edge",
  13: "IE",
  14: "UnknownBrowser",
  15: "AndroidAmazon",
  16: "UWP",
  17: "Safari",
  18: "Vivaldi",
  19: "VivaldiExtension",
  20: "SafariExtension",
  21: "SDK",
  22: "Server",
  23: "WindowsCLI",
  24: "MacOsCLI",
  25: "LinuxCLI"
})[t] || "SDK";
var B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
function base32Encode(buf) {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of buf) {
    value = value << 8 | byte;
    bits += 8;
    while (bits >= 5) {
      out += B32[value >>> bits - 5 & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[value << 5 - bits & 31];
  return out;
}
function base32Decode(input) {
  const clean = String(input).toUpperCase().replace(/=+$/, "").replace(/\s+/g, "");
  let bits = 0;
  let value = 0;
  const out = [];
  for (const ch of clean) {
    const idx = B32.indexOf(ch);
    if (idx === -1) throw new Error("Invalid Base32 input");
    value = value << 5 | idx;
    bits += 5;
    if (bits >= 8) {
      out.push(value >>> bits - 8 & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}
function generateTotpSecret() {
  return base32Encode(randomBytes(20));
}
function generateRecoveryCode() {
  return base32Encode(randomBytes(20));
}
function totpAt(secretB32, step) {
  const key = base32Decode(secretB32);
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(step));
  const h = createHmac2("sha1", key).update(msg).digest();
  const offset = h[h.length - 1] & 15;
  const bin = (h[offset] & 127) << 24 | h[offset + 1] << 16 | h[offset + 2] << 8 | h[offset + 3];
  return String(bin % 1e6).padStart(6, "0");
}
function validateTotp(code, secretB32, lastUsed = 0, allowDrift = false) {
  if (!/^\d{6}$/.test(String(code))) throw new Error("Invalid TOTP code format");
  const currentStep = Math.floor(Date.now() / 3e4);
  const drift = allowDrift ? 1 : 0;
  for (let off = -drift; off <= drift; off++) {
    const step = currentStep + off;
    if (step <= lastUsed) continue;
    if (totpAt(secretB32, step) === String(code)) return step;
  }
  throw new Error("Invalid TOTP code");
}

// src/store.js
var import_pages_blob = __toESM(require_dist(), 1);
var keys = {
  email: (emailHash) => `idx/email/${emailHash}.json`,
  profile: (u) => `u/${u}/profile.json`,
  devices: (u) => `u/${u}/devices/`,
  device: (u, id) => `u/${u}/devices/${id}.json`,
  folders: (u) => `u/${u}/folders/`,
  folder: (u, id) => `u/${u}/folders/${id}.json`,
  ciphers: (u) => `u/${u}/ciphers/`,
  cipher: (u, id) => `u/${u}/ciphers/${id}.json`,
  sends: (u) => `u/${u}/sends/`,
  send: (u, id) => `u/${u}/sends/${id}.json`,
  sendFile: (u, id) => `u/${u}/sends/${id}.bin`,
  authRequests: (u) => `u/${u}/auth-requests/`,
  authRequest: (u, id) => `u/${u}/auth-requests/${id}.json`,
  authRequestIndex: (id) => `idx/authreq/${id}.json`,
  // 限流计数器（近似计数：Blob 最终一致，见 README「风险」）
  rate: (k) => `rl/${k}.json`,
  // accessId -> { userId, id }：匿名访问只有 accessId，没法靠前缀反查
  sendIndex: (accessId) => `idx/send/${accessId}.json`,
  attachment: (u, id) => `u/${u}/attachments/${id}`,
  attachmentMeta: (u, id) => `u/${u}/attachments/${id}.json`,
  attachmentData: (u, id) => `u/${u}/attachments/${id}.bin`,
  attachments: (u) => `u/${u}/attachments/`,
  twofactor: (u, atype) => `u/${u}/twofactor/${atype}.json`
};
var PreconditionFailed = class extends Error {
  constructor(key) {
    super(`precondition failed: ${key}`);
    this.name = "PreconditionFailed";
  }
};
var MemoryStore = class {
  #m = /* @__PURE__ */ new Map();
  async get(key) {
    const v = this.#m.get(key);
    return v ? { value: structuredClone(v.value), etag: v.etag } : null;
  }
  async head(key) {
    const v = this.#m.get(key);
    return v ? { etag: v.etag, size: JSON.stringify(v.value ?? "").length } : null;
  }
  async put(key, value, opts = {}) {
    const cur = this.#m.get(key);
    if (opts.ifNoneMatch === "*" && cur) throw new PreconditionFailed(key);
    if (opts.ifMatch && (!cur || cur.etag !== opts.ifMatch)) throw new PreconditionFailed(key);
    const etag = `"${Math.random().toString(36).slice(2)}"`;
    this.#m.set(key, { value: structuredClone(value), etag });
    return { etag };
  }
  async del(key) {
    this.#m.delete(key);
  }
  async list(prefix) {
    return [...this.#m.keys()].filter((k) => k.startsWith(prefix)).sort().map((k) => ({ key: k, etag: this.#m.get(k).etag, size: 0 }));
  }
  // 二进制通道（附件 / 文件 Send）
  async putBinary(key, bytes) {
    this.#m.set(key, { value: Buffer.from(bytes), etag: `"bin-${Date.now()}"` });
  }
  async getBinary(key) {
    const v = this.#m.get(key);
    return v ? Buffer.from(v.value) : null;
  }
};
var BlobStore = class {
  supportsConditional = false;
  #store;
  constructor(env, { store: injected } = {}) {
    const name = env?.BLOB_STORE ?? process.env.BLOB_STORE ?? "warden";
    const projectId = env?.BLOB_PROJECT_ID ?? process.env.BLOB_PROJECT_ID;
    const token = env?.BLOB_TOKEN ?? process.env.BLOB_TOKEN;
    this.#store = injected ?? (projectId && token ? (0, import_pages_blob.getStore)({ name, projectId, token, consistency: "strong" }) : (0, import_pages_blob.getStore)(name));
  }
  async get(key) {
    const value = await this.#store.get(key, { type: "json", consistency: "strong" });
    return value == null ? null : { value, etag: null };
  }
  async head(key) {
    const meta = await this.#store.getMetadata(key, { consistency: "strong" });
    return meta ? { etag: meta.etag ?? null, size: 0 } : null;
  }
  async put(key, value) {
    await this.#store.setJSON(key, value);
    return { etag: null };
  }
  async del(key) {
    await this.#store.delete(key);
  }
  async list(prefix) {
    const res = await this.#store.list({ prefix, consistency: "strong" });
    return (res?.blobs ?? []).map((b) => ({ key: b.key, etag: b.etag ?? null, size: 0 }));
  }
  // 附件用二进制通道（不经过 JSON 序列化）
  async getBinary(key) {
    return await this.#store.get(key, { type: "arrayBuffer", consistency: "strong" });
  }
  async putBinary(key, bytes) {
    await this.#store.set(key, bytes);
  }
};
var instances = /* @__PURE__ */ new Map();
function getStore2(env) {
  const driver = env?.STORE_DRIVER ?? process.env.STORE_DRIVER ?? "memory";
  if (!instances.has(driver)) {
    instances.set(driver, driver === "blob" ? new BlobStore(env) : new MemoryStore());
  }
  return instances.get(driver);
}
async function mutate(store, key, fn, { retries = 5 } = {}) {
  const conditional = store.supportsConditional !== false;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  for (let attempt = 0; attempt < retries; attempt++) {
    const cur = await store.get(key);
    const next = fn(cur ? cur.value : null);
    if (next === void 0) return cur ? cur.value : null;
    if (conditional) {
      try {
        await store.put(key, next, { ifMatch: cur ? cur.etag : null });
        return next;
      } catch (e) {
        if (!(e instanceof PreconditionFailed)) throw e;
        await sleep(20 * (attempt + 1));
        continue;
      }
    }
    await store.put(key, next);
    const check = await store.get(key);
    if (check && JSON.stringify(check.value) === JSON.stringify(next)) return next;
    await sleep(20 * (attempt + 1));
  }
  throw new Error(`write conflict after ${retries} retries: ${key}`);
}

// src/mail.js
var import_nodemailer = __toESM(require_nodemailer(), 1);
var cache = /* @__PURE__ */ new Map();
function cfg(env, name, dflt) {
  return env?.[name] ?? process.env[name] ?? dflt;
}
function mailConfigured(env) {
  if (String(cfg(env, "MAIL_ENABLED", "true")).toLowerCase() === "false") return false;
  return Boolean(cfg(env, "SMTP_HOST")) && Boolean(cfg(env, "MAIL_FROM"));
}
function transport(env) {
  const host = cfg(env, "SMTP_HOST");
  const port = Number(cfg(env, "SMTP_PORT", 465));
  const secure = String(cfg(env, "SMTP_SECURE", port === 465)).toLowerCase() === "true";
  const id = `${host}:${port}:${secure}:${cfg(env, "SMTP_USER", "")}`;
  if (!cache.has(id)) {
    cache.set(
      id,
      import_nodemailer.default.createTransport({
        host,
        port,
        secure,
        auth: cfg(env, "SMTP_USER") ? { user: cfg(env, "SMTP_USER"), pass: cfg(env, "SMTP_PASS") } : void 0,
        connectionTimeout: 1e4,
        greetingTimeout: 1e4,
        socketTimeout: 2e4,
        pool: true,
        maxConnections: 1,
        // 587/25 这类非隐式 TLS 端口必须升级到 STARTTLS，不允许明文投递
        // （secure=true 时该选项被忽略，465 走隐式 TLS）
        requireTLS: !secure,
        tls: { minVersion: "TLSv1.2" }
      })
    );
  }
  return cache.get(id);
}
var escapeHtml = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
function passwordHintTemplate({ hint, baseUrl }) {
  const base = String(baseUrl || "").replace(/\/+$/, "");
  const safeHint = String(hint).slice(0, 1e3);
  const subject = "\u4E3B\u5BC6\u7801\u63D0\u793A / Your master password hint";
  const text = [
    "\u4F60\u597D\uFF0C",
    "",
    "\u8FD9\u662F\u4F60\u7684\u5BC6\u7801\u5E93\u4E3B\u5BC6\u7801\u63D0\u793A\uFF08master password hint\uFF09\uFF1A",
    "",
    `    ${safeHint}`,
    "",
    "\u63D0\u793A\u53EA\u7528\u4E8E\u5E2E\u52A9\u4F60\u56DE\u5FC6\u4E3B\u5BC6\u7801\uFF0C\u4E0D\u4F1A\u6CC4\u9732\u4E3B\u5BC6\u7801\u6216\u4FDD\u9669\u5E93\u5185\u5BB9\u3002",
    "\u5982\u679C\u4F60\u6CA1\u6709\u8BF7\u6C42\u8FC7\u8BE5\u63D0\u793A\uFF0C\u8BF7\u5FFD\u7565\u8FD9\u5C01\u90AE\u4EF6\uFF0C\u8D26\u6237\u4E0D\u4F1A\u6709\u4EFB\u4F55\u53D8\u5316\u3002",
    "",
    base ? `\u767B\u5F55\uFF1A${base}` : "",
    "",
    "\u2014 Warden"
  ].filter(Boolean).join("\n");
  const html = `<div style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1f2328">
<p>\u4F60\u597D\uFF0C</p>
<p>\u8FD9\u662F\u4F60\u7684\u5BC6\u7801\u5E93\u4E3B\u5BC6\u7801\u63D0\u793A\uFF08master password hint\uFF09\uFF1A</p>
<pre style="white-space:pre-wrap;background:#f6f8fa;border-radius:6px;padding:12px;font-size:14px">${escapeHtml(safeHint)}</pre>
<p style="color:#57606a">\u63D0\u793A\u53EA\u7528\u4E8E\u5E2E\u52A9\u4F60\u56DE\u5FC6\u4E3B\u5BC6\u7801\uFF0C\u4E0D\u4F1A\u6CC4\u9732\u4E3B\u5BC6\u7801\u6216\u4FDD\u9669\u5E93\u5185\u5BB9\u3002\u5982\u679C\u4F60\u6CA1\u6709\u8BF7\u6C42\u8FC7\u8BE5\u63D0\u793A\uFF0C\u8BF7\u5FFD\u7565\u8FD9\u5C01\u90AE\u4EF6\u3002</p>
${base ? `<p><a href="${escapeHtml(base)}">${escapeHtml(base)}</a></p>` : ""}
<p style="color:#57606a;font-size:13px">\u2014 Warden</p>
</div>`;
  return { subject, text, html };
}
async function sendMail(env, { to, subject, text, html }) {
  if (!mailConfigured(env)) {
    console.warn("[mail] not configured, skipped:", subject, "->", to);
    return { skipped: true };
  }
  if (String(cfg(env, "MAIL_DRY_RUN", "false")).toLowerCase() === "true") {
    console.log("[mail][dry-run]", { to, subject, textLen: text.length });
    return { dryRun: true };
  }
  const fromName = cfg(env, "MAIL_FROM_NAME", "Warden");
  const from = cfg(env, "MAIL_FROM");
  const info = await transport(env).sendMail({
    from: `"${fromName}" <${from}>`,
    to,
    subject,
    text,
    html
  });
  console.log("[mail] sent", { to, messageId: info.messageId, response: info.response });
  return { messageId: info.messageId, response: info.response };
}
async function sendPasswordHint(env, { to, hint, baseUrl }) {
  const { subject, text, html } = passwordHintTemplate({ hint, baseUrl });
  return sendMail(env, { to, subject, text, html });
}

// src/hint.js
var import_hash_wasm = __toESM(require_index_umd(), 1);
import { randomBytes as randomBytes2, createCipheriv, createDecipheriv } from "node:crypto";
var PLAINTEXT_MARKER = "*";
var ARGON2 = { memorySize: 19456, iterations: 2, parallelism: 1, hashLength: 32 };
var b64u = (buf) => Buffer.from(buf).toString("base64url");
var unb64u = (s) => Buffer.from(String(s), "base64url");
function hintSecret(env) {
  const raw2 = env?.HINT_ENCRYPTION_SECRET ?? process.env.HINT_ENCRYPTION_SECRET ?? PLAINTEXT_MARKER;
  const s = String(raw2);
  return s === "" ? PLAINTEXT_MARKER : s;
}
function hintEncryptionEnabled(env) {
  return hintSecret(env) !== PLAINTEXT_MARKER;
}
async function deriveKey(secret2, salt) {
  return Buffer.from(
    await (0, import_hash_wasm.argon2id)({
      password: secret2,
      salt,
      parallelism: ARGON2.parallelism,
      iterations: ARGON2.iterations,
      memorySize: ARGON2.memorySize,
      hashLength: ARGON2.hashLength,
      outputType: "binary"
    })
  );
}
async function encryptHint(env, plaintext) {
  const secret2 = hintSecret(env);
  const salt = randomBytes2(16);
  const iv = randomBytes2(12);
  const key = await deriveKey(secret2, salt);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cipher.update(String(plaintext), "utf8"), cipher.final()]);
  const tag2 = cipher.getAuthTag();
  return {
    v: 1,
    kdf: "argon2id",
    cipher: "aes-256-gcm",
    salt: b64u(salt),
    iv: b64u(iv),
    tag: b64u(tag2),
    ct: b64u(ct)
  };
}
async function decryptHint(env, rec) {
  try {
    if (!rec || rec.v !== 1) return null;
    const key = await deriveKey(hintSecret(env), unb64u(rec.salt));
    const decipher = createDecipheriv("aes-256-gcm", key, unb64u(rec.iv));
    decipher.setAuthTag(unb64u(rec.tag));
    const pt = Buffer.concat([decipher.update(unb64u(rec.ct)), decipher.final()]);
    return pt.toString("utf8");
  } catch (e) {
    console.warn("[hint] decrypt failed:", e?.message || e);
    return null;
  }
}
async function readHintValue(env, profile) {
  if (!profile) return null;
  if (profile.masterPasswordHintEnc) {
    const pt = await decryptHint(env, profile.masterPasswordHintEnc);
    return pt == null ? null : pt;
  }
  for (const k of ["masterPasswordHint", "masterPasswordHintB64", ""]) {
    if (Object.prototype.hasOwnProperty.call(profile, k)) {
      const v = profile[k];
      if (v != null && String(v).trim() !== "") return String(v);
    }
  }
  return null;
}
async function buildHintFields(env, plaintext) {
  const text = plaintext == null ? "" : String(plaintext).trim();
  if (!text) return { masterPasswordHint: null, masterPasswordHintEnc: null };
  if (!hintEncryptionEnabled(env)) {
    return { masterPasswordHint: text, masterPasswordHintEnc: null };
  }
  return { masterPasswordHint: null, masterPasswordHintEnc: await encryptHint(env, text) };
}

// src/index.js
var app = new Hono3();
app.use("*", cors());
var envGet = (c, name, dflt) => c.env?.[name] ?? process.env[name] ?? dflt;
async function body(c) {
  const ct = c.req.header("content-type") || "";
  if (ct.includes("application/json")) return await c.req.json().catch(() => ({})) ?? {};
  return await c.req.parseBody().catch(() => ({})) ?? {};
}
function globToRe(pat) {
  const esc = pat.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".");
  return new RegExp(`^${esc}$`, "i");
}
function allowedEmail(c, email) {
  const raw2 = envGet(c, "ALLOWED_EMAILS", "");
  if (!String(raw2).trim()) return false;
  return String(raw2).split(",").map((s) => s.trim()).filter(Boolean).some((p) => globToRe(p).test(email));
}
async function mapLimit(items, limit2, fn) {
  const out = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit2, items.length) }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      out[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return out;
}
async function findUserByEmail(c, email) {
  const store = getStore2(c.env);
  const idx = await store.get(keys.email(emailKey(email)));
  if (!idx) return null;
  const p = await store.get(keys.profile(idx.value.userId));
  return p ? { ...p.value } : null;
}
async function limit(c, kind, id, max, windowSec) {
  const store = getStore2(c.env);
  const digest = createHash2("sha256").update(`${kind}:${id}`).digest("hex").slice(0, 32);
  const key = keys.rate(`${kind}/${digest}`);
  const now = Date.now();
  const cur = (await store.get(key))?.value;
  const sameWindow = cur && now - cur.start < windowSec * 1e3;
  const count = sameWindow ? cur.count : 0;
  if (count >= max) {
    const retry = Math.max(1, Math.ceil((windowSec * 1e3 - (now - cur.start)) / 1e3));
    return c.json({ error: "Too many requests. Please try again later." }, 429, {
      "retry-after": String(retry)
    });
  }
  await store.put(key, { start: sameWindow ? cur.start : now, count: count + 1 });
  return null;
}
var HINT_KEYS = ["masterPasswordHint", "masterPasswordHintB64", ""];
function readHint(p) {
  for (const k of HINT_KEYS) {
    if (p && Object.prototype.hasOwnProperty.call(p, k)) {
      const v = p[k];
      return v == null ? null : String(v);
    }
  }
  return null;
}
var hasHintField = (p) => HINT_KEYS.some((k) => Object.prototype.hasOwnProperty.call(p ?? {}, k));
async function requireAuth(c) {
  const m = (c.req.header("authorization") || "").match(/^Bearer\s+(.+)$/i);
  if (!m) return { error: c.json({ error: "unauthorized" }, 401) };
  try {
    const claims = await verifyAccess(c.env, m[1]);
    const prof = await getStore2(c.env).get(keys.profile(claims.sub));
    if (!prof || prof.value.securityStamp !== claims.sstamp) {
      return { error: c.json({ error: "unauthorized" }, 401) };
    }
    return { claims, user: prof.value, token: m[1] };
  } catch (e) {
    console.warn("[auth] token rejected:", e?.code || e?.message || e);
    return { error: c.json({ error: "unauthorized" }, 401) };
  }
}
var TYPE_TO_FIELD = {
  1: "login",
  2: "secureNote",
  3: "card",
  4: "identity",
  5: "sshKey",
  6: "bankAccount",
  7: "driversLicense",
  8: "passport"
};
var EXTRA_FIELDS = ["fields", "passwordHistory", "reprompt", "key"];
function cipherDataFrom(src) {
  const data = { name: src.name ?? null, notes: src.notes ?? null };
  const field = TYPE_TO_FIELD[src.type];
  if (field && src[field] != null) data[field] = src[field];
  for (const k of EXTRA_FIELDS) if (src[k] != null) data[k] = src[k];
  return data;
}
function cipherToJson(row, attachmentList = null) {
  const d = row.data || {};
  const out = {
    object: "cipherDetails",
    id: row.id,
    userId: row.userId,
    organizationId: null,
    folderId: row.folderId ?? null,
    type: row.type,
    favorite: Boolean(row.favorite),
    edit: true,
    viewPassword: true,
    permissions: { delete: true, restore: true },
    organizationUseTotp: false,
    collectionIds: [],
    revisionDate: row.updatedAt,
    creationDate: row.createdAt,
    deletedDate: row.deletedAt ?? null,
    archivedDate: row.archivedAt ?? null,
    attachments: attachmentList,
    name: d.name ?? null,
    notes: d.notes ?? null,
    fields: d.fields ?? [],
    passwordHistory: d.passwordHistory ?? [],
    reprompt: d.reprompt ?? 0,
    key: d.key ?? null
  };
  for (const f of Object.values(TYPE_TO_FIELD)) out[f] = null;
  const field = TYPE_TO_FIELD[row.type];
  if (field) out[field] = d[field] ?? null;
  return out;
}
var folderToJson = (row) => ({
  id: row.id,
  name: row.name,
  revisionDate: row.updatedAt,
  object: "folder"
});
function profileToJson(u, twoFactorEnabled = false) {
  return {
    name: u.name ?? null,
    avatarColor: u.avatarColor ?? null,
    email: u.email,
    id: u.id,
    securityStamp: u.securityStamp,
    object: "profile",
    premiumFromOrganization: false,
    culture: "en-US",
    forcePasswordReset: false,
    emailVerified: true,
    twoFactorEnabled: Boolean(twoFactorEnabled),
    premium: true,
    usesKeyConnector: false,
    creationDate: u.createdAt,
    privateKey: u.privateKey,
    key: u.key,
    accountKeys: {
      publicKeyEncryptionKeyPair: {
        wrappedPrivateKey: u.privateKey,
        publicKey: u.publicKey,
        signedPublicKey: null,
        object: "publicKeyEncryptionKeyPair"
      },
      securityState: null,
      signatureKeyPair: null,
      object: "privateKeys"
    },
    organizations: [],
    providers: [],
    providerOrganizations: [],
    _status: 0
  };
}
function tokenResponse({ user, deviceId, accessToken, refreshToken, twoFactorToken }) {
  const hasMasterPassword = Boolean(user.masterPasswordHash);
  return {
    access_token: accessToken,
    expires_in: 3600,
    token_type: "Bearer",
    refresh_token: refreshToken,
    scope: "api offline_access",
    Key: user.key,
    PrivateKey: user.privateKey,
    Kdf: user.kdfType,
    KdfIterations: user.kdfIterations,
    KdfMemory: user.kdfMemory ?? null,
    KdfParallelism: user.kdfParallelism ?? null,
    ResetMasterPassword: false,
    ForcePasswordReset: false,
    UserDecryptionOptions: {
      hasMasterPassword,
      ...hasMasterPassword ? {
        masterPasswordUnlock: {
          Kdf: {
            KdfType: user.kdfType,
            Iterations: user.kdfIterations,
            Memory: user.kdfMemory ?? null,
            Parallelism: user.kdfParallelism ?? null
          },
          MasterKeyEncryptedUserKey: user.key,
          MasterKeyWrappedUserKey: user.key,
          Salt: user.email
        }
      } : {},
      object: "userDecryptionOptions"
    },
    AccountKeys: {
      publicKeyEncryptionKeyPair: {
        wrappedPrivateKey: user.privateKey,
        publicKey: user.publicKey,
        Object: "publicKeyEncryptionKeyPair"
      },
      Object: "privateKeys"
    },
    ...twoFactorToken ? { TwoFactorToken: twoFactorToken } : {}
  };
}
app.get("/api/alive", (c) => c.text(nowIso()));
app.get("/api/now", (c) => c.text(nowIso()));
app.get("/api/version", (c) => c.json("2026.6.0"));
app.get("/api/config", (c) => {
  const base = String(envGet(c, "BASE_URL", new URL(c.req.url).origin)).replace(/\/+$/, "");
  const disableUserRegistration = !String(envGet(c, "ALLOWED_EMAILS", "")).trim();
  return c.json({
    version: "2026.6.0",
    gitHash: "edgeone",
    server: { name: "Warden", url: "https://github.com/qaz741wsd856/warden-worker" },
    settings: { disableUserRegistration, suppressOnboardingInterstitials: false },
    environment: {
      vault: base,
      api: `${base}/api`,
      identity: `${base}/identity`,
      notifications: `${base}/notifications`,
      sso: "",
      cloudRegion: null
    },
    push: { pushTechnology: 0, vapidPublicKey: null },
    featureStates: {},
    communication: null,
    object: "config"
  });
});
app.get(
  "/api/web-status",
  (c) => c.json({
    enabled: String(envGet(c, "WEB_VAULT_ENABLED", "true")).toLowerCase() !== "false",
    object: "web-status"
  })
);
var prelogin = async (c) => {
  const { email } = await body(c);
  const user = email ? await findUserByEmail(c, email) : null;
  const kdf = user?.kdfType ?? 0;
  const iterations = user?.kdfIterations ?? 6e5;
  return c.json({
    kdf,
    kdfIterations: iterations,
    kdfMemory: user?.kdfMemory ?? null,
    kdfParallelism: user?.kdfParallelism ?? null,
    kdfSettings: { kdfType: kdf, iterations, memory: user?.kdfMemory ?? null, parallelism: user?.kdfParallelism ?? null },
    salt: null
  });
};
for (const p of ["/api/accounts/prelogin", "/identity/accounts/prelogin", "/identity/accounts/prelogin/password"]) {
  app.post(p, prelogin);
}
async function register(c) {
  const p = await body(c);
  const email = String(p.email ?? "").trim().toLowerCase();
  const rl = await limit(c, "register", requestIp(c), 10, 60);
  if (rl) return rl;
  if (!email) return c.json({ error: "invalid email" }, 400);
  if (!allowedEmail(c, email)) return c.json({ error: "Not allowed to signup" }, 401);
  const store = getStore2(c.env);
  if (await findUserByEmail(c, email)) return c.json({ error: "email already exists" }, 400);
  const id = newId();
  const now = nowIso();
  const salt = randomB64();
  const iterations = Number(envGet(c, "PASSWORD_ITERATIONS", 6e5));
  const masterPasswordHash = String(p.masterPasswordHash ?? p.masterPasswordHashB64 ?? "");
  if (!masterPasswordHash) return c.json({ error: "missing masterPasswordHash" }, 400);
  const userSymmetricKey = String(p.userSymmetricKey ?? p.key ?? "");
  if (!userSymmetricKey) return c.json({ error: "missing userSymmetricKey" }, 400);
  const asym = p.userAsymmetricKeys ?? p.keys ?? {};
  const user = {
    id,
    email,
    name: p.name ?? null,
    emailVerified: false,
    masterPasswordHash: hashPassword(masterPasswordHash, salt, iterations),
    passwordSalt: salt,
    passwordIterations: iterations,
    ...await buildHintFields(c.env, readHint(p)),
    key: userSymmetricKey,
    privateKey: String(asym.encryptedPrivateKey ?? ""),
    publicKey: String(asym.publicKey ?? ""),
    kdfType: Number(p.kdf ?? 0),
    kdfIterations: Number(p.kdfIterations ?? 6e5),
    kdfMemory: p.kdfMemory ?? null,
    kdfParallelism: p.kdfParallelism ?? null,
    securityStamp: newId(),
    avatarColor: null,
    totpRecover: null,
    createdAt: now,
    updatedAt: now
  };
  await store.put(keys.profile(id), user, { ifNoneMatch: "*" });
  await store.put(keys.email(emailKey(email)), { userId: id }, { ifNoneMatch: "*" });
  return c.json({});
}
app.post("/api/accounts/register", register);
app.post("/api/accounts/register/finish", register);
app.post("/identity/accounts/register", register);
app.post("/identity/accounts/register/finish", register);
app.post("/identity/accounts/register/send-verification-email", (c) => c.json("fixed-token-to-mock"));
app.post("/api/accounts/password-hint", async (c) => {
  const { email } = await body(c);
  const rlEmail = email ? await limit(c, "hint-email", String(email).toLowerCase(), 3, 60) : null;
  if (rlEmail) return rlEmail;
  const rlIp = await limit(c, "hint-ip", requestIp(c), 10, 60);
  if (rlIp) return rlIp;
  try {
    const user = email ? await findUserByEmail(c, email) : null;
    const hint = (await readHintValue(c.env, user) ?? "").trim();
    if (user && hint) {
      const base = String(envGet(c, "BASE_URL", new URL(c.req.url).origin));
      await sendPasswordHint(c.env, { to: user.email, hint, baseUrl: base });
    }
  } catch (e) {
    console.error("[hint] send failed", e?.message || e);
  }
  return c.json({});
});
app.post("/identity/connect/token", async (c) => {
  const p = await body(c);
  const grant = String(p.grant_type ?? "");
  const store = getStore2(c.env);
  if (grant === "password") {
    const email = String(p.username ?? "").trim().toLowerCase();
    const mph = String(p.password ?? "");
    const rlEmail = await limit(c, "login-email", email, 20, 60);
    if (rlEmail) return rlEmail;
    const rlIp = await limit(c, "login-ip", requestIp(c), 60, 60);
    if (rlIp) return rlIp;
    const user = await findUserByEmail(c, email);
    if (!user) return c.json({ error: "invalid_grant" }, 400);
    const authRequestId = String(p.authrequest ?? p.authRequest ?? "");
    if (authRequestId) {
      const ar = (await store.get(keys.authRequest(user.id, authRequestId)))?.value;
      const devId = String(p.device_identifier ?? p.deviceIdentifier ?? "");
      const devType = Number(p.device_type ?? p.deviceType ?? 14);
      if (!ar || ar.approved !== 1 || ar.requestIp !== requestIp(c) || Number(ar.deviceType) !== devType || ar.requestDeviceIdentifier !== devId || String(ar.accessCode) !== mph) {
        return c.json({ error: "Username or access code is incorrect. Try again" }, 400);
      }
    } else if (!mph || !verifyPassword(user.masterPasswordHash, user.passwordSalt, user.passwordIterations, mph)) {
      return c.json({ error: "invalid_grant" }, 400);
    }
    const deviceId = String(p.device_identifier ?? p.deviceIdentifier ?? newId());
    const deviceType = Number(p.device_type ?? p.deviceType ?? 14);
    const now = nowIso();
    const device = await mutate(store, keys.device(user.id, deviceId), (cur) => ({
      ...cur ?? { id: deviceId, userId: user.id, refreshId: newId(), createdAt: now },
      name: String(p.device_name ?? p.deviceName ?? cur?.name ?? "device"),
      type: deviceType,
      updatedAt: now
    }));
    const tf = await getTwoFactor(store, user.id, TFA_AUTHENTICATOR);
    let twoFactorToken;
    if (tf?.enabled) {
      const provider = p.twoFactorProvider != null && p.twoFactorProvider !== "" ? Number(p.twoFactorProvider) : TFA_AUTHENTICATOR;
      const code = String(p.twoFactorToken ?? "");
      if (!code) return c.json(twoFactorRequired(), 400);
      try {
        if (provider === TFA_AUTHENTICATOR) {
          const step = validateTotp(code, tf.data, tf.lastUsed ?? 0, allowTotpDrift(c));
          await mutate(
            store,
            keys.twofactor(user.id, TFA_AUTHENTICATOR),
            (cur) => cur ? { ...cur, lastUsed: step } : void 0
          );
        } else if (provider === TFA_REMEMBER) {
          const { payload } = await verifyRemember(c.env, code);
          if (payload.sub !== deviceId || payload.uid !== user.id) throw new Error("remember mismatch");
          const dev = await store.get(keys.device(user.id, deviceId));
          if (!dev || dev.value.twofactorRemember !== code) throw new Error("remember mismatch");
        } else if (provider === TFA_RECOVERY) {
          const stored = String(user.totpRecover ?? "");
          if (!stored || stored.toUpperCase() !== code.trim().toUpperCase()) {
            return c.json({ error: "Recovery code is incorrect" }, 400);
          }
          await delTwoFactor(store, user.id, TFA_AUTHENTICATOR);
          await mutate(
            store,
            keys.profile(user.id),
            (cur) => cur ? { ...cur, totpRecover: null, updatedAt: nowIso() } : void 0
          );
          user.totpRecover = null;
        } else {
          return c.json({ error: "Invalid two factor provider" }, 400);
        }
      } catch (e) {
        return c.json({ error: "Two factor token is incorrect" }, 400);
      }
      if (Number(p.twoFactorRemember ?? 0) === 1) {
        twoFactorToken = await signRemember(c.env, { sub: deviceId, uid: user.id });
        await mutate(
          store,
          keys.device(user.id, deviceId),
          (cur) => cur ? { ...cur, twofactorRemember: twoFactorToken } : void 0
        );
      }
    }
    const claims = {
      sub: user.id,
      sstamp: user.securityStamp,
      premium: true,
      name: user.name ?? "User",
      email: user.email,
      email_verified: Boolean(user.emailVerified),
      device: deviceId,
      devicetype: deviceTypeName(deviceType),
      client_id: String(p.client_id ?? "web"),
      scope: ["api", "offline_access"],
      amr: ["Application"]
    };
    const accessToken = await signAccess(c.env, claims);
    const refreshToken = await signRefresh(c.env, {
      sub: "password",
      userId: user.id,
      deviceId,
      refreshId: device.refreshId,
      sstamp: user.securityStamp
    });
    return c.json(tokenResponse({ user, deviceId, accessToken, refreshToken, twoFactorToken }));
  }
  if (grant === "refresh_token") {
    let payload;
    try {
      payload = await verifyRefresh(c.env, String(p.refresh_token ?? ""));
    } catch {
      return c.json({ error: "invalid_grant" }, 400);
    }
    const device = await store.get(keys.device(String(payload.userId ?? ""), String(payload.deviceId ?? "")));
    if (!device) return c.json({ error: "invalid_grant" }, 400);
    const prof = await store.get(keys.profile(device.value.userId));
    if (!prof) return c.json({ error: "invalid_grant" }, 400);
    const user = prof.value;
    if (payload.refreshId !== device.value.refreshId || payload.sstamp !== user.securityStamp) {
      return c.json({ error: "invalid_grant" }, 400);
    }
    const accessToken = await signAccess(c.env, {
      sub: user.id,
      sstamp: user.securityStamp,
      premium: true,
      name: user.name ?? "User",
      email: user.email,
      email_verified: Boolean(user.emailVerified),
      device: device.value.id,
      devicetype: deviceTypeName(device.value.type),
      client_id: String(p.client_id ?? "web"),
      scope: ["api", "offline_access"],
      amr: ["Application"]
    });
    return c.json(tokenResponse({ user, accessToken, refreshToken: String(p.refresh_token) }));
  }
  if (grant === "send_access") {
    const accessId = String(p.send_id ?? "");
    const provided = String(p.password_hash_b64 ?? "");
    const store2 = getStore2(c.env);
    const send = await lookupSendByAccessId(store2, accessId);
    if (!send) return c.json({ error: "invalid_grant" }, 400);
    const v = validateSendAccess(send);
    if (v.error) return c.json({ error: "invalid_grant" }, 400);
    if (sendHasPassword(send) && !checkSendPassword(send, provided)) {
      return c.json({ error: "invalid_grant" }, 400);
    }
    await mutate(
      store2,
      keys.send(send.userId, send.id),
      (cur) => cur ? { ...cur, accessCount: Number(cur.accessCount ?? 0) + 1 } : void 0
    );
    const accessToken = await signAccess(c.env, {
      sub: "send-access",
      sid: accessIdFromUuid(send.id),
      scope: ["api.send.access"]
    });
    return c.json({
      access_token: accessToken,
      expires_in: 3600,
      token_type: "Bearer",
      scope: "api.send.access"
    });
  }
  return c.json({ error: "unsupported grant_type" }, 400);
});
app.get("/api/sync", async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const uid = a.claims.sub;
  const store = getStore2(c.env);
  const prof = await store.get(keys.profile(uid));
  if (!prof) return c.json({ error: "not found" }, 404);
  const user = prof.value;
  const [cipherIdx, folderIdx] = await Promise.all([
    store.list(keys.ciphers(uid)),
    store.list(keys.folders(uid))
  ]);
  const [ciphers, folders] = await Promise.all([
    mapLimit(cipherIdx, 16, async (it) => (await store.get(it.key))?.value).then((xs) => xs.filter(Boolean)),
    mapLimit(folderIdx, 16, async (it) => (await store.get(it.key))?.value).then((xs) => xs.filter(Boolean))
  ]);
  const attMap = await loadAttachmentsByCipher(store, uid);
  return c.json({
    profile: profileToJson(user),
    folders: folders.map(folderToJson),
    collections: [],
    policies: [],
    ciphers: ciphers.map(
      (row) => cipherToJson(
        row,
        (attMap.get(row.id) ?? []).map((m) => attachmentToResponse(m, baseUrlOf(c), c.env))
      )
    ),
    domains: { equivalentDomains: [], globalEquivalentDomains: [], object: "domains" },
    sends: [],
    userDecryption: {
      masterPasswordUnlock: {
        kdf: {
          kdfType: user.kdfType,
          iterations: user.kdfIterations,
          memory: user.kdfMemory ?? null,
          parallelism: user.kdfParallelism ?? null
        },
        masterKeyEncryptedUserKey: user.key,
        masterKeyWrappedUserKey: user.key,
        salt: user.email
      }
    },
    object: "sync"
  });
});
app.get("/api/accounts/profile", async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const prof = await getStore2(c.env).get(keys.profile(a.claims.sub));
  if (!prof) return c.json({ error: "not found" }, 404);
  return c.json(profileToJson(prof.value));
});
async function updateProfile(c) {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);
  const store = getStore2(c.env);
  const uid = a.claims.sub;
  const hintFields = hasHintField(p) ? await buildHintFields(c.env, readHint(p)) : null;
  const next = await mutate(store, keys.profile(uid), (cur) => {
    if (!cur) return void 0;
    return {
      ...cur,
      name: p.name ?? cur.name,
      avatarColor: p.avatarColor ?? cur.avatarColor,
      ...hintFields ?? {},
      updatedAt: nowIso()
    };
  });
  return c.json(profileToJson(next));
}
app.post("/api/accounts/profile", updateProfile);
app.put("/api/accounts/profile", updateProfile);
app.get("/api/accounts/revision-date", async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const prof = await getStore2(c.env).get(keys.profile(a.claims.sub));
  return c.json(prof ? Date.parse(prof.value.updatedAt) : Date.now());
});
app.get("/api/folders", async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const store = getStore2(c.env);
  const idx = await store.list(keys.folders(a.claims.sub));
  const rows = await mapLimit(idx, 16, async (it) => (await store.get(it.key))?.value);
  return c.json({
    data: rows.filter(Boolean).map(folderToJson),
    object: "list",
    continuationToken: null
  });
});
app.post("/api/folders", async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);
  const now = nowIso();
  const row = { id: newId(), userId: a.claims.sub, name: String(p.name ?? ""), createdAt: now, updatedAt: now };
  await getStore2(c.env).put(keys.folder(row.userId, row.id), row, { ifNoneMatch: "*" });
  return c.json(folderToJson(row));
});
app.put("/api/folders/:id", async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);
  const store = getStore2(c.env);
  const next = await mutate(
    store,
    keys.folder(a.claims.sub, c.req.param("id")),
    (cur) => cur ? { ...cur, name: String(p.name ?? cur.name), updatedAt: nowIso() } : void 0
  );
  return c.json(next ? folderToJson(next) : {});
});
app.delete("/api/folders/:id", async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  await getStore2(c.env).del(keys.folder(a.claims.sub, c.req.param("id")));
  return c.json({});
});
app.get("/api/ciphers", async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const store = getStore2(c.env);
  const idx = await store.list(keys.ciphers(a.claims.sub));
  const rows = await mapLimit(idx, 16, async (it) => (await store.get(it.key))?.value);
  const attMap = await loadAttachmentsByCipher(store, a.claims.sub);
  return c.json({
    data: rows.filter(Boolean).map(
      (row) => cipherToJson(
        row,
        (attMap.get(row.id) ?? []).map((m) => attachmentToResponse(m, baseUrlOf(c), c.env))
      )
    ),
    object: "list",
    continuationToken: null
  });
});
async function touchUser(store, uid) {
  await mutate(store, keys.profile(uid), (cur) => cur ? { ...cur, updatedAt: nowIso() } : void 0);
}
async function bulkMutate(c, fn) {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);
  const ids = Array.isArray(p.ids) ? p.ids.map(String) : [];
  const store = getStore2(c.env);
  const now = nowIso();
  for (const id of ids) {
    try {
      await mutate(store, keys.cipher(a.claims.sub, id), (cur) => cur ? fn(cur, now) : void 0);
    } catch (e) {
      console.warn("[bulk] skip", id, e?.message || e);
    }
  }
  await touchUser(store, a.claims.sub);
  return c.json({});
}
app.put("/api/ciphers/delete", (c) => bulkMutate(c, (cur, now) => ({ ...cur, deletedAt: now, updatedAt: now })));
app.post("/api/ciphers/delete", async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);
  const ids = Array.isArray(p.ids) ? p.ids.map(String) : [];
  const store = getStore2(c.env);
  for (const id of ids) await store.del(keys.cipher(a.claims.sub, id));
  await touchUser(store, a.claims.sub);
  return c.json({});
});
app.delete("/api/ciphers", async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);
  const ids = Array.isArray(p.ids) ? p.ids.map(String) : [];
  const store = getStore2(c.env);
  for (const id of ids) await store.del(keys.cipher(a.claims.sub, id));
  await touchUser(store, a.claims.sub);
  return c.json({});
});
app.put("/api/ciphers/restore", (c) => bulkMutate(c, (cur, now) => ({ ...cur, deletedAt: null, updatedAt: now })));
app.post("/api/ciphers/import", importCiphers);
app.put("/api/ciphers/archive", (c) => bulkMutate(c, (cur, now) => ({ ...cur, archivedAt: now, updatedAt: now })));
app.put("/api/ciphers/unarchive", (c) => bulkMutate(c, (cur, now) => ({ ...cur, archivedAt: null, updatedAt: now })));
async function moveCiphers(c) {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);
  const store = getStore2(c.env);
  const folderId = p.folderId ? String(p.folderId) : null;
  if (folderId) {
    const folder = await store.get(keys.folder(a.claims.sub, folderId));
    if (!folder) return c.json({ error: "Invalid folder: Folder does not exist or belongs to another user" }, 400);
  }
  const ids = Array.isArray(p.ids) ? p.ids.map(String) : [];
  const now = nowIso();
  for (const id of ids) {
    await mutate(store, keys.cipher(a.claims.sub, id), (cur) => cur ? { ...cur, folderId, updatedAt: now } : void 0);
  }
  await touchUser(store, a.claims.sub);
  return c.json({});
}
app.post("/api/ciphers/move", moveCiphers);
app.put("/api/ciphers/move", moveCiphers);
app.post("/api/ciphers/purge", async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);
  const store = getStore2(c.env);
  const prof = await store.get(keys.profile(a.claims.sub));
  if (!prof) return c.json({ error: "not found" }, 404);
  const mph = String(p.masterPasswordHash ?? "");
  if (!mph) return c.json({ error: "Missing master password hash" }, 400);
  const user = prof.value;
  if (!verifyPassword(user.masterPasswordHash, user.passwordSalt, user.passwordIterations, mph)) {
    return c.json({ error: "Invalid password" }, 401);
  }
  const [cipherIdx, folderIdx] = await Promise.all([
    store.list(keys.ciphers(a.claims.sub)),
    store.list(keys.folders(a.claims.sub))
  ]);
  for (const it of [...cipherIdx, ...folderIdx]) await store.del(it.key);
  await touchUser(store, a.claims.sub);
  return c.json({});
});
async function cipherWithAttachments(c, store, uid, row) {
  const attMap = await loadAttachmentsByCipher(store, uid);
  return cipherToJson(
    row,
    (attMap.get(row.id) ?? []).map((m) => attachmentToResponse(m, baseUrlOf(c), c.env))
  );
}
app.get("/api/ciphers/:id", async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const store = getStore2(c.env);
  const row = (await store.get(keys.cipher(a.claims.sub, c.req.param("id"))))?.value;
  if (!row) return c.json({ error: "not found" }, 404);
  return c.json(await cipherWithAttachments(c, store, a.claims.sub, row));
});
async function createCipher(c) {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);
  const src = p.cipher ?? p;
  const now = nowIso();
  const row = {
    id: String(src.id ?? newId()),
    userId: a.claims.sub,
    type: Number(src.type ?? 1),
    data: cipherDataFrom(src),
    favorite: Boolean(src.favorite),
    folderId: src.folderId ?? null,
    deletedAt: null,
    archivedAt: null,
    createdAt: now,
    updatedAt: now
  };
  await getStore2(c.env).put(keys.cipher(row.userId, row.id), row, { ifNoneMatch: "*" });
  return c.json(cipherToJson(row));
}
app.post("/api/ciphers", createCipher);
app.post("/api/ciphers/create", createCipher);
async function updateCipher(c) {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);
  const src = p.cipher ?? p;
  const store = getStore2(c.env);
  const next = await mutate(store, keys.cipher(a.claims.sub, c.req.param("id")), (cur) => {
    if (!cur) return void 0;
    const patch = {};
    if (src.name !== void 0) patch.name = src.name;
    if (src.notes !== void 0) patch.notes = src.notes;
    const field = TYPE_TO_FIELD[Number(src.type ?? cur.type)];
    if (field && src[field] !== void 0) patch[field] = src[field];
    for (const k of EXTRA_FIELDS) if (src[k] !== void 0) patch[k] = src[k];
    return {
      ...cur,
      type: Number(src.type ?? cur.type),
      data: { ...cur.data, ...patch },
      favorite: src.favorite !== void 0 ? Boolean(src.favorite) : cur.favorite,
      folderId: src.folderId !== void 0 ? src.folderId : cur.folderId,
      updatedAt: nowIso()
    };
  });
  return c.json(next ? cipherToJson(next) : {});
}
app.put("/api/ciphers/:id", updateCipher);
app.post("/api/ciphers/:id", updateCipher);
app.delete("/api/ciphers/:id", async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  await getStore2(c.env).del(keys.cipher(a.claims.sub, c.req.param("id")));
  return c.json({});
});
app.put("/api/ciphers/:id/delete", async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const store = getStore2(c.env);
  await mutate(
    store,
    keys.cipher(a.claims.sub, c.req.param("id")),
    (cur) => cur ? { ...cur, deletedAt: nowIso(), updatedAt: nowIso() } : void 0
  );
  return c.json({});
});
app.put("/api/ciphers/:id/restore", async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const store = getStore2(c.env);
  await mutate(
    store,
    keys.cipher(a.claims.sub, c.req.param("id")),
    (cur) => cur ? { ...cur, deletedAt: null, updatedAt: nowIso() } : void 0
  );
  return c.json({});
});
async function partialCipher(c) {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);
  const store = getStore2(c.env);
  const folderId = p.folderId === void 0 ? void 0 : p.folderId || null;
  if (folderId) {
    const folder = await store.get(keys.folder(a.claims.sub, folderId));
    if (!folder) return c.json({ error: "Invalid folder" }, 400);
  }
  const next = await mutate(store, keys.cipher(a.claims.sub, c.req.param("id")), (cur) => {
    if (!cur) return void 0;
    return {
      ...cur,
      folderId: folderId === void 0 ? cur.folderId : folderId,
      favorite: p.favorite === void 0 ? cur.favorite : Boolean(p.favorite),
      updatedAt: nowIso()
    };
  });
  if (!next) return c.json({ error: "not found" }, 404);
  await touchUser(store, a.claims.sub);
  return c.json(cipherToJson(next));
}
app.put("/api/ciphers/:id/partial", partialCipher);
app.post("/api/ciphers/:id/partial", partialCipher);
app.put("/api/ciphers/:id/archive", async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const store = getStore2(c.env);
  const next = await mutate(
    store,
    keys.cipher(a.claims.sub, c.req.param("id")),
    (cur) => cur ? { ...cur, archivedAt: nowIso(), updatedAt: nowIso() } : void 0
  );
  return c.json(next ? cipherToJson(next) : {});
});
app.put("/api/ciphers/:id/unarchive", async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const store = getStore2(c.env);
  const next = await mutate(
    store,
    keys.cipher(a.claims.sub, c.req.param("id")),
    (cur) => cur ? { ...cur, archivedAt: null, updatedAt: nowIso() } : void 0
  );
  return c.json(next ? cipherToJson(next) : {});
});
app.get("/api/ciphers/:id/details", async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const store = getStore2(c.env);
  const row = (await store.get(keys.cipher(a.claims.sub, c.req.param("id"))))?.value;
  if (!row) return c.json({ error: "not found" }, 404);
  return c.json(await cipherWithAttachments(c, store, a.claims.sub, row));
});
app.post("/api/folders/:id/delete", async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  await getStore2(c.env).del(keys.folder(a.claims.sub, c.req.param("id")));
  return c.json({});
});
var TFA_AUTHENTICATOR = 0;
var TFA_REMEMBER = 5;
var TFA_RECOVERY = 8;
var allowTotpDrift = (c) => String(envGet(c, "ALLOW_TOTP_DRIFT", "true")).toLowerCase() !== "false";
function twoFactorRequired() {
  return {
    error: "invalid_grant",
    error_description: "Two factor required.",
    TwoFactorProviders: [String(TFA_AUTHENTICATOR)],
    TwoFactorProviders2: { [String(TFA_AUTHENTICATOR)]: null },
    MasterPasswordPolicy: { Object: "masterPasswordPolicy" }
  };
}
var getTwoFactor = async (store, uid, atype) => (await store.get(keys.twofactor(uid, atype)))?.value ?? null;
var delTwoFactor = async (store, uid, atype) => store.del(keys.twofactor(uid, atype));
function checkPassword(user, p) {
  const mph = String(p.masterPasswordHash ?? "");
  if (!mph) return { error: "Missing master password hash", status: 400 };
  if (!verifyPassword(user.masterPasswordHash, user.passwordSalt, user.passwordIterations, mph)) {
    return { error: "Invalid password", status: 401 };
  }
  return { ok: true };
}
async function rotateStamp(store, uid) {
  const stamp = newId();
  await mutate(
    store,
    keys.profile(uid),
    (cur) => cur ? { ...cur, securityStamp: stamp, updatedAt: nowIso() } : void 0
  );
  return stamp;
}
async function revokeDevices(store, uid) {
  const idx = await store.list(keys.devices(uid));
  for (const it of idx) await store.del(it.key);
}
async function clearRecoveryIfNoTwoFactor(store, uid) {
  const tf = await getTwoFactor(store, uid, TFA_AUTHENTICATOR);
  if (tf?.enabled) return;
  await mutate(
    store,
    keys.profile(uid),
    (cur) => cur ? { ...cur, totpRecover: null, updatedAt: nowIso() } : void 0
  );
}
app.get("/api/two-factor", async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const store = getStore2(c.env);
  const tf = await getTwoFactor(store, a.claims.sub, TFA_AUTHENTICATOR);
  const data = tf?.enabled ? [{ enabled: true, type: TFA_AUTHENTICATOR, object: "twoFactorProvider" }] : [];
  return c.json({ data, object: "list", continuationToken: null });
});
app.post("/api/two-factor/get-authenticator", async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);
  const check = checkPassword(a.user, p);
  if (check.error) return c.json({ error: check.error }, check.status);
  const store = getStore2(c.env);
  const tf = await getTwoFactor(store, a.claims.sub, TFA_AUTHENTICATOR);
  return c.json({
    enabled: Boolean(tf?.enabled),
    key: tf?.enabled ? tf.data : generateTotpSecret(),
    object: "twoFactorAuthenticator"
  });
});
async function activateAuthenticator(c) {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);
  const check = checkPassword(a.user, p);
  if (check.error) return c.json({ error: check.error }, check.status);
  const key = String(p.key ?? "").toUpperCase().replace(/\s+/g, "");
  let decoded;
  try {
    decoded = base32Decode(key);
  } catch {
    return c.json({ error: "Invalid key" }, 400);
  }
  if (decoded.length !== 20) return c.json({ error: "Invalid key length" }, 400);
  const store = getStore2(c.env);
  const existing = await getTwoFactor(store, a.claims.sub, TFA_AUTHENTICATOR);
  let step;
  try {
    step = validateTotp(String(p.token ?? ""), key, existing?.lastUsed ?? 0, allowTotpDrift(c));
  } catch (e) {
    return c.json({ error: "Invalid TOTP code" }, 400);
  }
  await store.put(keys.twofactor(a.claims.sub, TFA_AUTHENTICATOR), {
    atype: TFA_AUTHENTICATOR,
    enabled: true,
    data: key,
    lastUsed: step
  });
  if (!a.user.totpRecover) {
    const code = generateRecoveryCode();
    await mutate(
      store,
      keys.profile(a.claims.sub),
      (cur) => cur ? { ...cur, totpRecover: code, updatedAt: nowIso() } : void 0
    );
  }
  return c.json({ enabled: true, key, object: "twoFactorAuthenticator" });
}
app.post("/api/two-factor/authenticator", activateAuthenticator);
app.put("/api/two-factor/authenticator", activateAuthenticator);
app.delete("/api/two-factor/authenticator", async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);
  if (Number(p.type ?? TFA_AUTHENTICATOR) !== TFA_AUTHENTICATOR) {
    return c.json({ error: "Invalid two factor type" }, 400);
  }
  const check = checkPassword(a.user, p);
  if (check.error) return c.json({ error: check.error }, check.status);
  const store = getStore2(c.env);
  const tf = await getTwoFactor(store, a.claims.sub, TFA_AUTHENTICATOR);
  if (!tf) return c.json({ error: "TOTP not configured" }, 400);
  if (String(tf.data).toUpperCase() !== String(p.key ?? "").toUpperCase()) {
    return c.json({ error: "TOTP key does not match recorded value" }, 400);
  }
  await delTwoFactor(store, a.claims.sub, TFA_AUTHENTICATOR);
  await clearRecoveryIfNoTwoFactor(store, a.claims.sub);
  return c.json({ enabled: false, type: TFA_AUTHENTICATOR, object: "twoFactorProvider" });
});
async function disableTwoFactor(c) {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);
  const check = checkPassword(a.user, p);
  if (check.error) return c.json({ error: check.error }, check.status);
  const atype = Number(p.type ?? TFA_AUTHENTICATOR);
  const store = getStore2(c.env);
  await delTwoFactor(store, a.claims.sub, atype);
  await clearRecoveryIfNoTwoFactor(store, a.claims.sub);
  return c.json({ enabled: false, type: atype, object: "twoFactorProvider" });
}
app.post("/api/two-factor/disable", disableTwoFactor);
app.put("/api/two-factor/disable", disableTwoFactor);
app.post("/api/two-factor/get-recover", async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);
  const check = checkPassword(a.user, p);
  if (check.error) return c.json({ error: check.error }, check.status);
  return c.json({ code: a.user.totpRecover ?? null, object: "twoFactorRecover" });
});
app.post("/api/accounts/password", async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);
  const check = checkPassword(a.user, p);
  if (check.error) return c.json({ error: check.error }, check.status);
  const newMph = String(p.newMasterPasswordHash ?? "");
  if (!newMph) return c.json({ error: "Missing newMasterPasswordHash" }, 400);
  const store = getStore2(c.env);
  const salt = randomB64();
  const iterations = Number(envGet(c, "PASSWORD_ITERATIONS", 6e5));
  const stamp = newId();
  const hintFields = hasHintField(p) ? await buildHintFields(c.env, readHint(p)) : null;
  await mutate(
    store,
    keys.profile(a.claims.sub),
    (cur) => cur ? {
      ...cur,
      masterPasswordHash: hashPassword(newMph, salt, iterations),
      passwordSalt: salt,
      passwordIterations: iterations,
      key: p.key ?? cur.key,
      ...hintFields ?? {},
      securityStamp: stamp,
      updatedAt: nowIso()
    } : void 0
  );
  await revokeDevices(store, a.claims.sub);
  return c.json({});
});
app.post("/api/accounts/kdf", async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);
  const check = checkPassword(a.user, p);
  if (check.error) return c.json({ error: check.error }, check.status);
  const authData = p.authenticationData ?? {};
  const unlockData = p.unlockData ?? {};
  if (String(authData.salt ?? "") !== a.user.email || String(unlockData.salt ?? "") !== a.user.email) {
    return c.json({ error: "Invalid master password salt" }, 400);
  }
  const kdf = unlockData.kdf ?? {};
  const kdfType = Number(kdf.kdf ?? kdf.kdfType ?? 0);
  const iterations = Number(kdf.kdfIterations ?? kdf.iterations ?? 6e5);
  if (![0, 1].includes(kdfType)) return c.json({ error: "Unsupported KDF type" }, 400);
  if (kdfType === 0 && iterations < 1e5) {
    return c.json({ error: "PBKDF2 iterations must be at least 100000" }, 400);
  }
  const store = getStore2(c.env);
  const salt = randomB64();
  const newIterations = Number(envGet(c, "PASSWORD_ITERATIONS", 6e5));
  const newMph = String(authData.masterPasswordAuthenticationHash ?? "");
  if (!newMph) return c.json({ error: "Missing masterPasswordAuthenticationHash" }, 400);
  const stamp = newId();
  await mutate(
    store,
    keys.profile(a.claims.sub),
    (cur) => cur ? {
      ...cur,
      masterPasswordHash: hashPassword(newMph, salt, newIterations),
      passwordSalt: salt,
      passwordIterations: newIterations,
      key: unlockData.masterKeyWrappedUserKey ?? cur.key,
      kdfType,
      kdfIterations: iterations,
      kdfMemory: kdfType === 1 ? Number(kdf.kdfMemory ?? kdf.memory ?? 0) || null : null,
      kdfParallelism: kdfType === 1 ? Number(kdf.kdfParallelism ?? kdf.parallelism ?? 0) || null : null,
      securityStamp: stamp,
      updatedAt: nowIso()
    } : void 0
  );
  await revokeDevices(store, a.claims.sub);
  return c.json({});
});
app.post("/api/accounts/security-stamp", async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);
  const check = checkPassword(a.user, p);
  if (check.error) return c.json({ error: check.error }, check.status);
  const store = getStore2(c.env);
  await revokeDevices(store, a.claims.sub);
  await rotateStamp(store, a.claims.sub);
  return c.json({});
});
app.get("/api/devices/knowndevice", async (c) => {
  const encoded = c.req.header("x-request-email") || "";
  const id = c.req.header("x-device-identifier") || "";
  if (!encoded || !id) return c.json(false);
  let email = "";
  try {
    email = Buffer.from(encoded.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
  } catch {
    return c.json(false);
  }
  const user = await findUserByEmail(c, email);
  if (!user) return c.json(false);
  const dev = await getStore2(c.env).get(keys.device(user.id, id));
  return c.json(Boolean(dev));
});
app.get("/api/devices", async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const store = getStore2(c.env);
  const idx = await store.list(keys.devices(a.claims.sub));
  const rows = await mapLimit(idx, 16, async (it) => (await store.get(it.key))?.value);
  return c.json({
    data: rows.filter(Boolean).map((d) => ({
      id: d.id,
      name: d.name,
      type: d.type,
      identifier: d.id,
      creationDate: d.createdAt,
      revisionDate: d.updatedAt,
      object: "device"
    })),
    continuationToken: null,
    object: "list"
  });
});
var displaySize = (bytes) => {
  const n = Number(bytes) || 0;
  if (n <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  let size = n;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(2)} ${units[unit]}`;
};
async function loadAttachmentsByCipher(store, uid) {
  const idx = await store.list(keys.attachments(uid));
  const metaKeys = idx.filter((it) => it.key.endsWith(".json"));
  const metas = await mapLimit(metaKeys, 16, async (it) => (await store.get(it.key))?.value);
  const map = /* @__PURE__ */ new Map();
  for (const m of metas.filter(Boolean)) {
    if (!map.has(m.cipherId)) map.set(m.cipherId, []);
    map.get(m.cipherId).push(m);
  }
  return map;
}
function attachmentToResponse(meta, base, env) {
  const token = makeAttachmentToken(env, { uid: meta.userId, aid: meta.id });
  const url = `${base}/api/ciphers/${meta.cipherId}/attachment/${meta.id}/download?token=${encodeURIComponent(
    token
  )}`;
  return {
    id: meta.id,
    url,
    fileName: meta.fileName,
    size: String(meta.fileSize ?? 0),
    sizeName: displaySize(meta.fileSize),
    key: meta.key ?? null,
    object: "attachment"
  };
}
var baseUrlOf = (c) => String(envGet(c, "BASE_URL", new URL(c.req.url).origin)).replace(/\/+$/, "");
app.post("/api/ciphers/:id/attachment/v2", async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);
  const store = getStore2(c.env);
  const cipherId = c.req.param("id");
  const cipher = (await store.get(keys.cipher(a.claims.sub, cipherId)))?.value;
  if (!cipher) return c.json({ error: "not found" }, 404);
  const id = newId();
  const meta = {
    id,
    cipherId,
    userId: a.claims.sub,
    fileName: String(p.fileName ?? "file"),
    fileSize: Number(p.fileSize ?? 0) || 0,
    key: p.key ?? null,
    createdAt: nowIso()
  };
  await store.put(keys.attachmentMeta(a.claims.sub, id), meta, { ifNoneMatch: "*" });
  return c.json({
    attachmentId: id,
    url: `${baseUrlOf(c)}/api/ciphers/${cipherId}/attachment/${id}/data`
  });
});
async function readUpload(c) {
  const ct = c.req.header("content-type") || "";
  if (ct.includes("multipart/form-data")) {
    const fd = await c.req.parseBody();
    const file = Object.values(fd).find((v) => v && typeof v === "object" && "arrayBuffer" in v);
    if (!file) return { error: "no file part" };
    return { bytes: Buffer.from(await file.arrayBuffer()), fields: fd };
  }
  return { bytes: Buffer.from(await c.req.arrayBuffer()), fields: {} };
}
async function uploadAttachmentBytes(c) {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const store = getStore2(c.env);
  const { id: cipherId, aid } = c.req.param();
  const meta = (await store.get(keys.attachmentMeta(a.claims.sub, aid)))?.value;
  if (!meta || meta.cipherId !== cipherId) return c.json({ error: "not found" }, 404);
  const up = await readUpload(c);
  if (up.error) return c.json({ error: up.error }, 400);
  const bytes = up.bytes;
  const maxBytes = Number(envGet(c, "ATTACHMENT_MAX_BYTES", 0)) || 0;
  if (maxBytes && bytes.length > maxBytes) return c.json({ error: "Attachment too large" }, 413);
  await store.putBinary(keys.attachmentData(a.claims.sub, aid), bytes);
  await mutate(
    store,
    keys.attachmentMeta(a.claims.sub, aid),
    (cur) => cur ? { ...cur, fileSize: bytes.length, updatedAt: nowIso() } : void 0
  );
  await mutate(
    store,
    keys.cipher(a.claims.sub, cipherId),
    (cur) => cur ? { ...cur, updatedAt: nowIso() } : void 0
  );
  await touchUser(store, a.claims.sub);
  return c.json({});
}
app.put("/api/ciphers/:id/attachment/:aid/data", uploadAttachmentBytes);
app.put("/api/ciphers/:id/attachment/:aid/azure-upload", uploadAttachmentBytes);
app.post("/api/ciphers/:id/attachment/:aid", uploadAttachmentBytes);
app.get("/api/ciphers/:id/attachment/:aid", async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const store = getStore2(c.env);
  const meta = (await store.get(keys.attachmentMeta(a.claims.sub, c.req.param("aid"))))?.value;
  if (!meta || meta.cipherId !== c.req.param("id")) return c.json({ error: "not found" }, 404);
  return c.json(attachmentToResponse(meta, baseUrlOf(c), c.env));
});
app.get("/api/ciphers/:id/attachment/:aid/download", async (c) => {
  const rl = await limit(c, "att-download", requestIp(c), 120, 60);
  if (rl) return rl;
  const raw2 = c.req.query("token") || (c.req.header("authorization") || "").match(/^Bearer\s+(.+)$/i)?.[1];
  const token = String(raw2 ?? "");
  if (!token) return c.json({ error: "unauthorized" }, 401);
  let uid;
  let aid;
  if (token.split(".").length === 2) {
    const att = verifyAttachmentToken(c.env, token);
    if (!att) return c.json({ error: "invalid attachment token" }, 401);
    uid = att.uid;
    aid = att.aid;
  } else {
    try {
      const claims = await verifyAccess(c.env, token);
      uid = claims.sub;
      aid = c.req.param("aid");
    } catch {
      return c.json({ error: "unauthorized" }, 401);
    }
  }
  const store = getStore2(c.env);
  const meta = (await store.get(keys.attachmentMeta(uid, aid)))?.value;
  if (!meta || meta.cipherId !== c.req.param("id")) return c.json({ error: "not found" }, 404);
  const bytes = await store.getBinary(keys.attachmentData(uid, meta.id));
  if (!bytes) return c.json({ error: "not found" }, 404);
  return c.body(bytes, 200, {
    "content-type": "application/octet-stream",
    "content-length": String(bytes.length),
    "content-disposition": `attachment; filename="${encodeURIComponent(meta.fileName)}"`,
    "cache-control": "no-store"
  });
});
async function deleteAttachment(c) {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const store = getStore2(c.env);
  const { id: cipherId, aid } = c.req.param();
  const meta = (await store.get(keys.attachmentMeta(a.claims.sub, aid)))?.value;
  if (!meta || meta.cipherId !== cipherId) return c.json({ error: "not found" }, 404);
  await store.del(keys.attachmentMeta(a.claims.sub, aid));
  await store.del(keys.attachmentData(a.claims.sub, aid));
  await mutate(
    store,
    keys.cipher(a.claims.sub, cipherId),
    (cur) => cur ? { ...cur, updatedAt: nowIso() } : void 0
  );
  await touchUser(store, a.claims.sub);
  return c.json({ id: aid, cipherId, object: "attachment" });
}
app.delete("/api/ciphers/:id/attachment/:aid", deleteAttachment);
app.post("/api/ciphers/:id/attachment/:aid/delete", deleteAttachment);
var SEND_TEXT = 0;
var SEND_FILE = 1;
var SEND_PASSWORD_ITER = 1e5;
var accessIdFromUuid = (id) => Buffer.from(String(id).replace(/-/g, ""), "hex").toString("base64url");
function pbkdf2B64url(value, saltB64, iterations) {
  return pbkdf2Sync2(String(value), Buffer.from(saltB64, "base64url"), iterations, 32, "sha256").toString(
    "base64url"
  );
}
function sendPasswordHash(password) {
  if (!password) return { passwordHash: null, passwordSalt: null, passwordIter: null };
  const salt = randomBytes3(16).toString("base64url");
  return {
    passwordHash: pbkdf2B64url(password, salt, SEND_PASSWORD_ITER),
    passwordSalt: salt,
    passwordIter: SEND_PASSWORD_ITER
  };
}
function sendHasPassword(s) {
  return Boolean(s.passwordHash);
}
function checkSendPassword(s, candidate) {
  if (!sendHasPassword(s)) return true;
  if (!candidate) return false;
  const computed = pbkdf2B64url(candidate, s.passwordSalt, s.passwordIter ?? SEND_PASSWORD_ITER);
  const a = Buffer.from(computed);
  const b = Buffer.from(String(s.passwordHash));
  return a.length === b.length && timingSafeEqual3(a, b);
}
function validateSendAccess(s, nowIsoStr = nowIso()) {
  if (s.disabled) return { error: "Send is not accessible", status: 404 };
  if (String(s.deletionDate) <= nowIsoStr) return { error: "Send is not accessible", status: 404 };
  if (s.expirationDate && String(s.expirationDate) <= nowIsoStr) {
    return { error: "Send is not accessible", status: 404 };
  }
  if (s.maxAccessCount != null && Number(s.accessCount ?? 0) >= Number(s.maxAccessCount)) {
    return { error: "Send is not accessible", status: 404 };
  }
  return { ok: true };
}
function sendToJson(s) {
  const isText = Number(s.type) === SEND_TEXT;
  return {
    id: s.id,
    accessId: accessIdFromUuid(s.id),
    type: Number(s.type),
    name: s.name,
    notes: s.notes ?? null,
    text: isText ? s.data : null,
    file: isText ? null : s.data,
    key: s.akey,
    maxAccessCount: s.maxAccessCount ?? null,
    accessCount: Number(s.accessCount ?? 0),
    revisionDate: s.updatedAt,
    expirationDate: s.expirationDate ?? null,
    deletionDate: s.deletionDate,
    disabled: Boolean(s.disabled),
    hideEmail: Boolean(s.hideEmail),
    password: s.passwordHash ?? null,
    authType: sendHasPassword(s) ? 1 : 0,
    object: "send"
  };
}
function sendAccessJson(s) {
  const isText = Number(s.type) === SEND_TEXT;
  return {
    id: s.id,
    type: Number(s.type),
    name: s.name,
    text: isText ? s.data : null,
    file: isText ? null : s.data,
    expirationDate: s.expirationDate ?? null,
    creatorIdentifier: null,
    object: "send-access"
  };
}
function validateSendDates(deletionDate, expirationDate) {
  const del = Date.parse(String(deletionDate ?? ""));
  if (!Number.isFinite(del)) return { error: "Invalid deletion date format", status: 400 };
  const now = Date.now();
  if (del <= now) return { error: "Deletion date must be in the future", status: 400 };
  if (del > now + 31 * 864e5) return { error: "Deletion date exceeds maximum", status: 400 };
  let exp = null;
  if (expirationDate) {
    const e = Date.parse(String(expirationDate));
    if (!Number.isFinite(e)) return { error: "Invalid expiration date format", status: 400 };
    if (e > del) return { error: "Expiration date must be before deletion date", status: 400 };
    exp = new Date(e).toISOString();
  }
  return { deletionDate: new Date(del).toISOString(), expirationDate: exp };
}
app.get("/api/sends", async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const store = getStore2(c.env);
  const idx = await store.list(keys.sends(a.claims.sub));
  const rows = await mapLimit(idx, 16, async (it) => (await store.get(it.key))?.value);
  return c.json({
    data: rows.filter(Boolean).map(sendToJson),
    object: "list",
    continuationToken: null
  });
});
app.get("/api/sends/:id", async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const row = (await getStore2(c.env).get(keys.send(a.claims.sub, c.req.param("id"))))?.value;
  if (!row) return c.json({ error: "not found" }, 404);
  return c.json(sendToJson(row));
});
async function createTextSend(c) {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);
  if (Number(p.type ?? 0) !== SEND_TEXT) return c.json({ error: "Use /api/sends/file/v2 for file sends" }, 400);
  const dates = validateSendDates(p.deletionDate, p.expirationDate);
  if (dates.error) return c.json({ error: dates.error }, dates.status);
  const now = nowIso();
  const id = String(p.id ?? newId());
  const send = {
    id,
    userId: a.claims.sub,
    type: SEND_TEXT,
    name: String(p.name ?? ""),
    notes: p.notes ?? null,
    data: p.text ?? null,
    akey: String(p.key ?? ""),
    maxAccessCount: p.maxAccessCount != null ? Number(p.maxAccessCount) : null,
    accessCount: 0,
    createdAt: now,
    updatedAt: now,
    expirationDate: dates.expirationDate,
    deletionDate: dates.deletionDate,
    disabled: Boolean(p.disabled),
    hideEmail: Boolean(p.hideEmail),
    ...sendPasswordHash(p.password)
  };
  const store = getStore2(c.env);
  await store.put(keys.send(a.claims.sub, id), send, { ifNoneMatch: "*" });
  await store.put(keys.sendIndex(accessIdFromUuid(id)), { userId: a.claims.sub, id });
  await touchUser(store, a.claims.sub);
  return c.json(sendToJson(send));
}
app.post("/api/sends", createTextSend);
app.put("/api/sends/:id", async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);
  const store = getStore2(c.env);
  const dates = validateSendDates(p.deletionDate, p.expirationDate);
  if (dates.error) return c.json({ error: dates.error }, dates.status);
  const next = await mutate(store, keys.send(a.claims.sub, c.req.param("id")), (cur) => {
    if (!cur) return void 0;
    const nextPw = p.password !== void 0 ? sendPasswordHash(p.password) : {};
    return {
      ...cur,
      name: p.name !== void 0 ? String(p.name) : cur.name,
      notes: p.notes !== void 0 ? p.notes : cur.notes,
      data: p.text !== void 0 ? p.text : cur.data,
      akey: p.key !== void 0 ? String(p.key) : cur.akey,
      maxAccessCount: p.maxAccessCount !== void 0 ? Number(p.maxAccessCount) : cur.maxAccessCount,
      expirationDate: dates.expirationDate,
      deletionDate: dates.deletionDate,
      disabled: p.disabled !== void 0 ? Boolean(p.disabled) : cur.disabled,
      hideEmail: p.hideEmail !== void 0 ? Boolean(p.hideEmail) : cur.hideEmail,
      updatedAt: nowIso(),
      ...nextPw
    };
  });
  if (!next) return c.json({ error: "not found" }, 404);
  await touchUser(store, a.claims.sub);
  return c.json(sendToJson(next));
});
app.delete("/api/sends/:id", async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const store = getStore2(c.env);
  const id = c.req.param("id");
  await store.del(keys.send(a.claims.sub, id));
  await store.del(keys.sendIndex(accessIdFromUuid(id)));
  await touchUser(store, a.claims.sub);
  return c.json({});
});
app.put("/api/sends/:id/remove-password", async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const store = getStore2(c.env);
  const next = await mutate(
    store,
    keys.send(a.claims.sub, c.req.param("id")),
    (cur) => cur ? { ...cur, passwordHash: null, passwordSalt: null, passwordIter: null, updatedAt: nowIso() } : void 0
  );
  if (!next) return c.json({ error: "not found" }, 404);
  return c.json(sendToJson(next));
});
async function lookupSendByAccessId(store, idOrAccessId) {
  let hit = (await store.get(keys.sendIndex(idOrAccessId)))?.value;
  if (!hit) {
    const asAccess = accessIdFromUuid(idOrAccessId);
    hit = (await store.get(keys.sendIndex(asAccess)))?.value;
  }
  if (!hit) return null;
  return (await store.get(keys.send(hit.userId, hit.id)))?.value ?? null;
}
app.post("/api/sends/access/:accessId", async (c) => {
  const rl = await limit(c, "send-access", requestIp(c), 30, 60);
  if (rl) return rl;
  const store = getStore2(c.env);
  const send = await lookupSendByAccessId(store, c.req.param("accessId"));
  if (!send) return c.json({ error: "Send is not accessible" }, 404);
  const v = validateSendAccess(send);
  if (v.error) return c.json({ error: v.error }, v.status);
  const p = await body(c);
  const password = p.password ?? p.passwordHash ?? null;
  if (sendHasPassword(send) && !checkSendPassword(send, password)) {
    return c.json({ error: password ? "Invalid password" : "Password required" }, 401);
  }
  await mutate(
    store,
    keys.send(send.userId, send.id),
    (cur) => cur ? { ...cur, accessCount: Number(cur.accessCount ?? 0) + 1 } : void 0
  );
  return c.json(sendAccessJson(send));
});
app.post("/api/sends/access", async (c) => {
  const p = await body(c);
  const auth = (c.req.header("authorization") || "").match(/^Bearer\s+(.+)$/i);
  const token = p.token ?? (auth ? auth[1] : "");
  let payload;
  try {
    payload = await verifyAccess(c.env, token);
  } catch {
    return c.json({ error: "invalid access token" }, 401);
  }
  if (!Array.isArray(payload.scope) || !payload.scope.includes("api.send.access") || payload.sid == null) {
    return c.json({ error: "invalid access token" }, 401);
  }
  const store = getStore2(c.env);
  const idx = (await store.get(keys.sendIndex(String(payload.sid))))?.value;
  if (!idx) return c.json({ error: "Send is not accessible" }, 404);
  const send = (await store.get(keys.send(idx.userId, idx.id)))?.value;
  if (!send) return c.json({ error: "Send is not accessible" }, 404);
  const v = validateSendAccess(send);
  if (v.error) return c.json({ error: v.error }, v.status);
  return c.json(sendAccessJson(send));
});
app.post("/api/sends/access/file/:fileId", async (c) => {
  const store = getStore2(c.env);
  const send = await lookupSendByAccessId(store, c.req.param("fileId"));
  if (!send) return c.json({ error: "Send is not accessible" }, 404);
  const v = validateSendAccess(send);
  if (v.error) return c.json({ error: v.error }, v.status);
  const bytes = await store.getBinary(keys.sendFile(send.userId, send.id));
  if (!bytes) return c.json({ error: "file not found" }, 404);
  return c.body(bytes, 200, {
    "content-type": "application/octet-stream",
    "content-length": String(bytes.length),
    "cache-control": "no-store"
  });
});
app.post("/api/sends/file/v2", async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);
  if (Number(p.type ?? 1) !== SEND_FILE) return c.json({ error: "invalid send type" }, 400);
  const dates = validateSendDates(p.deletionDate, p.expirationDate);
  if (dates.error) return c.json({ error: dates.error }, dates.status);
  const now = nowIso();
  const id = String(p.id ?? newId());
  const fileName = String(p.file?.fileName ?? p.fileName ?? "file");
  const size = Number(p.fileLength ?? p.file?.size ?? 0) || 0;
  const send = {
    id,
    userId: a.claims.sub,
    type: SEND_FILE,
    name: String(p.name ?? ""),
    notes: p.notes ?? null,
    data: { id: "file", fileName, size: String(size), sizeName: displaySize(size) },
    akey: String(p.key ?? ""),
    maxAccessCount: p.maxAccessCount != null ? Number(p.maxAccessCount) : null,
    accessCount: 0,
    createdAt: now,
    updatedAt: now,
    expirationDate: dates.expirationDate,
    deletionDate: dates.deletionDate,
    disabled: Boolean(p.disabled),
    hideEmail: Boolean(p.hideEmail),
    ...sendPasswordHash(p.password)
  };
  const store = getStore2(c.env);
  await store.put(keys.send(a.claims.sub, id), send, { ifNoneMatch: "*" });
  await store.put(keys.sendIndex(accessIdFromUuid(id)), { userId: a.claims.sub, id });
  await touchUser(store, a.claims.sub);
  return c.json({
    sendResponse: sendToJson(send),
    // 1 = Direct：客户端会把加密后的字节 POST 到下面的 url（multipart 或裸字节）。
    // 之前写 0（Azure）会让客户端按 Blob SAS 协议 PUT，我们没有 Azure 后端，上传必然失败。
    fileUploadType: 1,
    url: `${baseUrlOf(c)}/api/sends/${id}/file/${id}`
  });
});
async function uploadSendFile(c) {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const store = getStore2(c.env);
  const id = c.req.param("id");
  const send = (await store.get(keys.send(a.claims.sub, id)))?.value;
  if (!send || Number(send.type) !== SEND_FILE) return c.json({ error: "not found" }, 404);
  const up = await readUpload(c);
  if (up.error) return c.json({ error: up.error }, 400);
  const bytes = up.bytes;
  const maxBytes = Number(envGet(c, "ATTACHMENT_MAX_BYTES", 0)) || 0;
  if (maxBytes && bytes.length > maxBytes) return c.json({ error: "File too large" }, 413);
  await store.putBinary(keys.sendFile(a.claims.sub, id), bytes);
  const next = await mutate(
    store,
    keys.send(a.claims.sub, id),
    (cur) => cur ? {
      ...cur,
      data: { ...cur.data, size: String(bytes.length), sizeName: displaySize(bytes.length) },
      updatedAt: nowIso()
    } : void 0
  );
  await touchUser(store, a.claims.sub);
  return c.json(sendToJson(next));
}
app.post("/api/sends/:id/file/:fileId", uploadSendFile);
app.put("/api/sends/:id/file/:fileId", uploadSendFile);
app.post("/api/sends/:id/access/file/:fileId", async (c) => {
  const p = await body(c);
  const auth = (c.req.header("authorization") || "").match(/^Bearer\s+(.+)$/i);
  const token = p.token ?? (auth ? auth[1] : "");
  const store = getStore2(c.env);
  let send;
  if (token) {
    let payload;
    try {
      payload = await verifyAccess(c.env, token);
    } catch {
      return c.json({ error: "invalid access token" }, 401);
    }
    const idx = (await store.get(keys.sendIndex(String(payload.sid))))?.value;
    if (!idx) return c.json({ error: "Send is not accessible" }, 404);
    send = (await store.get(keys.send(idx.userId, idx.id)))?.value;
  } else {
    send = await lookupSendByAccessId(store, c.req.param("id"));
  }
  if (!send) return c.json({ error: "Send is not accessible" }, 404);
  const v = validateSendAccess(send);
  if (v.error) return c.json({ error: v.error }, v.status);
  if (sendHasPassword(send) && !checkSendPassword(send, p.password ?? null)) {
    return c.json({ error: "Invalid password" }, 401);
  }
  const bytes = await store.getBinary(keys.sendFile(send.userId, send.id));
  if (!bytes) return c.json({ error: "file not found" }, 404);
  return c.body(bytes, 200, {
    "content-type": "application/octet-stream",
    "content-length": String(bytes.length),
    "cache-control": "no-store"
  });
});
app.post("/api/accounts/key-management/rotate-user-account-keys", async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);
  const check = checkPassword(a.user, { masterPasswordHash: p.oldMasterKeyAuthenticationHash });
  if (check.error) return c.json({ error: check.error }, check.status);
  const unlock = p.accountUnlockData?.masterPasswordUnlockData ?? {};
  const kdfType = Number(unlock.kdfType ?? a.user.kdfType);
  const kdfIterations = Number(unlock.kdfIterations ?? a.user.kdfIterations);
  const kdfMemory = unlock.kdfMemory ?? null;
  const kdfParallelism = unlock.kdfParallelism ?? null;
  if (String(unlock.email ?? "") !== a.user.email) {
    return c.json({ error: "Invalid master password salt" }, 400);
  }
  if (kdfType !== a.user.kdfType || kdfIterations !== a.user.kdfIterations || (kdfMemory ?? null) !== (a.user.kdfMemory ?? null) || (kdfParallelism ?? null) !== (a.user.kdfParallelism ?? null)) {
    return c.json({ error: "Changing the kdf variant is not supported during key rotation" }, 400);
  }
  if (String(p.accountKeys?.accountPublicKey ?? "") !== a.user.publicKey) {
    return c.json({ error: "Changing the asymmetric keypair is not supported during key rotation" }, 400);
  }
  const store = getStore2(c.env);
  const [cipherIdx, folderIdx] = await Promise.all([
    store.list(keys.ciphers(a.claims.sub)),
    store.list(keys.folders(a.claims.sub))
  ]);
  const curCiphers = (await mapLimit(cipherIdx, 16, async (it) => (await store.get(it.key))?.value)).filter(Boolean);
  const curFolders = (await mapLimit(folderIdx, 16, async (it) => (await store.get(it.key))?.value)).filter(Boolean);
  const reqCiphers = Array.isArray(p.accountData?.ciphers) ? p.accountData.ciphers : [];
  const reqFolders = Array.isArray(p.accountData?.folders) ? p.accountData.folders : [];
  if (reqCiphers.length !== curCiphers.length || reqFolders.length !== curFolders.length) {
    return c.json({ error: "All existing ciphers and folders must be included in the rotation" }, 400);
  }
  const cipherIds = new Set(curCiphers.map((x) => x.id));
  for (const rc of reqCiphers) {
    if (!rc?.id || !cipherIds.has(rc.id)) {
      return c.json({ error: "All existing ciphers and folders must be included in the rotation" }, 400);
    }
  }
  const folderIds = new Set(curFolders.map((x) => x.id));
  for (const rf of reqFolders) {
    if (!rf?.id || !folderIds.has(rf.id)) {
      return c.json({ error: "All existing ciphers and folders must be included in the rotation" }, 400);
    }
  }
  for (const rf of reqFolders) {
    await mutate(
      store,
      keys.folder(a.claims.sub, String(rf.id)),
      (cur) => cur ? { ...cur, name: String(rf.name ?? cur.name), updatedAt: nowIso() } : void 0
    );
  }
  for (const rc of reqCiphers) {
    const data = cipherDataFrom(rc);
    await mutate(
      store,
      keys.cipher(a.claims.sub, String(rc.id)),
      (cur) => cur ? {
        ...cur,
        data: { ...cur.data, ...data },
        folderId: rc.folderId ?? null,
        favorite: rc.favorite !== void 0 ? Boolean(rc.favorite) : cur.favorite,
        updatedAt: nowIso()
      } : void 0
    );
    for (const [aid, att] of Object.entries(rc.attachments2 ?? {})) {
      await mutate(
        store,
        keys.attachmentMeta(a.claims.sub, aid),
        (cur) => cur ? { ...cur, key: att.key ?? cur.key, fileName: att.fileName ?? cur.fileName } : void 0
      );
    }
  }
  for (const rs of Array.isArray(p.accountData?.sends) ? p.accountData.sends : []) {
    if (!rs?.id) continue;
    await mutate(
      store,
      keys.send(a.claims.sub, String(rs.id)),
      (cur) => cur ? {
        ...cur,
        name: rs.name ?? cur.name,
        notes: rs.notes ?? cur.notes,
        akey: rs.key ?? cur.akey,
        data: rs.text ?? rs.file ?? cur.data,
        updatedAt: nowIso()
      } : void 0
    );
  }
  const salt = randomB64();
  const iterations = Number(envGet(c, "PASSWORD_ITERATIONS", 6e5));
  const newMph = String(unlock.masterKeyAuthenticationHash ?? "");
  if (!newMph) return c.json({ error: "Missing masterKeyAuthenticationHash" }, 400);
  const stamp = newId();
  await mutate(
    store,
    keys.profile(a.claims.sub),
    (cur) => cur ? {
      ...cur,
      masterPasswordHash: hashPassword(newMph, salt, iterations),
      passwordSalt: salt,
      passwordIterations: iterations,
      key: unlock.masterKeyEncryptedUserKey ?? cur.key,
      privateKey: p.accountKeys.userKeyEncryptedAccountPrivateKey ?? cur.privateKey,
      securityStamp: stamp,
      updatedAt: nowIso()
    } : void 0
  );
  await revokeDevices(store, a.claims.sub);
  return c.json({});
});
async function importCiphers(c) {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);
  const store = getStore2(c.env);
  const now = nowIso();
  const folderIds = [];
  for (const f of Array.isArray(p.folders) ? p.folders : []) {
    const id = newId();
    await store.put(keys.folder(a.claims.sub, id), {
      id,
      userId: a.claims.sub,
      name: String(f.name ?? ""),
      createdAt: now,
      updatedAt: now
    });
    folderIds.push(id);
  }
  const rels = new Map(
    (Array.isArray(p.folderRelationships) ? p.folderRelationships : []).map((r) => [
      Number(r.key),
      Number(r.value)
    ])
  );
  let count = 0;
  for (const [index, src] of (Array.isArray(p.ciphers) ? p.ciphers : []).entries()) {
    const folderIndex = rels.get(index);
    const id = newId();
    await store.put(keys.cipher(a.claims.sub, id), {
      id,
      userId: a.claims.sub,
      type: Number(src.type ?? 1),
      data: cipherDataFrom(src),
      favorite: Boolean(src.favorite),
      folderId: folderIndex != null && folderIds[folderIndex] ? folderIds[folderIndex] : null,
      deletedAt: null,
      archivedAt: null,
      createdAt: now,
      updatedAt: now
    });
    count += 1;
  }
  await touchUser(store, a.claims.sub);
  return c.json({ count, folders: folderIds.length }, 200);
}
var requestIp = (c) => c.req.header("cf-connecting-ip") || c.req.header("x-real-ip") || (c.req.header("x-forwarded-for") || "").split(",")[0].trim() || "127.0.0.1";
var requestDeviceType = (c) => Number(c.req.header("device-type") ?? c.req.header("x-device-type") ?? 14) || 14;
function authRequestToJson(ar, origin) {
  return {
    id: ar.id,
    publicKey: ar.publicKey,
    requestDeviceType: deviceTypeName(ar.deviceType),
    requestIpAddress: ar.requestIp,
    key: ar.encKey ?? null,
    masterPasswordHash: ar.masterPasswordHash ?? null,
    creationDate: ar.creationDate,
    responseDate: ar.responseDate ?? null,
    requestApproved: ar.approved === 1,
    origin,
    object: "auth-request"
  };
}
app.post("/api/auth-requests", async (c) => {
  const p = await body(c);
  const store = getStore2(c.env);
  const email = String(p.email ?? "").toLowerCase();
  const user = await findUserByEmail(c, email);
  if (!user) return c.json({ error: "AuthRequest doesn't exist" }, 400);
  const device = (await store.get(keys.device(user.id, String(p.deviceIdentifier ?? ""))))?.value;
  const devType = requestDeviceType(c);
  if (!device || Number(device.type) !== devType) {
    return c.json({ error: "AuthRequest doesn't exist" }, 400);
  }
  const ar = {
    id: newId(),
    userId: user.id,
    requestDeviceIdentifier: device.id,
    deviceType: devType,
    requestIp: requestIp(c),
    responseDeviceId: null,
    accessCode: String(p.accessCode ?? ""),
    publicKey: String(p.publicKey ?? ""),
    encKey: null,
    masterPasswordHash: null,
    approved: null,
    creationDate: nowIso(),
    responseDate: null
  };
  await store.put(keys.authRequest(user.id, ar.id), ar, { ifNoneMatch: "*" });
  await store.put(keys.authRequestIndex(ar.id), { userId: user.id, id: ar.id });
  return c.json(authRequestToJson(ar, baseUrlOf(c)));
});
async function pendingAuthRequests(c) {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const store = getStore2(c.env);
  const idx = await store.list(keys.authRequests(a.claims.sub));
  const rows = await mapLimit(idx, 16, async (it) => (await store.get(it.key))?.value);
  const live = rows.filter((r) => r && r.approved == null);
  return c.json({
    data: live.map((r) => authRequestToJson(r, baseUrlOf(c))),
    continuationToken: null,
    object: "list"
  });
}
app.get("/api/auth-requests", pendingAuthRequests);
app.get("/api/auth-requests/pending", pendingAuthRequests);
app.get("/api/auth-requests/:id", async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const ar = (await getStore2(c.env).get(keys.authRequest(a.claims.sub, c.req.param("id"))))?.value;
  if (!ar) return c.json({ error: "AuthRequest doesn't exist" }, 400);
  return c.json(authRequestToJson(ar, baseUrlOf(c)));
});
app.put("/api/auth-requests/:id", async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);
  if (a.claims.device !== String(p.deviceIdentifier ?? "")) {
    return c.json({ error: "AuthRequest doesn't exist" }, 400);
  }
  const store = getStore2(c.env);
  const id = c.req.param("id");
  const ar = (await store.get(keys.authRequest(a.claims.sub, id)))?.value;
  if (!ar) return c.json({ error: "AuthRequest doesn't exist" }, 400);
  if (ar.approved != null) {
    return c.json({ error: "An authentication request with the same device already exists" }, 400);
  }
  if (p.requestApproved) {
    const next = await mutate(
      store,
      keys.authRequest(a.claims.sub, id),
      (cur) => cur ? {
        ...cur,
        approved: 1,
        encKey: String(p.key ?? ""),
        masterPasswordHash: p.masterPasswordHash ?? null,
        responseDeviceId: String(p.deviceIdentifier ?? ""),
        responseDate: nowIso()
      } : void 0
    );
    return c.json(authRequestToJson(next, baseUrlOf(c)));
  }
  await store.del(keys.authRequest(a.claims.sub, id));
  await store.del(keys.authRequestIndex(id));
  return c.json(authRequestToJson(ar, baseUrlOf(c)));
});
app.get("/api/auth-requests/:id/response", async (c) => {
  const store = getStore2(c.env);
  const hit = (await store.get(keys.authRequestIndex(c.req.param("id"))))?.value;
  if (!hit) return c.json({ error: "AuthRequest doesn't exist" }, 400);
  const ar = (await store.get(keys.authRequest(hit.userId, hit.id)))?.value;
  if (!ar) return c.json({ error: "AuthRequest doesn't exist" }, 400);
  const code = String(c.req.query("code") ?? "");
  if (Number(ar.deviceType) !== requestDeviceType(c) || ar.requestIp !== requestIp(c) || String(ar.accessCode) !== code) {
    return c.json({ error: "AuthRequest doesn't exist" }, 400);
  }
  return c.json(authRequestToJson(ar, baseUrlOf(c)));
});
app.get("/api/folders/:id", async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const row = (await getStore2(c.env).get(keys.folder(a.claims.sub, c.req.param("id"))))?.value;
  if (!row) return c.json({ error: "not found" }, 404);
  return c.json(folderToJson(row));
});
app.post("/api/ciphers/:id/delete", async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const store = getStore2(c.env);
  await store.del(keys.cipher(a.claims.sub, c.req.param("id")));
  await touchUser(store, a.claims.sub);
  return c.json({});
});
app.post("/api/ciphers/:id/attachment", async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const store = getStore2(c.env);
  const cipherId = c.req.param("id");
  const cipher = (await store.get(keys.cipher(a.claims.sub, cipherId)))?.value;
  if (!cipher) return c.json({ error: "not found" }, 404);
  const up = await readUpload(c);
  if (up.error) return c.json({ error: up.error }, 400);
  const id = newId();
  const meta = {
    id,
    cipherId,
    userId: a.claims.sub,
    fileName: String(up.fields.fileName ?? "file"),
    fileSize: up.bytes.length,
    key: up.fields.key ?? null,
    createdAt: nowIso()
  };
  await store.put(keys.attachmentMeta(a.claims.sub, id), meta);
  await store.putBinary(keys.attachmentData(a.claims.sub, id), up.bytes);
  await mutate(
    store,
    keys.cipher(a.claims.sub, cipherId),
    (cur) => cur ? { ...cur, updatedAt: nowIso() } : void 0
  );
  await touchUser(store, a.claims.sub);
  return c.json(await cipherWithAttachments(c, store, a.claims.sub, (await store.get(keys.cipher(a.claims.sub, cipherId))).value));
});
app.post("/api/sends/file", async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const store = getStore2(c.env);
  const up = await readUpload(c);
  if (up.error) return c.json({ error: up.error }, 400);
  const f = up.fields;
  const dates = validateSendDates(f.deletionDate, f.expirationDate);
  if (dates.error) return c.json({ error: dates.error }, dates.status);
  const id = String(f.id ?? newId());
  const send = {
    id,
    userId: a.claims.sub,
    type: SEND_FILE,
    name: String(f.name ?? ""),
    notes: f.notes ?? null,
    data: { id: "file", fileName: String(f.fileName ?? "file"), size: String(up.bytes.length), sizeName: displaySize(up.bytes.length) },
    akey: String(f.key ?? ""),
    maxAccessCount: f.maxAccessCount != null && f.maxAccessCount !== "" ? Number(f.maxAccessCount) : null,
    accessCount: 0,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    expirationDate: dates.expirationDate,
    deletionDate: dates.deletionDate,
    disabled: false,
    hideEmail: false,
    ...sendPasswordHash(f.password)
  };
  await store.put(keys.send(a.claims.sub, id), send, { ifNoneMatch: "*" });
  await store.put(keys.sendIndex(accessIdFromUuid(id)), { userId: a.claims.sub, id });
  await store.putBinary(keys.sendFile(a.claims.sub, id), up.bytes);
  await touchUser(store, a.claims.sub);
  return c.json(sendToJson(send));
});
app.get("/api/devices/identifier/:id", async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const d = (await getStore2(c.env).get(keys.device(a.claims.sub, c.req.param("id"))))?.value;
  if (!d) return c.json({ error: "not found" }, 404);
  return c.json({
    id: d.id,
    name: d.name,
    type: d.type,
    identifier: d.id,
    creationDate: d.createdAt,
    revisionDate: d.updatedAt,
    object: "device"
  });
});
async function deviceToken(c) {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);
  const token = String(p.pushToken ?? "").trim();
  if (!token) return c.json({ error: "Missing pushToken" }, 400);
  const store = getStore2(c.env);
  await mutate(
    store,
    keys.device(a.claims.sub, c.req.param("id")),
    (cur) => cur ? { ...cur, pushToken: token, updatedAt: nowIso() } : void 0
  );
  return c.json({});
}
app.post("/api/devices/identifier/:id/token", deviceToken);
app.put("/api/devices/identifier/:id/token", deviceToken);
async function clearDeviceToken(c) {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const store = getStore2(c.env);
  await mutate(
    store,
    keys.device(a.claims.sub, c.req.param("id")),
    (cur) => cur ? { ...cur, pushToken: null, pushUuid: null, updatedAt: nowIso() } : void 0
  );
  return c.json({});
}
app.put("/api/devices/identifier/:id/clear-token", clearDeviceToken);
app.post("/api/devices/identifier/:id/clear-token", clearDeviceToken);
app.put("/api/accounts/avatar", async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);
  if (p.avatarColor != null && String(p.avatarColor).length !== 7) {
    return c.json({ error: "Invalid avatar color" }, 400);
  }
  const next = await mutate(
    getStore2(c.env),
    keys.profile(a.claims.sub),
    (cur) => cur ? { ...cur, avatarColor: p.avatarColor ?? null, updatedAt: nowIso() } : void 0
  );
  return c.json(profileToJson(next));
});
app.get("/api/settings/domains", async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  return c.json({
    equivalentDomains: a.user.equivalentDomains ?? [],
    globalEquivalentDomains: [],
    object: "domains"
  });
});
async function setDomains(c) {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);
  await mutate(
    getStore2(c.env),
    keys.profile(a.claims.sub),
    (cur) => cur ? { ...cur, equivalentDomains: p.equivalentDomains ?? [], updatedAt: nowIso() } : void 0
  );
  return c.json({});
}
app.post("/api/settings/domains", setDomains);
app.put("/api/settings/domains", setDomains);
app.get("/api/tasks", (c) => c.json({ data: [], object: "list" }));
app.get(
  "/notifications/hub",
  (c) => c.json({ error: "websocket_not_supported", hint: "fallback to polling /api/sync" }, 426)
);
app.get(
  "/notifications/anonymous-hub",
  (c) => c.json({ error: "websocket_not_supported", hint: "fallback to polling /api/sync" }, 426)
);
app.get("/api/hibp/breach", (c) => c.json([]));
app.get("/api/webauthn", (c) => c.json({ object: "list", data: [], continuationToken: null }));
app.get(
  "/api/emergency-access/trusted",
  (c) => c.json({ data: [], object: "list", continuationToken: null })
);
app.get(
  "/api/emergency-access/granted",
  (c) => c.json({ data: [], object: "list", continuationToken: null })
);
app.post("/api/accounts/register/send-verification-email", (c) => c.json("fixed-token-to-mock"));
async function deleteAccount(c) {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);
  const check = checkPassword(a.user, p);
  if (check.error) return c.json({ error: check.error }, check.status);
  const store = getStore2(c.env);
  const root = `u/${a.claims.sub}/`;
  const items = await store.list(root);
  for (const it of items) {
    if (!it.key.includes("/sends/") || !it.key.endsWith(".json")) continue;
    const v = (await store.get(it.key))?.value;
    if (v?.id) await store.del(keys.sendIndex(accessIdFromUuid(v.id)));
  }
  for (const it of items) await store.del(it.key);
  await store.del(keys.email(emailKey(a.user.email)));
  return c.json({});
}
app.delete("/api/accounts", deleteAccount);
app.post("/api/accounts/delete", deleteAccount);
app.all(
  "*",
  (c) => c.json(
    {
      error: "not_implemented",
      path: new URL(c.req.url).pathname,
      hint: "route not implemented yet, see README"
    },
    501
  )
);
var index_default = app;

// src/makers.js
var handler = async (context) => {
  const request = context?.request ?? context;
  const env = context?.env ?? process.env;
  return index_default.fetch(request, env, context);
};
handler.fetch = handler;
handler.onRequest = handler;
var makers_default = handler;
export {
  makers_default as default,
  handler as fetch,
  handler as onRequest
};
