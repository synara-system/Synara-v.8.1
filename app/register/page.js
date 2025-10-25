// path: app/register/page.js
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, getAdditionalUserInfo, updateProfile, sendEmailVerification } from 'firebase/auth';
import { auth, db } from '@/firebase';
import { doc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore'; // KRİTİK EKLENTİ: Timestamp import edildi
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import Icon from '@/components/Icon';
import { handleFirebaseError } from '@/data/translations'; // KRİTİK FİX: handleFirebaseError doğru import edildi.
import Link from 'next/link';
import { motion } from 'framer-motion';

const RegisterPage = () => {
    const { T } = useAuth();
    const { showToast } = useNotification();
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [tradingViewUsername, setTradingViewUsername] = useState('');
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [privacyAccepted, setPrivacyAccepted] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    
    const isFormValid = displayName.trim() && tradingViewUsername.trim() && email.trim() && password && termsAccepted && privacyAccepted;

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!isFormValid) {
            if (!termsAccepted || !privacyAccepted) {
                 showToast(T.register_terms_required, 'error');
            } else {
                 showToast(T.register_fields_required, 'error');
            }
            return;
        }

        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            await updateProfile(user, { displayName: displayName.trim() });
            await sendEmailVerification(user);

            const userDocRef = doc(db, "users", user.uid);
            
            const trialEndDate = new Date();
            trialEndDate.setDate(trialEndDate.getDate() + 30);

            await setDoc(userDocRef, {
                email: user.email,
                displayName: displayName.trim(),
                tradingViewUsername: tradingViewUsername.trim(),
                createdAt: serverTimestamp(),
                subscriptionStatus: "active",
                subscriptionEndDate: Timestamp.fromDate(trialEndDate),
                isAdmin: false,
                emailVerified: false,
            });
            
            showToast(T.register_success_email, 'success', 8000);
            
            router.replace('/dashboard'); 
        } catch (err) {
            const { message } = handleFirebaseError(err, T);
            showToast(message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setGoogleLoading(true);
        if (!termsAccepted || !privacyAccepted) {
             showToast(T.register_google_terms_required, 'error');
             setGoogleLoading(false);
             return;
        }
        
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            const additionalUserInfo = getAdditionalUserInfo(result);

            if (additionalUserInfo?.isNewUser) {
                const userDocRef = doc(db, "users", user.uid);
                
                const trialEndDate = new Date();
                trialEndDate.setDate(trialEndDate.getDate() + 30);
                
                await setDoc(userDocRef, {
                    email: user.email,
                    displayName: user.displayName || user.email.split('@')[0], 
                    tradingViewUsername: "", 
                    createdAt: serverTimestamp(),
                    subscriptionStatus: "active",
                    subscriptionEndDate: Timestamp.fromDate(trialEndDate),
                    isAdmin: false,
                    emailVerified: user.emailVerified,
                });
                showToast(T.register_success_google, 'success', 5000);
            } else {
                showToast(T.register_google_existing_user, 'info');
            }
            router.replace('/dashboard');
        } catch (err) {
            const { message } = handleFirebaseError(err, T);
            showToast(message, 'error');
        } finally {
            setGoogleLoading(false);
        }
    };

    if (!T || Object.keys(T).length === 0) return null;

    return (
        <div className="flex min-h-screen bg-[#0b1220] text-white">
            
            <div className="flex-grow w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative z-10">
                <div className="w-full max-w-sm p-8 space-y-6 bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl shadow-indigo-900/50 border border-indigo-700/50 relative">
                    
                    <div className="text-center">
                        <Icon name="boxes" className="w-12 h-12 mx-auto text-indigo-400 mb-4 animate-pulse-slow"/>
                        <h1 className="text-3xl font-bold text-white tracking-wider">{T.register_title}</h1>
                        <p className="text-sm text-gray-500 mt-1">Disiplinli traderlar arasına katılın.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-sm font-bold text-gray-400 tracking-wide">Görünen Adınız (Yorumlar için)</label>
                            <input 
                                type="text" 
                                value={displayName} 
                                onChange={(e) => setDisplayName(e.target.value)} 
                                placeholder="Adınız veya Takma Adınız" 
                                className="w-full p-3 mt-1 bg-gray-700 rounded-lg border border-transparent focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors" 
                                required 
                            />
                        </div>
                        
                        <div>
                            <label className="text-sm font-bold text-gray-400 tracking-wide">TradingView Kullanıcı Adı (Kritik)</label>
                            <input 
                                type="text" 
                                value={tradingViewUsername} 
                                onChange={(e) => setTradingViewUsername(e.target.value)} 
                                placeholder="TradingView kullanıcı adınızı girin" 
                                className="w-full p-3 mt-1 bg-gray-700 rounded-lg border border-transparent focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors" 
                                required 
                            />
                            <p className="text-xs text-gray-500 mt-1">Bu alan, sinyal entegrasyonu için zorunludur.</p>
                        </div>

                        <div>
                            <label className="text-sm font-bold text-gray-400 tracking-wide">{T.email_label}</label>
                            <input 
                                type="email" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                placeholder={T.email_placeholder} 
                                className="w-full p-3 mt-1 bg-gray-700 rounded-lg border border-transparent focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" 
                                required 
                            />
                        </div>
                        
                        <div>
                            <label className="text-sm font-bold text-gray-400 tracking-wide">{T.password_label}</label>
                            <div className="relative">
                                <input 
                                    type={isPasswordVisible ? "text" : "password"} 
                                    value={password} 
                                    onChange={(e) => setPassword(e.target.value)} 
                                    placeholder={T.password_placeholder} 
                                    className="w-full p-3 mt-1 bg-gray-700 rounded-lg border border-transparent focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" 
                                    required 
                                />
                                <button 
                                    type="button" 
                                    onClick={() => setIsPasswordVisible(!isPasswordVisible)} 
                                    className="absolute inset-y-0 right-0 px-4 text-gray-400 hover:text-white"
                                >
                                    <Icon name={isPasswordVisible ? "eye-off" : "eye"} className="w-5 h-5"/>
                                </button>
                            </div>
                        </div>
                        
                        <div className="space-y-3 pt-2">
                            <label className="flex items-start text-sm cursor-pointer text-gray-400 hover:text-white transition-colors">
                                <input 
                                    type="checkbox" 
                                    checked={termsAccepted}
                                    onChange={() => setTermsAccepted(!termsAccepted)}
                                    className="mt-1 mr-3 w-4 h-4 text-indigo-600 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500"
                                />
                                <span>
                                    <Link href="/terms-of-service" target="_blank" className="font-semibold text-yellow-400 hover:underline">{"Kullanım Şartları'nı"}</Link> okudum ve kabul ediyorum. (Zorunlu)
                                </span>
                            </label>
                            <label className="flex items-start text-sm cursor-pointer text-gray-400 hover:text-white transition-colors">
                                <input 
                                    type="checkbox" 
                                    checked={privacyAccepted}
                                    onChange={() => setPrivacyAccepted(!privacyAccepted)}
                                    className="mt-1 mr-3 w-4 h-4 text-indigo-600 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500"
                                />
                                <span>
                                    <Link href="/privacy-policy" target="_blank" className="font-semibold text-yellow-400 hover:underline">{"Gizlilik Politikası'nı"}</Link> okudum ve onaylıyorum. (Zorunlu)
                                </span>
                            </label>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading || googleLoading || !isFormValid} 
                            className="w-full bg-indigo-600 hover:bg-indigo-500 font-bold py-3 rounded-lg disabled:opacity-50 transition-colors shadow-lg shadow-indigo-900/50"
                        >
                            {loading ? 'Sistem Protokolü İşleniyor...' : T.register_button}
                        </button>
                    </form>

                    <div className="flex items-center">
                        <hr className="flex-grow border-gray-600" />
                        <span className="px-4 text-gray-500 text-sm">{T.separator_text}</span>
                        <hr className="flex-grow border-gray-600" />
                    </div>

                    <button onClick={handleGoogleSignIn} disabled={loading || googleLoading || !termsAccepted || !privacyAccepted} className="w-full flex justify-center items-center gap-3 border border-gray-600 hover:bg-gray-700 font-bold py-3 rounded-lg disabled:opacity-50 transition-colors">
                        <Icon name="google" className="w-5 h-5"/>
                        {T.register_with_google}
                    </button>

                    <p className="text-center text-gray-400 text-sm">
                        {T.have_account}
                        <button onClick={() => router.push('/login')} className="ml-2 font-semibold text-indigo-400 hover:underline">
                            {T.nav_login}
                        </button>
                    </p>
                </div>
            </div>

            <div className="hidden lg:flex w-1/2 items-center justify-center relative overflow-hidden bg-gray-900 border-l-2 border-indigo-700/50">
                 <div className="absolute inset-0 bg-grid-indigo-500/10 bg-[size:3rem_3rem] opacity-30"></div>
                <div className="absolute inset-0" style={{
                    background: 'radial-gradient(ellipse at center, rgba(79, 70, 229, 0.2) 0%, rgba(11, 18, 32, 0) 70%)'
                }}></div>
                
                <div className="text-center p-12 relative z-10 max-w-md">
                     <Icon name="boxes" className="w-20 h-20 mx-auto text-yellow-400 animate-spin-slow" />
                     <h2 className="text-4xl font-extrabold text-white mt-6 leading-tight">
                         Karmaşadan <span className="gradient-text">Disipline Geçiş.</span>
                     </h2>
                     <p className="text-lg text-gray-300 mt-4">
                         Hemen kayıt ol ve finansal piyasalardaki duygusal hatalara son veren sisteme erişim sağla.
                     </p>
                     <p className="text-sm font-mono text-indigo-400 mt-6">
                         BAŞLANGIÇ PROTOKOLÜ: KAYIT
                     </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
