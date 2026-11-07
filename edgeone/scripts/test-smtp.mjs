#!/usr/bin/env node
// scripts/test-smtp.mjs
// 部署前自测：云函数能不能真的连上 SMTP。
//   1) TCP 连通性：25 / 465 / 587 / 2525
//   2) 可选：真的发一封（--send）
//
// 用法：
//   SMTP_HOST=smtp.qcloudmail.com node scripts/test-smtp.mjs
//   SMTP_HOST=... SMTP_USER=... SMTP_PASS=... MAIL_FROM=... node scripts/test-smtp.mjs --send
import net from 'node:net';

const host = process.env.SMTP_HOST;
if (!host) {
  console.error('缺少 SMTP_HOST');
  process.exit(2);
}

const ports = (process.env.SMTP_PORTS || '465,587,25,2525').split(',').map(Number);
const timeout = Number(process.env.SMTP_TEST_TIMEOUT || 8000);

function probe(port) {
  return new Promise((resolve) => {
    const started = Date.now();
    const socket = net.connect({ host, port });
    const done = (ok, detail) => {
      socket.destroy();
      resolve({ port, ok, ms: Date.now() - started, detail });
    };
    socket.setTimeout(timeout);
    socket.once('connect', () => done(true, 'tcp ok'));
    socket.once('timeout', () => done(false, 'timeout'));
    socket.once('error', (e) => done(false, e.code || e.message));
  });
}

const results = [];
for (const port of ports) results.push(await probe(port));

for (const r of results) {
  console.log(`${r.ok ? '✅' : '❌'} ${host}:${r.port}  ${r.ms}ms  ${r.detail}`);
}

const usable = results.filter((r) => r.ok);
if (!usable.length) {
  console.error('\n所有端口都不通：云函数出站被拦。退路：换 2525 / 用 SES HTTP API / 自建中转。');
  process.exit(1);
}

if (!process.argv.includes('--send')) {
  console.log('\n只做了 TCP 探测。加 --send 可真实发一封。');
  process.exit(0);
}

const { default: nodemailer } = await import('nodemailer');
const port = Number(process.env.SMTP_PORT || usable[0].port);
const secure = String(process.env.SMTP_SECURE ?? port === 465) === 'true';

const tx = nodemailer.createTransport({
  host,
  port,
  secure,
  auth: process.env.SMTP_USER
    ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    : undefined,
  connectionTimeout: timeout,
  greetingTimeout: timeout,
  socketTimeout: timeout,
  tls: { minVersion: 'TLSv1.2' },
});

const to = process.env.TEST_TO || process.env.MAIL_FROM;
try {
  const info = await tx.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: '[warden-edgeone] SMTP 自测',
    text: `SMTP 自测成功：${host}:${port} secure=${secure}\n时间：${new Date().toISOString()}`,
  });
  console.log('✅ 已投递', { messageId: info.messageId, response: info.response });
} catch (e) {
  console.error('❌ 投递失败', e.code || '', e.message);
  process.exit(1);
}
