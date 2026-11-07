// src/makers.js —— EdgeOne Makers 入口适配（多签名兼容）
//
// 我不知道控制台生成的 Node 云函数模板到底导出哪种签名，所以这里一次导出三种常见形态：
//   1. export default async function (request, env, ctx)   -> 直接调用
//   2. default.fetch(request, env, ctx)                     -> Workers 风格对象
//   3. export const onRequest / fetch                       -> Pages/Makers 具名导出
// 三种都指向同一个 Hono app，不需要改业务代码。
import app from './index.js';

const handler = (request, env, ctx) => app.fetch(request, env, ctx);

// 让「函数本身」也带 fetch 属性：既能被当函数调，也能被当对象用
handler.fetch = handler;
handler.onRequest = handler;
handler.scheduled = async () => new Response('ok');

export default handler;
export { handler as onRequest, handler as fetch };
