// path: context/AuthContext.js

'use client';

import React, { createContext, useContext } from 'react';
// Sistemdeki (P24.0 FİX) hook'u import et
import { useSynaraAuth } from '@/hooks/useSynaraAuth'; 
import { translations } from '@/data/translations';

// Varsayılan değerler ve tipler
const defaultAuthContext = {
    user: null,
    userData: null,
    isAdmin: false,
    isApproved: false,
    subscriptionEndDate: null,
    T: translations.tr, // Başlangıç için fallback
    loading: true, 
    lang: 'tr',
    logout: async () => {}, // Çıkış fonksiyonu için varsayılan
};

// AuthContext'i oluştur
const AuthContext = createContext(defaultAuthContext);

/**
 * AuthProvider: 
 * Global state yönetimini (Auth, T, vb.) useSynaraAuth kancasından alır 
 * ve tüm alt bileşenlere (children) sağlar.
 */
export const AuthProvider = ({ children, initialTranslations }) => {
    
    // Tüm Auth ve Global state mantığı useSynaraAuth içinde yürütülür.
    // initialTranslations'ı (RootClientWrapper'dan gelir) hook'a geçirir.
    const authState = useSynaraAuth('tr', initialTranslations);

    return (
        <AuthContext.Provider value={authState}>
            {children}
        </AuthContext.Provider>
    );
};

/**
 * useAuth Kancası: 
 * Bileşenlerin (Header, DashboardClient vb.) Auth state'ine 
 * (user, isAdmin, T, loading, logout) erişmesini sağlar.
 * ÇÖKMENİN KÖK NEDENİ BU EXPORT'UN EKSİKLİĞİYDİ.
 */
export const useAuth = () => useContext(AuthContext);

