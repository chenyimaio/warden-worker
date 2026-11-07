// scripts/test-hint-rotate.mjs
// 验证换密钥工具：体检、轮换、幂等、以及明文/无提示账号不受影响。
// 用法：node scripts/test-hint-rotate.mjs
import { getStore, keys } from '../src/store.js';
import { encryptHint, decryptHint } from '../src/hint.js';
import { rotateHints, checkHints } from './rotate-hints.mjs';

let failed = 0;
const check = (name, ok, extra) => {
  if (ok) console.log(`✅ ${name}`);
  else {
    failed += 1;
    console.error(`❌ ${name}`, extra ?? '');
  }
};

const OLD = 'old-secret-0123456789abcdef';
const NEW = 'new-secret-fedcba9876543210';

const store = getStore({ STORE_DRIVER: 'memory' });

// 造三个账号：加密的、明文的、没有提示的
await store.put(keys.profile('u-enc'), {
  id: 'u-enc',
  email: 'enc@example.com',
  masterPasswordHint: null,
  masterPasswordHintEnc: await encryptHint({ HINT_ENCRYPTION_SECRET: OLD }, '加密的提示'),
});
await store.put(keys.profile('u-plain'), {
  id: 'u-plain',
  email: 'plain@example.com',
  masterPasswordHint: '明文提示',
});
await store.put(keys.profile('u-none'), { id: 'u-none', email: 'none@example.com' });

// 1. 体检：正确密钥
let r = await checkHints(store, { secret: OLD });
check('体检：可解密 1 条', r.ok === 1 && r.failed === 0, r);
check('体检：2 条无密文（明文/未设置）', r.plaintext === 2, r);

// 2. 体检：错误密钥
r = await checkHints(store, { secret: 'wrong-secret' });
check('体检：错误密钥报 1 条失败', r.failed === 1, r);

// 3. 轮换
r = await rotateHints(store, { oldSecret: OLD, newSecret: NEW, log: () => {} });
check('轮换：重写 1 条', r.rotated === 1 && r.failed === 0, r);
check('轮换：跳过 2 条无密文', r.skipped === 2, r);

// 4. 轮换后能用新密钥解开、旧密钥解不开
const after = (await store.get(keys.profile('u-enc'))).value;
check('新密钥能解开', (await decryptHint({ HINT_ENCRYPTION_SECRET: NEW }, after.masterPasswordHintEnc)) === '加密的提示');
check('旧密钥解不开', (await decryptHint({ HINT_ENCRYPTION_SECRET: OLD }, after.masterPasswordHintEnc)) === null);
check('明文字段已清空', after.masterPasswordHint === null, after.masterPasswordHint);

// 5. 幂等：再跑一次应全部跳过
r = await rotateHints(store, { oldSecret: OLD, newSecret: NEW, log: () => {} });
check('重复执行：0 重写、0 失败、1 已是新密钥', r.rotated === 0 && r.failed === 0 && r.already === 1, r);

// 6. 明文账号没被动
const plain = (await store.get(keys.profile('u-plain'))).value;
check('明文账号保持原样', plain.masterPasswordHint === '明文提示' && !plain.masterPasswordHintEnc, plain);

console.log(failed === 0 ? '\n全部通过' : `\n${failed} 项失败`);
process.exit(failed === 0 ? 0 : 1);
