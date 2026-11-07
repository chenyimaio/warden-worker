#!/usr/bin/env node
// scripts/decrypt-hint.mjs —— 一键解开主密码提示（不参与边缘函数打包）
//
// 三种输入方式，随便挑一种：
//   1) 直接粘贴整封邮件 / 只有那段 JSON：
//        node scripts/decrypt-hint.mjs
//      （回车粘贴，Ctrl+D / Ctrl+Z 结束）
//   2) 从文件读：
//        node scripts/decrypt-hint.mjs --file record.json
//   3) 直接给参数：
//        node scripts/decrypt-hint.mjs --record '{"v":1,...}'
//
// 密钥来源（二选一）：
//   --secret '<HINT_ENCRYPTION_SECRET>'   或   环境变量 HINT_ENCRYPTION_SECRET
//
// 会把粘贴内容里第一段「含 "ct" 的 JSON」自动抠出来，所以整封邮件贴进来也能用。
import { readFileSync } from 'node:fs';
import { decryptHint } from '../src/hint.js';

const args = process.argv.slice(2);
const argOf = (name) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : null;
};

const secret = argOf('--secret') ?? process.env.HINT_ENCRYPTION_SECRET ?? '';
if (!secret || secret === '*') {
  console.error('缺少密钥：用 --secret <HINT_ENCRYPTION_SECRET>，或设置同名环境变量（不能是 *）。');
  process.exit(2);
}

const file = argOf('--file');
let raw = argOf('--record');
if (!raw && file) {
  try {
    raw = readFileSync(file, 'utf8');
  } catch (e) {
    console.error(`读不了文件 ${file}: ${e.message}`);
    process.exit(2);
  }
}
if (!raw) {
  try {
    raw = readFileSync(0, 'utf8'); // stdin
  } catch {
    raw = '';
  }
}
if (!raw || !raw.trim()) {
  console.error('没有输入：用 --record、--file，或把内容粘贴到标准输入。');
  process.exit(2);
}

/** 从任意文本里找出第一段「包含 "ct" 的 JSON 对象」。 */
function extractRecord(text) {
  const trimmed = text.trim();
  try {
    const obj = JSON.parse(trimmed);
    if (obj && typeof obj === 'object') return obj;
  } catch {
    /* 继续往下找 */
  }
  let start = -1;
  let depth = 0;
  for (let i = 0; i < trimmed.length; i += 1) {
    const ch = trimmed[i];
    if (ch === '{') {
      if (depth === 0) start = i;
      depth += 1;
    } else if (ch === '}') {
      if (depth === 0) continue;
      depth -= 1;
      if (depth === 0 && start >= 0) {
        const candidate = trimmed.slice(start, i + 1);
        if (candidate.includes('"ct"')) {
          try {
            return JSON.parse(candidate);
          } catch {
            /* 不是合法 JSON，继续找下一段 */
          }
        }
        start = -1;
      }
    }
  }
  return null;
}

const rec = extractRecord(raw);
if (!rec) {
  console.error('没找到可解析的密文记录（需要一段含 "ct" 的 JSON）。');
  process.exit(2);
}

const plaintext = await decryptHint({ HINT_ENCRYPTION_SECRET: secret }, rec);
if (plaintext == null) {
  console.error('解密失败：密钥不对，或这段密文来自另一套配置。');
  process.exit(1);
}
console.log(plaintext);
