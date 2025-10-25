// path: components/blog/BlogArticle.js
// Bu bileşen bir Sunucu Bileşenidir (Server Component).

import React from 'react';
import Link from 'next/link';
import Icon from '../Icon';
import { translations } from '../../data/translations'; // Sunucuda çeviriyi kullan
import DynamicImage from '@/components/DynamicImage'; // KRİTİK: Yol düzeltildi

// Okunma süresini hesaplayan yardımcı fonksiyon
const calculateReadingTime = (text) => {
    if (!text) return 0;
    const wordsPerMinute = 200;
    const noOfWords = text.split(/\s/g).length;
    const minutes = noOfWords / wordsPerMinute;
    const readTime = Math.ceil(minutes);
    return readTime;
};

// KRİTİK: Bu component, makalenin statik içeriğini render eder.
const BlogArticle = ({ post }) => {
    // Çeviriyi statik olarak al
    const T = translations.tr;

    // Ham metin üzerinden okuma süresini hesapla
    const readingTime = calculateReadingTime(post.markdownContent);

    // KRİTİK FİX: post.youtubeVideoId'nin geçerliliğini (string ve 11 karakter) kontrol et.
    // Boş stringler, null veya undefined değerler için false döndürülür.
    const validYoutubeId = post.youtubeVideoId && typeof post.youtubeVideoId === 'string' && post.youtubeVideoId.length === 11 ? post.youtubeVideoId : null;

    // YouTube embed URL'si
    const youtubeSrc = validYoutubeId
        ? `https://www.youtube.com/embed/${validYoutubeId}?rel=0&modestbranding=1&autoplay=0&showinfo=0&controls=1`
        : null;

    // Image URL'sini belirle. Eğer geçerli bir banner URL'si yoksa veya geçerli bir YouTube ID'si yoksa
    // bu değişken **açıkça null** olarak ayarlanmalı.
    let imageUrl = post.bannerImageUrl;
    if (!imageUrl && validYoutubeId) {
        imageUrl = `https://img.youtube.com/vi/${validYoutubeId}/maxresdefault.jpg`;
    }
    
    // Kritik: Eğer ne YouTube videosu ne de banner resmi varsa, görsel alanını atla.
    // shouldRenderMedia, youtubeSrc'nin veya imageUrl'ün string içerip içermediğini kontrol eder.
    const shouldRenderMedia = !!youtubeSrc || !!imageUrl;

    return (
        <article className="bg-gray-900 p-8 md:p-12 rounded-2xl border border-gray-700 shadow-2xl shadow-indigo-900/20">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight text-center">{post.title}</h1>

            <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4 mb-8 text-sm text-gray-400">
                <div className="flex items-center">
                    <Icon name="user-circle-2" className="w-5 h-5 mr-2" />
                    <span>{post.authorName}</span>
                </div>
                <span className="hidden sm:inline">·</span>
                <span>{new Date(post.createdAt).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                <span className="hidden sm:inline">·</span>
                <span>{readingTime} {T?.reading_time_minutes || "dk okuma süresi"}</span>
            </div>
            
            {/* KRİTİK DÜZELTME: Eğer geçerli bir medya kaynağı varsa render et */}
            {shouldRenderMedia && (
                <div className="max-w-3xl mx-auto">
                    <div className="relative aspect-video mb-8 shadow-2xl shadow-indigo-900/50 overflow-hidden rounded-xl border-2 border-indigo-700/50">
                        {youtubeSrc ? (
                            // YouTube Video Embed
                            <iframe
                                src={youtubeSrc}
                                title={post.title}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                                className="w-full h-full"
                            ></iframe>
                        ) : (
                            // Sadece Image veya Placeholder (Eğer video yoksa ve image varsa)
                            <DynamicImage
                                // KRİTİK FİX: imageUrl'ün null olmadığından emin olunduğu için buraya iletiliyor.
                                src={imageUrl} 
                                alt={post.title}
                                width={1280} // Yer tutucu boyutları
                                height={720}
                                className="object-cover"
                                priority
                                unoptimized={true}
                                // KRİTİK FİX: Fallback, eğer imageUrl bile başarısız olursa devreye girer.
                                fallbackSrc={`https://placehold.co/1280x720/1f2937/d1d5db?text=Synara+Yazisi+Gorseli`}
                            />
                        )}
                    </div>
                </div>
            )}
            {/* KRİTİK DÜZELTME BİTİŞ */}

            <div
                // Sunucuda dönüştürülmüş HTML içeriği doğrudan buraya gömülür.
                className="prose prose-invert prose-lg max-w-none text-gray-300 leading-relaxed mt-8 border-t border-gray-700 pt-8"
                dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Altındaki interaktif alan için ayırıcı */}
            <div className="mt-12 pt-8 border-t border-gray-700/50"></div>
        </article>
    );
};

export default BlogArticle;
