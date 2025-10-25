// path: app/analyses/create/page.js
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/Icon'; 
// KRİTİK FİX: Tüm göreceli yollar (@/) alias'ı ile değiştirildi
import { useAuth } from '@/context/AuthContext';
import { useRequiredAuth } from '@/hooks/useRequiredAuth';
import { useNotification } from '@/context/NotificationContext';
import { trpc } from '@/lib/trpc/client';

const CreateAnalysisPage = () => {
    const { T, loading: authLoading, user } = useAuth();
    const { showAlert } = useNotification();
    const router = useRouter();

    // Sadece giriş yapmış kullanıcıların erişebilmesi için yetki kontrolü.
    useRequiredAuth({ requireLogin: true });

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [instrument, setInstrument] = useState('');
    const [tradingViewChartUrl, setTradingViewChartUrl] = useState('');
    const [errors, setErrors] = useState({}); // Hata mesajları için state

    const createAnalysisMutation = trpc.analysis.createAnalysis.useMutation({
        onSuccess: () => {
            showAlert('Analiz başarıyla yayınlandı!', 'success');
            // Başarılı olduğunda analiz portalı ana sayfasına yönlendir.
            router.push('/analyses');
        },
        onError: (error) => {
            showAlert(`Hata: ${error.message}`, 'error');
        },
    });

    // Form doğrulama fonksiyonu
    const validateForm = () => {
        const newErrors = {};
        if (title.trim().length < 5) {
            newErrors.title = 'Başlık en az 5 karakter olmalıdır.';
        }
        if (content.trim().length < 20) {
            newErrors.content = 'İçerik en az 20 karakter olmalıdır.';
        }
        // KRİTİK FİX: Client taraflı doğrulama, backend Zod şeması ile uyumlu hale getirildi.
        if (tradingViewChartUrl.trim() && !/^(https?:\/\/)?(www\.)?tradingview\.com\/.+/.test(tradingViewChartUrl)) {
            newErrors.tradingViewChartUrl = 'Lütfen geçerli bir TradingView URL\'si girin.';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (createAnalysisMutation.isLoading) return;

        if (!validateForm()) {
            showAlert('Lütfen formdaki hataları düzeltin.', 'error');
            return;
        }

        createAnalysisMutation.mutate({
            title,
            content,
            instrument: instrument.trim() || null,
            tradingViewChartUrl: tradingViewChartUrl.trim() || null, // Boş ise null gönder
        });
    };
    
    // Yükleme sırasında boş ekran göstermek yerine bir yükleyici göster
    if (authLoading || !T) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex flex-col justify-center items-center p-4">
                <Icon name="loader" className="w-12 h-12 animate-spin text-indigo-400" />
                <p className="mt-4 text-lg">Yükleniyor...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#111827] text-white p-4 md:p-8">
            <div className="container mx-auto max-w-3xl">
                <div className="flex justify-between items-center mb-8">
                     <h1 className="text-3xl font-bold">{T.analysis_create_new}</h1>
                     <Link href="/analyses" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center">
                        <Icon name="arrow-left" className="w-4 h-4 mr-2" />
                        Geri Dön
                    </Link>
                </div>
               
                <form onSubmit={handleSubmit} className="bg-gray-800 p-8 rounded-2xl border border-gray-700 space-y-6">
                    {/* Başlık */}
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-300">{T.analysis_form_title}</label>
                        <input
                            id="title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={T.analysis_form_title_placeholder}
                            className={`w-full p-3 mt-1 bg-gray-700 rounded-lg border ${errors.title ? 'border-red-500' : 'border-gray-600'} focus:ring-2 focus:ring-indigo-500 transition-colors`}
                            required
                        />
                        {errors.title && <p className="mt-1 text-xs text-red-400">{errors.title}</p>}
                    </div>

                    {/* Enstrüman ve TradingView URL (yan yana) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="instrument" className="block text-sm font-medium text-gray-300">{T.analysis_form_instrument}</label>
                            <input
                                id="instrument"
                                type="text"
                                value={instrument}
                                onChange={(e) => setInstrument(e.target.value)}
                                placeholder={T.analysis_form_instrument_placeholder}
                                className="w-full p-3 mt-1 bg-gray-700 rounded-lg border border-gray-600 focus:ring-2 focus:ring-indigo-500 transition-colors"
                            />
                        </div>
                        <div>
                            <label htmlFor="tv_url" className="block text-sm font-medium text-gray-300">{T.analysis_form_tv_url}</label>
                            <input
                                id="tv_url"
                                type="url"
                                value={tradingViewChartUrl}
                                onChange={(e) => setTradingViewChartUrl(e.target.value)}
                                placeholder={T.analysis_form_tv_url_placeholder}
                                className={`w-full p-3 mt-1 bg-gray-700 rounded-lg border ${errors.tradingViewChartUrl ? 'border-red-500' : 'border-gray-600'} focus:ring-2 focus:ring-indigo-500 transition-colors`}
                            />
                             {errors.tradingViewChartUrl && <p className="mt-1 text-xs text-red-400">{errors.tradingViewChartUrl}</p>}
                        </div>
                    </div>
                    
                    {/* İçerik */}
                    <div>
                        <label htmlFor="content" className="block text-sm font-medium text-gray-300">{T.analysis_form_content}</label>
                        <textarea
                            id="content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows="10"
                            className={`w-full p-3 mt-1 bg-gray-700 rounded-lg border ${errors.content ? 'border-red-500' : 'border-gray-600'} focus:ring-2 focus:ring-indigo-500 transition-colors`}
                            required
                        ></textarea>
                         {errors.content && <p className="mt-1 text-xs text-red-400">{errors.content}</p>}
                         <p className="text-xs text-gray-500 mt-1">Stil eklemek için Markdown kullanabilirsiniz (örn: **kalın**, *italik*, # Başlık).</p>
                    </div>

                    {/* Buton */}
                    <div className="text-right">
                        <button
                            type="submit"
                            disabled={createAnalysisMutation.isLoading}
                            className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-lg transition-colors disabled:opacity-50 inline-flex items-center"
                        >
                             <Icon name="send" className="w-5 h-5 mr-2" />
                            {createAnalysisMutation.isLoading ? T.analysis_form_publishing : T.analysis_form_submit}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateAnalysisPage;
