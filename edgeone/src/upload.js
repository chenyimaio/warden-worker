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
  const declared = Number(c.req.header('content-length') || 0);
  const raw = Buffer.from(await c.req.arrayBuffer());

  // 先判断截断：声明的长度比实际收到的多，说明请求体没完整到函数，
  // 这时任何解析都会失败，直接给出准确原因（而不是含糊的 no file part）。
  if (declared && raw.length < declared) {
    console.warn('[upload] truncated', { declared, received: raw.length, contentType: ct });
    return { error: `upload truncated: received ${raw.length} of ${declared} bytes` };
  }

  const m = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(ct);
  if (!ct.toLowerCase().includes('multipart/form-data') || !m) {
    // 裸字节（octet-stream / Azure 风格 PUT）
    return { bytes: raw, fields: {} };
  }

  const boundary = (m[1] ?? m[2]).trim();
  // OkHttp 的 boundary 自带 "--"，拼出来的分隔符是 "----BWMobileFormBoundary…"，
  // 与它写进 body 的完全一致；普通客户端 boundary 不带 "--"，同样成立。
  const delim = Buffer.from(`--${boundary}`);

  const first = raw.indexOf(delim);
  if (first === -1) {
    // 声明是 multipart，但 body 里没有分隔符：按裸字节处理（有些客户端会这么发）
    console.warn('[upload] multipart declared but no boundary found, treating body as raw bytes', {
      contentType: ct,
      length: raw.length,
    });
    return { bytes: raw, fields: {} };
  }

  const fields = {};
  let pos = first;
  let fileBytes = null;
  let fileName = null;
  let sawClosing = false;

  while (pos !== -1) {
    let start = pos + delim.length;
    // 结束标记：--boundary--
    if (raw[start] === DASH && raw[start + 1] === DASH) {
      sawClosing = true;
      break;
    }
    if (raw[start] === CR && raw[start + 1] === LF) start += 2;

    const headEnd = raw.indexOf('\r\n\r\n', start);
    if (headEnd === -1) break;
    const headers = raw.subarray(start, headEnd).toString('utf8');

    const bodyStart = headEnd + 4;
    const next = raw.indexOf(delim, bodyStart);
    const isLast = next === -1;

    // 最后一个 part 没有结尾分隔符：如果 body 也没被截断，就取到末尾（宽松兼容）
    const bodyEnd = isLast
      ? raw.length
      : raw[next - 2] === CR && raw[next - 1] === LF
        ? next - 2
        : next;

    const bytes = raw.subarray(bodyStart, Math.max(bodyStart, bodyEnd));
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

    if (isLast) break;
    pos = next;
  }

  if (fileBytes === null) {
    // 留一条可检索的日志：下次再遇到 400，直接看 Functions 日志里的这一行。
    console.warn(
      '[upload] no file part',
      JSON.stringify({
        contentType: ct,
        declared,
        length: raw.length,
        boundary,
        sawClosing,
        head: raw.subarray(0, 64).toString('latin1'),
        tail: raw.subarray(Math.max(0, raw.length - 64)).toString('latin1'),
      }),
    );
    return { error: 'no file part' };
  }
  if (!sawClosing && !declared) {
    // 没有结尾分隔符、也没有 Content-Length 可以比对：可能是流式截断
    console.warn('[upload] missing closing boundary', { length: raw.length, boundary });
  }
  return { bytes: fileBytes, fields, fileName };
}
