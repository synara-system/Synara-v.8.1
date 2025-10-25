// path: app/market-pulse/page.js
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRequiredAuth } from '@/hooks/useRequiredAuth';
import Icon from '@/components/Icon';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { trpc } from '@/lib/trpc/client';

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
        return dateString.includes('GMT-4');
    } catch (e) {
        const month = date.getMonth();
        return month >= 2 && month <= 10;
    }
};

const formatCountdown = (milliseconds) => {
    if (milliseconds < 0) return "00:00:00";
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
};

// --- BAĞIMSIZ WIDGET BİLEŞENLERİ ---

const Widget = ({ children, className = '' }) => (
    <div className={`futuristic-card p-6 rounded-2xl border border-gray-700/50 shadow-2xl shadow-black/30 backdrop-blur-md transition-all duration-300 hover:border-indigo-500/50 hover:shadow-indigo-900/40 ${className}`}>
        {children}
    </div>
);

const Title = ({ children, icon, color = 'text-white' }) => (
    <h3 className={`text-lg font-bold ${color} mb-4 flex items-center`}>
        {icon && <Icon name={icon} className={`w-5 h-5 mr-3 text-indigo-400`} />}
        {children}
    </h3>
);

const MarketSessionsWidget = ({ T, currentTime }) => {
    const isDST = useMemo(() => isNewYorkDST(new Date(currentTime)), [currentTime]);
    
    const sessions = useMemo(() => {
        const nyOpen = isDST ? 15.5 : 16.5;
        const nyClose = nyOpen + 8.5;
        return [
            { name: T.market_pulse_tokyo || "Asya", open: 2, close: 10, key: 'tokyo' },
            { name: T.market_pulse_london || "Londra", open: 11, close: 19, key: 'london' },
            { name: T.market_pulse_new_york || "New York", open: nyOpen, close: nyClose, key: 'ny' },
        ];
    }, [isDST, T.market_pulse_tokyo, T.market_pulse_london, T.market_pulse_new_york]);
    
    const timeData = useMemo(() => {
        const nowTR = getTurkeyTime(new Date(currentTime));
        const nowHourDecimal = nowTR.hour + nowTR.minute / 60;
        const nowDay = nowTR.day;
        const now = nowTR.dateObject;
        const newData = {};
        const isWeekend = nowDay === 0 || nowDay === 6;

        sessions.forEach(session => {
            let isOpen = !isWeekend && (nowHourDecimal >= session.open && nowHourDecimal < session.close);
            if (session.key === 'ny' && !isDST) {
               isOpen = !isWeekend && (nowHourDecimal >= session.open || nowHourDecimal < (session.close - 24));
            }
            
            let countdownMs = 0;
            let statusText = isOpen ? T.market_pulse_closes_in : T.market_pulse_opens_in;

            if (!isWeekend) {
                const targetHour = isOpen ? session.close : session.open;
                const [hour, minutePart] = String(targetHour).split('.').map(Number);
                const minute = minutePart ? minutePart * 6 : 0;
                let targetDate = new Date(now);
                targetDate.setHours(hour, minute, 0, 0);
                if (targetDate.getTime() <= now.getTime()) targetDate.setDate(targetDate.getDate() + 1);
                if (targetDate.getDay() === 6) targetDate.setDate(targetDate.getDate() + 2);
                else if (targetDate.getDay() === 0) targetDate.setDate(targetDate.getDate() + 1);
                countdownMs = targetDate.getTime() - now.getTime();
            } else {
                statusText = T.market_pulse_closed || "Kapalı";
                let nextOpen = new Date(now);
                nextOpen.setHours(2, 0, 0, 0);
                if (nowDay === 6) nextOpen.setDate(nextOpen.getDate() + 2);
                else nextOpen.setDate(nextOpen.getDate() + 1);
                countdownMs = nextOpen.getTime() - now.getTime();
            }
            newData[session.key] = { isOpen, countdown: formatCountdown(countdownMs), statusText };
        });
        return newData;
    }, [currentTime, sessions, isDST, T.market_pulse_closes_in, T.market_pulse_opens_in, T.market_pulse_closed]);

    return (
        <Widget className="lg:row-span-2 flex flex-col justify-between">
            <Title icon="clock">{T.market_pulse_sessions_title}</Title>
            <div className="space-y-4">
                {sessions.map(session => (
                    <div key={session.key} className="flex justify-between items-center text-sm p-3 bg-gray-700/30 rounded-lg border border-gray-700/50 transition-all duration-300 hover:border-indigo-500/50">
                        <div className="flex items-center">
                            <span className={`w-3 h-3 rounded-full mr-3 ${timeData[session.key]?.isOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                            <span className={`font-bold ${timeData[session.key]?.isOpen ? 'text-white' : 'text-gray-400'}`}>{session.name}</span>
                        </div>
                        <div className="text-right">
                            <span className="text-xs text-gray-400 block">{timeData[session.key]?.statusText}</span>
                            <span className={`font-mono font-semibold text-base ${timeData[session.key]?.isOpen ? 'text-green-400' : 'text-red-400'}`}>
                                {timeData[session.key]?.countdown || "---"}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </Widget>
    );
};

const EconomicCalendarWidget = ({ T, events, isLoading }) => {
    const impactColor = {
        high: 'bg-red-900/50 text-red-300 border-red-500/30',
        medium: 'bg-orange-900/50 text-orange-300 border-orange-500/30'
    };
    return (
        <Widget className="lg:row-span-2"> 
            <Title icon="calendar-days">{T.market_pulse_economic_calendar_title}</Title>
            <div className="space-y-3">
                {isLoading ? <p className="text-gray-500 text-sm">Yükleniyor...</p> : events.map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-sm p-2 bg-gray-700/30 rounded-lg transition-all duration-300 hover:border-yellow-500/50 border border-transparent">
                        <div className="flex items-center">
                           <span className="font-mono text-indigo-400 mr-3 text-xs">{item.date}</span>
                           <span className="font-semibold text-white">{item.event}</span>
                        </div>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${impactColor[item.impact]}`}>
                            {item.impact === 'high' ? T.market_pulse_impact_high : T.market_pulse_impact_medium}
                        </span>
                    </div>
                ))}
                 <div className="h-4"></div> 
            </div>
        </Widget>
    );
};

