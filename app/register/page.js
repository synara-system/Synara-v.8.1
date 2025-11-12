// path: app/register/page.js
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
// KRİTİK FİX: Firebase fonksiyonları doğrudan import edildi.
import { GoogleAuthProvider, signInWithPopup, getAdditionalUserInfo, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore'; 
import { auth, db } from '@/firebase';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import Icon from '@/components/Icon';
import { motion, AnimatePresence } from 'framer-motion';

// KRİTİK FİX: handleFirebaseError'ı simüle etmek için dummy fonksiyonu eklendi.
const handleFirebaseError = (err, T) => {
    let message = T?.error_auth_generic || 'Kayıt işlemi başarısız oldu. Lütfen bilgilerinizi kontrol edin.';
    // Firebase kodlarına göre özel mesajlar
    if (err.code === 'auth/email-already-in-use') message = T?.error_auth_email_in_use || 'Bu e-posta adresi zaten kayıtlı.';
    if (err.code === 'auth/weak-password') message = T?.error_auth_weak_password || 'Şifre en az 6 karakter olmalıdır.';
    return { message };
};

// **TAILWIND GLOBAL CSS'E EKLENECEK SINIFLAR İÇİN NOT:**
// Aşağıdaki bazı sınıflar (shadow-glow, bg-grid-*, animate-pulse-slow, gradient-text-v2, animate-bounce-slow)
// Login sayfasında tanımlananlar ile aynıdır ve global stil dosyanızda olması beklenir.

const RegisterPage = () => {
    const { T, user } = useAuth(); 
    const { showToast } = useNotification();
    const router = useRouter();
    const searchParams = useSearchParams();
    
    // Yönlendirme URL'sini al
    const redirectUrl = searchParams.get('redirect') || '/dashboard';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [displayName, setDisplayName] = useState(''); // Ek Alan
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    
    // Oturum Açılışını Kontrol Et ve Yönlendir
    useEffect(() => {
        if (user) {
             router.replace(redirectUrl);
        }
    }, [user, router, redirectUrl]);
    
    // Kayıt Formunu Gönderme
    const handleRegister = async (e) => {
        e.preventDefault();

        if (password !== passwordConfirm) {
            showToast(T.register_password_mismatch || 'Şifreler eşleşmiyor.', 'error');
            return;
        }

        if (!displayName.trim()) {
            showToast(T.register_name_required || 'Kullanıcı adı gereklidir.', 'error');
            return;
        }
        
        setLoading(true);

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Display Name Güncelleme
            await updateProfile(user, { displayName: displayName.trim() });
            
            const userDocRef = doc(db, "users", user.uid);
            
            // KRİTİK: Yeni kullanıcıya 30 günlük deneme aboneliği tanımlanıyor.
            const trialEndDate = new Date();
            trialEndDate.setDate(trialEndDate.getDate() + 30);
            
            await setDoc(userDocRef, {
                email: user.email,
                displayName: displayName.trim(),
                createdAt: serverTimestamp(),
                tradingViewUsername: "",
                subscriptionStatus: "active",
                subscriptionEndDate: Timestamp.fromDate(trialEndDate),
                isAdmin: false,
                emailVerified: user.emailVerified,
            });

            showToast(T.register_success || 'Kayıt başarılı. Hesap oluşturuldu.', 'success');
            // Yönlendirme useEffect([user]) tarafından yönetiliyor.

        } catch (err) {
            const { message } = handleFirebaseError(err, T); 
            showToast(message, 'error');
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
                    displayName: user.displayName || user.email.split('@')[0], // Google adı veya e-posta başı
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
    

    // T objesi yüklenene kadar bekler.
    if (!T || Object.keys(T).length === 0) return null;

    return (
        // Ana kapsayıcı ve arka plan iyileştirmesi (Login ile aynı)
        <div className="flex min-h-screen bg-[#060914] text-white overflow-hidden relative">
            
            {/* SOL YARI: Form Alanı */}
            <div className="flex-grow w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative z-10">
                <div className="w-full max-w-md p-8 space-y-6 bg-gray-900/90 backdrop-blur-lg rounded-2xl shadow-glow-indigo border border-indigo-700/50 relative">
                    
                    <div className="text-center">
                        {/* FORM BAŞLIK İKONU: cpu */}
                        <Icon name="cpu" className="w-12 h-12 mx-auto text-cyan-400 mb-4 animate-pulse-slow" aria-hidden="true" />
                        <h1 className="text-3xl font-extrabold text-white tracking-wider">{T.register_title || 'Yeni Hesap Oluştur'}</h1>
                        <p className="text-sm text-gray-500 mt-1">{T.register_subtitle || '30 günlük deneme sürecini hemen başlatın.'}</p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-4">
                        {/* KULLANICI ADI */}
                         <div>
                            <label htmlFor="display-name-input" className="text-sm font-bold text-gray-400 tracking-wide">{T.register_display_name_label || 'Kullanıcı Adı'}</label>
                            <input 
                                id="display-name-input"
                                type="text" 
                                value={displayName} 
                                onChange={(e) => setDisplayName(e.target.value)} 
                                placeholder={T.register_display_name_placeholder || 'Sistemdeki Adınız'} 
                                // Login ile aynı input stili
                                className="w-full p-3 mt-1 bg-gray-800 rounded-lg border border-gray-700/50 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 shadow-inner shadow-gray-950/50" 
                                required 
                                aria-required="true"
                                autoComplete="username"
                                disabled={loading}
                                minLength={3}
                            />
                        </div>
                        {/* E-POSTA */}
                        <div>
                            <label htmlFor="email-input" className="text-sm font-bold text-gray-400 tracking-wide">{T.email_label}</label>
                            <input 
                                id="email-input"
                                type="email" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                placeholder={T.email_placeholder} 
                                // Login ile aynı input stili
                                className="w-full p-3 mt-1 bg-gray-800 rounded-lg border border-gray-700/50 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 shadow-inner shadow-gray-950/50" 
                                required 
                                aria-required="true"
                                autoComplete="email"
                                disabled={loading}
                            />
                        </div>
                        {/* ŞİFRE */}
                        <div>
                            <label htmlFor="password-input" className="text-sm font-bold text-gray-400 tracking-wide">{T.password_label}</label>
                            <div className="relative">
                                <input 
                                    id="password-input"
                                    type={isPasswordVisible ? "text" : "password"} 
                                    value={password} 
                                    onChange={(e) => setPassword(e.target.value)} 
                                    placeholder={T.password_placeholder} 
                                    // Login ile aynı input stili
                                    className="w-full p-3 mt-1 bg-gray-800 rounded-lg border border-gray-700/50 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 shadow-inner shadow-gray-950/50" 
                                    required 
                                    aria-required="true"
                                    autoComplete="new-password"
                                    disabled={loading}
                                    minLength={6}
                                />
                                <button 
                                    type="button" 
                                    onClick={() => setIsPasswordVisible(!isPasswordVisible)} 
                                    className="absolute inset-y-0 right-0 px-4 flex items-center text-gray-400 hover:text-white transition-colors"
                                    aria-label={isPasswordVisible ? "Şifreyi gizle" : "Şifreyi göster"}
                                    disabled={loading}
                                >
                                    <Icon name={isPasswordVisible ? "eye-off" : "eye"} className="w-5 h-5" aria-hidden="true" />
                                </button>
                            </div>
                        </div>
                        {/* ŞİFRE DOĞRULAMA */}
                        <div>
                            <label htmlFor="password-confirm-input" className="text-sm font-bold text-gray-400 tracking-wide">{T.register_password_confirm_label || 'Şifre Tekrarı'}</label>
                            <div className="relative">
                                <input 
                                    id="password-confirm-input"
                                    type={isConfirmPasswordVisible ? "text" : "password"} 
                                    value={passwordConfirm} 
                                    onChange={(e) => setPasswordConfirm(e.target.value)} 
                                    placeholder={T.register_password_confirm_placeholder || 'Şifrenizi Tekrar Girin'} 
                                    // Login ile aynı input stili
                                    className={`w-full p-3 mt-1 bg-gray-800 rounded-lg border border-gray-700/50 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 shadow-inner shadow-gray-950/50 ${
                                        passwordConfirm && password !== passwordConfirm ? 'border-red-500 ring-red-500' : ''
                                    }`} 
                                    required 
                                    aria-required="true"
                                    autoComplete="new-password"
                                    disabled={loading}
                                    minLength={6}
                                />
                                <button 
                                    type="button" 
                                    onClick={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)} 
                                    className="absolute inset-y-0 right-0 px-4 flex items-center text-gray-400 hover:text-white transition-colors"
                                    aria-label={isConfirmPasswordVisible ? "Şifreyi gizle" : "Şifreyi göster"}
                                    disabled={loading}
                                >
                                    <Icon name={isConfirmPasswordVisible ? "eye-off" : "eye"} className="w-5 h-5" aria-hidden="true" />
                                </button>
                            </div>
                             {passwordConfirm && password !== passwordConfirm && (
                                <p className="text-xs text-red-400 mt-1">{T.register_password_mismatch || 'Şifreler eşleşmiyor!'}</p>
                            )}
                        </div>

                        {/* KAYIT OL Butonu Dinamizmi: Login ile aynı gradient */}
                        <button 
                            type="submit" 
                            disabled={loading || googleLoading || !email || !password || !passwordConfirm || !displayName.trim() || password !== passwordConfirm} 
                            className={`w-full flex justify-center items-center gap-2 font-bold py-3 rounded-lg disabled:opacity-50 transition-all duration-300 ${
                                loading
                                    ? 'bg-gray-600 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-cyan-600 to-indigo-500 hover:from-cyan-500 hover:to-indigo-400 text-white shadow-lg shadow-cyan-900/50 hover:shadow-indigo-500/50 transform hover:-translate-y-0.5'
                            }`}
                            aria-label={loading ? 'Hesap Oluşturuluyor' : 'Kayıt Ol'}
                        >
                            {loading ? <Icon name="Loader2" className="w-5 h-5 mr-2 animate-spin" /> : T.register_button || 'Hesap Oluştur'}
                        </button>
                    </form>

                    <div className="flex items-center">
                        <hr className="flex-grow border-gray-700/50" />
                        <span className="px-4 text-gray-500 text-xs font-mono">{T.separator_text || 'VEYA'}</span>
                        <hr className="flex-grow border-gray-700/50" />
                    </div>

                    <button 
                        onClick={handleGoogleSignIn} 
                        disabled={loading || googleLoading} 
                        className="w-full flex justify-center items-center gap-3 border border-gray-700 hover:bg-gray-700/50 text-white font-bold py-3 rounded-lg disabled:opacity-50 transition-colors shadow-md shadow-gray-900/50 hover:border-cyan-500"
                        aria-label={googleLoading ? 'Google ile Kayıt Olunuyor' : 'Google ile Kayıt Ol'}
                    >
                        <Icon name="google" className={`w-5 h-5 ${googleLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
                        {googleLoading ? 'Google Bağlanıyor...' : T.register_google_button || 'Google ile Kayıt Ol'}
                    </button>

                    <p className="text-center text-gray-400 text-sm">
                        {T.register_has_account_prompt || 'Zaten hesabınız var mı?'}
                        <button 
                            onClick={() => router.push('/login')} 
                            className="ml-2 font-semibold text-indigo-400 hover:underline hover:text-cyan-400 transition-colors"
                            aria-label="Giriş Sayfasına Git"
                        >
                            {T.register_login_link || 'Giriş Yapın'}
                        </button>
                    </p>
                    
                    <p className="text-center text-xs text-gray-500 pt-4 border-t border-gray-700/50">
                        {"Synara System&apos;e kayıt olarak,"} <Link href="/terms-of-service" className="underline hover:text-cyan-400 transition-colors">{"Kullanıcı Sözleşmesi&apos;ni"}</Link> {"ve"} <Link href="/privacy-policy" className="underline hover:text-cyan-400 transition-colors">{"Gizlilik Politikası&apos;nı"}</Link> {"kabul etmiş olursunuz."}
                    </p>
                </div>
            </div>

            {/* SAĞ YARI: Görsel Protokol Alanı (Login ile aynı) */}
            <div className="hidden lg:flex w-1/2 items-center justify-center relative overflow-hidden bg-[#0a142e] border-l-4 border-cyan-500/50">
                {/* Neon Grid ve Blur Efekti */}
                <div className="absolute inset-0 bg-grid-indigo-500/10 bg-[size:3rem_3rem] opacity-30 animate-pulse-slow"></div>
                <div className="absolute inset-0" style={{
                    background: 'radial-gradient(ellipse at center, rgba(30, 64, 175, 0.4) 0%, rgba(10, 20, 46, 0) 70%)' 
                }}></div>
                
                <div className="text-center p-12 relative z-10 max-w-md">
                     {/* SAĞ PANEL İKONU: help-circle -> target */}
                     <Icon name="boxes" className="w-20 h-20 mx-auto text-yellow-400 animate-spin-slow" />
                     <h2 className="text-5xl font-extrabold text-white mt-6 leading-tight">
                         Karmaşık Piyasaları <span className="gradient-text-v2-register">Tek Bir Karara İndirgeyin.</span>
                     </h2>
                     <p className="text-xl text-gray-300 mt-4 font-light">
                         Synara&apos;ya kayıt olarak **Disiplin &gt; Duygu** felsefesiyle güçlendirilmiş bütünsel zeka matrisine erişim kazanın.
                     </p>
                     <p className="text-sm font-mono text-cyan-400 mt-6 tracking-widest border-t border-cyan-700 pt-3">
                         SYNARA PROTOKOLÜ: İLK ADIM
                     </p>
                </div>
            </div>
            {/* Login sayfasında tanımlı global stiller (Çalışması için gereklidir) */}
            <style jsx global>{`
                .shadow-glow-indigo {
                    box-shadow: 0 0 15px rgba(99, 102, 241, 0.7), 0 0 30px rgba(99, 102, 241, 0.4);
                }
                .gradient-text-v2-register {
                    /* Register için Cyan-Indigo tonlarını kullanıyoruz */
                    background-image: linear-gradient(to right, #22D3EE, #6366F1); 
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    color: transparent;
                }
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

export default RegisterPage;
