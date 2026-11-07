// src/mail.js
// 项目内直连 SMTP（nodemailer），不依赖任何第三方 HTTP 邮件 API。
// 运行前提：必须跑在 Cloud Functions（Node.js）里 —— Edge Functions 没有 TCP。
import nodemailer from 'nodemailer';

const cache = new Map();

function cfg(env, name, dflt) {
  return env?.[name] ?? process.env[name] ?? dflt;
}

export function mailConfigured(env) {
  // 不再看 MAIL_ENABLED：配了 SMTP_HOST + MAIL_FROM 就发，没配就跳过。
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
        // （secure=true 时该选项被忽略，465 走隐式 TLS）
        requireTLS: !secure,
        tls: { minVersion: 'TLSv1.2' },
      }),
    );
  }
  return cache.get(id);
}

const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export function passwordHintTemplate({ hint, sealed, baseUrl }) {
  const base = String(baseUrl || '').replace(/\/+$/, '');
  const isSealed = sealed != null && String(sealed).trim() !== '';
  const body = String(isSealed ? sealed : hint).slice(0, 4000);
  const subject = isSealed
    ? '主密码提示（已加密）/ Encrypted master password hint'
    : '主密码提示 / Your master password hint';

  const intro = isSealed
    ? [
        '这是你的密码库主密码提示，已用服务器的 HINT_ENCRYPTION_SECRET 加密后发送。',
        '',
        '解密方式（在仓库里执行，不需要联网）：',
        "    node edgeone/scripts/decrypt-hint.mjs --secret '<HINT_ENCRYPTION_SECRET>'",
        '然后把下面这段作为 --record 传入（或直接粘贴到标准输入）。',
      ].join('\n')
    : '这是你的密码库主密码提示（master password hint）：';

  const text = [
    '你好，',
    '',
    intro,
    '',
    `    ${body}`,
    '',
    isSealed
      ? '没有 HINT_ENCRYPTION_SECRET 时这段内容无法解开；请把它和密钥分开保存。'
      : '提示只用于帮助你回忆主密码，不会泄露主密码或保险库内容。',
    '如果你没有请求过该提示，请忽略这封邮件，账户不会有任何变化。',
    '',
    base ? `登录：${base}` : '',
    '',
    '— Warden',
  ]
    .filter(Boolean)
    .join('\n');

  const html = `<div style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1f2328">
<p>你好，</p>
<p>${escapeHtml(intro).replace(/\n/g, '<br>')}</p>
<pre style="white-space:pre-wrap;background:#f6f8fa;border-radius:6px;padding:12px;font-size:13px">${escapeHtml(body)}</pre>
<p style="color:#57606a">${isSealed ? '没有 HINT_ENCRYPTION_SECRET 时这段内容无法解开；请把它和密钥分开保存。' : '提示只用于帮助你回忆主密码，不会泄露主密码或保险库内容。'}如果你没有请求过该提示，请忽略这封邮件。</p>
${base ? `<p><a href="${escapeHtml(base)}">${escapeHtml(base)}</a></p>` : ''}
<p style="color:#57606a;font-size:13px">— Warden</p>
</div>`;

  return { subject, text, html };
}

/** 通用发送；dry-run 时只打日志，便于本地联调 */
export async function sendMail(env, { to, subject, text, html }) {
  if (!mailConfigured(env)) {
    console.warn('[mail] not configured, skipped:', subject, '->', to);
    return { skipped: true };
  }
  if (String(cfg(env, 'MAIL_DRY_RUN', 'false')).toLowerCase() === 'true') {
    console.log('[mail][dry-run]', { to, subject, textLen: text.length });
    return { dryRun: true };
  }

  const fromName = cfg(env, 'MAIL_FROM_NAME', 'Warden');
  const from = cfg(env, 'MAIL_FROM');
  const info = await transport(env).sendMail({
    from: `"${fromName}" <${from}>`,
    to,
    subject,
    text,
    html,
  });
  // 保留服务商返回码：SES 的拒信原因只能从这里看到
  console.log('[mail] sent', { to, messageId: info.messageId, response: info.response });
  return { messageId: info.messageId, response: info.response };
}

export async function sendPasswordHint(env, { to, hint, sealed, baseUrl }) {
  const { subject, text, html } = passwordHintTemplate({ hint, sealed, baseUrl });
  return sendMail(env, { to, subject, text, html });
}
