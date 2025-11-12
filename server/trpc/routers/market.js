// path: server/trpc/routers/market.js
import { publicProcedure, router } from "../trpc";
import { TRPCError } from '@trpc/server';
import LRUCache from 'lru-cache';
import { z } from 'zod';
import { logger } from '@/lib/Logger'; // logger import edildi

// (FMP v3.4) Header notları (v3.3) kaldırıldı.

// Logger bağlamı
logger.setContext({ path: 'MarketRouter' });

// --- (Tam Liste v1.0) Sabitler (Madde 1.0) ---
const FMP_BASES = { 
    stable: "https://financialmodelingprep.com/stable", 
    v3: "https://financialmodelingprep.com/api/v3",
    v4: "https://financialmodelingprep.com/api/v4"
};
const FMP_TIMEOUT_MS = 8000; // (Madde 1.0) 8 saniye timeout
const CACHE_TTL = { // (Madde 4.0)
    SNAPSHOT: 1000 * 600, // 10 dakika (600s)
    LIVE: 1000 * 60, // 1 dakika (Ticker bandı için)
};

// --- SUNUCU TARAFI ÖN BELLEK (CACHE) ---
const MARKET_DATA_CACHE = new LRUCache({
    max: 1, // Sadece tek bir market verisi seti tut
    ttl: CACHE_TTL.SNAPSHOT, // (Tam Liste v1.0) 10 dakika
});
// (v3.1) Cache Key (v3.0 -> v3.1)
const CACHE_KEY = 'market_data_v3_1_snapshot';

// --- API KEY GÜVENLİK KONTROLÜ ---
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const FMP_API_KEY = process.env.FMP_API_KEY; // FMP anahtarı

// FMP API Anahtarının Yüklendiğine Dair Log Kontrolü
if (!FMP_API_KEY) {
    logger.warn('FMP_API_KEY ENV değişkeni sunucuya yüklenemedi. FMP verileri çekilemeyecek.');
} else {
    logger.info('FMP_API_KEY başarılı bir şekilde yüklendi.');
}


// === (FMP v3.2) HARDCODED JSON FALLBACK VERİSİ ===
// (Yüklenen 8 adet JSON dosyasının içeriği)

const FALLBACK_GAINERS = [
  { "symbol": "AAPL", "changesPercentage": 2.34, "price": 172.10, "companyName": "Apple Inc" },
  { "symbol": "MSFT", "changesPercentage": 1.98, "price": 408.25, "companyName": "Microsoft Corp" }
];

const FALLBACK_LOSERS = [
  { "symbol": "TSLA", "changesPercentage": -3.12, "price": 214.70, "companyName": "Tesla Inc" },
  { "symbol": "NVDA", "changesPercentage": -1.45, "price": 118.32, "companyName": "NVIDIA Corp" }
];

const FALLBACK_SECTORS = [
  { "sector": "Technology", "changesPercentage": 1.25 },
  { "sector": "Financial",  "changesPercentage": -0.45 },
  { "sector": "Health Care","changesPercentage": 0.38 }
];

const FALLBACK_CRYPTO_QUOTES = [
  { "symbol": "BTCUSD", "price": 109810.0, "changePercentage": -0.85 },
  { "symbol": "ETHUSD", "price": 3852.73, "changePercentage": 0.24 },
  { "symbol": "SOLUSD", "price": 186.07, "changePercentage": 0.12 },
  { "symbol": "XRPUSD", "price": 0.5909, "changePercentage": 0.36 }
];

const FALLBACK_INSIDER = [
  { "symbol": "AAPL", "transactionType": "P-Purchase", "securitiesTransacted": 10000, "price": 170.5, "reportingName": "Tim Cook", "transactionDate": "2025-10-20" },
  { "symbol": "MSFT", "transactionType": "S-Sale",     "securitiesTransacted": 5000,  "price": 406.2, "reportingName": "Satya Nadella", "transactionDate": "2025-10-21" }
];

const FALLBACK_SPY_1H = [
  { "datetime": "2025-10-28T14:00:00Z", "open": 428.10, "high": 429.30, "low": 427.80, "close": 428.95, "volume": 915000 },
  { "datetime": "2025-10-28T15:00:00Z", "open": 428.95, "high": 429.40, "low": 428.20, "close": 428.70, "volume": 870000 }
];

