'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

import { useRouter } from 'next/navigation'; 
import Icon from '@/components/Icon'; 
import { useNotification } from '@/context/NotificationContext'; 
import { useAuth } from '@/context/AuthContext';
import { trpc } from '@/lib/trpc/client';
import { getBaseUrl } from '@/lib/trpc/utils'; 
import { motion, AnimatePresence } from 'framer-motion'; // Animasyonlar için eklendi
import { slugify } from '@/lib/blog-client-utils'; // v1.0.1 - SEO REFACTOR IMPORT

const ALL_CATEGORIES = [
    'Analiz', 'Eğitim', 'Güncelleme', 'Sistem', 
    'Haberler', 'Kripto', 'Makroekonomi', 'Altın', 'Döviz', 'Borsa',
];
const MAX_SEO_DESC_LENGTH = 160;
const MIN_CONTENT_WORD_COUNT = 300; // SEO ve Kalite için yeni kontrol
const MAX_CONTENT_LENGTH = 10000; 
const MAX_TITLE_LENGTH = 100; 
const MIN_TITLE_LENGTH = 10;
const MIN_SEO_DESC_LENGTH = 50;

const CATEGORY_MAP = {
    blog: ['Analiz', 'Eğitim', 'Güncelleme', 'Sistem'],
    haberler: ['Haberler', 'Kripto', 'Makroekonomi', 'Altın', 'Döviz', 'Borsa'],
};

