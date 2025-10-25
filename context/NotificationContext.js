// path: context/NotificationContext.js
'use client';

import React from 'react';
import { create } from 'zustand';
// KRİTİK DÜZELTME (MADDE 3): useAuth bağımlılığı kaldırıldı.
// Artık T (çeviri objesi) doğrudan fonksiyonlara parametre olarak geçilecek.

// --- 1. Zustand Store Oluşturma ---
export const useNotificationStore = create((set, get) => ({
  toasts: [],
  confirmState: {
    isVisible: false,
    type: 'confirm',
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {},
    confirmButtonType: 'default',
  },

  showToast: (message, type = 'info', duration = 4000, T) => {
    let title = '';
    if (T) {
        if (type === 'success') title = T.notification_success_title || "Başarılı";
        else if (type === 'error') title = T.notification_error_title || "Hata";
        else if (type === 'info') title = T.notification_info_title || "Bilgi";
    }
    
    const newToast = {
        id: Date.now() + Math.random(),
        message,
        type,
        title: title || type.charAt(0).toUpperCase() + type.slice(1),
        duration,
    };

    set(state => ({ toasts: [...state.toasts, newToast] }));
  },

  removeToast: (id) => {
    set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }));
  },

  showConfirm: (message, onConfirmCallback, options = {}, T) => {
    const closeModalOnly = () => get().closeConfirm();

    set({
      confirmState: {
        isVisible: true,
        type: 'confirm',
        title: options.title || (T ? T.notification_confirm_title : 'Onay Gerekli'),
        message,
        confirmButtonType: options.confirmButtonType || 'default',
        onConfirm: () => {
          closeModalOnly();
          onConfirmCallback();
        },
        onCancel: options.onCancel ? () => { closeModalOnly(); options.onCancel(); } : closeModalOnly,
      }
    });
  },

  closeConfirm: () => set({ confirmState: { ...get().confirmState, isVisible: false } }),
}));

// --- 2. Hook ---
// KRİTİK DÜZELTME (MADDE 3): Hook artık T objesini useAuth'tan alıp store fonksiyonlarına iletiyor.
// Bu, iki state yönetim sistemini birbirinden ayırır.
import { useAuth } from '@/context/AuthContext';

export const useNotification = () => {
    const { showToast, showConfirm } = useNotificationStore();
    // T objesini sadece bu hook içinde alıyoruz.
    const { T } = useAuth();

    // Orijinal store fonksiyonlarını T objesi ile sarmalayan yeni fonksiyonlar
    const showToastWithT = (message, type, duration) => showToast(message, type, duration, T);
    const showConfirmWithT = (message, onConfirm, options) => showConfirm(message, onConfirm, options, T);

    // Dışarıya sarmalanmış fonksiyonları veriyoruz
    return { showToast: showToastWithT, showConfirm: showConfirmWithT, showAlert: showToastWithT };
};
