// cloud-functions/notifications/[[default]].js -> /notifications/*
// 这里只会返回 426（无 WebSocket），客户端据此回退轮询。
export { default } from '../../src/makers.js';
