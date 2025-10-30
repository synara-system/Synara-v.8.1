// path: app/dashboard/DashboardClient.js
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useNotification } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';
import Icon from '@/components/Icon';
import { trpc } from '@/lib/trpc/client';
import { usePerformanceAnalytics } from '@/hooks/usePerformanceAnalytics';
import SkeletonLoader from '@/components/SkeletonLoader';
import { getRiskGateStatus } from '@/lib/RiskGateUtils'; // Güncellenmiş utility
import { motion, AnimatePresence } from 'framer-motion';
import { useRequiredAuth } from '@/hooks/useRequiredAuth'; // Yetkilendirme için eklendi
import dynamic from 'next/dynamic'; // KRİTİK: Dinamik import eklendi

// KRİTİK EKLENTİ: Ayarlar Modalını Dinamik Olarak Yükle
const UserSettingsModal = dynamic(() => import('@/components/UserSettingsModal'), {
     ssr: false, 
     loading: () => null,
});

// --- YARDIMCI SABİT: Çeviri yüklenene kadar kullanılacak temel placeholder ---
const DEFAULT_T = {
    guest: 'Kullanıcı',
    welcome_dashboard_user: 'Hoş Geldiniz {user}',
    dashboard_current_time: 'TR Saati',
    risk_gate_status: 'Risk Kapısı Durumu',
    risk_status_unknown: 'Bilinmeyen',
    dashboard_no_data_title: 'Veri Yok',
    dashboard_no_data_text: 'Başlamak için işlem ekleyin.',
    dashboard_add_transaction: 'İşlem Ekle',
    dashboard_subscription_title: 'Abonelik Durumu', 
    dashboard_performance_title: 'Performans Metrikleri', 
    dashboard_data_update_start: 'Manuel güncelleme başlatıldı.', 
    dashboard_data_update_success: 'Veriler başarıyla senkronize edildi.', 
    dashboard_data_update_fail: 'Güncelleme hatası. Lütfen daha sonra deneyin.', 
    profit_factor: 'Profit Factor',
    last_updated: 'Son Güncelleme',
    dashboard_data_updating: 'Güncelleniyor...',
    dashboard_data_update_button: 'Manuel Güncelle',
    dashboard_upgrade_prompt: 'Premium erişim ile Synara\'nın tam gücüne ulaşın.', 
    dashboard_upgrade_button: 'Şimdi Yükselt', 
    days_remaining: 'gün kaldı',
    risk_protocol_status: 'Risk Protokolü',
    risk_protocol_summary: 'Anlık piyasa verisi ile giriş/çıkış analizi.',
    go_to_market_pulse: 'Piyasa Nabzı Sayfasına Git', 
    dashboard_access_title: 'Erişim Kontrol', 
    nav_admin: 'Yönetim',
    nav_kasa_yonetimi: 'Kasa Yönetimi',
    dashboard_create_analysis: 'Analiz Oluştur',
    ai_hologram_title: 'Synara System Kullanıcı Paneli',
    ai_hologram_text: 'Sistem analitik verilerinizi ({riskStatus} risk seviyesi altında) yorumluyor.',
    ask_synara_assistant: 'Synara Asistan\'a Soru Sor', 
    win_rate: 'Kazanma Oranı',
    total_pnl: 'Toplam Kâr/Zarar (USD)', 
    max_drawdown: 'Max Düşüş',
    total_trades: 'Toplam İşlem Sayısı', 
    currency: 'USD', 
    dashboard_no_performance: 'Kapalı işlem bekleniyor.',
    risk_status_critical: 'KRİTİK',
    risk_status_high: 'YÜKSEK',
    risk_status_medium: 'ORTA',
    risk_status_low: 'DÜŞÜK',
    risk_protocol_analyzing: 'ANALİZ EDİLİYOR...',
    // Yeni eklenenler
    risk_critical_message: "KRİTİK UYARI: Aşırı uçlarda duygu hakim. Hızlı düzeltme riski çok yüksek.",
    risk_high_message: "UYARI: Piyasada açgözlülük veya korku hakim. Oynaklık riski yüksek.",
    risk_medium_message: "Piyasa nötr bölgede. Orta düzeyde oynaklık bekleniyor.",
    risk_low_message: "Piyasa stabil. Düşük risk. Ancak alt bölgeye dikkat.",
    risk_unknown_message: "Piyasa verisi bilinmiyor.",
    // KRİTİK EKLENTİ: Ayarlar çeviri anahtarları
    nav_settings: 'Kullanıcı Ayarları',
    user_settings_modal_title: 'Disiplin Protokolü Ayarları',
    user_settings_update_button: 'Bilgileri Güncelle',
    user_settings_displayName_label: 'Görünen Ad (Yorumlar İçin)',
    user_settings_tradingViewUsername_label: 'TradingView Kullanıcı Adı (Sinyal Eşleşmesi)',
    // KRİTİK EKLENTİ: Abonelik Kartı Bilgileri
    dashboard_register_date: 'Kayıt Tarihi',
    dashboard_subscription_expires: 'Abonelik Bitişi',
    dashboard_free_access: 'Ücretsiz Erişim', 
    dashboard_unlimited_access: 'Sınırsız Yönetici Erişimi', 
    // YENİ EK: Refresh butonu metinleri
    dashboard_refresh_subscription: 'Abonelik Durumunu Yenile',
    dashboard_refresh_success: 'Abonelik durumu güncellendi. Yeni yetkiler yüklendi.',
    dashboard_refresh_error: 'Abonelik durumu yenilenirken hata oluştu.',
};

