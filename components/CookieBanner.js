// path: components/CookieBanner.js
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Icon from '@/components/Icon';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';

// --- YARDIMCI ÇEREZ FONKSİYONLARI ---
/**
 * Tarayıcı çerezini okur.
 */
const getCookie = (name) => {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
};

/**
 * Tarayıcı çerezini yazar (365 gün geçerli).
 */
const setCookie = (name, value, days = 365) => {
    if (typeof document === 'undefined') return;
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `; expires=${date.toUTCString()}`;
    document.cookie = `${name}=${value}${expires}; path=/; SameSite=Lax`;
};
// --- YARDIMCI ÇEREZ FONKSİYONLARI BİTİŞ ---


const COOKIE_NAME = 'synara_consent_v2'; // Yeni, daha kararlı çerez adı

const CookieBanner = ({ T }) => {
    // isVisible: Banner'ın şu anda ekranda olup olmadığını kontrol eder.
    const [isVisible, setIsVisible] = useState(false); 
    const { user, userData, loading: authLoading } = useAuth(); 

    useEffect(() => {
        if (authLoading) return;

        // 1. Tarayıcı Çerezini Kontrol Et (Oturum durumundan bağımsız kalıcı kontrol)
        const consent = getCookie(COOKIE_NAME);

        // Eğer kullanıcı daha önce kabul veya reddetme işlemi yapmamışsa (consent null)
        // banner'ı göster.
        if (!consent) {
            setIsVisible(true);
        } else {
             // Daha önce kabul veya red cevabı varsa gizle
            setIsVisible(false);
        }
        
        // 2. Auth ve Firestore Senkronizasyonu (Kurumsal Kayıt)
        // Kullanıcı giriş yaptıysa, authLoading bittiyse ve Firestore'da kayıt yoksa, çerez durumunu Firestore'a yansıtırız.
        // KRİTİK FİX 1: Sadece authLoading bittiğinde ve user varsa Firestore'a yazmayı dene.
        if (!authLoading && user && userData && consent && userData.cookie_consent === undefined) {
             // Çerez durumu varsa, Firestore'a yaz
             const consentValue = consent === 'accepted';
             setDoc(doc(db, 'users', user.uid), { cookie_consent: consentValue }, { merge: true }).catch(e => console.error("Cookie sync Firestore error:", e));
        }

    }, [user, userData, authLoading]);

    /**
     * Kabul Protokolü: Kullanıcıyı onaylar ve tarayıcıya/Firestore'a kaydeder.
     */
    const handleAccept = async () => {
        setCookie(COOKIE_NAME, 'accepted');
        
        // Sadece oturum açmış kullanıcılar için Firestore'a kalıcı olarak kaydet
        // KRİTİK FİX 2: Sadece authLoading bittiğinde ve user varsa Firestore'a yazmayı dene.
        if (!authLoading && user) {
            try {
                await setDoc(doc(db, 'users', user.uid), { cookie_consent: true }, { merge: true });
            } catch (error) {
                // Hata oluşsa bile bu sadece bir log hatasıdır, kullanıcının çıkışını etkilemez.
                console.error("Cookie onayı Firestore'a kaydedilemedi:", error);
            }
        }
        setIsVisible(false);
    };
    
    /**
     * Reddetme Protokolü: Kullanıcıyı kaydeder ve banner'ı gizler.
     */
    const handleReject = () => {
         setCookie(COOKIE_NAME, 'rejected'); // Reddetme durumunu kaydet
         // Reddeden kullanıcı için Firestore'a yazmaya gerek yok, anonim kalabilir.
         setIsVisible(false);
    }

    if (!isVisible) {
        return null;
    }

    // T çeviri objesinin yüklenmesini bekle
    if (!T || !T.cookie_banner_text) return null;

    return (
        <div className="fixed bottom-0 inset-x-0 bg-gray-800/90 backdrop-blur-sm border-t border-indigo-700/50 p-4 z-[9998]">
            <div className="container mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
                <div className="flex items-start text-sm text-gray-300 flex-grow">
                    <Icon name="info" className="w-5 h-5 mr-3 mt-0.5 text-indigo-400 flex-shrink-0" />
                    <p>
                        <span className="font-bold text-white block mb-1">Mesteg Teknoloji Çerez Protokolü:</span>
                        {T.cookie_banner_text}
                        <Link href="/privacy-policy" className="font-semibold text-indigo-400 hover:underline ml-1">
                            {T.footer_privacy}
                        </Link>
                    </p>
                </div>
                {/* KRİTİK DÜZELTME: Kabul ve Reddetme Butonları */}
                <div className="flex space-x-3 flex-shrink-0 w-full lg:w-auto">
                    <button 
                        onClick={handleReject}
                        className="flex-grow bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                    >
                        {T.cookie_banner_reject || "Reddet"}
                    </button>
                    <button 
                        onClick={handleAccept}
                        className="flex-grow bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                    >
                        {T.cookie_banner_accept}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CookieBanner;
