// path: server/trpc/context.js
import { adminAuth, adminDb } from '@/firebase-admin';
import { TRPCError } from '@trpc/server';

/**
 * Gelen isteğin 'Authorization' başlığından Firebase ID Token'ını doğrular
 * ve kullanıcı bilgilerini döndürür.
 * @param {Request} req - Gelen fetch isteği objesi.
 * @returns {Promise<import('firebase-admin/auth').DecodedIdToken | null>} Doğrulanmış kullanıcı bilgisi veya null.
 */
async function getUserFromHeader(req) {
  // 1. Admin SDK'nın hazır olup olmadığını kontrol et. Değilse, kritik hata fırlat.
  if (!adminAuth) {
      throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Sunucu yetkilendirme servisi (AdminAuth) başlatılamadı. Ortam değişkenlerini kontrol edin.'
      });
  }
    
  // 2. Authorization başlığını al.
  const authHeader = req.headers.get('authorization');
  if (authHeader) {
    const token = authHeader.split('Bearer ')[1];
    if (token) {
      try {
        // 3. Token'ı doğrula. Başarılı olursa kullanıcı verisini döndür.
        const decodedToken = await adminAuth.verifyIdToken(token);
        return decodedToken;
      } catch (error) {
        // 4. KRİTİK HATA YÖNETİMİ: Token doğrulama başarısız olursa...
        
        // Eğer token'ın süresi dolmuşsa, istemciye özel bir 'UNAUTHORIZED' hatası gönder.
        // Bu, istemcinin kullanıcıyı tekrar giriş yapmaya yönlendirmesini sağlar.
        if (error.code === 'auth/id-token-expired') {
            throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Oturum süresi doldu. Lütfen tekrar giriş yapın.' });
        }
        
        // Diğer token hatalarında (örn: geçersiz token), konsola bir uyarı yazdır
        // ve isteğin anonim olarak devam etmesi için null döndür.
        console.warn(`[tRPC Context] Token doğrulama hatası (Kod: ${error.code}). İstek anonimleştirildi.`);
        return null;
      }
    }
  }
  
  // Başlık veya token yoksa, isteği anonim kabul et.
  return null;
}

/**
 * Her tRPC isteği için bir 'context' (bağlam) oluşturur.
 * Bu context, kullanıcı bilgisi ve veritabanı erişimi gibi bilgileri içerir
 * ve tüm tRPC prosedürlerine (prosedürlere) aktarılır.
 * @param {{ req: Request }} opts - Next.js'ten gelen istek objesi.
 * @returns {Promise<{ user: import('firebase-admin/auth').DecodedIdToken | null, db: admin.firestore.Firestore | null, dbReady: boolean }>}
 */
export async function createContext({ req }) {
  const dbIsReady = !!adminDb && !!adminAuth;
  
  let user = null;
  try {
      // Sadece Admin SDK hazırsa kullanıcıyı doğrulamaya çalış.
      user = dbIsReady ? await getUserFromHeader(req) : null;
  } catch (error) {
      // `getUserFromHeader` içinde fırlatılan TRPCError'ları doğrudan istemciye geri gönder.
      if (error instanceof TRPCError) {
          throw error;
      }
      // Beklenmedik diğer tüm hatalar için genel bir sunucu hatası fırlat.
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Kullanıcı doğrulanırken beklenmedik bir hata oluştu.' });
  }
    
  // Admin SDK hazır değilse, geliştirme konsoluna kritik bir hata yazdır.
  if (!dbIsReady) {
       console.error('KRİTİK tRPC HATASI: Firebase Admin SDK hazır değil. Korumalı rotalar UNAVAILABLE hatası fırlatacak. firebase-admin.js dosyasını ve .env.local değişkenlerini kontrol edin.');
  }

  // Oluşturulan context'i döndür.
  return {
    user, 
    db: adminDb, 
    dbReady: dbIsReady, 
  };
}
