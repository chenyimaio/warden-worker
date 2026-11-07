// src/makers.js —— EdgeOne Makers (Node.js Cloud Functions) 入口适配
//
// Makers 的文件路由约定：
//   cloud-functions/api/[[default]].js  ->  /api/*
//   context = { request, env?, params?, ... }，Node 运行时同时有 process.env
// 我们的 Hono app 自己按完整路径路由（/api/...、/identity/...），所以每个目录放一个兜底文件即可。
import app from './index.js';

const handler = async (context) => {
  const request = context?.request ?? context;
  const env = context?.env ?? process.env;
  return app.fetch(request, env, context);
};

// 兼容几种可能的调用形态（函数本身 / 对象方法 / 具名导出）
handler.fetch = handler;
handler.onRequest = handler;

export default handler;
export { handler as onRequest, handler as fetch };
