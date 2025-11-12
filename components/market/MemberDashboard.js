'use client';
import React, { useMemo, useState, useEffect } from 'react'; // useRef kaldırıldı
import { trpc } from '@/lib/trpc/client';
import { 
    Database, 
    Zap,
    BarChart3, 
    BrainCircuit, 
    Loader2,
    Target, // Yeni ikon: Terminal için
    Bell,
    Globe, // Yeni ikon: Seans takibi için
    Clock // Yeni ikon: Zaman sayacı için
} from 'lucide-react'; 
import { motion, AnimatePresence } from 'framer-motion';
import { logger } from '@/lib/Logger';
import SkeletonLoader from '@/components/SkeletonLoader';
import { useAuth } from '@/context/AuthContext'; // KRİTİK: Kullanıcı verisini çekmek için eklendi

// (FMP v4.1) Refactor
// (FMP v1.5) Görsel İyileştirme (Fütüristik Tema)
// (FMP v1.6) Seans Zaman Çizelgesi Güncellemesi
// (FMP v1.7) Refactor (Seanslar Ayrıldı) + Hata Düzeltmesi (isDataReady)
// (FMP v1.8) KRİTİK HATA PROTOKOLÜ: Çocuk bileşenlere giden prop'lara defensive guard eklendi.
// (FMP v1.9) KRİTİK HATA DÜZELTMESİ: MarketSessionsWidget.js içindeki hata için defensive prop gönderimi.
// (v4.2) OPTİMİZASYON: refetchOnWindowFocus false yapıldı.
// (v4.3) YENİLEME: HolographicTerminal artık seans odaklı.

// (v4.1) YENİ IMPORT: Ayrılmış Tablo Widget'ı
import TabbedDataWidget from './TabbedDataWidget';
// === GÜNCELLEME v1.7 (Ayırılmış Bileşenler) ===
import FearGreedWidget from './FearGreedWidget';
import MiniChartWidget from './MiniChartWidget';
import SynaraAssistantWidget from './SynaraAssistantWidget';
import MarketSessionsWidget from './MarketSessionsWidget';
// === GÜNCELLEME v1.7 SONU ===


// === WIDGET STİL SABİTLERİ (v1.5) ===
// Düzeltme: Stil sabitleri artık dışa aktarılıyor.
export const WIDGET_BASE_CLASSES = "bg-[#111827]/70 backdrop-blur-sm p-6 rounded-xl shadow-2xl transition-all duration-300 border border-indigo-700/50 hover:shadow-cyan-500/50";
export const WIDGET_HEADER_CLASSES = "flex items-center space-x-3 border-b border-indigo-700/50 pb-4 mb-4";
// === STİL SONU ===


logger.setContext({ path: 'MemberDashboard' });

// --- YARDIMCI SABİT: PİYASA SEANSLARI (TRT) ---
// Not: Bu basit listeleme, MarketSessionsWidget'taki detaylı mantığı kopyalamaz, sadece Terminal için özet bilgi sağlar.
const MARKET_SESSIONS = [
    // Saatler TRT (UTC+3) baz alınmıştır.
    { name: 'Tokyo', open: '03:00', close: '12:00', type: 'Asya' },
    { name: 'Londra', open: '10:00', close: '19:00', type: 'Avrupa' },
    { name: 'New York', open: '16:30', close: '23:00', type: 'Amerika' },
];

/**
 * UTC zaman damgasını TRT'ye (UTC+3) çevirip formatlar.
 * @param {string} timestamp - UTC formatında zaman damgası.
 * @returns {string} - HH:MM:SS (TRT) formatında zaman.
 */
const formatSnapshotTime = (timestamp) => {
    if (!timestamp) return null;
    try {
        // Sunucudan gelen UTC zamanını TRT'ye (UTC+3) çevirip formatlar
        return new Date(timestamp).toLocaleTimeString('tr-TR', { 
            timeZone: 'Europe/Istanbul', 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        });
    } catch (e) {
        logger.error("Snapshot zamanı formatlanamadı:", e);
        return 'N/A';
    }
};

