// src/dev.js —— 本地跑起来做联调（不依赖 EdgeOne）
import { serve } from '@hono/node-server';
import app from './index.js';

const port = Number(process.env.PORT || 8787);
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`warden-edgeone dev server: http://127.0.0.1:${info.port}`);
  console.log('STORE_DRIVER=memory（重启即丢数据），发信默认 dry-run');
});
