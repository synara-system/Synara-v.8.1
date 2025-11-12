// path: components/blog/BlogInteractions.js
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import Icon from '@/components/Icon';
import { trpc } from '@/lib/trpc/client';
import { useNotification } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';
import BlogShareButtons from '@/components/BlogShareButtons'; 
import CommentSection from './CommentSection'; 


// YENİ: HIM Modül Durumu Kartı Bileşeni (Yeniden Kullanıldı)
const HimModuleStatusCard = ({ title, statusData }) => {
    return (
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 space-y-3">
            <h3 className="text-sm font-bold text-indigo-400 border-b border-gray-700/50 pb-2">{title}</h3>
            {statusData.map((item, i) => {
                const isPositive = item.trend === '▲' || item.status === 'Aktif';
                const trendColor = item.trend === '▲' ? 'text-green-400' : item.trend === '▼' ? 'text-red-400' : 'text-gray-400';
                
                return (
                    <div key={i} className="flex justify-between items-center text-xs font-mono">
                        <span className="text-gray-400">{item.name}</span>
                        <div className="flex items-center space-x-2">
                             <span className="text-white font-semibold">{item.value}</span>
                             {item.trend && <span className={`font-bold ${trendColor}`}>{item.trend}</span>}
                        </div>
                    </div>
                );
            })}
             <div className="pt-2 border-t border-gray-700/50">
                 <p className="text-xs text-indigo-400">Vizyon Protokolü:</p>
                 <p className="text-xs text-gray-500 mt-1">Disiplin, duyguya üstün gelir. (Simüle Veri)</p>
             </div>
        </div>
    );
};

