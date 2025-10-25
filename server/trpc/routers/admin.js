// path: server/trpc/routers/admin.js
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { adminAuth } from '@/firebase-admin'; 
import { adminProcedure, router } from '@/server/trpc/trpc';
import { Timestamp, FieldValue } from 'firebase-admin/firestore'; // EKLENDİ

export const adminRouter = router({
  
  /**
   * Tüm kullanıcıları listeler.
   */
  getAllUsers: adminProcedure.query(async ({ ctx }) => {
    if (!ctx.db) {
      throw new TRPCError({ code: 'UNAVAILABLE', message: 'Veritabanı bağlantısı kurulamadı.' });
    }
    
    const usersSnapshot = await ctx.db.collection('users').orderBy('createdAt', 'desc').get();

    return usersSnapshot.docs.map(doc => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate().toISOString() || new Date().toISOString();
        const subscriptionEndDate = data.subscriptionEndDate?.toDate ? data.subscriptionEndDate.toDate().toISOString() : null; // EKLENDİ

        return {
            id: doc.id,
            email: data.email || 'tanımsız@email.com',
            displayName: data.displayName || 'Anonim',
            isAdmin: data.isAdmin || false,
            tradingViewUsername: data.tradingViewUsername || '',
            createdAt,
            subscriptionEndDate, // EKLENDİ
        };
    });
  }),
  
  /**
   * KRİTİK EKLENTİ: Kullanıcının deneme/abonelik süresini 30 gün uzatır veya kaldırır.
   * Bu, kullanıcının sisteme erişimini (isApproved) yönetir.
   */
  setSubscriptionTrial: adminProcedure
    .input(z.object({
        userId: z.string(),
        setTrial: z.boolean(), // true ise 30 günlük trial başlat/uzat, false ise subscriptionEndDate'i geçmişe çek.
    }))
    .mutation(async ({ ctx, input }) => {
        if (!ctx.db) throw new TRPCError({ code: 'UNAVAILABLE' });
        
        const userDocRef = ctx.db.doc(`users/${input.userId}`);
        const userSnap = await userDocRef.get();
        if (!userSnap.exists) throw new TRPCError({ code: 'NOT_FOUND', message: 'Kullanıcı bulunamadı.' });

        let updateData = {};
        
        if (input.setTrial) {
            // Mevcut tarihten itibaren 30 gün ekle
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
            updateData = {
                subscriptionEndDate: Timestamp.fromDate(thirtyDaysFromNow),
                subscriptionStatus: 'active',
            };
        } else {
            // Onayı kaldırmak için süreyi geçmiş bir tarihe çek
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            updateData = {
                subscriptionEndDate: Timestamp.fromDate(yesterday),
                subscriptionStatus: 'inactive',
            };
        }
        
        await userDocRef.update(updateData);
        return { success: true };
    }),


  /**
   * Bir kullanıcının admin yetkisini ayarlar veya kaldırır.
   */
  setAdminStatus: adminProcedure
    .input(z.object({
      userId: z.string(),
      isAdmin: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.db || !adminAuth) throw new TRPCError({ code: 'UNAVAILABLE' });
      
      // Admin'in kendini adminlikten çıkarmasını engelle
      if (ctx.user.uid === input.userId && !input.isAdmin) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Kendi yönetici yetkinizi kaldıramazsınız.' });
      }

      const userDocRef = ctx.db.doc(`users/${input.userId}`);
      
      // 1. Firebase Auth Custom Claims'i ayarla
      await adminAuth.setCustomUserClaims(input.userId, { admin: input.isAdmin });

      // 2. Firestore'daki 'isAdmin' alanını da tutarlılık için güncelle
      await userDocRef.update({
        isAdmin: input.isAdmin
      });
      
      return { success: true };
    }),

  /**
   * Bir kullanıcıyı siler.
   */
  deleteUser: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.db || !adminAuth) throw new TRPCError({ code: 'UNAVAILABLE', message: 'Sunucu yetkilendirme/veritabanı servisi kullanılamıyor.' });
      
      if (ctx.user.uid === input.userId) {
         throw new TRPCError({ code: 'BAD_REQUEST', message: 'Kendi hesabınızı sunucu üzerinden silemezsiniz.' });
      }
        
      const userDocRef = ctx.db.doc(`users/${input.userId}`);
      
      // 1. Firestore belgesini sil
      await userDocRef.delete();
      
      // 2. Firebase Auth kaydını sil
      try {
          await adminAuth.deleteUser(input.userId);
      } catch (authError) {
           console.error(`Firebase Auth kullanıcısı silinirken hata oluştu (${input.userId}):`, authError);
      }
      
      return { success: true };
    }),
});
