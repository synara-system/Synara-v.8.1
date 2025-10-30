// path: server/trpc/routers/market.js
import { publicProcedure, router } from "../trpc";
import { TRPCError } from '@trpc/server';
import LRUCache from 'lru-cache';
import { z } from 'zod'; 

// --- SUNUCU TARAFI ÖN BELLEK (CACHE) ---
const MARKET_DATA_CACHE = new LRUCache({
    max: 1, // Sadece tek bir market verisi seti tut
    ttl: 1000 * 60 * 15, // 15 dakika
});
const CACHE_KEY = 'market_data';

// --- ALPHA VANTAGE API KEY GÜVENLİK KONTROLÜ ---
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

// --- HARİCİ VERİ ÇEKME FONKSİYONLARI (MARKET PULSE İÇİN) ---
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

// --- CANLI ENDEKS/EMTİA/PARİTE VERİSİNİ ÇEKEN FONKSİYON ---
async function fetchAlphaVantageData() {
    // KRİTİK FİX: API limitine takılmamak için sadece en kritik 3 parite çekiliyor
    const symbols = [
        'GLD',    // Altın ETF'i (Altın temsili)
        'SPY',    // S&P 500 ETF (Endeks temsili)
        'EURUSD', // EUR/USD Spot FX
    ];

    if (!ALPHA_VANTAGE_API_KEY) {
        console.warn("Alpha Vantage API Key not found. Using simulated market data for indices/commodities.");
        
        // Anahtar yoksa kullanılan simüle edilmiş veriyi döndür (Mock veriyi korur)
        const simulatedData = [
            { symbol: 'XAU/USD', price: 2350.75, change: -0.15, isUp: false },
            { symbol: 'SPX', price: 5420.75, change: 0.55, isUp: true },
            { symbol: 'NAS100', price: 19875.20, change: 2.10, isUp: true },
            { symbol: 'USD/TRY', price: 32.8550, change: 0.05, isUp: false },
            { symbol: 'DXY', price: 105.28, change: -0.02, isUp: false },
        ];
        return simulatedData.map(item => ({
            ...item,
            // Mock veride random dalgalanma eklenerek canlı hissi verilebilir
            price: item.price + (Math.random() - 0.5) * (item.price * 0.0001), 
            change: item.change + (Math.random() - 0.5) * 0.05,
        }));
    }

    console.warn("ALPHA VANTAGE BİLGİSİ: API limitini korumak için sadece 3 kritik parite çekiliyor.");

    const fetchPromises = symbols.map(symbol => {
        // Tüm semboller için GLOBAL_QUOTE deniyoruz
        const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
        
        // Cache süresi 60 saniye (API limitini hafifletmek için)
        return fetch(url, { next: { revalidate: 60 } }) 
            .then(res => res.json())
            .then(data => {
                const quote = data['Global Quote'];
                // Rate Limit Hatası veya diğer Alpha Vantage hatalarını yakala
                if (data['Note'] || data['Error Message']) {
                    console.error(`Alpha Vantage Limit Hit or Error for ${symbol}: ${data['Note'] || data['Error Message']}`);
                    return null;
                }
                
                if (quote && quote['05. price']) {
                    // Sembol ismini kullanıcı dostu formata dönüştür
                    let displaySymbol = symbol;
                    if (symbol === 'GLD') displaySymbol = 'XAU/USD';
                    else if (symbol === 'SPY') displaySymbol = 'SPX';
                    else if (symbol === 'EURUSD') displaySymbol = 'EUR/USD';

                    return {
                        symbol: displaySymbol,
                        price: parseFloat(quote['05. price']),
                        change: parseFloat(quote['10. change percent'].replace('%', '')),
                        isUp: parseFloat(quote['09. change']) >= 0,
                    };
                }
                // Geçerli veri gelmediyse
                return null;
            })
            .catch(error => {
                console.error(`Alpha Vantage fetch error for ${symbol}:`, error);
                return null;
            });
    });

    // Tüm çağrıları bekle, hangisi başarılı olursa olsun devam et
    const results = await Promise.allSettled(fetchPromises);
    
    // Yalnızca durumu 'fulfilled' (başarılı) olan ve 'value' değeri null olmayan sonuçları döndür
    return results
        .filter(result => result.status === 'fulfilled' && result.value !== null)
        .map(result => result.value);
}