const VolatilityWidget = ({ T }) => {
    const { text, color } = useMemo(() => {
        const now = new Date();
        const day = now.getDay();
        if (day === 5 || day === 1) return { color: 'text-red-400', text: T.market_pulse_volatility_high };
        if (day === 0 || day === 6) return { color: 'text-green-400', text: T.market_pulse_volatility_low };
        return { color: 'text-yellow-400', text: T.market_pulse_volatility_medium };
    }, [T.market_pulse_volatility_high, T.market_pulse_volatility_low, T.market_pulse_volatility_medium]);
    
    return (
        <Widget className="text-center flex flex-col justify-center items-center">
            <Title icon="zap" color={color}>{T.market_pulse_volatility_title}</Title>
            <div className={`text-4xl font-extrabold ${color} tracking-wider`}>{text.toUpperCase()}</div>
            <p className="text-xs text-gray-500 mt-2">Güncel Piyasa Hızı</p>
        </Widget>
    );
};

const FearGreedWidget = ({ T, fearGreedScore, marketData, isLoading }) => {
    const data = marketData?.fearGreedData;
    const { statusText, colorClass, dynamicBg, dynamicBorder } = useMemo(() => {
        let value = fearGreedScore;
        let statusText = T.market_pulse_fear_greed_status_neutral;
        let colorClass = 'bg-yellow-800/20 text-yellow-300 border-yellow-500/50';
        if (value < 20) { statusText = T.market_pulse_fear_greed_status_extreme_fear; colorClass = 'bg-red-800/20 text-red-300 border-red-500/50'; }
        else if (value < 40) { statusText = T.market_pulse_fear_greed_status_fear; colorClass = 'bg-orange-800/20 text-orange-300 border-orange-500/50'; }
        else if (value > 80) { statusText = T.market_pulse_fear_greed_status_extreme_greed; colorClass = 'bg-green-800/20 text-green-300 border-green-500/50'; }
        else if (value > 60) { statusText = T.market_pulse_fear_greed_status_greed; colorClass = 'bg-teal-800/20 text-teal-300 border-teal-500/50'; }
        const dynamicBg = value < 50 ? 'from-gray-900 via-red-900/10 to-gray-900' : 'from-gray-900 via-green-900/10 to-gray-900';
        const dynamicBorder = value < 50 ? 'border-red-500/70' : 'border-green-500/70';
        return { statusText, colorClass, dynamicBg, dynamicBorder };
    }, [fearGreedScore, T]);

    return (
        <div className={`futuristic-card col-span-full md:col-span-2 lg:row-span-2 text-center bg-gradient-to-br ${dynamicBg} p-8 border-2 ${dynamicBorder} shadow-2xl shadow-black/50 transition-all duration-500 hover:shadow-lg ${dynamicBorder.replace('border-', 'shadow-').replace('/70', '/50')}`}>
            <Title icon="alert-triangle" color="text-indigo-400">{T.market_pulse_fear_greed_title}</Title>
            <div className={`p-8 rounded-full w-40 h-40 mx-auto flex items-center justify-center border-4 border-white/10 ${colorClass}`}>
                <span className="text-5xl font-extrabold text-white leading-none">{isLoading ? '...' : fearGreedScore}</span>
            </div>
            <p className={`text-xl font-semibold mt-4 ${colorClass.split(' ')[1]}`}>{statusText}</p>
            <p className="text-xs text-gray-500 mt-1">Son Güncelleme: {data?.timestamp ? new Date(parseInt(data.timestamp) * 1000).toLocaleDateString('tr-TR') : '---'}</p>
        </div>
    );
};

