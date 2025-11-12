'use client';

import React from 'react';
import Icon from './Icon';

const BlogShareButtons = ({ post, T, showAlert }) => {
    
    const SHARE_URL = typeof window !== 'undefined' ? window.location.href : `https://synarasystem.com/blog/${post.slug}`;
    const SHARE_TITLE = encodeURIComponent(post.title + " | Synara Blog");
    
    const handleCopyLink = () => {
        try {
            const tempInput = document.createElement('textarea');
            tempInput.value = SHARE_URL;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy'); 
            document.body.removeChild(tempInput);
            showAlert("Bağlantı panoya kopyalandı!", 'success', 2000); 
        } catch (err) {
            showAlert("Kopyalama başarısız oldu.", 'error', 3000); 
        }
    };
    
    // YENİ: Paylaşım butonları için merkezi veri yapısı
    const shareLinks = [
        { name: 'x', url: `https://x.com/intent/tweet?text=${SHARE_TITLE}&url=${SHARE_URL}`, color: 'bg-black text-white hover:bg-gray-800', label: "X'te Paylaş" },
        { name: 'facebook', url: `https://www.facebook.com/sharer/sharer.php?u=${SHARE_URL}`, color: 'bg-blue-600 text-white hover:bg-blue-700', label: 'Facebook\'ta Paylaş' },
        { name: 'linkedin', url: `https://www.linkedin.com/sharing/share-offsite/?url=${SHARE_URL}`, color: 'bg-blue-800 text-white hover:bg-blue-900', label: 'LinkedIn\'de Paylaş' },
        { name: 'whatsapp', url: `https://api.whatsapp.com/send?text=${SHARE_TITLE}%20${SHARE_URL}`, color: 'bg-green-500 text-white hover:bg-green-600', label: 'WhatsApp\'ta Paylaş' },
        { name: 'send', url: `https://t.me/share/url?url=${SHARE_URL}&text=${SHARE_TITLE}`, color: 'bg-sky-500 text-white hover:bg-sky-600', label: 'Telegram\'da Paylaş' }
    ];

    return (
        <div className="flex space-x-3 items-center">
            
            {/* Dinamik Olarak Paylaşım Butonları Oluşturuluyor */}
            {shareLinks.map((link) => (
                <a 
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${link.color} p-2 rounded-full transition-colors w-10 h-10 flex items-center justify-center shadow-md`}
                    aria-label={link.label}
                >
                    <Icon name={link.name} className="w-5 h-5" />
                </a>
            ))}
            
            {/* Bağlantıyı Kopyala Butonu */}
            <button 
                onClick={handleCopyLink}
                className="bg-gray-600 text-white hover:bg-gray-500 p-2 rounded-full transition-colors w-10 h-10 flex items-center justify-center shadow-md"
                aria-label="Bağlantıyı Kopyala"
            >
                <Icon name="share-2" className="w-5 h-5" /> 
            </button>
        </div>
    );
};

export default BlogShareButtons;
