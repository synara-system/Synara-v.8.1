// path: server/trpc/trpc.js
import { initTRPC, TRPCError } from '@trpc/server';
import { adminAuth, adminDb } from '@/firebase-admin'; 

// 1. tRPC instance'ını oluştur.
const t = initTRPC.context().create();

// 2. Güvenlik katmanı (Middleware) oluştur.

// Sadece oturum açmış kullanıcılar
const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user || !ctx.user.uid) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Bu işlemi yapmak için oturum açmalısınız.',
    });
  }
  return next({
    ctx: {
      // `user` objesinin artık null olamayacağını TypeScript'e belirtiyoruz.
      user: ctx.user,
    },
  });
});

// Sadece yöneticiler (adminler)
// KRİTİK GÜNCELLEME: Middleware, artık hem Auth claims'i hem de Firestore'u kontrol ediyor.
const isAdminMiddleware = isAuthed.unstable_pipe(async ({ ctx, next }) => {
    const isUserAdminFromToken = ctx.user.admin === true;

    // Firestore'dan da kontrol et
    const userDoc = await ctx.db.doc(`users/${ctx.user.uid}`).get();
    const isUserAdminFromFirestore = userDoc.exists && userDoc.data()?.isAdmin === true;

    // İki kaynaktan herhangi biri admin diyorsa, yetki verilir.
    if (!isUserAdminFromToken && !isUserAdminFromFirestore) {
        throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Bu işlemi yapmak için yönetici yetkisine sahip olmalısınız.',
        });
    }
    
    return next({ ctx });
});


// 3. Router ve Prosedür yardımcılarını export et.
export const router = t.router;
export const publicProcedure = t.procedure; // Herkesin erişebileceği prosedürler için
export const protectedProcedure = t.procedure.use(isAuthed); // Sadece oturum açmış kullanıcıların erişebileceği prosedürler için
export const adminProcedure = t.procedure.use(isAdminMiddleware); // Sadece adminlerin erişebileceği prosedürler için