const TopGainersWidget = ({ T, marketData, isLoading }) => {
    const displayData = marketData?.trendingData || [];
    return (
        <Widget>
            <Title icon="trending-up" color="text-green-400">{T.market_pulse_top_gainers}</Title>
            <div className="space-y-3">
                {isLoading ? <p className="text-gray-500 text-sm">{T.kasa_loading || 'Yükleniyor...'}</p> : (
                    displayData.map((item, index) => (
                        <div key={item.symbol} className="flex justify-between items-center text-sm p-2 bg-gray-700/30 rounded-lg transition-all duration-300 hover:border-green-500/50 border border-transparent">
                            <span className={`font-bold ${index < 3 ? 'text-white' : 'text-gray-300'}`}>{item.symbol}/USDT</span>
                            <span className="font-mono font-semibold text-green-400 text-xs">
                                #Rank: {item.market_cap_rank}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </Widget>
    );
};

const TopLosersWidget = ({ T }) => {
    const data = [{ symbol: 'AXL', change: -15.8 },{ symbol: 'DYM', change: -12.3 },{ symbol: 'PYTH', change: -11.9 },{ symbol: 'TIA', change: -9.2 },{ symbol: 'RON', change: -8.5 }];
    return (
        <Widget>
            <Title icon="trending-down" color="text-red-400">{T.market_pulse_top_losers}</Title>
            <div className="space-y-3">
                {data.map(item => (
                    <div key={item.symbol} className="flex justify-between items-center text-sm p-2 bg-gray-700/30 rounded-lg transition-all duration-300 hover:border-red-500/50 border border-transparent">
                        <span className="font-bold text-white">{item.symbol}/USDT</span>
                        <span className="font-mono font-semibold text-red-400 text-xs">
                            {item.change.toFixed(2)}%
                        </span>
                    </div>
                ))}
            </div>
        </Widget>
    );
};

const FundingRatesWidget = ({ T, fearGreedScore }) => {
    const data = useMemo(() => {
        const baseRate = 0.01;
        const delta = (fearGreedScore - 50) / 50 * 0.015;
        return [
            { symbol: 'BTC', rate: parseFloat((baseRate + delta * 0.5).toFixed(4)) },
            { symbol: 'ETH', rate: parseFloat((baseRate * 1.5 + delta * 0.8).toFixed(4)) },
            { symbol: 'SOL', rate: parseFloat((baseRate * -0.5 + delta * 1.2).toFixed(4)) },
            { symbol: 'DOGE', rate: parseFloat((baseRate * 2 + delta * 1.5).toFixed(4)) },
            { symbol: 'BNB', rate: parseFloat((baseRate * 0.8 + delta * 0.4).toFixed(4)) }
        ];
    }, [fearGreedScore]);

    return (
        <Widget>
            <Title icon="dollar-sign">{T.market_pulse_funding_rates}</Title>
            <div className="space-y-3">
                {data.map(item => (
                    <div key={item.symbol} className="flex justify-between items-center text-sm p-2 bg-gray-700/30 rounded-lg transition-all duration-300 hover:border-indigo-500/50 border border-transparent">
                        <span className="font-bold text-white">{item.symbol}/USDT</span>
                        <span className={`font-mono font-semibold text-xs ${item.rate > 0 ? 'text-green-400' : 'text-red-400'}`}>{item.rate.toFixed(4)}%</span>
                    </div>
                ))}
            </div>
        </Widget>
    );
};

const LongShortRatioWidget = ({ T, fearGreedScore }) => {
    const data = useMemo(() => {
        const base = 50;
        const diff = (fearGreedScore - base) * 0.1;
        const btcLong = Math.min(60, Math.max(40, 50.0 + diff));
        const ethLong = Math.min(57, Math.max(43, 50.0 + diff * 0.7));
        return {
            btc: { long: parseFloat(btcLong.toFixed(1)), short: parseFloat((100 - btcLong).toFixed(1)) },
            eth: { long: parseFloat(ethLong.toFixed(1)), short: parseFloat((100 - ethLong).toFixed(1)) }
        };
    }, [fearGreedScore]);

    const RatioBar = ({ long, short }) => (<div className="w-full bg-gray-700 rounded-full h-2 flex overflow-hidden"><div className="bg-green-500 h-full" style={{ width: `${long}%` }}></div><div className="bg-red-500 h-full" style={{ width: `${short}%` }}></div></div>);
    
    return (
        <Widget className="lg:row-span-2"> 
            <Title icon="scale">{T.market_pulse_long_short_ratio}</Title>
            <div className="space-y-4">
                <div className="p-3 bg-gray-700/30 rounded-lg transition-all duration-300 hover:border-green-500/50 border border-transparent">
                     <span className="font-bold text-white block mb-1">BTC/USDT</span>
                     <RatioBar long={data.btc.long} short={data.btc.short} />
                </div>
                <div className="p-3 bg-gray-700/30 rounded-lg transition-all duration-300 hover:border-green-500/50 border border-transparent">
                     <span className="font-bold text-white block mb-1">ETH/USDT</span>
                     <RatioBar long={data.eth.long} short={data.eth.short} />
                </div>
            </div>
        </Widget>
    );
};

// --- ANA SAYFA BİLEŞENİ ---

const MarketPulsePage = () => {
    const { T } = useAuth();
    const { loading: authLoading, redirectPath, isApproved } = useRequiredAuth({ requireLogin: true, requireApproved: true });
    const [currentTime, setCurrentTime] = useState(Date.now());

    const { data: marketData, isLoading, error } = trpc.market.getMarketData.useQuery(undefined, {
        enabled: !!isApproved,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: true,
    });
    
    const fearGreedScore = useMemo(() => {
        return marketData?.fearGreedData?.value ? parseInt(marketData.fearGreedData.value, 10) : 50;
    }, [marketData]);

    useEffect(() => {
        if (!isApproved) return;
        const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
        return () => clearInterval(interval);
    }, [isApproved]);

    if (authLoading || redirectPath) {
        return (
            <div className="min-h-screen bg-gray-900 flex justify-center items-center p-4">
                 <div className="text-center">
                    <div className="loader mx-auto"></div>
                    <p className="text-gray-400 mt-4">{T?.kasa_loading || "Sistem Yetkisi Kontrol Ediliyor..."}</p>
                </div>
            </div>
        );
    }
    
    if (!isApproved) {
         return (
             <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center p-4 text-center">
                <Icon name="shield-check" className="w-12 h-12 text-amber-400 mb-4" />
                <h2 className="text-2xl font-bold">{T.access_denied_title || "Erişim Reddedildi"}</h2>
                <p className="text-lg text-gray-400 mt-2">{T.access_denied_approved_message || "Bu içeriğe erişim için aktif bir abonelik veya yönetici onayı gereklidir."}</p>
                <Link href="/dashboard" className="mt-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-lg transition-colors">Panele Dön</Link>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen dashboard-bg text-white p-4 md:p-8">
            <div className="container mx-auto">
                <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center">{T.market_pulse_page_title || "Piyasa Nabzı"}</h1>
                {isLoading ? (
                    <div className="text-center py-20 text-gray-500">Piyasa verileri yükleniyor...</div>
                ) : error ? (
                    <div className="text-center py-20 text-red-400">Hata: {error.message}</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <MarketSessionsWidget T={T} currentTime={currentTime} />
                        <FearGreedWidget T={T} fearGreedScore={fearGreedScore} marketData={marketData} isLoading={isLoading} /> 
                        <VolatilityWidget T={T} />
                        <EconomicCalendarWidget T={T} events={marketData?.economicCalendarData || []} isLoading={isLoading} />
                        <TopGainersWidget T={T} marketData={marketData} isLoading={isLoading} />
                        <TopLosersWidget T={T} />
                        <FundingRatesWidget T={T} fearGreedScore={fearGreedScore} />
                        <LongShortRatioWidget T={T} fearGreedScore={fearGreedScore} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default MarketPulsePage;

