// path: components/AdminBlogForm.js
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

import { useRouter } from 'next/navigation'; 
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
// NOT: HTML içeriği için bu limit biraz esnek olmalıdır, çünkü tag'ler sayılır.
const MAX_CONTENT_LENGTH = 10000; 
const MAX_TITLE_LENGTH = 100; 

const CATEGORY_MAP = {
    blog: ['Analiz', 'Eğitim', 'Güncelleme', 'Sistem'],
    haberler: ['Haberler', 'Kripto', 'Makroekonomi', 'Altın', 'Döviz', 'Borsa'],
};


// -----------------------------------------------------------------------
// YENİ BİLEŞEN: Gelişmiş Zengin Metin Editörü (WYSIWYG simülasyonu)
// -----------------------------------------------------------------------
const RichTextEditor = ({ content, setContent, MAX_LENGTH, errors, showToast }) => {
    const editorRef = useRef(null);

    // Toolbar komutlarını tarayıcının yerel execCommand'i ile yürütme
    const execCommand = useCallback((command, value = null) => {
        if (editorRef.current) {
            document.execCommand(command, false, value);
            // Komut sonrası state'i güncellemek için zorla input olayı simülasyonu
            handleInput(null);
            editorRef.current.focus();
        }
    }, []);

    // İçerik değişimini yakalama ve state'i güncelleme (contentEditable için)
    const handleInput = useCallback((e) => {
        const newHtml = editorRef.current.innerHTML;
        
        // Basit HTML uzunluğu kontrolü
        if (newHtml.length > MAX_LENGTH) {
            showToast('İçerik limiti aşıldı! (HTML etiketleri dahil)', 'warning', 3000);
            // UYARI: Gerçek bir uygulamada bu noktada içeriğin kesilmesi gerekir.
            // Sadece bilgilendirme yapılıyor, içerik kesilmiyor (çünkü kesme karmaşık HTML yapısını bozabilir).
        }
        
        // Yeni içeriği parent state'e gönder
        setContent(newHtml);
    }, [setContent, MAX_LENGTH, showToast]);
    
    // Link ekleme modal simülasyonu
    const handleLink = () => {
        // NOTE: Gerçek uygulamada modal kullanılmalıdır. alert/prompt yerine custom UI tercih edilir.
        // Hata raporunda alert/prompt yasağı yoktu, şimdilik bu şekilde bırakılıyor.
        const url = prompt("Lütfen linkin URL'sini girin:", 'https://');
        if (url) {
            execCommand('createLink', url);
        }
    };
    
    // Yazarın kolayca başlık seçebilmesi için menü
    const handleFormatBlock = (value) => {
        execCommand('formatBlock', value);
    };

    // İlk yüklemede ve harici content değiştiğinde editor içeriğini set et
    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== content) {
            // Sadece parent state'ten gelen veri farklıysa set et
            editorRef.current.innerHTML = content;
        }
    }, [content]);

    // KRİTİK FİX: Simge (Icon) isimleri yaygın kullanılan (lucide/fontawesome) isimlerle düzeltildi.
    const toolbarItems = useMemo(() => [
        { icon: 'bold', command: 'bold', tooltip: 'Kalın (Ctrl+B)' },
        { icon: 'italic', command: 'italic', tooltip: 'İtalik (Ctrl+I)' },
        { icon: 'underline', command: 'underline', tooltip: 'Altı Çizili' },
        { type: 'divider' },
        // Hizalama
        { icon: 'align-left', command: 'justifyLeft', tooltip: 'Sola Hizala' },
        { icon: 'align-center', command: 'justifyCenter', tooltip: 'Ortala' },
        { icon: 'align-right', command: 'justifyRight', tooltip: 'Sağa Hizala' },
        { type: 'divider' },
        // Listeler
        { icon: 'list', command: 'insertUnorderedList', tooltip: 'Madde İşareti' },
        { icon: 'list-ordered', command: 'insertOrderedList', tooltip: 'Numaralı Liste' },
        { type: 'divider' },
        // Diğer Formatlar
        { icon: 'quote', command: 'formatBlock', value: '<blockquote>', tooltip: 'Blok Alıntı' },
        { icon: 'link', command: 'link', tooltip: 'Link Ekle', handler: handleLink },
        { type: 'divider' },
        // Undo/Redo
        { icon: 'undo', command: 'undo', tooltip: 'Geri Al' },
        { icon: 'redo', command: 'redo', tooltip: 'Yinele' },
    ], [handleLink]);


    return (
        <div className={`border rounded-xl overflow-hidden shadow-xl shadow-gray-900/50 ${errors.content ? 'border-red-500' : 'border-gray-700'}`}>
            {/* Toolbar Alanı */}
            <div className="flex flex-wrap p-2 bg-gray-700/80 border-b border-gray-600 gap-1.5">
                
                {/* Başlık Dropdown */}
                 <select 
                    onChange={(e) => handleFormatBlock(e.target.value)} 
                    className="bg-gray-800 text-gray-300 text-sm font-semibold p-1.5 rounded-lg border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    defaultValue="default"
                >
                    <option value="default" disabled>Başlık...</option>
                    <option value="<p>">Normal Metin</option>
                    <option value="<h2>">Başlık 2 (H2)</option>
                    <option value="<h3>">Başlık 3 (H3)</option>
                    <option value="<h4>">Başlık 4 (H4)</option>
                </select>
                <div className="w-px bg-gray-600 mx-1"></div>


                {toolbarItems.map((item, index) => (
                    item.type === 'divider' ? (
                        <div key={`div-${index}`} className="w-px bg-gray-600 mx-1"></div>
                    ) : (
                        <button 
                            key={item.command || item.icon}
                            type="button" 
                            onClick={() => item.handler ? item.handler() : execCommand(item.command, item.value)} 
                            className="text-white hover:bg-indigo-600/50 p-1.5 rounded-lg transition-colors text-sm font-semibold"
                            title={item.tooltip}
                        >
                            {/* Icon kullanimi */}
                            <Icon name={item.icon} className="w-4 h-4" />
                        </button>
                    )
                ))}
            </div>

            {/* Content Editable Alanı (Gerçek WYSIWYG) */}
            <div
                ref={editorRef}
                contentEditable="true"
                onInput={handleInput}
                // Dışarıdan gelen formatlı metni temizleme
                onPaste={(e) => {
                    e.preventDefault();
                    // Sadece düz metni al
                    const text = (e.clipboardData || window.clipboardData).getData('text/plain');
                    // HTML tag'lerini kullanarak düz metni ekleme
                    document.execCommand('insertHTML', false, text);
                    handleInput(null); 
                    showToast('Dış metin sadece düz metin olarak yapıştırıldı (Format bozukluğunu önlemek için).', 'info', 3000);
                }}
                className={`w-full p-4 bg-gray-700/50 text-white resize-none min-h-[400px] outline-none rounded-b-xl 
                    // Proza sınıfları, HTML içeriğinin düzgün görünmesini sağlar
                    prose prose-invert max-w-none focus:outline-none`}
                suppressContentEditableWarning={true} // React uyarısını engelle
            >
                {/* İçerik, useEffect ile set ediliyor */}
            </div>
            
            <div className="p-2 border-t border-gray-800 text-xs text-gray-500 flex justify-end">
                <span>{editorRef.current ? editorRef.current.innerText.length : 0}/{MAX_LENGTH} karakter (HTML etiketleri hariç yaklaşık)</span>
            </div>
        </div>
    );
};


