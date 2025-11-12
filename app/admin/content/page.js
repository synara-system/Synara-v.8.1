// path: app/admin/content/page.js
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { doc, setDoc } from 'firebase/firestore'; 
import { db } from '@/firebase';
import Link from 'next/link';
import Icon from '@/components/Icon';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { useRequiredAuth } from '@/hooks/useRequiredAuth';

// Modüllerin ve genel içeriğin metin anahtarlarını tanımla
const CONTENT_MAP = {
    general: {
        title: 'Genel Metinler (Hero, Fiyatlandırma, İletişim)',
        keys: ['hero_title_part1', 'hero_title_part2', 'hero_subtitle_new', 'pricing_section_title', 'pricing_section_subtitle', 'contact_section_title', 'contact_section_subtitle'],
    },
    blog_news: { // YENİ SEÇENEK
        title: 'Blog & Haberler Sayfa Başlıkları (SEO Odaklı)',
        keys: ['content_blog_title', 'content_blog_subtitle', 'content_news_title', 'content_news_subtitle', 'content_seo_title', 'content_seo_description'],
    },
    engine: {
        title: 'Engine (Karar Merkezi)',
        keys: ['engine_tab_title', 'engine_page_title', 'engine_tab_desc', 'engine_feat1_title', 'engine_feat1_desc', 'engine_feat2_title', 'engine_feat2_desc', 'engine_feat3_title', 'engine_feat3_desc'],
    },
    nexus: {
        title: 'Nexus (Piyasa Yapısı/OB)',
        keys: ['nexus_tab_title', 'nexus_page_title', 'nexus_tab_desc', 'nexus_feat1_title', 'nexus_feat1_desc', 'nexus_feat2_title', 'nexus_feat2_desc', 'nexus_feat3_title', 'nexus_feat3_desc'],
    },
    metis: {
        title: 'Metis (Makro/Likidite)',
        keys: ['metis_tab_title', 'metis_page_title', 'metis_tab_desc', 'metis_feat1_title', 'metis_feat1_desc', 'metis_feat2_title', 'metis_feat2_desc', 'metis_feat3_title', 'metis_feat3_desc'],
    },
    rsi: {
        title: 'RSI-HAN (Momentum)',
        keys: ['rsi_tab_title', 'rsi_page_title', 'rsi_tab_desc', 'rsi_feat1_title', 'rsi_feat1_desc', 'rsi_feat2_title', 'rsi_feat2_desc', 'rsi_feat3_title', 'rsi_feat3_desc'],
    },
    visuals: {
        title: 'Visuals (Konsensüs)',
        keys: ['visuals_tab_title', 'visuals_page_title', 'visuals_tab_desc', 'visuals_feat1_title', 'visuals_feat1_desc', 'visuals_feat2_title', 'visuals_feat2_desc', 'visuals_feat3_title', 'visuals_feat3_desc'],
    },
};

