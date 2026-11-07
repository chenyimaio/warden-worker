// scripts/test-hint-mail.mjs
// 验证「邮件发密文」这条链路：加密 -> 模板不含明文 -> decrypt-hint.mjs 能解开。
// 用法：node scripts/test-hint-mail.mjs
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { encryptHint, decryptHint } from '../src/hint.js';
import { passwordHintTemplate } from '../src/mail.js';

const here = dirname(fileURLToPath(import.meta.url));
let failed = 0;
const check = (name, ok, extra) => {
  if (ok) console.log(`✅ ${name}`);
  else {
    failed += 1;
    console.error(`❌ ${name}`, extra ?? '');
  }
};

const secret = 'test-secret-0123456789abcdef';
const env = { HINT_ENCRYPTION_SECRET: secret };
const plaintext = '老地方 + 生日后两位';

const rec = await encryptHint(env, plaintext);
const recordJson = JSON.stringify(rec);

// 1. 加密/解密往返
check('加密后能解回原文', (await decryptHint(env, rec)) === plaintext);

// 2. sealed 模板：含密文、不含明文
const sealed = passwordHintTemplate({ sealed: recordJson, baseUrl: 'https://vault.example.com' });
check('sealed 邮件包含密文', sealed.text.includes(recordJson.slice(0, 40)));
check('sealed 邮件不含明文', !sealed.text.includes(plaintext) && !sealed.html.includes(plaintext));
check('sealed 邮件说明了怎么解密', sealed.text.includes('decrypt-hint.mjs'));

// 3. plain 模板：含明文
const plain = passwordHintTemplate({ hint: plaintext, baseUrl: 'https://vault.example.com' });
check('plain 邮件包含明文', plain.text.includes(plaintext));

// 4. CLI 能解开
const out = execFileSync(
  process.execPath,
  [join(here, 'decrypt-hint.mjs'), '--secret', secret, '--record', recordJson],
  { encoding: 'utf8' },
).trim();
check('decrypt-hint.mjs 输出原文', out === plaintext, out);

// 5. 错误密钥必须失败
let failedExit = 0;
try {
  execFileSync(
    process.execPath,
    [join(here, 'decrypt-hint.mjs'), '--secret', 'wrong-secret', '--record', recordJson],
    { encoding: 'utf8', stdio: 'pipe' },
  );
} catch (e) {
  failedExit = e.status ?? 1;
}
check('错误密钥时 CLI 非零退出', failedExit !== 0, `exit=${failedExit}`);

console.log(failed === 0 ? '\n全部通过' : `\n${failed} 项失败`);
process.exit(failed === 0 ? 0 : 1);
