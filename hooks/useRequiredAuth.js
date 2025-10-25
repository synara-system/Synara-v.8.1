// path: hooks/useRequiredAuth.js
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; 
import { translations as fallbackTranslations } from '@/data/translations';
import { useNotification } from '@/context/NotificationContext';

export const useRequiredAuth = ({
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
        if (loading || isRedirecting) return;

        let targetPath = null;
        let toastMessage = null;

        // 1. Giriş Kontrolü
        if (requireLogin && !user) {
            targetPath = '/login';
        }
        // 2. Admin Kontrolü
        else if (requireAdmin && !isAdmin) {
             targetPath = '/dashboard';
             toastMessage = T.access_denied_admin_message || 'Bu alana erişim için yönetici yetkisi gereklidir.';
        }
        // 3. KRİTİK GÜNCELLEME: Onay (Abonelik) Kontrolü
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

    }, [loading, user, isAdmin, isApproved, requireLogin, requireAdmin, requireApproved, isRedirecting, router, T, showToast]); 
    
    useEffect(() => {
        if (redirectPath) {
             router.replace(redirectPath);
        }
    }, [redirectPath, router]);
    
    // Yönlendirme veya yükleme devam ederken, içeriğin render edilmesini engelle
    // ve yükleme durumunu bildir.
    const isLoadingState = !!redirectPath || loading; // KRİTİK DÜZELTME: Her zaman boolean olmasını sağla

    return { 
        T: translations, 
        user: isLoadingState ? null : user, 
        isAdmin: isLoadingState ? false : isAdmin, 
        isApproved: isLoadingState ? false : isApproved,
        loading: isLoadingState, 
        redirectPath: redirectPath 
    };
};