const ContentAdminPage = () => {
    const { T, isAdmin, loading: appLoading } = useAuth();
    const { showAlert } = useNotification();
    
    // KRİTİK GÜVENLİK: Admin yetkisi zorunlu kılındı.
    const { loading: authReqLoading } = useRequiredAuth({ requireLogin: true, requireAdmin: true });

    const [content, setContent] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    // KRİTİK DÜZELTME: Alternatifler artık metin tipine göre objeler tutar
    const [aiAlternatives, setAiAlternatives] = useState({ ShortTitle: [], MediumTitle: [], LongContent: [] });
    const [activeAiKey, setActiveAiKey] = useState(null);
    const [activeTab, setActiveTab] = useState('general'); // Sekme navigasyonu eklendi
    
    const router = useRouter();

    // Başlangıç verilerini T objesinden yükle
    useEffect(() => {
        if (!authReqLoading && isAdmin && T && Object.keys(T).length > 0) {
            const initialContent = {};
            Object.values(CONTENT_MAP).forEach(section => {
                 section.keys.forEach(key => {
                    if (T[key] !== undefined) {
                       initialContent[key] = T[key];
                    }
                 });
            });
            setContent(initialContent);
        }
    }, [authReqLoading, isAdmin, T]);

    const contentDocRef = useMemo(() => {
        if (!db) return null;
        return doc(db, "siteContent", "translations_tr");
    }, []);

    const handleInputChange = useCallback((e) => {
        const { name, value } = e.target;
        setContent(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleSave = useCallback(async () => {
        if (isSaving || !contentDocRef) return;
        setIsSaving(true);
        showAlert('Değişiklikler kaydediliyor...', 'info', 1500); 
        
        try {
            await setDoc(contentDocRef, content, { merge: true });
            showAlert('Değişiklikler başarıyla kaydedildi! Site anında güncellendi.', 'success', 4000);
        } catch (error) {
            showAlert(`Hata: ${error.message}`, 'error', 5000);
        } finally {
            setIsSaving(false);
        }
    }, [isSaving, showAlert, contentDocRef, content]);
    
    // YENİ: Gemini AI ile Metin Üretme İşlevi
    const handleGenerateAiText = useCallback(async (key) => {
        setActiveAiKey(key);
        setIsGenerating(true);
        setAiAlternatives({ ShortTitle: [], MediumTitle: [], LongContent: [] });
        
        showAlert(`'${key}' için yaratıcı metinler üretiliyor...`, 'info', 5000);

        try {
            const currentText = content[key] || '';
            
            // KRİTİK DÜZELTME: targetType'ı metin uzunluğuna göre belirle.
            const isLongText = key.includes('_desc') || key.includes('_subtitle') || key.includes('content') || key.includes('description');
            const targetType = isLongText ? 'content' : 'title';
            
            const response = await fetch('/api/trpc/ai.generateContentAlternatives', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    currentText: currentText, 
                    targetType: targetType, 
                })
            });
            
            if (!response.ok) {
                 const errorBody = await response.json();
                 throw new Error(errorBody.error || `Sunucu hatası: ${response.status}`);
            }

            const data = await response.json();
            
            if (data?.result?.data) {
                const aiData = data.result.data;
                const newAlternatives = {
                    ShortTitle: aiData.ShortTitle ? [aiData.ShortTitle] : [],
                    MediumTitle: aiData.MediumTitle ? [aiData.MediumTitle] : [],
                    LongContent: aiData.LongContent ? [aiData.LongContent] : [],
                };
                
                setAiAlternatives(newAlternatives); 
                showAlert(`AI, alternatifleri üretti. Lütfen birini seçin.`, 'success', 5000);
            } else {
                 throw new Error("AI, beklenen JSON formatında çıktı üretemedi.");
            }

        } catch (error) {
            console.error("AI Metin Üretme Hatası:", error);
            showAlert(`AI Metin Üretim Hatası: ${error.message}`, 'error', 8000);
            setAiAlternatives({ ShortTitle: [], MediumTitle: [], LongContent: [] });
        } finally {
            setIsGenerating(false);
        }
    }, [content, showAlert]);
    
    // YENİ: Alternatif metni uygulama işlevi
    const handleApplyAlternative = useCallback((alternative) => {
        if (!activeAiKey) return;
        
        setContent(prev => ({ ...prev, [activeAiKey]: alternative }));
        
        setAiAlternatives({ ShortTitle: [], MediumTitle: [], LongContent: [] });
        setActiveAiKey(null);
        showAlert('Alternatif metin alana uygulandı. Kaydetmeyi unutmayın!', 'info', 4000);
    }, [activeAiKey, showAlert]);
    
    // YENİ: Alternatifleri kapatma işlevi
    const handleCancelAi = useCallback(() => {
        setAiAlternatives({ ShortTitle: [], MediumTitle: [], LongContent: [] });
        setActiveAiKey(null);
    }, []);
    
    // T objesi yüklenene kadar render'ı engelle
    if (!T || Object.keys(T).length === 0) {
        return null;
    }

    // Metin Kutusu ve AI Entegrasyonu Bileşeni
    const renderTextarea = (key, label) => {
        const value = content[key] || ''; 

        return (
            <div key={key} className="space-y-2 mb-4 p-3 bg-gray-700/50 rounded-lg border border-gray-700">
                <div className="flex justify-between items-center">
                    <label htmlFor={key} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
                    <button
                        type="button"
                        onClick={() => handleGenerateAiText(key)}
                        className="bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold py-1 px-3 rounded-lg transition-colors disabled:opacity-50 inline-flex items-center"
                        disabled={isGenerating && activeAiKey !== key}
                    >
                        {isGenerating && activeAiKey === key ? 'Üretiliyor...' : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-zap mr-1"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                                AI ile Yaz
                            </>
                        )}
                    </button>
                </div>
                
                <textarea
                    id={key}
                    name={key}
                    value={value} 
                    onChange={handleInputChange}
                    rows={key.includes('_desc') || key.includes('_subtitle') || key.includes('description') ? "4" : "2"}
                    className="w-full p-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:ring-2 focus:ring-indigo-500 transition-colors"
                    disabled={isGenerating}
                />
                
                {key === 'content_seo_description' && (
                    <p className={`text-xs text-right mt-1 ${value.length > 160 * 0.9 ? 'text-red-400' : 'text-gray-400'}`}>
                        {value.length}/160 karakter (İdeal: 150-160)
                    </p>
                )}
                
                {activeAiKey === key && (aiAlternatives.ShortTitle.length > 0 || aiAlternatives.MediumTitle.length > 0 || aiAlternatives.LongContent.length > 0) && (
                    <div className="bg-gray-800 p-3 rounded-lg border border-indigo-500 mt-2">
                        <p className="text-xs font-semibold text-indigo-400 mb-2">AI Alternatifleri (Birini Seçin ve Kaydedin):</p>
                        
                        {[...aiAlternatives.ShortTitle, ...aiAlternatives.MediumTitle, ...aiAlternatives.LongContent].map((alt, index) => (
                             <div key={`alt-${index}`} className="flex items-start mb-2 last:mb-0">
                                <button
                                    type="button"
                                    onClick={() => handleApplyAlternative(alt)} 
                                    className="bg-green-600 hover:bg-green-500 text-white text-xs py-1 px-2 rounded-lg flex-shrink-0 mr-2"
                                    title="Metni Uygula"
                                >
                                    Uygula
                                </button>
                                <p className="text-sm text-gray-300 flex-grow leading-relaxed">
                                    {alt.length > 200 && key.includes('content') ? alt.substring(0, 200) + '...' : alt}
                                </p>
                            </div>
                        ))}

                         <div className="flex justify-end mt-3 border-t border-gray-700 pt-2">
                             <button
                                type="button"
                                onClick={handleCancelAi}
                                className="text-xs text-gray-400 hover:text-white"
                            >
                                Kapat
                            </button>
                         </div>
                    </div>
                )}
            </div>
        );
    };
    
    // Aktif Sekme İçeriğini Dinamik Olarak Oluşturma
    const renderActiveTabContent = () => {
        const activeSection = CONTENT_MAP[activeTab];
        if (!activeSection) return <p className="text-gray-500 text-center p-8">Lütfen bir sekme seçin.</p>;

        const modulePrefix = activeTab !== 'general' && activeTab !== 'blog_news' ? activeTab.toUpperCase() + ' - ' : '';

        return (
            <div className="space-y-4">
                <h3 className="text-2xl font-bold text-indigo-400 mb-4">{activeSection.title}</h3>
                {activeSection.keys.map(key => {
                    const label = T[`${key}_title`] || T[`${key}_subtitle`] || T[key] || key;
                    const displayLabel = key.replace(/_/g, ' ').replace(modulePrefix.toLowerCase(), '');
                    return renderTextarea(key, displayLabel.charAt(0).toUpperCase() + displayLabel.slice(1));
                })}
            </div>
        );
    };

    if (authReqLoading || !isAdmin) {
        return <div className="min-h-screen bg-gray-900 text-white flex justify-center items-center"><p>{T.admin_title || 'Yönetici Paneli'} Yükleniyor...</p></div>;
    }
    

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
            <div className="container mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold">{T.content_admin_title}</h1>
                    <Link href="/admin" className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors inline-flex items-center">
                        <Icon name="arrow-left" className="w-4 h-4 mr-2" />
                        Admin Paneline Dön
                    </Link>
                </div>
                
                {/* Kaydetme Butonu - Sticky */}
                <div className="flex justify-end mb-6 sticky top-16 z-20">
                    <button 
                        onClick={handleSave} 
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 shadow-xl"
                        disabled={isSaving}
                    >
                        {isSaving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                    </button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    
                    {/* Sekme Navigasyonu (Solda) */}
                    <div className="lg:col-span-1">
                        <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700 space-y-2 sticky top-[120px]">
                            {Object.keys(CONTENT_MAP).map(key => (
                                <button
                                    key={key}
                                    onClick={() => setActiveTab(key)}
                                    className={`w-full text-left py-3 px-4 rounded-lg font-semibold transition-colors ${
                                        activeTab === key 
                                        ? 'bg-indigo-600 text-white' 
                                        : 'text-gray-300 hover:bg-gray-700'
                                    }`}
                                >
                                    {CONTENT_MAP[key].title}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    {/* İçerik Alanı (Sağda) */}
                    <div className="lg:col-span-3 bg-gray-800 p-6 rounded-2xl border border-gray-700">
                        {renderActiveTabContent()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContentAdminPage;
