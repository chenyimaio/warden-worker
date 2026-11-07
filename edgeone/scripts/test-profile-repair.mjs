// 一次性：验证 sanitizeProfile 能修好两种典型损坏
import { sanitizeProfile } from '../scripts/repair-profile.mjs';

let failed = 0;
const check = (n, ok, extra) => {
  if (!ok) failed++;
  console.log(`${ok ? '✅' : '❌'} ${n}${ok ? '' : '  ' + JSON.stringify(extra)}`);
};

const base = {
  id: 'u1',
  email: 'a@b.c',
  name: 'H',
  masterPasswordHash: 'h',
  passwordSalt: 's',
  passwordIterations: 600000,
  key: '2.a|b|c',
  privateKey: '2.d|e|f',
  publicKey: 'p',
  kdfType: 0,
  kdfIterations: 600000,
  securityStamp: 'st',
  createdAt: '2026-11-07T14:02:08.311Z',
  updatedAt: '2026-11-07T14:02:08.311Z',
};

// 1) 提示挂在空键上
let r = sanitizeProfile({ ...base, '': '123' });
check('空键提示被取出', r.profile.masterPasswordHint === '123', r.profile.masterPasswordHint);
check('空键被删除', !('' in r.profile), Object.keys(r.profile));
check('时间合法不动', r.profile.updatedAt === base.updatedAt, r.profile.updatedAt);

// 2) 字段名被敲进时间值里
r = sanitizeProfile({ ...base, masterPasswordHint: '123', updatedAt: '2026-11-07T1masterPasswordHint4:02:08.311Z' });
check('坏时间被重置', /^\d{4}-\d{2}-\d{2}T.*Z$/.test(r.profile.updatedAt) && !r.profile.updatedAt.includes('masterPasswordHint'), r.profile.updatedAt);
check('提示保留', r.profile.masterPasswordHint === '123', r.profile.masterPasswordHint);

// 3) 同时损坏
r = sanitizeProfile({ ...base, '': '123', updatedAt: '2026-11-07T1masterPasswordHint4:02:08.311Z' });
check('同时损坏也能修', r.profile.masterPasswordHint === '123' && !('' in r.profile) && !r.profile.updatedAt.includes('masterPasswordHint'), r.profile);

// 4) --hint 覆盖 / 清空
r = sanitizeProfile({ ...base, masterPasswordHint: 'old' }, { hint: 'new' });
check('--hint 覆盖', r.profile.masterPasswordHint === 'new', r.profile.masterPasswordHint);
r = sanitizeProfile({ ...base, masterPasswordHint: 'old' }, { hint: '' });
check('--hint "" 清空', r.profile.masterPasswordHint === null, r.profile.masterPasswordHint);

// 5) 正常对象不被改动
r = sanitizeProfile({ ...base, masterPasswordHint: 'ok' });
check('正常对象无需变更', r.notes.length === 0 && r.profile.masterPasswordHint === 'ok', r.notes);

// 6) 已加密存储：不动提示，且拒绝 --hint
const enc = { v: 1, kdf: 'argon2id', cipher: 'aes-256-gcm', salt: 's', iv: 'i', tag: 't', ct: 'c' };
r = sanitizeProfile({ ...base, masterPasswordHint: null, masterPasswordHintEnc: enc });
check('加密记录保持原样', JSON.stringify(r.profile.masterPasswordHintEnc) === JSON.stringify(enc) && r.profile.masterPasswordHint == null, r.profile);
r = sanitizeProfile({ ...base, masterPasswordHintEnc: enc }, { hint: 'new' });
check('加密记录 + --hint 被拒绝', r.refused === true, r.notes);
r = sanitizeProfile({ ...base, masterPasswordHintEnc: enc, updatedAt: 'bad' });
check('加密记录下仍能修时间', !r.profile.updatedAt.includes('bad') && r.profile.masterPasswordHintEnc, r.profile.updatedAt);

console.log(failed ? `\n${failed} failed` : '\n全部通过');
process.exit(failed ? 1 : 0);
