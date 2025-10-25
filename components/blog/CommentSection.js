// path: components/blog/CommentSection.js
'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext'; 
import { useNotification } from '@/context/NotificationContext';
import { trpc } from '@/lib/trpc/client';
import Icon from '@/components/Icon';
import Link from 'next/link';

const CommentSection = ({ postId, initialComments, T }) => {
    const { user, userData, isAdmin } = useAuth(); 
    const { showAlert, showConfirm } = useNotification();
    const utils = trpc.useContext(); // tRPC context'i

    // Yorumları artık `initialComments` prop'undan state'e alıyoruz.
    const [comments, setComments] = useState(initialComments); 
    const [newComment, setNewComment] = useState('');
    
    // YENİ YORUMU ANINDA GÖRÜNTÜLEME İÇİN OPTIMISTIC UPDATE
    const addCommentMutation = trpc.blog.addComment.useMutation({
        onSuccess: (data) => {
            // Yorum başarıyla gönderildi. Yorumu doğrudan state'e ekleyerek anında gösteriyoruz.
            // ÖNEMLİ: Eğer backend (tRPC) yeni yorum objesini tam olarak (ID, authorName, createdAt) döndürüyorsa,
            // direkt data.newComment kullanılmalıdır. Burada varsayımsal bir nesne oluşturulmuştur:
            
            const newCommentObject = data.newComment || {
                // Backend'in döndürdüğü gerçek ID kullanılmalı, yoksa geçici ID oluşturulur
                id: data.newComment?.id || Date.now().toString(), 
                postId: postId,
                text: newComment.trim(),
                authorId: user.uid,
                // Kullanıcı adını güncel Auth Context'ten çekiyoruz
                authorName: userData?.displayName || 'Synara Üyesi', 
                createdAt: data.newComment?.createdAt || new Date().toISOString(),
            };

            // Anında state güncellemesi: Yeni yorumu listenin başına ekliyoruz
            setComments(prevComments => [newCommentObject, ...prevComments]); 
            
            showAlert(T?.comment_success || "Yorum başarıyla gönderildi.", 'success');
            
            // Arka planda tam veriyi çekmek için sorguyu geçersiz kılıyoruz (senkronizasyon için)
            // Bu, geçici ID kullanıldıysa, gerçek ID ile güncellenmesini sağlar.
            utils.blog.getPostBySlug.invalidate({ slug: postId }); 
            setNewComment('');
        },
        onError: (error) => showAlert(error.message, 'error'),
    });

    const deleteCommentMutation = trpc.blog.deleteComment.useMutation({
        onSuccess: () => {
            showAlert('Yorum başarıyla silindi.', 'success');
            // Silinen yorumu anında state'ten kaldırıyoruz
            setComments(prevComments => prevComments.filter(c => c.id !== deleteCommentMutation.variables.commentId));
            utils.blog.getPostBySlug.invalidate();
        },
        onError: (error) => showAlert(error.message, 'error'),
    });

    const handleSubmitComment = async (e) => {
        e.preventDefault();
        if (!user) { showAlert(T?.comment_login_required || "Yorum yapmak için giriş yapmalısınız.", 'error'); return; }
        if (newComment.trim().length < 3) { showAlert(T?.comment_too_short || "Yorum en az 3 karakter olmalıdır.", 'error'); return; }
        
        addCommentMutation.mutate({ postId, text: newComment.trim() });
    };
    
    const handleDeleteComment = (commentId) => {
        showConfirm(
            "Bu yorumu silmek istediğinizden emin misiniz?",
            () => deleteCommentMutation.mutate({ postId, commentId }),
            { confirmButtonType: 'destructive' }
        );
    };

    return (
        <div id="comments" className="mt-12 pt-8 border-t border-gray-700">
            {/* KRİTİK DÜZELTME: Başlık çeviriden çekildi */}
            <h3 className="text-2xl font-bold text-white mb-6">{T?.blog_comments_title || "Yorumlar"} ({comments.length})</h3>
            
            {user ? (
                <form onSubmit={handleSubmitComment} className="mb-10 p-6 bg-gray-800 rounded-xl border border-gray-700/50">
                    <textarea 
                        value={newComment} 
                        onChange={(e) => setNewComment(e.target.value)} 
                        placeholder={T?.comment_placeholder || "Yorumunuzu buraya yazın..."} 
                        className="w-full p-3 bg-gray-700/50 text-gray-200 rounded-lg border border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-y" 
                        rows="4" 
                        disabled={addCommentMutation.isLoading} 
                    />
                    <button 
                        type="submit" 
                        className={`w-full mt-4 font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-[1.005] shadow-lg ${
                            addCommentMutation.isLoading 
                            ? 'bg-indigo-900/50 text-indigo-300 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/50'
                        }`}
                        disabled={addCommentMutation.isLoading}
                    >
                        {addCommentMutation.isLoading ? (
                            <span className="flex items-center justify-center">
                                <Icon name="loader-2" className="w-5 h-5 mr-2 animate-spin" />
                                {T?.comment_sending || "Gönderiliyor..."}
                            </span>
                        ) : (
                            T?.comment_send_button || "Yorumu Gönder"
                        )}
                    </button>
                </form>
            ) : (
                <div className="text-center p-6 bg-gray-800 rounded-xl border border-indigo-500/50 mb-8">
                    <p className="text-gray-300 text-lg font-semibold">{T?.comment_login_prompt || "Yorumunuzu sisteme eklemek ve Synara topluluğuna katılmak için lütfen giriş yapın."}</p>
                    <Link href="/login" className="mt-4 inline-flex items-center bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                        <Icon name="log-in" className="w-5 h-5 mr-2" />
                        Giriş Yap
                    </Link>
                </div>
            )}

            <div className="space-y-6">
                {comments.map(comment => (
                    <div key={comment.id} className="flex items-start space-x-4 p-4 bg-gray-800 rounded-xl border border-gray-700">
                        <div className="w-10 h-10 rounded-full bg-indigo-600/20 flex items-center justify-center font-bold text-indigo-400 shrink-0 text-lg shadow-inner shadow-indigo-500/20">
                            {comment.authorName?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div className="flex-grow">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-semibold text-white text-base">{comment.authorName}</span>
                                <div className="flex items-center space-x-2">
                                    {(isAdmin || user?.uid === comment.authorId) && (
                                        <button 
                                            onClick={() => handleDeleteComment(comment.id)} 
                                            className="text-gray-500 hover:text-red-400 transition-colors" 
                                            disabled={deleteCommentMutation.isLoading} 
                                            aria-label="Sil"
                                        >
                                            <Icon name="trash-2" className="w-4 h-4"/>
                                        </button>
                                    )}
                                    <span className="text-xs text-gray-500">{new Date(comment.createdAt).toLocaleDateString('tr-TR', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                </div>
                            </div>
                            <p className="text-gray-300 leading-relaxed">{comment.text}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CommentSection;
