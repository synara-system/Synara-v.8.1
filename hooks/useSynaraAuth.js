// path: hooks/useSynaraAuth.js
// v1.10: LOGIN KİLİDİ DÜZELTMESİ (AŞAMA 2.3 - BAĞIMLILIK OLMADAN)
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
// P29.0 FİX (Adım 3 - Revert P27.0 Adım 2): Çökmeye (P29.0 Kök Neden) neden olan
// 'useRouter' ve 'useQueryClient' import'ları (P27.0 Adım 2) kaldırıldı.
// import { useRouter } from 'next/navigation'; // P29.0 FİX (Adım 3): KALDIRILDI
// import { useQueryClient } from '@tanstack/react-query'; // P29.0 FİX (Adım 3): KALDIRILDI
// ---
import { auth, db } from '@/firebase';
import { translations as fallbackTranslations } from '@/data/translations';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

// v1.10 FİX (BAŞLANGIÇ): 'js-cookie' (v1.8) bağımlılığı kaldırıldı.
// 'Module not found' (v1.9) hatasını çözmek için 'native' (tarayıcı)
// cookie fonksiyonları eklendi.
// import Cookies from 'js-cookie'; // v1.8 HATASI - KALDIRILDI

/**
 * Tarayıcıya (client-side) cookie ayarlar.
 * @param {string} name - Cookie adı (örn: 'token')
 * @param {string} value - Cookie değeri
 * @param {number} days - Kaç gün geçerli olacağı
 */
function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    // 'path=/' -> Cookie'nin tüm sitede geçerli olmasını sağlar
    // 'SameSite=Strict' -> Güvenlik (CSRF)
    // 'Secure' -> Sadece HTTPS üzerinden gönder (production'da)
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Strict" + secure;
}

/**
 * Tarayıcıdan cookie siler.
 * @param {string} name - Cookie adı (örn: 'token')
 */
function removeCookie(name) {
    // Cookie'yi silmek için geçmiş bir tarih ve boş değer ata
    document.cookie = name + '=; Max-Age=-99999999; path=/; SameSite=Strict;';
}
// v1.10 FİX (BİTİŞ)


/**
 * Bu hook, Firebase Auth (Oturum) ve Firestore (Kullanıcı Datası) 
 * durumlarını yönetir, çevirileri (T) yükler ve global 'loading' 
 * state'ini kontrol eder.
 */
