// path: app/analyses/create/page.js
'use client';

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/Icon'; 
import { useAuth } from '@/context/AuthContext';
import { useRequiredAuth } from '@/hooks/useRequiredAuth';
import { useNotification } from '@/context/NotificationContext';
import { trpc } from '@/lib/trpc/client';
import { marked } from 'marked'; // Markdown için eklendi
import { motion, AnimatePresence } from 'framer-motion';

const MAX_CONTENT_LENGTH = 5000;
const MAX_TITLE_LENGTH = 100;

// AdminBlogForm'dan basitleştirilmiş MarkdownToolbar kopyalandı
const MarkdownToolbar = ({ applyMarkdown }) => {
    const handleLinkClick = () => {
        // NOTE: Gerçek uygulamada modal kullanılmalıdır. Burada sadece simülasyon olarak prompt kullanılıyor.
        const url = prompt("Lütfen linkin URL'sini girin:");
        const text = prompt("Lütfen linkin görünen metnini girin:");
        if (url && text) {
            applyMarkdown(`[${text}](${url})`);
        }
    };
    
    return (
        <div className="flex space-x-3 p-2 bg-gray-700 rounded-t-lg border-b border-gray-600">
            <button type="button" onClick={() => applyMarkdown('**', '**')} className="text-white hover:text-yellow-400 font-bold px-2 py-1 rounded transition-colors" aria-label="Kalın Metin">
                B
            </button>
            <button type="button" onClick={() => applyMarkdown('*', '*')} className="text-white hover:text-yellow-400 italic px-2 py-1 rounded transition-colors" aria-label="İtalik Metin">
                I
            </button>
            <button type="button" onClick={handleLinkClick} className="text-indigo-400 hover:text-indigo-300 px-2 py-1 rounded transition-colors" aria-label="Link Ekle">
                <Icon name="link" className="w-5 h-5"/>
            </button>
            <button type="button" onClick={() => applyMarkdown('## ', '\n\n')} className="text-gray-400 hover:text-yellow-400 font-mono px-2 py-1 rounded transition-colors text-sm" aria-label="H2 Başlık">
                H2
            </button>
            <button type="button" onClick={() => applyMarkdown('- ', '\n')} className="text-gray-400 hover:text-yellow-400 px-2 py-1 rounded transition-colors" aria-label="Madde İşareti">
                <Icon name="align-left" className="w-5 h-5"/>
            </button>
            <button type="button" onClick={() => applyMarkdown('', '\n\n---\n\n', '')} className="text-gray-400 hover:text-yellow-400 px-2 py-1 rounded transition-colors" aria-label="Ayırıcı Çizgi">
                 <Icon name="minus" className="w-5 h-5"/>
            </button>
        </div>
    );
};

