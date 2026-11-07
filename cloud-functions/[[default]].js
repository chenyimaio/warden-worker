// generated at deploy time by edgeone/scripts/build-makes.mjs — do not commit the built output
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
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
import { createHash as createHash2, pbkdf2Sync as pbkdf2Sync3, randomBytes as randomBytes2, timingSafeEqual as timingSafeEqual4 } from "node:crypto";

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
  //
  // 注意：type: 'arrayBuffer' 拿回来的是 ArrayBuffer（有 byteLength，没有 length），
  // 而调用方（下载响应）用的是 bytes.length 和 Buffer 语义。这里统一转成 Buffer，
  // 否则 Content-Length 会被写成字符串 "undefined"，平台直接报
  // "bad Content-Length"，下载/文件 Send 全部打不开。
  async getBinary(key) {
    const raw2 = await this.#store.get(key, { type: "arrayBuffer", consistency: "strong" });
    if (raw2 == null) return null;
    if (Buffer.isBuffer(raw2)) return raw2;
    if (raw2 instanceof ArrayBuffer) return Buffer.from(raw2);
    if (ArrayBuffer.isView(raw2)) return Buffer.from(raw2.buffer, raw2.byteOffset, raw2.byteLength);
    return Buffer.from(String(raw2));
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

// src/env-accounts.js
import { pbkdf2Sync as pbkdf2Sync2, timingSafeEqual as timingSafeEqual3 } from "node:crypto";
var DEFAULT_ITERATIONS = 6e5;
function mergedEnv(env) {
  return { ...process.env ?? {}, ...env ?? {} };
}
function envAccounts(env) {
  const all = mergedEnv(env);
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  for (const key of Object.keys(all)) {
    const m = /^USEREMAIL(\d+)$/i.exec(key);
    if (!m) continue;
    const email = String(all[key] ?? "").trim().toLowerCase();
    if (!email || seen.has(email)) continue;
    const password = all[`USERPASSWORD${m[1]}`] ?? all[`USERPASSWORD${m[1]}`.toLowerCase()];
    if (!password) continue;
    seen.add(email);
    out.push({ index: Number(m[1]), email, password: String(password) });
  }
  return out.sort((a, b) => a.index - b.index);
}
function findEnvAccount(env, email) {
  const want = String(email ?? "").trim().toLowerCase();
  if (!want) return null;
  return envAccounts(env).find((a) => a.email === want) ?? null;
}
function hasEnvAccounts(env) {
  return envAccounts(env).length > 0;
}
function envAccountKdf(env) {
  const n = Number((mergedEnv(env).PASSWORD_ITERATIONS ?? DEFAULT_ITERATIONS) || DEFAULT_ITERATIONS);
  return { kdf: 0, kdfIterations: Number.isFinite(n) && n > 0 ? n : DEFAULT_ITERATIONS };
}
function deriveMasterPasswordHash(password, email, iterations) {
  const masterKey = pbkdf2Sync2(String(password), String(email).trim().toLowerCase(), iterations, 32, "sha256");
  const hash = pbkdf2Sync2(masterKey, String(password), 1, 32, "sha256");
  return hash.toString("base64");
}
function verifyEnvAccount(account, providedHash, iterations) {
  if (!account) return false;
  const expected = Buffer.from(deriveMasterPasswordHash(account.password, account.email, iterations), "utf8");
  const given = Buffer.from(String(providedHash ?? ""), "utf8");
  return expected.length === given.length && timingSafeEqual3(expected, given);
}

// src/upload.js
var CR = 13;
var LF = 10;
var DASH = 45;
async function readUpload(c) {
  const ct = c.req.header("content-type") || "";
  const raw2 = Buffer.from(await c.req.arrayBuffer());
  const m = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(ct);
  if (!ct.toLowerCase().includes("multipart/form-data") || !m) {
    return { bytes: raw2, fields: {} };
  }
  const boundary = (m[1] ?? m[2]).trim();
  const delim = Buffer.from(`--${boundary}`);
  const fields = {};
  let pos = raw2.indexOf(delim);
  let fileBytes = null;
  let fileName = null;
  while (pos !== -1) {
    let start = pos + delim.length;
    if (raw2[start] === DASH && raw2[start + 1] === DASH) break;
    if (raw2[start] === CR && raw2[start + 1] === LF) start += 2;
    const headEnd = raw2.indexOf("\r\n\r\n", start);
    if (headEnd === -1) break;
    const headers = raw2.subarray(start, headEnd).toString("utf8");
    const bodyStart = headEnd + 4;
    const next = raw2.indexOf(delim, bodyStart);
    if (next === -1) break;
    let bodyEnd = next;
    if (bodyEnd - 2 >= bodyStart && raw2[bodyEnd - 2] === CR && raw2[bodyEnd - 1] === LF) {
      bodyEnd -= 2;
    }
    const bytes = raw2.subarray(bodyStart, bodyEnd);
    const name = /name="([^"]*)"/i.exec(headers)?.[1];
    const filename = /filename="([^"]*)"/i.exec(headers)?.[1];
    if (filename !== void 0) {
      if (fileBytes === null) {
        fileBytes = Buffer.from(bytes);
        fileName = filename;
      }
    } else if (name) {
      fields[name] = bytes.toString("utf8");
    }
    pos = next;
  }
  if (fileBytes === null) {
    console.warn(
      "[upload] no file part",
      JSON.stringify({
        contentType: ct,
        length: raw2.length,
        head: raw2.subarray(0, 64).toString("latin1")
      })
    );
    return { error: "no file part" };
  }
  return { bytes: fileBytes, fields, fileName };
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
var hintFieldsFrom = (plaintext) => {
  const text = plaintext == null ? "" : String(plaintext).trim();
  return { masterPasswordHint: text || null, masterPasswordHintEnc: null };
};
async function requireAuth(c) {
  const m = (c.req.header("authorization") || "").match(/^Bearer\s+(.+)$/i);
  if (!m) {
    console.warn("[auth] missing bearer", c.req.method, c.req.path, "auth-header=" + (c.req.header("authorization") ? "present-but-unparsable" : "absent"));
    return { error: c.json({ error: "unauthorized", reason: "missing_token" }, 401) };
  }
  try {
    const claims = await verifyAccess(c.env, m[1]);
    const prof = await getStore2(c.env).get(keys.profile(claims.sub));
    if (!prof || prof.value.securityStamp !== claims.sstamp) {
      console.warn("[auth] stamp mismatch", c.req.method, c.req.path, "sub=" + claims.sub, "profile=" + Boolean(prof));
      return { error: c.json({ error: "unauthorized", reason: "stamp_mismatch" }, 401) };
    }
    return { claims, user: prof.value, token: m[1] };
  } catch (e) {
    console.warn("[auth] token rejected:", c.req.method, c.req.path, e?.code || e?.message || e);
    return { error: c.json({ error: "unauthorized", reason: "bad_token" }, 401) };
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
  const envAcc = email ? findEnvAccount(c.env, email) : null;
  if (envAcc) {
    const { kdf: kdf2, kdfIterations } = envAccountKdf(c.env);
    return c.json({
      kdf: kdf2,
      kdfIterations,
      kdfMemory: null,
      kdfParallelism: null,
      kdfSettings: { kdfType: kdf2, iterations: kdfIterations, memory: null, parallelism: null },
      salt: null
    });
  }
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
  if (hasEnvAccounts(c.env)) {
    if (!findEnvAccount(c.env, email)) return c.json({ error: "Not allowed to signup" }, 401);
  } else if (!allowedEmail(c, email)) {
    return c.json({ error: "Not allowed to signup" }, 401);
  }
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
    ...hintFieldsFrom(readHint(p)),
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
    } else if (!mph || !await checkMasterPassword(c, user, mph)) {
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
    if (!send) {
      console.warn("[send-access] send not found for accessId", accessId.slice(0, 12) + "\u2026");
      return c.json({ error: "invalid_grant", send_access_error_type: "not_found" }, 400);
    }
    const v = validateSendAccess(send);
    if (v.error) {
      console.warn("[send-access] rejected", v.error, JSON.stringify({
        deletionDate: send.deletionDate,
        expirationDate: send.expirationDate ?? null,
        accessCount: send.accessCount ?? 0,
        maxAccessCount: send.maxAccessCount ?? null,
        disabled: Boolean(send.disabled)
      }));
      return c.json({ error: "invalid_grant", send_access_error_type: "unavailable" }, 400);
    }
    if (sendHasPassword(send) && !checkSendPassword(send, provided)) {
      console.warn("[send-access] password required/invalid");
      return c.json(
        {
          error: "invalid_grant",
          send_access_error_type: provided ? "password_hash_b64_invalid" : "password_hash_b64_required"
        },
        400
      );
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
  const hintFields = hasHintField(p) ? hintFieldsFrom(readHint(p)) : null;
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
  if (!await checkMasterPassword(c, user, mph)) {
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
async function checkMasterPassword(c, user, providedHash) {
  const envAcc = user?.email ? findEnvAccount(c.env, user.email) : null;
  if (envAcc) {
    const { kdfIterations } = envAccountKdf(c.env);
    return verifyEnvAccount(envAcc, providedHash, kdfIterations);
  }
  if (!user?.masterPasswordHash) return false;
  return verifyPassword(user.masterPasswordHash, user.passwordSalt, user.passwordIterations, providedHash);
}
async function checkPassword(c, user, p) {
  const mph = String(p.masterPasswordHash ?? "");
  if (!mph) return { error: "Missing master password hash", status: 400 };
  if (!await checkMasterPassword(c, user, mph)) {
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
  const check = await checkPassword(c, a.user, p);
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
  const check = await checkPassword(c, a.user, p);
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
  const check = await checkPassword(c, a.user, p);
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
  const check = await checkPassword(c, a.user, p);
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
  const check = await checkPassword(c, a.user, p);
  if (check.error) return c.json({ error: check.error }, check.status);
  return c.json({ code: a.user.totpRecover ?? null, object: "twoFactorRecover" });
});
app.post("/api/accounts/password", async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);
  const check = await checkPassword(c, a.user, p);
  if (check.error) return c.json({ error: check.error }, check.status);
  const newMph = String(p.newMasterPasswordHash ?? "");
  if (!newMph) return c.json({ error: "Missing newMasterPasswordHash" }, 400);
  const store = getStore2(c.env);
  const salt = randomB64();
  const iterations = Number(envGet(c, "PASSWORD_ITERATIONS", 6e5));
  const stamp = newId();
  const hintFields = hasHintField(p) ? hintFieldsFrom(readHint(p)) : null;
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
  const check = await checkPassword(c, a.user, p);
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
  const check = await checkPassword(c, a.user, p);
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
async function uploadAttachmentBytes(c) {
  const platformMax = Number(envGet(c, "UPLOAD_MAX_BYTES", 6 * 1024 * 1024)) || 0;
  const declared = Number(c.req.header("content-length") || 0);
  if (platformMax && declared > platformMax) {
    return c.json(
      { error: `Attachment too large: up to ${(platformMax / 1024 / 1024).toFixed(1)} MB (platform request body limit)`, limit: platformMax },
      413
    );
  }
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const store = getStore2(c.env);
  const { id: cipherId, aid } = c.req.param();
  const meta = (await store.get(keys.attachmentMeta(a.claims.sub, aid)))?.value;
  if (!meta || meta.cipherId !== cipherId) return c.json({ error: "not found" }, 404);
  const up = await readUpload(c);
  if (up.error) return c.json({ error: up.error }, 400);
  const bytes = up.bytes;
  if (platformMax && bytes.length > platformMax) return c.json({ error: "Attachment too large", limit: platformMax }, 413);
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
  return pbkdf2Sync3(String(value), Buffer.from(saltB64, "base64url"), iterations, 32, "sha256").toString(
    "base64url"
  );
}
function sendPasswordHash(password) {
  if (!password) return { passwordHash: null, passwordSalt: null, passwordIter: null };
  const salt = randomBytes2(16).toString("base64url");
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
  return a.length === b.length && timingSafeEqual4(a, b);
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
  } catch (e) {
    console.warn("[send-access] token rejected", e?.code || e?.message || e, "hasToken=" + Boolean(token));
    return c.json({ error: "invalid access token" }, 401);
  }
  if (!Array.isArray(payload.scope) || !payload.scope.includes("api.send.access") || payload.sid == null) {
    console.warn("[send-access] token scope/sid wrong", JSON.stringify({ scope: payload.scope, sid: payload.sid }));
    return c.json({ error: "invalid access token" }, 401);
  }
  const store = getStore2(c.env);
  const idx = (await store.get(keys.sendIndex(String(payload.sid))))?.value;
  if (!idx) {
    console.warn("[send-access] index miss for sid", String(payload.sid).slice(0, 12) + "\u2026");
    return c.json({ error: "Send is not accessible" }, 404);
  }
  const send = (await store.get(keys.send(idx.userId, idx.id)))?.value;
  if (!send) {
    console.warn("[send-access] send row missing", idx.id);
    return c.json({ error: "Send is not accessible" }, 404);
  }
  const v = validateSendAccess(send);
  if (v.error) {
    console.warn("[send-access] unavailable at read", v.error, JSON.stringify({
      deletionDate: send.deletionDate,
      expirationDate: send.expirationDate ?? null,
      accessCount: send.accessCount ?? 0,
      maxAccessCount: send.maxAccessCount ?? null
    }));
    return c.json({ error: v.error }, v.status);
  }
  return c.json(sendAccessJson(send));
});
app.post("/api/sends/access/file/:fileId", async (c) => {
  const store = getStore2(c.env);
  const p = await body(c);
  const auth = (c.req.header("authorization") || "").match(/^Bearer\s+(.+)$/i);
  const token = p.token ?? (auth ? auth[1] : "");
  let send = null;
  if (token) {
    try {
      const payload = await verifyAccess(c.env, token);
      if (payload?.sid != null) {
        const idx = (await store.get(keys.sendIndex(String(payload.sid))))?.value;
        if (idx) send = (await store.get(keys.send(idx.userId, idx.id)))?.value ?? null;
      }
    } catch (e) {
      console.warn("[send-access] file token rejected", e?.code || e?.message || e);
    }
  }
  if (!send) send = await lookupSendByAccessId(store, c.req.param("fileId"));
  if (!send) return c.json({ error: "Send is not accessible" }, 404);
  const v = validateSendAccess(send);
  if (v.error) return c.json({ error: v.error }, v.status);
  const bytes = await store.getBinary(keys.sendFile(send.userId, send.id));
  if (!bytes) return c.json({ error: "file not found" }, 404);
  const downloadToken = await signAccess(c.env, {
    sub: "send-access",
    sid: accessIdFromUuid(send.id),
    scope: ["api.send.access"]
  });
  const fileId = c.req.param("fileId");
  return c.json({
    id: fileId,
    url: `${baseUrlOf(c)}/api/sends/access/file/${fileId}/data?token=${encodeURIComponent(downloadToken)}`,
    object: "send-file-download-data"
  });
});
app.get("/api/sends/access/file/:fileId/data", async (c) => {
  const token = String(c.req.query("token") ?? "");
  let payload;
  try {
    payload = await verifyAccess(c.env, token);
  } catch (e) {
    console.warn("[send-access] download token rejected", e?.code || e?.message || e);
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
    // 文件 id 直接用 Send 的 id：网页版拼 /sends/access/file/{file.id} 时，
    // 服务端才能通过 accessId 索引反查到这条 Send（之前写死 'file' 会 404）。
    data: { id, fileName, size: String(size), sizeName: displaySize(size) },
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
  const uploadToken = await signAccess(c.env, {
    sub: "send-upload",
    sid: accessIdFromUuid(id),
    scope: ["api.send.upload"]
  });
  return c.json({
    sendResponse: sendToJson(send),
    // 1 = Direct：客户端会把加密后的字节 POST/PUT 到下面的 url（multipart 或裸字节）。
    fileUploadType: 1,
    url: `${baseUrlOf(c)}/api/sends/${id}/file/${id}?token=${encodeURIComponent(uploadToken)}`
  });
});
async function uploadSendFile(c) {
  const store = getStore2(c.env);
  const id = c.req.param("id");
  const maxBytes = Number(envGet(c, "UPLOAD_MAX_BYTES", 6 * 1024 * 1024)) || 0;
  const declared = Number(c.req.header("content-length") || 0);
  if (maxBytes && declared > maxBytes) {
    console.warn("[send-upload] rejected by content-length", declared);
    return c.json(
      {
        error: `File too large: this deployment accepts uploads up to ${(maxBytes / 1024 / 1024).toFixed(1)} MB (platform request body limit)`,
        limit: maxBytes
      },
      413
    );
  }
  const a = await requireAuth(c);
  let userId = a.error ? null : a.claims.sub;
  if (!userId) {
    const signed = String(c.req.query("token") ?? "");
    if (signed) {
      try {
        const payload = await verifyAccess(c.env, signed);
        const expectSid = accessIdFromUuid(id);
        if (Array.isArray(payload.scope) && payload.scope.includes("api.send.upload") && String(payload.sid) === expectSid) {
          const idx = (await store.get(keys.sendIndex(expectSid)))?.value;
          if (idx) userId = idx.userId;
        }
      } catch {
      }
    }
  }
  if (!userId) return a.error;
  const send = (await store.get(keys.send(userId, id)))?.value;
  if (!send || Number(send.type) !== SEND_FILE) return c.json({ error: "not found" }, 404);
  let up;
  try {
    up = await readUpload(c);
  } catch (e) {
    const existing = await store.getBinary(keys.sendFile(userId, id)).catch(() => null);
    if (existing) return c.json(sendToJson(send), 200);
    console.error("[send-upload] read body failed", e?.message || e);
    return c.json({ error: "failed to read upload body" }, 400);
  }
  if (up.error) {
    const existing = await store.getBinary(keys.sendFile(userId, id)).catch(() => null);
    if (existing) return c.json(sendToJson(send), 200);
    return c.json({ error: up.error }, 400);
  }
  const bytes = up.bytes;
  if (maxBytes && bytes.length > maxBytes) {
    return c.json({ error: `File too large: ${(maxBytes / 1024 / 1024).toFixed(1)} MB max`, limit: maxBytes }, 413);
  }
  try {
    await store.putBinary(keys.sendFile(userId, id), bytes);
  } catch (e) {
    console.error("[send-upload] store failed", bytes.length, e?.message || e);
    return c.json({ error: "failed to store file" }, 500);
  }
  const next = await mutate(
    store,
    keys.send(userId, id),
    (cur) => cur ? {
      ...cur,
      data: { ...cur.data, size: String(bytes.length), sizeName: displaySize(bytes.length) },
      updatedAt: nowIso()
    } : void 0
  );
  if (!next) return c.json({ error: "send disappeared during upload" }, 409);
  try {
    await touchUser(store, userId);
  } catch (e) {
    console.warn("[send-upload] touchUser failed", e?.message || e);
  }
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
  const check = await checkPassword(c, a.user, { masterPasswordHash: p.oldMasterKeyAuthenticationHash });
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
    data: { id, fileName: String(f.fileName ?? "file"), size: String(up.bytes.length), sizeName: displaySize(up.bytes.length) },
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
  const check = await checkPassword(c, a.user, p);
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
var exported = new Hono3();
exported.use("*", cors());
exported.get("/", (c) => c.redirect("/vault/", 302));
exported.get("/index.html", (c) => c.redirect("/vault/", 302));
exported.route("/vault", app);
exported.route("/", app);
var index_default = exported;

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
