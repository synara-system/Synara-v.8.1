import 'server-only'; // Bu dosyanın sadece sunucuda çalışacağını belirtir.
import { adminDb } from '@/firebase-admin';
import { cache } from 'react';
// KRİTİK FİX 1: getAnalysesForSitemap tRPC router'dan buraya taşındı.
import { FieldValue } from 'firebase-admin/firestore'; // FieldValue import edildi.

// KRİTİK YARDIMCI: Firestore Timestamp/Date objesini ISO string'e çevirir.
const serializeTimestamp = (timestamp) => {
    if (!timestamp) return null;
    if (typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toISOString();
    }
    if (timestamp instanceof Date) {
        return timestamp.toISOString();
    }
    return timestamp; // Zaten string veya serileştirilebilir bir değer ise.
};

/**
 * Tüm blog yazılarını Firestore'dan çeker.
 */
export const getPosts = cache(async () => {
    if (!adminDb) {
        console.error("Firebase Admin SDK başlatılamadı. Veri çekilemiyor.");
        return [];
    }
    
    // v1.0.1 - SEO REFACTOR (STABILITY):
    // Firestore'da 'createdAt' için manuel bir index (dizin) oluşturulmadıysa 
    // .orderBy() sorgusu başarısız olur. Stabilite için bu sorgu kaldırıldı.
    // Sıralama, gerekirse client'ta (BlogIndexClient) yapılmalıdır.
    const postsSnap = await adminDb.collection('blogPosts').get();
    
    // Firestore verisini serileştir (Tarihleri ISO string'e çevir)
    return postsSnap.docs.map(doc => {
        const data = doc.data();
        return {
            ...data,
            id: doc.id,
            // KRİTİK FİX: Timestamp/Date alanlarını serileştir
            createdAt: serializeTimestamp(data.createdAt),
            updatedAt: serializeTimestamp(data.updatedAt),
        };
    });
});

/**
 * Belirli bir 'slug' değerine göre tek bir blog yazısını ve yorumlarını çeker.
 */
export const getPostBySlug = cache(async (slug) => {
    if (!adminDb) return null;

    const postQuery = adminDb.collection('blogPosts').where('slug', '==', slug).limit(1);
    const postSnap = await postQuery.get();

    if (postSnap.empty) {
        return null; // Yazı bulunamadı
    }

    const postDoc = postSnap.docs[0];
    const postData = postDoc.data();

    // Yorumları çek
    const commentsSnap = await postDoc.ref.collection('comments').orderBy('createdAt', 'desc').get();
    const comments = commentsSnap.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...doc.data(),
            // KRİTİK FİX: Timestamp/Date alanlarını serileştir
            createdAt: serializeTimestamp(data.createdAt),
        };
    });

    return {
        post: {
            ...postData,
            id: postDoc.id,
            // KRİTİK FİX: Timestamp/Date alanlarını serileştir
            createdAt: serializeTimestamp(postData.createdAt),
            updatedAt: serializeTimestamp(postData.updatedAt),
        },
        comments,
    };
});

/**
 * v1.0.1 - SEO REFACTOR
 * Belirli bir 'ID' değerine göre tek bir blog yazısını ve yorumlarını çeker.
 * 301 yönlendirmesi için (eski ID'li linklerden yeni slug'a) gereklidir.
 */
export const getPostById = cache(async (postId) => {
    if (!adminDb) return null;

    const postRef = adminDb.doc(`blogPosts/${postId}`);
    const postSnap = await postRef.get();

    if (!postSnap.exists) {
        return null; // Yazı bulunamadı
    }

    const postData = postSnap.data();

    // Yorumları çek
    const commentsSnap = await postRef.collection('comments').orderBy('createdAt', 'desc').get();
    const comments = commentsSnap.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            createdAt: serializeTimestamp(data.createdAt),
        };
    });

    return {
        post: {
            ...postData,
            id: postSnap.id,
            createdAt: serializeTimestamp(postData.createdAt),
            updatedAt: serializeTimestamp(postData.updatedAt),
        },
        comments,
    };
});