// Renk haritası (Tailwind sınıfları)
const COLOR_MAP = {
    red: { bg: 'bg-red-500', text: 'text-red-400', border: 'border-red-500/50', shadow: 'shadow-red-900/40', ring: 'ring-red-500/50' },
    yellow: { bg: 'bg-yellow-500', text: 'text-yellow-400', border: 'border-yellow-500/50', shadow: 'shadow-yellow-900/40', ring: 'ring-yellow-500/50' },
    orange: { bg: 'bg-orange-500', text: 'text-orange-400', border: 'border-orange-500/50', shadow: 'shadow-orange-900/40', ring: 'ring-orange-500/50' },
    green: { bg: 'bg-green-500', text: 'text-green-400', border: 'border-green-500/50', shadow: 'shadow-green-900/40', ring: 'ring-green-500/50' },
    gray: { bg: 'bg-gray-500', text: 'text-gray-400', border: 'border-gray-500/50', shadow: 'shadow-gray-900/40', ring: 'ring-gray-500/50' },
    // Synara'ya özel ana renkler
    indigo: { bg: 'bg-indigo-500', text: 'text-indigo-400', border: 'border-indigo-600/30', shadow: 'shadow-indigo-900/40', ring: 'ring-indigo-500/50' },
};

// --- YARDIMCI BİLEŞENLER ---

// REFACTOR (PLAN_DASHBOARD_CLEANUP): Bileşen, render dışına (LiveStatusHeader) taşındı.
const StatusIndicator = ({ isRiskLoading, statusColor, pulse, T, statusText }) => (
    <span className={`inline-flex items-center text-sm font-medium ${isRiskLoading ? 'opacity-50' : ''}`}>
        <span className={`relative flex h-3 w-3 mr-2`}>
            <span className={`${statusColor.bg} absolute inline-flex h-full w-full rounded-full opacity-75 ${pulse ? 'animate-ping' : ''}`}></span>
            <span className={`${statusColor.bg} relative inline-flex rounded-full h-3 w-3`}></span>
        </span>
        {T.risk_gate_status || DEFAULT_T.risk_gate_status}: <span className="ml-1 font-semibold text-white">{statusText}</span>
    </span>
);

