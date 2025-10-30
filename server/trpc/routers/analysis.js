// path: server/trpc/routers/analysis.js
import { publicProcedure, protectedProcedure, adminProcedure, router } from "@/server/trpc/trpc";
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';

const calculateAverageRating = (ratings) => {
    if (!ratings || ratings.length === 0) {
        return { average: 0, count: 0 };
    }
    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    const average = sum / ratings.length;
    return {
        average: parseFloat(average.toFixed(2)),
        count: ratings.length
    };
};

const calculateHotScore = (analysis) => {
    const avgRating = analysis.rating?.average || 0;
    const ratingCount = analysis.rating?.count || 0;
    const viewCount = analysis.viewCount || 0;
    // KRİTİK GÜVENLİK: .toDate() metodunun varlığını kontrol et
    const createdAt = analysis.createdAt?.toDate ? analysis.createdAt.toDate() : new Date();
    const daysSinceCreation = (new Date().getTime() - createdAt.getTime()) / (1000 * 3600 * 24);

    const RATING_WEIGHT = 50;
    const COUNT_WEIGHT = 20;
    const VIEW_WEIGHT = 10;
    const RECENCY_DECAY = 1.5;

    const score = (avgRating * RATING_WEIGHT) + 
                  (Math.log10(ratingCount + 1) * COUNT_WEIGHT) + 
                  (Math.log10(viewCount + 1) * VIEW_WEIGHT) -
                  (daysSinceCreation * RECENCY_DECAY);
                  
    return score;
};


