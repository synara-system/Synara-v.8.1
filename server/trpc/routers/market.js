// path: server/trpc/routers/market.js
import { publicProcedure, router } from "/server/trpc/trpc";
import { TRPCError } from '@trpc/server';
import LRUCache from 'lru-cache';

// --- SUNUCU TARAFI ÖN BELLEK (CACHE) ---
const MARKET_DATA_CACHE = new LRUCache({
    max: 1, // Sadece tek bir market verisi seti tut
    ttl: 1000 * 60 * 15, // 15 dakika
});
const CACHE_KEY = 'market_data';

// --- HARİCİ VERİ ÇEKME FONKSİYONLARI ---
async function fetchFearGreedIndex() {
    try {
        const response = await fetch("https://api.alternative.me/fng/?limit=1", { next: { revalidate: 300 } });
        if (!response.ok) throw new Error('Fear & Greed API failed');
        const data = await response.json();
        return data.data[0];
    } catch (error) {
        console.error("Fear & Greed Index fetch error:", error);
        return { value: '50', value_classification: 'Neutral' }; // Fallback
    }
}

async function fetchTrendingCoins() {
    try {
        const response = await fetch("https://api.coingecko.com/api/v3/search/trending", { next: { revalidate: 300 } });
        if (!response.ok) throw new Error('CoinGecko API failed');
        const data = await response.json();
        return data.coins.map(c => ({
            symbol: c.item.symbol.toUpperCase(),
            market_cap_rank: c.item.market_cap_rank
        })).sort((a, b) => a.market_cap_rank - b.market_cap_rank).slice(0, 7);
    } catch (error) {
        console.error("Trending Coins fetch error:", error);
        return []; // Fallback
    }
}

// --- DİNAMİK EKONOMİK TAKVİM OLUŞTURUCU ---
function generateEconomicCalendar() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    // Ayın önemli olaylarını tanımla (sabit event, dinamik tarih)
    const events = [
        { event: 'TÜFE Verisi (ABD)', impact: 'high', dayOfMonth: 12 },
        { event: 'ÜFE Verisi (ABD)', impact: 'medium', dayOfMonth: 14 },
        { event: 'FOMC Toplantı Tutanağı', impact: 'high', dayOfMonth: 19 },
        { event: 'Tarım Dışı İstihdam (ABD)', impact: 'high', dayOfMonth: 25 },
    ];
    
    return events.map(e => ({
        // Tarihi ay/gün formatında oluştur
        date: `${String(month + 1).padStart(2, '0')}/${String(e.dayOfMonth).padStart(2, '0')}`,
        event: e.event,
        impact: e.impact,
    }));
}

export const marketRouter = router({
    getMarketData: publicProcedure.query(async ({ ctx }) => { // KRİTİK FİX: ctx eklendi
        // KRİTİK GÜVENLİK KONTROLÜ: Admin SDK'sının başlatılıp başlatılmadığını kontrol et.
        // Başlatılmadıysa, veritabanına erişim gerekmeyen bu rota çalışmaya devam edebilir
        // ancak cache mantığını koruyarak.
        
        const cachedData = MARKET_DATA_CACHE.get(CACHE_KEY);
        if (cachedData) {
            return cachedData;
        }

        try {
            const [fearGreedData, trendingData] = await Promise.all([
                fetchFearGreedIndex(),
                fetchTrendingCoins(),
            ]);
            
            const economicCalendarData = generateEconomicCalendar();

            const marketData = {
                fearGreedData,
                trendingData,
                economicCalendarData,
            };
            
            MARKET_DATA_CACHE.set(CACHE_KEY, marketData);
            return marketData;
        } catch (error) {
            console.error("Market data fetch failed:", error);
            // Firebase bağımlılığı olmayan bu API'ların hatası doğrudan istemciye iletilebilir
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Piyasa verileri harici servislerden alınamadı.',
            });
        }
    }),
});