const FALLBACK_BTC_1H = [
  { "datetime": "2025-10-29T06:00:00Z", "open": 109500, "high": 110200, "low": 109300, "close": 109900, "volume": 32 },
  { "datetime": "2025-10-29T07:00:00Z", "open": 109900, "high": 110050, "low": 109600, "close": 109810, "volume": 28 },
  { "datetime": "2025-10-29T08:00:00Z", "open": 109810, "high": 110000, "low": 109700, "close": 109820, "volume": 19 }
];

const FALLBACK_CALENDAR = [
  { "country": "US", "event": "FOMC Interest Rate Decision", "datetime": "2025-10-30T18:00:00Z", "actual": null, "forecast": "5.50%", "previous": "5.50%", "impact": "High" },
  { "country": "TR", "event": "TCMB Politika Faizi", "datetime": "2025-11-21T11:00:00Z", "actual": null, "forecast": "45.00%", "previous": "45.00%", "impact": "High" }
];
// === (FMP v3.2) SONU ===


// === (Tam Liste v1.0) GÜVENLİ FMP FETCH FONKSİYONU ===
/**
 * FMP API'sine zaman aşımı (timeout) ve sinyal (abort) ile güvenli bir fetch çağrısı yapar.
 * (v3.2) 'fallbackConst' (hardcoded JSON) kullanacak şekilde güncellendi.
 * @param {string} url - Çağrılacak FMP URL'i
 * @param {Array<object>} fallbackConst - Başarısızlık durumunda yüklenecek hardcoded JSON verisi
 * @param {number} [cacheTime=600] - Next.js revalidate süresi (saniye)
 */
async function fetchFMP(url, fallbackConst, cacheTime = 600) {
    try {
        if (!FMP_API_KEY) {
            logger.warn('FMP_API_KEY eksik. Hardcoded Fallback kullanılıyor.');
            return fallbackConst;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), FMP_TIMEOUT_MS);

        const response = await fetch(`${url}&apikey=${FMP_API_KEY}`, { 
            next: { revalidate: cacheTime },
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
            logger.warn(`FMP API Hata Kodu: ${response.status} (${url}). Hardcoded Fallback kullanılıyor.`);
            return fallbackConst;
        }
        
        const data = await response.json();

        // Basic Plan HTTP 200 ama [] (boş veri) dönerse Hardcoded Fallback kullan (Madde 3.0 / v3.2)
        if (Array.isArray(data) && data.length === 0) {
            logger.warn(`FMP API boş dizi [] döndürdü (${url}). Hardcoded Fallback kullanılıyor.`);
            return fallbackConst;
        }
        
        // (Madde 2.1) Veri geldiyse, normalize et (string % -> number)
        if (Array.isArray(data) && data.length > 0) {
             // 'changesPercentage' alanı varsa, string'den (% işaretini kaldırarak) sayıya çevir
            if (data[0].hasOwnProperty('changesPercentage')) {
                return data.map(item => ({
                    ...item,
                    changesPercentage: parseFloat(String(item.changesPercentage).replace('%', ''))
                }));
            }
        }
        
        return Array.isArray(data) ? data : []; // Beklenmeyen (boş olmayan) format gelirse boş döndür

    } catch (error) {
        if (error.name === 'AbortError') {
            logger.error(`FMP API Timeout (${FMP_TIMEOUT_MS}ms) (${url}). Hardcoded Fallback kullanılıyor.`);
        } else {
            logger.error(`FMP API fetch exception (${url}). Hardcoded Fallback kullanılıyor.`, error.message);
        }
        return fallbackConst;
    }
}
// === (FMP v3.2) SONU ===


// --- HARİCİ VERİ ÇEKME FONKSİYONLARI (MARKET PULSE İÇİN) ---

async function fetchFearGreedIndex() {
    try {
        const response = await fetch("https://api.alternative.me/fng/?limit=1", { next: { revalidate: 300 } });
        if (!response.ok) throw new Error('Fear & Greed API failed');
        const data = await response.json();
        return data.data[0];
    } catch (error) {
        logger.error("Fear & Greed Index fetch error:", error);
        return { value: '50', value_classification: 'Neutral' }; // Fallback
    }
}


