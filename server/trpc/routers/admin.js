// path: server/trpc/routers/admin.js
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { adminAuth } from '@/firebase-admin'; 
import { protectedProcedure, adminProcedure, router } from '@/server/trpc/trpc'; // protectedProcedure eklendi
import { Timestamp, FieldValue } from 'firebase-admin/firestore'; // EKLENDİ

// KRİTİK: Kullanıcı ayarları için maksimum uzunluklar tanımlandı.
const MAX_DISPLAY_NAME_LENGTH = 50;
const MAX_TV_USERNAME_LENGTH = 50;

export const adminRouter = router({
  
  /**
   * TÜM KULLANICILARI LİSTELER (SADECE ADMIN)
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

  // --- YENİ EKLENTİ: KULLANICI AYARLARI PROTOKOLÜ (Protected) ---
  
  /**
   * KULLANICI AYARLARINI ÇEKER (Kullanıcı Adı, TradingView Adı)
   */
  getUserSettings: protectedProcedure
    .query(async ({ ctx }) => {
        if (!ctx.db) throw new TRPCError({ code: 'UNAVAILABLE' });
        
        const { uid } = ctx.user;
        const userDocRef = ctx.db.doc(`users/${uid}`);
        const userSnap = await userDocRef.get();

        if (!userSnap.exists) {
             throw new TRPCError({ code: 'NOT_FOUND', message: 'Kullanıcı kaydı bulunamadı.' });
        }
        
        const userData = userSnap.data();
        
        return {
            displayName: userData.displayName || '',
            tradingViewUsername: userData.tradingViewUsername || '',
            // İleride eklenebilecek dil veya tema tercihleri buraya eklenebilir
        };
    }),

  /**
   * KULLANICI AYARLARINI GÜNCELLER (Kullanıcı Adı, TradingView Adı)
   */
  updateUserSettings: protectedProcedure
    .input(z.object({
        displayName: z.string().min(3, 'Görünen ad en az 3 karakter olmalıdır.').max(MAX_DISPLAY_NAME_LENGTH, `Görünen ad ${MAX_DISPLAY_NAME_LENGTH} karakterden uzun olamaz.`),
        tradingViewUsername: z.string().max(MAX_TV_USERNAME_LENGTH, `TradingView adı ${MAX_TV_USERNAME_LENGTH} karakterden uzun olamaz.`).nullable(),
        // Dil tercihi gibi diğer ayarlar için placeholder
        language: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
        if (!ctx.db) throw new TRPCError({ code: 'UNAVAILABLE' });
        
        const { uid } = ctx.user;
        const userDocRef = ctx.db.doc(`users/${uid}`);
        
        const updateData = {
            displayName: input.displayName.trim(),
            tradingViewUsername: input.tradingViewUsername ? input.tradingViewUsername.trim() : null,
            updatedAt: Timestamp.now(), 
        };

        // Firestore'a kaydetmeden önce displayName ve tradingViewUsername alanlarını da günceller.
        await userDocRef.update(updateData);
        
        // KRİTİK: Firebase Auth'daki display name'i de güncelliyoruz.
        // Bu, frontend'de `user.displayName`'in hemen güncellenmesini sağlar.
        try {
            await adminAuth.updateUser(uid, {
                 displayName: input.displayName.trim(),
            });
        } catch (error) {
             // AdminAuth güncellenemese bile Firestore güncellendiği için hata fırlatmayız, sadece loglarız.
             console.error(`[AdminAuth Update Error] Firestore güncelledi ancak Auth DisplayName hatası: ${error.message}`);
        }

        return { success: true };
    }),

  // --- MEVCUT ADMIN PROSEDÜRLERİ ---

  /**
   * Kullanıcının deneme/abonelik süresini 30 gün uzatır veya kaldırır.
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
