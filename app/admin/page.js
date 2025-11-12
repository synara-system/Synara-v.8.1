// path: app/admin/page.js

'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Icon from '@/components/Icon';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { useRequiredAuth } from '@/hooks/useRequiredAuth';
import { trpc } from '@/lib/trpc/client';
import { motion } from 'framer-motion';

// KRİTİK YARDIMCI: Abonelik durumunu kontrol eder.
const isSubscriptionActive = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    // KRİTİK FİX: Abonelik bitiş tarihi varsa ve hala geçerliyse
    return date instanceof Date && !isNaN(date.getTime()) && date.getTime() > Date.now();
};

// YENİ YARDIMCI BİLEŞEN: Admin Panelindeki Aksiyon Butonları için Ortak Stil (GÜNCELLENDİ)
const AdminActionButton = ({ children, onClick, disabled, type }) => {
    // KRİTİK DÜZELTME: py-2 -> py-1.5, w-[125px] sabitlendi. hover:scale kaldırıldı.
    const baseCls = "w-[125px] text-xs font-bold py-1.5 px-3 rounded-lg transition-all duration-200 flex items-center justify-center disabled:opacity-50 flex-shrink-0";
    let dynamicCls = "";

    // Stil Ayarları
    switch (type) {
        // Pozitif Aksiyon: 30 Gün Onayla (Yeşil - Vurgulu)
        case 'success':
            dynamicCls = "bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/50";
            break;
        // Negatif Aksiyon: Onayı Kaldır (Kırmızı - Koyu)
        case 'warning':
            // KRİTİK: Daha vurucu bir kırmızı tonu kullanıldı.
            dynamicCls = "bg-red-700 hover:bg-red-600 text-white shadow-md shadow-red-900/50";
            break;
        // Admin Aksiyonu: Admin Yap (İndigo - Vurgulu)
        case 'admin':
            dynamicCls = "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-900/50";
            break;
        // Adminliği Kaldır (Amber/Koyu)
        case 'admin-warning':
            dynamicCls = "bg-amber-800/50 hover:bg-amber-700/70 text-amber-300 border border-amber-500/50";
            break;
        // Silme Butonu (Sadece İkon - Koyu Kırmızı Vurgu)
        case 'delete':
            // KRİTİK DÜZELTME: p-2.5, w-9 h-9 yapılarak boyut küçültüldü.
            return (
                <button
                    onClick={onClick}
                    disabled={disabled}
                    className="bg-gray-700 hover:bg-red-600/70 text-gray-400 hover:text-white font-bold p-2.5 rounded-full transition-colors w-9 h-9 flex items-center justify-center flex-shrink-0 disabled:opacity-50"
                    aria-label="Kullanıcıyı Sil"
                >
                    <Icon name="trash-2" className="w-4 h-4" />
                </button>
            );
        default:
            dynamicCls = "bg-gray-600 hover:bg-gray-500 text-white";
            break;
    }

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`${baseCls} ${dynamicCls}`}
        >
            {children}
        </button>
    );
};


