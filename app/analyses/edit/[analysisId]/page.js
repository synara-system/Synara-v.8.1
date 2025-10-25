// path: app/analyses/edit/[analysisId]/page.js
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/Icon';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { trpc } from '@/lib/trpc/client';
import { useRequiredAuth } from '@/hooks/useRequiredAuth';

const EditAnalysisPage = () => {
    useRequiredAuth({ requireLogin: true });
    const { T, user, isAdmin } = useAuth();
    const { showAlert } = useNotification();
    const router = useRouter();
    const params = useParams();
    const analysisId = params.analysisId;
    const utils = trpc.useContext();

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        instrument: '',
        tradingViewChartUrl: ''
    });
    const [errors, setErrors] = useState({});

    const { data: analysisData, isLoading: isLoadingAnalysis, isSuccess } = trpc.analysis.getAnalysisById.useQuery(
        { analysisId },
        {
            enabled: !!analysisId && !!user, // Sadece ID ve kullanıcı bilgisi varsa sorguyu çalıştır
            staleTime: 1000 * 60, // 1 dakika
            onError: () => {
                showAlert('Analiz yüklenirken bir hata oluştu veya bu içeriği düzenleme yetkiniz yok.', 'error');
                router.push('/analyses');
            }
        }
    );

    // KRİTİK DÜZELTME: Veri başarıyla yüklendiğinde formu doldurmak için useEffect kullanıldı.
    // Bu, onSuccess callback'indeki olası senkronizasyon sorunlarını çözer.
    useEffect(() => {
        if (isSuccess && analysisData?.analysis) {
            const analysis = analysisData.analysis;

            // Yetki kontrolü
            if (analysis.authorId !== user?.uid && !isAdmin) {
                showAlert('Bu analizi düzenleme yetkiniz yok.', 'error');
                router.push('/analyses');
                return;
            }

            setFormData({
                title: analysis.title || '',
                content: analysis.content || '',
                instrument: analysis.instrument || '',
                tradingViewChartUrl: analysis.tradingViewChartUrl || ''
            });
        }
    }, [isSuccess, analysisData, user, isAdmin, router, showAlert]);


    const updateAnalysisMutation = trpc.analysis.updateAnalysis.useMutation({
        onSuccess: (data) => {
            showAlert('Analiz başarıyla güncellendi.', 'success');
            utils.analysis.getAnalysisById.invalidate({ analysisId });
            utils.analysis.getAnalyses.invalidate();
            router.push(`/analyses/${data.analysisId}`);
        },
        onError: (error) => {
            showAlert(`Güncelleme hatası: ${error.message}`, 'error');
        }
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (formData.title.trim().length < 5) newErrors.title = "Başlık en az 5 karakter olmalıdır.";
        if (formData.content.trim().length < 20) newErrors.content = "İçerik en az 20 karakter olmalıdır.";
        try {
            if (formData.tradingViewChartUrl) new URL(formData.tradingViewChartUrl);
        } catch (_) {
            newErrors.tradingViewChartUrl = "Lütfen geçerli bir URL girin.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            updateAnalysisMutation.mutate({ analysisId, ...formData });
        }
    };

    if (isLoadingAnalysis || !T || !user) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex flex-col justify-center items-center p-4">
                <div className="loader"></div>
                <p className="mt-4 text-lg">Analiz Düzenleyici Yükleniyor...</p>
            </div>
        );
    }
    
    // YENİ DÜZENLEME: Sayfa yapısı, navigasyon çakışmasını önlemek için basitleştirildi.
    return (
        <div className="container mx-auto max-w-4xl py-12 px-4">
            <div className="mb-8">
                 <Link href={`/analyses/${analysisId}`} className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center">
                    <Icon name="arrow-left" className="w-4 h-4 mr-2" />
                    Analize Geri Dön
                </Link>
            </div>

            <form onSubmit={handleSubmit} className="bg-gray-800 p-8 rounded-2xl border border-gray-700 space-y-6">
                <h1 className="text-3xl font-bold">Analizi Düzenle</h1>
                
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">{T.analysis_form_title}</label>
                    <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder={T.analysis_form_title_placeholder} className={`w-full p-3 bg-gray-700 rounded-lg ${errors.title ? 'border border-red-500' : 'border border-transparent'}`} />
                    {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="instrument" className="block text-sm font-medium text-gray-300 mb-1">{T.analysis_form_instrument}</label>
                        <input type="text" name="instrument" value={formData.instrument} onChange={handleChange} placeholder={T.analysis_form_instrument_placeholder} className="w-full p-3 bg-gray-700 rounded-lg" />
                    </div>
                    <div>
                        <label htmlFor="tradingViewChartUrl" className="block text-sm font-medium text-gray-300 mb-1">{T.analysis_form_tv_url}</label>
                        <input type="url" name="tradingViewChartUrl" value={formData.tradingViewChartUrl} onChange={handleChange} placeholder={T.analysis_form_tv_url_placeholder} className={`w-full p-3 bg-gray-700 rounded-lg ${errors.tradingViewChartUrl ? 'border border-red-500' : 'border border-transparent'}`} />
                        {errors.tradingViewChartUrl && <p className="text-red-400 text-xs mt-1">{errors.tradingViewChartUrl}</p>}
                    </div>
                </div>

                <div>
                    <label htmlFor="content" className="block text-sm font-medium text-gray-300 mb-1">{T.analysis_form_content}</label>
                    <textarea name="content" value={formData.content} onChange={handleChange} rows="10" className={`w-full p-3 bg-gray-700 rounded-lg ${errors.content ? 'border border-red-500' : 'border border-transparent'}`}></textarea>
                    {errors.content && <p className="text-red-400 text-xs mt-1">{errors.content}</p>}
                </div>

                <div className="flex justify-end gap-4">
                    <button type="button" onClick={() => router.back()} className="bg-gray-600 hover:bg-gray-500 font-bold py-3 px-6 rounded-lg transition-colors">
                        İptal
                    </button>
                    <button type="submit" disabled={updateAnalysisMutation.isLoading} className="bg-indigo-600 hover:bg-indigo-500 font-bold py-3 px-6 rounded-lg disabled:opacity-50 transition-colors">
                        {updateAnalysisMutation.isLoading ? 'Güncelleniyor...' : 'Değişiklikleri Kaydet'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditAnalysisPage;

