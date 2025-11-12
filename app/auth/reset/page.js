// path: app/auth/reset/page.js
'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { auth } from '@/firebase';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import Icon from '@/components/Icon';
import Link from 'next/link';

const PasswordResetPage = () => {
    const { T, loading: authLoading } = useAuth();
    const { showAlert } = useNotification();
    const router = useRouter();
    const searchParams = useSearchParams();
    
    // URL'den gerekli kod ve mode parametrelerini al
    const actionCode = searchParams.get('oobCode');
    const mode = searchParams.get('mode');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [status, setStatus] = useState('loading'); // 'loading', 'ready', 'success', 'error'
    const [errorMessage, setErrorMessage] = useState('');

    // 1. Action Code'u Doğrula (HOOK MOVED TO TOP LEVEL)
    useEffect(() => {
        if (status !== 'loading' || !actionCode || mode !== 'resetPassword') return;

        verifyPasswordResetCode(auth, actionCode)
            .then(() => {
                setStatus('ready');
            })
            .catch((error) => {
                console.error("Şifre sıfırlama kodu doğrulanamadı:", error);
                setErrorMessage("Sıfırlama bağlantısı geçersiz veya süresi dolmuş.");
                setStatus('error');
            });
    }, [actionCode, status, mode]);

    // Firebase'den gelen çeviri metinleri yüklenene kadar bekle
    if (authLoading || !T || !actionCode) {
         return <LoadingScreen T={T} isCodeMissing={!actionCode} />;
    }

    // 2. Yeni Şifreyi Kaydet
    const handleResetPassword = (e) => {
        e.preventDefault();
        
        if (password.length < 6) {
            showAlert("Şifre en az 6 karakter olmalıdır.", 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            showAlert("Şifreler birbiriyle eşleşmiyor.", 'error');
            return;
        }
        
        setStatus('loading');
        
        confirmPasswordReset(auth, actionCode, password)
            .then(() => {
                showAlert("Şifreniz başarıyla güncellendi! Giriş sayfasına yönlendiriliyorsunuz...", 'success', 3000);
                setStatus('success');
                setTimeout(() => router.push('/login'), 3000);
            })
            .catch((error) => {
                console.error("Şifre güncelleme hatası:", error);
                setErrorMessage("Şifre güncellenirken bir hata oluştu. Lütfen bağlantınızı kontrol edin.");
                setStatus('error');
            });
    };
    
    // --- Yardımcı Render Fonksiyonları ---
    
    const renderContent = () => {
        switch (status) {
            case 'loading':
                return <div className="loader mx-auto"></div>;
            case 'error':
                return (
                    <div className="text-center">
                        <Icon name="x-circle" className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-red-400">İşlem Başarısız</h2>
                        <p className="text-gray-400 mt-2">{errorMessage}</p>
                        <Link href="/login" className="mt-6 inline-block bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                            Giriş Sayfasına Dön
                        </Link>
                    </div>
                );
             case 'success':
                return (
                    <div className="text-center">
                        <Icon name="check-circle-2" className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-green-400">Şifre Başarıyla Sıfırlandı</h2>
                        <p className="text-gray-400 mt-2">Yönlendiriliyorsunuz...</p>
                    </div>
                );
            case 'ready':
                return (
                    <>
                        <h2 className="text-3xl font-bold text-white mb-6">Yeni Şifre Belirle</h2>
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            {/* Yeni Şifre */}
                            <div>
                                <label className="text-sm font-bold text-gray-400 tracking-wide">Yeni Şifre</label>
                                <div className="relative">
                                    <input type={isPasswordVisible ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={T.password_placeholder || "••••••••"} className="w-full p-3 mt-1 bg-gray-700 rounded-lg border border-transparent focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" required />
                                    <button type="button" onClick={() => setIsPasswordVisible(!isPasswordVisible)} className="absolute inset-y-0 right-0 px-4 text-gray-400 hover:text-white">
                                        <Icon name={isPasswordVisible ? "eye-off" : "eye"} className="w-5 h-5"/>
                                    </button>
                                </div>
                            </div>
                            {/* Şifre Tekrarı */}
                            <div>
                                <label className="text-sm font-bold text-gray-400 tracking-wide">Şifreyi Onayla</label>
                                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder={T.password_placeholder || "••••••••"} className="w-full p-3 mt-1 bg-gray-700 rounded-lg border border-transparent focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" required />
                            </div>
                            
                            <button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-500 text-gray-900 font-bold py-3 rounded-lg transition-colors shadow-lg shadow-yellow-900/50">
                                Şifreyi Güncelle
                            </button>
                        </form>
                    </>
                );
            default:
                return null;
        }
    };
    
    // Sayfanın iskeleti
    return (
        <div className="flex items-center justify-center min-h-screen bg-[#0b1220] text-white px-4 relative">
             <div className="absolute inset-0 bg-grid-indigo-500/10 bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_at_center,transparent_0%,black_100%)]"></div>
            <div className="absolute inset-0" style={{
                background: 'radial-gradient(ellipse at center, rgba(79, 70, 229, 0.1) 0%, rgba(11, 18, 32, 0) 70%)'
            }}></div>
            <div className="w-full max-w-md p-8 space-y-6 bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl shadow-indigo-900/50 border border-indigo-700/50 relative z-10">
                <div className="text-center">
                    <Icon name="shield-check" className="w-10 h-10 mx-auto text-yellow-400 mb-4"/>
                    <h1 className="text-2xl font-bold text-white tracking-wider">Şifre Sıfırlama Protokolü</h1>
                </div>
                {renderContent()}
            </div>
        </div>
    );
};

// KRİTİK: Action Code URL'de eksikse gösterilecek basitleştirilmiş ekran
const LoadingScreen = ({ T, isCodeMissing }) => (
    <div className="flex items-center justify-center min-h-screen bg-[#0b1220] text-white px-4 relative">
        <div className="w-full max-w-md p-8 text-center space-y-6 bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700">
            {isCodeMissing ? (
                <>
                    <Icon name="alert-triangle" className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white">Geçersiz Erişim Yolu</h2>
                    <p className="text-gray-400">Şifre sıfırlama işlemi için lütfen e-posta ile gelen bağlantıyı kullanın.</p>
                </>
            ) : (
                <>
                    <div className="loader mx-auto"></div>
                    <p className="text-lg font-semibold">{T?.kasa_loading || "Sistem Yetkisi Doğrulanıyor..."}</p>
                </>
            )}
            
            <Link href="/login" className="mt-6 inline-block text-indigo-400 hover:underline">
                 Giriş Ekranına Dön
            </Link>
        </div>
    </div>
);

export default PasswordResetPage;
