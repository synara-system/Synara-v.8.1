// path: app/api/trpc/[trpc]/route.js
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/server/trpc';
import { createContext } from '@/server/trpc/context';

/**
 * tRPC API isteklerini işleyen Next.js App Router rotası.
 * Tüm GET ve POST istekleri bu handler üzerinden geçer.
 */
const handler = (req) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: ({ req }) => createContext({ req }),
    onError:
      process.env.NODE_ENV === "development"
        ? ({ path, error }) => {
            console.error(
              `❌ tRPC hatası - Path: '${path}', Hata: ${error.message}`
            );
          }
        : undefined,
  });

export { handler as GET, handler as POST };

// KRİTİK GÜNCELLEME 1: TRPC rotasının her zaman dinamik çalışmasını sağlar (Caching'i engeller).
export const dynamic = 'force-dynamic';

// KRİTİK GÜNCELLEME 2: Firebase Admin SDK'nın çalışması için çalışma zamanını Node.js'e zorlar.
export const runtime = 'nodejs';
