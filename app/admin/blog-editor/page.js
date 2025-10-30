// path: app/admin/blog-editor/page.js

'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Icon from '@/components/Icon';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { trpc } from '@/lib/trpc/client';
import { useRequiredAuth } from '@/hooks/useRequiredAuth';

// YARDIMCI BİLEŞEN: Tek bir postun silme butonunu yönetir
const DeleteButton = ({ onClick, disabled }) => (
    <button onClick={onClick} disabled={disabled} className="bg-gray-700 hover:bg-red-600/70 text-gray-400 hover:text-white text-sm font-bold p-2.5 rounded-full transition-colors w-9 h-9 flex items-center justify-center flex-shrink-0 disabled:opacity-50" aria-label="Yazıyı Sil">
        <Icon name="trash-2" className="w-4 h-4" />
    </button>
);


const AdminBlogEditorIndexPage = () => {
    const { T, isAdmin } = useAuth();
    const { showAlert, showConfirm } = useNotification();
    useRequiredAuth({ requireLogin: true, requireAdmin: true });
    const router = useRouter();
    const utils = trpc.useContext();

    // YENİ STATE: Arama sorgusu
    const [searchQuery, setSearchQuery] = useState('');

    const { data: postsData, isLoading: postsLoading, error: fetchError } = trpc.blog.getPosts.useQuery(undefined, {
        enabled: isAdmin,
        staleTime: 60000,
    });

    // UYARI DÜZELTMESİ: 'allPosts' useMemo içine alındı.
    const filteredPosts = useMemo(() => {
        const allPosts = postsData || [];
        if (!searchQuery) return allPosts;
        const query = searchQuery.toLowerCase();
        return allPosts.filter(p =>
            p.title?.toLowerCase().includes(query) ||
            p.slug?.toLowerCase().includes(query) ||
            p.category?.toLowerCase().includes(query) ||
            p.authorName?.toLowerCase().includes(query)
        );
    }, [postsData, searchQuery]);


    const deletePostMutation = trpc.blog.deletePost.useMutation({
        onSuccess: (data) => {
            // KRİTİK: ISR önbellek temizleme çağrısı
            const pathsToRevalidate = ['/blog', `/blog/${data.slug}`];
            fetch('/api/revalidate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paths: pathsToRevalidate }),
            }).then(() => {
                 showAlert('Yazı başarıyla silindi ve önbellek temizlendi.', 'success');
                 utils.blog.getPosts.invalidate();
            });
        },
        onError: (error) => showAlert('Silme sırasında hata oluştu: ' + error.message, 'error'),
    });

    const handleDeleteClick = (post) => {
        showConfirm(
            `"${post.title}" başlıklı yazıyı kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`,
            () => deletePostMutation.mutate({ postId: post.id, slug: post.slug }),
            {
                title: 'Blog Yazısını Silme Onayı',
                confirmButtonType: 'destructive'
            }
        );
    };

    const handleCreatePost = () => {
        router.push(`/admin/blog-editor/new`);
    }

    const getCategoryStyle = (category) => {
        switch (category) {
            case 'Eğitim': return 'bg-blue-500/20 text-blue-300';
            case 'Güncelleme': return 'bg-green-500/20 text-green-300';
            case 'Analiz':
            default: return 'bg-indigo-500/20 text-indigo-300';
        }
    };

    if (!T || postsLoading) {
        return <div className="min-h-screen bg-gray-900 text-white flex justify-center items-center"><p>Yönetici Paneli Yükleniyor...</p></div>;
    }

    if (fetchError) {
        return <div className="min-h-screen bg-gray-900 text-white flex justify-center items-center"><p className="text-red-400">Veri Yükleme Hatası: {fetchError.message}</p></div>;
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1
        }
    };

    const adminLinkCls = "bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors inline-flex items-center hover:shadow-lg hover:border-gray-500/50";

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
            <div className="container mx-auto max-w-6xl">
                 <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold">Blog Yazılarını Yönet</h1>
                    <div className="flex space-x-4">
                        <Link href="/admin" className={adminLinkCls}>
                             <Icon name="arrow-left" className="w-4 h-4 mr-2" />
                            Admin Paneline Dön
                        </Link>
                         <button onClick={handleCreatePost} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg transition-colors inline-flex items-center shadow-md shadow-indigo-900/50" disabled={deletePostMutation.isLoading}>
                            <Icon name="plus" className="w-4 h-4 mr-2" />
                            Yeni Yazı Oluştur
                        </button>
                    </div>
                </div>

                {/* YENİ: Arama Çubuğu */}
                <div className="mb-6">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Yazı Ara (Başlık, Kategori, Yazar)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full p-3 pl-10 bg-gray-700 rounded-lg border border-gray-600 focus:ring-2 focus:ring-indigo-500 text-white"
                        />
                        <Icon name="search" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                </div>

                <h2 className="text-2xl font-semibold mb-4 text-indigo-400 flex items-center">
                    Tüm Yazılar ({postsLoading ? '...' : filteredPosts.length})
                </h2>

                {filteredPosts.length > 0 ? (
                    <motion.div
                        className="space-y-4"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {filteredPosts.map(post => (
                        <motion.div
                            key={post.id}
                            variants={itemVariants}
                            className="bg-gray-800 p-4 rounded-2xl border border-gray-700 hover:border-indigo-500/50 transition-colors flex items-center justify-between"
                        >
                            <div className="flex-grow">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${getCategoryStyle(post.category)}`}>
                                        {post.category || 'Analiz'}
                                    </span>
                                    <span className="text-xs text-gray-400">{new Date(post.createdAt).toLocaleDateString('tr-TR')}</span>
                                </div>
                                <h2 className="font-bold text-white text-lg">{post.title}</h2>
                                <p className="text-sm text-gray-500 font-mono truncate">{post.slug}</p>
                            </div>

                            {/* KRİTİK DÜZELTME: Butonların hizalanması ve stilleri */}
                            <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                                {/* Düzenle Butonu (Sabit Genişlik ve Stil) */}
                                <Link
                                    href={`/admin/blog-editor/${post.id}`}
                                    className="bg-yellow-600 hover:bg-yellow-500 text-gray-900 text-xs font-bold py-1.5 px-3 rounded-lg transition-colors inline-flex items-center justify-center w-24 shadow-md shadow-yellow-900/50" // Sabit genişlik: w-24
                                    aria-label="Yazıyı Düzenle"
                                >
                                    <Icon name="pencil" className="w-4 h-4 mr-1"/>
                                    Düzenle
                                </Link>

                                {/* Silme Butonu (Yuvarlak İkon) */}
                                <DeleteButton onClick={() => handleDeleteClick(post)} disabled={deletePostMutation.isLoading} />
                            </div>
                        </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <div className="text-center p-12 bg-gray-800 rounded-2xl border border-dashed border-gray-700">
                        <Icon name="align-left" className="w-12 h-12 text-gray-600 mx-auto mb-4"/>
                        <p className="text-lg text-gray-500">
                             {searchQuery ? `"${searchQuery}" sorgusuna uyan yazı bulunamadı.` : 'Henüz yayınlanmış bir yazı yok.'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminBlogEditorIndexPage;
