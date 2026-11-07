// cloud-functions/[[default]].js
// 这是「占位文件」：EdgeOne 用它判断本仓库有 Node 后端（server-handler）。
// 部署时 edgeone/scripts/build-makes.mjs 会把真正的后端打包并覆盖本文件，
// 所以仓库里只需要保留这个几十行的占位。
export async function onRequest() {
  return new Response(
    'warden: backend bundle missing. This file should be replaced by the deploy build (edgeone/scripts/build-makes.mjs).',
    { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' } },
  );
}

export default onRequest;
