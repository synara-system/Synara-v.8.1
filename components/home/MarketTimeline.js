// path: components/home/MarketTimeline.js
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';

// Saat ve gün bilgilerini Türkiye saatine göre (UTC+3) alan yardımcı fonksiyon
const getTurkeyTime = () => {
    const now = new Date();
    // Türkiye saat dilimine göre ayarla (UTC+3)
    const turkeyTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }));
    return {
        day: turkeyTime.getDay(), // 0=Pazar, 1=Pazartesi...
        hour: turkeyTime.getHours(),
        minute: turkeyTime.getMinutes(),
        dateObject: turkeyTime
    };
};

// New York için Yaz Saati Uygulamasının (DST) geçerli olup olmadığını kontrol eder.
const isNewYorkDST = (date) => {
    // New York'un zaman dilimini kullanarak DST durumunu kontrol et
    try {
        const dateString = date.toLocaleString('en-US', { timeZone: 'America/New_York', timeZoneName: 'longOffset' });
        // UTC-4 = DST (Yaz Saati), UTC-5 = Standard Time (Kış Saati)
        return dateString.includes('GMT-4');
    } catch (e) {
        // Fallback (Basit kontrol)
        const month = date.getMonth();
        return month >= 2 && month <= 10; // Mart'tan Kasım'a kadar kabaca DST
    }
};


// Ana Component
// KRİTİK DÜZELTME: Component adı, dosya adıyla tutarlı olacak şekilde "MarketTimeline" olarak güncellendi.
const MarketTimeline = ({ T }) => {
    const [currentTime, setCurrentTime] = useState(getTurkeyTime());

    useEffect(() => {
        const update = () => setCurrentTime(getTurkeyTime());
        update();
        const interval = setInterval(update, 1000 * 60); // Her dakika güncelle
        return () => clearInterval(interval);
    }, []);

    // KRİTİK DÜZELTME: DST kontrolü anlık zamana göre yapılıyor.
    const isDST = useMemo(() => isNewYorkDST(currentTime.dateObject), [currentTime.dateObject]);

    const sessionData = useMemo(() => {
        // NY Açılış/Kapanış Saatleri (TR Saatine göre)
        // DST (Yaz Saati) Aktifse: NY -4 UTC = TR 15:30 - 24:00 (0.00)
        // DST (Kış Saati) Aktifse: NY -5 UTC = TR 16:30 - 01:00 (Ertesi gün)
        const nyOpen = isDST ? 15.5 : 16.5; 
        const nyClose = nyOpen + 8.5; // Kapanış süresi
        
        return [
            { name: 'Asya Killzone', startHour: 2, endHour: 10, color: 'bg-cyan-500' },
            { name: 'Londra Killzone', startHour: 11, endHour: 19, color: 'bg-blue-500' },
            { name: 'New York Killzone', startHour: nyOpen, endHour: nyClose, color: 'bg-yellow-500' },
        ];
    }, [isDST]);

    const currentTimePercentage = ((currentTime.hour * 60 + currentTime.minute) / (24 * 60)) * 100;

    const timeLabels = [0, 3, 6, 9, 12, 15, 18, 21, 24];

    return (
        <section className="py-16 bg-gray-900">
            <div className="container mx-auto px-6 text-center">
                <h2 className="text-3xl font-bold text-white mb-2">Piyasa Likidite Zaman Tüneli</h2>
                <p className="text-gray-400 mb-12">Ana piyasa seanslarının aktif olduğu &quot;Killzone&quot; saatlerini (TR) takip edin.</p>

                <div className="relative w-full h-24 pt-10">
                    {/* Zaman Tüneli Arka Planı */}
                    <div className="absolute top-1/2 -translate-y-1/2 w-full h-3 bg-gray-800 rounded-full border border-gray-700"></div>

                    {/* Seans Dilimleri */}
                    {sessionData.map(session => {
                        const startPercent = (session.startHour / 24) * 100;
                        const endHour = session.endHour > 24 ? 24 : session.endHour;
                        const widthPercent = ((endHour - session.startHour) / 24) * 100;
                        
                        return (
                            <div
                                key={session.name}
                                className={`timeline-segment group ${session.color}`}
                                style={{
                                    left: `${startPercent}%`,
                                    width: `${widthPercent}%`,
                                }}
                            >
                                <span className="timeline-segment-label">{session.name}</span>
                            </div>
                        );
                    })}
                     {/* NY Kış saati sonraki güne taşma durumu */}
                    {!isDST && (
                        // 24:00 (00:00) ile 01:00 arası (1 saat)
                        <div
                            className="timeline-segment group bg-yellow-500"
                            style={{
                                left: '0%',
                                width: `${(1 / 24) * 100}%`,
                            }}
                        >
                            <span className="timeline-segment-label">NY Devamı</span>
                        </div>
                    )}

                    {/* Anlık Zaman İşaretçisi */}
                    <motion.div
                        className="timeline-marker"
                        style={{ left: `${currentTimePercentage}%` }}
                        initial={{ scale: 0.8 }}
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                    >
                         <span className="timeline-marker-label">
                            {String(currentTime.hour).padStart(2, '0')}:{String(currentTime.minute).padStart(2, '0')}
                        </span>
                    </motion.div>
                    
                    {/* Saat Etiketleri */}
                    <div className="absolute top-full w-full mt-2">
                         {timeLabels.map(hour => (
                             <div key={hour} className="absolute -translate-x-1/2 text-xs text-gray-500" style={{ left: `${(hour / 24) * 100}%` }}>
                                 {String(hour).padStart(2, '0')}:00
                             </div>
                         ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default MarketTimeline;
