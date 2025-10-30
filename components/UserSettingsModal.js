// path: components/UserSettingsModal.js
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from './Icon';
import { useNotification } from '@/context/NotificationContext';
import { trpc } from '@/lib/trpc/client';
import { useAuth } from '@/context/AuthContext';
import dynamic from 'next/dynamic'; // Dynamic import for Icon (optional but safer)

/**
 * Kullanıcı Ayarları Formu ve Modal Bileşeni.
 * @param {object} props - Bileşen özellikleri.
 * @param {object} props.T - Çeviri objesi (useAuth'tan çekiliyor).
 * @param {object} props.initialData - { displayName, tradingViewUsername }
 * @param {function} props.onClose - Modalı kapatma işlevi.
 */
const UserSettingsModal = ({ T, initialData, onClose }) => {
    const { showAlert } = useNotification();
    const { user } = useAuth(); // AuthContext'ten kullanıcı bilgisini al
    const utils = trpc.useContext();
    
    const [formData, setFormData] = useState(initialData);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // KRİTİK: tRPC mutasyonunu tanımla (admin router'daki prosedür)
    const updateMutation = trpc.admin.updateUserSettings.useMutation({
        onMutate: () => {
             setIsSubmitting(true);
        },
        onSuccess: () => {
            // Başarılı olduğunda kullanıcı context'ini ve dashboard verisini yenile
            showAlert(T.dashboard_update_success || 'Ayarlar başarıyla güncellendi.', 'success');
            
            // Firebase Auth token'ını yenilemeye zorla (displayName'in güncellenmesi için)
            if(user) user.getIdToken(true);
            
            // Dashboard'u yeniden çekmek için invalidate et
            utils.kasa.getKasaData.invalidate(); 
            
            onClose(); // İşlem bitince modalı kapat
        },
        onError: (error) => {
            showAlert(error.message, 'error');
        },
        onSettled: () => {
             setIsSubmitting(false);
        }
    });

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const displayName = formData.displayName?.trim();
        const tradingViewUsername = formData.tradingViewUsername?.trim();

        if (!displayName || displayName.length < 3) {
            showAlert('Görünen Ad en az 3 karakter olmalıdır.', 'error');
            return;
        }

        updateMutation.mutate({ 
            displayName, 
            tradingViewUsername: tradingViewUsername || null,
        });
    };
    
    // ESC tuşu ile kapatma
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    // Modal yapısı
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
        >
            <motion.div
                initial={{ scale: 0.8, y: -50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 50 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                onClick={(e) => e.stopPropagation()}
                className="relative bg-gray-900 p-8 rounded-2xl border border-yellow-700/50 w-full max-w-lg text-left shadow-2xl shadow-indigo-900/50 space-y-6"
            >
                <div className="flex justify-between items-start border-b border-gray-700 pb-4">
                    <h3 className="text-2xl font-bold text-yellow-400 flex items-center">
                        {/* KRİTİK DÜZELTME 7: Modal başlık ikonu 'help-circle' yerine 'sliders' olarak değiştirildi */}
                        <Icon name="sliders" className="w-6 h-6 mr-3"/> 
                        {T.user_settings_modal_title || 'Ayarlar'}
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1" disabled={isSubmitting}>
                        {/* KRİTİK DÜZELTME 8: Kapatma ikonu 'x' (Icon.js'te path'i düzeltildi) */}
                        <Icon name="x" className="w-6 h-6" /> 
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Görünen Ad */}
                    <div>
                        <label htmlFor="displayName" className="block text-sm font-medium text-gray-400 mb-1">
                            {T.user_settings_displayName_label || 'Görünen Ad'}
                        </label>
                        <input
                            id="displayName"
                            type="text"
                            name="displayName"
                            value={formData.displayName}
                            onChange={handleChange}
                            maxLength={50}
                            placeholder="Adınız veya Takma Adınız"
                            className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:ring-2 focus:ring-indigo-500 transition-colors"
                            required
                            disabled={isSubmitting}
                        />
                         <p className="text-xs text-gray-500 mt-1">Bu ad, yorumlarda ve topluluk alanlarında görünecektir.</p>
                    </div>

                    {/* TradingView Kullanıcı Adı */}
                    <div>
                        <label htmlFor="tradingViewUsername" className="block text-sm font-medium text-gray-400 mb-1">
                            {T.user_settings_tradingViewUsername_label || 'TradingView Kullanıcı Adı'}
                        </label>
                        <input
                            id="tradingViewUsername"
                            type="text"
                            name="tradingViewUsername"
                            value={formData.tradingViewUsername}
                            onChange={handleChange}
                            maxLength={50}
                            placeholder="TradingView kullanıcı adınızı girin"
                            className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:ring-2 focus:ring-indigo-500 transition-colors"
                            disabled={isSubmitting}
                        />
                        {/* KRİTİK FİX 3: Kaçış karakteri kullanıldı (' -> &apos;) */}
                        <p className="text-xs text-gray-500 mt-1">Sinyal entegrasyonu ve TradingView&apos;e özel eklentiler için gereklidir.</p>
                    </div>

                    <div className="flex justify-end pt-4 gap-4">
                         <button 
                            type="button" 
                            onClick={onClose} 
                            disabled={isSubmitting}
                            className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !formData.displayName}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-6 rounded-lg disabled:opacity-50 transition-colors shadow-lg shadow-indigo-900/50"
                        >
                            {isSubmitting ? 'Güncelleniyor...' : (T.user_settings_update_button || 'Kaydet')}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};

export default UserSettingsModal;