// KRİTİK BİLEŞEN: Etkileşimleri Yönetir.
const BlogInteractions = ({ postId, postSlug, initialLikes, initialComments, T, postTitle, initialHasLiked }) => { 
    const { showAlert } = useNotification(); 
    const { user } = useAuth();
    const utils = trpc.useContext();
    
    const [likes, setLikes] = useState(initialLikes || 0);
    // KRİTİK FİX: initialHasLiked durumunu yönetmek için state
    const [hasLiked, setHasLiked] = useState(initialHasLiked || false); 
    const [comments, setComments] = useState(initialComments || []);
    
    const himStatusData = useMemo(() => [
        { name: 'Nexus (Yapı)', trend: '▲', value: '5:1.85', status: 'Aktif' },
        { name: 'Metis (Makro)', trend: '▲', value: '5:0.72', status: 'Aktif' },
        { name: 'RSI-HAN (Momentum)', trend: '▼', value: '5:0.51', status: 'Aktif' },
        { name: 'Visuals (Uyum)', trend: '▲', value: '5:0.68', status: 'Aktif' },
        { name: 'Engine (Karar)', trend: '---', value: '5:0.95', status: 'Aktif' },
    ], []);


    // KRİTİK FİX: useQuery'den gelen veriyi state'lerle senkronize et
    const { data: liveData } = trpc.blog.getPostBySlug.useQuery(
        { slug: postSlug },
        {
            enabled: !!postSlug,
            refetchInterval: 30000, 
            staleTime: 30000,
            onSuccess: (data) => {
                if (data?.comments && JSON.stringify(data.comments) !== JSON.stringify(comments)) {
                    setComments(data.comments);
                }
                if (data?.post?.likes !== undefined && data.post.likes !== likes) {
                    setLikes(data.post.likes);
                }
                // KRİTİK FİX: Canlı beğenme durumunu güncelle
                if (data?.hasLiked !== undefined) {
                    setHasLiked(data.hasLiked);
                }
            }
        }
    );

    const likePostMutation = trpc.blog.likePost.useMutation({
        onMutate: async () => {
            // Optimistik güncelleme
            setLikes(prev => prev + 1);
            setHasLiked(true);
        },
        onError: (err) => {
            // Optimistik güncellemeyi geri al
            setLikes(prev => prev - 1);
            setHasLiked(false);
            
            // Hatanın kaynağı zaten beğenilmiş olması olabilir (tRPC router'dan gelen BAD_REQUEST).
            // Bu yüzden toast mesajını buna göre göster.
            const errorMessage = err.message.includes('Bad request') 
                ? 'Bu yazıyı zaten beğendiniz. Disiplin protokolü ihlali.' 
                : err.message;

            showAlert(errorMessage, 'error');
        },
        onSettled: () => {
            // Veriyi tekrar çekerek senkronizasyonu tamamla
            utils.blog.getPostBySlug.invalidate({ slug: postSlug });
        },
    });

    const handleLike = async () => {
        if (!user) {
            showAlert('Beğenmek için oturum açmalısınız.', 'error');
            return;
        }
        // KRİTİK FİX: hasLiked state'i kontrol ediliyor
        if (hasLiked || likePostMutation.isLoading) return; 
        
        likePostMutation.mutate({ postId });
    };

    const isUserLoggedIn = !!user;
    
    // YENİ: Beğenme düğmesinin pasif olma durumu
    const isLikeButtonDisabled = !isUserLoggedIn || hasLiked || likePostMutation.isLoading;

    const sharePostData = { id: postId, slug: postSlug, title: postTitle };

    return (
        <>
            <div className="lg:col-span-1 lg:sticky lg:top-24 h-fit space-y-6 order-2 lg:order-1">
                
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 space-y-3">
                    <h3 className="text-sm font-bold text-white border-b border-gray-700/50 pb-2">Etkileşim Metrikleri</h3>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm font-semibold">
                         <div className="flex items-center text-gray-400"><Icon name="heart" className="w-4 h-4 mr-2" /> <span>{T?.likes_count || "Beğeni"}:</span></div>
                         <span className="text-right text-white">{likes}</span>
                    </div>
                    
                     <div className="grid grid-cols-2 gap-3 text-sm font-semibold">
                         <div className="flex items-center text-gray-400"><Icon name="message-square" className="w-4 h-4 mr-2" /> <span>{T?.comments_count || "Yorum"}:</span></div>
                         <span className="text-right text-white">{comments.length}</span>
                    </div>

                    <button 
                        onClick={handleLike} 
                        // KRİTİK FİX: Pasif olma durumu kontrol ediliyor
                        disabled={isLikeButtonDisabled} 
                        className={`w-full flex items-center justify-center space-x-2 font-bold py-2 rounded-lg transition-all duration-300 transform hover:scale-[1.01] shadow-lg
                            ${!isUserLoggedIn 
                                ? 'bg-gray-700 text-gray-500 cursor-not-allowed border-dashed border-2 border-gray-600'
                                : hasLiked 
                                ? 'bg-green-700/50 text-green-400 cursor-default border border-green-500/50'
                                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/50'
                            }`}
                        title={!isUserLoggedIn ? "Oturum Açın" : (hasLiked ? "Zaten Onayladınız (1 Limit)" : "Yazıyı Beğen")}
                    >
                        <Icon name="heart" className={`w-5 h-5 ${hasLiked ? 'fill-current' : ''}`} />
                        <span>{hasLiked ? 'Onaylandı' : (isUserLoggedIn ? 'Bu yazıyı beğen' : 'Oturum Açın')}</span>
                    </button>
                    
                </div>
                
                <HimModuleStatusCard 
                    title="HIM Modül Durumu (Canlı Simülasyon)"
                    statusData={himStatusData}
                />
                
                 <div className="bg-indigo-900/30 p-4 rounded-xl border border-indigo-500/50 shadow-2xl shadow-indigo-900/30 space-y-3">
                     <Icon name="activity" className="w-8 h-8 text-indigo-400 mb-2"/>
                     <h3 className="text-xl font-extrabold text-white leading-tight">{T.hero_title_part1}</h3>
                     <h3 className="text-2xl font-extrabold text-white leading-tight"><span className="text-indigo-400">TEK BİR KARARA</span> İndir.</h3>
                     <p className="text-xs text-gray-400">{T.hero_subtitle_new}</p>
                 </div>


            </div>

            <div className="lg:col-span-2 order-3 lg:order-2 space-y-6">
                
                 <div className="pt-8 flex flex-col sm:flex-row justify-between items-start">
                    <div className="mb-4 sm:mb-0">
                        <p className="text-sm font-semibold text-gray-400 text-center sm:text-left">{T?.share_this_analysis || "Bu yazıyı paylaş:"}</p>
                    </div>
                    <div className="w-full sm:w-auto">
                        <BlogShareButtons post={sharePostData} T={T} showAlert={showAlert} />
                    </div>
                </div>

                <CommentSection postId={postId} initialComments={comments} T={T} />
            </div>
        </>
    );
};

export default BlogInteractions;