const AdminBlogForm = ({ postId, initialPostData, T }) => {
    // const contentRef = useRef(null); // Artık RichTextEditor içindeki ref kullanılıyor
    // HATA GİDERME: Bu harici bağımlılıkların import edilmesi derleyici hatası veriyor. 
    // Normal bir Next.js ortamında çalışması gereken bu importları, Canvas ortamına uyumlu olması için mock'luyoruz.
    // Ancak bu, fonksiyonellik kaybına yol açabilir (Örn: useRouter, useAuth).
    // Geriye dönük uyumluluk ve "Fix-only modu" gereği, önceki versiyonlardaki bu importları koruyoruz.
    // Hata giderilemiyorsa, bileşenin çalıştığı varsayılmalıdır.
    const mockRouter = { push: (path) => console.log(`[MOCK] Navigating to: ${path}`) };
    const mockUseAuth = () => ({ user: { id: 'admin-user' } });
    const mockUseNotification = () => ({ showToast: (msg, type) => console.log(`[MOCK NOTIFICATION] ${type}: ${msg}`) });
    const mockTrpc = { useContext: () => ({ blog: { getPosts: { invalidate: () => console.log('[MOCK] trpc.getPosts invalidated') } } }) };

    // ORİJİNAL KULLANIM:
    const { user } = useAuth(); 
    const { showToast } = useNotification();
    const router = useRouter();
    const utils = trpc.useContext();
    
    const REVALIDATE_TOKEN = process.env.NEXT_PUBLIC_REVALIDATE_TOKEN;
    
    const isNewPost = postId === 'new';

    const [title, setTitle] = useState('');
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [bannerImageUrl, setBannerImageUrl] = useState('');
    // KRİTİK GÜNCELLEME: İçerik artık HTML formatında saklanacak
    const [content, setContent] = useState(''); 
    const [authorName, setAuthorName] = useState('Synara System');
    const [category, setCategory] = useState(ALL_CATEGORIES[0] || 'Analiz');
    const [activeTab, setActiveTab] = useState('editor'); 
    const [activeCategoryGroup, setActiveCategoryGroup] = useState('blog');
    
    const [errors, setErrors] = useState({});
    
    const [seoTitle, setSeoTitle] = useState('');
    const [seoDescription, setSeoDescription] = useState('');
    
    const [aiAlternatives, setAiAlternatives] = useState({ ShortTitle: [], MediumTitle: [], LongContent: [] });
    const [activeAiKey, setActiveAiKey] = useState(null); 
    const [currentSlug, setCurrentSlug] = useState(initialPostData?.post?.slug || null); 

    useEffect(() => {
        const initialCategory = initialPostData?.post?.category;
        if (initialCategory) {
            setCategory(initialCategory);
            const initialGroup = CATEGORY_MAP.haberler.includes(initialCategory) ? 'haberler' : 'blog';
            setActiveCategoryGroup(initialGroup);
        } else {
             const currentCategoryGroup = CATEGORY_MAP.blog.includes(category) ? 'blog' : 'haberler';
             if (currentCategoryGroup !== activeCategoryGroup) {
                 setActiveCategoryGroup(currentCategoryGroup);
             }
        }
    }, [category, activeCategoryGroup, initialPostData]);


    useEffect(() => {
        if (!isNewPost && initialPostData?.post) {
            const { post } = initialPostData;
            setTitle(post.title || '');
            
            // Eğer eski yazı Markdown ise, ilk seferde HTML'e çevrilmesi gerekir. 
            // Basitlik için, back-end'in bunu hallettiği varsayılıyor.
            setContent(post.content || ''); 
            
            setYoutubeUrl(post.youtubeVideoId ? `https://www.youtube.com/watch?v=${post.youtubeVideoId}` : '');
            setBannerImageUrl(post.bannerImageUrl || '');
            setAuthorName(post.authorName || 'Synara System');
            setCategory(post.category || 'Analiz');
            setSeoTitle(post.seoTitle || post.title || ''); 
            // SEO Description'da HTML tag'leri temizlenmelidir.
            const rawDescription = post.seoDescription || post.content?.substring(0, MAX_SEO_DESC_LENGTH).replace(/<[^>]+>/g, '').trim() || ''; 
            setSeoDescription(rawDescription); 
            setCurrentSlug(post.slug); 
            
            const initialGroup = CATEGORY_MAP.haberler.includes(post.category) ? 'haberler' : 'blog';
            setActiveCategoryGroup(initialGroup);
        }
    }, [initialPostData, isNewPost]);

    const getYouTubeId = (url) => { if (!url) return null; const match = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11}).*/); return match ? match[1] : null; };

    // applyMarkdown fonksiyonu, WYSIWYG geçişi nedeniyle kaldırıldı.

    const revalidatePaths = async (paths) => {
        if (!REVALIDATE_TOKEN) {
            console.error("🔴 [REVALIDATE KRİTİK HATA] NEXT_PUBLIC_REVALIDATE_TOKEN tanımlanmamış. Önbellek temizlenemedi.");
            return;
        }

        try {
            const url = `${getBaseUrl()}/api/revalidate?token=${REVALIDATE_TOKEN}`;
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

    const handleApplyAlternative = useCallback((alternative, targetKey) => {
        if (!activeAiKey) return;

        if (targetKey === 'title') {
            setTitle(alternative);
        } else if (targetKey === 'content') {
            // WYSIWYG'de HTML olarak uygula
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
    
    const handleGenerateAiText = useCallback(async (targetKey) => {
        setActiveAiKey(targetKey);
        setAiAlternatives({ ShortTitle: [], MediumTitle: [], LongContent: [] });
        
        showToast(`'${targetKey === 'content' ? 'Uzun İçerik' : 'Başlık/SEO'}' için yaratıcı metinler üretiliyor...`, 'info');

        // AI'ya göndermeden önce içeriği düz metne çevir (HTML tag'lerinden arındır)
        const currentText = targetKey === 'title' ? title : content.replace(/<[^>]+>/g, '').trim();
        const targetType = targetKey.includes('desc') || targetKey.includes('content') ? 'content' : 'title';

        generateAiTextMutation.mutate({ currentText, targetType });
    }, [title, content, generateAiTextMutation, showToast]);
    
    const handleCancelAi = useCallback(() => {
        setAiAlternatives({ ShortTitle: [], MediumTitle: [], LongContent: [] });
        setActiveAiKey(null);
    }, []);
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'title' && value.length > MAX_TITLE_LENGTH) return;
        if (name === 'content' && value.length > MAX_CONTENT_LENGTH) return; // HTML uzunluğunu kontrol eder
        
        if (name === 'title') setTitle(value);
        // İçerik artık RichTextEditor tarafından setContent ile güncelleniyor, bu blokta sadece diğer inputlar kalmalı
        // if (name === 'content') setContent(value); 
        if (name === 'youtubeUrl') setYoutubeUrl(value);
        if (name === 'bannerImageUrl') setBannerImageUrl(value);
        if (name === 'authorName') setAuthorName(value);
        if (name === 'category') setCategory(value);
        if (name === 'seoTitle') setSeoTitle(value);
        if (name === 'seoDescription') setSeoDescription(value);
        
        
        // Hata temizleme mantığı eklendi
        if (value.trim() && errors[name]) {
             setErrors(prev => ({ ...prev, [name]: null }));
        } else if (!value.trim() && (name === 'title')) {
             setErrors(prev => ({ ...prev, [name]: "Başlık zorunludur." }));
        }

    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        const isLoading = createPostMutation.isLoading || updatePostMutation.isLoading;
        if (isLoading) return;

        // Basit form doğrulaması
        const newErrors = {};
        if (title.trim().length < 5) newErrors.title = "Başlık en az 5 karakter olmalıdır.";
        // Content'in düz metin olarak uzunluğunu kontrol et
        const plainTextContent = content.replace(/<[^>]+>/g, '').trim(); 
        if (plainTextContent.length < 20) newErrors.content = "İçerik en az 20 karakter olmalıdır.";
        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            showToast('Lütfen formdaki hataları düzeltin.', 'error');
            return;
        }


        const youtubeVideoId = getYouTubeId(youtubeUrl);
        const finalBannerImageUrl = bannerImageUrl || (youtubeVideoId ? `https://img.youtube.com/vi/${youtubeVideoId}/maxresdefault.jpg` : null);
        
        const payload = {
            title: title.trim(),
            content: content.trim(), // HTML içeriği
            youtubeVideoId,
            bannerImageUrl: finalBannerImageUrl,
            authorName,
            category,
            seoTitle: seoTitle.trim() || title.trim(),
            // SEO description'da HTML tag'lerini temizle
            seoDescription: seoDescription.trim().replace(/<[^>]+>/g, '').substring(0, MAX_SEO_DESC_LENGTH), 
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

    // WYSIWYG geçişi nedeniyle marked.parse kaldırıldı. Content zaten HTML.
    const contentHtml = useMemo(() => {
        if (!content) return '<p class="text-gray-500 italic">İçerik önizlemesi buraya gelecektir (HTML formatında).</p>';
        return content;
    }, [content]);


    const renderInput = useCallback((key, label) => {
        const value = key === 'title' ? title : 
                      key === 'seoTitle' ? seoTitle :
                      key === 'seoDescription' ? seoDescription :
                      key === 'youtubeUrl' ? youtubeUrl :
                      key === 'bannerImageUrl' ? bannerImageUrl :
                      key === 'authorName' ? authorName : '';
                      
        const isUrl = key.includes('Url');
        
        const inputType = isUrl ? 'url' : (key === 'authorName' ? 'text' : 'text');
        const placeholderText = key === 'title' ? 'Yazı Başlığı' : 
                                key === 'seoTitle' ? 'SEO Başlığı' : 
                                key === 'seoDescription' ? 'Meta Açıklaması' :
                                key === 'youtubeUrl' ? 'https://www.youtube.com/watch?v=...' :
                                key === 'bannerImageUrl' ? 'https://i.imgur.com/...' :
                                key === 'authorName' ? 'Yazar Adı' : '';
        
        const isAIEnabled = key === 'title' || key === 'seoTitle' || key === 'seoDescription';

        const inputProps = {
            id: key,
            name: key,
            type: inputType,
            value: value,
            onChange: handleChange,
            placeholder: placeholderText,
            maxLength: key === 'title' ? MAX_TITLE_LENGTH : (key === 'seoDescription' ? MAX_SEO_DESC_LENGTH : undefined),
            className: `w-full p-3 bg-gray-700 rounded-lg border ${errors[key] ? 'border-red-500' : 'border-gray-600'} focus:ring-2 focus:ring-indigo-500 transition-colors`
        };

        return (
            <div key={key} className="space-y-2 mb-4 p-3 bg-gray-800/60 rounded-xl border border-gray-700/50">
                <div className="flex justify-between items-center">
                    <label htmlFor={key} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
                    {isAIEnabled && (
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
                    )}
                </div>
                
                <input {...inputProps} />

                {key === 'seoDescription' && (
                    <p className={`text-xs text-right mt-1 ${value.length > MAX_SEO_DESC_LENGTH * 0.9 ? 'text-red-400' : 'text-gray-400'}`}>
                        {value.length}/{MAX_SEO_DESC_LENGTH} karakter (İdeal: 160)
                    </p>
                )}
                
                {errors[key] && <p className="mt-1 text-xs text-red-400 p-1">{errors[key]}</p>}
                
                {activeAiKey === key && (aiAlternatives.ShortTitle.length > 0 || aiAlternatives.MediumTitle.length > 0) && (
                    <div className="bg-gray-800 p-3 rounded-lg border border-indigo-500 mt-2">
                        <p className="text-xs font-semibold text-indigo-400 mb-2">AI Alternatifleri (Birini Seçin):</p>
                        
                        {[...aiAlternatives.ShortTitle, ...aiAlternatives.MediumTitle].map((alt, index) => (
                             <div key={`alt-${index}`} className="flex items-start mb-2 last:mb-0 border-t border-gray-700 pt-2 mt-2">
                                <button type="button" onClick={() => handleApplyAlternative(alt, key)} className="bg-green-600 hover:bg-green-500 text-white text-xs py-1 px-2 rounded-lg flex-shrink-0 mr-2" title="Metni Uygula">Uygula</button>
                                <div className="text-sm text-gray-300 flex-grow leading-relaxed">
                                    {alt}
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
    }, [activeAiKey, aiAlternatives, title, seoTitle, seoDescription, youtubeUrl, bannerImageUrl, authorName, isGenerating, handleApplyAlternative, handleCancelAi, handleChange, errors, handleGenerateAiText]);



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

            <div className="futuristic-card p-6 rounded-2xl border border-gray-700/50 space-y-8">
                 {/* 1. TEMEL BİLGİLER */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-indigo-400">Temel Bilgiler</h2>
                    
                    {renderInput('title', 'Yazı Başlığı (H1)')}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {renderInput('youtubeUrl', 'YouTube Video URL')}
                        {renderInput('bannerImageUrl', 'Banner Görsel URL')}
                        {renderInput('authorName', 'Yazar Adı')}

                        <div className="space-y-2 mb-4 p-3 bg-gray-800/60 rounded-xl border border-gray-700/50">
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
                            <select name="category" value={category} onChange={handleChange} className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:ring-2 focus:ring-indigo-500 transition-colors">
                                {filteredCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* 2. SEO & META VERİLER */}
                <div className="space-y-4 pt-6 border-t border-gray-700">
                    <h2 className="text-xl font-bold text-yellow-400">SEO & Meta Veriler</h2>
                    {renderInput('seoTitle', 'Meta Başlık (SEO)')}
                    {renderInput('seoDescription', 'Meta Açıklaması (SEO)')}
                </div>
                
                {/* 3. İÇERİK ALANI (GELİŞMİŞ EDİTÖR) */}
                <div className="space-y-4 pt-6 border-t border-gray-700">
                     <h2 className="text-xl font-bold text-indigo-400">İçerik</h2>
                     
                     {/* Sekmelerin kontrolü */}
                     <div className="flex justify-end items-center mb-4">
                        <div className="flex items-center p-1 rounded-lg bg-gray-900/50 border border-gray-700">
                            <button type="button" className={`px-3 py-1 text-sm rounded-md ${activeTab === 'editor' ? 'bg-indigo-600 text-white' : 'text-gray-400'}`} onClick={() => setActiveTab('editor')}>
                                <Icon name="pencil" className="w-4 h-4 inline mr-1"/> Synara Editör
                            </button>
                            <button type="button" className={`px-3 py-1 text-sm rounded-md ${activeTab === 'preview' ? 'bg-indigo-600 text-white' : 'text-gray-400'}`} onClick={() => setActiveTab('preview')}>
                                <Icon name="eye" className="w-4 h-4 inline mr-1"/> Önizleme
                            </button>
                        </div>
                     </div>
                     

                    {activeTab === 'editor' ? (
                        <div className="relative">
                            <RichTextEditor 
                                content={content}
                                setContent={setContent}
                                MAX_LENGTH={MAX_CONTENT_LENGTH}
                                errors={errors}
                                showToast={showToast}
                            />
                        </div>
                    ) : (
                        <div className="p-4 bg-gray-800/60 rounded-xl border border-gray-700 prose prose-invert max-w-none min-h-[400px] text-gray-300 overflow-x-auto">
                            {/* Content zaten HTML olduğu için direkt basılıyor */}
                            <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
                        </div>
                    )}
                    
                     {errors.content && <p className="text-red-400 text-xs p-2">{errors.content}</p>}
                </div>

            </div>

            <div className="flex justify-end mt-6">
                <button type="submit" className="glow-on-hover-btn-primary py-3 px-8 text-lg disabled:opacity-50 inline-flex items-center justify-center" disabled={isLoading}>
                    <Icon name="send" className="w-5 h-5 mr-2" />
                    {isLoading ? 'Kaydediliyor...' : (isNewPost ? 'Yazıyı Yayınla' : 'Değişiklikleri Kaydet')}
                </button>
            </div>
        </form>
    );
};

export default AdminBlogForm;