// Canlı Saat ve Sistem Durumu
const LiveStatusHeader = ({ userName, T, riskStatus, isRiskLoading, setIsSettingsModalOpen }) => {
    const [time, setTime] = useState('');
    useEffect(() => {
        const timer = setInterval(() => {
            const turkeyTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }));
            setTime(turkeyTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        }, 1000);
        
        return () => clearInterval(timer);
    }, []);

    // Risk durumuna göre renk ve metin belirleme
    const statusColor = isRiskLoading ? COLOR_MAP.gray : COLOR_MAP[riskStatus.color] || COLOR_MAP.gray;
    const statusText = isRiskLoading ? (T.risk_protocol_analyzing || DEFAULT_T.risk_protocol_analyzing) : (riskStatus.labelKey || T.risk_status_unknown);
    const pulse = riskStatus.level === 'CRITICAL' || riskStatus.level === 'HIGH';

    // REFACTOR (PLAN_DASHBOARD_CLEANUP): StatusIndicator tanımı yukarıya taşındı.

    return (
        // GÖRSEL GÜNCELLEME: Header stili
        <header className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-gray-900/60 border border-indigo-600/30 rounded-xl shadow-2xl shadow-indigo-900/40 backdrop-blur-sm">
            {/* Sol: Karşılama ve Zaman */}
            <div className="flex flex-col">
                <h1 className="text-3xl font-extrabold text-white tracking-tight">
                    {(T.welcome_dashboard_user || DEFAULT_T.welcome_dashboard_user).replace('{user}', userName)}
                </h1>
                <p className="text-gray-400 mt-1 text-sm md:text-base">
                    {T.dashboard_current_time || DEFAULT_T.dashboard_current_time}: <span className="text-indigo-400 font-semibold">{time}</span>
                </p>
            </div>

            {/* Sağ: Risk Durumu ve Hızlı Linkler */}
            <div className="flex flex-col items-start md:items-end mt-4 md:mt-0 space-y-2">
                {isRiskLoading ? (
                    <div className="h-6 w-48 bg-gray-800 rounded-full animate-pulse"></div>
                ) : (
                    // REFACTOR (PLAN_DASHBOARD_CLEANUP): Prop'lar eklendi
                    <StatusIndicator 
                        isRiskLoading={isRiskLoading} 
                        statusColor={statusColor} 
                        pulse={pulse} 
                        T={T} 
                        statusText={statusText} 
                    />
                )}
                
                <div className="flex space-x-4">
                    {/* KRİTİK DÜZELTME 1: Kasa Yönetimi ikonu (wallet) */}
                    <Link href="/kasa-yonetimi" className="text-indigo-400 hover:text-indigo-300 transition duration-150 flex items-center text-sm">
                        <Icon name="wallet" className="w-4 h-4 mr-1"/>
                        {T.nav_kasa_yonetimi || DEFAULT_T.nav_kasa_yonetimi}
                    </Link>
                    {/* KRİTİK DÜZELTME 2: Disiplin Ligi ikonu (award) */}
                    <Link href="/lig" className="text-indigo-400 hover:text-indigo-300 transition duration-150 flex items-center text-sm">
                        <Icon name="award" className="w-4 h-4 mr-1"/>
                        {T.nav_lig || DEFAULT_T.nav_lig}
                    </Link>
                    {/* KRİTİK DÜZELTME 3: Ayarlar ikonu (settings) */}
                    <button 
                        onClick={() => setIsSettingsModalOpen(true)}
                        className="text-yellow-400 hover:text-yellow-300 transition duration-150 flex items-center text-sm"
                        aria-label={T.nav_settings || 'Kullanıcı Ayarları'}
                    >
                        <Icon name="settings" className="w-4 h-4 mr-1"/>
                        {T.nav_settings || 'Ayarlar'}
                    </button>
                    {/* KRİTİK DÜZELTME BİTİŞ */}
                </div>
            </div>
        </header>
    );
};

// REFACTOR (PLAN_DASHBOARD_CLEANUP): Bileşen, render dışına (HolographicAIPanel) taşındı ve çakışmayı önlemek için yeniden adlandırıldı.
const HolographicStatCard = ({ title, value, icon, color, pulse = false }) => (
    <div className="flex items-center bg-gray-800/60 p-4 rounded-lg border border-gray-700 hover:border-indigo-600/50 transition duration-300">
        <div className={`p-2 rounded-full ${color} mr-4 relative`}>
            <Icon name={icon} className="w-6 h-6 text-white" />
            {pulse && <span className="absolute top-0 right-0 h-3 w-3 bg-red-400 rounded-full animate-ping"></span>}
        </div>
        <div>
            <p className="text-sm text-gray-400">{title}</p>
            <p className="text-xl font-bold text-white">{value}</p>
        </div>
    </div>
);