export const useSynaraAuth = (initialLang = 'tr', initialTranslations = fallbackTranslations) => {
    // P29.0 FİX (Adım 3 - Revert P27.0 Adım 2): Çökmeye (P29.0 Kök Neden) neden olan
    // 'useRouter' ve 'useQueryClient' hook çağrıları (P27.0 Adım 2) kaldırıldı.
    // const router = useRouter(); // P29.0 FİX (Adım 3): KALDIRILDI
    // const queryClient = useQueryClient(); // P29.0 FİX (Adım 3): KALDIRILDI
    // ---
    
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true); // Başlangıçta yükleniyor
    
    // --- P9.0 FİX (KÖK NEDEN) ---
    // 'T' state'i, 'initialTranslations' objesi (örn: { tr: {...} }) ile değil,
    // doğrudan 'initialTranslations.tr' (Türkçe çeviri objesi) ile başlatılmalıdır.
    // RootClientWrapper'daki 'Object.keys(T).length > 10' kontrolü bu yüzden başarısız oluyordu.
    //
    // HATA: const [T, setT] = useState(initialTranslations);
    // DOĞRUSU (DÜZELTME: 'null' çökmesini engellemek için '?.' eklendi):
    const [T, setT] = useState(initialTranslations?.tr || fallbackTranslations.tr);
    // --- P9.0 FİX Sonu ---

    const [isAdmin, setIsAdmin] = useState(false);
    const unsubscribeUserDocRef = useRef(() => {}); // Firestore dinleyicisini tutan Ref

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            // KRİTİK FİX 1: Yeni auth durumu gelmeden önce eski Firestore dinleyicisini durdur
            // Bu, 'permission-denied' hatasını ve hafıza sızıntısını engeller.
            if (typeof unsubscribeUserDocRef.current === 'function') {
                unsubscribeUserDocRef.current();
            }

            if (currentUser) {
                // --- KULLANICI GİRİŞ YAPMIŞ ---
                try {
                    // 1. Kullanıcı token'ını al (Admin yetkisini doğrulamak için)
                    // v1.8 FİX: Token'ı 'token' değişkenine de al
                    const tokenResult = await currentUser.getIdTokenResult(true);
                    const token = await currentUser.getIdToken(); // v1.8 FİX: Cookie için token
                    const userIsAdminFromToken = tokenResult.claims.admin === true;

                    // v1.10 FİX (BAŞLANGIÇ): LOGIN KİLİDİ DÜZELTMESİ (AŞAMA 2.3)
                    // 'middleware.js' (v1.4.1) yönlendirme yapabilsin diye
                    // 'token' cookie'sini 'onAuthStateChanged' içinde AYARLA.
                    // 'Cookies.set' (v1.8 hatası) yerine 'setCookie' (v1.10) kullanıldı.
                    setCookie('token', token, 1); // 1 gün geçerli
                    // v1.10 FİX (BİTİŞ)

                    // 2. Kullanıcının Firestore'daki datasına abone ol (onSnapshot)
                    const userDocRef = doc(db, "users", currentUser.uid);
                    
                    // KRİTİK FİX 2: onSnapshot'tan dönen durdurma fonksiyonunu ref'e kaydet
                    unsubscribeUserDocRef.current = onSnapshot(userDocRef, (docSnap) => {
                        if (docSnap.exists()) {
                            // Firestore'da datası varsa
                            const dbData = docSnap.data();
                            
                            // P33.0 FİX (KÖK NEDEN DÜZELTMESİ): "Admin Paneli" (P33.0) iş kuralı düzeltildi.
                            // "zaten çalışıyordu" (P33.0 Hipotezi) çünkü sistem Token'a (P29.0 Adım 3) 
                            // DEĞİL, Firestore veritabanına (`dbData.isAdmin`) bakıyordu.
                            //
                            // MEVCUT (HATALI - P29.0 Adım 3, Satır 66): 
                            // setIsAdmin(userIsAdminFromToken); // Token'a güven
                            
                            // DÜZELTME (P33.0 FİX): Admin olmak için YA Token YA DA DB (Database) 'admin: true' olmalıdır.
                            const userIsAdminFromDB = dbData?.isAdmin === true; // P33.0 FİX: Güvenli okuma (?. eklendi)
                            setIsAdmin(userIsAdminFromToken || userIsAdminFromDB);
                            // P33.0 FİX Sonu
                            
                            setUserData(dbData);
                            setUser(currentUser);
                            setLoading(false); // VERİ GELDİ, YÜKLEME BİTTİ
                        } else {
                            // Firestore'da datası (henüz) yoksa (yeni kayıt vb.)
                            setUser(currentUser);
                            setUserData(null);
                            
                            // P33.0 FİX (Tutarlılık): Datası yoksa, SADECE Token'a güven (P29.0 Adım 3).
                            setIsAdmin(userIsAdminFromToken); // Token'a güven
                            
                            setLoading(false); // YÜKLEME BİTTİ (Kayıt olmasa bile)
                        }
                    }, (error) => {
                        // onSnapshot hatası (örn: yetki yok)
                        console.error("Firestore (onSnapshot) dinleme hatası:", error);
                        setUser(currentUser); // Auth var ama Firestore datası yok
                        setUserData(null);
                        
                        // P33.0 FİX (Tutarlılık): Hata durumunda bile SADECE Token'a güven (P29.0 Adım 3).
                        setIsAdmin(userIsAdminFromToken); // Token'a güven
                        
                        setLoading(false); // YÜKLEME BİTTİ (Hata olsa bile)
                    });

                } catch (error) {
                    // getIdTokenResult hatası (örn: ağ sorunu)
                    console.error("Auth (getIdTokenResult) hatası:", error);
                    
                    // v1.10 FİX: Hata durumunda cookie'yi KALDIR
                    removeCookie('token');
                    
                    setUser(null); // Hata durumunda oturumu kapat
                    setUserData(null);
                    setIsAdmin(false);
                    setLoading(false); // YÜKLEME BİTTİ
                }
            } else {
                // --- KULLANICI ÇIKIŞ YAPMIŞ (VEYA ANONİM) ---
                
                // v1.10 FİX (BAŞLANGIÇ): LOGIN KİLİDİ DÜZELTMESİ (AŞAMA 2.3)
                // 'middleware.js' (v1.4.1) bilsin diye 'token' cookie'sini KALDIR.
                // 'Cookies.remove' (v1.8 hatası) yerine 'removeCookie' (v1.10) kullanıldı.
                removeCookie('token');
                // v1.10 FİX (BİTİŞ)
                
                // --- P8.0 FİX (KÖK NEDEN) ---
                // 'Anonim' (Giriş yapılmamış) kullanıcı durumu.
                // 'loading' state'i burada 'true'da takılı kalıyordu 
                // ve 'boş sayfa' (SkeletonLoader) sorununa neden oluyordu.
                
                // HATA: setLoading(true); 
                // DOĞRUSU:
                setUser(null);
                setUserData(null);
                setIsAdmin(false);
                setLoading(false); // YÜKLEME BİTTİ (Anonim kullanıcı için)
                // --- P8.0 FİX Sonu ---
            }
        });

        // Cleanup function
        return () => {
            unsubscribeAuth(); // Auth listener'ı kaldır
            if (typeof unsubscribeUserDocRef.current === 'function') {
                unsubscribeUserDocRef.current(); // Firestore listener'ı kaldır
            }
        };
    }, []); // Sadece component mount edildiğinde çalışır

    // KRİTİK FİX (Derleme): Bu hook'u dosyanın içine taşıdım (snippet'ten aldım)
    const derivedAuthData = useMemo(() => {
        const subEndDate = userData?.subscriptionEndDate 
            ? new Date(userData.subscriptionEndDate.seconds * 1000) 
            : null;

        // P34.0 FİX (KÖK NEDEN DÜZELTMESİ): "Normal Kullanıcı" (non-admin) çökmesi (ReferenceError) düzeltildi.
        // 'DashboardClient.js' (Satır 340) 'lastTradeCloseDate' bekliyordu (P34.0 Kök Neden).
        // Bu, (userData'dan geldiği varsayılarak) 'derivedAuthData'ya (P34.0 FİX) eklendi.
        const lastTradeDate = userData?.lastTradeCloseDate
            ? new Date(userData.lastTradeCloseDate.seconds * 1000)
            : null;
        // P34.0 FİX Sonu

        // *****************************************************************
        // KRİTİK KURAL (İŞ MANTIĞI): 
        // 'isApproved' (Onaylı) olmak için:
        // 1. Ya Admin olmalı (token'dan gelen)
        // 2. Ya da Firestore'da geçerli bir abonelik tarihi olmalı.
        // *****************************************************************
        const hasActiveSubscription = subEndDate && subEndDate.getTime() > Date.now();
        const isApproved = isAdmin || hasActiveSubscription;
        // *****************************************************************

        return { 
            subscriptionEndDate: subEndDate,
            isApproved,
            lastTradeCloseDate: lastTradeDate, // P34.0 FİX: 'return' objesine eklendi.
        }; 
    }, [userData, isAdmin]);

    // KRİTİK FİX 3: Çıkış yaparken listener'ı kapat ve Firebase'den çıkış yap.
    const handleLogout = useCallback(async () => {
        try {
            // ÖNCE Firestore dinleyicisini DURDUR. Bu, yetki hatasını engeller.
            if (typeof unsubscribeUserDocRef.current === 'function') {
                unsubscribeUserDocRef.current(); 
            }
            unsubscribeUserDocRef.current = () => {}; // Dinleyiciyi boş bir fonksiyonla değiştir

            // v1.10 FİX (BAŞLANGIÇ): GÜVENLİ ÇIKIŞ
            // 'signOut' demeden ÖNCE 'token' cookie'sini KALDIR.
            // 'Cookies.remove' (v1.8 hatası) yerine 'removeCookie' (v1.10) kullanıldı.
            removeCookie('token');
            // v1.10 FİX (BİTİŞ)
            
            await signOut(auth);
            
            // P29.0 FİX (Adım 3 - Revert P27.0 Adım 2): Çökmeye (P29.0 Kök Neden) neden olan
            // 'queryClient.clear()' (P27.0 Adım 2) mantığı kaldırıldı.
            // Bu mantık artık 'components/Header.js' (P29.0 Adım 1/2) içindedir.
            // await queryClient.clear(); // P29.0 FİX (Adım 3): KALDIRILDI

            // KRİTİK FİX: signOut çağrısından hemen sonra state'leri manuel olarak sıfırla.
            // (onAuthStateChanged'in 'else' bloğu zaten tetiklenecek, 
            // ancak anında UI tepkisi için bu gereklidir)
            
            // --- P26.0 FİX (REVERT P25.0) ---
            // 'Çıkış Yap' kilitlenmesini (P25.0 teorisi) çözmek için,
            // P25.0'da kaldırılan (yorum satırı yapılan) manuel state 
            // sıfırlamaları (P24.0 mantığı) UI'ın anında tepkisi 
            // için geri yüklendi.
            setUser(null);
            setUserData(null);
            setIsAdmin(false);
            setLoading(false); 
            // --- P26.0 FİX Sonu ---
            
            // P29.0 FİX (Adım 3 - Revert P27.0 Adım 2): Çökmeye (P29.0 Kök Neden) neden olan
            // 'router.push('/login')' (P27.0 Adım 2) mantığı kaldırıldı.
            // Bu mantık artık 'components/Header.js' (P29.0 Adım 1/2) içindedir.
            // router.push('/login'); // P29.0 FİX (Adım 3): KALDIRILDI
            
        } catch (e) {
            console.error("Çıkış yapılırken hata:", e);
            
            // v1.10 FİX: Hata durumunda bile cookie'yi KALDIR
            removeCookie('token');
            
            // Hata durumunda bile state'i sıfırla
            
            // --- P26.0 FİX (REVERT P25.0) ---
            // Manuel sıfırlama (P24.0) geri yüklendi.
            setUser(null);
            setUserData(null);
            setIsAdmin(false);
            setLoading(false);
            // --- P26.0 FİX Sonu ---
            
            // P29.0 FİX (Adım 3 - Revert P27.0 Adım 2): Çökmeye (P29.0 Kök Neden) neden olan
            // 'router.push('/login')' (P27.0 Adım 2) mantığı kaldırıldı.
            // router.push('/login'); // P29.0 FİX (Adım 3): KALDIRILDI
        }
    }, []); // P29.0 FİX (Adım 3 - Revert P27.0 Adım 2): Bağımlılık (dependency) dizisi P26.0 FİX ('[]' boş) haline geri döndürüldü.
    // --- P24.0 FİX Sonu ---

    // Global state'i döndür
    return {
        user,
        userData,
        isAdmin,
        ...derivedAuthData, // (isApproved, subscriptionEndDate, P34.0 FİX -> lastTradeCloseDate)
        T,
        loading,
        lang: 'tr', // Sabit
        logout: handleLogout,
    };
};