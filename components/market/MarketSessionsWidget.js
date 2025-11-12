// path: components/market/MarketSessionsWidget.js
'use client';

// === GÜNCELLEME v2.0 (Kökten Çözüm) ===
// Bu bileşen artık MemberDashboard'dan Sessions prop'u almıyor. 
// Tüm seans tanımları ve hesaplama mantığı kendi içinde bulunuyor (Self-Contained).

import React, { useMemo, useState, useEffect } from 'react';
// === GÜNCELLEME v2.2 (Yeni İkon ve Animasyon) ===
import { Globe, Sun, Moon, Zap, Bitcoin, Building, Clock, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// === GÜNCELLEME v2.2 SONU ===
import { logger } from '@/lib/Logger';

// === GÜNCELLEME v1.5 (Fütüristik Tema) ===
// Stil tanımları (MemberDashboard.js'den kopyalandı)
const WIDGET_BASE_CLASSES = "bg-[#111827]/70 backdrop-blur-sm p-6 rounded-xl shadow-2xl transition-all duration-300 border border-indigo-700/50 hover:shadow-cyan-500/50";
const WIDGET_HEADER_CLASSES = "flex items-center space-x-3 border-b border-indigo-700/50 pb-4 mb-4";
// === STİL SONU ===

// === GÜNCELLEME v2.2 (Yeni Bilgilendirme Metinleri) ===
const SESSION_DESCRIPTIONS = {
    kripto: "Kripto piyasaları haftanın 7 günü, günün 24 saati (24/7) işlem görür. Bu süre zarfında likidite değişebilir ancak kapanış yoktur. Synara sistemleri kripto piyasalarını Nexus motoru ile sürekli takip eder.",
    asya: "Asya seansı, Tokyo ve Sydney'i kapsar ve genellikle haftanın ilk likiditesinin görüldüğü alandır. Türk yatırımcılar için gece saatlerine denk gelir. Bu seans, Londra ve New York seanslarına göre daha düşük volatiliteye sahiptir.",
    bist: "Borsa İstanbul, Türkiye'nin yerel piyasasıdır. Sabah ve öğleden sonra olmak üzere iki ayrı işlem seansı bulunur. Öğle saatlerindeki bir saatlik ara (13:00-14:00 TRT), yerel piyasalar için kritik bir bekleme dönemidir.",
    londra: "Londra seansı, döviz piyasalarındaki en büyük hacmi temsil eder. Avrupa'nın açılmasıyla volatilite artar ve Asya seansı ile çakıştığı sabah saatleri, önemli hareketlere sahne olabilir.",
    newyork: "New York seansı, ABD piyasalarının açılmasıyla küresel ticarete enjekte edilen en büyük sermayeyi temsil eder. Londra seansı ile çakıştığı saatler (özellikle ilk 3-4 saat), günün en yüksek volatilite ve likiditesinin görüldüğü zaman dilimidir."
};

// (v2.2) Detay Bilgilendirme Paneli
const InfoPanel = ({ session, status }) => {
    if (!session) return null;
    
    const startTime = `${session.startHour?.toString().padStart(2, '0')}:${session.startMinute?.toString().padStart(2, '0')}`;
    const endTime = session.endHour === 0 ? '00:00' : `${session.endHour?.toString().padStart(2, '0')}:${session.endMinute?.toString().padStart(2, '0')}`;
    
    // Kripto için özel saat metni
    const timeText = session.type === 'crypto' ? '24 Saat / Haftanın 7 Günü (TRT)' : `${startTime} - ${endTime} (TRT)`;

    return (
        <div className='p-3 bg-gray-900/50 rounded-lg border border-gray-700/50'>
            <div className="flex items-center space-x-2 pb-2 border-b border-gray-700 mb-2">
                <Info className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                <h4 className="text-lg font-semibold text-gray-100">{session.name.split(' (')[0]}</h4>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${status.statusColor.replace('text-', 'bg-')}/30 text-white`}>
                    {status.status}
                </span>
            </div>
            <p className="text-sm text-gray-300 mb-2">
                <Clock className="w-3 h-3 inline mr-1 text-indigo-400" />
                İşlem Saatleri: <span className="font-mono text-cyan-300">{timeText}</span>
            </p>
            <p className="text-sm text-gray-400 mt-2 whitespace-pre-wrap">
                {SESSION_DESCRIPTIONS[session.id]}
            </p>
        </div>
    );
};
// === GÜNCELLEME v2.2 SONU ===


// --- Saat Dilimi ve Seans Motoru (v2.0) ---
const getDSTInfo = (nowTRT) => {
    // İstanbul saati baz alınarak Londra ve NY'daki saat farkı hesaplanır.
    const options = { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', hour12: false, timeZoneName: 'shortOffset' };
    const londonFormatter = new Intl.DateTimeFormat('en-GB', options);
    const nyFormatter = new Intl.DateTimeFormat('en-GB', { ...options, timeZone: 'America/New_York' });

    const getOffset = (formatter) => {
        try {
            const parts = formatter.formatToParts(nowTRT);
            const gmtPart = parts.find(p => p.type === 'timeZoneName');
            const offsetStr = gmtPart ? gmtPart.value.split('GMT')[1] : '+0';
            // Offset string'den (örn: "+1", "-4") saat değerini al
            const offsetHours = Number((offsetStr.match(/[+-]?\d+/)||['0'])[0]);
            return offsetHours;
        } catch (e) {
            logger.error('DST Offset parse hatası (v2.0):', e);
            return 0; // Güvenilir Fallback
        }
    };
    
    const londonOffsetHours = getOffset(londonFormatter);
    const nyOffsetHours = getOffset(nyFormatter);

    let londonTimes, nyTimes, londonDSTLabel, nyDSTLabel;

    // Londra Seansları (TRT Saatinde)
    if (londonOffsetHours === 0) { // Kış Saati (GMT+0)
        londonTimes = { startHour: 11, startMinute: 0, endHour: 19, endMinute: 30 };
        londonDSTLabel = '(Kış - GMT+0)';
    } else { // Yaz Saati (GMT+1)
        londonTimes = { startHour: 10, startMinute: 0, endHour: 18, endMinute: 30 };
        londonDSTLabel = '(Yaz - GMT+1)';
    }

    // New York Seansları (TRT Saatinde)
    if (nyOffsetHours === -5) { // Kış Saati (EST / GMT-5)
        nyTimes = { startHour: 17, startMinute: 30, endHour: 0, endMinute: 0 };
        nyDSTLabel = '(Kış - EST)';
    } else { // Yaz Saati (EDT / GMT-4)
        nyTimes = { startHour: 16, startMinute: 30, endHour: 23, endMinute: 0 };
        nyDSTLabel = '(Yaz - EDT)';
    }

    return { londonTimes, nyTimes, londonDSTLabel, nyDSTLabel };
};

// (v2.0) Seans Durumu Hesaplama Fonksiyonu
const getSessionStatus = (nowTRT, session, dayOfWeek) => {
    if (session.type === 'crypto') {
        return { status: 'Açık', statusColor: 'text-green-400' };
    }
    
    if (dayOfWeek === 0 || dayOfWeek === 6) { // Hafta sonu: Pazar(0) ve Cumartesi(6)
        return { status: 'Kapalı', statusColor: 'text-red-500' };
    }

    const nowMinutes = nowTRT.getHours() * 60 + nowTRT.getMinutes();
    
    let startMinutes = session.startHour * 60 + session.startMinute;
    let endMinutes = session.endHour * 60 + session.endMinute;
    
    if (endMinutes === 0) { 
        endMinutes = 24 * 60; // 00:00 (gece yarısı) 1440. dakika olarak ele alınır
    }

    // BIST Öğle Arası Kontrolü (13:00 - 14:00 TRT)
    if (session.id === 'bist' && nowMinutes >= (13 * 60) && nowMinutes < (14 * 60)) {
        return { status: 'Kapalı (Öğle)', statusColor: 'text-yellow-500' };
    }
    
    // Açık Kontrolü
    if (nowMinutes >= startMinutes && nowMinutes < endMinutes) {
        return { status: 'Açık', statusColor: 'text-green-400' };
    }

    // Yakında Açılıyor Kontrolü (1 saat içinde)
    if (nowMinutes < startMinutes && startMinutes - nowMinutes <= 60) {
        return { status: 'Yakında', statusColor: 'text-cyan-400', countdown: startMinutes - nowMinutes };
    }

    return { status: 'Kapalı', statusColor: 'text-red-500' };
};

// (v2.0) Sıradaki Açılış Zamanı Hesaplama Fonksiyonu
const getNextOpenTime = (nowTRT, sessions) => {
    const nowMs = nowTRT.getTime();
    const dayOfWeek = nowTRT.getDay(); 
    const nowMinutes = nowTRT.getHours() * 60 + nowTRT.getMinutes();
    
    let closestTime = Infinity;
    let nextSession = null;

    // 7 günlük döngü içinde sıradaki açılışı bul
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const targetDay = (dayOfWeek + dayOffset) % 7;
        
        if (targetDay === 0 || targetDay === 6) continue; // Hafta sonları atlan
        
        for (const session of sessions) {
            if (session.type === 'market' || session.type === 'local') {
                const startMinutes = session.startHour * 60 + session.startMinute;
                
                if (dayOffset === 0 && startMinutes > nowMinutes) { // Bugün açılacaksa
                    const timeToOpenMs = (startMinutes - nowMinutes) * 60 * 1000;
                    if (timeToOpenMs < closestTime) {
                        closestTime = timeToOpenMs;
                        nextSession = session;
                    }
                } 
                else if (dayOffset > 0) { // Sonraki günler
                    const targetDate = new Date(nowTRT.getTime());
                    targetDate.setDate(nowTRT.getDate() + dayOffset);
                    targetDate.setHours(session.startHour, session.startMinute, 0, 0); // Başlangıç saatine ayarla
                    
                    // Saati TRT'ye göre ayarla (TRT zaten tarayıcı saati)
                    // DST hesaplaması zaten DSTInfo içinde yapıldığı için burada sadece saati set etmek yeterli.
                    // const targetDateMs = (targetDate.getTime() + startMinutes * 60 * 1000) - nowMs; // Bu yanlış.
                    const timeToOpenMs = targetDate.getTime() - nowMs;


                    if (timeToOpenMs > 0 && timeToOpenMs < closestTime) {
                        closestTime = timeToOpenMs;
                        nextSession = session;
                    }
                }
            }
        }
        
        if (nextSession && (dayOffset === 0 || closestTime < 1000 * 60 * 60 * 24)) {
            // Bugün bulunursa veya 24 saatten azsa döngüden çık
            break; 
        }
    }
    
    return { nextSession, timeToOpenMs: closestTime };
};


// (v2.0) Sayımsal Formatlama
const formatCountdown = (ms) => {
    if (ms === Infinity) return 'Piyasalar Kapalı';
    const totalSeconds = Math.floor(ms / 1000);
    const d = Math.floor(totalSeconds / (3600*24));
    const h = Math.floor(totalSeconds % (3600*24) / 3600);
    const m = Math.floor(totalSeconds % 3600 / 60);
    const s = Math.floor(totalSeconds % 60);
    
    if (d > 0) return `${d}g ${h}sa ${m.toString().padStart(2, '0')}dk`;
    if (h > 0) return `${h}sa ${m.toString().padStart(2, '0')}dk ${s.toString().padStart(2, '0')}sn`;
    return `${m}dk ${s.toString().padStart(2, '0')}sn`;
};
// --- Saat Dilimi ve Seans Motoru SONU ---


// --- MarketSessionsWidget (v2.3) ---
const MarketSessionsWidget = ({ nowTRT }) => {
    // nowTRT prop'u (MemberDashboard'dan gelen canlı saat)
    const [currentTime, setCurrentTime] = useState(nowTRT);
    // === GÜNCELLEME v2.2 (Yeni State) ===
    const [activeInfoSession, setActiveInfoSession] = useState(null);
    // === GÜNCELLEME v2.2 SONU ===

    // Canlı güncellemeyi yönet
    useEffect(() => {
        // prop'tan gelen initial değeri set et
        setCurrentTime(nowTRT); 

        // Saniyede bir güncelleme yapılması artık MemberDashboard'da yapılıyor.
        // Ancak bu widget'ın prop'u güncellenmediğinde kendi iç saatini kullanması daha güvenli.
        const timer = setInterval(() => {
            setCurrentTime(new Date()); 
        }, 1000); 
        return () => clearInterval(timer);
    }, [nowTRT]); // nowTRT değişirse initial değeri al

    // Seans Verileri ve Hesaplamaları (v2.3)
    const { sessions, statusMap, nextSession, timeToOpenMs } = useMemo(() => {
        const dayOfWeek = currentTime.getDay();
        const { londonTimes, nyTimes, londonDSTLabel, nyDSTLabel } = getDSTInfo(currentTime);
        
        // Seans Tanımları (v2.3 - KRİTİK DÜZELTME: Asya Seansı 01:00'e çekildi)
        const marketSessions = [
            // Kripto (24/7)
            { id: 'kripto', name: 'Kripto (24/7)', icon: <Bitcoin className="w-4 h-4 mr-2" />, type: 'crypto' },
            // Asya Seansı (TRT: 01:00 - 12:00) - KRİTİK DÜZELTME: startHour: 1
            { id: 'asya', name: 'Asya', icon: <Sun className="w-4 h-4 mr-2" />, type: 'market', startHour: 1, startMinute: 0, endHour: 12, endMinute: 0, dstLabel: '' },
            // BIST Seansı (TRT: 10:00 - 18:00, Öğle: 13:00-14:00)
            { id: 'bist', name: 'BIST', icon: <Building className="w-4 h-4 mr-2" />, type: 'local', startHour: 10, startMinute: 0, endHour: 18, endMinute: 0, dstLabel: '' },
            // Londra Seansı (DST'ye göre dinamik)
            { id: 'londra', name: `Londra ${londonDSTLabel}`, icon: <Globe className="w-4 h-4 mr-2" />, type: 'market', ...londonTimes, dstLabel: londonDSTLabel },
            // New York Seansı (DST'ye göre dinamik)
            { id: 'newyork', name: `New York ${nyDSTLabel}`, icon: <Moon className="w-4 h-4 mr-2" />, type: 'market', ...nyTimes, dstLabel: nyDSTLabel },
        ];
        
        const statusMap = {};
        marketSessions.forEach(session => {
            statusMap[session.id] = getSessionStatus(currentTime, session, dayOfWeek);
        });
        
        // Sadece ana market seanslarını (crypto hariç) sonraki açılış için kullan
        const relevantSessions = marketSessions.filter(s => s.type !== 'crypto');
        const nextOpen = getNextOpenTime(currentTime, relevantSessions);

        return { sessions: marketSessions, statusMap, nextSession: nextOpen.nextSession, timeToOpenMs: nextOpen.timeToOpenMs };
    }, [currentTime]);

    // === GÜNCELLEME v2.2 (Toggle Fonksiyonu) ===
    const toggleInfo = (sessionId) => {
        setActiveInfoSession(activeInfoSession === sessionId ? null : sessionId);
    };
    // === GÜNCELLEME v2.2 SONU ===


    // (v1.6) Mevcut saati 1440 dakika üzerinden hesapla
    const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    const nowPercentage = (nowMinutes / 1440) * 100;

    // (v1.6) Seans renkleri
    const sessionColors = {
        asya: 'bg-yellow-500/70 border border-yellow-400/80',
        londra: 'bg-blue-500/70 border border-blue-400/80',
        newyork: 'bg-indigo-500/70 border border-indigo-400/80',
        bist: 'bg-red-500/70 border border-red-400/80',
    };

    // Filtrelenmiş seanslar (Timeline'da gösterilecek olanlar)
    const timelineSessions = sessions.filter(s => s.type !== 'crypto');
    
    // Aktif seansların canlı görsel efektini sağlamak için CSS animasyonunu tanımlıyoruz.
    const activeScanStyle = `
        @keyframes pulse-scan {
            0% { background-position: 0% 0%; }
            100% { background-position: -200% 0%; }
        }
        .active-scan-bg {
            background-image: linear-gradient(
                -45deg,
                transparent 25%,
                rgba(34, 197, 94, 0.4) 30%, 
                rgba(34, 197, 94, 0.4) 70%,
                transparent 75%
            );
            background-size: 200% 100%;
            animation: pulse-scan 8s linear infinite;
        }
    `;

    return (
        <div className={WIDGET_BASE_CLASSES}>
            {/* === GÜNCELLEME v2.3 (Canlılık için Style Tanımı) === */}
            <style jsx global>{activeScanStyle}</style>
            {/* === GÜNCELLEME v2.3 SONU === */}
            
            <h3 className={WIDGET_HEADER_CLASSES}>
                <Clock className="w-5 h-5 mr-3 text-cyan-400" />
                <span className="text-gray-200 text-lg font-semibold">Küresel Seans Zaman Çizelgesi (TRT)</span>
            </h3>
            
            {/* (v1.6) TRT Saat ve Geri Sayım */}
            <div className="flex flex-col md:flex-row justify-between md:items-end mb-4">
                 <div className="mb-3 md:mb-0">
                    <div className="text-xs text-cyan-400 font-mono">
                        {currentTime.toLocaleTimeString('tr-TR', { timeZone: 'Europe/Istanbul' })} (TRT)
                    </div>
                    {nextSession && (
                        <div className="mt-1">
                            <div className="text-xs text-gray-400">Sıradaki Açılış: {nextSession.name.split(' (')[0]}</div>
                            <div className="text-lg font-bold text-cyan-400 font-mono">
                                {formatCountdown(timeToOpenMs)}
                            </div>
                        </div>
                    )}
                 </div>

                {/* (v1.6) Saat Dilimi (DST) Bilgisi */}
                <div className="text-xs text-gray-500 text-left md:text-right">
                    {sessions.filter(s => s.id === 'londra')[0]?.dstLabel && (
                        <div>Londra: {sessions.filter(s => s.id === 'londra')[0].dstLabel}</div>
                    )}
                    {sessions.filter(s => s.id === 'newyork')[0]?.dstLabel && (
                        <div>New York: {sessions.filter(s => s.id === 'newyork')[0].dstLabel}</div>
                    )}
                </div>
            </div>

            {/* (v1.6) Fütüristik Zaman Çizelgesi */}
            <div className="relative w-full pt-4">
                
                {/* 0. Seans Başlangıç Etiketleri (v2.1) */}
                <div className="absolute top-0 w-full h-4">
                    {timelineSessions.map(session => {
                        let startMinutes = session.startHour * 60 + session.startMinute;
                        const left = (startMinutes / 1440) * 100;
                        const abbreviation = session.id === 'asya' ? 'ASYA' :
                                             session.id === 'londra' ? 'LON' :
                                             session.id === 'newyork' ? 'NY' :
                                             session.id === 'bist' ? 'BIST' : '';
                        
                        // Kripto seansları timeline'da etiketlenmez
                        if (session.type === 'crypto') return null;

                        return (
                            <div
                                key={`${session.id}-label`}
                                className={`absolute text-xs font-mono text-cyan-400 -translate-x-1/2`}
                                style={{ left: `${left}%` }}
                                title={`${session.name.split(' (')[0]} Başlangıç`}
                            >
                                {abbreviation}
                            </div>
                        );
                    })}
                </div>

                {/* 1. Ana Track (İz) */}
                <div className="w-full h-8 bg-gray-900/50 rounded-lg relative overflow-hidden shadow-inner inset-0 border border-gray-700/50">
                    
                    {/* === GÜNCELLEME v2.3 (Kripto 24/7 Glow) === */}
                    <div 
                        className="absolute top-0 left-0 w-full h-8 rounded-lg bg-green-500/5" 
                        style={{ 
                            boxShadow: 'inset 0 0 10px 1px rgba(34, 197, 94, 0.4)',
                            zIndex: 5 
                        }}
                    ></div>
                    {/* === GÜNCELLEME v2.3 SONU === */}

                    {/* 2. Seans Blokları */}
                    {timelineSessions.map(session => {
                        let startMinutes = session.startHour * 60 + session.startMinute;
                        let endMinutes = session.endHour * 60 + session.endMinute;
                        if (endMinutes === 0) endMinutes = 1440; 

                        const left = (startMinutes / 1440) * 100;
                        const width = ((endMinutes - startMinutes) / 1440) * 100;

                        // Seansın aktif olup olmadığını kontrol et
                        const status = statusMap[session.id] || { status: 'Kapalı' };
                        const isActiveSession = status.status === 'Açık';
                        
                        // Aktif seansa özel stil (v2.3)
                        const activeClasses = isActiveSession 
                            ? 'shadow-xl shadow-cyan-500/30 z-15 active-scan-bg' 
                            : 'z-10';

                        // BIST Öğle Arası
                        const bistLunchStart = (13 * 60); 
                        const bistLunchEnd = (14 * 60); 
                        let bistLunchLeft = 0;
                        let bistLunchWidth = 0;
                        if(session.id === 'bist') {
                            // Öğle arasının timeline üzerinde kapladığı yer hesaplanır
                            const startOverlap = Math.max(startMinutes, bistLunchStart);
                            const endOverlap = Math.min(endMinutes, bistLunchEnd);
                            
                            // Öğle arası 'boşluk' bloğu
                            bistLunchLeft = (bistLunchStart / 1440) * 100;
                            bistLunchWidth = ((bistLunchEnd - bistLunchStart) / 1440) * 100;
                        }

                        return (
                            <React.Fragment key={session.id}>
                                <div 
                                    title={`${session.name} (${session.startHour.toString().padStart(2, '0')}:${session.startMinute.toString().padStart(2, '0')} - ${session.endHour === 0 ? '00' : session.endHour.toString().padStart(2, '0')}:${session.endMinute.toString().padStart(2, '0')})`}
                                    className={`absolute top-0 h-8 rounded-sm transition-all duration-500 ${sessionColors[session.id] || 'bg-gray-500/70'} hover:opacity-100 ${activeClasses}`}
                                    style={{ left: `${left}%`, width: `${width}%` }}
                                ></div>
                                {/* BIST Öğle Arası için 'boşluk' */}
                                {session.id === 'bist' && (
                                     <div 
                                        title="BIST Öğle Arası (13:00-14:00)"
                                        className={`absolute top-0 h-8 bg-gray-900/80`} // Track ile aynı renk (boşluk)
                                        style={{ left: `${bistLunchLeft}%`, width: `${bistLunchWidth}%`, zIndex: 12 }}
                                    ></div>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* 3. Mevcut Saat İşaretçisi */}
                <div 
                    className="absolute top-2 bottom-0 w-0.5"
                    style={{ 
                        left: `${nowPercentage}%`,
                        background: 'linear-gradient(to bottom, transparent, #22d3ee 30%, #22d3ee 70%, transparent)',
                        boxShadow: '0 0 8px 2px #22d3ee',
                        zIndex: 20
                    }}
                >
                    {/* İşaretçi başlığı */}
                    {/* === GÜNCELLEME v2.1 (Glow Show) === */}
                    <div 
                        className="absolute -top-2 left-1/2 w-2 h-2 bg-cyan-300 rounded-full shadow-2xl shadow-cyan-400/80" 
                        style={{transform: 'translateX(-50%)'}}
                    ></div>
                    {/* === GÜNCELLEME v2.1 SONU === */}
                </div>

                {/* 4. Saat Etiketleri */}
                <div className="flex justify-between w-full mt-2 text-xs text-gray-500 font-mono">
                    <span>00:00</span>
                    <span>06:00</span>
                    <span>12:00</span>
                    <span>18:00</span>
                    <span className="opacity-0">24:00</span>
                </div>
            </div>
            
            {/* (v1.6) Durum Listesi (Kompakt) */}
            <div className="mt-6 space-y-3 divide-y divide-gray-700/50">
                {sessions.map(session => {
                    const status = statusMap[session.id] || { status: 'Yükleniyor...', statusColor: 'text-gray-500' };
                    // === GÜNCELLEME v2.2 (Aktif Durum Kontrolü) ===
                    const isActive = activeInfoSession === session.id;
                    // === GÜNCELLEME v2.2 SONU ===
                    
                    return (
                        <React.Fragment key={session.id}>
                            {/* === GÜNCELLEME v2.2 (Tıklanabilir Öğeler) === */}
                            <div 
                                className={`flex items-center justify-between text-sm pt-3 cursor-pointer p-1 -mx-1 rounded-md transition-colors ${isActive ? 'bg-indigo-700/30' : 'hover:bg-gray-800/50'}`}
                                onClick={() => toggleInfo(session.id)}
                            >
                                <span className="flex items-center text-gray-300">
                                    {session.icon}
                                    {session.name.split(' (')[0]}
                                </span>
                                <div className="flex items-center flex-shrink-0">
                                    {status.countdown && (
                                        <span className="text-xs text-cyan-400 mr-2">
                                            ({status.countdown} dk)
                                        </span>
                                    )}
                                    <span className={`font-medium ${status.statusColor} mr-2`}>
                                        {status.status}
                                    </span>
                                    {isActive ? (
                                        <ChevronUp className="w-4 h-4 text-cyan-400" />
                                    ) : (
                                        <ChevronDown className="w-4 h-4 text-gray-500" />
                                    )}
                                </div>
                            </div>
                            {/* === GÜNCELLEME v2.2 (Tıklanabilir Öğeler) SONU === */}

                            {/* === GÜNCELLEME v2.2 (Bilgilendirme Paneli) === */}
                            <AnimatePresence>
                                {isActive && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="py-2 overflow-hidden" // py-2 ile üst çizginin altından başlaması sağlandı
                                    >
                                        <div className='pt-2'> {/* Bilgilendirme panelini üst çizgiden ayırmak için */}
                                            <InfoPanel 
                                                session={session} 
                                                status={status} 
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            {/* === GÜNCELLEME v2.2 (Bilgilendirme Paneli) SONU === */}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
};

export default MarketSessionsWidget;
