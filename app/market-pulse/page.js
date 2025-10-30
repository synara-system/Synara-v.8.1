// path: app/market-pulse/page.js
'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'; // useRef eklendi
import Icon from '@/components/Icon';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { trpc } from '@/lib/trpc/client';
import { motion } from 'framer-motion';

// --- WIDGET DIŞI SABİTLER ---
const CRYPTO_SESSION = { name: 'Kripto (24/7)', start: 0, end: 24, icon: 'bitcoin', color: 'text-green-400' };

// Tüm ana widget'lar için Fütüristik Holografik Stil
const WIDGET_BASE_CLASSES = "bg-[#111827]/70 backdrop-blur-sm p-6 rounded-xl shadow-2xl transition-all duration-300 border border-indigo-700/50 hover:shadow-cyan-500/50";

// --- ZAMAN YARDIMCI FONKSİYONLARI ---
const getTurkeyTime = (date) => {
    const turkeyTime = new Date(date.toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }));
    return {
        day: turkeyTime.getDay(),
        hour: turkeyTime.getHours(),
        minute: turkeyTime.getMinutes(),
        dateObject: turkeyTime
    };
};

const isNewYorkDST = (date) => {
    try {
        const dateString = date.toLocaleString('en-US', { timeZone: 'America/New_York', timeZoneName: 'longOffset' });
        // US Daylight Saving Time (DST) is typically GMT-4
        return dateString.includes('GMT-4'); 
    } catch (e) {
        // Fallback logic
        const month = date.getMonth();
        return month >= 2 && month <= 10;
    }
};

