// path: hooks/useSynaraAuth.js
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { auth, db } from '@/firebase';
import { translations as fallbackTranslations } from '@/data/translations';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

export const useSynaraAuth = (initialLang = 'tr', initialTranslations = fallbackTranslations.tr) => {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [T, setT] = useState(initialTranslations);
    const [isAdmin, setIsAdmin] = useState(false);
    const unsubscribeUserDocRef = useRef(() => {}); // Ref to hold the unsubscribe function

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            // KRİTİK FİX 1: Yeni auth durumu gelmeden önce eski Firestore dinleyicisini durdur
            unsubscribeUserDocRef.current();

            if (currentUser) {
                try {
                    const tokenResult = await currentUser.getIdTokenResult(true);
                    const userIsAdminFromToken = tokenResult.claims.admin === true;

                    const userDocRef = doc(db, "users", currentUser.uid);
                    // KRİTİK FİX 2: onSnapshot'tan dönen durdurma fonksiyonunu ref'e kaydet
                    unsubscribeUserDocRef.current = onSnapshot(userDocRef, (docSnap) => {
                        const firestoreData = docSnap.exists() ? docSnap.data() : {};
                        const userIsAdminFromFirestore = firestoreData.isAdmin === true;

                        // KRİTİK GÜNCELLEME: Admin yetkisi, hem token claim'inden hem de Firestore'dan gelen
                        // verinin birleşimiyle belirlenir. Herhangi biri true ise, kullanıcı admin'dir.
                        const finalIsAdmin = userIsAdminFromToken || userIsAdminFromFirestore;
                        
                        setUser(currentUser);
                        setIsAdmin(finalIsAdmin);
                        setUserData(firestoreData);
                        setLoading(false);
                    }, (error) => {
                        // KRİTİK HATA YAKALAMA FİXİ:
                        // Eğer yetki hatası gelirse, dinleyiciyi hemen kapatıyoruz.
                        // Bu genellikle kullanıcı çıkış yaptığında token'ın yetkisiz kalmasından kaynaklanır.
                        if (error.code === 'permission-denied' || error.code === 'unauthenticated') {
                             console.warn("[AUTH PROTOCOL UYARI] Yetkisiz Firestore denemesi algılandı, dinleyici kapatılıyor.");
                             unsubscribeUserDocRef.current(); 
                             return; // Yetkisizse daha fazla işlem yapma
                        }
                        
                        // Diğer hatalarda (ağ, veri hatası vb.)
                        console.error("Kullanıcı verisi dinlenirken hata:", error);
                        setUser(currentUser);
                        setIsAdmin(userIsAdminFromToken); // Fallback to token status
                        setUserData({});
                        setLoading(false);
                    });

                } catch (e) {
                    console.error("Kullanıcı token'ı alınırken hata:", e);
                    setUser(null);
                    setUserData(null);
                    setIsAdmin(false);
                    setLoading(false);
                }
            } else {
                setUser(null);
                setUserData(null);
                setIsAdmin(false);
                setLoading(false);
            }
        });

        // Temizlik: Auth listener ve son aktif Firestore listener'ı durdur
        return () => {
            unsubscribeAuth();
            // Bu, sadece `onAuthStateChanged` kapandığında çağrılır.
            unsubscribeUserDocRef.current();
        };
    }, []);

    const derivedAuthData = useMemo(() => {
        if (!userData) {
            return { subscriptionEndDate: null, isApproved: false };
        }
        const subEndDate = userData.subscriptionEndDate?.toDate ? userData.subscriptionEndDate.toDate() : (userData.subscriptionEndDate || null);
        
        // *****************************************************************
        // *** KALICI YETKİLENDİRME ÇÖZÜMÜ (ADIM 2) ***
        // Yetkilendirme, kullanıcının admin olup olmadığını VEYA geçerli bir abonelik bitiş tarihine sahip olup olmadığını kontrol eder.
        // Yeni kullanıcılar kayıt sırasında 30 günlük deneme süresi alırlar. Bu, sistemin doğru ve kalıcı çalışma şeklidir.
        const hasActiveSubscription = subEndDate && subEndDate.getTime() > Date.now();
        const isApproved = isAdmin || hasActiveSubscription;
        // *****************************************************************

        return { 
            subscriptionEndDate: subEndDate,
            isApproved,
        }; 
    }, [userData, isAdmin]);

    // KRİTİK FİX 3: Çıkış yaparken listener'ı kapat ve Firebase'den çıkış yap.
    const handleLogout = useCallback(async () => {
        try {
            // ÖNCE Firestore dinleyicisini DURDUR. Bu, yetki hatasını engeller.
            unsubscribeUserDocRef.current(); 
            unsubscribeUserDocRef.current = () => {}; // Dinleyiciyi boş bir fonksiyonla değiştir
            
            await signOut(auth);

            // KRİTİK FİX: signOut çağrısından hemen sonra state'leri manuel olarak sıfırla.
            setUser(null);
            setUserData(null);
            setIsAdmin(false);
            setLoading(false); 
            
        } catch (e) {
            console.error("Çıkış yapılırken hata:", e);
            setUser(null);
            setUserData(null);
            setIsAdmin(false);
            setLoading(false);
        }
    }, []);

    return {
        user,
        userData,
        isAdmin,
        ...derivedAuthData,
        T,
        loading,
        lang: initialLang,
        handleLogout,
    };
};

