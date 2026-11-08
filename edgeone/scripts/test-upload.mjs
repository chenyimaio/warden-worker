// scripts/test-upload.mjs
// 单测：readUpload 必须能吃下 Bitwarden 客户端（OkHttp）真实发出的 multipart。
// 用法：node scripts/test-upload.mjs
import { readUpload } from '../src/upload.js';

let failed = 0;
const check = (name, cond, extra) => {
  if (cond) {
    console.log(`✅ ${name}`);
  } else {
    failed += 1;
    console.error(`❌ ${name}`, extra ?? '');
  }
};

/** 构造一个最小的 Hono context 替身：只有 c.req.header() 和 c.req.arrayBuffer()。 */
const req = (contentType, bytes) => ({
  req: {
    header: (n) => (String(n).toLowerCase() === 'content-type' ? contentType : undefined),
    arrayBuffer: async () =>
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  },
});

const join = (...parts) => Buffer.concat(parts.map((p) => (Buffer.isBuffer(p) ? p : Buffer.from(p))));

// ---------------------------------------------------------------- 1. OkHttp 风格
// Bitwarden Android/iOS：boundary 自带 "--"，part 名 data，二进制内容。
{
  const boundary = '--BWMobileFormBoundary1762500000000';
  const payload = Buffer.from([0x00, 0xff, 0x0d, 0x0a, 0x2d, 0x2d, 0x80, 0x7f]);
  const body = join(
    `--${boundary}\r\n`,
    'Content-Disposition: form-data; name="data"; filename="2.abc==|def|ghi"\r\n',
    'Content-Type: application/octet-stream\r\n',
    '\r\n',
    payload,
    `\r\n--${boundary}--\r\n`,
  );
  const ct = `multipart/form-data; boundary=${boundary}`;
  const up = await readUpload(req(ct, body));
  check('OkHttp 风格：解析出字节', up.bytes && Buffer.compare(up.bytes, payload) === 0, up);
  check('OkHttp 风格：带回文件名', up.fileName === '2.abc==|def|ghi', up.fileName);
}

// ---------------------------------------------------------------- 2. 普通 boundary + 文本字段
// 附件老接口会同时带 fileName / key 文本字段，字段在文件之前或之后都必须保留。
{
  const boundary = 'XyZ123';
  const payload = Buffer.from('hello-send');
  const body = join(
    `--${boundary}\r\n`,
    'Content-Disposition: form-data; name="fileName"\r\n',
    '\r\n',
    'enc-name.txt\r\n',
    `--${boundary}\r\n`,
    'Content-Disposition: form-data; name="key"\r\n',
    '\r\n',
    '2.enc-key\r\n',
    `--${boundary}\r\n`,
    'Content-Disposition: form-data; name="data"; filename="a.bin"\r\n',
    'Content-Type: application/octet-stream\r\n',
    '\r\n',
    payload,
    `\r\n--${boundary}\r\n`,
    'Content-Disposition: form-data; name="tail"\r\n',
    '\r\n',
    'after-file\r\n',
    `--${boundary}--\r\n`,
  );
  const ct = `multipart/form-data; boundary="${boundary}"`;
  const up = await readUpload(req(ct, body));
  check('普通 boundary：解析出字节', up.bytes && Buffer.compare(up.bytes, payload) === 0, up);
  check('普通 boundary：文件之前的文本字段', up.fields.fileName === 'enc-name.txt', up.fields);
  check('普通 boundary：文件之前的 key 字段', up.fields.key === '2.enc-key', up.fields);
  check('普通 boundary：文件之后的文本字段', up.fields.tail === 'after-file', up.fields);
}

// ---------------------------------------------------------------- 3. 裸字节
{
  const payload = Buffer.from([1, 2, 3, 4, 5]);
  const up = await readUpload(req('application/octet-stream', payload));
  check('裸字节：原样返回', up.bytes && Buffer.compare(up.bytes, payload) === 0, up);
}

// ---------------------------------------------------------------- 4. 没有 file part
{
  const boundary = 'abc';
  const body = join(
    `--${boundary}\r\n`,
    'Content-Disposition: form-data; name="name"\r\n',
    '\r\n',
    'no-file\r\n',
    `--${boundary}--\r\n`,
  );
  const up = await readUpload(req(`multipart/form-data; boundary=${boundary}`, body));
  check('缺少 file part：返回 no file part', up.error === 'no file part', up);
}

// ---------------------------------------------------------------- 4. 请求体被截断
{
  const boundary = 'abc';
  const body = join(`--${boundary}\r\n`, 'Content-Disposition: form-data; name="f"; filename="a.bin"\r\n\r\n', 'x');
  const ctx = {
    req: {
      header: (n) => {
        const k = String(n).toLowerCase();
        if (k === 'content-type') return `multipart/form-data; boundary=${boundary}`;
        if (k === 'content-length') return '9999';
        return undefined;
      },
      arrayBuffer: async () => body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength),
    },
  };
  const up = await readUpload(ctx);
  check('请求体被截断：明确报 truncated', typeof up.error === 'string' && up.error.includes('truncated'), up);
}

// ---------------------------------------------------------------- 5. 声明 multipart 但无 boundary
{
  const body = Buffer.from('just-raw-bytes-no-delimiter');
  const up = await readUpload(req('multipart/form-data; boundary=zzz', body));
  check('声明 multipart 但无分隔符：按裸字节处理', up.bytes?.equals(body), up);
}

// ---------------------------------------------------------------- 6. 最后一个 part 缺结尾分隔符
{
  const boundary = 'abc';
  const body = join(
    `--${boundary}\r\n`,
    'Content-Disposition: form-data; name="f"; filename="a.bin"\r\n\r\n',
    'TAILDATA',
  );
  const up = await readUpload(req(`multipart/form-data; boundary=${boundary}`, body));
  check('缺结尾分隔符：仍能取出文件', up.bytes?.toString() === 'TAILDATA', up);
}
console.log(failed === 0 ? '\n全部通过' : `\n${failed} 项失败`);
process.exit(failed === 0 ? 0 : 1);
