// path: server/trpc/index.js
import { router } from './trpc'; // (v4.0) 'publicProcedure' (kullanılmıyor) import'u temizlendi
import { healthRouter } from './routers/health';
import { kasaRouter } from './routers/kasa'; 
import { blogRouter } from './routers/blog'; 
import { leaderboardRouter } from './routers/leaderboard'; 
import { adminRouter } from './routers/admin';
import { analysisRouter } from './routers/analysis';
import { aiRouter } from './routers/ai'; // (v4.0) Gemini AI router'ı
import { marketRouter } from './routers/market'; // (v4.0) Market Pulse router'ı


/**
 * Synara API'sinin kök router'ı. Tüm alt router'ları birleştirir.
 */
export const appRouter = router({
  health: healthRouter,
  admin: adminRouter,
  analysis: analysisRouter,
  blog: blogRouter,
  kasa: kasaRouter,
  leaderboard: leaderboardRouter,
  market: marketRouter,
  ai: aiRouter, // (v4.0)
});

// Tip çıkarımı için gerekli. Client tarafında kullanılacak.
export const createCallerFactory = router.createCallerFactory;

/**
 * Bu tip tanımı, Client tarafında tRPC'yi güvenli bir şekilde kullanmak için hayati önem taşır.
 * @typedef {typeof appRouter} AppRouter
 */

/**
 * @typedef {import('./context').Context} Context
 */

