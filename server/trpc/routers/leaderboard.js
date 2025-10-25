// path: server/trpc/routers/leaderboard.js
import { z } from 'zod';
import { publicProcedure, router } from "/server/trpc/trpc";
import LRUCache from 'lru-cache'; 
import { TRPCError } from '@trpc/server';
import * as crypto from 'crypto'; 

// --- SUNUCU TARAFI ÖN BELLEK (CACHE) ---
const LEADERBOARD_CACHE = new LRUCache({
    max: 1, 
    ttl: 3600000, 
});

const CACHE_KEY = 'synara_leaderboard';

const generateAnonName = (userId) => {
    const hash = crypto.createHash('sha256').update(userId).digest('hex');
    const prefix = 'Trader';
    const anonId = hash.substring(0, 8); 
    return `${prefix}-${anonId.toUpperCase()}`;
};


// --- YARDIMCI FONKSİYON: Metrik Hesaplama ---
const calculateUserMetrics = (trades) => {
    const closedTrades = trades.filter(t => t.status === 'closed' && t.type === 'trade');
    if (closedTrades.length < 1) return null;

    const totalTrades = closedTrades.length;
    const winningTradesCount = closedTrades.filter(t => t.pnlUsd > 0).length;
    const totalGain = closedTrades.filter(t => t.pnlUsd > 0).reduce((sum, t) => sum + t.pnlUsd, 0);
    const totalLoss = Math.abs(closedTrades.filter(t => t.pnlUsd < 0).reduce((sum, t) => sum + t.pnlUsd, 0));
    
    const winRate = totalTrades > 0 ? (winningTradesCount / totalTrades) * 100 : 0;

    const winningTrades = closedTrades.filter(t => t.pnlUsd > 0);
    const totalWinningRR = winningTrades.reduce((sum, t) => sum + (parseFloat(t.riskReward) || 0), 0);
    const averageRR = winningTrades.length > 0 ? totalWinningRR / winningTrades.length : 0;

    const profitFactor = totalLoss > 0 ? totalGain / totalLoss : (totalGain > 0 ? 999.99 : 0);

    return {
        winRate: parseFloat(winRate.toFixed(2)),
        averageRR: parseFloat(averageRR.toFixed(2)),
        profitFactor: parseFloat(profitFactor.toFixed(2)),
        tradeCount: totalTrades,
    };
};


export const leaderboardRouter = router({
  getLeaderboard: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.dbReady || !ctx.db) {
         throw new TRPCError({ code: 'FORBIDDEN', message: 'Liderlik servisi geçici olarak kullanılamıyor. Yönetim servisi hazır değil.' });
    }
      
    const cachedData = LEADERBOARD_CACHE.get(CACHE_KEY);
    if (cachedData) {
        console.log("tRPC Leaderboard: Önbellekten okundu.");
        return cachedData;
    }
    
    console.log("tRPC Leaderboard: Yeni veri hesaplanıyor...");

    try {
        const usersSnapshot = await ctx.db.collection('users').get();
        if (usersSnapshot.empty) {
            return { winRate: [], averageRR: [], profitFactor: [] };
        }

        const leaderboardPromises = usersSnapshot.docs.map(async (userDoc) => {
            const userData = userDoc.data();
            const userId = userDoc.id;
            
            const tradesSnapshot = await ctx.db.collection('kasa').doc(userId).collection('trades').get();
            if (tradesSnapshot.empty) {
                return null;
            }
            
            // KRİTİK DÜZELTME: Timestamp alanlarının varlığını ve toDate() metodunu kontrol et.
            const trades = tradesSnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    ...data,
                    // data.openTimestamp var mı ve toDate() metodu var mı kontrolü yapılıyor.
                    openTimestamp: data.openTimestamp?.toDate ? data.openTimestamp.toDate().toISOString() : null,
                    closeTimestamp: data.closeTimestamp?.toDate ? data.closeTimestamp.toDate().toISOString() : null,
                };
            });
            const metrics = calculateUserMetrics(trades);

            if (metrics) {
                const displayName = userData.displayName || generateAnonName(userId);
                
                return {
                    displayName,
                    ...metrics
                };
            }
            return null;
        });

        const results = (await Promise.all(leaderboardPromises)).filter(Boolean);

        const responseData = {
            winRate: [...results].sort((a, b) => b.winRate - a.winRate),
            averageRR: [...results].sort((a, b) => b.averageRR - a.averageRR),
            profitFactor: [...results].sort((a, b) => b.profitFactor - a.profitFactor),
        };
        
        LEADERBOARD_CACHE.set(CACHE_KEY, responseData);
        
        return responseData;

    } catch (error) {
        console.error("tRPC Leaderboard Hatası:", error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `Liderlik verisi alınamadı. Detay: ${error.message}` });
    }
  }),
});
