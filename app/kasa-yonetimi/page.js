// path: app/kasa-yonetimi/page.js
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRequiredAuth } from '@/hooks/useRequiredAuth';
import { useNotification } from '@/context/NotificationContext';
import { trpc } from '@/lib/trpc/client'; 
import Icon from '@/components/Icon';
import dynamic from 'next/dynamic';
import { KasaForms } from '@/components/KasaForms';
import { usePerformanceAnalytics } from '@/hooks/usePerformanceAnalytics';
import { formatElapsedTime, calculateTradePnL } from '@/lib/kasaUtils';
import { getRiskGateStatus } from '@/lib/RiskGateUtils'; 
import { motion, AnimatePresence } from 'framer-motion';

// --- Dinamik Yüklenen Bileşenler ---
const KasaChart = dynamic(() => import('@/components/KasaChart.js'), {
    ssr: false,
    loading: () => <div className="h-[200px] flex items-center justify-center text-gray-500 futuristic-card p-6 rounded-xl">Grafik Yükleniyor...</div>
});

// --- YARDIMCI BİLEŞENLER ---

const RiskGateStatusCard = ({ riskStatus }) => {
    if (!riskStatus) {
        return (
            <div className="p-4 rounded-xl border-2 bg-gray-800 border-gray-700 flex items-center gap-4 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-gray-700"></div>
                <div>
                    <div className="h-4 w-48 bg-gray-700 rounded"></div>
                    <div className="h-3 w-64 bg-gray-700 rounded mt-2"></div>
                </div>
            </div>
        );
    }
    
    let colorClass, bgColorClass;
    if (riskStatus.status === 'YÜKSEK') {
        colorClass = 'text-red-400';
        bgColorClass = 'bg-red-900/40 border-red-700/50 shadow-red-900/50';
    } else if (riskStatus.status === 'ORTA') {
        colorClass = 'text-yellow-400';
        bgColorClass = 'bg-yellow-900/40 border-yellow-700/50 shadow-yellow-900/50';
    } else {
        colorClass = 'text-green-400';
        bgColorClass = 'bg-green-900/40 border-green-700/50 shadow-green-900/50';
    }
    
    return (
        <div className={`p-4 rounded-xl border-2 transition-all duration-500 ${bgColorClass} flex items-center gap-4 futuristic-card`}>
            <Icon name={riskStatus.status === 'YÜKSEK' ? "shield-alert" : "shield-check"} className={`w-8 h-8 flex-shrink-0 ${colorClass} ${riskStatus.status !== 'DÜŞÜK' ? 'animate-pulse' : ''}`} />
            <div>
                <h3 className={`text-sm font-bold uppercase ${colorClass}`}>
                    RİSK KAPISI PROTOKOLÜ: {riskStatus.status}
                </h3>
                <p className="text-xs text-gray-300 mt-0.5 mb-1">{riskStatus.message}</p>
                 <a href="/market-pulse" target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-indigo-400 hover:underline">
                    <Icon name="activity" className="w-3 h-3 inline mr-1"/>
                    Piyasa Nabzı Verilerini İncele
                 </a>
            </div>
        </div>
    );
};

