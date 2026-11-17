import { defineConfig, loadEnv, type ProxyOptions } from 'vite';
import react from '@vitejs/plugin-react';

const defaultApiTarget = 'https://gsmsv-api.https.gsmsv.site';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  // 로컬 개발·미리보기에서는 /api 요청을 백엔드로 넘긴다.
  // 같은 출처(localhost)로 호출하므로 CORS가 필요 없고, 인증 쿠키도 localhost에 저장된다.
  const apiProxy: Record<string, ProxyOptions> = {
    '/api': {
      target: env.API_PROXY_TARGET || defaultApiTarget,
      changeOrigin: true,
      secure: true,
      cookieDomainRewrite: 'localhost',
    },
  };

  return {
    plugins: [react()],
    // Database 쿼리 콘솔의 SQLite Worker를 ES 모듈로 만든다. sql.js WASM은 이 Worker 청크에서만 불러온다.
    worker: { format: 'es' },
    server: { proxy: apiProxy },
    preview: { proxy: apiProxy },
  };
});
