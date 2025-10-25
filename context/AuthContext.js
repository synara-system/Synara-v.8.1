// path: context/AuthContext.js
'use client';

import React, { createContext, useContext } from 'react';
import { useSynaraAuth } from '@/hooks/useSynaraAuth';

// Varsayılan değerler ve tipler
const defaultAuthContext = {
    user: null,
    isAdmin: false,
    isApproved: false,
    subscriptionEndDate: null,
    T: {}, 
    loading: true, 
    lang: 'tr',
};

// AuthContext'i oluştur
const AuthContext = createContext(defaultAuthContext);

// AuthProvider: useSynaraAuth kancasını kullanarak global state'i sağlar.
// KRİTİK DÜZELTME: initialTranslations'ı prop olarak al
export const AuthProvider = ({ children, initialTranslations }) => {
    // Tüm Auth ve Global state mantığı useSynaraAuth içinde yürütülür
    // KRİTİK DÜZELTME: initialTranslations'ı hook'a geçir
    const authState = useSynaraAuth('tr', initialTranslations);

    return (
        <AuthContext.Provider value={authState}>
            {children}
        </AuthContext.Provider>
    );
};

// Kanca: Context değerini çekmek için kullanılır
export const useAuth = () => useContext(AuthContext);

