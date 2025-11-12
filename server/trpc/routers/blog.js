import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { publicProcedure, protectedProcedure, adminProcedure, router } from '@/server/trpc/trpc';

// ... (calculateAverageRating ve calculateHotScore fonksiyonları burada kalmalı) ...

// v1.0.1 - SEO REFACTOR: Benzersiz Slug Kontrol Mekanizması
/**
 * Verilen bir slug'ın veritabanında benzersiz (unique) olmasını sağlar.
 * Eğer slug zaten varsa, sonuna -2, -3... ekleyerek benzersiz bir versiyon bulur.
 * @param {FirebaseFirestore.Firestore} db - Firestore veritabanı örneği
 * @param {string} baseSlug - Kontrol edilecek temel slug
 * @param {string | null} currentPostId - (Sadece güncelleme için) Kontrol dışında tutulacak mevcut yazı ID'si
 * @returns {Promise<string>} Benzersiz slug
 */
const ensureUniqueSlug = async (db, baseSlug, currentPostId = null) => {
    let slug = baseSlug;
    let attempts = 1;
    const MAX_ATTEMPTS = 10; // Sonsuz döngüden kaçınma

    while (attempts <= MAX_ATTEMPTS) {
        // Slug'ı veritabanında ara
        const existingPostQuery = db.collection('blogPosts').where('slug', '==', slug).limit(1);
        const snapshot = await existingPostQuery.get();

        if (snapshot.empty) {
            // Slug boşta, kullanılabilir.
            return slug;
        }

        // Slug dolu. Dolu olan post, güncellediğimiz postun kendisi mi?
        const doc = snapshot.docs[0];
        if (currentPostId && doc.id === currentPostId) {
            // Evet, postun kendisi. Değişiklik yok, mevcut slug'ı kullanabilir.
            return slug;
        }

        // Hayır, slug başka bir posta ait.
        // Yeni bir slug denemesi oluştur (-2, -3...)
        attempts++;
        slug = `${baseSlug}-${attempts}`;
    }

    // 10 denemeden sonra hala bulunamadıysa, son çare olarak timestamp ekle.
    return `${baseSlug}-${Date.now()}`;
};


