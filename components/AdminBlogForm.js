// path: components/AdminBlogForm.js
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { marked } from 'marked'; 
import Icon from '@/components/Icon'; 
import { useNotification } from '@/context/NotificationContext'; 
import { useAuth } from '@/context/AuthContext';
import { trpc } from '@/lib/trpc/client';
import { getBaseUrl } from '@/lib/trpc/utils'; 

const ALL_CATEGORIES = [
    'Analiz', 'Eğitim', 'Güncelleme', 'Sistem', 
    'Haberler', 'Kripto', 'Makroekonomi', 'Altın', 'Döviz', 'Borsa',
];
const MAX_SEO_DESC_LENGTH = 160;

const CATEGORY_MAP = {
    blog: ['Analiz', 'Eğitim', 'Güncelleme', 'Sistem'],
    haberler: ['Haberler', 'Kripto', 'Makroekonomi', 'Altın', 'Döviz', 'Borsa'],
};

const MarkdownToolbar = ({ applyMarkdown }) => {
    const handleLinkClick = () => {
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


const AdminBlogForm = ({ postId, initialPostData }) => {
    const contentRef = useRef(null); 
    const { T, user } = useAuth(); 
    const { showToast } = useNotification();
    const router = useRouter();
    const utils = trpc.useContext();
    
    const isNewPost = postId === 'new';

    const [title, setTitle] = useState('');
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [bannerImageUrl, setBannerImageUrl] = useState('');
    const [content, setContent] = useState('');
    const [authorName, setAuthorName] = useState('Synara System');
    const [category, setCategory] = useState(ALL_CATEGORIES[0] || 'Analiz');
    const [activeTab, setActiveTab] = useState('editor');
    const [activeCategoryGroup, setActiveCategoryGroup] = useState('blog');
    
    const [seoTitle, setSeoTitle] = useState('');
    const [seoDescription, setSeoDescription] = useState('');
    
    const [aiAlternatives, setAiAlternatives] = useState({ ShortTitle: [], MediumTitle: [], LongContent: [] });
    const [activeAiKey, setActiveAiKey] = useState(null); 
    const [currentSlug, setCurrentSlug] = useState(initialPostData?.post?.slug || null); 

    useEffect(() => {
        const currentCategoryGroup = CATEGORY_MAP.blog.includes(category) ? 'blog' : 'haberler';
        
        if (currentCategoryGroup !== activeCategoryGroup) {
            setActiveCategoryGroup(currentCategoryGroup);
        }
    }, [category, activeCategoryGroup]);


    useEffect(() => {
        if (!isNewPost && initialPostData?.post) {
            const { post } = initialPostData;
            setTitle(post.title || '');
            setContent(post.content || '');
            setYoutubeUrl(post.youtubeVideoId ? `https://www.youtube.com/watch?v=${post.youtubeVideoId}` : '');
            setBannerImageUrl(post.bannerImageUrl || '');
            setAuthorName(post.authorName || 'Synara System');
            setCategory(post.category || 'Analiz');
            setSeoTitle(post.seoTitle || post.title || ''); 
            setSeoDescription(post.seoDescription || post.content?.substring(0, MAX_SEO_DESC_LENGTH).replace(/#|\*|_/g, '').trim() || ''); 
            setCurrentSlug(post.slug); 
            
            const initialGroup = CATEGORY_MAP.haberler.includes(post.category) ? 'haberler' : 'blog';
            setActiveCategoryGroup(initialGroup);
        }
    }, [initialPostData, isNewPost]);

    const getYouTubeId = (url) => { if (!url) return null; const match = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11}).*/); return match ? match[1] : null; };

    const revalidatePaths = async (paths) => {
        try {
            const url = `${getBaseUrl()}/api/revalidate`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paths }),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Revalidate başarısız oldu: ${response.status}`);
            }
            console.log(`[REVALIDATE PROTOCOL] Başarılı: ${paths.join(', ')}.`);
        } catch (error) {
            console.error(`[REVALIDATE KRİTİK HATA] ${error.message}`);
        }
    };

    const createPostMutation = trpc.blog.createPost.useMutation({
        onSuccess: async (data) => {
            showToast('Yazı başarıyla yayınlandı.', 'success');
            
            const newSlug = data.slug;
            await revalidatePaths(['/blog', `/blog/${newSlug}`]); 

            utils.blog.getPosts.invalidate();
            router.push(`/admin/blog-editor/${data.postId}`);
        },
        onError: (error) => {
            showToast(`Yazı oluşturulurken hata: ${error.message}`, 'error');
        },
    });
    
    const updatePostMutation = trpc.blog.updatePost.useMutation({
        onSuccess: async () => {
            showToast('Yazı başarıyla güncellendi.', 'success');
            
            if (currentSlug) {
                 await revalidatePaths(['/blog', `/blog/${currentSlug}`]);
            }
            
            utils.blog.getPostById.invalidate({ postId });
            utils.blog.getPosts.invalidate();
        },
        onError: (error) => {
            showToast(`Yazı güncellenirken hata: ${error.message}`, 'error');
        },
    });
    
    const generateAiTextMutation = trpc.ai.generateContentAlternatives.useMutation({
        onSuccess: (data) => {
            if (data.ShortTitle || data.MediumTitle || data.LongContent) {
                const newAlternatives = {
                    ShortTitle: data.ShortTitle ? [data.ShortTitle] : [],
                    MediumTitle: data.MediumTitle ? [data.MediumTitle] : [],
                    LongContent: data.LongContent ? [data.LongContent] : [],
                };
                setAiAlternatives(newAlternatives); 
                showToast(`AI, alternatifleri üretti. Lütfen birini seçin.`, 'success');
            } else {
                 throw new Error("AI, beklenen formatta çıktı üretemedi.");
            }
        },
        onError: (error) => {
            console.error("AI Metin Üretme Hatası:", error);
            showToast(`AI Metin Üretim Hatası: ${error.message}`, 'error');
            setAiAlternatives({ ShortTitle: [], MediumTitle: [], LongContent: [] });
        },
    });

    const handleGenerateAiText = useCallback(async (targetKey) => {
        setActiveAiKey(targetKey);
        setAiAlternatives({ ShortTitle: [], MediumTitle: [], LongContent: [] });
        
        showToast(`'${targetKey === 'title' ? 'Ana Başlık/SEO' : 'Uzun İçerik'}' için yaratıcı metinler üretiliyor...`, 'info');

        const currentText = targetKey === 'title' ? title : content;
        const targetType = targetKey.includes('desc') || targetKey.includes('subtitle') || targetKey.includes('content') ? 'content' : 'title';

        generateAiTextMutation.mutate({ currentText, targetType });
    }, [title, content, generateAiTextMutation, showToast]);
    
    const handleApplyAlternative = useCallback((alternative, targetKey) => {
        if (!activeAiKey) return;

        if (targetKey === 'title') {
            setTitle(alternative);
        } else if (targetKey === 'content') {
            setContent(alternative);
        } else if (targetKey === 'seoTitle') {
             setSeoTitle(alternative);
        } else if (targetKey === 'seoDescription') {
             setSeoDescription(alternative);
        }
        
        setAiAlternatives({ ShortTitle: [], MediumTitle: [], LongContent: [] });
        setActiveAiKey(null);
        showToast('Alternatif metin alana uygulandı. Kaydetmeyi unutmayın!', 'info', 4000);
    }, [activeAiKey, showToast]);
    
    const handleCancelAi = useCallback(() => {
        setAiAlternatives({ ShortTitle: [], MediumTitle: [], LongContent: [] });
        setActiveAiKey(null);
    }, []);
    
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


    const handleSubmit = async (e) => {
        e.preventDefault();
        const isLoading = createPostMutation.isLoading || updatePostMutation.isLoading;
        if (isLoading) return;

        const youtubeVideoId = getYouTubeId(youtubeUrl);
        const finalBannerImageUrl = bannerImageUrl || (youtubeVideoId ? `https://img.youtube.com/vi/${youtubeVideoId}/maxresdefault.jpg` : null);
        
        if (!title.trim()) {
            showToast('Başlık alanı zorunludur.', 'error');
            return;
        }

        const payload = {
            title: title.trim(),
            content: content.trim(),
            youtubeVideoId,
            bannerImageUrl: finalBannerImageUrl,
            authorName,
            category,
            seoTitle: seoTitle.trim() || title.trim(),
            seoDescription: seoDescription.trim().substring(0, MAX_SEO_DESC_LENGTH),
        };

        if (isNewPost) {
            createPostMutation.mutate(payload);
        } else {
            updatePostMutation.mutate({ postId, ...payload });
        }
    };

    const isLoading = createPostMutation.isLoading || updatePostMutation.isLoading;
    const isGenerating = generateAiTextMutation.isLoading;
    
    const filteredCategories = useMemo(() => {
        return CATEGORY_MAP[activeCategoryGroup] || [];
    }, [activeCategoryGroup]);


    const renderTextarea = useCallback((key, label) => {
        const value = key === 'title' ? title : 
                      key === 'content' ? content : 
                      key === 'seoTitle' ? seoTitle :
                      key === 'seoDescription' ? seoDescription : '';
        const setter = key === 'title' ? setTitle : 
                       key === 'content' ? setContent : 
                       key === 'seoTitle' ? setSeoTitle :
                       key === 'seoDescription' ? setSeoDescription : () => {};

        const isLongText = key === 'content' || key === 'seoDescription';

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
                            <><Icon name="zap" className="w-4 h-4 mr-1"/>AI ile Yaz</>
                        )}
                    </button>
                </div>
                
                {isLongText && key === 'content' && <MarkdownToolbar applyMarkdown={applyMarkdown} />}
                
                <textarea
                    id={key}
                    name={key}
                    value={value} 
                    onChange={(e) => setter(e.target.value)}
                    rows={isLongText ? "15" : "2"}
                    className="w-full p-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:ring-2 focus:ring-indigo-500 transition-colors"
                    disabled={isGenerating}
                    ref={key === 'content' ? contentRef : null}
                />

                {key === 'seoDescription' && (
                    <p className={`text-xs text-right mt-1 ${value.length > MAX_SEO_DESC_LENGTH * 0.9 ? 'text-red-400' : 'text-gray-400'}`}>
                        {value.length}/{MAX_SEO_DESC_LENGTH} karakter (İdeal: 150-160)
                    </p>
                )}
                
                {activeAiKey === key && (aiAlternatives.ShortTitle.length > 0 || aiAlternatives.MediumTitle.length > 0 || aiAlternatives.LongContent.length > 0) && (
                    <div className="bg-gray-800 p-3 rounded-lg border border-indigo-500 mt-2">
                        <p className="text-xs font-semibold text-indigo-400 mb-2">AI Alternatifleri (Birini Seçin ve Kaydedin):</p>
                        
                        {[...aiAlternatives.ShortTitle, ...aiAlternatives.MediumTitle].map((alt, index) => (
                             <div key={`title-alt-${index}`} className="flex items-start mb-2 last:mb-0">
                                <button type="button" onClick={() => handleApplyAlternative(alt, key)} className="bg-green-600 hover:bg-green-500 text-white text-xs py-1 px-2 rounded-lg flex-shrink-0 mr-2" title="Metni Başlığa Uygula">Uygula</button>
                                <div className="text-sm text-gray-300 flex-grow leading-relaxed"><p>{alt}</p></div>
                            </div>
                         ))}
                        
                        {aiAlternatives.LongContent.map((alt, index) => (
                             <div key={`content-alt-${index}`} className="flex items-start mb-2 last:mb-0 border-t border-gray-700 pt-2 mt-2">
                                <button type="button" onClick={() => handleApplyAlternative(alt, key)} className="bg-red-600 hover:bg-red-500 text-white text-xs py-1 px-2 rounded-lg flex-shrink-0 mr-2" title="Metni İçeriğe Uygula">Uygula</button>
                                <div className="text-sm text-gray-300 flex-grow leading-relaxed prose prose-sm prose-invert max-w-none">
                                    <div dangerouslySetInnerHTML={{ __html: marked.parse(alt.substring(0, 500) + (alt.length > 500 ? '...' : '')) }} />
                                </div>
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
    }, [activeAiKey, aiAlternatives, title, content, seoTitle, seoDescription, isGenerating, applyMarkdown, handleApplyAlternative, handleCancelAi, handleGenerateAiText]);

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">{isNewPost ? 'Yeni Yazı Oluştur' : 'Yazıyı Düzenle'}</h1>
                <div className="flex items-center p-1 rounded-lg bg-gray-900 border border-gray-700">
                    <button type="button" className={`px-3 py-1 text-sm rounded-md ${activeTab === 'editor' ? 'bg-indigo-600 text-white' : 'text-gray-400'}`} onClick={() => setActiveTab('editor')}>
                        Editör
                    </button>
                    <button type="button" className={`px-3 py-1 text-sm rounded-md ${activeTab === 'preview' ? 'bg-indigo-600 text-white' : 'text-gray-400'}`} onClick={() => setActiveTab('preview')}>
                        Önizleme
                    </button>
                </div>
            </div>

            {activeTab === 'editor' ? (
                <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 space-y-4">
                    <h2 className="text-xl font-bold text-indigo-400">Temel Bilgiler</h2>
                    
                    {renderTextarea('title', 'Yazı Başlığı (H1)')}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">YouTube Video URL</label>
                            <input type="url" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." className="w-full p-2 bg-gray-700 rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Banner Görsel URL</label>
                            <input type="url" value={bannerImageUrl} onChange={(e) => setBannerImageUrl(e.target.value)} placeholder="https://i.imgur.com/..." className="w-full p-2 bg-gray-700 rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Yazar Adı</label>
                            <input type="text" value={authorName} onChange={(e) => setAuthorName(e.target.value)} className="w-full p-2 bg-gray-700 rounded-md" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Kategori Grubu</label>
                            <div className="flex bg-gray-700 rounded-lg p-1 space-x-1 mb-2">
                                <button
                                    type="button"
                                    onClick={() => { setActiveCategoryGroup('blog'); setCategory(CATEGORY_MAP.blog[0]); }}
                                    className={`flex-1 py-2 px-3 text-sm font-semibold rounded-lg transition-colors ${activeCategoryGroup === 'blog' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-600'}`}
                                >
                                    Blog & Analiz
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setActiveCategoryGroup('haberler'); setCategory(CATEGORY_MAP.haberler[0]); }}
                                    className={`flex-1 py-2 px-3 text-sm font-semibold rounded-lg transition-colors ${activeCategoryGroup === 'haberler' ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-gray-600'}`}
                                >
                                    Haberler & Piyasa
                                </button>
                            </div>
                            
                            <label className="block text-sm font-medium text-gray-300 mb-1">Kategori (Blog/Haber)</label>
                            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-2 bg-gray-700 rounded-md">
                                {filteredCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                            
                        </div>
                    </div>
                    
                    <h2 className="text-xl font-bold text-yellow-400 pt-6 border-t border-gray-700">SEO & Meta Veriler</h2>
                    {renderTextarea('seoTitle', 'Meta Başlık (SEO)')}
                    {renderTextarea('seoDescription', 'Meta Açıklaması (SEO)', true)}

                    <h2 className="text-xl font-bold text-indigo-400 pt-6 border-t border-gray-700">İçerik</h2>
                    {renderTextarea('content', 'İçerik (Markdown Destekli)')}
                </div>
            ) : (
                <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
                    <div className="prose prose-invert max-w-none">
                        <h1>{title}</h1>
                        <div dangerouslySetInnerHTML={{ __html: marked.parse(content) }} />
                    </div>
                </div>
            )}

            <div className="flex justify-end">
                <button type="submit" className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-lg transition-colors" disabled={isLoading}>
                    {isLoading ? 'Kaydediliyor...' : (isNewPost ? 'Yazıyı Yayınla' : 'Değişiklikleri Kaydet')}
                </button>
            </div>
        </form>
    );
};

export default AdminBlogForm;