const CreateAnalysisPage = () => {
    const { T, loading: authLoading, user } = useAuth();
    const { showAlert } = useNotification();
    const router = useRouter();
    const contentRef = useRef(null); // Markdown textarea için ref

    useRequiredAuth({ requireLogin: true });

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [instrument, setInstrument] = useState('');
    const [tradingViewChartUrl, setTradingViewChartUrl] = useState('');
    const [errors, setErrors] = useState({});
    
    // YENİ STATE: Editör ve Önizleme sekme kontrolü
    const [activeTab, setActiveTab] = useState('editor'); 


    // Markdown Toolbar için gerekli olan metin uygulama mantığı
    const applyMarkdown = useCallback((prefix, suffix = '', value = '') => {
        const textarea = contentRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentText = textarea.value;

        if (value) {
             const newText = currentText.substring(0, start) + value + currentText.substring(end);
             setContent(newText);
             setTimeout(() => textarea.selectionStart = textarea.selectionEnd = start + value.length, 0);

        } else {
            const selectedText = currentText.substring(start, end);
            const newText = currentText.substring(0, start) + prefix + selectedText + suffix + currentText.substring(end);
            setContent(newText);
            
            setTimeout(() => {
                const newCursorPos = start + prefix.length + selectedText.length + suffix.length;
                textarea.selectionStart = textarea.selectionEnd = newCursorPos;
                textarea.focus();
            }, 0);
        }
    }, [setContent]);

    const createAnalysisMutation = trpc.analysis.createAnalysis.useMutation({
        onSuccess: (data) => {
            showAlert('Analiz başarıyla yayınlandı!', 'success');
            // Başarılı olduğunda analiz detay sayfasına yönlendir.
            router.push(`/analyses/${data.analysisId}`);
        },
        onError: (error) => {
            showAlert(`Hata: ${error.message}`, 'error');
        },
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // KRİTİK FİX: Input uzunluk kontrolü
        if (name === 'title' && value.length > MAX_TITLE_LENGTH) return;
        if (name === 'content' && value.length > MAX_CONTENT_LENGTH) return;
        
        if (name === 'title') setTitle(value);
        if (name === 'content') setContent(value);
        if (name === 'instrument') setInstrument(value);
        if (name === 'tradingViewChartUrl') setTradingViewChartUrl(value);
        
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    // Form doğrulama fonksiyonu
    const validateForm = () => {
        const newErrors = {};
        if (title.trim().length < 5) newErrors.title = "Başlık en az 5 karakter olmalıdır.";
        if (content.trim().length < 20) newErrors.content = "İçerik en az 20 karakter olmalıdır.";
        
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
            tradingViewChartUrl: tradingViewChartUrl.trim() || null, 
        });
    };
    
    const contentHtml = useMemo(() => {
        if (!content) return '<p class="text-gray-500 italic">Analiz içeriği burada görünecektir (Markdown destekli).</p>';
        try {
            // KRİTİK: Markdown içeriğine tablo stilini uygulamak için özel bir wrapper ekleniyor.
            const html = marked.parse(content);
            return html.replace(/<table/g, '<div class="table-wrapper"><table class="w-full text-left table-auto">').replace(/<\/table>/g, '</table></div>');
        } catch (e) {
            return `<p class="text-red-400">Markdown ayrıştırma hatası: ${e.message}</p>`;
        }
    }, [content]);

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
            <div className="container mx-auto max-w-4xl">
                <div className="flex justify-between items-center mb-8">
                     <h1 className="text-3xl font-bold">{T.analysis_create_new}</h1>
                     <Link href="/analyses" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center">
                        <Icon name="arrow-left" className="w-4 h-4 mr-2" />
                        Geri Dön
                    </Link>
                </div>
               
                <form onSubmit={handleSubmit} className="futuristic-card p-8 rounded-2xl border border-gray-700/50 space-y-6">
                    
                    {/* Başlık */}
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">{T.analysis_form_title}</label>
                        <input
                            id="title"
                            type="text"
                            name="title"
                            value={title}
                            onChange={handleChange}
                            placeholder={T.analysis_form_title_placeholder}
                            maxLength={MAX_TITLE_LENGTH}
                            className={`w-full p-3 mt-1 bg-gray-700 rounded-lg border ${errors.title ? 'border-red-500' : 'border-gray-600'} focus:ring-2 focus:ring-indigo-500 transition-colors`}
                            required
                        />
                        {errors.title && <p className="mt-1 text-xs text-red-400">{errors.title}</p>}
                        <p className="text-xs text-gray-500 text-right mt-1">{title.length}/{MAX_TITLE_LENGTH}</p>
                    </div>

                    {/* Enstrüman ve TradingView URL (yan yana) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="instrument" className="block text-sm font-medium text-gray-300 mb-1">{T.analysis_form_instrument}</label>
                            <input
                                id="instrument"
                                type="text"
                                name="instrument"
                                value={instrument}
                                onChange={handleChange}
                                placeholder={T.analysis_form_instrument_placeholder}
                                className="w-full p-3 mt-1 bg-gray-700 rounded-lg border border-gray-600 focus:ring-2 focus:ring-indigo-500 transition-colors"
                            />
                        </div>
                        <div>
                            <label htmlFor="tv_url" className="block text-sm font-medium text-gray-300 mb-1">{T.analysis_form_tv_url}</label>
                            <input
                                id="tv_url"
                                type="url"
                                name="tradingViewChartUrl"
                                value={tradingViewChartUrl}
                                onChange={handleChange}
                                placeholder={T.analysis_form_tv_url_placeholder}
                                className={`w-full p-3 mt-1 bg-gray-700 rounded-lg border ${errors.tradingViewChartUrl ? 'border-red-500' : 'border-gray-600'} focus:ring-2 focus:ring-indigo-500 transition-colors`}
                            />
                             {errors.tradingViewChartUrl && <p className="mt-1 text-xs text-red-400">{errors.tradingViewChartUrl}</p>}
                        </div>
                    </div>
                    
                    {/* İçerik ve Önizleme Alanı */}
                    <div className="border border-gray-700 rounded-xl overflow-hidden">
                        
                        <div className="flex justify-between items-center bg-gray-700/80 p-3">
                             <label className="text-sm font-medium text-white">{T.analysis_form_content}</label>
                            <div className="flex items-center p-1 rounded-lg bg-gray-900/50 border border-gray-700">
                                <button type="button" className={`px-3 py-1 text-sm rounded-md ${activeTab === 'editor' ? 'bg-indigo-600 text-white' : 'text-gray-400'}`} onClick={() => setActiveTab('editor')}>
                                    <Icon name="pencil" className="w-4 h-4 inline mr-1"/> Editör
                                </button>
                                <button type="button" className={`px-3 py-1 text-sm rounded-md ${activeTab === 'preview' ? 'bg-indigo-600 text-white' : 'text-gray-400'}`} onClick={() => setActiveTab('preview')}>
                                    <Icon name="eye" className="w-4 h-4 inline mr-1"/> Önizleme
                                </button>
                            </div>
                        </div>

                        {activeTab === 'editor' ? (
                            <div className="relative">
                                <MarkdownToolbar applyMarkdown={applyMarkdown} />
                                <textarea
                                    id="content"
                                    name="content"
                                    ref={contentRef}
                                    value={content}
                                    onChange={handleChange}
                                    rows="15"
                                    maxLength={MAX_CONTENT_LENGTH}
                                    className={`w-full p-4 bg-gray-700/50 text-white border-none rounded-b-xl resize-none ${errors.content ? 'border-red-500' : ''} focus:ring-0 focus:outline-none`}
                                    required
                                ></textarea>
                                 <p className="text-xs text-gray-500 text-right p-2 pt-0">{content.length}/{MAX_CONTENT_LENGTH}</p>
                            </div>
                        ) : (
                            <div className="p-4 prose prose-invert max-w-none min-h-[300px] text-gray-300 overflow-x-auto">
                                <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
                            </div>
                        )}
                        
                         {errors.content && <p className="text-red-400 text-xs p-2">{errors.content}</p>}
                    </div>

                    {/* Buton */}
                    <div className="text-right pt-4">
                        <button
                            type="submit"
                            disabled={createAnalysisMutation.isLoading}
                            className="glow-on-hover-btn-primary py-3 px-8 text-lg disabled:opacity-50 inline-flex items-center justify-center"
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
