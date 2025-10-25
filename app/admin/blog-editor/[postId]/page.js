// path: app/admin/blog-editor/[postId]/page.js

'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/Icon';
import dynamic from 'next/dynamic';
import { useAuth } from '@/context/AuthContext';
import { trpc } from '@/lib/trpc/client';
import { useRequiredAuth } from '@/hooks/useRequiredAuth';

// KRİTİK DÜZELTME: dynamic import'u daha güvenli hale getiriyoruz.
// ChunkLoadError (http://localhost:3000/_next/undefined) genellikle dynamic import path'inin
// hatalı çözümlenmesinden kaynaklanır. 'loading' fonksiyonunu sadeleştiriyoruz.
const AdminBlogForm = dynamic(() => import('@/components/AdminBlogForm'), {
    ssr: false, // Client-side Only
    loading: () => <div className="p-8 h-96 bg-gray-800/50 rounded-2xl animate-pulse flex items-center justify-center">Editör Protokolü Yükleniyor...</div>
});

const AdminBlogEditor = () => { 
    const { T, isAdmin, user } = useAuth(); // T'yi çekiyoruz
    const params = useParams();
    const postId = (Array.isArray(params.postId) ? params.postId[0] : params.postId)?.trim() || 'new';
    
    // Yetki kontrolü
    const { loading: authReqLoading } = useRequiredAuth({ requireLogin: true, requireAdmin: true });
    
    const isNewPost = postId === 'new';
    
    // Mevcut post verisini çek
    const { data: postData, isLoading: postLoading, error } = trpc.blog.getPostById.useQuery(
        { postId: postId },
        { 
            enabled: !isNewPost && isAdmin && !authReqLoading,
            staleTime: Infinity, 
            retry: false,
        } 
    );

    if (!T || Object.keys(T).length === 0) {
        return null;
    }

    if (authReqLoading || !isAdmin || (!isNewPost && postLoading)) {
        return <div className="min-h-screen bg-gray-900 text-white flex justify-center items-center"><p>{T.admin_title || 'Yönetici Paneli'} Yükleniyor...</p></div>;
    }
    
    if (error) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex flex-col justify-center items-center p-4">
                <Icon name="alert-triangle" className="w-16 h-16 text-red-500 mx-auto mb-6" />
                <h1 className="text-3xl font-bold text-red-400 mb-4">{T?.blog_not_found_admin || "Analiz Belgesi Sistemde Bulunamadı."}</h1>
                <p className="text-gray-400 mb-8">{T?.blog_not_found_admin_desc || "Aradığınız yazı kimliği geçersiz veya silinmiş olabilir. Lütfen tüm yazılar listesini kontrol edin."}</p>
                <Link href="/admin/blog-editor" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                    Tüm Yazılara Dön
                </Link>
            </div>
        );
    }
    
    const postExists = postData?.post || isNewPost;
    
    if (!postExists) {
         return (
             <div className="min-h-screen bg-gray-900 text-white flex flex-col justify-center items-center p-4">
                <Icon name="alert-triangle" className="w-16 h-16 text-red-500 mx-auto mb-6" />
                <h1 className="text-3xl font-bold text-red-400 mb-4">Hata: Geçersiz Belge Kimliği</h1>
                <p className="text-gray-400 mb-8">Düzenlemeye çalıştığınız yazıya ait geçerli bir veri bulunamadı.</p>
                <Link href="/admin/blog-editor" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                    Tüm Yazılara Dön
                </Link>
            </div>
         );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
            <div className="container mx-auto max-w-4xl">
                 <div className="mb-8 flex justify-between items-center">
                    <Link href="/admin/blog-editor" className="text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center">
                        <Icon name="arrow-left" className="w-4 h-4 mr-2" />
                        Tüm Yazılara Dön
                    </Link>
                    <Link href="/admin" className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors inline-flex items-center">
                            Admin Paneline Dön
                    </Link>
                </div>
                
                {/* KRİTİK DÜZELTME: T çeviri objesi AdminBlogForm'a prop olarak aktarılıyor. */}
                <AdminBlogForm postId={postId} initialPostData={postData} T={T} /> 
            </div>
        </div>
    );
};

export default AdminBlogEditor;
