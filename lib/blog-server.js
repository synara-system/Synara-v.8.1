// path: lib/blog-server.js
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
    const postsSnap = await adminDb.collection('blogPosts').orderBy('createdAt', 'desc').get();
    
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
