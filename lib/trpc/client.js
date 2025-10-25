// path: lib/trpc/client.js
import { createTRPCReact } from '@trpc/react-query';

/**
 * @type {import('@trpc/react-query').CreateTRPCReact<import('@/server/trpc').AppRouter>}
 */
export const trpc = createTRPCReact();

