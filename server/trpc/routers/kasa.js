// path: server/trpc/routers/kasa.js
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { Timestamp } from 'firebase-admin/firestore'; 
import { protectedProcedure, router } from '/server/trpc/trpc';

const MAX_NOTE_LENGTH = 150;

// Sunucu tarafında PnL ve Risk hesaplaması yapan yardımcı fonksiyon
const calculateTradePnL = (trade, targetPrice) => {
    try {
        const sl = parseFloat(trade.stopLoss) || 0;
        const direction = trade.direction;
        const entryPrice = parseFloat(trade.entryPrice) || 0;
        const margin = parseFloat(trade.margin) || 0;
        // KRİTİK DÜZELTME: Hem marginUsed hem de eski quantity alanını okumayı sağlar.
        const marginUsed = parseFloat(trade.marginUsed || trade.quantity) || 0; 
        const price = parseFloat(targetPrice) || 0;

        if (!direction || marginUsed <= 0 || entryPrice <= 0 || price <= 0 || margin <= 0 || sl <= 0) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: "Girdi hatası: Tüm finansal değerler pozitif olmalıdır." });
        }

        const positionSize = marginUsed * margin;
        const coinQuantity = positionSize / entryPrice;
        
        const pnlRaw = direction === 'L' ? (price - entryPrice) * coinQuantity : (entryPrice - price) * coinQuantity;
        const pnlUsd = parseFloat(pnlRaw.toFixed(2));
        const pnlPercent = parseFloat(((pnlUsd / marginUsed) * 100).toFixed(2));

        const riskPriceDiff = Math.abs(entryPrice - sl);
        const riskUsd = parseFloat((riskPriceDiff * coinQuantity).toFixed(2));

        let riskReward = 0;
        // KRİTİK KONTROL: Risk sıfıra yakınsa sonsuz R:R hesaplamak yerine yüksek bir değer ver.
        if (riskUsd > 0.0001) {
            riskReward = parseFloat((pnlUsd / riskUsd).toFixed(2));
        } else if (pnlUsd > 0) {
            riskReward = 9999.99; // Risk sıfırsa ve kar varsa R:R sonsuzdur.
        }

        if (Math.abs(riskReward) > 9999.99 || isNaN(riskReward)) riskReward = 9999.99;

        return { pnlUsd, pnlPercent, riskReward, riskUsd, positionSize, exitPrice: price };
    } catch (e) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: e.message || "Hesaplama hatası." });
    }
};

