// path: app/analyses/[analysisId]/AnalysesClient.jsx
'use client';

import React, { useState, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/Icon';
import { useAuth } from '@/context/AuthContext';
import { trpc } from '@/lib/trpc/client';
import { marked } from 'marked';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '@/context/NotificationContext';
import { getBaseUrl } from '@/lib/trpc/utils';
import Image from 'next/image'; // next/image import edildi

// TradingView URL'sini gömülebilir formata veya resim URL'sine çeviren yardımcı fonksiyon
const getUrlInfo = (url) => {
    if (!url) return null;

    try {
        const urlObject = new URL(url);

        const snapshotMatch = urlObject.pathname.match(/^\/x\/([a-zA-Z0-9]+)/);
        if (snapshotMatch && snapshotMatch[1]) {
            const id = snapshotMatch[1];
            const firstLetter = id.charAt(0).toLowerCase();
            return {
                type: 'image',
                src: `https://s3.tradingview.com/snapshots/${firstLetter}/${id}.png`
            };
        }

        if (urlObject.pathname.startsWith('/chart/')) {
            // KRİTİK DÜZELTME: TradingView embed iframe'leri için gerekli parametreler eklendi
            const embedUrl = urlObject.toString().replace('/chart/', '/embed/');
            const finalEmbedUrl = `${embedUrl}?symboledit=1&toolbarbg=f1f3f6&studies_overrides={}&overrides={}&enabled_features={}&disabled_features={}&locale=tr&utm_source=synarasystem.com&utm_medium=widget&utm_campaign=chart&utm_term=`;

            return {
                type: 'iframe',
                src: finalEmbedUrl
            };
        }
    } catch (e) {
        return { type: 'invalid' };
    }

    return { type: 'invalid' };
};

// Resim büyütme ve yakınlaştırma modal bileşeni
const ImageModal = ({ src, alt, onClose }) => {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [startDrag, setStartDrag] = useState({ x: 0, y: 0 });
    const imageRef = useRef(null);

    // Mobil cihazlar için dokunma olayları eklendi.
    const handleTouchStart = (e) => {
        if (scale <= 1) return;
        if (e.touches.length === 1) {
            e.preventDefault();
            setIsDragging(true);
            setStartDrag({ x: e.touches[0].clientX - position.x, y: e.touches[0].clientY - position.y });
        }
    };

    const handleTouchMove = (e) => {
        if (!isDragging || scale <= 1 || e.touches.length !== 1) return;
        e.preventDefault();
        setPosition({
            x: e.touches[0].clientX - startDrag.x,
            y: e.touches[0].clientY - startDrag.y
        });
    };

    const handleTouchEnd = () => setIsDragging(false);


    const handleWheel = (e) => {
        if (!imageRef.current) return;
        e.preventDefault();

        const delta = e.deltaY * -0.005;
        const newScale = Math.min(Math.max(1, scale + delta), 5);

        const rect = imageRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const newX = position.x + (mouseX - position.x) * (1 - newScale / scale);
        const newY = position.y + (mouseY - position.y) * (1 - newScale / scale);

        setScale(newScale);
        if (newScale > 1) {
            setPosition({ x: newX, y: newY });
        } else {
            setPosition({ x: 0, y: 0 });
        }
    };

    const handleMouseDown = (e) => {
        if (scale <= 1) return;
        e.preventDefault();
        setIsDragging(true);
        setStartDrag({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const handleMouseMove = (e) => {
        if (!isDragging || scale <= 1) return;
        e.preventDefault();
        setPosition({
            x: e.clientX - startDrag.x,
            y: e.clientY - startDrag.y
        });
    };

    const handleMouseUp = () => setIsDragging(false);
    const handleMouseLeave = () => setIsDragging(false);

    const zoom = useCallback((direction) => {
        const newScale = Math.min(Math.max(1, scale * direction), 5);
        setScale(newScale);
        if (newScale <= 1) {
            setPosition({ x: 0, y: 0 });
        }
    }, [scale]);

    const resetZoom = useCallback(() => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
            onWheel={handleWheel}
        >
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                onClick={(e) => e.stopPropagation()}
                className="relative max-w-screen-lg max-h-[90vh] w-full h-full flex items-center justify-center cursor-grab"
                ref={imageRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                // KRİTİK İYİLEŞTİRME: Mobil Touch olayları eklendi
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{ cursor: isDragging ? 'grabbing' : (scale > 1 ? 'grab' : 'default') }}
            >
                <Image
                    src={src}
                    alt={alt}
                    layout="fill"
                    objectFit="contain"
                    className="max-w-full max-h-full rounded-lg shadow-2xl transition-transform"
                    style={{ transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`, touchAction: 'none' }}
                />
                <button
                    onClick={onClose}
                    className="absolute -top-3 -right-3 bg-gray-800 rounded-full p-2 text-white hover:bg-red-500 transition-colors z-10"
                    aria-label="Kapat"
                >
                    <Icon name="x" className="w-5 h-5" />
                </button>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-800/80 p-2 rounded-full flex items-center gap-2 border border-gray-700">
                    <button onClick={() => zoom(0.8)} className="p-2 rounded-full hover:bg-gray-700 disabled:opacity-50" disabled={scale <= 1}><Icon name="zoom-out" className="w-5 h-5"/></button>
                    <button onClick={resetZoom} className="p-2 rounded-full hover:bg-gray-700 disabled:opacity-50" disabled={scale <= 1}><Icon name="search" className="w-5 h-5"/></button>
                    <button onClick={() => zoom(1.2)} className="p-2 rounded-full hover:bg-gray-700 disabled:opacity-50" disabled={scale >= 5}><Icon name="zoom-in" className="w-5 h-5"/></button>
                </div>
            </motion.div>
        </motion.div>
    );
};

// Puanlama Yıldızları Bileşeni
const StarRating = ({ rating, onRate, disabled }) => {
    const [hoverRating, setHoverRating] = useState(0);

    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <Icon
                    key={star}
                    name="star"
                    onClick={() => !disabled && onRate(star)}
                    onMouseEnter={() => !disabled && setHoverRating(star)}
                    onMouseLeave={() => !disabled && setHoverRating(0)}
                    className={`w-6 h-6 transition-colors ${
                        (hoverRating || rating) >= star
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-600'
                    } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                />
            ))}
        </div>
    );
};

// Yorum Bölümü Bileşeni
const CommentSection = ({ analysisId, initialComments, T }) => {
    const { user, userData, isAdmin } = useAuth(); // userData eklendi
    const { showAlert, showConfirm } = useNotification();
    const utils = trpc.useContext();
    const [newComment, setNewComment] = useState('');

    const addCommentMutation = trpc.analysis.addComment.useMutation({
        onSuccess: (data) => {
            // Yorum başarıyla gönderildiğinde anlık güncelleme yapılıyor.
            showAlert("Yorumunuz başarıyla eklendi.", 'success');

            const newCommentObject = data.newComment || {
                id: data.newComment?.id || Date.now().toString(),
                postId: analysisId,
                text: newComment.trim(),
                authorId: user.uid,
                authorName: userData?.displayName || user.email?.split('@')[0] || 'Synara Üyesi',
                createdAt: data.newComment?.createdAt || new Date().toISOString(),
            };

            utils.analysis.getAnalysisById.invalidate({ analysisId });
            setNewComment('');
        },
        onError: (error) => showAlert(error.message, 'error'),
    });

    const deleteCommentMutation = trpc.analysis.deleteComment.useMutation({
        onSuccess: () => {
            showAlert("Yorum başarıyla silindi.", "success");
            utils.analysis.getAnalysisById.invalidate({ analysisId });
        },
        onError: (error) => showAlert(error.message, "error"),
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!user) {
            showAlert(T.analysis_login_to_comment, 'error');
            return;
        }
        if (newComment.trim().length < 3) {
             showAlert("Yorum içeriği çok kısa.", 'error');
             return;
        }
        addCommentMutation.mutate({ analysisId, text: newComment.trim() });
    };

    const handleDelete = (commentId) => {
        showConfirm(
            "Bu yorumu kalıcı olarak silmek istediğinizden emin misiniz?",
            () => deleteCommentMutation.mutate({ analysisId, commentId }),
            { confirmButtonType: 'destructive' }
        );
    };

    return (
        <section id="comments" className="mt-12">
            <h2 className="text-2xl font-bold mb-6">{T.analysis_comments_title} ({initialComments.length})</h2>
            <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
                {user ? (
                    <form onSubmit={handleSubmit} className="mb-8">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Analiz hakkındaki düşüncelerinizi paylaşın..."
                            className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-y"
                            rows="3"
                            disabled={addCommentMutation.isLoading}
                        />
                        <button type="submit" disabled={addCommentMutation.isLoading || newComment.trim().length < 3} className="mt-4 bg-indigo-600 hover:bg-indigo-500 font-bold py-2 px-6 rounded-lg disabled:opacity-50">
                            {addCommentMutation.isLoading ? "Gönderiliyor..." : "Yorum Yap"}
                        </button>
                    </form>
                ) : (
                    <p className="text-center text-gray-500 mb-6">{T.analysis_login_to_comment}</p>
                )}

                <div className="space-y-6">
                    {initialComments.map(comment => (
                        <div key={comment.id} className="flex items-start space-x-4">
                            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center font-bold text-indigo-400 shrink-0">
                                {comment.authorName?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div className="flex-grow bg-gray-900/50 p-4 rounded-lg">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-semibold text-white">{comment.authorName}</span>
                                    <div className="flex items-center space-x-2">
                                        {(isAdmin || user?.uid === comment.authorId) && (
                                            <button onClick={() => handleDelete(comment.id)} disabled={deleteCommentMutation.isLoading} className="text-gray-500 hover:text-red-400 transition-colors">
                                                <Icon name="trash-2" className="w-4 h-4" />
                                            </button>
                                        )}
                                        <span className="text-xs text-gray-500">{new Date(comment.createdAt).toLocaleDateString('tr-TR')}</span>
                                    </div>
                                </div>
                                <p className="text-gray-300 whitespace-pre-wrap">{comment.text}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// YENİ BİLEŞEN: Analiz Bilgi Kartları (Yazar, Tarih, Görüntülenme)
const AnalysisInfoCard = ({ analysis, T, isOwner, isAdmin, handleDelete, deleteAnalysisMutation, urlInfo }) => {

    // YENİ: TradingView URL'sinin tipine göre ikon belirleme
    const chartTypeIcon = urlInfo?.type === 'iframe'
        ? { name: 'layout-grid', color: 'text-sky-400' }
        : { name: 'image', color: 'text-amber-400' };

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 pt-4 border-t border-gray-700">
            {/* 1. Yazar ve Tarih */}
            <div className="p-3 bg-gray-900/50 rounded-xl border border-gray-700/50">
                <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Analist & Yayın</p>
                <p className="text-white font-bold">{analysis.authorName}</p>
                <p className="text-xs text-gray-500">{new Date(analysis.createdAt).toLocaleDateString('tr-TR')}</p>
            </div>

            {/* 2. Görüntülenme Sayısı */}
            <div className="p-3 bg-gray-900/50 rounded-xl border border-gray-700/50 flex items-center">
                 <Icon name="eye" className="w-6 h-6 text-indigo-400 mr-3 flex-shrink-0" />
                 <div>
                    <p className="text-xs text-gray-400 uppercase font-semibold">Görüntülenme</p>
                    <p className="text-white font-bold">{analysis.viewCount.toLocaleString()}</p>
                 </div>
            </div>

            {/* 3. TradingView Tipi */}
            <div className="p-3 bg-gray-900/50 rounded-xl border border-gray-700/50 flex items-center">
                 <Icon name={chartTypeIcon.name} className={`w-6 h-6 ${chartTypeIcon.color} mr-3 flex-shrink-0`} />
                 <div>
                    <p className="text-xs text-gray-400 uppercase font-semibold">TV Tipi</p>
                    <p className="text-white font-bold">{urlInfo?.type === 'iframe' ? 'Canlı Grafik' : 'Snapshot'}</p>
                 </div>
            </div>

            {/* 4. Yönetim Butonları */}
            {(isOwner || isAdmin) && (
                <div className="flex items-center gap-2">
                    <Link href={`/analyses/edit/${analysis.id}`} className="flex-grow bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-lg transition-colors text-sm font-bold flex items-center justify-center" title="Düzenle">
                        <Icon name="pencil" className="w-4 h-4 mr-2" /> Düzenle
                    </Link>
                    <button onClick={handleDelete} disabled={deleteAnalysisMutation.isLoading} className="bg-red-600 hover:bg-red-500 text-white p-3 rounded-lg transition-colors disabled:opacity-50 text-sm font-bold" title="Sil">
                        <Icon name="trash-2" className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
};


// Analiz Detay Sayfası
const AnalysisDetailPage = ({ analysisId }) => { // analysisId prop olarak geliyor
    const { T, loading: authLoading, user, isAdmin } = useAuth();
    const router = useRouter();
    const { showAlert, showConfirm } = useNotification();
    const utils = trpc.useContext();
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);

    const { data, isLoading, error } = trpc.analysis.getAnalysisById.useQuery(
        { analysisId },
        { enabled: !!analysisId }
    );

    const rateAnalysisMutation = trpc.analysis.rateAnalysis.useMutation({
        onSuccess: () => {
            showAlert("Puanınız için teşekkürler!", 'success');
            utils.analysis.getAnalysisById.invalidate({ analysisId });
            utils.analysis.getAnalyses.invalidate(); // Ana sayfadaki listeyi de güncelle
        },
        onError: (error) => {
            showAlert(error.message, 'error');
        }
    });

    const generateAiCommentaryMutation = trpc.analysis.generateAiCommentary.useMutation({
        onSuccess: () => {
            showAlert('Yapay zeka değerlendirmesi başarıyla oluşturuldu ve kaydedildi.', 'success');
            utils.analysis.getAnalysisById.invalidate({ analysisId });
        },
        onError: (error) => {
            showAlert(`Yapay zeka değerlendirmesi oluşturulamadı: ${error.message}`, 'error');
        }
    });

    // YENİ MUTASYON: AI Yorumunu Silme
    const deleteAiCommentaryMutation = trpc.analysis.deleteAiCommentary.useMutation({
        onSuccess: () => {
            showAlert('Yapay zeka değerlendirmesi başarıyla silindi.', 'success');
            utils.analysis.getAnalysisById.invalidate({ analysisId });
        },
        onError: (error) => {
            showAlert(`AI yorumu silinirken hata oluştu: ${error.message}`, 'error');
        }
    });

    const handleRate = (rating) => {
        if (!user) {
            showAlert(T.analysis_login_to_rate, 'error');
            return;
        }
        rateAnalysisMutation.mutate({ analysisId, rating });
    };

    const handleGenerateAiCommentary = () => {
        showConfirm(
            analysis?.aiCommentary ? 'Mevcut AI yorumu silinip yeni yorum oluşturulacaktır. Emin misiniz?' : T.analysis_generate_ai_confirm || "Bu analiz için bir yapay zeka değerlendirmesi oluşturmak istiyor musunuz?",
            () => {
                generateAiCommentaryMutation.mutate({ analysisId });
            },
            { title: 'Yapay Zeka Değerlendirmesi Onayı' }
        );
    };

    // YENİ HANDLER: AI Yorumunu Silme
    const handleDeleteAiCommentary = () => {
         showConfirm(
            "Oluşturulan Yapay Zeka yorumunu kalıcı olarak silmek istediğinizden emin misiniz?",
            () => {
                deleteAiCommentaryMutation.mutate({ analysisId });
            },
            { title: 'AI Yorumu Silme Onayı', confirmButtonType: 'destructive' }
        );
    }

    const analysis = data?.analysis;
    const comments = data?.comments || [];
    const isOwner = user && user.uid === analysis?.authorId;

    const deleteAnalysisMutation = trpc.analysis.deleteAnalysis.useMutation({
        onSuccess: () => {
            showAlert('Analiz başarıyla silindi.', 'success');
            utils.analysis.getAnalyses.invalidate();
            router.push('/analyses');
        },
        onError: (error) => {
            showAlert(`Silme hatası: ${error.message}`, 'error');
        }
    });

    const handleDelete = () => {
        if (!analysis) return;
        showConfirm(
            `"${analysis.title}" başlıklı analizi kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`,
            () => {
                deleteAnalysisMutation.mutate({ analysisId: analysis.id });
            },
            {
                title: 'Analizi Silme Onayı',
                confirmButtonType: 'destructive'
            }
        );
    };

    const urlInfo = useMemo(() => getUrlInfo(analysis?.tradingViewChartUrl), [analysis?.tradingViewChartUrl]);
    // KRİTİK İYİLEŞTİRME: Markdown renderına tablo stilini eklemek için render yapısı güncellendi.
    const contentHtml = useMemo(() => {
        if (!analysis?.content) return '';
        // Markdown'ı HTML'e çevir
        const html = marked.parse(analysis.content);
        // HTML'deki tüm table etiketlerini saracak ek div'ler ekle (CSS için)
        // Bu, genel CSS'teki tablo stilini uygulamamızı sağlar.
        return html.replace(/<table/g, '<div class="table-wrapper"><table class="w-full text-left table-auto">').replace(/<\/table>/g, '</table></div>');
    }, [analysis?.content]);


    if (isLoading || authLoading || !T) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex flex-col justify-center items-center p-4">
                <div className="loader"></div>
                <p className="mt-4 text-lg">Analiz Yükleniyor...</p>
            </div>
        );
    }

    if (error || !analysis) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex flex-col justify-center items-center p-4">
                <Icon name="alert-triangle" className="w-12 h-12 text-red-400" />
                <p className="mt-4 text-lg text-red-300">{error ? error.message : "Analiz bulunamadı."}</p>
                <Link href="/analyses" className="mt-6 text-sm text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center">
                    <Icon name="arrow-left" className="w-4 h-4 mr-2" />
                    Analiz Portalına Geri Dön
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#111827] text-white p-4 md:p-8">
            {/* KRİTİK: Holografik arka plan efektleri eklendi */}
            <div className="absolute inset-0 bg-grid-indigo-500/10 bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_at_center,transparent_0%,black_100%)]"></div>
            <div className="absolute inset-0" style={{
                background: 'radial-gradient(ellipse at center, rgba(79, 70, 229, 0.1) 0%, rgba(17, 24, 39, 0) 70%)'
            }}></div>

            <div className="container mx-auto max-w-4xl relative z-10">
                 <div className="mb-8">
                    <Link href="/analyses" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center">
                        <Icon name="arrow-left" className="w-4 h-4 mr-2" />
                        Tüm Analizlere Geri Dön
                    </Link>
                </div>

                <article className="bg-gray-800/90 backdrop-blur-sm p-8 rounded-2xl border border-gray-700 shadow-2xl shadow-black/50">
                    <header className="pb-6 mb-6">
                        <div className="flex justify-between items-start mb-3">
                            <h1 className="text-3xl md:text-4xl font-bold text-white flex-grow pr-4">{analysis.title}</h1>
                            {/* Yönetim butonları AnalysisInfoCard içine taşındı, sadece yer tutucu kaldırıldı */}
                        </div>

                        {/* YENİ: Bilgi Kartları ve Yönetim Butonları */}
                        <AnalysisInfoCard
                            analysis={analysis}
                            T={T}
                            isOwner={isOwner}
                            isAdmin={isAdmin}
                            handleDelete={handleDelete}
                            deleteAnalysisMutation={deleteAnalysisMutation}
                            urlInfo={urlInfo}
                        />

                        {/* Puanlama ve Derecelendirme */}
                        <div className="mt-6 pt-4 border-t border-gray-700">
                            <div className="bg-gray-900/50 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-4 border border-indigo-700/50">
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-2 flex items-center"><Icon name="star" className="w-5 h-5 mr-2 text-yellow-400"/> {T.analysis_rating_title}</h3>
                                    <p className="text-xs text-gray-400 max-w-xs mb-2 sm:mb-0">Bu analizin kalitesini topluluğa göstermek için 1-5 arası puan verin.</p>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <StarRating
                                        rating={analysis.rating.average}
                                        onRate={handleRate}
                                        disabled={!user || isOwner || rateAnalysisMutation.isLoading}
                                    />
                                    <span className="text-xs text-gray-500">{analysis.rating.count} {T.analysis_rating_count}</span>
                                </div>
                            </div>
                        </div>

                        {isAdmin && (
                            <div className="mt-4 border-t border-gray-700 pt-4">
                                {/* AI Yorumunu Silme/Sıfırlama Butonu */}
                                <div className='flex gap-4'>
                                    {analysis.aiCommentary && (
                                        <button
                                            onClick={handleDeleteAiCommentary}
                                            disabled={deleteAiCommentaryMutation.isLoading || generateAiCommentaryMutation.isLoading}
                                            className="flex-grow bg-red-700/50 hover:bg-red-600/70 text-red-300 font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
                                        >
                                            <Icon name="trash-2" className="w-4 h-4"/>
                                            AI Yorumunu Sil
                                        </button>
                                    )}
                                    <button
                                        onClick={handleGenerateAiCommentary}
                                        disabled={generateAiCommentaryMutation.isLoading || deleteAiCommentaryMutation.isLoading}
                                        className={`flex-grow ${analysis.aiCommentary ? 'bg-yellow-600 hover:bg-yellow-500 text-gray-900' : 'bg-green-600 hover:bg-green-500 text-white'} font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2`}
                                    >
                                        <Icon name="zap" className="w-5 h-5"/>
                                        {generateAiCommentaryMutation.isLoading ? (T.analysis_generating_ai || 'Oluşturuluyor...') : (analysis.aiCommentary ? 'Yorumu Yenile' : (T.analysis_generate_ai_commentary || 'AI Değerlendirmesi Oluştur'))}
                                    </button>
                                </div>
                            </div>
                        )}
                    </header>

                    {analysis.aiCommentary && (
                        // KRİTİK GÖRSEL İYİLEŞTİRME: AI yorumuna fütüristik stil
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="my-6 bg-indigo-900/50 p-6 rounded-2xl border border-indigo-500/70 shadow-2xl shadow-indigo-900/50"
                        >
                            <h4 className="flex items-center gap-2 text-lg font-extrabold text-sky-400 mb-3 border-b border-indigo-500/50 pb-2">
                                <Icon name="cpu" className="w-5 h-5 text-yellow-400"/>
                                {T.analysis_ai_take || "Synara Yapay Zeka Değerlendirmesi"}
                            </h4>
                            <p className="text-base text-gray-200 leading-relaxed italic">{analysis.aiCommentary}</p>
                             {analysis.aiCommentaryGeneratedAt && (
                                 <p className="text-xs text-gray-500 text-right mt-3 pt-2 border-t border-gray-700/50">
                                     Oluşturulma: {new Date(analysis.aiCommentaryGeneratedAt).toLocaleString('tr-TR')}
                                </p>
                             )}
                        </motion.div>
                    )}

                    {urlInfo && urlInfo.type !== 'invalid' && (
                        <div className="mb-6">
                            {urlInfo.type === 'iframe' && ( <div className="h-96"><iframe title="TradingView Chart" src={urlInfo.src} className="w-full h-full rounded-lg" frameBorder="0" allowTransparency={true} scrolling="no"></iframe></div> )}
                            {urlInfo.type === 'image' && ( <div onClick={() => setIsImageModalOpen(true)} className="relative group block cursor-zoom-in"><Image src={urlInfo.src} alt="TradingView Anlık Görüntüsü" width={1200} height={600} className="w-full h-auto rounded-lg border border-gray-700" /><div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"><Icon name="zoom-in" className="w-12 h-12 text-white" /><p className="text-white text-sm mt-2 bg-black/70 px-3 py-1 rounded">Görüntüyü Büyüt</p></div></div> )}
                        </div>
                    )}

                    {/* KRİTİK İYİLEŞTİRME: Markdown içeriği. Genel CSS'teki stil kullanılır. */}
                    <div className="prose prose-invert max-w-none text-gray-300" dangerouslySetInnerHTML={{ __html: contentHtml }} />
                </article>

                <CommentSection analysisId={analysis.id} initialComments={comments} T={T} />
            </div>

            <AnimatePresence>
                {isImageModalOpen && urlInfo?.type === 'image' && (
                    <ImageModal src={urlInfo.src} alt={analysis.title} onClose={() => setIsImageModalOpen(false)} />
                )}
            </AnimatePresence>
        </div>
    );
};

export default AnalysisDetailPage;