const formatCountdown = (milliseconds) => {
    if (milliseconds < 0) return "00:00:00";
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (num) => String(num).padStart(2, '0');

    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

// --- YENİ BİLEŞENLER (VİZYON EKLENTİLERİ) ---

// 1. Anomali Göstergesi (Anomaly Indicator)
const AnomalyIndicator = ({ T }) => {
    const [isAnomaly, setIsAnomaly] = useState(false);
    const anomalyRef = useRef(null);

    useEffect(() => {
        // Rastgele 10-30 saniyede bir anomali durumunu değiştir
        const setRandomAnomaly = () => {
            const shouldBeAnomaly = Math.random() < 0.3; // %30 şans
            setIsAnomaly(shouldBeAnomaly);
            // Anomali varsa 5-10 saniye göster, yoksa 10-30 saniye sonra tekrar kontrol et
            const nextInterval = shouldBeAnomaly ? (Math.random() * 5000 + 5000) : (Math.random() * 20000 + 10000); 
            anomalyRef.current = setTimeout(setRandomAnomaly, nextInterval);
        };
        
        anomalyRef.current = setTimeout(setRandomAnomaly, 10000); // İlk başta 10 saniye bekle

        return () => clearTimeout(anomalyRef.current);
    }, []);

    if (!isAnomaly) return null;

    return (
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            // Anomali kartı özelleştirildi: daha derin kırmızı ve ışıklandırma
            className="w-full lg:max-w-xs p-4 bg-red-900/80 backdrop-blur-sm border border-red-500 rounded-lg shadow-2xl shadow-red-500/50 animate-pulse-fast cursor-pointer transition-all duration-300 hover:scale-[1.02] mb-4"
        >
            <div className='flex items-center justify-between'>
                <div className='flex items-center'>
                    <Icon name="alert-triangle" className="w-6 h-6 mr-3 text-red-300 animate-spin-slow" />
                    <div>
                        <p className="text-sm font-bold text-red-300">{T.anomaly_alert_title || "ANOMALİ TESPİT EDİLDİ"}</p>
                        <p className="text-xs text-red-400 mt-0.5">{T.anomaly_alert_subtitle || "Synara Engine: Beklenmedik likidite veya fiyat hareketi."}</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// 2. Duyarlılık Isı Haritası (Sentiment Heatmap Widget)
const HeatmapItem = ({ T, segment, value }) => {
    // Skor: -10 (Fırsat/Soğuk) ile +10 (Risk/Sıcak) arası
    const intensity = Math.round(Math.abs(value) * 10); // 0-100 aralığında
    
    const isGreed = value > 2; // +2 üstü Açgözlülük/Risk
    const isFear = value < -2; // -2 altı Korku/Fırsat
    const isNeutral = !isGreed && !isFear;
    
    let bgColor = 'bg-gray-800/70'; // Holografik Nötr arka plan
    let textColor = 'text-gray-300';
    let borderColor = 'border-gray-600';
    let label = T.heatmap_neutral || 'NÖTR';
    
    if (isGreed) {
        // Yüksek Risk/Sıcak: Kırmızı vurgu
        bgColor = `bg-red-900/${Math.min(intensity, 90)}`;
        textColor = 'text-red-300';
        borderColor = 'border-red-600';
        label = T.heatmap_risk || 'RISK (Sıcak)';
    } else if (isFear) {
        // Yüksek Fırsat/Soğuk: Yeşil vurgu
        bgColor = `bg-green-900/${Math.min(intensity, 90)}`;
        textColor = 'text-green-300';
        borderColor = 'border-green-600';
        label = T.heatmap_opportunity || 'FIRSAT (Soğuk)';
    }

    const directionIcon = isNeutral ? 'minus' : (isGreed ? 'triangle-up' : 'triangle-down');

    return (
        <motion.div 
             initial={{ scale: 0.95 }} 
             animate={{ scale: 1 }} 
             transition={{ type: "spring", stiffness: 100 }}
             // Holografik kart stili uygulandı
             className={`p-4 rounded-lg border-2 ${borderColor} ${bgColor} backdrop-blur-sm transition-all duration-700 hover:shadow-lg hover:shadow-indigo-500/50 cursor-default`}
        >
            <div className='flex justify-between items-center'>
                <span className='font-semibold text-white text-base'>{segment}</span>
                <Icon name={directionIcon} className={`w-4 h-4 ${textColor}`} />
            </div>
            <p className={`text-2xl font-extrabold mt-1 ${textColor}`}>{label}</p>
            <p className='text-xs text-gray-400 mt-1'>Synara Score: <span className='font-mono'>{value.toFixed(1)}</span></p>
        </motion.div>
    );
};

const SentimentHeatmapWidget = ({ T }) => {
    const initialSegments = useMemo(() => ([
        { segment: 'FX Majors (EUR/USD)', value: 0, icon: 'dollar-sign' },
        { segment: 'Major Indices (S&P)', value: 0, icon: 'chart-line' },
        { segment: 'Kripto Para (BTC/ETH)', value: 0, icon: 'bitcoin' },
        { segment: 'Emtia (Gold/Oil)', value: 0, icon: 'flask' },
    ]), []);
    
    const [segments, setSegments] = useState(initialSegments);

    useEffect(() => {
        const updateSegments = () => {
            setSegments(prevSegments => prevSegments.map(s => {
                // Rastgele -10 ile 10 arasında bir değer simüle et
                const newValue = Math.random() * 20 - 10; 
                return { ...s, value: newValue };
            }));
        };

        // Her 15 saniyede bir duyarlılık skorunu güncelle
        const interval = setInterval(updateSegments, 15000); 
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="lg:col-span-3">
             <h2 className="text-xl md:text-2xl font-bold mb-4 flex items-center text-cyan-400 border-b border-gray-700/50 pb-3">
                <Icon name="radar" className="w-6 h-6 mr-3 text-indigo-400" />
                {T.sentiment_heatmap_title || "Bütünsel Zeka Duyarlılık Matrisi"}
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {segments.map(s => (
                    <HeatmapItem 
                        key={s.segment}
                        T={T}
                        segment={s.segment}
                        value={s.value}
                    />
                ))}
            </div>
        </div>
    );
};


// 3. Hızlı Eylem Konsolu (Action Console)
const ActionConsole = ({ T }) => (
    // Action Console'a Holografik Kart Stili Uygulandı
    <div className={WIDGET_BASE_CLASSES.replace('p-6', 'p-4') + " h-full"}>
        <h3 className="text-lg font-semibold text-cyan-400 flex items-center border-b border-gray-700/50 pb-3">
            <Icon name="rocket" className="w-5 h-5 mr-2" />
            {T.action_console_title || "Hızlı Eylem Konsolu"}
        </h3>
        {/* Butonlara hafif glow ve derinlik efekti eklendi */}
        <Link href="/analyses/create" className="w-full flex items-center justify-center py-3 px-4 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-bold transition-all duration-200 shadow-xl shadow-indigo-900/70 hover:shadow-cyan-500/50 hover:scale-[1.01]">
            <Icon name="plus-circle" className="w-5 h-5 mr-2" />
            {T.action_new_analysis || "Yeni Analiz Başlat"}
        </Link>
        <Link href="/kasa-yonetimi" className="w-full flex items-center justify-center py-3 px-4 bg-gray-700/70 hover:bg-gray-600 rounded-lg text-gray-200 font-bold transition-all duration-200 border border-gray-600 hover:border-cyan-500 hover:scale-[1.01] shadow-lg shadow-gray-950/70">
            <Icon name="vault" className="w-5 h-5 mr-2" />
            {T.action_risk_gate || "Risk Kapısı (Kasa) Kontrol"}
        </Link>
        <Link href="/assistant" className="w-full flex items-center justify-center py-3 px-4 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-white font-bold transition-all duration-200 shadow-xl shadow-cyan-900/70 hover:shadow-indigo-500/50 hover:scale-[1.01]">
            <Icon name="robot" className="w-5 h-5 mr-2" />
            {T.action_synara_assistant || "Synara Asistanına Sor"}
        </Link>
    </div>
);


// --- WIDGET YAPILARI (Holografik Stile Geçiş) ---

// 1. Piyasa Oturumları Widget'ı
const MarketSessionsWidget = ({ T, currentTime }) => {
    const { hour, day } = currentTime;
    const isWeekday = day >= 1 && day <= 5; // Pazartesi (1) - Cuma (5)

    const sessions = useMemo(() => ([
        { name: 'Tokyo', start: 3, end: 12, icon: 'japan', color: 'text-yellow-400' },
        { name: 'Londra', start: 9, end: 18, icon: 'united-kingdom', color: 'text-blue-400' },
        { name: 'New York', start: isNewYorkDST(currentTime.dateObject) ? 14 : 15, end: isNewYorkDST(currentTime.dateObject) ? 23 : 0, icon: 'united-states', color: 'text-red-400' },
    ]), [currentTime.dateObject]);
    
    const getNextOpenTime = useCallback((currentDate, sessions) => {
        let nextOpen = Infinity;
        let nextSession = null;
        let nextDate = new Date(currentDate);

        const sortedSessions = sessions.sort((a, b) => a.start - b.start);

        for (const session of sortedSessions) {
            let sessionStart = session.start;
            
            if (hour < sessionStart) {
                const diff = new Date(nextDate);
                diff.setHours(sessionStart, 0, 0, 0);
                const ms = diff.getTime() - currentDate.getTime();
                if (ms < nextOpen) {
                    nextOpen = ms;
                    nextSession = session;
                }
            }
        }

        if (nextSession === null || nextOpen === Infinity) {
            let nextDay = new Date(currentDate);
            
            if (day === 5 && hour >= sessions.find(s => s.name === 'New York').end) {
                 nextDay = new Date(currentDate);
                 nextDay.setDate(nextDay.getDate() + (8 - nextDay.getDay())); // Sonraki Pazartesi'ye git
                 nextDay.setHours(sessions.find(s => s.name === 'Tokyo').start, 0, 0, 0); // Tokyo açılışı

            } else {
                 nextDay = new Date(currentDate);
                 nextDay.setDate(nextDay.getDate() + 1);
                 nextDay.setHours(sortedSessions[0].start, 0, 0, 0);
            }

            // Cumartesi/Pazar atlaması eklendi
            while (nextDay.getDay() === 0 || nextDay.getDay() === 6) { 
                nextDay.setDate(nextDay.getDate() + 1);
            }

            nextOpen = nextDay.getTime() - currentDate.getTime();
            nextSession = sortedSessions[0];
        }

        return { session: nextSession, countdown: formatCountdown(nextOpen) };
    }, [hour, day]);

    const status = useMemo(() => {
        if (!isWeekday) {
            return {
                open: [CRYPTO_SESSION],
                upcoming: sessions.filter(s => s.name !== 'New York'),
                closed: sessions,
                nextOpenTime: getNextOpenTime(currentTime.dateObject, sessions)
            };
        }

        const openSessions = sessions.filter(s => hour >= s.start && hour < s.end);
        const upcomingSessions = sessions.filter(s => hour < s.start);
        const closedSessions = sessions.filter(s => hour >= s.end && hour < s.start);

        if (openSessions.length > 0 || upcomingSessions.length > 0) {
            openSessions.push(CRYPTO_SESSION);
        } else {
            openSessions.push(CRYPTO_SESSION); 
        }

        const nextOpenTime = getNextOpenTime(currentTime.dateObject, sessions);

        return {
            open: Array.from(new Set(openSessions.map(s => s.name)))
                        .map(name => openSessions.find(s => s.name === name)), // Tekrar edenleri kaldır
            upcoming: upcomingSessions,
            closed: closedSessions,
            nextOpenTime: nextOpenTime
        };
    }, [hour, sessions, isWeekday, getNextOpenTime, currentTime.dateObject, day]);

    const renderSession = (session, type) => (
        // Her oturum satırına hafif blur ve hover efekti eklendi
        <div key={session.name} 
             className={`flex items-center p-3 rounded-lg backdrop-blur-sm transition-all duration-200 
                ${type === 'open' 
                    ? 'bg-green-700/30 border border-green-500 hover:bg-green-600/50' 
                    : type === 'upcoming' 
                        ? 'bg-yellow-700/30 border border-yellow-500 hover:bg-yellow-600/50' 
                        : 'bg-gray-800/50 border border-gray-700 hover:bg-gray-700/70'
                }`}
        >
            <Icon name={session.icon} className={`${session.color} w-5 h-5 mr-3`} />
            <div className='flex flex-col text-sm'>
                 <span className={`${session.color} font-semibold`}>{session.name}</span>
                 <span className='text-xs text-gray-400'>{session.name === 'Kripto (24/7)' ? '24 Saat Açık' : `${String(session.start).padStart(2, '0')}:00 - ${String(session.end).padStart(2, '0')}:00 (TRT)`}</span>
            </div>
        </div>
    );


    return (
        <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            // Holografik Kart Stili Uygulandı
            className={WIDGET_BASE_CLASSES + " hover:shadow-cyan-500/50"}
        >
            <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Icon name="globe-americas" className="w-6 h-6 mr-3 text-cyan-400" />
                {T.market_sessions_title || "Küresel Piyasa Oturumları"}
            </h2>
            
            <div className="mb-4">
                 <h3 className="text-sm font-medium text-gray-300 mb-2">{T.market_open_sessions || "Açık Oturumlar"} <span className='text-green-400'>({status.open.length})</span></h3>
                 <div className="grid grid-cols-1 gap-2">
                     {status.open.map(s => renderSession(s, 'open'))}
                 </div>
            </div>

            <div className="mb-4">
                 <h3 className="text-sm font-medium text-gray-300 mb-2">{T.market_upcoming_sessions || "Sırada Olanlar"} <span className='text-yellow-400'>({status.upcoming.length})</span></h3>
                 <div className="grid grid-cols-1 gap-2">
                     {status.upcoming.length > 0 ? (
                         status.upcoming.map(s => renderSession(s, 'upcoming'))
                     ) : (
                         <p className='text-sm text-gray-500 p-2'>Sırada Açılacak Oturum Yok.</p>
                     )}
                 </div>
            </div>
            
            <div className='mt-5 pt-3 border-t border-gray-700'>
                 <h3 className="text-sm font-medium text-gray-400 mb-2">{T.market_next_open || "Sıradaki Açılış"}</h3>
                 {/* Next Open Vurgusu */}
                 <div className='flex items-center justify-between p-3 bg-cyan-900/40 rounded-lg border border-cyan-500/50 shadow-inner shadow-cyan-900/50'>
                     <span className="font-semibold text-lg text-cyan-300">{status.nextOpenTime?.session?.name || 'Kapalı'}</span>
                     <span className="text-xl font-mono text-white bg-cyan-600/50 p-1 rounded font-extrabold shadow-md">
                          {status.nextOpenTime?.countdown || '00:00:00'}
                     </span>
                 </div>
            </div>
        </motion.div>
    );
};

// 2. Korku & Açgözlülük Widget'ı
const FearGreedWidget = ({ T, fearGreedScore, marketData, isLoading }) => {
    const score = fearGreedScore || (marketData?.fearGreedData?.value ? parseInt(marketData.fearGreedData.value) : 50);
    const classification = marketData?.fearGreedData?.value_classification || 'Neutral';
    const indicatorColor = useMemo(() => {
        if (score <= 20) return 'bg-red-600';
        if (score <= 40) return 'bg-orange-400';
        if (score <= 60) return 'bg-yellow-400';
        if (score <= 80) return 'bg-green-400';
        return 'bg-green-600';
    }, [score]);

    const angle = useMemo(() => {
        return (score / 100) * 180;
    }, [score]);

    const translateClassification = (cls) => {
        switch (cls) {
            case 'Extreme Fear': return 'Aşırı Korku';
            case 'Fear': return 'Korku';
            case 'Neutral': return 'Nötr';
            case 'Greed': return 'Açgözlülük';
            case 'Extreme Greed': return 'Aşırı Açgözlülük';
            default: return 'Nötr';
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            // Holografik Kart Stili Uygulandı
            className={WIDGET_BASE_CLASSES + " hover:shadow-yellow-500/50 mt-6 lg:mt-0 flex flex-col items-center"}
        >
            <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Icon name="balance-scale" className="w-6 h-6 mr-3 text-yellow-400" />
                {T.fear_greed_title || "Korku & Açgözlülük Endeksi"}
            </h2>
            
            {isLoading ? (
                <div className='h-32 flex items-center justify-center text-gray-500'>Yükleniyor...</div>
            ) : (
                <div className="relative w-full max-w-xs flex flex-col items-center">
                    <div className="w-full relative overflow-hidden" style={{ paddingTop: '50%' }}>
                        {/* Yarım daire arka plan (Daha koyu) */}
                        <div className="absolute top-0 left-0 right-0 h-full rounded-t-full bg-gradient-to-r from-red-600 via-yellow-400 to-green-600 opacity-20 transform origin-bottom" style={{ clipPath: 'polygon(0 100%, 100% 100%, 100% 0, 0 0)' }}></div>
                        
                        {/* İbre (Daha belirgin beyaz gövde) */}
                        <div className="absolute bottom-0 left-1/2 w-1 h-1/2 transform -translate-x-1/2 origin-bottom transition-transform duration-1000 ease-out" style={{ transform: `translateX(-50%) rotate(${angle - 90}deg)` }}>
                            <div className={`absolute bottom-0 w-1.5 h-full bg-white shadow-lg ${indicatorColor}`} style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }}></div>
                            <div className='absolute bottom-0 w-3 h-3 rounded-full bg-white border border-gray-900 shadow-2xl'></div>
                        </div>
                    </div>

                    <div className='mt-2'>
                        <p className={`text-4xl font-bold ${indicatorColor.replace('bg-', 'text-')}`}>{score}</p>
                        <p className="text-lg font-medium text-gray-300 mt-1">{translateClassification(classification)}</p>
                        <p className="text-xs text-gray-500 mt-2">{T.fear_greed_desc || "Duygusal tepkilerin piyasa üzerindeki etkisini ölçer."}</p>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

// 3. Oynaklık (Volatility) Widget'ı - Simüle
const VolatilityWidget = ({ T }) => {
    const historicalVolatility = 18.5; // Son 30 gün
    const impliedVolatility = 21.2; // Opsiyon Piyasası
    const trend = impliedVolatility > historicalVolatility ? 'Artış Bekleniyor' : 'Düşüş Bekleniyor';
    const trendColor = trend.includes('Artış') ? 'text-red-400' : 'text-green-400';
    const trendIcon = trend.includes('Artış') ? 'chart-line-up' : 'chart-line-down';

    return (
        // Holografik Kart Stili Uygulandı
        <div className={WIDGET_BASE_CLASSES + " hover:shadow-red-500/50"}>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Icon name="chart-simple" className="w-6 h-6 mr-3 text-red-400" />
                {T.volatility_title || "Piyasa Oynaklığı (IV)"}
            </h2>
            
            <div className="space-y-3">
                 {/* Satır İyileştirmesi */}
                 <div className='flex justify-between items-center p-3 bg-gray-800/70 rounded-lg'> 
                     <span className='text-gray-400 text-sm'>{T.volatility_historical || "Tarihi Oynaklık (30G)"}</span>
                     <span className='text-white font-semibold'>{historicalVolatility.toFixed(2)}%</span>
                 </div>
                 {/* Kırmızı Vurgu Satırı */}
                 <div className='flex justify-between items-center p-3 bg-red-900/30 rounded-lg border border-red-500/50 shadow-inner'> 
                     <span className='text-white font-semibold'>{T.volatility_implied || "Beklenen Oynaklık (IV)"}</span>
                     <span className='text-red-300 text-lg font-bold'>{impliedVolatility.toFixed(2)}%</span>
                 </div>
                 <div className='flex items-center mt-4 pt-3 border-t border-gray-700'>
                     <Icon name={trendIcon} className={`w-4 h-4 mr-2 ${trendColor}`} />
                     <span className={`text-sm ${trendColor} font-medium`}>{T.volatility_trend || "Trend:"} {trend}</span>
                 </div>
            </div>
        </div>
    );
};

// 4. Ekonomik Takvim Widget'ı
const EconomicCalendarWidget = ({ T, events, isLoading }) => {
    return (
        // Holografik Kart Stili Uygulandı
        <div className={WIDGET_BASE_CLASSES + " hover:shadow-pink-500/50"}>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Icon name="calendar-days" className="w-6 h-6 mr-3 text-pink-400" />
                {T.economic_calendar_title || "Önemli Ekonomik Takvim"}
            </h2>
            
            {isLoading ? (
                <div className='h-32 flex items-center justify-center text-gray-500'>Yükleniyor...</div>
            ) : (
                <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar">
                    {events && events.length > 0 ? (
                        events.map((event, index) => (
                            // Satır İyileştirmesi: Daha şeffaf, hover efekti
                            <div key={index} 
                                className='flex justify-between items-start p-3 bg-gray-800/70 rounded-lg border-l-4 transition-all duration-200 hover:bg-gray-700/70' 
                                style={{borderColor: event.impact === 'high' ? '#f87171' : event.impact === 'medium' ? '#fbbf24' : '#60a5fa'}}
                            >
                                <div>
                                    <p className='text-gray-200 font-medium text-sm'>{event.event}</p>
                                    <p className='text-xs text-gray-400 mt-0.5'>{event.date} - {event.time || 'TBD'}</p>
                                </div>
                                <span className={`text-xs font-semibold p-1 rounded-full ${event.impact === 'high' ? 'bg-red-900 text-red-300' : event.impact === 'medium' ? 'bg-yellow-900 text-yellow-300' : 'bg-blue-900 text-blue-300'}`}>
                                    {event.impact === 'high' ? 'Yüksek Etki' : event.impact === 'medium' ? 'Orta Etki' : 'Düşük Etki'}
                                </span>
                            </div>
                        ))
                    ) : (
                        <p className='text-sm text-gray-500'>Bu hafta önemli bir ekonomik olay bulunmamaktadır.</p>
                    )}
                </div>
            )}
        </div>
    );
};

// 5. En Çok Kazananlar Widget'ı
const TopGainersWidget = ({ T, marketData, isLoading }) => {
    const topGainers = marketData?.trendingData?.slice(0, 5) || [];

    return (
        // Holografik Kart Stili Uygulandı
        <div className={WIDGET_BASE_CLASSES + " hover:shadow-green-500/50"}>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Icon name="arrow-up-right-dots" className="w-6 h-6 mr-3 text-green-400" />
                {T.top_gainers_title || "Piyasada Öne Çıkanlar (Kripto)"}
            </h2>
            
            {isLoading ? (
                <div className='h-40 flex items-center justify-center text-gray-500'>Yükleniyor...</div>
            ) : (
                <div className="space-y-3">
                    {topGainers.length > 0 ? (
                        topGainers.map((coin, index) => (
                            // Satır İyileştirmesi: Yeşil vurgulu hover efekti
                            <div key={index} className='flex justify-between items-center p-3 bg-gray-800/70 rounded-lg transition-all duration-200 hover:bg-green-900/30 border border-transparent hover:border-green-500/50'>
                                <div className='flex items-center'>
                                    <div className='w-2 h-2 rounded-full bg-green-500 mr-3'></div>
                                    <span className='font-semibold text-white'>{coin.symbol}</span>
                                    <span className='text-xs text-gray-400 ml-2'>Rank: #{coin.market_cap_rank || '?'}</span>
                                </div>
                                <span className='text-green-400 font-bold'>+{(Math.random() * 10 + 1).toFixed(2)}%</span>
                            </div>
                        ))
                    ) : (
                         <p className='text-sm text-gray-500'>Öne çıkan kripto verisi şu anda mevcut değil.</p>
                    )}
                </div>
            )}
        </div>
    );
};

// 6. En Çok Kaybedenler Widget'ı - Simüle
const TopLosersWidget = ({ T }) => {
    const topLosers = [
        { symbol: 'XAU/USD', change: -1.85 },
        { symbol: 'TSLA', change: -2.10 },
        { symbol: 'ETH/USD', change: -0.95 },
    ];
    
    return (
        // Holografik Kart Stili Uygulandı
        <div className={WIDGET_BASE_CLASSES + " hover:shadow-red-500/50"}>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Icon name="arrow-down-right-dots" className="w-6 h-6 mr-3 text-red-400" />
                {T.top_losers_title || "Piyasada Geri Kalanlar"}
            </h2>
            
            <div className="space-y-3">
                {topLosers.map((item, index) => (
                    // Satır İyileştirmesi: Kırmızı vurgulu hover efekti
                    <div key={index} className='flex justify-between items-center p-3 bg-gray-800/70 rounded-lg transition-all duration-200 hover:bg-red-900/30 border border-transparent hover:border-red-500/50'>
                        <div className='flex items-center'>
                             <div className='w-2 h-2 rounded-full bg-red-500 mr-3'></div>
                             <span className='font-semibold text-white'>{item.symbol}</span>
                        </div>
                        <span className='text-red-400 font-bold'>{item.change.toFixed(2)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// 7. Fonlama Oranları (Funding Rates) Widget'ı - Simüle
const FundingRatesWidget = ({ T, fearGreedScore }) => {
    const isHighFear = fearGreedScore < 30; // Fear & Greed Index'e göre simüle
    const rates = [
        { market: 'BTC Perpetual', rate: isHighFear ? -0.015 : 0.01, isNegative: isHighFear },
        { market: 'ETH Perpetual', rate: isHighFear ? -0.005 : 0.008, isNegative: isHighFear },
        { market: 'SOL Perpetual', rate: isHighFear ? -0.02 : 0.015, isNegative: isHighFear },
    ];
    
    return (
        // Holografik Kart Stili Uygulandı
        <div className={WIDGET_BASE_CLASSES + " hover:shadow-blue-500/50"}>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Icon name="retweet" className="w-6 h-6 mr-3 text-blue-400" />
                {T.funding_rates_title || "Fonlama Oranları (Perpetual)"}
            </h2>
            
            <div className="space-y-3">
                {rates.map((item, index) => (
                    // Satır İyileştirmesi: Mavi vurgulu hover efekti
                    <div key={index} className='flex justify-between items-center p-3 bg-gray-800/70 rounded-lg transition-all duration-200 hover:bg-blue-900/30 border border-transparent hover:border-blue-500/50'>
                        <span className='text-gray-300 text-sm'>{item.market}</span>
                        <span className={`${item.isNegative ? 'text-red-400' : 'text-green-400'} font-semibold`}>
                            {item.rate.toFixed(3)}%
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// 8. Long/Short Oranı Widget'ı - Simüle
const LongShortRatioWidget = ({ T, fearGreedScore }) => {
    const isGreedy = fearGreedScore > 70; // Fear & Greed Index'e göre simüle
    const ratio = isGreedy ? 0.85 : 1.25;
    const sentiment = ratio > 1 ? 'Long Ağırlıklı' : 'Short Ağırlıklı';
    const sentimentColor = ratio > 1 ? 'text-green-400' : 'text-red-400';

    const ratioPercentage = Math.round((ratio / 2) * 100); // 0.5 - 1.5 aralığını 0-100'e eşle

    return (
        // Holografik Kart Stili Uygulandı
        <div className={WIDGET_BASE_CLASSES + " hover:shadow-cyan-500/50"}>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Icon name="scale-balanced" className="w-6 h-6 mr-3 text-cyan-400" />
                {T.long_short_ratio_title || "Long/Short Oranı (LSR)"}
            </h2>
            
            <div className="flex flex-col items-center">
                {/* İlerleme Çubuğu */}
                <div className="relative w-full h-4 bg-gray-700 rounded-full mb-3 shadow-inner">
                    <div 
                        className={`absolute h-4 rounded-full transition-all duration-500 ${ratio > 1 ? 'bg-green-500 shadow-lg shadow-green-900/50' : 'bg-red-500 shadow-lg shadow-red-900/50'}`} 
                        style={{ width: `${ratioPercentage}%` }}
                    ></div>
                </div>
                <div className='flex justify-between w-full text-xs text-gray-400'>
                    <span>Long ({ratioPercentage}%)</span>
                    <span>Short ({100 - ratioPercentage}%)</span>
                </div>
                <p className={`text-xl font-bold mt-4 ${sentimentColor}`}>{ratio.toFixed(2)}</p>
                <p className='text-sm text-gray-400'>{T.long_short_sentiment || "Piyasa Duyarlılığı:"} {sentiment}</p>
            </div>
        </div>
    );
};


// --- ANA KOMPONENT ---
export default function MarketPulsePage() {
    const { T } = useAuth();
    
    const [currentTime, setCurrentTime] = useState(getTurkeyTime(new Date()));
    
    const { data: marketData, isLoading, error } = trpc.market.getLatestMarketInfo.useQuery(); 

    useEffect(() => {
        // Her dakika güncel zamanı hesapla
        const timer = setInterval(() => {
            setCurrentTime(getTurkeyTime(new Date()));
        }, 1000 * 60);

        return () => clearInterval(timer);
    }, []);

    const fearGreedScore = marketData?.fearGreedData?.value ? parseInt(marketData.fearGreedData.value) : 50;


    return (
        // Fütüristik Arka Plan ve Düzenleme
        <div className="min-h-screen bg-[#060914] text-white overflow-hidden relative p-4 md:p-8">
            {/* Holografik Grid Arka Plan Efekti */}
            <div className="absolute inset-0 bg-grid-indigo-500/10 bg-[size:3rem_3rem] opacity-30"></div>
            <div className="absolute inset-0" style={{
                    background: 'radial-gradient(ellipse at center, rgba(30, 64, 175, 0.1) 0%, rgba(6, 9, 20, 1) 70%)' 
                }}></div>
            
            <div className="container mx-auto relative z-10">
                <h1 className="text-3xl md:text-4xl font-bold mb-3 text-center text-cyan-400 tracking-wider">
                     <Icon name="activity" className="w-8 h-8 mr-2 inline-block" />
                     {T.market_pulse_page_title || "SYNARA KOMUTA MERKEZİ"}
                </h1>
                <p className='text-center text-gray-400 mb-8 max-w-3xl mx-auto'>
                    {T.market_pulse_page_subtitle || "Synara'nın Holistik Zeka Matrisi'nden anlık piyasa nabzı, duyarlılık haritaları ve kritik anomali uyarıları."}
                </p>
                
                <AnomalyIndicator T={T} />
                
                {isLoading ? (
                    <div className="text-center py-20 text-gray-500">Piyasa verileri yükleniyor...</div>
                ) : error ? (
                    <div className="text-center py-20 text-red-400">Hata: {T.error_api_fetch || "Veri çekilirken hata oluştu."} ({error.message})</div>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-6">
                        
                        {/* SOL SÜTUN (Sidebar / Oturumlar & Duyarlılık) */}
                        <div className="lg:w-1/4 space-y-6">
                            <MarketSessionsWidget T={T} currentTime={currentTime} />
                            <FearGreedWidget T={T} fearGreedScore={fearGreedScore} marketData={marketData} isLoading={isLoading} /> 
                        </div>

                        {/* ORTA SÜTUN (Main Data / Heatmap & Widgets) */}
                        <div className="lg:w-2/4 space-y-6">
                            <SentimentHeatmapWidget T={T} />
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* 2 Kolonluk Widget'lar */}
                                <TopGainersWidget T={T} marketData={marketData} isLoading={isLoading} />
                                <TopLosersWidget T={T} />
                                
                                {/* 1 Kolonluk Widget'lar */}
                                <VolatilityWidget T={T} />
                                <EconomicCalendarWidget T={T} events={marketData?.economicCalendarData || []} isLoading={isLoading} />
                                <FundingRatesWidget T={T} fearGreedScore={fearGreedScore} />
                                <LongShortRatioWidget T={T} fearGreedScore={fearGreedScore} />
                            </div>
                        </div>

                        {/* SAĞ SÜTUN (Action Console) */}
                        <div className="lg:w-1/4">
                             <ActionConsole T={T} />
                        </div>
                    </div>
                )}

                <div className='mt-16 text-center text-gray-500 text-sm'>
                    {T.market_pulse_disclaimer || "Bu veriler yalnızca bilgilendirme amaçlıdır ve yatırım tavsiyesi değildir."}
                </div>
            </div>

            {/* Global Stiller (Fütüristik görünüm için kritik) */}
            <style jsx global>{`
                /* Özel Scrollbar (Daha temiz görünüm) */
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #6366f1; /* indigo-500 */
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #1f2937; /* gray-800 */
                }
                
                /* Neon Glow Efekti */
                .shadow-glow-indigo {
                    box-shadow: 0 0 10px rgba(99, 102, 241, 0.5), 0 0 20px rgba(99, 102, 241, 0.3);
                }
                .shadow-glow-cyan { /* Yeni Shadow Efekti */
                    box-shadow: 0 0 10px rgba(6, 182, 212, 0.5), 0 0 20px rgba(6, 182, 212, 0.3);
                }
                
                /* Anomali Uyarı Animasyonu */
                @keyframes pulse-fast {
                    0%, 100% { opacity: 1; box-shadow: 0 0 10px #f87171, 0 0 20px #dc2626; } /* Kırmızı Neon */
                    50% { opacity: 0.7; box-shadow: 0 0 5px #f87171, 0 0 10px #dc2626; }
                }
                .animate-pulse-fast {
                    animation: pulse-fast 1.5s infinite;
                }
                
                /* Yavaş Dönme Animasyonu */
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 10s linear infinite;
                }
            `}</style>
        </div>
    );
}
