// path: app/login/page.js
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
// KRİTİK FİX: Firebase fonksiyonları doğrudan import edildi.
import { GoogleAuthProvider, signInWithPopup, getAdditionalUserInfo, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore'; 
import { auth, db } from '@/firebase';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import Icon from '@/components/Icon';
import { motion, AnimatePresence } from 'framer-motion';
// KRİTİK FİX: handleFirebaseError'ı simüle etmek için dummy fonksiyonu eklendi.
// Gerçek çeviri mantığı data/translations.js'de olmalıdır.
const handleFirebaseError = (err, T) => {
    let message = T?.error_auth_generic || 'Giriş işlemi başarısız oldu. Lütfen bilgilerinizi kontrol edin.';
    // Firebase kodlarına göre özel mesajlar
    if (err.code === 'auth/user-not-found') message = T?.error_auth_user_not_found || 'Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı.';
    if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') message = T?.error_auth_wrong_password || 'E-posta veya şifre yanlış.';
    if (err.code === 'auth/too-many-requests') message = T?.login_attempts_exceeded || 'Çok fazla hatalı deneme. Erişim geçici olarak kilitlendi.';
    return { message };
};


const LoginPage = () => {
    const { T, user } = useAuth(); 
    const { showToast } = useNotification();
    const router = useRouter();
    const searchParams = useSearchParams();
    
    // Yönlendirme URL'sini al
    const redirectUrl = searchParams.get('redirect') || '/dashboard';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    
    // Şifre Sıfırlama State'leri
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    
    // Güvenlik State'leri
    const [loginAttempts, setLoginAttempts] = useState(0);
    const [isLocked, setIsLocked] = useState(false);
    const [showForgotPasswordSuggestion, setShowForgotPasswordSuggestion] = useState(false);
    const lockoutTimerRef = useRef(null);

    // Oturum Açılışını Kontrol Et ve Yönlendir
    useEffect(() => {
        if (user) {
             router.replace(redirectUrl);
        }
    }, [user, router, redirectUrl]);
    
    // Temizlik
    useEffect(() => {
        return () => {
            if (lockoutTimerRef.current) {
                clearTimeout(lockoutTimerRef.current);
            }
        };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isLocked) {
            showToast(T.login_attempts_exceeded, 'error');
            return;
        }
        setLoading(true);
        setShowForgotPasswordSuggestion(false);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            showToast(T.login_success || 'Giriş başarılı. Panele yönlendiriliyorsunuz...', 'success');
            // Yönlendirme useEffect([user]) tarafından yönetiliyor.

        } catch (err) {
            const { message } = handleFirebaseError(err, T); 
            showToast(message, 'error');
            
            if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                setShowForgotPasswordSuggestion(true);
            }

            const newAttempts = loginAttempts + 1;
            setLoginAttempts(newAttempts);

            if (newAttempts >= 5) {
                setIsLocked(true);
                showToast(T.login_attempts_exceeded, 'error');
                lockoutTimerRef.current = setTimeout(() => {
                    setIsLocked(false);
                    setLoginAttempts(0);
                }, 60000); // 1 dakika
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setGoogleLoading(true);
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            const additionalUserInfo = getAdditionalUserInfo(result);

            if (additionalUserInfo?.isNewUser) {
                const userDocRef = doc(db, "users", user.uid);
                
                // KRİTİK: Yeni kullanıcıya 30 günlük deneme aboneliği tanımlanıyor.
                const trialEndDate = new Date();
                trialEndDate.setDate(trialEndDate.getDate() + 30);
                
                await setDoc(userDocRef, {
                    email: user.email,
                    displayName: user.displayName || user.email.split('@')[0],
                    createdAt: serverTimestamp(),
                    tradingViewUsername: "",
                    subscriptionStatus: "active",
                    subscriptionEndDate: Timestamp.fromDate(trialEndDate),
                    isAdmin: false,
                    emailVerified: user.emailVerified,
                });
                showToast(T.register_success_google || 'Google ile kayıt başarılı. Dashboard&apos;a yönlendiriliyorsunuz.', 'success');
            } else {
                showToast(T.login_success || 'Giriş başarılı. Panele yönlendiriliyorsunuz...', 'success');
            }
            
            // Yönlendirme useEffect([user]) tarafından yönetiliyor.
            
        } catch (err) {
            const { message } = handleFirebaseError(err, T); 
            showToast(message, 'error');
        } finally {
            setGoogleLoading(false);
        }
    };
    
    const handlePasswordReset = async (e) => {
        e.preventDefault();
        if (!resetEmail) return;
        setLoading(true);
        try {
            await sendPasswordResetEmail(auth, resetEmail);
            showToast(T.reset_password_success || "Şifre sıfırlama e-postası gönderildi. Lütfen gelen kutunuzu kontrol edin.", 'success');
            setIsForgotPassword(false);
            setResetEmail('');
        } catch (err) {
            const { message } = handleFirebaseError(err, T); 
            showToast(message, 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!T || Object.keys(T).length === 0) return null;

    return (
        <div className="flex min-h-screen bg-[#0b1220] text-white">
            
            {/* SOL YARI: Form Alanı */}
            <div className="flex-grow w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative z-10">
                <div className="w-full max-w-md p-8 space-y-6 bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl shadow-indigo-900/50 border border-indigo-700/50 relative">
                    
                    {/* Şifre Sıfırlama Modalı (Gömülü Akış) */}
                    <AnimatePresence>
                        {isForgotPassword && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute inset-0 bg-gray-800/90 backdrop-blur-md rounded-2xl p-8 space-y-6 z-20 flex flex-col justify-center border-4 border-yellow-500/50"
                            >
                                <h2 className="text-xl font-bold text-center text-yellow-400">{T.reset_password_title || 'Şifre Sıfırlama'}</h2>
                                <p className="text-gray-400 text-center text-sm">{T.reset_password_subtitle || 'Hesabınıza bağlı e-posta adresini girin.'}</p>
                                <form onSubmit={handlePasswordReset} className="space-y-4">
                                    <label htmlFor="reset-email" className="text-sm font-bold text-gray-400 tracking-wide sr-only">Sıfırlama E-postas&apos;ı</label>
                                    <input 
                                        id="reset-email"
                                        type="email" 
                                        value={resetEmail} 
                                        onChange={(e) => setResetEmail(e.target.value)} 
                                        placeholder={T.email_placeholder} 
                                        className="w-full p-3 bg-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500" 
                                        required 
                                        aria-label="Şifre sıfırlama için e-posta adresi"
                                        autoComplete="email" 
                                        disabled={loading}
                                    />
                                    <button 
                                        type="submit" 
                                        disabled={loading || !resetEmail} 
                                        className="w-full bg-yellow-600 hover:bg-yellow-500 text-gray-900 font-bold py-3 rounded-lg disabled:opacity-50 transition-colors"
                                        aria-label={loading ? 'Sistem Sıfırlama Linki Gönderiliyor' : 'Şifre Sıfırlama Linki Gönder'}
                                    >
                                        {loading ? 'Sistem İşliyor...' : T.reset_password_button}
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => setIsForgotPassword(false)} 
                                        className="w-full text-center text-gray-400 hover:text-white transition-colors mt-2"
                                        aria-label="Şifre sıfırlama işlemini iptal et"
                                        disabled={loading}
                                    >
                                        {T.kasa_cancel_edit || "Girişe Geri Dön"}
                                    </button>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="text-center">
                        <Icon name="boxes" className="w-12 h-12 mx-auto text-indigo-400 mb-4 animate-pulse-slow" aria-hidden="true" />
                        <h1 className="text-3xl font-bold text-white tracking-wider">{T.login_title}</h1>
                        <p className="text-sm text-gray-500 mt-1">Synara System Mesteg Teknoloji Ltd. Şti. Ürünüdür.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="email-input" className="text-sm font-bold text-gray-400 tracking-wide">{T.email_label}</label>
                            <input 
                                id="email-input"
                                type="email" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                placeholder={T.email_placeholder} 
                                className="w-full p-3 mt-1 bg-gray-700 rounded-lg border border-transparent focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" 
                                required 
                                aria-required="true"
                                autoComplete="email"
                                disabled={isForgotPassword || loading}
                            />
                        </div>
                        <div>
                            <div className="flex justify-between items-center">
                                <label htmlFor="password-input" className="text-sm font-bold text-gray-400 tracking-wide">{T.password_label}</label>
                                <button 
                                    type="button" 
                                    onClick={() => { setIsForgotPassword(true); setResetEmail(email); }} 
                                    className="text-xs text-indigo-400 hover:underline"
                                    aria-label="Şifrenizi mi unuttunuz? Sıfırlama sayfasına git."
                                    disabled={loading}
                                >
                                    {T.login_forgot_password || 'Şifremi unuttum'}
                                </button>
                            </div>
                            <div className="relative">
                                <input 
                                    id="password-input"
                                    type={isPasswordVisible ? "text" : "password"} 
                                    value={password} 
                                    onChange={(e) => setPassword(e.target.value)} 
                                    placeholder={T.password_placeholder} 
                                    className="w-full p-3 mt-1 bg-gray-700 rounded-lg border border-transparent focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" 
                                    required 
                                    aria-required="true"
                                    autoComplete="current-password"
                                    disabled={isForgotPassword || loading}
                                />
                                <button 
                                    type="button" 
                                    onClick={() => setIsPasswordVisible(!isPasswordVisible)} 
                                    className="absolute inset-y-0 right-0 px-4 text-gray-400 hover:text-white"
                                    aria-label={isPasswordVisible ? "Şifreyi gizle" : "Şifreyi göster"}
                                    aria-controls="password-input"
                                    disabled={isForgotPassword || loading}
                                >
                                    <Icon name={isPasswordVisible ? "eye-off" : "eye"} className="w-5 h-5" aria-hidden="true" />
                                </button>
                            </div>
                        </div>
                        
                        {isLocked && (
                            <div role="alert" className="text-center text-sm text-red-400 bg-red-900/50 p-3 rounded-lg border border-red-500/50">
                                {T.login_attempts_exceeded || "Çok fazla hatalı deneme. Erişim 1 dakika süreyle kilitlendi."}
                            </div>
                        )}
                        {showForgotPasswordSuggestion && !isLocked && (
                            <div className="text-center text-sm text-amber-400 bg-amber-900/50 p-3 rounded-lg border border-amber-500/50">
                                Şifreniz veya e-postanız yanlış. <button type="button" onClick={() => { setIsForgotPassword(true); setResetEmail(email); }} className="font-bold underline hover:text-amber-300">Şifrenizi Sıfırlayın.</button>
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={loading || googleLoading || isLocked || !email || !password || isForgotPassword} 
                            className="w-full flex justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-500 font-bold py-3 rounded-lg disabled:opacity-50 transition-colors shadow-lg shadow-indigo-900/50"
                            aria-label={loading ? 'Sistem Yükleniyor' : 'Giriş Yap'}
                        >
                            {loading ? 'Sistem Yükleniyor...' : T.login_button}
                        </button>
                    </form>

                    <div className="flex items-center">
                        <hr className="flex-grow border-gray-600" />
                        <span className="px-4 text-gray-500 text-sm">{T.separator_text}</span>
                        <hr className="flex-grow border-gray-600" />
                    </div>

                    <button 
                        onClick={handleGoogleSignIn} 
                        disabled={loading || googleLoading || isLocked || isForgotPassword} 
                        className="w-full flex justify-center items-center gap-3 border border-gray-600 hover:bg-gray-700 font-bold py-3 rounded-lg disabled:opacity-50 transition-colors"
                        aria-label={googleLoading ? 'Google ile Giriş Yapılıyor' : 'Google ile Giriş Yap'}
                    >
                        <Icon name="google" className="w-5 h-5" aria-hidden="true" />
                        {T.login_google_button || 'Google ile Giriş Yap'}
                    </button>

                    <p className="text-center text-gray-400 text-sm">
                        {T.login_no_account_prompt || 'Hesabınız yok mu?'}
                        <button 
                            onClick={() => router.push('/register')} 
                            className="ml-2 font-semibold text-indigo-400 hover:underline"
                            aria-label="Hesap Oluşturma Sayfasına Git"
                        >
                            {T.login_register_link || 'Hemen Kayıt Olun'}
                        </button>
                    </p>
                    
                    <p className="text-center text-xs text-gray-500 pt-4 border-t border-gray-700/50">
                        {/* KRİTİK FİX 1: ' işaretleri &apos; ile değiştirildi */}
                        {"Synara System&apos;e giriş yaparak,"} <Link href="/terms-of-service" className="underline hover:text-sky-400">{"Kullanıcı Sözleşmesi&apos;ni"}</Link> {"ve"} <Link href="/privacy-policy" className="underline hover:text-sky-400">{"Gizlilik Politikası&apos;nı"}</Link> {"kabul etmiş olursunuz."}
                    </p>
                </div>
            </div>

            {/* SAĞ YARI: Görsel Protokol Alanı (Sadece Desktop/Tablet görünür) */}
            <div className="hidden lg:flex w-1/2 items-center justify-center relative overflow-hidden bg-gray-900 border-l-2 border-indigo-700/50">
                <div className="absolute inset-0 bg-grid-indigo-500/10 bg-[size:3rem_3rem] opacity-30"></div>
                <div className="absolute inset-0" style={{
                    background: 'radial-gradient(ellipse at center, rgba(79, 70, 229, 0.2) 0%, rgba(11, 18, 32, 0) 70%)'
                }}></div>
                
                <div className="text-center p-12 relative z-10 max-w-md">
                     <Icon name="boxes" className="w-20 h-20 mx-auto text-yellow-400 animate-spin-slow" />
                     <h2 className="text-4xl font-extrabold text-white mt-6 leading-tight">
                         Duygusal Kaosu <span className="gradient-text">Sisteme İndirge.</span>
                     </h2>
                     <p className="text-lg text-gray-300 mt-4">
                         Giriş yaparak, Synara&apos;nın **Anchor TF** teyitli, repaint yapmayan Holistik Zeka Matrisi&apos;ne (HIM) erişim sağla.
                     </p>
                     <p className="text-sm font-mono text-indigo-400 mt-6">
                         SYNARA PROTOKOLÜ: DİSİPLİN &gt; DUYGU
                     </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