// -----------------------------------------------------------------------
// CORE BİLEŞEN: Rich Text Editor'ün İşlevselliği
// -----------------------------------------------------------------------
const RichTextEditorCore = React.forwardRef(({ content, setContent, MAX_LENGTH, errors, showToast, title, onSave }, ref) => {
// ... (CORE BİLEŞENİNDE DEĞİŞİKLİK YOK)
    const editorRef = useRef(null);
    const [isSourceMode, setIsSourceMode] = useState(false); // Yeni state: HTML Kodu Modu

    // İçerik değişimini yakalama ve state'i güncelleme (contentEditable için)
    const handleInput = useCallback(() => {
        if (editorRef.current) {
            const newHtml = editorRef.current.innerHTML;
            
            // Basit HTML uzunluğu kontrolü
            if (newHtml.length > MAX_LENGTH) {
                showToast('İçerik limiti aşıldı! (HTML etiketleri dahil)', 'warning', 3000);
            }
            
            // Yeni içeriği parent state'e gönder
            setContent(newHtml);
        }
    }, [setContent, MAX_LENGTH, showToast]); // Hata 1 Düzeltmesi: MAX_LENGTH ve showToast eklendi
    
    // Toolbar komutlarını tarayıcının yerel execCommand'i ile yürütme
    const execCommand = useCallback((command, value = null) => {
        if (editorRef.current) {
            document.execCommand(command, false, value);
            // Komut sonrası içeriği güncellemek için handleInput'u çağır
            handleInput(); 
            editorRef.current.focus();
        }
    }, [handleInput]); // Hata 1 Düzeltmesi: handleInput bağımlılığı eklendi

    // Link ekleme modal simülasyonu
    const handleLink = useCallback(() => {
        const url = prompt("Lütfen linkin URL'sini girin:", 'https://');
        if (url) {
            execCommand('createLink', url);
        }
    }, [execCommand]);
    
    // Yazarın kolayca başlık seçebilmesi için menü
    const handleFormatBlock = (value) => {
        execCommand('formatBlock', value);
    };

    // İlk yüklemede ve harici content değiştiğinde editor içeriğini set et
    useEffect(() => {
        if (!isSourceMode && editorRef.current && editorRef.current.innerHTML !== content) {
            editorRef.current.innerHTML = content;
        }
    }, [content, isSourceMode]);
    
    // Kaynak kod modu değiştirildiğinde tetiklenir
    const toggleSourceMode = useCallback(() => {
        if (isSourceMode) {
            // HTML modundan çıkılıyor: textarea içeriğini WYSIWYG'e set et
            // KRİTİK HATA 2 DÜZELTMESİ: isSourceMode=true iken editorRef, <textarea> elementini işaret eder.
            // <textarea> içeriği `.value` ile okunur, `.innerHTML` ile değil.
            const htmlContent = editorRef.current.value; 
            setContent(htmlContent);
            setIsSourceMode(false);
            showToast('HTML kodu kaydedildi ve WYSIWYG moduna geçildi.', 'info', 3000);
        } else {
            // HTML moduna giriliyor: Mevcut HTML içeriğini textarea'ya yükle
            // WYSIWYG modunda editorRef, <div> contentEditable elementini işaret eder.
            // <div> içeriği `.innerHTML` ile okunur.
            const htmlContent = editorRef.current ? editorRef.current.innerHTML : content;
            setContent(htmlContent);
            setIsSourceMode(true);
            showToast('Kaynak kodu modundasınız. HTML etiketlerini doğrudan düzenleyebilirsiniz.', 'warning', 3000);
        }
    }, [isSourceMode, setContent, showToast, content]); // content bağımlılığı eklendi


    const toolbarItems = useMemo(() => [
        { icon: 'bold', command: 'bold', tooltip: 'Kalın (Ctrl+B)' },
        { icon: 'italic', command: 'italic', tooltip: 'İtalik (Ctrl+I)' },
        { icon: 'underline', command: 'underline', tooltip: 'Altı Çizili' },
        { type: 'divider' },
        // Hizalama (İkon İsimleri Düzeltildi)
        { icon: 'align-left', command: 'justifyLeft', tooltip: 'Sola Hizala' },
        { icon: 'align-center', command: 'justifyCenter', tooltip: 'Ortala' },
        { icon: 'align-right', command: 'justifyRight', tooltip: 'Sağa Hizala' },
        { type: 'divider' },
        // Listeler (İkon İsimleri Düzeltildi)
        { icon: 'list', command: 'insertUnorderedList', tooltip: 'Madde İşareti' },
        { icon: 'list-ordered', command: 'insertOrderedList', tooltip: 'Numaralı Liste' },
        { type: 'divider' },
        // Diğer Formatlar (İkon İsimleri Düzeltildi)
        { icon: 'blockquote', command: 'formatBlock', value: 'blockquote', tooltip: 'Blok Alıntı' }, // 'quote' yerine 'blockquote'
        { icon: 'link', command: 'createLink', tooltip: 'Link Ekle', handler: handleLink }, 
        { type: 'divider' },
        // Undo/Redo
        { icon: 'undo', command: 'undo', tooltip: 'Geri Al' },
        { icon: 'redo', command: 'redo', tooltip: 'Yinele' },
    ], [handleLink]);


    return (
        <div className={`flex flex-col w-full h-full`}>
            {/* Toolbar Alanı */}
            <div className="flex flex-wrap p-2 bg-gray-700/80 border-b border-gray-600 gap-1.5 flex-shrink-0">
                 {/* Başlık Dropdown */}
                 <select 
                    onChange={(e) => handleFormatBlock(e.target.value)} 
                    className={`bg-gray-800 text-gray-300 text-sm font-semibold p-1.5 rounded-lg border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${isSourceMode ? 'opacity-50 pointer-events-none' : ''}`}
                    defaultValue="default"
                    disabled={isSourceMode}
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
                            className={`text-white p-1.5 rounded-lg transition-colors text-sm font-semibold h-9 w-9 flex items-center justify-center 
                                ${isSourceMode ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-600/50'}`}
                            title={item.tooltip}
                            disabled={isSourceMode}
                        >
                            <Icon name={item.icon} className="w-4 h-4" />
                        </button>
                    )
                ))}
                
                {/* KRİTİK EKLENTİ: HTML Kaynak Kodu Butonu (FİKİR 2) */}
                 <button
                    type="button"
                    onClick={toggleSourceMode}
                    className={`bg-gray-600 hover:bg-gray-500 text-white font-bold py-1.5 px-3 rounded-lg transition-colors inline-flex items-center ml-auto ${isSourceMode ? 'ring-2 ring-yellow-500' : ''}`}
                    title="HTML Kaynak Kodu Görünümü"
                 >
                    <Icon name="code" className="w-5 h-5 mr-1" /> {isSourceMode ? 'WYSIWYG Modu' : 'Kaynak Kodu'}
                 </button>

                 <button
                    type="button"
                    onClick={onSave}
                    className="bg-green-600 hover:bg-green-500 text-white font-bold py-1.5 px-3 rounded-lg transition-colors inline-flex items-center"
                    title="Değişiklikleri Kaydet ve Kapat"
                 >
                    <Icon name="check" className="w-5 h-5 mr-1" /> Kaydet & Kapat
                 </button>
            </div>

            {/* Content Alanı: Mod'a göre değişir */}
            {isSourceMode ? (
                 /* Kaynak Kodu Modu */
                 <textarea
                    ref={editorRef} // Hata 2 Düzeltmesi: Textarea'ya ref atandı
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full p-4 bg-gray-700/50 text-yellow-300 font-mono text-sm min-h-0 flex-grow outline-none rounded-b-xl focus:outline-none overflow-y-auto resize-none"
                 />
            ) : (
                 /* WYSIWYG Modu */
                <div
                    ref={editorRef}
                    contentEditable="true"
                    onInput={handleInput}
                    onPaste={(e) => {
                        e.preventDefault();
                        const text = (e.clipboardData || window.clipboardData).getData('text/plain');
                        document.execCommand('insertHTML', false, text);
                        handleInput(); 
                        // ESLint Hata Düzeltmesi: ' -> &apos;
                        showToast('Dış metin sadece düz metin olarak yapıştırıldı (Format bozukluğunu önlemek için).', 'info', 3000);
                    }}
                    className={`w-full p-4 bg-gray-700/50 text-white min-h-0 flex-grow outline-none rounded-b-xl 
                        prose prose-invert max-w-none focus:outline-none overflow-y-auto`}
                    suppressContentEditableWarning={true}
                >
                    {/* İçerik, useEffect ile set ediliyor */}
                </div>
            )}
            
            <div className="p-2 border-t border-gray-800 text-xs text-gray-500 flex justify-between flex-shrink-0">
                <span className={`font-semibold ${errors.content ? 'text-red-400' : 'text-indigo-400'}`}>
                    {title} İçeriği
                </span>
                <span>{isSourceMode ? 'HTML Uzunluğu' : 'Metin Uzunluğu (Yaklaşık)'}: {content.length}/{MAX_LENGTH} karakter</span>
            </div>
        </div>
    );
});
RichTextEditorCore.displayName = 'RichTextEditorCore';


