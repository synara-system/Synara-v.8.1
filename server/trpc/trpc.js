// path: server/trpc/trpc.js
import { initTRPC, TRPCError } from '@trpc/server';
import { adminAuth, adminDb } from '@/firebase-admin'; 

// 1. tRPC instance'ını oluştur.
const t = initTRPC.context().create();

// 2. Güvenlik katmanı (Middleware) oluştur.

// Sadece oturum açmış kullanıcılar
const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user || !ctx.user.uid) {
    // FİX: Yetkilendirme başarısız olduğunda loglama ekle.
    console.warn(`Yetkilendirme (401) Başarısız: Anonim kullanıcı protected prosedüre erişmeye çalıştı.`);
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
    // KRİTİK KONTROL: dbReady kontrolü burada da yapılmalı
    if (!ctx.dbReady || !ctx.db) {
        console.error(`Yönetici Kontrolü Başarısız: Veritabanı hazır değil (User: ${ctx.user.uid})`);
        throw new TRPCError({ code: 'UNAVAILABLE', message: 'Sunucu yetkilendirme/veritabanı servisi kullanılamıyor.' });
    }

    const isUserAdminFromToken = ctx.user.admin === true;

    // Firestore'dan da kontrol et
    // KRİTİK FİX: try/catch bloğu ile Firestore bağlantı hatalarını yakala
    let isUserAdminFromFirestore = false;
    try {
        const userDoc = await ctx.db.doc(`users/${ctx.user.uid}`).get();
        isUserAdminFromFirestore = userDoc.exists && userDoc.data()?.isAdmin === true;
    } catch (dbError) {
         console.error(`Yönetici Kontrolü (Firestore) Hatası: ${dbError.message} (User: ${ctx.user.uid})`);
         throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Yönetici yetkisi kontrol edilirken veritabanı hatası.' });
    }


    // İki kaynaktan herhangi biri admin diyorsa, yetki verilir.
    if (!isUserAdminFromToken && !isUserAdminFromFirestore) {
        // FİX: Yönetici yetkisi başarısız olduğunda loglama ekle.
        console.warn(`Yetkilendirme (403) Başarısız: Yönetici olmayan kullanıcı admin prosedüre erişmeye çalıştı (User: ${ctx.user.uid})`);
        throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Bu işlemi yapmak için yönetici yetkisine sahip olmalısınız.',
        });
    }
    
    return next({ ctx });
});


// 3. Router ve Prosedür yardımcılarını export et.
export const router = t.router;
export const publicProcedure = t.procedure; // Herkes erişebilir
export const protectedProcedure = t.procedure.use(isAuthed); // Sadece oturum açmış kullanıcılar
export const adminProcedure = t.procedure.use(isAdminMiddleware); // Sadece yöneticiler
