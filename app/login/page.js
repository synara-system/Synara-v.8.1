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

// **TAILWIND GLOBAL CSS'E EKLENECEK SINIFLAR İÇİN NOT:**
// Aşağıdaki bazı sınıflar (shadow-glow, bg-grid-*, animate-pulse-slow, gradient-text)
// muhtemelen tailwind.config.js dosyanızda özel olarak tanımlanmıştır. 
// Çalışmama durumunda lütfen bu sınıfların config dosyasında olduğundan emin olun.

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

    // T objesi yüklenene kadar bekler.
    if (!T || Object.keys(T).length === 0) return null;

    return (
        // Ana kapsayıcı ve arka plan iyileştirmesi
        <div className="flex min-h-screen bg-[#060914] text-white overflow-hidden relative">
            
            {/* SOL YARI: Form Alanı */}
            <div className="flex-grow w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative z-10">
                <div className="w-full max-w-md p-8 space-y-6 bg-gray-900/90 backdrop-blur-lg rounded-2xl shadow-glow-indigo border border-indigo-700/50 relative">
                    
                    {/* Şifre Sıfırlama Modalı (Gömülü Akış) - Neon Sarı Vurgu */}
                    <AnimatePresence>
                        {isForgotPassword && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute inset-0 bg-gray-900/95 backdrop-blur-md rounded-2xl p-8 space-y-6 z-20 flex flex-col justify-center border-4 border-yellow-500/50 shadow-2xl shadow-yellow-900/50"
                            >
                                <h2 className="text-2xl font-extrabold text-center text-yellow-400 tracking-wide">{T.reset_password_title || 'Sistem Sıfırlama Protokolü'}</h2>
                                <p className="text-gray-400 text-center text-sm">{T.reset_password_subtitle || 'Hesabınıza bağlı e-posta adresini girin.'}</p>
                                <form onSubmit={handlePasswordReset} className="space-y-4">
                                    <label htmlFor="reset-email" className="text-sm font-bold text-gray-400 tracking-wide sr-only">Sıfırlama E-postas&apos;ı</label>
                                    <input 
                                        id="reset-email"
                                        type="email" 
                                        value={resetEmail} 
                                        onChange={(e) => setResetEmail(e.target.value)} 
                                        placeholder={T.email_placeholder} 
                                        // Giriş input stilini sıfırlama modalında da kullanıyoruz
                                        className="w-full p-3 bg-gray-700/70 rounded-lg border border-transparent focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors shadow-inner shadow-gray-950/50" 
                                        required 
                                        aria-label="Şifre sıfırlama için e-posta adresi"
                                        autoComplete="email" 
                                        disabled={loading}
                                    />
                                    <button 
                                        type="submit" 
                                        disabled={loading || !resetEmail} 
                                        // Sıfırlama butonu gradienti
                                        className="w-full bg-gradient-to-r from-yellow-600 to-orange-500 hover:from-yellow-500 hover:to-orange-400 text-gray-900 font-bold py-3 rounded-lg disabled:opacity-50 transition-all shadow-md shadow-yellow-700/50"
                                        aria-label={loading ? 'Sistem Sıfırlama Linki Gönderiliyor' : 'Şifre Sıfırlama Linki Gönder'}
                                    >
                                        {loading ? <Icon name="Loader2" className="w-5 h-5 mx-auto animate-spin" /> : T.reset_password_button}
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => setIsForgotPassword(false)} 
                                        className="w-full text-center text-gray-400 hover:text-indigo-400 transition-colors mt-2 text-sm"
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
                        <h1 className="text-3xl font-extrabold text-white tracking-wider">{T.login_title}</h1>
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
                                // Geliştirilmiş Input Stili: Focus'ta Neon Border
                                className="w-full p-3 mt-1 bg-gray-800 rounded-lg border border-gray-700/50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 shadow-inner shadow-gray-950/50" 
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
                                    className="text-xs font-medium text-indigo-400 hover:text-cyan-400 transition-colors"
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
                                    // Geliştirilmiş Input Stili: Focus'ta Neon Border
                                    className="w-full p-3 mt-1 bg-gray-800 rounded-lg border border-gray-700/50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 shadow-inner shadow-gray-950/50" 
                                    required 
                                    aria-required="true"
                                    autoComplete="current-password"
                                    disabled={isForgotPassword || loading}
                                />
                                <button 
                                    type="button" 
                                    onClick={() => setIsPasswordVisible(!isPasswordVisible)} 
                                    className="absolute inset-y-0 right-0 px-4 flex items-center text-gray-400 hover:text-white transition-colors"
                                    aria-label={isPasswordVisible ? "Şifreyi gizle" : "Şifreyi göster"}
                                    aria-controls="password-input"
                                    disabled={isForgotPassword || loading}
                                >
                                    <Icon name={isPasswordVisible ? "eye-off" : "eye"} className="w-5 h-5" aria-hidden="true" />
                                </button>
                            </div>
                        </div>
                        
                        {/* Hata ve Kilitlenme Mesajları */}
                        {isLocked && (
                            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} role="alert" className="text-center text-sm text-red-400 bg-red-900/50 p-3 rounded-lg border border-red-500/50 font-medium">
                                {T.login_attempts_exceeded || "Çok fazla hatalı deneme. Erişim 1 dakika süreyle kilitlendi."}
                            </motion.div>
                        )}
                        {showForgotPasswordSuggestion && !isLocked && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-sm text-amber-400 bg-amber-900/50 p-3 rounded-lg border border-amber-500/50">
                                Şifreniz veya e-postanız yanlış. <button type="button" onClick={() => { setIsForgotPassword(true); setResetEmail(email); }} className="font-bold underline hover:text-amber-300">Şifrenizi Sıfırlayın.</button>
                            </motion.div>
                        )}

                        {/* Giriş Butonu Dinamizmi: Indigo/Cyan Gradient */}
                        <button 
                            type="submit" 
                            disabled={loading || googleLoading || isLocked || !email || !password || isForgotPassword} 
                            className={`w-full flex justify-center items-center gap-2 font-bold py-3 rounded-lg disabled:opacity-50 transition-all duration-300 ${
                                loading || isLocked
                                    ? 'bg-gray-600 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white shadow-lg shadow-indigo-900/50 hover:shadow-cyan-500/50 transform hover:-translate-y-0.5'
                            }`}
                            aria-label={loading ? 'Sistem Yükleniyor' : 'Giriş Yap'}
                        >
                            {loading ? <Icon name="Loader2" className="w-5 h-5 mr-2 animate-spin" /> : T.login_button}
                        </button>
                    </form>

                    <div className="flex items-center">
                        <hr className="flex-grow border-gray-700/50" />
                        <span className="px-4 text-gray-500 text-xs font-mono">{T.separator_text || 'VEYA'}</span>
                        <hr className="flex-grow border-gray-700/50" />
                    </div>

                    <button 
                        onClick={handleGoogleSignIn} 
                        disabled={loading || googleLoading || isLocked || isForgotPassword} 
                        className="w-full flex justify-center items-center gap-3 border border-gray-700 hover:bg-gray-700/50 text-white font-bold py-3 rounded-lg disabled:opacity-50 transition-colors shadow-md shadow-gray-900/50 hover:border-indigo-500"
                        aria-label={googleLoading ? 'Google ile Giriş Yapılıyor' : 'Google ile Giriş Yap'}
                    >
                        <Icon name="google" className={`w-5 h-5 ${googleLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
                        {googleLoading ? 'Google Bağlanıyor...' : T.login_google_button || 'Google ile Giriş Yap'}
                    </button>

                    <p className="text-center text-gray-400 text-sm">
                        {T.login_no_account_prompt || 'Hesabınız yok mu?'}
                        <button 
                            onClick={() => router.push('/register')} 
                            className="ml-2 font-semibold text-cyan-400 hover:underline hover:text-indigo-400 transition-colors"
                            aria-label="Hesap Oluşturma Sayfasına Git"
                        >
                            {T.login_register_link || 'Hemen Kayıt Olun'}
                        </button>
                    </p>
                    
                    <p className="text-center text-xs text-gray-500 pt-4 border-t border-gray-700/50">
                        {"Synara System&apos;e giriş yaparak,"} <Link href="/terms-of-service" className="underline hover:text-cyan-400 transition-colors">{"Kullanıcı Sözleşmesi&apos;ni"}</Link> {"ve"} <Link href="/privacy-policy" className="underline hover:text-cyan-400 transition-colors">{"Gizlilik Politikası&apos;nı"}</Link> {"kabul etmiş olursunuz."}
                    </p>
                </div>
            </div>

            {/* SAĞ YARI: Görsel Protokol Alanı (Sadece Desktop/Tablet görünür) - Neon Mavi Grid Vurgu */}
            <div className="hidden lg:flex w-1/2 items-center justify-center relative overflow-hidden bg-[#0a142e] border-l-4 border-indigo-500/50">
                {/* Neon Grid ve Blur Efekti */}
                <div className="absolute inset-0 bg-grid-indigo-500/10 bg-[size:3rem_3rem] opacity-30 animate-pulse-slow"></div>
                <div className="absolute inset-0" style={{
                    background: 'radial-gradient(ellipse at center, rgba(30, 64, 175, 0.4) 0%, rgba(10, 20, 46, 0) 70%)' // Daha belirgin Mavi Blur
                }}></div>
                
                <div className="text-center p-12 relative z-10 max-w-md">
                     <Icon name="boxes" className="w-20 h-20 mx-auto text-yellow-400 animate-spin-slow" />
                     <h2 className="text-5xl font-extrabold text-white mt-6 leading-tight">
                         Duygusal Kaosu <span className="gradient-text-v2">Sisteme İndirge.</span>
                     </h2>
                     <p className="text-xl text-gray-300 mt-4 font-light">
                         Giriş yaparak, Synara&apos;nın **Anchor TF** teyitli, repaint yapmayan Holistik Zeka Matrisi&apos;ne (HIM) erişim sağla.
                     </p>
                     <p className="text-sm font-mono text-indigo-400 mt-6 tracking-widest border-t border-indigo-700 pt-3">
                         SYNARA PROTOKOLÜ: DİSİPLİN &gt; DUYGU
                     </p>
                </div>
            </div>
            {/* Gereken Global Stiller (tailwind.config'de tanımlı değilse) */}
            <style jsx global>{`
                .shadow-glow-indigo {
                    box-shadow: 0 0 15px rgba(99, 102, 241, 0.7), 0 0 30px rgba(99, 102, 241, 0.4);
                }
                .gradient-text {
                    background-image: linear-gradient(to right, #4F46E5, #06B6D4);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    color: transparent;
                }
                .gradient-text-v2 {
                    background-image: linear-gradient(to right, #6366F1, #22D3EE);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    color: transparent;
                }
                /* Eğer tailwind.config'de yoksa, buraya eklenmeli */
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(-5%); animation-timing-function: cubic-bezier(0.8, 0, 1, 1); }
                    50% { transform: translateY(0); animation-timing-function: cubic-bezier(0, 0, 0.2, 1); }
                }
                .animate-bounce-slow {
                    animation: bounce-slow 4s infinite;
                }
            `}</style>
        </div>
    );
};

export default LoginPage;