// --- YARDIMCI FONKSİYON: SEANS DURUMUNU BELİRLE ---
// Sadece Terminal için özet seans durumunu hesaplar.
const getSessionStatus = (nowTRT) => {
    const nowHours = nowTRT.getHours();
    const nowMinutes = nowTRT.getMinutes();
    const nowTimeInMinutes = nowHours * 60 + nowMinutes;
    const totalMinutesInDay = 24 * 60;

    let nextSession = null;
    let currentStatus = { name: 'Kapalı', type: 'Kapalı', time: 'Açılış Bekleniyor', notes: 'Küresel piyasalar beklemede.' };
    let minTimeDiff = Infinity;

    // Seansları döngüye al
    for (const session of MARKET_SESSIONS) {
        const [openHour, openMinute] = session.open.split(':').map(Number);
        const [closeHour, closeMinute] = session.close.split(':').map(Number);
        
        const openTime = openHour * 60 + openMinute;
        const closeTime = closeHour * 60 + closeMinute;

        // 1. Durum: Açık Seans Kontrolü
        if (nowTimeInMinutes >= openTime && nowTimeInMinutes < closeTime) {
            const minutesLeft = closeTime - nowTimeInMinutes;
            const hoursLeft = Math.floor(minutesLeft / 60);
            const remainingMinutes = minutesLeft % 60;

            currentStatus = { 
                name: session.name, 
                type: 'Açık', 
                time: `${hoursLeft}s ${remainingMinutes}dk Kapanış`, 
                notes: `${session.name} seansı aktif, likidite yüksek. Dikkatini SPY ve BTC grafiklerine ver.` 
            };
            // Açık seans varsa, sonraki seansı aramaya gerek yok.
            return { currentStatus, nextSession: null }; 
        } 
        
        // 2. Durum: Kapalı Seans Kontrolü (Sonraki Seansı Bul)
        let timeDiff;
        
        if (nowTimeInMinutes < openTime) {
            // Aynı gün açılacak (en yakın)
            timeDiff = openTime - nowTimeInMinutes;
        } else {
            // Ertesi gün açılacak
            // Toplam dakika (24 * 60) + Açılış - Şimdiki zaman
            timeDiff = totalMinutesInDay - nowTimeInMinutes + openTime; 
        }

        if (timeDiff < minTimeDiff) {
            minTimeDiff = timeDiff;
            
            // Kalan süreyi hesapla
            const nextOpenTime = new Date(nowTRT);
            nextOpenTime.setHours(openHour, openMinute, 0, 0);

            if (timeDiff >= totalMinutesInDay) { 
                // Eğer kalan süre 24 saatten fazlaysa (yani ertesi günün seansı)
                nextOpenTime.setDate(nextOpenTime.getDate() + 1);
            }

            nextSession = { 
                name: session.name, 
                type: 'Açılış', 
                time: nextOpenTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
                diffMinutes: timeDiff
            };
        }
    }
    
    const minutesLeft = minTimeDiff % 60;
    const hoursLeft = Math.floor(minTimeDiff / 60);

    // Kapalı durumun notunu, en yakın sonraki seansa göre güncelle
    if (nextSession) {
        currentStatus.notes = `Sonraki Açılış: ${nextSession.name} - ${nextSession.time} (TRT). ${hoursLeft}s ${minutesLeft}dk kaldı.`;
    }

    return { currentStatus, nextSession };
};