export const blogRouter = router({
    // KRİTİK DÜZELTME: Prosedür artık bir input objesi beklemiyor.
    // Bu, 'undefined' input hatasını çözer.
    getPosts: publicProcedure
        .query(async ({ ctx }) => {
            if (!ctx.dbReady) throw new TRPCError({ code: 'UNAVAILABLE', message: 'Veritabanı servisi hazır değil.' });
            
            // v1.0.1 - REFACTOR: Performans için .orderBy('createdAt') kaldırıldı.
            // Sıralama client'ta yapılmalı veya gerekliyse index oluşturulmalı.
            // Şimdilik kaldırıyoruz.
            const postsSnap = await ctx.db.collection('blogPosts').get();
            
            return postsSnap.docs.map(doc => {
                const data = doc.data();
                return {
                    ...data,
                    id: doc.id,
                    createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
                    updatedAt: data.updatedAt?.toDate().toISOString() || new Date().toISOString(),
                };
            });
    }),

    // KRİTİK DÜZELTME: Bu prosedür de input objesi olmadan çağrıldığında
    // hata vermemesi için güncellendi.
    getPostById: publicProcedure
        .input(z.object({ postId: z.string() }))
        .query(async ({ ctx, input }) => {
            if (!ctx.dbReady) throw new TRPCError({ code: 'UNAVAILABLE' });
            const postSnap = await ctx.db.doc(`blogPosts/${input.postId}`).get();
            if (!postSnap.exists) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Yazı bulunamadı.' });
            }
            const postData = postSnap.data();
            const commentsSnap = await postSnap.ref.collection('comments').orderBy('createdAt', 'desc').get();
            const comments = commentsSnap.docs.map(doc => {
                const data = doc.data();
                return { 
                    id: doc.id, 
                    ...data,
                    createdAt: data.createdAt?.toDate().toISOString()
                };
            });

            // YENİ: Kullanıcı oturum açmışsa, beğenme durumunu kontrol et
            let hasLiked = false;
            if (ctx.user) {
                const likeDoc = await postSnap.ref.collection('likes').doc(ctx.user.uid).get();
                hasLiked = likeDoc.exists;
            }

            return { 
                post: { 
                    ...postData, 
                    id: postSnap.id,
                    createdAt: postData.createdAt?.toDate().toISOString(),
                    updatedAt: postData.updatedAt?.toDate().toISOString(),
                }, 
                comments,
                hasLiked, // YENİ: Beğeni durumu döndürüldü
            };
    }),

    getPostBySlug: publicProcedure
        .input(z.object({ slug: z.string() }))
        .query(async ({ ctx, input }) => {
            if (!ctx.dbReady) throw new TRPCError({ code: 'UNAVAILABLE' });
            const postQuery = ctx.db.collection('blogPosts').where('slug', '==', input.slug).limit(1);
            const postSnap = await postQuery.get();
            if (postSnap.empty) {
                throw new TRPCError({ code: 'NOT_FOUND' });
            }
            const postDoc = postSnap.docs[0];
            const postData = postDoc.data();
            const commentsSnap = await postDoc.ref.collection('comments').orderBy('createdAt', 'desc').get();
            const comments = commentsSnap.docs.map(doc => {
                const data = doc.data();
                return { id: doc.id, ...data, createdAt: data.createdAt?.toDate().toISOString() };
            });

            // YENİ: Kullanıcı oturum açmışsa, beğenme durumunu kontrol et
            let hasLiked = false;
            if (ctx.user) {
                const likeDoc = await postDoc.ref.collection('likes').doc(ctx.user.uid).get();
                hasLiked = likeDoc.exists;
            }

            return {
                post: {
                    ...postData,
                    id: postDoc.id,
                    createdAt: postData.createdAt?.toDate().toISOString(),
                    updatedAt: postData.updatedAt?.toDate().toISOString(),
                },
                comments,
                hasLiked, // YENİ: Beğeni durumu döndürüldü
            };
    }),

    // KRİTİK EKLENTİ: Görüntülenme sayacını artıran mutasyon (Public)
    recordView: publicProcedure
        .input(z.object({ postId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            if (!ctx.dbReady) throw new TRPCError({ code: 'UNAVAILABLE', message: 'Veritabanı servisi hazır değil.' });
            
            const postRef = ctx.db.doc(`blogPosts/${input.postId}`);
            
            // viewCount alanını 1 artırır. Eğer alan yoksa 1 olarak başlatılır.
            await postRef.update({ 
                viewCount: FieldValue.increment(1),
                updatedAt: Timestamp.now(), // Son güncellemeyi de kaydet
            });
            
            return { success: true };
    }),

    createPost: adminProcedure
        .input(z.object({
            title: z.string().min(5),
            content: z.string(),
            youtubeVideoId: z.string().nullable(),
            bannerImageUrl: z.string().nullable(),
            authorName: z.string(),
            category: z.string(),
            slug: z.string().min(5), // v1.0.1 - SEO REFACTOR: Slug eklendi
            seoTitle: z.string(), // v1.0.1 - AdminBlogForm'dan eklendi
            seoDescription: z.string(), // v1.0.1 - AdminBlogForm'dan eklendi
        }))
        .mutation(async ({ ctx, input }) => {
            if (!ctx.dbReady) throw new TRPCError({ code: 'UNAVAILABLE' });
            
            // v1.0.1 - SEO REFACTOR: Benzersiz slug'ı garanti et
            const uniqueSlug = await ensureUniqueSlug(ctx.db, input.slug, null);
            
            const postData = {
                ...input,
                slug: uniqueSlug, // Benzersiz slug'ı kullan
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
                likes: 0,
                viewCount: 0, // Yeni yazılarda görüntülenmeyi 0 ile başlat
            };
            const postRef = await ctx.db.collection('blogPosts').add(postData);
            
            // v1.0.1 - REFACTOR: Client'a son slug'ı döndür (değişmiş olabilir)
            return { success: true, postId: postRef.id, slug: uniqueSlug }; 
    }),

    updatePost: adminProcedure
        .input(z.object({
            postId: z.string(),
            title: z.string().min(5),
            content: z.string(),
            youtubeVideoId: z.string().nullable(),
            bannerImageUrl: z.string().nullable(),
            authorName: z.string(),
            category: z.string(),
            slug: z.string().min(5), // v1.0.1 - SEO REFACTOR: Slug eklendi
            seoTitle: z.string(), // v1.0.1 - AdminBlogForm'dan eklendi
            seoDescription: z.string(), // v1.0.1 - AdminBlogForm'dan eklendi
        }))
        .mutation(async ({ ctx, input }) => {
            if (!ctx.dbReady) throw new TRPCError({ code: 'UNAVAILABLE' });
            
            const { postId, ...updateData } = input;
            
            // v1.0.1 - SEO REFACTOR: Benzersiz slug'ı garanti et (kendi ID'si hariç)
            const uniqueSlug = await ensureUniqueSlug(ctx.db, input.slug, postId);
            updateData.slug = uniqueSlug; // updateData'daki slug'ı güncelle

            const postRef = ctx.db.doc(`blogPosts/${postId}`);
            await postRef.update({ ...updateData, updatedAt: Timestamp.now() });
            
            // v1.0.1 - REFACTOR: Client'a son slug'ı döndür (değişmiş olabilir)
            return { success: true, postId: postId, slug: uniqueSlug };
    }),

    deletePost: adminProcedure
        .input(z.object({ 
            postId: z.string(),
            slug: z.string(), // Slug'ı client'tan alıyoruz (AdminBlogEditorIndexPage'den)
        }))
        .mutation(async ({ ctx, input }) => {
            if (!ctx.dbReady) throw new TRPCError({ code: 'UNAVAILABLE', message: 'Sunucu servisi hazır değil.' });
            
            const postRef = ctx.db.doc(`blogPosts/${input.postId}`);
            const commentsRef = postRef.collection('comments');
            // YENİ: Likes (Beğeniler) alt koleksiyonunu silme
            const likesRef = postRef.collection('likes');

            // Yorumlar ve Beğeniler toplu olarak siliniyor.
            const [commentsSnapshot, likesSnapshot] = await Promise.all([
                 commentsRef.get(),
                 likesRef.get(),
            ]);

            const batch = ctx.db.batch();

            if (!commentsSnapshot.empty) {
                commentsSnapshot.docs.forEach(doc => {
                    batch.delete(doc.ref);
                });
            }
            if (!likesSnapshot.empty) {
                 likesSnapshot.docs.forEach(doc => {
                    batch.delete(doc.ref);
                });
            }
            await batch.commit();
            
            // Ana yazıyı sil.
            await postRef.delete();
            
            // KRİTİK DÜZELTME: Silinen yazının slug'ını döndür.
            return { success: true, slug: input.slug }; 
    }),

    likePost: protectedProcedure
        .input(z.object({ postId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            if (!ctx.dbReady) throw new TRPCError({ code: 'UNAVAILABLE' });
            const postRef = ctx.db.doc(`blogPosts/${input.postId}`);
            const likeDocRef = postRef.collection('likes').doc(ctx.user.uid);
            
            // KRİTİK GÜVENLİK KONTROLÜ: Kullanıcı daha önce beğenmiş mi?
            const likeSnap = await likeDocRef.get();
            if (likeSnap.exists) {
                throw new TRPCError({ code: 'BAD_REQUEST', message: 'Bu yazıyı zaten beğendiniz. Disiplin protokolü ihlali.' });
            }

            // 1. Likes sayısını 1 artır.
            await postRef.update({ likes: FieldValue.increment(1) });
            
            // 2. Kullanıcının bu postu beğendiğini kaydet (Sınırlama Protokolü)
            await likeDocRef.set({ 
                 likedAt: Timestamp.now(),
                 authorId: ctx.user.uid,
            });

            return { success: true };
    }),

    addComment: protectedProcedure
        .input(z.object({
            postId: z.string(),
            text: z.string().min(3),
        }))
        .mutation(async ({ ctx, input }) => {
            if (!ctx.dbReady) throw new TRPCError({ code: 'UNAVAILABLE' });
            const { uid } = ctx.user;
            const userDoc = await ctx.db.collection('users').doc(uid).get();
            const authorName = userDoc.data()?.displayName || ctx.user.email?.split('@')[0] || 'Anonim';
            const commentRef = ctx.db.collection('blogPosts').doc(input.postId).collection('comments');
            await commentRef.add({
                text: input.text,
                authorId: uid,
                authorName,
                createdAt: Timestamp.now(),
            });
            return { success: true };
    }),

    deleteComment: protectedProcedure
        .input(z.object({ postId: z.string(), commentId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            if (!ctx.dbReady) throw new TRPCError({ code: 'UNAVAILABLE' });
            const { uid } = ctx.user;
            const commentRef = ctx.db.doc(`blogPosts/${input.postId}/comments/${input.commentId}`);
            const commentSnap = await commentRef.get();
            if (!commentSnap.exists) throw new TRPCError({ code: 'NOT_FOUND' });
            const userDoc = await ctx.db.collection('users').doc(uid).get();
            const isAdmin = userDoc.data()?.isAdmin === true;
            if (commentSnap.data()?.authorId !== uid && !isAdmin) {
                throw new TRPCError({ code: 'FORBIDDEN' });
            }
            await commentRef.delete();
            return { success: true };
    }),
});