export const analysisRouter = router({
    createAnalysis: protectedProcedure
        .input(z.object({
            title: z.string().min(5, "Başlık en az 5 karakter olmalıdır."),
            content: z.string().min(20, "İçerik en az 20 karakter olmalıdır."),
            instrument: z.string().optional().nullable(),
            tradingViewChartUrl: z.string().url("Geçerli bir URL giriniz.").optional().nullable(),
        }))
        .mutation(async ({ ctx, input }) => {
            if (!ctx.dbReady) throw new TRPCError({ code: 'UNAVAILABLE', message: 'Veritabanı servisi hazır değil.' });
            
            const { uid } = ctx.user;
            const userDoc = await ctx.db.collection('users').doc(uid).get();
            const authorName = userDoc.data()?.displayName || ctx.user.email?.split('@')[0] || 'Anonim';

            const slug = input.title.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/[\s_-]+/g, '-') + '-' + Date.now();

            const analysisData = {
                ...input,
                authorId: uid,
                authorName,
                slug,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
                rating: { average: 0, count: 0 },
                viewCount: 0,
                aiCommentary: null,
                aiCommentaryGeneratedAt: null,
            };

            const analysisRef = await ctx.db.collection('analyses').add(analysisData);
            return { success: true, analysisId: analysisRef.id };
        }),

    getAnalyses: publicProcedure
        .query(async ({ ctx }) => {
            if (!ctx.dbReady || !ctx.db) {
                 throw new TRPCError({ code: 'UNAVAILABLE', message: 'Analiz servisi geçici olarak kullanılamıyor. Admin SDK başlatılamadı.' });
            }
            
            const analysesSnap = await ctx.db.collection('analyses').orderBy('createdAt', 'desc').get();
            const analyses = analysesSnap.docs.map(doc => {
                const data = doc.data();
                return {
                    ...data,
                    id: doc.id,
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null,
                    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : null,
                }
            });

            const scoredAnalyses = analyses.map(analysis => ({
                ...analysis,
                score: calculateHotScore(analysis),
            })).sort((a, b) => b.score - a.score);

            return scoredAnalyses;
        }),
    
    getAnalysisById: publicProcedure
        .input(z.object({ analysisId: z.string() }))
        .query(async ({ ctx, input }) => {
            if (!ctx.dbReady) throw new TRPCError({ code: 'UNAVAILABLE', message: 'Veritabanı servisi hazır değil.' });
            
            const analysisDocRef = ctx.db.collection('analyses').doc(input.analysisId);
            const analysisSnap = await analysisDocRef.get();

            if (!analysisSnap.exists) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Analiz bulunamadı.' });
            }

            const analysisData = analysisSnap.data();

            const commentsSnap = await analysisDocRef.collection('comments').orderBy('createdAt', 'desc').get();
            const comments = commentsSnap.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...doc.data(),
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null,
                }
            });
            
            await analysisDocRef.update({ viewCount: FieldValue.increment(1) });
            
            // KRİTİK DÜZELTME: calculateHotScore'a Firestore Timestamp objesi gönderiliyor.
            const score = calculateHotScore(analysisData);

            return {
                analysis: {
                    ...analysisData,
                    id: analysisSnap.id,
                    createdAt: analysisData.createdAt?.toDate ? analysisData.createdAt.toDate().toISOString() : null,
                    updatedAt: analysisData.updatedAt?.toDate ? analysisData.updatedAt.toDate().toISOString() : null,
                    aiCommentaryGeneratedAt: analysisData.aiCommentaryGeneratedAt?.toDate ? analysisData.aiCommentaryGeneratedAt.toDate().toISOString() : null,
                    score,
                },
                comments,
            };
        }),

    rateAnalysis: protectedProcedure
        .input(z.object({
            analysisId: z.string(),
            rating: z.number().min(1).max(5),
        }))
        .mutation(async ({ ctx, input }) => {
            if (!ctx.dbReady) throw new TRPCError({ code: 'UNAVAILABLE', message: 'Veritabanı servisi hazır değil.' });

            const { uid } = ctx.user;
            const analysisDocRef = ctx.db.collection('analyses').doc(input.analysisId);
            const ratingDocRef = analysisDocRef.collection('ratings').doc(uid);
            
            const analysisSnap = await analysisDocRef.get();
            if (!analysisSnap.exists) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Analiz bulunamadı.' });
            }
            if (analysisSnap.data()?.authorId === uid) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Kendi analizinizi oylayamazsınız.' });
            }

            await ratingDocRef.set({ rating: input.rating, createdAt: Timestamp.now() });

            const ratingsSnap = await analysisDocRef.collection('ratings').get();
            const allRatings = ratingsSnap.docs.map(doc => doc.data());
            const newRating = calculateAverageRating(allRatings);

            await analysisDocRef.update({ rating: newRating });

            return { success: true, newRating };
        }),
    
    deleteAnalysis: protectedProcedure
        .input(z.object({ analysisId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            if (!ctx.dbReady) throw new TRPCError({ code: 'UNAVAILABLE', message: 'Veritabanı servisi hazır değil.' });
            
            const { uid } = ctx.user;
            const analysisDocRef = ctx.db.collection('analyses').doc(input.analysisId);
            const analysisSnap = await analysisDocRef.get();

            if (!analysisSnap.exists) throw new TRPCError({ code: 'NOT_FOUND' });
            
            const userDoc = await ctx.db.collection('users').doc(uid).get();
            const isAdmin = userDoc.data()?.isAdmin === true;

            if (analysisSnap.data()?.authorId !== uid && !isAdmin) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Bu analizi silme yetkiniz yok.' });
            }

            await analysisDocRef.delete();
            return { success: true };
        }),

    updateAnalysis: protectedProcedure
        .input(z.object({
            analysisId: z.string(),
            title: z.string().min(5, "Başlık en az 5 karakter olmalıdır."),
            content: z.string().min(20, "İçerik en az 20 karakter olmalıdır."),
            instrument: z.string().optional().nullable(),
            tradingViewChartUrl: z.string().url("Geçerli bir URL giriniz.").optional().nullable(),
        }))
        .mutation(async ({ ctx, input }) => {
            if (!ctx.dbReady) throw new TRPCError({ code: 'UNAVAILABLE', message: 'Veritabanı servisi hazır değil.' });
            
            const { uid } = ctx.user;
            const analysisDocRef = ctx.db.collection('analyses').doc(input.analysisId);
            const analysisSnap = await analysisDocRef.get();

            if (!analysisSnap.exists) throw new TRPCError({ code: 'NOT_FOUND' });

            const analysisData = analysisSnap.data();
            const userDoc = await ctx.db.collection('users').doc(uid).get();
            const isAdmin = userDoc.data()?.isAdmin === true;

            if (analysisData.authorId !== uid && !isAdmin) {
                 throw new TRPCError({ code: 'FORBIDDEN' });
            }
            
            const updateData = {
                title: input.title,
                content: input.content,
                instrument: input.instrument,
                tradingViewChartUrl: input.tradingViewChartUrl,
                updatedAt: Timestamp.now(),
            };

            await analysisDocRef.update(updateData);
            return { success: true, analysisId: input.analysisId, slug: analysisData.slug };
        }),
    
    addComment: protectedProcedure
        .input(z.object({
            analysisId: z.string(),
            text: z.string().min(3, "Yorum en az 3 karakter olmalıdır."),
        }))
        .mutation(async ({ ctx, input }) => {
            if (!ctx.dbReady) throw new TRPCError({ code: 'UNAVAILABLE', message: 'Veritabanı servisi hazır değil.' });
            
            const { uid } = ctx.user;
            const userDoc = await ctx.db.collection('users').doc(uid).get();
            const authorName = userDoc.data()?.displayName || ctx.user.email?.split('@')[0] || 'Anonim';

            const commentRef = ctx.db.collection('analyses').doc(input.analysisId).collection('comments');
            await commentRef.add({
                text: input.text,
                authorId: uid,
                authorName,
                createdAt: Timestamp.now(),
            });
            return { success: true };
        }),

    deleteComment: protectedProcedure
        .input(z.object({ analysisId: z.string(), commentId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            if (!ctx.dbReady) throw new TRPCError({ code: 'UNAVAILABLE', message: 'Veritabanı servisi hazır değil.' });
            
            const { uid } = ctx.user;
            const commentRef = ctx.db.doc(`analyses/${input.analysisId}/comments/${input.commentId}`);
            const commentSnap = await commentRef.get();
            if (!commentSnap.exists) throw new TRPCError({ code: 'NOT_FOUND' });

            const userDoc = await ctx.db.collection('users').doc(uid).get();
            const isAdmin = userDoc.data()?.isAdmin === true;

            if (commentSnap.data()?.authorId !== uid && !isAdmin) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Bu yorumu silme yetkiniz yok.' });
            }
            await commentRef.delete();
            return { success: true };
        }),
        
    generateAiCommentary: adminProcedure
        .input(z.object({ analysisId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            if (!ctx.dbReady) throw new TRPCError({ code: 'UNAVAILABLE', message: 'Veritabanı servisi hazır değil.' });
            
            const analysisDocRef = ctx.db.collection('analyses').doc(input.analysisId);
            const analysisSnap = await analysisDocRef.get();

            if (!analysisSnap.exists) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Analiz bulunamadı.' });
            }
            
            const { title, content } = analysisSnap.data();
            const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
            
            if (!GEMINI_API_KEY) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Gemini API anahtarı yapılandırılmamış.' });
            }
            
            // KRİTİK DÜZELTME: Desteklenen model ve endpoint kullanılıyor.
            const modelName = 'gemini-2.5-flash-preview-09-2025';
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
            
            const systemPrompt = `Bir profesyonel finans piyasası analisti gibi davran. Synara Sisteminin bütünsel zeka felsefesini kullanarak, aşağıdaki kullanıcı tarafından gönderilen analize dayanarak, kısa ve öz, tek paragraflık bir uzman yorumu sağla. Analizin güçlü yönlerini ve potansiyel kör noktalarını vurgula. Yorumun Türkçe olmalı.`;
            const userQuery = `Analiz başlığı: "${title}". Analiz içeriği: "${content}"`;
            
            const payload = {
                contents: [{ parts: [{ text: userQuery }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
            };

            for (let attempt = 0; attempt < 3; attempt++) {
                try {
                    const response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });

                    if (!response.ok) {
                        const errorBody = await response.text();
                         // Hata kodunu ve mesajını logla
                        console.error(`Gemini API Yanıt Hatası (${response.status}):`, errorBody.substring(0, 100));
                        throw new Error(`Gemini API Hatası: ${response.status}`);
                    }

                    const result = await response.json();
                    const commentary = result.candidates?.[0]?.content?.parts?.[0]?.text;

                    if (!commentary) {
                        throw new Error('Gemini API\'den geçerli bir yorum alınamadı.');
                    }

                    await analysisDocRef.update({
                        aiCommentary: commentary,
                        aiCommentaryGeneratedAt: Timestamp.now(),
                    });

                    return { success: true, commentary };

                } catch (error) {
                    if (attempt === 2) {
                        // Son denemede hala hata varsa fırlat.
                        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `Yapay zeka yorumu oluşturulamadı: ${error.message}` });
                    }
                    // Üstel geri çekilme (Exponential backoff)
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
                }
            }
        }),

    // YENİ MUTASYON: AI yorumunu siler.
    deleteAiCommentary: adminProcedure
        .input(z.object({ analysisId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            if (!ctx.dbReady) throw new TRPCError({ code: 'UNAVAILABLE', message: 'Veritabanı servisi hazır değil.' });
            
            const analysisDocRef = ctx.db.collection('analyses').doc(input.analysisId);
            
            // Analizin varlığını kontrol et
            const analysisSnap = await analysisDocRef.get();
            if (!analysisSnap.exists) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Analiz bulunamadı.' });
            }

            // AI yorumunu sil
            await analysisDocRef.update({
                aiCommentary: null,
                aiCommentaryGeneratedAt: null,
                updatedAt: Timestamp.now(), // Son güncelleme zamanını da ayarla
            });

            return { success: true };
        }),
});
