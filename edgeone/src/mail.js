// src/mail.js
// 项目内直连 SMTP（nodemailer），不依赖第三方 HTTP 邮件 API。
// 运行前提：必须跑在 Cloud Functions（Node.js）里 —— Edge Functions 没有 TCP。
//
// 全部可选：没配 SMTP_HOST 或 MAIL_FROM 就静默跳过（只打一行日志），不影响任何接口。
import nodemailer from 'nodemailer';

const cache = new Map();

function cfg(env, name, dflt) {
  return env?.[name] ?? process.env?.[name] ?? dflt;
}

/** 配了 SMTP_HOST + MAIL_FROM 才算可用 */
export function mailConfigured(env) {
  return Boolean(cfg(env, 'SMTP_HOST')) && Boolean(cfg(env, 'MAIL_FROM'));
}

function transport(env) {
  const host = cfg(env, 'SMTP_HOST');
  const port = Number(cfg(env, 'SMTP_PORT', 465));
  const secure = String(cfg(env, 'SMTP_SECURE', port === 465)).toLowerCase() === 'true';
  const id = `${host}:${port}:${secure}:${cfg(env, 'SMTP_USER', '')}`;
  if (!cache.has(id)) {
    cache.set(
      id,
      nodemailer.createTransport({
        host,
        port,
        secure,
        auth: cfg(env, 'SMTP_USER')
          ? { user: cfg(env, 'SMTP_USER'), pass: cfg(env, 'SMTP_PASS') }
          : undefined,
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 20_000,
        pool: true,
        maxConnections: 1,
        // 587/25 这类非隐式 TLS 端口必须升级到 STARTTLS，不允许明文投递
        requireTLS: !secure,
        tls: { minVersion: 'TLSv1.2' },
      }),
    );
  }
  return cache.get(id);
}

// 日志里不带完整收件人地址（PII），只留首字母和域名，便于排查又不过度暴露
const maskEmail = (addr) => {
  const s = String(addr ?? '');
  const at = s.indexOf('@');
  if (at <= 0) return s ? '***' : '';
  return `${s.slice(0, 1)}***${s.slice(at)}`;
};
const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export function passwordHintTemplate({ hint, baseUrl }) {
  const safeHint = String(hint).slice(0, 1000);
  const subject = 'Vaultwarden主密码提示';

  const text = [
    '你好，',
    '',
    '这是你的密码库主密码提示：',
    '',
    `    ${safeHint}`,
    '',
    '如果你没有请求过该提示，请忽略这封邮件。',
    '',
    '— Vaultwarden',
  ].join('\n');

  const html = `<div style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1f2328">
<p>你好，</p>
<p>这是你的密码库主密码提示：</p>
<pre style="white-space:pre-wrap;background:#f6f8fa;border-radius:6px;padding:12px;font-size:14px">${escapeHtml(safeHint)}</pre>
<p style="color:#57606a">如果你没有请求过该提示，请忽略这封邮件。</p>
<p style="color:#57606a;font-size:13px">— Vaultwarden</p>
</div>`;

  return { subject, text, html };
}

/** 通用发送；未配置时静默跳过，dry-run 时只打日志 */
export async function sendMail(env, { to, subject, text, html }) {
  if (!mailConfigured(env)) {
    console.warn('[mail] not configured (SMTP_HOST / MAIL_FROM missing), skipped:', subject, '->', to);
    return { skipped: true };
  }
  if (String(cfg(env, 'MAIL_DRY_RUN', 'false')).toLowerCase() === 'true') {
    console.log('[mail][dry-run]', { to, subject, textLen: text.length });
    return { dryRun: true };
  }

  const fromName = cfg(env, 'MAIL_FROM_NAME', 'Vaultwarden');
  const from = cfg(env, 'MAIL_FROM');
  const info = await transport(env).sendMail({
    from: `"${fromName}" <${from}>`,
    to,
    subject,
    text,
    html,
  });
  // 保留服务商返回码：SES 的拒信原因只能从这里看到
  console.log('[mail] sent', { to: maskEmail(to), messageId: info.messageId, response: info.response });
  return { messageId: info.messageId, response: info.response };
}

export async function sendPasswordHint(env, { to, hint, baseUrl }) {
  const { subject, text, html } = passwordHintTemplate({ hint, baseUrl });
  return sendMail(env, { to, subject, text, html });
}