// --- YARDIMCI BİLEŞEN: HolographicTerminal ---
const HolographicTerminal = ({ userName, nowTRT, fearGreedIndex }) => {
    
    // Anlık seans durumunu hesapla
    const { currentStatus, nextSession } = useMemo(() => getSessionStatus(nowTRT), [nowTRT]);
    
    // Sentimetreye göre dinamik renk ve ikonu belirle (Görsel risk uyarısı için)
    const { sentimentColor, sentimentIcon } = useMemo(() => {
        const value = fearGreedIndex ? parseInt(fearGreedIndex, 10) : 50;
        if (value >= 75) return { sentimentColor: "text-red-400 border-red-700 bg-red-900/10", sentimentIcon: <Bell /> };
        if (value >= 55) return { sentimentColor: "text-orange-400 border-orange-700 bg-orange-900/10", sentimentIcon: <Bell /> };
        if (value >= 25) return { sentimentColor: "text-cyan-400 border-cyan-700 bg-cyan-900/10", sentimentIcon: <Clock /> };
        if (value < 25) return { sentimentColor: "text-green-400 border-green-700 bg-green-900/10", sentimentIcon: <Target /> };
        return { sentimentColor: "text-gray-400 border-gray-700 bg-gray-900/10", sentimentIcon: <Clock /> };
    }, [fearGreedIndex]);

    // Terminal Mesajını oluştur
    const terminalMessage = useMemo(() => {
        const baseMessage = `${userName}, Synara Nexus Terminali aktif.`;
        
        if (currentStatus.type === 'Açık') {
            return `[CANLI] ${currentStatus.name} Seansı Aktif: Kapanışa ${currentStatus.time} kaldı. ${currentStatus.notes}`;
        } 
        
        if (nextSession) {
            const minutesLeft = nextSession.diffMinutes % 60;
            const hoursLeft = Math.floor(nextSession.diffMinutes / 60);
            
            // Eğer saat farkı 0 ise sadece dakikayı göster
            const timeRemaining = hoursLeft > 0 ? `${hoursLeft}s ${minutesLeft}dk` : `${minutesLeft}dk`;

            return `${baseMessage} Sonraki Açılış: ${nextSession.name} (${nextSession.time} TRT). ${timeRemaining} kaldı. Hazırlıklarını tamamla.`;
        }
        
        return `${baseMessage} ${currentStatus.notes}`; // Varsayılan kapalı mesajı
    }, [userName, currentStatus, nextSession]);

    // Terminalin genel stil sınıfı
    const finalClass = `${sentimentColor} transition-colors duration-500`;

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, type: "spring", damping: 10 }}
            className={`flex items-center p-4 mb-6 rounded-lg border-l-8 font-mono shadow-xl ${finalClass}`}
        >
            {currentStatus.type === 'Açık' ? <Zap className="w-6 h-6 mr-3 flex-shrink-0 animate-pulse" /> : sentimentIcon}
            <span className="text-sm md:text-md font-semibold tracking-wider">
                {terminalMessage}
            </span>
            <Globe className={`w-5 h-5 ml-auto text-indigo-400`} />
        </motion.div>
    );
};
// --- YARDIMCI BİLEŞEN SONU ---