export const kasaRouter = router({
  getKasaData: protectedProcedure.query(async ({ ctx }) => {
    const { user, db, dbReady } = ctx;
    if (!dbReady || !db) {
        throw new TRPCError({ code: 'UNAVAILABLE', message: 'Kasa Yönetimi servisi hazır değil.' });
    }
      
    const summaryDocRef = db.doc(`kasa/${user.uid}`);
    const tradesCollRef = db.collection(`kasa/${user.uid}/trades`).orderBy('openTimestamp', 'asc');

    try {
        const [summarySnap, tradesSnap] = await Promise.all([
            summaryDocRef.get(),
            tradesCollRef.get()
        ]);

        const summary = summarySnap.exists ? summarySnap.data() : null;
        
        const trades = tradesSnap.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                openTimestamp: data.openTimestamp?.toDate().toISOString() || null,
                closeTimestamp: data.closeTimestamp?.toDate().toISOString() || null,
                updatedAt: data.updatedAt?.toDate().toISOString() || null,
            };
        });

        return { summary, trades };
    } catch (error) {
        console.error("tRPC Kasa Veri Çekme Hatası:", error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `Kasa verileri alınamadı: ${error.message}` });
    }
  }),
  
  setInitialBalance: protectedProcedure
    .input(z.object({ balance: z.number().positive('Bakiye pozitif bir sayı olmalıdır.') }))
    .mutation(async ({ ctx, input }) => {
        const { user, db, dbReady } = ctx;
        if (!dbReady || !db) throw new TRPCError({ code: 'UNAVAILABLE' });
        const summaryDocRef = db.doc(`kasa/${user.uid}`);
        await summaryDocRef.set({ initialBalance: input.balance, updatedAt: Timestamp.now() }, { merge: true });
        return { success: true };
  }),

  addTrade: protectedProcedure
    .input(z.object({
        instrument: z.string().min(1, 'Parite boş olamaz.'),
        direction: z.enum(['L', 'S']),
        marginUsed: z.number().positive('Teminat pozitif olmalı.'),
        entryPrice: z.number().positive('Giriş fiyatı pozitif olmalı.'),
        stopLoss: z.number().positive('Stop loss pozitif olmalıdır.'),
        tp1: z.number().positive().nullable().optional(), 
        tp2: z.number().positive().nullable().optional(),
        margin: z.number().positive('Kaldıraç pozitif olmalı.'),
        note: z.string().max(MAX_NOTE_LENGTH, `Not ${MAX_NOTE_LENGTH} karakterden uzun olamaz.`).nullable().optional(),
        warningAcknowledged: z.boolean().optional(),
    })
    // KRİTİK FİX (HATA-03): refine'dan hassas 'entryPrice' ve 'stopLoss' farkı kontrolü kaldırıldı.
    .refine((data) => {
        if (data.direction === 'L' && data.stopLoss >= data.entryPrice) {
            return false;
        }
        if (data.direction === 'S' && data.stopLoss <= data.entryPrice) {
            return false;
        }
        return true;
    }, {
        message: 'Disiplin Protokolü Hatası: Long pozisyonunda SL < Entry veya Short pozisyonunda SL > Entry olmalıdır.',
        path: ['stopLoss'],
    }))
    .mutation(async ({ ctx, input }) => {
        const { user, db, dbReady } = ctx;
        if (!dbReady || !db) throw new TRPCError({ code: 'UNAVAILABLE' });
        const positionSize = input.marginUsed * input.margin;
        
        const tradeData = {
            ...input,
            positionSize,
            status: 'open',
            type: 'trade',
            pnlUsd: 0,
            pnlPercent: 0,
            riskReward: 0,
            openTimestamp: Timestamp.now(),
            tp1: input.tp1 ?? null,
            tp2: input.tp2 ?? null,
            note: input.note ?? null,
            warningAcknowledged: input.warningAcknowledged || false,
        };

        const tradesCollRef = db.collection(`kasa/${user.uid}/trades`);
        await tradesCollRef.add(tradeData);
        return { success: true };
    }),
    
  updateTrade: protectedProcedure
    .input(z.object({
        tradeId: z.string(),
        tp1: z.number().positive('TP1 pozitif olmalıdır.').nullable().optional(), 
        tp2: z.number().positive('TP2 pozitif olmalıdır.').nullable().optional(),
        note: z.string().max(MAX_NOTE_LENGTH, `Not ${MAX_NOTE_LENGTH} karakterden uzun olamaz.`).nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
        const { user, db, dbReady } = ctx;
        if (!dbReady || !db) throw new TRPCError({ code: 'UNAVAILABLE' });
        const tradeDocRef = db.doc(`kasa/${user.uid}/trades/${input.tradeId}`);
        const tradeSnap = await tradeDocRef.get();

        if (!tradeSnap.exists) throw new TRPCError({ code: 'NOT_FOUND' });
        if (tradeSnap.data()?.status !== 'open') throw new TRPCError({ code: 'BAD_REQUEST', message: 'Sadece açık pozisyonlar güncellenebilir.' });

        const updatePayload = {
            tp1: input.tp1 ?? null,
            tp2: input.tp2 ?? null,
            note: input.note ?? null,
            updatedAt: Timestamp.now(),
        };

        await tradeDocRef.update(updatePayload);
        return { success: true };
    }),

  closeTrade: protectedProcedure
    .input(z.object({
        tradeId: z.string(),
        exitPrice: z.number().positive('Çıkış fiyatı pozitif olmalıdır.'),
    }))
    .mutation(async ({ ctx, input }) => {
        const { user, db, dbReady } = ctx;
        if (!dbReady || !db) throw new TRPCError({ code: 'UNAVAILABLE' });
        const tradeDocRef = db.doc(`kasa/${user.uid}/trades/${input.tradeId}`);
        const tradeSnap = await tradeDocRef.get();

        if (!tradeSnap.exists) throw new TRPCError({ code: 'NOT_FOUND' });

        const tradeToClose = tradeSnap.data();
        // KRİTİK FİX: calculateTradePnL tradeToClose'dan quantity/marginUsed okuyabilmeli.
        const pnlData = calculateTradePnL({ ...tradeToClose, marginUsed: tradeToClose.marginUsed || tradeToClose.quantity }, input.exitPrice);

        await tradeDocRef.update({
            exitPrice: pnlData.exitPrice,
            pnlUsd: pnlData.pnlUsd,
            pnlPercent: pnlData.pnlPercent,
            riskReward: pnlData.riskReward,
            status: 'closed',
            closeTimestamp: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });

        return { success: true, pnl: pnlData.pnlUsd };
    }),
  
   deleteTrade: protectedProcedure
    .input(z.object({ tradeId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { user, db, dbReady } = ctx;
      if (!dbReady || !db) throw new TRPCError({ code: 'UNAVAILABLE' });
      const tradeDocRef = db.doc(`kasa/${user.uid}/trades/${input.tradeId}`);
      await tradeDocRef.delete();
      return { success: true };
    }),

  addCashFlow: protectedProcedure
    .input(z.object({
        amount: z.number().positive('Miktar pozitif olmalı.'),
        type: z.enum(['deposit', 'withdraw']),
    }))
    .mutation(async ({ ctx, input }) => {
        const { user, db, dbReady } = ctx;
        if (!dbReady || !db) throw new TRPCError({ code: 'UNAVAILABLE' });
        const pnlUsd = input.type === 'deposit' ? input.amount : -input.amount;
        
        const cashFlowData = {
            instrument: input.type === 'deposit' ? 'DEPOSIT' : 'WITHDRAW',
            direction: input.type === 'deposit' ? 'D' : 'W',
            type: 'cashflow',
            pnlUsd,
            pnlPercent: 0,
            openTimestamp: Timestamp.now(),
            closeTimestamp: Timestamp.now(),
        };

        const tradesCollRef = db.collection(`kasa/${user.uid}/trades`);
        await tradesCollRef.add(cashFlowData);
        return { success: true };
    }),

  resetKasa: protectedProcedure
    .input(z.object({ initialBalance: z.number().positive('Yeni bakiye pozitif olmalı.') }))
    .mutation(async ({ ctx, input }) => {
        const { user, db, dbReady } = ctx;
        if (!dbReady || !db) throw new TRPCError({ code: 'UNAVAILABLE' });
        const summaryDocRef = db.doc(`kasa/${user.uid}`);
        
        const tradesCollRef = db.collection(`kasa/${user.uid}/trades`);
        const tradesSnapshot = await tradesCollRef.get();
        if (!tradesSnapshot.empty) {
             const batch = db.batch();
             tradesSnapshot.docs.forEach((doc) => {
                 batch.delete(doc.ref);
             });
             await batch.commit();
        }
        
        await summaryDocRef.set({ 
            initialBalance: input.initialBalance, 
            updatedAt: Timestamp.now() 
        });

        return { success: true };
    }),

  // YENİ MUTASYON: Asistan sohbet geçmişini temizler
  clearAssistantChats: protectedProcedure
    .mutation(async ({ ctx }) => {
        const { user, db, dbReady } = ctx;
        if (!dbReady || !db) throw new TRPCError({ code: 'UNAVAILABLE' });
        
        const chatsCollRef = db.collection(`kasa/${user.uid}/chats`);
        const snapshot = await chatsCollRef.get();
        
        if (snapshot.empty) {
             return { success: true, count: 0 };
        }
        
        const batch = db.batch();
        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        
        await batch.commit();
        return { success: true, count: snapshot.docs.length };
    }),
});