// -----------------------------------------------------------------------
// YENİ BİLEŞEN: Tam Ekran Modal (Drawer Simülasyonu)
// -----------------------------------------------------------------------
const FullScreenEditorModal = ({ content, setContent, MAX_LENGTH, errors, showToast, isVisible, onClose, postTitle }) => {
// ... (MODAL BİLEŞENİNDE DEĞİŞİKLİK YOK)
    
    // ESC tuşuna basıldığında kapatma işlevi
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Escape') {
            onClose();
        }
    }, [onClose]);

    useEffect(() => {
        if (isVisible) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        } else {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'auto';
        }
        return () => {
             document.removeEventListener('keydown', handleKeyDown);
             document.body.style.overflow = 'auto';
        };
    }, [isVisible, handleKeyDown]);
    
    // Kaydet ve Kapat düğmesi, onClose ile aynı işlemi yapar
    const handleSaveAndClose = () => {
        onClose();
        showToast('İçerik taslak olarak saklandı. Ana formdan kaydetmeyi unutmayın!', 'info', 4000);
    };


    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-gray-950/95 backdrop-blur-md z-[1000] p-4 flex flex-col"
                >
                    <motion.div
                         initial={{ y: "100%" }}
                         animate={{ y: 0 }}
                         exit={{ y: "100%" }}
                         transition={{ type: "spring", stiffness: 100, damping: 20 }}
                         className="flex flex-col w-full h-full min-h-screen-safe bg-gray-900 rounded-xl shadow-2xl border-2 border-indigo-500/70 overflow-hidden"
                    >
                        <header className="flex-shrink-0 p-4 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
                            <h1 className="text-xl font-extrabold text-white flex items-center">
                                <Icon name="boxes" className="w-6 h-6 mr-2 text-indigo-400"/>
                                {/* KRİTİK HATA 3 DÜZELTMESİ: Başlık öğesinin kapanış etiketi eklendi */}
                                <span className="text-indigo-400 truncate max-w-[300px] mr-2">{postTitle}</span>
                                <span className="ml-2 text-indigo-300 font-mono">Synara &apos;HAN&apos; Editör</span> {/* ESLint Düzeltmesi: ' -> &apos; */}
                            </h1>
                             <button 
                                 onClick={handleSaveAndClose} 
                                 className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-lg transition-colors inline-flex items-center"
                                 title="Değişiklikleri Kaydetmeden Çık"
                             >
                                <Icon name="x" className="w-5 h-5 mr-1" /> Editörden Çık
                            </button>
                        </header>

                        <div className="flex-grow min-h-0 p-4">
                            <RichTextEditorCore
                                content={content}
                                setContent={setContent}
                                MAX_LENGTH={MAX_CONTENT_LENGTH}
                                errors={errors}
                                showToast={showToast}
                                title={postTitle}
                                onSave={handleSaveAndClose}
                            />
                        </div>

                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};


