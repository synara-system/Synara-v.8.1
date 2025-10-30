// path: components/WhatsappButton.js
'use client';

import React from 'react';
import Icon from './Icon';
import { useAuth } from '@/context/AuthContext';

/**
 * Whatsapp Canlı Destek Butonu
 * INP Optimizasyonu: Bu bileşen artık app/layout.js içinde 'next/dynamic' 
 * ile ertelenmiş (lazy loaded) olarak yüklenmektedir.
 * Bu dosyada herhangi bir değişiklik yapılmamıştır.
 */
const WhatsappButton = () => {
    const { T } = useAuth();

    // Çeviri metinleri gelene kadar bileşeni render etme
    if (!T || !T.whatsapp_tooltip) {
        return null;
    }

    const phoneNumber = "+905326499700"; // Uluslararası formatta ülke koduyla birlikte
    const defaultMessage = encodeURIComponent(T.whatsapp_message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${defaultMessage}`;

    return (
        <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group fixed bottom-5 right-5 z-50 flex items-center justify-center w-14 h-14 bg-green-500 rounded-full shadow-lg hover:bg-green-600 transition-all duration-300 transform hover:scale-110"
            aria-label="WhatsApp Canlı Destek" // Erişilebilirlik (Accessibility) için eklendi
        >
            <Icon name="whatsapp" className="w-8 h-8 text-white" />
            
            {/* Tooltip (Bilgi balonu) */}
            <div className="absolute right-full mr-3 px-3 py-2 text-sm font-semibold text-white bg-gray-800 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                {T.whatsapp_tooltip}
            </div>
        </a>
    );
};

export default WhatsappButton;
