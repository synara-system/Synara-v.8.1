// path: components/KasaForms.js
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Icon from './Icon'; 
import { useNotification } from '@/context/NotificationContext'; 
import { useAuth } from '@/context/AuthContext'; 
import { calculateTradePnL } from '@/lib/kasaUtils'; 

const MAX_NOTE_LENGTH = 150;

const FormInput = ({ name, value, onChange, placeholder, type = 'text', required = false, disabled = false, step = 'any', isNumeric = false }) => {
    const { T } = useAuth();
    const showCounter = name === 'note' && MAX_NOTE_LENGTH; 
    
    // KRİTİK FİX (HATA-05): Sayısal giriş alanının daha esnek olması.
    const handleNumericChange = (e) => {
        const { value } = e.target;
        const cleanValue = value.replace(',', '.'); 
        
        if (cleanValue === '' || cleanValue === '.' || /^-?\d*\.?\d*$/.test(cleanValue)) {
            onChange({ target: { name, value: cleanValue } });
        }
    };
    
    const handleKeyDown = (e) => {
        if (isNumeric && ['-', 'e', 'E'].includes(e.key)) {
            e.preventDefault();
        }
    };

    const displayValue = isNumeric ? String(value).replace('.', ',') : value;
    const handleChange = isNumeric ? handleNumericChange : onChange;

    return (
        <div className="relative">
            <input
                name={name}
                type={isNumeric ? "text" : type} 
                inputMode={isNumeric ? 'decimal' : 'text'}
                step={step}
                value={displayValue}
                onChange={handleChange}
                onKeyDown={isNumeric ? handleKeyDown : undefined}
                placeholder={placeholder}
                className="w-full p-3 mt-2 text-gray-200 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-60 disabled:bg-gray-800 transition-all duration-200" 
                required={required}
                disabled={disabled}
                maxLength={name === 'note' ? MAX_NOTE_LENGTH : undefined}
            />
            {showCounter && (
                <span className={`absolute top-2 right-2 text-xs font-mono px-2 py-1 rounded ${
                    value.length > MAX_NOTE_LENGTH * 0.9 ? 'text-red-400 bg-red-900/30' : 'text-gray-400 bg-gray-600/30'
                }`}>
                    {value.length}/{MAX_NOTE_LENGTH}
                </span>
            )}
        </div>
    );
};

