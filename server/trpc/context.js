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
      console.error('KRİTİK HATA: Sunucu AdminAuth başlatılamadı. Ortam değişkenlerini kontrol edin.');
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
        // 4. KRİTİK HATA YÖNETİMİ: Token doğrulama hatalarını yakala ve logla.
        if (error.code === 'auth/id-token-expired') {
             console.log('Yetkilendirme Başarısız (401): ID Token süresi dolmuş.');
             throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Oturum süreniz dolmuştur, lütfen tekrar giriş yapın.' });
        }
        if (error.code === 'auth/argument-error' || error.code === 'auth/invalid-id-token') {
             console.log(`Yetkilendirme Başarısız (401): Geçersiz ID Token. Hata Kodu: ${error.code}`);
             // Bu, token'ın kötü niyetli/geçersiz olduğu anlamına gelir, 401 fırlatılır.
             throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Geçersiz kimlik bilgisi.' });
        }
        
        // Beklenmedik diğer tüm Firebase hataları
        console.error('BEKLENMEDİK Firebase Auth Hatası:', error.message, error.code);
        // İstemciye generic bir 401 hatası gönderilir.
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Kimlik doğrulama sırasında bilinmeyen bir hata oluştu.' });
      }
    }
  }
    
  // Token başlığı yoksa, null döndürülür (anonim kullanıcı).
  return null;
}

/**
 * Her tRPC isteği için bir 'context' (bağlam) oluşturur.
 * Bu context, kullanıcı bilgisi ve veritabanı erişimi gibi bilgileri içerir
 * ve tüm tRPC prosedürlerine (prosedürlere) aktarılır.
 * @param {{ req: Request }} opts - Next.js'ten gelen istek objesi.
 * @returns {Promise<{ user: import('firebase-admin/auth').DecodedIdToken | null, db: admin.firestore.Firestore | null, dbReady: boolean }>}\
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
      console.error('GENEL tRPC Context Hatası:', error);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Kullanıcı doğrulanırken beklenmedik bir hata oluştu.' });
  }
    
  // Admin SDK hazır değilse, geliştirme konsoluna kritik bir hata yazdır.
  if (!dbIsReady) {
       console.error('KRİTİK tRPC HATA: Firebase Admin SDK hazır değil. Veritabanı ve Auth erişilemez.');
  }
    
  // NOT: Auth hataları `try/catch` içinde yakalanıp TRPCError olarak fırlatıldığı için,
  // bu noktada hatalı user objesi yerine `null` veya geçerli bir user objesi olmalıdır.
  return {
    user,
    db: adminDb,
    dbReady: dbIsReady,
  };
}