const OpenTradeCard = ({ trade, handleActionClick }) => {
    const entry = parseFloat(trade.entryPrice) || 0;
    const decimalPlaces = entry > 100 ? 2 : (entry < 1 && entry > 0 ? 5 : 4); 
    const getPrice = (price) => parseFloat(price)?.toFixed(decimalPlaces) || '---';
    const isLong = trade.direction === 'L';
    const borderColor = isLong ? 'border-green-600/70' : 'border-red-600/70';
    const textColor = isLong ? 'text-green-400' : 'text-red-400';

    const riskData = calculateTradePnL(trade, trade.stopLoss);
    const isRiskValid = riskData && !riskData.error;
    const riskUsd = isRiskValid ? Math.abs(riskData.riskUsd) : 0;
    
    const tp1Data = trade.tp1 ? calculateTradePnL(trade, trade.tp1) : null;
    const isTp1Valid = tp1Data && !tp1Data.error;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`p-3 rounded-xl border-2 ${borderColor} bg-gray-900/50 shadow-lg space-y-3 futuristic-card hover:border-indigo-500/50 transition-all duration-300`}
        >
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                <span className="text-base font-bold text-white">{trade.instrument}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${isLong ? 'bg-green-600/30 text-green-300' : 'bg-red-600/30 text-red-300'}`}>
                    {trade.direction} - {trade.margin}x
                </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[11px] font-mono text-gray-400">
                <div className='space-y-1'>
                    <p>Giriş Fiyatı: <span className="text-white font-semibold">{getPrice(trade.entryPrice)}</span></p>
                    <p>Teminat: <span className="text-white font-semibold">${(trade.marginUsed || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></p>
                    <p>Süre: <span className="text-white font-semibold">{formatElapsedTime(trade.openTimestamp)}</span></p>
                </div>
                <div className='space-y-1'>
                    <p className="text-red-400">SL: <span className="font-bold">{getPrice(trade.stopLoss)}</span></p>
                    <p className="text-green-400">TP1: <span className="font-bold">{getPrice(trade.tp1)} ({isTp1Valid ? tp1Data.riskReward.toFixed(1) : '---'}R)</span></p>
                    <p className="text-indigo-400">Risk (1R): <span className="text-white font-bold">${riskUsd.toFixed(2)}</span></p>
                </div>
            </div>
            
            <p className="text-xs text-gray-400 border-t border-gray-700 pt-2 line-clamp-1" title={trade.note || '---'}>
                Not: {trade.note || '---'}
            </p>

            <div className="flex gap-2 mt-4 pt-3 border-t border-gray-700">
                <button onClick={() => handleActionClick('close', trade)} className="flex-1 text-xs py-2 rounded-lg bg-red-600 hover:bg-red-500 transition-colors flex items-center justify-center gap-1">
                    <Icon name="x-circle" className="w-4 h-4" /> Kapat
                </button>
                <button onClick={() => handleActionClick('edit', trade)} className="flex-1 text-xs py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition-colors flex items-center justify-center gap-1">
                    <Icon name="pencil" className="w-4 h-4" /> Düzenle
                </button>
                 <button onClick={() => handleActionClick('delete', trade)} className="w-1/4 text-xs py-2 rounded-lg bg-gray-600 hover:bg-gray-500 transition-colors flex items-center justify-center">
                    <Icon name="trash-2" className="w-4 h-4" />
                </button>
            </div>
        </motion.div>
    );
};


const CurrentBalanceCard = ({ currentBalance, initialBalanceValue, T }) => {
    const safeCurrentBalance = Number(currentBalance) || 0;
    const safeInitialBalance = Number(initialBalanceValue) || 0;
    const pnl = safeCurrentBalance - safeInitialBalance;
    const percentage = safeInitialBalance > 0 ? (pnl / safeInitialBalance) * 100 : 0;
    const isPositive = pnl >= 0;
    
    return (
        <div className="bg-gradient-to-br from-indigo-900/50 to-gray-900 p-6 rounded-2xl border border-indigo-700/70 shadow-2xl shadow-indigo-900/40 futuristic-card hover:border-indigo-500/70 transition-all duration-300">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold uppercase text-white tracking-widest">{T.kasa_current_balance}</h3>
                <div className="text-right">
                    <p className={`text-4xl font-extrabold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>${safeCurrentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                    <span className={`text-sm font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>{isPositive ? '▲' : '▼'} {Math.abs(percentage).toFixed(2)}% (Toplam ROI)</span>
                </div>
            </div>
        </div>
    );
};

const AdvancedSummaryCard = ({ title, pnl, percentage }) => {
    const safePnl = Number(pnl) || 0;
    const safePercentage = Number(percentage) || 0;
    const isPositive = pnl > 0;
    const isNeutral = pnl === 0;
    const color = isNeutral ? 'text-gray-400' : isPositive ? 'text-green-400' : 'text-red-400';
    const bgColor = isNeutral ? 'bg-gray-800/50' : isPositive ? 'bg-green-900/20' : 'bg-red-900/20';
    const borderColor = isNeutral ? 'border-gray-700/50' : isPositive ? 'border-green-700/50' : 'border-red-700/50';

    return (
        <div className={`p-4 rounded-xl border ${borderColor} ${bgColor} shadow-md futuristic-card-light hover:border-indigo-500/50 transition-all duration-300`}>
            <h3 className="text-xs font-semibold text-gray-300 uppercase">{title}</h3>
            <p className={`text-xl font-bold ${color}`}>{isNeutral ? '$0.00' : `${safePnl > 0 ? '+' : ''}$${safePnl.toFixed(2)}`}</p>
            <div className={`text-xs font-semibold ${safePercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>{isNeutral ? '0.00%' : `${safePercentage >= 0 ? '▲' : '▼'} ${Math.abs(safePercentage).toFixed(2)}%`}</div>
        </div>
    );
};

const AnalyticCard = ({ title, value, unit = '', color = 'text-indigo-400', icon }) => {
    const safeValue = typeof value === 'number' && !isNaN(value) ? value : 0;
    const displayValue = safeValue === 0 ? '---' : safeValue.toFixed(title.includes('R:R') ? 2 : 1);
    
    return (
        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50 shadow-md flex items-center gap-3 futuristic-card-light hover:border-indigo-500/50 transition-all duration-300">
            <Icon name={icon} className={`w-6 h-6 flex-shrink-0 ${color}`} />
            <div>
                <h3 className="text-xs font-semibold text-gray-400">{title}</h3>
                <p className={`text-xl font-bold ${color}`}>{displayValue}{unit}</p>
            </div>
        </div>
    );
};

const KasaSettings = ({ initialBalanceValue, handleResetKasa, isSubmitting, showConfirm, showToast, T }) => {
    const safeInitialBalance = Number(initialBalanceValue ?? 0);
    const [newInitialBalance, setNewInitialBalance] = useState(safeInitialBalance.toFixed(2));

    const handleResetSubmit = (e) => {
        e.preventDefault();
        const balance = parseFloat(newInitialBalance.replace(',', '.'));

        if (isNaN(balance) || balance <= 0) {
            showToast(T.kasa_error_invalid_balance, 'error');
            return;
        }

        showConfirm(
            `Tüm işlem geçmişiniz silinecek ve kasa $${balance.toFixed(2)} ile yeniden başlayacak. Bu işlem geri alınamaz.`,
            () => handleResetKasa(balance),
            {
                title: 'Kritik Onay: Kasa Sıfırlama',
                confirmButtonType: 'destructive'
            }
        );
    };
    
    return (
        <div className="bg-gray-800 p-6 rounded-2xl border border-red-700/50 futuristic-card shadow-2xl shadow-red-900/40">
            <h2 className="text-xl font-bold text-red-400">Kasa Ayarları</h2>
            <form onSubmit={handleResetSubmit} className="space-y-4 mt-4">
                <p className="text-red-300 text-sm">Bu işlem, tüm işlemleri ve kasa özetini kalıcı olarak sıfırlar.</p>
                <div>
                    <label className="block text-sm">Yeni Başlangıç Bakiyesi</label>
                    <input
                        name="initialBalance"
                        type="number"
                        step="any"
                        value={newInitialBalance}
                        onChange={(e) => setNewInitialBalance(e.target.value)}
                        className="w-full p-3 bg-gray-700 rounded-lg"
                        required
                        disabled={isSubmitting}
                    />
                </div>
                <button
                    type="submit"
                    className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg disabled:opacity-50 transition-colors shadow-lg shadow-red-900/50"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Sistem İşliyor...' : 'Kasayı Sıfırla'}
                </button>
            </form>
        </div>
    );
};


// --- ANA SAYFA BİLEŞENİ ---
const KasaYonetimiPage = () => {
    const { T, user, loading: authLoading } = useAuth();
    const { showToast, showConfirm } = useNotification();
    const { redirectPath } = useRequiredAuth({ requireLogin: true });
    
    const [activeTab, setActiveTab] = useState('trades');
    const [tradeToClose, setTradeToClose] = useState(null);
    const [editingOpenTrade, setEditingOpenTrade] = useState(null);
    const [showAllClosed, setShowAllClosed] = useState(false);
    const [showAllCashFlow, setShowAllCashFlow] = useState(false);

    const utils = trpc.useContext();
    const { data, isLoading: kasaLoading, error: kasaError } = trpc.kasa.getKasaData.useQuery(undefined, {
        enabled: !!user,
        staleTime: 60000 * 5,
    });
    
    const { data: marketData, isLoading: marketLoading } = trpc.market.getMarketData.useQuery(undefined, {
        enabled: !!user,
        staleTime: 1000 * 60 * 5, // 5 dakika
    });

    const riskStatus = useMemo(() => {
        if (marketData?.fearGreedData?.value) {
            return getRiskGateStatus(marketData.fearGreedData.value);
        }
        return null;
    }, [marketData]);

    // KRİTİK PERFORMANS DÜZELTMESİ
    const allTradesAndCashFlows = useMemo(() => data?.trades || [], [data?.trades]);
    const initialBalanceValue = useMemo(() => data?.summary?.initialBalance || 0, [data?.summary?.initialBalance]);

    const closedTradesForAnalytics = useMemo(() => 
        allTradesAndCashFlows.filter(t => t.type === 'trade' && t.status === 'closed' && t.pnlUsd !== undefined && t.pnlUsd !== null)
    , [allTradesAndCashFlows]);
    
    const { analytics } = usePerformanceAnalytics(closedTradesForAnalytics, initialBalanceValue);

    const isLoading = authLoading || kasaLoading || marketLoading;

    const createMutationOptions = (msg) => ({ 
        onSuccess: () => { 
            showToast(msg, 'success');
            utils.kasa.getKasaData.invalidate(); 
            utils.leaderboard.getLeaderboard.invalidate(); 
            setTradeToClose(null); 
            setEditingOpenTrade(null); 
        }, 
        onError: (err) => showToast(err.message, 'error'),
    });
    
    const setInitialBalanceMutation = trpc.kasa.setInitialBalance.useMutation(createMutationOptions(T.kasa_success_initial_set));
    const addTradeMutation = trpc.kasa.addTrade.useMutation(createMutationOptions(T.kasa_success_trade_added));
    const updateTradeMutation = trpc.kasa.updateTrade.useMutation(createMutationOptions(T.kasa_success_trade_updated));
    const closeTradeMutation = trpc.kasa.closeTrade.useMutation(createMutationOptions('Pozisyon kapatıldı.'));
    const deleteTradeMutation = trpc.kasa.deleteTrade.useMutation({
        onSuccess: () => { 
            showToast(T.kasa_success_trade_deleted, 'success');
            utils.kasa.getKasaData.invalidate(); 
            utils.leaderboard.getLeaderboard.invalidate();
            setTradeToClose(null); 
            setEditingOpenTrade(null); 
        }, 
        onError: (err) => showToast(err.message, 'error'),
    });
    const addCashFlowMutation = trpc.kasa.addCashFlow.useMutation(createMutationOptions(T.kasa_success_cashflow_added));
    const resetKasaMutation = trpc.kasa.resetKasa.useMutation(createMutationOptions('Kasa başarıyla sıfırlandı. Yeni başlangıç yapabilirsiniz.'));

    const isSubmitting = [setInitialBalanceMutation, addTradeMutation, updateTradeMutation, closeTradeMutation, deleteTradeMutation, addCashFlowMutation, resetKasaMutation].some(m => m.isLoading);
    
    const { uiData, summaryData } = useMemo(() => {
        const trades = allTradesAndCashFlows;
        let runningBalance = initialBalanceValue;
        const closedTrades = [], openTrades = [], cashFlows = [];
        let bal = initialBalanceValue;
        const sortedTrades = [...trades].sort((a, b) => new Date(a.openTimestamp).getTime() - new Date(b.openTimestamp).getTime());
        const startPointDate = sortedTrades.length > 0 
            ? new Date(new Date(sortedTrades[0].openTimestamp).getTime() - (24 * 60 * 60 * 1000)).toISOString() 
            : new Date().toISOString();
            
        const chartPoints = [{ 
            name: T.kasa_baslangic || 'Başlangıç', 
            balance: initialBalanceValue, 
            id: 'start-point', 
            date: startPointDate, 
            type: 'trade', 
            pnl: 0 
        }];
        

        sortedTrades.forEach(trade => {
            const pnl = parseFloat(trade.pnlUsd) || 0;
            const isCashFlow = trade.type === 'cashflow';
            
            if (trade.status === 'closed' || isCashFlow) {
                runningBalance += pnl;
                bal += pnl;
                const timestamp = trade.closeTimestamp || trade.openTimestamp || new Date().toISOString();
                
                chartPoints.push({ 
                    name: new Date(timestamp).toLocaleDateString('tr-TR'), 
                    balance: bal, 
                    id: trade.id, 
                    date: timestamp, 
                    type: trade.type, 
                    direction: trade.direction, 
                    pnl: pnl 
                });
            }
            if (isCashFlow) {
                 cashFlows.push(trade);
            } else {
                if (trade.status === 'closed') {
                    closedTrades.push(trade);
                } else {
                    openTrades.push(trade);
                }
            }
        });

        const totalClosed = closedTrades.length;
        const totalPnlForSummary = closedTrades.reduce((acc, t) => acc + (t.pnlUsd || 0), 0);
        const now = new Date();
        
        const getPnl = (start) => closedTradesForAnalytics.filter(t => new Date(t.closeTimestamp) >= start).reduce((acc, t) => acc + (t.pnlUsd || 0), 0);
        const dailyPnl = getPnl(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
        const weeklyPnl = getPnl(new Date(now.getFullYear(), now.getMonth(), now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1)));
        const monthlyPnl = getPnl(new Date(now.getFullYear(), now.getMonth(), 1));

        return {
            uiData: { 
                hasInitialBalance: initialBalanceValue > 0, 
                currentBalance: runningBalance, 
                initialBalanceValue: initialBalanceValue, 
                openTradeHistory: openTrades.reverse(), 
                closedTradeHistory: closedTrades.filter(t => t.type !== 'cashflow').reverse(), 
                cashFlowHistory: cashFlows.reverse(), 
                chartData: chartPoints 
            },
            summaryData: { 
                dailyPnl, weeklyPnl, monthlyPnl, 
                totalPnl: totalPnlForSummary, 
                totalTrades: totalClosed, 
                dailyPnlPercent: initialBalanceValue > 0 ? (dailyPnl / initialBalanceValue) * 100 : 0, 
                weeklyPnlPercent: initialBalanceValue > 0 ? (weeklyPnl / initialBalanceValue) * 100 : 0, 
                monthlyPnlPercent: initialBalanceValue > 0 ? (monthlyPnl / initialBalanceValue) * 100 : 0, 
                totalPnlPercent: initialBalanceValue > 0 ? (totalPnlForSummary / initialBalanceValue) * 100 : 0 
            }
        };
    }, [allTradesAndCashFlows, initialBalanceValue, T, closedTradesForAnalytics]);

    const handleSetInitialBalance = (balance) => setInitialBalanceMutation.mutate({ balance });
    
    const handleSaveTrade = (formData, isEditing, tradeId) => {
        
        if (isEditing) {
            updateTradeMutation.mutate({ tradeId, tp1: formData.tp1, tp2: formData.tp2, note: formData.note });
            return;
        }
        
        const riskTitle = 'DİSİPLİN KONTROL PROTOKOLÜ';
        let riskColor = 'default';
        let confirmationMessage = `Pozisyonu açmadan önce modül verilerini TradingView'de kontrol ettiniz mi? Disiplin Protokolüne göre hareket ettiğinizden emin olun.`;

        if (riskStatus) {
            if (riskStatus.status === 'YÜKSEK') {
                riskColor = 'destructive';
                confirmationMessage = riskStatus.message + " Bu koşullarda pozisyon açmak, protokol ihlali olarak kaydedilecektir. Devam etmek istediğinizden emin misiniz?";
            } else if (riskStatus.status === 'ORTA') {
                riskColor = 'default';
                confirmationMessage = riskStatus.message + " Devam etmeden önce teyit almanız önerilir.";
            }
        }

        showConfirm(
            confirmationMessage,
            () => {
                const payload = { ...formData, warningAcknowledged: riskStatus?.status !== 'DÜŞÜK' };
                addTradeMutation.mutate(payload);
            },
            {
                title: riskTitle,
                confirmButtonType: riskColor,
                onCancel: () => { 
                     showToast("İşlem iptal edildi. Disiplin kararına uyuldu.", 'info', 3000);
                     setEditingOpenTrade(null);
                }
            }
        );
    };
    
    const handleCloseTrade = (trade, exitPrice) => closeTradeMutation.mutate({ tradeId: trade.id, exitPrice: parseFloat(exitPrice) });
    
    const handleDeleteTrade = (tradeId) => {
        showConfirm(
            T.kasa_confirm_delete || 'Bu işlemi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.', 
            () => deleteTradeMutation.mutate({ tradeId }), 
            { confirmButtonType: 'destructive', title: 'İşlem Silme Onayı' }
        );
    }
    
    const handleCashFlow = (amount, type) => {
        const amountFloat = parseFloat(amount);
        if (isNaN(amountFloat) || amountFloat <= 0) {
            showToast(T.kasa_error_invalid_cashflow, 'error');
            return;
        }
        addCashFlowMutation.mutate({ amount: amountFloat, type });
    };
    const handleResetKasa = (balance) => { resetKasaMutation.mutate({ initialBalance: balance }); };
    
    const handleActionClick = (action, trade) => {
        if (action === 'edit') {
            setTradeToClose(null);
            setEditingOpenTrade(trade);
        } else if (action === 'close') {
            setEditingOpenTrade(null);
            setTradeToClose(trade);
        } else if (action === 'delete') {
            handleDeleteTrade(trade.id);
        }
        
        if (action === 'close') { 
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };
    
    const handleDownloadCsv = useCallback((tableType) => {
        const dataToExport = tableType === 'cashFlow' ? uiData.cashFlowHistory : uiData.closedTradeHistory;
        
        if (dataToExport.length === 0) {
            showToast('Dışa aktarılacak veri yok.', 'error');
            return;
        }

        let headers = [];
        let rows = [];

        if (tableType === 'cashFlow') {
            headers = ['Tarih', 'Tip', 'Miktar ($)'];
            rows = dataToExport.map(item => {
                const row = [
                    new Date(item.openTimestamp).toLocaleString('tr-TR'),
                    item.direction === 'D' ? 'Para Yatirma' : 'Para Cekme',
                    item.pnlUsd.toFixed(2)
                ];
                return row.join(',');
            });
        } else {
            headers = ['Kapanis Tarihi', 'Enstruman', 'Yon', 'PnL ($)', 'ROE (%)', 'R:R', 'Risk ($)', 'Not'];
            rows = dataToExport.map(trade => {
                const riskResult = calculateTradePnL(trade, trade.stopLoss);
                const riskUsd = riskResult.error ? 0 : riskResult.riskUsd;

                const row = [
                    new Date(trade.closeTimestamp).toLocaleString('tr-TR'),
                    trade.instrument,
                    trade.direction,
                    trade.pnlUsd.toFixed(2),
                    trade.pnlPercent.toFixed(2),
                    trade.riskReward.toFixed(2),
                    riskUsd.toFixed(2),
                    `"${(trade.note || '').replace(/"/g, '""')}"`
                ];
                return row.join(',');
            });
        }

        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `Synara_Raporu_${tableType}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showToast('CSV raporu başarıyla indirildi.', 'success');

    }, [uiData.cashFlowHistory, uiData.closedTradeHistory, showToast]);
    
    if (authLoading || !T || redirectPath) return <div className="min-h-screen bg-gray-900 flex justify-center items-center"><p>{T?.kasa_loading || 'Yükleniyor...'}</p></div>;
    if (!user) return null;
    if (isLoading) return <div className="min-h-screen bg-gray-900 flex justify-center items-center"><p>{T?.kasa_loading || 'Veriler yükleniyor...'}</p></div>;
    if (!uiData.hasInitialBalance) return (<div className="min-h-screen bg-gray-900 flex items-center justify-center p-4"><form onSubmit={(e) => {e.preventDefault(); handleSetInitialBalance(parseFloat(e.target.initialBalance.value))}} className="w-full max-w-md bg-gray-800 p-8 rounded-2xl border border-gray-700 space-y-4"><h2 className="text-2xl font-bold text-center">{T.kasa_set_initial_balance}</h2><input name="initialBalance" type="number" step="any" placeholder={T.kasa_initial_balance_placeholder} className="w-full p-3 bg-gray-700 rounded-lg" required disabled={isSubmitting} /><button type="submit" className="w-full glow-on-hover-btn-primary" disabled={isSubmitting}>{T.kasa_start_button}</button></form></div>);

    const { winRate, averageRR, profitFactor, rewardToRiskRatio } = analytics;
    const displayedClosedTrades = showAllClosed ? uiData.closedTradeHistory : uiData.closedTradeHistory.slice(0, 5);
    const displayedCashFlows = showAllCashFlow ? uiData.cashFlowHistory : uiData.cashFlowHistory.slice(0, 5);
    const hasValidAnalytics = analytics.totalTrades > 0;
    
    const PositionCloseModal = tradeToClose && (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center p-4 md:p-8 overflow-y-auto"
        >
            <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -50, opacity: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}
                className="w-full max-w-lg mt-12 md:mt-24"
            >
                 <KasaForms 
                    handleSaveTrade={handleSaveTrade} 
                    handleCloseTrade={handleCloseTrade} 
                    handleCashFlow={handleCashFlow} 
                    isSubmitting={isSubmitting} 
                    calculateTradePnL={calculateTradePnL} 
                    formatElapsedTime={formatElapsedTime} 
                    tradeToClose={tradeToClose} 
                    setTradeToClose={setTradeToClose} 
                    editingOpenTrade={editingOpenTrade} 
                    setEditingOpenTrade={setEditingOpenTrade}
                 />
            </motion.div>
        </motion.div>
    );

    
    return (
        <div className="min-h-screen dashboard-bg text-white p-4 md:p-8">
            <div className="container mx-auto space-y-8">
                <h1 className="text-3xl md:text-4xl font-bold text-center">{T.kasa_page_title}</h1>
                <div className="flex justify-center"><div className="inline-flex rounded-lg border border-gray-700 p-1 bg-gray-800"><button onClick={() => setActiveTab('trades')} className={`px-4 py-2 text-sm font-semibold rounded-md ${activeTab === 'trades' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>İşlemler</button><button onClick={() => setActiveTab('settings')} className={`px-4 py-2 text-sm font-semibold rounded-md ${activeTab === 'settings' ? 'bg-red-600/80 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Ayarlar</button></div></div>
                
                <AnimatePresence>{PositionCloseModal}</AnimatePresence>

                
                {activeTab === 'trades' && (<div className="space-y-8">
                    
                    <RiskGateStatusCard riskStatus={riskStatus} />

                    <div className="futuristic-card p-6 rounded-2xl border border-gray-700 space-y-6">
                        {uiData.chartData.length > 1 && <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700"><h2 className="text-lg font-bold mb-2 text-indigo-400">{T.kasa_balance_chart}</h2><KasaChart chartData={uiData.chartData} translations={T} /></div>}
                        
                        <CurrentBalanceCard currentBalance={uiData.currentBalance} initialBalanceValue={uiData.initialBalanceValue} T={T} />
                        
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                           <AdvancedSummaryCard title={T.kasa_summary_total_pnl} pnl={summaryData.totalPnl} percentage={summaryData.totalPnlPercent} />
                           <AdvancedSummaryCard title={T.kasa_summary_daily_pnl} pnl={summaryData.dailyPnl} percentage={summaryData.dailyPnlPercent} />
                           <AdvancedSummaryCard title={T.kasa_summary_weekly_pnl} pnl={summaryData.weeklyPnl} percentage={summaryData.weeklyPnlPercent} />
                           <AdvancedSummaryCard title={T.kasa_summary_monthly_pnl} pnl={summaryData.monthlyPnl} percentage={summaryData.monthlyPnlPercent} />
                        </div>
                        
                        {hasValidAnalytics ? (
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <AnalyticCard title={T.kasa_summary_win_rate} value={winRate} unit="%" color="text-green-400" icon="check-circle-2" />
                                <AnalyticCard title={T.kasa_summary_avg_rr} value={averageRR} unit=" R" color="text-yellow-400" icon="award" />
                                <AnalyticCard title="Profit Factor" value={profitFactor} unit="" color="text-sky-400" icon="bar-chart-2" />
                                <AnalyticCard title="Reward/Risk Oranı" value={rewardToRiskRatio} unit=" R" color="text-indigo-400" icon="compass" />
                            </div>
                        ) : (
                             <div className="p-4 text-center text-gray-500 bg-gray-700/30 rounded-lg border border-gray-600">
                                Kapalı işlemlerinizden analitik veri toplamak için bekliyor...
                             </div>
                        )}
                    </div>
                    
                    <AnimatePresence mode='wait'>
                        {!tradeToClose && (
                             <motion.div
                                key="kasa-forms"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                transition={{ duration: 0.3 }}
                             >
                                <div className="futuristic-card p-6 rounded-2xl border border-gray-700">
                                    <KasaForms 
                                        {...{ 
                                            handleSaveTrade, 
                                            handleCloseTrade, 
                                            handleCashFlow, 
                                            isSubmitting, 
                                            calculateTradePnL, 
                                            formatElapsedTime, 
                                            tradeToClose, 
                                            setTradeToClose, 
                                            editingOpenTrade, 
                                            setEditingOpenTrade 
                                        }} 
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    
                    <div className="futuristic-card p-6 rounded-2xl border border-gray-700">
                        <h2 className="text-lg font-bold mb-4 text-green-400">Açık Pozisyonlar ({uiData.openTradeHistory.length})</h2>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key="open-trades"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="space-y-4"
                            >
                                {uiData.openTradeHistory.length === 0 ? (
                                    <div className="p-4 text-center text-gray-500 bg-gray-900/50 rounded-lg border border-dashed border-gray-700">Açık pozisyon yok.</div>
                                ) : (
                                    uiData.openTradeHistory.map(trade => (
                                        <OpenTradeCard 
                                            key={trade.id} 
                                            trade={trade} 
                                            handleActionClick={handleActionClick} 
                                        />
                                    ))
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        
                        <div className="futuristic-card p-6 rounded-2xl border border-gray-700">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg">İşlem Geçmişi</h2>
                                {uiData.closedTradeHistory.length > 5 && <button onClick={() => setShowAllClosed(!showAllClosed)} className="text-xs text-indigo-400">{showAllClosed ? 'Gizle' : `Tümünü Göster`}</button>}
                            </div>
                            <div className="space-y-3">
                                {displayedClosedTrades.length === 0 ? 
                                    <div className="p-4 text-center text-gray-500 bg-gray-900/50 rounded-lg border border-dashed border-gray-700">{T.kasa_no_trades}</div> 
                                    : displayedClosedTrades.map(t => (
                                    <div 
                                        key={t.id} 
                                        className={`p-3 rounded-lg border border-gray-700 flex justify-between items-center transition-all duration-300 transform 
                                                    ${t.pnlUsd > 0 ? 'hover:bg-green-900/20 hover:border-green-500/50' : 'hover:bg-red-900/20 hover:border-red-500/50'}`}
                                    >
                                        <div>
                                            <div className="font-semibold text-white">{t.instrument} ({t.direction})</div>
                                            <div className="text-xs text-gray-400">{new Date(t.closeTimestamp).toLocaleDateString('tr-TR')}</div>
                                        </div>
                                        <div className={`font-mono text-right`}>
                                            <div className={`font-bold ${t.pnlUsd>0?'text-green-400':'text-red-400'}`}>{t.pnlUsd?.toFixed(2)}$</div>
                                            <div className="text-xs text-gray-500">R: {t.riskReward?.toFixed(2)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => handleDownloadCsv('closedTrades')}
                                className="mt-4 w-full synth-btn-secondary py-2 rounded-lg transition-colors inline-flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                                disabled={isSubmitting} 
                            >
                                <Icon name="download" className="w-4 h-4 text-yellow-400" />
                                {isSubmitting ? 'Rapor Oluşturuluyor...' : 'CSV Olarak Dışa Aktar'}
                            </button>
                        </div>
                        
                        <div className="futuristic-card p-6 rounded-2xl border border-gray-700">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg">Nakit Akışı</h2>
                                {uiData.cashFlowHistory.length > 5 && <button onClick={() => setShowAllCashFlow(!showAllCashFlow)} className="text-xs text-indigo-400">{showAllCashFlow ? 'Gizle' : `Tümünü Göster`}</button>}
                            </div>
                            <div className="space-y-3">
                                {displayedCashFlows.length === 0 ? 
                                    <div className="p-4 text-center text-gray-500 bg-gray-900/50 rounded-lg border border-dashed border-gray-700">İşlem yok.</div> 
                                    : displayedCashFlows.map(f => (
                                    <div 
                                        key={f.id} 
                                        className={`p-3 rounded-lg border border-gray-700 flex justify-between items-center transition-all duration-300 transform 
                                                    ${f.direction === 'D' ? 'hover:bg-green-900/20 hover:border-green-500/50' : 'hover:bg-red-900/20 hover:border-red-500/50'}`}
                                    >
                                        <div>
                                            <div className="font-semibold text-white">{f.direction==='D'?T.kasa_deposit:T.kasa_withdraw}</div>
                                            <div className="text-xs text-gray-400">{new Date(f.openTimestamp).toLocaleDateString('tr-TR')}</div>
                                        </div>
                                        <div className={`font-mono font-bold text-right ${f.direction==='D'?'text-green-400':'text-red-400'}`}>
                                            {f.direction==='D'?'+':'-'}${Math.abs(f.pnlUsd).toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                             <button
                                onClick={() => handleDownloadCsv('cashFlow')}
                                className="mt-4 w-full synth-btn-secondary py-2 rounded-lg transition-colors inline-flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                                disabled={isSubmitting} 
                            >
                                <Icon name="download" className="w-4 h-4 text-yellow-400" />
                                {isSubmitting ? 'Rapor Oluşturuluyor...' : 'CSV Olarak Dışa Aktar'}
                            </button>
                        </div>
                    </div>
                </div>)}
                {activeTab === 'settings' && <div className="max-w-xl mx-auto futuristic-card"><KasaSettings {...{ initialBalanceValue: uiData.initialBalanceValue, handleResetKasa: handleResetKasa, isSubmitting, showConfirm, showToast, T }} /></div>}
            </div>
        </div>
    );
};

export default KasaYonetimiPage;