const AdminIndexPage = () => {
    const { T, user, isAdmin, loading: appLoading } = useAuth();
    const { showAlert, showConfirm } = useNotification();
    const utils = trpc.useContext();

    const { redirectPath, loading: authReqLoading } = useRequiredAuth({ requireLogin: true, requireAdmin: true });

    // YENİ STATE: Arama sorgusu
    const [searchQuery, setSearchQuery] = useState('');

    const { data: usersData, isLoading: loading, error } = trpc.admin.getAllUsers.useQuery(undefined, {
        enabled: isAdmin,
        staleTime: 60000,
    });

    // UYARI DÜZELTMESİ: 'allUsers' useMemo içine alındı.
    const filteredUsers = useMemo(() => {
        const allUsers = usersData || [];
        if (!searchQuery) return allUsers;
        const query = searchQuery.toLowerCase();
        return allUsers.filter(u =>
            u.email.toLowerCase().includes(query) ||
            u.displayName?.toLowerCase().includes(query) || // KRİTİK FİX: displayName null olabilir
            u.tradingViewUsername?.toLowerCase().includes(query) // KRİTİK FİX: tradingViewUsername null olabilir
        );
    }, [usersData, searchQuery]);

    // YENİ: Admin yetkisi atama/kaldırma mutasyonu
    const setAdminStatusMutation = trpc.admin.setAdminStatus.useMutation({
        onSuccess: (data, variables) => {
             showAlert(`Kullanıcının yönetici durumu başarıyla güncellendi.`, 'success');
             utils.admin.getAllUsers.invalidate();
             if (user.uid === variables.userId) {
                 user.getIdToken(true);
             }
        },
        onError: (err) => {
             showAlert(`Yetki güncellenirken hata oluştu: ${err.message}`, 'error');
        }
    });

    // YENİ: Abonelik deneme süresi atama/kaldırma mutasyonu
    const setSubscriptionTrialMutation = trpc.admin.setSubscriptionTrial.useMutation({
        onSuccess: () => {
             showAlert(`Kullanıcının onay/abonelik durumu başarıyla güncellendi.`, 'success');
             utils.admin.getAllUsers.invalidate();
        },
        onError: (err) => {
             showAlert(`Abonelik durumu güncellenirken hata oluştu: ${err.message}`, 'error');
        }
    });

    const deleteUserMutation = trpc.admin.deleteUser.useMutation({
        onSuccess: () => {
             showAlert(T.admin_user_deletion_success || "Kullanıcı başarıyla silindi.", 'success');
             utils.admin.getAllUsers.invalidate();
        },
        onError: (err) => {
             showAlert(T.generic_firebase_error || `Kullanıcı silinirken hata oluştu: ${err.message}`, 'error');
        }
    });

    const isMutating = setAdminStatusMutation.isLoading || deleteUserMutation.isLoading || setSubscriptionTrialMutation.isLoading;

    // Admin yetkisini değiştirme handler'ı
    const handleSetAdminStatus = (targetUser) => {
        const isCurrentlyAdmin = targetUser.isAdmin;

        const message = isCurrentlyAdmin
            ? `"${targetUser.email}" kullanıcısının yönetici yetkilerini kaldırmak istediğinizden emin misiniz? Bu işlem kullanıcının tüm admin ayrıcalıklarını iptal edecektir.`
            : `"${targetUser.email}" kullanıcısını YÖNETİCİ yapmak istediğinizden emin misiniz? Bu kullanıcı tüm admin yetkilerine sahip olacaktır.`;

        const title = isCurrentlyAdmin
            ? 'Yönetici Yetkisini Kaldır'
            : 'Yönetici Yetkisi Ver';

        showConfirm(
            message,
            () => setAdminStatusMutation.mutate({
                userId: targetUser.id,
                isAdmin: !isCurrentlyAdmin
            }),
            {
                title: title,
                confirmButtonType: isCurrentlyAdmin ? 'destructive' : 'default'
            }
        );
    };

    // YENİ HANDLER: Abonelik Onayını Yönetir
    const handleSetSubscriptionTrial = (targetUser) => {
        const isActive = isSubscriptionActive(targetUser.subscriptionEndDate);

        const message = isActive
            ? `"${targetUser.email}" kullanıcısının aktif abonelik/onay süresini hemen sonlandırmak istediğinizden emin misiniz?`
            : `"${targetUser.email}" kullanıcısına 30 günlük deneme aboneliği tanımlamak istediğinizden emin misiniz?`;

        const title = isActive
            ? 'Abonelik Onayını Kaldır'
            : '30 Günlük Deneme Başlat';

        showConfirm(
            message,
            () => setSubscriptionTrialMutation.mutate({
                userId: targetUser.id,
                setTrial: !isActive,
            }),
            {
                title: title,
                confirmButtonType: isActive ? 'destructive' : 'default'
            }
        );
    };

    const handleDeleteClick = (targetUser) => {
        if (user && targetUser.id === user.uid) {
            showAlert(T.admin_user_deletion_self_error || 'Kendi hesabınızı bu panelden silemezsiniz.', 'error');
            return;
        }

        showConfirm(
            `"${targetUser.email}" adlı kullanıcıyı **tüm kasa verileri dahil** kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`,
            () => deleteUserMutation.mutate({ userId: targetUser.id }),
            {
                title: `'${targetUser.email}' Adlı Kullanıcıyı Silme Onayı`,
                confirmButtonType: 'destructive'
            }
        );
    };

    if (authReqLoading || !isAdmin) {
        return <div className="min-h-screen bg-gray-900 text-white flex justify-center items-center"><p>{T.admin_title || 'Yönetici Paneli'} Yükleniyor...</p></div>;
    }

    // KRİTİK GÜNCELLEME: Link butonuna fütüristik hover stili eklendi.
    const adminLinkCls = "bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors inline-flex items-center hover:shadow-lg hover:border-gray-500/50";

    return (
        // KRİTİK DÜZELTME 1: Dashboard temasına geçiş (dashboard-bg)
        <div className="min-h-screen dashboard-bg text-white p-4 md:p-8">
            <div className="container mx-auto max-w-6xl">
                 <div className="flex justify-between items-center mb-8">
                    {/* KRİTİK DÜZELTME 3: Başlığa Admin ikonu eklendi */}
                    <h1 className="text-3xl md:text-4xl font-bold flex items-center">
                        <Icon name="cpu" className="w-8 h-8 mr-3 text-red-400" />
                        {T.nav_admin || 'Yönetim Protokolü'}
                    </h1>
                    <Link href="/dashboard" className={adminLinkCls}>
                        <Icon name="arrow-left" className="w-4 h-4 mr-2" />
                        Panele Dön
                    </Link>
                </div>

                {/* KRİTİK DÜZELTME 2: Hızlı Erişim Kartları (Futuristic Grid) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    
                    {/* 2.1 İÇERİK YÖNETİMİ PANELİ (Yeni Yazı / Blog / Genel İçerik) */}
                    <div className="col-span-1 md:col-span-2 futuristic-card p-6 rounded-2xl border border-indigo-700/50 bg-indigo-900/20 text-indigo-400 shadow-xl shadow-indigo-900/50 transition-all duration-300 transform hover:scale-[1.01]">
                        <div className="flex items-center gap-4 border-b border-indigo-700/50 pb-3 mb-4">
                            <div className={`p-3 rounded-lg bg-indigo-900/70`}>
                                <Icon name="align-left" className={`w-6 h-6 text-indigo-400`} />
                            </div>
                            <h3 className="text-xl font-bold text-white">İçerik Yönetimi (CMB)</h3>
                        </div>
                        
                        <div className="flex flex-wrap gap-4 mt-4">
                             {/* Yazı Oluştur Butonu (Vurgulu) */}
                            <Link href="/admin/blog-editor/new" className={`flex-1 min-w-[150px] group flex flex-col justify-center items-center p-3 rounded-lg border border-green-500/50 bg-green-900/30 hover:bg-green-700/50 transition-colors`}>
                                <Icon name="plus" className="w-5 h-5 text-green-400 mb-1"/>
                                <span className="text-xs font-semibold text-green-300">Yeni Yazı Protokolü</span>
                            </Link>

                             {/* Tüm Yazıları Yönet */}
                            <Link href="/admin/blog-editor" className={`flex-1 min-w-[150px] group flex flex-col justify-center items-center p-3 rounded-lg border border-yellow-500/50 bg-yellow-900/30 hover:bg-yellow-700/50 transition-colors`}>
                                <Icon name="pencil" className="w-5 h-5 text-yellow-400 mb-1"/>
                                <span className="text-xs font-semibold text-yellow-300">Tüm İçerikler</span>
                            </Link>

                            {/* Genel İçerik Yönetimi (SEO Metinleri vb.) */}
                             <Link href="/admin/content" className={`flex-1 min-w-[150px] group flex flex-col justify-center items-center p-3 rounded-lg border border-sky-500/50 bg-sky-900/30 hover:bg-sky-700/50 transition-colors`}>
                                <Icon name="layout-grid" className="w-5 h-5 text-sky-400 mb-1"/>
                                <span className="text-xs font-semibold text-sky-300">Genel Metinler (SEO)</span>
                            </Link>
                        </div>
                    </div>

                    {/* 2.2 TOPLAM KULLANICI KARTI (İstatistiksel Vurgu) */}
                    <div className="futuristic-card p-6 rounded-2xl border border-gray-700 shadow-xl flex flex-col justify-center items-center bg-gray-800/80">
                         <Icon name="users" className="w-10 h-10 text-indigo-400 mb-2"/>
                        <h3 className="text-xl font-bold text-white">Toplam Kayıtlı Kullanıcı:</h3>
                        <span className="text-4xl ml-2 text-yellow-400 font-extrabold">{loading ? '...' : usersData ? usersData.length : 0}</span>
                        <p className="text-xs text-gray-500 mt-1">Sistem Disiplin Protokolüne kayıtlı üye sayısı.</p>
                    </div>
                </div>

                {/* YENİ: Arama Çubuğu */}
                <div className="mb-6">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Kullanıcı Ara (E-posta, Ad, TradingView Kimliği)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full p-3 pl-10 bg-gray-700 rounded-lg border border-gray-600 focus:ring-2 focus:ring-indigo-500 text-white"
                        />
                        <Icon name="search" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                </div>


                <h2 className="text-2xl font-semibold mb-4 text-indigo-400 flex items-center">
                    <Icon name="user-circle-2" className="w-6 h-6 mr-2" />
                    {T.admin_users} ({loading ? '...' : filteredUsers.length})
                </h2>

                <div className="bg-gray-800 rounded-2xl futuristic-card border border-gray-700 overflow-x-auto shadow-xl">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Kullanıcı verileri sistemden çekiliyor...</div>
                    ) : error ? (
                        <div className="p-8 text-center text-red-400">Hata: {error.message}</div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">{`"${searchQuery}" sorgusuna uyan kullanıcı bulunamadı.`}</div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="border-b border-gray-700">
                                <tr>
                                    <th className="p-4">E-posta & Statü</th>
                                    <th className="p-4">Kayıt Tarihi / Görünen Ad</th>
                                    <th className="p-4">TradingView Kimliği / Abonelik Bitiş</th>
                                    <th className="p-4 text-center min-w-[350px]">Aksiyon Protokolü</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map(u => {
                                    const displayName = u.displayName || u.email?.split('@')[0] || 'Anonim';
                                    const isCurrentUser = user && u.id === user.uid;
                                    const isActiveSubscriber = isSubscriptionActive(u.subscriptionEndDate);

                                    // Buton Tiplerini Belirle
                                    const subButtonType = isActiveSubscriber ? 'warning' : 'success';
                                    const adminButtonType = u.isAdmin ? 'admin-warning' : 'admin';
                                    const deleteButtonType = 'delete';

                                    return (<tr key={u.id} className="border-b border-gray-700 last:border-b-0 hover:bg-gray-700/50 transition-colors">
                                        <td className="p-4 font-semibold text-sm">
                                            {u.email}
                                            {u.isAdmin && <span className="ml-2 px-2 py-0.5 text-xs font-bold rounded bg-indigo-500/20 text-indigo-300">ADMİN</span>}
                                            {isCurrentUser && <span className="ml-2 px-2 py-0.5 text-xs font-bold rounded bg-yellow-500/20 text-yellow-300">SİZ</span>}
                                        </td>
                                        <td className="p-4">
                                            <div className="font-semibold text-white">{displayName}</div>
                                            <div className="text-xs text-gray-400">Kayıt: {new Date(u.createdAt).toLocaleDateString('tr-TR')}</div>
                                        </td>
                                        {/* YENİ: Abonelik Bitiş Tarihi Bilgisi */}
                                        <td className="p-4 text-sm font-mono text-gray-300">
                                            <div>TV: {u.tradingViewUsername || '---'}</div>
                                            <div className={`font-bold ${isActiveSubscriber ? 'text-green-400' : 'text-red-400'} text-xs`}>
                                                Abonelik Bitiş: {isActiveSubscriber ? new Date(u.subscriptionEndDate).toLocaleDateString('tr-TR') : 'PASİF'}
                                            </div>
                                        </td>
                                        {/* KRİTİK DÜZELTME 3: Butonların bulunduğu <td> içeriği */}
                                        <td className="p-4 flex items-center justify-between space-x-2 min-w-[350px]">

                                            {/* Abonelik Butonu */}
                                            <AdminActionButton
                                                onClick={() => handleSetSubscriptionTrial(u)}
                                                disabled={isMutating}
                                                type={subButtonType}
                                            >
                                                {isActiveSubscriber ? 'Onayı Kaldır' : '30 Gün Onayla'}
                                            </AdminActionButton>

                                            {/* Admin Yetki Butonu */}
                                            <AdminActionButton
                                                onClick={() => handleSetAdminStatus(u)}
                                                disabled={isMutating || isCurrentUser}
                                                type={adminButtonType}
                                            >
                                                {u.isAdmin ? 'Adminliği Kaldır' : 'Admin Yap'}
                                            </AdminActionButton>

                                            {/* Silme Butonu (Sağa Sabitlenmiş İkon) */}
                                            <AdminActionButton
                                                onClick={() => handleDeleteClick(u)}
                                                disabled={isMutating || isCurrentUser}
                                                type={deleteButtonType}
                                            />
                                        </td>
                                    </tr>);
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminIndexPage;