// Holografik AI Paneli
const HolographicAIPanel = ({ T, analytics, hasData, riskStatus }) => {
    // Risk objesini kullanıyoruz
    const currentRiskColor = COLOR_MAP[riskStatus.color] || COLOR_MAP.gray;
    const isHighRisk = riskStatus.level === 'CRITICAL' || riskStatus.level === 'HIGH';
    
    // KRİTİK FİX: Güvenli replace çağrısı
    const aiTextTemplate = T.ai_hologram_text || DEFAULT_T.ai_hologram_text;
    const aiText = aiTextTemplate.replace('{riskStatus}', riskStatus.labelKey || T.risk_status_unknown);

    const renderDataStatus = () => {
        if (!hasData) {
            return (
                <div className="text-center p-8">
                    {/* KRİTİK DÜZELTME 4: Veri Yok ikonu (database) */}
                    <Icon name="database" className="w-12 h-12 mx-auto mb-4 text-indigo-400 opacity-50"/>
                    <p className="text-lg text-gray-400">{T.dashboard_no_data_title || DEFAULT_T.dashboard_no_data_title}</p>
                    <p className="text-sm text-gray-500 mt-2">{T.dashboard_no_data_text || DEFAULT_T.dashboard_no_data_text}</p>
                    <Link href="/kasa-yonetimi" className="mt-4 inline-flex items-center text-indigo-400 hover:text-indigo-300 font-medium transition">
                        <Icon name="plus" className="w-4 h-4 mr-1" />
                        {T.dashboard_add_transaction || DEFAULT_T.dashboard_add_transaction}
                    </Link>
                </div>
            );
        }

        const winRate = analytics?.winRate !== undefined ? analytics.winRate.toFixed(1) : 'N/A';
        const totalProfitLoss = analytics?.totalPnl !== undefined ? analytics.totalPnl.toFixed(2) : 'N/A';
        const maxDrawdown = analytics?.maxDrawdown !== undefined ? (analytics.maxDrawdown * 100).toFixed(2) : 'N/A';
        const totalTrades = analytics?.totalTrades !== undefined ? analytics.totalTrades : 'N/A';

        // REFACTOR (PLAN_DASHBOARD_CLEANUP): StatCard tanımı yukarıya taşındı (HolographicStatCard oldu).

        return (
            <div className="grid grid-cols-2 gap-4">
                {/* REFACTOR (PLAN_DASHBOARD_CLEANUP): Yeniden adlandırılan bileşen kullanıldı */}
                <HolographicStatCard 
                    title={T.win_rate || DEFAULT_T.win_rate} 
                    value={`${winRate}%`} 
                    icon="trending-up" 
                    color="bg-indigo-500"
                />
                <HolographicStatCard 
                    title={T.total_pnl || DEFAULT_T.total_pnl} 
                    value={`${totalProfitLoss} ${T.currency || DEFAULT_T.currency}`} 
                    icon="dollar-sign" 
                    color={totalProfitLoss >= 0 ? 'bg-green-500' : 'bg-red-500'}
                />
                <HolographicStatCard 
                    title={T.max_drawdown || DEFAULT_T.max_drawdown} 
                    value={`${maxDrawdown}%`} 
                    icon="zap" 
                    color={maxDrawdown > 15 ? 'bg-red-500' : 'bg-yellow-500'} 
                    pulse={maxDrawdown > 15}
                />
                <HolographicStatCard 
                    title={T.total_trades || DEFAULT_T.total_trades} 
                    value={totalTrades} 
                    icon="bar-chart-2" 
                    color="bg-purple-500"
                />
            </div>
        );
    };

    return (
        // GÖRSEL GÜNCELLEME: Fütüristik, gölgeli kart stili ve hover efektı
        <motion.div 
            whileHover={{ scale: 1.01, boxShadow: `0 0 40px ${currentRiskColor.shadow}` }}
            className={`relative bg-gray-900/60 border ${currentRiskColor.border} rounded-xl shadow-2xl ${COLOR_MAP.indigo.shadow} p-6 md:p-8 h-full transition-all duration-300`}
        >
            {/* Holografik Kenarlık Efekti - Yüksek riskte pulse */}
            {isHighRisk && (
                <div className={`absolute inset-0 rounded-xl pointer-events-none transition duration-500 animate-pulse 
                    ring-4 ${currentRiskColor.ring}`}
                ></div>
            )}

            <div className="relative z-10 h-full flex flex-col">
                {/* Başlık */}
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                    {/* KRİTİK DÜZELTME 5: AI Hologram ikonu (monitor) */}
                    <Icon name="monitor" className="w-6 h-6 text-indigo-400 mr-3"/>
                    {T.ai_hologram_title || DEFAULT_T.ai_hologram_title}
                </h2>

                {/* AI Metni */}
                <div className={`p-4 rounded-lg bg-gray-800/70 border ${currentRiskColor.border} mb-6 transition duration-300`}>
                    <p className="text-sm italic font-medium">{riskStatus.message || aiText}</p>
                </div>

                {/* Veri Durumu/Özet Kartları */}
                <div className="flex-grow overflow-auto">
                    {renderDataStatus()}
                </div>

                {/* Alt Link */}
                <div className="mt-6 pt-4 border-t border-gray-700">
                    <Link href="/assistant" className="text-indigo-400 hover:text-indigo-300 transition duration-150 text-sm flex items-center">
                        {/* KRİTİK DÜZELTME 6: Asistan ikonu (message-square) */}
                        <Icon name="message-square" className="w-4 h-4 mr-1"/>
                        {T.ask_synara_assistant || DEFAULT_T.ask_synara_assistant}
                    </Link>
                </div>
            </div>
        </motion.div>
    );
};

