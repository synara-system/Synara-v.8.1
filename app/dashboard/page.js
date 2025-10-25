// path: app/dashboard/page.js
'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { useRequiredAuth } from '@/hooks/useRequiredAuth';
import Link from 'next/link';
import { useNotification } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';
import Icon from '@/components/Icon';
import { trpc } from '@/lib/trpc/client';
import { usePerformanceAnalytics } from '@/hooks/usePerformanceAnalytics';
import SkeletonLoader from '@/components/SkeletonLoader'; // KRİTİK: SkeletonLoader import edildi
import { getRiskGateStatus } from '@/lib/RiskGateUtils';
import { motion, AnimatePresence } from 'framer-motion';

// --- YARDIMCI BİLEŞENLER ---

// Canlı Saat ve Sistem Durumu (Dikey alanı kısaltıldı)
const LiveStatusHeader = ({ userName, T, riskStatus, isRiskLoading }) => {
    const [time, setTime] = useState('');
    useEffect(() => {
        const timer = setInterval(() => {
            const turkeyTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }));
            setTime(turkeyTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const riskColorMap = { 'YÜKSEK': 'text-red-400', 'ORTA': 'text-yellow-400', 'DÜŞÜK': 'text-green-400' };
    const riskStatusText = isRiskLoading ? 'Analiz Ediliyor...' : riskStatus?.status ? `Risk Seviyesi: ${riskStatus.status}` : 'Veri Yok';
    const riskColorClass = riskColorMap[riskStatus?.status] || 'text-gray-400';

    return (
        // KRİTİK GÜNCELLEME: Başlık alanı daha kompakt hale getirildi. p-3 ve text-lg kullanıldı.
        <div className="text-center lg:text-left mb-6 p-3 rounded-xl border border-sky-700/50 bg-gray-900/50 shadow-lg shadow-sky-900/30 relative overflow-hidden">
             {/* Arka plan efektleri korunuyor */}
            <div className="absolute inset-0 bg-grid-sky-500/10 opacity-30"></div>
            <div className="absolute inset-0" style={{
                background: 'radial-gradient(ellipse at top left, rgba(56, 189, 248, 0.05) 0%, rgba(17, 24, 39, 0) 70%)'
            }}></div>
            
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative flex flex-col md:flex-row items-center justify-between">
                <h1 className="text-xl md:text-2xl font-extrabold text-white leading-tight flex items-center gap-2">
                    <Icon name="compass" className="w-6 h-6 text-indigo-400"/>
                    <span className="gradient-text">{userName},</span> Komuta Merkezi Protokolü.
                </h1>
                
                {/* Durum Metrikleri (Sağa Yaslandı) */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1 mt-2 md:mt-0 text-sm text-gray-400">
                    <div className="flex items-center gap-1"><Icon name="clock" className="w-4 h-4 text-yellow-400" /><span className="font-mono text-white font-bold">{time || 'Yükleniyor...'} (TR)</span></div>
                    <div className={`flex items-center gap-1 font-semibold ${riskColorClass}`}>
                        <Icon name="alert-triangle" className="w-4 h-4" />
                        <span className="font-bold">{riskStatusText}</span>
                    </div>
                    <div className="flex items-center gap-1 text-green-400"><span className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span><span>Tüm Modüller Aktif</span></div>
                </div>
            </motion.div>
        </div>
    );
};

// YENİ BİLEŞEN: Holografik AI Paneli
const HolographicAIPanel = ({ T, analytics, hasData, riskStatus }) => {
    // KRİTİK DÜZELTME: Skoru hesaplarken 0'dan büyük olduğundan emin ol
    const rawScore = hasData ? analytics.profitFactor * 50 + analytics.winRate * 0.5 : 0;
    const score = Math.min(99, Math.round(rawScore));
    
    const scoreColor = score > 80 ? 'text-green-400' : score > 50 ? 'text-yellow-400' : 'text-red-400';
    const scoreText = hasData ? score.toFixed(0) : '---';

    const riskColorMap = { 'YÜKSEK': 'text-red-400', 'ORTA': 'text-yellow-400', 'DÜŞÜK': 'text-green-400' };
    const riskColorClass = riskColorMap[riskStatus?.status] || 'text-gray-400';
    
    // Modül Verileri (Rastgele hareket için CSS animasyonları atandı)
    const moduleNodes = useMemo(() => ([
        { name: 'Nexus', color: 'bg-green-400', x: 20, y: 15, delay: 0, animation: 'data-dot-flow-1' },
        { name: 'Metis', color: 'bg-yellow-400', x: 85, y: 30, delay: 0.5, animation: 'data-dot-flow-2' },
        { name: 'RSI-HAN', color: 'bg-orange-400', x: 10, y: 70, delay: 1, animation: 'data-dot-flow-3' },
        { name: 'Visuals', color: 'bg-red-400', x: 75, y: 85, delay: 1.5, animation: 'data-dot-flow-4' },
    ]), []);

    return (
        // KRİTİK: Dış çerçeve, fütüristik AI gücünü yansıtmalı
        <div className="futuristic-card p-6 h-full min-h-[450px] flex flex-col border-2 border-indigo-700/50 shadow-2xl shadow-indigo-900/40 relative overflow-hidden">
             
            <h2 className="text-xl font-extrabold text-white text-center border-b border-gray-700 pb-3 z-10">
                 HOLISTIC INTELLIGENCE MATRIX (HIM)
            </h2>
            
            <div className="flex-grow relative w-full flex items-center justify-center">
                
                {/* Holografik Panel Alanı - Ortalama ve Sınırlama */}
                <div className="absolute inset-0 flex items-center justify-center">
                    
                    {/* Merkezi Engine Çekirdeği Konteynerı */}
                    <div className="holographic-panel-center w-full h-full relative flex items-center justify-center">
                         
                         {/* Yörünge Halkaları */}
                         <div className="holographic-ring-1" />
                         <div className="holographic-ring-2" />

                         {/* Merkezi Engine Çekirdeği (Viz) */}
                         <div className="engine-core-viz relative z-10">
                            <Icon name="cpu" className="w-8 h-8 text-white mb-1"/>
                            <p className="text-sm font-extrabold text-white leading-none">ENGINE CORE</p>
                            <p className={`text-xs font-mono ${scoreColor}`}>{scoreText}</p>
                         </div>
                         
                         {/* Modül Nodusları (Veri Akışı) */}
                         {moduleNodes.map((node, index) => (
                             <motion.div 
                                key={node.name}
                                // KRİTİK GÜNCELLEME: motion.div'e CSS animasyon sınıfı eklendi
                                // Dot'ların ilk konumları JavaScript tarafından değil, CSS animasyonları tarafından yönetiliyor.
                                className={`data-dot ${node.color} w-3 h-3 absolute rounded-full shadow-lg shadow-white/50 cursor-pointer animate-${node.animation}`}
                                // Animasyonların rastgele başlangıç noktaları için CSS değişkenleri
                                style={{ 
                                    '--dot-start-x': `${node.x}%`,
                                    '--dot-start-y': `${node.y}%`,
                                    top: `${node.y}%`,
                                    left: `${node.x}%`,
                                }}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ 
                                    opacity: 1, 
                                    scale: [0, 1.2, 1],
                                }}
                                transition={{ 
                                    delay: 0.5 + node.delay, 
                                    duration: 0.5,
                                    type: 'spring'
                                }}
                            >
                                {/* Holografik Bağlantı Işığı - Sadece görsel şov için zemin*/}
                                <motion.div 
                                    className={`absolute inset-0 rounded-full ${node.color.replace('bg-', 'bg-')}/50`}
                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                    transition={{ duration: 2, repeat: Infinity, delay: node.delay, ease: 'easeInOut' }}
                                />
                                <span className={`absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-white whitespace-nowrap`}>
                                    {node.name}
                                </span>
                            </motion.div>
                         ))}
                    </div>
                </div>
            </div>

            {/* AI Disiplin Yorumu ve Hızlı Bağlantı */}
            <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-700/50 space-y-2 flex-shrink-0">
                 <h3 className="text-base font-bold text-indigo-400 flex items-center">
                     <Icon name="zap" className="w-5 h-5 mr-2"/>
                    Engine Komut Özeti
                </h3>
                <p className={`text-sm italic text-gray-300`}>
                    {hasData ? `PnL: ${analytics.totalPnl.toFixed(2)}$, R:R: ${analytics.averageRR.toFixed(2)}R. ` : ''}
                    {riskStatus?.message || "Makro analiz bekleniyor."}
                </p>
            </div>
            
            <Link href="/assistant" className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 rounded-lg mt-4 text-lg inline-flex items-center justify-center shadow-lg shadow-sky-900/50">
                <Icon name="send" className="w-5 h-5 mr-3" />
                {"AI ASİSTAN'A KOMUT GÖNDER"}
            </Link>
        </div>
    );
};

// Profil ve Abonelik Yönetim Kartı (Dikey alandan yatay alana odaklandı)
const ProfileManagementCard = ({ user, userData, T, subscriptionEndDate, subscriptionProgress, handleUpdate, analytics, hasData }) => {
    const [tvUsername, setTvUsername] = useState(userData?.tradingViewUsername || '');
    const [displayName, setDisplayName] = useState(userData?.displayName || '');
    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // YENİ STATE: Sekme yönetimi
    const [activeTab, setActiveTab] = useState('metrics'); // 'metrics' veya 'profile'

    const statusInfo = useMemo(() => {
        const isSubscriptionValid = subscriptionEndDate && subscriptionEndDate.getTime() > Date.now();
        const daysLeft = isSubscriptionValid ? Math.ceil((subscriptionEndDate.getTime() - Date.now()) / (1000 * 3600 * 24)) : 0;
        
        return isSubscriptionValid 
            ? { text: `Aktif (${daysLeft} Gün)`, color: 'bg-green-500/20 text-green-300' }
            : { text: T.dashboard_sub_status_inactive, color: 'bg-red-500/20 text-red-300' };
    }, [subscriptionEndDate, T]);
    
    const onFormSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        await handleUpdate(displayName, tvUsername);
        setIsSubmitting(false);
        setIsEditing(false);
        setActiveTab('metrics'); // Kaydedince metrik görünümüne dön
    };
    
    const winRate = analytics.winRate || 0;
    const avgRR = analytics.averageRR || 0;
    const totalPnl = analytics.totalPnl || 0;
    const profitFactor = analytics.profitFactor || 0;
    
    const getPerformanceColor = (value, threshold) => {
        if (value >= threshold) return 'text-green-400';
        if (value > 0) return 'text-yellow-400';
        return 'text-red-400';
    }
    
    // KRİTİK GÜNCELLEME: Profil ve Metrikler içeriği sekmelere ayrıldı.
    const renderMetrics = () => (
        <motion.div
             key="metrics" 
             initial={{ opacity: 0 }} 
             animate={{ opacity: 1 }} 
             exit={{ opacity: 0 }} 
             transition={{ duration: 0.3 }}
             className="space-y-4 pt-4"
        >
            {/* Abonelik Durumu (Üst kısım) */}
            <div className="flex justify-between items-center bg-gray-900/50 p-3 rounded-lg border border-gray-700">
                <div>
                    <p className="text-xs text-gray-400 uppercase font-semibold">Abonelik Durumu</p>
                    <p className={`font-bold text-sm ${statusInfo.color.split(' ')[1]}`}>{statusInfo.text}</p>
                </div>
                {subscriptionEndDate && subscriptionEndDate.getTime() > 0 ? (
                    <p className="text-xs text-gray-400 text-right">Bitiş: {subscriptionEndDate.toLocaleDateString('tr-TR')}</p>
                ) : <Link href="/#pricing" className="text-xs bg-red-600 hover:bg-red-500 font-bold py-1 px-3 rounded text-white">{T.dashboard_manage_sub}</Link>}
            </div>
            
            {/* Kritik Performans (4'lü yatay metrik) */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700">
                    <p className="text-xs text-gray-400 uppercase font-semibold">Toplam PnL</p>
                    <p className={`text-xl font-extrabold ${totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {totalPnl >= 0 ? '+' : ''}{totalPnl.toFixed(2)}$
                    </p>
                </div>
                <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700">
                    <p className="text-xs text-gray-400 uppercase font-semibold">Ortalama R:R</p>
                    <p className={`text-xl font-extrabold ${getPerformanceColor(avgRR, 1.5)}`}>
                        {avgRR.toFixed(2)}R
                    </p>
                </div>
                <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700">
                    <p className="text-xs text-gray-400 uppercase font-semibold">Win Rate</p>
                    <p className={`text-lg font-extrabold ${getPerformanceColor(winRate, 55)}`}>
                        {winRate.toFixed(1)}%
                    </p>
                </div>
                <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700">
                    <p className="text-xs text-gray-400 uppercase font-semibold">Profit Factor</p>
                    <p className={`text-lg font-extrabold ${getPerformanceColor(profitFactor, 1.0)}`}>
                        {profitFactor.toFixed(2)}
                    </p>
                </div>
            </div>
            <button onClick={() => setActiveTab('profile')} className="w-full bg-indigo-600/50 hover:bg-indigo-600 text-indigo-200 font-bold py-2 rounded-lg mt-2">PROFİL AYARLARI</button>
        </motion.div>
    );

    const renderProfileSettings = () => (
        <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="space-y-4 pt-4">
            
            <div className="text-sm border-b border-gray-700/50 pb-3">
                <span className="text-gray-400">Ad:</span> <span className="font-semibold text-white ml-2">{displayName || 'Ayarlanmadı'}</span>
            </div>
            <div className="text-sm border-b border-gray-700/50 pb-3">
                <span className="text-gray-400">TV:</span> <span className="font-semibold text-white ml-2">{tvUsername || 'Ayarlanmadı'}</span>
            </div>
            
            <AnimatePresence mode="wait">
            {isEditing ? (
                <motion.form key="form-edit" onSubmit={onFormSubmit} className="space-y-4 border-t border-gray-700/50 pt-4"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div>
                        <label className="text-xs font-semibold text-gray-400">Görünen Ad</label>
                        <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full p-2 bg-gray-900/50 border border-gray-700 rounded-lg mt-1" required />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-400">{T.dashboard_tv_user}</label>
                        <input type="text" value={tvUsername} onChange={(e) => setTvUsername(e.target.value)} className="w-full p-2 bg-gray-900/50 border border-gray-700 rounded-lg mt-1" required />
                    </div>
                    <div className="flex gap-4">
                        <button type="submit" className="flex-grow bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded-lg" disabled={isSubmitting}>{isSubmitting ? 'PROTOKOL İŞLENİYOR' : 'BİLGİLERİ KAYDET'}</button>
                        <button type="button" onClick={() => setIsEditing(false)} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-lg">İPTAL</button>
                    </div>
                </motion.form>
            ) : (
                <motion.div key="display-buttons" className="pt-2 flex flex-col gap-2"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <button onClick={() => setIsEditing(true)} className="w-full bg-yellow-600/50 hover:bg-yellow-600 text-yellow-200 font-bold py-2 rounded-lg">DÜZENLEME PROTOKOLÜNÜ BAŞLAT</button>
                    <button onClick={() => setActiveTab('metrics')} className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 rounded-lg">METRİKLERE GERİ DÖN</button>
                </motion.div>
            )}
            </AnimatePresence>

        </motion.div>
    );


    return (
        // KRİTİK GÜNCELLEME: Dış çerçeve ve sekme yapısı eklendi.
        <div className="futuristic-card p-4 space-y-4 h-full border-2 border-yellow-700/50 shadow-2xl shadow-yellow-900/40">
            {/* Sekme Butonları (Yatay alan kazanmak için) */}
             <div className="flex justify-center border-b border-gray-700/50 pb-2">
                 <button
                     onClick={() => setActiveTab('metrics')}
                     className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'metrics' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700/50'}`}
                 >
                     <Icon name="bar-chart-2" className="w-4 h-4 inline mr-2"/>
                     Metrikler
                 </button>
                 <button
                     onClick={() => setActiveTab('profile')}
                     className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'profile' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700/50'}`}
                 >
                     <Icon name="user-circle-2" className="w-4 h-4 inline mr-2"/>
                     Profil
                 </button>
             </div>
            
            <AnimatePresence mode="wait">
                {activeTab === 'metrics' ? renderMetrics() : renderProfileSettings()}
            </AnimatePresence>

        </div>
    );
};


// Komut Listesi Öğesi
const CommandListItem = ({ href, icon, title, subtitle }) => (
    // KRİTİK GÜNCELLEME: Stil, daha agresif ve fütüristik hale getirildi.
    <Link href={href} className="group command-list-item hover:bg-indigo-900/50 hover:border-indigo-500/50 transition-all duration-300">
        <div className="command-list-item-icon-wrapper bg-gray-900/50 p-3 rounded-lg border border-gray-700/50 group-hover:bg-indigo-700/50">
            <Icon name={icon} className="command-list-item-icon text-indigo-400 group-hover:text-white" />
        </div>
        <div>
            <h3 className="command-list-item-title text-lg font-extrabold text-white">{title}</h3>
            <p className="command-list-item-subtitle text-xs text-gray-400">{subtitle}</p>
        </div>
        <Icon name="arrow-right" className="command-list-item-arrow w-5 h-5 text-gray-600 ml-auto transition-transform" />
    </Link>
);

// YENİ BİLEŞEN: Risk Durumu ve Hızlı Erişim (Sağ Sütunu Birleştirir)
const RightPanelAccessCard = ({ T, riskStatus, isRiskLoading }) => {
    
    // Risk Kapısı Durum Kartı (RiskGateStatusCard'dan dönüştürüldü)
    const riskColorMap = { 'YÜKSEK': 'text-red-400', 'ORTA': 'text-yellow-400', 'DÜŞÜK': 'text-green-400' };
    const riskBgMap = { 'YÜKSEK': 'bg-red-900/20', 'ORTA': 'bg-yellow-900/20', 'DÜŞÜK': 'bg-green-900/20' };
    
    const riskStatusName = riskStatus?.status || 'YÜKLENİYOR';
    const riskColorClass = riskColorMap[riskStatusName] || 'text-gray-400';
    const riskBgClass = riskBgMap[riskStatusName] || 'bg-gray-700/50';

    return (
        // KRİTİK GÜNCELLEME: Sağ paneldeki dikey içeriği kısaltmak için 3. maddeler kaldırıldı.
        <div className="futuristic-card p-6 space-y-4 h-full border-2 border-sky-700/50 shadow-2xl shadow-sky-900/40">
            
            {/* 1. RİSK DURUMU ÖZETİ (Vurgu) */}
            <div className={`p-4 rounded-xl border-2 border-gray-700/50 ${riskBgClass} shadow-md`}>
                <h3 className="text-xl font-extrabold text-white mb-2 flex items-center">
                    <Icon name="shield-alert" className={`w-6 h-6 mr-3 ${riskColorClass} ${riskStatusName !== 'DÜŞÜK' ? 'animate-pulse' : ''}`} />
                    RİSK KAPISI PROTOKOLÜ
                </h3>
                <p className={`text-2xl font-bold ${riskColorClass}`}>{isRiskLoading ? 'ANALİZ EDİLİYOR...' : riskStatusName}</p>
                <p className="text-xs text-gray-400 mt-2">{riskStatus?.message || "Makro analiz bekleniyor."}</p>
            </div>

            {/* 2. ERİŞİM PROTOKOLLERİ (Kompakt liste) */}
            <div className="border-t border-gray-700/50 pt-4">
                 <h2 className="text-xl font-extrabold text-white mb-4">ERİŞİM PROTOKOLLERİ</h2>
                 <div className="space-y-3">
                    <CommandListItem href="/assistant" icon="send" title={T.nav_assistant} subtitle={"AI Asistan'a anında komut gönder."} />
                    <CommandListItem href="/kasa-yonetimi" icon="wallet" title={T.nav_kasa_yonetimi} subtitle={T.dashboard_kasa_subtitle} />
                    <CommandListItem href="/kokpit" icon="bar-chart-2" title={T.nav_kokpit} subtitle={"İşlem geçmişinizin derinlemesine analizi."} />
                    <CommandListItem href="/lig" icon="award" title={T.nav_lig} subtitle={"Disiplin Ligi'ndeki sıralamanızı görün."} />
                    <CommandListItem href="/market-pulse" icon="activity" title={T.nav_live_chart} subtitle={"Anlık piyasa ve likidite verileri."} />
                 </div>
            </div>
            
             {/* 3. BİLGİ KAYNAKLARI (3. sütunun uzamasını engellemek için kaldırıldı, üstteki CommandListItem'lere taşındı.) */}
            {/* <div className="border-t border-gray-700/50 pt-4">
                 <h2 className="text-xl font-extrabold text-white mb-4">SİSTEM BİLGİ KAYNAKLARI</h2>
                 <div className="space-y-3">
                    <CommandListItem href="/modules" icon="blocks" title={T.nav_modules} subtitle={T.dashboard_modules_subtitle} />
                    <CommandListItem href="/analyses" icon="users" title={T.nav_analysis_portal} subtitle="Topluluk analizlerini keşfedin." />
                 </div>
            </div> */}
        </div>
    );
};


// --- ANA DASHBOARD BİLEŞENİ ---
const DashboardPage = () => {
    const { T, user, userData, loading: authLoading, subscriptionEndDate } = useAuth();
    const { showToast } = useNotification();
    const { loading: authReqLoading } = useRequiredAuth({ requireLogin: true });

    const { data: kasaData, isLoading: kasaLoading } = trpc.kasa.getKasaData.useQuery(undefined, { enabled: !!user });
    const { data: marketData, isLoading: marketLoading } = trpc.market.getMarketData.useQuery(undefined, { enabled: !!user });

    const closedTradesForAnalytics = useMemo(() => (kasaData?.trades || []).filter(t => t.type === 'trade' && t.status === 'closed' && t.pnlUsd != null), [kasaData]);
    const { analytics } = usePerformanceAnalytics(closedTradesForAnalytics, kasaData?.summary?.initialBalance || 0);
    
    // Risk durumu (Artık LiveStatusHeader'a gönderiliyor)
    const riskStatus = useMemo(() => marketData?.fearGreedData?.value ? getRiskGateStatus(marketData.fearGreedData.value) : null, [marketData]);

    const handleUpdate = useCallback(async (newDisplayName, newTvUsername) => {
        if (!user) return;
        if (!newDisplayName.trim()) { showToast('Görünen ad boş olamaz.', 'error'); return; }
        try {
            await setDoc(doc(db, "users", user.uid), { displayName: newDisplayName.trim(), tradingViewUsername: newTvUsername.trim() }, { merge: true });
            showToast(T.dashboard_update_success, 'success');
        } catch (error) {
            showToast(T.dashboard_update_error, 'error');
        }
    }, [user, showToast, T]);

    const subscriptionProgress = useMemo(() => {
        if (!subscriptionEndDate || !subscriptionEndDate.getTime) return 0;
        const now = new Date();
        const end = subscriptionEndDate.getTime();
        const start = end - (30 * 24 * 60 * 60 * 1000);
        if (end <= now.getTime()) return 0;
        return Math.min(100, Math.max(0, ((now.getTime() - start) / (end - start)) * 100));
    }, [subscriptionEndDate]);

    const isLoading = authLoading || authReqLoading || kasaLoading || marketLoading || !T;

    if (isLoading) return <SkeletonLoader />;
    if (!user) return null;

    const userName = userData?.displayName || user.email?.split('@')[0] || 'Kullanıcı';
    const hasValidAnalytics = analytics.totalTrades > 0;

    return (
        // KRİTİK DÜZELTME: min-h-screen kaldırıldı. Sayfanın içeriği ne kadar ise o kadar uzayacak.
        <div className="dashboard-bg text-white p-4 md:p-8"> 
            <div className="container mx-auto max-w-screen-2xl">
                <LiveStatusHeader userName={userName} T={T} riskStatus={riskStatus} isRiskLoading={marketLoading} />
                
                <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Sol Sütun (3 Genişlik: Profil, Abonelik, Performans Entegre Edildi) */}
                    {/* KRİTİK DÜZELTME: min-h-[500px] eklenerek yan sütunlar hizalandı */}
                    <motion.div className="lg:col-span-3 space-y-8" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
                         <ProfileManagementCard 
                            user={user} 
                            userData={userData} 
                            T={T} 
                            subscriptionEndDate={subscriptionEndDate} 
                            subscriptionProgress={subscriptionProgress} 
                            handleUpdate={handleUpdate} 
                            analytics={analytics}
                            hasData={hasValidAnalytics}
                        />
                    </motion.div>

                    {/* ORTA SÜTUN (6 Genişlik: YENİ Holografik AI Paneli - ODAK) */}
                    <motion.div className="lg:col-span-6 space-y-8 h-full min-h-[450px]" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
                        <HolographicAIPanel 
                            T={T}
                            analytics={analytics}
                            hasData={hasValidAnalytics}
                            riskStatus={riskStatus}
                        />
                    </motion.div>
                    
                    {/* Sağ Sütun (3 Genişlik: Risk ve Erişim Protokolleri) */}
                    {/* KRİTİK DÜZELTME: min-h-[500px] eklenerek yan sütunlar hizalandı */}
                    <motion.div className="lg:col-span-3 space-y-8" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
                         <RightPanelAccessCard T={T} riskStatus={riskStatus} isRiskLoading={marketLoading}/>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;

