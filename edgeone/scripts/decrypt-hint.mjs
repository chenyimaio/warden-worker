#!/usr/bin/env node
// scripts/decrypt-hint.mjs
// 解开 HINT_ENCRYPTION_SECRET 加密的主密码提示（Argon2id 派生 + AES-256-GCM）。
//
// 用法一：把邮件里那段 JSON 直接传进来
//   node scripts/decrypt-hint.mjs --secret '<HINT_ENCRYPTION_SECRET>' --record '{"v":1,...}'
//
// 用法二：从标准输入读（适合直接粘贴）
//   node scripts/decrypt-hint.mjs --secret '<HINT_ENCRYPTION_SECRET>' < record.json
//
// 也可以把密钥放进环境变量，避免出现在 shell 历史里：
//   HINT_ENCRYPTION_SECRET='...' node scripts/decrypt-hint.mjs < record.json
import { readFileSync } from 'node:fs';
import { decryptHint } from '../src/hint.js';

const args = process.argv.slice(2);
const argOf = (name) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : null;
};

const secret = argOf('--secret') ?? process.env.HINT_ENCRYPTION_SECRET ?? '';
if (!secret || secret === '*') {
  console.error('缺少密钥：用 --secret <HINT_ENCRYPTION_SECRET> 或设置同名环境变量（不能是 *）。');
  process.exit(2);
}

let raw = argOf('--record');
if (!raw) {
  try {
    raw = readFileSync(0, 'utf8'); // stdin
  } catch {
    raw = '';
  }
}
if (!raw || !raw.trim()) {
  console.error('缺少密文：用 --record <json> 或从标准输入传入。');
  process.exit(2);
}

let rec;
try {
  rec = JSON.parse(raw);
} catch {
  // 兼容「邮件里被换行/缩进破坏」的情况：去掉所有空白再试一次
  try {
    rec = JSON.parse(raw.replace(/\s+/g, ''));
  } catch (e) {
    console.error('密文不是合法 JSON：', e.message);
    process.exit(2);
  }
}

const plaintext = await decryptHint({ HINT_ENCRYPTION_SECRET: secret }, rec);
if (plaintext == null) {
  console.error('解密失败：密钥不对，或这段密文来自另一套配置。');
  process.exit(1);
}
console.log(plaintext);
