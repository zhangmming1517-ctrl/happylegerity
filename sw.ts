import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare const self: ServiceWorkerGlobalScope;

// 自动预加载由 vite-plugin-pwa 注入的清单
precacheAndRoute(self.__WB_MANIFEST);

// 清理过期的缓存
cleanupOutdatedCaches();

// 缓存 API 响应 (LLM 调用结果可考虑短期缓存)
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new StaleWhileRevalidate({
    cacheName: 'api-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60, // 5 分钟缓存
      }),
    ],
  })
);

// 缓存外部 CDN 资源（Tailwind、Google Fonts）
registerRoute(
  ({ url }) => url.origin === 'https://cdn.tailwindcss.com' || url.origin === 'https://fonts.googleapis.com',
  new CacheFirst({
    cacheName: 'cdn-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 天
      }),
    ],
  })
);

// 处理导航请求
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new StaleWhileRevalidate({
    cacheName: 'pages-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// 监听消息事件（可用于客户端控制更新等）
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
