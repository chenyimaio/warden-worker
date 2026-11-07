// 一次性：验证 hint 加密/解密与字段读写
import { encryptHint, decryptHint, readHintValue, buildHintFields, hintEncryptionEnabled } from '../src/hint.js';

let failed = 0;
const check = (n, ok, extra) => {
  if (!ok) failed++;
  console.log(`${ok ? '✅' : '❌'} ${n}${ok ? '' : '  ' + JSON.stringify(extra)}`);
};

const plainEnv = { HINT_ENCRYPTION_SECRET: '*' };
const encEnv = { HINT_ENCRYPTION_SECRET: 'a-very-secret-passphrase' };

check('默认 * = 不加密', hintEncryptionEnabled(plainEnv) === false, hintEncryptionEnabled(plainEnv));
check('未设置也等于 *', hintEncryptionEnabled({}) === false, hintEncryptionEnabled({}));
check('设置随机串 = 加密', hintEncryptionEnabled(encEnv) === true, hintEncryptionEnabled(encEnv));

// 1) 明文模式
let f = await buildHintFields(plainEnv, '123');
check('明文模式写 masterPasswordHint', f.masterPasswordHint === '123' && f.masterPasswordHintEnc === null, f);
check('明文模式读回', (await readHintValue(plainEnv, f)) === '123', f);

// 2) 加密模式
f = await buildHintFields(encEnv, '我的提示');
check('加密模式不写明文', f.masterPasswordHint === null && f.masterPasswordHintEnc, f);
check('密文里不含明文', !JSON.stringify(f).includes('我的提示'), JSON.stringify(f).slice(0, 80));
check('加密模式读回', (await readHintValue(encEnv, f)) === '我的提示', await readHintValue(encEnv, f));

// 3) 换口令解不开
check('错误口令解不开', (await readHintValue({ HINT_ENCRYPTION_SECRET: 'wrong' }, f)) === null, null);

// 4) 篡改密文 -> 认证失败 -> null（不抛）
const tampered = { ...f.masterPasswordHintEnc, ct: Buffer.from('AAAA').toString('base64url') };
check('篡改密文返回 null', (await decryptHint(encEnv, tampered)) === null, null);

// 5) 空值
f = await buildHintFields(encEnv, '');
check('空提示两个字段都为空', f.masterPasswordHint === null && f.masterPasswordHintEnc === null, f);
check('空提示读回 null', (await readHintValue(encEnv, f)) === null, null);

// 6) 历史兼容：空键 / 旧字段名
check('兼容空字符串键', (await readHintValue(encEnv, { '': 'legacy' })) === 'legacy', null);
check('兼容 masterPasswordHintB64', (await readHintValue(encEnv, { masterPasswordHintB64: 'old' })) === 'old', null);

console.log(failed ? `\n${failed} failed` : '\n全部通过');
process.exit(failed ? 1 : 0);