// -----------------------------------------------------------------------
// YENİ BİLEŞEN: Yayın Protokolü Kontrol Paneli (FİKİR 1)
// -----------------------------------------------------------------------
const PublishQA = ({ title, seoDescription, content, bannerImageUrl, youtubeUrl, category, T, slug }) => { // v1.0.1 - slug eklendi
// ... (PUBLISH QA BİLEŞENİNDE DEĞİŞİKLİK YOK, SADECE YENİ KONTROL)
    
    // HTML'den etiketleri temizle ve kelime sayısını hesapla
    const cleanContent = content.replace(/<[^>]+>/g, '').trim();
    const wordCount = cleanContent.split(/\s+/).filter(word => word.length > 0).length;

    const checks = useMemo(() => [
        { 
            label: 'Başlık Uzunluğu', 
            status: title.length >= MIN_TITLE_LENGTH && title.length <= MAX_TITLE_LENGTH, 
            tip: `(${title.length}/${MAX_TITLE_LENGTH}) İdeal: ${MIN_TITLE_LENGTH}-${MAX_TITLE_LENGTH} karakter.` 
        },
        // v1.0.1 - SEO REFACTOR: Slug kontrolü eklendi
        { 
            label: 'Yazı URL (Slug)', 
            status: slug && slug.length >= 5, 
            tip: `(${slug ? slug.length : 0} karakter) URL en az 5 karakter olmalı.` 
        },
        { 
            label: 'Meta Açıklaması', 
            status: seoDescription.length >= MIN_SEO_DESC_LENGTH && seoDescription.length <= MAX_SEO_DESC_LENGTH, 
            tip: `(${seoDescription.length}/${MAX_SEO_DESC_LENGTH}) İdeal: ${MIN_SEO_DESC_LENGTH}-${MAX_SEO_DESC_LENGTH} karakter.` 
        },
        { 
            label: 'İçerik Kelime Sayısı', 
            status: wordCount >= MIN_CONTENT_WORD_COUNT, 
            tip: `(${wordCount} kelime) SEO için minimum ${MIN_CONTENT_WORD_COUNT} kelime önerilir.` 
        },
        { 
            label: 'Kategori Seçimi', 
            status: ALL_CATEGORIES.includes(category), 
            tip: `Seçili: ${category}` 
        },
        { 
            label: 'Banner/Video Görseli', 
            status: !!bannerImageUrl || !!youtubeUrl, 
            tip: `Yazı başlığını zenginleştirmek için bir görsel veya video gereklidir.` 
        },
    ], [title, seoDescription, wordCount, category, bannerImageUrl, youtubeUrl, slug]); // v1.0.1 - slug eklendi

    const completedChecks = checks.filter(c => c.status).length;
    const totalChecks = checks.length;
    const score = Math.round((completedChecks / totalChecks) * 100);

    const progressColor = score === 100 ? 'bg-green-500' : (score >= 60 ? 'bg-yellow-500' : 'bg-red-500');

    return (
        <div className="p-4 bg-gray-800/60 rounded-xl border border-gray-700/50 sticky top-4 h-fit">
            <h3 className="text-lg font-extrabold text-white mb-4 flex items-center">
                 <Icon name="clipboard-check" className="w-5 h-5 mr-2 text-indigo-400"/>
                 Yayın Protokolü Kontrolü
            </h3>

            {/* Skor Çubuğu */}
            <div className="mb-4">
                <div className="flex justify-between items-center text-sm font-semibold mb-1">
                    <span className="text-gray-400">Hazırlık Puanı</span>
                    <span className={`text-white p-1 rounded-md text-xs font-mono ${progressColor}`}>{score}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div className={`h-2.5 rounded-full transition-all duration-500 ${progressColor}`} style={{ width: `${score}%` }}></div>
                </div>
            </div>

            {/* Kontrol Listesi */}
            <ul className="space-y-3">
                {checks.map((check, index) => (
                    <li key={index} className="flex items-start text-sm">
                        <Icon 
                            name={check.status ? 'check-circle' : 'x-circle'} 
                            className={`w-5 h-5 mt-0.5 mr-2 flex-shrink-0 ${check.status ? 'text-green-400' : 'text-red-400'}`}
                        />
                        <div className="flex flex-col">
                            <span className={`font-medium ${check.status ? 'text-gray-300' : 'text-gray-400'}`}>
                                {check.label}
                            </span>
                            <span className="text-xs text-gray-500 mt-0.5">{check.tip}</span>
                        </div>
                    </li>
                ))}
            </ul>
            
            {score < 100 && (
                <p className="mt-4 text-xs text-yellow-400 font-semibold border-t border-gray-700 pt-3">
                    Yüksek SEO ve okuyucu deneyimi için %100 puana ulaşılması önerilir.
                </p>
            )}
        </div>
    );
}