const PositionCloseForm = ({ tradeToClose, handleCloseTrade, isSubmitting, formatElapsedTime, setTradeToClose }) => {
    const { T } = useAuth();
    const { showToast } = useNotification(); 
    const [exitPrice, setExitPrice] = useState('');

    const openTradePreview = useMemo(() => {
        if (tradeToClose && exitPrice) {
            // KRİTİK FİX (HATA-05): `calculateTradePnL` çağrılırken `exitPrice` string olarak değil, float olarak gönderildi.
            const result = calculateTradePnL(tradeToClose, parseFloat(exitPrice.replace(',', '.')));
            if (result.error) {
                 return { error: true, message: result.errorMessage || T.pnl_calc_error_message };
            }
            return result;
        }
        return { error: true, message: T.kasa_exit_price_required || 'Çıkış Fiyatı gerekli.', pnlUsd: 0 };
    }, [tradeToClose, exitPrice, T]);
    
    const handleCloseCancel = () => {
        setTradeToClose(null); 
        setExitPrice('');
    }

    const handleCloseSubmit = () => {
        const exitPriceFloat = parseFloat(exitPrice.replace(',', '.'));
        if (isNaN(exitPriceFloat) || exitPriceFloat <= 0) {
            showToast(T.kasa_exit_price_required, 'error'); 
            return;
        }
        handleCloseTrade(tradeToClose, exitPriceFloat);
    }
    
    useEffect(() => {
        if (!tradeToClose) {
            setExitPrice('');
        }
    }, [tradeToClose]);

    const isLong = tradeToClose?.direction === 'L';
    const borderColor = isLong ? 'border-green-700' : 'border-red-700';
    const textColor = isLong ? 'text-green-400' : 'text-red-400';
    
    const buttonBgColor = isLong ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500';
    const closeBtnCls = `flex-grow font-bold py-3 px-8 rounded-lg disabled:opacity-50 transition-all duration-300 transform hover:scale-[1.01] ${buttonBgColor} text-white shadow-lg`;
    const cancelBtnCls = `bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50`;


    if (!tradeToClose) return null;

    return (
        <div className={`lg:col-span-2 bg-gray-800 p-6 rounded-2xl border ${borderColor} space-y-4 shadow-xl`}>
            <h2 className={`text-2xl font-bold mb-4 ${textColor}`}>
                Pozisyonu Kapat: {tradeToClose.instrument} ({isLong ? T.kasa_long : T.kasa_short})
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm border-b border-gray-700 pb-4">
                 <div>
                    <label className="block font-medium text-gray-400 mb-1">Giriş / SL / Kaldıraç</label>
                    <p className="text-gray-300 font-mono">G: {tradeToClose.entryPrice} / SL: {tradeToClose.stopLoss} / K: {tradeToClose.margin}x</p>
                </div>
                <div>
                    <label className="block font-medium text-gray-400 mb-1">Poz. Büyüklüğü / Süre</label>
                    <p className="text-gray-300 font-mono">
                        ${(tradeToClose.positionSize || 0).toLocaleString()} / {formatElapsedTime(tradeToClose.openTimestamp)}
                    </p>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Çıkış Fiyatı</label>
                <FormInput 
                    name="exitPrice"
                    value={exitPrice}
                    onChange={(e) => setExitPrice(e.target.value)}
                    placeholder={T.kasa_exit_price_placeholder}
                    required
                    disabled={isSubmitting}
                    isNumeric={true}
                    type="text"
                />
            </div>

            <div className={`p-4 rounded-lg border-2 ${openTradePreview.error ? `border-gray-500/50 bg-gray-900/20` : (openTradePreview.pnlUsd >= 0 ? 'border-green-500/50 bg-green-900/20' : `border-red-500/50 bg-red-900/20`)}`}>
                <span className="text-sm font-semibold text-indigo-400 block mb-1">PnL Önizlemesi:</span>
                {openTradePreview.error ? (
                    <span className={`text-gray-400 text-sm font-mono`}>{openTradePreview.message}</span> 
                ) : (
                    <div className="flex justify-between items-center text-base font-bold">
                        <span className={openTradePreview.pnlUsd >= 0 ? 'text-green-400' : 'text-red-400'}>
                            PnL/ROE: {openTradePreview.pnlUsd >= 0 ? '+' : ''}{openTradePreview.pnlUsd?.toFixed(2) || '?'}$ / {openTradePreview.pnlPercent.toFixed(2)}%
                        </span>
                        <span className="text-indigo-400 text-sm">
                            R:R: {openTradePreview.riskReward.toFixed(2)}
                        </span>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-4">
                <button 
                    type="button" 
                    onClick={handleCloseSubmit} 
                    className={closeBtnCls}
                    disabled={isSubmitting || !!openTradePreview.error} 
                >
                    {isSubmitting ? 'Kapatılıyor...' : `Pozisyonu Kapat (${openTradePreview.pnlUsd >= 0 ? '+' : ''}${openTradePreview.pnlUsd?.toFixed(2) || '?'}$)`}
                </button>
                 <button 
                    type="button" 
                    onClick={handleCloseCancel} 
                    className={cancelBtnCls}
                    disabled={isSubmitting} 
                >
                    {T.kasa_cancel_edit}
                </button>
            </div>
        </div>
    );
}

const initialOpenTradeState = {
    instrument: '', direction: 'L', marginUsed: '', 
    entryPrice: '', stopLoss: '', tp1: '', tp2: '', margin: '', note: '' 
};

const OpenTradeForm = ({ editingOpenTrade, setEditingOpenTrade, isSubmitting, handleSaveTrade }) => {
    const { T } = useAuth();
    const { showToast } = useNotification(); 
    const [localForm, setLocalForm] = useState(initialOpenTradeState);
    const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

    useEffect(() => {
        if (editingOpenTrade) {
            setLocalForm({
                instrument: editingOpenTrade.instrument || '',
                direction: editingOpenTrade.direction || 'L',
                marginUsed: editingOpenTrade.marginUsed?.toString() || editingOpenTrade.quantity?.toString() || '',
                entryPrice: editingOpenTrade.entryPrice?.toString() || '',
                stopLoss: editingOpenTrade.stopLoss?.toString() || '',
                tp1: editingOpenTrade.tp1?.toString() || '',
                tp2: editingOpenTrade.tp2?.toString() || '',
                margin: editingOpenTrade.margin?.toString() || '',
                note: editingOpenTrade.note || ''
            });
             setHasAttemptedSubmit(false);
        } else {
            setLocalForm(initialOpenTradeState);
            setHasAttemptedSubmit(false);
        }
    }, [editingOpenTrade]);

    const tradeSetupPreview = useMemo(() => {
        const { entryPrice, stopLoss, tp1, tp2, ...rest } = localForm;
        
        // KRİTİK FİX (HATA-05): Sayısal alanları parse ederken TR/EN uyumu için "," -> "." dönüşümü uygulanır.
        const entry = parseFloat(entryPrice.replace(',', '.'));
        const sl = parseFloat(stopLoss.replace(',', '.'));
        const marginUsed = parseFloat(localForm.marginUsed.replace(',', '.'));
        const margin = parseFloat(localForm.margin.replace(',', '.'));
        
        const baseTrade = { direction: localForm.direction, entryPrice: entry, stopLoss: sl, marginUsed, margin };
        
        if (isNaN(entry) || isNaN(sl) || isNaN(marginUsed) || isNaN(margin) || entry <= 0 || sl <= 0 || marginUsed <= 0 || margin <= 0) {
             return { 
                error: true, 
                message: "Risk hesaplamak için Giriş, SL, Teminat ve Kaldıraç gerekli.",
                requiresInput: true
             };
        }
        
        const riskResult = calculateTradePnL(baseTrade, sl); 
        
        if (riskResult.error || riskResult.riskUsd === 0) {
            return { error: true, message: riskResult.errorMessage || "Risk hesaplama hatası. (SL Fiyatı Giriş Fiyatına Çok Yakın veya Eşit.)", requiresInput: false };
        }
        
        const riskUsd = riskResult.riskUsd; 
        
        const tp1Price = localForm.tp1 ? parseFloat(localForm.tp1.replace(',', '.')) : null;
        const tp2Price = localForm.tp2 ? parseFloat(localForm.tp2.replace(',', '.')) : null;
        
        const tp1Result = tp1Price ? calculateTradePnL(baseTrade, tp1Price) : null;
        const tp2Result = tp2Price ? calculateTradePnL(baseTrade, tp2Price) : null;

        if (localForm.direction === 'L' && sl >= entry) {
             return { error: true, message: "Long pozisyonunda SL Giriş fiyatından düşük olmalıdır.", requiresInput: false };
        }
        if (localForm.direction === 'S' && sl <= entry) {
             return { error: true, message: "Short pozisyonunda SL Giriş fiyatından yüksek olmalıdır.", requiresInput: false };
        }


        return {
            error: false,
            riskUsd: riskUsd,
            tp1: tp1Result && !tp1Result.error ? { pnl: tp1Result.pnlUsd, rr: tp1Result.riskReward } : null,
            tp2: tp2Result && !tp2Result.error ? { pnl: tp2Result.pnlUsd, rr: tp2Result.riskReward } : null,
            message: "Kurulum önizlemesi hazır."
        };
    }, [localForm]);


    const handleOpenTradeInputChange = (e) => {
        const { name, value } = e.target;
        setLocalForm(prev => ({ ...prev, [name]: value }));
    };

    const isEditing = !!editingOpenTrade;
    const formTitle = isEditing ? T.kasa_update_trade : `${T.kasa_add_trade} (${T.kasa_open_position || 'Pozisyon Aç'})`;
    const submitText = isEditing ? T.kasa_update_button : T.kasa_add_button_long || 'Kaydet';
    
    const isLockedInEdit = isEditing;
    
    const handleLocalSubmit = (e) => {
        e.preventDefault();
        setHasAttemptedSubmit(true);
        
        if (tradeSetupPreview.error) {
             showToast(tradeSetupPreview.message, 'error'); 
             return;
        }
        
        // KRİTİK FİX (HATA-05): Tüm sayısal alanları parse ederken nokta formatı kullanılır
        const parseValue = (val) => val ? parseFloat(String(val).replace(',', '.')) : null;
        
        const payload = {
            instrument: localForm.instrument.trim(),
            direction: localForm.direction,
            note: localForm.note?.trim() || null, 
            marginUsed: parseValue(localForm.marginUsed), 
            entryPrice: parseValue(localForm.entryPrice), 
            stopLoss: parseValue(localForm.stopLoss), 
            margin: parseValue(localForm.margin),
            tp1: parseValue(localForm.tp1),
            tp2: parseValue(localForm.tp2),
        };
        
        const updatePayload = {
             tp1: payload.tp1, 
             tp2: payload.tp2, 
             note: payload.note,
        };
        
        handleSaveTrade(isEditing ? updatePayload : payload, isEditing, editingOpenTrade?.id);
    };
    
    const handleCancelEdit = () => {
        setEditingOpenTrade(null);
    };

    const showErrorBox = tradeSetupPreview.error && hasAttemptedSubmit;
    const isFormEmpty = tradeSetupPreview.error && tradeSetupPreview.requiresInput && !hasAttemptedSubmit;
    
    const submitBtnCls = `w-full ${isEditing ? 'bg-indigo-600 hover:bg-indigo-500' : 'glow-on-hover-btn-primary'} font-bold py-3 px-8 rounded-lg disabled:opacity-50 shadow-lg`;
    const cancelBtnCls = `bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg transition-colors`;

    return (
        <form onSubmit={handleLocalSubmit} className="lg:col-span-2 bg-gray-800 p-6 rounded-2xl border border-gray-700 space-y-4 shadow-xl">
             <h2 className="text-2xl font-bold mb-4 text-indigo-400">{formTitle}</h2>
             
             <div className="grid grid-cols-3 gap-3">
                
                <div className="col-span-1">
                    <FormInput 
                        name="instrument" value={localForm.instrument} onChange={handleOpenTradeInputChange}
                        placeholder={T.kasa_instrument_placeholder} required disabled={isSubmitting || isLockedInEdit}
                        type="text"
                    />
                </div>
                <div className="flex items-center bg-gray-700 rounded-lg text-white font-semibold disabled:opacity-50 col-span-1 border border-gray-600 focus-within:ring-2 focus-within:ring-yellow-500">
                    <button type="button" onClick={() => handleOpenTradeInputChange({ target: { name: 'direction', value: 'L' } })} className={`w-1/2 h-12 flex items-center justify-center p-3 rounded-l-lg transition-colors disabled:opacity-50 ${localForm.direction === 'L' ? 'bg-green-600/70 hover:bg-green-600' : 'hover:bg-gray-600/70'}`} disabled={isSubmitting || isLockedInEdit}>{T.kasa_long}</button>
                    <button type="button" onClick={() => handleOpenTradeInputChange({ target: { name: 'direction', value: 'S' } })} className={`w-1/2 h-12 flex items-center justify-center p-3 rounded-r-lg transition-colors disabled:opacity-50 ${localForm.direction === 'S' ? 'bg-red-600/70 hover:bg-red-600' : 'hover:bg-gray-600/70'}`} disabled={isSubmitting || isLockedInEdit}>{T.kasa_short}</button>
                </div>
                <div className="col-span-1">
                     <FormInput 
                        name="margin" value={localForm.margin} onChange={handleOpenTradeInputChange}
                        placeholder={T.kasa_margin_placeholder} required disabled={isSubmitting || isLockedInEdit} isNumeric={true}
                        type="text"
                    />
                </div>
                
                <div className="col-span-1">
                     <FormInput 
                        name="marginUsed" value={localForm.marginUsed} onChange={handleOpenTradeInputChange}
                        placeholder={T.kasa_quantity_placeholder_usd} required disabled={isSubmitting || isLockedInEdit} isNumeric={true}
                        type="text"
                    />
                </div>
                 <div className="col-span-1">
                    <FormInput 
                        name="entryPrice" value={localForm.entryPrice} onChange={handleOpenTradeInputChange}
                        placeholder={T.kasa_entry_price_placeholder} required disabled={isSubmitting || isLockedInEdit} isNumeric={true}
                        type="text"
                    />
                </div>
                <div className="col-span-1">
                    <FormInput 
                        name="stopLoss" value={localForm.stopLoss} onChange={handleOpenTradeInputChange}
                        placeholder={T.kasa_stop_loss_placeholder} required disabled={isSubmitting || isLockedInEdit} isNumeric={true}
                        type="text"
                    />
                </div>

                <div className="col-span-1">
                    <FormInput 
                        name="tp1" value={localForm.tp1} onChange={handleOpenTradeInputChange}
                        placeholder="TP1 Fiyatı (Opsiyonel)" disabled={isSubmitting} isNumeric={true}
                        type="text"
                    />
                </div>
                <div className="col-span-1">
                    <FormInput 
                        name="tp2" value={localForm.tp2} onChange={handleOpenTradeInputChange}
                        placeholder="TP2 Fiyatı (Opsiyonel)" disabled={isSubmitting} isNumeric={true}
                        type="text"
                    />
                </div>
                <div className="col-span-1">
                    <FormInput 
                        name="note" value={localForm.note} onChange={handleOpenTradeInputChange}
                        placeholder={T.kasa_note_placeholder} disabled={isSubmitting}
                        type="text"
                    />
                </div>

            </div>

            {showErrorBox ? (
                 <div className="p-4 rounded-lg border-2 border-red-500/50 bg-red-900/20">
                     <span className="text-sm font-semibold text-red-400 block mb-1">Doğrulama Hatası:</span>
                     <span className="text-sm text-red-300">{tradeSetupPreview.message}</span>
                 </div>
            ) : (
                <div className="p-4 rounded-xl border-2 border-indigo-500/50 bg-gray-900/50 space-y-2 shadow-inner shadow-indigo-900/40">
                    <span className="text-sm font-semibold text-yellow-400 block mb-2 flex items-center">
                        <Icon name="award" className="w-4 h-4 mr-2" />
                        Kurulum Önizlemesi (Disiplin Skoru)
                    </span>
                    {isFormEmpty ? (
                         <p className="text-xs text-gray-400">Girişleri doldurmaya başladığınızda Risk/Ödül potansiyeli burada gösterilecektir.</p>
                    ) : (
                        <>
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-semibold text-red-400">Risk (1R):</span>
                                <span className="font-mono font-bold text-white">${tradeSetupPreview.riskUsd?.toFixed(2) || '0.00'}</span>
                            </div>
                            {tradeSetupPreview.tp1 && (
                                <div className="flex justify-between items-center text-sm border-t border-gray-700 pt-2">
                                    <span className="font-semibold text-green-400">Ödül (TP1):</span>
                                    <span className="font-mono font-bold text-white">${tradeSetupPreview.tp1.pnl?.toFixed(2) || '0.00'} ({tradeSetupPreview.tp1.rr?.toFixed(1)}R)</span>
                                </div>
                            )}
                            {tradeSetupPreview.tp2 && (
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-semibold text-green-400">Ödül (TP2):</span>
                                    <span className="font-mono font-bold text-white">${tradeSetupPreview.tp2.pnl?.toFixed(2) || '0.00'} ({tradeSetupPreview.tp2.rr?.toFixed(1)}R)</span>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
            
            <div className="flex items-center gap-4 pt-2">
                <button type="submit" className={`flex-grow ${submitBtnCls}`} disabled={isSubmitting || (localForm.note && localForm.note.length > MAX_NOTE_LENGTH)}>
                    {isSubmitting ? 'Kaydediliyor...' : submitText}
                </button>
                {isEditing && (
                    <button type="button" onClick={handleCancelEdit} className={cancelBtnCls} disabled={isSubmitting}>
                        {T.kasa_cancel_edit}
                    </button>
                )}
            </div>
        </form>
    );
}

const CashFlowForm = ({ handleCashFlow, isSubmitting }) => {
    const { T } = useAuth();
    const [cashFlowAmount, setCashFlowAmount] = useState('');
    const [cashFlowType, setCashFlowType] = useState('deposit');
    
    const handleLocalSubmit = (e) => {
        e.preventDefault();
        handleCashFlow(cashFlowAmount.replace(',', '.'), cashFlowType);
        setCashFlowAmount('');
    };
    
    const isDeposit = cashFlowType === 'deposit';
    
    const confirmBtnCls = `w-full font-bold py-3 rounded-lg disabled:opacity-50 transition-colors shadow-lg ${isDeposit ? 'bg-green-600 hover:bg-green-500 shadow-green-900/50' : 'bg-red-600 hover:bg-red-500 shadow-red-900/50'}`;


    return (
        <form onSubmit={handleLocalSubmit} className="bg-gray-800 p-6 rounded-2xl border border-gray-700 space-y-4 shadow-xl h-full">
            <h2 className="text-2xl font-bold mb-4">{T.kasa_cash_flow}</h2>
            <div className="flex items-center bg-gray-700 rounded-lg text-white font-semibold border border-gray-600">
                <button type="button" onClick={() => setCashFlowType('deposit')} className={`w-1/2 p-3 rounded-l-lg transition-colors ${isDeposit ? 'bg-green-700 hover:bg-green-600' : 'hover:bg-gray-600/70'}`} disabled={isSubmitting}>{T.kasa_deposit}</button>
                <button type="button" onClick={() => setCashFlowType('withdraw')} className={`w-1/2 p-3 rounded-r-lg transition-colors ${!isDeposit ? 'bg-red-700 hover:bg-red-600' : 'hover:bg-gray-600/70'}`} disabled={isSubmitting}>{T.kasa_withdraw}</button>
            </div>
            <FormInput
                name="cashFlowAmount" value={cashFlowAmount} onChange={(e) => setCashFlowAmount(e.target.value)}
                placeholder={T.kasa_cash_flow_placeholder} disabled={isSubmitting} isNumeric={true}
                type="text"
            />
            <button type="submit" className={confirmBtnCls} disabled={isSubmitting}>
                {isSubmitting ? 'Kaydediliyor...' : T.kasa_confirm_cash_flow}
            </button>
        </form>
    );
}

export const KasaForms = ({ 
    handleSaveTrade, handleCloseTrade, handleCashFlow, isSubmitting, 
    formatElapsedTime,
    tradeToClose, setTradeToClose, 
    editingOpenTrade, setEditingOpenTrade 
}) => {
    
    const ActiveTradeForm = tradeToClose ? (
        <PositionCloseForm
            tradeToClose={tradeToClose}
            handleCloseTrade={handleCloseTrade}
            isSubmitting={isSubmitting}
            formatElapsedTime={formatElapsedTime}
            setTradeToClose={setTradeToClose}
        />
    ) : (
        <OpenTradeForm
            editingOpenTrade={editingOpenTrade}
            setEditingOpenTrade={setEditingOpenTrade}
            isSubmitting={isSubmitting}
            handleSaveTrade={handleSaveTrade}
        />
    );
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {ActiveTradeForm}
            <CashFlowForm handleCashFlow={handleCashFlow} isSubmitting={isSubmitting} />
        </div>
    );
};
