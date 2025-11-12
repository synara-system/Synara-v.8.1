// path: hooks/usePerformanceAnalytics.js
'use client';

import { useMemo } from 'react';

/**
 * Kapatılmış işlem geçmişini alarak detaylı performans metriklerini hesaplar.
 * @param {Array<object>} trades - Kullanıcının kapatılmış işlem dokümanları (ISO string zaman damgalarıyla).
 * @param {number} initialBalance - Başlangıç kasa bakiyesi.
 * @returns {{ analytics: object, chartData: Array<object>, loading: boolean }} Hesaplanan metrikler ve grafik verisi.
 */
export const usePerformanceAnalytics = (trades = [], initialBalance = 0) => {

    const { analytics, chartData, loading } = useMemo(() => {
        // KRİTİK FİX 2.0: Gelen 'trades' parametresinin bir dizi (Array) olup olmadığını kontrol et.
        // Eğer Array değilse (muhtemelen tRPC yüklenirken undefined/null/obje gelmesi), boş dizi olarak kabul et.
        const safeTrades = Array.isArray(trades) ? trades : [];
        
        // trades dizisindeki ISO stringleri Date objesine çeviriyoruz.
        const parsedTrades = safeTrades.map(trade => ({ // safeTrades artık garanti bir dizidir.
            ...trade,
            // KRİTİK: Gelen veri tRPC'den ISO string formatında, bu yüzden new Date() ile çevrilmeli.
            openTimestamp: new Date(trade.openTimestamp),
            closeTimestamp: new Date(trade.closeTimestamp),
        }));

        // KRİTİK KORUMA: Eğer parsedTrades hala boşsa veya geçerli veri içermiyorsa erken çıkış yap.
        if (parsedTrades.length === 0) {
            // KRİTİK: AI için sıfır değerler ve temel metrikler döndürülüyor.
            const emptyAnalytics = { 
                winRate: 0, averageRR: 0, totalTrades: 0, bestROE: 0, totalPnl: 0, totalPnlPercent: 0,
                avgWin: 0, avgLoss: 0, profitFactor: 0, maxDrawdown: 0, // Yeni eklenen maxDrawdown
                maxWinStreak: 0, maxLossStreak: 0,
                directionStats: { L: { pnl: 0, winRate: 0 }, S: { pnl: 0, winRate: 0 } } 
            };
            return { analytics: emptyAnalytics, chartData: [], loading: false };
        }

        // Grafik için gerekli olan tüm noktalar: Başlangıç + Her Kapalı İşlem
        const chartDataPoints = [];
        let runningBalanceForChart = initialBalance;
        
        // İşlemleri kapanış tarihine göre sırala
        const sortedTrades = [...parsedTrades].sort((a, b) => a.closeTimestamp.getTime() - b.closeTimestamp.getTime());
        
        // Başlangıç noktasını oluştur
        const startPointDate = sortedTrades.length > 0 ? new Date(sortedTrades[0].closeTimestamp.getTime()) : new Date();
        startPointDate.setDate(startPointDate.getDate() - 1);
        chartDataPoints.push({ name: 'Başlangıç', balance: initialBalance, date: startPointDate.toISOString(), type: 'trade', pnl: 0, id: 'start-point' });


        // Metrik Hesaplama Değişkenleri
        let totalPnl = 0;
        let totalWins = 0;
        let totalLosses = 0;
        let totalWinPnl = 0; 
        let totalLossPnl = 0; 
        let bestTrade = null;
        let worstTrade = null;
        let winStreak = 0;
        let lossStreak = 0;
        let maxWinStreak = 0;
        let maxLossStreak = 0;
        
        const instrumentStats = {};
        const directionStats = { L: { wins: 0, losses: 0, pnl: 0 }, S: { wins: 0, losses: 0, pnl: 0 } };
        
        // Max Drawdown Hesaplama Değişkenleri
        let peakBalance = initialBalance;
        let maxDrawdown = 0;
        let runningDrawdown = 0;


        sortedTrades.forEach(trade => {
            const pnl = parseFloat(trade.pnlUsd) || 0;
            runningBalanceForChart += pnl;
            totalPnl += pnl;

            // Grafik Verisi (Sadece Trade'ler için PnL'i Chart Data'ya ekliyoruz)
            chartDataPoints.push({
                name: trade.closeTimestamp.toLocaleDateString('tr-TR'),
                balance: runningBalanceForChart,
                pnl: pnl,
                date: trade.closeTimestamp.toISOString(), 
                type: trade.type, // cashflow veya trade
            });
            
            // --- Max Drawdown Hesaplama ---
            if (runningBalanceForChart > peakBalance) {
                peakBalance = runningBalanceForChart;
            }
            runningDrawdown = (peakBalance - runningBalanceForChart) / peakBalance;
            maxDrawdown = Math.max(maxDrawdown, runningDrawdown);
            // -------------------------------


            const isWin = pnl > 0;

            // Kazanma/Kaybetme Serileri
            if (isWin) {
                totalWins++;
                totalWinPnl += pnl;
                winStreak++;
                lossStreak = 0;
                maxWinStreak = Math.max(maxWinStreak, winStreak);
            } else if (pnl < 0) {
                totalLosses++;
                totalLossPnl += pnl;
                lossStreak++;
                winStreak = 0;
                maxLossStreak = Math.max(maxLossStreak, lossStreak);
            } else {
                 // Nötr PnL'de seriyi bozma
                 winStreak = 0;
                 lossStreak = 0;
            }
            
            // En İyi / En Kötü İşlem (R:R bazlı)
            const tradeForHighlight = {
                ...trade,
                openTimestamp: trade.openTimestamp.toISOString(),
                closeTimestamp: trade.closeTimestamp.toISOString(),
            };

            // KRİTİK DÜZELTME: R:R'ı 0 olan işlemleri (hata/nötr) karşılaştırmadan hariç tut
            if (trade.riskReward !== 0 && trade.type === 'trade') { // Sadece trade'leri dahil et
                 if (!bestTrade || (trade.riskReward > (bestTrade.riskReward || 0))) {
                    bestTrade = tradeForHighlight;
                }
                // Worst trade için R:R sıfırdan küçük olmalı.
                if (!worstTrade || (trade.riskReward < (worstTrade.riskReward || 0))) {
                    worstTrade = tradeForHighlight;
                }
            }
            
            // Enstrüman ve Yön İstatistikleri
            if (trade.type === 'trade') {
                 const instrument = trade.instrument || 'Bilinmeyen';
                 const direction = trade.direction === 'L' ? 'L' : 'S'; 

                 instrumentStats[instrument] = instrumentStats[instrument] || { wins: 0, losses: 0, pnl: 0, count: 0 };
                 instrumentStats[instrument].count++;
                 instrumentStats[instrument].pnl += pnl;
                 if (isWin) {
                     instrumentStats[instrument].wins++;
                 } else if (pnl < 0) {
                     instrumentStats[instrument].losses++;
                 }
                 
                 directionStats[direction].pnl += pnl;
                 if (isWin) {
                     directionStats[direction].wins++;
                 } else if (pnl < 0) {
                     directionStats[direction].losses++;
                 }
            }

        });

        const totalTrades = parsedTrades.filter(t => t.type === 'trade').length;
        const totalClosedTrades = totalWins + totalLosses; // Sadece Win veya Loss olan trade'ler
        const winRate = totalClosedTrades > 0 ? (totalWins / totalClosedTrades) * 100 : 0;
        
        // Ortalama Kazanç ve Kayıp (Pozitif değer olarak gösterilir)
        const avgWin = totalWins > 0 ? totalWinPnl / totalWins : 0;
        const avgLoss = totalLosses > 0 ? Math.abs(totalLossPnl / totalLosses) : 0;
        
        // Profit Factor (PF): Toplam Kazanılan PnL / Toplam Kaybedilen PnL (Pozitif değerler)
        const profitFactor = totalLosses > 0 ? Math.abs(totalWinPnl / totalLossPnl) : (totalWins > 0 ? 999.99 : 0);
        
        // Ortalama R:R (Sadece kazanan işlemlerin ortalama R:R'ı alınır)
        const winningTrades = parsedTrades.filter(t => t.pnlUsd > 0 && t.riskReward > 0 && t.type === 'trade');
        const totalWinningRR = winningTrades.reduce((acc, t) => acc + (parseFloat(t.riskReward) || 0), 0);
        const averageRR = winningTrades.length > 0 ? totalWinningRR / winningTrades.length : 0;
        
        // Riske Göre Ortalama Ödül (Reward/Risk Ratio - RR/R)
        const rewardToRiskRatio = avgLoss > 0 ? avgWin / avgLoss : (avgWin > 0 ? 999.99 : 0);
        
        // En İyi ROE'yi bul
        const tradePnLPercent = parsedTrades.filter(t => t.type === 'trade').map(t => parseFloat(t.pnlPercent) || 0);
        const bestROE = tradePnLPercent.length > 0 ? Math.max(...tradePnLPercent, 0) : 0;

        // Instrument Stats'i PnL'e göre sırala
        const sortedInstrumentStats = Object.keys(instrumentStats)
            .map(key => ({ 
                instrument: key, 
                ...instrumentStats[key],
                winRate: instrumentStats[key].count > 0 ? (instrumentStats[key].wins / instrumentStats[key].count) * 100 : 0
            }))
            .sort((a, b) => b.pnl - a.pnl);
        
        // Direction Stats
        const longTradesCount = directionStats.L.wins + directionStats.L.losses;
        const shortTradesCount = directionStats.S.wins + directionStats.S.losses;

        const longWinRate = longTradesCount > 0 ? (directionStats.L.wins / longTradesCount) * 100 : 0;
        const shortWinRate = shortTradesCount > 0 ? (directionStats.S.wins / shortTradesCount) * 100 : 0;
        
        const calculatedAnalytics = {
            winRate: parseFloat(winRate.toFixed(1)),
            averageRR: parseFloat(averageRR.toFixed(2)), // Ortalama kazanan R:R
            profitFactor: parseFloat(profitFactor.toFixed(2)),
            rewardToRiskRatio: parseFloat(rewardToRiskRatio.toFixed(2)), // Ortalama Kazan/Ortalama Kayıp
            totalTrades: totalClosedTrades,
            avgWin: parseFloat(avgWin.toFixed(2)),
            avgLoss: parseFloat(avgLoss.toFixed(2)),
            totalPnl: parseFloat(totalPnl.toFixed(2)),
            maxWinStreak,
            maxLossStreak,
            bestTrade,
            worstTrade,
            bestROE: parseFloat(bestROE.toFixed(1)), // Yeni eklenen metrik
            maxDrawdown: parseFloat(maxDrawdown.toFixed(4)), // KRİTİK: Yeni eklenen Max Drawdown
            instrumentStats: sortedInstrumentStats,
            directionStats: {
                L: { ...directionStats.L, winRate: parseFloat(longWinRate.toFixed(1)) },
                S: { ...directionStats.S, winRate: parseFloat(shortWinRate.toFixed(1)) },
            },
        };

        return { analytics: calculatedAnalytics, chartData: chartDataPoints, loading: false };

    }, [trades, initialBalance]);
    
    return { analytics, chartData, loading };
};
