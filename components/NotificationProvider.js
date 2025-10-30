// path: components/NotificationProvider.js
'use client';

import React, { useCallback, useEffect } from 'react';
import { useNotificationStore } from '@/context/NotificationContext'; // Store'u buradan import ediyoruz
import Icon from './Icon';
import { AnimatePresence, motion } from 'framer-motion';

// --- YENİ: Tek bir Toast Bildirimi için Arayüz Bileşeni ---
const Toast = ({ toast }) => {
    const { id, message, type, title, duration } = toast;
    const { removeToast } = useNotificationStore();

    useEffect(() => {
        const timer = setTimeout(() => {
            removeToast(id);
        }, duration);

        return () => clearTimeout(timer);
    }, [id, duration, removeToast]);

    const getStyles = () => {
        switch (type) {
            case 'success': return { icon: 'check-circle-2', color: 'text-green-400', borderColor: 'border-green-500/50' };
            case 'error': return { icon: 'alert-triangle', color: 'text-red-400', borderColor: 'border-red-500/50' };
            default: return { icon: 'info', color: 'text-sky-400', borderColor: 'border-sky-500/50' };
        }
    };

    const { icon, color, borderColor } = getStyles();

    return (
        <motion.div
            layout // Listede pozisyonu değiştiğinde animasyonla kaymasını sağlar
            initial={{ opacity: 0, y: -30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={`relative bg-gray-800/80 backdrop-blur-md p-4 rounded-xl shadow-2xl w-full max-w-sm border ${borderColor}`}
        >
            <div className="flex items-start space-x-3">
                <Icon name={icon} className={`w-6 h-6 ${color} flex-shrink-0 mt-0.5`} />
                <div className="flex-grow">
                    <h4 className={`font-semibold text-white text-sm`}>{title}</h4>
                    <p className="text-gray-300 text-xs">{message}</p>
                </div>
                <button onClick={() => removeToast(id)} className="text-gray-500 hover:text-white transition-colors flex-shrink-0">
                    <Icon name="x" className="w-5 h-5" />
                </button>
            </div>
            {/* Zamanlayıcı İlerleme Çubuğu */}
            <motion.div
                className={`absolute bottom-0 left-0 h-1 ${color.replace('text-', 'bg-')}`}
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: duration / 1000, ease: 'linear' }}
            />
        </motion.div>
    );
};

// --- YENİ: Onay Modalı için Arayüz Bileşeni ---
const ConfirmModal = () => {
    const { confirmState, closeConfirm } = useNotificationStore();
    const { isVisible, title, message, onConfirm, onCancel, confirmButtonType } = confirmState;
    
    const confirmBtnClass = confirmButtonType === 'destructive' 
        ? 'bg-red-600 hover:bg-red-500' 
        : 'bg-indigo-600 hover:bg-indigo-500';

    if (!isVisible) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 bg-black/80"
            onClick={onCancel}
        >
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                onClick={(e) => e.stopPropagation()}
                className="relative bg-[#111827] p-8 rounded-2xl border border-gray-700 w-full max-w-md text-center shadow-2xl shadow-black/50 space-y-4"
            >
                <div className="mx-auto w-16 h-16 rounded-full bg-gray-800 border-2 border-gray-700 flex items-center justify-center mb-2">
                    <Icon name="help-circle" className="w-9 h-9 text-indigo-400" />
                </div>
                <h3 className="text-2xl font-bold text-white">{title}</h3>
                <p className="text-gray-400 leading-relaxed">{message}</p>
                <div className="flex justify-center gap-4 pt-4">
                    <button onClick={onCancel} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-lg transition-colors">İptal</button>
                    <button onClick={onConfirm} className={`${confirmBtnClass} text-white font-bold py-2 px-6 rounded-lg transition-colors`}>Onayla</button>
                </div>
            </motion.div>
        </motion.div>
    );
};

// --- ANA SAĞLAYICI BİLEŞEN ---
// GÜNCELLENDİ: Artık hem Toast listesini hem de Confirm modalını render ediyor.
const NotificationProvider = () => {
    const { toasts } = useNotificationStore();

    return (
        <>
            {/* Toast Bildirimleri için Konteyner */}
            <div className="fixed top-20 right-4 z-[9999] w-full max-w-sm space-y-3">
                <AnimatePresence>
                    {toasts.map(toast => (
                        <Toast key={toast.id} toast={toast} />
                    ))}
                </AnimatePresence>
            </div>

            {/* Onay Modalı için Konteyner */}
            <AnimatePresence>
                <ConfirmModal />
            </AnimatePresence>
        </>
    );
};

export default NotificationProvider;