// -----------------------------------------------------------------------
// AdminBlogForm (Ana Component)
// -----------------------------------------------------------------------
const AdminBlogForm = ({ postId, initialPostData, T }) => {
    // ORİJİNAL KULLANIM:
    const { user } = useAuth(); 
    const { showToast } = useNotification();
    const router = useRouter();
    const utils = trpc.useContext();
    
    const REVALIDATE_TOKEN = process.env.NEXT_PUBLIC_REVALIDATE_TOKEN;
    
    const isNewPost = postId === 'new';

    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState(''); // v1.0.1 - SEO REFACTOR STATE
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [bannerImageUrl, setBannerImageUrl] = useState('');
    const [content, setContent] = useState(''); 
    const [authorName, setAuthorName] = useState('Synara System');
    const [category, setCategory] = useState(ALL_CATEGORIES[0] || 'Analiz');
    const [activeCategoryGroup, setActiveCategoryGroup] = useState('blog');
    
    const [errors, setErrors] = useState({});
    
    const [seoTitle, setSeoTitle] = useState('');
    const [seoDescription, setSeoDescription] = useState('');
    
    const [aiAlternatives, setAiAlternatives] = useState({ ShortTitle: [], MediumTitle: [], LongContent: [] });
    const [activeAiKey, setActiveAiKey] = useState(null); 
    const [currentSlug, setCurrentSlug] = useState(initialPostData?.post?.slug || null); 
    
    // Tam Ekran Editörü Yönetme
    const [isEditorOpen, setIsEditorOpen] = useState(false); 


    // --- KALDIRILAN BLOK: Çakışmaya neden olan gereksiz useEffect ---
    /*
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
    */
    // -----------------------------------------------------------------


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
            const rawDescription = post.seoDescription || post.content?.substring(0, MAX_SEO_DESC_LENGTH).replace(/<[^>]+>/g, '').trim() || ''; 
            setSeoDescription(rawDescription); 
            setCurrentSlug(post.slug); 
            setSlug(post.slug || ''); // v1.0.1 - SEO REFACTOR: Mevcut slug'ı state'e yükle
            
            const initialGroup = CATEGORY_MAP.haberler.includes(post.category) ? 'haberler' : 'blog';
            setActiveCategoryGroup(initialGroup);
        }
    }, [initialPostData, isNewPost]);

    const getYouTubeId = (url) => { if (!url) return null; const match = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11}).*/); return match ? match[1] : null; };

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
            // v1.0.1 - REFACTOR: slug'ı `data.slug`'dan al
            await revalidatePaths(['/blog', `/blog/${newSlug}`]); 
            utils.blog.getPosts.invalidate();
            router.push(`/admin/blog-editor/${data.postId || data.id}`); // data.postId veya data.id
        },
        onError: (error) => {
            showToast(`Yazı oluşturulurken hata: ${error.message}`, 'error');
        },
    });
    
    const updatePostMutation = trpc.blog.updatePost.useMutation({
        onSuccess: async (data) => { // v1.0.1 - data'yı al
            showToast('Yazı başarıyla güncellendi.', 'success');
            
            // v1.0.1 - REFACTOR: Dataload'dan gelen yeni slug'ı (veya eskisini) kullan
            const updatedSlug = data.slug || currentSlug;
            
            if (updatedSlug) {
                 await revalidatePaths(['/blog', `/blog/${updatedSlug}`]);
            }
            
            utils.blog.getPostById.invalidate({ postId });
            utils.blog.getPosts.invalidate();
            
            // v1.0.1 - REFACTOR: Slug değişmiş olabileceğinden state'i güncelle
            if (data.slug) {
                setSlug(data.slug);
                setCurrentSlug(data.slug);
            }
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
            // v1.0.1 - REFACTOR: AI'dan başlık gelirse slug'ı da güncelle (sadece yeni postta)
            if (isNewPost) {
                setSlug(slugify(alternative));
            }
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
    }, [activeAiKey, showToast, isNewPost]); // v1.0.1 - isNewPost eklendi
    
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
    
    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        
        if (name === 'title' && value.length > MAX_TITLE_LENGTH) return;
        if (name === 'content' && value.length > MAX_CONTENT_LENGTH) return;
        
        if (name === 'title') {
            setTitle(value);
            // v1.0.1 - SEO REFACTOR: Başlık değiştiğinde slug'ı GÜNCELLE (Sadece yeni post ise)
            if (isNewPost) {
                setSlug(slugify(value));
            }
        }
        if (name === 'slug') {
            // v1.0.1 - SEO REFACTOR: Manuel slug düzenlemesine (sadece mevcut postta) izin ver, ama onu da slugify et
            if (!isNewPost) {
                setSlug(slugify(value));
            }
        }
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

    }, [errors, setErrors, isNewPost]); // v1.0.1 - isNewPost eklendi


    const handleSubmit = async (e) => {
        e.preventDefault();
        const isLoading = createPostMutation.isLoading || updatePostMutation.isLoading;
        if (isLoading) return;

        // Basit form doğrulaması
        const newErrors = {};
        if (title.trim().length < 5) newErrors.title = "Başlık en az 5 karakter olmalıdır.";
        // v1.0.1 - SEO REFACTOR: Slug validasyonu
        if (slug.trim().length < 5) newErrors.slug = "URL (Slug) en az 5 karakter olmalıdır (Başlıktan üretilir).";
        
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
            content: content.trim(), 
            youtubeVideoId,
            bannerImageUrl: finalBannerImageUrl,
            authorName,
            category,
            seoTitle: seoTitle.trim() || title.trim(),
            seoDescription: seoDescription.trim().replace(/<[^>]+>/g, '').substring(0, MAX_SEO_DESC_LENGTH), 
            slug: slug.trim(), // v1.0.1 - SEO REFACTOR: Slug payload'a eklendi
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
                            disabled={isGenerating && activeAiKey === key}
                        >
                            {isGenerating && activeAiKey === key ? 'Üretiliyor...' : (
                                <>AI ile Yaz</>
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
                     {/* KRİTİK FİX: Önizleme butonu korundu */}
                    <button type="button" className={`px-3 py-1 text-sm rounded-md ${!isEditorOpen ? 'bg-indigo-600 text-white' : 'text-gray-400'}`} onClick={() => setIsEditorOpen(false)}>
                        Önizleme
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                 {/* SOL KOLON: Form Alanları ve İçerik */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="futuristic-card p-6 rounded-2xl border border-gray-700/50 space-y-8">
                        {/* 1. TEMEL BİLGİLER */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-indigo-400">Temel Bilgiler</h2>
                            
                            {renderInput('title', 'Yazı Başlığı (H1)')}

                            {/* v1.0.1 - SEO SLUG EKLENTİSİ */}
                            <div className="space-y-2 mb-4 p-3 bg-gray-900/80 rounded-xl border border-gray-700/50">
                                <label htmlFor="slug" className="block text-sm font-medium text-gray-300 mb-1">
                                    Yazı URL (Slug)
                                </label>
                                <div className="relative">
                                    <input
                                        id="slug"
                                        name="slug"
                                        type="text"
                                        value={slug}
                                        onChange={handleChange} // Manuel düzenlemeye izin ver (slugify handleChange içinde)
                                        placeholder="URL, başlıktan otomatik üretilecek..."
                                        className={`w-full p-3 bg-gray-700 rounded-lg border ${errors.slug ? 'border-red-500' : 'border-gray-600'} focus:ring-2 focus:ring-indigo-500 transition-colors pl-10`}
                                        readOnly={isNewPost} // Yeni postlarda başlığa kilitli (readOnly)
                                    />
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Icon name={isNewPost ? 'lock' : 'edit-3'} className="w-5 h-5 text-gray-400" />
                                    </div>
                                </div>
                                {errors.slug && <p className="mt-1 text-xs text-red-400 p-1">{errors.slug}</p>}
                                <p className="text-xs text-gray-500 mt-1">
                                    {isNewPost ? 'Başlıktan otomatik oluşturulur.' : 'SEO için bu alanı değiştirmemeye özen gösterin.'}
                                </p>
                            </div>
                            {/* SLUG EKLENTİSİ SONU */}

                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {renderInput('youtubeUrl', 'YouTube Video URL')}
                                {renderInput('bannerImageUrl', 'Banner Görsel URL')}
                                {renderInput('authorName', 'Yazar Adı')}

                                <div className="space-y-2 mb-4 p-3 bg-gray-800/60 rounded-xl border border-gray-700/50">
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Kategori Grubu</label>
                                    <div className="flex bg-gray-700 rounded-lg p-1 space-x-1 mb-2">
                                        <button
                                            type="button"
                                            // NİHAİ KRİTİK FİX: activeGroup'u ve ilk kategoriyi zorla ayarla!
                                            onClick={() => { 
                                                setActiveCategoryGroup('blog'); 
                                                // Doğrudan atama, useEffect gecikmesini ortadan kaldırır.
                                                setCategory(CATEGORY_MAP.blog[0]); 
                                            }}
                                            className={`flex-1 py-2 px-3 text-sm font-semibold rounded-lg transition-colors ${activeCategoryGroup === 'blog' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-600'}`}
                                        >
                                            Blog & Analiz
                                        </button>
                                        <button
                                            type="button"
                                            // NİHAİ KRİTİK FİX: activeGroup'u ve ilk kategoriyi zorla ayarla!
                                            onClick={() => { 
                                                setActiveCategoryGroup('haberler'); 
                                                // Doğrudan atama, useEffect gecikmesini ortadan kaldırır.
                                                setCategory(CATEGORY_MAP.haberler[0]); 
                                            }}
                                            className={`flex-1 py-2 px-3 text-sm font-semibold rounded-lg transition-colors ${activeCategoryGroup === 'haberler' ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-gray-600'}`}
                                        >
                                            Haberler & Piyasa
                                        </button>
                                    </div>
                                    
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Kategori (Blog/Haber)</label>
                                    <select 
                                        key={activeCategoryGroup} // KRİTİK FİX: activeCategoryGroup değiştiğinde SELECT'i yeniden oluştur!
                                        name="category" 
                                        value={category} 
                                        onChange={handleChange} 
                                        className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:ring-2 focus:ring-indigo-500 transition-colors"
                                    >
                                        {/* KRİTİK: filteredCategories, activeGroup'a göre değişir. */}
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
                        
                        {/* 3. İÇERİK ALANI (FULL SCREEN MODU) */}
                        <div className="space-y-4 pt-6 border-t border-gray-700">
                             <h2 className="text-xl font-bold text-indigo-400">İçerik</h2>
                             
                             <div className="space-y-4">
                                 {/* KRİTİK EKLENTİ: Tam Ekran Editör Butonu */}
                                <button 
                                    type="button" 
                                    onClick={() => setIsEditorOpen(true)} 
                                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-lg transition-colors inline-flex items-center justify-center shadow-lg shadow-indigo-900/50 transform hover:scale-[1.005]"
                                >
                                    {/* KRİTİK HATA 4 DÜZELTMESİ: Editör buton metni düzeltildi */}
                                    İçeriği Synara Editörle Düzenle
                                </button>
                                
                                {/* HIZLI ÖNİZLEME (Aktif İçerik) */}
                                <div className="p-4 bg-gray-800/60 rounded-xl border border-gray-700 prose prose-invert max-w-none min-h-[150px] max-h-[300px] overflow-hidden text-gray-300 relative">
                                     <div className="absolute inset-0 bg-gradient-to-t from-gray-800/90 to-transparent pointer-events-none"></div>
                                     <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
                                </div>
                                
                                 {errors.content && <p className="text-red-400 text-xs p-2">{errors.content}</p>}
                             </div>
                        </div>
                    </div>

                    <div className="flex justify-end mt-6">
                        <button type="submit" className="glow-on-hover-btn-primary py-3 px-8 text-lg disabled:opacity-50 inline-flex items-center justify-center" disabled={isLoading}>
                            <Icon name="send" className="w-5 h-5 mr-2" />
                            {isLoading ? 'Kaydediliyor...' : (isNewPost ? 'Yazıyı Yayınla' : 'Değişiklikleri Kaydet')}
                        </button>
                    </div>
                </div>

                {/* SAĞ KOLON: QA Kontrol Paneli (FİKİR 1) */}
                <div className="lg:col-span-1">
                    <PublishQA
                        title={title}
                        seoDescription={seoDescription}
                        content={content}
                        bannerImageUrl={bannerImageUrl}
                        youtubeUrl={youtubeUrl}
                        category={category}
                        T={T}
                        slug={slug} // v1.0.1 - QA paneline slug gönderildi
                    />
                </div>
            </div>
            
            
            {/* Tam Ekran Editör Modalı */}
            <FullScreenEditorModal 
                content={content}
                setContent={setContent}
                MAX_LENGTH={MAX_CONTENT_LENGTH}
                errors={errors}
                showToast={showToast}
                isVisible={isEditorOpen}
                onClose={() => setIsEditorOpen(false)}
                postTitle={title || 'Yeni Blog İçeriği'}
            />
        </form>
    );
};

export default AdminBlogForm;