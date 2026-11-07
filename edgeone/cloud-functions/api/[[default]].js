// cloud-functions/api/[[default]].js -> /api/*
// Makers 文件路由：该目录下所有未命中的 /api/* 请求都进这里，由 Hono 自己分发。
export { default } from '../../src/makers.js';