// --- ANA KOMPONENT ---
export default function MemberDashboard({ preloadedMarketData }) {
    // KRİTİK: Kullanıcı bilgisini çekmek için useAuth kullanıldı
    const { user } = useAuth();
    const userName = user?.displayName || user?.email?.split('@')[0] || "Komutan";

    // Veri çekme ve önbellekleme
    const { data: marketData, isLoading: isLoadingMarket, isError, error } = trpc.market.getLatestMarketInfo.useQuery(undefined, {
        initialData: preloadedMarketData,
        // === OPTİMİZASYON (v4.2): Pencere odağında gereksiz çağrıyı engeller ===
        refetchOnWindowFocus: false, 
        staleTime: 1000 * 60, // 1 dakika (Piyasa akışı için daha agresif zaman)
    });

    // Anlık TRT zamanı (MarketSessionsWidget ve Terminal için)
    const [nowTRT, setNowTRT] = useState(() => new Date()); 
    
    useEffect(() => {
        const timer = setInterval(() => {
            setNowTRT(new Date()); 
        }, 1000); 
        return () => clearInterval(timer);
    }, []);
    
    // Önbellek zamanını hesaplama
    const snapshotTime = useMemo(() => {
        return formatSnapshotTime(marketData?.snapshotTimestamp);
    }, [marketData?.snapshotTimestamp]);


    // KRİTİK: Yükleme durumunda yerel SkeletonLoader kullanımı
    // NOT: Ana yükleme (loading) MarketPulsePage içinde handle edilmelidir.
    if (isLoadingMarket && !preloadedMarketData) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`${WIDGET_BASE_CLASSES.replace('p-6', 'p-4')} h-96`}>
                    <SkeletonLoader count={8} />
                </div>
                <div className={`${WIDGET_BASE_CLASSES.replace('p-6', 'p-4')} h-96`}>
                    <SkeletonLoader count={8} />
                </div>
                 <div className={`${WIDGET_BASE_CLASSES.replace('p-6', 'p-4')} h-96`}>
                    <SkeletonLoader count={8} />
                </div>
            </div>
        );
    }

    // Hata Durumu Kontrolü
    if (isError) {
        logger.error('Market Pulse tRPC Hata:', error);
        return (
            <div className={`${WIDGET_BASE_CLASSES} text-red-400`}>
                Piyasa verileri yüklenirken bir hata oluştu: {error.message}
            </div>
        );
    }
    
    // Veri Yok (Initial Data)
    if (!marketData) {
        return (
            <div className={`${WIDGET_BASE_CLASSES} text-gray-400 flex items-center justify-center h-48`}>
                <Loader2 className="w-5 h-5 mr-2 animate-spin text-cyan-400" />
                Piyasa verileri yükleniyor...
            </div>
        );
    }

    // Veri Hazırlık Kontrolü (Hayati verilerin kontrolü)
    const isDataReady = marketData.activesData && 
                            marketData.sectorPerformanceData && 
                            marketData.cryptoQuotesData && 
                            marketData.insiderTradingData && 
                            marketData.spyChartData && 
                            marketData.btcChartData && 
                            marketData.calendarData &&
                            marketData.fearGreedData; 

    if (!isDataReady) {
        return (
             <div className={`${WIDGET_BASE_CLASSES} flex items-center justify-center h-64 text-cyan-400 font-mono`}>
                <Database className="w-6 h-6 mr-2 animate-pulse" />
                (Sunucu (AV/CG) verileri bekleniyor...)
            </div>
        );
    }

    // --- RENDER ---
    return (
        <AnimatePresence>
            <motion.div 
                key="dashboard-content"
                className="space-y-6" // Yeni grid yapısı yerine space-y-6 kullandık, Terminali üste koymak için
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {/* YENİ EKLENTİ: HOLOGRAFİK TERMİNAL (Şimdi Seans Odaklı) */}
                <HolographicTerminal 
                    userName={userName} 
                    nowTRT={nowTRT} // Anlık zamanı gönderdik
                    fearGreedIndex={marketData.fearGreedData?.value} // Renk için Sentimetreyi koruduk
                />
                
                {/* Esnek ızgara yapısı (2/3 + 1/3) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Sol Sütun (2/3 Genişlik) */}
                    <div className="lg:col-span-2 space-y-6 lg:self-start">
                        
                        {/* 1. MarketSessionsWidget: Seans Takibi */}
                        <MarketSessionsWidget nowTRT={nowTRT} />
                        
                        {/* 2. FearGreedWidget: Duyarlılık Analizi */}
                        <FearGreedWidget fearGreedData={marketData.fearGreedData || {}} />
                        
                        {/* 3. Mini Grafikler (Yan Yana) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <MiniChartWidget 
                                title="S&P 500 (SPY)" 
                                symbol="SPY" 
                                chartData={marketData.spyChartData || []} 
                                colorClass="text-red-400"
                            />
                            <MiniChartWidget 
                                title="Bitcoin/USD" 
                                symbol="BTCUSD" 
                                chartData={marketData.btcChartData || []}
                                colorClass="text-yellow-400"
                            />
                        </div>
                    </div>

                    {/* Sağ Sütun (1/3 Genişlik) */}
                    <div className="lg:col-span-1 space-y-6 lg:self-start">
                        
                        {/* 4. SynaraAssistantWidget: AI Asistanı */}
                        <SynaraAssistantWidget marketData={marketData || {}} />

                        {/* 5. TabbedDataWidget: Tablolu Veri (Gainer/Loser, Takvim, Kripto Özet) */}
                        <TabbedDataWidget marketData={marketData || {}} />

                        {/* 6. Aksiyon Konsolu (Snapshot Bilgisi) */}
                        <div className={`${WIDGET_BASE_CLASSES} text-sm`}>
                            <h3 className={WIDGET_HEADER_CLASSES}>
                                <Zap className="w-5 h-5 mr-3 text-cyan-400" />
                                <span className="text-gray-200 text-lg font-semibold">Aksiyon Konsolu</span>
                            </h3>
                            {/* v1.0.5 - BUILD FIX: ' -> &apos; */}
                            <p className="text-gray-400 mt-2">
                                Piyasa verileri Synara&apos;nın (AV/CG) ve Fallback (JSON) entegga ile sağlanmaktadır. Bu, veri akışının güvenliğini ve sürekliliğini temin eder.
                            </p>
                            <button className="w-full mt-4 p-3 rounded-xl bg-cyan-600 text-white font-bold hover:bg-cyan-500 transition-colors shadow-lg hover:shadow-cyan-500/50">
                                Analiz Portföyünü Görüntüle
                            </button>
                            {snapshotTime && (
                                <div className="text-xs text-gray-500 text-center mt-3 pt-3 border-t border-indigo-700/50">
                                    Son Veri Önbellek Zamanı: {snapshotTime} (TRT)
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}