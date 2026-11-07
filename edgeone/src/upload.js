// src/upload.js
// 二进制上传解析（附件 + 文件 Send 共用）。
//
// 为什么不用 c.req.parseBody()：
//   Bitwarden Android/iOS 用 OkHttp 上传，boundary 写成
//   "--BWMobileFormBoundary<ts>"（自带两个连字符），并且是 application/octet-stream
//   的二进制 part。部分运行时（EdgeOne Makers 的 Node 适配层）对
//   request.formData() 的支持不完整，parseBody() 拿不到 File，
//   于是文件 Send 上传恒返回 400 {"error":"no file part"}。
//
// 这里直接从原始字节里切 multipart，不依赖运行时的 FormData 实现。

const CR = 0x0d;
const LF = 0x0a;
const DASH = 0x2d;

/**
 * 读取上传内容。
 * @returns {{bytes: Buffer, fields: Record<string, string>, fileName?: string}
 *           | {error: string}}
 */
export async function readUpload(c) {
  const ct = c.req.header('content-type') || '';
  const raw = Buffer.from(await c.req.arrayBuffer());

  const m = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(ct);
  if (!ct.toLowerCase().includes('multipart/form-data') || !m) {
    // 裸字节（octet-stream / Azure 风格 PUT）
    return { bytes: raw, fields: {} };
  }

  const boundary = (m[1] ?? m[2]).trim();
  // OkHttp 的 boundary 自带 "--"，拼出来的分隔符是 "----BWMobileFormBoundary…"，
  // 与它写进 body 的完全一致；普通客户端 boundary 不带 "--"，同样成立。
  const delim = Buffer.from(`--${boundary}`);

  const fields = {};
  let pos = raw.indexOf(delim);
  let fileBytes = null;
  let fileName = null;

  while (pos !== -1) {
    let start = pos + delim.length;
    // 结束标记：--boundary--
    if (raw[start] === DASH && raw[start + 1] === DASH) break;
    if (raw[start] === CR && raw[start + 1] === LF) start += 2;

    const headEnd = raw.indexOf('\r\n\r\n', start);
    if (headEnd === -1) break;
    const headers = raw.subarray(start, headEnd).toString('utf8');

    const bodyStart = headEnd + 4;
    const next = raw.indexOf(delim, bodyStart);
    if (next === -1) break;

    let bodyEnd = next;
    if (bodyEnd - 2 >= bodyStart && raw[bodyEnd - 2] === CR && raw[bodyEnd - 1] === LF) {
      bodyEnd -= 2;
    }
    const bytes = raw.subarray(bodyStart, bodyEnd);

    const name = /name="([^"]*)"/i.exec(headers)?.[1];
    const filename = /filename="([^"]*)"/i.exec(headers)?.[1];

    if (filename !== undefined) {
      if (fileBytes === null) {
        // 复制一份：subarray 是视图，存储层若直接读 .buffer 会拿到整个请求体。
        fileBytes = Buffer.from(bytes);
        fileName = filename;
      }
    } else if (name) {
      fields[name] = bytes.toString('utf8');
    }

    pos = next;
  }

  if (fileBytes === null) {
    // 留一条可检索的日志：下次再遇到 400，直接看 Functions 日志里的这一行。
    console.warn(
      '[upload] no file part',
      JSON.stringify({
        contentType: ct,
        length: raw.length,
        head: raw.subarray(0, 64).toString('latin1'),
      }),
    );
    return { error: 'no file part' };
  }
  return { bytes: fileBytes, fields, fileName };
}