// === (FMP v3.3 - Canlı Veri Pivotu) ===

// (Madde 2.1) Gainers - (v3.3) FMP'de kaldı (Ücretsiz alternatif yok)
async function fetchFMPGainers() {
    const url = `${FMP_BASES.v3}/stock_market/gainers?limit=10`;
    return fetchFMP(url, FALLBACK_GAINERS); // (v3.2)
}

// (Madde 2.1 / v3.1) Losers - (v3.3) FMP'de kaldı (Ücretsiz alternatif yok)
async function fetchFMPLosers() {
    // (v3.1 Düzeltmesi) .../stable/biggest-losers -> v3/stock_market/losers
    const url = `${FMP_BASES.v3}/stock_market/losers?limit=10`;
    return fetchFMP(url, FALLBACK_LOSERS); // (v3.2)
}

// (Madde 2.5 / v3.3) Sektör Performansı -> Alpha Vantage (CANLI)
async function fetchFMPSectorPerformance() {
    try {
        if (!ALPHA_VANTAGE_API_KEY) {
            logger.warn('Alpha Vantage API Key (SECTOR) eksik. Hardcoded Fallback kullanılıyor.');
            return FALLBACK_SECTORS;
        }
        
        const url = `https://www.alphavantage.co/query?function=SECTOR&apikey=${ALPHA_VANTAGE_API_KEY}`;
        const response = await fetch(url, { next: { revalidate: CACHE_TTL.SNAPSHOT / 1000 } }); // 10dk cache
        
        if (!response.ok) {
            throw new Error(`Alpha Vantage SECTOR API Hata Kodu: ${response.status}`);
        }
        
        const data = await response.json();

        if (data['Note'] || data['Error Message']) {
            logger.warn(`Alpha Vantage (SECTOR) Hata/Limit: ${data['Note'] || data['Error Message']}. Fallback kullanılıyor.`);
            return FALLBACK_SECTORS;
        }

        // (Seçenek B) Veri Adaptasyonu (Mapper)
        const rankB = data['Rank B: 1 Day Performance'];
        if (!rankB) {
            logger.warn('Alpha Vantage SECTOR yanıtında "Rank B" alanı bulunamadı. Fallback kullanılıyor.');
            return FALLBACK_SECTORS;
        }

        const sectors = Object.keys(rankB).map(sectorName => ({
            sector: sectorName,
            // '1.25%' string'ini 1.25 sayısına çevir
            changesPercentage: parseFloat(String(rankB[sectorName]).replace('%', ''))
        }));

        logger.info('Alpha Vantage SECTOR verisi (CANLI) çekildi.');
        return sectors;

    } catch (error) {
        logger.error('Alpha Vantage SECTOR fetch exception. Hardcoded Fallback kullanılıyor.', error.message);
        return FALLBACK_SECTORS;
    }
}

// (Madde 2.2) Kripto Fiyatları - (v3.3) FMP'de kaldı
async function fetchFMPCryptoQuotes() {
    const symbols = 'BTCUSD,ETHUSD,AVAXUSD,SOLUSD,XRPUSD,DOGEUSD';
    const url = `${FMP_BASES.v3}/quotes/crypto?symbol=${symbols}`;
    return fetchFMP(url, FALLBACK_CRYPTO_QUOTES); // (v3.2)
}

// (Madde 2.6) Insider Trading - (v3.3) FMP'de kaldı (SEC API (ATOM/XML) implementasyonu kompleks)
async function fetchFMPInsiderTrading() {
    const url = `${FMP_BASES.v3}/insider-trading?limit=10`;
    return fetchFMP(url, FALLBACK_INSIDER); // (v3.2)
}

