// path: hooks/useRequiredAuth.js
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; 
import { translations as fallbackTranslations } from '@/data/translations';
import { useNotification } from '@/context/NotificationContext';

// v1.4.2: AŞAMA 1.2 (Auth Refactor)
// 'middleware.js' (v1.4.1) artık sunucu tarafında 'requireLogin' kontrolünü yapıyor.
// Bu hook'tan 'requireLogin' mantığını kaldırarak 'flicker' (titreşim) sorununu çözüyoruz.
// Ancak, 'requireAdmin' ve 'requireApproved' (yetki/abonelik) kontrolleri
// hala istemci tarafında bu hook tarafından yapılmalıdır.

export const useRequiredAuth = ({
    // 'requireLogin' parametresi hala alınıyor ancak 'useEffect' içinde KULLANILMAYACAK.
    // Sadece geriye dönük uyumluluk (prop drilling) için tutulabilir.
    requireLogin = true, 
    requireAdmin = false,
    requireApproved = false,
} = {}) => {
    
    const { T, user, isAdmin, isApproved, loading } = useAuth(); 
    const { showToast } = useNotification();
    const router = useRouter();
    const [redirectPath, setRedirectPath] = useState(null);
    const [isRedirecting, setIsRedirecting] = useState(false); 

    const translations = T || fallbackTranslations.tr;

    useEffect(() => {
        // AuthContext yükleniyorsa veya zaten bir yönlendirme işlemi başladıysa bekle.
        if (loading || isRedirecting) return;

        let targetPath = null;
        let toastMessage = null;

        // 1. Giriş Kontrolü (KALDIRILDI - v1.4.2)
        // 'middleware.js' artık bu kontrolü sunucu tarafında yapıyor.
        // Bu bloğun kaldırılması, 'flicker' sorununu çözer.
        /*
        if (requireLogin && !user) {
            targetPath = '/login';
        }
        */
       
        // 2. Admin Kontrolü (AKTİF - GEREKLİ)
        // Middleware sadece giriş yapılıp yapılmadığını bilir, admin yetkisini bilmez.
        // Bu kontrol burada kalmalıdır.
        if (requireAdmin && !isAdmin) {
             targetPath = '/dashboard';
             toastMessage = T.access_denied_admin_message || 'Bu alana erişim için yönetici yetkisi gereklidir.';
        }
        // 3. Onay (Abonelik) Kontrolü (AKTİF - GEREKLİ)
        // Middleware abonelik durumunu bilmez. Bu kontrol burada kalmalıdır.
        else if (requireApproved && !isApproved) {
            targetPath = '/dashboard';
            toastMessage = T.access_denied_approved_message || 'Bu içeriğe erişim için aktif bir abonelik gereklidir.';
        }
        
        if (targetPath) {
             if(toastMessage) {
                 showToast(toastMessage, 'error');
             }
             setRedirectPath(targetPath);
             setIsRedirecting(true);
        }

    // Bağımlılıklardan 'requireLogin' ve 'user' kaldırıldı.
    // 'user' kaldırıldı çünkü 'isAdmin' ve 'isApproved' zaten 'user'a bağımlı
    // ve 'AuthContext' tarafından yönetiliyor. 'loading' yeterli.
    }, [loading, isAdmin, isApproved, requireAdmin, requireApproved, isRedirecting, router, T, showToast]); 
    
    useEffect(() => {
        if (redirectPath) {
            router.replace(redirectPath);
        }
    }, [redirectPath, router]);
    
    // Yönlendirme veya yükleme devam ederken, içeriğin render edilmesini engelle
    // ve yükleme durumunu bildir.
    // 'middleware' sunucu tarafında 'user' olmayanları engellediği için,
    // buradaki 'loading' (AuthContext'in yüklenmesi) ve 'redirectPath' (yetki kontrolü)
    // ana yükleme durumunu belirler.
    const isLoadingState = !!redirectPath || loading; 

    return { 
        T: translations, 
        // 'isLoadingState' true ise, alt bileşenlerin (örn: DashboardClient)
        // 'user' objesini (null) veya yetkileri (false) alması,
        // veri çekme (tRPC) çağrılarını tetiklemesini engeller.
        user: isLoadingState ? null : user, 
        isAdmin: isLoadingState ? false : isAdmin, 
        isApproved: isLoadingState ? false : isApproved,
        loading: isLoadingState, 
        redirectPath: redirectPath 
    };
};