// Sol Sütun - Abonelik ve Performans
const LeftPanelSubscription = ({ T, subscriptionProgress, handleUpdate, analytics, hasData, lastUpdatedDate }) => { 
    const { user, subscriptionEndDate, isAdmin, isApproved } = useAuth();
    
    // isPremium artık isApproved'dan geliyor. 
    const isPremium = useMemo(() => isAdmin || isApproved, [isAdmin, isApproved]); // KRİTİK: Adminler de Premium kabul edilir.
    
    const subscriptionLevel = isAdmin ? 'Admin' : (isPremium ? 'Premium' : 'Free');
    
    // Gün hesaplaması (claimsRefreshKey kaldırıldı)
    const daysRemaining = useMemo(() => {
        if (!subscriptionEndDate) return '---';
        const expirationDate = new Date(subscriptionEndDate); 
        const diff = expirationDate.getTime() - new Date().getTime();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return days > 0 ? days : 0;
    }, [subscriptionEndDate]); 

    // Tarih formatlama yardımcı fonksiyonları
    const formatDate = useCallback((timestamp) => {
        if (!timestamp) return null;
        const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
        if (isNaN(date.getTime()) || date.getFullYear() < 2000) return null;
        
        return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }, []); // KRİTİK FİX: user bağımlılığı kaldırıldı.
    
    // claimsRefreshKey kaldırıldı
    const registrationDate = useMemo(() => formatDate(user?.metadata.creationTime), [user?.metadata.creationTime, formatDate]); // Düzeltme 2
    const expirationDateFormatted = useMemo(() => formatDate(subscriptionEndDate), [subscriptionEndDate, formatDate]);         // Düzeltme 2
    
    // Abonelik Bitiş Durum Metni
    let expirationText;
    if (isAdmin) {
        expirationText = T.dashboard_unlimited_access || DEFAULT_T.dashboard_unlimited_access;
    } else if (isPremium && expirationDateFormatted) { 
        expirationText = expirationDateFormatted;
    } else {
        expirationText = T.dashboard_free_access || DEFAULT_T.dashboard_free_access;
    }

    const profitFactor = analytics.profitFactor || 'N/A';
    
    // =========================================================================
    // HATA DÜZELTMESİ (PLAN_DASHBOARD_FIX_v2) - ÖNCEKİ İŞLEMDEN KALMA
    // =========================================================================
    const lastUpdated = lastUpdatedDate 
        ? new Date(lastUpdatedDate).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : '---';
    // =========================================================================
    // DÜZELTME TAMAMLANDI
    // =========================================================================

    // DİKKAT: handleUpdateClick fonksiyonu, üst komponentten gelen handleUpdate'i çağırdığı için
    // handleUpdate bağımlılığını içerir. Bu doğru ve gereklidir.
    const handleUpdateClick = useCallback(() => {
        handleUpdate();
    }, [handleUpdate]);

    return (
        <div className="space-y-8 h-full">
            {/* Abonelik Kartı */}
            <motion.div 
                 whileHover={{ scale: 1.01, boxShadow: `0 0 20px ${COLOR_MAP.yellow.shadow}` }}
                className="bg-gray-900/60 border border-indigo-600/30 rounded-xl shadow-2xl shadow-indigo-900/40 p-6 transition-all duration-300"
            >
                <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                    {/* KRİTİK DÜZELTME 7: Abonelik ikonu (credit-card) */}
                    <Icon name="credit-card" className="w-5 h-5 text-yellow-400 mr-2"/>
                    {T.dashboard_subscription_title || DEFAULT_T.dashboard_subscription_title}
                </h2>
                
                {/* KRİTİK EKLENTİ: Kayıt ve Bitiş Tarihleri */}
                <div className="space-y-2 mb-4 text-sm">
                    {/* Kayıt Tarihi */}
                    <div className="flex justify-between items-center text-gray-400">
                        <span className="flex items-center">
                            {/* KRİTİK DÜZELTME 8: Kayıt tarihi ikonu (calendar-days) */}
                            <Icon name="calendar-days" className="w-4 h-4 mr-2 text-indigo-400"/>
                            {T.dashboard_register_date || DEFAULT_T.dashboard_register_date}:
                        </span>
                        <span className="text-white font-medium">{registrationDate || '---'}</span>
                    </div>

                    {/* Bitiş Tarihi */}
                    <div className="flex justify-between items-center text-gray-400">
                        <span className="flex items-center">
                            {/* KRİTİK DÜZELTME 9: Bitiş tarihi ikonu (clock) */}
                            <Icon name="clock" className="w-4 h-4 mr-2 text-indigo-400"/>
                            {T.dashboard_subscription_expires || DEFAULT_T.dashboard_subscription_expires}:
                        </span>
                        <span className={`font-medium ${isPremium ? 'text-yellow-400' : 'text-gray-400'}`}>
                            {expirationText}
                        </span>
                    </div>
                </div>

                <div className="flex justify-between items-center mb-4 border-t border-gray-700 pt-4">
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${isPremium ? 'bg-yellow-500/20 text-yellow-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                        {subscriptionLevel}
                    </span>
                    {(isPremium && expirationDateFormatted && daysRemaining > 0) && (
                        <span className="text-sm text-gray-400">
                            {daysRemaining} {T.days_remaining || DEFAULT_T.days_remaining}
                        </span>
                    )}
                </div>
                
                {!isPremium && (
                    <div className="mt-4">
                        <p className="text-sm text-gray-400 mb-3">{T.dashboard_upgrade_prompt || DEFAULT_T.dashboard_upgrade_prompt}</p>
                        {/* KRİTİK FİX: Buton Link'i /pricing yerine /#pricing olarak düzeltildi */}
                        <Link 
                            href="/#pricing" 
                            className="w-full text-center inline-block py-2 px-4 bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 rounded-lg text-white font-semibold transition duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
                        >
                            {T.dashboard_upgrade_button || DEFAULT_T.dashboard_upgrade_button}
                        </Link>
                    </div>
                )}
            </motion.div>

            {/* Performans ve Güncelleme Kartı */}
            <motion.div 
                whileHover={{ scale: 1.01, boxShadow: `0 0 20px ${COLOR_MAP.green.shadow}` }}
                className="bg-gray-900/60 border border-indigo-600/30 rounded-xl shadow-2xl shadow-indigo-900/40 p-6 transition-all duration-300"
            >
                <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                    {/* KRİTİK DÜZELTME 10: Performans ikonu (trending-up) */}
                    <Icon name="trending-up" className="w-5 h-5 text-green-400 mr-2"/>
                    {T.dashboard_performance_title || DEFAULT_T.dashboard_performance_title}
                </h2>
                
                {hasData ? (
                    <>
                        <p className="text-3xl font-extrabold text-green-400 mb-4">
                            {typeof profitFactor === 'number' ? profitFactor.toFixed(2) : profitFactor}
                            <span className="text-sm font-normal text-gray-400 ml-2">{T.profit_factor || DEFAULT_T.profit_factor}</span>
                        </p>
                        <div className="text-sm text-gray-400 mb-6">
                            {/* GÜNCELLENDİ: lastUpdated prop'tan geliyor */}
                            <p>{T.last_updated || DEFAULT_T.last_updated}: <span className="text-white font-medium">{lastUpdated}</span></p>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-4">
                        <p className="text-gray-400">{T.dashboard_no_performance || DEFAULT_T.dashboard_no_performance}</p>
                    </div>
                )}

                <button 
                    onClick={handleUpdateClick}
                    disabled={subscriptionProgress?.isLoading}
                    className="w-full flex items-center justify-center py-2 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded-lg text-white font-semibold transition duration-200 shadow-md"
                >
                    {subscriptionProgress?.isLoading ? (
                        <>
                            {/* KRİTİK DÜZELTME 11: Yükleyici ikonu (loader) */}
                            <Icon name="loader" className="w-5 h-5 mr-2 animate-spin"/>
                            {T.dashboard_data_updating || DEFAULT_T.dashboard_data_updating}
                        </>
                    ) : (
                        <>
                            {/* KRİTİK DÜZELTME 12: Yenileme ikonu (refresh-cw) */}
                            <Icon name="refresh-cw" className="w-5 h-5 mr-2"/>
                            {T.dashboard_data_update_button || DEFAULT_T.dashboard_data_update_button}
                        </>
                    )}
                </button>
            </motion.div>
        </div>
    );
};

// Sağ Sütun - Risk ve Erişim Protokolleri
const RightPanelAccessCard = ({ T, riskStatus, isRiskLoading }) => { // KRİTİK EKSİK BİLEŞEN TANIMI EKLENDİ
    const { isAdmin } = useAuth();
    
    // Risk objesinden renk ve seviye çekiliyor
    const currentRiskColor = COLOR_MAP[riskStatus.color] || COLOR_MAP.gray;
    const riskStatusText = isRiskLoading ? T.risk_protocol_analyzing : riskStatus.labelKey;

    return (
        <div className="space-y-8 h-full">
            {/* Risk Protokol Durumu */}
            <motion.div 
                whileHover={{ scale: 1.01, boxShadow: `0 0 20px ${currentRiskColor.shadow}` }}
                className={`bg-gray-900/50 border rounded-xl shadow-xl p-6 transition duration-300 ${currentRiskColor.border} shadow-indigo-900/30`}
            >
                <h2 className={`text-xl font-bold mb-4 flex items-center ${currentRiskColor.text}`}>
                    {/* KRİTİK DÜZELTME 13: Risk Protokol ikonu (activity) */}
                    <Icon name="activity" className="w-5 h-5 mr-2"/>
                    {T.risk_protocol_status || DEFAULT_T.risk_protocol_status}
                </h2>
                
                {isRiskLoading ? (
                    <div className='flex items-center space-x-2'>
                         <Icon name="loader" className="w-5 h-5 text-indigo-400 animate-spin"/>
                        <p className="text-xl font-extrabold text-gray-400">{riskStatusText}</p>
                    </div>
                ) : (
                    <p className={`text-2xl font-extrabold mb-4 ${currentRiskColor.text}`}>{riskStatusText}</p>
                )}
                
                <p className="text-sm opacity-80 mb-4">{riskStatus.message || (T.risk_protocol_summary || DEFAULT_T.risk_protocol_summary)}</p>

                <Link href="/market-pulse" className="text-indigo-400 hover:text-indigo-300 transition duration-150 text-sm flex items-center">
                    {/* KRİTİK DÜZELTME 14: Market Pulse ikonu (bar-chart-2) */}
                    <Icon name="bar-chart-2" className="w-4 h-4 mr-1"/>
                    {T.go_to_market_pulse || DEFAULT_T.go_to_market_pulse}
                </Link>
            </motion.div>

            {/* Erişim ve Yönetim Kartı */}
            <motion.div 
                whileHover={{ scale: 1.01, boxShadow: `0 0 20px ${COLOR_MAP.indigo.shadow}` }}
                className="bg-gray-900/60 border border-indigo-600/30 rounded-xl shadow-2xl shadow-indigo-900/40 p-6 transition-all duration-300"
            >
                <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                    {/* KRİTİK DÜZELTME 15: Erişim Kontrol ikonu (lock) */}
                    <Icon name="lock" className="w-5 h-5 text-red-400 mr-2"/>
                    {T.dashboard_access_title || DEFAULT_T.dashboard_access_title}
                </h2>

                <div className="space-y-3">
                    {/* Admin Linki */}
                    {isAdmin && (
                        <Link href="/admin" className="flex items-center justify-between p-3 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition duration-150">
                            <span className="flex items-center text-red-400">
                                {/* KRİTİK DÜZELTME 16: Admin ikonu (settings) */}
                                <Icon name="settings" className="w-5 h-5 mr-3"/>
                                {T.nav_admin || DEFAULT_T.nav_admin}
                            </span>
                            <Icon name="arrow-right" className="w-4 h-4"/>
                        </Link>
                    )}
                    
                    {/* Kasa Yönetimi Linki (Tekrar) */}
                    <Link href="/kasa-yonetimi" className="flex items-center justify-between p-3 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition duration-150">
                        <span className="flex items-center text-indigo-400">
                            {/* KRİTİK DÜZELTME 17: Kasa ikonu (briefcase) */}
                            <Icon name="briefcase" className="w-5 h-5 mr-3"/>
                            {T.nav_kasa_yonetimi || DEFAULT_T.nav_kasa_yonetimi}
                        </span>
                        <Icon name="arrow-right" className="w-4 h-4"/>
                    </Link>

                    {/* Analiz Oluştur Linki */}
                    <Link href="/analyses/create" className="flex items-center justify-between p-3 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition duration-150">
                        <span className="flex items-center text-green-400">
                            {/* KRİTİK DÜZELTME 18: Analiz ikonu (clipboard-list) */}
                            <Icon name="clipboard-list" className="w-5 h-5 mr-3"/>
                            {T.dashboard_create_analysis || DEFAULT_T.dashboard_create_analysis}
                        </span>
                        <Icon name="arrow-right" className="w-4 h-4"/>
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

// Ana Dashboard Bileşeni
const DashboardClient = () => { 
    useRequiredAuth({ requireLogin: true }); 
    
    // KRİTİK EKLENTİ 1: Ayarlar modalını yönetmek için state
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

    // Dil ve Kullanıcı verileri
    const { T, user, userData, loading: authLoading } = useAuth();
    const finalT = T && Object.keys(T).length > 0 ? T : DEFAULT_T; 
    
    const userName = user?.displayName || user?.email?.split('@')[0] || finalT.guest;

    // KRİTİK FİX: SESSİZ TOKEN YENİLEME TEK SEFERE DÜŞÜRÜLDÜ (Yetki güncellemeleri için)
    useEffect(() => {
        const refreshOnce = async () => {
            if (user) {
                try {
                    // Sayfaya girildiğinde token'ı bir kere yenile (Custom Claims'i günceller)
                    await user.getIdToken(true); 
                    console.log("INFO: Abonelik yetkisi token'ı başarılı bir şekilde yenilendi.");
                } catch (error) {
                    console.error("Sessiz token yenileme hatası:", error);
                }
            }
        };

        refreshOnce();
    }, [user]);
    // KRİTİK FİX BİTTİ

    // Kasa verileri ve analitik
    const utils = trpc.useUtils();
    const { data: kasaData, isLoading: kasaLoading } = trpc.kasa.getKasaData.useQuery(undefined, { enabled: !!user });
    
    const closedTradesForAnalytics = useMemo(() => 
        (kasaData?.trades || []).filter(t => t.type === 'trade' && t.status === 'closed' && t.pnlUsd !== undefined && t.pnlUsd !== null)
    , [kasaData]);
    
    // KRİTİK FİX: En son kapanan işlemin zaman damgasını bulma
    const lastTradeCloseDate = useMemo(() => {
        if (!closedTradesForAnalytics.length) return null;
        
        // closedTimestamp'ı olan en son işlemi bul
        const sortedTrades = [...closedTradesForAnalytics].sort((a, b) => {
            const dateA = new Date(a.closeTimestamp).getTime();
            const dateB = new Date(b.closeTimestamp).getTime();
            return dateB - dateA; // En yeni tarih en başta
        });
        
        return sortedTrades[0].closeTimestamp; // ISO string olarak döndür
    }, [closedTradesForAnalytics]);


    const { analytics, isLoading: analyticsLoading, subscriptionProgress, handleUpdate } = usePerformanceAnalytics(closedTradesForAnalytics, kasaData?.summary?.initialBalance || 0);
    const hasValidAnalytics = analytics.totalTrades > 0;

    // Piyasa Durumu (RiskGate) verileri
    const { data: marketData, isLoading: marketLoading } = trpc.market.getLatestMarketInfo.useQuery(undefined, { 
        staleTime: 1000 * 60 * 5,
    });

    const riskStatus = useMemo(() => {
        const fearGreedValue = marketData?.fearGreedData?.value;
        // KRİTİK FİX: Holografik AI Panelde doğru mesajı göstermek için,
        // RisGateUtils'ten gelen mesaja T.ai_hologram_text'i ekledik. 
        const status = getRiskGateStatus(finalT, fearGreedValue);
        
        // KRİTİK: RiskGateUtils'ten gelen mesajı kullanmak için HolographicAIPanel içinde düzenleme yapıldı (yukarıda).

        return status;
    }, [marketData, finalT]);

    // KRİTİK DÜZELTME 1 (Hata Giderme): useCallback çağrısını erken dönüşten ÖNCE taşı
    // UYARI GİDERİLDİ: Bu callback'in bağımlılıkları (handleUpdate, utils) zaten doğru.
    const updatePerformanceAndKasa = useCallback(async () => {
        try {
             await handleUpdate();
             utils.kasa.getKasaData.invalidate();
             utils.market.getLatestMarketInfo.invalidate();
        } catch (e) {
            console.error("Manuel Güncelleme Hatası:", e);
        }
    }, [handleUpdate, utils]);
    // KRİTİK DÜZELTME BİTTİ

    // Ana Yükleme Durumu
    if (authLoading || kasaLoading || analyticsLoading || !user) { 
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <Icon name="loader" className="w-10 h-10 text-indigo-400 animate-spin"/>
                <p className="ml-3 text-lg text-gray-400">{finalT.loading || 'Yükleniyor...'}</p>
            </div>
        );
    }
    
    // Ana Bileşen Render
    return (
        <div className="dashboard-bg text-white p-4 md:p-8"> 
            <div className="container mx-auto max-w-screen-2xl">
                
                {/* 1. Üst Kısım: Başlık, Saat ve Hızlı Durum */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    {/* KRİTİK EKLENTİ 2: setIsSettingsModalOpen prop'u LiveStatusHeader'a geçirildi */}
                    <LiveStatusHeader 
                        userName={userName} 
                        T={finalT} 
                        riskStatus={riskStatus} 
                        isRiskLoading={marketLoading}
                        setIsSettingsModalOpen={setIsSettingsModalOpen}
                    />
                </motion.div>

                {/* 2. Orta Kısım: 3 Sütunlu Izgara */}
                <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Sol Sütun (3 Genişlik: Abonelik ve Performans) */}
                    <motion.div className="lg:col-span-3 space-y-8" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
                         <LeftPanelSubscription 
                            user={user} 
                            userData={userData} 
                            T={finalT} 
                            subscriptionProgress={subscriptionProgress} 
                            handleUpdate={updatePerformanceAndKasa}
                            analytics={analytics}
                            hasData={hasValidAnalytics}
                            lastUpdatedDate={lastTradeCloseDate} 
                            // claimsRefreshKey prop'u tamamen kaldırıldı
                        />
                    </motion.div>

                    {/* ORTA SÜTUN (6 Genişlik: YENİ Holografik AI Paneli - ODAK) */}
                    <motion.div className="lg:col-span-6 space-y-8 h-full min-h-[450px]" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
                        <HolographicAIPanel 
                            T={finalT}
                            analytics={analytics}
                            hasData={hasValidAnalytics}
                            riskStatus={riskStatus} 
                        />
                    </motion.div>
                    
                    {/* Sağ Sütun (3 Genişlik: Risk ve Erişim Protokolleri) */}
                    <motion.div className="lg:col-span-3 space-y-8" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
                         <RightPanelAccessCard T={finalT} riskStatus={riskStatus} isRiskLoading={marketLoading}/>
                    </motion.div>
                </div>
            </div>
            
            {/* KRİTİK EKLENTİ 3: Ayarlar Modalını Render Et */}
            <AnimatePresence>
                {isSettingsModalOpen && (
                    <UserSettingsModal 
                        T={finalT} 
                        initialData={{ 
                            displayName: userData?.displayName || user.displayName || '',
                            tradingViewUsername: userData?.tradingViewUsername || '',
                        }}
                        onClose={() => setIsSettingsModalOpen(false)} 
                    />
                )}
            </AnimatePresence>
            
        </div>
    );
};

export default DashboardClient;
