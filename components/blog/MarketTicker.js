// path: components/blog/MarketTicker.js
'use client';

import React, { useMemo } from 'react';
import Icon from '@/components/Icon';
import { motion } from 'framer-motion';
import { trpc } from '@/lib/trpc/client'; // tRPC istemcisi içe aktarıldı

/**
 * Tek bir borsa sembolünü temsil eden bileşen.
 */
const TickerItem = React.memo(({ data }) => {
    const { symbol, price, change, isUp } = data;
    
    // Yüzdesel değişime göre renk belirleme
    const changeClass = isUp 
        ? 'text-green-400' // Yükselişte: Yeşil
        : change < 0 
            ? 'text-red-500' // Düşüşte: Kırmızı
            : 'text-gray-400'; // Nötr/Hata: Gri

    // Simge seçimi
    const IconComponent = isUp ? 'ChevronUp' : 'ChevronDown';

    return (
        <div className="flex-shrink-0 min-w-[200px] md:min-w-[240px] px-4 py-1 flex items-center justify-between border-r border-indigo-900/30 hover:bg-gray-800 transition-colors cursor-pointer">
            <span className="text-sm font-semibold text-gray-200 tracking-wider pr-4">{symbol}</span>
            
            <div className="flex items-center space-x-2">
                {/* Fiyat gösterimi, isteğe bağlı neon parlama efekti */}
                <span className="text-base font-bold text-white animate-text-glow">
                    {price ? `$${price.toFixed(price > 100 ? 2 : 4)}` : 'N/A'}
                </span>

                {/* Yüzde değişimi ve simge */}
                <span className={`flex items-center text-xs font-medium ${changeClass}`}>
                    <Icon name={IconComponent} className="w-3 h-3 mr-1" />
                    {change.toFixed(2)}%
                </span>
            </div>
        </div>
    );
});
TickerItem.displayName = 'TickerItem';

/**
 * Ana Borsa Bandı (Ticker Tape) Bileşeni
 */
const MarketTicker = () => {
    // KRİTİK DEĞİŞİKLİK: Mock veri kaldırıldı, tRPC query eklendi.
    // Yenileme yapılmaz, sayfa ilk yüklendiğinde bir kez veri çekilir (Sunucu cache'i devrede).
    const { data: liveData, isLoading, isError } = trpc.market.getLiveTickerData.useQuery(undefined, {
        staleTime: Infinity, // Veri çekildikten sonra süresiz geçerli kabul edilir
        refetchOnWindowFocus: false, // Pencereye odaklanıldığında bile yeniden çekilmez
        refetchInterval: false, // Otomatik yenileme kapalı
    });

    // KRİTİK FİX: initialData'yı kendi useMemo'suna sararak referans değişikliği sorununu gideriyoruz.
    const initialData = useMemo(() => {
        // Boş bir dizi ile yedek veri sağlıyoruz (Veri olmadığı durumlarda boş bant kayar)
        return liveData || [
            { symbol: 'SYNC/UP', price: 0.00, change: 0.00, isUp: true },
            { symbol: 'DATA/FLOW', price: 0.00, change: 0.00, isUp: true },
        ];
    }, [liveData]); // Sadece liveData'nın kendisi değiştiğinde yeniden hesapla
    
    // Ticker verilerini iki kez kopyalayarak sürekli kaydırma efekti sağlar
    const duplicatedData = useMemo(() => [...initialData, ...initialData], [initialData]);
    
    if (isError) {
        // Hata durumunda bileşen yine de Fallback data ile (initialData) çalışır, 
        // ancak konsola hata log'u düşülür.
        console.error("MarketTicker Veri Hatası: Canlı Ticker verisi çekilemedi.");
    }
    
    // Veri yüklenirken veya Fallback data kullanılırken bile kaydırma devam eder.
    
    // YENİ EKLEME: Veri değiştiğinde animasyonu sıfırlamak için bir anahtar (key) oluştur
    const tickerKey = liveData ? 'live-data' : 'fallback-data';

    return (
        // Fütüristik tema için koyu arkaplan ve ince neon border
        <div className="w-full bg-gray-950/90 border-y border-indigo-700/50 overflow-hidden sticky top-0 z-30 shadow-2xl backdrop-blur-sm">
            
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-950/70 z-10">
                    <span className="text-xs text-indigo-400 animate-pulse">VERİ AKIŞI YÜKLENİYOR...</span>
                </div>
            )}

            <div className="h-12 flex items-center">
                
                {/* Kaydırma Efekti için motion.div kullanılır */}
                <motion.div
                    key={tickerKey} // KRİTİK FİX: Veri değiştiğinde (Fallback -> Live) animasyonu yeniden başlatır
                    className="flex"
                    animate={{ x: ['0%', '-50%'] }} // İlk setin bitiminden (2. setin başına) kaydır
                    transition={{ 
                        x: {
                            repeat: Infinity,
                            ease: 'linear',
                            duration: 40, // Daha yavaş kaydırma
                        },
                    }}
                >
                    {duplicatedData.map((data, index) => (
                        // data'nın kendisi değişse bile, bileşenin yeniden render edilmemesi için TickerItem kullanıldı
                        <TickerItem key={index} data={data} />
                    ))}
                </motion.div>
            </div>
        </div>
    );
};

export default MarketTicker;