// --- CANLI TİCKER VERİSİNİ ÇEKEN ANA FONKSİYON ---
async function fetchLiveTickerData() {
    // Kripto verisi çekilir (CoinGecko)
    const coinIds = 'bitcoin,ethereum,solana,bnb,ripple,cardano';
    const cryptoUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd&include_24hr_change=true`;

    let cryptoData = [];
    let marketData = [];

    try {
        const cryptoResponse = await fetch(cryptoUrl, { next: { revalidate: 15 } }); 
        if (!cryptoResponse.ok) throw new Error('CoinGecko API failed');
        
        const cryptoJson = await cryptoResponse.json();
        
        cryptoData = Object.keys(cryptoJson).map(key => {
            const item = cryptoJson[key];
            const symbol = key.toUpperCase().substring(0, 5) + '/USD';
            const price = item.usd;
            const change = item.usd_24h_change;
            
            return {
                symbol: symbol,
                price: price,
                change: change ? parseFloat(change) : 0,
                isUp: change > 0,
            };
        });
        
    } catch (error) {
        console.error("CoinGecko fetch error:", error);
    }

    // Endeks ve parite verisi çekilir (Alpha Vantage / Mock)
    try {
        marketData = await fetchAlphaVantageData();
    } catch (error) {
        // Hata zaten fetchAlphaVantageData içinde yönetiliyor
    }

    // KRİTİK GÜNCELLEME: Canlı kripto verisi ile Endeks/Pariteler birleştirilir
    const combinedData = [...cryptoData, ...marketData];
    
    // Eğer hiçbir veri çekilemediyse, bandın çökmesini engellemek için minimum güvenli mock veri döndürülür
    if (combinedData.length === 0) {
        return [
            { symbol: 'SYNARA', price: 99.99, change: 0.00, isUp: true },
        ];
    }
    
    return combinedData;
}

// --- DİNAMİK EKONOMİK TAKVİM OLUŞTURUCU ---
function generateEconomicCalendar() {
    const now = new Date();
    const month = now.getMonth();
    
    const events = [
        { event: 'TÜFE Verisi (ABD)', impact: 'high', dayOfMonth: 12 },
        { event: 'ÜFE Verisi (ABD)', impact: 'medium', dayOfMonth: 14 },
        { event: 'FOMC Toplantı Tutanağı', impact: 'high', dayOfMonth: 19 },
        { event: 'Tarım Dışı İstihdam (ABD)', impact: 'high', dayOfMonth: 25 },
    ];
    
    return events.map(e => ({
        date: `${String(month + 1).padStart(2, '0')}/${String(e.dayOfMonth).padStart(2, '0')}`,
        event: e.event,
        impact: e.impact,
    }));
}

// --- ANA PİYASA VERİSİ ÇEKME VE CACHE FONKSİYONU ---
async function fetchAndCacheMarketInfo() {
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
        throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Piyasa verileri harici servislerden alınamadı.',
        });
    }
}


export const marketRouter = router({
    
    // YENİ EKLEME: Canlı Ticker Verisi (Haberler sayfasındaki bant için)
    getLiveTickerData: publicProcedure
        .query(async ({ ctx }) => {
            return await fetchLiveTickerData();
        }),
        
    // 1. KRİTİK ALIAS (Yeni Ad)
    // Dashboard ve Market Pulse tarafından kullanılan temel market verilerini çeker.
    getLatestMarketInfo: publicProcedure.query(async ({ ctx }) => { 
        return await fetchAndCacheMarketInfo();
    }),

});