/**
 * v1.0.1 - SEO REFACTOR - ANA VERİ ÇEKME FONKSİYONU
 * Gelen slug'ı analiz eder.
 * 1. Yeni, temiz slug ise: Yazıyı 'slug' ile arar.
 * 2. Eski, ID'li slug ise: Yazıyı 'ID' ile arar ve 301 yönlendirme objesi döndürür.
 * 3. Bulunamazsa: null döndürür (404).
 */
export const getPostData = cache(async (slug) => {
    if (!adminDb) {
        console.error("Firebase Admin SDK başlatılamadı.");
        return null;
    }

    // --- Senaryo 1: Gelen 'slug' temiz ve veritabanında var mı? (Yeni format) ---
    // (Örn: /blog/borsa-yatirim-fonu-nedir)
    try {
        const dataBySlug = await getPostBySlug(slug);
        if (dataBySlug) {
            // Başarılı: Temiz URL, veri bulundu.
            return { ...dataBySlug, redirect: null };
        }
    } catch (error) {
        console.error(`[getPostData Senaryo 1 Hata] Slug (${slug}) aranırken hata:`, error.message);
        // Hata durumunda Senaryo 2'ye devam et
    }


    // --- Senaryo 2: Temiz slug bulunamadı. Acaba eski format mı? ---
    // (Örn: /blog/borsa-yatirim-fonu-nedir-1762178219030)
    
    // Regex: (herhangi-bir-metin)- (en-az-10-rakam)
    const oldSlugRegex = /(.*)-(\d{10,})$/;
    const match = slug.match(oldSlugRegex);

    if (match && match[2]) {
        const postId = match[2]; // ID'yi yakala

        try {
            // ID'ye göre yazıyı bulmayı dene
            const dataById = await getPostById(postId);
            
            if (dataById && dataById.post.slug) {
                // Başarılı: Eski URL ile geldi, ID'den postu bulduk.
                // Postun yeni (temiz) slug'ına kalıcı (301) yönlendir.
                const newSlug = dataById.post.slug;
                
                // Güvenlik kontrolü: Eğer yeni slug, bu eski slug ile *aynıysa* (imkansız ama kontrol) yönlendirme.
                if (newSlug === slug) {
                    return { ...dataById, redirect: null };
                }

                // Yönlendirme objesi döndür
                return {
                    post: null,
                    comments: null,
                    redirect: {
                        destination: `/blog/${newSlug}`,
                        permanent: true, // 301 Kalıcı Yönlendirme
                    },
                };
            }
        } catch (error) {
             console.error(`[getPostData Senaryo 2 Hata] ID (${postId}) aranırken hata:`, error.message);
             // Hata durumunda Senaryo 3'e (404) devam et
        }
    }

    // --- Senaryo 3: Ne temiz slug'a ne de eski ID'li slug'a uymadı. ---
    return null; // 404 Not Found
});


/**
 * Statik sayfa üretimi (SSG) için tüm blog 'slug'larını çeker.
 */
export const getAllPostSlugs = cache(async () => {
    if (!adminDb) return [];
    
    const postsSnap = await adminDb.collection('blogPosts').select('slug').get();
    return postsSnap.docs.map(doc => ({
        slug: doc.data().slug,
    }));
});

// KRİTİK EKLENTİ 1: Sitemap için gerekli olan, sadece slug/ID ve tarih içeren post listesini döndürür.
export const getBlogPostsForSitemap = cache(async () => {
    if (!adminDb) return [];
    
    const postsSnap = await adminDb.collection('blogPosts').select('slug', 'createdAt', 'updatedAt').get();
    return postsSnap.docs.map(doc => {
        const data = doc.data();
        return {
            slug: data.slug,
            createdAt: serializeTimestamp(data.createdAt),
            updatedAt: serializeTimestamp(data.updatedAt),
        };
    });
});

// KRİTİK FİX 2: Analizler için sitemap verisi çeken fonksiyonun içeriği buraya taşındı.
export const getAnalysesForSitemap = cache(async () => {
    if (!adminDb) return [];

    const analysesRef = adminDb.collection('analyses');
    const q = analysesRef.select('createdAt', 'updatedAt');
    
    const snapshot = await q.get();

    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            createdAt: serializeTimestamp(data.createdAt),
            // Firestore'da updatedAt yoksa createdAt'ı kullan
            updatedAt: serializeTimestamp(data.updatedAt) || serializeTimestamp(data.createdAt),
        };
    });
});