// scripts/test-hint-crypto.mjs
// 当前模型：提示明文存库，HINT_ENCRYPTION_SECRET 只用于「邮件里发密文」。
// 这里测加解密原语、字段读写、以及老数据（masterPasswordHintEnc）的兼容读取。
import { encryptHint, decryptHint, readHintValue, buildHintFields, hintEncryptionEnabled } from '../src/hint.js';

let failed = 0;
const check = (n, ok, extra) => {
  if (!ok) failed += 1;
  console.log(`${ok ? '✅' : '❌'} ${n}${ok ? '' : '  ' + JSON.stringify(extra)}`);
};

const plainEnv = { HINT_ENCRYPTION_SECRET: '*' };
const encEnv = { HINT_ENCRYPTION_SECRET: 'a-very-secret-passphrase' };

check('默认 * = 未启用', hintEncryptionEnabled(plainEnv) === false, hintEncryptionEnabled(plainEnv));
check('未设置也等于未启用', hintEncryptionEnabled({}) === false, hintEncryptionEnabled({}));
check('设置随机串 = 启用', hintEncryptionEnabled(encEnv) === true, hintEncryptionEnabled(encEnv));

// 1) 落库：两种配置都写明文（存储侧视为可信）
let f = await buildHintFields(plainEnv, '123');
check('未配密钥：写明文', f.masterPasswordHint === '123' && f.masterPasswordHintEnc === null, f);
check('未配密钥：读回', (await readHintValue(plainEnv, f)) === '123', f);

f = await buildHintFields(encEnv, '我的提示');
check('配了密钥：仍然写明文', f.masterPasswordHint === '我的提示' && f.masterPasswordHintEnc === null, f);
check('配了密钥：读回', (await readHintValue(encEnv, f)) === '我的提示', f);

// 2) 发信用的加解密原语
const rec = await encryptHint(encEnv, '我的提示');
check('密文记录结构', rec.v === 1 && rec.kdf === 'argon2id' && rec.cipher === 'aes-256-gcm', rec);
check('密文不含明文', !JSON.stringify(rec).includes('我的提示'), JSON.stringify(rec).slice(0, 80));
check('能解回原文', (await decryptHint(encEnv, rec)) === '我的提示');
check('错误密钥解不开', (await decryptHint({ HINT_ENCRYPTION_SECRET: 'wrong' }, rec)) === null);

// 3) 篡改 -> 认证失败 -> null（不抛）
const tampered = { ...rec, ct: Buffer.from('AAAA').toString('base64url') };
check('篡改密文返回 null', (await decryptHint(encEnv, tampered)) === null);

// 4) 空值
f = await buildHintFields(encEnv, '');
check('空提示两个字段都为空', f.masterPasswordHint === null && f.masterPasswordHintEnc === null, f);
check('空提示读回 null', (await readHintValue(encEnv, f)) === null);

// 5) 老数据兼容：库里还留着密文记录时，readHintValue 仍能读出来
const legacy = { masterPasswordHint: null, masterPasswordHintEnc: rec };
check('兼容老密文记录', (await readHintValue(encEnv, legacy)) === '我的提示', null);
check('老密文 + 错密钥 -> null', (await readHintValue({ HINT_ENCRYPTION_SECRET: 'wrong' }, legacy)) === null, null);

// 6) 更老的历史字段名
check('兼容空字符串键', (await readHintValue(encEnv, { '': 'legacy' })) === 'legacy', null);
check('兼容 masterPasswordHintB64', (await readHintValue(encEnv, { masterPasswordHintB64: 'old' })) === 'old', null);

console.log(failed ? `\n${failed} failed` : '\n全部通过');
process.exitCode = failed ? 1 : 0;