// (Madde 2.3 / v3.3) SPY 1-Saatlik Grafik -> Alpha Vantage (CANLI)
async function fetchFMP_SPY_1H() {
    try {
        if (!ALPHA_VANTAGE_API_KEY) {
            logger.warn('Alpha Vantage API Key (SPY 1H) eksik. Hardcoded Fallback kullanılıyor.');
            return FALLBACK_SPY_1H;
        }

        // (Seçenek B) TIME_SERIES_INTRADAY (60min)
        const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=SPY&interval=60min&outputsize=compact&apikey=${ALPHA_VANTAGE_API_KEY}`;
        const response = await fetch(url, { next: { revalidate: CACHE_TTL.SNAPSHOT / 1000 } }); // 10dk cache
        
        if (!response.ok) {
            throw new Error(`Alpha Vantage SPY_1H API Hata Kodu: ${response.status}`);
        }
        
        const data = await response.json();

        if (data['Note'] || data['Error Message']) {
            logger.warn(`Alpha Vantage (SPY 1H) Hata/Limit: ${data['Note'] || data['Error Message']}. Fallback kullanılıyor.`);
            return FALLBACK_SPY_1H;
        }
        
        // (Seçenek B) Veri Adaptasyonu (Mapper)
        const timeSeries = data['Time Series (60min)'];
        if (!timeSeries) {
            logger.warn('Alpha Vantage SPY_1H yanıtında "Time Series (60min)" alanı bulunamadı. Fallback kullanılıyor.');
            return FALLBACK_SPY_1H;
        }

        const chartData = Object.keys(timeSeries).map(datetime => ({
            datetime: new Date(datetime).toISOString(),
            // (v3.3) AV '4. close' alanını kullan
            close: parseFloat(timeSeries[datetime]['4. close'])
        }));

        logger.info('Alpha Vantage SPY_1H verisi (CANLI) çekildi.');
        return chartData.reverse(); // AV en yeni veriyi başta verir, grafik için ters çevir

    } catch (error) {
        logger.error('Alpha Vantage SPY_1H fetch exception. Hardcoded Fallback kullanılıyor.', error.message);
        return FALLBACK_SPY_1H;
    }
}

// (Madde 2.2 / v3.3) BTC 1-Saatlik Grafik -> CoinGecko (CANLI)
async function fetchFMP_BTC_1H() {
    try {
        // (Seçenek B) CoinGecko Market Chart (hourly)
        // (v3.3) days=2 (48 bar) istiyoruz
        const url = `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=2&interval=hourly`;
        const response = await fetch(url, { next: { revalidate: CACHE_TTL.SNAPSHOT / 1000 } }); // 10dk cache
        
        if (!response.ok) {
            throw new Error(`CoinGecko BTC_1H API Hata Kodu: ${response.status}`);
        }
        
        const data = await response.json();
        
        // (Seçenek B) Veri Adaptasyonu (Mapper)
        if (!data.prices || data.prices.length === 0) {
            logger.warn('CoinGecko BTC_1H yanıtında "prices" alanı bulunamadı. Fallback kullanılıyor.');
            return FALLBACK_BTC_1H;
        }

        const chartData = data.prices.map(pricePoint => ({
            datetime: new Date(pricePoint[0]).toISOString(), // [0] = timestamp
            close: parseFloat(pricePoint[1]) // [1] = price
        }));
        
        logger.info('CoinGecko BTC_1H verisi (CANLI) çekildi.');
        return chartData;

    } catch (error) {
        logger.error('CoinGecko BTC_1H fetch exception. Hardcoded Fallback kullanılıyor.', error.message);
        return FALLBACK_BTC_1H;
    }
}

// (Madde 2.4) Ekonomik Takvim - (v3.3) FMP'de kaldı
async function fetchFMP_Calendar() {
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // (Madde 2.4) v3 takvim ucu
    const url = `${FMP_BASES.v3}/economic_calendar?from=${today}&to=${nextWeek}`;
    
    // (Madde 2.4) TRT Normalizasyonu
    // (v3.2) 'fetchFMP' çağrısı güncellendi
    const rawData = await fetchFMP(url, FALLBACK_CALENDAR, CACHE_TTL.SNAPSHOT / 1000);
    
    if (!Array.isArray(rawData)) return [];
    
    return rawData.map(event => {
        try {
            // (v3.2) Fallback'ten (datetime) veya Canlı'dan (date+time) gelen saati işle
            let isoString;
            if (event.datetime) { // Fallback (v3.2)
                isoString = event.datetime;
            } else if (event.date) { // Canlı (v3.1)
                const eventTime = event.time || '00:00';
                isoString = `${event.date}T${eventTime}Z`; // Saatin UTC olduğunu varsay (Madde 2.4)
            } else {
                return null; // Geçersiz veri
            }

            const eventDate = new Date(isoString);
            
            // Europe/Istanbul (TRT) formatına çevir
            const formattedDate = eventDate.toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul' });
            const formattedTime = eventDate.toLocaleTimeString('tr-TR', { timeZone: 'Europe/Istanbul', hour: '2-digit', minute: '2-digit' });
            
            return {
                ...event,
                date: formattedDate,
                time: formattedTime,
            };
        } catch (e) {
            logger.error('Ekonomik Takvim saati (TRT) parse hatası:', event);
            return null;
        }
    }).filter(Boolean); // Hatalı parse edilenleri (null) filtrele
}

// === (FMP v3.3) SONU ===


// --- CANLI ENDEKS/EMTİA/PARİTE VERİSİNİ ÇEKEN FONKSİYON (TICKER BANDI İÇİN) ---
// (Plandan etkilenmedi, KORUNDU)
async function fetchAlphaVantageData() {
// ... (Alpha Vantage kodu v2.4'teki gibi, değişiklik yok) ...
    const symbols = ['GLD', 'SPY', 'EURUSD'];

    if (!ALPHA_VANTAGE_API_KEY) {
        logger.warn("Alpha Vantage API Key ENV'de bulunamadı. Simüle edilmiş piyasa verileri kullanılıyor.");
        
        const simulatedData = [
            { symbol: 'XAU/USD', price: 2350.75, change: -0.15, isUp: false },
            { symbol: 'SPX', price: 5420.75, change: 0.55, isUp: true },
            { symbol: 'NAS100', price: 19875.20, change: 2.10, isUp: true },
            { symbol: 'USD/TRY', price: 32.8550, change: 0.05, isUp: false },
            { symbol: 'DXY', price: 105.28, change: -0.02, isUp: false },
        ];
        return simulatedData.map(item => ({
            ...item,
            price: item.price + (Math.random() - 0.5) * (item.price * 0.0001), 
            change: item.change + (Math.random() - 0.5) * 0.05,
        }));
    }

    logger.info("Alpha Vantage API Anahtarı mevcut. Canlı veri çekiliyor (3 kritik parite).");

    const fetchPromises = symbols.map(symbol => {
        const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
        
        return fetch(url, { next: { revalidate: CACHE_TTL.LIVE / 1000 } }) // (Tam Liste v1.0) Cache TTL
            .then(res => res.json())
            .then(data => {
                const quote = data['Global Quote'];
                if (data['Note'] || data['Error Message']) {
                    logger.error(`Alpha Vantage Limit Hit or Error for ${symbol}: ${data['Note'] || data['Error Message']}`);
                    return null;
                }
                
                if (quote && quote['05. price']) {
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
                return null;
            })
            .catch(error => {
                logger.error(`Alpha Vantage fetch error for ${symbol}:`, error);
                return null;
            });
    });

    const results = await Promise.allSettled(fetchPromises);
    
    return results
        .filter(result => result.status === 'fulfilled' && result.value !== null)
        .map(result => result.value);
}

// --- CANLI TİCKER VERİSİNİ ÇEKEN ANA FONKSİYON (TICKER BANDI İÇİN) ---
// (Plandan etkilenmedi, KORUNDU)
async function fetchLiveTickerData() {
// ... (CoinGecko kodu v2.4'teki gibi, değişiklik yok) ...
    const coinIds = 'bitcoin,ethereum,solana,bnb,ripple,cardano';
    const cryptoUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd&include_24hr_change=true`;

    let cryptoData = [];
    let marketData = [];

    try {
        const cryptoResponse = await fetch(cryptoUrl, { next: { revalidate: CACHE_TTL.LIVE / 1000 } }); // (Tam Liste v1.0) Cache TTL
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
        logger.error("CoinGecko fetch error:", error);
    }

    try {
        marketData = await fetchAlphaVantageData();
    } catch (error) {
        // Hata zaten fetchAlphaVantageData içinde yönetiliyor
    }

    const combinedData = [...cryptoData, ...marketData];
    
    if (combinedData.length === 0) {
        return [
            { symbol: 'SYNARA', price: 99.99, change: 0.00, isUp: true },
        ];
    }
    
    return combinedData;
}


// --- ANA PİYASA VERİSİ ÇEKME VE CACHE FONKSİYONU (DASHBOARD İÇİN) ---
// === (Tam Liste v1.0 / v3.2) GÜNCELLENDİ ===
async function fetchAndCacheMarketInfo() {
    const cachedData = MARKET_DATA_CACHE.get(CACHE_KEY);
    if (cachedData) {
        // logger.info("Market verisi cache'den okundu.");
        return cachedData;
    }

    try {
        // Promise.all, (Tam Liste v1.0) planına göre güncellendi
        // (v3.3) Sektörler, SPY 1H, BTC 1H artık AV/CG'den geliyor.
        const [
            fearGreedData, 
            gainersData,             // (v1.0) v3/stock_market/gainers (Fallback)
            losersData,              // (v1.0 / v3.1) v3/stock_market/losers (Fallback)
            sectorPerformanceData,   // (v3.3) AV SECTOR (Canlı)
            cryptoQuotesData,        // (v1.0) v3/quotes/crypto (Fallback)
            insiderTradingData,      // (v1.0) v3/insider-trading (Fallback)
            spyChartData,            // (v3.3) AV SPY 1H (Canlı)
            btcChartData,            // (v3.3) CG BTC 1H (Canlı)
            calendarData             // (v1.0) v3/economic_calendar (Fallback)
        ] = await Promise.all([
            fetchFearGreedIndex(),
            fetchFMPGainers(),
            fetchFMPLosers(),
            fetchFMPSectorPerformance(),
            fetchFMPCryptoQuotes(),
            fetchFMPInsiderTrading(),
            fetchFMP_SPY_1H(),
            fetchFMP_BTC_1H(),
            fetchFMP_Calendar()
        ]);
        
        const marketData = {
            fearGreedData,
            activesData: { 
                topGainers: gainersData,
                topLosers: losersData
            },
            sectorPerformanceData,
            cryptoQuotesData,
            insiderTradingData,
            spyChartData,            // (v3.3)
            btcChartData,            // (v3.3)
            calendarData,            // (v1.0)
            snapshotTimestamp: new Date().toISOString() // (Madde 3.0)
        };
        
        MARKET_DATA_CACHE.set(CACHE_KEY, marketData);
        
        // Loglama (Tam Liste v1.0) göre güncellendi (Madde 8.0)
        logger.info('Yeni market verileri (FMP v3.3 - AV/CG Pivot) çekildi ve önbelleğe alındı.', {
            fearGreed: fearGreedData?.value || 'N/A',
            gainersCount: gainersData?.length || 0,
            losersCount: losersData?.length || 0,
            sectorCount: sectorPerformanceData?.length || 0,
            cryptoCount: cryptoQuotesData?.length || 0,
            insiderCount: insiderTradingData?.length || 0,
            spyPoints: spyChartData?.length || 0,
            btcPoints: btcChartData?.length || 0,
            calendarEvents: calendarData?.length || 0,
            // (v3.3) Log Düzeltmesi: Canlı (AV/CG) veya Fallback (FMP) durumunu göster
            liveStatus: (sectorPerformanceData !== FALLBACK_SECTORS && spyChartData !== FALLBACK_SPY_1H && btcChartData !== FALLBACK_BTC_1H) ? 'AV/CG Canlı' : 'Fallback/Hata',
            fmpStatus: (gainersData !== FALLBACK_GAINERS && calendarData !== FALLBACK_CALENDAR) ? 'FMP Canlı' : 'FMP Fallback'
        });
        
        return marketData;
    } catch (error) {
        logger.error("Market data fetch failed:", error); 
        throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Piyasa verileri harici servislerden alınamadı.',
        });
    }
}
// === (Tam Liste v1.0) SONU ===


export const marketRouter = router({
    
    // YENİ EKLENEN PROSEDÜR: Canlı Ticker Verisi (Haberler sayfasındaki bant için)
    // (KORUNDU - Eksiltilmedi)
    getLiveTickerData: publicProcedure
        .query(async ({ ctx }) => {
            return await fetchLiveTickerData();
        }),
        
    // Dashboard ve Market Pulse tarafından kullanılan temel market verilerini çeker.
    // ((Tam Liste v1.0)'e göre güncellendi)
    getLatestMarketInfo: publicProcedure.query(async ({ ctx }) => { 
        return await fetchAndCacheMarketInfo();
    }),
});

